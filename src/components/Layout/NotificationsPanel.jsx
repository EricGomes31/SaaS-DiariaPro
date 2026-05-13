import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, CheckCheck, Users, CreditCard, AlertCircle, Info, Trash2 } from 'lucide-react'
import { useIsMobile } from '../../hooks/useIsMobile'

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'worker',
    icon: Users,
    iconColor: '#6366f1',
    iconBg: 'rgba(99,102,241,0.12)',
    title: 'Novo dia registrado',
    body: 'Carlos Eduardo trabalhou no Galpão 1 hoje.',
    time: '2 min atrás',
    read: false,
  },
  {
    id: 2,
    type: 'payment',
    icon: CreditCard,
    iconColor: '#f59e0b',
    iconBg: 'rgba(245,158,11,0.12)',
    title: 'Pagamento pendente',
    body: 'Fernanda Souza tem R$ 2.880 pendente neste mês.',
    time: '1h atrás',
    read: false,
  },
  {
    id: 3,
    type: 'alert',
    icon: AlertCircle,
    iconColor: '#f43f5e',
    iconBg: 'rgba(244,63,94,0.12)',
    title: 'Diarista inativo',
    body: 'Luciana Santos está inativa há mais de 30 dias.',
    time: '3h atrás',
    read: false,
  },
  {
    id: 4,
    type: 'info',
    icon: Info,
    iconColor: '#06b6d4',
    iconBg: 'rgba(6,182,212,0.12)',
    title: 'Atualização do sistema',
    body: 'Diária Pro v2.1 — histórico de pagamentos disponível.',
    time: 'Ontem',
    read: true,
  },
]

export default function NotificationsPanel({ onClose }) {
  const isMobile = useIsMobile()
  const [notes, setNotes] = useState(INITIAL_NOTIFICATIONS)

  const unreadCount = notes.filter(n => !n.read).length

  const markRead = (id) =>
    setNotes(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const markAllRead = () =>
    setNotes(prev => prev.map(n => ({ ...n, read: true })))

  const remove = (id) =>
    setNotes(prev => prev.filter(n => n.id !== id))

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: isMobile ? 0 : 260, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 200,
        }}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed', top: 0, left: isMobile ? 0 : 260,
          width: isMobile ? '100%' : 360, height: '100vh',
          background: 'linear-gradient(180deg, #111122 0%, #0d0d1a 100%)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          zIndex: 201, display: 'flex', flexDirection: 'column',
          boxShadow: '8px 0 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bell size={15} color="#f43f5e" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                  Notificações
                </h2>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
              }}
            >
              <X size={15} />
            </motion.button>
          </div>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <motion.button
              whileHover={{ background: 'rgba(99,102,241,0.12)' }}
              whileTap={{ scale: 0.97 }}
              onClick={markAllRead}
              style={{
                marginTop: 12, width: '100%', padding: '8px 12px', borderRadius: 9,
                border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.07)',
                color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <CheckCheck size={13} />
              Marcar todas como lidas
            </motion.button>
          )}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
          <AnimatePresence>
            {notes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.2)' }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Nenhuma notificação</div>
              </motion.div>
            ) : (
              notes.map((n, i) => {
                const Icon = n.icon
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => markRead(n.id)}
                    style={{
                      position: 'relative', padding: '14px', borderRadius: 13, marginBottom: 8,
                      background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(22,22,40,0.9)',
                      border: `1px solid ${n.read ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
                      cursor: n.read ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Unread dot */}
                    {!n.read && (
                      <div style={{
                        position: 'absolute', top: 14, right: 14,
                        width: 7, height: 7, borderRadius: '50%', background: '#6366f1',
                        boxShadow: '0 0 6px rgba(99,102,241,0.6)',
                      }} />
                    )}

                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: n.iconBg, border: `1px solid ${n.iconColor}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: n.read ? 0.5 : 1,
                      }}>
                        <Icon size={16} color={n.iconColor} />
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden', paddingRight: n.read ? 0 : 16 }}>
                        <div style={{
                          fontSize: 13, fontWeight: n.read ? 500 : 700,
                          color: n.read ? 'rgba(255,255,255,0.45)' : '#f1f5f9',
                          marginBottom: 3,
                        }}>
                          {n.title}
                        </div>
                        <div style={{
                          fontSize: 12, color: 'rgba(255,255,255,0.35)',
                          lineHeight: 1.5, marginBottom: 6,
                        }}>
                          {n.body}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>
                          {n.time}
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    <motion.button
                      whileHover={{ scale: 1.15, background: 'rgba(244,63,94,0.15)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={e => { e.stopPropagation(); remove(n.id) }}
                      style={{
                        position: 'absolute', bottom: 12, right: 12,
                        width: 24, height: 24, borderRadius: 6, border: 'none',
                        background: 'rgba(255,255,255,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <Trash2 size={12} color="rgba(255,255,255,0.2)" />
                    </motion.button>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center',
        }}>
          Clique em uma notificação para marcá-la como lida
        </div>
      </motion.div>
    </>
  )
}
