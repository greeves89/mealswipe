import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

// GET /api/household/preview?code=ABC123
// Public endpoint — no auth required, returns basic household info for invite page
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`preview:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }

  const code = req.nextUrl.searchParams.get("code")?.toUpperCase().trim();
  if (!code) return NextResponse.json({ error: "Code fehlt" }, { status: 400 });

  const hh = await queryOne<{ id: string; name: string; owner_name: string; member_count: number }>(
    `SELECT h.id, COALESCE(h.name, u.name || 's Haushalt') AS name,
            u.name AS owner_name,
            (SELECT COUNT(*) FROM users m WHERE m.household_id = h.id) + 1 AS member_count
     FROM households h
     JOIN users u ON u.id = h.owner_id
     WHERE h.invite_code = $1`,
    [code]
  );

  if (!hh) return NextResponse.json({ error: "Ungültiger Code" }, { status: 404 });

  return NextResponse.json({ household: hh });
}
