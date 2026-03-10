import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { query, queryOne } from "@/lib/db";
import { createSession, COOKIE_OPTIONS, SessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`register:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Zu viele Versuche. Bitte warte eine Minute." }, { status: 429 });
  }

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password || password.length < 8) {
      return NextResponse.json({ error: "Ungültige Eingaben" }, { status: 400 });
    }

    // Check duplicate
    const existing = await queryOne("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing) {
      return NextResponse.json({ error: "E-Mail bereits registriert" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);
    const [user] = await query<{ id: string; email: string; name: string }>(
      `INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name`,
      [email.toLowerCase(), name, passwordHash]
    );

    // Create profile
    await query(
      `INSERT INTO profiles (user_id, household_name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [user.id, `${name}s Haushalt`]
    );

    const sessionUser: SessionUser = { id: user.id, email: user.email, name: user.name, plan: "free" };
    const token = await createSession(sessionUser);

    const res = NextResponse.json({ user: sessionUser });
    res.cookies.set({ ...COOKIE_OPTIONS, value: token });
    return res;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registrierung fehlgeschlagen" }, { status: 500 });
  }
}
