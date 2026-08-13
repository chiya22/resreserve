import { calendarYmd, calendarTodayYmd } from "@/lib/calendar/week";
import { createClient } from "@/lib/supabase/server";
import type { ClosedDay } from "@/types";

export async function listClosedDaysInRange(
  start: Date,
  end: Date,
): Promise<ClosedDay[]> {
  const supabase = await createClient();
  const startYmd = calendarYmd(start);
  const endYmd = calendarYmd(end);

  const { data, error } = await supabase
    .from("closed_days")
    .select("*")
    .gte("closed_on", startYmd)
    .lte("closed_on", endYmd)
    .order("closed_on", { ascending: true });

  if (error) {
    console.error("listClosedDaysInRange failed:", error);
    return [];
  }

  return (data ?? []) as ClosedDay[];
}

/** 設定画面用: 今日以降の休業日のみ（過去は管理対象外） */
export async function listClosedDaysAll(): Promise<ClosedDay[]> {
  const supabase = await createClient();
  const today = calendarTodayYmd();

  const { data, error } = await supabase
    .from("closed_days")
    .select("*")
    .gte("closed_on", today)
    .order("closed_on", { ascending: true });

  if (error) {
    console.error("listClosedDaysAll failed:", error);
    return [];
  }

  return (data ?? []) as ClosedDay[];
}
