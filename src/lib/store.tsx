"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Recipe, RECIPES } from "./recipes";
import { createClient } from "./supabase/client";

export interface MealPlan {
  [dayKey: string]: Recipe;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: string;
  checked: boolean;
  recipeId: string;
}

export interface Household {
  name: string;
  people: number;
  diets: string[];
}

interface AppState {
  household: Household;
  weeklyPlan: MealPlan;
  shoppingList: ShoppingItem[];
  likedRecipes: Recipe[];
  dislikedIds: string[];
  userId: string | null;
  setHousehold: (h: Household) => void;
  addToWeeklyPlan: (day: string, recipe: Recipe) => void;
  removeFromPlan: (day: string) => void;
  addToLiked: (recipe: Recipe) => void;
  addToDisliked: (id: string) => void;
  generateShoppingList: () => void;
  toggleShoppingItem: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

function getWeekDaysLocal(): string[] {
  const days: string[] = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export function getWeekDays() {
  return getWeekDaysLocal();
}

const LS_KEY = "mealswipe-state-v2";

function loadLocal() {
  try {
    const s = localStorage.getItem(LS_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function saveLocal(data: object) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [household, setHouseholdState] = useState<Household>({ name: "Mein Haushalt", people: 2, diets: [] });
  const [weeklyPlan, setWeeklyPlan] = useState<MealPlan>({});
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [dislikedIds, setDislikedIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const d = loadLocal();
    if (d) {
      if (d.household) setHouseholdState(d.household);
      if (d.weeklyPlan) setWeeklyPlan(d.weeklyPlan);
      if (d.shoppingList) setShoppingList(d.shoppingList);
      if (d.likedRecipes) setLikedRecipes(d.likedRecipes);
      if (d.dislikedIds) setDislikedIds(d.dislikedIds);
    }
  }, []);

  // Get Supabase user and sync data
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id);
        // Sync meal plans from Supabase
        syncFromSupabase(supabase, data.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        syncFromSupabase(supabase, session.user.id);
      } else {
        setUserId(null);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function syncFromSupabase(supabase: ReturnType<typeof createClient>, uid: string) {
    try {
      // Sync meal plans
      const weekStart = getWeekDaysLocal()[0];
      const { data: plans } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", uid)
        .gte("day", weekStart);

      if (plans?.length) {
        const plan: MealPlan = {};
        plans.forEach((p: { day: string; recipe_data: Recipe }) => {
          if (p.recipe_data) plan[p.day] = p.recipe_data;
        });
        setWeeklyPlan(plan);
      }

      // Sync profile/household
      const { data: profile } = await supabase
        .from("profiles")
        .select("household_name, household_people, household_diets")
        .eq("id", uid)
        .single();

      if (profile) {
        setHouseholdState({
          name: profile.household_name ?? "Mein Haushalt",
          people: profile.household_people ?? 2,
          diets: profile.household_diets ?? [],
        });
      }

      // Sync liked recipe reactions
      const { data: reactions } = await supabase
        .from("recipe_reactions")
        .select("recipe_id, reaction")
        .eq("user_id", uid);

      if (reactions) {
        const liked = reactions.filter((r: { reaction: string }) => r.reaction === "like")
          .map((r: { recipe_id: string }) => RECIPES.find((rec) => rec.id === r.recipe_id))
          .filter(Boolean) as Recipe[];
        const disliked = reactions
          .filter((r: { reaction: string }) => r.reaction === "dislike")
          .map((r: { recipe_id: string }) => r.recipe_id);
        if (liked.length) setLikedRecipes(liked);
        if (disliked.length) setDislikedIds(disliked);
      }
    } catch {
      // Supabase not configured — stay with localStorage data
    }
  }

  // Persist to localStorage whenever state changes
  useEffect(() => {
    saveLocal({ household, weeklyPlan, shoppingList, likedRecipes, dislikedIds });
  }, [household, weeklyPlan, shoppingList, likedRecipes, dislikedIds]);

  const setHousehold = useCallback(async (h: Household) => {
    setHouseholdState(h);
    if (userId) {
      try {
        const supabase = createClient();
        await supabase.from("profiles").update({
          household_name: h.name,
          household_people: h.people,
          household_diets: h.diets,
        }).eq("id", userId);
      } catch {}
    }
  }, [userId]);

  const addToWeeklyPlan = useCallback(async (day: string, recipe: Recipe) => {
    setWeeklyPlan((prev) => ({ ...prev, [day]: recipe }));
    if (userId) {
      try {
        const supabase = createClient();
        await supabase.from("meal_plans").upsert({
          user_id: userId,
          day,
          recipe_id: recipe.id,
          recipe_name: recipe.name,
          recipe_image: recipe.image,
          recipe_data: recipe,
        }, { onConflict: "user_id,day,meal_type" });
      } catch {}
    }
  }, [userId]);

  const removeFromPlan = useCallback(async (day: string) => {
    setWeeklyPlan((prev) => { const n = { ...prev }; delete n[day]; return n; });
    if (userId) {
      try {
        const supabase = createClient();
        await supabase.from("meal_plans").delete().eq("user_id", userId).eq("day", day);
      } catch {}
    }
  }, [userId]);

  const addToLiked = useCallback(async (recipe: Recipe) => {
    setLikedRecipes((prev) => {
      if (prev.find((r) => r.id === recipe.id)) return prev;
      const days = getWeekDaysLocal();
      const nextFreeDay = days.find((d) => !weeklyPlan[d]);
      if (nextFreeDay) addToWeeklyPlan(nextFreeDay, recipe);
      return [...prev, recipe];
    });
    if (userId) {
      try {
        const supabase = createClient();
        await supabase.from("recipe_reactions").upsert(
          { user_id: userId, recipe_id: recipe.id, reaction: "like" },
          { onConflict: "user_id,recipe_id" }
        );
      } catch {}
    }
  }, [userId, weeklyPlan, addToWeeklyPlan]);

  const addToDisliked = useCallback(async (id: string) => {
    setDislikedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (userId) {
      try {
        const supabase = createClient();
        await supabase.from("recipe_reactions").upsert(
          { user_id: userId, recipe_id: id, reaction: "dislike" },
          { onConflict: "user_id,recipe_id" }
        );
      } catch {}
    }
  }, [userId]);

  const generateShoppingList = useCallback(() => {
    const items: ShoppingItem[] = [];
    const seen = new Set<string>();
    Object.values(weeklyPlan).forEach((recipe) => {
      recipe.ingredients?.forEach((ing) => {
        const key = ing.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          items.push({ id: `${recipe.id}-${ing.name}`, name: ing.name, amount: ing.amount, checked: false, recipeId: recipe.id });
        }
      });
    });
    setShoppingList(items);
  }, [weeklyPlan]);

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingList((prev) => prev.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
  }, []);

  return (
    <AppContext.Provider value={{
      household, weeklyPlan, shoppingList, likedRecipes, dislikedIds, userId,
      setHousehold, addToWeeklyPlan, removeFromPlan, addToLiked, addToDisliked,
      generateShoppingList, toggleShoppingItem,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
