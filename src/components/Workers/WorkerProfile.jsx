import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Edit2, Phone, MapPin, Clock, Calendar, Sun, Sunset,
  QrCode, Copy, Check, CheckCircle2, Hourglass, AlertCircle, Ban,
  ChevronDown, ChevronUp, Plus, Trash2, X,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { getWorkerStats, getPaymentHistory, PIX_KEY_TYPES, isWeekendOrHoliday } from '../../data/mockData'
import { useIsMobile } from '../../hooks/useIsMobile'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import i18n from '../../i18n'

const STATUS_ICONS = {
  paid: CheckCircle2,
  processing: Hourglass,
  pending: AlertCircle,
  'no-work': Ban,
}
const STATUS_COLORS = {
  paid:       { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)' },
  processing: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)' },
  pending:    { color: '#818cf8', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.18)' },
  'no-work':  { color: '#475569', bg: 'rgba(71,85,105,0.08)',  border: 'rgba(71,85,105,0.15)' },
}

// ── Copy-to-clipboard button ───────────────────────────────
function CopyButton({ text, copyTitle }) {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={handle}
      title={copyTitle}
      style={{
        width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
        background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(6,182,212,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s', flexShrink: 0,
      }}
    >
      <AnimatePresence mode="wait">
        {copied
          ? <motion.span key="ok"   initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check size={14} color="#10b981" /></motion.span>
          : <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Copy size={14} color="#06b6d4" /></motion.span>
        }
      </AnimatePresence>
    </motion.button>
  )
}

