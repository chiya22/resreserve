"use client";

import { CalendarMobileMenu } from "@/components/calendar/CalendarMobileMenu";
import { ClosedDayMobileBadge } from "@/components/calendar/ClosedDayMobileBadge";
import { CalendarToolbarEnd } from "@/components/calendar/CalendarToolbarEnd";
import {
  CategoryFilterControl,
  type CalendarCategoryFilterOption,
} from "@/components/calendar/CategoryFilterControl";
import {
  calPageShell,
  calScrollX,
  calTimeGutter,
  calTouchAccentSm,
  calTouchNavArrow,
  calTouchOutlineSm,
  calViewSegBtn,
} from "@/lib/calendar/calendar-toolbar-classes";
import { type DayOverlapLayout, WEEK_PX_PER_HOUR } from "@/lib/calendar/day-layout";
import { formatHmRange } from "@/lib/calendar/datetime-ui";
import { RESERVATION_BLOCK_CLASS } from "@/lib/calendar/reservation-palette-classes";
import type { Reservation } from "@/lib/calendar/types";
import type { CalendarViewMode } from "@/lib/calendar/view-mode";
import { isSameLocalDay, localDateKey, weekdayLabelJa } from "@/lib/calendar/week";

function groupByLane(layouts: DayOverlapLayout[]): DayOverlapLayout[][] {
  if (layouts.length === 0) return [[]];
  const laneCount = layouts[0]!.lanes;
  const cols: DayOverlapLayout[][] = Array.from({ length: laneCount }, () => []);
  for (const L of layouts) {
    cols[L.lane]!.push(L);
  }
  return cols;
}

