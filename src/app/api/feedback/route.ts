import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`feedback:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte warte eine Minute." }, { status: 429 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { type, rating, message } = await req.json();

  if (!message || message.trim().length < 3) {
    return NextResponse.json({ error: "Nachricht zu kurz" }, { status: 400 });
  }

  await query(
    `INSERT INTO feedback (user_id, user_email, user_name, type, rating, message)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      session?.id ?? null,
      session?.email ?? null,
      session?.name ?? null,
      type ?? "general",
      rating ?? null,
      message.trim(),
    ]
  );

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status } = await req.json();
  await query("UPDATE feedback SET status = $1 WHERE id = $2", [status, id]);
  return NextResponse.json({ ok: true });
}
