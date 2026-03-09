import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await query<{
      id: string; name: string; description: string; image_url: string;
      cuisine: string; time: number; servings: number; calories: number;
      difficulty: string; tags: string[]; ingredients: unknown; steps: string[];
      rating: number; source: string; created_at: string;
    }>(
      `SELECT id, name, description, image_url, cuisine, time, servings, calories,
              difficulty, tags, ingredients, steps, rating, source, created_at
       FROM custom_recipes WHERE user_id = $1 ORDER BY created_at DESC`,
      [session.id]
    );

    const recipes = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? "",
      image: r.image_url ?? "",
      cuisine: r.cuisine ?? "International",
      time: r.time ?? 30,
      servings: r.servings ?? 4,
      calories: r.calories ?? 0,
      difficulty: r.difficulty ?? "Mittel",
      tags: r.tags ?? [],
      ingredients: typeof r.ingredients === "string" ? JSON.parse(r.ingredients) : (r.ingredients ?? []),
      steps: r.steps ?? [],
      rating: Number(r.rating ?? 4.0),
      source: r.source ?? "Gescannt",
      isCustom: true,
    }));

    return NextResponse.json({ recipes });
  } catch (err) {
    console.error("custom-recipes GET error:", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await query("DELETE FROM custom_recipes WHERE id = $1 AND user_id = $2", [id, session.id]);
  return NextResponse.json({ ok: true });
}
