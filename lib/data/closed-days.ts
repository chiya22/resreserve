import { createClient } from "@/lib/supabase/server";
import type { ClosedDay } from "@/types";

export async function listClosedDaysInRange(
  start: Date,
  end: Date,
): Promise<ClosedDay[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("closed_days")
    .select("*")
    .gte("closed_on", start.toISOString().slice(0, 10))
    .lte("closed_on", end.toISOString().slice(0, 10))
    .order("closed_on", { ascending: true });

  if (error) {
    console.error("listClosedDaysInRange failed:", error);
    return [];
  }

  return (data ?? []) as ClosedDay[];
}

export async function listClosedDaysAll(): Promise<ClosedDay[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

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
