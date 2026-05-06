"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DayCalendarView } from "@/components/calendar/DayCalendarView";
import { MonthCalendarView } from "@/components/calendar/MonthCalendarView";
import { WeekCalendarPanel } from "@/components/calendar/WeekCalendarPanel";
import type { CalendarCategoryFilterOption } from "@/components/calendar/CategoryFilterControl";
import { NewReservationModal } from "@/components/modals/NewReservationModal";
import { ReservationDetailModal } from "@/components/modals/ReservationDetailModal";
import { useReservationsRealtime } from "@/hooks/useReservationsRealtime";
import {
  bookingFormCategoriesFromRows,
  categoryLabelsById,
  sortReservationCategories,
} from "@/lib/calendar/category-display";
import { HOUR_END } from "@/lib/calendar/calendar-constants";
import { mapReservationWithTableToCalendar } from "@/lib/calendar/map-supabase-reservation";
import type { Reservation } from "@/lib/calendar/types";
import {
  computeWeekOverlapLayouts,
  DAY_PX_PER_HOUR,
  WEEK_PX_PER_HOUR,
} from "@/lib/calendar/day-layout";
import {
  addMinutes,
  defaultNewReservationRangeForDay,
  slotYToStart,
} from "@/lib/calendar/datetime-ui";
import {
  addDays,
  formatMonthRange,
  startOfLocalDay,
  startOfWeekSunday,
} from "@/lib/calendar/week";
import type {
  ReservationCategoryRow,
  ReservationWithTable,
  Table,
} from "@/types";

export type CalendarViewProps = {
  initialReservations: ReservationWithTable[];
  tables: Table[];
  initialView: "week" | "day" | "month";
  initialDate: string;
  staffName: string;
  staffIsOwner: boolean;
  categoryRows: ReservationCategoryRow[];
};

function endOfBusinessDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(HOUR_END, 0, 0, 0);
  return x;
}

