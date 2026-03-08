import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "daniel.alisch@me.com").split(",").map(e => e.trim());

export async function GET() {
  const session = await getSession();
  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [usersResult, planStatsResult, recentResult, feedbackResult] = await Promise.all([
    query<{
      id: string;
      email: string;
      name: string;
      plan: string;
      created_at: string;
      household_people: number | null;
      household_diets: string[] | null;
    }>(
      `SELECT u.id, u.email, u.name, u.plan, u.created_at,
              p.household_people, p.household_diets
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       ORDER BY u.created_at DESC`
    ),
    query<{ plan: string; count: string }>(
      `SELECT plan, COUNT(*) as count FROM users GROUP BY plan ORDER BY plan`
    ),
    query<{ date: string; count: string }>(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    ),
    query<{
      id: string;
      user_email: string | null;
      user_name: string | null;
      type: string;
      rating: number | null;
      message: string;
      status: string;
      created_at: string;
    }>(
      `SELECT id, user_email, user_name, type, rating, message, status, created_at
       FROM feedback
       ORDER BY created_at DESC
       LIMIT 100`
    ),
  ]);

  const planCounts: Record<string, number> = { free: 0, plus: 0, family: 0 };
  for (const row of planStatsResult) {
    planCounts[row.plan] = parseInt(row.count);
  }

  const mrr = planCounts.plus * 3.99 + planCounts.family * 4.99;

  return NextResponse.json({
    users: usersResult,
    feedback: feedbackResult,
    stats: {
      total: usersResult.length,
      planCounts,
      mrr: mrr.toFixed(2),
      newLast30Days: recentResult.reduce((s, r) => s + parseInt(r.count), 0),
      signupsByDay: recentResult,
      newFeedback: feedbackResult.filter(f => f.status === "new").length,
    },
  });
}
