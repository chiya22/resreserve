import type { ReservationSeatingStyle } from "@/types";

/** DB の palette_key と一致（設定画面の選択肢の値＝この色ラベル） */
export const RESERVATION_PALETTE_KEYS = [
  "青",
  "緑",
  "アンバー",
  "赤",
  "紫",
] as const;

export type ReservationPaletteKey =
  (typeof RESERVATION_PALETTE_KEYS)[number];

export type Reservation = {
  id: string;
  customerName: string;
  partySize: number;
  seatingStyle: ReservationSeatingStyle;
  /** 代表カテゴリ（色表示用） */
  categoryId: string;
  /** 割り当て済みカテゴリ（フィルタ用） */
  categoryIds: string[];
  paletteKey: ReservationPaletteKey;
  categoryLabel: string;
  startAt: Date;
  endAt: Date;
  /** カレンダー2行目・詳細のテーブル表示に使用 */
  tableOrNote: string;
  /** 備考（任意） */
  notes?: string;
};
