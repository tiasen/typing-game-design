-- Create profiles table for user information
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_color text default '#FF6B6B',
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Create learning_progress table to track user progress through stages
create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stage_id integer not null,
  completed boolean default false,
  stars integer default 0,
  best_wpm integer default 0,
  best_accuracy decimal default 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  unique(user_id, stage_id)
);

alter table public.learning_progress enable row level security;

create policy "learning_progress_select_own"
  on public.learning_progress for select
  using (auth.uid() = user_id);

create policy "learning_progress_insert_own"
  on public.learning_progress for insert
  with check (auth.uid() = user_id);

create policy "learning_progress_update_own"
  on public.learning_progress for update
  using (auth.uid() = user_id);

-- Create game_scores table for game results
create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stage_id integer not null,
  game_type text not null,
  wpm integer not null,
  accuracy decimal not null,
  score integer not null,
  duration integer not null,
  created_at timestamp with time zone default now()
);

alter table public.game_scores enable row level security;

create policy "game_scores_select_all"
  on public.game_scores for select
  using (true);

create policy "game_scores_insert_own"
  on public.game_scores for insert
  with check (auth.uid() = user_id);

-- Create indexes for better query performance
create index if not exists idx_learning_progress_user_id on public.learning_progress(user_id);
create index if not exists idx_game_scores_user_id on public.game_scores(user_id);
create index if not exists idx_game_scores_stage_id on public.game_scores(stage_id);
create index if not exists idx_game_scores_created_at on public.game_scores(created_at desc);
