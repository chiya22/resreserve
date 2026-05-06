import { parsePaletteKey } from "@/lib/calendar/palette-key";
import type { Reservation } from "@/lib/calendar/types";
import type { ReservationWithTable } from "@/types";

export function mapReservationWithTableToCalendar(
  r: ReservationWithTable,
): Reservation {
  const cat = r.reservation_categories;
  return {
    id: r.id,
    customerName: r.customer_name,
    partySize: r.party_size,
    categoryId: cat.id,
    paletteKey: parsePaletteKey(cat.palette_key),
    categoryLabel: cat.label,
    startAt: new Date(r.start_at),
    endAt: new Date(r.end_at),
    tableOrNote: r.table?.name ?? "未割当",
    notes: r.notes ?? undefined,
  };
}
