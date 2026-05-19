import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts'
import { Download, Filter, TrendingUp, CalendarDays, BarChart3, Users, ChevronDown, FileText, FileSpreadsheet, CheckCircle2, Loader2, X } from 'lucide-react'
import { getDashboardStats, getWorkerStats } from '../../data/mockData'
import { useIsMobile } from '../../hooks/useIsMobile'
import { format, subDays, parseISO, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import i18n from '../../i18n'

// ── CSV export ─────────────────────────────────────────────
function exportCSV({ topEarners, byLocation, monthlyData, byDayOfWeek, period, periodData }) {
  const BOM = '﻿'
  const dateStr = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

  const lines = [
    `Relatório de Análises — Gerado em ${dateStr}`,
    `Período: Últimos ${period === '7d' ? '7' : '30'} dias`,
    '',
    '== TOP DIARISTAS POR GANHO ==',
    'Pos;Nome;Cargo;Departamento;Total Ganho (R$)',
    ...topEarners.map((w, i) => [
      `${i + 1}º`, w.name, w.jobTitle, w.department,
      w.totalEarnings.toFixed(2).replace('.', ','),
    ].join(';')),
    '',
    '== PERFORMANCE POR LOCAL ==',
    'Local;Dias;Ganho Total (R$)',
    ...byLocation.map(l => [l.name, l.days, l.earnings.toFixed(2).replace('.', ',')].join(';')),
    '',
    '== COMPARATIVO MENSAL ==',
    'Mês;Dias;Ganho Total (R$)',
    ...monthlyData.map(m => [m.month, m.days, m.earnings.toFixed(2).replace('.', ',')].join(';')),
    '',
    '== DISTRIBUIÇÃO POR DIA DA SEMANA ==',
    'Dia;Total Jornadas;Ganho (R$)',
    ...byDayOfWeek.map(d => [d.day, d.total, d.earnings.toFixed(2).replace('.', ',')].join(';')),
  ]

  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `diaria-pro-relatorio-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── PDF export ─────────────────────────────────────────────
function exportPDF({ topEarners, byLocation, monthlyData, period, stats }) {
  const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  const earnerRows = topEarners.map((w, i) => `
    <tr>
      <td>${i + 1}º</td>
      <td><strong>${w.name}</strong><br/><small>${w.jobTitle} — ${w.department}</small></td>
      <td class="num green"><strong>R$ ${w.totalEarnings.toLocaleString('pt-BR')}</strong></td>
    </tr>
  `).join('')

  const locationRows = byLocation.map(l => `
    <tr>
      <td>${l.name}</td>
      <td class="num">${l.days} dias</td>
      <td class="num green"><strong>R$ ${l.earnings.toLocaleString('pt-BR')}</strong></td>
    </tr>
  `).join('')

  const monthlyRows = monthlyData.map((m, i) => `
    <tr ${i === monthlyData.length - 1 ? 'class="highlight"' : ''}>
      <td>${m.month}</td>
      <td class="num">${m.days} dias</td>
      <td class="num green"><strong>R$ ${m.earnings.toLocaleString('pt-BR')}</strong></td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Relatório de Análises — Diária Pro</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #1e1e2e; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #f1f5f9; }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-icon { width: 42px; height: 42px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 18px; }
    .logo-text h1 { font-size: 20px; font-weight: 800; color: #1e1e2e; }
    .logo-text p { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
    .meta { text-align: right; }
    .meta h2 { font-size: 16px; font-weight: 700; color: #6366f1; }
    .meta p { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .kpi { padding: 16px 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; }
    .kpi label { display: block; font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
    .kpi span { font-size: 22px; font-weight: 800; }
    .kpi.green span { color: #10b981; }
    .kpi.indigo span { color: #6366f1; }
    .kpi.gold span { color: #f59e0b; }
    h3 { font-size: 15px; font-weight: 700; color: #1e1e2e; margin: 28px 0 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 8px; }
    thead tr { background: #6366f1; color: white; }
    thead th { padding: 11px 14px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    thead th.num { text-align: right; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    td small { color: #94a3b8; font-size: 11px; display: block; margin-top: 2px; }
    td.num { text-align: right; }
    td.green { color: #10b981; }
    tr.highlight { background: #f0fdf4 !important; border-top: 2px solid #10b981; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
    @media print { body { padding: 20px; } @page { margin: 1cm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-icon">D</div>
      <div class="logo-text"><h1>Diária Pro</h1><p>Gestão de Diaristas</p></div>
    </div>
    <div class="meta">
      <h2>Relatório de Análises</h2>
      <p>${dateStr} · Período: últimos ${period === '7d' ? '7' : '30'} dias</p>
    </div>
  </div>
  <div class="kpis">
    <div class="kpi green"><label>Total Geral</label><span>R$ ${stats.totalEarnings.toLocaleString('pt-BR')}</span></div>
    <div class="kpi indigo"><label>Total de Dias</label><span>${stats.totalDays} dias</span></div>
    <div class="kpi gold"><label>Diaristas Ativos</label><span>${stats.activeWorkers}</span></div>
  </div>
  <h3>Top Diaristas por Ganho</h3>
  <table><thead><tr><th>#</th><th>Diarista</th><th class="num">Total Ganho</th></tr></thead><tbody>${earnerRows}</tbody></table>
  <h3>Performance por Local</h3>
  <table><thead><tr><th>Local</th><th class="num">Dias</th><th class="num">Ganho Total</th></tr></thead><tbody>${locationRows}</tbody></table>
  <h3>Comparativo Mensal</h3>
  <table><thead><tr><th>Mês</th><th class="num">Dias</th><th class="num">Ganho Total</th></tr></thead><tbody>${monthlyRows}</tbody></table>
  <div class="footer">
    <span>Diária Pro — Relatório gerado automaticamente</span>
    <span>${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
  </div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
}

// ── CSV por dia (Reports) ──────────────────────────────────
function exportDayCSV(dayRows) {
  const BOM = '﻿'
  const headers = ['Data', 'Dia da Semana', 'Trabalhador', 'Cargo', 'Departamento', 'Local', 'Tipo', 'Valor (R$)']
  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const rows = dayRows.map(d => {
    const date = parseISO(d.date)
    const dow = DAYS[date.getDay()]
    const tipo = d.isWeekend ? (date.getDay() === 6 ? 'Sábado' : 'Dom/Feriado') : 'Semana'
    return [format(date, 'dd/MM/yyyy'), dow, d.workerName, d.jobTitle, d.department, d.locationName || '—', tipo, d.earnings.toFixed(2).replace('.', ',')]
  })
  const total = dayRows.reduce((s, d) => s + d.earnings, 0)
  const csv = [
    `Relatório por Dia — Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    '', headers.join(';'), ...rows.map(r => r.join(';')), '',
    `TOTAL GERAL;;;;;;;${total.toFixed(2).replace('.', ',')}`,
  ].join('\n')
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `diaria-pro-por-dia-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click(); URL.revokeObjectURL(url)
}

function exportDayPDF(dayRows) {
  const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const total = dayRows.reduce((s, d) => s + d.earnings, 0)
  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const rows = dayRows.map(d => {
    const date = parseISO(d.date)
    const dow = DAYS[date.getDay()]
    const isWkd = d.isWeekend
    const isSun = date.getDay() === 0
    const color = isWkd ? (isSun ? '#ef4444' : '#f59e0b') : '#6366f1'
    const tipo = isWkd ? (date.getDay() === 6 ? 'Sábado' : 'Dom/Feriado') : 'Semana'
    return `<tr><td><strong>${format(date, 'dd/MM/yyyy')}</strong><br/><small>${dow}</small></td><td>${d.workerName}<br/><small>${d.jobTitle}</small></td><td>${d.locationName || '—'}</td><td style="color:${color};font-weight:600">${tipo}</td><td class="num" style="color:${color};font-weight:700">R$ ${d.earnings.toLocaleString('pt-BR')}</td></tr>`
  }).join('')
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Relatório por Dia</title>
  <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;padding:40px;color:#1e1e2e}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #f1f5f9}.logo{display:flex;align-items:center;gap:12px}.logo-icon{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px}.logo-text h1{font-size:20px;font-weight:800}.logo-text p{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em}.meta{text-align:right}.meta h2{font-size:16px;font-weight:700;color:#6366f1}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px}.kpi{padding:14px 18px;border-radius:12px;border:1px solid #e2e8f0;background:#f8fafc}.kpi label{display:block;font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}.kpi span{font-size:20px;font-weight:800}.green span{color:#10b981}.indigo span{color:#6366f1}.gold span{color:#f59e0b}table{width:100%;border-collapse:collapse;font-size:13px}thead tr{background:#6366f1;color:#fff}thead th{padding:10px 14px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em}th.num,td.num{text-align:right}tbody tr:nth-child(even){background:#f8fafc}td{padding:11px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle}td small{color:#94a3b8;font-size:11px;display:block;margin-top:2px}.total-row{background:#f0fdf4!important;border-top:2px solid #10b981}.total-row td{font-weight:700;padding:14px}.footer{margin-top:28px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8}@media print{body{padding:20px}@page{margin:1cm}}</style></head>
  <body><div class="header"><div class="logo"><div class="logo-icon">D</div><div class="logo-text"><h1>Diária Pro</h1><p>Gestão de Diaristas</p></div></div><div class="meta"><h2>Relatório por Dia</h2><p>${dateStr}</p></div></div>
  <div class="kpis"><div class="kpi green"><label>Total</label><span>R$ ${total.toLocaleString('pt-BR')}</span></div><div class="kpi indigo"><label>Registros</label><span>${dayRows.length} dias</span></div><div class="kpi gold"><label>Fins de Semana</label><span>${dayRows.filter(d => d.isWeekend).length} dias</span></div></div>
  <table><thead><tr><th>Data</th><th>Trabalhador</th><th>Local</th><th>Tipo</th><th class="num">Valor</th></tr></thead><tbody>${rows}<tr class="total-row"><td colspan="4">TOTAL GERAL</td><td class="num" style="color:#10b981;font-size:15px">R$ ${total.toLocaleString('pt-BR')}</td></tr></tbody></table>
  <div class="footer"><span>Diária Pro — Relatório gerado automaticamente</span><span>${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span></div>
  <script>window.onload=()=>window.print()</script></body></html>`
  const win = window.open('', '_blank'); win.document.write(html); win.document.close()
}

// ── Mini date picker ───────────────────────────────────────
function MiniDatePicker({ value, onChange, label }) {
  const [open, setOpen]   = useState(false)
  const [month, setMonth] = useState(() => value ? parseISO(value) : new Date())
  const [pos, setPos]     = useState({ top: 0, left: 0, width: 0 })
  const btnRef            = useRef(null)
  const calRef            = useRef(null)

  const selected = value ? parseISO(value) : null
  const firstDay = startOfMonth(month)
  const days     = eachDayOfInterval({ start: firstDay, end: endOfMonth(month) })
  const startPad = getDay(firstDay)
  const WEEK     = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 240) })
    }
    setOpen(o => !o)
  }

  const handleSelect = (day) => { onChange(format(day, 'yyyy-MM-dd')); setOpen(false) }
  const handleClear  = (e)   => { e.stopPropagation(); onChange('') }

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (btnRef.current?.contains(e.target)) return
      if (calRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      <motion.button ref={btnRef} type="button" whileTap={{ scale: 0.97 }} onClick={handleOpen}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 10, cursor: 'pointer', background: open ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${open ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`, color: selected ? '#f1f5f9' : 'rgba(255,255,255,0.3)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
        <span>{selected ? format(selected, 'dd/MM/yyyy') : 'dd/mm/aaaa'}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {selected && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={handleClear} style={{ color: 'rgba(239,68,68,0.6)', lineHeight: 1, fontSize: 16, padding: '0 2px' }}>×</motion.span>}
          <span style={{ fontSize: 12, opacity: 0.4 }}>▾</span>
        </span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div ref={calRef} initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.18 }}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 99999, background: 'linear-gradient(135deg, #1c1c32 0%, #14141f 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 12px', boxShadow: '0 24px 60px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <motion.button type="button" whileTap={{ scale: 0.88 }} onClick={() => setMonth(m => subMonths(m, 1))} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</motion.button>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', textTransform: 'capitalize' }}>{format(month, 'MMMM yyyy', { locale: ptBR })}</span>
              <motion.button type="button" whileTap={{ scale: 0.88 }} onClick={() => setMonth(m => addMonths(m, 1))} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</motion.button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {WEEK.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.22)', paddingBottom: 4 }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {Array(startPad).fill(null).map((_, i) => <div key={`p${i}`} />)}
              {days.map(day => {
                const isSel = selected && isSameDay(day, selected)
                const isTod = isToday(day)
                const isWkd = getDay(day) === 0 || getDay(day) === 6
                return (
                  <motion.button key={day.toISOString()} type="button" whileHover={{ background: isSel ? '#6366f1' : 'rgba(99,102,241,0.15)' }} whileTap={{ scale: 0.85 }} onClick={() => handleSelect(day)}
                    style={{ padding: '6px 0', borderRadius: 7, border: isTod && !isSel ? '1.5px solid rgba(99,102,241,0.45)' : '1.5px solid transparent', background: isSel ? '#6366f1' : 'transparent', color: isSel ? '#fff' : isWkd ? 'rgba(245,158,11,0.75)' : 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: isSel || isTod ? 700 : 400, cursor: 'pointer', textAlign: 'center' }}>
                    {format(day, 'd')}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Export Modal ───────────────────────────────────────────
function ExportModal({ onClose, exportData, workers, workDays, locations, t }) {
  const [selected, setSelected] = useState('csv')
  const [groupBy, setGroupBy]   = useState('worker')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [status, setStatus]     = useState('idle')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const activeDayRows = (() => {
    return [...(workDays || [])]
      .filter(d => (!dateFrom || d.date >= dateFrom) && (!dateTo || d.date <= dateTo))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => {
        const w = (workers || []).find(x => x.id === d.workerId) || {}
        const l = (locations || []).find(x => x.id === d.locationId) || {}
        return { ...d, workerName: w.name || '—', jobTitle: w.jobTitle || '—', department: w.department || '—', locationName: l.name || '—' }
      })
  })()

  const previewTotal   = groupBy === 'day' ? activeDayRows.reduce((s, d) => s + d.earnings, 0) : exportData.stats.totalEarnings
  const previewDays    = groupBy === 'day' ? activeDayRows.length : exportData.stats.totalDays
  const previewWorkers = groupBy === 'day' ? new Set(activeDayRows.map(d => d.workerId)).size : exportData.stats.activeWorkers

  const FORMATS = [
    { id: 'csv', label: t.reportsCsvLabel, ext: '.csv', icon: FileSpreadsheet, color: '#10b981', desc: t.reportsCsvDesc },
    { id: 'pdf', label: t.reportsPdfLabel, ext: '.pdf', icon: FileText,        color: '#6366f1', desc: t.reportsPdfDesc },
  ]

  const handleExport = async () => {
    setStatus('loading')
    await new Promise(r => setTimeout(r, 900))
    if (groupBy === 'day') {
      if (selected === 'csv') exportDayCSV(activeDayRows)
      else exportDayPDF(activeDayRows)
    } else {
      if (selected === 'csv') exportCSV(exportData)
      else exportPDF(exportData)
    }
    setStatus('done')
    setTimeout(() => { setStatus('idle'); onClose() }, 1600)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: 24, paddingTop: '5vh',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'linear-gradient(135deg, #131325 0%, #0f0f1e 100%)',
          border: '1px solid var(--card-border)',
          borderRadius: 22, overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 24px', borderBottom: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download size={16} color="#818cf8" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: 'var(--card-heading)', letterSpacing: '-0.02em' }}>{t.exportReportTitle}</h2>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--card-muted)' }}>{t.chooseFormat}</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--card-border)', background: 'var(--inner-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--card-sub)' }}>
            <X size={14} />
          </motion.button>
        </div>

        <div style={{ padding: '22px 24px' }}>
          {/* Stats preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20, padding: 14, borderRadius: 14, background: 'var(--inner-bg)', border: '1px solid var(--inner-border)' }}>
            {[
              { label: t.workersLabel ?? 'Diaristas', value: previewWorkers,                                          color: '#818cf8' },
              { label: t.days,                        value: previewDays,                                             color: '#10b981' },
              { label: 'Total (R$)',                  value: `R$ ${previewTotal.toLocaleString('pt-BR')}`,            color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--card-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Grouping selector */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Agrupar por</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ id: 'worker', label: 'Por Trabalhador', icon: '👤' }, { id: 'day', label: 'Por Dia', icon: '📅' }].map(g => (
                <motion.button key={g.id} whileTap={{ scale: 0.97 }} onClick={() => setGroupBy(g.id)}
                  style={{ flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', background: groupBy === g.id ? 'rgba(99,102,241,0.12)' : 'var(--inner-bg)', border: `1.5px solid ${groupBy === g.id ? 'rgba(99,102,241,0.5)' : 'var(--card-border)'}`, color: groupBy === g.id ? '#818cf8' : 'var(--card-muted)', fontSize: 12, fontWeight: 700, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span>{g.icon}</span>{g.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Date filter */}
          <AnimatePresence>
            {groupBy === 'day' && (
              <motion.div key="date-filter" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 18 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'visible' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Período</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <MiniDatePicker label="De"  value={dateFrom} onChange={setDateFrom} />
                  <MiniDatePicker label="Até" value={dateTo}   onChange={setDateTo}   />
                </div>
                {(dateFrom || dateTo) && (
                  <button onClick={() => { setDateFrom(''); setDateTo('') }}
                    style={{ marginTop: 8, fontSize: 11, color: 'rgba(239,68,68,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Limpar período
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Format selector */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{t.format}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FORMATS.map(fmt => {
                const active = selected === fmt.id
                const Icon = fmt.icon
                return (
                  <motion.button key={fmt.id} whileTap={{ scale: 0.98 }} onClick={() => setSelected(fmt.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${active ? fmt.color + '40' : 'var(--card-border)'}`, background: active ? `${fmt.color}10` : 'var(--inner-bg)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${active ? fmt.color : 'var(--card-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      {active && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ width: 8, height: 8, borderRadius: '50%', background: fmt.color }} />}
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${fmt.color}15`, border: `1px solid ${fmt.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={17} color={active ? fmt.color : 'var(--card-muted)'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: active ? 'var(--card-heading)' : 'var(--card-sub)' }}>{fmt.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: `${fmt.color}18`, color: fmt.color, fontFamily: 'monospace' }}>{fmt.ext}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--card-muted)', lineHeight: 1.4 }}>{fmt.desc}</div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Download button */}
          <motion.button
            whileHover={status === 'idle' ? { scale: 1.02 } : {}}
            whileTap={status === 'idle' ? { scale: 0.98 } : {}}
            onClick={status === 'idle' ? handleExport : undefined}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: status === 'idle' ? 'pointer' : 'default',
              background: status === 'done' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              boxShadow: '0 8px 24px rgba(99,102,241,0.35)', transition: 'background 0.3s',
            }}
          >
            <AnimatePresence mode="wait">
              {status === 'idle' && (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Download size={17} /> {selected === 'csv' ? t.downloadCsv : t.generatePdf}
                </motion.span>
              )}
              {status === 'loading' && (
                <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Loader2 size={17} /></motion.div>
                  {t.generating}
                </motion.span>
              )}
              {status === 'done' && (
                <motion.span key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <CheckCircle2 size={17} /> {t.fileReady}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--card-bg-elevated)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
      <div style={{ fontSize: 11, color: 'var(--card-sub)', marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.stroke || p.fill }} />
          <span style={{ fontSize: 13, color: 'var(--card-heading)', fontWeight: 600 }}>
            {typeof p.value === 'number' && p.value > 100 ? `R$ ${p.value.toLocaleString('pt-BR')}` : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Reports({ lang = 'pt', workers, workDays, locations }) {
  const isMobile = useIsMobile()
  const t = i18n[lang] ?? i18n.pt
  const stats = getDashboardStats(workers, workDays, locations)
  const [period, setPeriod]       = useState('30d')
  const [activeChart, setActiveChart] = useState('earnings')
  const [showExport, setShowExport]   = useState(false)

  // Workers per day of week
  const byDayOfWeek = [0, 1, 2, 3, 4, 5, 6].map(dow => {
    const days = workDays.filter(d => getDay(parseISO(d.date)) === dow)
    return {
      day: t.reportsDayNames[dow],
      total: days.length,
      earnings: days.reduce((s, d) => s + d.earnings, 0),
      isWeekend: dow === 0 || dow === 6,
    }
  })

  // Monthly comparison (last 3 months simulated)
  const monthlyData = [
    { month: t.reportsMonths[0], earnings: 28400, days: 98 },
    { month: t.reportsMonths[1], earnings: 34200, days: 112 },
    { month: t.reportsMonths[2], earnings: 31800, days: 105 },
    { month: t.reportsMonths[3], earnings: stats.totalEarnings, days: stats.totalDays },
  ]

  // Top earners
  const topEarners = workers.map(w => {
    const s = getWorkerStats(w.id, workDays)
    return { ...w, ...s }
  }).sort((a, b) => b.totalEarnings - a.totalEarnings).slice(0, 5)

  const data = period === '7d' ? stats.last7days : stats.last30days

  const chartTitleMap = {
    earnings:   `${t.chartPayments} — ${period === '7d' ? t.sevenDays : t.thirtyDays}`,
    workers:    `${t.chartWorkdays} — ${period === '7d' ? t.sevenDays : t.thirtyDays}`,
    dayofweek:  t.chartByDay,
    monthly:    t.chartMonthly,
  }

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', flexWrap: 'wrap', gap: isMobile ? 16 : 0 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: isMobile ? 24 : 30, fontWeight: 800, color: 'var(--page-heading)', margin: 0, letterSpacing: '-0.02em' }}>
              {t.reportsTitle}
            </h1>
            <p style={{ margin: '8px 0 0', color: 'var(--page-sub)', fontSize: 15 }}>
              {t.reportsSubtitle}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Period selector */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', borderRadius: 12, padding: 4 }}>
              {['7d', '30d'].map(p => (
                <motion.button
                  key={p}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: period === p ? 'rgba(99,102,241,0.2)' : 'transparent',
                    color: period === p ? '#818cf8' : 'var(--card-muted)',
                  }}
                >
                  {p === '7d' ? t.sevenDays : t.thirtyDays}
                </motion.button>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowExport(true)}
              style={{
                padding: '11px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                border: '1px solid rgba(99,102,241,0.3)', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
                color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              <Download size={15} />
              {t.exportBtn}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Chart type tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}
      >
        {[
          { id: 'earnings',  label: t.chartPayments, icon: TrendingUp },
          { id: 'workers',   label: t.chartWorkdays, icon: Users },
          { id: 'dayofweek', label: t.chartByDay,    icon: CalendarDays },
          { id: 'monthly',   label: t.chartMonthly,  icon: BarChart3 },
        ].map(tab => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveChart(tab.id)}
            style={{
              padding: '10px 18px', borderRadius: 11, fontSize: 13, fontWeight: 600,
              border: `1px solid ${activeChart === tab.id ? 'rgba(99,102,241,0.35)' : 'var(--card-border)'}`,
              background: activeChart === tab.id ? 'rgba(99,102,241,0.12)' : 'var(--inner-bg)',
              color: activeChart === tab.id ? '#818cf8' : 'var(--card-sub)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s',
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Main chart */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeChart + period}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.25 }}
          style={{
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            borderRadius: 20, padding: '28px', marginBottom: 20,
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--card-heading)' }}>
              {chartTitleMap[activeChart]}
            </h2>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            {activeChart === 'earnings' ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--inner-border)" />
                <XAxis dataKey="day" tick={{ fill: 'var(--card-muted)', fontSize: 11 }} tickLine={false} axisLine={false} interval={period === '30d' ? 4 : 0} />
                <YAxis tick={{ fill: 'var(--card-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="earnings" stroke="#6366f1" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            ) : activeChart === 'workers' ? (
              <BarChart data={data} barSize={period === '7d' ? 28 : 12}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--inner-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--card-muted)', fontSize: 11 }} tickLine={false} axisLine={false} interval={period === '30d' ? 4 : 0} />
                <YAxis tick={{ fill: 'var(--card-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="workers" radius={[6, 6, 0, 0]}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={`rgba(16,185,129,${0.4 + (entry.workers / 10) * 0.6})`} />
                  ))}
                </Bar>
              </BarChart>
            ) : activeChart === 'dayofweek' ? (
              <BarChart data={byDayOfWeek} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--inner-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--card-sub)', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fill: 'var(--card-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--card-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="total" radius={[8, 8, 0, 0]}>
                  {byDayOfWeek.map((entry, i) => (
                    <Cell key={i} fill={entry.isWeekend ? '#f59e0b' : '#6366f1'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={monthlyData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--inner-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--card-sub)', fontSize: 13 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'var(--card-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="earnings" radius={[8, 8, 0, 0]}>
                  {monthlyData.map((entry, i) => (
                    <Cell key={i} fill={i === monthlyData.length - 1 ? '#6366f1' : 'rgba(99,102,241,0.4)'} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>

      {/* Export modal */}
      <AnimatePresence>
        {showExport && (
          <ExportModal
            onClose={() => setShowExport(false)}
            exportData={{ topEarners, byLocation: stats.byLocation, monthlyData, byDayOfWeek, period, periodData: data, stats }}
            workers={workers}
            workDays={workDays}
            locations={locations}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
        {/* Top earners */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', borderRadius: 20, padding: '24px' }}
        >
          <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: 'var(--card-heading)' }}>
            {t.topEarners}
          </h3>
          {topEarners.map((w, i) => {
            const maxEarnings = topEarners[0]?.totalEarnings || 1
            const pct = (w.totalEarnings / maxEarnings) * 100
            return (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                style={{ marginBottom: i < 4 ? 16 : 0 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? '#f59e0b' : 'var(--card-muted)', width: 16 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${w.avatarColor}20`, border: `1.5px solid ${w.avatarColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: w.avatarColor }}>
                      {w.avatar}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--card-heading)' }}>
                      {w.name.split(' ')[0]} {w.name.split(' ').slice(-1)}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>
                    R$ {w.totalEarnings.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--inner-bg)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${w.avatarColor}, ${w.avatarColor}80)` }}
                  />
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Location performance */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', borderRadius: 20, padding: '24px' }}
        >
          <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: 'var(--card-heading)' }}>
            {t.locationPerformance}
          </h3>
          {stats.byLocation.map((loc, i) => {
            const maxDays = Math.max(...stats.byLocation.map(l => l.days), 1)
            return (
              <motion.div
                key={loc.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                style={{
                  padding: '14px', borderRadius: 12, marginBottom: 8,
                  background: `${loc.color}06`, border: `1px solid ${loc.color}15`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: loc.color }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--card-heading)' }}>{loc.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: loc.color }}>
                      R$ {loc.earnings.toLocaleString('pt-BR')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--card-muted)' }}>{loc.days} {t.days}</div>
                  </div>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--inner-bg)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(loc.days / maxDays) * 100}%` }}
                    transition={{ delay: 0.35 + i * 0.06, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    style={{ height: '100%', borderRadius: 2, background: loc.color }}
                  />
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
