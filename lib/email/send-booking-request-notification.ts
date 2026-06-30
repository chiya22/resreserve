import { Resend } from "resend";

import { listOwnerNotificationEmailsAdmin } from "@/lib/data/owner-notification-emails";
import type { BookingRequestInput } from "@/lib/data/booking-request-shared";
import {
  formatBookingRequestEmailSubject,
  formatBookingRequestEmailText,
} from "@/lib/email/format-booking-request";
import { env } from "@/lib/env";
import { err, ok, type Result } from "@/types/result";

function getResend(): Resend | null {
  const key = env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendBookingRequestNotification(
  input: BookingRequestInput,
): Promise<Result<void, string>> {
  const from = env.RESERVATION_NOTIFY_FROM;
  if (!from) {
    console.error(
      "予約依頼メール送信失敗: RESERVATION_NOTIFY_FROM が未設定です",
    );
    return err(
      "現在、予約依頼の送信を受け付けられません。お手数ですがお電話でお問い合わせください。",
    );
  }

  const recipients = await listOwnerNotificationEmailsAdmin();
  if (recipients.length === 0) {
    console.error(
      "予約依頼メール送信失敗: オーナー・マネージャーの通知メールアドレスが未登録です",
    );
    return err(
      "現在、予約依頼の送信を受け付けられません。お手数ですがお電話でお問い合わせください。",
    );
  }

  const client = getResend();
  if (!client) {
    console.error("予約依頼メール送信失敗: RESEND_API_KEY が未設定です");
    return err(
      "現在、予約依頼の送信を受け付けられません。お手数ですがお電話でお問い合わせください。",
    );
  }

  const { error } = await client.emails.send({
    from,
    to: recipients,
    replyTo: input.email,
    subject: formatBookingRequestEmailSubject(input),
    text: formatBookingRequestEmailText(input),
  });

  if (error) {
    console.error("予約依頼メール送信に失敗:", error);
    return err(
      "送信に失敗しました。しばらくしてから再度お試しください。",
    );
  }

  return ok(undefined);
}
