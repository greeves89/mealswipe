"use client";
import { useState, useEffect } from "react";
import { Recipe, RECIPES } from "@/lib/recipes";

interface RecipeFilters {
  cuisine?: string;
  diet?: string;
  query?: string;
}

export function useRecipes(filters?: RecipeFilters) {
  const [recipes, setRecipes] = useState<Recipe[]>(RECIPES);
  const [loading, setLoading] = useState(false);
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
        if (data.noApiKey || !data.recipes?.length) {
          setRecipes(RECIPES);
        } else {
          setRecipes(data.recipes);
        }
      })
      .catch(() => {
        setRecipes(RECIPES);
        setError("Rezepte konnten nicht geladen werden");
      })
      .finally(() => setLoading(false));
  }, [filters?.cuisine, filters?.diet, filters?.query]);

  return { recipes, loading, error };
}
