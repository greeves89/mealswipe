import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reactions = await query(
    "SELECT recipe_id, reaction FROM recipe_reactions WHERE user_id = $1",
    [user.id]
  );
  return NextResponse.json({ reactions });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipe_id, reaction } = await req.json();
  await query(
    `INSERT INTO recipe_reactions (user_id, recipe_id, reaction)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, recipe_id) DO UPDATE SET reaction = EXCLUDED.reaction`,
    [user.id, recipe_id, reaction]
  );
  return NextResponse.json({ ok: true });
}
