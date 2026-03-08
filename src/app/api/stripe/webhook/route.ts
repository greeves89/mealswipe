import { stripe } from "@/lib/stripe";
import { query } from "@/lib/db";
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
          `UPDATE users
           SET plan = $1, stripe_customer_id = $2, updated_at = NOW()
           WHERE id = $3`,
          [plan, session.customer as string, userId]
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
      await query(
        "UPDATE users SET plan = 'free', updated_at = NOW() WHERE stripe_customer_id = $1",
        [customerId]
      );
    } catch {
      // DB may not be configured — ignore gracefully
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    if (sub.status === "active") {
      const priceId = sub.items.data[0]?.price.id;
      if (priceId) {
        const plusPriceId = process.env.STRIPE_PLUS_PRICE_ID;
        const familyPriceId = process.env.STRIPE_FAMILY_PRICE_ID;
        const newPlan =
          priceId === familyPriceId
            ? "family"
            : priceId === plusPriceId
            ? "plus"
            : null;
        if (newPlan) {
          try {
            await query(
              "UPDATE users SET plan = $1, updated_at = NOW() WHERE stripe_customer_id = $2",
              [newPlan, customerId]
            );
          } catch {
            // DB may not be configured — ignore gracefully
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
