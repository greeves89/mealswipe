import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    priceId: null,
    features: [
      "10 Rezepte gespeichert",
      "1 Mahlzeitenplan/Monat",
      "Basis-Einkaufsliste",
    ],
  },
  plus: {
    name: "Plus",
    price: 3.99,
    priceId: process.env.STRIPE_PLUS_PRICE_ID ?? "",
    features: [
      "Unbegrenzte Rezepte",
      "Wochenpläne",
      "KI-Scanning (10/Monat)",
      "Haushalt (2 Personen)",
    ],
  },
  family: {
    name: "Family",
    price: 4.99,
    priceId: process.env.STRIPE_FAMILY_PRICE_ID ?? "",
    features: [
      "Alles in Plus",
      "Unbegrenztes Scanning",
      "Haushalt (unbegrenzt)",
      "Rewe/Edeka Integration",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
