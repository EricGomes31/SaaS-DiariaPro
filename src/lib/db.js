import { supabase } from './supabase'
import { WORKERS, WORK_DAYS, LOCATIONS, HOLIDAYS_2025 } from '../data/mockData'

// ─── Mappers (exported for realtime handlers in App.jsx) ─────────────────────

export function workerFromRow(r) {
  const weekend = r.saturday_rate ?? r.weekend_rate ?? r.weekday_rate
  return {
    id: r.id, name: r.name, department: r.department,
    jobTitle: r.job_title, weekdayRate: r.weekday_rate,
    saturdayRate: r.saturday_rate ?? weekend,
    sundayRate:   r.sunday_rate   ?? weekend,
    locations: r.locations ?? [], schedule: r.schedule, status: r.status,
    avatar: r.avatar, avatarColor: r.avatar_color, phone: r.phone,
    startDate: r.start_date, pixKeyType: r.pix_key_type, pixKey: r.pix_key,
  }
}

export function workDayFromRow(r) {
  return {
    id: r.id, workerId: r.worker_id, date: r.date,
    locationId: r.location_id, isWeekend: r.is_weekend,
    rate: r.rate ?? 0, earnings: r.earnings ?? 0,
    overtime: r.overtime ?? 0,
  }
}

export function locationFromRow(r) {
  return { id: r.id, name: r.name, color: r.color, shortName: r.short_name, address: r.address, city: r.city }
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

function workerToRow(w) {
  return {
    id: w.id, name: w.name, department: w.department, job_title: w.jobTitle,
    weekday_rate: w.weekdayRate,
    weekend_rate: w.saturdayRate ?? w.weekdayRate,
    sunday_rate:  w.sundayRate  ?? w.saturdayRate ?? w.weekdayRate,
    locations: w.locations,
    schedule: w.schedule, status: w.status, avatar: w.avatar, avatar_color: w.avatarColor,
    phone: w.phone, start_date: w.startDate, pix_key_type: w.pixKeyType, pix_key: w.pixKey,
  }
}

function workDayToRow(d) {
  return {
    id: d.id, worker_id: d.workerId, date: d.date,
    location_id: d.locationId, is_weekend: d.isWeekend,
    rate: d.rate, earnings: d.earnings, overtime: d.overtime ?? 0,
  }
}

function locationToRow(l) {
  return { id: l.id, name: l.name, color: l.color, short_name: l.shortName, address: l.address, city: l.city }
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
  const [w, d, l, p, h] = await Promise.all([
    supabase.from('workers').select('*').order('name'),
    supabase.from('work_days').select('*').order('date'),
    supabase.from('locations').select('*').order('name'),
    supabase.from('payment_records').select('*'),
    supabase.from('holidays').select('date'),
  ])

  if (w.error) throw w.error
  if (d.error) throw d.error
  if (l.error) throw l.error
  if (p.error) throw p.error
  if (h.error) throw h.error

  const locations = (l.data ?? []).map(locationFromRow)
  const workers   = (w.data ?? []).map(workerFromRow)
  const workDays       = (d.data ?? []).map(workDayFromRow)
  const paymentRecords = (p.data ?? []).map(paymentFromRow)
  const holidays       = (h.data ?? []).map(r => r.date)

  return { workers, workDays, locations, paymentRecords, holidays }
}

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

export async function syncHolidays(holidays) {
  await supabase.from('holidays').delete().gte('id', 0)
  if (holidays.length > 0) {
    const { error } = await supabase.from('holidays').insert(holidays.map(date => ({ date })))
    if (error) throw error
  }
}
