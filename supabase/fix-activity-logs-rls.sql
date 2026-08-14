-- Fix: activity_logs ainda tinha a policy permissiva "acesso_autenticado"
-- (auth.role() = 'authenticated') → logs de auditoria vazavam entre contas.
-- Mesmo padrão das outras tabelas: dá dono às linhas órfãs, garante NOT NULL,
-- remove policies permissivas e recria só a policy de isolamento.
--
-- ⚠️ Troque o e-mail se a conta dona for outra. Roda como transação.

begin;

-- 1) Atribui logs órfãos (user_id NULL) à conta principal.
do $$
declare owner_id uuid;
begin
  select id into owner_id from auth.users where email = 'eric.outubro@gmail.com';
  if owner_id is null then
    raise exception 'Conta dona não encontrada — ajuste o e-mail.';
  end if;
  update public.activity_logs set user_id = owner_id where user_id is null;
end $$;

-- 2) Garante default + NOT NULL.
alter table public.activity_logs alter column user_id set default auth.uid();
alter table public.activity_logs alter column user_id set not null;

-- 3) Remove todas as policies (limpa a permissiva) e recria a correta.
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
             where schemaname = 'public' and tablename = 'activity_logs'
  loop
    execute format('drop policy if exists %I on public.activity_logs', pol.policyname);
  end loop;
end $$;

create policy "Isolamento por usuário" on public.activity_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
