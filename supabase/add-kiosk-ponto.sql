-- ============================================================================
-- PONTO POR RECONHECIMENTO FACIAL — quiosque de check-in
--
-- 1) workers ganha o descritor facial de referência (cadastrado uma vez pelo
--    gestor) + carimbo de consentimento LGPD.
-- 2) kiosk_tokens: um token opaco por conta, usado pelo tablet/celular fixo
--    no local de trabalho (sem login) para se identificar às Edge Functions.
-- 3) attendance_events: os 4 registros do dia (chegada, saída/volta do
--    almoço, saída) — uma linha por evento, não mistura com work_days.
--
-- Rode este script inteiro no SQL Editor do Supabase.
-- ⚠️ supabase/schema.sql está desatualizado em relação ao banco real — não
-- use apenas ele como referência; todos os comandos abaixo são idempotentes
-- (IF NOT EXISTS) e seguros de rodar mais de uma vez.
-- ============================================================================

-- 1) Rosto de referência do diarista
alter table public.workers add column if not exists face_descriptor jsonb;
alter table public.workers add column if not exists face_enrolled_at timestamptz;
alter table public.workers add column if not exists face_consent_at timestamptz;

-- 2) Token do quiosque (um por conta)
create table if not exists public.kiosk_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  token       text not null unique,
  location_id text references public.locations(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.kiosk_tokens enable row level security;

do $$ begin
  create policy "Usuário gerencia seu próprio token de quiosque"
    on public.kiosk_tokens for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- 3) Eventos de ponto (um por worker+data+tipo — evita duplicar em cliques
--    repetidos ou retentativas de rede)
create table if not exists public.attendance_events (
  id          uuid primary key default gen_random_uuid(),
  worker_id   text references public.workers(id) on delete cascade not null,
  date        text not null,
  event_type  text not null check (event_type in ('chegada', 'saida_almoco', 'volta_almoco', 'saida')),
  occurred_at timestamptz not null default now(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  unique (worker_id, date, event_type)
);
alter table public.attendance_events enable row level security;

do $$ begin
  create policy "Usuário gerencia os pontos de seus diaristas"
    on public.attendance_events for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Atualização em tempo real no painel (mesmo mecanismo já usado por
-- workers/work_days/etc.)
do $$ begin
  alter publication supabase_realtime add table public.attendance_events;
exception when duplicate_object then null; end $$;

-- Índices de apoio às consultas do quiosque e do perfil do diarista
create index if not exists idx_attendance_events_worker_date on public.attendance_events (worker_id, date);
create index if not exists idx_workers_face_descriptor on public.workers (id) where face_descriptor is not null;
