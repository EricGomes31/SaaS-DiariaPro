import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as Sentry from 'npm:@sentry/deno@^8'

// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente pelo Supabase.
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERV_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// SENTRY_DSN precisa ser configurado como secret desta função (supabase secrets set).
// Sem ele, Sentry.init fica inerte — não quebra a função.
Sentry.init({ dsn: Deno.env.get('SENTRY_DSN'), defaultIntegrations: false })

const EVENT_TYPES = ['chegada', 'saida_almoco', 'volta_almoco', 'saida']

// ⚠️ Mantenha em sincronia com isWeekendOrHoliday/getWorkerDayRate em
// src/data/mockData.js — duplicado aqui (em vez de importado) porque as
// Edge Functions deste projeto são coladas direto no editor do Supabase
// Dashboard, que não resolve imports entre arquivos da função.
function dayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}
function isWeekendOrHoliday(dateStr: string, holidays: string[]): boolean {
  const d = dayOfWeek(dateStr)
  return d === 0 || d === 6 || holidays.includes(dateStr)
}
function getWorkerDayRate(
  worker: { weekdayRate: number; saturdayRate?: number | null; sundayRate?: number | null },
  dateStr: string,
  holidays: string[],
): number {
  const d = dayOfWeek(dateStr)
  if (holidays.includes(dateStr) || d === 0) return worker.sundayRate ?? worker.weekdayRate
  if (d === 6) return worker.saturdayRate ?? worker.weekdayRate
  return worker.weekdayRate
}
function todayInBrazil(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const get = (type: string) => parts.find(p => p.type === type)!.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERV_KEY)
    const body = await req.json().catch(() => ({}))
    const token: string      = body.token ?? ''
    const workerId: string   = body.workerId ?? ''
    const eventType: string  = body.eventType ?? ''

    if (!token) return json({ error: 'token obrigatório' }, 400)
    if (!workerId) return json({ error: 'workerId obrigatório' }, 400)
    if (!EVENT_TYPES.includes(eventType)) return json({ error: 'eventType inválido' }, 400)

    // 1) Resolve a conta a partir do token. Toda query a seguir filtra
    //    explicitamente por user_id (service_role ignora RLS).
    const { data: kiosk, error: kioskErr } = await supabase
      .from('kiosk_tokens')
      .select('user_id, location_id')
      .eq('token', token)
      .maybeSingle()
    if (kioskErr) throw kioskErr
    if (!kiosk) return json({ error: 'token inválido' }, 401)
    const userId = kiosk.user_id as string

    // 2) Confirma que o diarista pertence a essa conta e está ativo.
    const { data: worker, error: workerErr } = await supabase
      .from('workers')
      .select('id, weekday_rate, weekend_rate, sunday_rate, locations, status')
      .eq('id', workerId)
      .eq('user_id', userId)
      .maybeSingle()
    if (workerErr) throw workerErr
    if (!worker || worker.status !== 'active') return json({ error: 'diarista não encontrado' }, 404)

    // 3) Data de hoje em horário de Brasília (o servidor roda em UTC — perto
    //    da meia-noite isso evita cair no dia errado) e o instante do evento.
    const date = todayInBrazil()
    const occurredAt = new Date().toISOString()

    // 4) Grava o ponto — idempotente: um clique duplo ou uma nova tentativa
    //    de rede não cria dois registros do mesmo evento no mesmo dia.
    const { error: insertErr } = await supabase
      .from('attendance_events')
      .upsert(
        { worker_id: workerId, date, event_type: eventType, occurred_at: occurredAt, user_id: userId },
        { onConflict: 'worker_id,date,event_type', ignoreDuplicates: true },
      )
    if (insertErr) throw insertErr

    // Sempre devolve o horário realmente gravado (pode já existir de uma
    // tentativa anterior, se a inserção acima foi ignorada por já existir).
    const { data: savedEvent, error: savedErr } = await supabase
      .from('attendance_events')
      .select('occurred_at')
      .eq('worker_id', workerId).eq('date', date).eq('event_type', eventType)
      .maybeSingle()
    if (savedErr) throw savedErr

    // 5) Só a chegada garante a linha de presença do dia (que alimenta o
    //    cálculo de diária/pagamento já existente). Não mexe em um dia que
    //    o gestor já tenha registrado manualmente.
    if (eventType === 'chegada') {
      const { data: existingDay, error: existingErr } = await supabase
        .from('work_days')
        .select('id')
        .eq('worker_id', workerId).eq('date', date)
        .maybeSingle()
      if (existingErr) throw existingErr

      if (!existingDay) {
        const { data: holidayRows, error: holErr } = await supabase
          .from('holidays').select('date').eq('user_id', userId)
        if (holErr) throw holErr
        const holidays = (holidayRows ?? []).map(h => h.date as string)

        const rateWorker = {
          weekdayRate: worker.weekday_rate,
          saturdayRate: worker.weekend_rate ?? worker.weekday_rate,
          sundayRate: worker.sunday_rate ?? worker.weekend_rate ?? worker.weekday_rate,
        }
        const rate = getWorkerDayRate(rateWorker, date, holidays)
        const locationId = kiosk.location_id ?? (worker.locations ?? [])[0] ?? null

        const { error: workDayErr } = await supabase.from('work_days').insert({
          id: `${workerId}-${date}`,
          worker_id: workerId, date, location_id: locationId,
          is_weekend: isWeekendOrHoliday(date, holidays),
          rate, earnings: rate, user_id: userId,
        })
        // Corrida rara: outra escrita criou o dia entre o select e o insert
        // acima — ignora o erro de chave duplicada, o dia já existe de qualquer forma.
        if (workDayErr && workDayErr.code !== '23505') throw workDayErr
      }
    }

    return json({ success: true, occurredAt: savedEvent?.occurred_at ?? occurredAt })
  } catch (error) {
    Sentry.captureException(error, { extra: { function: 'kiosk-checkin' } })
    await Sentry.flush(2000)
    return json({ error: String(error) }, 500)
  }
})
