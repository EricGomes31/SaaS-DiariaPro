import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Loader2, Mail, Plus, Send, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import * as db from '../../lib/db'
import { supabase } from '../../lib/supabase'
import { useToast } from '../UI/Toast'

const DAYS = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

// Horários disponíveis para envio (hora cheia, horário de Brasília)
const HOURS = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label: `${String(h).padStart(2, '0')}:00`,
}))
const hourLabel = h => `${String(h ?? 12).padStart(2, '0')}:00`

function AddModal({ onClose, onSaved }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(2)
  const [sendHour, setSendHour] = useState(12)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Nome obrigatório.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('E-mail inválido.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const id = `sub-${Date.now()}`
      await db.upsertReportSubscriber({
        id,
        name: name.trim(),
        email: email.trim(),
        dayOfWeek,
        sendHour,
        active: true,
      })
      onSaved()
    } catch {
      setError('Erro ao salvar. Verifique se a tabela foi criada no Supabase.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    fontSize: 13,
    background: 'rgba(255,255,255,0.04)',
    border: '1.5px solid rgba(255,255,255,0.09)',
    color: '#f1f5f9',
    outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: 6,
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 600,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ duration: 0.22 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'linear-gradient(135deg,#131325,#0f0f1e)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Mail size={15} color="#818cf8" />
            </div>
            <span
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 16,
                fontWeight: 800,
                color: '#f1f5f9',
              }}>
              Novo responsável
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
            <X size={14} color="rgba(255,255,255,0.5)" />
          </button>
        </div>

        <div
          style={{
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
          <div>
            <label style={labelStyle}>Nome completo</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Maria Silva" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" style={inputStyle} />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: 12,
            }}>
            <div>
              <label style={labelStyle}>Dia do envio semanal</label>
              <select value={dayOfWeek} onChange={e => setDayOfWeek(Number(e.target.value))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {DAYS.map(d => (
                  <option key={d.value} value={d.value} style={{ background: '#1c1c32' }}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Horário</label>
              <select value={sendHour} onChange={e => setSendHour(Number(e.target.value))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {HOURS.map(h => (
                  <option key={h.value} value={h.value} style={{ background: '#1c1c32' }}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 9,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171',
                fontSize: 13,
              }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: 11,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.5)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}>
              Cancelar
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={loading}
              style={{
                flex: 2,
                padding: '11px',
                borderRadius: 11,
                border: 'none',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}>
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      ease: 'linear',
                    }}>
                    <Loader2 size={15} />
                  </motion.div>
                  Salvando…
                </>
              ) : (
                <>
                  <Plus size={15} />
                  Adicionar
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ReportSubscribers() {
  const { showToast } = useToast()
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await db.fetchReportSubscribers()
      setSubscribers(data)
    } catch {
      showToast('Erro ao carregar responsáveis.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleToggle = async sub => {
    const updated = { ...sub, active: !sub.active }
    setSubscribers(prev => prev.map(s => (s.id === sub.id ? updated : s)))
    try {
      await db.upsertReportSubscriber(updated)
    } catch {
      setSubscribers(prev => prev.map(s => (s.id === sub.id ? sub : s)))
      showToast('Erro ao atualizar.', 'error')
    }
  }

  const handleDelete = async id => {
    setSubscribers(prev => prev.filter(s => s.id !== id))
    try {
      await db.deleteReportSubscriber(id)
    } catch {
      showToast('Erro ao remover.', 'error')
      load()
    }
  }

  const handleSendNow = async () => {
    if (!subscribers.some(s => s.active)) {
      showToast('Nenhum responsável ativo para enviar.', 'error')
      return
    }
    setSending(true)
    setSendResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('send-weekly-report', {
        body: { force: true },
      })
      if (error) throw error
      setSendResult({ success: true, sent: data?.sent ?? 0 })
      showToast(`Relatório enviado para ${data?.sent ?? 0} responsável(is)!`, 'success')
    } catch (e) {
      setSendResult({ success: false, error: String(e) })
      showToast('Erro ao enviar. Verifique a Edge Function no Supabase.', 'error')
    } finally {
      setSending(false)
      setTimeout(() => setSendResult(null), 5000)
    }
  }

  const dayLabel = v => DAYS.find(d => d.value === v)?.label ?? '—'

  return (
    <div>
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 20,
          padding: '24px 28px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
            }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(99,102,241,0.2)',
                border: '1px solid rgba(99,102,241,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Mail size={17} color="#818cf8" />
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'Syne, sans-serif',
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--card-heading)',
              }}>
              Relatório Automático por E-mail
            </h2>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--card-sub)',
              lineHeight: 1.6,
            }}>
            Cadastre os responsáveis abaixo. A cada semana, no dia e horário escolhidos, um relatório completo com pagamentos, dias trabalhados e pendências é enviado automaticamente.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSendNow}
            disabled={sending || subscribers.length === 0}
            style={{
              padding: '10px 18px',
              borderRadius: 11,
              border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.1)',
              color: '#10b981',
              fontSize: 13,
              fontWeight: 600,
              cursor: sending || subscribers.length === 0 ? 'not-allowed' : 'pointer',
              opacity: subscribers.length === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}>
            {sending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    ease: 'linear',
                  }}>
                  <Loader2 size={14} />
                </motion.div>
                Enviando…
              </>
            ) : (
              <>
                <Send size={14} />
                Enviar agora
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAdd(true)}
            style={{
              padding: '10px 18px',
              borderRadius: 11,
              border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            }}>
            <Plus size={14} />
            Adicionar
          </motion.button>
        </div>
      </motion.div>

      {/* Send result feedback */}
      <AnimatePresence>
        {sendResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              fontWeight: 600,
              background: sendResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${sendResult.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              color: sendResult.success ? '#10b981' : '#f87171',
            }}>
            {sendResult.success ? (
              <>
                <CheckCircle2 size={15} />
                Relatório enviado com sucesso para {sendResult.sent} responsável(is)!
              </>
            ) : (
              <>
                <AlertCircle size={15} />
                Erro: {sendResult.error}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscribers list */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
          borderRadius: 20,
          overflow: 'hidden',
        }}>
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--card-heading)',
            }}>
            Responsáveis cadastrados
          </h3>
          <span
            style={{
              fontSize: 12,
              color: 'var(--card-muted)',
              background: 'var(--inner-bg)',
              border: '1px solid var(--inner-border)',
              borderRadius: 99,
              padding: '3px 10px',
            }}>
            {subscribers.filter(s => s.active).length} ativos
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}>
              <Loader2 size={22} color="rgba(99,102,241,0.6)" />
            </motion.div>
          </div>
        ) : subscribers.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
              <Mail size={22} color="rgba(99,102,241,0.5)" />
            </div>
            <p
              style={{
                margin: '0 0 6px',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--card-heading)',
              }}>
              Nenhum responsável cadastrado
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--card-muted)' }}>Clique em "Adicionar" para configurar o envio automático.</p>
          </div>
        ) : (
          <div>
            <AnimatePresence>
              {subscribers.map((sub, i) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 24px',
                    borderBottom: i < subscribers.length - 1 ? '1px solid var(--card-border)' : 'none',
                  }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      background: 'rgba(99,102,241,0.12)',
                      border: '1.5px solid rgba(99,102,241,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 14,
                      fontWeight: 800,
                      color: '#818cf8',
                      opacity: sub.active ? 1 : 0.45,
                    }}>
                    {sub.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  {/* Info */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      opacity: sub.active ? 1 : 0.45,
                    }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--card-heading)',
                        marginBottom: 3,
                      }}>
                      {sub.name}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        flexWrap: 'wrap',
                      }}>
                      <span style={{ fontSize: 12, color: 'var(--card-muted)' }}>{sub.email}</span>
                      <span
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: '50%',
                          background: 'var(--card-muted)',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          color: 'rgba(99,102,241,0.7)',
                          fontWeight: 600,
                        }}>
                        Toda {dayLabel(sub.dayOfWeek)} às {hourLabel(sub.sendHour)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexShrink: 0,
                    }}>
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleToggle(sub)}
                      title={sub.active ? 'Desativar' : 'Ativar'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        color: sub.active ? '#10b981' : 'var(--card-sub)',
                      }}>
                      {sub.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleDelete(sub.id)}
                      title="Remover"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'rgba(239,68,68,0.6)',
                      }}>
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showAdd && (
          <AddModal
            onClose={() => setShowAdd(false)}
            onSaved={() => {
              setShowAdd(false)
              load()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
