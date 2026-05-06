"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentStaff } from "@/lib/data/auth";
import { createClient } from "@/lib/supabase/server";
import { RESERVATION_PALETTE_KEYS } from "@/lib/calendar/types";
import { CATEGORY_CODE_REGEX } from "@/lib/data/reservation-category-shared";
import type { ReservationCategoryRow } from "@/types";
import { err, ok, type Result } from "@/types/result";

const paletteKeySchema = z.enum(RESERVATION_PALETTE_KEYS);

export type ReservationPaletteChoice = z.infer<typeof paletteKeySchema>;

const categoryCodeSchema = z
  .string()
  .trim()
  .regex(
    CATEGORY_CODE_REGEX,
    "コードは英小文字ではじめ、a-z・0-9・アンダースコアのみ（40文字以内）",
  );

const categoryUpsertShape = {
  label: z.string().trim().min(1).max(40),
  sort_order: z.number().int().min(0).max(32767),
  show_in_booking_form: z.boolean(),
  blocks_entire_calendar: z.boolean(),
  palette_key: paletteKeySchema,
} as const;

const createReservationCategorySchema = z.object({
  ...categoryUpsertShape,
  code: categoryCodeSchema,
});

const updateReservationCategorySchema = z.object({
  id: z.string().uuid(),
  ...categoryUpsertShape,
});

const bulkUpdateSchema = z.array(updateReservationCategorySchema).min(1);

async function requireOwner(): Promise<Result<{ userId: string }, string>> {
  const me = await getCurrentStaff();
  if (!me) return err("ログインが必要です");
  if (me.role !== "owner") return err("オーナーのみ実行できます");
  return ok({ userId: me.user_id });
}

function revalidateCategoryUi(): void {
  revalidatePath("/settings/categories");
  revalidatePath("/calendar");
}

export async function createReservationCategory(
  raw: unknown,
): Promise<Result<ReservationCategoryRow, string>> {
  const owner = await requireOwner();
  if (!owner.success) return owner;

  const parsed = createReservationCategorySchema.safeParse(raw);
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ??
      parsed.error.flatten().formErrors[0] ??
      "入力内容に問題があります";
    return err(first);
  }

  const supabase = await createClient();
  const row = parsed.data;

  const { data, error } = await supabase
    .from("reservation_categories")
    .insert({
      code: row.code,
      label: row.label,
      sort_order: row.sort_order,
      show_in_booking_form: row.show_in_booking_form,
      blocks_entire_calendar: row.blocks_entire_calendar,
      palette_key: row.palette_key,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("createReservationCategory failed:", error);
    if (error?.code === "23505") {
      return err("そのコードは既に使われています");
    }
    return err("カテゴリの作成に失敗しました");
  }

  revalidateCategoryUi();
  return ok(data as ReservationCategoryRow);
}

export async function updateReservationCategory(
  raw: unknown,
): Promise<Result<void, string>> {
  const owner = await requireOwner();
  if (!owner.success) return owner;

  const parsed = updateReservationCategorySchema.safeParse(raw);
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ??
      parsed.error.flatten().formErrors[0] ??
      "入力内容に問題があります";
    return err(first);
  }

  const supabase = await createClient();
  const row = parsed.data;

  const { error } = await supabase
    .from("reservation_categories")
    .update({
      label: row.label,
      sort_order: row.sort_order,
      show_in_booking_form: row.show_in_booking_form,
      blocks_entire_calendar: row.blocks_entire_calendar,
      palette_key: row.palette_key,
    })
    .eq("id", row.id);

  if (error) {
    console.error("updateReservationCategory failed:", error);
    return err("カテゴリの更新に失敗しました");
  }

  revalidateCategoryUi();
  return ok(undefined);
}

/** 一覧表の保存（すべて既存 id のみ。コードは変更しません） */
export async function saveReservationCategoriesBulk(
  rows: unknown,
): Promise<Result<void, string>> {
  const owner = await requireOwner();
  if (!owner.success) return owner;

  const parsed = bulkUpdateSchema.safeParse(rows);
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ??
      parsed.error.flatten().formErrors[0] ??
      "入力内容に問題があります";
    return err(first);
  }

  const supabase = await createClient();

  for (const row of parsed.data) {
    const { error } = await supabase
      .from("reservation_categories")
      .update({
        label: row.label,
        sort_order: row.sort_order,
        show_in_booking_form: row.show_in_booking_form,
        blocks_entire_calendar: row.blocks_entire_calendar,
        palette_key: row.palette_key,
      })
      .eq("id", row.id);

    if (error) {
      console.error("saveReservationCategoriesBulk failed:", error);
      return err("カテゴリ一覧の保存に失敗しました");
    }
  }

  revalidateCategoryUi();
  return ok(undefined);
}

export async function deleteReservationCategory(
  id: string,
): Promise<Result<void, string>> {
  const owner = await requireOwner();
  if (!owner.success) return owner;

  const idParsed = z.string().uuid().safeParse(id);
  if (!idParsed.success) return err("カテゴリ ID が無効です");

  const supabase = await createClient();

  const { error } = await supabase
    .from("reservation_categories")
    .delete()
    .eq("id", idParsed.data);

  if (error) {
    console.error("deleteReservationCategory failed:", error);
    if (error.code === "23503") {
      return err("このカテゴリを使っている予約があるため削除できません");
    }
    return err("カテゴリの削除に失敗しました");
  }

  revalidateCategoryUi();
  return ok(undefined);
}
