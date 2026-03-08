import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query, queryOne } from "@/lib/db";

function randomCode(len = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// GET /api/household — get current household info + members
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get full user record with household_id
  const dbUser = await queryOne<{ household_id: string | null; plan: string }>(
    "SELECT household_id, plan FROM users WHERE id = $1",
    [user.id]
  );
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Get household where this user is owner
  const owned = await queryOne<{ id: string; invite_code: string; name: string }>(
    "SELECT id, invite_code, name FROM households WHERE owner_id = $1",
    [user.id]
  );

  // Get household this user is a member of (via household_id)
  let household = owned;
  if (!household && dbUser.household_id) {
    household = await queryOne<{ id: string; invite_code: string; name: string }>(
      "SELECT id, invite_code, name FROM households WHERE id = $1",
      [dbUser.household_id]
    );
  }

  if (!household) {
    return NextResponse.json({ household: null });
  }

  // Get all members
  const members = await query<{ id: string; name: string; email: string }>(
    `SELECT u.id, u.name, u.email FROM users u
     WHERE u.id = (SELECT owner_id FROM households WHERE id = $1)
        OR u.household_id = $1
     ORDER BY u.created_at`,
    [household.id]
  );

  const ownerId = (await queryOne<{ owner_id: string }>(
    "SELECT owner_id FROM households WHERE id = $1",
    [household.id]
  ))?.owner_id;

  return NextResponse.json({
    household: {
      ...household,
      is_owner: ownerId === user.id,
      owner_id: ownerId,
    },
    members,
  });
}

// POST /api/household — action: "create" | "join" | "leave" | "kick"
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, invite_code, member_id } = await req.json();

  if (action === "create") {
    // Only family plan users can create a household
    const dbUser = await queryOne<{ plan: string }>("SELECT plan FROM users WHERE id = $1", [user.id]);
    if (dbUser?.plan !== "family") {
      return NextResponse.json({ error: "Family plan erforderlich" }, { status: 403 });
    }

    // Check if already owns one
    const existing = await queryOne("SELECT id FROM households WHERE owner_id = $1", [user.id]);
    if (existing) return NextResponse.json({ error: "Haushalt existiert bereits" }, { status: 409 });

    // Create household with unique invite code
    let code = randomCode();
    for (let i = 0; i < 5; i++) {
      const taken = await queryOne("SELECT id FROM households WHERE invite_code = $1", [code]);
      if (!taken) break;
      code = randomCode();
    }

    const [hh] = await query<{ id: string; invite_code: string }>(
      "INSERT INTO households (owner_id, invite_code) VALUES ($1, $2) RETURNING id, invite_code",
      [user.id, code]
    );
    // Set owner's household_id too
    await query("UPDATE users SET household_id = $1 WHERE id = $2", [hh.id, user.id]);
    return NextResponse.json({ household: hh });
  }

  if (action === "join") {
    if (!invite_code) return NextResponse.json({ error: "Invite-Code fehlt" }, { status: 400 });

    const hh = await queryOne<{ id: string; owner_id: string }>(
      "SELECT id, owner_id FROM households WHERE invite_code = $1",
      [invite_code.toUpperCase().trim()]
    );
    if (!hh) return NextResponse.json({ error: "Ungültiger Code" }, { status: 404 });
    if (hh.owner_id === user.id) return NextResponse.json({ error: "Du bist der Besitzer" }, { status: 400 });

    await query(
      "UPDATE users SET household_id = $1, plan = 'family' WHERE id = $2",
      [hh.id, user.id]
    );
    return NextResponse.json({ ok: true, household_id: hh.id });
  }

  if (action === "leave") {
    // Owner cannot leave — they must delete
    const owned = await queryOne("SELECT id FROM households WHERE owner_id = $1", [user.id]);
    if (owned) return NextResponse.json({ error: "Eigentümer kann den Haushalt nicht verlassen" }, { status: 400 });

    await query("UPDATE users SET household_id = NULL, plan = 'free' WHERE id = $1", [user.id]);
    return NextResponse.json({ ok: true });
  }

  if (action === "kick") {
    if (!member_id) return NextResponse.json({ error: "member_id fehlt" }, { status: 400 });
    // Must be owner
    const owned = await queryOne<{ id: string }>("SELECT id FROM households WHERE owner_id = $1", [user.id]);
    if (!owned) return NextResponse.json({ error: "Nur Eigentümer kann Mitglieder entfernen" }, { status: 403 });

    await query("UPDATE users SET household_id = NULL, plan = 'free' WHERE id = $1 AND household_id = $2", [member_id, owned.id]);
    return NextResponse.json({ ok: true });
  }

  if (action === "regenerate_code") {
    const owned = await queryOne<{ id: string }>("SELECT id FROM households WHERE owner_id = $1", [user.id]);
    if (!owned) return NextResponse.json({ error: "Kein Haushalt gefunden" }, { status: 404 });

    let code = randomCode();
    for (let i = 0; i < 5; i++) {
      const taken = await queryOne("SELECT id FROM households WHERE invite_code = $1 AND id != $2", [code, owned.id]);
      if (!taken) break;
      code = randomCode();
    }
    await query("UPDATE households SET invite_code = $1 WHERE id = $2", [code, owned.id]);
    return NextResponse.json({ invite_code: code });
  }

  return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
}
