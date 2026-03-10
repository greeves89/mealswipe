-- Migration 001: Nährwert-Makros + Wochenplan-Vorlagen
-- Run: psql $DATABASE_URL < db/migrations/001_nutrition_templates.sql

-- Add macro columns to custom_recipes
ALTER TABLE custom_recipes ADD COLUMN IF NOT EXISTS protein INTEGER DEFAULT 0;
ALTER TABLE custom_recipes ADD COLUMN IF NOT EXISTS carbs INTEGER DEFAULT 0;
ALTER TABLE custom_recipes ADD COLUMN IF NOT EXISTS fat INTEGER DEFAULT 0;

-- Also add macros to global recipe cache
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS protein INTEGER;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS carbs INTEGER;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS fat INTEGER;

-- Wochenplan-Vorlagen
CREATE TABLE IF NOT EXISTS plan_templates (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  meals       JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_templates_user ON plan_templates (user_id);
