import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isSameDay, isToday, parseISO, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, ChevronLeft, ChevronRight, Clock, MapPin, Plus, Users, X } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import { getWorkerDayRate, isWeekendOrHoliday } from '../../data/mockData'
import { useIsMobile } from '../../hooks/useIsMobile'
import i18n from '../../i18n'
import { upsertWorkDays } from '../../lib/db'
import { log } from '../../lib/logger'
import SearchableSelect from '../UI/SearchableSelect'

export default function WorkCalendar({ lang = 'pt', workers, workDays, setWorkDays, locations, holidays = [], paymentRecords = [] }) {
  const isMobile = useIsMobile()
  const t = i18n[lang] ?? i18n.pt
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [addForm, setAddForm] = useState({
    workerId: workers[0]?.id,
    locationId: locations[0]?.id,
  })
  const [filterWorker, setFilterWorker] = useState('all')
  const [filterDept, setFilterDept] = useState('all')
  const [workerSearch, setWorkerSearch] = useState('')
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false)
  const [overtimeEntry, setOvertimeEntry] = useState(null)
  const [overtimeHours, setOvertimeHours] = useState('')
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState(null)
  const [addError, setAddError] = useState('')

  const handleSaveOvertime = entry => {
    const worker = workers.find(w => w.id === entry.workerId)
    const amount = parseFloat(overtimeHours) || 0
    const updated = {
      ...entry,
      overtime: amount,
      earnings: entry.rate + amount + (entry.bonus || 0),
    }
    setWorkDays(prev => prev.map(d => (d.id === updated.id ? updated : d)))
    upsertWorkDays([updated]).catch(() => {
      /* estado local já atualizado; realtime reconcilia depois */
    })
    log('add_overtime', `Hora extra: ${worker?.name ?? 'Diarista'} — R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${entry.date}`)
    setOvertimeEntry(null)
    setOvertimeHours('')
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart)

  const workerById = useMemo(() => Object.fromEntries(workers.map(w => [w.id, w])), [workers])
  const departments = useMemo(() => [...new Set(workers.map(w => w.department).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [workers])

  const filteredDays = useMemo(
    () =>
      workDays.filter(d => {
        const matchWorker = filterWorker === 'all' || d.workerId === filterWorker
        const matchDept = filterDept === 'all' || workerById[d.workerId]?.department === filterDept
        return matchWorker && matchDept
      }),
    [workDays, filterWorker, filterDept, workerById],
  )

  // Índice date → entries: cada célula do calendário vira uma consulta O(1)
  const entriesByDate = useMemo(() => {
    const map = new Map()
    for (const d of filteredDays) {
      const arr = map.get(d.date)
      if (arr) arr.push(d)
      else map.set(d.date, [d])
    }
    return map
  }, [filteredDays])

  const getDayEntries = date => entriesByDate.get(format(date, 'yyyy-MM-dd')) ?? []

  const handleAddEntry = () => {
    if (!selectedDay || !addForm.workerId || !addForm.locationId) return
    const dateStr = format(selectedDay, 'yyyy-MM-dd')
    const worker = workers.find(w => w.id === addForm.workerId)
    const isSpecial = isWeekendOrHoliday(dateStr, holidays)
    const rate = getWorkerDayRate(worker, dateStr, holidays)

    const exists = workDays.some(d => d.workerId === addForm.workerId && d.date === dateStr)
    if (exists) {
      setAddError(`${worker?.name ? worker.name + ' — ' : ''}${t.alreadyRegistered}`)
      return
    }

    setAddError('')
    const newEntry = {
      id: `${addForm.workerId}-${dateStr}`,
      workerId: addForm.workerId,
      date: dateStr,
      locationId: addForm.locationId,
      isWeekend: isSpecial,
      rate,
      earnings: rate,
    }
    setWorkDays(prev => [...prev, newEntry])
    setShowAddPanel(false)
    setWorkerSearch('')
  }

  const removeEntry = entryId => {
    setWorkDays(prev => prev.filter(d => d.id !== entryId))
  }

  const selectedDateStr = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null
  const selectedEntries = selectedDay ? getDayEntries(selectedDay) : []
  const isSelectedSpecial = selectedDateStr ? isWeekendOrHoliday(selectedDateStr, holidays) : false

  const monthPrefix = format(currentMonth, 'yyyy-MM')
  const { monthTotal, monthDaysCount } = useMemo(() => {
    const inMonth = filteredDays.filter(d => d.date.startsWith(monthPrefix))
    return {
      monthTotal: inMonth.reduce((s, d) => s + d.earnings, 0),
      monthDaysCount: inMonth.length,
    }
  }, [filteredDays, monthPrefix])

  // When a specific worker is filtered (and no day selected), show all their work days
  const filterWorkerObj = filterWorker !== 'all' ? workers.find(w => w.id === filterWorker) : null
  const workerHistory = useMemo(() => (filterWorkerObj ? [...filteredDays].sort((a, b) => b.date.localeCompare(a.date)) : []), [filteredDays, filterWorkerObj])
  const workerHistoryTotal = workerHistory.reduce((s, d) => s + d.earnings, 0)

  // Paid-day lookup: workDay id -> paidDate (from confirmed payment records)
  const paidDateByDayId = useMemo(() => {
    const map = {}
    for (const r of paymentRecords || []) {
      for (const id of r.workDayIds || []) map[id] = r.paidDate
    }
    return map
  }, [paymentRecords])
  const isPaid = entry => entry.id in paidDateByDayId

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Main calendar */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'flex-end',
              flexWrap: 'wrap',
              gap: isMobile ? 12 : 0,
              marginBottom: 20,
            }}>
            <div>
              <h1
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: isMobile ? 24 : 30,
                  fontWeight: 800,
                  color: 'var(--page-heading)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}>
                {t.timeTrackingTitle}
              </h1>
              <p
                style={{
                  margin: '6px 0 0',
                  color: 'var(--page-sub)',
                  fontSize: 14,
                }}>
                {monthDaysCount} {t.daysRegistered} · R$ {monthTotal.toLocaleString('pt-BR')} {t.thisMonth}
              </p>
            </div>
            {/* Filters — department + worker */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                width: isMobile ? '100%' : 'auto',
              }}>
              <SearchableSelect
                value={filterDept}
                onChange={v => {
                  setFilterDept(v)
                  if (v !== 'all' && filterWorker !== 'all' && workerById[filterWorker]?.department !== v) {
                    setFilterWorker('all')
                  }
                }}
                options={[{ value: 'all', label: t.allDepts }, ...departments.map(d => ({ value: d, label: d }))]}
                placeholder={t.allDepts}
                minWidth={isMobile ? '100%' : 190}
              />
              <SearchableSelect value={filterWorker} onChange={setFilterWorker} options={[{ value: 'all', label: t.allWorkers }, ...workers.filter(w => filterDept === 'all' || w.department === filterDept).map(w => ({ value: w.id, label: w.name }))]} placeholder={t.allWorkers} minWidth={isMobile ? '100%' : 230} />
            </div>
          </div>

          {/* Month nav */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: 'var(--card-shadow)',
              borderRadius: 16,
              padding: '14px 20px',
            }}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: '1px solid var(--card-border)',
                background: 'var(--inner-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--card-sub)',
              }}>
              <ChevronLeft size={16} />
            </motion.button>
            <div
              style={{
                flex: 1,
                textAlign: 'center',
                fontFamily: 'Syne, sans-serif',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--card-heading)',
                letterSpacing: '-0.01em',
                textTransform: 'capitalize',
              }}>
              {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: '1px solid var(--card-border)',
                background: 'var(--inner-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--card-sub)',
              }}>
              <ChevronRight size={16} />
            </motion.button>
          </div>
        </motion.div>

        {/* Calendar grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            borderRadius: 20,
            padding: '20px',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
          }}>
          {/* Day headers */}
          <div
            translate="no"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(7, 1fr) ${isMobile ? 40 : 60}px`,
              gap: 4,
              marginBottom: 8,
            }}>
            {t.dayNames.map((name, i) => (
              <div
                key={name}
                style={{
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: i === 0 || i === 6 ? 'rgba(245,158,11,0.6)' : 'var(--card-muted)',
                  padding: '6px 0',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}>
                {name}
              </div>
            ))}
            <div
              style={{
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: '#818cf8',
                padding: '6px 0',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
              {t.totalCol}
            </div>
          </div>

          {/* Day cells + total semanal */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(7, 1fr) ${isMobile ? 40 : 60}px`,
              gap: 4,
            }}>
            {(() => {
              const cells = [...Array.from({ length: startPad }, () => null), ...days]
              while (cells.length % 7 !== 0) cells.push(null)
              const weeks = []
              for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
              return weeks.map((week, wi) => {
                const weekCount = week.reduce((s, d) => s + (d ? getDayEntries(d).length : 0), 0)
                return (
                  <Fragment key={`week-${wi}`}>
                    {week.map((day, di) => {
                      if (!day) return <div key={`pad-${wi}-${di}`} />
                      const entries = getDayEntries(day)
                      const isSelected = selectedDay && isSameDay(day, selectedDay)
                      const isSpecial = isWeekendOrHoliday(format(day, 'yyyy-MM-dd'), holidays)
                      const dayOfWeek = getDay(day)
                      const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6
                      const todayDay = isToday(day)
                      const paidCount = entries.filter(e => isPaid(e)).length
                      const allPaid = entries.length > 0 && paidCount === entries.length
                      const somePaid = paidCount > 0 && !allPaid

                      return (
                        <motion.div
                          key={day.toISOString()}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            setSelectedDay(prev => (prev && isSameDay(prev, day) ? null : day))
                            setAddError('')
                          }}
                          style={{
                            minHeight: 70,
                            borderRadius: 12,
                            padding: '8px 8px 6px',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            border: isSelected ? '1.5px solid rgba(99,102,241,0.5)' : todayDay ? '1.5px solid rgba(99,102,241,0.2)' : '1px solid var(--inner-border)',
                            background: isSelected ? 'rgba(99,102,241,0.12)' : entries.length > 0 ? (isSpecial ? 'rgba(245,158,11,0.06)' : 'rgba(99,102,241,0.05)') : isWeekendDay ? 'var(--inner-bg)' : 'transparent',
                            transition: 'all 0.15s',
                          }}>
                          {allPaid ? (
                            <div
                              title={t.statusPaid}
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                background: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 4px rgba(16,185,129,0.5)',
                              }}>
                              <Check size={9} color="#fff" strokeWidth={3} />
                            </div>
                          ) : somePaid ? (
                            <div
                              title={t.statusPaid}
                              style={{
                                position: 'absolute',
                                top: 5,
                                right: 5,
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: '#10b981',
                                opacity: 0.65,
                              }}
                            />
                          ) : todayDay && !isSelected ? (
                            <div
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: '#6366f1',
                              }}
                            />
                          ) : null}
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: todayDay ? 700 : 500,
                              color: isSelected ? '#818cf8' : isWeekendDay ? 'rgba(245,158,11,0.7)' : 'var(--card-sub)',
                              marginBottom: 4,
                            }}>
                            {format(day, 'd')}
                          </div>
                          {entries.length > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                              }}>
                              {entries.slice(0, 3).map(entry => {
                                const loc = locations.find(l => l.id === entry.locationId)
                                return (
                                  <motion.div
                                    key={entry.id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    style={{
                                      height: 4,
                                      borderRadius: 2,
                                      background: loc?.color || '#6366f1',
                                      opacity: 0.8,
                                    }}
                                  />
                                )
                              })}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  fontSize: 10,
                                  color: isSelected ? '#818cf8' : 'var(--card-muted)',
                                  fontWeight: 700,
                                }}>
                                <Users size={10} strokeWidth={2.5} />
                                {entries.length}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                    {/* Total da semana */}
                    <div
                      style={{
                        minHeight: 70,
                        borderRadius: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        background: weekCount > 0 ? 'rgba(99,102,241,0.06)' : 'transparent',
                        border: `1px dashed ${weekCount > 0 ? 'rgba(99,102,241,0.3)' : 'var(--inner-border)'}`,
                      }}>
                      {weekCount > 0 && (
                        <>
                          <Users size={isMobile ? 10 : 12} strokeWidth={2.5} color="#818cf8" />
                          <span
                            style={{
                              fontSize: isMobile ? 11 : 13,
                              fontWeight: 800,
                              color: '#818cf8',
                            }}>
                            {weekCount}
                          </span>
                        </>
                      )}
                    </div>
                  </Fragment>
                )
              })
            })()}
          </div>

          {/* Total do mês */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 10,
            }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 100,
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                fontSize: 12,
                fontWeight: 700,
                color: '#818cf8',
              }}>
              <Users size={13} strokeWidth={2.5} />
              {monthDaysCount} {t.thisMonth}
            </div>
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid var(--inner-border)',
              flexWrap: 'wrap',
            }}>
            {locations.map(loc => (
              <div key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 10,
                    height: 4,
                    borderRadius: 2,
                    background: loc.color,
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--card-muted)' }}>{loc.name}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Check size={9} color="#fff" strokeWidth={3} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--card-muted)' }}>{t.statusPaid}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Day details — full width, below the calendar */}
      <div style={{ width: '100%' }}>
        <AnimatePresence mode="wait">
          {selectedDay ? (
            <motion.div
              key="day-panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                boxShadow: 'var(--card-shadow)',
                borderRadius: 20,
                padding: '24px',
                backdropFilter: 'blur(20px)',
              }}>
              {/* Header row: date + badge (left), total + add (right) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 20,
                }}>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--card-muted)',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>
                    {t.selectedDay}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}>
                    <span
                      style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 22,
                        fontWeight: 800,
                        color: 'var(--card-heading)',
                        letterSpacing: '-0.02em',
                        textTransform: 'capitalize',
                      }}>
                      {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                    </span>
                    {isSelectedSpecial && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: 100,
                          background: 'rgba(245,158,11,0.12)',
                          border: '1px solid rgba(245,158,11,0.2)',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#f59e0b',
                        }}>
                        {t.weekendHoliday}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}>
                  {selectedEntries.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        borderRadius: 12,
                        background: 'rgba(16,185,129,0.06)',
                        border: '1px solid rgba(16,185,129,0.1)',
                      }}>
                      <span style={{ fontSize: 12, color: 'var(--card-muted)' }}>{t.dayTotal}</span>
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: '#10b981',
                        }}>
                        R$ {selectedEntries.reduce((s, d) => s + d.earnings, 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {!showAddPanel && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setShowAddPanel(true)
                        setWorkerSearch('')
                        setAddForm({
                          workerId: '',
                          locationId: locations[0]?.id,
                        })
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 600,
                        border: '1px dashed rgba(99,102,241,0.3)',
                        background: 'rgba(99,102,241,0.05)',
                        color: '#818cf8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}>
                      <Plus size={15} />
                      {t.addRecord}
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Add entry form */}
              <AnimatePresence>
                {showAddPanel && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: 14,
                        background: 'rgba(99,102,241,0.06)',
                        border: '1px solid rgba(99,102,241,0.15)',
                        marginBottom: 16,
                        maxWidth: 460,
                      }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#818cf8',
                          marginBottom: 12,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                        {t.registerWork}
                      </div>
                      <div style={{ marginBottom: 10, position: 'relative' }}>
                        <label
                          style={{
                            fontSize: 11,
                            color: 'var(--card-muted)',
                            display: 'block',
                            marginBottom: 5,
                          }}>
                          {t.workerLabel}
                        </label>
                        <input
                          type="text"
                          value={workerSearch}
                          onChange={e => {
                            setWorkerSearch(e.target.value)
                            setShowWorkerDropdown(true)
                            setAddError('')
                            if (!e.target.value) setAddForm(p => ({ ...p, workerId: '' }))
                          }}
                          onFocus={() => setShowWorkerDropdown(true)}
                          placeholder="Digite o nome..."
                          className="input-premium"
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: 10,
                            fontSize: 13,
                            boxSizing: 'border-box',
                          }}
                          autoComplete="off"
                          autoFocus
                        />
                        {showWorkerDropdown &&
                          workerSearch.length > 0 &&
                          (() => {
                            const matches = workers.filter(w => w.status === 'active' && w.name.toLowerCase().includes(workerSearch.toLowerCase()))
                            return matches.length > 0 ? (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  right: 0,
                                  zIndex: 100,
                                  background: 'var(--card-bg)',
                                  border: '1px solid var(--card-border)',
                                  borderRadius: 10,
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                  maxHeight: 180,
                                  overflowY: 'auto',
                                  marginTop: 4,
                                }}>
                                {matches.map(w => (
                                  <div
                                    key={w.id}
                                    onMouseDown={() => {
                                      setAddForm(p => ({
                                        ...p,
                                        workerId: w.id,
                                      }))
                                      setWorkerSearch(w.name)
                                      setShowWorkerDropdown(false)
                                      setAddError('')
                                    }}
                                    style={{
                                      padding: '9px 12px',
                                      fontSize: 13,
                                      cursor: 'pointer',
                                      color: 'var(--card-heading)',
                                      borderBottom: '1px solid var(--inner-border)',
                                      transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--inner-bg)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    {w.name}
                                  </div>
                                ))}
                              </div>
                            ) : null
                          })()}
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label
                          style={{
                            fontSize: 11,
                            color: 'var(--card-muted)',
                            display: 'block',
                            marginBottom: 5,
                          }}>
                          {t.locationLabel}
                        </label>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {locations.map(l => {
                            const sel = addForm.locationId === l.id
                            return (
                              <motion.button
                                key={l.id}
                                type="button"
                                whileTap={{ scale: 0.96 }}
                                onClick={() =>
                                  setAddForm(p => ({
                                    ...p,
                                    locationId: l.id,
                                  }))
                                }
                                style={{
                                  flex: 1,
                                  minWidth: 'fit-content',
                                  padding: '8px 10px',
                                  borderRadius: 9,
                                  cursor: 'pointer',
                                  border: `1.5px solid ${sel ? l.color + '70' : 'var(--inner-border)'}`,
                                  background: sel ? `${l.color}18` : 'var(--inner-bg)',
                                  color: sel ? l.color : 'var(--card-muted)',
                                  fontSize: 12,
                                  fontWeight: sel ? 700 : 400,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  transition: 'all 0.15s',
                                }}>
                                <div
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: l.color,
                                    opacity: sel ? 1 : 0.4,
                                    flexShrink: 0,
                                  }}
                                />
                                {l.name}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                      {addError && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{
                            marginBottom: 12,
                            padding: '9px 12px',
                            borderRadius: 10,
                            background: 'rgba(244,63,94,0.08)',
                            border: '1px solid rgba(244,63,94,0.25)',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#f43f5e',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                          }}>
                          <AlertCircle size={14} style={{ flexShrink: 0 }} />
                          {addError}
                        </motion.div>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => {
                            setShowAddPanel(false)
                            setWorkerSearch('')
                            setAddError('')
                          }}
                          style={{
                            flex: 1,
                            padding: '9px',
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 500,
                            border: '1px solid var(--card-border)',
                            background: 'var(--inner-bg)',
                            color: 'var(--card-muted)',
                            cursor: 'pointer',
                          }}>
                          {t.cancel}
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={handleAddEntry}
                          className="btn-primary"
                          style={{
                            flex: 2,
                            padding: '9px',
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 600,
                          }}>
                          {t.register}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Entries — responsive grid */}
              {selectedEntries.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 10,
                  }}>
                  {selectedEntries.map((entry, i) => {
                    const worker = workers.find(w => w.id === entry.workerId)
                    const loc = locations.find(l => l.id === entry.locationId)
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        style={{
                          padding: '14px',
                          borderRadius: 14,
                          background: 'var(--inner-bg)',
                          border: '1px solid var(--card-border)',
                          position: 'relative',
                        }}>
                        {confirmDeleteEntry === entry.id ? (
                          <div
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              display: 'flex',
                              gap: 4,
                              alignItems: 'center',
                            }}>
                            <span
                              style={{
                                fontSize: 10,
                                color: '#f43f5e',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}>
                              Excluir?
                            </span>
                            <button
                              onClick={() => {
                                removeEntry(entry.id)
                                setConfirmDeleteEntry(null)
                              }}
                              style={{
                                padding: '3px 7px',
                                borderRadius: 5,
                                cursor: 'pointer',
                                background: 'rgba(244,63,94,0.15)',
                                border: '1px solid rgba(244,63,94,0.35)',
                                color: '#f43f5e',
                                fontSize: 10,
                                fontWeight: 700,
                              }}>
                              Sim
                            </button>
                            <button
                              onClick={() => setConfirmDeleteEntry(null)}
                              style={{
                                padding: '3px 7px',
                                borderRadius: 5,
                                cursor: 'pointer',
                                background: 'rgba(100,116,139,0.1)',
                                border: '1px solid rgba(100,116,139,0.2)',
                                color: 'var(--card-dim)',
                                fontSize: 10,
                                fontWeight: 700,
                              }}>
                              Não
                            </button>
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setConfirmDeleteEntry(entry.id)}
                            style={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              border: 'none',
                              background: 'rgba(244,63,94,0.1)',
                              color: '#f43f5e',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: 11,
                            }}>
                            <X size={11} />
                          </motion.button>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 8,
                          }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: `${worker?.avatarColor}20`,
                              border: `1.5px solid ${worker?.avatarColor}30`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 700,
                              color: worker?.avatarColor,
                            }}>
                            {worker?.avatar}
                          </div>
                          <div style={{ flex: 1, minWidth: 0, paddingRight: 18 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--card-heading)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={worker?.name}>
                              {worker?.name}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: 'var(--card-muted)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                              {worker?.jobTitle}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                          }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                            }}>
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: loc?.color,
                              }}
                            />
                            <span
                              style={{
                                fontSize: 11,
                                color: loc?.color,
                                fontWeight: 600,
                              }}>
                              {loc?.shortName}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span
                              style={{
                                fontSize: 15,
                                fontWeight: 800,
                                color: entry.isWeekend ? '#f59e0b' : '#818cf8',
                              }}>
                              R$ {entry.earnings}
                            </span>
                            {(entry.overtime || 0) > 0 && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: '#f59e0b',
                                  fontWeight: 600,
                                }}>
                                +R$ {entry.overtime.toFixed(2)} HE
                              </div>
                            )}
                          </div>
                        </div>

                        {isPaid(entry) && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              marginBottom: 8,
                              padding: '5px 9px',
                              borderRadius: 8,
                              background: 'rgba(16,185,129,0.1)',
                              border: '1px solid rgba(16,185,129,0.2)',
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#10b981',
                            }}>
                            <Check size={11} strokeWidth={3} />
                            {t.paidOn} {format(parseISO(paidDateByDayId[entry.id]), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        )}

                        {/* Overtime */}
                        {overtimeEntry === entry.id ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                            }}>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr auto auto',
                                gap: 4,
                                alignItems: 'center',
                              }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  color: 'var(--card-muted)',
                                  whiteSpace: 'nowrap',
                                }}>
                                R$:
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={overtimeHours}
                                onChange={e => setOvertimeHours(e.target.value)}
                                placeholder="0"
                                autoFocus
                                style={{
                                  width: '100%',
                                  padding: '5px 6px',
                                  borderRadius: 7,
                                  fontSize: 12,
                                  border: '1px solid rgba(99,102,241,0.3)',
                                  background: 'var(--card-bg)',
                                  color: 'var(--card-heading)',
                                  outline: 'none',
                                  boxSizing: 'border-box',
                                }}
                              />
                              <button
                                onClick={() => handleSaveOvertime(entry)}
                                style={{
                                  padding: '5px 6px',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  background: 'rgba(16,185,129,0.12)',
                                  border: '1px solid rgba(16,185,129,0.3)',
                                  color: '#10b981',
                                  display: 'flex',
                                  alignItems: 'center',
                                  flexShrink: 0,
                                }}>
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => {
                                  setOvertimeEntry(null)
                                  setOvertimeHours('')
                                }}
                                style={{
                                  padding: '5px 6px',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  background: 'rgba(100,116,139,0.1)',
                                  border: '1px solid rgba(100,116,139,0.2)',
                                  color: 'var(--card-dim)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  flexShrink: 0,
                                }}>
                                <X size={12} />
                              </button>
                            </div>
                            {parseFloat(overtimeHours) > 0 && <div style={{ fontSize: 10, color: '#10b981' }}>+ R$ {(parseFloat(overtimeHours) || 0).toFixed(2)}</div>}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setOvertimeEntry(entry.id)
                              setOvertimeHours((entry.overtime || 0) > 0 ? String(entry.overtime) : '')
                            }}
                            style={{
                              width: '100%',
                              padding: '5px 10px',
                              borderRadius: 7,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 5,
                              background: (entry.overtime || 0) > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.06)',
                              border: `1px solid ${(entry.overtime || 0) > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(99,102,241,0.15)'}`,
                              color: (entry.overtime || 0) > 0 ? '#f59e0b' : 'var(--card-sub)',
                            }}>
                            <Clock size={11} />
                            {(entry.overtime || 0) > 0 ? `HE: R$ ${entry.overtime.toFixed(2)}` : '+ Hora Extra'}
                          </button>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '32px 0',
                    color: 'var(--card-dim)',
                  }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: 13 }}>{t.noRecordsThisDay}</div>
                </div>
              )}
            </motion.div>
          ) : filterWorkerObj ? (
            <motion.div
              key="worker-history"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                boxShadow: 'var(--card-shadow)',
                borderRadius: 20,
                padding: '24px',
                backdropFilter: 'blur(20px)',
              }}>
              {/* Header: worker info + totals */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 20,
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: `${filterWorkerObj.avatarColor}20`,
                      border: `1.5px solid ${filterWorkerObj.avatarColor}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      color: filterWorkerObj.avatarColor,
                      flexShrink: 0,
                    }}>
                    {filterWorkerObj.avatar}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--card-muted)',
                        marginBottom: 2,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}>
                      {t.workerHistoryTitle}
                    </div>
                    <div
                      style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 20,
                        fontWeight: 800,
                        color: 'var(--card-heading)',
                        letterSpacing: '-0.02em',
                      }}>
                      {filterWorkerObj.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--card-muted)' }}>{filterWorkerObj.jobTitle}</div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      borderRadius: 12,
                      background: 'rgba(99,102,241,0.06)',
                      border: '1px solid rgba(99,102,241,0.12)',
                    }}>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#818cf8',
                      }}>
                      {workerHistory.length}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--card-muted)' }}>{t.daysWorkedLabel}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      borderRadius: 12,
                      background: 'rgba(16,185,129,0.06)',
                      border: '1px solid rgba(16,185,129,0.1)',
                    }}>
                    <span style={{ fontSize: 12, color: 'var(--card-muted)' }}>{t.totalEarned}</span>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#10b981',
                      }}>
                      R$ {workerHistoryTotal.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* History table */}
              {workerHistory.length > 0 ? (
                <div
                  style={{
                    border: '1px solid var(--inner-border)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    maxHeight: 460,
                    overflowY: 'auto',
                  }}>
                  {/* Table header */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.3fr 1fr auto',
                      gap: 12,
                      padding: '10px 16px',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      background: 'var(--inner-bg)',
                      borderBottom: '1px solid var(--inner-border)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--card-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                    <span>{t.dateCol}</span>
                    <span>{t.locationLabel}</span>
                    <span style={{ textAlign: 'right' }}>{t.valueCol}</span>
                  </div>
                  {/* Rows */}
                  {workerHistory.map((entry, i) => {
                    const loc = locations.find(l => l.id === entry.locationId)
                    const date = parseISO(entry.date)
                    return (
                      <div
                        key={entry.id}
                        onClick={() => {
                          setCurrentMonth(date)
                          setSelectedDay(date)
                        }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.3fr 1fr auto',
                          gap: 12,
                          padding: '12px 16px',
                          alignItems: 'center',
                          cursor: 'pointer',
                          borderBottom: i < workerHistory.length - 1 ? '1px solid var(--inner-border)' : 'none',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--inner-bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: entry.isWeekend ? '#f59e0b' : 'var(--card-heading)',
                            textTransform: 'capitalize',
                          }}>
                          {format(date, 'EEE, dd MMM yyyy', { locale: ptBR })}
                        </span>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            minWidth: 0,
                          }}>
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: loc?.color,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: 12,
                              color: 'var(--card-sub)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                            {loc?.name}
                          </span>
                        </span>
                        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: entry.isWeekend ? '#f59e0b' : '#818cf8',
                            }}>
                            R$ {entry.earnings}
                          </span>
                          {(entry.overtime || 0) > 0 && (
                            <span
                              style={{
                                fontSize: 10,
                                color: '#f59e0b',
                                fontWeight: 600,
                                marginLeft: 6,
                              }}>
                              +R$ {entry.overtime.toFixed(2)} HE
                            </span>
                          )}
                          {isPaid(entry) && (
                            <div
                              style={{
                                fontSize: 10,
                                color: '#10b981',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: 3,
                                marginTop: 2,
                              }}>
                              <Check size={10} strokeWidth={3} />
                              {t.paidOn} {format(parseISO(paidDateByDayId[entry.id]), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '32px 0',
                    color: 'var(--card-dim)',
                  }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: 13 }}>{t.noDaysRegistered}</div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                boxShadow: 'var(--card-shadow)',
                borderRadius: 20,
                padding: '40px 24px',
                textAlign: 'center',
              }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--card-heading)',
                  marginBottom: 6,
                }}>
                {t.selectADay}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--card-muted)',
                  lineHeight: 1.5,
                }}>
                {t.clickAnyDay}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
