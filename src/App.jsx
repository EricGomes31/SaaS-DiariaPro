import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Zap } from 'lucide-react'
import Sidebar from './components/Layout/Sidebar'
import Dashboard from './components/Dashboard/Dashboard'
import WorkerList from './components/Workers/WorkerList'
import WorkCalendar from './components/Tracking/WorkCalendar'
import PaymentView from './components/Payments/PaymentView'
import LocationManager from './components/Locations/LocationManager'
import Reports from './components/Reports/Reports'
import LoginScreen from './components/Auth/LoginScreen'
import LoadingScreen from './components/UI/LoadingScreen'
import ChangePasswordModal from './components/Auth/ChangePasswordModal'
import { useIsMobile } from './hooks/useIsMobile'
import { supabase } from './lib/supabase'
import * as db from './lib/db'
import { useToast } from './components/UI/Toast'

const PAGES = {
  dashboard: Dashboard, workers: WorkerList, tracking: WorkCalendar,
  payments: PaymentView, locations: LocationManager, reports: Reports,
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

// ─── Change detection helper ────────────────────────────────────────────────
function diff(prev, curr) {
  const toUpsert = curr.filter(item => {
    const old = prev.find(p => p.id === item.id)
    return !old || JSON.stringify(old) !== JSON.stringify(item)
  })
  const currIds = new Set(curr.map(item => item.id))
  const toDelete = prev.filter(p => !currIds.has(p.id)).map(p => p.id)
  return { toUpsert, toDelete }
}

export default function App() {
  const { showToast } = useToast()

  // ── UI state ──────────────────────────────────────────────────────────────
  const [authChecking,     setAuthChecking]     = useState(true)
  const [isAuthenticated,  setIsAuthenticated]  = useState(false)
  const [dataLoading,      setDataLoading]       = useState(false)
  const [passwordRecovery, setPasswordRecovery]  = useState(false)
  const [activePage,       setActivePage]        = useState('dashboard')
  const [selectedWorker,   setSelectedWorker]    = useState(null)
  const [theme,            setTheme]             = useState('dark')
  const [lang,             setLang]              = useState('pt')
  const [sidebarOpen,      setSidebarOpen]       = useState(false)
  const isMobile = useIsMobile()

  // ── Data state ───────────────────────────────────────────────────────────
  const [workers,        setWorkers]        = useState([])
  const [workDays,       setWorkDays]       = useState([])
  const [locations,      setLocations]      = useState([])
  const [paymentRecords, setPaymentRecords] = useState([])
  const [holidays,       setHolidays]       = useState([])

  // ── Sync control refs ────────────────────────────────────────────────────
  const syncing           = useRef(false)   // false while loading from DB
  const loadingInProgress = useRef(false)   // prevents double loadData calls
  const fromRealtime      = useRef(false)   // prevents sync loop on realtime updates

  // Previous state refs for individual CRUD change detection
  const prevWorkers   = useRef([])
  const prevWorkDays  = useRef([])
  const prevLocations = useRef([])
  const prevPayments  = useRef([])

  // ── Auth setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Restore session on page reload
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthChecking(false)
      if (session) loadData()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { setPasswordRecovery(true); return }
      if (event === 'SIGNED_IN'  && session) loadData()
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
        syncing.current = false
        setWorkers([]); setWorkDays([]); setLocations([])
        setPaymentRecords([]); setHolidays([])
        prevWorkers.current = []; prevWorkDays.current = []
        prevLocations.current = []; prevPayments.current = []
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
      syncing.current = false
      setWorkers(data.workers)
      setWorkDays(data.workDays)
      setLocations(data.locations)
      setPaymentRecords(data.paymentRecords)
      setHolidays(data.holidays)
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
          setWorkers(data.workers)
          setWorkDays(data.workDays)
          setLocations(data.locations)
          setPaymentRecords(data.paymentRecords)
          setHolidays(data.holidays)
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
      .subscribe()

    return () => { supabase.removeChannel(channel); clearTimeout(refreshTimer) }
  }, [isAuthenticated])

  // ── Theme ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light')
    else document.documentElement.removeAttribute('data-theme')
  }, [theme])

  useEffect(() => { if (!isMobile) setSidebarOpen(false) }, [isMobile])

  // ── Individual CRUD sync effects ────────────────────────────────────────
  useEffect(() => {
    if (!syncing.current || fromRealtime.current) { prevWorkers.current = workers; return }
    const { toUpsert, toDelete } = diff(prevWorkers.current, workers)
    prevWorkers.current = workers
    if (toUpsert.length) db.upsertWorkers(toUpsert).catch(() => showToast('Erro ao salvar diaristas.', 'error'))
    if (toDelete.length) db.deleteWorkers(toDelete).catch(() => showToast('Erro ao salvar diaristas.', 'error'))
  }, [workers])

  useEffect(() => {
    if (!syncing.current || fromRealtime.current) { prevWorkDays.current = workDays; return }
    const { toUpsert, toDelete } = diff(prevWorkDays.current, workDays)
    prevWorkDays.current = workDays
    if (toUpsert.length) db.upsertWorkDays(toUpsert).catch(() => showToast('Erro ao salvar dias de trabalho.', 'error'))
    if (toDelete.length) db.deleteWorkDays(toDelete).catch(() => showToast('Erro ao salvar dias de trabalho.', 'error'))
  }, [workDays])

  useEffect(() => {
    if (!syncing.current || fromRealtime.current) { prevLocations.current = locations; return }
    const { toUpsert, toDelete } = diff(prevLocations.current, locations)
    prevLocations.current = locations
    if (toUpsert.length) db.upsertLocations(toUpsert).catch(() => showToast('Erro ao salvar locais.', 'error'))
    if (toDelete.length) db.deleteLocations(toDelete).catch(() => showToast('Erro ao salvar locais.', 'error'))
  }, [locations])

  useEffect(() => {
    if (!syncing.current || fromRealtime.current) { prevPayments.current = paymentRecords; return }
    const { toUpsert, toDelete } = diff(prevPayments.current, paymentRecords)
    prevPayments.current = paymentRecords
    if (toUpsert.length) db.upsertPaymentRecords(toUpsert).catch(() => showToast('Erro ao salvar pagamentos.', 'error'))
    if (toDelete.length) db.deletePaymentRecords(toDelete).catch(() => showToast('Erro ao salvar pagamentos.', 'error'))
  }, [paymentRecords])

  useEffect(() => {
    if (!syncing.current || fromRealtime.current) return
    db.syncHolidays(holidays).catch(() => showToast('Erro ao salvar feriados.', 'error'))
  }, [holidays])

  const handleLogout = async () => { await supabase.auth.signOut() }
  const PageComponent = PAGES[activePage] || Dashboard

  return (
    <>
      {passwordRecovery && <ChangePasswordModal onClose={() => setPasswordRecovery(false)} />}

      <AnimatePresence mode="wait">
        {authChecking || dataLoading ? (
          <LoadingScreen key="loading" />
        ) : !isAuthenticated ? (
          <motion.div key="login" initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)', transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }}
          >
            <LoginScreen />
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
                    lang={lang} onNavigate={setActivePage}
                    selectedWorker={selectedWorker} setSelectedWorker={setSelectedWorker}
                    workers={workers} setWorkers={setWorkers}
                    workDays={workDays} setWorkDays={setWorkDays}
                    locations={locations} setLocations={setLocations}
                    paymentRecords={paymentRecords} setPaymentRecords={setPaymentRecords}
                    holidays={holidays} setHolidays={setHolidays}
                  />
                </motion.div>
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
