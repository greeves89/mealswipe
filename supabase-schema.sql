-- MealSwipe Supabase Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- PROFILES (linked to auth.users)
-- ─────────────────────────────────────────
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'plus', 'family')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  household_name TEXT DEFAULT 'Mein Haushalt',
  household_people INTEGER DEFAULT 2,
  household_diets TEXT[] DEFAULT '{}',
  preferred_cuisines TEXT[] DEFAULT '{}',
  time_budget TEXT DEFAULT '30-60',
  cooking_skill TEXT DEFAULT 'Fortgeschritten',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────
-- CUSTOM RECIPES (user-scanned)
-- ─────────────────────────────────────────
CREATE TABLE custom_recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  cuisine TEXT DEFAULT 'International',
  time INTEGER DEFAULT 30,
  servings INTEGER DEFAULT 4,
  calories INTEGER DEFAULT 400,
  difficulty TEXT DEFAULT 'Mittel',
  tags TEXT[] DEFAULT '{}',
  ingredients JSONB DEFAULT '[]',
  steps TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'Gescannt',
  rating DECIMAL(3,1) DEFAULT 4.0,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MEAL PLANS
-- ─────────────────────────────────────────
CREATE TABLE meal_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  day DATE NOT NULL,
  recipe_id TEXT NOT NULL,           -- Spoonacular ID or custom_recipes UUID
  recipe_name TEXT NOT NULL,
  recipe_image TEXT,
  recipe_data JSONB,                  -- Full recipe snapshot
  meal_type TEXT DEFAULT 'dinner' CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  servings INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day, meal_type)
);

-- ─────────────────────────────────────────
-- SHOPPING LISTS
-- ─────────────────────────────────────────
CREATE TABLE shopping_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  items JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- ─────────────────────────────────────────
-- LIKED / DISLIKED RECIPES
-- ─────────────────────────────────────────
CREATE TABLE recipe_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipe_id TEXT NOT NULL,
  reaction TEXT CHECK (reaction IN ('like', 'dislike')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY (DSGVO compliant)
-- ─────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_reactions ENABLE ROW LEVEL SECURITY;

-- Profiles: only own row
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Custom recipes: own + public
CREATE POLICY "Users can view own and public recipes" ON custom_recipes FOR SELECT 
  USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can insert own recipes" ON custom_recipes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON custom_recipes FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON custom_recipes FOR DELETE 
  USING (auth.uid() = user_id);

-- Meal plans, shopping lists, reactions: only own
CREATE POLICY "meal_plans_own" ON meal_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "shopping_lists_own" ON shopping_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "recipe_reactions_own" ON recipe_reactions FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- STORAGE BUCKET (for scanned recipe images)
-- ─────────────────────────────────────────
-- Run this separately in Supabase dashboard > Storage:
-- Create bucket named "recipe-images" with public access = false
-- Then add policy: Users can upload to their own folder (recipe-images/{user_id}/*)
