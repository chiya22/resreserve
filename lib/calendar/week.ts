/** 週の開始を日曜 0:00（ローカル）に揃える */
export function startOfWeekSunday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function endOfWeekSaturday(weekStartSunday: Date): Date {
  return addDays(weekStartSunday, 6);
}

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function weekdayLabelJa(d: Date): string {
  return WEEKDAY_JA[d.getDay()];
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatMonthRange(weekStartSunday: Date): string {
  const weekEndSat = endOfWeekSaturday(weekStartSunday);
  const y1 = weekStartSunday.getFullYear();
  const m1 = weekStartSunday.getMonth() + 1;
  const y2 = weekEndSat.getFullYear();
  const m2 = weekEndSat.getMonth() + 1;
  if (y1 === y2 && m1 === m2) {
    return `${y1}年${m1}月`;
  }
  return `${y1}年${m1}月 – ${y2}年${m2}月`;
}

export function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
