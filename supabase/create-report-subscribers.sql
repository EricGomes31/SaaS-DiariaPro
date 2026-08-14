-- ============================================================================
-- TABELA report_subscribers (faltava no repositório)
--
-- Esta tabela foi criada diretamente no SQL Editor da produção em algum
-- momento e nunca ficou registrada como migration — por isso um banco novo
-- (ex.: projeto de teste) não a tinha, causando o erro
-- "relation public.report_subscribers does not exist".
--
-- Este arquivo cria a tabela já na forma final (equivalente a rodar a versão
-- antiga + fix-report-subscribers-rls.sql + fix-weekly-report-schedule.sql
-- por cima). Rode este arquivo no lugar de fix-report-subscribers-rls.sql
-- ao montar um banco novo — os dois arquivos antigos continuam existindo e
-- são seguros de rodar depois (idempotentes), só que redundantes.
-- ============================================================================

create table if not exists public.report_subscribers (
  id          text primary key,
  name        text not null,
  email       text not null,
  day_of_week int not null check (day_of_week between 1 and 7),
  send_hour   int not null default 12 check (send_hour between 0 and 23),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  user_id     uuid references auth.users(id) on delete cascade not null default auth.uid()
);

alter table public.report_subscribers enable row level security;

do $$ begin
  create policy "Usuários gerenciam seus assinantes de relatório"
    on public.report_subscribers for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
