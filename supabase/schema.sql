-- Run this in the Supabase SQL editor
-- https://app.supabase.com → your project → SQL editor

-- ============================================================
-- Profiles table (extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  plan text default 'free' check (plan in ('free', 'plus', 'family')),
  stripe_customer_id text,
  household_size int default 2,
  dietary_restrictions text[] default '{}',
  cuisine_preferences text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Meal plans
-- ============================================================
create table if not exists public.meal_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  week_start date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Meal plan entries (one per day)
-- ============================================================
create table if not exists public.meal_plan_entries (
  id uuid default gen_random_uuid() primary key,
  meal_plan_id uuid references public.meal_plans(id) on delete cascade,
  day_date date not null,
  recipe_id text not null,
  recipe_data jsonb not null, -- full recipe object snapshot
  unique(meal_plan_id, day_date)
);

-- ============================================================
-- Shopping lists
-- ============================================================
create table if not exists public.shopping_lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  week_start date not null,
  items jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Custom recipes (from scanning)
-- ============================================================
create table if not exists public.custom_recipes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  recipe_data jsonb not null,
  scan_image_url text,
  created_at timestamptz default now()
);

-- ============================================================
-- Liked / disliked recipes
-- ============================================================
create table if not exists public.recipe_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  recipe_id text not null,
  liked boolean not null,
  created_at timestamptz default now(),
  unique(user_id, recipe_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_entries enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.custom_recipes enable row level security;
alter table public.recipe_preferences enable row level security;

-- Profiles
create policy "Users can manage own profile"
  on public.profiles for all
  using (auth.uid() = id);

-- Meal plans
create policy "Users can manage own meal plans"
  on public.meal_plans for all
  using (auth.uid() = user_id);

-- Meal plan entries (access via parent meal_plan)
create policy "Users can manage own entries"
  on public.meal_plan_entries for all
  using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id and mp.user_id = auth.uid()
    )
  );

-- Shopping lists
create policy "Users can manage own shopping"
  on public.shopping_lists for all
  using (auth.uid() = user_id);

-- Custom recipes
create policy "Users can manage own recipes"
  on public.custom_recipes for all
  using (auth.uid() = user_id);

-- Recipe preferences
create policy "Users can manage own preferences"
  on public.recipe_preferences for all
  using (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on signup trigger
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

-- Drop and recreate trigger to avoid duplicates on re-run
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
