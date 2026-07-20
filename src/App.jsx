import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Zap, RefreshCw } from 'lucide-react'
import Sidebar from './components/Layout/Sidebar'
import Dashboard from './components/Dashboard/Dashboard'
import WorkerList from './components/Workers/WorkerList'
import WorkCalendar from './components/Tracking/WorkCalendar'
import PaymentView from './components/Payments/PaymentView'
import DailyExpenses from './components/Expenses/DailyExpenses'
import LocationManager from './components/Locations/LocationManager'
import Reports from './components/Reports/Reports'
import ActivityLog from './components/Audit/ActivityLog'
import DataImport from './components/Migration/DataImport'
import LoginScreen from './components/Auth/LoginScreen'
import SignUpScreen from './components/Auth/SignUpScreen'
import LoadingScreen from './components/UI/LoadingScreen'
import ChangePasswordModal from './components/Auth/ChangePasswordModal'
import InviteSetPassword from './components/Auth/InviteSetPassword'
import PlansModal from './components/Billing/PlansModal'
import { useIsMobile } from './hooks/useIsMobile'
import { useIdleTimeout } from './hooks/useIdleTimeout'
import { useUpdateCheck } from './hooks/useUpdateCheck'
import i18n from './i18n'
import { supabase } from './lib/supabase'
import * as db from './lib/db'
import { log, setLogUser } from './lib/logger'
import { useToast } from './components/UI/Toast'

