import { HOUR_END, HOUR_START } from "./calendar-constants";

export function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60 * 1000);
}

function roundToNearest30(d: Date): Date {
  const ms = 30 * 60 * 1000;
  return new Date(Math.round(d.getTime() / ms) * ms);
}

function clampStartToGrid(d: Date): Date {
  const x = new Date(d);
  let mins = x.getHours() * 60 + x.getMinutes();
  mins = Math.round(mins / 30) * 30;
  const lo = HOUR_START * 60;
  const hi = HOUR_END * 60 - 30;
  mins = Math.max(lo, Math.min(hi, mins));
  x.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return x;
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
  const ref = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    12,
    0,
    0,
    0,
  );
  return defaultNewReservationRange(ref);
}

export function slotYToStart(day: Date, offsetY: number, pxPerHour: number): Date {
  const minutesFromGridStart = (offsetY / pxPerHour) * 60;
  let total =
    HOUR_START * 60 + minutesFromGridStart;
  total = Math.round(total / 30) * 30;
  const minStart = HOUR_START * 60;
  const maxStart = HOUR_END * 60 - 30;
  total = Math.max(minStart, Math.min(maxStart, total));
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  d.setHours(Math.floor(total / 60), total % 60, 0, 0);
  return d;
}

function endOfGridDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(HOUR_END, 0, 0, 0);
  return x;
}

export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toTimeSelectValue(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** ローカル時刻を HH:mm で返す（カレンダー表示用） */
export function formatTimeHm(d: Date): string {
  return toTimeSelectValue(d);
}

/** 週ビュー等: HH:mm-HH:mm */
export function formatHmRange(startAt: Date, endAt: Date): string {
  return `${toTimeSelectValue(startAt)}-${toTimeSelectValue(endAt)}`;
}

export function parseDateAndTime(dateStr: string, timeStr: string): Date {
  const [yy, mo, dd] = dateStr.split("-").map(Number);
  const [th, tm] = timeStr.split(":").map(Number);
  const d = new Date(yy, mo - 1, dd, th, tm, 0, 0);
  return d;
}
