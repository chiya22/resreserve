import type { Reservation } from "./types";
import { isSameLocalDay } from "./week";

export const DAY_HOUR_START = 11;
export const DAY_HOUR_END = 22;
export const DAY_PX_PER_HOUR = 60;

/** 週グリッド（WeekCalendarPanel）と一致 */
export const WEEK_HOUR_START = 11;
export const WEEK_HOUR_END = 22;
export const WEEK_PX_PER_HOUR = 48;

const GRID_START_MIN = DAY_HOUR_START * 60;
const GRID_END_MIN = DAY_HOUR_END * 60;

export type DayOverlapLayout = {
  res: Reservation;
  top: number;
  height: number;
  lane: number;
  lanes: number;
};

type Raw = {
  id: string;
  start: number;
  end: number;
  res: Reservation;
  top: number;
  height: number;
};

export type OverlapLayoutConfig = {
  hourStart: number;
  hourEnd: number;
  pxPerHour: number;
  heightGapPx: number;
  minBlockHeight: number;
};

/** 1 日分カラムの重なりレーン割当（日別・週別で共通） */
export function computeOverlapLayouts(
  reservations: Reservation[],
  day: Date,
  config: OverlapLayoutConfig,
): DayOverlapLayout[] {
  const gridStartMin = config.hourStart * 60;
  const gridEndMin = config.hourEnd * 60;
  const { pxPerHour, heightGapPx, minBlockHeight } = config;
  const raw: Raw[] = [];

  for (const res of reservations) {
    if (!isSameLocalDay(res.startAt, day)) continue;

    const startMin =
      res.startAt.getHours() * 60 + res.startAt.getMinutes();
    const endMin = res.endAt.getHours() * 60 + res.endAt.getMinutes();

    const clampedStart = Math.max(startMin, gridStartMin);
    const clampedEnd = Math.min(endMin, gridEndMin);
    if (clampedEnd <= clampedStart) continue;

    const top = ((clampedStart - gridStartMin) / 60) * pxPerHour;
    const height =
      ((clampedEnd - clampedStart) / 60) * pxPerHour - heightGapPx;

    raw.push({
      id: res.id,
      start: clampedStart,
      end: clampedEnd,
      res,
      top,
      height: Math.max(height, minBlockHeight),
    });
  }

  if (raw.length === 0) return [];

  const sorted = [...raw].sort((a, b) => a.start - b.start || a.end - b.end);
  const laneEnds: number[] = [];
  const laneOf = new Map<string, number>();

  for (const it of sorted) {
    let lane = 0;
    while (lane < laneEnds.length && laneEnds[lane] > it.start) {
      lane++;
    }
    if (lane === laneEnds.length) {
      laneEnds.push(it.end);
    } else {
      laneEnds[lane] = it.end;
    }
    laneOf.set(it.id, lane);
  }

  const lanes = Math.max(1, laneEnds.length);

  return raw.map((it) => ({
    res: it.res,
    top: it.top,
    height: it.height,
    lane: laneOf.get(it.id)!,
    lanes,
  }));
}

/** 日別: 重なりレーン割当（幅等分用の lanes 数） */
export function computeDayOverlapLayouts(
  reservations: Reservation[],
  day: Date,
): DayOverlapLayout[] {
  return computeOverlapLayouts(reservations, day, {
    hourStart: DAY_HOUR_START,
    hourEnd: DAY_HOUR_END,
    pxPerHour: DAY_PX_PER_HOUR,
    heightGapPx: 4,
    minBlockHeight: 8,
  });
}

/** 週別: 1 日カラムの重なりレーン割当（日別と同アルゴリズム、グリッド定数のみ週用） */
export function computeWeekOverlapLayouts(
  reservations: Reservation[],
  day: Date,
): DayOverlapLayout[] {
  return computeOverlapLayouts(reservations, day, {
    hourStart: WEEK_HOUR_START,
    hourEnd: WEEK_HOUR_END,
    pxPerHour: WEEK_PX_PER_HOUR,
    heightGapPx: 0,
    minBlockHeight: 8,
  });
}

/** 今日表示中のみ。グリッド外は null */
export function nowMarkerTopPx(now: Date, day: Date): number | null {
  if (!isSameLocalDay(now, day)) return null;
  const mins =
    now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  if (mins < GRID_START_MIN || mins > GRID_END_MIN) return null;
  return ((mins - GRID_START_MIN) / 60) * DAY_PX_PER_HOUR;
}
