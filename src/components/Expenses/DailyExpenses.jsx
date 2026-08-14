import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isSameDay, isToday, parseISO, startOfMonth, subDays, subMonths } from 'date-fns'
import { enUS, es, ptBR } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, CalendarRange, Check, ChevronLeft, ChevronRight, Coffee, Cookie, Download, FileSpreadsheet, FileText, Pencil, PieChart as PieChartIcon, RotateCcw, TrendingUp, Users, UtensilsCrossed, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useIsMobile } from '../../hooks/useIsMobile'
import i18n from '../../i18n'

const DEFAULT_ID = 'default'
const MEAL_COLORS = { breakfast: '#f59e0b', lunch: '#10b981', snack: '#8b5cf6' }

const brl = n => `R$ ${(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const num = v => {
  const n = parseFloat(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
const brDate = iso => iso.split('-').reverse().join('/')

// ── Export (CSV com BOM + PDF via impressão), no padrão do PaymentView ────────
const csvNum = n => (n || 0).toFixed(2).replace('.', ',')

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportExpensesCSV(rows, fileTag, L) {
  const BOM = String.fromCharCode(0xfeff) // Excel reconhece o UTF-8
  const head = ['Data', L.present, L.breakfast, L.lunch, L.snack, L.total]
  const lines = [head.join(';')]
  const tot = { p: 0, c: 0, a: 0, l: 0, t: 0 }
  for (const r of rows) {
    lines.push([brDate(r.date), r.present, csvNum(r.cafe), csvNum(r.almoco), csvNum(r.lanche), csvNum(r.total)].join(';'))
    tot.p += r.present
    tot.c += r.cafe
    tot.a += r.almoco
    tot.l += r.lanche
    tot.t += r.total
  }
  lines.push(['TOTAL', tot.p, csvNum(tot.c), csvNum(tot.a), csvNum(tot.l), csvNum(tot.t)].join(';'))
  downloadTextFile(`gastos-${fileTag}.csv`, BOM + lines.join('\r\n'))
}

function exportExpensesPDF(rows, monthLabel, L) {
  const tot = rows.reduce(
    (a, r) => ({
      p: a.p + r.present,
      c: a.c + r.cafe,
      al: a.al + r.almoco,
      la: a.la + r.lanche,
      t: a.t + r.total,
    }),
    { p: 0, c: 0, al: 0, la: 0, t: 0 },
  )
  const cell = (v, align = 'left', bold = false) => `<td style="text-align:${align};${bold ? 'font-weight:700;color:#111827;' : ''}">${v}</td>`
  const body = rows.map(r => `<tr>${cell(brDate(r.date))}${cell(r.present, 'center')}${cell(brl(r.cafe), 'right')}${cell(brl(r.almoco), 'right')}${cell(brl(r.lanche), 'right')}${cell(brl(r.total), 'right', true)}</tr>`).join('')
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${L.title} — ${monthLabel}</title>
    <style>
      *{box-sizing:border-box;}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#374151;padding:32px;}
      h1{font-size:22px;margin:0 0 4px;letter-spacing:-0.02em;color:#111827;text-transform:capitalize;}
      .sub{color:#6b7280;font-size:13px;margin:0 0 24px;}
      table{width:100%;border-collapse:collapse;font-size:13px;}
      th{text-align:left;padding:10px 12px;background:#f3f4f6;color:#6b7280;border-bottom:2px solid #e5e7eb;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;}
      td{padding:9px 12px;border-bottom:1px solid #f1f1f1;}
      tfoot td{font-weight:800;border-top:2px solid #e5e7eb;background:#fafafa;color:#111827;}
      @media print{body{padding:0;}}
    </style></head><body>
    <h1>${L.title}</h1>
    <p class="sub">${monthLabel} &middot; ${rows.length} ${L.daysWorked}</p>
    <table>
      <thead><tr>
        <th>Data</th>
        <th style="text-align:center">${L.present}</th>
        <th style="text-align:right">${L.breakfast}</th>
        <th style="text-align:right">${L.lunch}</th>
        <th style="text-align:right">${L.snack}</th>
        <th style="text-align:right">${L.total}</th>
      </tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr>${cell('TOTAL')}${cell(tot.p, 'center')}${cell(brl(tot.c), 'right')}${cell(brl(tot.al), 'right')}${cell(brl(tot.la), 'right')}${cell(brl(tot.t), 'right')}</tr></tfoot>
    </table>
    <script>window.onload=function(){setTimeout(function(){window.print();},150);}</script>
    </body></html>`)
  win.document.close()
}

// Tooltip for the expense charts (handles stacked + single-series)
function ExpenseTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const multi = payload.length > 1
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div
      style={{
        background: 'var(--card-bg-elevated)',
        border: '1px solid var(--card-border)',
        borderRadius: 12,
        padding: '12px 14px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
      <div style={{ fontSize: 11, color: 'var(--card-sub)', marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: p.color || p.fill,
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--card-sub)', flex: 1 }}>{p.name}</span>
          <span
            style={{
              fontSize: 12,
              color: 'var(--card-heading)',
              fontWeight: 700,
            }}>
            {brl(p.value)}
          </span>
        </div>
      ))}
      {multi && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            marginTop: 6,
            paddingTop: 6,
            borderTop: '1px solid var(--inner-border)',
          }}>
          <span style={{ fontSize: 12, color: 'var(--card-sub)', fontWeight: 600 }}>Total</span>
          <span style={{ fontSize: 13, color: '#10b981', fontWeight: 800 }}>{brl(total)}</span>
        </div>
      )}
    </div>
  )
}

