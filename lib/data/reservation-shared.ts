import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import type { Result } from '@/types/result'
import type { Reservation } from '@/types'

export const reservationSelectWithTable = `
  id,
  table_id,
  customer_name,
  customer_phone,
  party_size,
  category,
  status,
  start_at,
  end_at,
  notes,
  internal_notes,
  created_by,
  created_at,
  updated_at,
  table:tables (
    id,
    name,
    capacity
  )
` as const

const reservationInputBaseSchema = z.object({
  table_id: z.string().uuid().nullable(),
  customer_name: z.string().min(1, '顧客名を入力してください').max(100),
  customer_phone: z.string().max(20).optional().nullable(),
  party_size: z.number().int().min(1).max(50),
  category: z.enum(['normal', 'course', 'private', 'waitlist', 'vip']),
  start_at: z.iso.datetime(),
  end_at: z.iso.datetime(),
  notes: z.string().max(500).optional().nullable(),
})

export const reservationInputSchema = reservationInputBaseSchema.refine(
  (data) => new Date(data.end_at) > new Date(data.start_at),
  {
    message: '終了時刻は開始時刻より後である必要があります',
    path: ['end_at'],
  },
)

export type ReservationInput = z.infer<typeof reservationInputSchema>

export const reservationPartialSchema = reservationInputBaseSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.start_at !== undefined && data.end_at !== undefined) {
      if (new Date(data.end_at) <= new Date(data.start_at)) {
        ctx.addIssue({
          code: 'custom',
          message: '終了時刻は開始時刻より後である必要があります',
          path: ['end_at'],
        })
      }
    }
  })

export function rowToInput(r: Reservation): ReservationInput {
  return {
    table_id: r.table_id,
    customer_name: r.customer_name,
    customer_phone: r.customer_phone,
    party_size: r.party_size,
    category: r.category,
    start_at: r.start_at,
    end_at: r.end_at,
    notes: r.notes,
  }
}

export async function checkBusinessRules(
  input: ReservationInput,
  options?: { excludeReservationId?: string },
): Promise<Result<void, string>> {
  const supabase = await createClient()
  const excludeId = options?.excludeReservationId

  const overlapBase = () =>
    supabase
      .from('reservations')
      .select('id')
      .neq('status', 'cancelled')
      .neq('status', 'no_show')
      .lt('start_at', input.end_at)
      .gt('end_at', input.start_at)

  if (input.category === 'private') {
    let q = overlapBase()
    if (excludeId) q = q.neq('id', excludeId)
    const { data: conflicts, error } = await q

    if (error) {
      console.error('checkBusinessRules (private) failed:', error)
      return { success: false, error: '予約の検証に失敗しました' }
    }

    if (conflicts && conflicts.length > 0) {
      return {
        success: false,
        error: 'この時間帯は他の予約があるため貸し切りできません',
      }
    }
  }

  let q2 = supabase
    .from('reservations')
    .select('id')
    .eq('category', 'private')
    .neq('status', 'cancelled')
    .neq('status', 'no_show')
    .lt('start_at', input.end_at)
    .gt('end_at', input.start_at)

  if (excludeId) q2 = q2.neq('id', excludeId)

  const { data: privateBookings, error: privateErr } = await q2

  if (privateErr) {
    console.error('checkBusinessRules (private overlap) failed:', privateErr)
    return { success: false, error: '予約の検証に失敗しました' }
  }

  if (privateBookings && privateBookings.length > 0) {
    return {
      success: false,
      error: 'この時間帯は貸し切り予約のため受け付けられません',
    }
  }

  return { success: true, data: undefined }
}
