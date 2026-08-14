-- Migration: horários de trabalho por local
-- Rode este arquivo no SQL Editor do Supabase. Seguro para banco já existente:
-- não apaga nada (usa "if not exists" / "if exists" / "do nothing").

create table if not exists public.location_schedules (
  id           text primary key,
  location_id  text not null references public.locations(id) on delete cascade,
  name         text not null,
  user_id      uuid references auth.users(id) on delete cascade not null default auth.uid()
);

alter table public.location_schedules enable row level security;

drop policy if exists "Usuários gerenciam seus horários" on public.location_schedules;
create policy "Usuários gerenciam seus horários"
  on public.location_schedules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

do $$
begin
  alter publication supabase_realtime add table public.location_schedules;
exception
  when duplicate_object then null;
end $$;
