/** サーバーでもクライアント realtime でも使える select 断片のみ（インポートの循環を避ける） */
export const RESERVATION_WITH_TABLE_EMBED = `
  id,
  table_id,
  customer_name,
  customer_phone,
  party_size,
  category_id,
  status,
  start_at,
  end_at,
  notes,
  amount,
  internal_notes,
  created_by,
  created_at,
  updated_at,
  reservation_categories!reservations_category_id_fkey (
    id,
    code,
    label,
    palette_key,
    blocks_entire_calendar,
    show_in_booking_form,
    sort_order
  ),
  table:tables (
    id,
    name,
    capacity
  )
` as const;
