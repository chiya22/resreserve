import type { ReservationWithTable } from '@/types'
import type { Reservation, ReservationCategory } from '@/lib/calendar/types'

export function mapReservationWithTableToCalendar(
  r: ReservationWithTable,
): Reservation {
  return {
    id: r.id,
    customerName: r.customer_name,
    partySize: r.party_size,
    category: r.category as ReservationCategory,
    startAt: new Date(r.start_at),
    endAt: new Date(r.end_at),
    tableOrNote: r.table?.name ?? '未割当',
    notes: r.notes ?? undefined,
  }
}
