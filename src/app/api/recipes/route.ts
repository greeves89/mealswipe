import { NextRequest, NextResponse } from "next/server";

const BASE = "https://api.spoonacular.com/recipes";

interface SpoonacularNutrient {
  name: string;
  amount: number;
}

interface SpoonacularIngredient {
  name: string;
  measures?: {
    metric?: {
      amount?: number;
      unitShort?: string;
    };
  };
}

interface SpoonacularStep {
  step: string;
}

interface SpoonacularInstruction {
  steps: SpoonacularStep[];
}

interface SpoonacularRecipe {
  id: number;
  title: string;
  summary?: string;
  image?: string;
  cuisines?: string[];
  readyInMinutes?: number;
  servings?: number;
  nutrition?: { nutrients: SpoonacularNutrient[] };
  diets?: string[];
  dishTypes?: string[];
  extendedIngredients?: SpoonacularIngredient[];
  analyzedInstructions?: SpoonacularInstruction[];
  spoonacularScore?: number;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") ?? "";
  const cuisine = searchParams.get("cuisine") ?? "";
  const diet = searchParams.get("diet") ?? "";
  const offset = searchParams.get("offset") ?? "0";
  const number = searchParams.get("number") ?? "20";
  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      recipes: [],
      total: 0,
      noApiKey: true,
    });
  }

  const params = new URLSearchParams({
    apiKey,
    number,
    offset,
    addRecipeInformation: "true",
    addRecipeNutrition: "true",
    instructionsRequired: "true",
    fillIngredients: "true",
    ...(query && { query }),
    ...(cuisine && { cuisine }),
    ...(diet && { diet }),
  });

  try {
    const res = await fetch(`${BASE}/complexSearch?${params}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ recipes: [], total: 0, noApiKey: false });
    }

    const data = await res.json();

    const recipes = (data.results ?? []).map((r: SpoonacularRecipe) => ({
      id: String(r.id),
      name: r.title,
      description:
        r.summary?.replace(/<[^>]*>/g, "").slice(0, 150) ?? "",
      image: r.image ?? "",
      cuisine: r.cuisines?.[0] ?? "International",
      time: r.readyInMinutes ?? 30,
      servings: r.servings ?? 4,
      calories: Math.round(
        r.nutrition?.nutrients?.find((n) => n.name === "Calories")?.amount ?? 400
      ),
      difficulty:
        (r.readyInMinutes ?? 30) <= 20
          ? "Einfach"
          : (r.readyInMinutes ?? 30) <= 45
          ? "Mittel"
          : "Anspruchsvoll",
      tags: [
        ...(r.diets ?? []).slice(0, 3),
        ...(r.dishTypes ?? []).slice(0, 2),
      ]
        .map((t: string) => t.charAt(0).toUpperCase() + t.slice(1))
        .slice(0, 5),
      ingredients: (r.extendedIngredients ?? []).map((i) => ({
        name: i.name,
        amount: `${i.measures?.metric?.amount?.toFixed(0) ?? ""} ${
          i.measures?.metric?.unitShort ?? ""
        }`.trim(),
      })),
      steps: (r.analyzedInstructions?.[0]?.steps ?? []).map((s) => s.step),
      rating:
        Math.round(((r.spoonacularScore ?? 70) / 20) * 10) / 10,
      source: "Spoonacular",
    }));

    return NextResponse.json({ recipes, total: data.totalResults ?? 0 });
  } catch {
    return NextResponse.json({ recipes: [], total: 0, error: "fetch_failed" });
  }
}
