import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { Users, TrendingUp, CalendarDays, DollarSign, ArrowUpRight, MapPin, ChevronRight } from 'lucide-react'
import { getDashboardStats } from '../../data/mockData'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useIsMobile } from '../../hooks/useIsMobile'
import i18n from '../../i18n'

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0, duration = 1500 }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    const start = performance.now()
    const animate = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(value * eased)
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration])

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.floor(display).toLocaleString('pt-BR')

  return <span>{prefix}{formatted}{suffix}</span>
}

function StatCard({ title, value, prefix, suffix, decimals, icon: Icon, color, change, changeLabel, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="card-hover"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 16, padding: '20px',
        position: 'relative', overflow: 'hidden',
        backdropFilter: 'blur(20px)',
      }}
    >

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--card-muted)', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {title}
          </div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--card-heading)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          </div>
          {change !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <ArrowUpRight size={13} color="#10b981" />
              <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>+{change}%</span>
              {changeLabel && <span style={{ fontSize: 11, color: 'var(--card-dim)', marginLeft: 2 }}>{changeLabel}</span>}
            </div>
          )}
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: `${color}15`,
          border: `1px solid ${color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--card-bg-elevated)', border: '1px solid var(--card-border)',
      borderRadius: 12, padding: '12px 16px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--card-sub)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          <span style={{ fontSize: 13, color: 'var(--card-heading)', fontWeight: 600 }}>
            {p.name === 'earnings' ? `R$ ${p.value.toLocaleString('pt-BR')}` : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard({ lang = 'pt', onNavigate, workers, workDays, locations, currentUser }) {
  const isMobile = useIsMobile()
  const t = i18n[lang] ?? i18n.pt
  const stats = getDashboardStats(workers, workDays, locations)
  const activeWorkers = workers.filter(w => w.status === 'active').slice(0, 4)

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })
  const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1)

  const userName = currentUser?.user_metadata?.name ?? currentUser?.email?.split('@')[0] ?? 'Admin'
  const hour = new Date().getHours()
  const greetingWord = lang === 'en' ? (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')
    : lang === 'es' ? (hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches')
    : (hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite')

  return (
    <div>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: isMobile ? 20 : 36 }}
      >
        <div style={{ fontSize: 13, color: 'var(--page-muted)', marginBottom: 6, fontWeight: 500 }}>
          {todayFormatted}
        </div>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'flex-end', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 0 }}>
          <div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: isMobile ? 26 : 32, fontWeight: 800,
              color: 'var(--page-heading)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2,
            }}>
              {greetingWord}, {userName} 👋
            </h1>
            <p style={{ margin: '8px 0 0', color: 'var(--page-sub)', fontSize: 14 }}>
              {t.dashboardSubtitle}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('workers')}
            className="btn-primary"
            style={{
              padding: '11px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
              alignSelf: isMobile ? 'flex-start' : 'auto',
            }}
          >
            <Users size={16} />
            {t.addWorker}
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard title={t.totalPaid30d} value={stats.totalEarnings} prefix="R$ " decimals={0} icon={DollarSign} color="#6366f1" change={14} changeLabel={t.vsPrevMonth} delay={0.05} />
        <StatCard title={t.daysWorked} value={stats.totalDays} suffix={` ${t.days}`} icon={CalendarDays} color="#10b981" change={8} changeLabel={t.vsPrevMonth} delay={0.1} />
        <StatCard title={t.activeWorkers} value={stats.activeWorkers} suffix={`/${stats.totalWorkers}`} icon={Users} color="#f59e0b" delay={0.15} />
        <StatCard title={t.avgPerDay} value={stats.avgEarningPerDay} prefix="R$ " decimals={0} icon={TrendingUp} color="#8b5cf6" change={5} changeLabel={t.vsPrevMonth} delay={0.2} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: 16, marginBottom: 16 }}>
        {/* Area chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            borderRadius: 20, padding: isMobile ? '20px 16px 16px' : '28px 28px 20px',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--card-heading)' }}>
                {t.paymentsLast30}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--card-muted)' }}>
                {t.accumulatedPerDay}
              </p>
            </div>
            <div style={{
              fontSize: 12, fontWeight: 600, color: '#818cf8',
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
              padding: '5px 12px', borderRadius: 100,
            }}>
              {t.thirtyDaysBadge}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
            <AreaChart data={stats.last30days}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--inner-border)" />
              <XAxis dataKey="day" tick={{ fill: 'var(--card-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: 'var(--card-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="earnings" name="earnings" stroke="#6366f1" strokeWidth={2} fill="url(#earningsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart - location breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            borderRadius: 20, padding: isMobile ? '20px 16px' : '28px',
            backdropFilter: 'blur(20px)',
          }}
        >
          <h2 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--card-heading)' }}>
            {t.distributionByLocation}
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--card-muted)' }}>
            {t.dailiesByWarehouse}
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={stats.byLocation} cx="50%" cy="50%" innerRadius={40} outerRadius={62} dataKey="days" stroke="none">
                {stats.byLocation.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div style={{ background: 'var(--card-bg-elevated)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: d.color }}>{d.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--card-heading)' }}>{d.days} {t.days}</div>
                  </div>
                )
              }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {stats.byLocation.map((loc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: loc.color }} />
                  <span style={{ fontSize: 13, color: 'var(--card-sub)' }}>{loc.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--card-heading)' }}>{loc.days}d</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom row: Workers + Weekly bar */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 16 }}>
        {/* Recent workers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            borderRadius: 20, padding: isMobile ? '20px 16px' : '28px',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--card-heading)' }}>{t.activeWorkers}</h2>
            <button
              onClick={() => onNavigate('workers')}
              style={{
                background: 'none', border: 'none', color: '#818cf8', fontSize: 13,
                cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {t.viewAll} <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {activeWorkers.map((worker, i) => {
              const workerDays = workDays.filter(d => d.workerId === worker.id)
              const earnings = workerDays.reduce((s, d) => s + d.earnings, 0)
              return (
                <motion.div
                  key={worker.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  whileHover={{ background: 'var(--inner-bg)', x: 2 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 12,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `${worker.avatarColor}20`,
                    border: `1.5px solid ${worker.avatarColor}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: worker.avatarColor, flexShrink: 0,
                  }}>
                    {worker.avatar}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--card-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {worker.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--card-muted)', marginTop: 1 }}>
                      {worker.jobTitle}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                      R$ {earnings.toLocaleString('pt-BR')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--card-muted)' }}>
                      {workerDays.length} {t.days}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Weekly bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            borderRadius: 20, padding: isMobile ? '20px 16px' : '28px',
            backdropFilter: 'blur(20px)',
          }}
        >
          <h2 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--card-heading)' }}>
            {t.currentWeek}
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--card-muted)' }}>
            {t.workersByDay}
          </p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={stats.last7days} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--inner-border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--card-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="workers" name="workers" radius={[6, 6, 0, 0]}>
                {stats.last7days.map((entry, i) => (
                  <Cell key={i} fill={i === stats.last7days.length - 1 ? '#6366f1' : 'rgba(99,102,241,0.35)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}