function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    queueMicrotask(() => {
      setNow(new Date());
    });
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function CalendarView({
  initialReservations,
  tables,
  initialView: view,
  initialDate,
  staffName,
  staffIsOwner,
  categoryRows,
}: CalendarViewProps) {
  const router = useRouter();

  const categoryLabelById = useMemo(
    () => categoryLabelsById(categoryRows),
    [categoryRows],
  );
  const bookingCategoryOptions = useMemo(
    () => bookingFormCategoriesFromRows(categoryRows),
    [categoryRows],
  );

  const defaultNewCategoryId = useMemo(() => {
    const normal = categoryRows.find((c) => c.code === "normal");
    if (normal && normal.show_in_booking_form) return normal.id;
    return bookingCategoryOptions[0]?.value;
  }, [categoryRows, bookingCategoryOptions]);

  const daySummaryCategories = useMemo(
    () =>
      sortReservationCategories(categoryRows).map((r) => ({
        id: r.id,
        label: r.label,
        palette_key: r.palette_key,
      })),
    [categoryRows],
  );
  const categoryFilterOptions = useMemo<CalendarCategoryFilterOption[]>(
    () =>
      sortReservationCategories(categoryRows).map((r) => ({
        id: r.id,
        label: r.label,
      })),
    [categoryRows],
  );
  const [categoryFilterIds, setCategoryFilterIds] = useState<string[]>([]);

  const anchorDate = useMemo(() => {
    const d = new Date(initialDate);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [initialDate]);

  const weekStartSunday = useMemo(
    () => startOfWeekSunday(anchorDate),
    [anchorDate],
  );
  const daySelected = useMemo(() => startOfLocalDay(anchorDate), [anchorDate]);
  const monthAnchor = useMemo(
    () => new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1),
    [anchorDate],
  );

  const pushCalendar = useCallback(
    (date: Date, nextView: "day" | "week" | "month") => {
      const params = new URLSearchParams();
      params.set("date", date.toISOString());
      params.set("view", nextView);
      router.push(`/calendar?${params.toString()}`);
    },
    [router],
  );

  const [showNewModal, setShowNewModal] = useState(false);
  const [newDefaultStart, setNewDefaultStart] = useState<string | undefined>();
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);

  const now = useMinuteClock();

  const { reservations: reservationRows } = useReservationsRealtime({
    initialData: initialReservations,
  });

  const reservations = useMemo(
    () => reservationRows.map(mapReservationWithTableToCalendar),
    [reservationRows],
  );
  const filteredReservations = useMemo(() => {
    if (categoryFilterIds.length === 0) return reservations;
    const selected = new Set(categoryFilterIds);
    return reservations.filter((r) => selected.has(r.categoryId));
  }, [reservations, categoryFilterIds]);

  const toggleCategoryFilter = useCallback((categoryId: string) => {
    setCategoryFilterIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  }, []);

  const clearCategoryFilter = useCallback(() => {
    setCategoryFilterIds([]);
  }, []);

  const selectedReservation = useMemo(() => {
    if (!selectedReservationId) return null;
    return (
      reservationRows.find((r) => r.id === selectedReservationId) ?? null
    );
  }, [selectedReservationId, reservationRows]);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(weekStartSunday, i);
        d.setHours(0, 0, 0, 0);
        return d;
      }),
    [weekStartSunday],
  );

  const monthLabel = useMemo(
    () => formatMonthRange(weekStartSunday),
    [weekStartSunday],
  );

  const blocksByDayIndex = useMemo(
    () =>
      weekDays.map((day) => computeWeekOverlapLayouts(filteredReservations, day)),
    [weekDays, filteredReservations],
  );

  const openHeaderNew = () => {
    setNewDefaultStart(undefined);
    setShowNewModal(true);
  };

  const openSlotNewInternal = useCallback(
    (day: Date, offsetY: number, pxPerHour: number) => {
      const start = slotYToStart(day, offsetY, pxPerHour);
      let end = addMinutes(start, 90);
      const lim = endOfBusinessDay(start);
      if (end > lim) end = lim;
      setNewDefaultStart(start.toISOString());
      setShowNewModal(true);
    },
    [],
  );

  const handleReservationClick = useCallback((r: Reservation) => {
    setSelectedReservationId(r.id);
  }, []);

  const onSelectViewDay = () => {
    pushCalendar(startOfLocalDay(new Date()), "day");
  };

  const onSelectViewWeek = () => {
    pushCalendar(startOfWeekSunday(daySelected), "week");
  };

  const onSelectViewMonth = () => {
    let d: Date;
    if (view === "week") {
      d = addDays(weekStartSunday, 3);
    } else {
      d = daySelected;
    }
    pushCalendar(new Date(d.getFullYear(), d.getMonth(), 1), "month");
  };

  const onDayHeaderClick = (d: Date) => {
    pushCalendar(startOfLocalDay(d), "day");
  };

  const onPickDayFromMonth = (d: Date) => {
    pushCalendar(startOfLocalDay(d), "day");
  };

  const openMonthEmptyCellNew = useCallback((d: Date) => {
    const range = defaultNewReservationRangeForDay(startOfLocalDay(d));
    setNewDefaultStart(range.start.toISOString());
    setShowNewModal(true);
  }, []);

  const goPrevWeek = () => pushCalendar(addDays(weekStartSunday, -7), "week");
  const goNextWeek = () => pushCalendar(addDays(weekStartSunday, 7), "week");
  const goThisWeek = () => pushCalendar(startOfWeekSunday(new Date()), "week");

  const goPrevMonth = () =>
    pushCalendar(
      new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1),
      "month",
    );
  const goNextMonth = () =>
    pushCalendar(
      new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1),
      "month",
    );

  return (
    <>
      <span hidden data-table-count={tables.length} />
      {view === "week" ? (
        <WeekCalendarPanel
          weekStartSunday={weekStartSunday}
          monthLabel={monthLabel}
          weekDays={weekDays}
          blocksByDayIndex={blocksByDayIndex}
          now={now}
          activeView={view}
          staffName={staffName}
          staffIsOwner={staffIsOwner}
          categoryFilterOptions={categoryFilterOptions}
          categoryFilterIds={categoryFilterIds}
          onToggleCategoryFilter={toggleCategoryFilter}
          onClearCategoryFilter={clearCategoryFilter}
          onPrevWeek={goPrevWeek}
          onNextWeek={goNextWeek}
          onThisWeek={goThisWeek}
          onOpenHeaderNew={openHeaderNew}
          onSelectViewDay={onSelectViewDay}
          onSelectViewWeek={onSelectViewWeek}
          onSelectViewMonth={onSelectViewMonth}
          onDayHeaderClick={onDayHeaderClick}
          onSlotClick={(d, y) =>
            openSlotNewInternal(d, y, WEEK_PX_PER_HOUR)
          }
          onReservationClick={handleReservationClick}
        />
      ) : view === "day" ? (
        <DayCalendarView
          daySelected={daySelected}
          now={now}
          activeView={view}
          staffName={staffName}
          staffIsOwner={staffIsOwner}
          categoryFilterOptions={categoryFilterOptions}
          categoryFilterIds={categoryFilterIds}
          onToggleCategoryFilter={toggleCategoryFilter}
          onClearCategoryFilter={clearCategoryFilter}
          summaryCategories={daySummaryCategories}
          reservations={filteredReservations}
          onPrevDay={() =>
            pushCalendar(startOfLocalDay(addDays(daySelected, -1)), "day")
          }
          onNextDay={() =>
            pushCalendar(startOfLocalDay(addDays(daySelected, 1)), "day")
          }
          onToday={() => pushCalendar(startOfLocalDay(new Date()), "day")}
          onOpenHeaderNew={openHeaderNew}
          onSelectViewDay={onSelectViewDay}
          onSelectViewWeek={onSelectViewWeek}
          onSelectViewMonth={onSelectViewMonth}
          onSlotClick={(y) =>
            openSlotNewInternal(daySelected, y, DAY_PX_PER_HOUR)
          }
          onReservationClick={handleReservationClick}
        />
      ) : (
        <MonthCalendarView
          monthAnchor={monthAnchor}
          now={now}
          activeView={view}
          staffName={staffName}
          staffIsOwner={staffIsOwner}
          categoryFilterOptions={categoryFilterOptions}
          categoryFilterIds={categoryFilterIds}
          onToggleCategoryFilter={toggleCategoryFilter}
          onClearCategoryFilter={clearCategoryFilter}
          reservations={filteredReservations}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
          onOpenHeaderNew={openHeaderNew}
          onToday={() => pushCalendar(startOfLocalDay(new Date()), "month")}
          onSelectViewDay={onSelectViewDay}
          onSelectViewWeek={onSelectViewWeek}
          onSelectViewMonth={onSelectViewMonth}
          onPickDay={onPickDayFromMonth}
          onSlotClick={openMonthEmptyCellNew}
          onReservationClick={handleReservationClick}
        />
      )}

      {showNewModal ? (
        <NewReservationModal
          key={`${newDefaultStart ?? "default"}-${bookingCategoryOptions.length}`}
          bookingCategoryOptions={bookingCategoryOptions}
          defaultCategoryIdHint={defaultNewCategoryId}
          defaultStartAt={newDefaultStart}
          onClose={() => {
            setShowNewModal(false);
            setNewDefaultStart(undefined);
          }}
        />
      ) : null}

      {selectedReservation ? (
        <ReservationDetailModal
          reservation={selectedReservation}
          categoryLabelById={categoryLabelById}
          bookingCategoryOptions={bookingCategoryOptions}
          onClose={() => setSelectedReservationId(null)}
        />
      ) : null}
    </>
  );
}
