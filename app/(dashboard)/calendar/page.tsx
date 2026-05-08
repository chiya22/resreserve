import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarView } from "@/components/calendar/CalendarView";
import { getReservationFetchRangeUtc } from "@/lib/calendar/reservation-fetch-range";
import { getCurrentStaff } from "@/lib/data/auth";
import { listClosedDaysAll } from "@/lib/data/closed-days";
import { listReservationCategories } from "@/lib/data/reservation-categories";
import { getReservationsByDateRange } from "@/lib/data/reservations";
import { listTables } from "@/lib/data/tables";

export const metadata: Metadata = {
  title: "予約カレンダー | 予約管理",
  description: "飲食店の予約を月・週・日で表示します。",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const sp = await searchParams;

  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?message=staff_required");

  const rawView = sp.view;
  const view: "day" | "week" | "month" =
    rawView === "day" || rawView === "week" || rawView === "month"
      ? rawView
      : "month";

  const baseDate = sp.date ? new Date(sp.date) : new Date();
  const safeBase = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;

  const { rangeStart, rangeEnd } = getReservationFetchRangeUtc(safeBase, view);

  const [reservations, tables, categoryRows, closedDays] = await Promise.all([
    getReservationsByDateRange(rangeStart, rangeEnd),
    listTables(),
    listReservationCategories(),
    listClosedDaysAll(),
  ]);

  const dateKey = safeBase.toISOString();

  return (
    <CalendarView
      key={`${view}-${dateKey}`}
      initialReservations={reservations}
      tables={tables}
      initialView={view}
      initialDate={dateKey}
      staffName={staff.name}
      staffIsOwner={staff.role === "owner"}
      staffCanManageClosedDays={
        staff.role === "owner" || staff.role === "manager"
      }
      categoryRows={categoryRows}
      initialClosedDays={closedDays}
    />
  );
}
