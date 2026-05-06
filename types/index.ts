import type { Database } from './database'

// テーブル行の型
export type Staff = Database['public']['Tables']['staff']['Row']
export type Table = Database['public']['Tables']['tables']['Row']
export type Reservation = Database['public']['Tables']['reservations']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// Insert 用の型
export type StaffInsert = Database['public']['Tables']['staff']['Insert']
export type TableInsert = Database['public']['Tables']['tables']['Insert']
export type ReservationInsert = Database['public']['Tables']['reservations']['Insert']

// Update 用の型
export type StaffUpdate = Database['public']['Tables']['staff']['Update']
export type TableUpdate = Database['public']['Tables']['tables']['Update']
export type ReservationUpdate = Database['public']['Tables']['reservations']['Update']

// ENUM の型
export type StaffRole = Database['public']['Enums']['staff_role']
export type ReservationCategory = Database['public']['Enums']['reservation_category']
export type ReservationStatus = Database['public']['Enums']['reservation_status']
export type NotificationChannel = Database['public']['Enums']['notification_channel']
export type NotificationType = Database['public']['Enums']['notification_type']

// 結合済みの型（カレンダー表示用）
export type ReservationWithTable = Reservation & {
  table: Pick<Table, 'id' | 'name' | 'capacity'> | null
}

// Result 型の再エクスポート
export type { Result } from './result'
