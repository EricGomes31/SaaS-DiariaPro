import { motion } from 'framer-motion'
import { CheckCircle, Eye, EyeOff, Lock } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ChangePasswordModal({ onClose, theme = 'dark' }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const isLight = theme === 'light'
  const c = {
    overlay: isLight ? 'rgba(241,245,249,0.85)' : 'rgba(0,0,0,0.7)',
    cardBg: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(17,17,34,0.95)',
    cardBorder: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)',
    cardShadow: isLight ? '0 32px 80px rgba(0,0,0,0.12)' : '0 32px 80px rgba(0,0,0,0.6)',
    iconBg: isLight ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.15)',
    iconBorder: isLight ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.25)',
    title: isLight ? '#0f172a' : '#f1f5f9',
    sub: isLight ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.35)',
    label: isLight ? 'rgba(15,23,42,0.45)' : 'rgba(255,255,255,0.35)',
    eyeColor: isLight ? 'rgba(15,23,42,0.3)' : 'rgba(255,255,255,0.25)',
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }
    setDone(true)
    setTimeout(onClose, 2200)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: c.overlay,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        transition: 'background 0.3s',
      }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: 400,
          background: c.cardBg,
          border: `1px solid ${c.cardBorder}`,
          borderRadius: 20,
          padding: '36px 32px',
          boxShadow: c.cardShadow,
          transition: 'background 0.3s, border-color 0.3s',
        }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <CheckCircle size={44} color="#34d399" style={{ marginBottom: 16 }} />
            <div
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 20,
                fontWeight: 800,
                color: c.title,
                marginBottom: 8,
              }}>
              Senha atualizada!
            </div>
            <div style={{ fontSize: 14, color: c.sub }}>Redirecionando para o login...</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 10,
                }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: c.iconBg,
                    border: `1px solid ${c.iconBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Lock size={17} color="#818cf8" />
                </div>
                <h2
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 20,
                    fontWeight: 800,
                    color: c.title,
                    margin: 0,
                  }}>
                  Nova senha
                </h2>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: c.sub,
                  lineHeight: 1.5,
                }}>
                Escolha uma nova senha para sua conta.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    color: c.label,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    marginBottom: 7,
                  }}>
                  Nova senha
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    placeholder="Mínimo 6 caracteres"
                    className="input-premium"
                    style={{
                      width: '100%',
                      padding: '13px 44px 13px 14px',
                      borderRadius: 12,
                      fontSize: 14,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    style={{
                      position: 'absolute',
                      right: 13,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: c.eyeColor,
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = isLight ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.6)')}
                    onMouseLeave={e => (e.currentTarget.style.color = c.eyeColor)}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    color: c.label,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    marginBottom: 7,
                  }}>
                  Confirmar senha
                </label>
                <input
                  type={show ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => {
                    setConfirm(e.target.value)
                    setError('')
                  }}
                  placeholder="Repita a senha"
                  className="input-premium"
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    borderRadius: 12,
                    fontSize: 14,
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: '10px 13px',
                    borderRadius: 10,
                    background: 'rgba(244,63,94,0.08)',
                    border: '1px solid rgba(244,63,94,0.2)',
                    fontSize: 13,
                    color: '#fb7185',
                    fontWeight: 500,
                  }}>
                  {error}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                style={{
                  marginTop: 4,
                  padding: '14px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
                }}>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </motion.button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
