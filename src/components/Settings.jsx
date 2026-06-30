import React, { useState } from 'react'

const TABS = ['Dashboard', 'Projects', 'Users', 'Integrations']
const ORG_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5856D6', '#FF2D55', '#00C7BE']
const ORG_TAGS = ['Ministry', 'Business', 'Mission', 'Personal']

export default function Settings({ orgs, subprojects, config, onUpdateConfig, onCreateOrg, onUpdateOrg, onDeleteOrg, onCreateSubproject, onUpdateSubproject, onDeleteSubproject, showToast }) {
  const [tab, setTab] = useState('Dashboard')
  const [aiContext, setAiContext] = useState(config.ai_context || '')
  const [days, setDays] = useState(config.days_threshold || 7)
  const [showCrit, setShowCrit] = useState(config.show_critical ?? true)
  const [showIP, setShowIP] = useState(config.show_in_progress ?? true)
  const [hideDone, setHideDone] = useState(config.hide_done ?? true)

  const [addingOrg, setAddingOrg] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgTag, setNewOrgTag] = useState('Ministry')
  const [newOrgColor, setNewOrgColor] = useState(ORG_COLORS[0])

  const [addingProjectFor, setAddingProjectFor] = useState(null)
  const [newProjectName, setNewProjectName] = useState('')

  async function saveConfig() {
    await onUpdateConfig({ days_threshold: days, show_critical: showCrit, show_in_progress: showIP, hide_done: hideDone })
    showToast('Dashboard settings saved')
  }

  async function saveContext() {
    await onUpdateConfig({ ai_context: aiContext })
    showToast('Context saved')
  }

  function slugify(name) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function handleCreateOrg() {
    if (!newOrgName.trim()) return
    const id = slugify(newOrgName)
    if (orgs.some(o => o.id === id)) { showToast('An organization with this name already exists'); return }
    try {
      await onCreateOrg({ id, name: newOrgName.trim(), tag: newOrgTag, color: newOrgColor, sort_order: orgs.length })
      showToast('Organization created')
      setNewOrgName(''); setAddingOrg(false)
    } catch (e) { showToast('Error: ' + e.message) }
  }

  async function handleDeleteOrg(org) {
    if (window.confirm(`Delete "${org.name}"? This will also delete all its projects and milestones.`)) {
      try { await onDeleteOrg(org.id); showToast('Organization deleted') }
      catch (e) { showToast('Error: ' + e.message) }
    }
  }

  async function handleCreateProject(orgId) {
    if (!newProjectName.trim()) return
    try {
      const existing = subprojects.filter(s => s.org_id === orgId)
      await onCreateSubproject({ org_id: orgId, name: newProjectName.trim(), sort_order: existing.length })
      showToast('Project created')
      setNewProjectName(''); setAddingProjectFor(null)
    } catch (e) { showToast('Error: ' + e.message) }
  }

  async function handleDeleteProject(sub) {
    if (window.confirm(`Delete "${sub.name}"? This will also delete its milestones.`)) {
      try { await onDeleteSubproject(sub.id); showToast('Project deleted') }
      catch (e) { showToast('Error: ' + e.message) }
    }
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
                <div><div className="settings-card-title">Organization hierarchy</div><div className="settings-card-sub">Organizations, projects, and categories</div></div>
                <button className="btn-primary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => setAddingOrg(v => !v)}>
                  {addingOrg ? 'Cancel' : '+ Add organization'}
                </button>
              </div>
              <div className="settings-card-body">

                {addingOrg && (
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="field">
                      <label>Organization name</label>
                      <input value={newOrgName} onChange={e => setNewOrgName(e.target.value)} placeholder="e.g. New Ministry" onKeyDown={e => e.key === 'Enter' && handleCreateOrg()} autoFocus />
                    </div>
                    <div className="field-row">
                      <div className="field">
                        <label>Category</label>
                        <select value={newOrgTag} onChange={e => setNewOrgTag(e.target.value)}>
                          {ORG_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label>Color</label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 4 }}>
                          {ORG_COLORS.map(c => (
                            <button
                              key={c}
                              onClick={() => setNewOrgColor(c)}
                              style={{
                                width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer',
                                border: newOrgColor === c ? '2px solid var(--text)' : '2px solid transparent',
                                transform: newOrgColor === c ? 'scale(1.1)' : 'scale(1)', transition: 'all .12s',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button className="btn-primary" style={{ alignSelf: 'flex-end', fontSize: 12, padding: '6px 14px' }} onClick={handleCreateOrg}>Create organization</button>
                  </div>
                )}

                {orgs.map(org => {
                  const orgSubs = subprojects.filter(s => s.org_id === org.id)
                  const tagClass = org.tag === 'Ministry' ? 'tag-ministry' : org.tag === 'Business' ? 'tag-business' : org.tag === 'Mission' ? 'tag-mission' : 'tag-mission'
                  return (
                    <div className="hierarchy-card" key={org.id}>
                      <div className="hc-parent">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: org.color, flexShrink: 0 }} />
                          <span className="hc-parent-name">{org.name}</span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`tag ${tagClass}`}>{org.tag}</span>
                          <button
                            onClick={() => handleDeleteOrg(org)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-hint)', cursor: 'pointer', fontSize: 16, padding: '0 2px' }}
                            title="Delete organization"
                          >×</button>
                        </div>
                      </div>
                      <div className="hc-children">
                        {orgSubs.map(s => (
                          <div className="hc-child" key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>{s.name}</span>
                            <button
                              onClick={() => handleDeleteProject(s)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-hint)', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}
                              title="Delete project"
                            >×</button>
                          </div>
                        ))}

                        {addingProjectFor === org.id ? (
                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            <input
                              value={newProjectName}
                              onChange={e => setNewProjectName(e.target.value)}
                              placeholder="Project name…"
                              onKeyDown={e => e.key === 'Enter' && handleCreateProject(org.id)}
                              autoFocus
                              style={{ flex: 1, fontSize: 12, border: '1px solid var(--border-md)', borderRadius: 8, padding: '5px 9px', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter,sans-serif', outline: 'none' }}
                            />
                            <button className="btn-primary" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => handleCreateProject(org.id)}>Add</button>
                            <button className="btn-secondary" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => setAddingProjectFor(null)}>Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAddingProjectFor(org.id); setNewProjectName('') }}
                            style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '4px 0' }}
                          >
                            + Add project
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {orgs.length === 0 && !addingOrg && (
                  <div style={{ color: 'var(--text-hint)', fontSize: 13, padding: '1rem 0' }}>No organizations yet. Add one to get started.</div>
                )}
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
                      placeholder="Single operator across ministry and media. Always confirm before deleting. Prefer brief summaries."
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
