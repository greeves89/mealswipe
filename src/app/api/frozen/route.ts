import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/session";

async function getHouseholdUserIds(userId: string): Promise<string[]> {
  const dbUser = await queryOne<{ household_id: string | null }>(
    "SELECT household_id FROM users WHERE id = $1",
    [userId]
  );
  if (!dbUser?.household_id) return [userId];
  const members = await query<{ id: string }>(
    `SELECT u.id FROM users u
     WHERE u.id = (SELECT owner_id FROM households WHERE id = $1)
        OR u.household_id = $1`,
    [dbUser.household_id]
  );
  return members.map((m) => m.id);
}

// GET /api/frozen — list all frozen meals (household-aware)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userIds = await getHouseholdUserIds(session.id);
  const items = await query<{
    id: string; recipe_name: string; recipe_image: string | null;
    portions: number; frozen_on: string; notes: string | null; created_at: string;
  }>(
    `SELECT id, recipe_name, recipe_image, portions, frozen_on::text, notes, created_at
     FROM frozen_meals
     WHERE user_id = ANY($1::uuid[]) AND portions > 0
     ORDER BY frozen_on DESC, created_at DESC`,
    [userIds]
  );

  return NextResponse.json({ items });
}

// POST /api/frozen — add a frozen meal batch
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    recipe_name?: string; recipe_image?: string;
    portions?: number; frozen_on?: string; notes?: string;
  };

  if (!body.recipe_name?.trim()) {
    return NextResponse.json({ error: "recipe_name is required" }, { status: 400 });
  }
  const portions = Math.max(1, Math.round(body.portions ?? 1));
  const frozenOn = body.frozen_on ?? new Date().toISOString().split("T")[0];

  const rows = await query<{ id: string }>(
    `INSERT INTO frozen_meals (user_id, recipe_name, recipe_image, portions, frozen_on, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [session.id, body.recipe_name.trim(), body.recipe_image ?? null, portions, frozenOn, body.notes ?? null]
  );

  return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
}

// PATCH /api/frozen — update portions (use 1 or more portions, or set directly)
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { id?: string; portions?: number };
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (body.portions === undefined) return NextResponse.json({ error: "portions is required" }, { status: 400 });

  const portions = Math.max(0, Math.round(body.portions));
  const userIds = await getHouseholdUserIds(session.id);
  const rows = await query<{ id: string }>(
    `UPDATE frozen_meals SET portions = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = ANY($3::uuid[]) RETURNING id`,
    [portions, body.id, userIds]
  );

  if (rows.length === 0) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/frozen — delete a frozen meal entry
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { id?: string };
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const userIds = await getHouseholdUserIds(session.id);
  const rows = await query<{ id: string }>(
    `DELETE FROM frozen_meals WHERE id = $1 AND user_id = ANY($2::uuid[]) RETURNING id`,
    [body.id, userIds]
  );

  if (rows.length === 0) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
