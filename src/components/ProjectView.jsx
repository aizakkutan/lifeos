import React, { useState } from 'react'
import { ORGS, fmtDate, STATUS_CYCLE } from '../lib/constants'
import MilestoneCard from './MilestoneCard'

const FILTERS = ['All', 'In progress', 'Not started', 'Done', 'Critical']

export default function ProjectView({ orgId, items, subtasks, subprojects, onCycleStatus, onToggleSubtask, onCycleSubtask, onUpdateSubtask, onDeleteSubtask }) {
  const [filter, setFilter] = useState('All')
  const [view, setView] = useState('list')

  const org = ORGS[orgId]
  const orgSubs = subprojects.filter(s => s.org_id === orgId)
  const orgItems = items.filter(i => i.org_id === orgId)

  const done = orgItems.filter(i => i.status === 'done').length
  const ip = orgItems.filter(i => i.status === 'in-progress').length
  const crit = orgItems.filter(i => i.priority === 'critical' && i.status !== 'done').length

  const filtered = orgItems.filter(m => {
    if (filter === 'All') return true
    if (filter === 'In progress') return m.status === 'in-progress'
    if (filter === 'Not started') return m.status === 'not-started'
    if (filter === 'Done') return m.status === 'done'
    if (filter === 'Critical') return m.priority === 'critical'
    return true
  })

  const counts = {
    'All': orgItems.length,
    'In progress': orgItems.filter(i => i.status === 'in-progress').length,
    'Not started': orgItems.filter(i => i.status === 'not-started').length,
    'Done': orgItems.filter(i => i.status === 'done').length,
    'Critical': orgItems.filter(i => i.priority === 'critical').length,
  }

  const colorMap = { 'not-started': 'amber', 'in-progress': 'green', 'done': 'blue' }
  const base = new Date('2026-07-01')
  const end = new Date('2026-12-31')
  const total = end - base
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{org?.name}</div>
          <div className="page-sub">{org?.tag} · {orgSubs.length} sub-projects</div>
        </div>
        <div className="view-toggle">
          <button className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List</button>
          <button className={`view-btn ${view === 'timeline' ? 'active' : ''}`} onClick={() => setView('timeline')}>Timeline</button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="s-label">Items</div><div className="s-num accent">{orgItems.length}</div><div className="s-desc">total</div></div>
        <div className="stat-card"><div className="s-label">In progress</div><div className="s-num">{ip}</div><div className="s-desc">active</div></div>
        <div className="stat-card"><div className="s-label">Done</div><div className="s-num accent">{done}</div><div className="s-desc">{orgItems.length ? Math.round(done / orgItems.length * 100) : 0}% complete</div></div>
        <div className="stat-card"><div className="s-label">Critical</div><div className="s-num" style={{ color: crit ? '#7A1A3A' : undefined }}>{crit}</div><div className="s-desc">open</div></div>
      </div>

      {view === 'list' && (
        <>
          <div className="filter-row">
            {FILTERS.map(f => (
              <button key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f} <span style={{ opacity: .7 }}>{counts[f]}</span>
              </button>
            ))}
          </div>

          {orgSubs.map(sub => {
            const subItems = filtered.filter(i => i.subproject_id === sub.id)
            if (!subItems.length) return null
            return (
              <div className="subproject-section" key={sub.id}>
                <div className="sp-header">
                  <span className="sp-title">{sub.name}</span>
                  <span className="sp-count">{subItems.length} items</span>
                </div>
                <div className="milestone-list">
                  {subItems.map(item => (
                    <MilestoneCard
                      key={item.id}
                      item={item}
                      subtasks={subtasks.filter(s => s.item_id === item.id)}
                      onCycleStatus={onCycleStatus}
                      onToggleSubtask={onToggleSubtask}
                      onCycleSubtask={onCycleSubtask}
                      onUpdateSubtask={onUpdateSubtask}
                      onDeleteSubtask={onDeleteSubtask}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ color: 'var(--text-hint)', fontSize: 13, padding: '2rem 0' }}>No items match this filter.</div>
          )}
        </>
      )}

      {view === 'timeline' && (
        <>
          <div className="section-label" style={{ marginBottom: 14 }}>Timeline · H2 2026</div>
          <div className="timeline-wrap">
            <div className="tl-header">
              <div className="tl-org-col">Item</div>
              <div className="tl-months">
                {months.map((m, i) => <div key={m} className={`tl-month ${i === 0 ? 'current' : ''}`}>{m}{i === 0 ? ' ◆' : ''}</div>)}
              </div>
            </div>
            {orgItems.filter(i => i.due).map(item => {
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
            {orgItems.filter(i => i.due).length === 0 && (
              <div style={{ padding: '1rem', color: 'var(--text-hint)', fontSize: 13 }}>No items with due dates.</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
