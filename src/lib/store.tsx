"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Recipe, RECIPES } from "./recipes";

interface MealPlan {
  [dayKey: string]: Recipe;
}

interface ShoppingItem {
  id: string;
  name: string;
  amount: string;
  checked: boolean;
  recipeId: string;
}

interface Household {
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
  setHousehold: (h: Household) => void;
  addToWeeklyPlan: (day: string, recipe: Recipe) => void;
  removeFromPlan: (day: string) => void;
  addToLiked: (recipe: Recipe) => void;
  addToDisliked: (id: string) => void;
  generateShoppingList: () => void;
  toggleShoppingItem: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

function getWeekDays(): string[] {
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [household, setHouseholdState] = useState<Household>({
    name: "Mein Haushalt",
    people: 2,
    diets: [],
  });
  const [weeklyPlan, setWeeklyPlan] = useState<MealPlan>({});
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [dislikedIds, setDislikedIds] = useState<string[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mealswipe-state");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.household) setHouseholdState(parsed.household);
        if (parsed.weeklyPlan) setWeeklyPlan(parsed.weeklyPlan);
        if (parsed.shoppingList) setShoppingList(parsed.shoppingList);
        if (parsed.likedRecipes) setLikedRecipes(parsed.likedRecipes);
        if (parsed.dislikedIds) setDislikedIds(parsed.dislikedIds);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "mealswipe-state",
        JSON.stringify({ household, weeklyPlan, shoppingList, likedRecipes, dislikedIds })
      );
    } catch {
      // ignore
    }
  }, [household, weeklyPlan, shoppingList, likedRecipes, dislikedIds]);

  const setHousehold = (h: Household) => setHouseholdState(h);

  const addToWeeklyPlan = (day: string, recipe: Recipe) => {
    setWeeklyPlan((prev) => ({ ...prev, [day]: recipe }));
  };

  const removeFromPlan = (day: string) => {
    setWeeklyPlan((prev) => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
  };

  const addToLiked = (recipe: Recipe) => {
    setLikedRecipes((prev) => {
      if (prev.find((r) => r.id === recipe.id)) return prev;
      const next = [...prev, recipe];

      // Auto-add to next available day in weekly plan
      const days = getWeekDays();
      const nextFreeDay = days.find((d) => !weeklyPlan[d]);
      if (nextFreeDay) {
        setWeeklyPlan((plan) => ({ ...plan, [nextFreeDay]: recipe }));
      }

      return next;
    });
  };

  const addToDisliked = (id: string) => {
    setDislikedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const generateShoppingList = () => {
    const allIngredients: ShoppingItem[] = [];
    const seen = new Map<string, number>();

    Object.values(weeklyPlan).forEach((recipe) => {
      recipe.ingredients.forEach((ing) => {
        const key = ing.name.toLowerCase();
        if (seen.has(key)) {
          // Just mark as seen; simple deduplication
          return;
        }
        seen.set(key, allIngredients.length);
        allIngredients.push({
          id: `${recipe.id}-${ing.name}`,
          name: ing.name,
          amount: ing.amount,
          checked: false,
          recipeId: recipe.id,
        });
      });
    });

    setShoppingList(allIngredients);
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  return (
    <AppContext.Provider
      value={{
        household,
        weeklyPlan,
        shoppingList,
        likedRecipes,
        dislikedIds,
        setHousehold,
        addToWeeklyPlan,
        removeFromPlan,
        addToLiked,
        addToDisliked,
        generateShoppingList,
        toggleShoppingItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}

export { getWeekDays };
export type { Household, ShoppingItem, MealPlan };
