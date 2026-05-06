import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { endOfWeek, startOfWeek } from "date-fns";
import { CalendarView } from "@/components/calendar/CalendarView";
import { getCurrentStaff } from "@/lib/data/auth";
import { listClosedDaysInRange } from "@/lib/data/closed-days";
import { listReservationCategories } from "@/lib/data/reservation-categories";
import { getReservationsByDateRange } from "@/lib/data/reservations";
import { listTables } from "@/lib/data/tables";

export const metadata: Metadata = {
  title: "予約カレンダー | 予約管理",
  description: "飲食店の予約を月・週・日で表示します。",
};

function getDisplayRange(
  date: Date,
  view: "day" | "week" | "month",
): { rangeStart: Date; rangeEnd: Date } {
  if (view === "day") {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { rangeStart: start, rangeEnd: end };
  }
  if (view === "week") {
    return {
      rangeStart: startOfWeek(date, { weekStartsOn: 0 }),
      rangeEnd: endOfWeek(date, { weekStartsOn: 0 }),
    };
  }
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    rangeStart: startOfWeek(start, { weekStartsOn: 0 }),
    rangeEnd: endOfWeek(end, { weekStartsOn: 0 }),
  };
}

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

  const { rangeStart, rangeEnd } = getDisplayRange(safeBase, view);

  const [reservations, tables, categoryRows, closedDays] = await Promise.all([
    getReservationsByDateRange(rangeStart, rangeEnd),
    listTables(),
    listReservationCategories(),
    listClosedDaysInRange(rangeStart, rangeEnd),
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
      categoryRows={categoryRows}
      initialClosedDays={closedDays}
    />
  );
}
