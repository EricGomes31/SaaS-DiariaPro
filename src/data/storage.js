import { WORKERS, WORK_DAYS, LOCATIONS, HOLIDAYS_2025 } from './mockData'

const KEYS = {
  WORKERS: 'diaria_workers',
  WORK_DAYS: 'diaria_work_days',
  LOCATIONS: 'diaria_locations',
  PAYMENT_RECORDS: 'diaria_payment_records',
  HOLIDAYS: 'diaria_holidays',
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export const loadWorkers   = () => load(KEYS.WORKERS,   WORKERS)
export const saveWorkers   = (v) => save(KEYS.WORKERS,   v)
export const loadWorkDays  = () => load(KEYS.WORK_DAYS,  WORK_DAYS)
export const saveWorkDays  = (v) => save(KEYS.WORK_DAYS,  v)
export const loadLocations     = () => load(KEYS.LOCATIONS,       LOCATIONS)
export const saveLocations     = (v) => save(KEYS.LOCATIONS,       v)
export const loadPaymentRecords = () => load(KEYS.PAYMENT_RECORDS, [])
export const savePaymentRecords = (v) => save(KEYS.PAYMENT_RECORDS, v)
export const loadHolidays       = () => load(KEYS.HOLIDAYS, HOLIDAYS_2025)
export const saveHolidays       = (v) => save(KEYS.HOLIDAYS, v)
