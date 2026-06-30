import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeDayAvailabilityMark,
  getCalendarMonthRangeUtc,
  listYmdInCalendarMonth,
  parseYearMonthParams,
  PUBLIC_AVAILABILITY_MARK_LABELS,
  reservationAffectsPublicAvailability,
  toReservationCategorySnapshot,
  type PublicAvailabilityMark,
} from "@/lib/public/availability-status";

export type PublicMonthlyAvailability = {
  year: number;
  month: number;
  /** 記号と表示ラベルの対応（○=予約可、△=要確認、×=予約不可） */
  markLabels: Record<PublicAvailabilityMark, string>;
  days: Record<string, PublicAvailabilityMark>;
  closedDays: string[];
};

const PUBLIC_RESERVATION_SELECT = `
  id,
  start_at,
  end_at,
  reservation_categories!reservations_category_id_fkey (
    label,
    blocks_entire_calendar
  ),
  reservation_category_assignments (
    reservation_categories (
      label,
      blocks_entire_calendar
    )
  )
` as const;

type PublicReservationRow = {
  id: string;
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
};

export async function getPublicMonthlyAvailability(
  year: number,
  month: number,
): Promise<PublicMonthlyAvailability | null> {
  if (month < 1 || month > 12 || year < 2000 || year > 2100) {
    return null;
  }

  const { rangeStart, rangeEnd } = getCalendarMonthRangeUtc(year, month);
  const monthYmds = listYmdInCalendarMonth(year, month);

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("getPublicMonthlyAvailability: admin client unavailable:", error);
    return null;
  }

  const [reservationsResult, closedResult] = await Promise.all([
    admin
      .from("reservations")
      .select(PUBLIC_RESERVATION_SELECT)
      .neq("status", "cancelled")
      .neq("status", "no_show")
      .lt("start_at", rangeEnd.toISOString())
      .gt("end_at", rangeStart.toISOString()),
    admin
      .from("closed_days")
      .select("closed_on")
      .gte("closed_on", monthYmds[0] ?? `${year}-01-01`)
      .lte("closed_on", monthYmds[monthYmds.length - 1] ?? `${year}-12-31`)
      .order("closed_on", { ascending: true }),
  ]);

  if (reservationsResult.error) {
    console.error(
      "getPublicMonthlyAvailability: reservations query failed:",
      reservationsResult.error,
    );
    return null;
  }

  if (closedResult.error) {
    console.error(
      "getPublicMonthlyAvailability: closed_days query failed:",
      closedResult.error,
    );
    return null;
  }

  const snapshots = ((reservationsResult.data ?? []) as PublicReservationRow[])
    .map(toReservationCategorySnapshot)
    .filter(reservationAffectsPublicAvailability);

  const days: Record<string, PublicAvailabilityMark> = {};
  for (const ymd of monthYmds) {
    days[ymd] = computeDayAvailabilityMark(snapshots, ymd);
  }

  const closedDays = (closedResult.data ?? []).map((row) => row.closed_on);

  return {
    year,
    month,
    markLabels: { ...PUBLIC_AVAILABILITY_MARK_LABELS },
    days,
    closedDays,
  };
}

export function resolvePublicAvailabilityYearMonth(
  yearRaw: string | null | undefined,
  monthRaw: string | null | undefined,
): { year: number; month: number } | null {
  return parseYearMonthParams(yearRaw, monthRaw);
}
