"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DayCalendarView } from "@/components/calendar/DayCalendarView";
import { MonthCalendarView } from "@/components/calendar/MonthCalendarView";
import { WeekCalendarPanel } from "@/components/calendar/WeekCalendarPanel";
import { NewReservationModal } from "@/components/modals/NewReservationModal";
import { ReservationDetailModal } from "@/components/modals/ReservationDetailModal";
import { useReservationsRealtime } from "@/hooks/useReservationsRealtime";
import { HOUR_END } from "@/lib/calendar/calendar-constants";
import { mapReservationWithTableToCalendar } from "@/lib/calendar/map-supabase-reservation";
import type { Reservation } from "@/lib/calendar/types";
import { computeWeekOverlapLayouts } from "@/lib/calendar/day-layout";
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
import type { ReservationWithTable, Table } from "@/types";

export type CalendarViewProps = {
  initialReservations: ReservationWithTable[];
  tables: Table[];
  initialView: "week" | "day" | "month";
  initialDate: string;
  staffName: string;
  staffIsOwner: boolean;
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
}: CalendarViewProps) {
  const router = useRouter();

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

  const selectedReservation = useMemo(() => {
    if (!selectedReservationId) return null;
    return (
      reservationRows.find((r) => r.id === selectedReservationId) ?? null
    );
  }, [selectedReservationId, reservationRows]);

  useEffect(() => {
    if (selectedReservationId && !selectedReservation) {
      setSelectedReservationId(null);
    }
  }, [selectedReservationId, selectedReservation]);

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
    () => weekDays.map((day) => computeWeekOverlapLayouts(reservations, day)),
    [weekDays, reservations],
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
          onPrevWeek={goPrevWeek}
          onNextWeek={goNextWeek}
          onThisWeek={goThisWeek}
          onOpenHeaderNew={openHeaderNew}
          onSelectViewDay={onSelectViewDay}
          onSelectViewWeek={onSelectViewWeek}
          onSelectViewMonth={onSelectViewMonth}
          onDayHeaderClick={onDayHeaderClick}
          onSlotClick={(d, y) => openSlotNewInternal(d, y, 48)}
          onReservationClick={handleReservationClick}
        />
      ) : view === "day" ? (
        <DayCalendarView
          daySelected={daySelected}
          now={now}
          activeView={view}
          staffName={staffName}
          staffIsOwner={staffIsOwner}
          reservations={reservations}
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
          onSlotClick={(y) => openSlotNewInternal(daySelected, y, 60)}
          onReservationClick={handleReservationClick}
        />
      ) : (
        <MonthCalendarView
          monthAnchor={monthAnchor}
          now={now}
          activeView={view}
          staffName={staffName}
          staffIsOwner={staffIsOwner}
          reservations={reservations}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
          onOpenHeaderNew={openHeaderNew}
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
          key={newDefaultStart ?? "default"}
          tables={tables}
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
          tables={tables}
          onClose={() => setSelectedReservationId(null)}
        />
      ) : null}
    </>
  );
}
