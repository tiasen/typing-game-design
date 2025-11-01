-- Enable delete for own learning_progress records
create policy "learning_progress_delete_own"
  on public.learning_progress for delete
  using (auth.uid() = user_id);

alter table public.learning_progress enable row level security;
