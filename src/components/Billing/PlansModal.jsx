import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Crown, Sparkles, Users, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'

// ── Traduções (mesmo padrão local do SettingsPanel) ──────────────────
const UI = {
  pt: {
    title: 'Planos',
    subtitle: 'Escolha o plano ideal para o seu negócio',
    monthly: 'Mensal',
    annual: 'Anual',
    annualBadge: '2 meses grátis',
    perMonth: '/mês',
    perYear: '/ano',
    billedAnnually: 'cobrado anualmente',
    equivalent: 'equivalente a',
    recommended: 'Recomendado',
    currentPlan: 'Plano atual',
    choose: 'Assinar',
    docLabel: 'CPF/CNPJ do responsável pela conta',
    docPlaceholder: 'Somente números',
    docError: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.',
    footnote: 'Cancele quando quiser · Sem multa · Suporte em português',
    unlimited: 'ilimitadas',
    upTo: 'até',
    workers: 'diaristas',
  },
  en: {
    title: 'Plans',
    subtitle: 'Choose the ideal plan for your business',
    monthly: 'Monthly',
    annual: 'Annual',
    annualBadge: '2 months free',
    perMonth: '/mo',
    perYear: '/yr',
    billedAnnually: 'billed annually',
    equivalent: 'equivalent to',
    recommended: 'Recommended',
    currentPlan: 'Current plan',
    choose: 'Subscribe',
    docLabel: 'Account holder tax ID (CPF/CNPJ)',
    docPlaceholder: 'Numbers only',
    docError: 'Enter a valid CPF (11 digits) or CNPJ (14 digits).',
    footnote: 'Cancel anytime · No fees · Support in your language',
    unlimited: 'unlimited',
    upTo: 'up to',
    workers: 'workers',
  },
  es: {
    title: 'Planes',
    subtitle: 'Elige el plan ideal para tu negocio',
    monthly: 'Mensual',
    annual: 'Anual',
    annualBadge: '2 meses gratis',
    perMonth: '/mes',
    perYear: '/año',
    billedAnnually: 'facturado anualmente',
    equivalent: 'equivalente a',
    recommended: 'Recomendado',
    currentPlan: 'Plan actual',
    choose: 'Suscribir',
    docLabel: 'CPF/CNPJ del responsable de la cuenta',
    docPlaceholder: 'Solo números',
    docError: 'Ingresa un CPF (11 dígitos) o CNPJ (14 dígitos) válido.',
    footnote: 'Cancela cuando quieras · Sin multas · Soporte en español',
    unlimited: 'ilimitadas',
    upTo: 'hasta',
    workers: 'trabajadores',
  },
}

// ── Definição dos planos ─────────────────────────────────────────────
// monthly = preço mensal avulso · annual = preço total do ano (≈10 meses)
// limit = nº máx. de diaristas (null = ilimitado)
const PLANS = [
  {
    id: 'basico',
    icon: Users,
    monthly: 19.9,
    annual: 199,
    limit: 5,
    accent: '#818cf8',
    features: {
      pt: ['Calendário de trabalho', 'Cálculo automático de diárias', 'Comprovante PIX por e-mail', 'Relatórios básicos'],
      en: ['Work calendar', 'Automatic daily-rate calc', 'PIX receipt by email', 'Basic reports'],
      es: ['Calendario de trabajo', 'Cálculo automático de jornadas', 'Comprobante PIX por correo', 'Informes básicos'],
    },
  },
  {
    id: 'pro',
    icon: Sparkles,
    monthly: 39.9,
    annual: 399,
    limit: 20,
    accent: '#a78bfa',
    recommended: true,
    features: {
      pt: ['Tudo do Básico', 'Gastos diários (refeições)', 'Relatórios avançados + exportação', 'Gestão de feriados', 'Múltiplos locais'],
      en: ['Everything in Basic', 'Daily expenses (meals)', 'Advanced reports + export', 'Holiday management', 'Multiple locations'],
      es: ['Todo lo del Básico', 'Gastos diarios (comidas)', 'Informes avanzados + exportación', 'Gestión de festivos', 'Múltiples lugares'],
    },
  },
  {
    id: 'empresa',
    icon: Crown,
    monthly: 79.9,
    annual: 799,
    limit: null,
    accent: '#fbbf24',
    features: {
      pt: ['Tudo do Pro', 'Diaristas ilimitadas', 'Relatório semanal automático', 'Log de auditoria', 'Suporte prioritário'],
      en: ['Everything in Pro', 'Unlimited workers', 'Automatic weekly report', 'Audit log', 'Priority support'],
      es: ['Todo lo del Pro', 'Trabajadores ilimitados', 'Informe semanal automático', 'Registro de auditoría', 'Soporte prioritario'],
    },
  },
]