const HEADER_HEIGHT_PX = 64;
const PX_PER_HOUR = WEEK_PX_PER_HOUR;
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
      className={`pointer-events-auto absolute inset-x-[2px] z-[5] min-w-0 cursor-pointer touch-manipulation overflow-hidden rounded-[5px] border-l-[3px] border-solid border-y-0 border-r-0 px-[4px] py-[3px] transition-opacity duration-[120ms] ease-out hover:opacity-[0.82] sm:px-[6px] ${RESERVATION_BLOCK_CLASS[res.paletteKey]}`}
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
      <div className="truncate text-xs font-medium leading-tight">
        {res.customerName} {res.partySize}名
      </div>
      <div className="mt-px truncate text-[10px] leading-tight opacity-[0.85]">
        {formatHmRange(res.startAt, res.endAt)}
      </div>
      <div className="mt-px truncate text-[10px] leading-tight opacity-[0.85]">
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
  staffCanManageClosedDays: boolean;
  categoryFilterOptions: CalendarCategoryFilterOption[];
  categoryFilterIds: string[];
  onToggleCategoryFilter: (categoryId: string) => void;
  onClearCategoryFilter: () => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
  onOpenHeaderNew: () => void;
  onSelectViewDay: () => void;
  onSelectViewWeek: () => void;
  onSelectViewMonth: () => void;
  onDayHeaderClick: (d: Date) => void;
  closedDayByDate: Map<string, string | null>;
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
  staffCanManageClosedDays,
  categoryFilterOptions,
  categoryFilterIds,
  onToggleCategoryFilter,
  onClearCategoryFilter,
  onPrevWeek,
  onNextWeek,
  onThisWeek,
  onOpenHeaderNew,
  onSelectViewDay,
  onSelectViewWeek,
  onSelectViewMonth,
  onDayHeaderClick,
  closedDayByDate,
  onSlotClick,
  onReservationClick,
}: WeekCalendarPanelProps) {
  return (
    <div className={calPageShell}>
      <header className="flex flex-col gap-3">
        <div className="flex min-w-0 items-center justify-center gap-2 sm:justify-start">
          <button
            type="button"
            onClick={onPrevWeek}
            aria-label="前の週"
            className={calTouchNavArrow}
          >
            ◀
          </button>
          <span className="min-w-[7.5rem] flex-1 text-center text-[17px] font-medium leading-none text-text-primary sm:flex-none">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={onNextWeek}
            aria-label="次の週"
            className={calTouchNavArrow}
          >
            ▶
          </button>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <button type="button" onClick={onThisWeek} className={calTouchOutlineSm}>
              今日
            </button>
            <button
              type="button"
              onClick={onOpenHeaderNew}
              className={calTouchAccentSm}
            >
              <span className="sm:hidden">＋ 新規</span>
              <span className="hidden sm:inline">＋ 新規予約</span>
            </button>
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
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <CalendarMobileMenu
              categoryFilterOptions={categoryFilterOptions}
              categoryFilterIds={categoryFilterIds}
              onToggleCategoryFilter={onToggleCategoryFilter}
              onClearCategoryFilter={onClearCategoryFilter}
              staffName={staffName}
              staffIsOwner={staffIsOwner}
              staffCanManageClosedDays={staffCanManageClosedDays}
            />
            <div className="hidden min-w-0 flex-wrap items-center gap-2 sm:flex sm:gap-3">
              <CategoryFilterControl
                options={categoryFilterOptions}
                selectedIds={categoryFilterIds}
                onToggle={onToggleCategoryFilter}
                onClear={onClearCategoryFilter}
              />
              <CalendarToolbarEnd
                staffName={staffName}
                staffIsOwner={staffIsOwner}
                staffCanManageClosedDays={staffCanManageClosedDays}
              />
            </div>
          </div>
        </div>
      </header>

      <div className={calScrollX}>
        <div className="w-full min-w-0 max-w-full overflow-hidden rounded-[10px] border-[0.5px] border-border bg-bg-primary">
          <div className="flex" style={{ height: HEADER_HEIGHT_PX }}>
            <div
              className={`${calTimeGutter} border-b-[0.5px] border-border bg-bg-primary`}
            />
            <div className="grid min-w-0 flex-1 grid-cols-7">
              {weekDays.map((d) => {
                const isToday = isSameLocalDay(d, now);
                const dayKey = localDateKey(d);
                const isClosedDay = closedDayByDate.has(dayKey);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => onDayHeaderClick(d)}
                    aria-label={
                      isClosedDay ? `${weekdayLabelJa(d)}・休業日` : undefined
                    }
                    className="flex min-h-[3.5rem] w-full min-w-0 touch-manipulation flex-col items-center justify-center gap-0.5 border-b-[0.5px] border-l-[0.5px] border-border bg-bg-primary py-1"
                  >
                    <span className="text-[11px] leading-none text-text-tertiary">
                      {weekdayLabelJa(d)}
                    </span>
                    <span className="flex min-w-0 max-w-full flex-nowrap items-center justify-center gap-1">
                      <span className="relative inline-flex items-center justify-center">
                        {isToday ? (
                          <span className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-full bg-accent text-xs font-medium leading-none text-white">
                            {d.getDate()}
                          </span>
                        ) : (
                          <span className="flex min-h-9 min-w-9 items-center justify-center text-xs font-medium leading-none text-text-primary">
                            {d.getDate()}
                          </span>
                        )}
                        {isClosedDay ? <ClosedDayMobileBadge isToday={isToday} /> : null}
                      </span>
                      {isClosedDay ? (
                        <span className="hidden text-[10px] font-medium leading-none text-reservation-waitlist-text sm:inline">
                          休業日
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex">
            <div className={`${calTimeGutter} border-r-[0.5px] border-border bg-bg-primary`}>
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
                const dayKey = localDateKey(d);
                const isClosedDay = closedDayByDate.has(dayKey);
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
                      className="absolute inset-0 z-[1] cursor-default touch-manipulation border-0 bg-transparent p-0 outline-none"
                      onClick={(e) => {
                        if (isClosedDay) return;
                        e.stopPropagation();
                        onSlotClick(d, e.nativeEvent.offsetY);
                      }}
                    />
                    {isClosedDay ? (
                      <div className="pointer-events-none absolute inset-0 z-[2] bg-reservation-waitlist-bg/35" />
                    ) : null}
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
