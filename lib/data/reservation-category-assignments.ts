import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export async function resolvePrimaryCategoryId(
  supabase: DbClient,
  categoryIds: string[],
): Promise<string | null> {
  if (categoryIds.length === 0) return null;

  const { data, error } = await supabase
    .from("reservation_categories")
    .select("id, sort_order, code")
    .in("id", categoryIds);

  if (error || !data?.length) {
    console.error("resolvePrimaryCategoryId failed:", error);
    return null;
  }

  const sorted = [...data].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.code.localeCompare(b.code);
  });

  return sorted[0]?.id ?? null;
}

export async function syncReservationCategoryAssignments(
  supabase: DbClient,
  reservationId: string,
  categoryIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const uniqueIds = [...new Set(categoryIds)];
  if (uniqueIds.length === 0) {
    return { ok: false, error: "カテゴリを1つ以上選んでください" };
  }

  const { error: deleteError } = await supabase
    .from("reservation_category_assignments")
    .delete()
    .eq("reservation_id", reservationId);

  if (deleteError) {
    console.error("syncReservationCategoryAssignments delete failed:", deleteError);
    return { ok: false, error: "カテゴリの更新に失敗しました" };
  }

  const { error: insertError } = await supabase
    .from("reservation_category_assignments")
    .insert(
      uniqueIds.map((category_id) => ({
        reservation_id: reservationId,
        category_id,
      })),
    );

  if (insertError) {
    console.error("syncReservationCategoryAssignments insert failed:", insertError);
    return { ok: false, error: "カテゴリの更新に失敗しました" };
  }

  return { ok: true };
}
