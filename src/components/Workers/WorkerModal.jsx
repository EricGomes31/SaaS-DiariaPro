import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, DollarSign, MapPin, Clock, Check, QrCode } from 'lucide-react'
import { PIX_KEY_TYPES, isValidCPF } from '../../data/mockData'
import SearchableSelect from '../UI/SearchableSelect'
import { useIsMobile } from '../../hooks/useIsMobile'
import i18n from '../../i18n'


const Field = ({ label, children }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--card-muted)', marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {label}
    </label>
    {children}
  </div>
)

export default function WorkerModal({ lang = 'pt', worker, workers = [], locations, locationDepartments = [], locationJobTitles = [], onSave, onClose }) {
  const isMobile = useIsMobile()
  const t = i18n[lang] ?? i18n.pt
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: worker?.name || '',
    department: worker?.department || '',
    jobTitle: worker?.jobTitle || '',
    schedule: worker?.schedule || '',
    weekdayRate: worker?.weekdayRate ?? 150,
    saturdayRate: worker?.saturdayRate ?? 220,
    sundayRate: worker?.sundayRate ?? 220,
    locations: worker?.locations || [],
    status: worker?.status || 'active',
    phone: worker?.phone || '',
    email: worker?.email || '',
    cpf: worker?.cpf || '',
    pixKeyType: worker?.pixKeyType || 'cpf',
    pixKey: worker?.pixKey || '',
    workerType: worker?.workerType || 'diarista',
  })

  const toggle = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || form.locations.length === 0) return

    const normalizedCpf = form.cpf.replace(/\D/g, '')
    if (normalizedCpf) {
      if (!isValidCPF(normalizedCpf)) {
        setError(t.invalidCpfError)
        return
      }
      const cpfDuplicate = workers.some(w => w.id !== worker?.id && (w.cpf || '').replace(/\D/g, '') === normalizedCpf)
      if (cpfDuplicate) {
        setError(t.duplicateWorkerCpfError)
        return
      }
    }

    const normalizedName = form.name.trim().toLowerCase()
    const nameDuplicate = workers.some(w => w.id !== worker?.id && w.name.trim().toLowerCase() === normalizedName)
    if (nameDuplicate) {
      setError(t.duplicateWorkerNameError)
      return
    }
    onSave({
      ...form,
      weekdayRate: parseFloat(form.weekdayRate) || 0,
      saturdayRate: parseFloat(form.saturdayRate) || 0,
      sundayRate: parseFloat(form.sundayRate) || 0,
    })
  }

  // Departamentos/cargos cadastrados nos locais selecionados para este trabalhador
  // (+ o valor atual do worker, caso não bata com o catálogo — cadastro legado).
  const deptNames = new Set(locationDepartments.filter(d => form.locations.includes(d.locationId)).map(d => d.name))
  if (worker?.department) deptNames.add(worker.department)
  const deptOptions = [...deptNames].sort((a, b) => a.localeCompare(b)).map(n => ({ value: n, label: n }))

  const jobTitlesForLocations = locationJobTitles.filter(j => form.locations.includes(j.locationId))
  const jobTitleNames = new Set(jobTitlesForLocations.map(j => j.name))
  if (worker?.jobTitle) jobTitleNames.add(worker.jobTitle)
  const jobTitleOptions = [...jobTitleNames].sort((a, b) => a.localeCompare(b)).map(n => ({ value: n, label: n }))

  const handleJobTitleChange = (name) => {
    const match = jobTitlesForLocations.find(j => j.name === name) ?? locationJobTitles.find(j => j.name === name)
    setForm(p => ({
      ...p,
      jobTitle: name,
      ...(match ? {
        weekdayRate: match.weekdayRate ?? p.weekdayRate,
        saturdayRate: match.saturdayRate ?? p.saturdayRate,
        sundayRate: match.sundayRate ?? p.sundayRate,
      } : {}),
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Modal header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '26px 28px', borderBottom: '1px solid var(--card-border)',
          position: 'sticky', top: 0,
          background: 'var(--card-bg-solid)',
          zIndex: 10,
        }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--card-heading)', letterSpacing: '-0.02em' }}>
              {worker ? t.editWorkerTitle : t.newWorkerTitle}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--card-muted)' }}>
              {t.workerModalSubtitle}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, background: 'var(--inner-bg)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid var(--card-border)',
              background: 'var(--inner-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--card-muted)', transition: 'all 0.2s',
            }}
          >
            <X size={16} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
          {/* Section: Identificação */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={13} color="#818cf8" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--card-sub)' }}>{t.identificationSection}</span>
            </div>

            <Field label={t.fullNameLabel}>
              <input
                value={form.name}
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setError('') }}
                placeholder={t.workerNamePlaceholder}
                required
                className="input-premium"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14 }}
              />
            </Field>

            <Field label="Tipo de trabalhador">
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'diarista',   label: '🧹 Diarista',   desc: 'Pagamento por dia' },
                  { value: 'funcionario', label: '👔 Funcionário', desc: 'Vínculo fixo' },
                ].map(opt => {
                  const sel = form.workerType === opt.value
                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setForm(p => ({ ...p, workerType: opt.value }))}
                      style={{
                        flex: 1, padding: '12px 10px', borderRadius: 12, cursor: 'pointer',
                        border: `1.5px solid ${sel ? 'rgba(99,102,241,0.5)' : 'var(--card-border)'}`,
                        background: sel ? 'rgba(99,102,241,0.12)' : 'var(--inner-bg)',
                        transition: 'all 0.15s', textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#818cf8' : 'var(--card-sub)', marginBottom: 2 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: sel ? 'rgba(129,140,248,0.6)' : 'var(--card-muted)' }}>{opt.desc}</div>
                    </motion.button>
                  )
                })}
              </div>
            </Field>

            {/* Section: Locais (precisa vir antes de Departamento/Cargo — o catálogo depende do local escolhido) */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={13} color="#10b981" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--card-sub)' }}>{t.workLocationsSection}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                {locations.map(loc => {
                  const selected = form.locations.includes(loc.id)
                  return (
                    <motion.button
                      key={loc.id}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => toggle('locations', loc.id)}
                      style={{
                        padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                        border: `1.5px solid ${selected ? loc.color + '60' : 'var(--card-border)'}`,
                        background: selected ? `${loc.color}12` : 'var(--inner-bg)',
                        display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 5,
                        background: selected ? loc.color : 'var(--inner-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s', flexShrink: 0,
                      }}>
                        {selected && <Check size={11} color="white" />}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: selected ? loc.color : 'var(--card-sub)' }}>{loc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--card-muted)' }}>{loc.city}</div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              {/* Departamento */}
              <Field label={t.departmentLabel}>
                <SearchableSelect
                  value={form.department}
                  onChange={v => setForm(p => ({ ...p, department: v }))}
                  options={deptOptions}
                  placeholder={form.locations.length === 0 ? t.selectLocationFirstHint : t.departmentLabel}
                  minWidth="100%"
                  fontSize={14}
                  padding="12px 16px"
                  clearable={false}
                  allowCustom={false}
                />
              </Field>

              {/* Cargo */}
              <Field label={t.jobTitleLabel}>
                <SearchableSelect
                  value={form.jobTitle}
                  onChange={handleJobTitleChange}
                  options={jobTitleOptions}
                  placeholder={form.locations.length === 0 ? t.selectLocationFirstHint : t.jobTitleLabel}
                  minWidth="100%"
                  fontSize={14}
                  padding="12px 16px"
                  clearable={false}
                  allowCustom={false}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <Field label={t.scheduleLabel}>
                <input
                  value={form.schedule}
                  onChange={e => setForm(p => ({ ...p, schedule: e.target.value }))}
                  placeholder="Ex: 06h–14h"
                  className="input-premium"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14 }}
                />
              </Field>
              <Field label={t.phoneLabel}>
                <input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className="input-premium"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14 }}
                />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <Field label={t.emailLabel}>
                <input
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  type="email"
                  placeholder="email@exemplo.com"
                  className="input-premium"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14 }}
                />
              </Field>
              <Field label={t.cpfLabel}>
                <input
                  value={form.cpf}
                  onChange={e => {
                    const cpf = e.target.value
                    setForm(p => ({ ...p, cpf, pixKey: p.pixKeyType === 'cpf' ? cpf : p.pixKey }))
                    setError('')
                  }}
                  placeholder="000.000.000-00"
                  className="input-premium"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14 }}
                />
              </Field>
            </div>
          </div>

          {/* Section: Remuneração */}
          <div style={{ marginBottom: 24, padding: '20px', borderRadius: 16, background: 'var(--inner-bg)', border: '1px solid var(--inner-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={13} color="#f59e0b" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--card-sub)' }}>{t.remunerationSection}</span>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--card-muted)' }}>{t.remunerationAutoFillHint}</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--card-muted)', marginBottom: 6 }}>
                  {t.weekdayRateLabel}
                </label>
                <input
                  type="number"
                  value={form.weekdayRate}
                  onChange={e => setForm(p => ({ ...p, weekdayRate: e.target.value }))}
                  min="0"
                  className="input-premium"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 16, fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,158,11,0.8)', marginBottom: 6 }}>
                  Sábado (R$)
                </label>
                <input
                  type="number"
                  value={form.saturdayRate}
                  onChange={e => setForm(p => ({ ...p, saturdayRate: e.target.value }))}
                  min="0"
                  className="input-premium"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 16, fontWeight: 700, borderColor: 'rgba(245,158,11,0.25)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,158,11,0.8)', marginBottom: 6 }}>
                  Domingo (R$)
                </label>
                <input
                  type="number"
                  value={form.sundayRate}
                  onChange={e => setForm(p => ({ ...p, sundayRate: e.target.value }))}
                  min="0"
                  className="input-premium"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 16, fontWeight: 700, borderColor: 'rgba(245,158,11,0.25)' }}
                />
              </div>
            </div>
          </div>

          {/* Section: PIX */}
          <div style={{ marginBottom: 24, padding: '20px', borderRadius: 16, background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={13} color="#06b6d4" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--card-sub)' }}>{t.pixKeySection}</span>
            </div>
            {/* Tipo de chave — pills horizontais */}
            <label style={{ display: 'block', fontSize: 11, color: 'var(--card-muted)', marginBottom: 8 }}>{t.pixKeyTypeLabel}</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {PIX_KEY_TYPES.map(pt => {
                const sel = form.pixKeyType === pt.value
                return (
                  <motion.button
                    key={pt.value}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setForm(p => ({ ...p, pixKeyType: pt.value, pixKey: pt.value === 'cpf' ? p.cpf : '' }))}
                    style={{
                      flex: '1 1 auto', minWidth: 'fit-content',
                      padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${sel ? 'rgba(6,182,212,0.5)' : 'var(--card-border)'}`,
                      background: sel ? 'rgba(6,182,212,0.1)' : 'var(--inner-bg)',
                      color: sel ? '#06b6d4' : 'var(--card-muted)',
                      fontSize: 13, fontWeight: sel ? 700 : 400,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      whiteSpace: 'nowrap', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${sel ? '#06b6d4' : 'var(--card-border)'}`,
                      background: sel ? '#06b6d4' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {sel && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    {pt.label}
                  </motion.button>
                )
              })}
            </div>

            {/* Chave — largura total */}
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(6,182,212,0.8)', marginBottom: 6 }}>
              {PIX_KEY_TYPES.find(pt => pt.value === form.pixKeyType)?.label || 'Chave'}
            </label>
            <input
              value={form.pixKey}
              onChange={e => setForm(p => ({ ...p, pixKey: e.target.value }))}
              placeholder={
                form.pixKeyType === 'cpf'    ? '000.000.000-00' :
                form.pixKeyType === 'phone'  ? '+55 (11) 99999-9999' :
                form.pixKeyType === 'email'  ? 'email@exemplo.com' :
                t.randomKeyPlaceholder
              }
              className="input-premium"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14, fontFamily: 'monospace', borderColor: 'rgba(6,182,212,0.2)' }}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 10, fontSize: 13,
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#f43f5e',
            }}>
              {error}
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                border: '1px solid var(--card-border)',
                background: 'var(--inner-bg)', color: 'var(--card-sub)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {t.cancel}
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary"
              style={{ flex: 2, padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}
            >
              {worker ? t.saveChanges : t.registerWorkerBtn}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