// ── Payment history row ────────────────────────────────────
function PaymentRow({ record, index, isMobile, t }) {
  const [open, setOpen] = useState(false)
  const statusLabels = {
    paid: t.statusPaid,
    processing: t.statusProcessing,
    pending: t.statusPending,
    'no-work': t.statusNoWork,
  }
  const cfg = { ...STATUS_COLORS[record.status], label: statusLabels[record.status], Icon: STATUS_ICONS[record.status] }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
  const daysText = record.totalDays === 1 ? t.daysWorkedSingular : t.daysWorkedPlural

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${cfg.border}`, marginBottom: 8 }}
    >
      {/* Row header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', background: cfg.bg, border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Status icon */}
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: `${cfg.color}18`,
          border: `1.5px solid ${cfg.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <cfg.Icon size={16} color={cfg.color} />
        </div>

        {/* Period label */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', textTransform: 'capitalize' }}>
            {cap(record.period)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--card-muted)', marginTop: 2 }}>
            {record.totalDays > 0
              ? `${record.totalDays} ${daysText}`
              : t.noDaysRegistered}
            {record.paidDate && ` · ${t.paidOnDate} ${record.paidDate}`}
          </div>
        </div>

        {/* Amount */}
        {record.total > 0 && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: cfg.color }}>
              R$ {record.total.toLocaleString('pt-BR')}
            </div>
          </div>
        )}

        {/* Status badge */}
        <span style={{
          padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
          background: `${cfg.color}18`, color: cfg.color, flexShrink: 0,
        }}>
          {cfg.label}
        </span>

        {/* Expand chevron */}
        {record.totalDays > 0 && (
          <div style={{ color: 'var(--card-dim)', flexShrink: 0 }}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </button>

      {/* Expandable breakdown */}
      <AnimatePresence>
        {open && record.totalDays > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '12px 16px 16px',
              background: 'rgba(0,0,0,0.15)',
              borderTop: `1px solid ${cfg.border}`,
              display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 10,
            }}>
              {[
                { label: t.weekdayBreakdown, days: record.weekdayDays, earnings: record.weekdayEarnings, color: '#818cf8' },
                { label: t.weekendBreakdown, days: record.weekendDays, earnings: record.weekendEarnings, color: '#f59e0b' },
                { label: t.periodTotal,      days: record.totalDays,   earnings: record.total,           color: cfg.color },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '12px', borderRadius: 10,
                  background: `${s.color}08`, border: `1px solid ${s.color}15`,
                }}>
                  <div style={{ fontSize: 10, color: 'var(--card-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>
                    R$ {s.earnings.toLocaleString('pt-BR')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--card-muted)', marginTop: 3 }}>
                    {s.days} {s.days !== 1 ? t.daysWorkedPlural : t.daysWorkedSingular}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Add Work Day Modal ─────────────────────────────────────
function AddDayModal({ worker, workDays, locations, holidays, onAdd, onClose, t }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [locationId, setLocationId] = useState(worker.locations[0] || '')
  const [error, setError] = useState('')

  const workerLocations = locations.filter(l => worker.locations.includes(l.id))
  const isSpecial = date ? isWeekendOrHoliday(date, holidays) : false
  const rate = isSpecial ? worker.weekendRate : worker.weekdayRate

  const handleSave = () => {
    if (!date) return setError(t.selectDate)
    if (!locationId) return setError(t.selectLocationError)
    if (workDays.some(d => d.workerId === worker.id && d.date === date))
      return setError(t.alreadyRegistered)
    onAdd({
      id: `${worker.id}-${date}-${Date.now()}`,
      workerId: worker.id,
      date,
      locationId,
      isWeekend: isSpecial,
      rate,
      earnings: rate,
    })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)', padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: 20, padding: 32, width: 400, maxWidth: '90vw',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
            {t.registerWorkDay}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--card-muted)', padding: 4, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
            {t.dateLabel}
          </label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => { setDate(e.target.value); setError('') }}
            className="input-premium"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>

        {/* Location */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
            {t.workLocation}
          </label>
          <select
            value={locationId}
            onChange={e => setLocationId(e.target.value)}
            className="input-premium"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 14, cursor: 'pointer', boxSizing: 'border-box' }}
          >
            {workerLocations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        {/* Rate preview */}
        <div style={{
          padding: '14px 16px', borderRadius: 12, marginBottom: 20,
          background: isSpecial ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)',
          border: `1px solid ${isSpecial ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: isSpecial ? '#f59e0b' : '#818cf8' }}>
            {isSpecial ? t.weekendHolidayRate : t.weekdayRate}
          </span>
          <span style={{ fontSize: 20, fontWeight: 800, color: isSpecial ? '#f59e0b' : '#818cf8' }}>
            R$ {rate}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
            fontSize: 13, color: '#f43f5e',
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer',
              border: '1px solid var(--card-border)', background: 'var(--inner-bg)',
              color: 'var(--card-sub)', fontSize: 14, fontWeight: 600,
            }}
          >
            {t.cancel}
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="btn-primary"
            style={{ flex: 2, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600 }}
          >
            {t.register}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────
export default function WorkerProfile({ lang = 'pt', worker, workDays, locations, holidays = [], onAddWorkDay, onDeleteWorkDay, onBack, onEdit }) {
  const isMobile = useIsMobile()
  const t = i18n[lang] ?? i18n.pt
  const [showAddModal, setShowAddModal] = useState(false)

  const stats = getWorkerStats(worker.id, workDays)
  const history = getPaymentHistory(worker.id, workDays)
  const workerLocations = locations.filter(l => worker.locations.includes(l.id))
  const recentDays = workDays
    .filter(d => d.workerId === worker.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14)

  const chartData = recentDays.slice(0, 10).reverse().map(d => ({
    date: format(parseISO(d.date), 'dd/MM'),
    value: d.earnings,
    isWeekend: d.isWeekend,
    location: workerLocations.find(l => l.id === d.locationId)?.shortName,
  }))

  const earningPercent = stats.totalEarnings > 0
    ? Math.round((stats.weekendEarnings / stats.totalEarnings) * 100)
    : 0

  const pixTypeLabel = PIX_KEY_TYPES.find(pt => pt.value === worker.pixKeyType)?.label || 'PIX'

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <motion.button
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--inner-bg)', border: '1px solid var(--card-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--card-sub)', flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} />
        </motion.button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--card-heading)', margin: 0, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {worker.name}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--card-muted)', fontSize: 13 }}>
            {worker.jobTitle} · {worker.department}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onEdit(worker)}
          style={{
            padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)',
            color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.2s', flexShrink: 0,
          }}
        >
          <Edit2 size={15} />
          {t.editBtn}
        </motion.button>
      </div>

      {/* ── Hero card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          background: `linear-gradient(135deg, ${worker.avatarColor}15 0%, var(--card-bg) 60%)`,
          border: `1px solid ${worker.avatarColor}25`,
          borderRadius: 20, padding: '28px', marginBottom: 20,
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: `radial-gradient(circle, ${worker.avatarColor}20 0%, transparent 70%)`, borderRadius: '50%' }} />
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: `${worker.avatarColor}25`, border: `3px solid ${worker.avatarColor}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: worker.avatarColor, flexShrink: 0,
          }}>
            {worker.avatar}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                background: worker.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)',
                color: worker.status === 'active' ? '#10b981' : '#64748b',
                border: `1px solid ${worker.status === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.2)'}`,
              }}>
                {worker.status === 'active' ? t.statusActiveSmall : t.statusInactiveSmall}
              </span>
              <span style={{
                padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                background: 'var(--inner-bg)', color: 'var(--card-sub)',
                border: '1px solid var(--card-border)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <Clock size={10} />
                {worker.schedule}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--card-sub)' }}>
                <Phone size={13} />{worker.phone || t.notInformed}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--card-sub)' }}>
                <Calendar size={13} />
                {t.since} {worker.startDate ? format(parseISO(worker.startDate), "MMM 'de' yyyy", { locale: ptBR }) : '—'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── PIX card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        style={{
          background: 'rgba(6,182,212,0.05)',
          border: '1px solid rgba(6,182,212,0.18)',
          borderRadius: 18, padding: '20px 22px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 16,
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'rgba(6,182,212,0.12)', border: '1.5px solid rgba(6,182,212,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <QrCode size={20} color="#06b6d4" />
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t.pixKeyLabel}
            </span>
            <span style={{
              padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700,
              background: 'rgba(6,182,212,0.12)', color: '#06b6d4',
              border: '1px solid rgba(6,182,212,0.2)',
            }}>
              {pixTypeLabel}
            </span>
          </div>
          {worker.pixKey ? (
            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {worker.pixKey}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--card-dim)', fontStyle: 'italic' }}>
              {t.noPixKey}
            </div>
          )}
        </div>

        {worker.pixKey && <CopyButton text={worker.pixKey} copyTitle={t.copyPixKey} />}
      </motion.div>

      {/* ── KPI stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: t.totalEarned,      value: `R$ ${stats.totalEarnings.toLocaleString('pt-BR')}`, color: '#10b981', sub: `${stats.totalDays} ${t.days}` },
          { label: t.weekdayDaysLabel, value: stats.weekdayDays,  color: '#6366f1', sub: `R$ ${stats.weekdayEarnings.toLocaleString('pt-BR')}` },
          { label: t.weekendDaysLabel, value: stats.weekendDays,  color: '#f59e0b', sub: `R$ ${stats.weekendEarnings.toLocaleString('pt-BR')}` },
          { label: t.weekendPercent,   value: `${earningPercent}%`, color: '#8b5cf6', sub: t.ofTotalEarned },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '20px' }}
          >
            <div style={{ fontSize: 11, color: 'var(--card-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--card-muted)', marginTop: 4 }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Chart + Locations row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 16, marginBottom: 20 }}>
        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 18, padding: '24px' }}
        >
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
            {t.earningsHistory}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--card-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--card-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${v}`} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div style={{ background: '#161628', border: '1px solid var(--card-border)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: d.isWeekend ? '#f59e0b' : '#818cf8', fontWeight: 600, marginBottom: 4 }}>
                      {d.isWeekend ? t.weekendTooltip : t.weekdayTooltip}
                    </div>
                    <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 700 }}>R$ {d.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--card-sub)' }}>{d.location}</div>
                  </div>
                )
              }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.isWeekend ? '#f59e0b' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1' }} />
              <span style={{ fontSize: 11, color: 'var(--card-sub)' }}>{t.weekdayLegend} — R$ {worker.weekdayRate}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b' }} />
              <span style={{ fontSize: 11, color: 'var(--card-sub)' }}>{t.weekendLegend} — R$ {worker.weekendRate}</span>
            </div>
          </div>
        </motion.div>

        {/* Locations + rates */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 18, padding: '24px' }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{t.locationsTitle}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {workerLocations.map(loc => (
              <div key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 12, background: `${loc.color}08`, border: `1px solid ${loc.color}20` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${loc.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={14} color={loc.color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: loc.color }}>{loc.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--card-muted)' }}>{loc.city}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--card-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.dailiesTitle}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6 }}><Sun size={13} /> {t.weekdayLegend}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#818cf8' }}>R$ {worker.weekdayRate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <span style={{ fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}><Sunset size={13} /> {t.weekendLegend}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>R$ {worker.weekendRate}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Payment history ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 18, padding: '24px', marginBottom: 20 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>
              {t.paymentHistory}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--card-muted)' }}>
              {t.paymentHistorySubtitle}
            </p>
          </div>
          {/* Legend */}
          <div style={{ display: isMobile ? 'none' : 'flex', gap: 12 }}>
            {Object.entries(STATUS_COLORS).filter(([k]) => k !== 'no-work').map(([key, cfg]) => {
              const statusLabels = { paid: t.statusPaid, processing: t.statusProcessing, pending: t.statusPending }
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: cfg.color }} />
                  <span style={{ fontSize: 11, color: 'var(--card-muted)' }}>{statusLabels[key]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--card-dim)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
            <div>{t.noPayments}</div>
          </div>
        ) : (
          history.map((record, i) => (
            <PaymentRow key={record.id} record={record} index={i} isMobile={isMobile} t={t} />
          ))
        )}

        {/* PIX reminder footer */}
        {worker.pixKey && (
          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 12,
            background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.12)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <QrCode size={15} color="#06b6d4" />
            <span style={{ fontSize: 12, color: 'var(--card-sub)' }}>
              {t.pixPayments} —
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#06b6d4', fontWeight: 600 }}>
              {worker.pixKey}
            </span>
            <CopyButton text={worker.pixKey} copyTitle={t.copyPixKey} />
          </div>
        )}
      </motion.div>

      {/* ── Recent days log ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 18, padding: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
            {t.workDaysLog}
          </h3>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} />
            {t.registerDay}
          </motion.button>
        </div>

        {recentDays.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--card-dim)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 14 }}>{t.noDaysLogged}</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{t.clickRegisterDay}</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {recentDays.map((day, i) => {
            const loc = locations.find(l => l.id === day.locationId)
            return (
              <motion.div
                key={day.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ delay: 0.5 + i * 0.03 }}
                style={{
                  padding: '12px 14px', borderRadius: 12, position: 'relative',
                  background: day.isWeekend ? 'rgba(245,158,11,0.06)' : 'rgba(99,102,241,0.06)',
                  border: `1px solid ${day.isWeekend ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.12)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                    {format(parseISO(day.date), 'dd MMM', { locale: ptBR })}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {day.isWeekend && <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>FDS</span>}
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDeleteWorkDay(day.id)}
                      title={t.removeRecord}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--card-dim)', padding: 2, display: 'flex', alignItems: 'center',
                        borderRadius: 4, transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--card-dim)'}
                    >
                      <Trash2 size={11} />
                    </motion.button>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: day.isWeekend ? '#f59e0b' : '#818cf8', marginBottom: 4 }}>
                  R$ {day.earnings}
                </div>
                {loc && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: loc.color }} />
                    <span style={{ fontSize: 11, color: 'var(--card-muted)' }}>{loc.shortName}</span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Add Work Day Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddDayModal
            worker={worker}
            workDays={workDays}
            locations={locations}
            holidays={holidays}
            onAdd={onAddWorkDay}
            onClose={() => setShowAddModal(false)}
            t={t}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
