import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { CALENDAR_DISPLAY_TIMEZONE } from "@/lib/calendar/calendar-constants";

type View = "day" | "week" | "month";

function addCalendarDaysYmd(ymd: string, deltaDays: number, tz: string): string {
  const [y, m, d] = ymd.split("-").map(Number) as [number, number, number];
  const noonUtc = fromZonedTime(
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T12:00:00`,
    tz,
  );
  const next = new Date(noonUtc.getTime() + deltaDays * 86_400_000);
  return formatInTimeZone(next, tz, "yyyy-MM-dd");
}

/** ISO 曜日 1=月 … 7=日。日曜始まりの週の日曜の ymd を返す */
function sundayYmdOfWeekContaining(ymd: string, tz: string): string {
  const i = Number(formatInTimeZone(fromZonedTime(`${ymd}T12:00:00`, tz), tz, "i"));
  const daysBack = i === 7 ? 0 : i;
  return addCalendarDaysYmd(ymd, -daysBack, tz);
}

function daysInCalendarMonth(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

/**
 * DB の start_at/end_at と重なる予約を取るための UTC の範囲。
 * アンカー日時・ビューは CALENDAR_DISPLAY_TIMEZONE 上の暦で解釈する。
 */
export function getReservationFetchRangeUtc(
  anchor: Date,
  view: View,
  tz = CALENDAR_DISPLAY_TIMEZONE,
): { rangeStart: Date; rangeEnd: Date } {
  if (view === "day") {
    const ymd = formatInTimeZone(anchor, tz, "yyyy-MM-dd");
    return {
      rangeStart: fromZonedTime(`${ymd}T00:00:00`, tz),
      rangeEnd: fromZonedTime(`${ymd}T23:59:59.999`, tz),
    };
  }

  if (view === "week") {
    const ymd = formatInTimeZone(anchor, tz, "yyyy-MM-dd");
    const sun = sundayYmdOfWeekContaining(ymd, tz);
    const sat = addCalendarDaysYmd(sun, 6, tz);
    return {
      rangeStart: fromZonedTime(`${sun}T00:00:00`, tz),
      rangeEnd: fromZonedTime(`${sat}T23:59:59.999`, tz),
    };
  }

  const y = Number(formatInTimeZone(anchor, tz, "yyyy"));
  const month1to12 = Number(formatInTimeZone(anchor, tz, "M"));
  const mStr = String(month1to12).padStart(2, "0");
  const lastD = daysInCalendarMonth(y, month1to12);
  const firstYmd = `${y}-${mStr}-01`;
  const lastYmd = `${y}-${mStr}-${String(lastD).padStart(2, "0")}`;

  const monthStartSunday = sundayYmdOfWeekContaining(firstYmd, tz);
  const monthEndSaturday = addCalendarDaysYmd(
    sundayYmdOfWeekContaining(lastYmd, tz),
    6,
    tz,
  );

  return {
    rangeStart: fromZonedTime(`${monthStartSunday}T00:00:00`, tz),
    rangeEnd: fromZonedTime(`${monthEndSaturday}T23:59:59.999`, tz),
  };
}
