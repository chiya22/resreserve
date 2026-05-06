import { createClient } from "@/lib/supabase/server";

/** 予約通知を送るすべてのオーナーのメールアドレス（空白・未設定は除外） */
export async function listOwnerNotificationEmails(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff")
    .select("notification_email")
    .eq("role", "owner");

  if (error) {
    console.error("listOwnerNotificationEmails failed:", error);
    return [];
  }

  const out: string[] = [];
  for (const row of data ?? []) {
    const e = row.notification_email?.trim();
    if (e) out.push(e);
  }
  return [...new Set(out)];
}
