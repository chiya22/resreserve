"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentStaff } from "@/lib/data/auth";
import { createClient } from "@/lib/supabase/server";
import type { ClosedDay } from "@/types";
import { err, ok, type Result } from "@/types/result";

const createClosedDaySchema = z.object({
  closed_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付が不正です"),
  note: z.string().trim().max(200).optional().nullable(),
});

const updateClosedDaySchema = z.object({
  id: z.string().uuid(),
  closed_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付が不正です"),
  note: z.string().trim().max(200).optional().nullable(),
});

async function requireClosedDayMaintainer(): Promise<Result<void, string>> {
  const me = await getCurrentStaff();
  if (!me) return err("ログインが必要です");
  if (me.role !== "owner" && me.role !== "manager") {
    return err("オーナーまたはマネージャーのみ実行できます");
  }
  return ok(undefined);
}

function revalidateClosedDaysUi(): void {
  revalidatePath("/calendar");
  revalidatePath("/settings/closed-days");
}

export async function createClosedDay(raw: unknown): Promise<Result<ClosedDay, string>> {
  const maintainer = await requireClosedDayMaintainer();
  if (!maintainer.success) return maintainer;

  const parsed = createClosedDaySchema.safeParse(raw);
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ??
      "入力内容に問題があります";
    return err(first);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("closed_days")
    .insert({
      closed_on: parsed.data.closed_on,
      note: parsed.data.note?.trim() || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    if (error?.code === "23505") return err("その休業日は既に登録されています");
    console.error("createClosedDay failed:", error);
    return err("休業日の登録に失敗しました");
  }

  revalidateClosedDaysUi();
  return ok(data as ClosedDay);
}

export async function updateClosedDay(raw: unknown): Promise<Result<void, string>> {
  const maintainer = await requireClosedDayMaintainer();
  if (!maintainer.success) return maintainer;

  const parsed = updateClosedDaySchema.safeParse(raw);
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ??
      "入力内容に問題があります";
    return err(first);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("closed_days")
    .update({
      closed_on: parsed.data.closed_on,
      note: parsed.data.note?.trim() || null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    if (error.code === "23505") return err("その休業日は既に登録されています");
    console.error("updateClosedDay failed:", error);
    return err("休業日の更新に失敗しました");
  }

  revalidateClosedDaysUi();
  return ok(undefined);
}

export async function deleteClosedDay(id: string): Promise<Result<void, string>> {
  const maintainer = await requireClosedDayMaintainer();
  if (!maintainer.success) return maintainer;

  const idParsed = z.string().uuid().safeParse(id);
  if (!idParsed.success) return err("休業日IDが不正です");

  const supabase = await createClient();
  const { error } = await supabase
    .from("closed_days")
    .delete()
    .eq("id", idParsed.data);

  if (error) {
    console.error("deleteClosedDay failed:", error);
    return err("休業日の削除に失敗しました");
  }

  revalidateClosedDaysUi();
  return ok(undefined);
}
