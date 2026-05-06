"use client";

import { useMemo } from "react";
import { CalendarToolbarEnd } from "@/components/calendar/CalendarToolbarEnd";
import {
  CategoryFilterControl,
  type CalendarCategoryFilterOption,
} from "@/components/calendar/CategoryFilterControl";
import {
  calPageShell,
  calScrollX,
  calTouchAccentSm,
  calTouchNavArrow,
  calTouchOutlineSm,
  calViewSegBtn,
} from "@/lib/calendar/calendar-toolbar-classes";
import type { Reservation } from "@/lib/calendar/types";
import { RESERVATION_TONE_CLASS } from "@/lib/calendar/reservation-palette-classes";
import { buildMonthWeeks, isInMonth } from "@/lib/calendar/month-grid";
import { formatTimeHm } from "@/lib/calendar/datetime-ui";
import {
  computeSpanSegmentsForWeek,
  isMultiDayReservation,
} from "@/lib/calendar/month-span-layout";
import type { CalendarViewMode } from "@/lib/calendar/view-mode";
import { isSameLocalDay, localDateKey } from "@/lib/calendar/week";

const WEEK_HEADER = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 複数日バー 1 レーンの高さ（タップしやすいよう少し広げる） */
const MONTH_LANE_H = 28;
/** 複数日バー領域の上端（日付見出し分のオフセット） */
const MONTH_SPAN_TOP_PX = 40;
/** 複数日バー用オーバーレイの最大高（多段時は下のチップ領域を潰さない） */
const MONTH_SPAN_OVERLAY_MAX_H = 72;

