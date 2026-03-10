import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query, queryOne } from "@/lib/db";

// PATCH /api/friends/[id] — accept or decline a pending request
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json() as { action: "accept" | "decline" };

  const friendship = await queryOne<{ id: string; requester_id: string; addressee_id: string; status: string }>(
    "SELECT * FROM friendships WHERE id = $1",
    [id]
  );

  if (!friendship) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  // Only the addressee can accept/decline
  if (friendship.addressee_id !== session.id) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  if (friendship.status !== "pending") {
    return NextResponse.json({ error: "Anfrage bereits bearbeitet" }, { status: 409 });
  }

  if (action === "accept") {
    await query("UPDATE friendships SET status = 'accepted' WHERE id = $1", [id]);
    return NextResponse.json({ ok: true, status: "accepted" });
  } else {
    await query("DELETE FROM friendships WHERE id = $1", [id]);
    return NextResponse.json({ ok: true, status: "declined" });
  }
}

// DELETE /api/friends/[id] — unfriend or cancel sent request
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const result = await query(
    `DELETE FROM friendships
     WHERE id = $1 AND (requester_id = $2 OR addressee_id = $2)`,
    [id, session.id]
  );

  if ((result as unknown as { rowCount: number }).rowCount === 0) {
    return NextResponse.json({ error: "Nicht gefunden oder keine Berechtigung" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
