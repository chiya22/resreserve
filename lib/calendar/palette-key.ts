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
  bento: "シアン",
};

/** DB / API が返すパレット文字列を Tailwind 用キーへ正規化（旧英語値も許容） */
export function parsePaletteKey(raw: string): ReservationPaletteKey {
  if ((RESERVATION_PALETTE_KEYS as readonly string[]).includes(raw)) {
    return raw as ReservationPaletteKey;
  }
  return LEGACY_PALETTE_KEY[raw] ?? "青";
}

/** カテゴリ code に応じた表示色（DB 制約未適用時の弁当フォールバック含む） */
export function resolveCategoryPaletteKey(
  code: string | null | undefined,
  paletteKey: string,
): ReservationPaletteKey {
  if (code === "bento") return "シアン";
  return parsePaletteKey(paletteKey);
}