const PAGES = {
  dashboard: Dashboard, workers: WorkerList, tracking: WorkCalendar,
  expenses: DailyExpenses, payments: PaymentView, locations: LocationManager,
  reports: Reports, audit: ActivityLog, migration: DataImport,
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

// ─── Change detection helper ────────────────────────────────────────────────
function diff(prev, curr) {
  const prevById = new Map(prev.map(p => [p.id, p]))
  const toUpsert = curr.filter(item => {
    const old = prevById.get(item.id)
    // Itens não tocados mantêm a mesma referência (setX(prev => prev.map(...)))
    return !old || (old !== item && JSON.stringify(old) !== JSON.stringify(item))
  })
  const currIds = new Set(curr.map(item => item.id))
  const toDelete = prev.filter(p => !currIds.has(p.id)).map(p => p.id)
  return { toUpsert, toDelete }
}

export default function App() {
  const { showToast } = useToast()
  const updateAvailable = useUpdateCheck()

  // ── UI state ──────────────────────────────────────────────────────────────
  const [authChecking,     setAuthChecking]     = useState(true)
  const [isAuthenticated,  setIsAuthenticated]  = useState(false)
  const [currentUser,      setCurrentUser]      = useState(null)
  const [dataLoading,      setDataLoading]       = useState(false)
  const [passwordRecovery, setPasswordRecovery]  = useState(false)
  const [isInvite,         setIsInvite]          = useState(() => {
    // Só registra o flag — a decisão de mostrar o form fica no getSession()
    if (window.location.hash.includes('type=invite')) {
      localStorage.setItem('diaria_invite_pending', '1')
    }
    return false
  })
  const [activePage,       setActivePage]        = useState('dashboard')
  const [selectedWorker,   setSelectedWorker]    = useState(null)
  const [theme,            setTheme]             = useState(() => localStorage.getItem('theme') ?? 'dark')
  const [authPage,         setAuthPage]          = useState('login') // 'login' | 'signup'
  const [lang,             setLang]              = useState('pt')
  const [sidebarOpen,      setSidebarOpen]       = useState(false)
  const [showIdleWarning,  setShowIdleWarning]   = useState(false)
  const [showPlans,        setShowPlans]         = useState(false)
  const isMobile = useIsMobile()

  useIdleTimeout({
    timeout:     60 * 60 * 1000, // 1 hora
    warningTime: 60 * 1000,      // aviso 1 minuto antes
    enabled:     isAuthenticated,
    onWarning:   () => setShowIdleWarning(true),
    onReset:     () => setShowIdleWarning(false),
    onIdle:      () => { setShowIdleWarning(false); handleLogout() },
  })

  // ── Data state ───────────────────────────────────────────────────────────
  const [workers,        setWorkers]        = useState([])
  const [workDays,       setWorkDays]       = useState([])
  const [locations,      setLocations]      = useState([])
  const [paymentRecords, setPaymentRecords] = useState([])
  const [holidays,       setHolidays]       = useState([])
  const [dailyExpenses,  setDailyExpenses]  = useState([])
  const [subscription,   setSubscription]   = useState(null)  // read-only: escrita via Edge Function

  // ── Sync control refs ────────────────────────────────────────────────────
  const syncing              = useRef(false)
  const loadingInProgress    = useRef(false)
  const fromRealtime         = useRef(false)
  const inPasswordRecovery   = useRef(false)

  // Previous state refs for change-detection in sync effects
  const prevWorkers   = useRef([])
  const prevWorkDays  = useRef([])
  const prevLocations = useRef([])
  const prevPayments  = useRef([])
  const prevHolidays  = useRef([])
  const prevDailyExpenses = useRef([])

  // ── Auth setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Restore session on page reload
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        if (window.location.hash.includes('type=invite')) {
          // Invite token in URL — Supabase hasn't processed it yet.
          // Keep authChecking = true and let onAuthStateChange(SIGNED_IN) handle it.
          return
        }
        // No session, no invite URL — clear any stale flag and show login.
        localStorage.removeItem('diaria_invite_pending')
        setAuthChecking(false)
        return
      }

      setCurrentUser(session.user)
      const localPending  = localStorage.getItem('diaria_invite_pending') === '1'
      const metaValue     = session.user.user_metadata?.invite_pending  // true | false | undefined
      const metaPending   = metaValue === true
      const metaCleared   = metaValue === false  // explicitly cleared by InviteSetPassword

      if ((localPending || metaPending) && !metaCleared) {
        setIsInvite(true)
        setAuthChecking(false)
      } else {
        if (localPending) localStorage.removeItem('diaria_invite_pending')
        setAuthChecking(false)
        loadData()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        inPasswordRecovery.current = true
        setPasswordRecovery(true)
        setAuthChecking(false)
        return
      }
      if (event === 'USER_UPDATED' && session) {
        setCurrentUser(session.user)
        // When another tab completes the invite (invite_pending set to false),
        // clear the invite gate on this tab and load data.
        if (session.user.user_metadata?.invite_pending === false) {
          localStorage.removeItem('diaria_invite_pending')
          setIsInvite(false)
          loadData()
        }
        return
      }
      if (event === 'SIGNED_IN' && session) {
        if (inPasswordRecovery.current) return  // não autentica durante recovery
        setCurrentUser(session.user)
        setLogUser(session.user)
        const isInviteUrl  = window.location.hash.includes('type=invite')
        const localPending = localStorage.getItem('diaria_invite_pending') === '1'
        const hasPendingInvite = isInviteUrl || localPending || !!session.user.user_metadata?.invite_pending
        if (hasPendingInvite) {
          // Garante que o flag esteja gravado (caso o hash já tenha sido limpo pelo SDK)
          if (!localPending) localStorage.setItem('diaria_invite_pending', '1')
          // Metadata no Supabase como fallback para outros dispositivos
          supabase.auth.updateUser({ data: { invite_pending: true } }).catch(() => {})
          setIsInvite(true)
          setAuthChecking(false)
        } else {
          loadData()
          log('login', `Login: ${session.user.email}`)
        }
      }
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
        setIsInvite(false)
        syncing.current = false
        setWorkers([]); setWorkDays([]); setLocations([])
        setPaymentRecords([]); setHolidays([]); setDailyExpenses([])
        setSubscription(null)
        prevWorkers.current = []; prevWorkDays.current = []
        prevLocations.current = []; prevPayments.current = []
        prevDailyExpenses.current = []
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadData() {
    if (loadingInProgress.current) return
    loadingInProgress.current = true
    setDataLoading(true)
    syncing.current = false
    try {
      const data = await db.fetchAll()
      // Set prev refs BEFORE setState so change-detection effects don't see a diff
      prevWorkers.current   = data.workers
      prevWorkDays.current  = data.workDays
      prevLocations.current = data.locations
      prevPayments.current  = data.paymentRecords
      prevDailyExpenses.current = data.dailyExpenses
      syncing.current = false
      setWorkers(data.workers)
      setWorkDays(data.workDays)
      setLocations(data.locations)
      setPaymentRecords(data.paymentRecords)
      setHolidays(data.holidays)
      setDailyExpenses(data.dailyExpenses)
      setSubscription(data.subscription)
      setIsAuthenticated(true)
    } catch {
      showToast('Erro ao carregar dados. Verifique sua conexão.', 'error')
    } finally {
      setDataLoading(false)
      loadingInProgress.current = false
      setTimeout(() => { syncing.current = true }, 200)
    }
  }

  // ── Realtime sync (updates from other tabs / users) ──────────────────────
  useEffect(() => {
    if (!isAuthenticated) return

    let refreshTimer = null

    const handleRemoteChange = () => {
      clearTimeout(refreshTimer)
      refreshTimer = setTimeout(async () => {
        if (loadingInProgress.current) return
        fromRealtime.current = true
        try {
          const data = await db.fetchAll()
          prevWorkers.current   = data.workers
          prevWorkDays.current  = data.workDays
          prevLocations.current = data.locations
          prevPayments.current  = data.paymentRecords
          prevDailyExpenses.current = data.dailyExpenses
          setWorkers(data.workers)
          setWorkDays(data.workDays)
          setLocations(data.locations)
          setPaymentRecords(data.paymentRecords)
          setHolidays(data.holidays)
          setDailyExpenses(data.dailyExpenses)
          setSubscription(data.subscription)
        } catch {
          // silently ignore realtime refresh errors
        } finally {
          setTimeout(() => { fromRealtime.current = false }, 100)
        }
      }, 600)
    }

    const channel = supabase
      .channel('db-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' },         handleRemoteChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_days' },       handleRemoteChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' },       handleRemoteChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_records' }, handleRemoteChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_expenses' },  handleRemoteChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' },   handleRemoteChange)
      .subscribe()

    return () => { supabase.removeChannel(channel); clearTimeout(refreshTimer) }
  }, [isAuthenticated])

  // ── Keep module-level logger in sync with current user ──────────────────
  useEffect(() => { setLogUser(currentUser) }, [currentUser])

  // ── Theme ────────────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('theme', theme)
    if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light')
    else document.documentElement.removeAttribute('data-theme')
  }, [theme])

  useEffect(() => { if (!isMobile) setSidebarOpen(false) }, [isMobile])

  // ── Individual CRUD sync effects ────────────────────────────────────────
  useEffect(() => {
    if (!syncing.current || fromRealtime.current) { prevWorkers.current = workers; return }
    const oldWorkers = prevWorkers.current
    const { toUpsert, toDelete } = diff(oldWorkers, workers)
    prevWorkers.current = workers
    if (toUpsert.length) {
      db.upsertWorkers(toUpsert).catch(() => showToast('Erro ao salvar diaristas.', 'error'))
      const isNew = id => !oldWorkers.find(p => p.id === id)
      toUpsert.forEach(w => log(
        isNew(w.id) ? 'add_worker' : 'edit_worker',
        isNew(w.id) ? `Diarista adicionado: ${w.name}` : `Diarista editado: ${w.name}`
      ))
    }
    if (toDelete.length) {
      db.deleteWorkers(toDelete).catch(() => showToast('Erro ao salvar diaristas.', 'error'))
      toDelete.forEach(id => {
        const w = oldWorkers.find(p => p.id === id)
        log('delete_worker', `Diarista removido: ${w?.name ?? id}`)
      })
    }
  }, [workers])

  useEffect(() => {
    if (!syncing.current || fromRealtime.current) { prevWorkDays.current = workDays; return }
    const oldWorkDays = prevWorkDays.current
    const { toUpsert, toDelete } = diff(oldWorkDays, workDays)
    prevWorkDays.current = workDays
    if (toUpsert.length) {
      db.upsertWorkDays(toUpsert).catch(() => showToast('Erro ao salvar dias de trabalho.', 'error'))
      toUpsert.forEach(d => {
        const workerName = workers.find(w => w.id === d.workerId)?.name ?? 'Diarista desconhecido'
        log('add_workday', `Dia registrado: ${workerName} — ${d.date}`)
      })
    }
    if (toDelete.length) {
      db.deleteWorkDays(toDelete).catch(() => showToast('Erro ao salvar dias de trabalho.', 'error'))
      toDelete.forEach(id => {
        const wd = oldWorkDays.find(d => d.id === id)
        const workerName = workers.find(w => w.id === wd?.workerId)?.name ?? 'Diarista desconhecido'
        const date = wd?.date ?? ''
        log('delete_workday', `Dia de trabalho removido: ${workerName}${date ? ` — ${date}` : ''}`)
      })
    }
  }, [workDays])

  useEffect(() => {
    if (!syncing.current || fromRealtime.current) { prevLocations.current = locations; return }
    const oldLocations = prevLocations.current
    const { toUpsert, toDelete } = diff(oldLocations, locations)
    prevLocations.current = locations
    if (toUpsert.length) {
      db.upsertLocations(toUpsert).catch(() => showToast('Erro ao salvar locais.', 'error'))
      toUpsert.forEach(l => {
        const isNew = !oldLocations.find(ol => ol.id === l.id)
        log(isNew ? 'add_location' : 'edit_location',
            isNew ? `Local adicionado: ${l.name} (${l.city ?? ''})` : `Local editado: ${l.name}`)
      })
    }
    if (toDelete.length) {
      db.deleteLocations(toDelete).catch(() => showToast('Erro ao salvar locais.', 'error'))
      toDelete.forEach(id => {
        const l = oldLocations.find(ol => ol.id === id)
        log('delete_location', `Local removido: ${l?.name ?? id}`)
      })
    }
  }, [locations])

  useEffect(() => {
    if (!syncing.current || fromRealtime.current) { prevPayments.current = paymentRecords; return }
    const oldPayments = prevPayments.current
    const { toUpsert, toDelete } = diff(oldPayments, paymentRecords)
    prevPayments.current = paymentRecords
    if (toUpsert.length) {
      db.upsertPaymentRecords(toUpsert).catch(() => showToast('Erro ao salvar pagamentos.', 'error'))
      toUpsert.forEach(p => {
        const workerName = workers.find(w => w.id === p.workerId)?.name ?? 'Diarista'
        const total = (p.total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        log('add_payment', `Pagamento confirmado: ${workerName} — R$ ${total}`)
      })
    }
    if (toDelete.length) {
      db.deletePaymentRecords(toDelete).catch(() => showToast('Erro ao salvar pagamentos.', 'error'))
      toDelete.forEach(id => {
        const p = oldPayments.find(op => op.id === id)
        const workerName = workers.find(w => w.id === p?.workerId)?.name ?? 'Diarista'
        log('edit_payment', `Pagamento desfeito: ${workerName}`)
      })
    }
  }, [paymentRecords])

  useEffect(() => {
    if (!syncing.current || fromRealtime.current) { prevDailyExpenses.current = dailyExpenses; return }
    const { toUpsert, toDelete } = diff(prevDailyExpenses.current, dailyExpenses)
    prevDailyExpenses.current = dailyExpenses
    if (toUpsert.length) {
      db.upsertDailyExpenses(toUpsert).catch(() => showToast('Erro ao salvar gastos diários.', 'error'))
      toUpsert.forEach(e => log(
        e.id === 'default' ? 'edit_meal_prices' : 'edit_daily_expense',
        e.id === 'default'
          ? 'Preços padrão de refeição atualizados'
          : `Gastos do dia ajustados: ${e.date}`
      ))
    }
    if (toDelete.length) {
      db.deleteDailyExpenses(toDelete).catch(() => showToast('Erro ao salvar gastos diários.', 'error'))
      toDelete.forEach(id => log('edit_daily_expense', `Gastos do dia voltaram ao padrão: ${id}`))
    }
  }, [dailyExpenses])

  useEffect(() => {
    if (!syncing.current || fromRealtime.current) { prevHolidays.current = holidays; return }
    const added   = holidays.filter(d => !prevHolidays.current.includes(d))
    const removed = prevHolidays.current.filter(d => !holidays.includes(d))
    prevHolidays.current = holidays
    db.syncHolidays(holidays).catch(() => showToast('Erro ao salvar feriados.', 'error'))
    added.forEach(d   => log('add_holiday',    `Feriado adicionado: ${d}`))
    removed.forEach(d => log('remove_holiday', `Feriado removido: ${d}`))
  }, [holidays])

  const handleLogout = async () => {
    await log('logout', `Logout: ${currentUser?.email ?? ''}`)
    await supabase.auth.signOut()
  }
  const PageComponent = PAGES[activePage] || Dashboard

  return (
    <>
      <AnimatePresence mode="wait">
        {authChecking ? (
          <LoadingScreen key="loading" />
        ) : passwordRecovery ? (
          <motion.div key="recovery" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ minHeight: '100vh', backgroundColor: 'var(--app-bg)' }}>
            <ChangePasswordModal theme={theme} onClose={() => {
              inPasswordRecovery.current = false
              setPasswordRecovery(false)
              supabase.auth.signOut()
            }} />
          </motion.div>
        ) : isInvite ? (
          <motion.div key="invite" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SignUpScreen
              mode="invite"
              theme={theme} setTheme={setTheme}
              currentUser={currentUser}
              onDone={() => {
                localStorage.removeItem('diaria_invite_pending')
                window.location.hash = ''
                setDataLoading(true)
                setIsInvite(false)
                loadData()
              }}
            />
          </motion.div>
        ) : dataLoading ? (
          <LoadingScreen key="loading" />
        ) : !isAuthenticated ? (
          <motion.div key={authPage} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)', transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }}
          >
            {authPage === 'signup' ? (
              <SignUpScreen
                theme={theme} setTheme={setTheme}
                onLogin={() => setAuthPage('login')}
              />
            ) : (
              <LoginScreen
                theme={theme} setTheme={setTheme}
                onSignUp={() => setAuthPage('signup')}
              />
            )}
          </motion.div>
        ) : (
          <motion.div key="app" initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
            style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--app-bg)' }}
          >
            <Sidebar
              activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout}
              theme={theme} setTheme={setTheme} lang={lang} setLang={setLang}
              holidays={holidays} setHolidays={setHolidays}
              isMobile={isMobile} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
              currentUser={currentUser} onUpgrade={() => setShowPlans(true)}
              workers={workers} workDays={workDays} paymentRecords={paymentRecords}
            />

            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
              <div className="orb" style={{ position: 'absolute', width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', top: -200, left: -200, animationDelay: '0s' }} />
              <div className="orb" style={{ position: 'absolute', width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', top: '40%', right: -150, animationDelay: '3s' }} />
              <div className="orb" style={{ position: 'absolute', width: 400, height: 400, background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)', bottom: -100, left: '30%', animationDelay: '5s' }} />
            </div>

            <main style={{ flex: 1, marginLeft: isMobile ? 0 : 260, minHeight: '100vh', position: 'relative', zIndex: 1, overflowX: 'hidden' }}>
              {isMobile && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <button onClick={() => setSidebarOpen(true)} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <Menu size={18} color="rgba(255,255,255,0.7)" />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(99,102,241,0.4)' }}>
                      <Zap size={14} color="white" fill="white" />
                    </div>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: '#f1f5f9', letterSpacing: '-0.02em' }}>Diária Pro</span>
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div key={activePage} variants={pageVariants} initial="initial" animate="animate" exit="exit"
                  style={{ minHeight: isMobile ? 'calc(100vh - 61px)' : '100vh', padding: isMobile ? '81px 16px 20px' : '32px 40px' }}
                >
                  <PageComponent
                    lang={lang} theme={theme} onNavigate={setActivePage}
                    selectedWorker={selectedWorker} setSelectedWorker={setSelectedWorker}
                    workers={workers} setWorkers={setWorkers}
                    workDays={workDays} setWorkDays={setWorkDays}
                    locations={locations} setLocations={setLocations}
                    paymentRecords={paymentRecords} setPaymentRecords={setPaymentRecords}
                    holidays={holidays} setHolidays={setHolidays}
                    dailyExpenses={dailyExpenses} setDailyExpenses={setDailyExpenses}
                    currentUser={currentUser}
                    subscription={subscription} onUpgrade={() => setShowPlans(true)}
                  />
                </motion.div>
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Planos / upgrade (fonte única do checkout) ── */}
      <AnimatePresence>
        {showPlans && (
          <PlansModal
            onClose={() => setShowPlans(false)}
            theme={theme}
            lang={lang}
            currentPlan={subscription?.status === 'active' ? (subscription?.plan ?? null) : null}
            onSelectPlan={async (planId, cycle) => {
              try {
                showToast('Gerando link de pagamento...', 'info')
                const { data, error } = await supabase.functions.invoke('create-checkout', { body: { planId, cycle } })
                if (error) {
                  // supabase-js esconde o corpo da resposta em error.context (Response) — extrai a msg real.
                  let detail = error.message
                  try { const b = await error.context?.json?.(); if (b?.error) detail = b.error } catch { /* ignore */ }
                  throw new Error(detail)
                }
                if (data?.url) {
                  window.location.href = data.url   // redireciona pro checkout do Asaas
                } else {
                  showToast('Não foi possível iniciar o checkout. Tente novamente.', 'error')
                }
              } catch (e) {
                showToast(`Erro ao iniciar o checkout: ${e?.message ?? e}`, 'error')
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Idle warning modal ── */}
      <AnimatePresence>
        {showIdleWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              style={{
                background: theme === 'light'
                  ? 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
                  : 'linear-gradient(135deg, #131325, #0f0f1e)',
                border: theme === 'light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: '32px 36px', maxWidth: 360, width: '90%', textAlign: 'center',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>⏱️</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: theme === 'light' ? '#1e293b' : '#f1f5f9', marginBottom: 8 }}>
                Ainda está aí?
              </div>
              <div style={{ fontSize: 13, color: theme === 'light' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)', marginBottom: 24, lineHeight: 1.6 }}>
                Você será deslogado em <strong>1 minuto</strong> por inatividade.
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowIdleWarning(false)}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                }}
              >
                Continuar sessão
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Aviso de nova versão publicada ── */}
      <AnimatePresence>
        {updateAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10000, display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 20px', borderRadius: 16, maxWidth: 'calc(100vw - 32px)',
              background: theme === 'light'
                ? 'linear-gradient(135deg, #ffffff, #f1f5f9)'
                : 'linear-gradient(135deg, #1a1a30, #131325)',
              border: '1px solid rgba(99,102,241,0.35)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.35), 0 0 0 4px rgba(99,102,241,0.08)',
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
            }}>
              <RefreshCw size={17} color="#fff" />
            </div>
            <span style={{
              fontSize: 14, fontWeight: 600,
              color: theme === 'light' ? '#1e293b' : '#f1f5f9', whiteSpace: 'nowrap',
            }}>
              {(i18n[lang] ?? i18n.pt).updateAvailableMsg}
            </span>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => window.location.reload()}
              style={{
                padding: '9px 18px', borderRadius: 11, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)', flexShrink: 0,
              }}
            >
              {(i18n[lang] ?? i18n.pt).updateReloadBtn}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
