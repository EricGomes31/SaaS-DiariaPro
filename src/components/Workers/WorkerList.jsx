import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Clock, Check, X } from 'lucide-react'
import { DEPARTMENTS, JOB_TITLES, getWorkerStats, isWeekendOrHoliday, getWorkerDayRate } from '../../data/mockData'
import { format } from 'date-fns'
import WorkerModal from './WorkerModal'
import WorkerProfile from './WorkerProfile'
import { useIsMobile } from '../../hooks/useIsMobile'
import i18n from '../../i18n'
import { upsertWorkDays } from '../../lib/db'

const TODAY = format(new Date(), 'yyyy-MM-dd')

export default function WorkerList({ lang = 'pt', workers, setWorkers, workDays, setWorkDays, locations, holidays = [] }) {
  const isMobile = useIsMobile()
  const t = i18n[lang] ?? i18n.pt
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLocation, setFilterLocation] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editWorker, setEditWorker] = useState(null)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [registeringWorker, setRegisteringWorker] = useState(null)
  const [overtimeWorker, setOvertimeWorker] = useState(null)
  const [overtimeValue, setOvertimeValue] = useState('')

  const filtered = useMemo(() => workers.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.jobTitle.toLowerCase().includes(search.toLowerCase())
    const matchDept = filterDept === 'all' || w.department === filterDept
    const matchStatus = filterStatus === 'all' || w.status === filterStatus
    const matchLocation = filterLocation === 'all' || w.locations.includes(filterLocation)
    return matchSearch && matchDept && matchStatus && matchLocation
  }), [workers, search, filterDept, filterStatus, filterLocation])

  const getOvertimeHourlyRate = (worker) => worker.department === 'Total' ? 15 : 10

  const handleAddOvertime = (worker, hours) => {
    const hourlyRate = getOvertimeHourlyRate(worker)
    const amount = (parseFloat(hours) || 0) * hourlyRate
    const todayWD = workDays.find(d => d.workerId === worker.id && d.date === TODAY)
    if (!todayWD) return
    const updatedWD = { ...todayWD, overtime: amount, earnings: todayWD.rate + amount }
    setWorkDays(prev => prev.map(d => d.id === updatedWD.id ? updatedWD : d))
    upsertWorkDays([updatedWD]).catch(() => {})
    setOvertimeWorker(null)
    setOvertimeValue('')
  }

  const handleAddWorkDay = (day) => setWorkDays(prev => [...prev, day])
  const handleDeleteWorkDay = (dayId) => setWorkDays(prev => prev.filter(d => d.id !== dayId))

  const handleToggleStatus = (workerId) => {
    setWorkers(prev => prev.map(w =>
      w.id === workerId ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' } : w
    ))
    setRegisteringWorker(null)
  }

  const confirmAttendance = (worker, locationId) => {
    const isSpecial = isWeekendOrHoliday(TODAY, holidays)
    const rate = getWorkerDayRate(worker, TODAY, holidays)
    handleAddWorkDay({
      id: `${worker.id}-${TODAY}-${Date.now()}`,
      workerId: worker.id,
      date: TODAY,
      locationId,
      isWeekend: isSpecial,
      rate,
      earnings: rate,
    })
    setRegisteringWorker(null)
  }

  const handleAttendanceClick = (e, worker, locations) => {
    e.stopPropagation()
    if (registeringWorker === worker.id) {
      setRegisteringWorker(null)
      return
    }
    if (locations.length === 1) {
      confirmAttendance(worker, locations[0].id)
    } else {
      setRegisteringWorker(worker.id)
    }
  }

  const handleSave = (data) => {
    if (editWorker) {
      setWorkers(prev => prev.map(w => w.id === editWorker.id ? { ...w, ...data } : w))
    } else {
      const newWorker = {
        ...data,
        id: `w${Date.now()}`,
        avatar: data.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        avatarColor: ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 6)],
      }
      setWorkers(prev => [...prev, newWorker])
    }
    setShowModal(false)
    setEditWorker(null)
  }

  if (selectedWorker) {
    return (
      <WorkerProfile
        lang={lang}
        worker={selectedWorker}
        workDays={workDays}
        locations={locations}
        holidays={holidays}
        onAddWorkDay={handleAddWorkDay}
        onDeleteWorkDay={handleDeleteWorkDay}
        onBack={() => setSelectedWorker(null)}
        onEdit={(w) => { setEditWorker(w); setShowModal(true); setSelectedWorker(null) }}
      />
    )
  }

  return (
    <div onClick={() => { setRegisteringWorker(null); setOvertimeWorker(null); setOvertimeValue('') }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', flexWrap: 'wrap', gap: isMobile ? 16 : 0 }}>
          <div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: isMobile ? 24 : 30, fontWeight: 800,
              color: 'var(--page-heading)', margin: 0, letterSpacing: '-0.02em',
            }}>
              {t.workersTitle}
            </h1>
            <p style={{ margin: '8px 0 0', color: 'var(--page-sub)', fontSize: 15 }}>
              {workers.filter(w => w.status === 'active').length} {t.activeLabel} · {workers.length} {t.totalLabel}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setEditWorker(null); setShowModal(true) }}
            className="btn-primary"
            style={{ padding: '12px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={16} />
            {t.newWorker}
          </motion.button>
        </div>
      </motion.div>

      {/* Filters bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--card-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="input-premium"
            style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 12, fontSize: 14 }}
          />
        </div>

        {/* Dept filter */}
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="input-premium"
          style={{ padding: '11px 16px', borderRadius: 12, fontSize: 14, cursor: 'pointer', minWidth: 160 }}
        >
          <option value="all">{t.allDepts}</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Location filter */}
        <select
          value={filterLocation}
          onChange={e => setFilterLocation(e.target.value)}
          className="input-premium"
          style={{ padding: '11px 16px', borderRadius: 12, fontSize: 14, cursor: 'pointer', minWidth: 160 }}
        >
          <option value="all">{t.allLocations}</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'active', 'inactive'].map(s => (
            <motion.button
              key={s}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                border: `1px solid ${filterStatus === s ? 'rgba(99,102,241,0.4)' : 'var(--card-border)'}`,
                background: filterStatus === s ? 'rgba(99,102,241,0.15)' : 'var(--inner-bg)',
                color: filterStatus === s ? '#818cf8' : 'var(--card-sub)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {{ all: t.filterAll, active: t.filterActive, inactive: t.filterInactive }[s]}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Worker grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        <AnimatePresence>
          {filtered.map((worker, i) => {
            const stats = getWorkerStats(worker.id, workDays)
            const workerLocations = locations.filter(l => worker.locations.includes(l.id))
            const todayWorkDay = workDays.find(d => d.workerId === worker.id && d.date === TODAY)
            const registeredToday = !!todayWorkDay
            const currentOvertime = todayWorkDay?.overtime || 0
            const isPickingLocation = registeringWorker === worker.id
            const isAddingOvertime = overtimeWorker === worker.id

            return (
              <motion.div
                key={worker.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="card-hover"
                onClick={() => { setRegisteringWorker(null); setSelectedWorker(worker) }}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  boxShadow: 'var(--card-shadow)',
                  borderRadius: 18, padding: '22px',
                  cursor: 'pointer', position: 'relative',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Top gradient line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, ${worker.avatarColor}60, transparent)`,
                  borderRadius: '18px 18px 0 0',
                }} />

                {/* Status badge */}
                <div style={{
                  position: 'absolute', top: 18, right: 18,
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 100,
                  background: worker.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                  border: `1px solid ${worker.status === 'active' ? 'rgba(16,185,129,0.25)' : 'rgba(100,116,139,0.2)'}`,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: worker.status === 'active' ? '#10b981' : '#64748b',
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: worker.status === 'active' ? '#10b981' : '#64748b' }}>
                    {worker.status === 'active' ? t.statusActive : t.statusInactive}
                  </span>
                </div>

                {/* Avatar + info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 14,
                    background: `${worker.avatarColor}20`,
                    border: `2px solid ${worker.avatarColor}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800, color: worker.avatarColor, flexShrink: 0,
                  }}>
                    {worker.avatar}
                  </div>
                  <div style={{ overflow: 'hidden', paddingRight: 60 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--card-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {worker.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--card-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {worker.jobTitle}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div style={{ background: 'var(--inner-bg)', borderRadius: 10, padding: '12px', border: '1px solid var(--inner-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--card-muted)', marginBottom: 4 }}>{t.weekLabel}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--card-heading)' }}>R$ {worker.weekdayRate}</div>
                    <div style={{ fontSize: 10, color: 'var(--card-dim)' }}>{t.perDay}</div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.05)', borderRadius: 10, padding: '12px', border: '1px solid rgba(245,158,11,0.1)' }}>
                    <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.6)', marginBottom: 4 }}>Sábado</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>R$ {worker.saturdayRate}</div>
                    <div style={{ fontSize: 10, color: 'rgba(245,158,11,0.4)' }}>{t.perDay}</div>
                  </div>
                </div>

                {/* Earnings summary */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.1)',
                  marginBottom: 14,
                }}>
                  <span style={{ fontSize: 12, color: 'var(--card-sub)' }}>{stats.totalDays} {t.daysWorkedLabel}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>R$ {stats.totalEarnings.toLocaleString('pt-BR')}</span>
                </div>

                {/* Locations */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {workerLocations.map(loc => (
                    <span
                      key={loc.id}
                      style={{
                        padding: '3px 9px', borderRadius: 100,
                        fontSize: 11, fontWeight: 600,
                        background: `${loc.color}15`, color: loc.color,
                        border: `1px solid ${loc.color}25`,
                      }}
                    >
                      {loc.shortName}
                    </span>
                  ))}
                </div>

                {/* ── Bottom actions ── */}
                <div
                  onClick={e => e.stopPropagation()}
                  style={{ borderTop: '1px solid var(--inner-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {worker.status === 'active' ? (
                    <>
                      {/* Attendance */}
                      {registeredToday ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                            padding: '9px 14px', borderRadius: 10,
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                          }}>
                            <Check size={14} color="#10b981" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>{t.registeredToday}</span>
                          </div>

                          {/* Overtime section */}
                          {isAddingOvertime ? (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.15 }}
                              onClick={e => e.stopPropagation()}
                              style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                            >
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: 'var(--card-muted)', whiteSpace: 'nowrap' }}>Horas:</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={overtimeValue}
                                  onChange={e => setOvertimeValue(e.target.value)}
                                  placeholder="0"
                                  autoFocus
                                  onClick={e => e.stopPropagation()}
                                  style={{
                                    flex: 1, padding: '6px 10px', borderRadius: 8,
                                    border: '1px solid rgba(99,102,241,0.3)',
                                    background: 'var(--inner-bg)', color: 'var(--card-heading)',
                                    fontSize: 13, outline: 'none', minWidth: 0,
                                  }}
                                />
                                <button
                                  onClick={() => handleAddOvertime(worker, overtimeValue)}
                                  style={{
                                    padding: '6px 8px', borderRadius: 7, cursor: 'pointer',
                                    background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                                    color: '#10b981', display: 'flex', alignItems: 'center',
                                  }}
                                >
                                  <Check size={13} />
                                </button>
                                <button
                                  onClick={() => { setOvertimeWorker(null); setOvertimeValue('') }}
                                  style={{
                                    padding: '6px 8px', borderRadius: 7, cursor: 'pointer',
                                    background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)',
                                    color: 'var(--card-dim)', display: 'flex', alignItems: 'center',
                                  }}
                                >
                                  <X size={13} />
                                </button>
                              </div>
                              {parseFloat(overtimeValue) > 0 && (
                                <div style={{ fontSize: 11, color: '#10b981', paddingLeft: 2 }}>
                                  {overtimeValue}h × R${getOvertimeHourlyRate(worker)}/h = R$ {((parseFloat(overtimeValue) || 0) * getOvertimeHourlyRate(worker)).toFixed(2)}
                                </div>
                              )}
                            </motion.div>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={e => { e.stopPropagation(); setOvertimeWorker(worker.id); setOvertimeValue('') }}
                              style={{
                                width: '100%', padding: '7px 14px', borderRadius: 9, cursor: 'pointer',
                                fontSize: 12, fontWeight: 600,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                background: currentOvertime > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.06)',
                                border: `1px solid ${currentOvertime > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(99,102,241,0.2)'}`,
                                color: currentOvertime > 0 ? '#f59e0b' : 'var(--card-sub)',
                                transition: 'all 0.2s',
                              }}
                            >
                              <Clock size={12} />
                              {currentOvertime > 0
                                ? `${t.overtimeRegistered}: R$ ${currentOvertime.toLocaleString('pt-BR')}`
                                : t.addOvertime}
                            </motion.button>
                          )}
                        </div>
                      ) : isPickingLocation ? (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {t.selectLocation}
                            </span>
                            <button
                              onClick={() => setRegisteringWorker(null)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--card-dim)', display: 'flex', padding: 2 }}
                            >
                              <X size={13} />
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {workerLocations.map(loc => (
                              <motion.button
                                key={loc.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => confirmAttendance(worker, loc.id)}
                                style={{
                                  padding: '7px 12px', borderRadius: 9, cursor: 'pointer',
                                  fontSize: 12, fontWeight: 700,
                                  background: `${loc.color}18`, color: loc.color,
                                  border: `1px solid ${loc.color}35`,
                                  flex: 1, minWidth: 'fit-content',
                                }}
                              >
                                {loc.shortName} — {loc.name}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={e => handleAttendanceClick(e, worker, workerLocations)}
                          style={{
                            width: '100%', padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                            fontSize: 13, fontWeight: 600,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                            background: `${worker.avatarColor}12`,
                            border: `1px solid ${worker.avatarColor}30`,
                            color: worker.avatarColor,
                            transition: 'all 0.2s',
                          }}
                        >
                          <Clock size={14} />
                          {t.registerToday}
                        </motion.button>
                      )}

                      {/* Deactivate */}
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleToggleStatus(worker.id)}
                        style={{
                          width: '100%', padding: '7px 14px', borderRadius: 9, cursor: 'pointer',
                          fontSize: 12, fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)',
                          color: '#f43f5e', transition: 'all 0.2s',
                        }}
                      >
                        {t.deactivate}
                      </motion.button>
                    </>
                  ) : (
                    /* Activate button for inactive workers */
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleToggleStatus(worker.id)}
                      style={{
                        width: '100%', padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                        fontSize: 13, fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                        color: '#10b981', transition: 'all 0.2s',
                      }}
                    >
                      {t.activateWorker}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '60px 0', color: 'var(--card-muted)' }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{t.noWorkersFound}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{t.tryAdjustFilters}</div>
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <WorkerModal
            lang={lang}
            worker={editWorker}
            locations={locations}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditWorker(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
