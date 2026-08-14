import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, LogIn, LogOut, Coffee, Check, X, AlertCircle, Settings, Zap, Loader2, ArrowLeft,
} from 'lucide-react'
import FaceCapture from './FaceCapture'
import { useFaceModels } from '../../hooks/useFaceModels'
import { supabase } from '../../lib/supabase'

const TOKEN_KEY = 'diaria_kiosk_token'

const EVENT_TYPES = [
  { value: 'chegada',      label: 'Chegada',       icon: LogIn,  color: '#4F7A52' },
  { value: 'saida_almoco', label: 'Saída Almoço',  icon: Coffee, color: '#B8832E' },
  { value: 'volta_almoco', label: 'Volta Almoço',  icon: Coffee, color: '#D4805A' },
  { value: 'saida',        label: 'Saída',         icon: LogOut, color: '#B0413E' },
]

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

export default function KioskPage() {
  const [token, setToken]           = useState(() => localStorage.getItem(TOKEN_KEY) ?? '')
  const [tokenInput, setTokenInput] = useState('')
  const [roster, setRoster]         = useState(null) // null = ainda não carregado
  const [rosterError, setRosterError] = useState('')
  const [matcher, setMatcher]       = useState(null) // reconhecedor 1:N (face-api FaceMatcher)

  // 'auto' = identificação por câmera (padrão, botão "Verificar Identidade");
  // 'manual' = buscar pelo nome (usado quando o reconhecimento falha)
  const [mode, setMode]             = useState('auto')
  const [search, setSearch]         = useState('')
  const [verifying, setVerifying]   = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [identifiedFlash, setIdentifiedFlash] = useState(null) // worker recém-identificado (tela de boas-vindas)
  const [debugInfo, setDebugInfo]   = useState(null) // diagnóstico temporário — remover depois de ajustar o limiar

  const [selectedWorker, setSelectedWorker] = useState(null)
  const [viaAuto, setViaAuto]       = useState(false) // identificação veio da verificação por câmera? (pula a captura manual)
  const [eventType, setEventType]   = useState(null)
  const [capturing, setCapturing]   = useState(false)
  const [matchResult, setMatchResult] = useState(null) // { ok: true, time } | { ok: false }
  const [confirmReset, setConfirmReset] = useState(false)

  const scanVideoRef = useRef(null)   // câmera da tela de espera (verificação por botão)
  const captureVideoRef = useRef(null) // câmera da tela de captura manual (fallback)
  const resetTimerRef = useRef(null)
  const { status: modelsStatus, detectDescriptor, euclideanDistance, buildMatcher, identifyFace } = useFaceModels()

  const loadRoster = useCallback(async (tok) => {
    setRosterError('')
    setRoster(null)
    const { data, error } = await supabase.functions.invoke('kiosk-roster', { body: { token: tok } })
    if (error || data?.error) {
      setRosterError(data?.error ?? 'Não foi possível carregar a lista de diaristas.')
      setRoster([])
      return
    }
    setRoster(data.workers ?? [])
  }, [])

  useEffect(() => { if (token) loadRoster(token) }, [token, loadRoster])

  // Monta o reconhecedor 1:N assim que o modelo e a lista estiverem prontos.
  useEffect(() => {
    if (modelsStatus !== 'ready' || !roster) { setMatcher(null); return }
    setMatcher(buildMatcher(roster))
  }, [modelsStatus, roster, buildMatcher])

  useEffect(() => () => clearTimeout(resetTimerRef.current), [])

  // Roda uma verificação ao apertar o botão — não fica escaneando sozinho o
  // tempo todo, a pessoa se posiciona e confirma quando estiver pronta.
  const handleVerifyIdentity = async () => {
    if (!matcher || verifying) return
    setVerifying(true)
    setVerifyError('')
    try {
      const result = await identifyFace(scanVideoRef.current, matcher)
      setDebugInfo(
        result === null ? 'Nenhum rosto detectado no quadro'
        : `Melhor distância: ${result.distance.toFixed(3)} (precisa ser ≤ 0.5) — ${result.workerId ? 'bateu' : 'não bateu com ninguém'}`,
      )
      if (!result) { setVerifyError('Nenhum rosto detectado. Aproxime-se e tente de novo.'); return }
      if (!result.workerId) { setVerifyError('Rosto não reconhecido. Tente de novo ou busque pelo nome.'); return }
      const worker = roster.find(w => w.id === result.workerId)
      if (!worker) { setVerifyError('Diarista não encontrado.'); return }
      setViaAuto(true)
      setIdentifiedFlash(worker)
      resetTimerRef.current = setTimeout(() => {
        setIdentifiedFlash(null)
        setSelectedWorker(worker)
      }, 1300)
    } finally {
      setVerifying(false)
    }
  }

  const goIdle = () => {
    setSelectedWorker(null)
    setEventType(null)
    setMatchResult(null)
    setCapturing(false)
    setSearch('')
    setViaAuto(false)
    setVerifyError('')
    setMode('auto')
  }

  const handleSaveToken = () => {
    const trimmed = tokenInput.trim()
    if (!trimmed) return
    localStorage.setItem(TOKEN_KEY, trimmed)
    setToken(trimmed)
  }

  const handleReconfigure = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setTokenInput('')
    setRoster(null)
    goIdle()
  }

  const doCheckin = async (worker, ev) => {
    const { data, error } = await supabase.functions.invoke('kiosk-checkin', {
      body: { token, workerId: worker.id, eventType: ev },
    })
    if (error) return { ok: false, errorMsg: error.message ?? String(error) }
    if (data?.error) return { ok: false, errorMsg: data.error }
    return { ok: true, time: data.occurredAt }
  }

  // Modo automático: a identidade já foi verificada no scan — registra direto.
  // Só troca de tela (setEventType) depois que o resultado chega, senão a tela
  // de escolha do evento some antes do resultado aparecer (flash em branco).
  const handleSelectEventAuto = async (ev) => {
    setCapturing(true)
    const result = await doCheckin(selectedWorker, ev)
    setCapturing(false)
    setEventType(ev)
    if (!result.ok) { setMatchResult({ ok: false, reason: 'server', errorMsg: result.errorMsg }); return }
    setMatchResult({ ok: true, time: result.time })
    resetTimerRef.current = setTimeout(goIdle, 4000)
  }

  // Modo manual (fallback): ainda exige captura + verificação 1:1 antes de registrar.
  const handleCaptureManual = async () => {
    if (!captureVideoRef.current || !selectedWorker) return
    setCapturing(true)
    setMatchResult(null)
    try {
      const descriptor = await detectDescriptor(captureVideoRef.current)
      if (!descriptor) { setMatchResult({ ok: false, reason: 'no-face' }); return }
      const distance = euclideanDistance(descriptor, selectedWorker.faceDescriptor)
      if (distance > 0.5) { setMatchResult({ ok: false, reason: 'no-match' }); return }
      const result = await doCheckin(selectedWorker, eventType)
      if (!result.ok) { setMatchResult({ ok: false, reason: 'server' }); return }
      setMatchResult({ ok: true, time: result.time })
      resetTimerRef.current = setTimeout(goIdle, 4000)
    } finally {
      setCapturing(false)
    }
  }

  const filteredWorkers = (roster ?? []).filter(w => w.name.toLowerCase().includes(search.toLowerCase()))

  const page = {
    minHeight: '100dvh', background: 'linear-gradient(180deg, #201A15 0%, #0a0a14 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 24, color: '#F5EDE2', fontFamily: 'Inter, sans-serif', position: 'relative',
  }

  // ── 1) Sem token configurado ainda ──────────────────────────────────────
  if (!token) {
    return (
      <div style={page}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#B4592F,#7B5C8A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Zap size={26} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Configurar quiosque</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>
            Cole abaixo o token gerado em Configurações → Segurança, na conta do Diária Pro. Só precisa fazer isso uma vez neste aparelho.
          </p>
          <input
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            placeholder="Cole o token aqui"
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: 14, boxSizing: 'border-box',
              background: 'rgba(245,237,226,0.05)', border: '1px solid rgba(245,237,226,0.12)', color: '#F5EDE2',
              marginBottom: 16, outline: 'none',
            }}
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveToken}
            disabled={!tokenInput.trim()}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#B4592F,#7B5C8A)', color: '#fff', fontSize: 15, fontWeight: 700,
              opacity: tokenInput.trim() ? 1 : 0.5,
            }}
          >
            Salvar e continuar
          </motion.button>
        </div>
      </div>
    )
  }

  // ── 2) Carregando lista de diaristas ────────────────────────────────────
  if (roster === null) {
    return (
      <div style={page}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}>
          <Loader2 size={32} color="#D4805A" />
        </motion.div>
      </div>
    )
  }

  if (rosterError) {
    return (
      <div style={page}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <AlertCircle size={32} color="#B0413E" style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 14, color: '#B0413E', marginBottom: 20 }}>{rosterError}</p>
          <button onClick={() => loadRoster(token)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(245,237,226,0.15)', background: 'transparent', color: '#F5EDE2', cursor: 'pointer', marginRight: 8 }}>Tentar de novo</button>
          <button onClick={handleReconfigure} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'rgba(176,65,62,0.15)', color: '#B0413E', cursor: 'pointer' }}>Reconfigurar</button>
        </div>
      </div>
    )
  }

  return (
    <div style={page}>
      {/* Botão discreto de reconfiguração no canto */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 5 }}>
        {confirmReset ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleReconfigure} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(176,65,62,0.3)', background: 'rgba(176,65,62,0.12)', color: '#B0413E', fontSize: 12, cursor: 'pointer' }}>Confirmar</button>
            <button onClick={() => setConfirmReset(false)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(245,237,226,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)} title="Reconfigurar quiosque" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(245,237,226,0.1)', background: 'rgba(245,237,226,0.04)', color: 'rgba(245,237,226,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Settings size={15} />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ── 3a) Flash de identificação automática ── */}
        {identifiedFlash && (
          <motion.div key="flash" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center' }}>
            <div style={{
              width: 76, height: 76, borderRadius: 20, margin: '0 auto 16px',
              background: `${identifiedFlash.avatarColor}25`, border: `2.5px solid ${identifiedFlash.avatarColor}60`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: identifiedFlash.avatarColor,
            }}>
              {identifiedFlash.avatar}
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800 }}>Olá, {identifiedFlash.name}! 👋</h1>
          </motion.div>
        )}

        {/* ── 3b) Tela de espera — verificação por câmera ou busca manual ── */}
        {!identifiedFlash && !selectedWorker && mode === 'auto' && (
          <motion.div key="auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Verificar Identidade</h1>
            <p style={{ fontSize: 13, color: 'rgba(245,237,226,0.45)', marginBottom: 18 }}>
              {modelsStatus !== 'ready' ? 'Carregando reconhecimento facial...'
                : !matcher ? 'Nenhum diarista com rosto cadastrado ainda'
                : 'Centralize o rosto e toque em Verificar Identidade'}
            </p>
            <div style={{ position: 'relative', marginBottom: 18 }}>
              <FaceCapture ref={scanVideoRef} active={modelsStatus === 'ready'} height={300} />
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
                border: `2px solid ${verifying ? 'rgba(180,89,47,0.5)' : 'rgba(245,237,226,0.08)'}`,
                transition: 'border-color 0.3s',
              }} />
            </div>

            {verifyError && (
              <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(176,65,62,0.1)', border: '1px solid rgba(176,65,62,0.25)', color: '#B0413E', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <X size={14} />
                {verifyError}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleVerifyIdentity}
              disabled={!matcher || modelsStatus !== 'ready' || verifying}
              style={{
                width: '100%', padding: '15px', borderRadius: 13, border: 'none', cursor: 'pointer', marginBottom: 14,
                background: 'linear-gradient(135deg,#B4592F,#7B5C8A)', color: '#fff', fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: (!matcher || modelsStatus !== 'ready' || verifying) ? 0.5 : 1,
              }}
            >
              {verifying
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Loader2 size={18} /></motion.div>
                : 'Verificar Identidade'}
            </motion.button>

            {/* Diagnóstico temporário — remover depois de ajustar o limiar de confiança */}
            {debugInfo && (
              <p style={{ fontSize: 11, color: '#B8832E', marginBottom: 14, fontFamily: 'monospace' }}>{debugInfo}</p>
            )}
            <button onClick={() => setMode('manual')} style={{ background: 'none', border: 'none', color: 'rgba(245,237,226,0.4)', fontSize: 12.5, cursor: 'pointer', textDecoration: 'underline' }}>
              Não reconheceu? Buscar pelo nome
            </button>
          </motion.div>
        )}

        {!identifiedFlash && !selectedWorker && mode === 'manual' && (
          <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', maxWidth: 560 }}>
            <button onClick={() => setMode('auto')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(245,237,226,0.4)', cursor: 'pointer', fontSize: 13, margin: '0 auto 16px' }}>
              <ArrowLeft size={14} /> Voltar ao reconhecimento automático
            </button>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 20 }}>
              Quem está batendo o ponto?
            </h1>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,237,226,0.35)' }} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Digite seu nome..."
                style={{
                  width: '100%', padding: '16px 16px 16px 46px', borderRadius: 14, fontSize: 16, boxSizing: 'border-box',
                  background: 'rgba(245,237,226,0.05)', border: '1px solid rgba(245,237,226,0.12)', color: '#F5EDE2', outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, maxHeight: '48dvh', overflowY: 'auto' }}>
              {filteredWorkers.map(w => (
                <motion.button
                  key={w.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setViaAuto(false); setSelectedWorker(w) }}
                  style={{
                    padding: '18px 12px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                    background: 'rgba(245,237,226,0.04)', border: '1px solid rgba(245,237,226,0.08)', color: '#F5EDE2',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, margin: '0 auto 10px',
                    background: `${w.avatarColor}25`, border: `2px solid ${w.avatarColor}50`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: w.avatarColor,
                  }}>
                    {w.avatar}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{w.name}</div>
                </motion.button>
              ))}
              {filteredWorkers.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px 0', color: 'rgba(245,237,226,0.35)', fontSize: 13 }}>
                  Nenhum diarista encontrado
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── 4) Escolher o momento do dia ── */}
        {selectedWorker && !eventType && (
          <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
            <button onClick={goIdle} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(245,237,226,0.4)', cursor: 'pointer', fontSize: 13, margin: '0 auto 20px' }}>
              <ArrowLeft size={14} /> Voltar
            </button>
            <div style={{
              width: 60, height: 60, borderRadius: 16, margin: '0 auto 12px',
              background: `${selectedWorker.avatarColor}25`, border: `2px solid ${selectedWorker.avatarColor}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: selectedWorker.avatarColor,
            }}>
              {selectedWorker.avatar}
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 24 }}>{selectedWorker.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {EVENT_TYPES.map(ev => (
                <motion.button
                  key={ev.value}
                  whileTap={{ scale: 0.96 }}
                  disabled={capturing}
                  onClick={() => viaAuto ? handleSelectEventAuto(ev.value) : setEventType(ev.value)}
                  style={{
                    padding: '20px 14px', borderRadius: 14, cursor: capturing ? 'wait' : 'pointer',
                    background: `${ev.color}15`, border: `1.5px solid ${ev.color}35`, color: ev.color,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700,
                    opacity: capturing ? 0.6 : 1,
                  }}
                >
                  {capturing
                    ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Loader2 size={22} /></motion.div>
                    : <ev.icon size={22} />}
                  {ev.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── 5) Resultado (modo automático: sucesso/erro direto) ── */}
        {selectedWorker && eventType && viaAuto && matchResult && (
          <motion.div key="auto-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
            {matchResult.ok ? (
              <>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{
                  width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'rgba(79,122,82,0.15)', border: '2px solid #4F7A52',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={34} color="#4F7A52" strokeWidth={3} />
                </motion.div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
                  {EVENT_TYPES.find(e => e.value === eventType)?.label} registrada
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>às {formatTime(matchResult.time)}</p>
              </>
            ) : (
              <>
                <AlertCircle size={32} color="#B0413E" style={{ marginBottom: 14 }} />
                <p style={{ fontSize: 14, color: '#B0413E', marginBottom: 8 }}>Erro ao registrar</p>
                {matchResult.errorMsg && (
                  <p style={{ fontSize: 11, color: 'rgba(176,65,62,0.7)', marginBottom: 20, fontFamily: 'monospace', wordBreak: 'break-word' }}>{matchResult.errorMsg}</p>
                )}
              </>
            )}
            <button onClick={goIdle} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'rgba(245,237,226,0.08)', color: '#F5EDE2', cursor: 'pointer', fontWeight: 600 }}>
              Concluir
            </button>
          </motion.div>
        )}

        {/* ── 6) Captura manual (fallback, exige verificação 1:1) ── */}
        {selectedWorker && eventType && !viaAuto && (
          <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
            {matchResult?.ok ? (
              <>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{
                  width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'rgba(79,122,82,0.15)', border: '2px solid #4F7A52',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={34} color="#4F7A52" strokeWidth={3} />
                </motion.div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
                  {EVENT_TYPES.find(e => e.value === eventType)?.label} registrada
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>às {formatTime(matchResult.time)}</p>
                <button onClick={goIdle} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'rgba(245,237,226,0.08)', color: '#F5EDE2', cursor: 'pointer', fontWeight: 600 }}>
                  Concluir
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEventType(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(245,237,226,0.4)', cursor: 'pointer', fontSize: 13, margin: '0 auto 14px' }}>
                  <ArrowLeft size={14} /> Voltar
                </button>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>
                  {EVENT_TYPES.find(e => e.value === eventType)?.label} — posicione o rosto no quadro
                </p>
                <div style={{ marginBottom: 16 }}>
                  <FaceCapture ref={captureVideoRef} active={modelsStatus === 'ready'} height={280} />
                </div>

                {matchResult && !matchResult.ok && (
                  <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(176,65,62,0.1)', border: '1px solid rgba(176,65,62,0.25)', color: '#B0413E', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <X size={14} />
                    {matchResult.reason === 'no-face' ? 'Nenhum rosto detectado — tente novamente'
                      : matchResult.reason === 'no-match' ? 'Rosto não reconhecido — tente novamente'
                      : 'Erro ao registrar — tente novamente'}
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCaptureManual}
                  disabled={modelsStatus !== 'ready' || capturing}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg,#B4592F,#7B5C8A)', color: '#fff', fontSize: 15, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: modelsStatus !== 'ready' || capturing ? 0.6 : 1,
                  }}
                >
                  {capturing || modelsStatus !== 'ready'
                    ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Loader2 size={18} /></motion.div>
                    : 'Capturar'}
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
