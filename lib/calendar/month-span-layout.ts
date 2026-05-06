import type { Reservation } from "./types";
import { isSameLocalDay, startOfLocalDay } from "./week";

export type MonthSpanSegment = {
  res: Reservation;
  lane: number;
  startCol: number;
  endCol: number;
  roundedLeft: boolean;
  roundedRight: boolean;
  showLabel: boolean;
};

export function occupiedLocalDays(res: Reservation): Date[] {
  const s = startOfLocalDay(res.startAt);
  const e = startOfLocalDay(res.endAt);
  if (e.getTime() < s.getTime()) return [s];
  const out: Date[] = [];
  for (let t = s.getTime(); t <= e.getTime(); t += 86400000) {
    out.push(startOfLocalDay(new Date(t)));
  }
  return out;
}

export function isMultiDayReservation(res: Reservation): boolean {
  return occupiedLocalDays(res).length > 1;
}

/** 週行内の複数日予約バー（列 0〜6、lane は縦積み） */
export function computeSpanSegmentsForWeek(
  weekDates: Date[],
  reservations: Reservation[],
): MonthSpanSegment[] {
  const multi = reservations.filter(isMultiDayReservation);
  const raw: {
    res: Reservation;
    startCol: number;
    endCol: number;
  }[] = [];

  for (const res of multi) {
    const days = occupiedLocalDays(res);
    const cols: number[] = [];
    for (let c = 0; c < 7; c++) {
      if (days.some((d) => isSameLocalDay(d, weekDates[c]!))) {
        cols.push(c);
      }
    }
    if (cols.length === 0) continue;
    raw.push({
      res,
      startCol: cols[0]!,
      endCol: cols[cols.length - 1]!,
    });
  }

  const sorted = [...raw].sort(
    (a, b) => a.startCol - b.startCol || a.endCol - b.endCol,
  );
  const laneEndCol: number[] = [];
  const laneOf = new Map<string, number>();

  for (const it of sorted) {
    let lane = 0;
    while (lane < laneEndCol.length && laneEndCol[lane]! >= it.startCol) {
      lane++;
    }
    if (lane === laneEndCol.length) {
      laneEndCol.push(it.endCol);
    } else {
      laneEndCol[lane] = it.endCol;
    }
    laneOf.set(it.res.id, lane);
  }

  const firstGlobal = (res: Reservation) => startOfLocalDay(res.startAt);
  const lastGlobal = (res: Reservation) => {
    const ds = occupiedLocalDays(res);
    return ds[ds.length - 1]!;
  };

  return raw.map((it) => {
    const segFirst = isSameLocalDay(weekDates[it.startCol]!, firstGlobal(it.res));
    const segLast = isSameLocalDay(weekDates[it.endCol]!, lastGlobal(it.res));
    return {
      res: it.res,
      lane: laneOf.get(it.res.id)!,
      startCol: it.startCol,
      endCol: it.endCol,
      roundedLeft: segFirst,
      roundedRight: segLast,
      showLabel: segFirst,
    };
  });
}
