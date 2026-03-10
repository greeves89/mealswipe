import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import { compare } from "bcryptjs";
import { queryOne } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { cookies } from "next/headers";
import { COOKIE_OPTIONS } from "@/lib/session";

// DELETE /api/account/delete
// Permanently deletes the authenticated user and all their data.
// Requires password confirmation for security.
export async function DELETE(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`delete-account:${ip}`, 3, 60_000)) {
    return NextResponse.json({ error: "Zu viele Versuche." }, { status: 429 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "Passwort erforderlich" }, { status: 400 });

  // Verify password
  const user = await queryOne<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE id = $1",
    [session.id]
  );
  if (!user) return NextResponse.json({ error: "Nutzer nicht gefunden" }, { status: 404 });

  const valid = await compare(password, user.password_hash);
  if (!valid) return NextResponse.json({ error: "Passwort falsch" }, { status: 403 });

  // Cancel Stripe subscription if active (best effort)
  try {
    const sub = await queryOne<{ stripe_subscription_id: string | null }>(
      "SELECT stripe_subscription_id FROM users WHERE id = $1",
      [session.id]
    );
    if (sub?.stripe_subscription_id) {
      const { stripe } = await import("@/lib/stripe");
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    }
  } catch {
    // Non-blocking — proceed with deletion even if Stripe fails
  }

  // Delete user — CASCADE deletes all related data (profiles, meal_plans, etc.)
  await query("DELETE FROM users WHERE id = $1", [session.id]);

  // Clear session cookie
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ ...COOKIE_OPTIONS, value: "", maxAge: 0 });
  return res;
}
