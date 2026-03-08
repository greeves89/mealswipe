# MealSwipe — Setup Guide

## 1. Supabase (Auth + DB)

1. Gehe zu https://supabase.com → Neues Projekt erstellen
2. **SQL Editor** → Inhalt von `supabase-schema.sql` einfügen und ausführen
3. **Authentication → Providers**: Google OAuth aktivieren (optional)
4. **Settings → API** → URL + anon key kopieren

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 2. Stripe (Billing)

1. Gehe zu https://stripe.com → Dashboard
2. **Products** → Zwei Produkte anlegen:
   - "MealSwipe Plus" → Preis: €3,99/Monat recurring
   - "MealSwipe Family" → Preis: €4,99/Monat recurring
3. Price IDs kopieren (beginnen mit `price_...`)
4. **Developers → API keys** → Secret + Publishable key
5. **Webhooks** → Endpoint: `https://DEINE-DOMAIN/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLUS_PRICE_ID=price_...
STRIPE_FAMILY_PRICE_ID=price_...
```

## 3. Spoonacular (Rezepte)

1. https://spoonacular.com/food-api → Kostenlos registrieren
2. Dashboard → API Key kopieren
3. Free tier: 150 Requests/Tag (reicht für MVP)

```env
SPOONACULAR_API_KEY=your_key_here
```

## 4. OpenAI (Rezept-Scanner)

1. https://platform.openai.com → API Keys → New key
2. Model: `gpt-4o-mini` (günstigste Option mit Vision)

```env
OPENAI_API_KEY=sk-...
```

## 5. Deployment

### Docker (eigener Server)
```bash
cp .env.example .env
# .env mit echten Keys füllen
docker compose up -d --build
```

### Vercel (empfohlen für Produktion)
```bash
npx vercel
# Env vars im Vercel Dashboard eintragen
```

## 6. Fertige .env für Produktion

Alle Werte in `.env.local` (dev) oder als Docker/Vercel env vars:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PLUS_PRICE_ID=
STRIPE_FAMILY_PRICE_ID=
SPOONACULAR_API_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=https://deine-domain.de
```
