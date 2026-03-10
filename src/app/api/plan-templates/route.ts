import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query, queryOne } from "@/lib/db";

// GET /api/plan-templates — list user's templates
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const templates = await query<{ id: string; name: string; meals: Record<string, unknown>; created_at: string }>(
    "SELECT id, name, meals, created_at FROM plan_templates WHERE user_id = $1 ORDER BY created_at DESC",
    [session.id]
  );
  return NextResponse.json({ templates });
}

// POST /api/plan-templates — save current week as template
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { name, meals } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name fehlt" }, { status: 400 });

  const result = await queryOne<{ id: string }>(
    "INSERT INTO plan_templates (user_id, name, meals) VALUES ($1, $2, $3) RETURNING id",
    [session.id, name.trim(), JSON.stringify(meals ?? {})]
  );
  return NextResponse.json({ ok: true, id: result?.id });
}

// DELETE /api/plan-templates?id=... — delete a template
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });

  await query("DELETE FROM plan_templates WHERE id = $1 AND user_id = $2", [id, session.id]);
  return NextResponse.json({ ok: true });
}
