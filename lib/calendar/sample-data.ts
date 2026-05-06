import type { Reservation } from "./types";
import { addDays, startOfWeekSunday } from "./week";

/** 指定週（日曜始まり）の月〜土にサンプル予約を載せる */
export function getSampleReservationsForWeek(
  weekStartSunday: Date,
): Reservation[] {
  const sun = new Date(weekStartSunday);
  sun.setHours(0, 0, 0, 0);

  const at = (dayOffsetFromSun: number, h: number, m: number) => {
    const d = addDays(sun, dayOffsetFromSun);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const mon = 1;
  const tue = 2;
  const wed = 3;
  const thu = 4;
  const fri = 5;
  const sat = 6;

  return [
    {
      id: "s1",
      customerName: "田中様",
      partySize: 4,
      category: "normal",
      startAt: at(mon, 12, 0),
      endAt: at(mon, 13, 30),
      tableOrNote: "テーブル A-2",
    },
    {
      id: "s2",
      customerName: "鈴木様",
      partySize: 6,
      category: "course",
      startAt: at(mon, 18, 0),
      endAt: at(mon, 20, 0),
      tableOrNote: "ランチコース",
    },
    {
      id: "s3",
      customerName: "佐藤様",
      partySize: 2,
      category: "normal",
      startAt: at(tue, 11, 30),
      endAt: at(tue, 12, 30),
      tableOrNote: "テーブル C-3",
    },
    {
      id: "s4",
      customerName: "貸切・会社宴会",
      partySize: 30,
      category: "private",
      startAt: at(wed, 19, 0),
      endAt: at(wed, 21, 0),
      tableOrNote: "2F",
    },
    {
      id: "s5",
      customerName: "山田様",
      partySize: 2,
      category: "vip",
      startAt: at(thu, 18, 30),
      endAt: at(thu, 20, 30),
      tableOrNote: "個室",
    },
    {
      id: "s6",
      customerName: "誕生日会",
      partySize: 10,
      category: "private",
      startAt: at(fri, 12, 0),
      endAt: at(fri, 13, 30),
      tableOrNote: "2F",
    },
    {
      id: "s7",
      customerName: "木村様",
      partySize: 4,
      category: "course",
      startAt: at(fri, 18, 0),
      endAt: at(fri, 19, 30),
      tableOrNote: "ディナーコース",
    },
    {
      id: "s8",
      customerName: "加藤様",
      partySize: 4,
      category: "waitlist",
      startAt: at(sat, 19, 30),
      endAt: at(sat, 21, 0),
      tableOrNote: "テーブル B-3",
    },
  ];
}

/** 月グリッド用: 表示週ごとのサンプルを結合し、ID を一意化（mw{週ms}__{元ID}） */
export function getSampleReservationsForMonthMatrix(
  monthAnchor: Date,
): Reservation[] {
  const y = monthAnchor.getFullYear();
  const m = monthAnchor.getMonth();
  const gridStart = startOfWeekSunday(new Date(y, m, 1));
  const out: Reservation[] = [];
  for (let wi = 0; wi < 6; wi++) {
    const ws = addDays(gridStart, wi * 7);
    const chunk = getSampleReservationsForWeek(ws);
    const prefix = `mw${ws.getTime()}__`;
    for (const r of chunk) {
      out.push({ ...r, id: `${prefix}${r.id}` });
    }
  }
  return out;
}
