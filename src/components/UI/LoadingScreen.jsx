import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

function Pulse({ width, height, style = {} }) {
  return (
    <motion.div
      animate={{ opacity: [0.35, 0.65, 0.35] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width, height, borderRadius: 8, background: 'rgba(255,255,255,0.06)', ...style }}
    />
  )
}

export default function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: '#07070f',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Sidebar skeleton */}
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{
          width: 260, borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <motion.div
              animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 20px rgba(99,102,241,0.3)', '0 0 40px rgba(99,102,241,0.5)', '0 0 20px rgba(99,102,241,0.3)'] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Zap size={18} color="white" fill="white" />
            </motion.div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Pulse width={80} height={12} />
              <Pulse width={56} height={8} />
            </div>
          </div>
          {/* Nav items */}
          {[1,2,3,4,5,6].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 0.55, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
              style={{
                height: 40, borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
              }}
            />
          ))}
        </div>

        {/* Main content skeleton */}
        <div style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Page header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Pulse width={180} height={22} />
            <Pulse width={280} height={13} />
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[1,2,3,4].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 0.55, 0.3] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
                style={{
                  height: 96, borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              />
            ))}
          </div>

          {/* Chart area */}
          <motion.div
            animate={{ opacity: [0.3, 0.55, 0.3] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            style={{
              flex: 1, maxHeight: 220, borderRadius: 18,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          />
        </div>
      </div>

      {/* Bottom label */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}
        >
          Carregando seus dados...
        </motion.div>
      </div>
    </motion.div>
  )
}
