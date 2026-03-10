import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query, queryOne } from "@/lib/db";

// Ensure social schema exists (safe to run repeatedly)
async function ensureSocialSchema() {
  await query(`ALTER TABLE custom_recipes ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE`);
  await query(`
    CREATE TABLE IF NOT EXISTS friendships (
      id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      requester_id  UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      addressee_id  UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (requester_id, addressee_id)
    )
  `);
}

// GET /api/friends — list accepted friends + pending requests
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureSocialSchema();

  const friends = await query<{
    id: string; user_id: string; name: string; email: string; direction: string;
  }>(`
    SELECT
      f.id,
      CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END AS user_id,
      u.name,
      u.email,
      CASE WHEN f.requester_id = $1 THEN 'sent' ELSE 'received' END AS direction,
      f.status,
      f.created_at
    FROM friendships f
    JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
    WHERE f.requester_id = $1 OR f.addressee_id = $1
    ORDER BY f.created_at DESC
  `, [session.id]);

  return NextResponse.json({ friends });
}

// POST /api/friends — send friend request by email
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureSocialSchema();

  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-Mail fehlt" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail === session.email.toLowerCase()) {
    return NextResponse.json({ error: "Du kannst dich nicht selbst hinzufügen" }, { status: 400 });
  }

  const target = await queryOne<{ id: string; name: string }>(
    "SELECT id, name FROM users WHERE LOWER(email) = $1",
    [normalizedEmail]
  );

  if (!target) {
    return NextResponse.json({ error: "Kein Nutzer mit dieser E-Mail gefunden" }, { status: 404 });
  }

  // Check if friendship already exists (in either direction)
  const existing = await queryOne(
    `SELECT id, status FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)`,
    [session.id, target.id]
  );

  if (existing) {
    return NextResponse.json({ error: "Anfrage bereits gesendet oder ihr seid schon befreundet" }, { status: 409 });
  }

  const friendship = await queryOne<{ id: string }>(
    `INSERT INTO friendships (requester_id, addressee_id, status)
     VALUES ($1, $2, 'pending') RETURNING id`,
    [session.id, target.id]
  );

  return NextResponse.json({ friendship_id: friendship?.id, friend_name: target.name });
}
