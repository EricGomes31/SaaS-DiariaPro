-- Migration: tabela daily_expenses (Gastos Diários — refeições)
-- Rode este arquivo no SQL Editor do Supabase. Seguro para banco já existente:
-- não apaga nada (usa "if not exists" / "if exists").

-- id = 'default' guarda os preços padrão por pessoa.
-- id = 'yyyy-MM-dd' guarda o override de preços de um dia específico.
create table if not exists public.daily_expenses (
  id               text primary key,
  date             text not null,
  breakfast_price  numeric,
  lunch_price      numeric,
  snack_price      numeric,
  snack_active     boolean,
  user_id          uuid references auth.users(id) on delete cascade not null default auth.uid()
);

-- Para quem já criou a tabela na versão anterior: adiciona a coluna do lanche.
alter table public.daily_expenses add column if not exists snack_active boolean;

alter table public.daily_expenses enable row level security;

drop policy if exists "Usuários gerenciam seus gastos diários" on public.daily_expenses;
create policy "Usuários gerenciam seus gastos diários"
  on public.daily_expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Realtime. Se já estiver na publicação, o Postgres retorna erro — pode ignorar.
do $$
begin
  alter publication supabase_realtime add table public.daily_expenses;
exception
  when duplicate_object then null;
end $$;
