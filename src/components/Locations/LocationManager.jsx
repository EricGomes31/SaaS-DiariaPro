import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Briefcase, Building2, Clock, Layers, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useIsMobile } from '../../hooks/useIsMobile'
import i18n from '../../i18n'

export default function LocationManager({ lang = 'pt', locations, setLocations, workers, workDays, locationDepartments = [], setLocationDepartments, locationJobTitles = [], setLocationJobTitles, locationSchedules = [], setLocationSchedules }) {
  const isMobile = useIsMobile()
  const t = i18n[lang] ?? i18n.pt
  const [selected, setSelected] = useState(locations[0])
  const [showAdd, setShowAdd] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [newName, setNewName] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [editingLoc, setEditingLoc] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', city: '', address: '' })

  const getLocStats = locId => {
    const days = workDays.filter(d => d.locationId === locId)
    const earnings = days.reduce((s, d) => s + d.earnings, 0)
    const weekendDays = days.filter(d => d.isWeekend).length
    const workerCount = workers.filter(w => w.locations?.includes(locId)).length
    return {
      totalDays: days.length,
      totalEarnings: earnings,
      workerCount,
      weekendDays,
      weekdayDays: days.length - weekendDays,
    }
  }

  const getLocWorkers = locId => {
    return workers.filter(w => w.locations.includes(locId))
  }

  const selStats = selected ? getLocStats(selected.id) : null
  const selWorkers = selected ? getLocWorkers(selected.id) : []

  // Dados de comparação entre locais (barras de total pago)
  const comparisonData = locations.map(loc => {
    const s = getLocStats(loc.id)
    return {
      name: loc.shortName || loc.name,
      total: Math.round(s.totalEarnings),
      color: loc.color,
    }
  })

  const handleAdd = () => {
    if (!newName.trim()) return
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4']
    const newLoc = {
      id: `loc${Date.now()}`,
      name: newName,
      color: colors[locations.length % colors.length],
      shortName: newName.slice(0, 2).toUpperCase(),
      address: newAddress,
      city: newCity,
    }
    setLocations(prev => [...prev, newLoc])
    setSelected(newLoc)
    setShowAdd(false)
    setNewName('')
    setNewCity('')
    setNewAddress('')
  }

  const handleDelete = locId => {
    const remaining = locations.filter(l => l.id !== locId)
    setLocations(remaining)
    setDeletingId(null)
    if (selected?.id === locId) {
      setSelected(remaining[0] || null)
    }
  }

  const startEdit = loc => {
    setEditingLoc(loc)
    setEditForm({
      name: loc.name,
      city: loc.city || '',
      address: loc.address || '',
    })
  }

  const handleSaveEdit = () => {
    if (!editForm.name.trim()) return
    const updated = {
      ...editingLoc,
      name: editForm.name.trim(),
      city: editForm.city.trim(),
      address: editForm.address.trim(),
      shortName: editForm.name.trim().slice(0, 2).toUpperCase(),
    }
    setLocations(prev => prev.map(l => (l.id === editingLoc.id ? updated : l)))
    if (selected?.id === editingLoc.id) setSelected(updated)
    setEditingLoc(null)
  }

  const allStats = locations.map(loc => {
    const s = getLocStats(loc.id)
    return { ...loc, ...s }
  })

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'flex-end',
            flexWrap: 'wrap',
            gap: isMobile ? 16 : 0,
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
              {t.workLocationsTitle}
            </h1>
            <p
              style={{
                margin: '8px 0 0',
                color: 'var(--page-sub)',
                fontSize: 15,
              }}>
              {locations.length} {t.locationsRegistered}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAdd(true)}
            className="btn-primary"
            style={{
              padding: '12px 22px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
            <Plus size={16} />
            {t.newLocation}
          </motion.button>
        </div>
      </motion.div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '320px 1fr',
          gap: 20,
        }}>
        {/* Location list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allStats.map((loc, i) => {
            const isConfirming = deletingId === loc.id
            return (
              <motion.div
                key={loc.id}
                layout
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                transition={{ delay: i * 0.06 }}
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: `1.5px solid ${isConfirming ? 'rgba(244,63,94,0.35)' : selected?.id === loc.id ? loc.color + '40' : 'var(--card-border)'}`,
                  transition: 'border-color 0.2s',
                }}>
                {/* Main card row */}
                <div
                  onClick={() => {
                    if (!isConfirming) setSelected(loc)
                  }}
                  style={{
                    padding: '18px 20px',
                    cursor: isConfirming ? 'default' : 'pointer',
                    background: isConfirming ? 'rgba(244,63,94,0.05)' : selected?.id === loc.id ? `${loc.color}12` : 'var(--card-bg)',
                    transition: 'background 0.2s',
                    position: 'relative',
                  }}>
                  {selected?.id === loc.id && !isConfirming && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        background: loc.color,
                        borderRadius: '0 2px 2px 0',
                      }}
                    />
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 12,
                    }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 11,
                        background: `${loc.color}20`,
                        border: `1.5px solid ${loc.color}35`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                      <Building2 size={18} color={loc.color} />
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: selected?.id === loc.id ? loc.color : 'var(--card-heading)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                        {loc.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--card-muted)',
                          marginTop: 1,
                        }}>
                        {loc.city || t.noCity}
                      </div>
                    </div>

                    {/* Delete trigger button */}
                    <motion.button
                      whileHover={{
                        scale: 1.1,
                        background: 'rgba(244,63,94,0.15)',
                      }}
                      whileTap={{ scale: 0.92 }}
                      onClick={e => {
                        e.stopPropagation()
                        setDeletingId(isConfirming ? null : loc.id)
                      }}
                      title={t.deleteLocation}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        border: 'none',
                        flexShrink: 0,
                        background: isConfirming ? 'rgba(244,63,94,0.18)' : 'var(--inner-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}>
                      <Trash2 size={14} color={isConfirming ? '#f43f5e' : 'var(--card-muted)'} />
                    </motion.button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 6,
                    }}>
                    {[
                      { label: t.daysLabel, value: loc.totalDays },
                      { label: t.workersLabel, value: loc.workerCount },
                      {
                        label: t.totalCol,
                        value: `R$${Math.round(loc.totalEarnings / 1000)}k`,
                      },
                    ].map((s, j) => (
                      <div
                        key={j}
                        style={{
                          textAlign: 'center',
                          padding: '8px 2px',
                          borderRadius: 8,
                          background: 'var(--inner-bg)',
                          border: '1px solid var(--inner-border)',
                          overflow: 'hidden',
                        }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--card-heading)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                          {s.value}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'var(--card-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inline confirmation strip */}
                <AnimatePresence>
                  {isConfirming && (
                    <motion.div initial={{ opacity: 0, gridTemplateRows: '0fr' }} animate={{ opacity: 1, gridTemplateRows: '1fr' }} exit={{ opacity: 0, gridTemplateRows: '0fr' }} transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }} style={{ display: 'grid', overflow: 'hidden' }}>
                      <div style={{ overflow: 'hidden', minHeight: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '12px 16px',
                            background: 'rgba(244,63,94,0.08)',
                            borderTop: '1px solid rgba(244,63,94,0.2)',
                          }}>
                          <AlertTriangle size={14} color="#f43f5e" style={{ flexShrink: 0 }} />
                          <span
                            style={{
                              flex: 1,
                              fontSize: 12,
                              color: 'var(--card-sub)',
                              lineHeight: 1.4,
                            }}>
                            {t.deleteLocation} <strong style={{ color: 'var(--card-heading)' }}>{loc.name}</strong>?
                          </span>
                          <button
                            onClick={() => setDeletingId(null)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 7,
                              fontSize: 12,
                              fontWeight: 600,
                              border: '1px solid var(--card-border)',
                              background: 'var(--inner-bg)',
                              color: 'var(--card-sub)',
                              cursor: 'pointer',
                            }}>
                            {t.cancel}
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => handleDelete(loc.id)}
                            style={{
                              padding: '5px 14px',
                              borderRadius: 7,
                              fontSize: 12,
                              fontWeight: 700,
                              border: 'none',
                              background: '#f43f5e',
                              color: 'white',
                              cursor: 'pointer',
                              boxShadow: '0 4px 12px rgba(244,63,94,0.35)',
                            }}>
                            {t.deleteBtn}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}

          {/* Add location inline */}
          <AnimatePresence>
            {showAdd && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  padding: '20px',
                  borderRadius: 16,
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#818cf8',
                    marginBottom: 14,
                  }}>
                  {t.newLocationTitle}
                </div>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder={t.locationNamePlaceholder}
                  className="input-premium"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                />
                <input
                  value={newCity}
                  onChange={e => setNewCity(e.target.value)}
                  placeholder={t.cityPlaceholder}
                  className="input-premium"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                />
                <input
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  placeholder={t.addressPlaceholder}
                  className="input-premium"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    fontSize: 14,
                    marginBottom: 12,
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setShowAdd(false)}
                    style={{
                      flex: 1,
                      padding: '9px',
                      borderRadius: 9,
                      border: '1px solid var(--card-border)',
                      background: 'transparent',
                      color: 'var(--card-sub)',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}>
                    {t.cancel}
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAdd}
                    className="btn-primary"
                    style={{
                      flex: 2,
                      padding: '9px',
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 600,
                    }}>
                    {t.addBtn}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {selected && selStats && (
            <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {/* Hero banner */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${selected.color}15 0%, var(--card-bg) 70%)`,
                  border: `1px solid ${selected.color}25`,
                  borderRadius: 20,
                  padding: isMobile ? '20px 16px' : '28px',
                  marginBottom: 16,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                <div
                  style={{
                    position: 'absolute',
                    top: -30,
                    right: -30,
                    width: 160,
                    height: 160,
                    background: `radial-gradient(circle, ${selected.color}20 0%, transparent 70%)`,
                    borderRadius: '50%',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}>
                  <div
                    style={{
                      width: isMobile ? 44 : 56,
                      height: isMobile ? 44 : 56,
                      borderRadius: 15,
                      background: `${selected.color}20`,
                      border: `2px solid ${selected.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                    <Building2 size={isMobile ? 20 : 24} color={selected.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      style={{
                        margin: 0,
                        fontFamily: 'Syne, sans-serif',
                        fontSize: isMobile ? 18 : 24,
                        fontWeight: 800,
                        color: 'var(--card-heading)',
                        letterSpacing: '-0.02em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                      {selected.name}
                    </h2>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: 4,
                        flexWrap: 'wrap',
                      }}>
                      {selected.address && (
                        <span
                          style={{
                            fontSize: 12,
                            color: 'var(--card-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                          }}>
                          <MapPin size={11} /> {selected.address}
                        </span>
                      )}
                      {selected.city && <span style={{ fontSize: 12, color: 'var(--card-muted)' }}>{selected.city}</span>}
                    </div>
                  </div>

                  {/* Edit from detail panel */}
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      background: 'rgba(99,102,241,0.15)',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startEdit(selected)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: isMobile ? '8px' : '9px 16px',
                      borderRadius: 10,
                      border: '1px solid rgba(99,102,241,0.25)',
                      background: 'rgba(99,102,241,0.08)',
                      color: '#818cf8',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      flexShrink: 0,
                      width: isMobile ? 36 : 'auto',
                      height: isMobile ? 36 : 'auto',
                      justifyContent: 'center',
                    }}>
                    <Pencil size={14} />
                    {!isMobile && t.editLocation}
                  </motion.button>

                  {/* Delete from detail panel */}
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      background: 'rgba(244,63,94,0.15)',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDeletingId(selected.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: isMobile ? '8px' : '9px 16px',
                      borderRadius: 10,
                      border: '1px solid rgba(244,63,94,0.25)',
                      background: 'rgba(244,63,94,0.08)',
                      color: '#f43f5e',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      flexShrink: 0,
                      width: isMobile ? 36 : 'auto',
                      height: isMobile ? 36 : 'auto',
                      justifyContent: 'center',
                    }}>
                    <Trash2 size={14} />
                    {!isMobile && t.deleteLocation}
                  </motion.button>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                    gap: isMobile ? 8 : 12,
                    marginTop: 20,
                  }}>
                  {[
                    {
                      label: t.totalDaysStatLabel,
                      value: selStats.totalDays,
                      color: selected.color,
                    },
                    {
                      label: t.workersLabel,
                      value: selStats.workerCount,
                      color: '#10b981',
                    },
                    {
                      label: t.totalPaidStatLabel,
                      value: `R$ ${selStats.totalEarnings.toLocaleString('pt-BR')}`,
                      color: '#f59e0b',
                    },
                    {
                      label: t.weekendDaysStatLabel,
                      value: selStats.weekendDays,
                      color: '#8b5cf6',
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      style={{
                        padding: isMobile ? '10px 8px' : '14px',
                        borderRadius: 12,
                        background: 'var(--inner-bg)',
                        border: '1px solid var(--inner-border)',
                        overflow: 'hidden',
                      }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--card-muted)',
                          marginBottom: 4,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                        {s.label}
                      </div>
                      <div
                        style={{
                          fontFamily: 'Syne, sans-serif',
                          fontSize: isMobile ? 16 : 20,
                          fontWeight: 800,
                          color: s.color,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparison bar chart */}
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  boxShadow: 'var(--card-shadow)',
                  borderRadius: 18,
                  padding: '22px',
                  marginBottom: 16,
                }}>
                <h3
                  style={{
                    margin: '0 0 4px',
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--card-heading)',
                  }}>
                  {t.locationComparison}
                </h3>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--card-muted)',
                    marginBottom: 16,
                  }}>
                  {t.totalPaidStatLabel}
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={comparisonData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--inner-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--card-sub)', fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'var(--card-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                      contentStyle={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={v => [`R$ ${Number(v).toLocaleString('pt-BR')}`, t.totalPaidStatLabel]}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={80}>
                      {comparisonData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Workers assigned */}
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  boxShadow: 'var(--card-shadow)',
                  borderRadius: 18,
                  padding: '22px',
                }}>
                <h3
                  style={{
                    margin: '0 0 16px',
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--card-heading)',
                  }}>
                  {t.assignedWorkers} ({selWorkers.length})
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 10,
                  }}>
                  {selWorkers.map(w => (
                    <div
                      key={w.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px',
                        borderRadius: 12,
                        background: `${w.avatarColor}08`,
                        border: `1px solid ${w.avatarColor}18`,
                      }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          background: `${w.avatarColor}20`,
                          border: `1.5px solid ${w.avatarColor}35`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: w.avatarColor,
                          flexShrink: 0,
                        }}>
                        {w.avatar}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--card-heading)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                          {w.name.split(' ')[0]}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--card-muted)' }}>{w.status === 'active' ? t.statusActiveSmall : t.statusInactiveSmall}</div>
                      </div>
                    </div>
                  ))}
                  {selWorkers.length === 0 && <div style={{ color: 'var(--card-muted)', fontSize: 13 }}>{t.noWorkersAssigned}</div>}
                </div>
              </div>

              {/* Departamentos do local */}
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  boxShadow: 'var(--card-shadow)',
                  borderRadius: 18,
                  padding: '22px',
                  marginTop: 16,
                }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                  }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: 'rgba(99,102,241,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Layers size={13} color="#818cf8" />
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--card-heading)',
                    }}>
                    {t.departmentsSection}
                  </h3>
                </div>
                <SimpleCatalogManager
                  t={t}
                  items={locationDepartments.filter(d => d.locationId === selected.id)}
                  onAdd={name =>
                    setLocationDepartments(prev => [
                      ...prev,
                      {
                        id: `dept${Date.now()}`,
                        locationId: selected.id,
                        name,
                      },
                    ])
                  }
                  onDelete={id => setLocationDepartments(prev => prev.filter(d => d.id !== id))}
                  placeholder={t.newDepartmentPlaceholder}
                  emptyText={t.noDepartmentsYet}
                  deleteConfirmText={t.deleteDepartment}
                  addLabel={t.newDepartmentTitle}
                />
              </div>

              {/* Cargos do local */}
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  boxShadow: 'var(--card-shadow)',
                  borderRadius: 18,
                  padding: '22px',
                  marginTop: 16,
                }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                  }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: 'rgba(245,158,11,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Briefcase size={13} color="#f59e0b" />
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--card-heading)',
                    }}>
                    {t.jobTitlesSection}
                  </h3>
                </div>
                <JobTitleManager
                  t={t}
                  isMobile={isMobile}
                  items={locationJobTitles.filter(j => j.locationId === selected.id)}
                  onAdd={payload =>
                    setLocationJobTitles(prev => [
                      ...prev,
                      {
                        id: `job${Date.now()}`,
                        locationId: selected.id,
                        ...payload,
                      },
                    ])
                  }
                  onEdit={(id, payload) => setLocationJobTitles(prev => prev.map(j => (j.id === id ? { ...j, ...payload } : j)))}
                  onDelete={id => setLocationJobTitles(prev => prev.filter(j => j.id !== id))}
                />
              </div>

              {/* Horários de trabalho do local */}
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  boxShadow: 'var(--card-shadow)',
                  borderRadius: 18,
                  padding: '22px',
                  marginTop: 16,
                }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                  }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: 'rgba(16,185,129,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Clock size={13} color="#10b981" />
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--card-heading)',
                    }}>
                    {t.schedulesSection}
                  </h3>
                </div>
                <SimpleCatalogManager
                  t={t}
                  items={locationSchedules.filter(s => s.locationId === selected.id)}
                  onAdd={name => setLocationSchedules(prev => [...prev, { id: `sch${Date.now()}`, locationId: selected.id, name }])}
                  onDelete={id => setLocationSchedules(prev => prev.filter(s => s.id !== id))}
                  placeholder={t.newSchedulePlaceholder}
                  emptyText={t.noSchedulesYet}
                  deleteConfirmText={t.deleteSchedule}
                  addLabel={t.newScheduleTitle}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit location modal */}
      <AnimatePresence>
        {editingLoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingLoc(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.25 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 440,
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 20,
                padding: '24px',
                boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
              }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 18,
                }}>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 18,
                    fontWeight: 800,
                    color: 'var(--card-heading)',
                  }}>
                  {t.editLocationTitle}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setEditingLoc(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid var(--card-border)',
                    background: 'var(--inner-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--card-muted)',
                  }}>
                  <X size={15} />
                </motion.button>
              </div>
              <input
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                placeholder={t.locationNamePlaceholder}
                className="input-premium"
                style={{
                  width: '100%',
                  padding: '11px 13px',
                  borderRadius: 11,
                  fontSize: 14,
                  marginBottom: 10,
                  boxSizing: 'border-box',
                }}
              />
              <input
                value={editForm.city}
                onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                placeholder={t.cityPlaceholder}
                className="input-premium"
                style={{
                  width: '100%',
                  padding: '11px 13px',
                  borderRadius: 11,
                  fontSize: 14,
                  marginBottom: 10,
                  boxSizing: 'border-box',
                }}
              />
              <input
                value={editForm.address}
                onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                placeholder={t.addressPlaceholder}
                className="input-premium"
                style={{
                  width: '100%',
                  padding: '11px 13px',
                  borderRadius: 11,
                  fontSize: 14,
                  marginBottom: 16,
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setEditingLoc(null)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: 11,
                    border: '1px solid var(--card-border)',
                    background: 'var(--inner-bg)',
                    color: 'var(--card-sub)',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}>
                  {t.cancel}
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSaveEdit}
                  className="btn-primary"
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: 11,
                    fontSize: 14,
                    fontWeight: 700,
                  }}>
                  {t.saveChanges}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Departamentos do local (lista + adicionar + excluir) ────────────────────