// Single meal price input with currency prefix
function PriceInput({ icon: Icon, color, label, value, onChange, hint }) {
  return (
    <div style={{ flex: 1, minWidth: 140 }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: 'var(--card-sub)',
          marginBottom: 6,
          fontWeight: 600,
        }}>
        <Icon size={13} color={color} /> {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: 11,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 12,
            color: 'var(--card-muted)',
            pointerEvents: 'none',
          }}>
          R$
        </span>
        <input
          type="number"
          min="0"
          step="0.5"
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0,00"
          className="input-premium"
          style={{
            width: '100%',
            padding: '9px 12px 9px 34px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            boxSizing: 'border-box',
          }}
        />
      </div>
      {hint && <div style={{ fontSize: 10, color: 'var(--card-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

// On/off switch
function Toggle({ on, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      style={{
        width: 42,
        height: 24,
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        padding: 2,
        flexShrink: 0,
        background: on ? '#10b981' : 'var(--inner-border)',
        transition: 'background 0.2s',
        display: 'flex',
        alignItems: 'center',
      }}>
      <motion.div
        animate={{ x: on ? 18 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
        }}
      />
    </button>
  )
}

export default function DailyExpenses({ lang = 'pt', workers = [], workDays = [], dailyExpenses = [], setDailyExpenses }) {
  const isMobile = useIsMobile()
  const t = i18n[lang] ?? i18n.pt
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [editingDate, setEditingDate] = useState(null)
  const [dayDraft, setDayDraft] = useState({
    breakfastPrice: 0,
    lunchPrice: 0,
    snackPrice: 0,
  })
  const [savedFlash, setSavedFlash] = useState(false)
  const [chartView, setChartView] = useState('weekly')
  const [selectedDay, setSelectedDay] = useState(null)
  const [showExport, setShowExport] = useState(false)

  // ── Default (reusable) prices ──────────────────────────────────────────────
  const defaultRow = dailyExpenses.find(e => e.id === DEFAULT_ID)
  const defaults = useMemo(
    () => ({
      breakfastPrice: defaultRow?.breakfastPrice ?? 0,
      lunchPrice: defaultRow?.lunchPrice ?? 0,
      snackPrice: defaultRow?.snackPrice ?? 0,
    }),
    [defaultRow?.breakfastPrice, defaultRow?.lunchPrice, defaultRow?.snackPrice],
  )

  // Whether the special snack is counted by default every day (true preserves prior behavior)
  const snackDefault = defaultRow?.snackActive ?? true

  // Merge-write the 'default' row, preserving fields not in the patch
  const persistDefault = patch => {
    setDailyExpenses(prev => {
      const cur = prev.find(e => e.id === DEFAULT_ID)
      return [
        ...prev.filter(e => e.id !== DEFAULT_ID),
        {
          id: DEFAULT_ID,
          date: DEFAULT_ID,
          breakfastPrice: cur?.breakfastPrice ?? 0,
          lunchPrice: cur?.lunchPrice ?? 0,
          snackPrice: cur?.snackPrice ?? 0,
          snackActive: cur?.snackActive ?? true,
          ...patch,
        },
      ]
    })
  }

  const [draft, setDraft] = useState(defaults)
  // Re-sync the editor when the persisted defaults change (load / realtime / save)
  useEffect(() => {
    setDraft(defaults)
  }, [defaults])
  const draftDirty = num(draft.breakfastPrice) !== defaults.breakfastPrice || num(draft.lunchPrice) !== defaults.lunchPrice || num(draft.snackPrice) !== defaults.snackPrice

  const saveDefaults = () => {
    persistDefault({
      breakfastPrice: num(draft.breakfastPrice),
      lunchPrice: num(draft.lunchPrice),
      snackPrice: num(draft.snackPrice),
    })
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1800)
  }

  const toggleSnackDefault = () => persistDefault({ snackActive: !snackDefault })

  // ── Presence + per-day overrides for the visible month ─────────────────────
  const monthStr = format(currentMonth, 'yyyy-MM')

  const overrideByDate = useMemo(() => {
    const m = {}
    for (const e of dailyExpenses) if (e.id !== DEFAULT_ID) m[e.date] = e
    return m
  }, [dailyExpenses])

  const snackActiveFor = date => {
    const o = overrideByDate[date]
    return o && o.snackActive != null ? o.snackActive : snackDefault
  }

  const dayRows = useMemo(() => {
    const wdByDate = {}
    for (const d of workDays) {
      if (typeof d.date === 'string' && d.date.startsWith(monthStr)) (wdByDate[d.date] ??= []).push(d)
    }
    return Object.keys(wdByDate)
      .sort((a, b) => b.localeCompare(a))
      .map(date => {
        const wds = wdByDate[date]
        const present = wds.length
        const o = overrideByDate[date]
        const p = {
          breakfastPrice: o?.breakfastPrice ?? defaults.breakfastPrice,
          lunchPrice: o?.lunchPrice ?? defaults.lunchPrice,
          snackPrice: o?.snackPrice ?? defaults.snackPrice,
        }
        const snackOn = o && o.snackActive != null ? o.snackActive : snackDefault
        const excluded = new Set(o?.snackExcluded ?? [])
        const snackCount = wds.filter(d => !excluded.has(d.workerId)).length
        const priceCustom = !!(o && (o.breakfastPrice != null || o.lunchPrice != null || o.snackPrice != null))
        const cafe = present * num(p.breakfastPrice)
        const almoco = present * num(p.lunchPrice)
        const lanche = snackOn ? snackCount * num(p.snackPrice) : 0
        return {
          date,
          present,
          snackCount,
          excluded,
          p,
          cafe,
          almoco,
          lanche,
          snackOn,
          total: cafe + almoco + lanche,
          custom: priceCustom,
        }
      })
  }, [workDays, monthStr, overrideByDate, defaults, snackDefault])

  const monthTotals = useMemo(
    () =>
      dayRows.reduce(
        (a, r) => ({
          cafe: a.cafe + r.cafe,
          almoco: a.almoco + r.almoco,
          lanche: a.lanche + r.lanche,
          total: a.total + r.total,
          present: a.present + r.present,
        }),
        { cafe: 0, almoco: 0, lanche: 0, total: 0, present: 0 },
      ),
    [dayRows],
  )

  // ── Calendar grid for the visible month ──
  const daysOfMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })
  const startPad = getDay(startOfMonth(currentMonth))
  const rowByDate = useMemo(() => Object.fromEntries(dayRows.map(r => [r.date, r])), [dayRows])
  const selectedDateStr = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null
  const selectedRow = selectedDateStr ? rowByDate[selectedDateStr] : null

  // ── Expense dashboard (all-time aggregations for the charts) ───────────────
  const chartLocale = { pt: ptBR, en: enUS, es }[lang] ?? ptBR

  const expenseByDate = useMemo(() => {
    const wdByDate = {}
    for (const d of workDays) {
      if (typeof d.date === 'string') (wdByDate[d.date] ??= []).push(d)
    }
    const m = {}
    for (const date in wdByDate) {
      const wds = wdByDate[date]
      const present = wds.length
      const o = overrideByDate[date]
      const snackOn = o && o.snackActive != null ? o.snackActive : snackDefault
      const excluded = new Set(o?.snackExcluded ?? [])
      const snackCount = wds.filter(d => !excluded.has(d.workerId)).length
      const cafe = present * num(o?.breakfastPrice ?? defaults.breakfastPrice)
      const almoco = present * num(o?.lunchPrice ?? defaults.lunchPrice)
      const lanche = snackOn ? snackCount * num(o?.snackPrice ?? defaults.snackPrice) : 0
      m[date] = { present, cafe, almoco, lanche, total: cafe + almoco + lanche }
    }
    return m
  }, [workDays, overrideByDate, defaults, snackDefault])

  const weeklyData = useMemo(() => {
    const arr = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i)
      const e = expenseByDate[format(d, 'yyyy-MM-dd')] ?? {}
      arr.push({
        label: cap(format(d, 'EEE', { locale: chartLocale })),
        cafe: e.cafe ?? 0,
        almoco: e.almoco ?? 0,
        lanche: e.lanche ?? 0,
      })
    }
    return arr
  }, [expenseByDate, chartLocale])

  const monthlyData = useMemo(() => {
    const arr = []
    for (let i = 5; i >= 0; i--) {
      const md = subMonths(new Date(), i)
      const key = format(md, 'yyyy-MM')
      let cafe = 0,
        almoco = 0,
        lanche = 0
      for (const date in expenseByDate) {
        if (date.startsWith(key)) {
          const e = expenseByDate[date]
          cafe += e.cafe
          almoco += e.almoco
          lanche += e.lanche
        }
      }
      arr.push({
        label: cap(format(md, 'MMM', { locale: chartLocale }).replace('.', '')),
        cafe,
        almoco,
        lanche,
      })
    }
    return arr
  }, [expenseByDate, chartLocale])

  const weekdayData = useMemo(() => {
    const base = [0, 1, 2, 3, 4, 5, 6].map(dow => ({ dow, total: 0 }))
    for (const date in expenseByDate) base[getDay(parseISO(date))].total += expenseByDate[date].total
    return base.map(b => ({
      label: t.dayNames[b.dow],
      total: b.total,
      isWeekend: b.dow === 0 || b.dow === 6,
    }))
  }, [expenseByDate, t])

  const totalsAll = useMemo(
    () =>
      Object.values(expenseByDate).reduce(
        (a, e) => ({
          cafe: a.cafe + e.cafe,
          almoco: a.almoco + e.almoco,
          lanche: a.lanche + e.lanche,
          total: a.total + e.total,
        }),
        { cafe: 0, almoco: 0, lanche: 0, total: 0 },
      ),
    [expenseByDate],
  )

  const dashStats = useMemo(() => {
    const days = Object.values(expenseByDate).filter(e => e.total > 0)
    return {
      avg: days.length ? totalsAll.total / days.length : 0,
      peak: Object.values(expenseByDate).reduce((m, e) => Math.max(m, e.total), 0),
      total: totalsAll.total,
    }
  }, [expenseByDate, totalsAll])

  const pieData = [
    {
      name: t.breakfastLabel,
      value: totalsAll.cafe,
      color: MEAL_COLORS.breakfast,
    },
    { name: t.lunchLabel, value: totalsAll.almoco, color: MEAL_COLORS.lunch },
    { name: t.snackLabel, value: totalsAll.lanche, color: MEAL_COLORS.snack },
  ].filter(d => d.value > 0)
  const hasChartData = totalsAll.total > 0

  const startEditDay = row => {
    setEditingDate(row.date)
    setDayDraft({
      breakfastPrice: num(row.p.breakfastPrice),
      lunchPrice: num(row.p.lunchPrice),
      snackPrice: num(row.p.snackPrice),
    })
  }
  const saveDayOverride = date => {
    setDailyExpenses(prev => {
      const cur = prev.find(e => e.id === date)
      return [
        ...prev.filter(e => e.id !== date),
        {
          id: date,
          date,
          breakfastPrice: num(dayDraft.breakfastPrice),
          lunchPrice: num(dayDraft.lunchPrice),
          snackPrice: num(dayDraft.snackPrice),
          snackActive: cur?.snackActive ?? null,
          snackExcluded: cur?.snackExcluded ?? null,
        },
      ]
    })
    setEditingDate(null)
  }
  // "Usar preço padrão": zera só os preços; mantém lanche ligado/desligado e a lista de excluídos.
  const clearDayOverride = date => {
    setDailyExpenses(prev => {
      const cur = prev.find(e => e.id === date)
      const keepSnack = cur && (cur.snackActive != null || cur.snackExcluded?.length)
      if (!keepSnack) return prev.filter(e => e.id !== date)
      return [
        ...prev.filter(e => e.id !== date),
        {
          id: date,
          date,
          breakfastPrice: null,
          lunchPrice: null,
          snackPrice: null,
          snackActive: cur.snackActive ?? null,
          snackExcluded: cur.snackExcluded ?? null,
        },
      ]
    })
    setEditingDate(null)
  }
  // Flip whether the special snack counts on this specific day (overrides the global default)
  const toggleSnack = date => {
    const next = !snackActiveFor(date)
    setDailyExpenses(prev => {
      const cur = prev.find(e => e.id === date)
      return [
        ...prev.filter(e => e.id !== date),
        {
          id: date,
          date,
          breakfastPrice: cur?.breakfastPrice ?? null,
          lunchPrice: cur?.lunchPrice ?? null,
          snackPrice: cur?.snackPrice ?? null,
          snackActive: next,
          snackExcluded: cur?.snackExcluded ?? null,
        },
      ]
    })
  }
  // Inclui/exclui uma pessoa do lanche naquele dia.
  const toggleWorkerSnack = (date, workerId) => {
    setDailyExpenses(prev => {
      const cur = prev.find(e => e.id === date)
      const set = new Set(cur?.snackExcluded ?? [])
      if (set.has(workerId)) set.delete(workerId)
      else set.add(workerId)
      return [
        ...prev.filter(e => e.id !== date),
        {
          id: date,
          date,
          breakfastPrice: cur?.breakfastPrice ?? null,
          lunchPrice: cur?.lunchPrice ?? null,
          snackPrice: cur?.snackPrice ?? null,
          snackActive: cur?.snackActive ?? null,
          snackExcluded: [...set],
        },
      ]
    })
  }

  const MEALS = [
    {
      key: 'breakfastPrice',
      icon: Coffee,
      color: '#f59e0b',
      label: t.breakfastLabel,
    },
    {
      key: 'lunchPrice',
      icon: UtensilsCrossed,
      color: '#10b981',
      label: t.lunchLabel,
    },
    { key: 'snackPrice', icon: Cookie, color: '#8b5cf6', label: t.snackLabel },
  ]

  const summaryCards = [
    {
      icon: Coffee,
      color: '#f59e0b',
      label: t.breakfastLabel,
      value: monthTotals.cafe,
    },
    {
      icon: UtensilsCrossed,
      color: '#10b981',
      label: t.lunchLabel,
      value: monthTotals.almoco,
    },
    {
      icon: Cookie,
      color: '#8b5cf6',
      label: t.snackLabel,
      value: monthTotals.lanche,
    },
    {
      icon: Users,
      color: '#6366f1',
      label: t.monthExpensesTotal,
      value: monthTotals.total,
      highlight: true,
    },
  ]

  const doExport = fmt => {
    const rows = [...dayRows].sort((a, b) => a.date.localeCompare(b.date))
    const L = {
      title: t.expensesTitle,
      present: t.presentWorkers,
      breakfast: t.breakfastLabel,
      lunch: t.lunchLabel,
      snack: t.snackLabel,
      total: t.totalCol,
      daysWorked: t.daysWorkedLabel,
    }
    if (fmt === 'csv') exportExpensesCSV(rows, format(currentMonth, 'yyyy-MM'), L)
    else exportExpensesPDF(rows, cap(format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })), L)
    setShowExport(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
          }}>
          <div>
            <h1
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: isMobile ? 24 : 30,
                fontWeight: 800,
                color: 'var(--page-heading)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}>
              {t.expensesTitle}
            </h1>
            <p
              style={{
                margin: '6px 0 0',
                color: 'var(--page-sub)',
                fontSize: 14,
              }}>
              {t.expensesSubtitle}
            </p>
          </div>
          <motion.button
            whileHover={dayRows.length ? { scale: 1.03, boxShadow: '0 8px 24px rgba(99,102,241,0.3)' } : {}}
            whileTap={dayRows.length ? { scale: 0.97 } : {}}
            onClick={() => dayRows.length && setShowExport(true)}
            className="btn-primary"
            style={{
              padding: '12px 22px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: dayRows.length ? 1 : 0.5,
              cursor: dayRows.length ? 'pointer' : 'default',
            }}>
            <Download size={15} /> {t.exportReport}
          </motion.button>
        </div>
      </motion.div>

      {/* ── Expense dashboard (charts) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
          borderRadius: 20,
          padding: '20px 24px',
          backdropFilter: 'blur(20px)',
        }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
          }}>
          <div>
            <div
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--card-heading)',
              }}>
              {t.expenseDashTitle}
            </div>
            <div style={{ fontSize: 12, color: 'var(--card-muted)', marginTop: 2 }}>{chartView === 'weekly' ? t.last7Days : chartView === 'monthly' ? t.last6Months : t.allTime}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'weekly', label: t.viewWeekly, icon: TrendingUp },
              { id: 'monthly', label: t.viewMonthly, icon: BarChart3 },
              { id: 'weekday', label: t.viewByWeekday, icon: CalendarRange },
            ].map(tab => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setChartView(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: `1px solid ${chartView === tab.id ? 'rgba(99,102,241,0.35)' : 'var(--card-border)'}`,
                  background: chartView === tab.id ? 'rgba(99,102,241,0.12)' : 'var(--inner-bg)',
                  color: chartView === tab.id ? '#818cf8' : 'var(--card-sub)',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}>
                <tab.icon size={13} />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        {!hasChartData ? (
          <div
            style={{
              textAlign: 'center',
              padding: '50px 0',
              color: 'var(--card-dim)',
            }}>
            <BarChart3 size={30} style={{ marginBottom: 10, opacity: 0.4 }} />
            <div style={{ fontSize: 13 }}>{t.noExpenseData}</div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={chartView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.22 }}>
              <ResponsiveContainer width="100%" height={300}>
                {chartView === 'weekday' ? (
                  <BarChart data={weekdayData} barSize={34}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--inner-border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: 'var(--card-sub)', fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'var(--card-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} />
                    <Tooltip content={<ExpenseTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                    <Bar dataKey="total" name={t.expenseLabel} radius={[6, 6, 0, 0]}>
                      {weekdayData.map((e, i) => (
                        <Cell key={i} fill={e.isWeekend ? '#f59e0b' : '#6366f1'} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <BarChart data={chartView === 'weekly' ? weeklyData : monthlyData} barSize={chartView === 'weekly' ? 26 : 34}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--inner-border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: 'var(--card-sub)', fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'var(--card-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} />
                    <Tooltip content={<ExpenseTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                    <Bar dataKey="cafe" stackId="a" name={t.breakfastLabel} fill={MEAL_COLORS.breakfast} />
                    <Bar dataKey="almoco" stackId="a" name={t.lunchLabel} fill={MEAL_COLORS.lunch} />
                    <Bar dataKey="lanche" stackId="a" name={t.snackLabel} fill={MEAL_COLORS.snack} radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {/* ── Composition + key stats ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr',
          gap: 20,
        }}>
        {/* Composition donut */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            borderRadius: 20,
            padding: '20px 24px',
          }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}>
            <PieChartIcon size={16} color="#818cf8" />
            <span
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--card-heading)',
              }}>
              {t.compositionTitle}
            </span>
          </div>
          {pieData.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 0',
                color: 'var(--card-dim)',
                fontSize: 13,
              }}>
              {t.noExpenseData}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                flexWrap: 'wrap',
              }}>
              <div
                style={{
                  position: 'relative',
                  width: 160,
                  height: 160,
                  flexShrink: 0,
                }}>
                <PieChart width={160} height={160}>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx={80} cy={80} innerRadius={52} outerRadius={76} paddingAngle={2} stroke="none">
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}>
                  <span style={{ fontSize: 10, color: 'var(--card-muted)' }}>{t.accumulatedTotal}</span>
                  <span
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 15,
                      fontWeight: 800,
                      color: 'var(--card-heading)',
                    }}>
                    {brl(totalsAll.total)}
                  </span>
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 150,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: d.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        color: 'var(--card-sub)',
                        flex: 1,
                      }}>
                      {d.name}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--card-heading)',
                        }}>
                        {brl(d.value)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--card-muted)' }}>{totalsAll.total ? Math.round((d.value / totalsAll.total) * 100) : 0}%</div>
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 2,
                    paddingTop: 10,
                    borderTop: '1px solid var(--inner-border)',
                  }}>
                  <div style={{ width: 10, flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--card-heading)',
                      flex: 1,
                    }}>
                    {t.accumulatedTotal}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#10b981' }}>{brl(totalsAll.total)}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Key stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            borderRadius: 20,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            justifyContent: 'center',
          }}>
          {[
            {
              icon: TrendingUp,
              color: '#6366f1',
              label: t.avgPerDayExpense,
              value: dashStats.avg,
            },
            {
              icon: BarChart3,
              color: '#f59e0b',
              label: t.highestDay,
              value: dashStats.peak,
            },
            {
              icon: Users,
              color: '#10b981',
              label: t.accumulatedTotal,
              value: dashStats.total,
            },
          ].map(s => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: 'var(--inner-bg)',
                  border: '1px solid var(--inner-border)',
                }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${s.color}1f`,
                    border: `1px solid ${s.color}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                  <Icon size={16} color={s.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--card-muted)' }}>{s.label}</div>
                  <div
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 18,
                      fontWeight: 800,
                      color: 'var(--card-heading)',
                      letterSpacing: '-0.02em',
                    }}>
                    {brl(s.value)}
                  </div>
                </div>
              </div>
            )
          })}
        </motion.div>
      </div>

      {/* ── Default prices editor ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
          borderRadius: 20,
          padding: '20px 24px',
          backdropFilter: 'blur(20px)',
        }}>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--card-heading)',
            }}>
            {t.mealPricesTitle}
          </div>
          <div style={{ fontSize: 12, color: 'var(--card-muted)', marginTop: 2 }}>{t.mealPricesHint}</div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}>
          {MEALS.map(m => (
            <PriceInput key={m.key} icon={m.icon} color={m.color} label={m.label} value={draft[m.key]} onChange={v => setDraft(d => ({ ...d, [m.key]: v }))} hint={t.perPerson} />
          ))}
          <motion.button
            whileHover={{ scale: draftDirty ? 1.03 : 1 }}
            whileTap={{ scale: 0.97 }}
            onClick={saveDefaults}
            disabled={!draftDirty && !savedFlash}
            className="btn-primary"
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              opacity: draftDirty || savedFlash ? 1 : 0.5,
              cursor: draftDirty ? 'pointer' : 'default',
            }}>
            {savedFlash ? (
              <>
                <Check size={15} /> {t.pricesSaved}
              </>
            ) : (
              t.savePrices
            )}
          </motion.button>
        </div>
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--inner-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
          <Cookie size={16} color={MEAL_COLORS.snack} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--card-sub)',
              }}>
              {t.snackEveryDay}
            </div>
            <div style={{ fontSize: 11, color: 'var(--card-muted)' }}>{t.snackEveryDayHint}</div>
          </div>
          <Toggle on={snackDefault} onClick={toggleSnackDefault} />
        </div>
      </motion.div>

      {/* ── Month summary ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 12,
        }}>
        {summaryCards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              style={{
                background: card.highlight ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))' : 'var(--card-bg)',
                border: `1px solid ${card.highlight ? 'rgba(99,102,241,0.25)' : 'var(--card-border)'}`,
                boxShadow: 'var(--card-shadow)',
                borderRadius: 16,
                padding: '16px 18px',
              }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    background: `${card.color}1f`,
                    border: `1px solid ${card.color}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Icon size={15} color={card.color} />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--card-muted)',
                    fontWeight: 600,
                  }}>
                  {card.label}
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 20,
                  fontWeight: 800,
                  color: card.highlight ? '#818cf8' : 'var(--card-heading)',
                  letterSpacing: '-0.02em',
                }}>
                {brl(card.value)}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── Calendar — clique num dia para ver os gastos ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
          borderRadius: 20,
          padding: '20px',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
        }}>
        {/* Month nav */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 16,
          }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: '1px solid var(--card-border)',
              background: 'var(--inner-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--card-sub)',
            }}>
            <ChevronLeft size={16} />
          </motion.button>
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: 'Syne, sans-serif',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--card-heading)',
              letterSpacing: '-0.01em',
              textTransform: 'capitalize',
            }}>
            {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: '1px solid var(--card-border)',
              background: 'var(--inner-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--card-sub)',
            }}>
            <ChevronRight size={16} />
          </motion.button>
        </div>

        {/* Day headers */}
        <div
          translate="no"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
            marginBottom: 8,
          }}>
          {t.dayNames.map((name, i) => (
            <div
              key={name}
              style={{
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: i === 0 || i === 6 ? 'rgba(245,158,11,0.6)' : 'var(--card-muted)',
                padding: '6px 0',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
              {name}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
          }}>
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {daysOfMonth.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const row = rowByDate[dateStr]
            const hasExpense = !!row && row.present > 0
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const todayDay = isToday(day)
            const dow = getDay(day)
            const isWeekendDay = dow === 0 || dow === 6
            return (
              <motion.div
                key={day.toISOString()}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedDay(prev => (prev && isSameDay(prev, day) ? null : day))}
                style={{
                  minHeight: 72,
                  borderRadius: 12,
                  padding: '8px 8px 6px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  border: isSelected ? '1.5px solid rgba(99,102,241,0.5)' : todayDay ? '1.5px solid rgba(99,102,241,0.2)' : '1px solid var(--inner-border)',
                  background: isSelected ? 'rgba(99,102,241,0.12)' : hasExpense ? (row.custom ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.05)') : isWeekendDay ? 'var(--inner-bg)' : 'transparent',
                  transition: 'all 0.15s',
                }}>
                {todayDay && !isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#6366f1',
                    }}
                  />
                )}
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: todayDay ? 700 : 500,
                    color: isSelected ? '#818cf8' : isWeekendDay ? 'rgba(245,158,11,0.7)' : 'var(--card-sub)',
                    marginBottom: 4,
                  }}>
                  {format(day, 'd')}
                </div>
                {hasExpense && (
                  <div>
                    <div
                      style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: isMobile ? 11 : 13,
                        fontWeight: 800,
                        color: '#10b981',
                        lineHeight: 1.1,
                      }}>
                      {brl(row.total)}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        marginTop: 2,
                        fontSize: 10,
                        color: 'var(--card-muted)',
                      }}>
                      <Users size={10} /> {row.present}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
        {/* Legend */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--inner-border)',
            flexWrap: 'wrap',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: 'rgba(16,185,129,0.5)',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--card-muted)' }}>{t.presentWorkers}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: 'rgba(245,158,11,0.5)',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--card-muted)' }}>{t.customizedBadge}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Day detail panel ── */}
      <AnimatePresence mode="wait">
        {selectedRow ? (
          <motion.div
            key="day-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25 }}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: 'var(--card-shadow)',
              borderRadius: 20,
              padding: '24px',
              backdropFilter: 'blur(20px)',
            }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 20,
              }}>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--card-muted)',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>
                  {t.selectedDay}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}>
                  <span
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 22,
                      fontWeight: 800,
                      color: 'var(--card-heading)',
                      letterSpacing: '-0.02em',
                      textTransform: 'capitalize',
                    }}>
                    {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      borderRadius: 100,
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.18)',
                    }}>
                    <Users size={12} color="#818cf8" />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#818cf8',
                      }}>
                      {selectedRow.present}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--card-muted)' }}>{t.presentWorkers}</span>
                  </span>
                  {selectedRow.custom && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#f59e0b',
                        padding: '3px 8px',
                        borderRadius: 100,
                        background: 'rgba(245,158,11,0.12)',
                        border: '1px solid rgba(245,158,11,0.25)',
                      }}>
                      {t.customizedBadge}
                    </span>
                  )}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSnack(selectedRow.date)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 100,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: `1px solid ${selectedRow.snackOn ? 'rgba(139,92,246,0.35)' : 'var(--card-border)'}`,
                    background: selectedRow.snackOn ? 'rgba(139,92,246,0.12)' : 'var(--inner-bg)',
                    color: selectedRow.snackOn ? MEAL_COLORS.snack : 'var(--card-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                  <Cookie size={12} /> {selectedRow.snackOn ? t.snackLabel : t.noSnack}
                </motion.button>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 12,
                    background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.1)',
                  }}>
                  <span style={{ fontSize: 12, color: 'var(--card-muted)' }}>{t.dayTotal}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>{brl(selectedRow.total)}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => (editingDate === selectedRow.date ? setEditingDate(null) : startEditDay(selectedRow))}
                  title={t.customizeDay}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: '1px solid var(--card-border)',
                    background: editingDate === selectedRow.date ? 'rgba(99,102,241,0.12)' : 'transparent',
                    color: editingDate === selectedRow.date ? '#818cf8' : 'var(--card-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}>
                  <Pencil size={14} />
                </motion.button>
              </div>
            </div>

            {/* Breakdown mini-cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 16,
              }}>
              {[
                {
                  icon: Coffee,
                  color: MEAL_COLORS.breakfast,
                  label: t.breakfastLabel,
                  value: selectedRow.cafe,
                },
                {
                  icon: UtensilsCrossed,
                  color: MEAL_COLORS.lunch,
                  label: t.lunchLabel,
                  value: selectedRow.almoco,
                },
                {
                  icon: Cookie,
                  color: MEAL_COLORS.snack,
                  label: t.snackLabel,
                  value: selectedRow.lanche,
                  dim: !selectedRow.snackOn,
                  sub: selectedRow.snackOn ? `${selectedRow.snackCount}/${selectedRow.present}` : null,
                },
              ].map(m => (
                <div
                  key={m.label}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'var(--inner-bg)',
                    border: '1px solid var(--inner-border)',
                    opacity: m.dim ? 0.5 : 1,
                  }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 6,
                      fontSize: 11,
                      color: 'var(--card-muted)',
                    }}>
                    <m.icon size={13} color={m.color} /> {m.label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 16,
                      fontWeight: 800,
                      color: 'var(--card-heading)',
                    }}>
                    {brl(m.value)}
                    {m.sub && (
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--card-muted)',
                          marginLeft: 6,
                        }}>
                        · {m.sub}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Per-day price editor */}
            <AnimatePresence>
              {editingDate === selectedRow.date && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: 14,
                      background: 'rgba(99,102,241,0.05)',
                      border: '1px solid rgba(99,102,241,0.15)',
                      marginBottom: 16,
                    }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 14,
                        flexWrap: 'wrap',
                        alignItems: 'flex-end',
                        marginBottom: 12,
                      }}>
                      {MEALS.map(m => (
                        <PriceInput key={m.key} icon={m.icon} color={m.color} label={m.label} value={dayDraft[m.key]} onChange={v => setDayDraft(d => ({ ...d, [m.key]: v }))} hint={`× ${selectedRow.present} = ${brl(selectedRow.present * num(dayDraft[m.key]))}`} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {selectedRow.custom && (
                        <button
                          onClick={() => clearDayOverride(selectedRow.date)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '9px 14px',
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 600,
                            border: '1px solid var(--card-border)',
                            background: 'var(--inner-bg)',
                            color: 'var(--card-sub)',
                            cursor: 'pointer',
                          }}>
                          <RotateCcw size={13} /> {t.useDefaultPrice}
                        </button>
                      )}
                      <div style={{ flex: 1 }} />
                      <button
                        onClick={() => setEditingDate(null)}
                        style={{
                          padding: '9px 16px',
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 500,
                          border: '1px solid var(--card-border)',
                          background: 'var(--inner-bg)',
                          color: 'var(--card-muted)',
                          cursor: 'pointer',
                        }}>
                        {t.cancel}
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => saveDayOverride(selectedRow.date)}
                        className="btn-primary"
                        style={{
                          padding: '9px 20px',
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 700,
                        }}>
                        {t.savePrices}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Present workers */}
            {selectedRow.snackOn && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                  fontSize: 12,
                  color: 'var(--card-muted)',
                }}>
                <Cookie size={13} color={MEAL_COLORS.snack} /> {t.snackChooseInfo}
              </div>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: 8,
              }}>
              {workDays
                .filter(d => d.date === selectedRow.date)
                .map(d => {
                  const w = workers.find(x => x.id === d.workerId)
                  const color = w?.avatarColor ?? '#6366f1'
                  const noSnack = selectedRow.snackOn && selectedRow.excluded.has(d.workerId)
                  return (
                    <div
                      key={d.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'var(--inner-bg)',
                        border: '1px solid var(--inner-border)',
                        opacity: noSnack ? 0.7 : 1,
                      }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          flexShrink: 0,
                          background: `${color}20`,
                          border: `1.5px solid ${color}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                          color,
                        }}>
                        {w?.avatar ?? '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--card-heading)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                          {w?.name ?? '—'}
                        </div>
                        {w?.jobTitle && (
                          <div
                            style={{
                              fontSize: 10,
                              color: 'var(--card-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                            {w.jobTitle}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 5,
                          flexShrink: 0,
                          alignItems: 'center',
                        }}>
                        <Coffee size={13} color={MEAL_COLORS.breakfast} />
                        <UtensilsCrossed size={13} color={MEAL_COLORS.lunch} />
                        {selectedRow.snackOn ? (
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => toggleWorkerSnack(selectedRow.date, d.workerId)}
                            title={noSnack ? t.snackLabel : t.noSnack}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              padding: 2,
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: 6,
                            }}>
                            <Cookie size={15} color={noSnack ? 'var(--card-dim)' : MEAL_COLORS.snack} style={{ opacity: noSnack ? 0.35 : 1 }} />
                          </motion.button>
                        ) : (
                          <Cookie size={13} color="var(--card-dim)" style={{ opacity: 0.3 }} />
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </motion.div>
        ) : selectedDay ? (
          <motion.div
            key="no-presence"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25 }}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: 'var(--card-shadow)',
              borderRadius: 20,
              padding: '40px 24px',
              textAlign: 'center',
            }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>🍽️</div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--card-heading)',
                marginBottom: 6,
                textTransform: 'capitalize',
              }}>
              {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
            </div>
            <div style={{ fontSize: 13, color: 'var(--card-muted)' }}>{t.noPresenceMonth}</div>
          </motion.div>
        ) : (
          <motion.div
            key="empty-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: 'var(--card-shadow)',
              borderRadius: 20,
              padding: '40px 24px',
              textAlign: 'center',
            }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--card-heading)',
                marginBottom: 6,
              }}>
              {t.selectADay}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--card-muted)',
                lineHeight: 1.5,
              }}>
              {t.clickAnyDay}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Export modal ── */}
      <AnimatePresence>
        {showExport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExport(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 500,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: 24,
              paddingTop: '8vh',
            }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 460,
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 22,
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
              }}>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '22px 24px',
                  borderBottom: '1px solid var(--inner-border)',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Download size={16} color="#818cf8" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 17,
                        fontWeight: 800,
                        color: 'var(--card-heading)',
                      }}>
                      {t.exportReport}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--card-muted)',
                        textTransform: 'capitalize',
                      }}>
                      {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowExport(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid var(--card-border)',
                    background: 'var(--inner-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--card-muted)',
                  }}>
                  <X size={15} />
                </button>
              </div>
              {/* Formatos */}
              <div
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                {[
                  {
                    id: 'csv',
                    icon: FileSpreadsheet,
                    color: '#10b981',
                    label: t.csvLabel,
                    desc: t.expensesCsvDesc,
                  },
                  {
                    id: 'pdf',
                    icon: FileText,
                    color: '#6366f1',
                    label: t.pdfLabel,
                    desc: t.expensesPdfDesc,
                  },
                ].map(f => (
                  <motion.button
                    key={f.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => doExport(f.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '16px',
                      borderRadius: 14,
                      cursor: 'pointer',
                      textAlign: 'left',
                      border: '1px solid var(--card-border)',
                      background: 'var(--inner-bg)',
                    }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: `${f.color}1f`,
                        border: `1px solid ${f.color}33`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                      <f.icon size={20} color={f.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--card-heading)',
                        }}>
                        {f.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--card-muted)',
                          marginTop: 2,
                          lineHeight: 1.4,
                        }}>
                        {f.desc}
                      </div>
                    </div>
                    <Download size={16} color="var(--card-muted)" style={{ flexShrink: 0 }} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
