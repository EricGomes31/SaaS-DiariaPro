-- ============================================================================
-- COLUNAS FALTANDO em public.workers (mesmo caso de report_subscribers e
-- activity_logs: foram adicionadas direto no SQL Editor da produção, nunca
-- ficaram registradas como migration em nenhum arquivo do repositório).
--
-- sunday_rate  — diária de domingo/feriado (separada de weekend_rate/sábado)
-- worker_type  — 'diarista' | 'funcionario'
-- ============================================================================

alter table public.workers add column if not exists sunday_rate numeric;
alter table public.workers add column if not exists worker_type text default 'diarista';
