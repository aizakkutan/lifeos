import React, { useState, useCallback } from 'react'
import { useData } from './hooks/useData'
import { useToast } from './hooks/useToast'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'
import { STATUS_CYCLE } from './lib/constants'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ProjectView from './components/ProjectView'
import Settings from './components/Settings'
import Modal from './components/Modal'
import EditItemModal from './components/EditItemModal'
import Login from './components/Login'

export default function App() {
  const auth = useAuth()
  const data = useData(auth.effectiveUserId, auth.user?.id)
  const { toast, showToast } = useToast()

  const [page, setPage] = useState('dashboard') // 'dashboard' | 'project' | 'settings'
  const [activeOrg, setActiveOrg] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)
  const [allUsers, setAllUsers] = useState([])

  React.useEffect(() => {
    if (auth.isAdmin) {
      supabase.from('profiles').select('id, email').then(({ data: profiles }) => {
        if (profiles) setAllUsers(profiles)
      })
    }
  }, [auth.isAdmin])

  // ── Auth gate ──
  if (auth.loading) {
    return (
      <div className="loading-screen">
        <div>
          <div className="l-title">LifeOS</div>
          <div className="l-sub">Loading…</div>
        </div>
      </div>
    )
  }

  if (!auth.user) {
    return <Login />
  }

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

  async function handleAddSubtask(item, fields) {
    try { await data.createSubtask({ item_id: item.id, ...fields }) }
    catch (e) { showToast('Error: ' + e.message) }
  }

  // ── Edit / Delete item ──
  function handleEditItem(item) { setEditItem(item) }

  async function handleSaveItem(item, updates) {
    try { await data.updateItem(item.id, updates); showToast('Item updated') }
    catch (e) { showToast('Error: ' + e.message) }
  }

  async function handleDeleteItem(item) {
    try { await data.deleteItem(item.id); showToast('Item deleted') }
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
          <div className="l-title" style={{ color: '#D70015' }}>Connection error</div>
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
        orgs={data.orgs}
        activePage={page}
        activeOrg={activeOrg}
        onNavDashboard={navDashboard}
        onNavOrg={navOrg}
        onNavSettings={navSettings}
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(true)}
        onExpand={() => setSidebarCollapsed(false)}
        mobileOpen={sidebarMobileOpen}
        onMobileOpen={() => setSidebarMobileOpen(true)}
        onMobileClose={() => setSidebarMobileOpen(false)}
        onReorderOrgs={data.reorderOrgs}
        auth={auth}
        allUsers={allUsers}
        onSwitchUser={auth.setViewingAsUserId}
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
            <button
              className="btn-secondary"
              onClick={() => data.reload()}
              title="Refresh data"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, padding: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: data.loading ? 'spin 0.8s linear infinite' : 'none' }}>
                <path d="M12.5 7a5.5 5.5 0 1 1-1.6-3.9M12.5 1.5v3.5h-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
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
              orgs={data.orgs}
              config={data.config}
              onNavOrg={navOrg}
              onNavSettings={navSettings}
              onCycleStatus={handleCycleStatus}
              onToggleSubtask={handleToggleSubtask}
              onCycleSubtask={handleCycleSubtask}
              onUpdateSubtask={handleUpdateSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              onEditItem={handleEditItem}
              onAddSubtask={handleAddSubtask}
            />
          )}
          {page === 'project' && activeOrg && (
            <ProjectView
              orgId={activeOrg}
              items={data.items}
              subtasks={data.subtasks}
              subprojects={data.subprojects}
              orgs={data.orgs}
              onCycleStatus={handleCycleStatus}
              onToggleSubtask={handleToggleSubtask}
              onCycleSubtask={handleCycleSubtask}
              onUpdateSubtask={handleUpdateSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              onEditItem={handleEditItem}
              onAddSubtask={handleAddSubtask}
            />
          )}
          {page === 'settings' && (
            <Settings
              orgs={data.orgs}
              subprojects={data.subprojects}
              config={data.config}
              onUpdateConfig={data.updateConfig}
              onCreateOrg={data.createOrg}
              onUpdateOrg={data.updateOrg}
              onDeleteOrg={data.deleteOrg}
              onCreateSubproject={data.createSubproject}
              onUpdateSubproject={data.updateSubproject}
              onDeleteSubproject={data.deleteSubproject}
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
        orgs={data.orgs}
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

      {/* Edit item modal */}
      {editItem && (
        <EditItemModal
          item={editItem}
          subprojects={data.subprojects}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
          onClose={() => setEditItem(null)}
        />
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
