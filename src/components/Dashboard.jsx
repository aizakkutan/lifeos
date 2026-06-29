import React, { useState } from 'react'
import { ORGS, STATUS_LABEL, STATUS_CLASS, PRIORITY_CLASS, PRIORITY_LABEL, fmtDate, isOverdue, daysUntil } from '../lib/constants'
import MilestoneCard from './MilestoneCard'

export default function Dashboard({ items, subtasks, subprojects, config, onNavOrg, onNavSettings, onCycleStatus, onToggleSubtask, onCycleSubtask, onUpdateSubtask, onDeleteSubtask }) {
  const [beView, setBeView] = useState('cards')

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const total = items.length
  const done = items.filter(i => i.status === 'done').length
  const ip = items.filter(i => i.status === 'in-progress').length
  const crit = items.filter(i => i.priority === 'critical' && i.status !== 'done').length

  const immediate = items.filter(m => {
    if (config.hide_done && m.status === 'done') return false
    if (config.show_critical && m.priority === 'critical') return true
    if (config.show_in_progress && m.status === 'in-progress') return true
    if (daysUntil(m.due) <= config.days_threshold) return true
    return false
  }).sort((a, b) => {
    const po = { critical: 0, medium: 1, low: 2 }
    if (po[a.priority] !== po[b.priority]) return po[a.priority] - po[b.priority]
    return (a.due || '9999') > (b.due || '9999') ? 1 : -1
  })

  return (
    <div>
      <div className="dash-greeting">
        <div className="greet">Welcome, Isaac.</div>
        <div className="greet-sub">{today}</div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="s-label">Total items</div><div className="s-num accent">{total}</div><div className="s-desc">across all orgs</div></div>
        <div className="stat-card"><div className="s-label">In progress</div><div className="s-num">{ip}</div><div className="s-desc">active now</div></div>
        <div className="stat-card"><div className="s-label">Done</div><div className="s-num accent">{done}</div><div className="s-desc">{total ? Math.round(done / total * 100) : 0}% complete</div></div>
        <div className="stat-card"><div className="s-label">Critical open</div><div className="s-num" style={{ color: crit ? '#7A1A3A' : undefined }}>{crit}</div><div className="s-desc">need attention</div></div>
      </div>

      {/* Immediate */}
      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-title">Needs attention · {immediate.length} item{immediate.length !== 1 ? 's' : ''}</div>
          <button className="dash-section-action" onClick={onNavSettings}>Configure →</button>
        </div>
        <div className="immediate-list">
          {immediate.length === 0
            ? <div style={{ color: 'var(--text-hint)', fontSize: 13, padding: '1rem 0' }}>Nothing urgent right now.</div>
            : immediate.map(m => {
                const od = isOverdue(m.due)
                const sp = subprojects.find(s => s.id === m.subproject_id)
                return (
                  <div
                    key={m.id}
                    className={`immediate-item ${m.priority === 'critical' ? 'critical-card' : ''}`}
                    onClick={() => onNavOrg(m.org_id)}
                  >
                    <div className="ii-main">
                      <div className="ii-title">{m.title}</div>
                      <div className="ii-meta">
                        <span className="ii-project">{sp?.name || ''}</span>
                        {m.due && (
                          <span className={`ii-due ${od ? 'overdue' : ''}`}>
                            <CalIcon /> {od ? 'Overdue · ' : ''}{fmtDate(m.due)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ii-right">
                      <span className={`priority-badge ${PRIORITY_CLASS[m.priority]}`}>{PRIORITY_LABEL[m.priority]}</span>
                      <button className={`status-badge ${STATUS_CLASS[m.status]}`} onClick={e => { e.stopPropagation(); onCycleStatus(m) }}>
                        {STATUS_LABEL[m.status]}
                      </button>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* Birds-eye */}
      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-title">All projects</div>
          <div className="view-toggle">
            <button className={`view-btn ${beView === 'cards' ? 'active' : ''}`} onClick={() => setBeView('cards')}>Cards</button>
            <button className={`view-btn ${beView === 'timeline' ? 'active' : ''}`} onClick={() => setBeView('timeline')}>Timeline</button>
          </div>
        </div>

        {beView === 'cards' && (
          <div className="birdseye-grid">
            {Object.entries(ORGS).map(([orgId, o]) => {
              const orgItems = items.filter(i => i.org_id === orgId)
              const orgSubs = subprojects.filter(s => s.org_id === orgId)
              const donePct = orgItems.length ? Math.round(orgItems.filter(i => i.status === 'done').length / orgItems.length * 100) : 0
              return (
                <div className="be-card" key={orgId} onClick={() => onNavOrg(orgId)}>
                  <div className="be-card-header">
                    <div className="be-card-name">{o.name}</div>
                    <span className={`tag ${o.tagClass}`}>{o.tag}</span>
                  </div>
                  <div className="be-subs">
                    {orgSubs.map(s => (
                      <div className="be-sub" key={s.id}>
                        <span className="be-sub-name">{s.name}</span>
                        <span className="be-sub-count">{items.filter(i => i.subproject_id === s.id).length} items</span>
                      </div>
                    ))}
                  </div>
                  <div className="be-progress"><div className="be-fill" style={{ width: `${donePct}%` }} /></div>
                </div>
              )
            })}
          </div>
        )}

        {beView === 'timeline' && <TimelineView items={items} subprojects={subprojects} />}
      </div>
    </div>
  )
}

function TimelineView({ items, subprojects }) {
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const base = new Date('2026-07-01')
  const end = new Date('2026-12-31')
  const total = end - base

  const colorMap = { 'not-started': 'amber', 'in-progress': 'green', 'done': 'blue' }

  return (
    <div className="timeline-wrap">
      <div className="tl-header">
        <div className="tl-org-col">Item</div>
        <div className="tl-months">
          {months.map((m, i) => <div key={m} className={`tl-month ${i === 0 ? 'current' : ''}`}>{m}{i === 0 ? ' ◆' : ''}</div>)}
        </div>
      </div>
      {items.filter(i => i.due).map(item => {
        const sp = subprojects.find(s => s.id === item.subproject_id)
        const d = new Date(item.due + 'T00:00')
        const offset = Math.max(0, Math.min(d - base, total))
        const left = Math.round((offset / total) * 85)
        const width = Math.max(15, Math.min(40, 100 - left - 5))
        return (
          <div className="tl-row" key={item.id}>
            <div className="tl-org">
              <div className="tl-org-name">{item.title.length > 22 ? item.title.slice(0, 22) + '…' : item.title}</div>
              <div className="tl-org-sub">{sp?.name || ''}</div>
            </div>
            <div className="tl-track">
              <div className="tl-today" />
              <div className={`tl-bar ${colorMap[item.status]}`} style={{ left: `${left}%`, width: `${width}%` }}>
                {fmtDate(item.due)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CalIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M1 5h10M4 1v2M8 1v2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}