function SimpleCatalogManager({ t, items, onAdd, onDelete, placeholder, emptyText, deleteConfirmText, addLabel }) {
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(name.trim())
    setName('')
    setShowAdd(false)
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: showAdd || items.length > 0 ? 12 : 0,
        }}>
        {items.map(dep => {
          const confirming = deletingId === dep.id
          return (
            <div
              key={dep.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 8px 8px 14px',
                borderRadius: 10,
                background: confirming ? 'rgba(244,63,94,0.08)' : 'var(--inner-bg)',
                border: `1px solid ${confirming ? 'rgba(244,63,94,0.3)' : 'var(--inner-border)'}`,
              }}>
              {confirming ? (
                <>
                  <span style={{ fontSize: 12, color: 'var(--card-sub)' }}>{deleteConfirmText}?</span>
                  <button
                    onClick={() => setDeletingId(null)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--card-muted)',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}>
                    {t.cancel}
                  </button>
                  <button
                    onClick={() => {
                      onDelete(dep.id)
                      setDeletingId(null)
                    }}
                    style={{
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 8px',
                      background: '#f43f5e',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                    }}>
                    {t.deleteBtn}
                  </button>
                </>
              ) : (
                <>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--card-heading)',
                    }}>
                    {dep.name}
                  </span>
                  <button
                    onClick={() => setDeletingId(dep.id)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: 'none',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--card-muted)',
                    }}>
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          )
        })}
        {items.length === 0 && !showAdd && <div style={{ color: 'var(--card-muted)', fontSize: 13 }}>{emptyText}</div>}
      </div>

      {showAdd ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={placeholder}
            className="input-premium"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            }}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={() => {
              setShowAdd(false)
              setName('')
            }}
            style={{
              padding: '0 14px',
              borderRadius: 10,
              border: '1px solid var(--card-border)',
              background: 'var(--inner-bg)',
              color: 'var(--card-sub)',
              cursor: 'pointer',
              fontSize: 13,
            }}>
            {t.cancel}
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAdd}
            className="btn-primary"
            style={{
              padding: '0 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
            }}>
            {t.addBtn}
          </motion.button>
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAdd(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 10,
            border: '1px dashed var(--card-border)',
            background: 'transparent',
            color: '#818cf8',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}>
          <Plus size={13} /> {addLabel}
        </motion.button>
      )}
    </div>
  )
}

