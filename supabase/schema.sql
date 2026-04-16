-- ============================================================
-- Forum Annotation App – Supabase Schema
-- Run this in the Supabase SQL Editor to set up the database.
-- ============================================================

-- 1. FORUM (seeded from annotation.json, read-only for users)
create table if not exists forum (
  id                text primary key,
  title             text not null,
  course            text not null,
  total_posts       integer,
  description       text,
  reference_summary text,
  created_at        timestamptz default now()
);

-- 2. ANNOTATION (one per user per forum)
create table if not exists annotation (
  id         uuid primary key default gen_random_uuid(),
  forum_id   text references forum(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  text       text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (forum_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table forum      enable row level security;
alter table annotation enable row level security;

-- FORUM policies
-- Any authenticated user can read all forums
create policy "Authenticated users can read forums"
  on forum for select
  using (auth.uid() is not null);

-- ANNOTATION policies
-- Users can only see their own annotations
create policy "Users can read own annotations"
  on annotation for select
  using (auth.uid() = user_id);

-- Users can insert their own annotations
create policy "Users can insert own annotations"
  on annotation for insert
  with check (auth.uid() = user_id);

-- Users can update their own annotations
create policy "Users can update own annotations"
  on annotation for update
  using (auth.uid() = user_id);

-- Users can delete their own annotations
create policy "Users can delete own annotations"
  on annotation for delete
  using (auth.uid() = user_id);
