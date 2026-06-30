import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { CALENDAR_DISPLAY_TIMEZONE } from "@/lib/calendar/calendar-constants";
import { ymdToStartOfDay } from "@/lib/calendar/week";
import { PUBLIC_AVAILABILITY_CATEGORY_LABELS } from "@/lib/public/availability-category-labels";

const TZ = CALENDAR_DISPLAY_TIMEZONE;

export type PublicAvailabilityMark = "○" | "△" | "×";

/** 公開表示用ラベル（API の記号との対応） */
export const PUBLIC_AVAILABILITY_MARK_LABELS: Record<
  PublicAvailabilityMark,
  string
> = {
  "○": "予約可",
  "△": "要確認",
  "×": "予約不可",
};

export const PUBLIC_AVAILABILITY_MARK_LEGEND: readonly {
  mark: PublicAvailabilityMark;
  label: string;
}[] = [
  { mark: "○", label: PUBLIC_AVAILABILITY_MARK_LABELS["○"] },
  { mark: "△", label: PUBLIC_AVAILABILITY_MARK_LABELS["△"] },
  { mark: "×", label: PUBLIC_AVAILABILITY_MARK_LABELS["×"] },
];

export function publicAvailabilityMarkLabel(
  mark: PublicAvailabilityMark,
): string {
  return PUBLIC_AVAILABILITY_MARK_LABELS[mark];
}

export type PublicReservationCategorySnapshot = {
  startAt: Date;
  endAt: Date;
  /** 予約に紐づくカテゴリ名（assignments + 代表カテゴリの label） */
  categoryLabels: ReadonlySet<string>;
  blocksEntireCalendar: boolean;
};

/** 同一予約にメイン・ロビー両カテゴリが付いているか */
export function reservationHasMainAndLobbyCategories(
  reservation: PublicReservationCategorySnapshot,
): boolean {
  const labels = reservation.categoryLabels;
  return (
    labels.has(PUBLIC_AVAILABILITY_CATEGORY_LABELS.main) &&
    labels.has(PUBLIC_AVAILABILITY_CATEGORY_LABELS.lobby)
  );
}

function endOfCalendarDay(ymd: string): Date {
  return fromZonedTime(`${ymd}T23:59:59.999`, TZ);
}

function overlapsCalendarDay(
  startAt: Date,
  endAt: Date,
  dayYmd: string,
): boolean {
  const dayStart = ymdToStartOfDay(dayYmd);
  const dayEnd = endOfCalendarDay(dayYmd);
  return startAt < dayEnd && endAt > dayStart;
}

/** 指定日に ○△× の判定対象となる予約か（メイン/ロビー/デッキ、または貸し切り） */
function reservationAffectsDayMark(
  reservation: PublicReservationCategorySnapshot,
  dayYmd: string,
): boolean {
  if (!overlapsCalendarDay(reservation.startAt, reservation.endAt, dayYmd)) {
    return false;
  }
  if (reservation.blocksEntireCalendar) return true;
  const labels = reservation.categoryLabels;
  return (
    labels.has(PUBLIC_AVAILABILITY_CATEGORY_LABELS.main) ||
    labels.has(PUBLIC_AVAILABILITY_CATEGORY_LABELS.lobby) ||
    labels.has(PUBLIC_AVAILABILITY_CATEGORY_LABELS.deck)
  );
}

export function computeDayAvailabilityMark(
  reservations: PublicReservationCategorySnapshot[],
  dayYmd: string,
): PublicAvailabilityMark {
  const onDay = reservations.filter((r) =>
    overlapsCalendarDay(r.startAt, r.endAt, dayYmd),
  );

  if (onDay.some(reservationHasMainAndLobbyCategories)) {
    return "×";
  }

  if (onDay.some((r) => reservationAffectsDayMark(r, dayYmd))) {
    return "△";
  }

  return "○";
}

