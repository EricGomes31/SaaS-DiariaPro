import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { DollarSign, Sun, Moon, Download, X, FileText, FileSpreadsheet, CheckCircle2, Loader2, QrCode, Copy, Check, BadgeCheck, RotateCcw } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { getWorkerStats, PIX_KEY_TYPES } from '../../data/mockData'
import { useIsMobile } from '../../hooks/useIsMobile'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import i18n from '../../i18n'

// ── Pix BR Code payload (EMV / BACEN spec) ────────────────
function crc16(str) {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function buildPixPayload(pixKey, merchantName) {
  const f = (id, value) => `${id}${String(value.length).padStart(2, '0')}${value}`
  const gui = f('00', 'BR.GOV.BCB.PIX')
  const key = f('01', pixKey)
  const mai = f('26', gui + key)
  const name = f('59', merchantName.slice(0, 25))
  const city = f('60', 'SAO PAULO')
  const txid = f('62', f('05', '***'))
  const body = `000201${mai}520400005303986${name}${city}5802BR${txid}6304`
  return body + crc16(body)
}

// ── Pix QR Code modal ──────────────────────────────────────
function PixQrModal({ worker, pendingAmount, overtimeAmount = 0, pendingWorkDayIds, onMarkPaid, onClose, t }) {
  const [copied, setCopied] = useState(false)
  const [paid, setPaid] = useState(false)
  const payload = buildPixPayload(worker.pixKey, worker.name)
  const pixTypeLabel = PIX_KEY_TYPES.find(pt => pt.value === worker.pixKeyType)?.label || 'PIX'

  const handleCopy = () => {
    navigator.clipboard.writeText(payload).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const svg = document.getElementById('pix-qr-svg-pay')
    if (!svg) return
    const svgStr = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pix-${worker.name.replace(/\s+/g, '-').toLowerCase()}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleMarkPaid = () => {
    if (paid) return
    setPaid(true)
    setTimeout(() => onMarkPaid(worker, pendingWorkDayIds, pendingAmount), 1400)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)', padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 24 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)', border: '1px solid rgba(6,182,212,0.25)',
          borderRadius: 24, padding: 32, width: 360, maxWidth: '92vw',
          boxShadow: '0 0 60px rgba(6,182,212,0.12)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{t.pixQrTitle}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--card-muted)' }}>{t.pointCamera}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--card-muted)', padding: 4, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Worker badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          padding: '12px 14px', borderRadius: 14,
          background: `${worker.avatarColor}10`, border: `1px solid ${worker.avatarColor}25`,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: `${worker.avatarColor}25`, border: `2px solid ${worker.avatarColor}45`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: worker.avatarColor, flexShrink: 0,
          }}>
            {worker.avatar}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {worker.name}
            </div>
            <div style={{ fontSize: 11, color: '#06b6d4', marginTop: 2 }}>
              {pixTypeLabel} · {worker.pixKey}
            </div>
          </div>
        </div>

        {/* QR code */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          background: '#ffffff', borderRadius: 18, padding: 20, marginBottom: 20,
          boxShadow: '0 0 0 1px rgba(6,182,212,0.2)',
        }}>
          <QRCodeSVG id="pix-qr-svg-pay" value={payload} size={220} level="M" bgColor="#ffffff" fgColor="#0f172a" />
        </div>

        {/* Pix key label */}
        <div style={{
          padding: '12px 14px', borderRadius: 12, marginBottom: 16,
          background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <QrCode size={14} color="#06b6d4" />
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {worker.pixKey}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#06b6d4', padding: '2px 7px', borderRadius: 100, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)', flexShrink: 0 }}>
            {pixTypeLabel}
          </span>
        </div>

        {/* Amount breakdown */}
        <div style={{
          padding: '12px 14px', borderRadius: 12, marginBottom: 16,
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {overtimeAmount > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--card-muted)' }}>
                <span>{t.overtimeDailies}</span>
                <span>R$ {(pendingAmount - overtimeAmount).toLocaleString('pt-BR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
                <span>+ {t.overtimeExtra}</span>
                <span>R$ {overtimeAmount.toLocaleString('pt-BR')}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(16,185,129,0.15)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: '#10b981' }}>
                <span>Total</span>
                <span>R$ {pendingAmount.toLocaleString('pt-BR')}</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: '#10b981' }}>
              <span>Total</span>
              <span>R$ {pendingAmount.toLocaleString('pt-BR')}</span>
            </div>
          )}
        </div>

        {/* Copy / Download actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleCopy}
            style={{
              flex: 1, padding: '11px', borderRadius: 12, cursor: 'pointer',
              border: `1px solid ${copied ? 'rgba(16,185,129,0.35)' : 'rgba(6,182,212,0.3)'}`,
              background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(6,182,212,0.08)',
              color: copied ? '#10b981' : '#06b6d4',
              fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.2s',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? t.copiedLabel : t.copyPayload}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleDownload}
            style={{
              flex: 1, padding: '11px', borderRadius: 12, cursor: 'pointer',
              border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)',
              color: '#818cf8', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Download size={14} />
            {t.saveQr}
          </motion.button>
        </div>

        {/* Mark as paid button */}
        {pendingAmount > 0 && (
          <motion.button
            whileHover={!paid ? { scale: 1.02, boxShadow: '0 8px 24px rgba(16,185,129,0.35)' } : {}}
            whileTap={!paid ? { scale: 0.98 } : {}}
            onClick={handleMarkPaid}
            style={{
              marginTop: 12, width: '100%', padding: '13px', borderRadius: 12, border: 'none',
              cursor: paid ? 'default' : 'pointer',
              background: paid
                ? 'linear-gradient(135deg, #059669, #047857)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: paid ? 'none' : '0 4px 16px rgba(16,185,129,0.25)',
              transition: 'background 0.3s, box-shadow 0.3s',
            }}
          >
            <AnimatePresence mode="wait">
              {paid ? (
                <motion.span key="paid"
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} />
                  {t.paymentRegistered}
                </motion.span>
              ) : (
                <motion.span key="unpaid"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BadgeCheck size={16} />
                  {t.confirmPayment} · R$ {pendingAmount.toLocaleString('pt-BR')}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── CSV export ─────────────────────────────────────────────
function exportCSV(workerSummary) {
  const BOM = '﻿'
  const headers = [
    'Trabalhador', 'Cargo', 'Departamento', 'Chave PIX',
    'Dias Semana', 'Dias Fds/Feriado',
    'Ganho Semana (R$)', 'Ganho Fds/Feriado (R$)', 'Total (R$)',
    'Diária Semana (R$)', 'Diária Sábado (R$)', 'Diária Domingo (R$)',
  ]

  const rows = workerSummary.map(w => [
    w.name,
    w.jobTitle,
    w.department,
    w.pixKey || '—',
    w.weekdayDays,
    w.weekendDays,
    w.weekdayEarnings.toFixed(2).replace('.', ','),
    w.weekendEarnings.toFixed(2).replace('.', ','),
    w.totalEarnings.toFixed(2).replace('.', ','),
    w.weekdayRate.toFixed(2).replace('.', ','),
    (w.saturdayRate ?? 0).toFixed(2).replace('.', ','),
    (w.sundayRate ?? 0).toFixed(2).replace('.', ','),
  ])

  const totals = [
    'TOTAL GERAL', '', '', '',
    workerSummary.reduce((s, w) => s + w.weekdayDays, 0),
    workerSummary.reduce((s, w) => s + w.weekendDays, 0),
    workerSummary.reduce((s, w) => s + w.weekdayEarnings, 0).toFixed(2).replace('.', ','),
    workerSummary.reduce((s, w) => s + w.weekendEarnings, 0).toFixed(2).replace('.', ','),
    workerSummary.reduce((s, w) => s + w.totalEarnings, 0).toFixed(2).replace('.', ','),
    '', '',
  ]

  const csv = [
    `Relatório de Pagamentos — Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    '',
    headers.join(';'),
    ...rows.map(r => r.join(';')),
    '',
    totals.join(';'),
  ].join('\n')

  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `diaria-pro-pagamentos-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── PDF export (print window) ──────────────────────────────
function exportPDF(workerSummary, totals) {
  const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const totalGeral = workerSummary.reduce((s, w) => s + w.totalEarnings, 0)

  const rows = workerSummary.map(w => `
    <tr>
      <td>
        <strong>${w.name}</strong><br/>
        <small>${w.jobTitle}</small>
      </td>
      <td>${w.department}</td>
      <td class="mono">${w.pixKey || '—'}</td>
      <td class="num">${w.weekdayDays}d</td>
      <td class="num">${w.weekendDays}d</td>
      <td class="num indigo">R$ ${w.weekdayEarnings.toLocaleString('pt-BR')}</td>
      <td class="num gold">R$ ${w.weekendEarnings.toLocaleString('pt-BR')}</td>
      <td class="num green"><strong>R$ ${w.totalEarnings.toLocaleString('pt-BR')}</strong></td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Relatório de Pagamentos — Diária Pro</title>
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

    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: #6366f1; color: white; }
    thead th { padding: 11px 14px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    thead th.num { text-align: right; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #f1f5f9; }
    td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    td small { color: #94a3b8; font-size: 11px; display: block; margin-top: 2px; }
    td.num { text-align: right; }
    td.mono { font-family: monospace; font-size: 12px; color: #06b6d4; }
    td.indigo { color: #6366f1; font-weight: 600; }
    td.gold { color: #f59e0b; font-weight: 600; }
    td.green { color: #10b981; }

    .total-row { background: #f0fdf4 !important; border-top: 2px solid #10b981; }
    .total-row td { font-weight: 700; padding: 14px; }

    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }

    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-icon">D</div>
      <div class="logo-text">
        <h1>Diária Pro</h1>
        <p>Gestão de Diaristas</p>
      </div>
    </div>
    <div class="meta">
      <h2>Relatório de Pagamentos</h2>
      <p>${dateStr}</p>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi green">
      <label>Total Pago</label>
      <span>R$ ${totalGeral.toLocaleString('pt-BR')}</span>
    </div>
    <div class="kpi indigo">
      <label>Dias de Semana</label>
      <span>${workerSummary.reduce((s, w) => s + w.weekdayDays, 0)} dias</span>
    </div>
    <div class="kpi gold">
      <label>Fins de Semana / Feriados</label>
      <span>${workerSummary.reduce((s, w) => s + w.weekendDays, 0)} dias</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Trabalhador</th>
        <th>Departamento</th>
        <th>Chave PIX</th>
        <th class="num">Dias Sem.</th>
        <th class="num">Dias Fds</th>
        <th class="num">Ganho Sem.</th>
        <th class="num">Ganho Fds</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="3">TOTAL GERAL</td>
        <td class="num">${workerSummary.reduce((s, w) => s + w.weekdayDays, 0)}d</td>
        <td class="num">${workerSummary.reduce((s, w) => s + w.weekendDays, 0)}d</td>
        <td class="num" style="color:#6366f1">R$ ${workerSummary.reduce((s, w) => s + w.weekdayEarnings, 0).toLocaleString('pt-BR')}</td>
        <td class="num" style="color:#f59e0b">R$ ${workerSummary.reduce((s, w) => s + w.weekendEarnings, 0).toLocaleString('pt-BR')}</td>
        <td class="num" style="color:#10b981;font-size:15px">R$ ${totalGeral.toLocaleString('pt-BR')}</td>
      </tr>
    </tbody>
  </table>

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

// ── CSV por dia ────────────────────────────────────────────
function exportDayCSV(dayRows) {
  const BOM = '﻿'
  const headers = ['Data', 'Dia da Semana', 'Trabalhador', 'Cargo', 'Departamento', 'Local', 'Tipo', 'Valor (R$)']
  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const rows = dayRows.map(d => {
    const date = parseISO(d.date)
    const dow = DAYS[date.getDay()]
    const tipo = d.isWeekend ? (date.getDay() === 6 ? 'Sábado' : 'Dom/Feriado') : 'Semana'
    return [
      format(date, 'dd/MM/yyyy'),
      dow,
      d.workerName,
      d.jobTitle,
      d.department,
      d.locationName || '—',
      tipo,
      d.earnings.toFixed(2).replace('.', ','),
    ]
  })
  const total = dayRows.reduce((s, d) => s + d.earnings, 0)
  const csv = [
    `Relatório por Dia — Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    '',
    headers.join(';'),
    ...rows.map(r => r.join(';')),
    '',
    `TOTAL GERAL;;;;;;;${total.toFixed(2).replace('.', ',')}`,
  ].join('\n')
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `diaria-pro-por-dia-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── PDF por dia ────────────────────────────────────────────
function exportDayPDF(dayRows) {
  const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const total = dayRows.reduce((s, d) => s + d.earnings, 0)
  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const rows = dayRows.map(d => {
    const date = parseISO(d.date)
    const dow = DAYS[date.getDay()]
    const isWeekend = d.isWeekend
    const isSun = date.getDay() === 0
    const color = isWeekend ? (isSun ? '#ef4444' : '#f59e0b') : '#6366f1'
    const tipo = isWeekend ? (date.getDay() === 6 ? 'Sábado' : 'Dom/Feriado') : 'Semana'
    return `<tr>
      <td><strong>${format(date, 'dd/MM/yyyy')}</strong><br/><small>${dow}</small></td>
      <td>${d.workerName}<br/><small>${d.jobTitle}</small></td>
      <td>${d.locationName || '—'}</td>
      <td style="color:${color};font-weight:600">${tipo}</td>
      <td class="num" style="color:${color};font-weight:700">R$ ${d.earnings.toLocaleString('pt-BR')}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Relatório por Dia — Diária Pro</title>
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
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: #6366f1; color: white; }
    thead th { padding: 11px 14px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    thead th.num { text-align: right; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    td small { color: #94a3b8; font-size: 11px; display: block; margin-top: 2px; }
    td.num { text-align: right; }
    .total-row { background: #f0fdf4 !important; border-top: 2px solid #10b981; }
    .total-row td { font-weight: 700; padding: 14px; }
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
      <h2>Relatório por Dia</h2>
      <p>${dateStr}</p>
    </div>
  </div>
  <div class="kpis">
    <div class="kpi green"><label>Total</label><span>R$ ${total.toLocaleString('pt-BR')}</span></div>
    <div class="kpi indigo"><label>Registros</label><span>${dayRows.length} dias</span></div>
    <div class="kpi gold"><label>Fins de Semana</label><span>${dayRows.filter(d => d.isWeekend).length} dias</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Trabalhador</th>
        <th>Local</th>
        <th>Tipo</th>
        <th class="num">Valor</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="4">TOTAL GERAL</td>
        <td class="num" style="color:#10b981;font-size:15px">R$ ${total.toLocaleString('pt-BR')}</td>
      </tr>
    </tbody>
  </table>
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

  const handleSelect = (day) => {
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
  }

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
      <motion.button
        ref={btnRef}
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={handleOpen}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
          background: open ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
          border: `1.5px solid ${open ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
          color: selected ? '#f1f5f9' : 'rgba(255,255,255,0.3)',
          fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'all 0.2s',
        }}
      >
        <span>{selected ? format(selected, 'dd/MM/yyyy') : 'dd/mm/aaaa'}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {selected && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={handleClear}
              style={{ color: 'rgba(239,68,68,0.6)', lineHeight: 1, fontSize: 16, padding: '0 2px' }}>×</motion.span>
          )}
          <span style={{ fontSize: 12, opacity: 0.4 }}>▾</span>
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={calRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed', top: pos.top, left: pos.left, width: pos.width,
              zIndex: 99999,
              background: 'linear-gradient(135deg, #1c1c32 0%, #14141f 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, padding: '14px 12px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
            }}
          >
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <motion.button type="button" whileTap={{ scale: 0.88 }} onClick={() => setMonth(m => subMonths(m, 1))}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</motion.button>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', textTransform: 'capitalize' }}>
                {format(month, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <motion.button type="button" whileTap={{ scale: 0.88 }} onClick={() => setMonth(m => addMonths(m, 1))}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</motion.button>
            </div>

            {/* Week headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {WEEK.map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.22)', paddingBottom: 4 }}>{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {Array(startPad).fill(null).map((_, i) => <div key={`p${i}`} />)}
              {days.map(day => {
                const isSel = selected && isSameDay(day, selected)
                const isTod = isToday(day)
                const isWkd = getDay(day) === 0 || getDay(day) === 6
                return (
                  <motion.button
                    key={day.toISOString()}
                    type="button"
                    whileHover={{ background: isSel ? '#6366f1' : 'rgba(99,102,241,0.15)' }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleSelect(day)}
                    style={{
                      padding: '6px 0', borderRadius: 7,
                      border: isTod && !isSel ? '1.5px solid rgba(99,102,241,0.45)' : '1.5px solid transparent',
                      background: isSel ? '#6366f1' : 'transparent',
                      color: isSel ? '#fff' : isWkd ? 'rgba(245,158,11,0.75)' : 'rgba(255,255,255,0.72)',
                      fontSize: 12, fontWeight: isSel || isTod ? 700 : 400,
                      cursor: 'pointer', textAlign: 'center',
                    }}
                  >
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

// ── Export modal ───────────────────────────────────────────
function ExportModal({ pendingSummary, paidSummary, allSummary, pendingWorkDays, paidWorkDays, allWorkDays, workers, locations, onClose, t }) {
  const [selected, setSelected]   = useState('csv')
  const [scope, setScope]         = useState('all') // 'all' | 'pending' | 'paid'
  const [groupBy, setGroupBy]     = useState('worker') // 'worker' | 'day'
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')
  const [status, setStatus]       = useState('idle') // idle | loading | done

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const activeData = scope === 'pending' ? pendingSummary : scope === 'paid' ? paidSummary : allSummary

  const activeDayRows = (() => {
    const days = scope === 'pending' ? pendingWorkDays : scope === 'paid' ? paidWorkDays : allWorkDays
    return [...days]
      .filter(d => (!dateFrom || d.date >= dateFrom) && (!dateTo || d.date <= dateTo))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => {
        const w = workers.find(x => x.id === d.workerId) || {}
        const l = locations.find(x => x.id === d.locationId) || {}
        return { ...d, workerName: w.name || '—', jobTitle: w.jobTitle || '—', department: w.department || '—', locationName: l.name || '—' }
      })
  })()

  const SCOPES = [
    { id: 'all',     label: 'Todos',        color: '#818cf8' },
    { id: 'pending', label: 'Pendentes',    color: '#f59e0b' },
    { id: 'paid',    label: 'Confirmados',  color: '#10b981' },
  ]

  const totalGeral   = groupBy === 'day'
    ? activeDayRows.reduce((s, d) => s + d.earnings, 0)
    : activeData.reduce((s, w) => s + w.totalEarnings, 0)
  const totalWorkers = groupBy === 'day'
    ? new Set(activeDayRows.map(d => d.workerId)).size
    : activeData.length
  const totalDays    = groupBy === 'day'
    ? activeDayRows.length
    : activeData.reduce((s, w) => s + w.totalDays, 0)
  const dateStr      = format(new Date(), "dd/MM/yyyy", { locale: ptBR })

  const FORMATS = [
    {
      id: 'csv',
      label: t.csvLabel,
      desc: t.csvDesc,
      icon: FileSpreadsheet,
      color: '#10b981',
      ext: '.csv',
    },
    {
      id: 'pdf',
      label: t.pdfLabel,
      desc: t.pdfDesc,
      icon: FileText,
      color: '#6366f1',
      ext: '.pdf',
    },
  ]

  const handleExport = async () => {
    setStatus('loading')
    await new Promise(r => setTimeout(r, 900))

    if (groupBy === 'day') {
      if (selected === 'csv') exportDayCSV(activeDayRows)
      else exportDayPDF(activeDayRows)
    } else {
      if (selected === 'csv') exportCSV(activeData)
      else exportPDF(activeData)
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
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24, paddingTop: '5vh',
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
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '22px 24px', borderBottom: '1px solid var(--card-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Download size={16} color="#818cf8" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: 'var(--card-heading)', letterSpacing: '-0.02em' }}>
                {t.exportReportTitle}
              </h2>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--card-muted)' }}>
                {t.chooseFormat}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, background: 'var(--inner-bg)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: '1px solid var(--card-border)',
              background: 'var(--inner-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--card-sub)',
            }}
          >
            <X size={14} />
          </motion.button>
        </div>

        <div style={{ padding: '22px 24px' }}>
          {/* Summary preview */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20,
            padding: '14px', borderRadius: 14,
            background: 'var(--inner-bg)', border: '1px solid var(--inner-border)',
          }}>
            {[
              { label: t.workersLabel, value: totalWorkers, color: '#818cf8' },
              { label: t.daysLabel, value: totalDays, color: '#10b981' },
              { label: `${t.totalCol} (R$)`, value: `R$ ${totalGeral.toLocaleString('pt-BR')}`, color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--card-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Scope selector */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Dados
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {SCOPES.map(s => (
                <motion.button
                  key={s.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setScope(s.id)}
                  style={{
                    flex: 1, padding: '9px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: scope === s.id ? `${s.color}15` : 'var(--inner-bg)',
                    border: `1.5px solid ${scope === s.id ? s.color + '50' : 'var(--card-border)'}`,
                    color: scope === s.id ? s.color : 'var(--card-muted)',
                    fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
                  }}
                >
                  {s.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Grouping selector */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Agrupar por
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'worker', label: 'Por Trabalhador', icon: '👤' },
                { id: 'day',    label: 'Por Dia',         icon: '📅' },
              ].map(g => (
                <motion.button
                  key={g.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setGroupBy(g.id)}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                    background: groupBy === g.id ? 'rgba(99,102,241,0.12)' : 'var(--inner-bg)',
                    border: `1.5px solid ${groupBy === g.id ? 'rgba(99,102,241,0.5)' : 'var(--card-border)'}`,
                    color: groupBy === g.id ? '#818cf8' : 'var(--card-muted)',
                    fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <span>{g.icon}</span>
                  {g.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Date filter — only for "Por Dia" */}
          <AnimatePresence>
            {groupBy === 'day' && (
              <motion.div
                key="date-filter"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 18 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Período
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <MiniDatePicker label="De" value={dateFrom} onChange={setDateFrom} />
                  <MiniDatePicker label="Até" value={dateTo} onChange={setDateTo} />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(''); setDateTo('') }}
                    style={{
                      marginTop: 8, fontSize: 11, color: 'rgba(239,68,68,0.6)', background: 'none',
                      border: 'none', cursor: 'pointer', padding: 0,
                    }}
                  >
                    Limpar período
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Format selector */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              {t.format}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FORMATS.map(fmt => {
                const active = selected === fmt.id
                const Icon = fmt.icon
                return (
                  <motion.button
                    key={fmt.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelected(fmt.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: active ? `${fmt.color}10` : 'var(--inner-bg)',
                      border: `1.5px solid ${active ? fmt.color + '40' : 'var(--card-border)'}`,
                      transition: 'all 0.2s', textAlign: 'left',
                    }}
                  >
                    {/* Radio dot */}
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${active ? fmt.color : 'var(--card-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      {active && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{ width: 8, height: 8, borderRadius: '50%', background: fmt.color }}
                        />
                      )}
                    </div>

                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${fmt.color}15`, border: `1px solid ${fmt.color}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={17} color={active ? fmt.color : 'var(--card-muted)'} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: active ? 'var(--card-heading)' : 'var(--card-sub)' }}>
                          {fmt.label}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                          background: `${fmt.color}18`, color: fmt.color,
                          fontFamily: 'monospace',
                        }}>
                          {fmt.ext}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--card-muted)', lineHeight: 1.4 }}>
                        {fmt.desc}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Download button */}
          <motion.button
            whileHover={status === 'idle' ? { scale: 1.02, boxShadow: '0 12px 32px rgba(99,102,241,0.4)' } : {}}
            whileTap={status === 'idle' ? { scale: 0.98 } : {}}
            onClick={status === 'idle' ? handleExport : undefined}
            style={{
              width: '100%', padding: '14px', borderRadius: 13, border: 'none',
              cursor: status === 'idle' ? 'pointer' : 'default',
              background: status === 'done'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white', fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 6px 20px rgba(99,102,241,0.3)',
              transition: 'background 0.4s',
            }}
          >
            <AnimatePresence mode="wait">
              {status === 'idle' && (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Download size={16} />
                  {t.download} {FORMATS.find(f => f.id === selected)?.label}
                </motion.span>
              )}
              {status === 'loading' && (
                <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}>
                    <Loader2 size={16} />
                  </motion.span>
                  {t.generating}
                </motion.span>
              )}
              {status === 'done' && (
                <motion.span key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} />
                  {t.downloadDone}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--card-dim)' }}>
            {t.dataRef} · {dateStr}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── CustomTooltip ──────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--card-bg-elevated)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
      <div style={{ fontSize: 11, color: 'var(--card-sub)', marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.fill }} />
          <span style={{ fontSize: 12, color: 'var(--card-sub)' }}>{p.name}</span>
          <span style={{ fontSize: 13, color: 'var(--card-heading)', fontWeight: 700, marginLeft: 'auto' }}>
            R$ {p.value.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Sort helpers ───────────────────────────────────────────
function SortIcon({ active, dir }) {
  return (
    <span style={{ marginLeft: 4, opacity: active ? 1 : 0.25, fontSize: 10, lineHeight: 1 }}>
      {active ? (dir === 'desc' ? '▼' : '▲') : '▼'}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────
export default function PaymentView({ lang = 'pt', workers, workDays, locations = [], paymentRecords = [], setPaymentRecords }) {
  const t = i18n[lang] ?? i18n.pt
  const isMobile = useIsMobile()
  const [showExport, setShowExport] = useState(false)
  const [selectedPixWorker, setSelectedPixWorker] = useState(null)
  const [sortKey, setSortKey] = useState('totalEarnings')
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const applySorting = (arr) => [...arr].sort((a, b) => {
    if (sortKey === 'name') {
      return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    }
    return sortDir === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]
  })

  // Compute which work days are already covered by a payment record
  const paidDayIds = new Set((paymentRecords || []).flatMap(r => r.workDayIds))
  const paidWorkerIds = new Set((paymentRecords || []).map(r => r.workerId))
  const unpaidWorkDays = workDays.filter(d => !paidDayIds.has(d.id))

  const filtered        = unpaidWorkDays
  const totalEarnings   = filtered.reduce((s, d) => s + d.earnings, 0)
  const weekdayEarnings = filtered.filter(d => !d.isWeekend).reduce((s, d) => s + d.earnings, 0)
  const weekendEarnings = filtered.filter(d => d.isWeekend).reduce((s, d) => s + d.earnings, 0)

  const workerSummary = applySorting(workers.map(w => {
    const s = getWorkerStats(w.id, unpaidWorkDays)
    return { ...w, ...s }
  }))

  // Para exportação: usa todos os dias (pagos + pendentes)
  const allWorkerSummary = applySorting(
    workers
      .map(w => ({ ...w, ...getWorkerStats(w.id, workDays) }))
      .filter(w => w.totalDays > 0)
  )

  // Confirmed-paid summary: stats computed only from the days that have been settled
  const paidWorkDays = workDays.filter(d => paidDayIds.has(d.id))
  const paidWorkerSummary = applySorting(workers
    .filter(w => paidWorkerIds.has(w.id))
    .map(w => {
      const s = getWorkerStats(w.id, paidWorkDays)
      const workerRecords = (paymentRecords || []).filter(r => r.workerId === w.id)
      const lastRecord = workerRecords[workerRecords.length - 1]
      return { ...w, ...s, lastPaymentDate: lastRecord?.paidDate }
    }))

  const workerChartData = workerSummary.slice(0, 6).map(w => ({
    name: w.name.split(' ')[0],
    semana: w.weekdayEarnings,
    fds: w.weekendEarnings,
  }))

  const rateData = [
    { name: t.weekdayDaysLabel, value: weekdayEarnings, color: '#6366f1' },
    { name: t.weekendDaysLabel, value: weekendEarnings, color: '#f59e0b' },
  ]

  const handleMarkPaid = (worker, workDayIds, amount) => {
    setPaymentRecords(prev => [
      ...(prev || []),
      {
        id: `payment-${worker.id}-${Date.now()}`,
        workerId: worker.id,
        total: amount,
        paidDate: format(new Date(), 'yyyy-MM-dd'),
        workDayIds,
      },
    ])
    setSelectedPixWorker(null)
  }

  const handleUndoPayment = (workerId) => {
    setPaymentRecords(prev => (prev || []).filter(r => r.workerId !== workerId))
  }

  const openPixModal = (worker) => {
    const pendingDays = workDays.filter(d => d.workerId === worker.id && !paidDayIds.has(d.id))
    setSelectedPixWorker({
      worker,
      pendingWorkDayIds: pendingDays.map(d => d.id),
      pendingAmount: pendingDays.reduce((s, d) => s + d.earnings, 0),
      overtimeAmount: pendingDays.reduce((s, d) => s + (d.overtime || 0), 0),
    })
  }

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', flexWrap: 'wrap', gap: isMobile ? 16 : 0 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: isMobile ? 24 : 30, fontWeight: 800, color: 'var(--page-heading)', margin: 0, letterSpacing: '-0.02em' }}>
              {t.paymentsTitle}
            </h1>
            <p style={{ margin: '8px 0 0', color: 'var(--page-sub)', fontSize: 15 }}>
              {t.paymentsSubtitle}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowExport(true)}
            className="btn-primary"
            style={{
              padding: '12px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <Download size={15} />
            {t.exportReport}
          </motion.button>
        </div>
      </motion.div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: t.totalToPay,      value: totalEarnings,   color: '#10b981', icon: DollarSign, sub: `${filtered.length} ${t.pendingDays}` },
          { label: t.weekdayDailies,  value: weekdayEarnings, color: '#6366f1', icon: Sun,        sub: `${filtered.filter(d => !d.isWeekend).length} ${t.workingDays}` },
          { label: t.weekendDailies,  value: weekendEarnings, color: '#f59e0b', icon: Moon,       sub: `${filtered.filter(d => d.isWeekend).length} ${t.specialDays}` },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{
              background: 'var(--card-bg)', border: '1px solid var(--card-border)',
              boxShadow: 'var(--card-shadow)',
              borderRadius: 18, padding: '24px', position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}60, transparent)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--card-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: s.color }}>
                  R$ {Math.floor(s.value).toLocaleString('pt-BR')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--card-muted)', marginTop: 6 }}>{s.sub}</div>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: `${s.color}15`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={19} color={s.color} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 20, marginBottom: 20 }}>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', borderRadius: 20, padding: '28px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: 'var(--card-heading)' }}>{t.earningsByWorker}</h2>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--card-muted)' }}>{t.weekVsWeekend}</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={workerChartData} barSize={18} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--inner-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--card-sub)', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--card-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="semana" name={t.weekdayDaysLabel} stackId="a" fill="#6366f1" />
              <Bar dataKey="fds" name={t.weekendDaysLabel} stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', borderRadius: 20, padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: 'var(--card-heading)' }}>{t.composition}</h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--card-muted)' }}>{t.dailyDistribution}</p>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={rateData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" stroke="none">
                {rateData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div style={{ background: 'var(--card-bg-elevated)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, color: d.color, fontWeight: 600 }}>{d.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--card-heading)' }}>R$ {d.value.toLocaleString('pt-BR')}</div>
                  </div>
                )
              }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
            {rateData.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: r.color }} />
                  <span style={{ fontSize: 13, color: 'var(--card-sub)' }}>{r.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>
                  {totalEarnings > 0 ? Math.round((r.value / totalEarnings) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Worker payment table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--card-heading)' }}>{t.summaryByWorker}</h2>
          <span style={{ fontSize: 12, color: 'var(--card-muted)' }}>{workerSummary.length} {t.workersLabel.toLowerCase()}</span>
        </div>
        {isMobile ? (
          <>
            {/* Mobile: simplified 4-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 56px 88px', padding: '10px 16px', gap: 8, borderBottom: '1px solid var(--card-border)' }}>
              {[t.workerHeader, t.weekdayDaysCol, t.weekendDaysCol, t.totalCol].map((h, i) => (
                <div key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i > 0 ? 'right' : 'left' }}>
                  {h}
                </div>
              ))}
            </div>
            {workerSummary.map((worker, i) => (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.04 }}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 56px 56px 88px',
                  padding: '12px 16px', gap: 8,
                  borderBottom: '1px solid var(--inner-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${worker.avatarColor}20`, border: `1.5px solid ${worker.avatarColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: worker.avatarColor, flexShrink: 0 }}>
                    {worker.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--card-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{worker.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--card-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{worker.jobTitle}</div>
                  </div>
                  {worker.pixKey && !paidWorkerIds.has(worker.id) && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openPixModal(worker)}
                      style={{
                        width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer',
                        background: 'rgba(6,182,212,0.1)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <QrCode size={12} color="#06b6d4" />
                    </motion.button>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 500, color: 'var(--card-sub)', alignSelf: 'center' }}>{worker.weekdayDays}d</div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 500, color: 'rgba(245,158,11,0.8)', alignSelf: 'center' }}>{worker.weekendDays}d</div>
                <div style={{ textAlign: 'right', alignSelf: 'center' }}>
                  {worker.totalEarnings > 0 ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>
                        R${worker.totalEarnings.toLocaleString('pt-BR')}
                      </div>
                      {worker.totalOvertime > 0 && (
                        <div style={{ fontSize: 9, fontWeight: 600, color: '#f59e0b', marginTop: 2 }}>
                          +R${worker.totalOvertime.toLocaleString('pt-BR')} HE
                        </div>
                      )}
                    </>
                  ) : paidWorkerIds.has(worker.id)
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}><CheckCircle2 size={10} />{t.paidBadge}</span>
                    : 'R$0'
                  }
                </div>
              </motion.div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 56px 88px', padding: '14px 16px', gap: 8, background: 'rgba(16,185,129,0.05)', borderTop: '1px solid rgba(16,185,129,0.1)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--card-sub)' }}>{t.totalCol}</div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--card-sub)' }}>{workerSummary.reduce((s, w) => s + w.weekdayDays, 0)}d</div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'rgba(245,158,11,0.8)' }}>{workerSummary.reduce((s, w) => s + w.weekendDays, 0)}d</div>
              <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 900, color: '#10b981' }}>R${workerSummary.reduce((s, w) => s + w.totalEarnings, 0).toLocaleString('pt-BR')}</div>
            </div>
          </>
        ) : (
          <>
            {/* Desktop: full 6-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px 120px 130px', padding: '12px 28px', gap: 12, borderBottom: '1px solid var(--card-border)' }}>
              {[
                { label: t.workerHeader,       key: 'name',            align: 'left'  },
                { label: t.weekdayDaysCol,     key: 'weekdayDays',     align: 'right' },
                { label: t.weekendDaysCol,     key: 'weekendDays',     align: 'right' },
                { label: t.weekdayEarningsCol, key: 'weekdayEarnings', align: 'right' },
                { label: t.weekendEarningsCol, key: 'weekendEarnings', align: 'right' },
                { label: t.totalCol,           key: 'totalEarnings',   align: 'right' },
              ].map(col => (
                <motion.div
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  whileHover={{ color: '#e2e8f0' }}
                  style={{ fontSize: 11, fontWeight: 600, color: sortKey === col.key ? '#818cf8' : 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: col.align, cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start', transition: 'color 0.15s' }}
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </motion.div>
              ))}
            </div>
            {workerSummary.map((worker, i) => (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.04 }}
                whileHover={{ background: 'var(--inner-bg)' }}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px 120px 130px',
                  padding: '14px 28px', gap: 12,
                  borderBottom: '1px solid var(--inner-border)',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${worker.avatarColor}20`, border: `1.5px solid ${worker.avatarColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: worker.avatarColor, flexShrink: 0 }}>
                    {worker.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--card-heading)' }}>{worker.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--card-muted)' }}>{worker.jobTitle}</div>
                  </div>
                  {worker.pixKey && !paidWorkerIds.has(worker.id) && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openPixModal(worker)}
                      style={{
                        width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'rgba(6,182,212,0.1)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      <QrCode size={14} color="#06b6d4" />
                    </motion.button>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 500, color: 'var(--card-sub)', alignSelf: 'center' }}>{worker.weekdayDays}d</div>
                <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 500, color: 'rgba(245,158,11,0.7)', alignSelf: 'center' }}>{worker.weekendDays}d</div>
                <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#818cf8', alignSelf: 'center' }}>R$ {worker.weekdayEarnings.toLocaleString('pt-BR')}</div>
                <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#f59e0b', alignSelf: 'center' }}>R$ {worker.weekendEarnings.toLocaleString('pt-BR')}</div>
                <div style={{ textAlign: 'right', alignSelf: 'center' }}>
                  {worker.totalEarnings > 0 ? (
                    <>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#10b981' }}>
                        R$ {worker.totalEarnings.toLocaleString('pt-BR')}
                      </div>
                      {worker.totalOvertime > 0 && (
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', marginTop: 2 }}>
                          +R$ {worker.totalOvertime.toLocaleString('pt-BR')} {t.overtimeExtra}
                        </div>
                      )}
                    </>
                  ) : paidWorkerIds.has(worker.id) ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                      background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                      color: '#10b981',
                    }}>
                      <CheckCircle2 size={12} />
                      {t.paidBadge}
                    </span>
                  ) : 'R$ 0'}
                </div>
              </motion.div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px 120px 130px', padding: '16px 28px', gap: 12, background: 'rgba(16,185,129,0.05)', borderTop: '1px solid rgba(16,185,129,0.1)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--card-sub)' }}>{t.grandTotal}</div>
              <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'var(--card-sub)' }}>{workerSummary.reduce((s, w) => s + w.weekdayDays, 0)}d</div>
              <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'rgba(245,158,11,0.7)' }}>{workerSummary.reduce((s, w) => s + w.weekendDays, 0)}d</div>
              <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 800, color: '#818cf8' }}>R$ {workerSummary.reduce((s, w) => s + w.weekdayEarnings, 0).toLocaleString('pt-BR')}</div>
              <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 800, color: '#f59e0b' }}>R$ {workerSummary.reduce((s, w) => s + w.weekendEarnings, 0).toLocaleString('pt-BR')}</div>
              <div style={{ textAlign: 'right', fontSize: 17, fontWeight: 900, color: '#10b981' }}>R$ {workerSummary.reduce((s, w) => s + w.totalEarnings, 0).toLocaleString('pt-BR')}</div>
            </div>
          </>
        )}
      </motion.div>

      {/* Confirmed payments table */}
      {paidWorkerSummary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          style={{
            background: 'var(--card-bg)', border: '1px solid rgba(16,185,129,0.2)',
            boxShadow: 'var(--card-shadow)', borderRadius: 20, overflow: 'hidden', marginTop: 20,
          }}
        >
          {/* Section header */}
          <div style={{
            padding: '24px 28px', borderBottom: '1px solid rgba(16,185,129,0.12)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #10b98160, transparent)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle2 size={15} color="#10b981" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--card-heading)' }}>{t.confirmedPayments}</h2>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--card-muted)', marginTop: 2 }}>{t.confirmedPaymentsSubtitle}</p>
              </div>
            </div>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 8,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981',
            }}>
              {paidWorkerSummary.length} {t.paidBadge.toLowerCase()}
            </span>
          </div>

          {isMobile ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 56px 88px', padding: '10px 16px', gap: 8, borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
                {[t.workerHeader, t.weekdayDaysCol, t.weekendDaysCol, t.totalCol].map((h, i) => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i > 0 ? 'right' : 'left' }}>
                    {h}
                  </div>
                ))}
              </div>
              {paidWorkerSummary.map((worker, i) => (
                <motion.div
                  key={worker.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.36 + i * 0.04 }}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 56px 56px 88px',
                    padding: '12px 16px', gap: 8,
                    borderBottom: '1px solid rgba(16,185,129,0.07)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${worker.avatarColor}20`, border: `1.5px solid ${worker.avatarColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: worker.avatarColor, flexShrink: 0 }}>
                      {worker.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--card-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{worker.name}</div>
                      <div style={{ fontSize: 10, color: '#10b981', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <CheckCircle2 size={9} />
                        {t.paidOn} {worker.lastPaymentDate ? format(parseISO(worker.lastPaymentDate), 'dd/MM/yyyy') : '—'}
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleUndoPayment(worker.id)}
                      style={{
                        width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer',
                        background: 'rgba(245,158,11,0.1)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <RotateCcw size={12} color="#f59e0b" />
                    </motion.button>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 500, color: 'var(--card-sub)', alignSelf: 'center' }}>{worker.weekdayDays}d</div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 500, color: 'rgba(245,158,11,0.8)', alignSelf: 'center' }}>{worker.weekendDays}d</div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 800, color: '#10b981', alignSelf: 'center' }}>R${worker.totalEarnings.toLocaleString('pt-BR')}</div>
                </motion.div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 56px 88px', padding: '14px 16px', gap: 8, background: 'rgba(16,185,129,0.05)', borderTop: '1px solid rgba(16,185,129,0.1)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--card-sub)' }}>{t.totalPaidLabel}</div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--card-sub)' }}>{paidWorkerSummary.reduce((s, w) => s + w.weekdayDays, 0)}d</div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'rgba(245,158,11,0.8)' }}>{paidWorkerSummary.reduce((s, w) => s + w.weekendDays, 0)}d</div>
                <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 900, color: '#10b981' }}>R${paidWorkerSummary.reduce((s, w) => s + w.totalEarnings, 0).toLocaleString('pt-BR')}</div>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px 120px 130px', padding: '12px 28px', gap: 12, borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
                {[
                  { label: t.workerHeader,       key: 'name',            align: 'left',  accent: false },
                  { label: t.weekdayDaysCol,     key: 'weekdayDays',     align: 'right', accent: false },
                  { label: t.weekendDaysCol,     key: 'weekendDays',     align: 'right', accent: false },
                  { label: t.weekdayEarningsCol, key: 'weekdayEarnings', align: 'right', accent: false },
                  { label: t.weekendEarningsCol, key: 'weekendEarnings', align: 'right', accent: false },
                  { label: t.totalPaidCol,       key: 'totalEarnings',   align: 'right', accent: true  },
                ].map(col => (
                  <motion.div
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    whileHover={{ color: '#e2e8f0' }}
                    style={{ fontSize: 11, fontWeight: 600, color: sortKey === col.key ? '#818cf8' : col.accent ? '#10b981' : 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: col.align, cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start', transition: 'color 0.15s' }}
                  >
                    {col.label}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </motion.div>
                ))}
              </div>
              {paidWorkerSummary.map((worker, i) => (
                <motion.div
                  key={worker.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.36 + i * 0.04 }}
                  whileHover={{ background: 'rgba(16,185,129,0.03)' }}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px 120px 130px',
                    padding: '14px 28px', gap: 12,
                    borderBottom: '1px solid rgba(16,185,129,0.07)',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${worker.avatarColor}20`, border: `1.5px solid ${worker.avatarColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: worker.avatarColor, flexShrink: 0 }}>
                      {worker.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--card-heading)' }}>{worker.name}</div>
                      <div style={{ fontSize: 11, color: '#10b981', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={10} />
                        {t.paidOn} {worker.lastPaymentDate ? format(parseISO(worker.lastPaymentDate), 'dd/MM/yyyy') : '—'}
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleUndoPayment(worker.id)}
                      style={{
                        width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'rgba(245,158,11,0.1)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      <RotateCcw size={14} color="#f59e0b" />
                    </motion.button>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 500, color: 'var(--card-sub)', alignSelf: 'center' }}>{worker.weekdayDays}d</div>
                  <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 500, color: 'rgba(245,158,11,0.7)', alignSelf: 'center' }}>{worker.weekendDays}d</div>
                  <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#818cf8', alignSelf: 'center' }}>R$ {worker.weekdayEarnings.toLocaleString('pt-BR')}</div>
                  <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#f59e0b', alignSelf: 'center' }}>R$ {worker.weekendEarnings.toLocaleString('pt-BR')}</div>
                  <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 800, color: '#10b981', alignSelf: 'center' }}>R$ {worker.totalEarnings.toLocaleString('pt-BR')}</div>
                </motion.div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px 120px 130px', padding: '16px 28px', gap: 12, background: 'rgba(16,185,129,0.05)', borderTop: '1px solid rgba(16,185,129,0.12)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--card-sub)' }}>{t.totalConfirmed}</div>
                <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'var(--card-sub)' }}>{paidWorkerSummary.reduce((s, w) => s + w.weekdayDays, 0)}d</div>
                <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'rgba(245,158,11,0.7)' }}>{paidWorkerSummary.reduce((s, w) => s + w.weekendDays, 0)}d</div>
                <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 800, color: '#818cf8' }}>R$ {paidWorkerSummary.reduce((s, w) => s + w.weekdayEarnings, 0).toLocaleString('pt-BR')}</div>
                <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 800, color: '#f59e0b' }}>R$ {paidWorkerSummary.reduce((s, w) => s + w.weekendEarnings, 0).toLocaleString('pt-BR')}</div>
                <div style={{ textAlign: 'right', fontSize: 17, fontWeight: 900, color: '#10b981' }}>R$ {paidWorkerSummary.reduce((s, w) => s + w.totalEarnings, 0).toLocaleString('pt-BR')}</div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Export modal */}
      <AnimatePresence>
        {showExport && (
          <ExportModal
            pendingSummary={workerSummary}
            paidSummary={paidWorkerSummary}
            allSummary={allWorkerSummary}
            pendingWorkDays={unpaidWorkDays}
            paidWorkDays={paidWorkDays}
            allWorkDays={workDays}
            workers={workers}
            locations={locations}
            onClose={() => setShowExport(false)}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Pix QR Code modal */}
      <AnimatePresence>
        {selectedPixWorker && (
          <PixQrModal
            worker={selectedPixWorker.worker}
            pendingAmount={selectedPixWorker.pendingAmount}
            overtimeAmount={selectedPixWorker.overtimeAmount}
            pendingWorkDayIds={selectedPixWorker.pendingWorkDayIds}
            onMarkPaid={handleMarkPaid}
            onClose={() => setSelectedPixWorker(null)}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
