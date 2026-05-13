import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, subMonths, addMonths, isSameDay, parseISO, isToday
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, X, MapPin, Users } from 'lucide-react'
import { isWeekendOrHoliday } from '../../data/mockData'
import { useIsMobile } from '../../hooks/useIsMobile'
import i18n from '../../i18n'

export default function WorkCalendar({ lang = 'pt', workers, workDays, setWorkDays, locations, holidays = [] }) {
  const isMobile = useIsMobile()
  const t = i18n[lang] ?? i18n.pt
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [addForm, setAddForm] = useState({ workerId: workers[0]?.id, locationId: locations[0]?.id })
  const [filterWorker, setFilterWorker] = useState('all')

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart)

  const filteredDays = filterWorker === 'all'
    ? workDays
    : workDays.filter(d => d.workerId === filterWorker)

  const getDayEntries = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return filteredDays.filter(d => d.date === dateStr)
  }

  const handleAddEntry = () => {
    if (!selectedDay || !addForm.workerId || !addForm.locationId) return
    const dateStr = format(selectedDay, 'yyyy-MM-dd')
    const worker = workers.find(w => w.id === addForm.workerId)
    const isSpecial = isWeekendOrHoliday(dateStr, holidays)
    const rate = isSpecial ? worker.weekendRate : worker.weekdayRate

    const exists = workDays.some(d => d.workerId === addForm.workerId && d.date === dateStr)
    if (exists) return

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
  }

  const removeEntry = (entryId) => {
    setWorkDays(prev => prev.filter(d => d.id !== entryId))
  }

  const selectedDateStr = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null
  const selectedEntries = selectedDay ? getDayEntries(selectedDay) : []
  const isSelectedSpecial = selectedDateStr ? isWeekendOrHoliday(selectedDateStr, holidays) : false

  const monthTotal = filteredDays
    .filter(d => d.date.startsWith(format(currentMonth, 'yyyy-MM')))
    .reduce((s, d) => s + d.earnings, 0)

  const monthDaysCount = filteredDays
    .filter(d => d.date.startsWith(format(currentMonth, 'yyyy-MM'))).length

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 20 }}>
      {/* Main calendar */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', flexWrap: 'wrap', gap: isMobile ? 12 : 0, marginBottom: 20 }}>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: isMobile ? 24 : 30, fontWeight: 800, color: 'var(--page-heading)', margin: 0, letterSpacing: '-0.02em' }}>
                {t.timeTrackingTitle}
              </h1>
              <p style={{ margin: '6px 0 0', color: 'var(--page-sub)', fontSize: 14 }}>
                {monthDaysCount} {t.daysRegistered} · R$ {monthTotal.toLocaleString('pt-BR')} {t.thisMonth}
              </p>
            </div>
            {/* Worker filter */}
            <select
              value={filterWorker}
              onChange={e => setFilterWorker(e.target.value)}
              className="input-premium"
              style={{ padding: '10px 16px', borderRadius: 12, fontSize: 13, cursor: 'pointer', minWidth: isMobile ? '100%' : 200 }}
            >
              <option value="all">{t.allWorkers}</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          {/* Month nav */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            borderRadius: 16, padding: '14px 20px',
          }}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              style={{
                width: 34, height: 34, borderRadius: 8, border: '1px solid var(--card-border)',
                background: 'var(--inner-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--card-sub)',
              }}
            >
              <ChevronLeft size={16} />
            </motion.button>
            <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--card-heading)', letterSpacing: '-0.01em', textTransform: 'capitalize' }}>
              {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              style={{
                width: 34, height: 34, borderRadius: 8, border: '1px solid var(--card-border)',
                background: 'var(--inner-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--card-sub)',
              }}
            >
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
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            borderRadius: 20, padding: '20px', flex: 1,
            backdropFilter: 'blur(20px)', overflow: 'hidden',
          }}
        >
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {t.dayNames.map((name, i) => (
              <div key={name} style={{
                textAlign: 'center', fontSize: 11, fontWeight: 600,
                color: i === 0 || i === 6 ? 'rgba(245,158,11,0.6)' : 'var(--card-muted)',
                padding: '6px 0', letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                {name}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {/* Padding cells */}
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {/* Actual days */}
            {days.map((day) => {
              const entries = getDayEntries(day)
              const isSelected = selectedDay && isSameDay(day, selectedDay)
              const isSpecial = isWeekendOrHoliday(format(day, 'yyyy-MM-dd'), holidays)
              const dayOfWeek = getDay(day)
              const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6
              const todayDay = isToday(day)

              return (
                <motion.div
                  key={day.toISOString()}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedDay(prev => prev && isSameDay(prev, day) ? null : day)}
                  style={{
                    minHeight: 70, borderRadius: 12, padding: '8px 8px 6px',
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    border: isSelected
                      ? '1.5px solid rgba(99,102,241,0.5)'
                      : todayDay
                      ? '1.5px solid rgba(99,102,241,0.2)'
                      : '1px solid var(--inner-border)',
                    background: isSelected
                      ? 'rgba(99,102,241,0.12)'
                      : entries.length > 0
                      ? isSpecial ? 'rgba(245,158,11,0.06)' : 'rgba(99,102,241,0.05)'
                      : isWeekendDay ? 'var(--inner-bg)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {todayDay && !isSelected && (
                    <div style={{ position: 'absolute', top: 4, right: 4, width: 5, height: 5, borderRadius: '50%', background: '#6366f1' }} />
                  )}
                  <div style={{
                    fontSize: 13, fontWeight: todayDay ? 700 : 500,
                    color: isSelected
                      ? '#818cf8'
                      : isWeekendDay ? 'rgba(245,158,11,0.7)' : 'var(--card-sub)',
                    marginBottom: 4,
                  }}>
                    {format(day, 'd')}
                  </div>
                  {entries.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {entries.slice(0, 3).map((entry, i) => {
                        const loc = locations.find(l => l.id === entry.locationId)
                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{
                              height: 4, borderRadius: 2,
                              background: loc?.color || '#6366f1',
                              opacity: 0.8,
                            }}
                          />
                        )
                      })}
                      {entries.length > 3 && (
                        <div style={{ fontSize: 9, color: 'var(--card-muted)', fontWeight: 600 }}>
                          +{entries.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--inner-border)' }}>
            {locations.map(loc => (
              <div key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 4, borderRadius: 2, background: loc.color }} />
                <span style={{ fontSize: 11, color: 'var(--card-muted)' }}>{loc.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Side panel */}
      <div style={{ width: isMobile ? '100%' : 300, flexShrink: 0 }}>
        <AnimatePresence mode="wait">
          {selectedDay ? (
            <motion.div
              key="day-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              style={{
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                boxShadow: 'var(--card-shadow)',
                borderRadius: 20, padding: '24px',
                backdropFilter: 'blur(20px)', overflowY: 'auto',
              }}
            >
              {/* Day header */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--card-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t.selectedDay}
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--card-heading)', letterSpacing: '-0.02em', textTransform: 'capitalize' }}>
                  {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                </div>
                {isSelectedSpecial && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8,
                    padding: '4px 10px', borderRadius: 100,
                    background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)',
                    fontSize: 11, fontWeight: 600, color: '#f59e0b',
                  }}>
                    {t.weekendHoliday}
                  </div>
                )}
              </div>

              {/* Entries */}
              {selectedEntries.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {selectedEntries.map((entry, i) => {
                    const worker = workers.find(w => w.id === entry.workerId)
                    const loc = locations.find(l => l.id === entry.locationId)
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          padding: '14px', borderRadius: 14,
                          background: 'var(--inner-bg)', border: '1px solid var(--card-border)',
                          position: 'relative',
                        }}
                      >
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeEntry(entry.id)}
                          style={{
                            position: 'absolute', top: 10, right: 10,
                            width: 22, height: 22, borderRadius: 6, border: 'none',
                            background: 'rgba(244,63,94,0.1)', color: '#f43f5e',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: 11,
                          }}
                        >
                          <X size={11} />
                        </motion.button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: `${worker?.avatarColor}20`, border: `1.5px solid ${worker?.avatarColor}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700, color: worker?.avatarColor,
                          }}>
                            {worker?.avatar}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--card-heading)' }}>{worker?.name.split(' ')[0]}</div>
                            <div style={{ fontSize: 10, color: 'var(--card-muted)' }}>{worker?.jobTitle}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: loc?.color }} />
                            <span style={{ fontSize: 11, color: loc?.color, fontWeight: 600 }}>{loc?.shortName}</span>
                          </div>
                          <span style={{ fontSize: 15, fontWeight: 800, color: entry.isWeekend ? '#f59e0b' : '#818cf8' }}>
                            R$ {entry.earnings}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--card-dim)', marginBottom: 16 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: 13 }}>{t.noRecordsThisDay}</div>
                </div>
              )}

              {/* Total */}
              {selectedEntries.length > 0 && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.1)',
                  marginBottom: 16,
                }}>
                  <span style={{ fontSize: 12, color: 'var(--card-muted)' }}>{t.dayTotal}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>
                    R$ {selectedEntries.reduce((s, d) => s + d.earnings, 0).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              {/* Add entry form */}
              <AnimatePresence>
                {showAddPanel ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t.registerWork}
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: 11, color: 'var(--card-muted)', display: 'block', marginBottom: 5 }}>{t.workerLabel}</label>
                        <select
                          value={addForm.workerId}
                          onChange={e => setAddForm(p => ({ ...p, workerId: e.target.value }))}
                          className="input-premium"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}
                        >
                          {workers.filter(w => w.status === 'active').map(w => (
                            <option key={w.id} value={w.id}>{w.name.split(' ')[0]} {w.name.split(' ').slice(-1)}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, color: 'var(--card-muted)', display: 'block', marginBottom: 5 }}>{t.locationLabel}</label>
                        <select
                          value={addForm.locationId}
                          onChange={e => setAddForm(p => ({ ...p, locationId: e.target.value }))}
                          className="input-premium"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}
                        >
                          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setShowAddPanel(false)}
                          style={{
                            flex: 1, padding: '9px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                            border: '1px solid var(--card-border)', background: 'var(--inner-bg)',
                            color: 'var(--card-muted)', cursor: 'pointer',
                          }}
                        >{t.cancel}</button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={handleAddEntry}
                          className="btn-primary"
                          style={{ flex: 2, padding: '9px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}
                        >
                          {t.register}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowAddPanel(true)}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                      border: '1px dashed rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)',
                      color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.2s',
                    }}
                  >
                    <Plus size={15} />
                    {t.addRecord}
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="empty-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                boxShadow: 'var(--card-shadow)',
                borderRadius: 20, padding: '32px 24px', textAlign: 'center',
                height: 300,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--card-heading)', marginBottom: 6 }}>
                {t.selectADay}
              </div>
              <div style={{ fontSize: 13, color: 'var(--card-muted)', lineHeight: 1.5 }}>
                {t.clickAnyDay}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
