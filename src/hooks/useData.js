import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useData(effectiveUserId, currentUserId) {
  const [orgs, setOrgs] = useState([])
  const [subprojects, setSubprojects] = useState([])
  const [items, setItems] = useState([])
  const [subtasks, setSubtasks] = useState([])
  const [config, setConfig] = useState({ days_threshold: 7, show_critical: true, show_in_progress: true, hide_done: true, ai_context: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // When viewing as someone else (admin feature), we must explicitly filter
  // by user_id since RLS only allows admins to SEE all rows, not auto-scope them.
  const isViewingOther = effectiveUserId && effectiveUserId !== currentUserId

  const load = useCallback(async () => {
    if (!effectiveUserId) { setLoading(false); return }
    setLoading(true)
    try {
      let orgsQ = supabase.from('orgs').select('*').order('sort_order', { ascending: true, nullsFirst: false }).order('id')
      let spQ = supabase.from('subprojects').select('*').order('sort_order')
      let itQ = supabase.from('items').select('*').order('created_at', { ascending: false })
      let stQ = supabase.from('subtasks').select('*').order('sort_order')

      if (isViewingOther) {
        orgsQ = orgsQ.eq('user_id', effectiveUserId)
        spQ = spQ.eq('user_id', effectiveUserId)
        itQ = itQ.eq('user_id', effectiveUserId)
        stQ = stQ.eq('user_id', effectiveUserId)
      }

      const [o, sp, it, st, cfg] = await Promise.all([
        orgsQ, spQ, itQ, stQ,
        supabase.from('config').select('*').eq('id', 1).single(),
      ])
      if (o.error) throw o.error
      setOrgs(o.data || [])
      setSubprojects(sp.data || [])
      setItems(it.data || [])
      setSubtasks(st.data || [])
      if (cfg.data) setConfig(cfg.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [effectiveUserId, isViewingOther])

  useEffect(() => { load() }, [load])

  // Orgs reorder
  async function reorderOrgs(newOrder) {
    setOrgs(prev => newOrder.map(id => prev.find(o => o.id === id)).filter(Boolean))
    try {
      await Promise.all(newOrder.map((id, idx) =>
        supabase.from('orgs').update({ sort_order: idx }).eq('id', id)
      ))
    } catch (e) { console.error('reorderOrgs error', e) }
  }

  // Subprojects reorder
  async function reorderSubprojects(newOrder) {
    setSubprojects(prev => {
      const others = prev.filter(s => !newOrder.includes(s.id))
      const reordered = newOrder.map(id => prev.find(s => s.id === id)).filter(Boolean)
      return [...others, ...reordered]
    })
    try {
      await Promise.all(newOrder.map((id, idx) =>
        supabase.from('subprojects').update({ sort_order: idx }).eq('id', id)
      ))
    } catch (e) { console.error('reorderSubprojects error', e) }
  }

  // Subtasks reorder
  async function reorderSubtasks(itemId, newOrder) {
    setSubtasks(prev => {
      const others = prev.filter(s => !newOrder.includes(s.id))
      const reordered = newOrder.map(id => prev.find(s => s.id === id)).filter(Boolean)
      return [...others, ...reordered]
    })
    try {
      await Promise.all(newOrder.map((id, idx) =>
        supabase.from('subtasks').update({ sort_order: idx }).eq('id', id)
      ))
    } catch (e) { console.error('reorderSubtasks error', e) }
  }

  // Orgs CRUD
  async function createOrg(data) {
    const { data: d, error: e } = await supabase.from('orgs').insert([{ ...data, user_id: currentUserId }]).select().single()
    if (e) throw e
    setOrgs(prev => [...prev, d])
    return d
  }

  async function updateOrg(id, data) {
    const { data: d, error: e } = await supabase.from('orgs').update(data).eq('id', id).select().single()
    if (e) throw e
    setOrgs(prev => prev.map(o => o.id === id ? d : o))
    return d
  }

  async function deleteOrg(id) {
    const { error: e } = await supabase.from('orgs').delete().eq('id', id)
    if (e) throw e
    setOrgs(prev => prev.filter(o => o.id !== id))
    setSubprojects(prev => prev.filter(s => s.org_id !== id))
    setItems(prev => prev.filter(i => i.org_id !== id))
  }

  // Subprojects CRUD
  async function createSubproject(data) {
    const { data: d, error: e } = await supabase.from('subprojects').insert([{ ...data, user_id: currentUserId }]).select().single()
    if (e) throw e
    setSubprojects(prev => [...prev, d])
    return d
  }

  async function updateSubproject(id, data) {
    const { data: d, error: e } = await supabase.from('subprojects').update(data).eq('id', id).select().single()
    if (e) throw e
    setSubprojects(prev => prev.map(s => s.id === id ? d : s))
    return d
  }

  async function deleteSubproject(id) {
    const { error: e } = await supabase.from('subprojects').delete().eq('id', id)
    if (e) throw e
    setSubprojects(prev => prev.filter(s => s.id !== id))
  }

  // Items
  async function createItem(data) {
    const { data: d, error: e } = await supabase.from('items').insert([{ ...data, user_id: currentUserId }]).select().single()
    if (e) throw e
    setItems(prev => [d, ...prev])
    return d
  }

  async function updateItem(id, data) {
    const { data: d, error: e } = await supabase.from('items').update(data).eq('id', id).select().single()
    if (e) throw e
    setItems(prev => prev.map(x => x.id === id ? d : x))
    return d
  }

  async function deleteItem(id) {
    const { error: e } = await supabase.from('items').delete().eq('id', id)
    if (e) throw e
    setItems(prev => prev.filter(x => x.id !== id))
    setSubtasks(prev => prev.filter(x => x.item_id !== id))
  }

  // Subtasks
  async function createSubtask(data) {
    const { data: d, error: e } = await supabase.from('subtasks').insert([{ ...data, user_id: currentUserId }]).select().single()
    if (e) throw e
    setSubtasks(prev => [...prev, d])
    return d
  }

  async function updateSubtask(id, data) {
    const { data: d, error: e } = await supabase.from('subtasks').update(data).eq('id', id).select().single()
    if (e) throw e
    setSubtasks(prev => prev.map(x => x.id === id ? d : x))
    return d
  }

  async function deleteSubtask(id) {
    const { error: e } = await supabase.from('subtasks').delete().eq('id', id)
    if (e) throw e
    setSubtasks(prev => prev.filter(x => x.id !== id))
  }

  // Config (global, not per-user for now)
  async function updateConfig(data) {
    const { data: d, error: e } = await supabase.from('config').update(data).eq('id', 1).select().single()
    if (e) throw e
    setConfig(d)
  }

  // Events
  async function createEvent(data) {
    const { error: e } = await supabase.from('events').insert([{ ...data, user_id: currentUserId }])
    if (e) throw e
  }

  // Helpers
  function getSubprojectsForOrg(orgId) { return subprojects.filter(s => s.org_id === orgId) }
  function getItemsForOrg(orgId) { return items.filter(i => i.org_id === orgId) }
  function getItemsForSubproject(subprojectId) { return items.filter(i => i.subproject_id === subprojectId) }
  function getSubtasksForItem(itemId) { return subtasks.filter(s => s.item_id === itemId) }
  function getSubprojectById(id) { return subprojects.find(s => s.id === id) }

  return {
    orgs, subprojects, items, subtasks, config,
    loading, error, reload: load,
    reorderOrgs, reorderSubprojects, reorderSubtasks,
    createOrg, updateOrg, deleteOrg,
    createSubproject, updateSubproject, deleteSubproject,
    createItem, updateItem, deleteItem,
    createSubtask, updateSubtask, deleteSubtask,
    updateConfig, createEvent,
    getSubprojectsForOrg, getItemsForOrg,
    getItemsForSubproject, getSubtasksForItem,
    getSubprojectById,
  }
}
