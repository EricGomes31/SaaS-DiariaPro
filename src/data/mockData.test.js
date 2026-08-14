import { describe, expect, it } from 'vitest'
import { getWorkerDayRate, getWorkerStats, isValidCPF, isWeekendOrHoliday } from './mockData'

describe('isValidCPF', () => {
  it('accepts a well-formed CPF with valid check digits', () => {
    expect(isValidCPF('111.444.777-35')).toBe(true)
    expect(isValidCPF('11144477735')).toBe(true)
  })

  it('rejects a CPF with a wrong check digit', () => {
    expect(isValidCPF('111.444.777-36')).toBe(false)
  })

  it('rejects all-same-digit CPFs (mathematically pass but are never real)', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false)
    expect(isValidCPF('000.000.000-00')).toBe(false)
  })

  it('rejects the wrong number of digits', () => {
    expect(isValidCPF('123')).toBe(false)
    expect(isValidCPF('111.444.777-355')).toBe(false)
  })

  it('rejects empty/nullish input', () => {
    expect(isValidCPF('')).toBe(false)
    expect(isValidCPF(null)).toBe(false)
    expect(isValidCPF(undefined)).toBe(false)
  })
})

describe('isWeekendOrHoliday', () => {
  const holidays = ['2026-04-21']

  it('flags Saturday and Sunday as weekend', () => {
    expect(isWeekendOrHoliday('2026-01-03', holidays)).toBe(true) // Saturday
    expect(isWeekendOrHoliday('2026-01-04', holidays)).toBe(true) // Sunday
  })

  it('flags a listed holiday even on a weekday', () => {
    expect(isWeekendOrHoliday('2026-04-21', holidays)).toBe(true) // Tuesday
  })

  it('returns false for an ordinary weekday not in the holiday list', () => {
    expect(isWeekendOrHoliday('2026-01-05', holidays)).toBe(false) // Monday
  })
})

describe('getWorkerDayRate', () => {
  const worker = { weekdayRate: 150, saturdayRate: 220, sundayRate: 250 }
  const holidays = ['2026-04-21']

  it('uses the weekday rate on an ordinary weekday', () => {
    expect(getWorkerDayRate(worker, '2026-01-05', holidays)).toBe(150) // Monday
  })

  it('uses the Saturday rate on a Saturday', () => {
    expect(getWorkerDayRate(worker, '2026-01-03', holidays)).toBe(220)
  })

  it('uses the Sunday rate on a Sunday and on a holiday alike', () => {
    expect(getWorkerDayRate(worker, '2026-01-04', holidays)).toBe(250) // Sunday
    expect(getWorkerDayRate(worker, '2026-04-21', holidays)).toBe(250) // holiday (Tuesday)
  })

  it('falls back to the weekday rate when a specific rate is missing', () => {
    const partialWorker = { weekdayRate: 100 }
    expect(getWorkerDayRate(partialWorker, '2026-01-03', holidays)).toBe(100) // Saturday, no saturdayRate set
  })
})

describe('getWorkerStats', () => {
  const workDays = [
    { workerId: 'w1', earnings: 150, overtime: 0, bonus: 0, isWeekend: false },
    { workerId: 'w1', earnings: 220, overtime: 30, bonus: 0, isWeekend: true },
    { workerId: 'w1', earnings: 150, overtime: 0, bonus: 20, isWeekend: false },
    { workerId: 'w2', earnings: 999, overtime: 0, bonus: 0, isWeekend: false },
  ]

  it('aggregates totals only for the given worker', () => {
    const stats = getWorkerStats('w1', workDays)
    expect(stats.totalDays).toBe(3)
    expect(stats.totalEarnings).toBe(520)
    expect(stats.totalOvertime).toBe(30)
    expect(stats.totalBonus).toBe(20)
  })

  it('splits weekday vs weekend day counts and earnings', () => {
    const stats = getWorkerStats('w1', workDays)
    expect(stats.weekdayDays).toBe(2)
    expect(stats.weekendDays).toBe(1)
    expect(stats.weekdayEarnings).toBe(300)
    expect(stats.weekendEarnings).toBe(220)
  })

  it('returns zeroed stats for a worker with no work days', () => {
    const stats = getWorkerStats('nobody', workDays)
    expect(stats.totalDays).toBe(0)
    expect(stats.totalEarnings).toBe(0)
    expect(stats.recentDays).toEqual([])
  })
})
