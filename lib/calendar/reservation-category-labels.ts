import type { ReservationCategoryEmbed, ReservationWithTable } from "@/types";

export type ReservationCategoryAssignmentEmbed = {
  category_id: string;
  reservation_categories: ReservationCategoryEmbed;
};

export function reservationCategoryAssignments(
  reservation: ReservationWithTable,
): ReservationCategoryAssignmentEmbed[] {
  return reservation.reservation_category_assignments ?? [];
}

export function reservationCategoryIds(
  reservation: ReservationWithTable,
): string[] {
  const fromAssignments = reservationCategoryAssignments(reservation).map(
    (row) => row.category_id,
  );
  if (fromAssignments.length > 0) return fromAssignments;
  return [reservation.category_id];
}

export function reservationCategoryLabels(
  reservation: ReservationWithTable,
): string[] {
  const assignments = reservationCategoryAssignments(reservation);
  if (assignments.length > 0) {
    return [...assignments]
      .sort(
        (a, b) =>
          a.reservation_categories.sort_order -
            b.reservation_categories.sort_order ||
          a.reservation_categories.code.localeCompare(
            b.reservation_categories.code,
          ),
      )
      .map((row) => row.reservation_categories.label);
  }
  return [reservation.reservation_categories.label];
}

export function reservationCategoryLabelsText(
  reservation: ReservationWithTable,
): string {
  return reservationCategoryLabels(reservation).join("・");
}
