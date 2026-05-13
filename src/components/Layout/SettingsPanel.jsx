import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, Bell, Shield, Info, CalendarDays, Plus, Trash2,
  Moon, Sun, Globe, Zap, ExternalLink, RotateCcw,
} from 'lucide-react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { HOLIDAYS_2025 } from '../../data/mockData'

const UI = {
  pt: {
    title: 'Configurações',
    tabs: { profile: 'Perfil', notifs: 'Notificações', security: 'Segurança', about: 'Sobre' },
    accountInfo: 'Informações da conta', displayPrefs: 'Preferências de exibição',
    language: 'Idioma', languageSub: 'Idioma da interface',
    dateFormat: 'Formato de data', dateFormatSub: 'Como as datas serão exibidas',
    appearance: 'Aparência', appearanceSub: 'Tema da interface',
    dark: 'Escuro', light: 'Claro',
    save: 'Salvar alterações',
    notifChannels: 'Canais de notificação', notifTypes: 'Tipos de evento',
    emailNotif: 'E-mail', emailSub: 'Receber alertas por e-mail',
    pushNotif: 'Push no navegador', pushSub: 'Notificações no desktop',
    payments: 'Pagamentos', paymentsSub: 'Pagamentos pendentes e realizados',
    newWorkers: 'Novos diaristas', newWorkersSub: 'Quando um novo trabalhador for cadastrado',
    reports: 'Relatórios prontos', reportsSub: 'Quando um relatório estiver disponível',
    auth: 'Autenticação', currentPwd: 'Senha atual', newPwd: 'Nova senha', confirmPwd: 'Confirmar nova senha',
    updatePwd: 'Atualizar senha', session: 'Sessão', sessionInfo: 'Iniciada há 32 minutos · Chrome · Windows 11',
    active: 'Ativa', twoFA: 'Autenticação em dois fatores', twoFASub: 'Adicione uma camada extra de segurança',
    system: 'Sistema', support: 'Suporte', docs: 'Documentação', ticket: 'Abrir chamado', open: 'Abrir',
    menuLabel: 'Menu Principal',
    holidaysTab: 'Feriados',
    holidaysRegistered: 'Feriados cadastrados',
    holidaysDesc: 'Datas marcadas como feriado recebem a diária de fim de semana.',
    addHoliday: 'Adicionar feriado',
    addBtn: 'Adicionar',
    resetDefaults: 'Restaurar feriados padrão (2025)',
    noHolidays: 'Nenhum feriado cadastrado',
    invalidDate: 'Data inválida',
    duplicateDate: 'Esta data já foi adicionada',
  },
  en: {
    title: 'Settings',
    tabs: { profile: 'Profile', notifs: 'Notifications', security: 'Security', about: 'About' },
    accountInfo: 'Account information', displayPrefs: 'Display preferences',
    language: 'Language', languageSub: 'Interface language',
    dateFormat: 'Date format', dateFormatSub: 'How dates will be displayed',
    appearance: 'Appearance', appearanceSub: 'Interface theme',
    dark: 'Dark', light: 'Light',
    save: 'Save changes',
    notifChannels: 'Notification channels', notifTypes: 'Event types',
    emailNotif: 'Email', emailSub: 'Receive alerts by email',
    pushNotif: 'Browser push', pushSub: 'Desktop notifications',
    payments: 'Payments', paymentsSub: 'Pending and completed payments',
    newWorkers: 'New workers', newWorkersSub: 'When a new worker is registered',
    reports: 'Ready reports', reportsSub: 'When a report is available',
    auth: 'Authentication', currentPwd: 'Current password', newPwd: 'New password', confirmPwd: 'Confirm new password',
    updatePwd: 'Update password', session: 'Session', sessionInfo: 'Started 32 minutes ago · Chrome · Windows 11',
    active: 'Active', twoFA: 'Two-factor authentication', twoFASub: 'Add an extra layer of security',
    system: 'System', support: 'Support', docs: 'Documentation', ticket: 'Open ticket', open: 'Open',
    menuLabel: 'Main Menu',
    holidaysTab: 'Holidays',
    holidaysRegistered: 'Registered holidays',
    holidaysDesc: 'Dates marked as holidays are paid at the weekend daily rate.',
    addHoliday: 'Add holiday',
    addBtn: 'Add',
    resetDefaults: 'Restore default holidays (2025)',
    noHolidays: 'No holidays registered',
    invalidDate: 'Invalid date',
    duplicateDate: 'This date has already been added',
  },
  es: {
    title: 'Configuración',
    tabs: { profile: 'Perfil', notifs: 'Notificaciones', security: 'Seguridad', about: 'Acerca de' },
    accountInfo: 'Información de la cuenta', displayPrefs: 'Preferencias de visualización',
    language: 'Idioma', languageSub: 'Idioma de la interfaz',
    dateFormat: 'Formato de fecha', dateFormatSub: 'Cómo se mostrarán las fechas',
    appearance: 'Apariencia', appearanceSub: 'Tema de la interfaz',
    dark: 'Oscuro', light: 'Claro',
    save: 'Guardar cambios',
    notifChannels: 'Canales de notificación', notifTypes: 'Tipos de evento',
    emailNotif: 'Correo electrónico', emailSub: 'Recibir alertas por correo',
    pushNotif: 'Push en navegador', pushSub: 'Notificaciones de escritorio',
    payments: 'Pagos', paymentsSub: 'Pagos pendientes y realizados',
    newWorkers: 'Nuevos trabajadores', newWorkersSub: 'Cuando se registre un nuevo trabajador',
    reports: 'Informes listos', reportsSub: 'Cuando un informe esté disponible',
    auth: 'Autenticación', currentPwd: 'Contraseña actual', newPwd: 'Nueva contraseña', confirmPwd: 'Confirmar nueva contraseña',
    updatePwd: 'Actualizar contraseña', session: 'Sesión', sessionInfo: 'Iniciada hace 32 minutos · Chrome · Windows 11',
    active: 'Activa', twoFA: 'Autenticación de dos factores', twoFASub: 'Añade una capa extra de seguridad',
    system: 'Sistema', support: 'Soporte', docs: 'Documentación', ticket: 'Abrir ticket', open: 'Abrir',
    menuLabel: 'Menú Principal',
    holidaysTab: 'Festivos',
    holidaysRegistered: 'Festivos registrados',
    holidaysDesc: 'Las fechas marcadas como festivos reciben la tarifa de fin de semana.',
    addHoliday: 'Agregar festivo',
    addBtn: 'Agregar',
    resetDefaults: 'Restaurar festivos por defecto (2025)',
    noHolidays: 'Ningún festivo registrado',
    invalidDate: 'Fecha inválida',
    duplicateDate: 'Esta fecha ya fue agregada',
  },
}

