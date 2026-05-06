import type { ReservationCategoryRow } from "@/types";

export function sortReservationCategories(
  rows: ReservationCategoryRow[],
): ReservationCategoryRow[] {
  return [...rows].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.code.localeCompare(b.code);
  });
}

export function categoryLabelsById(
  rows: ReservationCategoryRow[],
): Map<string, string> {
  return new Map(rows.map((r) => [r.id, r.label]));
}

/** 予約作成モーダル用 */
export function bookingFormCategoriesFromRows(rows: ReservationCategoryRow[]) {
  return sortReservationCategories(
    rows.filter((r) => r.show_in_booking_form),
  ).map((r) => ({
    value: r.id as string,
    label: r.label,
  }));
}

/** 詳細編集で、現在のカテゴリがフォーム対象外のときだけ末尾に足す */
export function editModeCategoryChoicesForId(
  currentCategoryId: string,
  bookingOptions: { value: string; label: string }[],
  labelById: Map<string, string>,
): { value: string; label: string }[] {
  const seen = new Set(bookingOptions.map((o) => o.value));
  const out = [...bookingOptions];
  if (!seen.has(currentCategoryId)) {
    out.push({
      value: currentCategoryId,
      label: labelById.get(currentCategoryId) ?? "(不明なカテゴリ)",
    });
  }
  return out;
}
