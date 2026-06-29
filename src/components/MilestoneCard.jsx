import React, { useState, useRef } from 'react'
import { AVATARS, STATUS_LABEL, PRIORITY_LABEL, STATUS_CLASS, PRIORITY_CLASS, fmtDate, isOverdue, exportIcal } from '../lib/constants'

export default function MilestoneCard({ item, subtasks, onCycleStatus, onToggleSubtask, onCycleSubtask, onUpdateSubtask, onDeleteSubtask }) {
  const av = AVATARS[item.avatar % 4]
  const overdue = isOverdue(item.due) && item.status !== 'done'

  return (
    <div className={`milestone-card ${item.priority === 'critical' ? 'critical-card' : ''}`}>
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

      <div className="mc-meta">
        <div className="mc-meta-item">
          <div className="avatar" style={{ background: av.bg, color: av.c }}>{av.i}</div>
          {av.i}
        </div>
        {item.due && (
          <div className="mc-meta-item">
            <CalIcon />
            <span style={{ color: overdue ? '#7A1A3A' : undefined, fontWeight: overdue ? 500 : undefined }}>
              {overdue ? 'Overdue · ' : ''}{fmtDate(item.due)}
            </span>
          </div>
        )}
        {item.due && (
          <button
            className="mc-ical-btn"
            onClick={e => { e.stopPropagation(); exportIcal(item.title, item.due, '', '', '', item.notes || '') }}
            title="Add to Calendar"
          >
            <CalIcon size={10} /> .ics
          </button>
        )}
      </div>

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
  const [editingDate, setEditingDate] = useState(false)
  const [titleVal, setTitleVal] = useState(s.title)
  const titleRef = useRef(null)

  function saveTitle() {
    const trimmed = titleVal.trim()
    if (trimmed && trimmed !== s.title) {
      onUpdate(s, { title: trimmed })
    } else {
      setTitleVal(s.title)
    }
    setEditingTitle(false)
  }

  function saveDate(val) {
    onUpdate(s, { due: val || null })
    setEditingDate(false)
  }

  return (
    <div className="st-row" onClick={e => e.stopPropagation()}>
      <input
        type="checkbox"
        className="st-check"
        checked={s.status === 'done'}
        onChange={e => onToggle(s, e.target.checked)}
        onClick={e => e.stopPropagation()}
      />

      {/* Inline title edit */}
      {editingTitle ? (
        <input
          ref={titleRef}
          autoFocus
          value={titleVal}
          onChange={e => setTitleVal(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleVal(s.title); setEditingTitle(false) } }}
          onClick={e => e.stopPropagation()}
          style={{ flex: 1, fontSize: 12, border: '1px solid var(--accent)', borderRadius: 6, padding: '2px 6px', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', outline: 'none' }}
        />
      ) : (
        <span
          className={`st-title ${s.status === 'done' ? 'done' : ''}`}
          onClick={e => { e.stopPropagation(); setEditingTitle(true) }}
          title="Click to edit"
          style={{ cursor: 'text' }}
        >
          {s.title}
        </span>
      )}

      <button
        className={`status-badge ${STATUS_CLASS[s.status]}`}
        style={{ fontSize: 9, padding: '1px 7px' }}
        onClick={e => { e.stopPropagation(); onCycle(s) }}
      >
        {STATUS_LABEL[s.status]}
      </button>

      {/* Inline date edit */}
      {editingDate ? (
        <input
          type="date"
          autoFocus
          defaultValue={s.due || parentDue || ''}
          onBlur={e => saveDate(e.target.value)}
          onChange={e => saveDate(e.target.value)}
          onClick={e => e.stopPropagation()}
          style={{ fontSize: 10, border: '1px solid var(--accent)', borderRadius: 6, padding: '1px 5px', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', outline: 'none', width: 110 }}
        />
      ) : (
        <span
          className="st-date"
          onClick={e => { e.stopPropagation(); setEditingDate(true) }}
          title="Click to edit date"
          style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
        >
          {fmtDate(s.due || parentDue)}
        </span>
      )}

      {/* Delete */}
      <button
        onClick={e => { e.stopPropagation(); if (window.confirm(`Delete "${s.title}"?`)) onDelete(s) }}
        title="Delete sub-task"
        style={{ background: 'none', border: 'none', color: 'var(--text-hint)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px', borderRadius: 4, flexShrink: 0 }}
        onMouseEnter={e => e.target.style.color = '#c0392b'}
        onMouseLeave={e => e.target.style.color = 'var(--text-hint)'}
      >
        ×
      </button>
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
