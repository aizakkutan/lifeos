import React, { useState, useRef } from 'react'
import { fmtDate } from '../lib/constants'
import MilestoneCard from './MilestoneCard'

const FILTERS = ['All', 'In progress', 'Not started', 'Done', 'Critical']

export default function ProjectView({ orgId, items, subtasks, subprojects, orgs, onCycleStatus, onToggleSubtask, onCycleSubtask, onUpdateSubtask, onDeleteSubtask, onEditItem, onAddSubtask, onCreateSubproject, onReorderSubprojects }) {
  const [filter, setFilter] = useState('All')
  const [view, setView] = useState('list')
  const [hiddenProjects, setHiddenProjects] = useState({})
  const [addingProject, setAddingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [dragSubIdx, setDragSubIdx] = useState(null)
  const [overSubIdx, setOverSubIdx] = useState(null)
  const dragSubRef = useRef(null)

  const org = orgs.find(o => o.id === orgId) || { name: orgId }
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

  function toggleProject(subId) {
    setHiddenProjects(prev => ({ ...prev, [subId]: !prev[subId] }))
  }

  async function handleAddProject() {
    if (!newProjectName.trim()) return
    try {
      await onCreateSubproject({ org_id: orgId, name: newProjectName.trim(), sort_order: orgSubs.length })
      setNewProjectName(''); setAddingProject(false)
    } catch (e) { console.error(e) }
  }

  // Drag reorder projects
  function onSubDragStart(e, idx) { dragSubRef.current = idx; setDragSubIdx(idx); e.dataTransfer.effectAllowed = 'move' }
  function onSubDragOver(e, idx) { e.preventDefault(); setOverSubIdx(idx) }
  function onSubDrop(e, idx) {
    e.preventDefault()
    if (dragSubRef.current === null || dragSubRef.current === idx) { setDragSubIdx(null); setOverSubIdx(null); return }
    const newOrder = [...orgSubs]
    const [moved] = newOrder.splice(dragSubRef.current, 1)
    newOrder.splice(idx, 0, moved)
    onReorderSubprojects(newOrder.map(s => s.id))
    setDragSubIdx(null); setOverSubIdx(null); dragSubRef.current = null
  }
  function onSubDragEnd() { setDragSubIdx(null); setOverSubIdx(null); dragSubRef.current = null }

  const colorMap = { 'not-started': 'amber', 'in-progress': 'green', 'done': 'blue' }
  const base = new Date('2026-07-01')
  const end = new Date('2026-12-31')
  const total = end - base
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{org.name}</div>
          <div className="page-sub">Organization · {orgSubs.length} project{orgSubs.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {orgSubs.map(sub => (
              <button key={sub.id} onClick={() => toggleProject(sub.id)} style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 999,
                border: '1px solid var(--border-md)',
                background: hiddenProjects[sub.id] ? 'transparent' : 'var(--accent)',
                color: hiddenProjects[sub.id] ? 'var(--text-muted)' : '#fff',
                cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all .15s',
                textDecoration: hiddenProjects[sub.id] ? 'line-through' : 'none',
                opacity: hiddenProjects[sub.id] ? 0.6 : 1,
              }}>{sub.name}</button>
            ))}
          </div>
          <div className="view-toggle">
            <button className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List</button>
            <button className={`view-btn ${view === 'timeline' ? 'active' : ''}`} onClick={() => setView('timeline')}>Timeline</button>
          </div>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="s-label">Milestones</div><div className="s-num accent">{orgItems.length}</div><div className="s-desc">total</div></div>
        <div className="stat-card"><div className="s-label">In progress</div><div className="s-num">{ip}</div><div className="s-desc">active</div></div>
        <div className="stat-card"><div className="s-label">Done</div><div className="s-num accent">{done}</div><div className="s-desc">{orgItems.length ? Math.round(done / orgItems.length * 100) : 0}% complete</div></div>
        <div className="stat-card"><div className="s-label">Critical</div><div className="s-num" style={{ color: crit ? '#D70015' : undefined }}>{crit}</div><div className="s-desc">open</div></div>
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

          {orgSubs.map((sub, idx) => {
            if (hiddenProjects[sub.id]) return (
              <div key={sub.id} style={{ marginBottom: 12, opacity: 0.5 }}>
                <div className="sp-header" style={{ cursor: 'pointer' }} onClick={() => toggleProject(sub.id)}>
                  <span className="sp-title" style={{ textDecoration: 'line-through' }}>{sub.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>hidden · click to show</span>
                </div>
              </div>
            )
            const subItems = filtered.filter(i => i.subproject_id === sub.id)
            return (
              <div
                key={sub.id}
                className="subproject-section"
                draggable
                onDragStart={e => onSubDragStart(e, idx)}
                onDragOver={e => onSubDragOver(e, idx)}
                onDrop={e => onSubDrop(e, idx)}
                onDragEnd={onSubDragEnd}
                style={{
                  opacity: dragSubIdx === idx ? 0.4 : 1,
                  borderTop: overSubIdx === idx && dragSubIdx !== idx ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'border-color .1s',
                }}
              >
                <div className="sp-header">
                  <span style={{ cursor: 'grab', color: 'var(--text-hint)', fontSize: 12, marginRight: 4 }}>⠿</span>
                  <span className="sp-title">{sub.name}</span>
                  <span className="sp-count">{subItems.length} milestone{subItems.length !== 1 ? 's' : ''}</span>
                  <button onClick={() => toggleProject(sub.id)} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-hint)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Hide</button>
                </div>
                {subItems.length > 0 ? (
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
                        onEditItem={onEditItem}
                        onAddSubtask={onAddSubtask}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-hint)', fontSize: 12, padding: '8px 0' }}>No milestones match this filter.</div>
                )}
              </div>
            )
          })}

          {/* Add project inline */}
          {addingProject ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <input
                autoFocus
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddProject(); if (e.key === 'Escape') { setAddingProject(false); setNewProjectName('') } }}
                placeholder="Project name…"
                style={{ flex: 1, fontSize: 13, border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: '7px 11px', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter,sans-serif', outline: 'none' }}
              />
              <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={handleAddProject}>Add</button>
              <button className="btn-secondary" onClick={() => { setAddingProject(false); setNewProjectName('') }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setAddingProject(true)} style={{ marginTop: 8, fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
              + Add project
            </button>
          )}
        </>
      )}

      {view === 'timeline' && (
        <>
          <div className="section-label" style={{ marginBottom: 14 }}>Timeline · H2 2026</div>
          <div className="timeline-wrap">
            <div className="tl-header">
              <div className="tl-org-col">Milestone</div>
              <div className="tl-months">{months.map((m, i) => <div key={m} className={`tl-month ${i === 0 ? 'current' : ''}`}>{m}{i === 0 ? ' ◆' : ''}</div>)}</div>
            </div>
            {orgItems.filter(i => i.due && !hiddenProjects[i.subproject_id]).map(item => {
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
                    <div className={`tl-bar ${colorMap[item.status]}`} style={{ left: `${left}%`, width: `${width}%` }}>{fmtDate(item.due)}</div>
                  </div>
                </div>
              )
            })}
            {orgItems.filter(i => i.due).length === 0 && <div style={{ padding: '1rem', color: 'var(--text-hint)', fontSize: 13 }}>No milestones with due dates.</div>}
          </div>
        </>
      )}
    </div>
  )
}