function daysInCalendarMonth(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

export function listYmdInCalendarMonth(
  year: number,
  month1to12: number,
): string[] {
  const mStr = String(month1to12).padStart(2, "0");
  const last = daysInCalendarMonth(year, month1to12);
  return Array.from({ length: last }, (_, i) => {
    const d = String(i + 1).padStart(2, "0");
    return `${year}-${mStr}-${d}`;
  });
}

export function getCalendarMonthRangeUtc(
  year: number,
  month1to12: number,
): { rangeStart: Date; rangeEnd: Date } {
  const mStr = String(month1to12).padStart(2, "0");
  const last = daysInCalendarMonth(year, month1to12);
  const lastStr = String(last).padStart(2, "0");
  return {
    rangeStart: fromZonedTime(`${year}-${mStr}-01T00:00:00`, TZ),
    rangeEnd: fromZonedTime(`${year}-${mStr}-${lastStr}T23:59:59.999`, TZ),
  };
}

export function parseYearMonthParams(
  yearRaw: string | null | undefined,
  monthRaw: string | null | undefined,
  now = new Date(),
): { year: number; month: number } | null {
  const fallback = {
    year: Number(formatInTimeZone(now, TZ, "yyyy")),
    month: Number(formatInTimeZone(now, TZ, "M")),
  };

  const normalize = (raw: string | null | undefined): string | undefined => {
    if (raw == null) return undefined;
    const trimmed = raw.trim();
    return trimmed === "" ? undefined : trimmed;
  };

  const yearStr = normalize(yearRaw);
  const monthStr = normalize(monthRaw);

  const year =
    yearStr === undefined ? fallback.year : Number.parseInt(yearStr, 10);
  const month =
    monthStr === undefined ? fallback.month : Number.parseInt(monthStr, 10);

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return { year, month };
}

/** year / month のクエリが未指定か（空文字・空白のみも未指定扱い） */
export function isYearMonthQueryAbsent(
  yearRaw: string | null | undefined,
  monthRaw: string | null | undefined,
): boolean {
  const normalize = (raw: string | null | undefined) =>
    raw == null || raw.trim() === "";
  return normalize(yearRaw) && normalize(monthRaw);
}

/** DB 行からカテゴリ label を収集 */
export function collectCategoryLabelsFromReservationRow(row: {
  reservation_categories: {
    label: string;
    blocks_entire_calendar: boolean;
  } | null;
  reservation_category_assignments?: {
    reservation_categories: {
      label: string;
      blocks_entire_calendar: boolean;
    } | null;
  }[];
}): { labels: Set<string>; blocksEntireCalendar: boolean } {
  const labels = new Set<string>();
  let blocksEntireCalendar = false;

  const primary = row.reservation_categories;
  if (primary) {
    labels.add(primary.label);
    if (primary.blocks_entire_calendar) blocksEntireCalendar = true;
  }

  for (const assignment of row.reservation_category_assignments ?? []) {
    const cat = assignment.reservation_categories;
    if (!cat) continue;
    labels.add(cat.label);
    if (cat.blocks_entire_calendar) blocksEntireCalendar = true;
  }

  return { labels, blocksEntireCalendar };
}

export function toReservationCategorySnapshot(row: {
  start_at: string;
  end_at: string;
  reservation_categories: {
    label: string;
    blocks_entire_calendar: boolean;
  } | null;
  reservation_category_assignments?: {
    reservation_categories: {
      label: string;
      blocks_entire_calendar: boolean;
    } | null;
  }[];
}): PublicReservationCategorySnapshot {
  const { labels, blocksEntireCalendar } =
    collectCategoryLabelsFromReservationRow(row);
  return {
    startAt: new Date(row.start_at),
    endAt: new Date(row.end_at),
    categoryLabels: labels,
    blocksEntireCalendar,
  };
}

/** 公開 API 用：メイン/ロビー/デッキカテゴリが1つも紐づいていない予約は ○ 判定に影響しない */
export function reservationAffectsPublicAvailability(
  snapshot: PublicReservationCategorySnapshot,
): boolean {
  if (snapshot.blocksEntireCalendar) return true;
  for (const label of snapshot.categoryLabels) {
    if (
      label === PUBLIC_AVAILABILITY_CATEGORY_LABELS.main ||
      label === PUBLIC_AVAILABILITY_CATEGORY_LABELS.lobby ||
      label === PUBLIC_AVAILABILITY_CATEGORY_LABELS.deck
    ) {
      return true;
    }
  }
  return false;
}
