import { createClient } from '@/lib/supabase/server'
import type { Table } from '@/types'

const TABLE_ROW_SELECT =
  'id, name, capacity, is_private, display_order, created_at'

export async function listTables(): Promise<Table[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tables')
    .select(TABLE_ROW_SELECT)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Failed to list tables:', error)
    return []
  }

  return data ?? []
}

export async function getTableById(id: string): Promise<Table | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tables')
    .select(TABLE_ROW_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Failed to get table by id:', error)
    return null
  }

  return data
}
