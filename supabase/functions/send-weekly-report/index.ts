import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as Sentry from 'npm:@sentry/deno@^8'

const RESEND_API_KEY    = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERV_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM_EMAIL        = Deno.env.get('FROM_EMAIL') ?? 'Diária Pro <noreply@diariapro.com.br>'

// SENTRY_DSN precisa ser configurado como secret desta função (supabase secrets set).
// Sem ele, Sentry.init fica inerte — não quebra a função.
Sentry.init({ dsn: Deno.env.get('SENTRY_DSN'), defaultIntegrations: false })

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERV_KEY)
    const body     = await req.json().catch(() => ({}))
    const force    = body.force === true

    // ── Brazil timezone ────────────────────────────────────────────────────────
    const brStr  = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    const brDate = new Date(brStr)
    const jsDow  = brDate.getDay()
    const dow    = jsDow === 0 ? 7 : jsDow
    const brHour = brDate.getHours()

    // ── Subscribers (dia da semana + horário escolhidos pelo usuário) ─────────
    let q = supabase.from('report_subscribers').select('*').eq('active', true)
    if (!force) q = q.eq('day_of_week', dow).eq('send_hour', brHour)
    const { data: subscribers, error: subErr } = await q
    if (subErr) throw subErr
    if (!subscribers?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: `no subscribers for dow=${dow} hour=${brHour}` }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    // ── Load all data ──────────────────────────────────────────────────────────
    const [wRes, dRes, pRes, lRes] = await Promise.all([
      supabase.from('workers').select('*'),
      supabase.from('work_days').select('*'),
      supabase.from('payment_records').select('*'),
      supabase.from('locations').select('*'),
    ])
    if (wRes.error) throw wRes.error
    if (dRes.error) throw dRes.error
    if (pRes.error) throw pRes.error

    const workers  = wRes.data ?? []
    const workDays = dRes.data ?? []
    const payments = pRes.data ?? []
    const locations = lRes.data ?? []

    // ── Date ranges ────────────────────────────────────────────────────────────
    const toStr = (d: Date) => d.toISOString().split('T')[0]

    const wIdx     = jsDow === 0 ? 6 : jsDow - 1
    const weekStart = new Date(brDate); weekStart.setDate(brDate.getDate() - wIdx)
    const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
    const weekS = toStr(weekStart)
    const weekE = toStr(weekEnd)

    const prevWeekStart = new Date(weekStart); prevWeekStart.setDate(weekStart.getDate() - 7)
    const prevWeekEnd   = new Date(weekEnd);   prevWeekEnd.setDate(weekEnd.getDate() - 7)
    const prevWeekS = toStr(prevWeekStart)
    const prevWeekE = toStr(prevWeekEnd)

    const monthPfx   = `${brDate.getFullYear()}-${String(brDate.getMonth() + 1).padStart(2, '0')}`
    const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
    const monthName = MONTHS[brDate.getMonth()]
    const year = brDate.getFullYear()

    // ── Compute stats ──────────────────────────────────────────────────────────
    const weekDays     = workDays.filter(d => d.date >= weekS && d.date <= weekE)
    const prevWeekDays = workDays.filter(d => d.date >= prevWeekS && d.date <= prevWeekE)
    const monthDays    = workDays.filter(d => d.date.startsWith(monthPfx))

    // Worker is paid if they have any payment record paid this month OR with work_day_ids
    // covering their month work days (month_str may be null in older records)
    const paidThisMonth = new Set(
      payments.filter(p =>
        (p.paid_date && p.paid_date.startsWith(monthPfx)) ||
        (p.month_str && p.month_str === monthPfx)
      ).map(p => p.worker_id)
    )

    const totalWeekEarnings     = weekDays.reduce((s, d) => s + (d.earnings ?? 0), 0)
    const totalPrevWeekEarnings = prevWeekDays.reduce((s, d) => s + (d.earnings ?? 0), 0)
    const totalMonthEarnings    = monthDays.reduce((s, d) => s + (d.earnings ?? 0), 0)

    const weekChange = totalPrevWeekEarnings > 0
      ? ((totalWeekEarnings - totalPrevWeekEarnings) / totalPrevWeekEarnings) * 100
      : 0

    const workerStats = workers.map(w => {
      const wWeek  = weekDays.filter(d => d.worker_id === w.id)
      const wMonth = monthDays.filter(d => d.worker_id === w.id)
      const weekdayDays  = wWeek.filter(d => !d.is_weekend)
      const weekendDays  = wWeek.filter(d => d.is_weekend)
      return {
        name:           w.name,
        weekDays:       wWeek.length,
        weekdayDays:    weekdayDays.length,
        weekendDays:    weekendDays.length,
        weekEarnings:   wWeek.reduce((s, d) => s + (d.earnings ?? 0), 0),
        monthDays:      wMonth.length,
        monthEarnings:  wMonth.reduce((s, d) => s + (d.earnings ?? 0), 0),
        paid:           paidThisMonth.has(w.id),
      }
    }).filter(w => w.weekDays > 0 || w.monthDays > 0)
      .sort((a, b) => b.monthEarnings - a.monthEarnings)

    const pendingWorkers = workerStats.filter(w => !w.paid && w.monthDays > 0)
    const paidWorkers    = workerStats.filter(w => w.paid)
    const activeThisWeek = workerStats.filter(w => w.weekDays > 0).length

    // Location breakdown this week
    const locationStats = locations.map(l => {
      const days = weekDays.filter(d => d.location_id === l.id)
      return { name: l.name, days: days.length, earnings: days.reduce((s, d) => s + (d.earnings ?? 0), 0) }
    }).filter(l => l.days > 0).sort((a, b) => b.earnings - a.earnings)

    const fmt   = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    const fmtN  = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    const html  = buildEmailHtml({
      weekS, weekE, monthName, year: String(year),
      workerStats, totalWeekEarnings, totalPrevWeekEarnings, totalMonthEarnings,
      weekChange, pendingWorkers, paidWorkers, activeThisWeek, locationStats, fmt, fmtN,
    })

    // ── Send ───────────────────────────────────────────────────────────────────
    let sent = 0
    const errors: string[] = []
    for (const sub of subscribers) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    FROM_EMAIL,
          to:      [sub.email],
          subject: `📊 Relatório Semanal — ${weekS} a ${weekE} | Diária Pro`,
          html,
        }),
      })
      if (res.ok) sent++
      else errors.push(`${sub.email}: ${await res.text()}`)
    }

    return new Response(JSON.stringify({ sent, total: subscribers.length, errors }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
  } catch (err) {
    Sentry.captureException(err, { extra: { function: 'send-weekly-report' } })
    await Sentry.flush(2000)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }
})

