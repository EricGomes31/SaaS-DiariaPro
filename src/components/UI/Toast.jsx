import { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  error:   <AlertCircle  size={16} color="#fb7185" style={{ flexShrink: 0, marginTop: 1 }} />,
  success: <CheckCircle  size={16} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />,
  info:    <Info         size={16} color="#818cf8" style={{ flexShrink: 0, marginTop: 1 }} />,
}

const COLORS = {
  error:   { bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.2)',   text: '#fb7185' },
  success: { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  text: '#34d399' },
  info:    { bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.2)',  text: '#818cf8' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
  }, [])

  const dismiss = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
      }}>
        <AnimatePresence>
          {toasts.map(t => {
            const c = COLORS[t.type] ?? COLORS.error
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 60, scale: 0.94 }}
                animate={{ opacity: 1, x: 0,  scale: 1    }}
                exit={{    opacity: 0, x: 60, scale: 0.94 }}
                transition={{ duration: 0.22 }}
                style={{
                  pointerEvents: 'all',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '13px 14px', borderRadius: 13, maxWidth: 320,
                  background: c.bg, border: `1px solid ${c.border}`,
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                }}
              >
                {ICONS[t.type]}
                <span style={{ fontSize: 13, fontWeight: 500, color: c.text, flex: 1, lineHeight: 1.45 }}>
                  {t.message}
                </span>
                <button
                  onClick={() => dismiss(t.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}
                >
                  <X size={13} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
