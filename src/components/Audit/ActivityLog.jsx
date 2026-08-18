import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, CalendarPlus, CalendarX, Clock, CreditCard, Download, Lock, LogIn, LogOut, MapPin, Settings, Shield, User, UserCog, UserMinus, UserPlus, UtensilsCrossed } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchActivityLogs } from '../../lib/db'

const ACTION_CONFIG = {
  login: {
    icon: LogIn,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    label: 'Login',
  },
  logout: {
    icon: LogOut,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    label: 'Logout',
  },
  add_worker: {
    icon: UserPlus,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.12)',
    label: 'Diarista adicionado',
  },
  edit_worker: {
    icon: UserCog,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    label: 'Diarista editado',
  },
  delete_worker: {
    icon: UserMinus,
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.12)',
    label: 'Diarista removido',
  },
  add_workday: {
    icon: CalendarPlus,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    label: 'Dia registrado',
  },
  delete_workday: {
    icon: CalendarX,
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.12)',
    label: 'Dia removido',
  },
  add_overtime: {
    icon: Clock,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    label: 'Hora extra',
  },
  add_payment: {
    icon: CreditCard,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    label: 'Pagamento confirmado',
  },
  edit_payment: {
    icon: CreditCard,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    label: 'Pagamento desfeito',
  },
  add_location: {
    icon: MapPin,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    label: 'Local adicionado',
  },
  edit_location: {
    icon: MapPin,
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.12)',
    label: 'Local editado',
  },
  delete_location: {
    icon: MapPin,
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.12)',
    label: 'Local removido',
  },
  add_department: {
    icon: MapPin,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    label: 'Departamento adicionado',
  },
  edit_department: {
    icon: MapPin,
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.12)',
    label: 'Departamento editado',
  },
  delete_department: {
    icon: MapPin,
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.12)',
    label: 'Departamento removido',
  },
  add_job_title: {
    icon: MapPin,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    label: 'Cargo adicionado',
  },
  edit_job_title: {
    icon: MapPin,
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.12)',
    label: 'Cargo editado',
  },
  delete_job_title: {
    icon: MapPin,
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.12)',
    label: 'Cargo removido',
  },
  add_schedule: {
    icon: Clock,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    label: 'Horário adicionado',
  },
  edit_schedule: {
    icon: Clock,
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.12)',
    label: 'Horário editado',
  },
  delete_schedule: {
    icon: Clock,
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.12)',
    label: 'Horário removido',
  },
  edit_meal_prices: {
    icon: UtensilsCrossed,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    label: 'Preços de refeição',
  },
  edit_daily_expense: {
    icon: UtensilsCrossed,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    label: 'Gasto diário',
  },
  add_holiday: {
    icon: CalendarDays,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    label: 'Feriado adicionado',
  },
  remove_holiday: {
    icon: CalendarDays,
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.12)',
    label: 'Feriado removido',
  },
  change_password: {
    icon: Lock,
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.12)',
    label: 'Senha alterada',
  },
  update_profile: {
    icon: Settings,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    label: 'Perfil atualizado',
  },
  export_report: {
    icon: Download,
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.12)',
    label: 'Relatório exportado',
  },
}

export default function ActivityLog({ theme }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const isLight = theme === 'light'
  const c = {
    bg: isLight ? 'var(--app-bg)' : 'transparent',
    card: isLight ? '#ffffff' : 'rgba(255,255,255,0.03)',
    border: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)',
    title: isLight ? '#1e293b' : '#f1f5f9',
    sub: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)',
    muted: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)',
    filterBg: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
    filterActiveBg: isLight ? '#6366f1' : '#6366f1',
    empty: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
  }

  useEffect(() => {
    fetchActivityLogs(200)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  const FILTERS = [
    { id: 'all', label: 'Todos' },
    { id: 'auth', label: 'Acesso' },
    { id: 'workers', label: 'Diaristas' },
    { id: 'days', label: 'Dias' },
    { id: 'payment', label: 'Pagamentos' },
    { id: 'expenses', label: 'Gastos' },
    { id: 'locations', label: 'Locais' },
    { id: 'settings', label: 'Configurações' },
    { id: 'reports', label: 'Relatórios' },
  ]

  const filterMap = {
    auth: ['login', 'logout'],
    workers: ['add_worker', 'edit_worker', 'delete_worker'],
    days: ['add_workday', 'delete_workday', 'add_overtime'],
    payment: ['add_payment', 'edit_payment'],
    expenses: ['edit_meal_prices', 'edit_daily_expense'],
    locations: ['add_location', 'edit_location', 'delete_location', 'add_department', 'edit_department', 'delete_department', 'add_job_title', 'edit_job_title', 'delete_job_title', 'add_schedule', 'edit_schedule', 'delete_schedule'],
    settings: ['change_password', 'update_profile', 'add_holiday', 'remove_holiday'],
    reports: ['export_report'],
  }

  const filtered = filter === 'all' ? logs : logs.filter(l => filterMap[filter]?.includes(l.action))

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 6,
          }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Shield size={16} color="#818cf8" />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: 'Syne, sans-serif',
                fontSize: 22,
                fontWeight: 800,
                color: c.title,
                letterSpacing: '-0.02em',
              }}>
              Log de Atividade
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: c.sub }}>Histórico de ações realizadas no sistema</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <motion.button
            key={f.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              background: filter === f.id ? '#6366f1' : c.filterBg,
              color: filter === f.id ? 'white' : c.sub,
              transition: 'background 0.18s, color 0.18s',
            }}>
            {f.label}
          </motion.button>
        ))}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            color: c.muted,
            alignSelf: 'center',
          }}>
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Log list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 14,
                background: c.card,
                border: `1px solid ${c.border}`,
              }}>
              <div className="shimmer" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="shimmer" style={{ width: `${55 + ((i * 13) % 30)}%`, height: 13, borderRadius: 4 }} />
                <div className="shimmer" style={{ width: `${30 + ((i * 7) % 20)}%`, height: 11, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: c.empty }}>
          <Shield size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 14 }}>Nenhum registro encontrado</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <AnimatePresence>
            {filtered.map((log, i) => {
              const cfg = ACTION_CONFIG[log.action] ?? {
                icon: Shield,
                color: '#6366f1',
                bg: 'rgba(99,102,241,0.12)',
                label: log.action,
              }
              const Icon = cfg.icon
              const date = log.created_at ? parseISO(log.created_at) : null

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 14,
                    background: c.card,
                    border: `1px solid ${c.border}`,
                  }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      flexShrink: 0,
                      background: cfg.bg,
                      border: `1px solid ${cfg.color}25`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon size={15} color={cfg.color} />
                  </div>

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: c.title,
                        marginBottom: 4,
                      }}>
                      {log.description}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}>
                      <span style={{ fontSize: 11, color: c.muted }}>{cfg.label}</span>
                      {log.metadata?.userName && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 8px',
                            borderRadius: 20,
                            background: 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#818cf8',
                          }}>
                          <User size={9} />
                          {log.metadata.userName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: c.muted,
                      textAlign: 'right',
                      flexShrink: 0,
                    }}>
                    {date ? (
                      <>
                        <div>{format(date, 'dd/MM/yyyy', { locale: ptBR })}</div>
                        <div>{format(date, 'HH:mm')}</div>
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
