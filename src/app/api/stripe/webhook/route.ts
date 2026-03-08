import { stripe } from "@/lib/stripe";
import { query, queryOne } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;

    if (userId && plan) {
      try {
        await query(
          `INSERT INTO profiles (id, plan, stripe_customer_id, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (id) DO UPDATE
           SET plan = EXCLUDED.plan,
               stripe_customer_id = EXCLUDED.stripe_customer_id,
               updated_at = NOW()`,
          [userId, plan, session.customer as string]
        );
      } catch {
        // DB may not be configured — ignore gracefully
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    try {
      const profile = await queryOne<{ id: string }>(
        "SELECT id FROM profiles WHERE stripe_customer_id = $1",
        [customerId]
      );

      if (profile) {
        await query(
          "UPDATE profiles SET plan = 'free', updated_at = NOW() WHERE id = $1",
          [profile.id]
        );
      }
    } catch {
      // DB may not be configured — ignore gracefully
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    if (sub.status === "active") {
      try {
        const profile = await queryOne<{ id: string }>(
          "SELECT id FROM profiles WHERE stripe_customer_id = $1",
          [customerId]
        );

        if (profile) {
          await query(
            "UPDATE profiles SET updated_at = NOW() WHERE id = $1",
            [profile.id]
          );
        }
      } catch {
        // DB may not be configured — ignore gracefully
      }
    }
  }

  return NextResponse.json({ received: true });
}
