import { Resend } from "resend";

import { listOwnerNotificationEmails } from "@/lib/data/owner-notification-emails";
import { env } from "@/lib/env";
import {
  formatReservationIndexed,
  getReservationNotifyChangedLineNumbers,
} from "@/lib/email/format-reservation-notification";
import type { ReservationWithTable } from "@/types";

function getResend(): Resend | null {
  const key = env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

async function sendToOwners(subject: string, text: string) {
  const from = env.RESERVATION_NOTIFY_FROM;
  if (!from) {
    console.warn(
      "OWNER通知をスキップ: RESERVATION_NOTIFY_FROM が未設定です（Resend の検証済み送信元を設定してください）",
    );
    return;
  }

  const recipients = await listOwnerNotificationEmails();
  if (recipients.length === 0) {
    console.warn(
      "OWNER通知をスキップ: オーナーの通知メールアドレスが登録されていません",
    );
    return;
  }

  const client = getResend();
  if (!client) {
    console.warn("OWNER通知をスキップ: RESEND_API_KEY が未設定です");
    return;
  }

  const { error } = await client.emails.send({
    from,
    to: recipients,
    subject,
    text,
  });

  if (error) {
    console.error("OWNER予約通知メール送信に失敗:", error);
  }
}

/** 失敗時はログのみ（予約の成功とは切り離す） */
export async function notifyReservationCreated(
  row: ReservationWithTable,
): Promise<void> {
  const block = formatReservationIndexed(row);
  await sendToOwners(
    "【予約】新規予約が登録されました",
    `予約が追加されました。\n\n【予約情報】\n${block}\n`,
  );
}

export async function notifyReservationUpdated(
  before: ReservationWithTable,
  after: ReservationWithTable,
): Promise<void> {
  const changedLines = getReservationNotifyChangedLineNumbers(before, after);
  const legend =
    changedLines.size > 0
      ? "※＝変更前のうち更新があった項目　▶＝変更後で更新があった項目（同一行番号で対応）\n\n"
      : "";

  const beforeBlock = formatReservationIndexed(before, {
    highlightLineNumbers: changedLines,
    lineMarker: "※",
  });
  const afterBlock = formatReservationIndexed(after, {
    highlightLineNumbers: changedLines,
    lineMarker: "▶",
  });

  await sendToOwners(
    "【予約】予約が更新されました",
    `予約が更新されました。\n\n${legend}▼ 変更前\n${beforeBlock}\n\n▼ 変更後\n${afterBlock}\n`,
  );
}

export async function notifyReservationCancelled(
  row: ReservationWithTable,
): Promise<void> {
  const block = formatReservationIndexed(row, {
    statusOverride: "cancelled",
  });
  await sendToOwners(
    "【予約】予約がキャンセルされました",
    `予約がキャンセルされました。\n\n【キャンセルされた予約情報】\n${block}\n`,
  );
}
