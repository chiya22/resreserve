import type { ReservationSeatingStyle } from "@/types";

export const RESERVATION_SEATING_STYLES = [
  "standing",
  "seated",
  "bento",
  "event",
] as const;

export const SEATING_STYLE_OPTIONS: {
  value: ReservationSeatingStyle;
  label: string;
}[] = [
  { value: "standing", label: "立食" },
  { value: "seated", label: "着席" },
  { value: "bento", label: "弁当" },
  { value: "event", label: "イベント" },
];

const SEATING_STYLE_JA: Record<ReservationSeatingStyle, string> = {
  seated: "着席",
  standing: "立食",
  bento: "弁当",
  event: "イベント",
};

export function formatSeatingStyleJa(
  style: ReservationSeatingStyle | null | undefined,
): string {
  if (!style) return "—";
  return SEATING_STYLE_JA[style] ?? style;
}

/** 形式がイベントのときのみ人数 0 を許可 */
export function seatingStyleAllowsZeroPartySize(
  style: ReservationSeatingStyle | null | undefined,
): boolean {
  return style === "event";
}
