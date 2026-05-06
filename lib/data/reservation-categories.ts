import { createClient } from "@/lib/supabase/server";
import { sortReservationCategories } from "@/lib/calendar/category-display";
import type { ReservationCategoryRow } from "@/types";

function logSupabaseError(context: string, error: unknown): void {
  const e = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };
  console.error(
    `${context}:`,
    e?.message ?? String(error),
    e?.code ? `[${e.code}]` : "",
    e?.details ? `details=${e.details}` : "",
    e?.hint ? `hint=${e.hint}` : "",
  );
}

export async function listReservationCategories(): Promise<
  ReservationCategoryRow[]
> {
  const supabase = await createClient();

  // 並びは sortReservationCategories に任せる（複数 .order() は PostgREST / クライアント差で不具合になり得る）
  const { data, error } = await supabase
    .from("reservation_categories")
    .select("*");

  if (error) {
    logSupabaseError("listReservationCategories failed", error);
    return [];
  }

  return sortReservationCategories((data ?? []) as ReservationCategoryRow[]);
}
