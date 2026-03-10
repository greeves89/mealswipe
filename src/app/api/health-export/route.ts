import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query, queryOne } from "@/lib/db";

interface MealPlanRow {
  day: string;
  recipe_data: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    servings?: number;
    name?: string;
  };
}

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

// GET /api/health-export?days=30&format=json|csv
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const daysBack = Math.min(365, Math.max(7, parseInt(searchParams.get("days") ?? "30")));
  const format = searchParams.get("format") ?? "json";

  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const sinceStr = since.toISOString().split("T")[0];

  const userIds = await getHouseholdUserIds(session.id);

  const rows = await query<MealPlanRow>(
    `SELECT day::text, recipe_data
     FROM meal_plans
     WHERE user_id = ANY($1::uuid[]) AND day >= $2
     ORDER BY day`,
    [userIds, sinceStr]
  );

  // Aggregate per day
  const byDay: Record<string, { calories: number; protein: number; carbs: number; fat: number; meals: string[] }> = {};

  for (const row of rows) {
    const d = row.day;
    const rd = row.recipe_data ?? {};
    const servings = Math.max(1, rd.servings ?? 1);
    if (!byDay[d]) byDay[d] = { calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] };

    byDay[d].calories += Math.round((rd.calories ?? 0) / servings);
    byDay[d].protein += Math.round((rd.protein ?? 0) / servings);
    byDay[d].carbs += Math.round((rd.carbs ?? 0) / servings);
    byDay[d].fat += Math.round((rd.fat ?? 0) / servings);
    if (rd.name) byDay[d].meals.push(rd.name);
  }

  if (format === "csv") {
    const lines = [
      "Datum,Kalorien (kcal),Protein (g),Kohlenhydrate (g),Fett (g),Mahlzeiten",
      ...Object.entries(byDay).map(([day, v]) =>
        `${day},${v.calories},${v.protein},${v.carbs},${v.fat},"${v.meals.join("; ")}"`
      ),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="forkly-nutrition-${sinceStr}.csv"`,
      },
    });
  }

  return NextResponse.json({
    days: byDay,
    summary: {
      tracked_days: Object.keys(byDay).length,
      avg_calories: Object.values(byDay).length
        ? Math.round(Object.values(byDay).reduce((s, v) => s + v.calories, 0) / Object.values(byDay).length)
        : 0,
      avg_protein: Object.values(byDay).length
        ? Math.round(Object.values(byDay).reduce((s, v) => s + v.protein, 0) / Object.values(byDay).length)
        : 0,
      avg_carbs: Object.values(byDay).length
        ? Math.round(Object.values(byDay).reduce((s, v) => s + v.carbs, 0) / Object.values(byDay).length)
        : 0,
      avg_fat: Object.values(byDay).length
        ? Math.round(Object.values(byDay).reduce((s, v) => s + v.fat, 0) / Object.values(byDay).length)
        : 0,
    },
  });
}
