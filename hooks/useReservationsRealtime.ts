"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { ReservationWithTable } from "@/types";

const RESERVATION_WITH_TABLE_SELECT = `
  id,
  table_id,
  customer_name,
  customer_phone,
  party_size,
  category,
  status,
  start_at,
  end_at,
  notes,
  internal_notes,
  created_by,
  created_at,
  updated_at,
  table:tables (
    id,
    name,
    capacity
  )
`;

type Options = {
  initialData: ReservationWithTable[];
};

export function useReservationsRealtime({ initialData }: Options) {
  const [reservations, setReservations] =
    useState<ReservationWithTable[]>(initialData);

  useEffect(() => {
    setReservations(initialData);
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
            .select(RESERVATION_WITH_TABLE_SELECT)
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
            .select(RESERVATION_WITH_TABLE_SELECT)
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
