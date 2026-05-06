"use client";

import { CalendarToolbarEnd } from "@/components/calendar/CalendarToolbarEnd";
import type { DayOverlapLayout } from "@/lib/calendar/day-layout";
import { formatHmRange } from "@/lib/calendar/datetime-ui";
import type { Reservation } from "@/lib/calendar/types";
import { RESERVATION_BLOCK_CLASS } from "@/lib/calendar/reservation-palette-classes";
import type { CalendarViewMode } from "@/lib/calendar/view-mode";
import { isSameLocalDay, weekdayLabelJa } from "@/lib/calendar/week";

function groupByLane(layouts: DayOverlapLayout[]): DayOverlapLayout[][] {
  if (layouts.length === 0) return [[]];
  const laneCount = layouts[0]!.lanes;
  const cols: DayOverlapLayout[][] = Array.from({ length: laneCount }, () => []);
  for (const L of layouts) {
    cols[L.lane]!.push(L);
  }
  return cols;
}

const TIME_GUTTER_PX = 52;
const HEADER_HEIGHT_PX = 56;
const PX_PER_HOUR = 48;
const HOUR_START = 11;
const HOUR_END = 22;
const HOUR_COUNT = HOUR_END - HOUR_START;
const GRID_BODY_PX = HOUR_COUNT * PX_PER_HOUR;

const HOUR_ROWS = Array.from(
  { length: HOUR_COUNT },
  (_, i) => HOUR_START + i,
) as number[];

function WeekReservationBlock({
  res,
  layout,
  onOpen,
}: {
  res: Reservation;
  layout: { top: number; height: number };
  onOpen: (r: Reservation) => void;
}) {
  return (
    <div
      className={`pointer-events-auto absolute inset-x-[2px] z-[5] cursor-pointer rounded-[5px] border-l-[3px] border-solid border-y-0 border-r-0 px-[6px] py-[3px] transition-opacity duration-[120ms] ease-out hover:opacity-[0.82] ${RESERVATION_BLOCK_CLASS[res.paletteKey]}`}
      style={{
        top: layout.top,
        height: layout.height,
      }}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(res);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(res);
        }
      }}
    >
      <div className="text-xs font-medium leading-tight">
        {res.customerName} {res.partySize}名
      </div>
      <div className="mt-px text-[10px] leading-tight opacity-[0.85]">
        {formatHmRange(res.startAt, res.endAt)}
      </div>
      <div className="mt-px text-[10px] leading-tight opacity-[0.85]">
        {res.tableOrNote}
      </div>
    </div>
  );
}

export type WeekCalendarPanelProps = {
  weekStartSunday: Date;
  monthLabel: string;
  weekDays: Date[];
  blocksByDayIndex: DayOverlapLayout[][];
  now: Date;
  activeView: CalendarViewMode;
  staffName: string;
  staffIsOwner: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
  onOpenHeaderNew: () => void;
  onSelectViewDay: () => void;
  onSelectViewWeek: () => void;
  onSelectViewMonth: () => void;
  onDayHeaderClick: (d: Date) => void;
  onSlotClick: (day: Date, offsetY: number) => void;
  onReservationClick: (r: Reservation) => void;
};

export function WeekCalendarPanel({
  weekStartSunday,
  monthLabel,
  weekDays,
  blocksByDayIndex,
  now,
  activeView,
  staffName,
  staffIsOwner,
  onPrevWeek,
  onNextWeek,
  onThisWeek,
  onOpenHeaderNew,
  onSelectViewDay,
  onSelectViewWeek,
  onSelectViewMonth,
  onDayHeaderClick,
  onSlotClick,
  onReservationClick,
}: WeekCalendarPanelProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col gap-4 px-6 py-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPrevWeek}
            aria-label="前の週"
            className="active:scale-[0.97] rounded-lg border-[0.5px] border-border bg-bg-primary px-2.5 py-1.5 text-text-secondary transition-transform duration-100 hover:bg-bg-hover"
          >
            ◀
          </button>
          <span className="min-w-[7.5rem] text-center text-[17px] font-medium leading-none text-text-primary">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={onNextWeek}
            aria-label="次の週"
            className="active:scale-[0.97] rounded-lg border-[0.5px] border-border bg-bg-primary px-2.5 py-1.5 text-text-secondary transition-transform duration-100 hover:bg-bg-hover"
          >
            ▶
          </button>
          <button
            type="button"
            onClick={onThisWeek}
            className="active:scale-[0.97] rounded-md border-[0.5px] border-border px-[10px] py-1 text-xs text-text-secondary transition-transform duration-100 hover:bg-bg-hover"
          >
            今日
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
        <div className="min-w-[720px] overflow-hidden rounded-[10px] border-[0.5px] border-border bg-bg-primary">
          <div className="flex" style={{ height: HEADER_HEIGHT_PX }}>
            <div
              className="shrink-0 border-b-[0.5px] border-border bg-bg-primary"
              style={{ width: TIME_GUTTER_PX }}
            />
            <div className="grid min-w-0 flex-1 grid-cols-7">
              {weekDays.map((d) => {
                const isToday = isSameLocalDay(d, now);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => onDayHeaderClick(d)}
                    className="flex flex-col items-center justify-center gap-0.5 border-b-[0.5px] border-l-[0.5px] border-border bg-bg-primary"
                  >
                    <span className="text-[11px] leading-none text-text-tertiary">
                      {weekdayLabelJa(d)}
                    </span>
                    {isToday ? (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium leading-none text-white">
                        {d.getDate()}
                      </span>
                    ) : (
                      <span className="text-xs font-medium leading-none text-text-primary">
                        {d.getDate()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex">
            <div
              className="shrink-0 border-r-[0.5px] border-border bg-bg-primary"
              style={{ width: TIME_GUTTER_PX }}
            >
              {HOUR_ROWS.map((h) => (
                <div
                  key={h}
                  className="box-border flex justify-end pr-1 pt-0"
                  style={{ height: PX_PER_HOUR }}
                >
                  <span className="text-[10px] leading-none text-text-tertiary">
                    {h}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid min-w-0 flex-1 grid-cols-7">
              {weekDays.map((d, colIdx) => {
                const layouts = blocksByDayIndex[colIdx] ?? [];
                const byLane = groupByLane(layouts);
                return (
                  <div
                    key={`${weekStartSunday.toISOString()}-${colIdx}`}
                    className="relative min-w-0 border-l-[0.5px] border-border"
                    style={{ height: GRID_BODY_PX }}
                  >
                    {HOUR_ROWS.map((h) => (
                      <div
                        key={h}
                        className="pointer-events-none relative box-border border-b-[0.5px] border-border"
                        style={{ height: PX_PER_HOUR }}
                      >
                        <div
                          aria-hidden
                          className="pointer-events-none absolute left-0 right-0 top-1/2 border-t-[0.5px] border-dashed border-border opacity-50"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="空きスロットから予約を作成"
                      className="absolute inset-0 z-[1] cursor-default border-0 bg-transparent p-0 outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSlotClick(d, e.nativeEvent.offsetY);
                      }}
                    />
                    <div className="pointer-events-none absolute inset-0 z-[5] flex">
                      {byLane.map((col, laneIdx) => (
                        <div
                          key={laneIdx}
                          className={`relative min-w-0 flex-1 ${laneIdx > 0 ? "border-l-[0.5px] border-border" : ""}`}
                        >
                          {col.map((L) => (
                            <WeekReservationBlock
                              key={L.res.id}
                              res={L.res}
                              layout={{ top: L.top, height: L.height }}
                              onOpen={onReservationClick}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
