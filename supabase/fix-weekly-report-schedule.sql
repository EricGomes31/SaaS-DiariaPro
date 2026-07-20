-- ============================================================================
-- HORÁRIO DE ENVIO ESCOLHIDO PELO USUÁRIO — relatório semanal
--
-- 1) Habilita as extensões pg_cron (agendador) e pg_net (chamadas HTTP).
-- 2) Adiciona a coluna send_hour em report_subscribers (hora de Brasília,
--    0–23; padrão 12 = meio-dia). Cada responsável escolhe o horário na tela.
-- 3) Cria o job que roda DE HORA EM HORA — a função send-weekly-report envia
--    apenas para quem escolheu aquele dia da semana + aquele horário.
--
-- Como usar: Supabase Dashboard → SQL Editor → colar e executar.
-- Depois, publique a função atualizada:
--   supabase functions deploy send-weekly-report
-- ============================================================================

-- 1) Extensões (idempotente — não faz nada se já estiverem ativas)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2) Coluna do horário de envio (hora de Brasília)
alter table public.report_subscribers
  add column if not exists send_hour int not null default 12;

do $$ begin
  alter table public.report_subscribers
    add constraint report_subscribers_send_hour_check check (send_hour between 0 and 23);
exception when duplicate_object then null; end $$;

-- 3) Remove qualquer job antigo da função e cria o job de hora em hora.
--    A chave abaixo é a publishable (pública) do projeto — a mesma usada pelo
--    site; ela só permite invocar a função, os dados seguem protegidos por RLS.
select cron.unschedule(jobid)
from cron.job
where command ilike '%send-weekly-report%';

select cron.schedule(
  'send-weekly-report-hourly',
  '0 * * * *',  -- a cada hora cheia; o filtro de dia/horário fica na função
  $job$
  select net.http_post(
    url     := 'https://cuqljxadqdrjieqkvuqp.supabase.co/functions/v1/send-weekly-report',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'apikey',        'sb_publishable__65DYAK3KZfLZE0GgcqenA_cqTvJbrq',
      'Authorization', 'Bearer sb_publishable__65DYAK3KZfLZE0GgcqenA_cqTvJbrq'
    ),
    body := '{}'::jsonb
  );
  $job$
);

-- 4) Conferir: deve listar o job com schedule "0 * * * *"
select jobid, jobname, schedule, active
from cron.job
where jobname = 'send-weekly-report-hourly';
