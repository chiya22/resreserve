import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function collectNotificationEmails(
  rows: { notification_email: string | null }[] | null,
): string[] {
  const out: string[] = [];
  for (const row of rows ?? []) {
    const e = row.notification_email?.trim();
    if (e) out.push(e);
  }
  return [...new Set(out)];
}

/** 予約の追加・変更・キャンセル通知を送るオーナーのメールアドレス（空白・未設定は除外） */
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

  return collectNotificationEmails(data);
}

/** 公開予約依頼など・認証なしサーバー処理用（オーナー＋通知メール登録済みマネージャー） */
export async function listOwnerNotificationEmailsAdmin(): Promise<string[]> {
  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("listOwnerNotificationEmailsAdmin: admin client unavailable:", error);
    return [];
  }

  const { data, error } = await admin
    .from("staff")
    .select("notification_email")
    .in("role", ["owner", "manager"]);

  if (error) {
    console.error("listOwnerNotificationEmailsAdmin failed:", error);
    return [];
  }

  return collectNotificationEmails(data);
}
