"use client";

import { useMemo } from "react";
import { CalendarToolbarEnd } from "@/components/calendar/CalendarToolbarEnd";
import {
  calPageShell,
  calScrollX,
  calTimeGutter,
  calTouchAccentSm,
  calTouchNavArrow,
  calTouchOutlineSm,
  calViewSegBtn,
} from "@/lib/calendar/calendar-toolbar-classes";
import {
  computeDayOverlapLayouts,
  type DayOverlapLayout,
  DAY_HOUR_END,
  DAY_HOUR_START,
  DAY_PX_PER_HOUR,
  nowMarkerTopPx,
} from "@/lib/calendar/day-layout";
import { parsePaletteKey } from "@/lib/calendar/palette-key";
import {
  RESERVATION_BLOCK_CLASS,
  RESERVATION_TONE_CLASS,
} from "@/lib/calendar/reservation-palette-classes";
import type { Reservation } from "@/lib/calendar/types";
import type { CalendarViewMode } from "@/lib/calendar/view-mode";
import { isSameLocalDay, weekdayLabelJa } from "@/lib/calendar/week";

const HOUR_COUNT = DAY_HOUR_END - DAY_HOUR_START;
const GRID_BODY_PX = HOUR_COUNT * DAY_PX_PER_HOUR;
const HOUR_ROWS = Array.from(
  { length: HOUR_COUNT },
  (_, i) => DAY_HOUR_START + i,
) as number[];