// ─── Cargos do local (lista com diária + adicionar + excluir) ────────────────
function JobTitleManager({ t, isMobile, items, onAdd, onEdit, onDelete }) {
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [weekdayRate, setWeekdayRate] = useState(150)
  const [saturdayRate, setSaturdayRate] = useState(220)
  const [sundayRate, setSundayRate] = useState(220)
  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    weekdayRate: 0,
    saturdayRate: 0,
    sundayRate: 0,
  })

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      weekdayRate: parseFloat(weekdayRate) || 0,
      saturdayRate: parseFloat(saturdayRate) || 0,
      sundayRate: parseFloat(sundayRate) || 0,
    })
    setName('')
    setWeekdayRate(150)
    setSaturdayRate(220)
    setSundayRate(220)
    setShowAdd(false)
  }

  const startEdit = job => {
    setDeletingId(null)
    setEditingId(job.id)
    setEditForm({
      name: job.name,
      weekdayRate: job.weekdayRate ?? 0,
      saturdayRate: job.saturdayRate ?? 0,
      sundayRate: job.sundayRate ?? 0,
    })
  }

  const saveEdit = () => {
    if (!editForm.name.trim()) return
    onEdit(editingId, {
      name: editForm.name.trim(),
      weekdayRate: parseFloat(editForm.weekdayRate) || 0,
      saturdayRate: parseFloat(editForm.saturdayRate) || 0,
      sundayRate: parseFloat(editForm.sundayRate) || 0,
    })
    setEditingId(null)
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginBottom: showAdd || items.length > 0 ? 14 : 0,
        }}>
        {items.map(job => {
          const confirming = deletingId === job.id
          const editing = editingId === job.id
          return (
            <div
              key={job.id}
              style={{
                padding: editing ? '14px' : '10px 14px',
                borderRadius: 10,
                background: confirming ? 'rgba(244,63,94,0.08)' : editing ? 'rgba(245,158,11,0.06)' : 'var(--inner-bg)',
                border: `1px solid ${confirming ? 'rgba(244,63,94,0.3)' : editing ? 'rgba(245,158,11,0.25)' : 'var(--inner-border)'}`,
              }}>
              {editing ? (
                <div>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={t.newJobTitlePlaceholder}
                    className="input-premium"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      fontSize: 13,
                      marginBottom: 10,
                      boxSizing: 'border-box',
                    }}
                  />
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                      gap: 8,
                      marginBottom: 12,
                    }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 11,
                          color: 'var(--card-muted)',
                          marginBottom: 5,
                        }}>
                        {t.weekdayRateLabel}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.weekdayRate}
                        onChange={e =>
                          setEditForm(f => ({
                            ...f,
                            weekdayRate: e.target.value,
                          }))
                        }
                        className="input-premium"
                        style={{
                          width: '100%',
                          padding: '9px 11px',
                          borderRadius: 9,
                          fontSize: 13,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 11,
                          color: 'rgba(245,158,11,0.8)',
                          marginBottom: 5,
                        }}>
                        Sábado (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.saturdayRate}
                        onChange={e =>
                          setEditForm(f => ({
                            ...f,
                            saturdayRate: e.target.value,
                          }))
                        }
                        className="input-premium"
                        style={{
                          width: '100%',
                          padding: '9px 11px',
                          borderRadius: 9,
                          fontSize: 13,
                          boxSizing: 'border-box',
                          borderColor: 'rgba(245,158,11,0.25)',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 11,
                          color: 'rgba(245,158,11,0.8)',
                          marginBottom: 5,
                        }}>
                        Domingo (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.sundayRate}
                        onChange={e =>
                          setEditForm(f => ({
                            ...f,
                            sundayRate: e.target.value,
                          }))
                        }
                        className="input-premium"
                        style={{
                          width: '100%',
                          padding: '9px 11px',
                          borderRadius: 9,
                          fontSize: 13,
                          boxSizing: 'border-box',
                          borderColor: 'rgba(245,158,11,0.25)',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: 9,
                        border: '1px solid var(--card-border)',
                        background: 'var(--inner-bg)',
                        color: 'var(--card-sub)',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}>
                      {t.cancel}
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={saveEdit}
                      className="btn-primary"
                      style={{
                        flex: 2,
                        padding: '9px',
                        borderRadius: 9,
                        fontSize: 13,
                        fontWeight: 600,
                      }}>
                      {t.saveChanges}
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--card-heading)',
                    }}>
                    {job.name}
                  </span>
                  {confirming ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--card-sub)' }}>{t.deleteJobTitle}?</span>
                      <button
                        onClick={() => setDeletingId(null)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--card-muted)',
                          cursor: 'pointer',
                          fontSize: 12,
                        }}>
                        {t.cancel}
                      </button>
                      <button
                        onClick={() => {
                          onDelete(job.id)
                          setDeletingId(null)
                        }}
                        style={{
                          border: 'none',
                          borderRadius: 6,
                          padding: '4px 8px',
                          background: '#f43f5e',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 700,
                        }}>
                        {t.deleteBtn}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: 10,
                          fontSize: 12,
                          color: 'var(--card-muted)',
                        }}>
                        <span>
                          Seg-Sex{' '}
                          <strong style={{ color: 'var(--card-heading)' }}>
                            R$
                            {Number(job.weekdayRate ?? 0).toLocaleString('pt-BR')}
                          </strong>
                        </span>
                        <span>
                          Sáb{' '}
                          <strong style={{ color: 'var(--card-heading)' }}>
                            R$
                            {Number(job.saturdayRate ?? 0).toLocaleString('pt-BR')}
                          </strong>
                        </span>
                        <span>
                          Dom{' '}
                          <strong style={{ color: 'var(--card-heading)' }}>
                            R$
                            {Number(job.sundayRate ?? 0).toLocaleString('pt-BR')}
                          </strong>
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                        }}>
                        <button
                          onClick={() => startEdit(job)}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--card-muted)',
                          }}>
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => setDeletingId(job.id)}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--card-muted)',
                          }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {items.length === 0 && !showAdd && <div style={{ color: 'var(--card-muted)', fontSize: 13 }}>{t.noJobTitlesYet}</div>}
      </div>

      {showAdd ? (
        <div
          style={{
            padding: '14px',
            borderRadius: 12,
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t.newJobTitlePlaceholder}
            className="input-premium"
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 10,
              boxSizing: 'border-box',
            }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
              gap: 8,
              marginBottom: 12,
            }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: 'var(--card-muted)',
                  marginBottom: 5,
                }}>
                {t.weekdayRateLabel}
              </label>
              <input
                type="number"
                min="0"
                value={weekdayRate}
                onChange={e => setWeekdayRate(e.target.value)}
                className="input-premium"
                style={{
                  width: '100%',
                  padding: '9px 11px',
                  borderRadius: 9,
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: 'rgba(245,158,11,0.8)',
                  marginBottom: 5,
                }}>
                Sábado (R$)
              </label>
              <input
                type="number"
                min="0"
                value={saturdayRate}
                onChange={e => setSaturdayRate(e.target.value)}
                className="input-premium"
                style={{
                  width: '100%',
                  padding: '9px 11px',
                  borderRadius: 9,
                  fontSize: 13,
                  boxSizing: 'border-box',
                  borderColor: 'rgba(245,158,11,0.25)',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: 'rgba(245,158,11,0.8)',
                  marginBottom: 5,
                }}>
                Domingo (R$)
              </label>
              <input
                type="number"
                min="0"
                value={sundayRate}
                onChange={e => setSundayRate(e.target.value)}
                className="input-premium"
                style={{
                  width: '100%',
                  padding: '9px 11px',
                  borderRadius: 9,
                  fontSize: 13,
                  boxSizing: 'border-box',
                  borderColor: 'rgba(245,158,11,0.25)',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowAdd(false)}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: 9,
                border: '1px solid var(--card-border)',
                background: 'var(--inner-bg)',
                color: 'var(--card-sub)',
                cursor: 'pointer',
                fontSize: 13,
              }}>
              {t.cancel}
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAdd}
              className="btn-primary"
              style={{
                flex: 2,
                padding: '9px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
              }}>
              {t.addBtn}
            </motion.button>
          </div>
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAdd(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 10,
            border: '1px dashed var(--card-border)',
            background: 'transparent',
            color: '#f59e0b',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}>
          <Plus size={13} /> {t.newJobTitleTitle}
        </motion.button>
      )}
    </div>
  )
}
