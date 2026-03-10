-- Migration 002: Tiefkühl-/Batch-Cooking Tracker
-- Run: psql $DATABASE_URL < db/migrations/002_frozen_meals.sql

CREATE TABLE IF NOT EXISTS frozen_meals (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  recipe_name TEXT NOT NULL,
  recipe_image TEXT,
  portions    INTEGER NOT NULL DEFAULT 1 CHECK (portions >= 0),
  frozen_on   DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_frozen_meals_user ON frozen_meals (user_id);
