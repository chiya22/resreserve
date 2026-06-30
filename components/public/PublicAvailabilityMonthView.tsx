"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ClosedDayMobileBadge } from "@/components/calendar/ClosedDayMobileBadge";
import { MonthYearPickerPopover } from "@/components/calendar/MonthYearPickerPopover";
import { AvailabilityBookingRequestModal } from "@/components/public/AvailabilityBookingRequestModal";
import {
  calPageShell,
  calScrollX,
  calTouchNavArrow,
} from "@/lib/calendar/calendar-toolbar-classes";
import { buildMonthWeeks, isInMonth } from "@/lib/calendar/month-grid";
import type { PublicMonthlyAvailability } from "@/lib/data/public-availability";
import {
  PUBLIC_AVAILABILITY_MARK_LEGEND,
  publicAvailabilityMarkLabel,
  type PublicAvailabilityMark,
} from "@/lib/public/availability-status";
import {
  addCalendarMonths,
  calendarDayOfMonth,
  calendarYearMonth,
  isSameLocalDay,
  localDateKey,
  ymdToStartOfDay,
} from "@/lib/calendar/week";

const bookableCellInteractiveClass =
  "cursor-pointer transition-colors duration-[120ms] hover:bg-reservation-normal-bg focus-visible:bg-reservation-normal-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent active:bg-[#BFDBFE]";

const WEEK_HEADER = ["日", "月", "火", "水", "木", "金", "土"] as const;

export type PublicAvailabilityMonthViewProps = {
  monthAnchor: Date;
  availability: PublicMonthlyAvailability;
  now: Date;
};

function monthTitle(d: Date): string {
  const { year, month } = calendarYearMonth(d);
  return `${year}年${month}月`;
}

function markToneClass(mark: PublicAvailabilityMark): string {
  switch (mark) {
    case "○":
      return "text-text-secondary";
    case "△":
      return "text-[#92400E]";
    case "×":
      return "text-reservation-waitlist-text";
    default:
      return "text-text-secondary";
  }
}

/** ○×はグリフの見え方が小さいため、△より一段大きくする */
function markSizeClass(mark: PublicAvailabilityMark): string {
  switch (mark) {
    case "○":
    case "×":
      return "text-[28px]";
    case "△":
      return "text-[22px]";
    default:
      return "text-[22px]";
  }
}

function markDisplayClass(mark: PublicAvailabilityMark): string {
  return `inline-flex items-center justify-center font-medium leading-none ${markSizeClass(mark)} ${markToneClass(mark)}`;
}

function isBookingRequestMark(
  mark: PublicAvailabilityMark | undefined,
): mark is "○" | "△" {
  return mark === "○" || mark === "△";
}

type BookingRequestSelection = {
  dateYmd: string;
};

