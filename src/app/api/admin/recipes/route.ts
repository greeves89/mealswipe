import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await query("DELETE FROM recipes WHERE id=$1", [id]);
  return NextResponse.json({ ok: true });
}
