import { supabase } from './supabase'
import { WORKERS, WORK_DAYS, LOCATIONS, HOLIDAYS_2025 } from '../data/mockData'

// ─── Mappers (exported for realtime handlers in App.jsx) ─────────────────────

export function workerFromRow(r) {
  return {
    id: r.id, name: r.name, department: r.department,
    jobTitle: r.job_title, weekdayRate: r.weekday_rate, weekendRate: r.weekend_rate,
    locations: r.locations ?? [], schedule: r.schedule, status: r.status,
    avatar: r.avatar, avatarColor: r.avatar_color, phone: r.phone,
    startDate: r.start_date, pixKeyType: r.pix_key_type, pixKey: r.pix_key,
  }
}

export function workDayFromRow(r) {
  return {
    id: r.id, workerId: r.worker_id, date: r.date,
    locationId: r.location_id, isWeekend: r.is_weekend, rate: r.rate, earnings: r.earnings,
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
  }
}

function workerToRow(w) {
  return {
    id: w.id, name: w.name, department: w.department, job_title: w.jobTitle,
    weekday_rate: w.weekdayRate, weekend_rate: w.weekendRate, locations: w.locations,
    schedule: w.schedule, status: w.status, avatar: w.avatar, avatar_color: w.avatarColor,
    phone: w.phone, start_date: w.startDate, pix_key_type: w.pixKeyType, pix_key: w.pixKey,
  }
}

function workDayToRow(d) {
  return {
    id: d.id, worker_id: d.workerId, date: d.date,
    location_id: d.locationId, is_weekend: d.isWeekend, rate: d.rate, earnings: d.earnings,
  }
}

function locationToRow(l) {
  return { id: l.id, name: l.name, color: l.color, short_name: l.shortName, address: l.address, city: l.city }
}

function paymentToRow(p) {
  return {
    id: p.id, worker_id: p.workerId, period: p.period, month_str: p.monthStr,
    total_days: p.totalDays, weekday_days: p.weekdayDays, weekend_days: p.weekendDays,
    weekday_earnings: p.weekdayEarnings, weekend_earnings: p.weekendEarnings,
    total: p.total, status: p.status, paid_date: p.paidDate,
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

  const workers        = (w.data ?? []).map(workerFromRow)
  const workDays       = (d.data ?? []).map(workDayFromRow)
  const locations      = (l.data ?? []).map(locationFromRow)
  const paymentRecords = (p.data ?? []).map(paymentFromRow)
  const holidays       = (h.data ?? []).map(r => r.date)

  if (workers.length === 0 && locations.length === 0) {
    await seedMockData()
    return fetchAll()
  }

  return { workers, workDays, locations, paymentRecords, holidays }
}

async function seedMockData() {
  await Promise.all([
    supabase.from('locations').insert(LOCATIONS.map(locationToRow)),
    supabase.from('holidays').insert(HOLIDAYS_2025.map(date => ({ date }))),
  ])
  await supabase.from('workers').insert(WORKERS.map(workerToRow))
  await supabase.from('work_days').insert(WORK_DAYS.map(workDayToRow))
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
