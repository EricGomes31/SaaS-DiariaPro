import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Eye, EyeOff, ArrowRight, Shield, Users, BarChart3, Lock } from 'lucide-react'
import { useIsMobile } from '../../hooks/useIsMobile'

const FEATURES = [
  { icon: Users, text: 'Gestão completa de diaristas' },
  { icon: BarChart3, text: 'Relatórios e pagamentos em tempo real' },
  { icon: Shield, text: 'Controle de múltiplos galpões' },
]

const DEMO_EMAIL = 'admin@diariapro.com'
const DEMO_PASSWORD = 'admin123'

export default function LoginScreen({ onLogin }) {
  const isMobile = useIsMobile()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Preencha todos os campos.')
      return
    }

    setIsLoading(true)

    await new Promise(r => setTimeout(r, 1400))

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      onLogin()
    } else {
      setIsLoading(false)
      setError('E-mail ou senha incorretos. Use as credenciais de demonstração.')
    }
  }

  const fillDemo = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError('')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      backgroundColor: '#07070f', position: 'relative', overflow: 'hidden',
    }}>
      {/* ── Ambient background orbs ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div className="orb" style={{
          position: 'absolute', width: 700, height: 700,
          background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 65%)',
          top: -250, left: -200, animationDelay: '0s',
        }} />
        <div className="orb" style={{
          position: 'absolute', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)',
          bottom: -150, right: -100, animationDelay: '4s',
        }} />
        <div className="orb" style={{
          position: 'absolute', width: 350, height: 350,
          background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)',
          top: '55%', left: '38%', animationDelay: '7s',
        }} />
      </div>

      {/* ── Fine grid texture ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* ════════════════════════════
          LEFT PANEL — Brand panel (desktop only)
      ════════════════════════════ */}
      {!isMobile && <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        style={{
          width: '44%', minHeight: '100vh', position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '48px 56px',
          borderRight: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
          }}>
            <Zap size={20} color="white" fill="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              Diária Pro
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Gestão de Diaristas
            </div>
          </div>
        </motion.div>

        {/* Hero text */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '5px 14px', borderRadius: 100, marginBottom: 28,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
              fontSize: 12, fontWeight: 600, color: '#818cf8', letterSpacing: '0.05em',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Plataforma online
            </div>

            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 'clamp(2.4rem, 3.5vw, 3.2rem)',
              fontWeight: 800, color: '#f1f5f9',
              margin: '0 0 20px', letterSpacing: '-0.03em', lineHeight: 1.1,
            }}>
              Controle total{' '}
              <span style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                das suas<br />equipes diárias.
              </span>
            </h1>
            <p style={{
              fontSize: 16, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65,
              margin: 0, maxWidth: 360,
            }}>
              Gerencie diaristas, controle jornadas, visualize pagamentos por turno e gere relatórios instantâneos.
            </p>
          </motion.div>

          {/* Feature list */}
          <div style={{ marginTop: 44 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.1, duration: 0.5 }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={16} color="#818cf8" />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                  {f.text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', lineHeight: 1.6 }}
        >
          © 2025 Diária Pro. Todos os direitos reservados.
        </motion.div>
      </motion.div>}

      {/* ════════════════════════════
          RIGHT PANEL — Login form
      ════════════════════════════ */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1,
        padding: isMobile ? '24px 16px' : '40px 48px',
        minHeight: '100vh',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Card */}
          <div style={{
            background: 'rgba(17,17,34,0.85)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 24, padding: isMobile ? '28px 24px' : '40px',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Top accent line */}
            <div style={{
              position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.6), transparent)',
            }} />

            {/* Mobile logo */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                  flexShrink: 0,
                }}>
                  <Zap size={16} color="white" fill="white" />
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                    Diária Pro
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Gestão de Diaristas
                  </div>
                </div>
              </motion.div>
            )}

            {/* Card header */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.45 }}
              style={{ marginBottom: isMobile ? 24 : 36 }}
            >
              <h2 style={{
                fontFamily: 'Syne, sans-serif', fontSize: isMobile ? 22 : 26, fontWeight: 800,
                color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.025em',
              }}>
                Bem-vindo de volta
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>
                Acesse o painel com suas credenciais
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Email field */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                style={{ marginBottom: 14 }}
              >
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)', marginBottom: 8,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  E-mail
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className="input-premium"
                    style={{
                      width: '100%', padding: '14px 16px',
                      borderRadius: 13, fontSize: 15,
                      boxShadow: focusedField === 'email'
                        ? '0 0 0 3px rgba(99,102,241,0.15)'
                        : 'none',
                    }}
                  />
                </div>
              </motion.div>

              {/* Password field */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.46, duration: 0.4 }}
                style={{ marginBottom: 10 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{
                    fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    Senha
                  </label>
                  <button
                    type="button"
                    style={{
                      background: 'none', border: 'none', fontSize: 12,
                      color: '#818cf8', cursor: 'pointer', fontWeight: 600,
                      fontFamily: 'Inter, sans-serif', padding: 0,
                    }}
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="input-premium"
                    style={{
                      width: '100%', padding: '14px 46px 14px 16px',
                      borderRadius: 13, fontSize: 15,
                      boxShadow: focusedField === 'password'
                        ? '0 0 0 3px rgba(99,102,241,0.15)'
                        : 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center',
                      transition: 'color 0.2s', padding: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </motion.div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      padding: '10px 14px', borderRadius: 10, marginBottom: 14,
                      background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
                      fontSize: 13, color: '#fb7185', fontWeight: 500, lineHeight: 1.4,
                      overflow: 'hidden',
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52, duration: 0.4 }}
                style={{ marginTop: 22 }}
              >
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.02, boxShadow: '0 12px 32px rgba(99,102,241,0.45)' } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                  style={{
                    width: '100%', padding: '15px',
                    borderRadius: 13, fontSize: 15, fontWeight: 700,
                    border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                    background: isLoading
                      ? 'rgba(99,102,241,0.4)'
                      : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: isLoading ? 'none' : '0 6px 20px rgba(99,102,241,0.35)',
                    transition: 'background 0.3s, box-shadow 0.3s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                      >
                        <LoadingSpinner />
                        Entrando...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        Entrar no Painel
                        <ArrowRight size={16} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            </form>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.58, duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}
            >
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>ou</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </motion.div>

            {/* Demo access */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62, duration: 0.4 }}
            >
              <motion.button
                type="button"
                onClick={fillDemo}
                whileHover={{ scale: 1.02, borderColor: 'rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.07)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', padding: '13px',
                  borderRadius: 13, fontSize: 14, fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.55)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
                }}
              >
                <Lock size={14} style={{ opacity: 0.7 }} />
                Usar credenciais de demonstração
              </motion.button>

              {/* Credential hint */}
              <div style={{
                marginTop: 12, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 2 }}>E-mail</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    {DEMO_EMAIL}
                  </div>
                </div>
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.06)' }} />
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 2 }}>Senha</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    {DEMO_PASSWORD}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Below-card note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.4 }}
            style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}
          >
            Ao entrar, você concorda com os{' '}
            <span style={{ color: 'rgba(129,140,248,0.6)', cursor: 'pointer' }}>Termos de Uso</span>
            {' '}e{' '}
            <span style={{ color: 'rgba(129,140,248,0.6)', cursor: 'pointer' }}>Política de Privacidade</span>.
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}
      style={{
        width: 16, height: 16, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.2)',
        borderTopColor: 'white',
      }}
    />
  )
}
