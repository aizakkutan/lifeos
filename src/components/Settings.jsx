import React, { useState } from 'react'
import { ORGS } from '../lib/constants'

const TABS = ['Dashboard', 'Projects', 'Users', 'Integrations']

export default function Settings({ subprojects, config, onUpdateConfig, showToast }) {
  const [tab, setTab] = useState('Dashboard')
  const [aiContext, setAiContext] = useState(config.ai_context || '')
  const [days, setDays] = useState(config.days_threshold || 7)
  const [showCrit, setShowCrit] = useState(config.show_critical ?? true)
  const [showIP, setShowIP] = useState(config.show_in_progress ?? true)
  const [hideDone, setHideDone] = useState(config.hide_done ?? true)

  async function saveConfig() {
    await onUpdateConfig({ days_threshold: days, show_critical: showCrit, show_in_progress: showIP, hide_done: hideDone })
    showToast('Dashboard settings saved')
  }

  async function saveContext() {
    await onUpdateConfig({ ai_context: aiContext })
    showToast('Context saved')
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Settings</div><div className="page-sub">Configure your LifeOS</div></div>
      </div>
      <div className="settings-layout">
        <div className="settings-nav">
          {TABS.map(t => (
            <button key={t} className={`settings-nav-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <div>
          {tab === 'Dashboard' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div><div className="settings-card-title">Immediate tasks — what counts?</div><div className="settings-card-sub">Controls "Needs attention" on your dashboard</div></div>
                <button className="btn-primary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={saveConfig}>Save</button>
              </div>
              <div className="settings-card-body">
                <div className="immediate-config">
                  <div className="ic-row">
                    <div><div className="ic-label">Due within</div><div className="ic-sub">Show items due in the next N days</div></div>
                    <select value={days} onChange={e => setDays(parseInt(e.target.value))}>
                      <option value={3}>3 days</option>
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </div>
                  <div className="ic-row">
                    <div><div className="ic-label">Always show Critical</div><div className="ic-sub">Regardless of due date</div></div>
                    <button className={`toggle ${showCrit ? 'on' : ''}`} onClick={() => setShowCrit(v => !v)} />
                  </div>
                  <div className="ic-row">
                    <div><div className="ic-label">Include In Progress</div><div className="ic-sub">Show all active items</div></div>
                    <button className={`toggle ${showIP ? 'on' : ''}`} onClick={() => setShowIP(v => !v)} />
                  </div>
                  <div className="ic-row">
                    <div><div className="ic-label">Hide Done</div><div className="ic-sub">Don't show completed items</div></div>
                    <button className={`toggle ${hideDone ? 'on' : ''}`} onClick={() => setHideDone(v => !v)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'Projects' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div><div className="settings-card-title">Project hierarchy</div><div className="settings-card-sub">Orgs, sub-projects, and categories</div></div>
              </div>
              <div className="settings-card-body">
                {Object.entries(ORGS).map(([orgId, o]) => (
                  <div className="hierarchy-card" key={orgId}>
                    <div className="hc-parent">
                      <span className="hc-parent-name">{o.name}</span>
                      <span className={`tag ${o.tagClass}`}>{o.tag}</span>
                    </div>
                    <div className="hc-children">
                      {subprojects.filter(s => s.org_id === orgId).map(s => (
                        <div className="hc-child" key={s.id}>
                          <span>{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Users' && (
            <div className="settings-card">
              <div className="settings-card-header"><div><div className="settings-card-title">Users</div><div className="settings-card-sub">Single-user in v1</div></div></div>
              <div className="settings-card-body">
                <div className="field-row">
                  <div className="field"><label>Name</label><input type="text" defaultValue="Isaac" /></div>
                  <div className="field"><label>Role</label><input type="text" defaultValue="Owner" disabled style={{ opacity: .5, cursor: 'not-allowed' }} /></div>
                </div>
                <div className="field"><label>Email</label><input type="email" placeholder="your@email.com" /></div>
                <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text-muted)' }}>
                  Multi-user access planned for a future release.
                </div>
              </div>
            </div>
          )}

          {tab === 'Integrations' && (
            <>
              <div className="settings-card">
                <div className="settings-card-header"><div><div className="settings-card-title">Connected services</div></div></div>
                <div className="settings-card-body">
                  <div className="int-row">
                    <div className="int-info"><div className="int-icon">⚡</div><div><div className="int-name">Supabase</div><div className="int-status connected">Connected · lifeos-db</div></div></div>
                    <button className="toggle on" />
                  </div>
                  <div className="int-row">
                    <div className="int-info"><div className="int-icon">🧠</div><div><div className="int-name">Claude</div><div className="int-status connected">Connected · via Project</div></div></div>
                    <button className="toggle on" />
                  </div>
                  <div className="int-row">
                    <div className="int-info"><div className="int-icon">📅</div><div><div className="int-name">Apple Calendar</div><div className="int-status">Planned · future release</div></div></div>
                    <button className="toggle" />
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <div><div className="settings-card-title">Claude — AI context brief</div><div className="settings-card-sub">Sent to Claude before every read/write on your data</div></div>
                  <button className="btn-primary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={saveContext}>Save</button>
                </div>
                <div className="settings-card-body">
                  <div className="field">
                    <label>Who you are & standing instructions</label>
                    <textarea
                      rows={8}
                      value={aiContext}
                      onChange={e => setAiContext(e.target.value)}
                      placeholder="Single operator across ministry and media. Running The Antioch Assembly (WPM Mongolia + Lebanon), LSBC Y17, Beacon Media, and Antioch 21 Summit + Missions. Always confirm before deleting. Prefer brief summaries."
                    />
                  </div>
                  <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text-muted)' }}>
                    This text is prepended to every Claude operation so it understands your world without re-explaining each time.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
