-- Fix: report_subscribers tinha RLS ligado, mas SEM coluna user_id.
-- Resultado: a lista de assinantes do relatório era COMPARTILHADA entre todas
-- as contas (único vazamento real entre usuários). Isola por usuário.
--
-- ⚠️ Os assinantes antigos eram compartilhados (sem dono definido) e serão
-- REMOVIDOS. Recadastre os assinantes na conta correta depois de rodar.

-- 1) Coluna de dono. Novas linhas herdam o usuário logado (auth.uid()).
alter table public.report_subscribers
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

-- 2) Remove os assinantes órfãos (compartilhados, sem dono) e exige dono daqui pra frente.
delete from public.report_subscribers where user_id is null;
alter table public.report_subscribers alter column user_id set not null;

-- 3) Troca a policy permissiva pela correta (cada usuário só vê/edita os seus).
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
             where schemaname = 'public' and tablename = 'report_subscribers'
  loop
    execute format('drop policy if exists %I on public.report_subscribers', pol.policyname);
  end loop;
end $$;

create policy "Usuários gerenciam seus assinantes de relatório"
  on public.report_subscribers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