const LANG_OPTIONS = [
  { value: 'pt', label: 'Português (BR)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
]

function Toggle({ checked, onChange }) {
  return (
    <motion.button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: checked
          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
          : 'rgba(255,255,255,0.1)',
        position: 'relative', flexShrink: 0,
        boxShadow: checked ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
        transition: 'background 0.25s, box-shadow 0.25s',
      }}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{
          position: 'absolute', top: 3, width: 18, height: 18,
          borderRadius: '50%', background: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
      />
    </motion.button>
  )
}

function Row({ label, sub, children }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      marginBottom: 4, marginTop: 8,
    }}>
      {children}
    </div>
  )
}

export default function SettingsPanel({ onClose, theme = 'dark', setTheme, lang = 'pt', setLang, holidays = [], setHolidays }) {
  const isMobile = useIsMobile()
  const [tab, setTab] = useState('profile')
  const [newHolidayDate, setNewHolidayDate] = useState('')
  const [holidayError, setHolidayError] = useState('')
  const [notifSettings, setNotifSettings] = useState({
    email: true, push: false, payments: true, newWorkers: true, reports: false,
  })
  const [profile, setProfile] = useState({
    name: 'Administrador', email: 'admin@diariapro.com', role: 'Administrador',
  })
  const [draftLang, setDraftLang] = useState(lang)
  const [draftTheme, setDraftTheme] = useState(theme)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const t = UI[draftLang] ?? UI.pt
  const TABS = [
    { id: 'profile',  label: t.tabs.profile,  icon: User },
    { id: 'notifs',   label: t.tabs.notifs,   icon: Bell },
    { id: 'security', label: t.tabs.security, icon: Shield },
    { id: 'holidays', label: t.holidaysTab,   icon: CalendarDays },
    { id: 'about',    label: t.tabs.about,    icon: Info },
  ]

  const setNotif = (key, val) =>
    setNotifSettings(p => ({ ...p, [key]: val }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...(isMobile ? { padding: 12 } : { paddingLeft: 272 }),
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: isMobile ? '100%' : 680,
          maxWidth: isMobile ? undefined : 'calc(100vw - 296px)',
          maxHeight: 'calc(100vh - 48px)',
          background: 'linear-gradient(135deg, #131325 0%, #0f0f1e 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '22px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={15} color="#818cf8" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                {t.title}
              </h2>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Diária Pro</p>
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

        {/* Body: tabs + content */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flex: 1, overflow: 'hidden' }}>
          {/* Tabs — sidebar on desktop, horizontal strip on mobile */}
          <div style={isMobile ? {
            flexShrink: 0, padding: '8px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'row', gap: 4,
            overflowX: 'auto',
          } : {
            width: 180, flexShrink: 0, padding: '16px 10px',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {TABS.map(tabItem => {
              const active = tab === tabItem.id
              return (
                <motion.button
                  key={tabItem.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setTab(tabItem.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10,
                    padding: isMobile ? '8px 12px' : '10px 12px',
                    borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                    transition: 'all 0.18s', flexShrink: 0,
                  }}
                >
                  <tabItem.icon size={15} color={active ? '#818cf8' : 'rgba(255,255,255,0.3)'} />
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#e0e7ff' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                    {tabItem.label}
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 16px' : '24px 28px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >

                {/* ── PROFILE ── */}
                {tab === 'profile' && (
                  <div>
                    {/* Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 800, color: 'white', flexShrink: 0,
                        boxShadow: '0 0 24px rgba(99,102,241,0.35)',
                      }}>
                        AD
                      </div>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>
                          {profile.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                          {profile.role} · {profile.email}
                        </div>
                      </div>
                    </div>

                    <SectionTitle>{t.accountInfo}</SectionTitle>
                    <div style={{ marginBottom: 20 }}>
                      {[
                        { label: 'Nome', key: 'name', type: 'text' },
                        { label: 'E-mail', key: 'email', type: 'email' },
                      ].map(f => (
                        <div key={f.key} style={{ marginBottom: 12 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {f.label}
                          </label>
                          <input
                            type={f.type}
                            value={profile[f.key]}
                            onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                            className="input-premium"
                            style={{ width: '100%', padding: '11px 14px', borderRadius: 11, fontSize: 14 }}
                          />
                        </div>
                      ))}
                    </div>

                    <SectionTitle>{t.displayPrefs}</SectionTitle>
                    <Row label={t.language} sub={t.languageSub}>
                      <select
                        value={draftLang}
                        onChange={e => setDraftLang(e.target.value)}
                        className="input-premium"
                        style={{ padding: '8px 12px', borderRadius: 9, fontSize: 13, cursor: 'pointer' }}
                      >
                        {LANG_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </Row>
                    <Row label={t.dateFormat} sub={t.dateFormatSub}>
                      <select className="input-premium" style={{ padding: '8px 12px', borderRadius: 9, fontSize: 13, cursor: 'pointer' }}>
                        <option>DD/MM/AAAA</option>
                        <option>MM/DD/AAAA</option>
                        <option>AAAA-MM-DD</option>
                      </select>
                    </Row>
                    <Row label={t.appearance} sub={t.appearanceSub}>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDraftTheme(draftTheme === 'dark' ? 'light' : 'dark')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                          background: draftTheme === 'light' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
                          border: `1px solid ${draftTheme === 'light' ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.25)'}`,
                          transition: 'all 0.25s',
                        }}
                      >
                        <AnimatePresence mode="wait">
                          {draftTheme === 'dark' ? (
                            <motion.span key="dark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <Moon size={14} color="#818cf8" />
                              <span style={{ fontSize: 13, color: '#818cf8', fontWeight: 600 }}>{t.dark}</span>
                            </motion.span>
                          ) : (
                            <motion.span key="light" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <Sun size={14} color="#f59e0b" />
                              <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>{t.light}</span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </Row>

                    <div style={{ marginTop: 24 }}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setLang(draftLang); setTheme(draftTheme) }}
                        className="btn-primary"
                        style={{ padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}
                      >
                        {t.save}
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* ── NOTIFICATIONS ── */}
                {tab === 'notifs' && (
                  <div>
                    <SectionTitle>{t.notifChannels}</SectionTitle>
                    <Row label={t.emailNotif} sub={t.emailSub}>
                      <Toggle checked={notifSettings.email} onChange={v => setNotif('email', v)} />
                    </Row>
                    <Row label={t.pushNotif} sub={t.pushSub}>
                      <Toggle checked={notifSettings.push} onChange={v => setNotif('push', v)} />
                    </Row>

                    <SectionTitle style={{ marginTop: 24 }}>{t.notifTypes}</SectionTitle>
                    <Row label={t.payments} sub={t.paymentsSub}>
                      <Toggle checked={notifSettings.payments} onChange={v => setNotif('payments', v)} />
                    </Row>
                    <Row label={t.newWorkers} sub={t.newWorkersSub}>
                      <Toggle checked={notifSettings.newWorkers} onChange={v => setNotif('newWorkers', v)} />
                    </Row>
                    <Row label={t.reports} sub={t.reportsSub}>
                      <Toggle checked={notifSettings.reports} onChange={v => setNotif('reports', v)} />
                    </Row>
                  </div>
                )}

                {/* ── SECURITY ── */}
                {tab === 'security' && (
                  <div>
                    <SectionTitle>{t.auth}</SectionTitle>
                    <div style={{ marginBottom: 16 }}>
                      {[t.currentPwd, t.newPwd, t.confirmPwd].map((label, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {label}
                          </label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            className="input-premium"
                            style={{ width: '100%', padding: '11px 14px', borderRadius: 11, fontSize: 14 }}
                          />
                        </div>
                      ))}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary"
                        style={{ marginTop: 8, padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}
                      >
                        {t.updatePwd}
                      </motion.button>
                    </div>

                    <SectionTitle>{t.session}</SectionTitle>
                    <Row label={t.session} sub={t.sessionInfo}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                        background: 'rgba(16,185,129,0.1)', color: '#10b981',
                        border: '1px solid rgba(16,185,129,0.2)',
                      }}>
                        {t.active}
                      </span>
                    </Row>
                    <Row label={t.twoFA} sub={t.twoFASub}>
                      <Toggle checked={false} onChange={() => {}} />
                    </Row>
                  </div>
                )}

                {/* ── HOLIDAYS ── */}
                {tab === 'holidays' && (
                  <div>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{t.holidaysRegistered}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{t.holidaysDesc}</div>
                    </div>

                    {/* Add new holiday */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="date"
                          value={newHolidayDate}
                          onChange={e => { setNewHolidayDate(e.target.value); setHolidayError('') }}
                          className="input-premium"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 11, fontSize: 14, colorScheme: 'dark' }}
                        />
                        {holidayError && (
                          <div style={{ fontSize: 11, color: '#f43f5e', marginTop: 4 }}>{holidayError}</div>
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          if (!newHolidayDate) return
                          if (!isValid(parseISO(newHolidayDate))) { setHolidayError(t.invalidDate); return }
                          if (holidays.includes(newHolidayDate)) { setHolidayError(t.duplicateDate); return }
                          setHolidays(prev => [...prev, newHolidayDate].sort())
                          setNewHolidayDate('')
                          setHolidayError('')
                        }}
                        style={{
                          padding: '10px 16px', borderRadius: 11, border: 'none', cursor: 'pointer',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
                          display: 'flex', alignItems: 'center', gap: 6,
                          boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                        }}
                      >
                        <Plus size={14} />
                        {t.addBtn}
                      </motion.button>
                    </div>

                    {/* Holiday list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                      {holidays.length === 0 ? (
                        <div style={{
                          padding: '24px', borderRadius: 14, textAlign: 'center',
                          border: '1px dashed rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.25)', fontSize: 13,
                        }}>
                          {t.noHolidays}
                        </div>
                      ) : holidays.map(dateStr => {
                        const parsed = parseISO(dateStr)
                        const label = isValid(parsed)
                          ? format(parsed, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : dateStr
                        const isDefault = HOLIDAYS_2025.includes(dateStr)
                        return (
                          <motion.div
                            key={dateStr}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '11px 14px', borderRadius: 12,
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                background: isDefault ? '#f59e0b' : '#6366f1',
                              }} />
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{label}</div>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1, fontFamily: 'monospace' }}>{dateStr}</div>
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1, color: '#f43f5e' }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setHolidays(prev => prev.filter(d => d !== dateStr))}
                              style={{
                                width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
                                background: 'rgba(244,63,94,0.08)', color: 'rgba(244,63,94,0.5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'color 0.15s',
                              }}
                            >
                              <Trash2 size={13} />
                            </motion.button>
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* Reset to defaults */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setHolidays([...HOLIDAYS_2025]); setHolidayError('') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 16px', borderRadius: 11, border: '1px solid rgba(245,158,11,0.2)',
                        background: 'rgba(245,158,11,0.06)', color: '#f59e0b',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      }}
                    >
                      <RotateCcw size={13} />
                      {t.resetDefaults}
                    </motion.button>
                  </div>
                )}

                {/* ── ABOUT ── */}
                {tab === 'about' && (
                  <div>
                    {/* Logo card */}
                    <div style={{
                      padding: '24px', borderRadius: 16, marginBottom: 20,
                      background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                      display: 'flex', alignItems: 'center', gap: 16,
                    }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                      }}>
                        <Zap size={22} color="white" fill="white" />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>
                          Diária Pro
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                          Versão 2.1.0 · Build 2025.05
                        </div>
                      </div>
                    </div>

                    {/* Diarista illustration */}
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 20px' }}>
                      <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12"/>
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                          </radialGradient>
                          <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#6366f1"/>
                            <stop offset="100%" stopColor="#4f46e5"/>
                          </linearGradient>
                          <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#a78bfa"/>
                            <stop offset="100%" stopColor="#818cf8"/>
                          </linearGradient>
                        </defs>

                        {/* Background glow */}
                        <circle cx="80" cy="80" r="78" fill="url(#bgGlow)" stroke="rgba(99,102,241,0.12)" strokeWidth="1"/>

                        {/* Mop handle (behind body) */}
                        <rect x="114" y="22" width="5" height="96" rx="2.5" fill="#a5b4fc" transform="rotate(8 114 22)"/>

                        {/* Right hand on handle */}
                        <circle cx="119" cy="58" r="7" fill="url(#skinGrad)"/>

                        {/* Head */}
                        <circle cx="74" cy="42" r="19" fill="url(#skinGrad)"/>
                        {/* Hair */}
                        <path d="M55 40 Q55 23 74 23 Q93 23 93 40 Q88 30 74 30 Q60 30 55 40Z" fill="#4338ca"/>
                        {/* Eyes */}
                        <circle cx="68" cy="40" r="3" fill="white"/>
                        <circle cx="80" cy="40" r="3" fill="white"/>
                        <circle cx="69" cy="41" r="1.5" fill="#312e81"/>
                        <circle cx="81" cy="41" r="1.5" fill="#312e81"/>
                        {/* Smile */}
                        <path d="M67 49 Q74 55 81 49" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>

                        {/* Uniform top */}
                        <path d="M50 68 Q50 62 74 62 Q98 62 98 68 L100 104 Q100 108 96 108 L52 108 Q48 108 48 104 Z" fill="url(#bodyGrad)"/>
                        {/* Apron/bib */}
                        <path d="M68 62 L74 80 L80 62" fill="rgba(129,140,248,0.5)"/>
                        {/* Pocket */}
                        <rect x="55" y="74" width="14" height="11" rx="3" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>

                        {/* Left arm (hanging) */}
                        <path d="M50 70 Q38 78 36 92" stroke="#818cf8" strokeWidth="11" strokeLinecap="round" fill="none"/>
                        <circle cx="36" cy="96" r="7.5" fill="url(#skinGrad)"/>

                        {/* Right arm (raised, holding mop) */}
                        <path d="M98 70 Q108 64 114 56" stroke="#818cf8" strokeWidth="11" strokeLinecap="round" fill="none"/>

                        {/* Pants */}
                        <path d="M48 108 L52 138 Q52 142 58 142 L68 142 Q74 142 74 138 L74 108" fill="#4338ca"/>
                        <path d="M100 108 L96 138 Q96 142 90 142 L80 142 Q74 142 74 138 L74 108" fill="#4338ca"/>
                        {/* Shoes */}
                        <rect x="46" y="137" width="22" height="10" rx="5" fill="#312e81"/>
                        <rect x="80" y="137" width="22" height="10" rx="5" fill="#312e81"/>

                        {/* Mop head */}
                        <rect x="108" y="116" width="36" height="14" rx="7" fill="#c7d2fe" opacity="0.75"/>
                        <line x1="110" y1="120" x2="107" y2="132" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="117" y1="122" x2="115" y2="134" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="124" y1="123" x2="123" y2="135" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="131" y1="122" x2="131" y2="134" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="138" y1="120" x2="140" y2="132" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round"/>

                        {/* Sparkle accents */}
                        <circle cx="30" cy="50" r="2.5" fill="#818cf8" opacity="0.4"/>
                        <circle cx="140" cy="42" r="1.8" fill="#a5b4fc" opacity="0.5"/>
                        <circle cx="25" cy="110" r="1.5" fill="#6366f1" opacity="0.4"/>
                        <circle cx="148" cy="100" r="2" fill="#c7d2fe" opacity="0.4"/>
                      </svg>
                    </div>

                    <SectionTitle>{t.system}</SectionTitle>
                    {[
                      { label: 'Versão', value: '2.1.0' },
                      { label: 'Ambiente', value: 'Produção' },
                      { label: 'Licença', value: 'Empresarial' },
                      { label: 'Última atualização', value: '05/05/2025' },
                    ].map((r, i) => (
                      <Row key={i} label={r.label}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                          {r.value}
                        </span>
                      </Row>
                    ))}

                    <SectionTitle>{t.support}</SectionTitle>
                    {[
                      { label: t.docs,   icon: ExternalLink },
                      { label: t.ticket, icon: ExternalLink },
                    ].map((r, i) => (
                      <Row key={i} label={r.label}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.03)', color: '#818cf8',
                            cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          }}
                        >
                          <r.icon size={12} />
                          {t.open}
                        </motion.button>
                      </Row>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
