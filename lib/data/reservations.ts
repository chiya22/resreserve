import { createClient } from '@/lib/supabase/server'
import { reservationSelectWithTable } from '@/lib/data/reservation-shared'
import type { ReservationWithTable } from '@/types'

export type { ReservationInput } from '@/lib/data/reservation-shared'

export async function getReservationsByDateRange(
  startAt: Date,
  endAt: Date,
): Promise<ReservationWithTable[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reservations')
    .select(reservationSelectWithTable)
    .neq('status', 'cancelled')
    .lt('start_at', endAt.toISOString())
    .gt('end_at', startAt.toISOString())
    .order('start_at', { ascending: true })

  if (error) {
    console.error('Failed to get reservations by date range:', error)
    return []
  }

  return (data ?? []) as ReservationWithTable[]
}

export async function getReservationById(id: string): Promise<ReservationWithTable | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reservations')
    .select(reservationSelectWithTable)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Failed to get reservation by id:', error)
    return null
  }

  if (!data) return null

  return data as ReservationWithTable
}
