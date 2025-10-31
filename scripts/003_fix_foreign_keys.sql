-- Add foreign key relationship from game_scores to profiles
-- This allows Supabase to automatically join these tables

-- First, drop the existing foreign key to auth.users
alter table public.game_scores 
  drop constraint if exists game_scores_user_id_fkey;

-- Add foreign key to profiles instead
alter table public.game_scores
  add constraint game_scores_user_id_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;

-- Do the same for learning_progress
alter table public.learning_progress
  drop constraint if exists learning_progress_user_id_fkey;

alter table public.learning_progress
  add constraint learning_progress_user_id_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;
