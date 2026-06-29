import React, { useState, useEffect, useRef } from 'react'
import { exportIcal } from '../lib/constants'

const MODES = ['item', 'subtask', 'event']
const MODE_LABELS = { item: 'New item', subtask: 'Add sub-task', event: 'Add event' }
const SUBMIT_LABELS = { item: 'Create item', subtask: 'Add sub-task', event: 'Save event' }

export default function Modal({ show, onClose, currentOrg, subprojects, items, subtasks, onCreateItem, onCreateSubtask, onUpdateSubtask, onDeleteSubtask, onCreateEvent, showToast }) {
  const [mode, setMode] = useState('item')
  const [subtaskRows, setSubtaskRows] = useState([])

  // Item fields
  const [title, setTitle] = useState('')
  const [project, setProject] = useState('')
  const [status, setStatus] = useState('not-started')
  const [priority, setPriority] = useState('medium')
  const [due, setDue] = useState('')
  const [notes, setNotes] = useState('')

  // Subtask fields
  const [stParent, setStParent] = useState('')
  const [stTitle, setStTitle] = useState('')
  const [stStatus, setStStatus] = useState('not-started')
  const [stDue, setStDue] = useState('')

  // Event fields
  const [evTitle, setEvTitle] = useState('')
  const [evProject, setEvProject] = useState('')
  const [evDate, setEvDate] = useState('')
  const [evStart, setEvStart] = useState('')
  const [evEnd, setEvEnd] = useState('')
  const [evLocation, setEvLocation] = useState('')
  const [evNotes, setEvNotes] = useState('')
  const [evIcal, setEvIcal] = useState(true)

  const titleRef = useRef(null)

  const scopedSubs = currentOrg
    ? subprojects.filter(s => s.org_id === currentOrg)
    : subprojects

  const parentItems = currentOrg
    ? items.filter(i => i.org_id === currentOrg && i.status !== 'done')
    : items.filter(i => i.status !== 'done')

  useEffect(() => {
    if (!show) return
    setMode('item')
    setTitle(''); setStatus('not-started'); setPriority('medium'); setDue(''); setNotes('')
    setSubtaskRows([])
    setStTitle(''); setStStatus('not-started'); setStDue('')
    setEvTitle(''); setEvDate(''); setEvStart(''); setEvEnd(''); setEvLocation(''); setEvNotes(''); setEvIcal(true)
    // Default project to first in scope
    if (scopedSubs.length) {
      setProject(scopedSubs[0].id)
      setEvProject(scopedSubs[0].id)
    }
    if (parentItems.length) setStParent(parentItems[0].id)
    setTimeout(() => titleRef.current?.focus(), 100)
  }, [show])

  function addSubtaskRow() {
    setSubtaskRows(prev => [...prev, { key: Date.now(), title: '', due: '' }])
  }
  function removeSubtaskRow(key) {
    setSubtaskRows(prev => prev.filter(r => r.key !== key))
  }
  function updateSubtaskRow(key, field, val) {
    setSubtaskRows(prev => prev.map(r => r.key === key ? { ...r, [field]: val } : r))
  }

  async function handleSubmit() {
    try {
      if (mode === 'item') {
        if (!title.trim()) { titleRef.current?.focus(); return }
        const sp = subprojects.find(s => s.id === project)
        await onCreateItem({
          title: title.trim(),
          subproject_id: project || null,
          org_id: sp?.org_id || currentOrg || null,
          status, priority,
          due: due || null,
          notes: notes.trim() || null,
          avatar: Math.floor(Math.random() * 4),
        }, subtaskRows.filter(r => r.title.trim()).map(r => ({ title: r.title.trim(), due: r.due || due || null, status: 'not-started' })))
        showToast('Item created')
      } else if (mode === 'subtask') {
        if (!stTitle.trim() || !stParent) return
        const parent = items.find(i => i.id === stParent)
        await onCreateSubtask({ item_id: stParent, title: stTitle.trim(), status: stStatus, due: stDue || parent?.due || null })
        showToast('Sub-task added')
      } else {
        if (!evTitle.trim() || !evDate) return
        const sp = subprojects.find(s => s.id === evProject)
        await onCreateEvent({ title: evTitle.trim(), subproject_id: evProject || null, org_id: sp?.org_id || currentOrg || null, date: evDate, start_time: evStart || null, end_time: evEnd || null, location: evLocation.trim() || null, notes: evNotes.trim() || null })
        if (evIcal) exportIcal(evTitle, evDate, evStart, evEnd, evLocation, evNotes)
        showToast(evIcal ? 'Event saved & .ics downloaded' : 'Event saved')
      }
      onClose()
    } catch (e) {
      showToast('Error: ' + e.message)
    }
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

        {mode === 'item' && (
          <div className="modal-fields">
            <div className="field">
              <label>Title *</label>
              <input ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to happen?" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <div className="field">
              <label>Project</label>
              <select value={project} onChange={e => setProject(e.target.value)}>
                {scopedSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
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
              <label>Sub-tasks <span style={{ fontSize: 10, color: 'var(--text-hint)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              {subtaskRows.map(row => (
                <div className="st-editor-row" key={row.key} style={{ marginBottom: 6 }}>
                  <input value={row.title} onChange={e => updateSubtaskRow(row.key, 'title', e.target.value)} placeholder="Sub-task title…" style={{ border: '1px solid var(--border-md)', borderRadius: 'var(--radius)', padding: '6px 9px', fontSize: 12, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', outline: 'none', width: '100%' }} />
                  <input type="date" value={row.due} onChange={e => updateSubtaskRow(row.key, 'due', e.target.value)} style={{ border: '1px solid var(--border-md)', borderRadius: 'var(--radius)', padding: '6px 9px', fontSize: 12, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', outline: 'none', width: '100%' }} />
                  <button className="st-remove" onClick={() => removeSubtaskRow(row.key)}>×</button>
                </div>
              ))}
              <button className="btn-ghost" onClick={addSubtaskRow} style={{ marginTop: 6 }}>+ Add sub-task</button>
            </div>
          </div>
        )}

        {mode === 'subtask' && (
          <div className="modal-fields">
            <div className="field">
              <label>Parent item *</label>
              <select value={stParent} onChange={e => setStParent(e.target.value)}>
                {parentItems.length
                  ? parentItems.map(i => <option key={i.id} value={i.id}>{i.title} ({subprojects.find(s => s.id === i.subproject_id)?.name || ''})</option>)
                  : <option value="">— no items —</option>}
              </select>
            </div>

            {/* Existing subtasks for selected parent */}
            {stParent && (() => {
              const existing = (subtasks || []).filter(s => s.item_id === stParent)
              const parent = items.find(i => i.id === stParent)
              if (!existing.length) return null
              return (
                <div className="field">
                  <label>Existing sub-tasks</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {existing.map(s => (
                      <ExistingSubtaskRow
                        key={s.id}
                        subtask={s}
                        parentDue={parent?.due}
                        onUpdate={onUpdateSubtask}
                        onDelete={onDeleteSubtask}
                        showToast={showToast}
                      />
                    ))}
                  </div>
                </div>
              )
            })()}

            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
            <div className="field"><label>New sub-task title</label><input value={stTitle} onChange={e => setStTitle(e.target.value)} placeholder="What needs to happen?" /></div>
            <div className="field-row">
              <div className="field">
                <label>Status</label>
                <select value={stStatus} onChange={e => setStStatus(e.target.value)}>
                  <option value="not-started">Not started</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="field">
                <label>Due date <span style={{ fontSize: 10, color: 'var(--text-hint)', textTransform: 'none', letterSpacing: 0 }}>(defaults to parent)</span></label>
                <input type="date" value={stDue} onChange={e => setStDue(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {mode === 'event' && (
          <div className="modal-fields">
            <div className="field"><label>Event title *</label><input value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="What's happening?" /></div>
            <div className="field">
              <label>Project</label>
              <select value={evProject} onChange={e => setEvProject(e.target.value)}>
                {scopedSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
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

function ExistingSubtaskRow({ subtask: s, parentDue, onUpdate, onDelete, showToast }) {
  const [titleVal, setTitleVal] = useState(s.title)
  const [dateVal, setDateVal] = useState(s.due || '')
  const [dirty, setDirty] = useState(false)

  async function save() {
    if (!dirty) return
    try {
      await onUpdate(s, { title: titleVal.trim() || s.title, due: dateVal || null })
      setDirty(false)
      showToast('Sub-task updated')
    } catch (e) { showToast('Error: ' + e.message) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 28px', gap: 6, alignItems: 'center' }}>
      <input
        value={titleVal}
        onChange={e => { setTitleVal(e.target.value); setDirty(true) }}
        onBlur={save}
        onKeyDown={e => e.key === 'Enter' && save()}
        style={{ border: '1px solid var(--border-md)', borderRadius: 'var(--radius)', padding: '6px 9px', fontSize: 12, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', outline: 'none', width: '100%' }}
      />
      <input
        type="date"
        value={dateVal}
        onChange={e => { setDateVal(e.target.value); setDirty(true) }}
        onBlur={save}
        style={{ border: '1px solid var(--border-md)', borderRadius: 'var(--radius)', padding: '6px 9px', fontSize: 12, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', outline: 'none', width: '100%' }}
      />
      <button
        onClick={async () => {
          if (window.confirm(`Delete "${s.title}"?`)) {
            try { await onDelete(s); showToast('Sub-task deleted') }
            catch (e) { showToast('Error: ' + e.message) }
          }
        }}
        style={{ background: 'none', border: 'none', color: 'var(--text-hint)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
      >×</button>
    </div>
  )
}