export type MonthCalendarViewProps = {
  monthAnchor: Date;
  now: Date;
  activeView: CalendarViewMode;
  staffName: string;
  staffIsOwner: boolean;
  categoryFilterOptions: CalendarCategoryFilterOption[];
  categoryFilterIds: string[];
  onToggleCategoryFilter: (categoryId: string) => void;
  onClearCategoryFilter: () => void;
  reservations: Reservation[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenHeaderNew: () => void;
  onToday: () => void;
  onSelectViewDay: () => void;
  onSelectViewWeek: () => void;
  onSelectViewMonth: () => void;
  closedDayByDate: Map<string, string | null>;
  onPickDay: (d: Date) => void;
  /** セル内の空き領域クリック時: その日付で新規予約モーダルを開く */
  onSlotClick: (d: Date) => void;
  onReservationClick: (r: Reservation) => void;
};

function singleDayOnCell(res: Reservation, cell: Date): boolean {
  if (isMultiDayReservation(res)) return false;
  return isSameLocalDay(res.startAt, cell);
}

function monthTitle(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export function MonthCalendarView({
  monthAnchor,
  now,
  activeView,
  staffName,
  staffIsOwner,
  categoryFilterOptions,
  categoryFilterIds,
  onToggleCategoryFilter,
  onClearCategoryFilter,
  reservations,
  onPrevMonth,
  onNextMonth,
  onOpenHeaderNew,
  onToday,
  onSelectViewDay,
  onSelectViewWeek,
  onSelectViewMonth,
  closedDayByDate,
  onPickDay,
  onSlotClick,
  onReservationClick,
}: MonthCalendarViewProps) {
  const weeks = useMemo(() => buildMonthWeeks(monthAnchor), [monthAnchor]);

  const weekLayouts = useMemo(
    () =>
      weeks.map((row) => {
        const segments = computeSpanSegmentsForWeek(row, reservations);
        const maxLane = segments.reduce((m, s) => Math.max(m, s.lane), -1);
        const laneBarsH = maxLane < 0 ? 0 : (maxLane + 1) * MONTH_LANE_H;
        return { row, segments, laneBarsH };
      }),
    [weeks, reservations],
  );

  return (
    <div className={calPageShell}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="前の月"
            className={calTouchNavArrow}
          >
            ◀
          </button>
          <span className="min-w-[7.5rem] text-center text-[17px] font-medium leading-none text-text-primary">
            {monthTitle(monthAnchor)}
          </span>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="次の月"
            className={calTouchNavArrow}
          >
            ▶
          </button>
          <button type="button" onClick={onToday} className={calTouchOutlineSm}>
            今日
          </button>
          <button
            type="button"
            onClick={onOpenHeaderNew}
            className={calTouchAccentSm}
          >
            ＋ 新規予約
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <CategoryFilterControl
            options={categoryFilterOptions}
            selectedIds={categoryFilterIds}
            onToggle={onToggleCategoryFilter}
            onClear={onClearCategoryFilter}
          />
          <nav
            className="flex items-center gap-1"
            aria-label="カレンダー表示切り替え"
          >
            <button
              type="button"
              onClick={onSelectViewDay}
              className={calViewSegBtn(activeView === "day")}
            >
              日
            </button>
            <button
              type="button"
              onClick={onSelectViewWeek}
              className={calViewSegBtn(activeView === "week")}
            >
              週
            </button>
            <button
              type="button"
              onClick={onSelectViewMonth}
              className={calViewSegBtn(activeView === "month")}
            >
              月
            </button>
          </nav>
          <CalendarToolbarEnd staffName={staffName} staffIsOwner={staffIsOwner} />
        </div>
      </header>

      <div className={calScrollX}>
        <div className="min-w-[560px] overflow-hidden rounded-[10px] border-[0.5px] border-border bg-bg-primary md:min-w-[680px] lg:min-w-[760px]">
          <div className="grid grid-cols-7 border-b-[0.5px] border-border">
            {WEEK_HEADER.map((label, i) => (
              <div
                key={label}
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

          {weekLayouts.map(({ row, segments, laneBarsH }, wi) => {
            const spanOverlayH = Math.min(
              laneBarsH,
              MONTH_SPAN_OVERLAY_MAX_H,
            );
            return (
            <div key={wi} className="relative grid grid-cols-7">
              {row.map((date, colIdx) => {
                const inMonth = isInMonth(date, monthAnchor);
                const isToday = isSameLocalDay(date, now);
                const dayKey = localDateKey(date);
                const isClosedDay = closedDayByDate.has(dayKey);
                const closedDayNote = closedDayByDate.get(dayKey);
                const sunCol = colIdx === 0;
                const satCol = colIdx === 6;
                let cellBg = "bg-bg-primary";
                if (!inMonth) cellBg = "bg-bg-surface";
                else if (sunCol) cellBg = "bg-[#FFF5F5]";
                else if (satCol) cellBg = "bg-[#F0F9FF]";
                if (isClosedDay) cellBg = "bg-reservation-waitlist-bg/30";

                const singles = reservations
                  .filter((r) => singleDayOnCell(r, date))
                  .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
                const shown = singles.slice(0, 3);
                const more = singles.length - shown.length;

                return (
                  <div
                    key={date.toISOString()}
                    className={`relative box-border flex min-h-[124px] flex-col overflow-hidden border-b-[0.5px] border-r-[0.5px] border-border px-1 pb-1 pt-[5px] md:min-h-[136px] ${cellBg}`}
                    onClick={() => {
                      if (isClosedDay) return;
                      onSlotClick(date);
                    }}
                  >
                    <div className="flex shrink-0 items-start justify-start">
                      <button
                        type="button"
                        aria-label={`${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日の日表示`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPickDay(date);
                        }}
                        className="cursor-pointer touch-manipulation border-0 bg-transparent p-0 text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-0"
                      >
                        <span className="flex items-center gap-1">
                          <span
                            className={`flex min-h-9 min-w-9 items-center justify-center text-[13px] leading-none ${
                              isToday
                                ? "rounded-full bg-accent font-medium text-white"
                                : inMonth
                                  ? "font-medium text-text-primary"
                                  : "font-medium text-[#D1D5DB]"
                            }`}
                          >
                            {date.getDate()}
                          </span>
                          {isClosedDay ? (
                            <span className="text-[10px] font-medium leading-none text-reservation-waitlist-text">
                              休業日
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </div>
                    <div className="flex min-h-0 shrink-0 flex-col gap-1 pt-0.5">
                      {shown.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReservationClick(r);
                          }}
                          className={`min-h-7 max-w-full shrink-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-[3px] px-1.5 py-1 text-left text-[11px] font-medium transition-opacity duration-[120ms] hover:opacity-[0.82] touch-manipulation ${RESERVATION_TONE_CLASS[r.paletteKey]}`}
                        >
                          {formatTimeHm(r.startAt)} {r.customerName}
                        </button>
                      ))}
                      {more > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPickDay(date);
                          }}
                          className="min-h-7 max-w-full shrink-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-[3px] px-1.5 py-1 text-left text-[10px] font-medium leading-none text-text-secondary transition-opacity duration-[120ms] hover:opacity-[0.82] touch-manipulation"
                        >
                          他{more}件
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              <div
                className="pointer-events-none absolute left-0 right-0 overflow-hidden"
                style={{ top: MONTH_SPAN_TOP_PX, height: spanOverlayH }}
              >
                {segments.map((seg) => {
                  const span = seg.endCol - seg.startCol + 1;
                  const left = (seg.startCol / 7) * 100;
                  const width = (span / 7) * 100;
                  const top = seg.lane * MONTH_LANE_H;
                  const rounded =
                    seg.roundedLeft && seg.roundedRight
                      ? "rounded-[3px]"
                      : seg.roundedLeft
                        ? "rounded-l-[3px] rounded-r-none"
                        : seg.roundedRight
                          ? "rounded-l-none rounded-r-[3px]"
                          : "rounded-none";
                  return (
                    <button
                      key={`${seg.res.id}-${wi}-${seg.startCol}`}
                      type="button"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        top,
                        height: MONTH_LANE_H,
                      }}
                      className={`pointer-events-auto absolute box-border overflow-hidden text-ellipsis whitespace-nowrap px-1.5 py-0.5 text-left text-[11px] font-medium transition-opacity duration-[120ms] hover:opacity-[0.82] touch-manipulation ${RESERVATION_TONE_CLASS[seg.res.paletteKey]} ${rounded}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReservationClick(seg.res);
                      }}
                    >
                      {seg.showLabel
                        ? `${formatTimeHm(seg.res.startAt)} ${seg.res.customerName}`
                        : ""}
                    </button>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
