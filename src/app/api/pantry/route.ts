import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/session";

export const CATEGORIES = [
  "Gemüse",
  "Obst",
  "Fleisch & Fisch",
  "Milchprodukte",
  "Getreide & Pasta",
  "Hülsenfrüchte",
  "Gewürze & Öle",
  "Backzutaten",
  "Getränke",
  "Konserven",
  "Tiefkühl",
  "Sonstiges",
] as const;

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

// GET /api/pantry — returns all pantry items (household-aware)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userIds = await getHouseholdUserIds(session.id);

  const items = await query<{
    id: string; name: string; quantity: number; unit: string; category: string; created_at: string;
  }>(
    `SELECT id, name, quantity, unit, category, created_at
     FROM pantry_items
     WHERE user_id = ANY($1::uuid[])
     ORDER BY category, name`,
    [userIds]
  );

  return NextResponse.json({ items });
}

// POST /api/pantry — insert a new pantry item
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, quantity, unit, category } = body as {
    name?: string; quantity?: number; unit?: string; category?: string;
  };

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const resolvedCategory =
    category && (CATEGORIES as readonly string[]).includes(category) ? category : "Sonstiges";

  const rows = await query<{ id: string }>(
    `INSERT INTO pantry_items (user_id, name, quantity, unit, category)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [session.id, name.trim(), quantity ?? 1, unit ?? "", resolvedCategory]
  );

  return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
}

// PATCH /api/pantry — update quantity (household-aware)
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, quantity } = body as { id?: string; quantity?: number };

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (quantity === undefined || quantity === null) {
    return NextResponse.json({ error: "quantity is required" }, { status: 400 });
  }

  const userIds = await getHouseholdUserIds(session.id);
  const rows = await query<{ id: string }>(
    `UPDATE pantry_items SET quantity = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = ANY($3::uuid[]) RETURNING id`,
    [quantity, id, userIds]
  );

  if (rows.length === 0) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/pantry — delete a pantry item (accepts ?id= or body)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Accept id from query param (cooking mode) or request body
  const { searchParams } = new URL(req.url);
  let id = searchParams.get("id");
  if (!id) {
    try {
      const body = await req.json();
      id = body.id;
    } catch { /* no body */ }
  }

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const userIds = await getHouseholdUserIds(session.id);
  const rows = await query<{ id: string }>(
    `DELETE FROM pantry_items WHERE id = $1 AND user_id = ANY($2::uuid[]) RETURNING id`,
    [id, userIds]
  );

  if (rows.length === 0) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
