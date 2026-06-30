import React, { useState, useRef } from 'react'

export default function Sidebar({ orgs, activePage, activeOrg, onNavDashboard, onNavOrg, onNavSettings, collapsed, onCollapse, onExpand, mobileOpen, onMobileOpen, onMobileClose, onReorderOrgs }) {
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const dragItem = useRef(null)

  function onDragStart(e, idx) {
    dragItem.current = idx
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e, idx) {
    e.preventDefault()
    setOverIdx(idx)
  }

  function onDrop(e, idx) {
    e.preventDefault()
    if (dragItem.current === null || dragItem.current === idx) {
      setDragIdx(null); setOverIdx(null); return
    }
    const newOrder = [...orgs]
    const [moved] = newOrder.splice(dragItem.current, 1)
    newOrder.splice(idx, 0, moved)
    onReorderOrgs(newOrder.map(o => o.id))
    setDragIdx(null); setOverIdx(null); dragItem.current = null
  }

  function onDragEnd() {
    setDragIdx(null); setOverIdx(null); dragItem.current = null
  }

  return (
    <>
      <div className={`sb-backdrop ${mobileOpen ? 'show' : ''}`} onClick={onMobileClose} />
      <button className="hamburger" onClick={() => mobileOpen ? onMobileClose() : onMobileOpen()}>☰</button>
      <button className={`sb-expand-btn ${collapsed ? 'show' : ''}`} onClick={onExpand}>›</button>

      <nav className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`} id="sidebar">

        {/* Header row with title + collapse button inline */}
        <div className="sb-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '1rem' }}>
          <div>
            <div className="sb-title">LifeOS</div>
            <div className="sb-sub">Personal OS</div>
          </div>
          <button
            onClick={() => { onMobileClose(); onCollapse(); }}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}
            title="Close sidebar"
          >
            ‹
          </button>
        </div>

        <div className="sb-scroll">
          {/* Dashboard */}
          <button
            className={`sb-item dashboard-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={onNavDashboard}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x=".7" y=".7" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="8.3" y=".7" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x=".7" y="8.3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="8.3" y="8.3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            Dashboard
          </button>

          <div className="sb-divider" />
          <div className="sb-section-label">Organizations</div>

          {orgs.map((org, idx) => (
            <div
              key={org.id}
              draggable
              onDragStart={e => onDragStart(e, idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={e => onDrop(e, idx)}
              onDragEnd={onDragEnd}
              style={{
                opacity: dragIdx === idx ? 0.4 : 1,
                borderTop: overIdx === idx && dragIdx !== idx ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'border-color .1s',
              }}
            >
              <button
                className={`sb-item ${activePage === 'project' && activeOrg === org.id ? 'active' : ''}`}
                onClick={() => onNavOrg(org.id)}
                style={{ width: '100%' }}
              >
                <span className="sb-drag-handle" title="Drag to reorder" style={{ cursor: 'grab', color: 'var(--text-hint)', fontSize: 12, marginRight: 2 }}>⠿</span>
                <span className="sb-dot" style={{ background: org.color }} />
                {org.name}
              </button>
            </div>
          ))}

          <div className="sb-divider" />
        </div>

        <div className="sb-bottom">
          <button
            className={`sb-item ${activePage === 'settings' ? 'active' : ''}`}
            onClick={onNavSettings}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M7 1v1.2M7 11.8V13M1 7h1.2M11.8 7H13M2.8 2.8l.85.85M10.35 10.35l.85.85M2.8 11.2l.85-.85M10.35 3.65l.85-.85" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Settings
          </button>
        </div>
      </nav>
    </>
  )
}
