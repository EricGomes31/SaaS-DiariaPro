-- Diária Pro — Schema
-- Execute este arquivo no SQL Editor do seu projeto Supabase.

-- ─── Drop (ordem inversa de dependências) ───────────────────────────────────
drop table if exists public.daily_expenses      cascade;
drop table if exists public.holidays            cascade;
drop table if exists public.payment_records     cascade;
drop table if exists public.work_days           cascade;
drop table if exists public.workers             cascade;
drop table if exists public.location_job_titles cascade;
drop table if exists public.location_departments cascade;
drop table if exists public.location_schedules  cascade;
drop table if exists public.locations           cascade;

-- ─── Locations ──────────────────────────────────────────────────────────────
create table public.locations (
  id           text primary key,
  name         text not null,
  color        text,
  short_name   text,
  address      text,
  city         text,
  user_id      uuid references auth.users(id) on delete cascade not null default auth.uid()
);

alter table public.locations enable row level security;

create policy "Usuários gerenciam seus locais"
  on public.locations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Departamentos por local ─────────────────────────────────────────────────
create table public.location_departments (
  id           text primary key,
  location_id  text not null references public.locations(id) on delete cascade,
  name         text not null,
  user_id      uuid references auth.users(id) on delete cascade not null default auth.uid()
);

alter table public.location_departments enable row level security;

create policy "Usuários gerenciam seus departamentos"
  on public.location_departments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Cargos por local (com valor de diária) ─────────────────────────────────
create table public.location_job_titles (
  id             text primary key,
  location_id    text not null references public.locations(id) on delete cascade,
  name           text not null,
  weekday_rate   numeric,
  saturday_rate  numeric,
  sunday_rate    numeric,
  user_id        uuid references auth.users(id) on delete cascade not null default auth.uid()
);

alter table public.location_job_titles enable row level security;

create policy "Usuários gerenciam seus cargos"
  on public.location_job_titles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Horários de trabalho por local ──────────────────────────────────────────
create table public.location_schedules (
  id           text primary key,
  location_id  text not null references public.locations(id) on delete cascade,
  name         text not null,
  user_id      uuid references auth.users(id) on delete cascade not null default auth.uid()
);

alter table public.location_schedules enable row level security;

create policy "Usuários gerenciam seus horários"
  on public.location_schedules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Workers ────────────────────────────────────────────────────────────────
create table public.workers (
  id            text primary key,
  name          text not null,
  department    text,
  job_title     text,
  weekday_rate  numeric,
  weekend_rate  numeric,
  locations     text[],
  schedule      text,
  status        text default 'active',
  avatar        text,
  avatar_color  text,
  phone         text,
  email         text,
  start_date    text,
  pix_key_type  text,
  pix_key       text,
  user_id       uuid references auth.users(id) on delete cascade not null default auth.uid()
);

alter table public.workers enable row level security;

create policy "Usuários gerenciam seus diaristas"
  on public.workers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Work Days ──────────────────────────────────────────────────────────────
create table public.work_days (
  id           text primary key,
  worker_id    text references public.workers(id) on delete cascade,
  date         text not null,
  location_id  text,
  is_weekend   boolean default false,
  rate         numeric,
  earnings     numeric,
  overtime     numeric default 0,
  bonus        numeric default 0,
  user_id      uuid references auth.users(id) on delete cascade not null default auth.uid()
);

alter table public.work_days enable row level security;

create policy "Usuários gerenciam seus dias de trabalho"
  on public.work_days for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Payment Records ────────────────────────────────────────────────────────
create table public.payment_records (
  id                text primary key,
  worker_id         text,
  period            text,
  month_str         text,
  total_days        integer,
  weekday_days      integer,
  weekend_days      integer,
  weekday_earnings  numeric,
  weekend_earnings  numeric,
  total             numeric,
  status            text,
  paid_date         text,
  work_day_ids      text[],
  user_id           uuid references auth.users(id) on delete cascade not null default auth.uid()
);

alter table public.payment_records enable row level security;

create policy "Usuários gerenciam seus pagamentos"
  on public.payment_records for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Holidays ───────────────────────────────────────────────────────────────
create table public.holidays (
  id       bigint generated by default as identity primary key,
  date     text not null,
  user_id  uuid references auth.users(id) on delete cascade not null default auth.uid()
);

alter table public.holidays enable row level security;

create policy "Usuários gerenciam seus feriados"
  on public.holidays for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Daily Expenses (gastos de refeições) ───────────────────────────────────
-- id = 'default' guarda os preços padrão por pessoa; id = 'yyyy-MM-dd' é o override de um dia.
create table public.daily_expenses (
  id               text not null,
  date             text not null,
  breakfast_price  numeric,
  lunch_price      numeric,
  snack_price      numeric,
  snack_active     boolean,   -- linha 'default': lanche todo dia? · linha do dia: override (null = herda)
  snack_excluded   text[],    -- worker_ids que NÃO recebem o lanche naquele dia (null/vazio = todos)
  user_id          uuid references auth.users(id) on delete cascade not null default auth.uid(),
  primary key (user_id, id)  -- PK composta: cada usuário tem seus próprios 'default'/'yyyy-MM-dd'
);

alter table public.daily_expenses enable row level security;

create policy "Usuários gerenciam seus gastos diários"
  on public.daily_expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Realtime ────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.workers;
alter publication supabase_realtime add table public.work_days;
alter publication supabase_realtime add table public.locations;
alter publication supabase_realtime add table public.location_departments;
alter publication supabase_realtime add table public.location_job_titles;
alter publication supabase_realtime add table public.location_schedules;
alter publication supabase_realtime add table public.payment_records;
alter publication supabase_realtime add table public.holidays;
alter publication supabase_realtime add table public.daily_expenses;
