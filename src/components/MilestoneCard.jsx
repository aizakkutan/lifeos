import React from 'react'
import { AVATARS, STATUS_LABEL, PRIORITY_LABEL, STATUS_CLASS, PRIORITY_CLASS, STATUS_CYCLE, fmtDate, isOverdue, exportIcal } from '../lib/constants'

export default function MilestoneCard({ item, subtasks, onCycleStatus, onToggleSubtask, onCycleSubtask }) {
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
              <div className="st-row" key={s.id}>
                <input
                  type="checkbox"
                  className="st-check"
                  checked={s.status === 'done'}
                  onChange={e => { e.stopPropagation(); onToggleSubtask(s, e.target.checked) }}
                  onClick={e => e.stopPropagation()}
                />
                <span className={`st-title ${s.status === 'done' ? 'done' : ''}`}>{s.title}</span>
                <button
                  className={`status-badge ${STATUS_CLASS[s.status]}`}
                  style={{ fontSize: 9, padding: '1px 7px' }}
                  onClick={e => { e.stopPropagation(); onCycleSubtask(s) }}
                >
                  {STATUS_LABEL[s.status]}
                </button>
                <span className="st-date">{fmtDate(s.due || item.due)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
