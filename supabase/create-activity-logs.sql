-- ============================================================================
-- TABELA activity_logs (faltava no repositório — mesmo caso de
-- report_subscribers: foi criada direto no SQL Editor da produção e nunca
-- ficou registrada como migration).
--
-- Cria a tabela já na forma final (equivalente à versão antiga +
-- fix-activity-logs-rls.sql por cima). Rode este arquivo no lugar de
-- fix-activity-logs-rls.sql ao montar um banco novo — o arquivo antigo
-- continua existindo e é seguro de rodar depois, só que redundante (e
-- específico da conta de produção, não use-o num banco de teste).
-- ============================================================================

create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  action      text not null,
  description text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  user_id     uuid references auth.users(id) on delete cascade not null default auth.uid()
);

create index if not exists idx_activity_logs_user_created on public.activity_logs (user_id, created_at desc);

alter table public.activity_logs enable row level security;

do $$ begin
  create policy "Isolamento por usuário" on public.activity_logs
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
