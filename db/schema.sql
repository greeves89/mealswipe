-- MealSwipe On-Premise PostgreSQL Schema
-- Runs automatically on first docker compose up

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ───────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free', 'plus', 'family')),
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROFILES ────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  household_name    TEXT DEFAULT 'Mein Haushalt',
  household_people  INTEGER DEFAULT 2,
  household_diets   TEXT[] DEFAULT '{}',
  preferred_cuisines TEXT[] DEFAULT '{}',
  time_budget       TEXT DEFAULT '30-60',
  cooking_skill     TEXT DEFAULT 'Fortgeschritten',
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MEAL PLANS ──────────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  day          DATE NOT NULL,
  meal_type    TEXT DEFAULT 'dinner',
  recipe_id    TEXT NOT NULL,
  recipe_name  TEXT NOT NULL,
  recipe_image TEXT,
  recipe_data  JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, day, meal_type)
);

-- ─── CUSTOM RECIPES (scanned) ────────────
CREATE TABLE IF NOT EXISTS custom_recipes (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  image_url    TEXT,
  cuisine      TEXT DEFAULT 'International',
  time         INTEGER DEFAULT 30,
  servings     INTEGER DEFAULT 4,
  calories     INTEGER DEFAULT 400,
  difficulty   TEXT DEFAULT 'Mittel',
  tags         TEXT[] DEFAULT '{}',
  ingredients  JSONB DEFAULT '[]',
  steps        TEXT[] DEFAULT '{}',
  source       TEXT DEFAULT 'Gescannt',
  rating       DECIMAL(3,1) DEFAULT 4.0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RECIPE REACTIONS ────────────────────
CREATE TABLE IF NOT EXISTS recipe_reactions (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  recipe_id  TEXT NOT NULL,
  reaction   TEXT CHECK (reaction IN ('like', 'dislike')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, recipe_id)
);

-- ─── SHOPPING LISTS ──────────────────────
CREATE TABLE IF NOT EXISTS shopping_lists (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  week_start  DATE NOT NULL,
  items       JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

-- ─── PANTRY / LAGER ─────────────────────
CREATE TABLE IF NOT EXISTS pantry_items (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  quantity    NUMERIC(10,2) DEFAULT 1,
  unit        TEXT DEFAULT '',
  category    TEXT DEFAULT 'Sonstiges',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GLOBAL RECIPE CACHE (Spoonacular / Admin-Scan) ──
CREATE TABLE IF NOT EXISTS recipes (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  image        TEXT,
  cuisine      TEXT,
  time_minutes INT,
  servings     INT,
  calories     INT,
  difficulty   TEXT,
  tags         TEXT[],
  ingredients  JSONB DEFAULT '[]',
  steps        JSONB DEFAULT '[]',
  rating       FLOAT,
  source       TEXT DEFAULT 'spoonacular',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_day ON meal_plans (user_id, day);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON recipe_reactions (user_id);
CREATE INDEX IF NOT EXISTS idx_custom_recipes_user ON custom_recipes (user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_user ON pantry_items (user_id);

-- ─── HOUSEHOLDS (Family Plan Sharing) ───
CREATE TABLE IF NOT EXISTS households (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  invite_code TEXT UNIQUE NOT NULL,
  name        TEXT DEFAULT 'Mein Haushalt',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE SET NULL;
