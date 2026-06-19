import { formatInTimeZone } from "date-fns-tz";

import { CALENDAR_DISPLAY_TIMEZONE } from "@/lib/calendar/calendar-constants";
import { calendarYmd } from "@/lib/calendar/week";
import type { Reservation } from "@/lib/calendar/types";
import { formatSeatingStyleJa } from "@/lib/reservation/seating-style";

const TZ = CALENDAR_DISPLAY_TIMEZONE;

export type MonthReservationTooltipLine = {
  label: string;
  value: string;
};

/** 月カレンダーのツールチップ用日時（Asia/Tokyo） */
export function formatMonthReservationDatetime(
  startAt: Date,
  endAt: Date,
): string {
  const sameDay = calendarYmd(startAt) === calendarYmd(endAt);
  if (sameDay) {
    const datePart = formatInTimeZone(startAt, TZ, "yyyy年M月d日");
    const startHm = formatInTimeZone(startAt, TZ, "HH:mm");
    const endHm = formatInTimeZone(endAt, TZ, "HH:mm");
    return `${datePart} ${startHm} 〜 ${endHm}`;
  }
  const startText = formatInTimeZone(startAt, TZ, "yyyy年M月d日 HH:mm");
  const endText = formatInTimeZone(endAt, TZ, "yyyy年M月d日 HH:mm");
  return `${startText} 〜 ${endText}`;
}

export function getMonthReservationTooltipLines(
  reservation: Reservation,
): MonthReservationTooltipLine[] {
  return [
    { label: "顧客名", value: reservation.customerName },
    {
      label: "日時",
      value: formatMonthReservationDatetime(
        reservation.startAt,
        reservation.endAt,
      ),
    },
    { label: "人数", value: `${reservation.partySize}名` },
    {
      label: "立食/着席",
      value: formatSeatingStyleJa(reservation.seatingStyle),
    },
    { label: "カテゴリ", value: reservation.categoryLabel },
  ];
}
