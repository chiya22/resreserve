import type { ReservationCategory } from "./types";

export const TABLE_OPTIONS = [
  "A-1",
  "A-2",
  "B-1",
  "B-2",
  "C-1",
  "C-2",
  "D-1",
  "D-2",
  "個室",
] as const;

export type TableOption = (typeof TABLE_OPTIONS)[number];

/** 新規・編集フォーム用（チップ）— Phase 2 仕様 */
export const FORM_CATEGORY_OPTIONS: {
  value: Exclude<ReservationCategory, "waitlist">;
  label: string;
}[] = [
  { value: "normal", label: "通常" },
  { value: "course", label: "コース" },
  { value: "private", label: "貸し切り" },
  { value: "vip", label: "VIP" },
];

export const CATEGORY_LABEL: Record<ReservationCategory, string> = {
  normal: "通常",
  course: "コース",
  private: "貸し切り",
  waitlist: "キャンセル待ち",
  vip: "VIP",
};

export const HOUR_START = 11;
export const HOUR_END = 22;

/** 30分刻みの時刻オプション（HH:MM） */
export function buildTimeOptions(): string[] {
  const out: string[] = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h < HOUR_END) {
      out.push(`${String(h).padStart(2, "0")}:30`);
    }
  }
  return out;
}
