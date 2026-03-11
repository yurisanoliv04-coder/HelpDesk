'use client'

import React, { useState, useEffect, useId } from 'react'

interface CalEvent {
  id: string
  date: string   // YYYY-MM-DD
  title: string
  color: string
}

const EVENT_COLORS = [
  { value: '#00d9b8', label: 'Ciano' },
  { value: '#38bdf8', label: 'Azul' },
  { value: '#a78bfa', label: 'Roxo' },
  { value: '#f59e0b', label: 'Âmbar' },
  { value: '#f87171', label: 'Vermelho' },
  { value: '#34d399', label: 'Verde' },
]

const PT_MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const PT_DAYS_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function toDateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function todayKey(): string {
  const t = new Date()
  return toDateKey(t.getFullYear(), t.getMonth(), t.getDate())
}

interface CalendarWidgetProps {
  userId: string
}

export function CalendarWidget({ userId }: CalendarWidgetProps) {
  const storageKey = `hd_calendar_${userId}`
  const uid = useId()

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [inputTitle, setInputTitle] = useState('')
  const [inputColor, setInputColor] = useState('#00d9b8')
  const [mounted, setMounted] = useState(false)

  // Load events from localStorage after mount (SSR safe)
  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setEvents(JSON.parse(raw))
    } catch {}
  }, [storageKey])

  function saveEvents(next: CalEvent[]) {
    setEvents(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
  }

  function addEvent() {
    if (!selectedDate || !inputTitle.trim()) return
    const ev: CalEvent = {
      id: `${Date.now()}-${Math.random()}`,
      date: selectedDate,
      title: inputTitle.trim(),
      color: inputColor,
    }
    saveEvents([...events, ev])
    setSelectedDate(null)
    setInputTitle('')
    setInputColor('#00d9b8')
  }

  function removeEvent(id: string) {
    saveEvents(events.filter((e) => e.id !== id))
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay()  // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  const eventsForDate = (dateKey: string) => events.filter(e => e.date === dateKey)

  return (
    <div style={{
      background: '#0d1422',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 18px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p className="section-label">── CALENDÁRIO</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={prevMonth}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3d5068', padding: '2px 6px', fontSize: 14 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00d9b8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#3d5068')}
          >‹</button>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#94a3b8', minWidth: 110, textAlign: 'center' }}>
            {PT_MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3d5068', padding: '2px 6px', fontSize: 14 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00d9b8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#3d5068')}
          >›</button>
        </div>
      </div>

      <div style={{ padding: '12px 14px 14px' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
          {PT_DAYS_SHORT.map(d => (
            <div key={d} style={{
              textAlign: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, color: '#2d4060', fontWeight: 600,
              padding: '2px 0',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 1px' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const dk = toDateKey(year, month, day)
            const isToday = dk === todayKey()
            const dayEvents = mounted ? eventsForDate(dk) : []
            const isSelected = dk === selectedDate

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(isSelected ? null : dk)}
                style={{
                  background: isSelected
                    ? 'rgba(0,217,184,0.12)'
                    : isToday
                    ? 'rgba(0,217,184,0.07)'
                    : 'transparent',
                  border: isToday
                    ? '1px solid rgba(0,217,184,0.4)'
                    : isSelected
                    ? '1px solid rgba(0,217,184,0.5)'
                    : '1px solid transparent',
                  borderRadius: 4,
                  padding: '4px 2px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  transition: 'background 0.1s',
                  minHeight: 36,
                }}
                onMouseEnter={e => {
                  if (!isSelected && !isToday)
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={e => {
                  if (!isSelected && !isToday)
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: isToday ? '#00d9b8' : isSelected ? '#a0d4c9' : '#64748b',
                  fontWeight: isToday ? 700 : 400,
                  lineHeight: 1,
                }}>
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {dayEvents.slice(0, 3).map((ev, ei) => (
                      <span
                        key={ei}
                        title={ev.title}
                        onClick={e => { e.stopPropagation(); removeEvent(ev.id) }}
                        style={{
                          display: 'inline-block',
                          width: 5, height: 5,
                          borderRadius: '50%',
                          background: ev.color,
                          boxShadow: `0 0 3px ${ev.color}80`,
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Inline event input */}
        {selectedDate && (
          <div style={{
            marginTop: 10,
            padding: '12px',
            background: 'rgba(0,217,184,0.05)',
            border: '1px solid rgba(0,217,184,0.18)',
            borderRadius: 6,
          }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#00d9b8', marginBottom: 8 }}>
              + {selectedDate.split('-').reverse().join('/')}
            </p>

            {/* Show existing events for this date */}
            {mounted && eventsForDate(selectedDate).map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: ev.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#94a3b8', flex: 1 }}>{ev.title}</span>
                <button
                  onClick={() => removeEvent(ev.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 13, padding: '0 2px', lineHeight: 1 }}
                  title="Remover"
                >×</button>
              </div>
            ))}

            {/* Color swatches */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
              {EVENT_COLORS.map(c => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => setInputColor(c.value)}
                  style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: c.value,
                    border: inputColor === c.value ? `2px solid white` : '2px solid transparent',
                    cursor: 'pointer', padding: 0,
                    boxShadow: inputColor === c.value ? `0 0 5px ${c.value}` : 'none',
                    transition: 'box-shadow 0.1s',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                placeholder="Título do evento..."
                value={inputTitle}
                onChange={e => setInputTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEvent()}
                autoFocus
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  padding: '6px 10px',
                  fontSize: 12,
                  color: '#e2e8f0',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  outline: 'none',
                }}
              />
              <button
                onClick={addEvent}
                disabled={!inputTitle.trim()}
                style={{
                  background: inputTitle.trim() ? 'rgba(0,217,184,0.15)' : 'transparent',
                  border: `1px solid ${inputTitle.trim() ? '#00d9b8' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 4,
                  padding: '6px 12px',
                  color: inputTitle.trim() ? '#00d9b8' : '#3d5068',
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: inputTitle.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.12s',
                  whiteSpace: 'nowrap',
                }}
              >
                + Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
