import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { queryOne } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  // Fetch fresh plan from DB (Stripe webhook may have updated it since JWT was issued)
  const dbUser = await queryOne<{ plan: string }>(
    "SELECT plan FROM users WHERE id = $1",
    [session.id]
  ).catch(() => null);

  return NextResponse.json({
    ...session,
    plan: dbUser?.plan ?? session.plan,
  });
}
