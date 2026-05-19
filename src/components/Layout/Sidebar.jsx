import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, CalendarDays, CreditCard,
  MapPin, BarChart3, Settings, Bell, LogOut, Zap, AlertTriangle, X,
} from 'lucide-react'
import NotificationsPanel from './NotificationsPanel'
import SettingsPanel from './SettingsPanel'
import i18n from '../../i18n'

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'workers',   icon: Users },
  { id: 'tracking',  icon: CalendarDays },
  { id: 'payments',  icon: CreditCard },
  { id: 'locations', icon: MapPin },
  { id: 'reports',   icon: BarChart3 },
]

const NAV_LABELS = {
  pt: { dashboard: 'Dashboard', workers: 'Trabalhadores', tracking: 'Controle de Dias', payments: 'Pagamentos', locations: 'Locais', reports: 'Relatórios', notifications: 'Notificações', settings: 'Configurações' },
  en: { dashboard: 'Dashboard', workers: 'Workers', tracking: 'Time Tracking', payments: 'Payments', locations: 'Locations', reports: 'Reports', notifications: 'Notifications', settings: 'Settings' },
  es: { dashboard: 'Dashboard', workers: 'Trabajadores', tracking: 'Control de Días', payments: 'Pagos', locations: 'Lugares', reports: 'Informes', notifications: 'Notificaciones', settings: 'Configuración' },
}

