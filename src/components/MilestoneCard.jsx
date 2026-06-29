import React, { useState, useRef } from 'react'
import { STATUS_LABEL, PRIORITY_LABEL, STATUS_CLASS, PRIORITY_CLASS, fmtDate, isOverdue, exportIcal } from '../lib/constants'

export default function MilestoneCard({ item, subtasks, onCycleStatus, onToggleSubtask, onCycleSubtask, onUpdateSubtask, onDeleteSubtask, onEditItem }) {
  const overdue = isOverdue(item.due) && item.status !== 'done'

  return (
    <div
      className={`milestone-card ${item.priority === 'critical' ? 'critical-card' : ''}`}
      onClick={() => onEditItem(item)}
    >
      <div className="mc-top">
        <div className="mc-title">{item.title}</div>
        <div className="mc-badges">
          <span className={`priority-badge ${PRIORITY_CLASS[item.priority]}`}>
            {PRIORITY_LABEL[item.priority]}
          </span>
          <button
            className={`status-badge ${STATUS_CLASS[item.status]}`}
            onClick={e => { e.stopPropagation(); onCycleStatus(item) }}
          >
            {STATUS_LABEL[item.status]}
          </button>
        </div>
      </div>

      {item.notes && <div className="mc-desc">{item.notes}</div>}

      {item.due && (
        <div className="mc-meta">
          <div className="mc-meta-item">
            <CalIcon />
            <span style={{ color: overdue ? '#7A1A3A' : undefined, fontWeight: overdue ? 500 : undefined }}>
              {overdue ? 'Overdue · ' : ''}{fmtDate(item.due)}
            </span>
          </div>
        </div>
      )}

      {subtasks.length > 0 && (
        <div className="mc-subtasks">
          <div className="mc-st-label">
            Sub-tasks · {subtasks.filter(s => s.status === 'done').length}/{subtasks.length} done
          </div>
          <div className="mc-st-list">
            {subtasks.map(s => (
              <SubtaskRow
                key={s.id}
                subtask={s}
                parentDue={item.due}
                onToggle={onToggleSubtask}
                onCycle={onCycleSubtask}
                onUpdate={onUpdateSubtask}
                onDelete={onDeleteSubtask}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SubtaskRow({ subtask: s, parentDue, onToggle, onCycle, onUpdate, onDelete }) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState(s.title)
  const [icalModal, setIcalModal] = useState(false)

  // Keep titleVal in sync if subtask updates externally
  React.useEffect(() => { setTitleVal(s.title) }, [s.title])

  function saveTitle() {
    const trimmed = titleVal.trim()
    if (trimmed && trimmed !== s.title) onUpdate(s, { title: trimmed })
    else setTitleVal(s.title)
    setEditingTitle(false)
  }

  function saveDate(val) {
    onUpdate(s, { due: val || null })
  }

  return (
    <>
      <div className="st-row" onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          className="st-check"
          checked={s.status === 'done'}
          onChange={e => onToggle(s, e.target.checked)}
          onClick={e => e.stopPropagation()}
        />

        {/* Inline title */}
        {editingTitle ? (
          <input
            autoFocus
            value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => {
              if (e.key === 'Enter') saveTitle()
              if (e.key === 'Escape') { setTitleVal(s.title); setEditingTitle(false) }
            }}
            onClick={e => e.stopPropagation()}
            style={{ flex: 1, fontSize: 12, border: '1px solid var(--accent)', borderRadius: 6, padding: '2px 6px', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', outline: 'none' }}
          />
        ) : (
          <span
            className={`st-title ${s.status === 'done' ? 'done' : ''}`}
            onClick={e => { e.stopPropagation(); setEditingTitle(true) }}
            title="Click to edit"
            style={{ cursor: 'text', flex: 1 }}
          >
            {s.title}
          </span>
        )}

        <button
          className={`status-badge ${STATUS_CLASS[s.status]}`}
          style={{ fontSize: 9, padding: '1px 7px', flexShrink: 0 }}
          onClick={e => { e.stopPropagation(); onCycle(s) }}
        >
          {STATUS_LABEL[s.status]}
        </button>

        {/* Inline date — native date input always visible */}
        <input
          type="date"
          value={s.due || parentDue || ''}
          onChange={e => { e.stopPropagation(); saveDate(e.target.value) }}
          onClick={e => e.stopPropagation()}
          title="Edit due date"
          style={{
            fontSize: 10, border: '1px solid var(--border-md)', borderRadius: 6,
            padding: '2px 5px', background: 'var(--bg)', color: 'var(--text)',
            fontFamily: 'DM Sans,sans-serif', outline: 'none', width: 115, cursor: 'pointer',
            flexShrink: 0
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
        />

        {/* iCal button */}
        <button
          onClick={e => { e.stopPropagation(); setIcalModal(true) }}
          title="Export to Calendar"
          style={{ background: 'none', border: 'none', color: 'var(--text-hint)', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
          onMouseEnter={e => e.target.style.color = 'var(--accent)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-hint)'}
        >
          📅
        </button>

        {/* Delete */}
        <button
          onClick={e => { e.stopPropagation(); if (window.confirm(`Delete "${s.title}"?`)) onDelete(s) }}
          title="Delete"
          style={{ background: 'none', border: 'none', color: 'var(--text-hint)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
          onMouseEnter={e => e.target.style.color = '#c0392b'}
          onMouseLeave={e => e.target.style.color = 'var(--text-hint)'}
        >
          ×
        </button>
      </div>

      {icalModal && (
        <IcalModal
          subtask={s}
          parentDue={parentDue}
          onClose={() => setIcalModal(false)}
        />
      )}
    </>
  )
}

function IcalModal({ subtask, parentDue, onClose }) {
  const [title, setTitle] = useState(subtask.title)
  const [date, setDate] = useState(subtask.due || parentDue || '')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  function handleExport() {
    if (!date) return
    exportIcal(title, date, start, end, location, notes)
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-md)', padding: '1.5rem', width: 420, maxWidth: '95vw', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--text)' }}>Export to Calendar</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
        </div>

        <div className="field"><label>Event title</label><input value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="field"><label>Date *</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div className="field-row">
          <div className="field"><label>Start time</label><input type="time" value={start} onChange={e => setStart(e.target.value)} /></div>
          <div className="field"><label>End time</label><input type="time" value={end} onChange={e => setEnd(e.target.value)} /></div>
        </div>
        <div className="field"><label>Location</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="Optional" /></div>
        <div className="field"><label>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" rows={2} /></div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleExport} disabled={!date}>Download .ics</button>
        </div>
      </div>
    </div>
  )
}

function CalIcon({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M1 5h10M4 1v2M8 1v2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}
