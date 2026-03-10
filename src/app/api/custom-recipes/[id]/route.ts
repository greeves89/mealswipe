import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query, queryOne } from "@/lib/db";

// PATCH /api/custom-recipes/[id] — update is_public (sharing toggle)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { is_public } = await req.json() as { is_public: boolean };

  if (typeof is_public !== "boolean") {
    return NextResponse.json({ error: "is_public muss ein Boolean sein" }, { status: 400 });
  }

  const recipe = await queryOne<{ id: string }>(
    "SELECT id FROM custom_recipes WHERE id = $1 AND user_id = $2",
    [id, session.id]
  );

  if (!recipe) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  await query(
    "UPDATE custom_recipes SET is_public = $1 WHERE id = $2",
    [is_public, id]
  );

  return NextResponse.json({ ok: true, is_public });
}
