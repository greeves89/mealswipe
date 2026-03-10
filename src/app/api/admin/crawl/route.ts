import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);

interface SpoonacularNutrient { name: string; amount: number; }
interface SpoonacularIngredient {
  name: string;
  measures?: { metric?: { amount?: number; unitShort?: string } };
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
  analyzedInstructions?: { steps: { step: string }[] }[];
  spoonacularScore?: number;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const searchQuery = (body.query as string) ?? "";
  const cuisine = (body.cuisine as string) ?? "";
  const number = Math.min((body.number as number) ?? 10, 100);
  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "SPOONACULAR_API_KEY not set" }, { status: 500 });
  }

  const params = new URLSearchParams({
    apiKey,
    number: String(number),
    offset: String(body.offset ?? "0"),
    addRecipeInformation: "true",
    addRecipeNutrition: "true",
    instructionsRequired: "true",
    fillIngredients: "true",
    ...(searchQuery && { query: searchQuery }),
    ...(cuisine && { cuisine }),
  });

  const spoonRes = await fetch(
    `https://api.spoonacular.com/recipes/complexSearch?${params}`
  );

  const quotaUsed = spoonRes.headers.get("X-API-Quota-Used") ?? "?";
  const quotaLeft = spoonRes.headers.get("X-API-Quota-Left") ?? "?";
  const quotaRequest = spoonRes.headers.get("X-API-Quota-Request") ?? "?";

  if (!spoonRes.ok) {
    return NextResponse.json(
      { error: "Spoonacular error", status: spoonRes.status, quotaUsed, quotaLeft },
      { status: 502 }
    );
  }

  let data: { results?: SpoonacularRecipe[]; totalResults?: number };
  try {
    data = await spoonRes.json();
  } catch {
    return NextResponse.json({ error: "Failed to parse Spoonacular response", quota: { used: quotaUsed, left: quotaLeft, request: quotaRequest } }, { status: 502 });
  }
  const raw: SpoonacularRecipe[] = data.results ?? [];

  let saved = 0;
  let skipped = 0;
  let lastError = "";

  for (const r of raw) {
    const id = `sp_${r.id}`;
    const calories = Math.round(
      r.nutrition?.nutrients?.find(n => n.name === "Calories")?.amount ?? 0
    );
    const difficulty =
      (r.readyInMinutes ?? 30) <= 20 ? "Einfach"
      : (r.readyInMinutes ?? 30) <= 45 ? "Mittel"
      : "Anspruchsvoll";
    const tags = [
      ...(r.diets ?? []).slice(0, 3),
      ...(r.dishTypes ?? []).slice(0, 2),
    ].map(t => t.charAt(0).toUpperCase() + t.slice(1)).slice(0, 5);
    const ingredients = (r.extendedIngredients ?? []).map(i => ({
      name: i.name,
      amount: `${i.measures?.metric?.amount?.toFixed(0) ?? ""} ${i.measures?.metric?.unitShort ?? ""}`.trim(),
    }));
    const steps = (r.analyzedInstructions?.[0]?.steps ?? []).map(s => s.step);
    const rating = Math.round(((r.spoonacularScore ?? 70) / 20) * 10) / 10;

    try {
      await query(
        `INSERT INTO recipes (id, name, description, image, cuisine, time_minutes, servings, calories, difficulty, tags, ingredients, steps, rating, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'spoonacular')
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, description = EXCLUDED.description,
           image = EXCLUDED.image, cuisine = EXCLUDED.cuisine,
           time_minutes = EXCLUDED.time_minutes, calories = EXCLUDED.calories,
           difficulty = EXCLUDED.difficulty, tags = EXCLUDED.tags,
           ingredients = EXCLUDED.ingredients, steps = EXCLUDED.steps,
           rating = EXCLUDED.rating`,
        [
          id,
          r.title,
          r.summary?.replace(/<[^>]*>/g, "").slice(0, 200) ?? "",
          r.image ?? "",
          r.cuisines?.[0] ?? "International",
          r.readyInMinutes ?? 30,
          r.servings ?? 4,
          calories,
          difficulty,
          tags,  // pg driver handles JS string[] → TEXT[]
          JSON.stringify(ingredients),
          JSON.stringify(steps),
          rating,
        ]
      );
      saved++;
    } catch (e) {
      lastError = String(e);
      skipped++;
    }
  }

  let dbTotal = 0;
  try {
    const totalInDb = await query<{ count: string }>("SELECT COUNT(*) as count FROM recipes");
    dbTotal = parseInt(totalInDb[0]?.count ?? "0");
  } catch { /* ignore */ }

  return NextResponse.json({
    saved,
    skipped,
    lastError: lastError || undefined,
    total: data.totalResults ?? 0,
    dbTotal,
    quota: { used: quotaUsed, left: quotaLeft, request: quotaRequest },
  });
}

export async function GET() {
  const session = await getSession();
  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await query<{ count: string; source: string }>(
    "SELECT source, COUNT(*) as count FROM recipes GROUP BY source"
  );
  return NextResponse.json({ sources: result });
}
