import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Eye, EyeOff, Mail, Moon, Sun, User, Zap } from 'lucide-react'
import { useRef, useState } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import Captcha from './Captcha'

export default function SignUpScreen({ theme = 'dark', setTheme, onLogin, mode = 'signup', onDone, currentUser }) {
  const isMobile = useIsMobile()
  const isInvite = mode === 'invite'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState(null)
  const [done, setDone] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const captchaRef = useRef(null)

  const resetCaptcha = () => {
    captchaRef.current?.resetCaptcha()
    setCaptchaToken(null)
  }

  const isLight = theme === 'light'
  const c = {
    bg: isLight ? '#f1f5f9' : '#07070f',
    cardBg: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(17,17,34,0.85)',
    cardBorder: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.07)',
    cardShadow: isLight ? '0 32px 80px rgba(0,0,0,0.1)' : '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset',
    panelBorder: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.04)',
    text: isLight ? '#0f172a' : '#f1f5f9',
    sub: isLight ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.4)',
    subMid: isLight ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.35)',
    muted: isLight ? 'rgba(15,23,42,0.38)' : 'rgba(255,255,255,0.25)',
    dim: isLight ? 'rgba(15,23,42,0.22)' : 'rgba(255,255,255,0.18)',
    grid: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.015)',
    logoSub: isLight ? 'rgba(15,23,42,0.3)' : 'rgba(255,255,255,0.25)',
    footer: isLight ? 'rgba(15,23,42,0.25)' : 'rgba(255,255,255,0.18)',
    accentLine: isLight ? 'linear-gradient(90deg, transparent, rgba(99,102,241,0.35), transparent)' : 'linear-gradient(90deg, transparent, rgba(129,140,248,0.6), transparent)',
    toggleBg: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)',
    toggleBorder: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
    toggleColor: isLight ? '#64748b' : 'rgba(255,255,255,0.45)',
    inputBg: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
    inputBorder: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
    inputColor: isLight ? '#0f172a' : '#f1f5f9',
  }

  const inputStyle = field => ({
    width: '100%',
    padding: '13px 16px',
    borderRadius: 13,
    fontSize: 15,
    boxSizing: 'border-box',
    outline: 'none',
    background: focusedField === field ? (isLight ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.12)') : c.inputBg,
    border: `1.5px solid ${focusedField === field ? (isLight ? 'rgba(99,102,241,0.5)' : '#818cf8') : c.inputBorder}`,
    color: c.inputColor,
    boxShadow: focusedField === field ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
    transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
  })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) return setError('Digite seu nome completo.')
    if (!isInvite && !email) return setError('Digite seu e-mail.')
    if (password.length < 6) return setError('A senha deve ter pelo menos 6 caracteres.')
    if (password !== confirm) return setError('As senhas não coincidem.')
    if (!isInvite && !captchaToken) return setError('Confirme que você não é um robô.')

    setIsLoading(true)

    if (isInvite) {
      const { error: err } = await supabase.auth.updateUser({
        password,
        data: { name: fullName.trim(), invite_pending: false },
      })
      setIsLoading(false)
      if (err) {
        setError(err.message)
        return
      }
      onDone?.()
      return
    }

    const { error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/entrar',
        data: { name: fullName.trim() },
        captchaToken,
      },
    })
    setIsLoading(false)

    if (signUpErr) {
      resetCaptcha() // token é de uso único
      if (signUpErr.message.toLowerCase().includes('already registered')) {
        setError('Este e-mail já está cadastrado. Faça login.')
      } else {
        setError(signUpErr.message)
      }
      return
    }
    setDone(true)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: c.bg,
        position: 'relative',
        overflow: 'hidden',
        transition: 'background-color 0.3s',
      }}>
      {/* ── Theme toggle ── */}
      {setTheme && (
        <button
          onClick={() => setTheme(isLight ? 'dark' : 'light')}
          title={isLight ? 'Modo escuro' : 'Modo claro'}
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 100,
            width: 38,
            height: 38,
            borderRadius: 10,
            background: c.toggleBg,
            border: `1px solid ${c.toggleBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: c.toggleColor,
            backdropFilter: 'blur(8px)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = c.toggleBg
          }}>
          {isLight ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      )}

      {/* ── Ambient orbs ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}>
        <div
          className="orb"
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)',
            top: -200,
            left: -150,
            animationDelay: '0s',
          }}
        />
        <div
          className="orb"
          style={{
            position: 'absolute',
            width: 450,
            height: 450,
            background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)',
            bottom: -120,
            right: -80,
            animationDelay: '4s',
          }}
        />
        <div
          className="orb"
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
            top: '50%',
            left: '40%',
            animationDelay: '7s',
          }}
        />
      </div>

      {/* ── Grid texture ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: `linear-gradient(${c.grid} 1px, transparent 1px), linear-gradient(90deg, ${c.grid} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Left brand panel (desktop) ── */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          style={{
            width: '44%',
            minHeight: '100vh',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 56px',
            borderRight: c.panelBorder,
          }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
              }}>
              <Zap size={20} color="white" fill="white" />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: 20,
                  color: c.text,
                  letterSpacing: '-0.02em',
                }}>
                Diária Pro
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: c.logoSub,
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                Gestão de Diaristas
              </div>
            </div>
          </motion.div>

          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '5px 14px',
                  borderRadius: 100,
                  marginBottom: 28,
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#818cf8',
                  letterSpacing: '0.05em',
                }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'inline-block',
                  }}
                />
                {isInvite ? 'Bem-vindo à equipe!' : 'Grátis para começar'}
              </div>
              <h1
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 'clamp(2.2rem, 3.2vw, 3rem)',
                  fontWeight: 800,
                  color: c.text,
                  margin: '0 0 20px',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                }}>
                {isInvite ? <>Configure </> : <>Organize sua </>}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                  {isInvite ? 'seu acesso ao sistema.' : 'equipe de diaristas em minutos.'}
                </span>
              </h1>
              <p
                style={{
                  fontSize: 16,
                  color: c.subMid,
                  lineHeight: 1.65,
                  margin: 0,
                  maxWidth: 360,
                }}>
                {isInvite ? 'Defina seu nome e crie uma senha segura para acessar o painel completo.' : 'Cadastre-se e tenha controle total de jornadas, pagamentos e relatórios em um só lugar.'}
              </p>
            </motion.div>

            <div style={{ marginTop: 44 }}>
              {[
                {
                  emoji: '✅',
                  text: 'Cadastro gratuito, sem cartão de crédito',
                },
                { emoji: '⚡', text: 'Pronto para usar em menos de 2 minutos' },
                {
                  emoji: '🔒',
                  text: 'Seus dados seguros com criptografia total',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.1, duration: 0.5 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginBottom: 18,
                  }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.emoji}</span>
                  <span style={{ fontSize: 14, color: c.subMid, fontWeight: 500 }}>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }} style={{ fontSize: 12, color: c.footer, lineHeight: 1.6 }}>
            © 2025 Diária Pro. Todos os direitos reservados.
          </motion.div>
        </motion.div>
      )}

      {/* ── Right panel ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          padding: isMobile ? '24px 16px' : '40px 48px',
          minHeight: '100vh',
        }}>
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.2, duration: 0.6, ease: [0.4, 0, 0.2, 1] }} style={{ width: '100%', maxWidth: 420 }}>
          <div
            style={{
              background: c.cardBg,
              border: `1px solid ${c.cardBorder}`,
              borderRadius: 24,
              padding: isMobile ? '28px 24px' : '40px',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: c.cardShadow,
              position: 'relative',
              overflow: 'hidden',
              transition: 'background 0.3s, border-color 0.3s',
            }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: 1,
                background: c.accentLine,
              }}
            />

            {/* Mobile logo */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 28,
                }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                    flexShrink: 0,
                  }}>
                  <Zap size={16} color="white" fill="white" />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 800,
                      fontSize: 17,
                      color: c.text,
                      letterSpacing: '-0.02em',
                    }}>
                    Diária Pro
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: c.logoSub,
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}>
                    Gestão de Diaristas
                  </div>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {done ? (
                /* ── Sucesso: verificar e-mail ── */
                <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} style={{ textAlign: 'center', padding: '12px 0' }}>
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 18,
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}>
                    <CheckCircle size={30} color="#34d399" />
                  </motion.div>
                  <h2
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 22,
                      fontWeight: 800,
                      color: c.text,
                      margin: '0 0 10px',
                    }}>
                    Conta criada!
                  </h2>
                  <p
                    style={{
                      fontSize: 14,
                      color: c.subMid,
                      lineHeight: 1.65,
                      margin: '0 0 8px',
                    }}>
                    Enviamos um link de confirmação para
                  </p>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#818cf8',
                      margin: '0 0 24px',
                      wordBreak: 'break-all',
                    }}>
                    {email}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: c.muted,
                      lineHeight: 1.6,
                      margin: '0 0 28px',
                    }}>
                    Clique no link do e-mail para ativar sua conta e então faça o login.
                  </p>
                  <motion.button
                    onClick={onLogin}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 13,
                      fontSize: 14,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
                    }}>
                    Ir para o Login <ArrowRight size={16} />
                  </motion.button>
                </motion.div>
              ) : (
                /* ── Formulário de cadastro ── */
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.45 }} style={{ marginBottom: isMobile ? 22 : 30 }}>
                    <h2
                      style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: isMobile ? 22 : 26,
                        fontWeight: 800,
                        color: c.text,
                        margin: '0 0 8px',
                        letterSpacing: '-0.025em',
                      }}>
                      {isInvite ? 'Crie sua senha' : 'Criar conta'}
                    </h2>
                    <p style={{ margin: 0, fontSize: 14, color: c.subMid }}>{isInvite ? (currentUser?.email ? `Bem-vindo! Configure o acesso para ${currentUser.email}` : 'Defina seu nome e uma senha para acessar o painel') : 'Preencha os dados para começar a usar'}</p>
                  </motion.div>

                  <form onSubmit={handleSubmit}>
                    {/* Nome */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.4 }} style={{ marginBottom: 14 }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 12,
                          fontWeight: 600,
                          color: c.sub,
                          marginBottom: 8,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}>
                        Nome completo
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User
                          size={15}
                          color={c.muted}
                          style={{
                            position: 'absolute',
                            left: 14,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                          }}
                        />
                        <input
                          type="text"
                          value={fullName}
                          onChange={e => {
                            setFullName(e.target.value)
                            setError('')
                          }}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Seu nome completo"
                          autoComplete="name"
                          style={{ ...inputStyle('name'), paddingLeft: 38 }}
                        />
                      </div>
                    </motion.div>

                    {/* E-mail — oculto no modo invite (usuário já existe) */}
                    {isInvite ? (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.4 }} style={{ marginBottom: 14 }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 600,
                            color: c.sub,
                            marginBottom: 8,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                          }}>
                          E-mail
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Mail
                            size={15}
                            color={c.muted}
                            style={{
                              position: 'absolute',
                              left: 14,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              pointerEvents: 'none',
                            }}
                          />
                          <div
                            style={{
                              ...inputStyle(''),
                              paddingLeft: 38,
                              opacity: 0.6,
                              cursor: 'default',
                            }}>
                            {currentUser?.email ?? '—'}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.4 }} style={{ marginBottom: 14 }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 600,
                            color: c.sub,
                            marginBottom: 8,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                          }}>
                          E-mail
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Mail
                            size={15}
                            color={c.muted}
                            style={{
                              position: 'absolute',
                              left: 14,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              pointerEvents: 'none',
                            }}
                          />
                          <input
                            type="email"
                            value={email}
                            onChange={e => {
                              setEmail(e.target.value)
                              setError('')
                            }}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="seu@email.com"
                            autoComplete="email"
                            style={{ ...inputStyle('email'), paddingLeft: 38 }}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Senha */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46, duration: 0.4 }} style={{ marginBottom: 14 }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 12,
                          fontWeight: 600,
                          color: c.sub,
                          marginBottom: 8,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}>
                        Senha
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPwd ? 'text' : 'password'}
                          value={password}
                          onChange={e => {
                            setPassword(e.target.value)
                            setError('')
                          }}
                          onFocus={() => setFocusedField('pwd')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Mínimo 6 caracteres"
                          autoComplete="new-password"
                          style={{ ...inputStyle('pwd'), paddingRight: 46 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(p => !p)}
                          style={{
                            position: 'absolute',
                            right: 14,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: c.muted,
                            display: 'flex',
                            alignItems: 'center',
                            padding: 0,
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = c.sub)}
                          onMouseLeave={e => (e.currentTarget.style.color = c.muted)}>
                          {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </motion.div>

                    {/* Confirmar senha */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }} style={{ marginBottom: 10 }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 12,
                          fontWeight: 600,
                          color: c.sub,
                          marginBottom: 8,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}>
                        Confirmar senha
                      </label>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={confirm}
                        onChange={e => {
                          setConfirm(e.target.value)
                          setError('')
                        }}
                        onFocus={() => setFocusedField('confirm')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Repita a senha"
                        autoComplete="new-password"
                        style={inputStyle('confirm')}
                      />
                    </motion.div>

                    {/* Erro */}
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -4, gridTemplateRows: '0fr' }} animate={{ opacity: 1, y: 0, gridTemplateRows: '1fr' }} exit={{ opacity: 0, y: -4, gridTemplateRows: '0fr' }} transition={{ duration: 0.2 }} style={{ display: 'grid', overflow: 'hidden' }}>
                          <div
                            style={{
                              overflow: 'hidden',
                              minHeight: 0,
                              padding: '10px 14px',
                              borderRadius: 10,
                              marginBottom: 14,
                              background: 'rgba(244,63,94,0.08)',
                              border: '1px solid rgba(244,63,94,0.2)',
                              fontSize: 13,
                              color: '#fb7185',
                              fontWeight: 500,
                              lineHeight: 1.4,
                            }}>
                            {error}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* CAPTCHA (só no cadastro; o invite usa updateUser, que não exige) */}
                    {!isInvite && <Captcha ref={captchaRef} theme={theme} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />}

                    {/* Submit */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54, duration: 0.4 }} style={{ marginTop: 20 }}>
                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={
                          !isLoading
                            ? {
                                scale: 1.02,
                                boxShadow: '0 12px 32px rgba(99,102,241,0.45)',
                              }
                            : {}
                        }
                        whileTap={!isLoading ? { scale: 0.98 } : {}}
                        style={{
                          width: '100%',
                          padding: '15px',
                          borderRadius: 13,
                          fontSize: 15,
                          fontWeight: 700,
                          border: 'none',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          background: isLoading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 10,
                          boxShadow: isLoading ? 'none' : '0 6px 20px rgba(99,102,241,0.35)',
                          transition: 'background 0.3s',
                          fontFamily: 'Inter, sans-serif',
                        }}>
                        <AnimatePresence mode="wait">
                          {isLoading ? (
                            <motion.span
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                              }}>
                              <LoadingSpinner /> {isInvite ? 'Salvando...' : 'Criando conta...'}
                            </motion.span>
                          ) : (
                            <motion.span
                              key="idle"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}>
                              {isInvite ? 'Entrar no sistema' : 'Criar conta'} <ArrowRight size={16} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </motion.div>
                  </form>

                  {/* Link para login — só no modo cadastro normal */}
                  {!isInvite && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.4 }}
                      style={{
                        textAlign: 'center',
                        marginTop: 24,
                        fontSize: 14,
                        color: c.muted,
                      }}>
                      Já tem uma conta?{' '}
                      <button
                        onClick={onLogin}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#818cf8',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          padding: 0,
                        }}>
                        Fazer login
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.4 }}
            style={{
              textAlign: 'center',
              marginTop: 24,
              fontSize: 12,
              color: c.dim,
              lineHeight: 1.5,
            }}>
            © 2025 Diária Pro. Todos os direitos reservados.
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
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.2)',
        borderTopColor: 'white',
      }}
    />
  )
}
