"use client";
import { useState, useEffect } from "react";
import { Recipe, RECIPES, classifyRecipe } from "@/lib/recipes";

interface RecipeFilters {
  cuisine?: string;
  diet?: string;
  query?: string;
}

export function useRecipes(filters?: RecipeFilters) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ number: "30" });
    if (filters?.cuisine) params.set("cuisine", filters.cuisine);
    if (filters?.diet) params.set("diet", filters.diet);
    if (filters?.query) params.set("query", filters.query);

    setLoading(true);
    setError(null);

    fetch(`/api/recipes?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const raw: Recipe[] = (data.noApiKey || !data.recipes?.length) ? [...RECIPES] : [...data.recipes];
        const list = raw.map(classifyRecipe);
        // Fisher-Yates shuffle for random order every session
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
        setRecipes(list);
      })
      .catch(() => {
        setRecipes(RECIPES.map(classifyRecipe));
        setError("Rezepte konnten nicht geladen werden");
      })
      .finally(() => setLoading(false));
  }, [filters?.cuisine, filters?.diet, filters?.query]);

  return { recipes, loading, error };
}