// ── Email template ─────────────────────────────────────────────────────────────
function buildEmailHtml({ weekS, weekE, monthName, year, workerStats, totalWeekEarnings, totalPrevWeekEarnings, totalMonthEarnings, weekChange, pendingWorkers, paidWorkers, activeThisWeek, locationStats, fmt, fmtN }: any) {

  const changeColor  = weekChange >= 0 ? '#10b981' : '#ef4444'
  const changeArrow  = weekChange >= 0 ? '▲' : '▼'
  const changeAbs    = Math.abs(weekChange).toFixed(1)
  const totalWorkers = workerStats.length

  // ── Worker rows ────────────────────────────────────────────────────────────
  const workerRows = workerStats.length ? workerStats.map((w: any, i: number) => {
    const statusBg    = w.paid ? '#f0fdf4' : (w.monthDays > 0 ? '#fef2f2' : '#f8fafc')
    const statusColor = w.paid ? '#16a34a' : (w.monthDays > 0 ? '#dc2626' : '#94a3b8')
    const statusText  = w.paid ? 'Pago' : (w.monthDays > 0 ? 'Pendente' : '—')
    const medal       = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`
    return `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}">
      <td style="padding:13px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#1e293b">
        <span style="margin-right:6px">${medal}</span>${w.name}
      </td>
      <td style="padding:13px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px;color:#6366f1;font-weight:700">${w.weekDays > 0 ? w.weekDays : '—'}</td>
      <td style="padding:13px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:11px;color:#64748b">
        ${w.weekdayDays > 0 ? `<span style="color:#6366f1">${w.weekdayDays}U</span>` : ''}${w.weekdayDays > 0 && w.weekendDays > 0 ? ' + ' : ''}${w.weekendDays > 0 ? `<span style="color:#f59e0b">${w.weekendDays}F</span>` : ''}${w.weekDays === 0 ? '—' : ''}
      </td>
      <td style="padding:13px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;font-weight:700;color:#10b981">${w.weekDays > 0 ? `R$ ${fmt(w.weekEarnings)}` : '—'}</td>
      <td style="padding:13px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;font-weight:700;color:#6366f1">R$ ${fmt(w.monthEarnings)}</td>
      <td style="padding:13px 16px;border-bottom:1px solid #f1f5f9;text-align:center">
        <span style="display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;background:${statusBg};color:${statusColor}">${statusText}</span>
      </td>
    </tr>`
  }).join('') : `<tr><td colspan="6" style="padding:24px;text-align:center;color:#94a3b8;font-size:14px">Nenhum diarista ativo no período</td></tr>`

  // ── Location rows ──────────────────────────────────────────────────────────
  const locationRows = locationStats.length ? locationStats.map((l: any) => `
    <tr>
      <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b">${l.name}</td>
      <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px;font-weight:600;color:#6366f1">${l.days}</td>
      <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;font-weight:700;color:#10b981">R$ ${fmt(l.earnings)}</td>
    </tr>`).join('') : `<tr><td colspan="3" style="padding:16px;text-align:center;color:#94a3b8;font-size:13px">Sem dados de local esta semana</td></tr>`

  // ── Pending section ────────────────────────────────────────────────────────
  const pendingSection = pendingWorkers.length ? `
  <div style="margin:0 32px 32px;background:#fff5f5;border:1px solid #fecaca;border-radius:14px;overflow:hidden">
    <div style="padding:16px 20px;background:#fef2f2;border-bottom:1px solid #fecaca;display:flex;align-items:center;gap:10px">
      <span style="font-size:18px">⚠️</span>
      <span style="font-size:15px;font-weight:700;color:#dc2626">Pagamentos Pendentes (${pendingWorkers.length})</span>
      <span style="margin-left:auto;font-size:12px;color:#ef4444;font-weight:600">Ação necessária</span>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#fef9f9">
        <th style="padding:10px 16px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em">Diarista</th>
        <th style="padding:10px 16px;text-align:center;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em">Dias no mês</th>
        <th style="padding:10px 16px;text-align:right;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em">Valor a pagar</th>
      </thead></tr>
      <tbody>
        ${pendingWorkers.map((w: any) => `
        <tr>
          <td style="padding:13px 16px;border-top:1px solid #fecaca;font-size:13px;font-weight:600;color:#1e293b">${w.name}</td>
          <td style="padding:13px 16px;border-top:1px solid #fecaca;text-align:center;font-size:13px;color:#64748b">${w.monthDays} dias</td>
          <td style="padding:13px 16px;border-top:1px solid #fecaca;text-align:right;font-size:14px;font-weight:800;color:#dc2626">R$ ${fmt(w.monthEarnings)}</td>
        </tr>`).join('')}
        <tr style="background:#fef2f2">
          <td colspan="2" style="padding:12px 16px;font-size:13px;font-weight:700;color:#dc2626">Total pendente</td>
          <td style="padding:12px 16px;text-align:right;font-size:15px;font-weight:800;color:#dc2626">R$ ${fmt(pendingWorkers.reduce((s: number, w: any) => s + w.monthEarnings, 0))}</td>
        </tr>
      </tbody>
    </table>
  </div>` : `
  <div style="margin:0 32px 32px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:20px 24px;display:table;width:calc(100% - 64px);box-sizing:border-box">
    <span style="font-size:22px;vertical-align:middle;margin-right:12px">✅</span>
    <span style="font-size:15px;font-weight:700;color:#16a34a;vertical-align:middle">Todos os pagamentos do mês estão em dia!</span>
    <span style="display:block;margin-top:6px;font-size:13px;color:#15803d;padding-left:34px">${paidWorkers.length} diarista(s) com pagamento confirmado este mês.</span>
  </div>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Relatório Semanal — Diária Pro</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased">
<div style="max-width:640px;margin:28px auto;padding:0 8px">

  <!-- Card wrapper -->
  <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10)">

    <!-- ── Header ─────────────────────────────────────────── -->
    <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#6d28d9 100%);padding:36px 36px 30px;position:relative">
      <!-- Logo -->
      <table style="width:100%;margin-bottom:22px"><tr>
        <td>
          <table><tr>
            <td style="width:44px;height:44px;background:rgba(255,255,255,0.18);border-radius:12px;text-align:center;vertical-align:middle">
              <span style="font-size:22px;font-weight:900;color:#fff;line-height:44px">D</span>
            </td>
            <td style="padding-left:12px;vertical-align:middle">
              <div style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.02em">Diária Pro</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:.1em">Gestão de Diaristas</div>
            </td>
          </tr></table>
        </td>
        <td style="text-align:right;vertical-align:top">
          <span style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:99px;padding:5px 14px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.9);text-transform:uppercase;letter-spacing:.06em">Semanal</span>
        </td>
      </tr></table>
      <!-- Title -->
      <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.02em">Relatório da Semana</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.65)">📅 ${weekS} até ${weekE} &nbsp;·&nbsp; ${monthName} de ${year}</p>
    </div>

    <!-- ── KPI strip ───────────────────────────────────────── -->
    <table style="width:100%;border-collapse:collapse;border-bottom:1px solid #e2e8f0">
      <tr>
        <td style="width:25%;padding:22px 16px;text-align:center;border-right:1px solid #e2e8f0">
          <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px">Esta Semana</div>
          <div style="font-size:20px;font-weight:800;color:#10b981">R$ ${fmt(totalWeekEarnings)}</div>
          ${totalPrevWeekEarnings > 0 ? `<div style="font-size:11px;color:${changeColor};font-weight:600;margin-top:4px">${changeArrow} ${changeAbs}% vs anterior</div>` : ''}
        </td>
        <td style="width:25%;padding:22px 16px;text-align:center;border-right:1px solid #e2e8f0">
          <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px">Mês de ${monthName}</div>
          <div style="font-size:20px;font-weight:800;color:#6366f1">R$ ${fmt(totalMonthEarnings)}</div>
        </td>
        <td style="width:25%;padding:22px 16px;text-align:center;border-right:1px solid #e2e8f0">
          <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px">Ativos na Semana</div>
          <div style="font-size:20px;font-weight:800;color:#f59e0b">${activeThisWeek} <span style="font-size:13px;color:#94a3b8">/ ${totalWorkers}</span></div>
        </td>
        <td style="width:25%;padding:22px 16px;text-align:center">
          <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px">Pendentes</div>
          <div style="font-size:20px;font-weight:800;color:${pendingWorkers.length > 0 ? '#ef4444' : '#10b981'}">${pendingWorkers.length}</div>
        </td>
      </tr>
    </table>

    <!-- ── Worker table ────────────────────────────────────── -->
    <div style="padding:28px 32px 20px">
      <table style="width:100%;margin-bottom:6px"><tr>
        <td><h2 style="margin:0;font-size:16px;font-weight:800;color:#1e293b">👥 Diaristas — Resumo do Período</h2></td>
        <td style="text-align:right">
          <span style="font-size:11px;color:#94a3b8"><span style="color:#6366f1;font-weight:700">U</span> = Útil &nbsp; <span style="color:#f59e0b;font-weight:700">F</span> = Fim de semana</span>
        </td>
      </tr></table>
    </div>
    <div style="margin:0 32px 28px;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:linear-gradient(135deg,#f8fafc,#f1f5f9)">
            <th style="padding:11px 16px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Diarista</th>
            <th style="padding:11px 16px;text-align:center;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Dias (sem)</th>
            <th style="padding:11px 16px;text-align:center;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Tipo</th>
            <th style="padding:11px 16px;text-align:right;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Valor sem.</th>
            <th style="padding:11px 16px;text-align:right;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Total mês</th>
            <th style="padding:11px 16px;text-align:center;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Status</th>
          </tr>
        </thead>
        <tbody>${workerRows}</tbody>
      </table>
    </div>

    <!-- ── Pending / All paid ──────────────────────────────── -->
    ${pendingSection}

    <!-- ── Location breakdown ─────────────────────────────── -->
    ${locationStats.length > 0 ? `
    <div style="padding:0 32px 28px">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:800;color:#1e293b">📍 Locais — Esta Semana</h2>
      <div style="border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:linear-gradient(135deg,#f8fafc,#f1f5f9)">
            <th style="padding:11px 16px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Local</th>
            <th style="padding:11px 16px;text-align:center;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Dias</th>
            <th style="padding:11px 16px;text-align:right;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Total</th>
          </tr></thead>
          <tbody>${locationRows}</tbody>
        </table>
      </div>
    </div>` : ''}

    <!-- ── Footer ──────────────────────────────────────────── -->
    <div style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-top:1px solid #e2e8f0;padding:22px 32px">
      <table style="width:100%"><tr>
        <td>
          <div style="font-size:13px;font-weight:700;color:#6366f1">Diária Pro</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px">Relatório automático semanal</div>
        </td>
        <td style="text-align:right;vertical-align:middle">
          <span style="font-size:11px;color:#94a3b8">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}</span>
        </td>
      </tr></table>
    </div>

  </div>
  <!-- end card -->

</div>
</body>
</html>`
}
