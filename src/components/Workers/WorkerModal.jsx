import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, DollarSign, MapPin, Clock, Check, QrCode } from 'lucide-react'
import { DEPARTMENTS, JOB_TITLES, PIX_KEY_TYPES } from '../../data/mockData'
import { useIsMobile } from '../../hooks/useIsMobile'
import i18n from '../../i18n'


const Field = ({ label, children }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {label}
    </label>
    {children}
  </div>
)

export default function WorkerModal({ lang = 'pt', worker, locations, onSave, onClose }) {
  const isMobile = useIsMobile()
  const t = i18n[lang] ?? i18n.pt
  const [form, setForm] = useState({
    name: worker?.name || '',
    department: worker?.department || DEPARTMENTS[0],
    jobTitle: worker?.jobTitle || JOB_TITLES[0],
    schedule: worker?.schedule || '',
    weekdayRate: worker?.weekdayRate || 150,
    saturdayRate: worker?.saturdayRate || 220,
    sundayRate: worker?.sundayRate || 220,
    locations: worker?.locations || [],
    status: worker?.status || 'active',
    phone: worker?.phone || '',
    pixKeyType: worker?.pixKeyType || 'cpf',
    pixKey: worker?.pixKey || '',
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
    if (!form.name.trim() || form.locations.length === 0) return
    onSave(form)
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
          background: 'linear-gradient(135deg, #161628 0%, #111120 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Modal header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '26px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky', top: 0,
          background: 'linear-gradient(135deg, #161628 0%, #111120 100%)',
          zIndex: 10,
        }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              {worker ? t.editWorkerTitle : t.newWorkerTitle}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              {t.workerModalSubtitle}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s',
            }}
          >
            <X size={16} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
          {/* Section: Identificação */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={13} color="#818cf8" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{t.identificationSection}</span>
            </div>

            <Field label={t.fullNameLabel}>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder={t.workerNamePlaceholder}
                required
                className="input-premium"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14 }}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <Field label={t.departmentLabel}>
                <select
                  value={form.department}
                  onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  className="input-premium"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label={t.jobTitleLabel}>
                <select
                  value={form.jobTitle}
                  onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))}
                  className="input-premium"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}
                >
                  {JOB_TITLES.map(jt => <option key={jt} value={jt}>{jt}</option>)}
                </select>
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
          </div>

          {/* Section: Remuneração */}
          <div style={{ marginBottom: 24, padding: '20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={13} color="#f59e0b" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{t.remunerationSection}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                  {t.weekdayRateLabel}
                </label>
                <input
                  type="number"
                  value={form.weekdayRate}
                  onChange={e => setForm(p => ({ ...p, weekdayRate: +e.target.value }))}
                  min="0"
                  className="input-premium"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 16, fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,158,11,0.7)', marginBottom: 6 }}>
                  Sábado (R$)
                </label>
                <input
                  type="number"
                  value={form.saturdayRate}
                  onChange={e => setForm(p => ({ ...p, saturdayRate: +e.target.value }))}
                  min="0"
                  className="input-premium"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 16, fontWeight: 700, borderColor: 'rgba(245,158,11,0.2)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,158,11,0.7)', marginBottom: 6 }}>
                  Domingo (R$)
                </label>
                <input
                  type="number"
                  value={form.sundayRate}
                  onChange={e => setForm(p => ({ ...p, sundayRate: +e.target.value }))}
                  min="0"
                  className="input-premium"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 16, fontWeight: 700, borderColor: 'rgba(245,158,11,0.2)' }}
                />
              </div>
            </div>
          </div>

          {/* Section: PIX */}
          <div style={{ marginBottom: 24, padding: '20px', borderRadius: 16, background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={13} color="#06b6d4" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{t.pixKeySection}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '160px 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{t.pixKeyTypeLabel}</label>
                <select
                  value={form.pixKeyType}
                  onChange={e => setForm(p => ({ ...p, pixKeyType: e.target.value, pixKey: '' }))}
                  className="input-premium"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}
                >
                  {PIX_KEY_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(6,182,212,0.7)', marginBottom: 6 }}>
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
            </div>
          </div>

          {/* Section: Locais */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={13} color="#10b981" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{t.workLocationsSection}</span>
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
                      border: `1.5px solid ${selected ? loc.color + '60' : 'rgba(255,255,255,0.07)'}`,
                      background: selected ? `${loc.color}12` : 'rgba(255,255,255,0.02)',
                      display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5,
                      background: selected ? loc.color : 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s', flexShrink: 0,
                    }}>
                      {selected && <Check size={11} color="white" />}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: selected ? loc.color : 'rgba(255,255,255,0.6)' }}>{loc.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{loc.city}</div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Footer buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
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
