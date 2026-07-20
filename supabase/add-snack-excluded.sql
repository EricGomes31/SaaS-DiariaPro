-- Migration: quem NÃO recebe o lanche especial, por dia.
-- Rode no SQL Editor do Supabase. Seguro para banco já existente.
--
-- Cada linha de override de dia (id = 'yyyy-MM-dd') passa a guardar um array
-- de worker_ids que ficam DE FORA do lanche naquele dia.
-- Vazio/null = todos os presentes recebem o lanche (comportamento atual).

alter table public.daily_expenses add column if not exists snack_excluded text[];
