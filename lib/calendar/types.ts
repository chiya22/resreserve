export type ReservationCategory =
  | "normal"
  | "course"
  | "private"
  | "waitlist"
  | "vip";

export type Reservation = {
  id: string;
  customerName: string;
  partySize: number;
  category: ReservationCategory;
  startAt: Date;
  endAt: Date;
  /** カレンダー2行目・詳細のテーブル表示に使用 */
  tableOrNote: string;
  /** 備考（任意） */
  notes?: string;
};
