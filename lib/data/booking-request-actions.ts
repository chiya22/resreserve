"use server";

import { formatInTimeZone } from "date-fns-tz";

import {
  bookingRequestInputSchema,
  type BookingRequestInput,
} from "@/lib/data/booking-request-shared";
import { getPublicMonthlyAvailability } from "@/lib/data/public-availability";
import { sendBookingRequestNotification } from "@/lib/email/send-booking-request-notification";
import { CALENDAR_DISPLAY_TIMEZONE } from "@/lib/calendar/calendar-constants";
import { err, ok, type Result } from "@/types/result";

function parseYmdParts(ymd: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function isPastDateInTokyo(ymd: string): boolean {
  const todayYmd = formatInTimeZone(
    new Date(),
    CALENDAR_DISPLAY_TIMEZONE,
    "yyyy-MM-dd",
  );
  return ymd < todayYmd;
}

async function assertBookableDay(
  input: BookingRequestInput,
): Promise<Result<void, string>> {
  const parts = parseYmdParts(input.reservation_date);
  if (!parts) {
    return err("予約日が不正です");
  }

  if (isPastDateInTokyo(input.reservation_date)) {
    return err("過去の日付には予約依頼できません");
  }

  const availability = await getPublicMonthlyAvailability(parts.year, parts.month);
  if (!availability) {
    return err("予約状況の確認に失敗しました。しばらくしてから再度お試しください。");
  }

  if (availability.closedDays.includes(input.reservation_date)) {
    return err("休業日のため予約依頼を受け付けられません");
  }

  const mark = availability.days[input.reservation_date];
  if (mark !== "○" && mark !== "△") {
    return err("この日は予約依頼を受け付けていません");
  }

  return ok(undefined);
}

export async function submitBookingRequest(
  input: BookingRequestInput,
): Promise<Result<void, string>> {
  const parsed = bookingRequestInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const emailConfirmError = fieldErrors.email_confirm?.[0];
    if (emailConfirmError) {
      return err(emailConfirmError);
    }
    const firstError = Object.values(fieldErrors)[0]?.[0];
    return err(firstError ?? "入力内容に問題があります");
  }

  const bookable = await assertBookableDay(parsed.data);
  if (!bookable.success) {
    return bookable;
  }

  return sendBookingRequestNotification(parsed.data);
}
