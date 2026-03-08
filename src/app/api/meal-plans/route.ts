import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query, queryOne } from "@/lib/db";

async function getHouseholdUserIds(userId: string): Promise<string[]> {
  const dbUser = await queryOne<{ household_id: string | null }>(
    "SELECT household_id FROM users WHERE id = $1",
    [userId]
  );
  if (!dbUser?.household_id) return [userId];

  const members = await query<{ id: string }>(
    `SELECT u.id FROM users u
     WHERE u.id = (SELECT owner_id FROM households WHERE id = $1)
        OR u.household_id = $1`,
    [dbUser.household_id]
  );
  return members.map((m) => m.id);
}

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("week_start") ?? new Date().toISOString().split("T")[0];

  const userIds = await getHouseholdUserIds(user.id);
  const plans = await query(
    `SELECT day, recipe_data FROM meal_plans
     WHERE user_id = ANY($1::uuid[]) AND day >= $2
     ORDER BY day`,
    [userIds, weekStart]
  );
  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { day, recipe_id, recipe_name, recipe_image, recipe_data } = await req.json();

  await query(
    `INSERT INTO meal_plans (user_id, day, recipe_id, recipe_name, recipe_image, recipe_data)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, day, meal_type) DO UPDATE SET
       recipe_id = EXCLUDED.recipe_id,
       recipe_name = EXCLUDED.recipe_name,
       recipe_image = EXCLUDED.recipe_image,
       recipe_data = EXCLUDED.recipe_data`,
    [user.id, day, recipe_id, recipe_name, recipe_image, recipe_data]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { day } = await req.json();
  await query("DELETE FROM meal_plans WHERE user_id = $1 AND day = $2", [user.id, day]);
  return NextResponse.json({ ok: true });
}
