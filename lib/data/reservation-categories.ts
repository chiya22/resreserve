import { createClient } from "@/lib/supabase/server";
import { sortReservationCategories } from "@/lib/calendar/category-display";
import type { ReservationCategoryRow } from "@/types";

export async function listReservationCategories(): Promise<
  ReservationCategoryRow[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservation_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("code");

  if (error) {
    console.error("listReservationCategories failed:", error);
    return [];
  }

  return sortReservationCategories((data ?? []) as ReservationCategoryRow[]);
}
