-- ============================================================================
-- FIX CRÍTICO DE ISOLAMENTO ENTRE USUÁRIOS
--
-- Problema encontrado:
--  1) Policies PERMISSIVAS ("acesso_autenticado" e outras com
--     auth.role() = 'authenticated') deixavam QUALQUER usuário logado
--     ver/editar TODOS os dados → vazamento entre contas.
--  2) 60 diaristas (e seus dias/pagamentos) ficaram sem dono (user_id NULL),
--     importados sem user_id via importar-dados.sql.
--
-- Esta migration atribui as linhas órfãs à conta principal, garante NOT NULL,
-- remove as policies permissivas e recria só a policy correta de isolamento.
--
-- ⚠️ Troque o e-mail abaixo se a conta dona dos dados importados for outra.
-- Roda como transação: se algo falhar, nada é aplicado.
-- ============================================================================

begin;

-- 1) Atribui todas as linhas órfãs (user_id NULL) à conta principal.
do $$
declare owner_id uuid;
begin
  select id into owner_id from auth.users where email = 'francisco.total@gmail.com';
  if owner_id is null then
    raise exception 'Conta dona não encontrada — ajuste o e-mail na migration.';
  end if;

  update public.workers         set user_id = owner_id where user_id is null;
  update public.work_days       set user_id = owner_id where user_id is null;
  update public.payment_records set user_id = owner_id where user_id is null;
  update public.locations       set user_id = owner_id where user_id is null;
  update public.holidays        set user_id = owner_id where user_id is null;
end $$;

-- 2) Garante default + NOT NULL no user_id (protege contra novos NULLs).
do $$
declare tbl text;
begin
  foreach tbl in array array['workers','work_days','payment_records','locations','holidays']
  loop
    execute format('alter table public.%I alter column user_id set default auth.uid()', tbl);
    execute format('alter table public.%I alter column user_id set not null', tbl);
  end loop;
end $$;

-- 3) Remove TODAS as policies dessas tabelas (limpa as permissivas).
do $$
declare pol record;
begin
  for pol in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('workers','work_days','payment_records','locations','holidays')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- 4) Recria a policy correta: cada usuário só acessa as próprias linhas.
create policy "Isolamento por usuário" on public.workers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Isolamento por usuário" on public.work_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Isolamento por usuário" on public.payment_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Isolamento por usuário" on public.locations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Isolamento por usuário" on public.holidays
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
