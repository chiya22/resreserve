"use client";

import { useMemo } from "react";
import { CalendarToolbarEnd } from "@/components/calendar/CalendarToolbarEnd";
import type { Reservation } from "@/lib/calendar/types";
import { RESERVATION_TONE_CLASS } from "@/lib/calendar/reservation-palette-classes";
import { buildMonthWeeks, isInMonth } from "@/lib/calendar/month-grid";
import { formatTimeHm } from "@/lib/calendar/datetime-ui";
import {
  computeSpanSegmentsForWeek,
  isMultiDayReservation,
} from "@/lib/calendar/month-span-layout";
import type { CalendarViewMode } from "@/lib/calendar/view-mode";
import { isSameLocalDay } from "@/lib/calendar/week";

const WEEK_HEADER = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 3件＋「他N件」1行を同じ h-5 で積んだときに収まるセル高（100px では4行が足りないため） */
const MONTH_CELL_H = 118;
/** 複数日バー用オーバーレイの最大高（多段時は下のチップ領域を潰さない） */
const MONTH_SPAN_OVERLAY_MAX_H = 52;

export type MonthCalendarViewProps = {
  monthAnchor: Date;
  now: Date;
  activeView: CalendarViewMode;
  staffName: string;
  staffIsOwner: boolean;
  reservations: Reservation[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenHeaderNew: () => void;
  onSelectViewDay: () => void;
  onSelectViewWeek: () => void;
  onSelectViewMonth: () => void;
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
  reservations,
  onPrevMonth,
  onNextMonth,
  onOpenHeaderNew,
  onSelectViewDay,
  onSelectViewWeek,
  onSelectViewMonth,
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
        const laneBarsH = maxLane < 0 ? 0 : (maxLane + 1) * 22;
        return { row, segments, laneBarsH };
      }),
    [weeks, reservations],
  );

  return (
    <div className="flex min-h-full flex-1 flex-col gap-4 px-6 py-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="前の月"
            className="active:scale-[0.97] rounded-lg border-[0.5px] border-border bg-bg-primary px-2.5 py-1.5 text-text-secondary transition-transform duration-100 hover:bg-bg-hover"
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
            className="active:scale-[0.97] rounded-lg border-[0.5px] border-border bg-bg-primary px-2.5 py-1.5 text-text-secondary transition-transform duration-100 hover:bg-bg-hover"
          >
            ▶
          </button>
          <button
            type="button"
            onClick={onOpenHeaderNew}
            className="active:scale-[0.97] rounded-md border-[0.5px] border-border bg-bg-primary px-[10px] py-1 text-xs font-medium text-accent transition-transform duration-100 hover:bg-bg-hover"
          >
            ＋ 新規予約
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <nav
            className="flex items-center gap-1"
            aria-label="カレンダー表示切り替え"
          >
            <button
              type="button"
              onClick={onSelectViewDay}
              className={
                activeView === "day"
                  ? "rounded-md border-[0.5px] border-border bg-bg-hover px-[10px] py-1 text-xs text-text-primary"
                  : "rounded-md border-[0.5px] border-transparent px-[10px] py-1 text-xs text-text-secondary hover:bg-bg-hover"
              }
            >
              日
            </button>
            <button
              type="button"
              onClick={onSelectViewWeek}
              className={
                activeView === "week"
                  ? "rounded-md border-[0.5px] border-border bg-bg-hover px-[10px] py-1 text-xs text-text-primary"
                  : "rounded-md border-[0.5px] border-transparent px-[10px] py-1 text-xs text-text-secondary hover:bg-bg-hover"
              }
            >
              週
            </button>
            <button
              type="button"
              onClick={onSelectViewMonth}
              className={
                activeView === "month"
                  ? "rounded-md border-[0.5px] border-border bg-bg-hover px-[10px] py-1 text-xs text-text-primary"
                  : "rounded-md border-[0.5px] border-transparent px-[10px] py-1 text-xs text-text-secondary hover:bg-bg-hover"
              }
            >
              月
            </button>
          </nav>
          <CalendarToolbarEnd staffName={staffName} staffIsOwner={staffIsOwner} />
        </div>
      </header>

      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="min-w-[560px] overflow-hidden rounded-[10px] border-[0.5px] border-border bg-bg-primary">
          <div className="grid grid-cols-7 border-b-[0.5px] border-border">
            {WEEK_HEADER.map((label, i) => (
              <div
                key={label}
                className={`flex h-8 items-center justify-center text-[11px] ${
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
                const sunCol = colIdx === 0;
                const satCol = colIdx === 6;
                let cellBg = "bg-bg-primary";
                if (!inMonth) cellBg = "bg-bg-surface";
                else if (sunCol) cellBg = "bg-[#FFF5F5]";
                else if (satCol) cellBg = "bg-[#F0F9FF]";

                const singles = reservations
                  .filter((r) => singleDayOnCell(r, date))
                  .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
                const shown = singles.slice(0, 3);
                const more = singles.length - shown.length;

                return (
                  <div
                    key={date.toISOString()}
                    style={{ height: MONTH_CELL_H }}
                    className={`relative box-border flex min-h-0 flex-col overflow-hidden border-b-[0.5px] border-r-[0.5px] border-border px-1 pb-1 pt-[5px] ${cellBg}`}
                    onClick={() => onSlotClick(date)}
                  >
                    <div className="flex shrink-0 items-start justify-start">
                      <button
                        type="button"
                        aria-label={`${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日の日表示`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPickDay(date);
                        }}
                        className="cursor-pointer border-0 bg-transparent p-0 text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-0"
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center text-[13px] leading-none ${
                            isToday
                              ? "rounded-full bg-accent font-medium text-white"
                              : inMonth
                                ? "font-medium text-text-primary"
                                : "font-medium text-[#D1D5DB]"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                      </button>
                    </div>
                    <div className="flex min-h-0 shrink-0 flex-col gap-0.5 pt-0.5">
                      {shown.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReservationClick(r);
                          }}
                          className={`h-5 max-w-full shrink-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-[3px] px-[5px] py-0.5 text-left text-[11px] font-medium transition-opacity duration-[120ms] hover:opacity-[0.82] ${RESERVATION_TONE_CLASS[r.paletteKey]}`}
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
                          className="h-5 max-w-full shrink-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-[3px] px-[5px] py-0.5 text-left text-[10px] font-medium leading-none text-text-secondary transition-opacity duration-[120ms] hover:opacity-[0.82]"
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
                style={{ top: 33, height: spanOverlayH }}
              >
                {segments.map((seg) => {
                  const span = seg.endCol - seg.startCol + 1;
                  const left = (seg.startCol / 7) * 100;
                  const width = (span / 7) * 100;
                  const top = seg.lane * 22;
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
                        height: 20,
                      }}
                      className={`pointer-events-auto absolute box-border overflow-hidden text-ellipsis whitespace-nowrap px-[5px] py-0.5 text-left text-[11px] font-medium transition-opacity duration-[120ms] hover:opacity-[0.82] ${RESERVATION_TONE_CLASS[seg.res.paletteKey]} ${rounded}`}
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
