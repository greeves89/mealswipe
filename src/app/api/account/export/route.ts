import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query, queryOne } from "@/lib/db";

// GET /api/account/export
// Returns all personal data for the authenticated user as JSON (DSGVO Art. 20)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.id;

  const [user, profile, mealPlans, customRecipes, reactions, shoppingLists, pantryItems, feedback] =
    await Promise.all([
      queryOne<Record<string, unknown>>(
        `SELECT id, email, name, plan, created_at, consented_at, consent_version
         FROM users WHERE id = $1`,
        [uid]
      ),
      queryOne<Record<string, unknown>>(
        `SELECT household_name, household_people, household_diets, preferred_cuisines,
                time_budget, cooking_skill, updated_at
         FROM profiles WHERE user_id = $1`,
        [uid]
      ),
      query<Record<string, unknown>>(
        `SELECT day, meal_type, recipe_id, recipe_name, recipe_image, servings,
                calories, protein, carbs, fat, added_at
         FROM meal_plans WHERE user_id = $1 ORDER BY day DESC`,
        [uid]
      ),
      query<Record<string, unknown>>(
        `SELECT name, description, cuisine, time, servings, calories, difficulty,
                tags, ingredients, steps, source, created_at
         FROM custom_recipes WHERE user_id = $1 ORDER BY created_at DESC`,
        [uid]
      ),
      query<Record<string, unknown>>(
        `SELECT recipe_id, reaction, created_at FROM recipe_reactions WHERE user_id = $1`,
        [uid]
      ),
      query<Record<string, unknown>>(
        `SELECT week_start, items FROM shopping_lists WHERE user_id = $1 ORDER BY week_start DESC`,
        [uid]
      ),
      query<Record<string, unknown>>(
        `SELECT name, quantity, unit, category, expiry_date, added_at
         FROM pantry_items WHERE user_id = $1`,
        [uid]
      ),
      query<Record<string, unknown>>(
        `SELECT type, rating, message, created_at FROM feedback WHERE user_id = $1`,
        [uid]
      ),
    ]);

  const exportData = {
    export_date: new Date().toISOString(),
    export_version: "1.0",
    account: user,
    profile,
    meal_plans: mealPlans,
    custom_recipes: customRecipes,
    recipe_reactions: reactions,
    shopping_lists: shoppingLists,
    pantry_items: pantryItems,
    feedback,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="forkly-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
