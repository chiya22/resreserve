"use client";

import { useEffect, useState } from "react";

import { RESERVATION_WITH_TABLE_EMBED } from "@/lib/data/reservation-select-snippet";
import { createClient } from "@/lib/supabase/client";
import type { ReservationWithTable } from "@/types";

type Options = {
  initialData: ReservationWithTable[];
};

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
          const { data } = await supabase
            .from("reservations")
            .select(RESERVATION_WITH_TABLE_EMBED)
            .eq("id", newRow.id)
            .single();

          if (data) {
            setReservations((prev) => {
              if (prev.some((r) => r.id === data.id)) return prev;
              return [...prev, data as ReservationWithTable];
            });
          }
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
          const updated = payload.new as ReservationWithTable;
          if (updated.status === "cancelled") {
            setReservations((prev) => prev.filter((r) => r.id !== updated.id));
            return;
          }

          const { data } = await supabase
            .from("reservations")
            .select(RESERVATION_WITH_TABLE_EMBED)
            .eq("id", updated.id)
            .single();

          if (data) {
            setReservations((prev) =>
              prev.map((r) =>
                r.id === data.id ? (data as ReservationWithTable) : r,
              ),
            );
          }
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
