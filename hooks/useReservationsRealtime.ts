"use client";

import { useEffect, useState } from "react";

import { RESERVATION_WITH_TABLE_EMBED } from "@/lib/data/reservation-select-snippet";
import { createClient } from "@/lib/supabase/client";
import type { ReservationWithTable } from "@/types";

type Options = {
  initialData: ReservationWithTable[];
};

async function fetchReservationById(
  reservationId: string,
): Promise<ReservationWithTable | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("reservations")
    .select(RESERVATION_WITH_TABLE_EMBED)
    .eq("id", reservationId)
    .single();

  return (data as ReservationWithTable | null) ?? null;
}

function upsertReservationRow(
  prev: ReservationWithTable[],
  row: ReservationWithTable,
): ReservationWithTable[] {
  if (prev.some((r) => r.id === row.id)) {
    return prev.map((r) => (r.id === row.id ? row : r));
  }
  return [...prev, row];
}

export function useReservationsRealtime({ initialData }: Options) {
  const [reservations, setReservations] =
    useState<ReservationWithTable[]>(initialData);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- initialData は RSC 刷新で差し替わるため同期 */
    setReservations(initialData);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialData]);

  useEffect(() => {
    const supabase = createClient();

    async function refreshReservation(reservationId: string) {
      const data = await fetchReservationById(reservationId);
      if (!data) return;
      if (data.status === "cancelled") {
        setReservations((prev) => prev.filter((r) => r.id !== reservationId));
        return;
      }
      setReservations((prev) => upsertReservationRow(prev, data));
    }

    const channel = supabase
      .channel("reservations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reservations",
        },
        async (payload) => {
          const newRow = payload.new as { id: string };
          await refreshReservation(newRow.id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reservations",
        },
        async (payload) => {
          const updated = payload.new as { id: string };
          await refreshReservation(updated.id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "reservations",
        },
        (payload) => {
          const deletedId = (payload.old as { id?: string }).id;
          if (!deletedId) return;
          setReservations((prev) => prev.filter((r) => r.id !== deletedId));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservation_category_assignments",
        },
        async (payload) => {
          const reservationId =
            payload.eventType === "DELETE"
              ? (payload.old as { reservation_id?: string }).reservation_id
              : (payload.new as { reservation_id?: string }).reservation_id;
          if (!reservationId) return;
          await refreshReservation(reservationId);
        },
      )
      .subscribe((status, err) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[Realtime]", status);
          if (err) {
            console.error("[Realtime] Error:", err);
          }
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return { reservations, setReservations };
}
