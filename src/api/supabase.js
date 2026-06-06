import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Variables Supabase manquantes dans .env')
}

export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function fetchIdees() {
  const { data, error } = await db
    .from('idees')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Supabase fetch: ${error.message}`)
  return data
}

export async function insertIdee({ titre, description, categorie }) {
  const { data, error } = await db
    .from('idees')
    .insert([{ titre, description, categorie }])
    .select()
    .single()
  if (error) throw new Error(`Supabase insert: ${error.message}`)
  return data
}

export async function updateIdee(id, { titre, description, categorie }) {
  const { data, error } = await db
    .from('idees')
    .update({ titre, description, categorie })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(`Supabase update: ${error.message}`)
  return data
}

export async function deleteIdee(id) {
  const { error } = await db.from('idees').delete().eq('id', id)
  if (error) throw new Error(`Supabase delete: ${error.message}`)
}

export function ecouterRealtime(onInsert, onUpdate, onDelete) {
  return db
    .channel('idees-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'idees' }, (payload) => {
      if (payload.eventType === 'INSERT') onInsert(payload.new)
      if (payload.eventType === 'UPDATE') onUpdate(payload.new)
      if (payload.eventType === 'DELETE') onDelete(payload.old)
    })
    .subscribe((status) => console.info(`Realtime: ${status}`))
}