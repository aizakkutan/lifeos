import React, { useState, useEffect } from 'react'
import { PRIORITY_CLASS, PRIORITY_LABEL } from '../lib/constants'

export default function EditItemModal({ item, subprojects, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(item.title)
  const [status, setStatus] = useState(item.status)
  const [priority, setPriority] = useState(item.priority)
  const [due, setDue] = useState(item.due || '')
  const [notes, setNotes] = useState(item.notes || '')
  const [subprojectId, setSubprojectId] = useState(item.subproject_id || '')

  useEffect(() => {
    setTitle(item.title)
    setStatus(item.status)
    setPriority(item.priority)
    setDue(item.due || '')
    setNotes(item.notes || '')
    setSubprojectId(item.subproject_id || '')
  }, [item])

  async function handleSave() {
    if (!title.trim()) return
    await onSave(item, {
      title: title.trim(),
      status,
      priority,
      due: due || null,
      notes: notes.trim() || null,
      subproject_id: subprojectId || null,
    })
    onClose()
  }

  async function handleDelete() {
    if (window.confirm(`Delete "${item.title}"? This will also delete all its sub-tasks.`)) {
      await onDelete(item)
      onClose()
    }
  }

  const orgSubs = subprojects.filter(s => s.org_id === item.org_id)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-md)', padding: '1.5rem', width: 480, maxWidth: '95vw', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, letterSpacing: '-0.02em', fontSize: 20, color: 'var(--text)' }}>Edit item</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
        </div>

        <div className="modal-fields">
          <div className="field">
            <label>Title *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          {orgSubs.length > 0 && (
            <div className="field">
              <label>Sub-project</label>
              <select value={subprojectId} onChange={e => setSubprojectId(e.target.value)}>
                {orgSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

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

          <div className="field">
            <label>Due date</label>
            <input type="date" value={due} onChange={e => setDue(e.target.value)} />
          </div>

          <div className="field">
            <label>Notes</label>
            <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Context, links…" />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
          <button
            onClick={handleDelete}
            style={{ background: 'none', border: '1px solid #FFB3AD', borderRadius: 'var(--radius)', padding: '6px 13px', fontSize: 12, color: '#D70015', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
          >
            Delete item
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>Save changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}
