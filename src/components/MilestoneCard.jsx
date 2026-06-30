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
            <span style={{ color: overdue ? '#D70015' : undefined, fontWeight: overdue ? 500 : undefined }}>
              {overdue ? 'Overdue · ' : ''}{fmtDate(item.due)}
            </span>
          </div>
        </div>
      )}

      {subtasks.length > 0 && (
        <div className="mc-subtasks">
          <div className="mc-st-label">
            Tasks · {subtasks.filter(s => s.status === 'done').length}/{subtasks.length} done
          </div>
          <div className="mc-st-list">
            {subtasks.map(s => (
              <TaskRow
                key={s.id}
                task={s}
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

function TaskRow({ task: s, parentDue, onToggle, onCycle, onUpdate, onDelete }) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState(s.title)
  const [showNotes, setShowNotes] = useState(false)
  const [notesVal, setNotesVal] = useState(s.notes || '')
  const [icalModal, setIcalModal] = useState(false)

  React.useEffect(() => { setTitleVal(s.title) }, [s.title])
  React.useEffect(() => { setNotesVal(s.notes || '') }, [s.notes])

  function saveTitle() {
    const trimmed = titleVal.trim()
    if (trimmed && trimmed !== s.title) onUpdate(s, { title: trimmed })
    else setTitleVal(s.title)
    setEditingTitle(false)
  }

  function saveNotes() {
    if (notesVal !== (s.notes || '')) onUpdate(s, { notes: notesVal || null })
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
            style={{ flex: 1, fontSize: 12, border: '1px solid var(--accent)', borderRadius: 6, padding: '2px 6px', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter,sans-serif', outline: 'none' }}
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

        <input
          type="date"
          value={s.due || parentDue || ''}
          onChange={e => { e.stopPropagation(); onUpdate(s, { due: e.target.value || null }) }}
          onClick={e => e.stopPropagation()}
          title="Edit due date"
          style={{ fontSize: 10, border: '1px solid var(--border-md)', borderRadius: 6, padding: '2px 5px', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter,sans-serif', outline: 'none', width: 115, cursor: 'pointer', flexShrink: 0 }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
        />

        {/* Notes toggle — only show icon if has notes or on hover */}
        <button
          onClick={e => { e.stopPropagation(); setShowNotes(v => !v) }}
          title={s.notes ? 'View notes' : 'Add notes'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, lineHeight: 1,
            padding: '0 2px', flexShrink: 0,
            color: s.notes ? 'var(--accent-mid)' : 'var(--text-hint)',
            opacity: s.notes ? 1 : 0.4,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = s.notes ? 1 : 0.4; e.currentTarget.style.color = s.notes ? 'var(--accent-mid)' : 'var(--text-hint)' }}
        >
          ✎
        </button>

        {/* iCal */}
        <button
          onClick={e => { e.stopPropagation(); setIcalModal(true) }}
          title="Export to Calendar"
          style={{ background: 'none', border: 'none', color: 'var(--text-hint)', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: '0 2px', flexShrink: 0, opacity: 0.4 }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.opacity = 1 }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-hint)'; e.currentTarget.style.opacity = 0.4 }}
        >
          📅
        </button>

        {/* Delete */}
        <button
          onClick={e => { e.stopPropagation(); if (window.confirm(`Delete task "${s.title}"?`)) onDelete(s) }}
          title="Delete task"
          style={{ background: 'none', border: 'none', color: 'var(--text-hint)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0, opacity: 0.4 }}
          onMouseEnter={e => { e.currentTarget.style.color = '#D70015'; e.currentTarget.style.opacity = 1 }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-hint)'; e.currentTarget.style.opacity = 0.4 }}
        >
          ×
        </button>
      </div>

      {/* Notes box — only shown when toggled and either has content or is being edited */}
      {showNotes && (
        <div style={{ marginLeft: 24, marginTop: 4, marginBottom: 4 }} onClick={e => e.stopPropagation()}>
          <textarea
            value={notesVal}
            onChange={e => setNotesVal(e.target.value)}
            onBlur={saveNotes}
            placeholder="Add notes for this task…"
            rows={2}
            style={{
              width: '100%', fontSize: 12, border: '1px solid var(--border-md)', borderRadius: 8,
              padding: '7px 10px', background: 'var(--surface2)', color: 'var(--text)',
              fontFamily: 'Inter,sans-serif', outline: 'none', resize: 'vertical',
              transition: 'border-color .15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur2={e => e.target.style.borderColor = 'var(--border-md)'}
          />
        </div>
      )}

      {icalModal && (
        <IcalModal subtask={s} parentDue={parentDue} onClose={() => setIcalModal(false)} />
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
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, letterSpacing: '-0.02em', fontSize: 20, color: 'var(--text)' }}>Export to Calendar</div>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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