const formatBRL = v =>
  v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })

function PlanCard({ plan, cycle, t, lang, sp, isMobile, isCurrent, onSelect }) {
  const Icon = plan.icon
  const isAnnual = cycle === 'annual'
  const price = isAnnual ? plan.annual : plan.monthly
  const monthlyEquivalent = plan.annual / 12
  const highlight = plan.recommended
  const limitLabel = plan.limit === null ? t.unlimited : `${t.upTo} ${plan.limit}`

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      style={{
        position: 'relative',
        flex: 1,
        minWidth: isMobile ? '100%' : 0,
        padding: '24px 22px',
        borderRadius: 20,
        background: highlight ? sp.cardHighlightBg : sp.cardBg,
        border: `1.5px solid ${highlight ? 'rgba(139,92,246,0.5)' : sp.cardBorder}`,
        boxShadow: highlight ? '0 12px 40px rgba(139,92,246,0.25)' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}>
      {highlight && (
        <div
          style={{
            position: 'absolute',
            top: -11,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 14px',
            borderRadius: 100,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            boxShadow: '0 4px 14px rgba(99,102,241,0.5)',
            whiteSpace: 'nowrap',
          }}>
          ★ {t.recommended}
        </div>
      )}

      {/* Ícone + nome */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
        }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: `${plan.accent}22`,
            border: `1px solid ${plan.accent}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
          <Icon size={18} color={plan.accent} />
        </div>
        <div>
          <div
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 17,
              fontWeight: 800,
              color: sp.cardTitle,
              textTransform: 'capitalize',
            }}>
            {plan.id}
          </div>
          <div style={{ fontSize: 11, color: sp.cardSub }}>
            {limitLabel} {t.workers}
          </div>
        </div>
      </div>

      {/* Preço */}
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 4,
            flexWrap: 'wrap',
          }}>
          <span
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 26,
              fontWeight: 800,
              color: sp.cardTitle,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}>
            {formatBRL(price)}
          </span>
          <span style={{ fontSize: 13, color: sp.cardSub, whiteSpace: 'nowrap' }}>{isAnnual ? t.perYear : t.perMonth}</span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: sp.cardSub,
            marginTop: 3,
            minHeight: 15,
          }}>
          {isAnnual && `${t.equivalent} ${formatBRL(monthlyEquivalent)}${t.perMonth}`}
        </div>
      </div>

      {/* Features */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
          marginBottom: 22,
          flex: 1,
        }}>
        {plan.features[lang]?.map((feat, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                flexShrink: 0,
                marginTop: 1,
                background: `${plan.accent}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Check size={10} color={plan.accent} strokeWidth={3} />
            </div>
            <span style={{ fontSize: 13, color: sp.featText, lineHeight: 1.35 }}>{feat}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: isCurrent ? 1 : 1.03 }}
        whileTap={{ scale: isCurrent ? 1 : 0.97 }}
        disabled={isCurrent}
        onClick={() => onSelect(plan.id, cycle)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          padding: '12px',
          borderRadius: 12,
          border: 'none',
          cursor: isCurrent ? 'default' : 'pointer',
          fontSize: 14,
          fontWeight: 700,
          background: isCurrent ? sp.currentBtnBg : highlight ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : sp.ctaBg,
          color: isCurrent ? sp.cardSub : highlight ? 'white' : sp.ctaColor,
          boxShadow: highlight && !isCurrent ? '0 6px 20px rgba(99,102,241,0.4)' : 'none',
          transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
        }}>
        {isCurrent ? (
          t.currentPlan
        ) : (
          <>
            {t.choose}
            <ArrowRight size={15} />
          </>
        )}
      </motion.button>
    </motion.div>
  )
}

