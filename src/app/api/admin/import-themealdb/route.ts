import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "daniel.alisch@me.com").split(",").map(e => e.trim());
const MEALDB = "https://www.themealdb.com/api/json/v1/1";

interface MealDetail {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  [key: string]: string | null;
}

function parseIngredients(meal: MealDetail): { name: string; amount: string }[] {
  const result: { name: string; amount: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();
    if (name) {
      result.push({ name, amount: measure || "" });
    }
  }
  return result;
}

function parseSteps(instructions: string): string[] {
  if (!instructions) return [];
  // Split on numbered steps or double newlines
  const byNumber = instructions.split(/\r?\n(?=\d+[\.\)]?\s)/);
  if (byNumber.length > 2) {
    return byNumber
      .map(s => s.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter(s => s.length > 10);
  }
  return instructions
    .split(/\r?\n\r?\n+/)
    .map(s => s.replace(/\r?\n/g, " ").trim())
    .filter(s => s.length > 10);
}

export async function POST() {
  const session = await getSession();
  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let saved = 0;
  let skipped = 0;
  let totalMeals = 0;
  const errors: string[] = [];

  // Fetch all categories
  const catRes = await fetch(`${MEALDB}/categories.php`);
  const catData = await catRes.json();
  const categories: { strCategory: string }[] = catData.categories ?? [];

  for (const cat of categories) {
    // Fetch all meals in category
    const listRes = await fetch(`${MEALDB}/filter.php?c=${encodeURIComponent(cat.strCategory)}`);
    const listData = await listRes.json();
    const meals: { idMeal: string }[] = listData.meals ?? [];
    totalMeals += meals.length;

    for (const meal of meals) {
      try {
        // Check if already exists
        const existing = await query<{ id: string }>(
          "SELECT id FROM recipes WHERE id=$1",
          [`mdb_${meal.idMeal}`]
        );
        if (existing.length > 0) { skipped++; continue; }

        // Fetch full meal details
        const detailRes = await fetch(`${MEALDB}/lookup.php?i=${meal.idMeal}`);
        const detailData = await detailRes.json();
        const m: MealDetail = detailData.meals?.[0];
        if (!m) { skipped++; continue; }

        const ingredients = parseIngredients(m);
        const steps = parseSteps(m.strInstructions);

        // Estimate difficulty from step count and instructions length
        const difficulty =
          steps.length <= 4 ? "Einfach"
          : steps.length <= 8 ? "Mittel"
          : "Anspruchsvoll";

        // Estimate time from instruction length (rough heuristic)
        const instrLen = m.strInstructions.length;
        const timeMinutes =
          instrLen < 500 ? 20
          : instrLen < 1200 ? 35
          : instrLen < 2000 ? 50
          : 70;

        const cuisine = m.strArea && m.strArea !== "Unknown" ? m.strArea : m.strCategory;

        await query(
          `INSERT INTO recipes (id, name, description, image, cuisine, time_minutes, servings, calories, difficulty, tags, ingredients, steps, rating, source)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'themealdb')
           ON CONFLICT (id) DO NOTHING`,
          [
            `mdb_${m.idMeal}`,
            m.strMeal,
            `${m.strCategory} Rezept aus ${m.strArea || "aller Welt"}.`,
            m.strMealThumb ?? "",
            cuisine,
            timeMinutes,
            4,
            0,
            difficulty,
            [m.strCategory, m.strArea].filter(Boolean),
            JSON.stringify(ingredients),
            JSON.stringify(steps),
            4.0,
          ]
        );
        saved++;

        // Small delay to avoid hammering TheMealDB
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        errors.push(`${meal.idMeal}: ${String(e)}`);
        skipped++;
      }
    }
  }

  let dbTotal = 0;
  try {
    const res = await query<{ count: string }>("SELECT COUNT(*) as count FROM recipes");
    dbTotal = parseInt(res[0]?.count ?? "0");
  } catch { /* ignore */ }

  return NextResponse.json({ saved, skipped, totalMeals, dbTotal, errors: errors.slice(0, 10) });
}

export async function GET() {
  const session = await getSession();
  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await query<{ count: string }>(
    "SELECT COUNT(*) as count FROM recipes WHERE source='themealdb'"
  );
  return NextResponse.json({ count: parseInt(result[0]?.count ?? "0") });
}
