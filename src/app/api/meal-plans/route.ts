import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query, queryOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("week_start") ?? new Date().toISOString().split("T")[0];

  const plans = await query(
    "SELECT day, recipe_data FROM meal_plans WHERE user_id = $1 AND day >= $2 ORDER BY day",
    [user.id, weekStart]
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
