import React, { useState, useEffect, useRef } from 'react'
import { exportIcal, STATUS_CLASS, STATUS_LABEL } from '../lib/constants'

const MODES = ['milestone', 'task', 'event']
const MODE_LABELS = { milestone: 'New milestone', task: 'Add task', event: 'Add event' }
const SUBMIT_LABELS = { milestone: 'Create milestone', task: 'Add task', event: 'Save event' }

export default function Modal({ show, onClose, currentOrg, orgs, subprojects, items, subtasks, onCreateItem, onCreateSubtask, onUpdateSubtask, onDeleteSubtask, onCreateEvent, showToast }) {
  const [mode, setMode] = useState('milestone')

  // Milestone fields
  const [selectedOrg, setSelectedOrg] = useState('')
  const [project, setProject] = useState('')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('not-started')
  const [priority, setPriority] = useState('medium')
  const [due, setDue] = useState('')
  const [notes, setNotes] = useState('')
  const [taskRows, setTaskRows] = useState([])

  // Task fields
  const [taskOrg, setTaskOrg] = useState('')
  const [taskParent, setTaskParent] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskStatus, setTaskStatus] = useState('not-started')
  const [taskDue, setTaskDue] = useState('')
  const [taskNotes, setTaskNotes] = useState('')

  // Event fields
  const [evOrg, setEvOrg] = useState('')
  const [evProject, setEvProject] = useState('')
  const [evTitle, setEvTitle] = useState('')
  const [evDate, setEvDate] = useState('')
  const [evStart, setEvStart] = useState('')
  const [evEnd, setEvEnd] = useState('')
  const [evLocation, setEvLocation] = useState('')
  const [evNotes, setEvNotes] = useState('')
  const [evIcal, setEvIcal] = useState(true)

  const titleRef = useRef(null)

  // Derived
  const scopedOrg = selectedOrg || currentOrg || (orgs[0]?.id || '')
  const scopedProjects = subprojects.filter(s => s.org_id === scopedOrg)
  const taskScopedOrg = taskOrg || currentOrg || (orgs[0]?.id || '')
  const taskScopedProjects = subprojects.filter(s => s.org_id === taskScopedOrg)
  const parentItems = taskScopedProjects.length
    ? items.filter(i => taskScopedProjects.some(s => s.id === i.subproject_id) && i.status !== 'done')
    : items.filter(i => i.status !== 'done')
  const evScopedOrg = evOrg || currentOrg || (orgs[0]?.id || '')
  const evScopedProjects = subprojects.filter(s => s.org_id === evScopedOrg)

  useEffect(() => {
    if (!show) return
    setMode('milestone')
    setTitle(''); setStatus('not-started'); setPriority('medium'); setDue(''); setNotes(''); setTaskRows([])
    setTaskTitle(''); setTaskStatus('not-started'); setTaskDue(''); setTaskNotes('')
    setEvTitle(''); setEvDate(''); setEvStart(''); setEvEnd(''); setEvLocation(''); setEvNotes(''); setEvIcal(true)
    const initOrg = currentOrg || orgs[0]?.id || ''
    setSelectedOrg(initOrg)
    setTaskOrg(initOrg)
    setEvOrg(initOrg)
    const initProjects = subprojects.filter(s => s.org_id === initOrg)
    if (initProjects.length) { setProject(initProjects[0].id); setEvProject(initProjects[0].id) }
    const initParents = items.filter(i => initProjects.some(s => s.id === i.subproject_id) && i.status !== 'done')
    if (initParents.length) setTaskParent(initParents[0].id)
    setTimeout(() => titleRef.current?.focus(), 100)
  }, [show])

  // When org changes, reset project
  useEffect(() => {
    const ps = subprojects.filter(s => s.org_id === scopedOrg)
    if (ps.length) setProject(ps[0].id)
  }, [scopedOrg])

  useEffect(() => {
    const ps = subprojects.filter(s => s.org_id === taskScopedOrg)
    const pi = ps.length ? items.filter(i => ps.some(s => s.id === i.subproject_id) && i.status !== 'done') : []
    if (pi.length) setTaskParent(pi[0].id)
  }, [taskScopedOrg])

  useEffect(() => {
    const ps = subprojects.filter(s => s.org_id === evScopedOrg)
    if (ps.length) setEvProject(ps[0].id)
  }, [evScopedOrg])

  function addTaskRow() { setTaskRows(prev => [...prev, { key: Date.now(), title: '', due: '', notes: '' }]) }
  function removeTaskRow(key) { setTaskRows(prev => prev.filter(r => r.key !== key)) }
  function updateTaskRow(key, field, val) { setTaskRows(prev => prev.map(r => r.key === key ? { ...r, [field]: val } : r)) }

  async function handleSubmit() {
    try {
      if (mode === 'milestone') {
        if (!title.trim()) { titleRef.current?.focus(); return }
        const sp = subprojects.find(s => s.id === project)
        const newItem = await onCreateItem({
          title: title.trim(), subproject_id: project || null,
          org_id: sp?.org_id || scopedOrg || null,
          status, priority, due: due || null, notes: notes.trim() || null,
          avatar: Math.floor(Math.random() * 4),
        }, taskRows.filter(r => r.title.trim()).map(r => ({
          title: r.title.trim(), due: r.due || due || null,
          status: 'not-started', notes: r.notes || null
        })))
        showToast('Milestone created')
      } else if (mode === 'task') {
        if (!taskTitle.trim() || !taskParent) return
        const parent = items.find(i => i.id === taskParent)
        await onCreateSubtask({
          item_id: taskParent, title: taskTitle.trim(),
          status: taskStatus, due: taskDue || parent?.due || null,
          notes: taskNotes.trim() || null
        })
        showToast('Task added')
      } else {
        if (!evTitle.trim() || !evDate) return
        const sp = subprojects.find(s => s.id === evProject)
        await onCreateEvent({
          title: evTitle.trim(), subproject_id: evProject || null,
          org_id: sp?.org_id || evScopedOrg || null,
          date: evDate, start_time: evStart || null, end_time: evEnd || null,
          location: evLocation.trim() || null, notes: evNotes.trim() || null
        })
        if (evIcal) exportIcal(evTitle, evDate, evStart, evEnd, evLocation, evNotes)
        showToast(evIcal ? 'Event saved & .ics downloaded' : 'Event saved')
      }
      onClose()
    } catch (e) { showToast('Error: ' + e.message) }
  }

  if (!show) return null

  return (
    <div className="modal-overlay show" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{MODE_LABELS[mode]}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-mode-toggle">
          {MODES.map(m => (
            <button key={m} className={`modal-mode-btn ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* ── MILESTONE ── */}
        {mode === 'milestone' && (
          <div className="modal-fields">
            <div className="field">
              <label>Organization</label>
              <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Project</label>
              <select value={project} onChange={e => setProject(e.target.value)}>
                {scopedProjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Milestone title *</label>
              <input ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to happen?" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="not-started">Not started</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="field">
                <label>Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="field"><label>Due date</label><input type="date" value={due} onChange={e => setDue(e.target.value)} /></div>
            <div className="field"><label>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Context, links…" /></div>
            <div className="field">
              <label>Tasks <span style={{ fontSize: 10, color: 'var(--text-hint)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              {taskRows.map(row => (
                <div key={row.key} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8, padding: '8px 10px', background: 'var(--surface2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 115px 24px', gap: 6, alignItems: 'center' }}>
                    <input value={row.title} onChange={e => updateTaskRow(row.key, 'title', e.target.value)} placeholder="Task title…" style={{ border: '1px solid var(--border-md)', borderRadius: 'var(--radius)', padding: '5px 8px', fontSize: 12, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', outline: 'none' }} />
                    <input type="date" value={row.due} onChange={e => updateTaskRow(row.key, 'due', e.target.value)} style={{ border: '1px solid var(--border-md)', borderRadius: 'var(--radius)', padding: '5px 8px', fontSize: 12, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', outline: 'none' }} />
                    <button className="st-remove" onClick={() => removeTaskRow(row.key)}>×</button>
                  </div>
                  <input value={row.notes} onChange={e => updateTaskRow(row.key, 'notes', e.target.value)} placeholder="Task notes (optional)…" style={{ border: '1px solid var(--border-md)', borderRadius: 'var(--radius)', padding: '5px 8px', fontSize: 11, background: 'var(--bg)', color: 'var(--text-muted)', fontFamily: 'DM Sans,sans-serif', outline: 'none', width: '100%' }} />
                </div>
              ))}
              <button className="btn-ghost" onClick={addTaskRow} style={{ marginTop: 4 }}>+ Add task</button>
            </div>
          </div>
        )}

        {/* ── TASK ── */}
        {mode === 'task' && (
          <div className="modal-fields">
            <div className="field">
              <label>Organization</label>
              <select value={taskScopedOrg} onChange={e => setTaskOrg(e.target.value)}>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Parent milestone *</label>
              <select value={taskParent} onChange={e => setTaskParent(e.target.value)}>
                {parentItems.length
                  ? parentItems.map(i => {
                      const sp = subprojects.find(s => s.id === i.subproject_id)
                      return <option key={i.id} value={i.id}>{i.title} {sp ? `(${sp.name})` : ''}</option>
                    })
                  : <option value="">— no milestones —</option>}
              </select>
            </div>

            {/* Existing tasks for selected parent */}
            {taskParent && (() => {
              const existing = (subtasks || []).filter(s => s.item_id === taskParent)
              const parent = items.find(i => i.id === taskParent)
              if (!existing.length) return null
              return (
                <div className="field">
                  <label>Existing tasks</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {existing.map(s => (
                      <ExistingTaskRow key={s.id} task={s} parentDue={parent?.due} onUpdate={onUpdateSubtask} onDelete={onDeleteSubtask} showToast={() => {}} />
                    ))}
                  </div>
                </div>
              )
            })()}

            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
            <div className="field"><label>New task title *</label><input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="What needs to happen?" /></div>
            <div className="field-row">
              <div className="field">
                <label>Status</label>
                <select value={taskStatus} onChange={e => setTaskStatus(e.target.value)}>
                  <option value="not-started">Not started</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="field">
                <label>Due date <span style={{ fontSize: 10, color: 'var(--text-hint)', textTransform: 'none', letterSpacing: 0 }}>(defaults to milestone)</span></label>
                <input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} />
              </div>
            </div>
            <div className="field"><label>Notes</label><textarea value={taskNotes} onChange={e => setTaskNotes(e.target.value)} placeholder="Optional notes for this task…" rows={2} /></div>
          </div>
        )}

        {/* ── EVENT ── */}
        {mode === 'event' && (
          <div className="modal-fields">
            <div className="field">
              <label>Organization</label>
              <select value={evScopedOrg} onChange={e => setEvOrg(e.target.value)}>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Project</label>
              <select value={evProject} onChange={e => setEvProject(e.target.value)}>
                {evScopedProjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="field"><label>Event title *</label><input value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="What's happening?" /></div>
            <div className="field-row">
              <div className="field"><label>Date *</label><input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} /></div>
              <div className="field"><label>Start time</label><input type="time" value={evStart} onChange={e => setEvStart(e.target.value)} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>End time</label><input type="time" value={evEnd} onChange={e => setEvEnd(e.target.value)} /></div>
              <div className="field"><label>Location</label><input value={evLocation} onChange={e => setEvLocation(e.target.value)} placeholder="Optional" /></div>
            </div>
            <div className="field"><label>Notes</label><textarea value={evNotes} onChange={e => setEvNotes(e.target.value)} placeholder="Context, agenda…" /></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13 }}>Add to Apple Calendar (.ics)</span>
              <button className={`toggle ${evIcal ? 'on' : ''}`} onClick={() => setEvIcal(v => !v)} />
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit}>{SUBMIT_LABELS[mode]}</button>
        </div>
      </div>
    </div>
  )
}

function ExistingTaskRow({ task: s, parentDue, onUpdate, onDelete }) {
  const [titleVal, setTitleVal] = useState(s.title)
  const [dateVal, setDateVal] = useState(s.due || '')
  const [dirty, setDirty] = useState(false)

  async function save() {
    if (!dirty) return
    try { await onUpdate(s, { title: titleVal.trim() || s.title, due: dateVal || null }); setDirty(false) }
    catch (e) { console.error(e) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 28px', gap: 6, alignItems: 'center' }}>
      <input value={titleVal} onChange={e => { setTitleVal(e.target.value); setDirty(true) }} onBlur={save} onKeyDown={e => e.key === 'Enter' && save()} style={{ border: '1px solid var(--border-md)', borderRadius: 'var(--radius)', padding: '6px 9px', fontSize: 12, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', outline: 'none', width: '100%' }} />
      <input type="date" value={dateVal} onChange={e => { setDateVal(e.target.value); setDirty(true) }} onBlur={save} style={{ border: '1px solid var(--border-md)', borderRadius: 'var(--radius)', padding: '6px 9px', fontSize: 12, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', outline: 'none', width: '100%' }} />
      <button onClick={async () => { if (window.confirm(`Delete "${s.title}"?`)) { try { await onDelete(s) } catch(e){} } }} style={{ background: 'none', border: 'none', color: 'var(--text-hint)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
    </div>
  )
}
