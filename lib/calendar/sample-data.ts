import type { Reservation } from "./types";
import { addDays, startOfWeekSunday } from "./week";

/** デモ／検証用（固定 UUID と palette はダミー。実運用クエリとは無関係） */
const SAMPLE_CAT = {
  normal:
    "00000000-0000-4000-a000-000000000011" as const,
  course:
    "00000000-0000-4000-a000-000000000022" as const,
  vip: "00000000-0000-4000-a000-000000000055" as const,
  waitlist:
    "00000000-0000-4000-a000-000000000044" as const,
  private:
    "00000000-0000-4000-a000-000000000033" as const,
};

/** 指定週（日曜始まり）の月〜土にサンプル予約を載せる */
export function getSampleReservationsForWeek(
  weekStartSunday: Date,
): Reservation[] {
  const weekStart = new Date(weekStartSunday);
  weekStart.setHours(0, 0, 0, 0);

  const at = (dayOffsetFromSun: number, h: number, m: number) => {
    const d = addDays(weekStart, dayOffsetFromSun);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const sun = 0;
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
      categoryId: SAMPLE_CAT.normal,
      paletteKey: "青",
      categoryLabel: "通常",
      startAt: at(mon, 12, 0),
      endAt: at(mon, 13, 30),
      tableOrNote: "A-1",
    },
    {
      id: "s2",
      customerName: "佐藤様",
      partySize: 2,
      categoryId: SAMPLE_CAT.course,
      paletteKey: "緑",
      categoryLabel: "コース",
      startAt: at(mon, 18, 0),
      endAt: at(mon, 21, 0),
      tableOrNote: "個室",
    },
    {
      id: "s3",
      customerName: "鈴木様",
      partySize: 3,
      categoryId: SAMPLE_CAT.normal,
      paletteKey: "青",
      categoryLabel: "通常",
      startAt: at(tue, 11, 30),
      endAt: at(tue, 13, 0),
      tableOrNote: "B-1",
      notes: "窓側希望",
    },
    {
      id: "s4",
      customerName: "貸切イベント",
      partySize: 30,
      categoryId: SAMPLE_CAT.private,
      paletteKey: "アンバー",
      categoryLabel: "貸し切り",
      startAt: at(thu, 17, 0),
      endAt: at(thu, 21, 0),
      tableOrNote: "2F",
    },
    {
      id: "s5",
      customerName: "VIP 山田様",
      partySize: 6,
      categoryId: SAMPLE_CAT.vip,
      paletteKey: "紫",
      categoryLabel: "VIP",
      startAt: at(fri, 19, 0),
      endAt: at(fri, 21, 30),
      tableOrNote: "個室1",
    },
    {
      id: "s6",
      customerName: "木村様",
      partySize: 2,
      categoryId: SAMPLE_CAT.private,
      paletteKey: "アンバー",
      categoryLabel: "貸し切り",
      startAt: at(sat, 12, 0),
      endAt: at(sat, 17, 0),
      tableOrNote: "フロア",
    },
    {
      id: "s7",
      customerName: "高橋様",
      partySize: 4,
      categoryId: SAMPLE_CAT.course,
      paletteKey: "緑",
      categoryLabel: "コース",
      startAt: at(sun, 16, 0),
      endAt: at(sun, 17, 30),
      tableOrNote: "A-2",
    },
    {
      id: "s8",
      customerName: "キャンセル待ち 中村様",
      partySize: 2,
      categoryId: SAMPLE_CAT.waitlist,
      paletteKey: "赤",
      categoryLabel: "キャンセル待ち",
      startAt: at(wed, 19, 0),
      endAt: at(wed, 20, 30),
      tableOrNote: "—",
    },
  ];
}

export { startOfWeekSunday };
