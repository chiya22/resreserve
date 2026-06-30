import { z } from "zod";

/** 公開予約入力フォームの希望開始時間の下限・上限 */
export const BOOKING_REQUEST_HOUR_START = 17;
export const BOOKING_REQUEST_HOUR_END = 20;

function buildBookingRequestTimeOptions(): string[] {
  const out: string[] = [];
  for (let h = BOOKING_REQUEST_HOUR_START; h <= BOOKING_REQUEST_HOUR_END; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h < BOOKING_REQUEST_HOUR_END) {
      out.push(`${String(h).padStart(2, "0")}:30`);
    }
  }
  return out;
}

const TIME_OPTIONS = buildBookingRequestTimeOptions();
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export const bookingRequestTimeOptions = TIME_OPTIONS;

export const BOOKING_REQUEST_COURSE_OPTIONS = [
  { value: "5000", label: "5,000円コース" },
  { value: "4500", label: "4,500円コース" },
] as const;

export type BookingRequestCourse =
  (typeof BOOKING_REQUEST_COURSE_OPTIONS)[number]["value"];

const COURSE_VALUES = BOOKING_REQUEST_COURSE_OPTIONS.map((o) => o.value) as [
  BookingRequestCourse,
  ...BookingRequestCourse[],
];

export function bookingRequestCourseLabel(
  course: BookingRequestCourse,
): string {
  return (
    BOOKING_REQUEST_COURSE_OPTIONS.find((o) => o.value === course)?.label ??
    course
  );
}

export const BOOKING_REQUEST_EMAIL_MISMATCH_MESSAGE =
  "メールアドレスが一致しません";

export function bookingRequestEmailsMismatch(
  email: string,
  emailConfirm: string,
): boolean {
  return email.trim() !== emailConfirm.trim();
}

export const bookingRequestInputSchema = z
  .object({
    reservation_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "予約日が不正です"),
    start_time: z.enum(TIME_OPTIONS as [string, ...string[]], {
      message: "希望開始時間を選択してください",
    }),
    course: z.enum(COURSE_VALUES, {
      message: "コースを選択してください",
    }),
    party_size: z.coerce
      .number({ message: "希望人数を入力してください" })
      .int("希望人数は整数で入力してください")
      .min(10, "希望人数は10名以上で入力してください")
      .max(500, "希望人数は500名以下で入力してください"),
    customer_name: z
      .string()
      .trim()
      .min(1, "氏名を入力してください")
      .max(100, "氏名は100文字以内で入力してください"),
    customer_name_furigana: z
      .string()
      .trim()
      .min(1, "氏名（ふりがな）を入力してください")
      .max(100, "氏名（ふりがな）は100文字以内で入力してください"),
    company_name: z
      .string()
      .trim()
      .max(200, "会社名は200文字以内で入力してください")
      .optional(),
    email: z
      .string()
      .trim()
      .min(1, "メールアドレスを入力してください")
      .email("メールアドレスの形式が正しくありません")
      .max(320),
    email_confirm: z
      .string()
      .trim()
      .min(1, "メールアドレス（確認用）を入力してください")
      .email("メールアドレス（確認用）の形式が正しくありません")
      .max(320),
    mobile_phone: z
      .string()
      .trim()
      .min(1, "携帯TELを入力してください")
      .max(30, "携帯TELは30文字以内で入力してください"),
    notes: z
      .string()
      .trim()
      .min(1, "備考を入力してください")
      .max(1000, "備考は1000文字以内で入力してください"),
  })
  .refine((data) => !bookingRequestEmailsMismatch(data.email, data.email_confirm), {
    message: BOOKING_REQUEST_EMAIL_MISMATCH_MESSAGE,
    path: ["email_confirm"],
  })
  .refine(
    (data) => timeToMinutes(data.start_time) >= BOOKING_REQUEST_HOUR_START * 60,
    {
      message: "希望開始時間は17:00以降で選択してください",
      path: ["start_time"],
    },
  )
  .refine(
    (data) => timeToMinutes(data.start_time) <= BOOKING_REQUEST_HOUR_END * 60,
    {
      message: "希望開始時間は20:00までで選択してください",
      path: ["start_time"],
    },
  );

export type BookingRequestInput = z.infer<typeof bookingRequestInputSchema>;
