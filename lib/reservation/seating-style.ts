import type { ReservationSeatingStyle } from "@/types";

export const RESERVATION_SEATING_STYLES = ["standing", "seated"] as const;

export const SEATING_STYLE_OPTIONS: {
  value: ReservationSeatingStyle;
  label: string;
}[] = [
  { value: "standing", label: "立食" },
  { value: "seated", label: "着席" },
];

const SEATING_STYLE_JA: Record<ReservationSeatingStyle, string> = {
  seated: "着席",
  standing: "立食",
};

export function formatSeatingStyleJa(
  style: ReservationSeatingStyle | null | undefined,
): string {
  if (!style) return "—";
  return SEATING_STYLE_JA[style] ?? style;
}