export default function Sidebar({ activePage, setActivePage, onLogout, theme, setTheme, lang = 'pt', setLang, holidays = [], setHolidays, isMobile = false, sidebarOpen = false, setSidebarOpen, currentUser }) {
  const t = i18n[lang] ?? i18n.pt
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings]           = useState(false)
  const [confirmLogout, setConfirmLogout]         = useState(false)
  const [unreadCount, setUnreadCount]             = useState(3)

  const handleLogout = () => {
    setConfirmLogout(false)
    onLogout()
  }

  const isLight = theme === 'light'
  const sb = {
    bg:              isLight ? 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' : 'linear-gradient(180deg, #0d0d1a 0%, #0a0a14 100%)',
    border:          isLight ? 'rgba(0,0,0,0.08)'  : 'rgba(255,255,255,0.05)',
    divider:         isLight ? 'rgba(0,0,0,0.07)'  : 'rgba(255,255,255,0.05)',
    logoText:        isLight ? '#1e293b'            : '#f1f5f9',
    logoSub:         isLight ? 'rgba(0,0,0,0.35)'  : 'rgba(255,255,255,0.3)',
    sectionLabel:    isLight ? 'rgba(0,0,0,0.3)'   : 'rgba(255,255,255,0.2)',
    navIcon:         isLight ? 'rgba(0,0,0,0.4)'   : 'rgba(255,255,255,0.35)',
    navText:         isLight ? 'rgba(0,0,0,0.5)'   : 'rgba(255,255,255,0.45)',
    navActiveText:   isLight ? '#4f46e5'            : '#e0e7ff',
    closeBtnBg:      isLight ? 'rgba(0,0,0,0.06)'  : 'rgba(255,255,255,0.05)',
    closeBtnBorder:  isLight ? 'rgba(0,0,0,0.1)'   : 'rgba(255,255,255,0.08)',
    closeBtnIcon:    isLight ? 'rgba(0,0,0,0.4)'   : 'rgba(255,255,255,0.5)',
    badgeBorder:     isLight ? '#f1f5f9'            : '#0d0d1a',
    cancelBg:        isLight ? 'rgba(0,0,0,0.04)'  : 'rgba(255,255,255,0.04)',
    cancelBorder:    isLight ? 'rgba(0,0,0,0.08)'  : 'rgba(255,255,255,0.08)',
    cancelText:      isLight ? 'rgba(0,0,0,0.4)'   : 'rgba(255,255,255,0.4)',
    confirmText:     isLight ? 'rgba(0,0,0,0.6)'   : 'rgba(255,255,255,0.6)',
    userText:        isLight ? '#1e293b'            : '#e2e8f0',
    userEmail:       isLight ? 'rgba(0,0,0,0.35)'  : 'rgba(255,255,255,0.3)',
    logoutIcon:      isLight ? 'rgba(0,0,0,0.25)'  : 'rgba(255,255,255,0.25)',
    hoverBg:         isLight ? 'rgba(0,0,0,0.04)'  : 'rgba(255,255,255,0.03)',
  }

  const handleNavClick = (id) => {
    setActivePage(id)
    if (isMobile) setSidebarOpen(false)
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeSidebar}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 199,
            }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={isMobile ? false : { x: -260 }}
        animate={isMobile ? { x: sidebarOpen ? 0 : -260 } : { x: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh', width: 260,
          background: sb.bg,
          borderRight: `1px solid ${sb.border}`,
          display: 'flex', flexDirection: 'column',
          zIndex: isMobile ? 200 : 100,
          overflow: 'hidden',
        }}
      >
        {/* ── Logo ── */}
        <div style={{ padding: '28px 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
              }}>
                <Zap size={18} color="white" fill="white" />
              </div>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, color: sb.logoText, letterSpacing: '-0.02em' }}>
                  Diária Pro
                </div>
                <div style={{ fontSize: 10, color: sb.logoSub, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {t.brandSubtitle}
                </div>
              </div>
            </motion.div>

            {/* Close button — mobile only */}
            {isMobile && (
              <button
                onClick={closeSidebar}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: sb.closeBtnBg,
                  border: `1px solid ${sb.closeBtnBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} color={sb.closeBtnIcon} />
              </button>
            )}
          </div>
          <div style={{ height: 1, background: sb.divider, marginTop: 24 }} />
        </div>

        {/* ── Section label ── */}
        <div style={{ padding: '0 24px 12px' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: sb.sectionLabel, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {t.menuPrincipal}
          </span>
        </div>

        {/* ── Nav items ── */}
        <nav style={{ flex: 1, padding: '0 12px' }}>
          {NAV_ITEMS.map((item, i) => {
            const isActive = activePage === item.id
            const Icon = item.icon
            const label = NAV_LABELS[lang]?.[item.id] ?? NAV_LABELS.pt[item.id]
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 + 0.1 }}
                onClick={() => handleNavClick(item.id)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10, marginBottom: 4,
                  border: 'none', cursor: 'pointer',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)'
                    : 'transparent',
                  transition: 'all 0.2s ease',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 20, borderRadius: '0 3px 3px 0',
                      background: 'linear-gradient(180deg, #818cf8 0%, #a78bfa 100%)',
                    }}
                  />
                )}
                {isActive && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, rgba(99,102,241,0.1) 0%, transparent 100%)',
                    borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)',
                  }} />
                )}
                <Icon
                  size={18}
                  color={isActive ? '#818cf8' : sb.navIcon}
                  style={{ transition: 'color 0.2s ease', flexShrink: 0 }}
                />
                <span style={{
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  color: isActive ? sb.navActiveText : sb.navText,
                  transition: 'color 0.2s ease',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {label}
                </span>
              </motion.button>
            )
          })}
        </nav>

        {/* ── Bottom section ── */}
        <div style={{ padding: '16px 12px 24px' }}>
          <div style={{ height: 1, background: sb.divider, marginBottom: 16 }} />

          {/* Notifications */}
          <motion.button
            whileHover={{ x: 2, background: sb.hoverBg }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setShowNotifications(true); setConfirmLogout(false) }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10, marginBottom: 4,
              border: 'none', cursor: 'pointer', background: 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Bell size={18} color={showNotifications ? '#818cf8' : sb.navIcon} />
              {unreadCount > 0 && (
                <div style={{
                  position: 'absolute', top: -2, right: -2, width: 8, height: 8,
                  borderRadius: '50%', background: '#f43f5e',
                  border: `1.5px solid ${sb.badgeBorder}`,
                }} />
              )}
            </div>
            <span style={{ fontSize: 14, color: showNotifications ? '#818cf8' : sb.navText, fontFamily: 'Inter, sans-serif', transition: 'color 0.2s' }}>
              {NAV_LABELS[lang]?.notifications ?? 'Notificações'}
            </span>
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                background: 'rgba(244,63,94,0.15)', color: '#f43f5e',
                padding: '2px 7px', borderRadius: 100,
              }}>
                {unreadCount}
              </span>
            )}
          </motion.button>

          {/* Settings */}
          <motion.button
            whileHover={{ x: 2, background: sb.hoverBg }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setShowSettings(true); setConfirmLogout(false) }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10, marginBottom: 12,
              border: 'none', cursor: 'pointer', background: 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <Settings size={18} color={showSettings ? '#818cf8' : sb.navIcon} />
            <span style={{ fontSize: 14, color: showSettings ? '#818cf8' : sb.navText, fontFamily: 'Inter, sans-serif', transition: 'color 0.2s' }}>
              {NAV_LABELS[lang]?.settings ?? 'Configurações'}
            </span>
          </motion.button>

          {/* ── Logout confirmation strip ── */}
          <AnimatePresence>
            {confirmLogout && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden', marginBottom: 8 }}
              >
                <div style={{
                  padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(244,63,94,0.07)',
                  border: '1px solid rgba(244,63,94,0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <AlertTriangle size={13} color="#f43f5e" />
                    <span style={{ fontSize: 12, color: sb.confirmText, fontWeight: 500 }}>
                      {t.logoutConfirm}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button
                      onClick={() => setConfirmLogout(false)}
                      style={{
                        flex: 1, padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: `1px solid ${sb.cancelBorder}`, background: sb.cancelBg,
                        color: sb.cancelText, cursor: 'pointer',
                      }}
                    >
                      {t.cancel}
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleLogout}
                      style={{
                        flex: 2, padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        border: 'none', background: '#f43f5e', color: 'white', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(244,63,94,0.35)',
                      }}
                    >
                      {t.logout}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── User profile + logout trigger ── */}
          <motion.div
            whileHover={{ background: sb.hoverBg }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              transition: 'background 0.2s', position: 'relative',
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
              boxShadow: '0 0 12px rgba(99,102,241,0.3)',
            }}>
              {(currentUser?.email ?? 'AD').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: sb.userText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.user_metadata?.name ?? currentUser?.email?.split('@')[0] ?? 'Usuário'}
              </div>
              <div style={{ fontSize: 11, color: sb.userEmail, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.email ?? ''}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.15, color: '#f43f5e' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setConfirmLogout(p => !p)}
              title="Sair"
              style={{
                width: 28, height: 28, borderRadius: 8, border: 'none', flexShrink: 0,
                background: confirmLogout ? 'rgba(244,63,94,0.12)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <LogOut size={15} color={confirmLogout ? '#f43f5e' : sb.logoutIcon} />
            </motion.button>
          </motion.div>
        </div>
      </motion.aside>

      {/* ── Overlays ── */}
      <AnimatePresence>
        {showNotifications && (
          <NotificationsPanel
            onClose={() => setShowNotifications(false)}
            onRead={() => setUnreadCount(0)}
            theme={theme}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            theme={theme}
            setTheme={setTheme}
            lang={lang}
            setLang={setLang}
            holidays={holidays}
            setHolidays={setHolidays}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>
    </>
  )
}
