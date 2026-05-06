import type { ReservationPaletteKey } from "@/lib/calendar/types";

/** 週ビュー・日ビューのブロック左アクセント含む */
export const RESERVATION_BLOCK_CLASS: Record<ReservationPaletteKey, string> =
  {
    青: "bg-reservation-normal-bg text-reservation-normal-text border-l-reservation-normal-border",
    緑: "bg-reservation-course-bg text-reservation-course-text border-l-reservation-course-border",
    アンバー:
      "bg-reservation-private-bg text-reservation-private-text border-l-reservation-private-border",
    赤: "bg-reservation-waitlist-bg text-reservation-waitlist-text border-l-reservation-waitlist-border",
    紫: "bg-reservation-vip-bg text-reservation-vip-text border-l-reservation-vip-border",
  };

/** バッジ・月チップ・日サマリー用（左ボーダーなし） */
export const RESERVATION_TONE_CLASS: Record<ReservationPaletteKey, string> = {
  青: "bg-reservation-normal-bg text-reservation-normal-text",
  緑: "bg-reservation-course-bg text-reservation-course-text",
  アンバー: "bg-reservation-private-bg text-reservation-private-text",
  赤: "bg-reservation-waitlist-bg text-reservation-waitlist-text",
  紫: "bg-reservation-vip-bg text-reservation-vip-text",
};
