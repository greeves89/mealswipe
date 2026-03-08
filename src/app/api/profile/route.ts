import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query, queryOne } from "@/lib/db";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await queryOne(
    "SELECT * FROM profiles WHERE user_id = $1",
    [user.id]
  );
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Support both old field names (onboarding) and new field names (profile page)
  const household_name = body.household_name ?? body.display_name ?? null;
  const household_people = body.household_people ?? body.household_size ?? null;
  const household_diets = body.household_diets ?? body.dietary_restrictions ?? null;
  const preferred_cuisines = body.preferred_cuisines ?? null;
  const time_budget = body.time_budget ?? null;
  const cooking_skill = body.cooking_skill ?? null;

  // Update display name in users table if provided
  if (body.display_name) {
    await query("UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2", [body.display_name, user.id]);
  }

  await query(
    `INSERT INTO profiles (user_id, household_name, household_people, household_diets, preferred_cuisines, time_budget, cooking_skill)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id) DO UPDATE SET
       household_name = COALESCE(EXCLUDED.household_name, profiles.household_name),
       household_people = COALESCE(EXCLUDED.household_people, profiles.household_people),
       household_diets = COALESCE(EXCLUDED.household_diets, profiles.household_diets),
       preferred_cuisines = COALESCE(EXCLUDED.preferred_cuisines, profiles.preferred_cuisines),
       time_budget = COALESCE(EXCLUDED.time_budget, profiles.time_budget),
       cooking_skill = COALESCE(EXCLUDED.cooking_skill, profiles.cooking_skill),
       updated_at = NOW()`,
    [user.id, household_name, household_people, household_diets, preferred_cuisines, time_budget, cooking_skill]
  );

  return NextResponse.json({ ok: true });
}
