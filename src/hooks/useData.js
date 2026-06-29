import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useData() {
  const [orgs, setOrgs] = useState([])
  const [subprojects, setSubprojects] = useState([])
  const [items, setItems] = useState([])
  const [subtasks, setSubtasks] = useState([])
  const [config, setConfig] = useState({ days_threshold: 7, show_critical: true, show_in_progress: true, hide_done: true, ai_context: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [o, sp, it, st, cfg] = await Promise.all([
        supabase.from('orgs').select('*').order('sort_order', { ascending: true, nullsFirst: false }).order('id'),
        supabase.from('subprojects').select('*').order('sort_order'),
        supabase.from('items').select('*').order('created_at', { ascending: false }),
        supabase.from('subtasks').select('*').order('sort_order'),
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
  }, [])

  useEffect(() => { load() }, [load])

  // Orgs reorder
  async function reorderOrgs(newOrder) {
    // newOrder is array of org ids in new order
    setOrgs(prev => newOrder.map(id => prev.find(o => o.id === id)).filter(Boolean))
    try {
      await Promise.all(newOrder.map((id, idx) =>
        supabase.from('orgs').update({ sort_order: idx }).eq('id', id)
      ))
    } catch (e) { console.error('reorderOrgs error', e) }
  }

  // Items
  async function createItem(data) {
    const { data: d, error: e } = await supabase.from('items').insert([data]).select().single()
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
    const { data: d, error: e } = await supabase.from('subtasks').insert([data]).select().single()
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

  // Config
  async function updateConfig(data) {
    const { data: d, error: e } = await supabase.from('config').update(data).eq('id', 1).select().single()
    if (e) throw e
    setConfig(d)
  }

  // Events
  async function createEvent(data) {
    const { error: e } = await supabase.from('events').insert([data])
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
    reorderOrgs,
    createItem, updateItem, deleteItem,
    createSubtask, updateSubtask, deleteSubtask,
    updateConfig, createEvent,
    getSubprojectsForOrg, getItemsForOrg,
    getItemsForSubproject, getSubtasksForItem,
    getSubprojectById,
  }
}
