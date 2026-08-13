import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarView } from "@/components/calendar/CalendarView";
import { getReservationFetchRangeUtc } from "@/lib/calendar/reservation-fetch-range";
import { getCurrentStaff } from "@/lib/data/auth";
import { listClosedDaysInRange } from "@/lib/data/closed-days";
import { listReservationCategories } from "@/lib/data/reservation-categories";
import { getReservationsByDateRange } from "@/lib/data/reservations";

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

  const rawView = sp.view;
  const view: "day" | "week" | "month" =
    rawView === "day" || rawView === "week" || rawView === "month"
      ? rawView
      : "month";

  const baseDate = sp.date ? new Date(sp.date) : new Date();
  const safeBase = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;

  const { rangeStart, rangeEnd } = getReservationFetchRangeUtc(safeBase, view);

  // 認証待ちで表示データの取得が直列化しないよう同時に投げる。
  // 未ログイン時も RLS により各クエリは空配列を返すだけで、下の redirect で描画されない。
  const [staff, reservations, categoryRows, closedDays] = await Promise.all([
    getCurrentStaff(),
    getReservationsByDateRange(rangeStart, rangeEnd),
    listReservationCategories(),
    listClosedDaysInRange(rangeStart, rangeEnd),
  ]);

  if (!staff) redirect("/login?message=staff_required");

  const dateKey = safeBase.toISOString();
  const serverNow = new Date().toISOString();

  return (
    <CalendarView
      key={`${view}-${dateKey}`}
      initialReservations={reservations}
      initialView={view}
      initialDate={dateKey}
      initialNow={serverNow}
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
