import { NextResponse } from "next/server";
import { query } from "@/lib/db";
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

// GET /api/pantry — returns all pantry items for the current user
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await query<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    category: string;
    created_at: string;
  }>(
    `SELECT id, name, quantity, unit, category, created_at
     FROM pantry_items
     WHERE user_id = $1
     ORDER BY category, name`,
    [session.id]
  );

  return NextResponse.json({ items });
}

// POST /api/pantry — insert a new pantry item
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, quantity, unit, category } = body as {
    name?: string;
    quantity?: number;
    unit?: string;
    category?: string;
  };

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const resolvedCategory =
    category && (CATEGORIES as readonly string[]).includes(category)
      ? category
      : "Sonstiges";

  const rows = await query<{ id: string }>(
    `INSERT INTO pantry_items (user_id, name, quantity, unit, category)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      session.id,
      name.trim(),
      quantity ?? 1,
      unit ?? "",
      resolvedCategory,
    ]
  );

  return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
}

// PATCH /api/pantry — update quantity of an existing pantry item
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, quantity } = body as { id?: string; quantity?: number };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (quantity === undefined || quantity === null) {
    return NextResponse.json({ error: "quantity is required" }, { status: 400 });
  }

  const rows = await query<{ id: string }>(
    `UPDATE pantry_items
     SET quantity = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING id`,
    [quantity, id, session.id]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/pantry — delete a pantry item
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id } = body as { id?: string };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const rows = await query<{ id: string }>(
    `DELETE FROM pantry_items
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, session.id]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
