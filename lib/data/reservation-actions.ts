"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  checkBusinessRules,
  reservationInputSchema,
  reservationPartialSchema,
  reservationSelectWithTable,
  rowToInput,
  type ReservationInput,
} from "@/lib/data/reservation-shared";
import { err, ok, type Result } from "@/types/result";
import type { ReservationUpdate, ReservationWithTable } from "@/types";

export type { ReservationInput } from "@/lib/data/reservation-shared";

export async function createReservation(
  input: ReservationInput,
): Promise<Result<ReservationWithTable, string>> {
  const parsed = reservationInputSchema.safeParse(input);
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ??
      parsed.error.flatten().formErrors[0] ??
      "入力内容に問題があります";
    return err(first);
  }

  const rules = await checkBusinessRules(parsed.data);
  if (!rules.success) return rules;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .insert({
      table_id: parsed.data.table_id,
      customer_name: parsed.data.customer_name,
      customer_phone: parsed.data.customer_phone ?? null,
      party_size: parsed.data.party_size,
      category_id: parsed.data.category_id,
      start_at: parsed.data.start_at,
      end_at: parsed.data.end_at,
      notes: parsed.data.notes ?? null,
    })
    .select(reservationSelectWithTable)
    .single();

  if (error) {
    console.error("Failed to create reservation:", error);
    if (error.code === "23P01") {
      return err("この時間帯はすでに予約が入っています");
    }
    if (error.code === "42501") {
      return err(
        "予約を登録する権限がありません。ログインしているか、staff テーブルに自分の user_id の行があるか Supabase で確認してください。",
      );
    }
    return err("予約の作成に失敗しました");
  }

  revalidatePath("/calendar");
  return ok(data as ReservationWithTable);
}

export async function updateReservation(
  id: string,
  input: Partial<ReservationInput>,
): Promise<Result<ReservationWithTable, string>> {
  const supabase = await createClient();

  const existing = await supabase
    .from("reservations")
    .select(reservationSelectWithTable)
    .eq("id", id)
    .maybeSingle();

  if (existing.error) {
    console.error("Failed to load reservation for update:", existing.error);
    return err("予約の取得に失敗しました");
  }

  if (!existing.data) {
    return err("予約が見つかりません");
  }

  const row = existing.data as ReservationWithTable;

  const partialParsed = reservationPartialSchema.safeParse(input);
  if (!partialParsed.success) {
    const first =
      Object.values(partialParsed.error.flatten().fieldErrors)[0]?.[0] ??
      partialParsed.error.flatten().formErrors[0] ??
      "入力内容に問題があります";
    return err(first);
  }

  const merged = { ...rowToInput(row), ...partialParsed.data };
  const fullParsed = reservationInputSchema.safeParse(merged);
  if (!fullParsed.success) {
    const first =
      Object.values(fullParsed.error.flatten().fieldErrors)[0]?.[0] ??
      fullParsed.error.flatten().formErrors[0] ??
      "入力内容に問題があります";
    return err(first);
  }

  const rules = await checkBusinessRules(fullParsed.data, {
    excludeReservationId: id,
  });
  if (!rules.success) return rules;

  const patch: ReservationUpdate = {};
  const p = partialParsed.data;
  if (p.table_id !== undefined) patch.table_id = p.table_id;
  if (p.customer_name !== undefined) patch.customer_name = p.customer_name;
  if (p.customer_phone !== undefined) patch.customer_phone = p.customer_phone;
  if (p.party_size !== undefined) patch.party_size = p.party_size;
  if (p.category_id !== undefined) patch.category_id = p.category_id;
  if (p.start_at !== undefined) patch.start_at = p.start_at;
  if (p.end_at !== undefined) patch.end_at = p.end_at;
  if (p.notes !== undefined) patch.notes = p.notes;

  if (Object.keys(patch).length === 0) {
    return ok(row);
  }

  const { data, error } = await supabase
    .from("reservations")
    .update(patch)
    .eq("id", id)
    .select(reservationSelectWithTable)
    .single();

  if (error) {
    console.error("Failed to update reservation:", error);
    if (error.code === "23P01") {
      return err("この時間帯はすでに予約が入っています");
    }
    return err("予約の更新に失敗しました");
  }

  revalidatePath("/calendar");
  return ok(data as ReservationWithTable);
}

export async function cancelReservation(
  id: string,
): Promise<Result<void, string>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) {
    console.error("Failed to cancel reservation:", error);
    return err("キャンセルに失敗しました");
  }

  revalidatePath("/calendar");
  return ok(undefined);
}
