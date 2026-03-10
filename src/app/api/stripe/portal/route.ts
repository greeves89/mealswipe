import { stripe } from "@/lib/stripe";
import { getSession } from "@/lib/session";
import { queryOne } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await queryOne<{ stripe_customer_id: string | null }>(
    "SELECT stripe_customer_id FROM users WHERE id = $1",
    [user.id]
  );

  if (!row?.stripe_customer_id) {
    return NextResponse.json({ error: "Kein aktives Abonnement gefunden" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    configuration: "bpc_1T9KWlA3wVkuCppAmgh5dbmm",
    return_url: `${baseUrl}/app/billing`,
  });

  return NextResponse.json({ url: session.url });
}
