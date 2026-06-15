import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { HOUR_END, HOUR_START } from "./calendar-constants";
import { CALENDAR_DISPLAY_TIMEZONE } from "./calendar-constants";
import { calendarYmd } from "./week";

const TZ = CALENDAR_DISPLAY_TIMEZONE;

export function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60 * 1000);
}

function roundToNearest30(d: Date): Date {
  const ms = 30 * 60 * 1000;
  return new Date(Math.round(d.getTime() / ms) * ms);
}

function calendarMinutesOfDay(d: Date): number {
  const h = Number(formatInTimeZone(d, TZ, "H"));
  const m = Number(formatInTimeZone(d, TZ, "m"));
  return h * 60 + m;
}

function minutesToZonedDate(ymd: string, totalMinutes: number): Date {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return fromZonedTime(
    `${ymd}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`,
    TZ,
  );
}

function clampStartToGrid(d: Date): Date {
  const ymd = calendarYmd(d);
  let mins = calendarMinutesOfDay(d);
  mins = Math.round(mins / 30) * 30;
  const lo = HOUR_START * 60;
  const hi = HOUR_END * 60 - 30;
  mins = Math.max(lo, Math.min(hi, mins));
  return minutesToZonedDate(ymd, mins);
}

/** 業務時間内に丸めた開始・終了（終了は開始+90分を上限 22:00 でクリップ） */
export function defaultNewReservationRange(now = new Date()): {
  start: Date;
  end: Date;
} {
  const start = clampStartToGrid(roundToNearest30(now));
  let end = addMinutes(start, 90);
  const dayEnd = endOfGridDay(start);
  if (end > dayEnd) end = dayEnd;
  return { start, end };
}

/** 指定日のカレンダー日付で新規予約の初期レンジ（当日 12:00 付近を基準にグリッドへ丸め） */
export function defaultNewReservationRangeForDay(day: Date): {
  start: Date;
  end: Date;
} {
  const ymd = calendarYmd(day);
  const ref = fromZonedTime(`${ymd}T12:00:00`, TZ);
  return defaultNewReservationRange(ref);
}

export function slotYToStart(day: Date, offsetY: number, pxPerHour: number): Date {
  const ymd = calendarYmd(day);
  const minutesFromGridStart = (offsetY / pxPerHour) * 60;
  let total = HOUR_START * 60 + minutesFromGridStart;
  total = Math.round(total / 30) * 30;
  const minStart = HOUR_START * 60;
  const maxStart = HOUR_END * 60 - 30;
  total = Math.max(minStart, Math.min(maxStart, total));
  return minutesToZonedDate(ymd, total);
}

function endOfGridDay(d: Date): Date {
  const ymd = calendarYmd(d);
  return fromZonedTime(`${ymd}T${String(HOUR_END).padStart(2, "0")}:00:00`, TZ);
}

export function toDateInputValue(d: Date): string {
  return calendarYmd(d);
}

export function toTimeSelectValue(d: Date): string {
  return formatInTimeZone(d, TZ, "HH:mm");
}

/** 店舗暦（Asia/Tokyo）の HH:mm */
export function formatTimeHm(d: Date): string {
  return toTimeSelectValue(d);
}

/** 週ビュー等: HH:mm-HH:mm */
export function formatHmRange(startAt: Date, endAt: Date): string {
  return `${toTimeSelectValue(startAt)}-${toTimeSelectValue(endAt)}`;
}

export function parseDateAndTime(dateStr: string, timeStr: string): Date {
  return fromZonedTime(`${dateStr}T${timeStr}:00`, TZ);
}
