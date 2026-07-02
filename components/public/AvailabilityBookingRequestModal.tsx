"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";

import {
  BOOKING_REQUEST_EMAIL_MISMATCH_MESSAGE,
  BOOKING_REQUEST_SEATING_OPTIONS,
  bookingRequestEmailsMismatch,
  bookingRequestTimeOptions,
  getBookingRequestPlanOptions,
  isBookingRequestPlanAvailable,
  type BookingRequestPlanKind,
  type BookingRequestSeatingStyle,
} from "@/lib/data/booking-request-shared";
import { submitBookingRequest } from "@/lib/data/booking-request-actions";

const radioChipClassName =
  "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-bg-primary px-3 py-2 text-xs transition-colors has-[:checked]:border-accent has-[:checked]:bg-bg-hover has-[:focus-visible]:bg-bg-hover touch-manipulation active:scale-[0.97]";

const radioCourseCardClassName =
  "flex cursor-pointer flex-col gap-1 rounded-md border border-border bg-bg-primary px-3 py-2.5 text-xs transition-colors has-[:checked]:border-accent has-[:checked]:bg-bg-hover has-[:focus-visible]:bg-bg-hover touch-manipulation active:scale-[0.97]";

const inputClassName =
  "w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm outline-none transition-colors focus:border-accent focus:bg-bg-hover";

type AvailabilityBookingRequestModalProps = {
  reservationDate: string;
  onClose: () => void;
};

function formatReservationDateJa(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return `${y}年${m}月${d}日`;
}

function buildDefaultStartTime(): string {
  return bookingRequestTimeOptions[0] ?? "17:00";
}

const PARTY_SIZE_MIN = 10;
const PARTY_SIZE_MAX = 500;

function parsePartySizeInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}