function formatTimeHM(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function DayReservationBlock({
  res,
  top,
  height,
  onOpen,
}: {
  res: Reservation;
  top: number;
  height: number;
  onOpen: (r: Reservation) => void;
}) {
  const showParty = height >= 50;

  return (
    <div
      className={`pointer-events-auto absolute left-0 right-0 z-[5] cursor-pointer touch-manipulation rounded-md border-l-[3px] border-solid border-y-0 border-r-0 px-2 py-[5px] transition-opacity duration-[120ms] ease-out hover:opacity-[0.82] ${RESERVATION_BLOCK_CLASS[res.paletteKey]}`}
      style={{ top, height }}
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
      <div className="text-[10px] leading-tight opacity-75">
        {formatTimeHM(res.startAt)}
      </div>
      <div className="text-xs font-medium leading-tight text-current">
        {res.customerName}
      </div>
      <div className="text-[10px] leading-tight opacity-80">
        {res.tableOrNote}
      </div>
      {showParty ? (
        <div className="text-[10px] leading-tight opacity-75">
          {res.partySize}名
        </div>
      ) : null}
    </div>
  );
}

export type DaySummaryCategory = {
  id: string;
  label: string;
  palette_key: string;
};

export type DayCalendarViewProps = {
  daySelected: Date;
  now: Date;
  activeView: CalendarViewMode;
  staffName: string;
  staffIsOwner: boolean;
  summaryCategories: DaySummaryCategory[];
  reservations: Reservation[];
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onOpenHeaderNew: () => void;
  onSelectViewDay: () => void;
  onSelectViewWeek: () => void;
  onSelectViewMonth: () => void;
  onSlotClick: (offsetY: number) => void;
  onReservationClick: (r: Reservation) => void;
};

export function DayCalendarView({
  daySelected,
  now,
  activeView,
  staffName,
  staffIsOwner,
  summaryCategories,
  reservations,
  onPrevDay,
  onNextDay,
  onToday,
  onOpenHeaderNew,
  onSelectViewDay,
  onSelectViewWeek,
  onSelectViewMonth,
  onSlotClick,
  onReservationClick,
}: DayCalendarViewProps) {
  const stats = useMemo(() => {
    const list = reservations.filter((r) =>
      isSameLocalDay(r.startAt, daySelected),
    );
    const count = list.length;
    const guests = list.reduce((s, r) => s + r.partySize, 0);
    const catCounts = new Map<string, number>();
    for (const r of list) {
      catCounts.set(r.categoryId, (catCounts.get(r.categoryId) ?? 0) + 1);
    }
    return { count, guests, catCounts };
  }, [reservations, daySelected]);

  const layouts = useMemo(
    () => computeDayOverlapLayouts(reservations, daySelected),
    [reservations, daySelected],
  );

  const lanes = layouts[0]?.lanes ?? 1;

  const byLane = useMemo(() => {
    const cols: DayOverlapLayout[][] = Array.from({ length: lanes }, () => []);
    for (const L of layouts) {
      cols[L.lane].push(L);
    }
    return cols;
  }, [layouts, lanes]);

  const markerTop = useMemo(
    () => nowMarkerTopPx(now, daySelected),
    [now, daySelected],
  );

  const isTitleToday = isSameLocalDay(daySelected, now);
  const y = daySelected.getFullYear();
  const mo = daySelected.getMonth() + 1;
  const wd = weekdayLabelJa(daySelected);

  return (
    <div className={calPageShell}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPrevDay}
            aria-label="前の日"
            className={calTouchNavArrow}
          >
            ◀
          </button>
          <div className="flex min-w-0 flex-wrap items-center justify-center gap-0.5 text-center text-[17px] font-medium leading-none text-text-primary">
            <span>{y}年{mo}月</span>
            {isTitleToday ? (
              <span className="mx-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-white">
                {daySelected.getDate()}
              </span>
            ) : (
              <span className="mx-0.5 flex min-h-9 min-w-9 shrink-0 items-center justify-center">
                {daySelected.getDate()}
              </span>
            )}
            <span>
              日（{wd}）
            </span>
          </div>
          <button
            type="button"
            onClick={onNextDay}
            aria-label="次の日"
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
        <div className="min-w-[320px] overflow-hidden rounded-[10px] border-[0.5px] border-border bg-bg-primary md:min-w-[400px]">
          <div
            className="flex flex-wrap items-center gap-2 border-b-[0.5px] border-border py-2 pl-[52px] pr-2 md:pl-14"
            aria-label="当日サマリー"
          >
            <span className="inline-flex min-h-9 items-center rounded-xl border-[0.5px] border-border bg-bg-hover px-3 py-1.5 text-[11px] font-medium text-text-primary">
              本日 {stats.count}件 / {stats.guests}名
            </span>
            {summaryCategories.map((cat) => {
              const n = stats.catCounts.get(cat.id) ?? 0;
              if (n <= 0) return null;
              const pk = parsePaletteKey(cat.palette_key);
              return (
                <span
                  key={cat.id}
                  className={`inline-flex min-h-9 items-center rounded-xl border-[0.5px] border-transparent px-3 py-1.5 text-[11px] font-medium ${RESERVATION_TONE_CLASS[pk]}`}
                >
                  {cat.label} {n}件
                </span>
              );
            })}
          </div>

          <div className="flex">
            <div className={`${calTimeGutter} border-r-[0.5px] border-border bg-bg-primary`}>
              {HOUR_ROWS.map((h) => (
                <div
                  key={h}
                  className="box-border flex justify-end pr-1 pt-0"
                  style={{ height: DAY_PX_PER_HOUR }}
                >
                  <span className="text-[10px] leading-none text-text-tertiary">
                    {h}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative min-w-0 flex-1" style={{ height: GRID_BODY_PX }}>
              {HOUR_ROWS.map((h) => (
                <div
                  key={h}
                  className="pointer-events-none relative box-border border-b-[0.5px] border-border"
                  style={{ height: DAY_PX_PER_HOUR }}
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
                  e.stopPropagation();
                  onSlotClick(e.nativeEvent.offsetY);
                }}
              />

              <div className="pointer-events-none absolute inset-0 z-[5] flex">
                {byLane.map((col, laneIdx) => (
                  <div
                    key={laneIdx}
                    className={`relative min-w-0 flex-1 ${laneIdx > 0 ? "border-l-[0.5px] border-border" : ""}`}
                  >
                    {col.map((L) => (
                      <DayReservationBlock
                        key={L.res.id}
                        res={L.res}
                        top={L.top}
                        height={L.height}
                        onOpen={onReservationClick}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {markerTop !== null ? (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-10"
                  style={{ top: markerTop - 1 }}
                >
                  <div className="relative w-full border-t-2 border-[#EF4444]">
                    <span
                      aria-hidden
                      className="absolute -left-[5px] -top-[5px] block h-[10px] w-[10px] rounded-full bg-[#EF4444]"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