export function PublicAvailabilityMonthView({
  monthAnchor,
  availability,
  now,
}: PublicAvailabilityMonthViewProps) {
  const router = useRouter();
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [bookingRequest, setBookingRequest] =
    useState<BookingRequestSelection | null>(null);
  const weeks = useMemo(() => buildMonthWeeks(monthAnchor), [monthAnchor]);
  const closedSet = useMemo(
    () => new Set(availability.closedDays),
    [availability.closedDays],
  );

  function navigateToMonth(anchor: Date) {
    const { year, month } = calendarYearMonth(anchor);
    router.push(`/availability?year=${year}&month=${month}`);
  }

  function handlePrevMonth() {
    navigateToMonth(addCalendarMonths(monthAnchor, -1));
  }

  function handleNextMonth() {
    navigateToMonth(addCalendarMonths(monthAnchor, 1));
  }

  function handleJumpMonth(value: string) {
    const d = ymdToStartOfDay(`${value}-01`);
    navigateToMonth(d);
  }

  return (
    <div className={calPageShell}>
      <header className="flex flex-col gap-3">
        <div className="flex min-w-0 items-center justify-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="前の月"
            className={calTouchNavArrow}
          >
            ◀
          </button>
          <div className="relative min-w-0 flex-1 sm:min-w-[7.5rem] sm:flex-none">
            <button
              type="button"
              onClick={() => setMonthPickerOpen(true)}
              aria-expanded={monthPickerOpen}
              aria-haspopup="dialog"
              className="min-h-11 min-w-0 max-w-full w-full rounded-md px-1 text-center text-[17px] font-medium leading-none text-text-primary hover:bg-bg-hover sm:px-2"
              aria-label="年月を選択"
            >
              {monthTitle(monthAnchor)}
            </button>
            <MonthYearPickerPopover
              monthAnchor={monthAnchor}
              open={monthPickerOpen}
              onClose={() => setMonthPickerOpen(false)}
              onSelectMonth={handleJumpMonth}
            />
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="次の月"
            className={calTouchNavArrow}
          >
            ▶
          </button>
        </div>
        <ul className="flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-text-secondary">
          {PUBLIC_AVAILABILITY_MARK_LEGEND.map((item) => (
            <li key={item.mark} className="flex items-center gap-1.5">
              <span
                className={`min-h-7 min-w-7 ${markDisplayClass(item.mark)}`}
                aria-hidden
              >
                {item.mark}
              </span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </header>

      <div className={calScrollX}>
        <div className="w-full min-w-0 max-w-full overflow-hidden rounded-[10px] border-[0.5px] border-border bg-bg-primary">
          <div className="grid grid-cols-7 border-b-[0.5px] border-border">
            {WEEK_HEADER.map((label, i) => (
              <div
                key={i}
                className={`flex min-h-10 items-center justify-center text-[11px] ${
                  i === 0
                    ? "text-[#EF4444]"
                    : i === 6
                      ? "text-[#3B82F6]"
                      : "text-text-tertiary"
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {weeks.map((row, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {row.map((date, colIdx) => {
                const inMonth = isInMonth(date, monthAnchor);
                const isToday = isSameLocalDay(date, now);
                const dayKey = localDateKey(date);
                const isClosedDay = closedSet.has(dayKey);
                const sunCol = colIdx === 0;
                const satCol = colIdx === 6;
                let cellBg = "bg-bg-primary";
                if (!inMonth) cellBg = "bg-bg-surface";
                else if (sunCol) cellBg = "bg-[#FFF5F5]";
                else if (satCol) cellBg = "bg-[#F0F9FF]";
                if (isClosedDay) cellBg = "bg-reservation-waitlist-bg/30";

                const { year, month } = calendarYearMonth(date);
                const dayNum = calendarDayOfMonth(date);
                const mark = inMonth ? availability.days[dayKey] : undefined;
                const isClickable =
                  inMonth && !isClosedDay && isBookingRequestMark(mark);

                const cellClassName = `relative box-border flex min-h-[88px] w-full flex-col items-center px-1 pb-2 pt-[5px] md:min-h-[96px] ${cellBg} border-b-[0.5px] border-r-[0.5px] border-border`;

                const cellContent = (
                  <>
                    <span className="flex shrink-0 items-center gap-1 self-start">
                      <span className="relative inline-flex items-center justify-center">
                        <span
                          className={`flex min-h-9 min-w-9 items-center justify-center text-[13px] leading-none ${
                            isToday
                              ? "rounded-full bg-accent font-medium text-white"
                              : inMonth
                                ? "font-medium text-text-primary"
                                : "font-medium text-[#D1D5DB]"
                          }`}
                        >
                          {dayNum}
                        </span>
                        {isClosedDay ? (
                          <ClosedDayMobileBadge isToday={isToday} />
                        ) : null}
                      </span>
                      {isClosedDay ? (
                        <span className="hidden text-[10px] font-medium leading-none text-reservation-waitlist-text sm:inline">
                          休業日
                        </span>
                      ) : null}
                    </span>
                    {inMonth ? (
                      <div className="mt-1 flex flex-1 items-center justify-center">
                        {isClosedDay ? (
                          <span className="text-[11px] text-text-tertiary">休</span>
                        ) : mark ? (
                          <span
                            className={`min-h-8 ${markDisplayClass(mark)}`}
                            aria-hidden={isClickable}
                            {...(!isClickable
                              ? {
                                  "aria-label": `${year}年${month}月${dayNum}日: ${publicAvailabilityMarkLabel(mark)}`,
                                }
                              : {})}
                          >
                            {mark}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                );

                if (isClickable) {
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => setBookingRequest({ dateYmd: dayKey })}
                      className={`${cellClassName} ${bookableCellInteractiveClass}`}
                      aria-label={`${year}年${month}月${dayNum}日: ${publicAvailabilityMarkLabel(mark)} — 予約入力`}
                    >
                      {cellContent}
                    </button>
                  );
                }

                return (
                  <div key={date.toISOString()} className={cellClassName}>
                    {cellContent}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {bookingRequest ? (
        <AvailabilityBookingRequestModal
          reservationDate={bookingRequest.dateYmd}
          onClose={() => setBookingRequest(null)}
        />
      ) : null}
    </div>
  );
}
