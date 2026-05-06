import {
  RESERVATION_PALETTE_KEYS,
  type ReservationPaletteKey,
} from "@/lib/calendar/types";

const LEGACY_PALETTE_KEY: Record<string, ReservationPaletteKey> = {
  normal: "青",
  course: "緑",
  private: "アンバー",
  waitlist: "赤",
  vip: "紫",
};

/** DB / API が返すパレット文字列を Tailwind 用キーへ正規化（旧英語値も許容） */
export function parsePaletteKey(raw: string): ReservationPaletteKey {
  if ((RESERVATION_PALETTE_KEYS as readonly string[]).includes(raw)) {
    return raw as ReservationPaletteKey;
  }
  return LEGACY_PALETTE_KEY[raw] ?? "青";
}