export default function PlansModal({
  onClose,
  theme = 'dark',
  lang = 'pt',
  currentPlan = null, // ex.: 'basico' — marca o plano atual do usuário
  onSelectPlan, // (planId, cycle) => void — aqui você chama a API do Asaas
}) {
  const isMobile = useIsMobile()
  const [cycle, setCycle] = useState('annual')
  const t = UI[lang] ?? UI.pt
  const isLight = theme === 'light'

  const sp = {
    bg: isLight ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' : 'linear-gradient(135deg, #131325 0%, #0f0f1e 100%)',
    border: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
    shadow: isLight ? '0 24px 64px rgba(0,0,0,0.15)' : '0 24px 64px rgba(0,0,0,0.8)',
    headerBorder: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)',
    title: isLight ? '#1e293b' : '#f1f5f9',
    sub: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
    closeBg: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
    closeBorder: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
    closeColor: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
    toggleTrack: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
    toggleBorder: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
    toggleInactive: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
    cardBg: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
    cardHighlightBg: isLight ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.08)',
    cardBorder: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
    cardTitle: isLight ? '#1e293b' : '#f1f5f9',
    cardSub: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
    featText: isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.75)',
    ctaBg: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
    ctaColor: isLight ? '#4f46e5' : '#c7d2fe',
    currentBtnBg: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
    footnote: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)',
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(isMobile ? { padding: 12 } : { paddingLeft: 272 }),
      }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: isMobile ? '100%' : 880,
          maxWidth: isMobile ? undefined : 'calc(100vw - 296px)',
          maxHeight: 'calc(100vh - 48px)',
          background: sp.bg,
          border: `1px solid ${sp.border}`,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: sp.shadow,
          display: 'flex',
          flexDirection: 'column',
        }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '22px 28px',
            borderBottom: `1px solid ${sp.headerBorder}`,
            flexShrink: 0,
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
              <Zap size={15} color="#818cf8" />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 18,
                  fontWeight: 800,
                  color: sp.title,
                  letterSpacing: '-0.02em',
                }}>
                {t.title}
              </h2>
              <p style={{ margin: 0, fontSize: 11, color: sp.sub }}>{t.subtitle}</p>
            </div>
          </div>
          <motion.button
            whileHover={{
              scale: 1.1,
              background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
            }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${sp.closeBorder}`,
              background: sp.closeBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: sp.closeColor,
            }}>
            <X size={15} />
          </motion.button>
        </div>

        {/* Conteúdo */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '20px 16px' : '28px',
          }}>
          {/* Toggle Mensal / Anual */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 26,
            }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: 4,
                background: sp.toggleTrack,
                border: `1px solid ${sp.toggleBorder}`,
                borderRadius: 100,
              }}>
              {['monthly', 'annual'].map(c => {
                const active = cycle === c
                return (
                  <button
                    key={c}
                    onClick={() => setCycle(c)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '8px 18px',
                      borderRadius: 100,
                      border: 'none',
                      cursor: 'pointer',
                      background: active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                      color: active ? 'white' : sp.toggleInactive,
                      fontSize: 13,
                      fontWeight: 700,
                      transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                      boxShadow: active ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                    }}>
                    {c === 'monthly' ? t.monthly : t.annual}
                    {c === 'annual' && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 100,
                          background: active ? 'rgba(255,255,255,0.25)' : 'rgba(16,185,129,0.15)',
                          color: active ? 'white' : '#10b981',
                          whiteSpace: 'nowrap',
                        }}>
                        {t.annualBadge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cards */}
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 16,
              alignItems: 'stretch',
            }}>
            {PLANS.map(plan => (
              <PlanCard key={plan.id} plan={plan} cycle={cycle} t={t} lang={lang} sp={sp} isMobile={isMobile} isCurrent={currentPlan === plan.id} onSelect={onSelectPlan} />
            ))}
          </div>

          {/* Rodapé */}
          <div
            style={{
              textAlign: 'center',
              marginTop: 22,
              fontSize: 12,
              color: sp.footnote,
            }}>
            {t.footnote}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
