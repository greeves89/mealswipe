import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "daniel.alisch@me.com").split(",").map(e => e.trim());

export async function POST(req: NextRequest) {
  const session = await getSession();
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
