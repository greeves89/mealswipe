import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { queryOne } from "@/lib/db";
import { createSession, COOKIE_OPTIONS, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = await queryOne<{
      id: string; email: string; name: string; password_hash: string; plan: string;
    }>("SELECT id, email, name, password_hash, plan FROM users WHERE email = $1", [email.toLowerCase()]);

    if (!user || !(await compare(password, user.password_hash))) {
      return NextResponse.json({ error: "E-Mail oder Passwort falsch" }, { status: 401 });
    }

    const sessionUser: SessionUser = {
      id: user.id, email: user.email, name: user.name,
      plan: (user.plan as SessionUser["plan"]) || "free",
    };
    const token = await createSession(sessionUser);

    const res = NextResponse.json({ user: sessionUser });
    res.cookies.set({ ...COOKIE_OPTIONS, value: token });
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login fehlgeschlagen" }, { status: 500 });
  }
}
