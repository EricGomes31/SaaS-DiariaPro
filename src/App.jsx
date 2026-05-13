import { useState, useEffect } from 'react'
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
import { useIsMobile } from './hooks/useIsMobile'
import { loadWorkers, saveWorkers, loadWorkDays, saveWorkDays, loadLocations, saveLocations, loadPaymentRecords, savePaymentRecords, loadHolidays, saveHolidays } from './data/storage'

const PAGES = {
  dashboard: Dashboard,
  workers: WorkerList,
  tracking: WorkCalendar,
  payments: PaymentView,
  locations: LocationManager,
  reports: Reports,
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [theme, setTheme] = useState('dark')
  const [lang, setLang] = useState('pt')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  const [workers,        setWorkers]        = useState(loadWorkers)
  const [workDays,       setWorkDays]       = useState(loadWorkDays)
  const [locations,      setLocations]      = useState(loadLocations)
  const [paymentRecords, setPaymentRecords] = useState(loadPaymentRecords)
  const [holidays,       setHolidays]       = useState(loadHolidays)

  useEffect(() => { saveWorkers(workers) },               [workers])
  useEffect(() => { saveWorkDays(workDays) },             [workDays])
  useEffect(() => { saveLocations(locations) },           [locations])
  useEffect(() => { savePaymentRecords(paymentRecords) }, [paymentRecords])
  useEffect(() => { saveHolidays(holidays) },             [holidays])

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  // Close sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile) setSidebarOpen(false)
  }, [isMobile])

  const PageComponent = PAGES[activePage] || Dashboard

  return (
    <>
      {/* Sidebar lives outside any motion wrapper so position:fixed is always relative to the viewport */}
      {isAuthenticated && (
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          onLogout={() => setIsAuthenticated(false)}
          theme={theme}
          setTheme={setTheme}
          lang={lang}
          setLang={setLang}
          holidays={holidays}
          setHolidays={setHolidays}
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      )}

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="login"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)', transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }}
          >
            <LoginScreen onLogin={() => setIsAuthenticated(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
            style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--app-bg)' }}
          >
            {/* Ambient background orbs */}
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
              <div className="orb" style={{
                position: 'absolute', width: 600, height: 600,
                background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                top: -200, left: -200, animationDelay: '0s',
              }} />
              <div className="orb" style={{
                position: 'absolute', width: 500, height: 500,
                background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
                top: '40%', right: -150, animationDelay: '3s',
              }} />
              <div className="orb" style={{
                position: 'absolute', width: 400, height: 400,
                background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
                bottom: -100, left: '30%', animationDelay: '5s',
              }} />
            </div>

            <main style={{
              flex: 1,
              marginLeft: isMobile ? 0 : 260,
              minHeight: '100vh',
              position: 'relative',
              zIndex: 1,
              overflowX: 'hidden',
            }}>
              {/* Mobile top bar */}
              {isMobile && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                  background: 'rgba(10,10,20,0.95)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  padding: '12px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <button
                    onClick={() => setSidebarOpen(true)}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <Menu size={18} color="rgba(255,255,255,0.7)" />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 10px rgba(99,102,241,0.4)',
                    }}>
                      <Zap size={14} color="white" fill="white" />
                    </div>
                    <span style={{
                      fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16,
                      color: '#f1f5f9', letterSpacing: '-0.02em',
                    }}>
                      Diária Pro
                    </span>
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activePage}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    minHeight: isMobile ? 'calc(100vh - 61px)' : '100vh',
                    padding: isMobile ? '81px 16px 20px' : '32px 40px',
                  }}
                >
                  <PageComponent
                    lang={lang}
                    onNavigate={setActivePage}
                    selectedWorker={selectedWorker}
                    setSelectedWorker={setSelectedWorker}
                    workers={workers}
                    setWorkers={setWorkers}
                    workDays={workDays}
                    setWorkDays={setWorkDays}
                    locations={locations}
                    setLocations={setLocations}
                    paymentRecords={paymentRecords}
                    setPaymentRecords={setPaymentRecords}
                    holidays={holidays}
                    setHolidays={setHolidays}
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
