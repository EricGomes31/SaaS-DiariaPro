-- Fix: daily_expenses.id era chave primária GLOBAL, colidindo entre usuários.
-- Sintoma: 403 (RLS) ao salvar "Preços padrão por pessoa" quando o id 'default'
-- já pertencia a outra conta. O mesmo valia para os overrides de dia ('yyyy-MM-dd').
--
-- Correção: PK composta (user_id, id) → cada usuário tem seus próprios registros.
-- Seguro rodar em banco já existente (os ids atuais continuam únicos por usuário).

alter table public.daily_expenses drop constraint if exists daily_expenses_pkey;
alter table public.daily_expenses add primary key (user_id, id);
