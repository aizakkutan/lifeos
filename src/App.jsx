import React, { useState, useCallback } from 'react'
import { useData } from './hooks/useData'
import { useToast } from './hooks/useToast'
import { STATUS_CYCLE } from './lib/constants'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ProjectView from './components/ProjectView'
import Settings from './components/Settings'
import Modal from './components/Modal'

export default function App() {
  const data = useData()
  const { toast, showToast } = useToast()

  const [page, setPage] = useState('dashboard') // 'dashboard' | 'project' | 'settings'
  const [activeOrg, setActiveOrg] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

  // ── Navigation ──
  function navDashboard() {
    setPage('dashboard')
    setActiveOrg(null)
    setSidebarMobileOpen(false)
  }
  function navOrg(orgId) {
    setPage('project')
    setActiveOrg(orgId)
    setSidebarMobileOpen(false)
  }
  function navSettings() {
    setPage('settings')
    setSidebarMobileOpen(false)
  }

  // ── Status cycling ──
  async function handleCycleStatus(item) {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(item.status) + 1) % STATUS_CYCLE.length]
    try {
      await data.updateItem(item.id, { status: next })
      showToast(`"${item.title.slice(0, 30)}…" → ${next.replace('-', ' ')}`)
    } catch (e) { showToast('Error: ' + e.message) }
  }

  async function handleToggleSubtask(subtask, checked) {
    const newStatus = checked ? 'done' : 'not-started'
    try {
      await data.updateSubtask(subtask.id, { status: newStatus })
      // Auto-complete parent if all subtasks done
      const siblings = data.subtasks.filter(s => s.item_id === subtask.item_id)
      const allDone = siblings.every(s => s.id === subtask.id ? checked : s.status === 'done')
      if (allDone) {
        const parent = data.items.find(i => i.id === subtask.item_id)
        if (parent && parent.status !== 'done') {
          await data.updateItem(parent.id, { status: 'done' })
          showToast('All sub-tasks done — item marked complete')
        }
      }
    } catch (e) { showToast('Error: ' + e.message) }
  }

  async function handleCycleSubtask(subtask) {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(subtask.status) + 1) % STATUS_CYCLE.length]
    try { await data.updateSubtask(subtask.id, { status: next }) }
    catch (e) { showToast('Error: ' + e.message) }
  }

  async function handleUpdateSubtask(subtask, updates) {
    try { await data.updateSubtask(subtask.id, updates) }
    catch (e) { showToast('Error: ' + e.message) }
  }

  async function handleDeleteSubtask(subtask) {
    try { await data.deleteSubtask(subtask.id) }
    catch (e) { showToast('Error: ' + e.message) }
  }
  async function handleCreateItem(itemData, subtaskRows = []) {
    const item = await data.createItem(itemData)
    for (const row of subtaskRows) {
      await data.createSubtask({ item_id: item.id, ...row })
    }
  }

  // ── Loading state ──
  if (data.loading) {
    return (
      <div className="loading-screen">
        <div>
          <div className="l-title">LifeOS</div>
          <div className="l-sub">Loading your world…</div>
        </div>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="loading-screen">
        <div>
          <div className="l-title" style={{ color: '#7A1A3A' }}>Connection error</div>
          <div className="l-sub" style={{ maxWidth: 320 }}>{data.error}</div>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={data.reload}>Retry</button>
        </div>
      </div>
    )
  }

  const breadcrumb = page === 'dashboard' ? null
    : page === 'settings' ? 'Settings'
    : data.orgs.find(o => o.id === activeOrg)?.name || ''

  return (
    <div className="app">
      <Sidebar
        activePage={page}
        activeOrg={activeOrg}
        onNavDashboard={navDashboard}
        onNavOrg={navOrg}
        onNavSettings={navSettings}
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(true)}
        onExpand={() => setSidebarCollapsed(false)}
        mobileOpen={sidebarMobileOpen}
        onMobileClose={() => setSidebarMobileOpen(false)}
      />

      <main className="main">
        {/* Topbar */}
        <div className="topbar">
          <div className="breadcrumb">
            {page === 'dashboard'
              ? <span className="crumb">Dashboard</span>
              : <>
                  <span className="crumb link" onClick={navDashboard}>Dashboard</span>
                  <span className="sep">›</span>
                  <span className="crumb">{breadcrumb}</span>
                </>
            }
          </div>
          <div className="topbar-right">
            <button className="btn-primary" onClick={() => setModalOpen(true)}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              New
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="main-scroll">
          {page === 'dashboard' && (
            <Dashboard
              items={data.items}
              subtasks={data.subtasks}
              subprojects={data.subprojects}
              config={data.config}
              onNavOrg={navOrg}
              onNavSettings={navSettings}
              onCycleStatus={handleCycleStatus}
              onToggleSubtask={handleToggleSubtask}
              onCycleSubtask={handleCycleSubtask}
              onUpdateSubtask={handleUpdateSubtask}
              onDeleteSubtask={handleDeleteSubtask}
            />
          )}
          {page === 'project' && activeOrg && (
            <ProjectView
              orgId={activeOrg}
              items={data.items}
              subtasks={data.subtasks}
              subprojects={data.subprojects}
              onCycleStatus={handleCycleStatus}
              onToggleSubtask={handleToggleSubtask}
              onCycleSubtask={handleCycleSubtask}
              onUpdateSubtask={handleUpdateSubtask}
              onDeleteSubtask={handleDeleteSubtask}
            />
          )}
          {page === 'settings' && (
            <Settings
              subprojects={data.subprojects}
              config={data.config}
              onUpdateConfig={data.updateConfig}
              showToast={showToast}
            />
          )}
        </div>
      </main>

      {/* FAB (mobile) */}
      <button className="fab" onClick={() => setModalOpen(true)}>+</button>

      {/* Modal */}
      <Modal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        currentOrg={activeOrg}
        subprojects={data.subprojects}
        items={data.items}
        subtasks={data.subtasks}
        onCreateItem={handleCreateItem}
        onCreateSubtask={data.createSubtask}
        onUpdateSubtask={(s, updates) => data.updateSubtask(s.id, updates)}
        onDeleteSubtask={(s) => data.deleteSubtask(s.id)}
        onCreateEvent={data.createEvent}
        showToast={showToast}
      />

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
