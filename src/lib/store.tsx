"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Recipe, RECIPES } from "./recipes";

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
  setShoppingList: (items: ShoppingItem[]) => void;
  clearShoppingList: () => void;
  toggleShoppingItem: (id: string) => void;
  getShoppingListFromPlan: () => ShoppingItem[];
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

const LS_KEY = "forkly-state-v2";

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

  // Get current user via API
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const user = await res.json();
          if (user?.id) {
            setUserId(user.id);
          }
        }
      } catch {
        // Not authenticated or network error — stay with localStorage data
      }
    }
    fetchUser();
  }, []);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    saveLocal({ household, weeklyPlan, shoppingList, likedRecipes, dislikedIds });
  }, [household, weeklyPlan, shoppingList, likedRecipes, dislikedIds]);

  const setHousehold = useCallback(async (h: Household) => {
    setHouseholdState(h);
    if (userId) {
      try {
        await fetch("/api/meal-plans/household", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            household_name: h.name,
            household_people: h.people,
            household_diets: h.diets,
          }),
        });
      } catch {
        // Gracefully fail — localStorage is primary storage
      }
    }
  }, [userId]);

  const addToWeeklyPlan = useCallback(async (day: string, recipe: Recipe) => {
    setWeeklyPlan((prev) => ({ ...prev, [day]: recipe }));
    if (userId) {
      try {
        await fetch("/api/meal-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            day,
            recipe_id: recipe.id,
            recipe_name: recipe.name,
            recipe_image: recipe.image,
            recipe_data: recipe,
          }),
        });
      } catch {
        // Gracefully fail — localStorage is primary storage
      }
    }
  }, [userId]);

  const removeFromPlan = useCallback(async (day: string) => {
    setWeeklyPlan((prev) => { const n = { ...prev }; delete n[day]; return n; });
    if (userId) {
      try {
        await fetch(`/api/meal-plans?day=${encodeURIComponent(day)}`, {
          method: "DELETE",
        });
      } catch {
        // Gracefully fail — localStorage is primary storage
      }
    }
  }, [userId]);

  const addToLiked = useCallback(async (recipe: Recipe) => {
    setLikedRecipes((prev) => {
      if (prev.find((r) => r.id === recipe.id)) return prev;
      return [...prev, recipe];
    });
    if (userId) {
      try {
        await fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe_id: recipe.id, reaction: "like" }),
        });
      } catch {
        // Gracefully fail — localStorage is primary storage
      }
    }
  }, [userId, weeklyPlan, addToWeeklyPlan]);

  const addToDisliked = useCallback(async (id: string) => {
    setDislikedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (userId) {
      try {
        await fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe_id: id, reaction: "dislike" }),
        });
      } catch {
        // Gracefully fail — localStorage is primary storage
      }
    }
  }, [userId]);

  const getShoppingListFromPlan = useCallback((): ShoppingItem[] => {
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
    return items;
  }, [weeklyPlan]);

  const generateShoppingList = useCallback(() => {
    setShoppingList(getShoppingListFromPlan());
  }, [getShoppingListFromPlan]);

  const setShoppingListFn = useCallback((items: ShoppingItem[]) => {
    setShoppingList(items);
  }, []);

  const clearShoppingList = useCallback(() => {
    setShoppingList([]);
  }, []);

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingList((prev) => prev.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
  }, []);

  return (
    <AppContext.Provider value={{
      household, weeklyPlan, shoppingList, likedRecipes, dislikedIds, userId,
      setHousehold, addToWeeklyPlan, removeFromPlan, addToLiked, addToDisliked,
      generateShoppingList, setShoppingList: setShoppingListFn, clearShoppingList,
      toggleShoppingItem, getShoppingListFromPlan,
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
