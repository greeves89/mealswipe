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

  const { household_name, household_people, household_diets, preferred_cuisines, time_budget, cooking_skill } = await req.json();

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
