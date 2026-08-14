-- Migration: departamentos e cargos por local (cargo carrega o valor da diária)
-- Rode este arquivo no SQL Editor do Supabase. Seguro para banco já existente:
-- não apaga nada (usa "if not exists" / "if exists" / "do nothing").

-- ─── Departamentos ────────────────────────────────────────────────────────────
create table if not exists public.location_departments (
  id           text primary key,
  location_id  text not null references public.locations(id) on delete cascade,
  name         text not null,
  user_id      uuid references auth.users(id) on delete cascade not null default auth.uid()
);

alter table public.location_departments enable row level security;

drop policy if exists "Usuários gerenciam seus departamentos" on public.location_departments;
create policy "Usuários gerenciam seus departamentos"
  on public.location_departments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Cargos (com valor de diária) ───────────────────────────────────────────
create table if not exists public.location_job_titles (
  id             text primary key,
  location_id    text not null references public.locations(id) on delete cascade,
  name           text not null,
  weekday_rate   numeric,
  saturday_rate  numeric,
  sunday_rate    numeric,
  user_id        uuid references auth.users(id) on delete cascade not null default auth.uid()
);

alter table public.location_job_titles enable row level security;

drop policy if exists "Usuários gerenciam seus cargos" on public.location_job_titles;
create policy "Usuários gerenciam seus cargos"
  on public.location_job_titles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Realtime ────────────────────────────────────────────────────────────────
do $$
begin
  alter publication supabase_realtime add table public.location_departments;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.location_job_titles;
exception
  when duplicate_object then null;
end $$;
