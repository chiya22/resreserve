import {
  formatBookingRequestSeatingStyleLabel,
  getBookingRequestPlanOptions,
  type BookingRequestInput,
} from "@/lib/data/booking-request-shared";

function formatReservationDateJa(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return `${y}年${m}月${d}日`;
}

export function formatBookingRequestEmailText(
  input: BookingRequestInput,
): string {
  const company = input.company_name?.trim() || "—";
  const notes = input.notes?.trim() || "—";
  const plan = getBookingRequestPlanOptions(input.seating_style).find(
    (o) => o.value === input.course,
  );

  return [
    "公開予約状況ページより予約依頼が届きました。",
    "",
    `予約年月日：${formatReservationDateJa(input.reservation_date)}`,
    `希望開始時間：${input.start_time}`,
    `提供形態：${formatBookingRequestSeatingStyleLabel(input.seating_style)}`,
    plan ? `プラン：${plan.titleLine}` : `プラン：${input.course}`,
    plan ? `　${plan.drinkNote}` : "",
    `希望人数：${input.party_size}名`,
    `氏名：${input.customer_name}`,
    `氏名（ふりがな）：${input.customer_name_furigana}`,
    `会社名：${company}`,
    `メールアドレス：${input.email}`,
    `携帯TEL：${input.mobile_phone}`,
    "備考（他ご希望の場合はこちらにご記入ください）：",
    notes,
    "",
  ].join("\n");
}

export function formatBookingRequestEmailSubject(
  input: BookingRequestInput,
): string {
  return `【予約依頼】神田無垢食堂 ${formatReservationDateJa(input.reservation_date)}`;
}