export function AvailabilityBookingRequestModal({
  reservationDate,
  onClose,
}: AvailabilityBookingRequestModalProps) {
  const defaultStartTime = useMemo(() => buildDefaultStartTime(), []);

  const [phase, setPhase] = useState<"form" | "success">("form");
  const [error, setError] = useState<string | null>(null);
  const [emailConfirmError, setEmailConfirmError] = useState<string | null>(
    null,
  );
  const [partySizeError, setPartySizeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [startTime, setStartTime] = useState(defaultStartTime);
  const [seatingStyle, setSeatingStyle] =
    useState<BookingRequestSeatingStyle>("standing");
  const [course, setCourse] = useState<BookingRequestPlanKind>("standard");
  const planOptions = useMemo(
    () => getBookingRequestPlanOptions(seatingStyle),
    [seatingStyle],
  );

  function handleSeatingStyleChange(next: BookingRequestSeatingStyle) {
    setSeatingStyle(next);
    if (!isBookingRequestPlanAvailable(next, course)) {
      setCourse(getBookingRequestPlanOptions(next)[0]?.value ?? "standard");
    }
  }
  const [partySizeInput, setPartySizeInput] = useState("10");
  const [customerName, setCustomerName] = useState("");
  const [customerNameFurigana, setCustomerNameFurigana] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPending]);

  function handlePartySizeChange(value: string) {
    if (value !== "" && !/^\d+$/.test(value)) return;
    if (value.length > 3) return;
    setPartySizeInput(value);
    setPartySizeError(null);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEmailConfirmError(null);
    setPartySizeError(null);

    if (bookingRequestEmailsMismatch(email, emailConfirm)) {
      setEmailConfirmError(BOOKING_REQUEST_EMAIL_MISMATCH_MESSAGE);
      return;
    }

    const partySize = parsePartySizeInput(partySizeInput);
    if (partySize === null || partySize < PARTY_SIZE_MIN) {
      setPartySizeError("希望人数は10名以上で入力してください");
      return;
    }
    if (partySize > PARTY_SIZE_MAX) {
      setPartySizeError("希望人数は500名以下で入力してください");
      return;
    }

    startTransition(async () => {
      const result = await submitBookingRequest({
        reservation_date: reservationDate,
        start_time: startTime,
        seating_style: seatingStyle,
        course,
        party_size: partySize,
        customer_name: customerName,
        customer_name_furigana: customerNameFurigana,
        company_name: companyName || undefined,
        email,
        email_confirm: emailConfirm,
        mobile_phone: mobilePhone,
        notes,
      });

      if (!result.success) {
        if (result.error === BOOKING_REQUEST_EMAIL_MISMATCH_MESSAGE) {
          setEmailConfirmError(result.error);
          return;
        }
        if (result.error.includes("希望人数")) {
          setPartySizeError(result.error);
          return;
        }
        setError(result.error);
        return;
      }

      setPhase("success");
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))] backdrop-blur-[2px] sm:items-center sm:pb-4 sm:pt-4"
    >
      <div
        className="max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom)-2rem))] w-full max-w-[520px] overflow-y-auto overscroll-contain rounded-xl border-[0.5px] border-border bg-[#faf6ec] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby={phase === "success" ? "booking-request-title" : undefined}
        aria-label={phase === "success" ? undefined : "予約入力"}
        onClick={(e) => e.stopPropagation()}
      >
        {phase === "success" ? (
          <div className="space-y-4 text-center">
            <h2
              id="booking-request-title"
              className="text-[17px] font-medium text-text-primary"
            >
              送信完了
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              ご予約依頼を送信しました。
              <br />
              内容を確認のうえ、担当者よりご連絡いたします。
              <br />
              しばらくお待ちください。
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-accent px-5 py-2.5 text-[13px] text-white transition-colors hover:bg-[#3B7DE8]"
            >
              閉じる
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 rounded-lg border-[0.5px] border-reservation-waitlist-border border-l-[3px] border-l-reservation-waitlist-border bg-reservation-waitlist-bg px-3 py-3 text-xs leading-relaxed text-reservation-waitlist-text">
                <p>
                  ※人数が変更になる場合は、前日までにお知らせください。当日の変更で人数が減る場合、お料理代は人数分ご請求させて頂きます。
                </p>
                <p>※前日、当日キャンセルは代金の100％を頂きます。</p>
              </div>

              <div>
                <span className="mb-1 block text-xs text-text-tertiary">
                  予約年月日
                </span>
                <p className="rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary">
                  {formatReservationDateJa(reservationDate)}
                </p>
              </div>

              <div>
                <label
                  htmlFor="br-start-time"
                  className="mb-1 block text-xs text-text-tertiary"
                >
                  希望開始時間
                </label>
                <select
                  id="br-start-time"
                  required
                  value={startTime}
                  onChange={(ev) => setStartTime(ev.target.value)}
                  className={inputClassName}
                >
                  {bookingRequestTimeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset>
                <legend className="mb-1 text-xs text-text-tertiary">提供形態</legend>
                <div
                  className="flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-label="提供形態"
                >
                  {BOOKING_REQUEST_SEATING_OPTIONS.map((option) => (
                    <label key={option.value} className={radioChipClassName}>
                      <input
                        type="radio"
                        name="seating_style"
                        value={option.value}
                        checked={seatingStyle === option.value}
                        onChange={() => handleSeatingStyleChange(option.value)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-1 text-xs text-text-tertiary">プラン</legend>
                <div className="space-y-2" role="radiogroup" aria-label="プラン">
                  {planOptions.map((option) => (
                    <label key={option.value} className={radioCourseCardClassName}>
                      <span className="flex items-center gap-2 font-medium leading-relaxed text-text-primary">
                        <input
                          type="radio"
                          name="course"
                          value={option.value}
                          checked={course === option.value}
                          onChange={() => setCourse(option.value)}
                          className="sr-only"
                        />
                        {option.titleLine}
                      </span>
                      <span className="text-[11px] leading-relaxed text-reservation-waitlist-text">
                        {option.drinkNote}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="br-party-size"
                  className="mb-1 block text-xs text-text-tertiary"
                >
                  希望人数
                </label>
                <input
                  id="br-party-size"
                  name="party_size"
                  type="text"
                  inputMode="numeric"
                  placeholder="10～"
                  required
                  value={partySizeInput}
                  onChange={(ev) => handlePartySizeChange(ev.target.value)}
                  aria-invalid={partySizeError ? true : undefined}
                  aria-describedby={
                    partySizeError ? "br-party-size-error" : undefined
                  }
                  className={`${inputClassName}${
                    partySizeError
                      ? " border-reservation-waitlist-border focus:border-reservation-waitlist-border"
                      : ""
                  }`}
                />
                {partySizeError ? (
                  <p
                    id="br-party-size-error"
                    className="mt-1 text-xs text-reservation-waitlist-text"
                    role="alert"
                  >
                    {partySizeError}
                  </p>
                ) : null}
                <p className="mt-2 text-[11px] text-reservation-waitlist-text">
                  10名からの受付となります
                </p>
              </div>

              <div>
                <label
                  htmlFor="br-customer-name"
                  className="mb-1 block text-xs text-text-tertiary"
                >
                  氏名
                </label>
                <input
                  id="br-customer-name"
                  name="customer_name"
                  required
                  autoComplete="name"
                  value={customerName}
                  onChange={(ev) => setCustomerName(ev.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="br-customer-furigana"
                  className="mb-1 block text-xs text-text-tertiary"
                >
                  氏名（ふりがな）
                </label>
                <input
                  id="br-customer-furigana"
                  name="customer_name_furigana"
                  required
                  autoComplete="off"
                  value={customerNameFurigana}
                  onChange={(ev) => setCustomerNameFurigana(ev.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="br-company"
                  className="mb-1 block text-xs text-text-tertiary"
                >
                  会社名（任意）
                </label>
                <input
                  id="br-company"
                  name="company_name"
                  autoComplete="organization"
                  value={companyName}
                  onChange={(ev) => setCompanyName(ev.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="br-email"
                  className="mb-1 block text-xs text-text-tertiary"
                >
                  メールアドレス
                </label>
                <input
                  id="br-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(ev) => {
                    setEmail(ev.target.value);
                    setEmailConfirmError(null);
                  }}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="br-email-confirm"
                  className="mb-1 block text-xs text-text-tertiary"
                >
                  メールアドレス（確認用）
                </label>
                <input
                  id="br-email-confirm"
                  name="email_confirm"
                  type="email"
                  required
                  autoComplete="off"
                  value={emailConfirm}
                  onChange={(ev) => {
                    setEmailConfirm(ev.target.value);
                    setEmailConfirmError(null);
                  }}
                  aria-invalid={emailConfirmError ? true : undefined}
                  aria-describedby={
                    emailConfirmError ? "br-email-confirm-error" : undefined
                  }
                  className={`${inputClassName}${
                    emailConfirmError
                      ? " border-reservation-waitlist-border focus:border-reservation-waitlist-border"
                      : ""
                  }`}
                />
                {emailConfirmError ? (
                  <p
                    id="br-email-confirm-error"
                    className="mt-1 text-xs text-reservation-waitlist-text"
                    role="alert"
                  >
                    {emailConfirmError}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="br-mobile"
                  className="mb-1 block text-xs text-text-tertiary"
                >
                  携帯TEL
                </label>
                <input
                  id="br-mobile"
                  name="mobile_phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={mobilePhone}
                  onChange={(ev) => setMobilePhone(ev.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="br-notes"
                  className="mb-1 block text-xs text-text-tertiary"
                >
                  備考（他ご希望の場合はこちらにご記入ください）
                </label>
                <textarea
                  id="br-notes"
                  name="notes"
                  rows={4}
                  required
                  value={notes}
                  onChange={(ev) => setNotes(ev.target.value)}
                  className={`${inputClassName} resize-y`}
                />
              </div>

              {error ? (
                <p className="text-sm text-reservation-waitlist-text" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="rounded-lg border border-border px-5 py-2.5 text-[13px] text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-accent px-5 py-2.5 text-[13px] text-white transition-colors hover:bg-[#3B7DE8] disabled:opacity-50"
                >
                  {isPending ? "送信中…" : "送信"}
                </button>
              </div>
            </form>
        )}
      </div>
    </div>
  );
}
