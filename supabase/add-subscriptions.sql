-- Migration: tabela subscriptions (assinaturas do SaaS Diária Pro)
-- Rode este arquivo no SQL Editor do Supabase. Seguro para banco já existente:
-- não apaga nada (usa "if not exists" / "if exists" / "do nothing").
--
-- ┌─ SEGURANÇA (leia antes) ────────────────────────────────────────────────┐
-- │ O cliente (app React) só PODE LER a própria assinatura.                  │
-- │ O campo `status` é a FONTE DE VERDADE do acesso — se o app pudesse       │
-- │ escrevê-lo, qualquer um se marcaria como 'active' de graça.             │
-- │ Portanto, a ESCRITA fica só com as Edge Functions, que usam a           │
-- │ service_role key (ignora RLS): create-checkout e asaas-webhook.         │
-- └─────────────────────────────────────────────────────────────────────────┘
--
-- Mapa de planos (o worker_limit é gravado pela Edge Function ao confirmar o pagamento):
--   basico  → até 5 diaristas    (worker_limit = 5)
--   pro     → até 20 diaristas   (worker_limit = 20)
--   empresa → ilimitado          (worker_limit = null)
--   trial   → acesso liberado por 14 dias (worker_limit = null)

create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users(id) on delete cascade not null default auth.uid() unique,
  plan                   text,                                       -- 'basico' | 'pro' | 'empresa' | null (trial)
  status                 text not null default 'trialing',           -- trialing | active | past_due | canceled | inactive
  billing_cycle          text,                                       -- 'monthly' | 'annual'
  worker_limit           integer,                                    -- nº máx. de diaristas · null = ilimitado
  trial_ends_at          timestamptz default (now() + interval '14 days'),
  current_period_end     timestamptz,                                -- fim do período pago (vem do Asaas)
  asaas_customer_id      text,
  asaas_subscription_id  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- O cliente só LÊ a própria assinatura. Nenhuma policy de INSERT/UPDATE/DELETE:
-- sem elas, o RLS bloqueia escrita pelo app. As Edge Functions (service_role) ignoram RLS.
drop policy if exists "Usuários leem sua assinatura" on public.subscriptions;
create policy "Usuários leem sua assinatura"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ─── updated_at automático ───────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ─── Cria uma assinatura em trial quando um novo usuário se cadastra ─────────
-- security definer: roda com privilégios do dono da função, então o insert
-- não esbarra no RLS da tabela.
create or replace function public.handle_new_user_subscription()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id, status, trial_ends_at)
  values (new.id, 'trialing', now() + interval '14 days')
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists trg_new_user_subscription on auth.users;
create trigger trg_new_user_subscription
  after insert on auth.users
  for each row execute function public.handle_new_user_subscription();

-- ─── Backfill: cria trial para os usuários que já existem no banco ───────────
insert into public.subscriptions (user_id, status, trial_ends_at)
select id, 'trialing', now() + interval '14 days'
from auth.users
on conflict (user_id) do nothing;

-- ─── Realtime (para o app refletir a mudança de status na hora do pagamento) ─
-- Respeita RLS: cada usuário recebe só as mudanças da própria assinatura.
do $$
begin
  alter publication supabase_realtime add table public.subscriptions;
exception
  when duplicate_object then null;
end $$;
