import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Eye, EyeOff, ArrowRight, Lock, Users, BarChart3, Shield, User } from 'lucide-react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'

const FEATURES = [
  { icon: Users,     text: 'Gestão completa de diaristas' },
  { icon: BarChart3, text: 'Relatórios e pagamentos em tempo real' },
  { icon: Shield,    text: 'Controle de múltiplos galpões' },
]

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

export default function InviteSetPassword({ onDone, currentUser }) {
  const isMobile = useIsMobile()
  const [fullName,      setFullName]      = useState('')
  const [pwd,           setPwd]           = useState('')
  const [confirm,       setConfirm]       = useState('')
  const [show,          setShow]          = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [focusedField,  setFocusedField]  = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) return setError('Digite seu nome completo.')
    if (pwd.length < 6)   return setError('A senha deve ter pelo menos 6 caracteres.')
    if (pwd !== confirm)  return setError('As senhas não coincidem.')

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({
      password: pwd,
      data: { name: fullName.trim(), invite_pending: false },
    })
    setLoading(false)
    if (err) return setError(err.message)
    onDone()
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      backgroundColor: '#07070f', position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient orbs */}
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

      {/* Grid texture */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Left brand panel — desktop only */}
      {!isMobile && (
        <motion.div
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
                Bem-vindo à equipe!
              </div>

              <h1 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 'clamp(2.4rem, 3.5vw, 3.2rem)',
                fontWeight: 800, color: '#f1f5f9',
                margin: '0 0 20px', letterSpacing: '-0.03em', lineHeight: 1.1,
              }}>
                Configure{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  seu acesso<br />ao sistema.
                </span>
              </h1>
              <p style={{
                fontSize: 16, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65,
                margin: 0, maxWidth: 360,
              }}>
                Defina seu nome e crie uma senha segura para acessar o painel completo.
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', lineHeight: 1.6 }}
          >
            © 2025 Diária Pro. Todos os direitos reservados.
          </motion.div>
        </motion.div>
      )}

      {/* Right panel — form */}
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
                  boxShadow: '0 4px 16px rgba(99,102,241,0.4)', flexShrink: 0,
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

            {/* Header */}
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
                Crie sua senha
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>
                {currentUser?.email
                  ? `Bem-vindo! Configure o acesso para ${currentUser.email}`
                  : 'Defina seu nome e uma senha para acessar o painel'}
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit}>

              {/* Nome completo */}
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
                  Nome completo
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="rgba(255,255,255,0.25)" style={{
                    position: 'absolute', left: 14, top: '50%',
                    transform: 'translateY(-50%)', pointerEvents: 'none',
                  }} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); setError('') }}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    style={{
                      width: '100%', padding: '14px 16px 14px 38px',
                      borderRadius: 13, fontSize: 15, boxSizing: 'border-box',
                      background: focusedField === 'name' ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.1)',
                      border: `1.5px solid ${focusedField === 'name' ? '#818cf8' : 'rgba(255,255,255,0.25)'}`,
                      color: '#f1f5f9', outline: 'none',
                      boxShadow: focusedField === 'name' ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </div>
              </motion.div>

              {/* Nova senha */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.46, duration: 0.4 }}
                style={{ marginBottom: 14 }}
              >
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)', marginBottom: 8,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  Nova senha
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={show ? 'text' : 'password'}
                    value={pwd}
                    onChange={e => { setPwd(e.target.value); setError('') }}
                    onFocus={() => setFocusedField('pwd')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    style={{
                      width: '100%', padding: '14px 46px 14px 16px',
                      borderRadius: 13, fontSize: 15, boxSizing: 'border-box',
                      background: focusedField === 'pwd' ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.1)',
                      border: `1.5px solid ${focusedField === 'pwd' ? '#818cf8' : 'rgba(255,255,255,0.25)'}`,
                      color: '#f1f5f9', outline: 'none',
                      boxShadow: focusedField === 'pwd' ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center',
                      transition: 'color 0.2s', padding: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </motion.div>

              {/* Confirmar senha */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52, duration: 0.4 }}
                style={{ marginBottom: 10 }}
              >
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)', marginBottom: 8,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  Confirmar senha
                </label>
                <input
                  type={show ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError('') }}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  style={{
                    width: '100%', padding: '14px 16px',
                    borderRadius: 13, fontSize: 15, boxSizing: 'border-box',
                    background: focusedField === 'confirm' ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.1)',
                    border: `1.5px solid ${focusedField === 'confirm' ? '#818cf8' : 'rgba(255,255,255,0.25)'}`,
                    color: '#f1f5f9', outline: 'none',
                    boxShadow: focusedField === 'confirm' ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
              </motion.div>

              {/* Error */}
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

              {/* Submit */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.58, duration: 0.4 }}
                style={{ marginTop: 22 }}
              >
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02, boxShadow: '0 12px 32px rgba(99,102,241,0.45)' } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  style={{
                    width: '100%', padding: '15px',
                    borderRadius: 13, fontSize: 15, fontWeight: 700,
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading
                      ? 'rgba(99,102,241,0.4)'
                      : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: loading ? 'none' : '0 6px 20px rgba(99,102,241,0.35)',
                    transition: 'background 0.3s, box-shadow 0.3s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <LoadingSpinner />
                        Salvando...
                      </motion.span>
                    ) : (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        Entrar no sistema
                        <ArrowRight size={16} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            </form>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.4 }}
            style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}
          >
            © 2025 Diária Pro. Todos os direitos reservados.
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
