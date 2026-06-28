import React from 'react'
import { ORGS } from '../lib/constants'

export default function Sidebar({ activePage, activeOrg, onNavDashboard, onNavOrg, onNavSettings, collapsed, onCollapse, onExpand, mobileOpen, onMobileClose }) {
  return (
    <>
      <div className={`sb-backdrop ${mobileOpen ? 'show' : ''}`} onClick={onMobileClose} />
      <button className="hamburger" onClick={() => !mobileOpen && document.getElementById('sidebar').classList.add('mobile-open')}>☰</button>
      <button className={`sb-expand-btn ${collapsed ? 'show' : ''}`} onClick={onExpand}>›</button>

      <nav className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`} id="sidebar">
        <button className="sb-collapse-btn" onClick={onCollapse}>‹</button>

        <div className="sb-header">
          <div className="sb-title">LifeOS</div>
          <div className="sb-sub">Personal OS</div>
        </div>

        <div className="sb-scroll">
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
          <div className="sb-section-label">Projects</div>

          {Object.entries(ORGS).map(([id, o]) => (
            <button
              key={id}
              className={`sb-item ${activePage === 'project' && activeOrg === id ? 'active' : ''}`}
              onClick={() => onNavOrg(id)}
            >
              <span className="sb-dot" style={{ background: o.color }} />
              {o.name}
            </button>
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
