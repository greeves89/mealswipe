import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

// GET /api/social/recipes — public recipes from accepted friends
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recipes = await query<{
    id: string; name: string; description: string; image_url: string;
    cuisine: string; time: number; servings: number; calories: number;
    difficulty: string; tags: string[]; ingredients: unknown; steps: string[];
    rating: number; owner_name: string; owner_id: string; created_at: string;
  }>(`
    SELECT
      cr.id, cr.name, cr.description, cr.image_url, cr.cuisine, cr.time,
      cr.servings, cr.calories, cr.difficulty, cr.tags, cr.ingredients,
      cr.steps, cr.rating, cr.created_at,
      u.name AS owner_name, u.id AS owner_id
    FROM custom_recipes cr
    JOIN users u ON u.id = cr.user_id
    WHERE cr.is_public = TRUE
      AND cr.user_id IN (
        SELECT CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END
        FROM friendships
        WHERE (requester_id = $1 OR addressee_id = $1) AND status = 'accepted'
      )
    ORDER BY cr.created_at DESC
    LIMIT 50
  `, [session.id]);

  const result = recipes.map((r) => ({
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
    ownerName: r.owner_name,
    ownerId: r.owner_id,
    createdAt: r.created_at,
    isCustom: true,
  }));

  return NextResponse.json({ recipes: result });
}
