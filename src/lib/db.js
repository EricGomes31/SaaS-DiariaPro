import { supabase } from './supabase'
import { WORKERS, WORK_DAYS, LOCATIONS, HOLIDAYS_2025 } from '../data/mockData'

// ─── Mappers (exported for realtime handlers in App.jsx) ─────────────────────

const AVATAR_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4']
function deriveAvatarColor(str = '') {
  let hash = 0
  for (const c of str) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function workerFromRow(r) {
  const weekend = r.saturday_rate ?? r.weekend_rate ?? r.weekday_rate
  const rawAvatar = (r.avatar || '').trim()
  const avatar = rawAvatar || (r.name ? r.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?')
  const rawColor = (r.avatar_color || '').trim()
  const avatarColor = (rawColor.length === 7 || rawColor.length === 4) ? rawColor : deriveAvatarColor(r.id || r.name || '')
  return {
    id: r.id, name: r.name, department: r.department,
    jobTitle: r.job_title, weekdayRate: r.weekday_rate,
    saturdayRate: r.saturday_rate ?? weekend,
    sundayRate:   r.sunday_rate   ?? weekend,
    locations: r.locations ?? [], schedule: r.schedule, status: r.status,
    avatar, avatarColor, phone: r.phone, email: r.email,
    startDate: r.start_date, pixKeyType: r.pix_key_type, pixKey: r.pix_key,
    workerType: r.worker_type ?? 'diarista',
  }
}

export function workDayFromRow(r) {
  return {
    id: r.id, workerId: r.worker_id, date: r.date,
    locationId: r.location_id, isWeekend: r.is_weekend,
    rate: r.rate ?? 0, earnings: r.earnings ?? 0,
    overtime: r.overtime ?? 0, bonus: r.bonus ?? 0,
  }
}

export function locationFromRow(r) {
  return { id: r.id, name: r.name, color: r.color, shortName: r.short_name, address: r.address, city: r.city }
}

export function dailyExpenseFromRow(r) {
  return {
    id: r.id, date: r.date,
    // null = herda o padrão (preço/lanche). A linha 'default' guarda os valores reais.
    breakfastPrice: r.breakfast_price ?? null,
    lunchPrice:     r.lunch_price ?? null,
    snackPrice:     r.snack_price ?? null,
    snackActive:    r.snack_active ?? null,
    snackExcluded:  r.snack_excluded ?? [],   // worker_ids fora do lanche naquele dia
  }
}

function paymentFromRow(r) {
  return {
    id: r.id, workerId: r.worker_id, period: r.period, monthStr: r.month_str,
    totalDays: r.total_days, weekdayDays: r.weekday_days, weekendDays: r.weekend_days,
    weekdayEarnings: r.weekday_earnings, weekendEarnings: r.weekend_earnings,
    total: r.total, status: r.status, paidDate: r.paid_date,
    workDayIds: r.work_day_ids ?? [],
  }
}

export function subscriptionFromRow(r) {
  return {
    id: r.id, plan: r.plan, status: r.status,
    billingCycle: r.billing_cycle,
    workerLimit: r.worker_limit ?? null,   // null = ilimitado
    trialEndsAt: r.trial_ends_at,
    currentPeriodEnd: r.current_period_end,
    asaasCustomerId: r.asaas_customer_id,
    asaasSubscriptionId: r.asaas_subscription_id,
  }
}

function workerToRow(w) {
  return {
    id: w.id, name: w.name, department: w.department, job_title: w.jobTitle,
    weekday_rate: w.weekdayRate,
    weekend_rate: w.saturdayRate ?? w.weekdayRate,
    sunday_rate:  w.sundayRate  ?? w.saturdayRate ?? w.weekdayRate,
    locations: w.locations,
    schedule: w.schedule, status: w.status, avatar: w.avatar, avatar_color: w.avatarColor,
    phone: w.phone, email: w.email ?? null, start_date: w.startDate, pix_key_type: w.pixKeyType, pix_key: w.pixKey,
    worker_type: w.workerType ?? 'diarista',
  }
}

function workDayToRow(d) {
  return {
    id: d.id, worker_id: d.workerId, date: d.date,
    location_id: d.locationId, is_weekend: d.isWeekend,
    rate: d.rate, earnings: d.earnings, overtime: d.overtime ?? 0, bonus: d.bonus ?? 0,
  }
}

function locationToRow(l) {
  return { id: l.id, name: l.name, color: l.color, short_name: l.shortName, address: l.address, city: l.city }
}

function dailyExpenseToRow(e) {
  return {
    id: e.id, date: e.date,
    breakfast_price: e.breakfastPrice ?? null,
    lunch_price:     e.lunchPrice ?? null,
    snack_price:     e.snackPrice ?? null,
    snack_active:    e.snackActive ?? null,
    snack_excluded:  e.snackExcluded ?? null,
  }
}

function paymentToRow(p) {
  return {
    id: p.id, worker_id: p.workerId, period: p.period ?? null, month_str: p.monthStr ?? null,
    total_days: p.totalDays ?? null, weekday_days: p.weekdayDays ?? null, weekend_days: p.weekendDays ?? null,
    weekday_earnings: p.weekdayEarnings ?? null, weekend_earnings: p.weekendEarnings ?? null,
    total: p.total ?? null, status: p.status ?? null, paid_date: p.paidDate ?? null,
    work_day_ids: p.workDayIds ?? [],
  }
}

// ─── Fetch all (used on login and realtime refresh) ──────────────────────────

export async function fetchAll() {
  const [w, d, l, p, h, e, s] = await Promise.all([
    supabase.from('workers').select('*').order('name'),
    supabase.from('work_days').select('*').order('date'),
    supabase.from('locations').select('*').order('name'),
    supabase.from('payment_records').select('*'),
    supabase.from('holidays').select('date'),
    supabase.from('daily_expenses').select('*'),
    supabase.from('subscriptions').select('*').limit(1),  // RLS já filtra p/ o próprio usuário
  ])

  if (w.error) throw w.error
  if (d.error) throw d.error
  if (l.error) throw l.error
  if (p.error) throw p.error
  if (h.error) throw h.error
  // Tolerante: se a tabela daily_expenses ainda não existir no banco, não derruba o app.
  if (e.error) console.warn('[fetchAll] daily_expenses indisponível (rode a migration):', e.error.message)
  // Idem para subscriptions (rode add-subscriptions.sql).
  if (s.error) console.warn('[fetchAll] subscriptions indisponível (rode a migration):', s.error.message)

  const locations = (l.data ?? []).map(locationFromRow)
  const workers   = (w.data ?? []).map(workerFromRow)
  const workDays       = (d.data ?? []).map(workDayFromRow)
  const paymentRecords = (p.data ?? []).map(paymentFromRow)
  const holidays       = (h.data ?? []).map(r => r.date)
  const dailyExpenses  = e.error ? [] : (e.data ?? []).map(dailyExpenseFromRow)
  const subscription   = s.error ? null : ((s.data ?? []).map(subscriptionFromRow)[0] ?? null)

  return { workers, workDays, locations, paymentRecords, holidays, dailyExpenses, subscription }
}

// eslint-disable-next-line no-unused-vars -- utilitário de manutenção mantido de propósito
async function clearAllData() {
  // Sequential to respect FK constraints: dependents first
  await supabase.from('payment_records').delete().neq('id', '')
  await supabase.from('work_days').delete().neq('id', '')
  await supabase.from('workers').delete().neq('id', '')
  await supabase.from('locations').delete().neq('id', '')
  await supabase.from('holidays').delete().gte('id', 0)
}

async function batchInsert(table, rows, size = 50) {
  for (let i = 0; i < rows.length; i += size) {
    const { error } = await supabase.from(table).insert(rows.slice(i, i + size))
    if (error) {
      console.error(`[batchInsert] table=${table} batch=${i}–${i+size}`, error)
      throw error
    }
  }
}

// eslint-disable-next-line no-unused-vars -- utilitário de seed mantido de propósito
async function seedMockData() {
  await Promise.all([
    supabase.from('locations').insert(LOCATIONS.map(locationToRow)),
    supabase.from('holidays').insert(HOLIDAYS_2025.map(date => ({ date }))),
  ])
  await batchInsert('workers', WORKERS.map(workerToRow))
  await batchInsert('work_days', WORK_DAYS.map(workDayToRow))
}

// ─── Individual CRUD (replaces sync-all) ────────────────────────────────────

export async function upsertWorkers(workers) {
  if (!workers.length) return
  const { error } = await supabase.from('workers').upsert(workers.map(workerToRow), { onConflict: 'id' })
  if (error) throw error
}
export async function deleteWorkers(ids) {
  if (!ids.length) return
  const { error } = await supabase.from('workers').delete().in('id', ids)
  if (error) throw error
}

export async function upsertWorkDays(days) {
  if (!days.length) return
  const { error } = await supabase.from('work_days').upsert(days.map(workDayToRow), { onConflict: 'id' })
  if (error) throw error
}
export async function deleteWorkDays(ids) {
  if (!ids.length) return
  const { error } = await supabase.from('work_days').delete().in('id', ids)
  if (error) throw error
}

export async function upsertLocations(locations) {
  if (!locations.length) return
  const { error } = await supabase.from('locations').upsert(locations.map(locationToRow), { onConflict: 'id' })
  if (error) throw error
}
export async function deleteLocations(ids) {
  if (!ids.length) return
  const { error } = await supabase.from('locations').delete().in('id', ids)
  if (error) throw error
}

export async function upsertPaymentRecords(records) {
  if (!records.length) return
  const { error } = await supabase.from('payment_records').upsert(records.map(paymentToRow), { onConflict: 'id' })
  if (error) throw error
}
export async function deletePaymentRecords(ids) {
  if (!ids.length) return
  const { error } = await supabase.from('payment_records').delete().in('id', ids)
  if (error) throw error
}

export async function upsertDailyExpenses(items) {
  if (!items.length) return
  // A PK de daily_expenses é composta (user_id, id): o mesmo id ('default', 'yyyy-MM-dd')
  // existe por usuário. Envia o user_id e conflita em (user_id, id).
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  const rows = items.map(e => {
    const row = dailyExpenseToRow(e)
    if (userId) row.user_id = userId
    return row
  })
  const { error } = await supabase.from('daily_expenses').upsert(rows, { onConflict: 'user_id,id' })
  if (error) throw error
}
export async function deleteDailyExpenses(ids) {
  if (!ids.length) return
  const { error } = await supabase.from('daily_expenses').delete().in('id', ids)
  if (error) throw error
}

export async function syncHolidays(holidays) {
  await supabase.from('holidays').delete().gte('id', 0)
  if (holidays.length > 0) {
    const { error } = await supabase.from('holidays').insert(holidays.map(date => ({ date })))
    if (error) throw error
  }
}

// ─── Report Subscribers ──────────────────────────────────────────────────────

export async function fetchReportSubscribers() {
  const { data, error } = await supabase
    .from('report_subscribers')
    .select('*')
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id, name: r.name, email: r.email,
    dayOfWeek: r.day_of_week, sendHour: r.send_hour ?? 12, active: r.active, createdAt: r.created_at,
  }))
}

export async function upsertReportSubscriber(sub) {
  const { error } = await supabase.from('report_subscribers').upsert(
    { id: sub.id, name: sub.name, email: sub.email, day_of_week: sub.dayOfWeek, send_hour: sub.sendHour ?? 12, active: sub.active },
    { onConflict: 'id' }
  )
  if (error) throw error
}

export async function deleteReportSubscriber(id) {
  const { error } = await supabase.from('report_subscribers').delete().eq('id', id)
  if (error) throw error
}

// ─── Activity log ────────────────────────────────────────────────────────────

export async function logActivity(action, description, metadata = {}) {
  try {
    await supabase.from('activity_logs').insert({ action, description, metadata })
  } catch {
    // nunca deixar o log travar o app
  }
}

export async function fetchActivityLogs(limit = 100) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}
