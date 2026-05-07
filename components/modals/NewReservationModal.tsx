"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import {
  addMinutes,
  defaultNewReservationRange,
  parseDateAndTime,
  toDateInputValue,
  toTimeSelectValue,
} from "@/lib/calendar/datetime-ui";
import { createReservation } from "@/lib/data/reservation-actions";

function buildInitialDatetime(defaultStartAt: string | undefined) {
  if (defaultStartAt) {
    const s = new Date(defaultStartAt);
    if (!Number.isNaN(s.getTime())) {
      const end = addMinutes(s, 90);
      return {
        startDate: toDateInputValue(s),
        startTime: toTimeSelectValue(s),
        endDate: toDateInputValue(end),
        endTime: toTimeSelectValue(end),
      };
    }
  }
  const base = defaultNewReservationRange();
  return {
    startDate: toDateInputValue(base.start),
    startTime: toTimeSelectValue(base.start),
    endDate: toDateInputValue(base.end),
    endTime: toTimeSelectValue(base.end),
  };
}

export type NewReservationModalProps = {
  bookingCategoryOptions: { value: string; label: string }[];
  /** コード `normal` のカテゴリ id（サーバー側で決定）。なければ先頭チップが既定 */
  defaultCategoryIdHint?: string;
  defaultStartAt?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function NewReservationModal({
  bookingCategoryOptions,
  defaultCategoryIdHint,
  defaultStartAt,
  onClose,
  onSuccess,
}: NewReservationModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [categoryId, setCategoryId] = useState<string>(() => {
    const hinted =
      defaultCategoryIdHint &&
      bookingCategoryOptions.some((o) => o.value === defaultCategoryIdHint)
        ? defaultCategoryIdHint
        : undefined;
    return hinted ?? bookingCategoryOptions[0]?.value ?? "";
  });

  const resolvedCategoryId = useMemo(() => {
    if (bookingCategoryOptions.some((o) => o.value === categoryId))
      return categoryId;
    return bookingCategoryOptions[0]?.value ?? "";
  }, [bookingCategoryOptions, categoryId]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [partySize, setPartySize] = useState(10);
  const [amount, setAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [datetime, setDatetime] = useState(() =>
    buildInitialDatetime(defaultStartAt),
  );
  const { startDate, startTime, endDate, endTime } = datetime;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const startAt = parseDateAndTime(startDate, startTime);
    const endAt = parseDateAndTime(endDate, endTime);

    if (bookingCategoryOptions.length === 0) {
      setError("選択できるカテゴリがありません");
      return;
    }
    if (!resolvedCategoryId.length) {
      setError("カテゴリを選んでください");
      return;
    }
    if (amount !== "" && (Number.isNaN(amount) || amount < 0)) {
      setError("金額は0円以上の数値で入力してください");
      return;
    }

    startTransition(async () => {
      const result = await createReservation({
        table_id: null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        party_size: partySize,
        category_id: resolvedCategoryId,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        notes: notes.trim() || null,
        amount: amount === "" ? null : amount,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onSuccess?.();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))] backdrop-blur-[2px] sm:items-center sm:pb-4 sm:pt-4">
      <div
        className="max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom)-2rem))] w-full max-w-[480px] overflow-y-auto overscroll-contain rounded-xl border-[0.5px] border-border bg-bg-primary p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-reservation-title"
      >
        <h2
          id="new-reservation-title"
          className="text-[17px] font-medium text-text-primary"
        >
          新規予約
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="nr-customer-name"
              className="mb-1 block text-xs text-text-tertiary"
            >
              顧客名
            </label>
            <input
              id="nr-customer-name"
              name="customer_name"
              required
              value={customerName}
              onChange={(ev) => setCustomerName(ev.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label
              htmlFor="nr-phone"
              className="mb-1 block text-xs text-text-tertiary"
            >
              電話（任意）
            </label>
            <input
              id="nr-phone"
              name="customer_phone"
              value={customerPhone}
              onChange={(ev) => setCustomerPhone(ev.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label
              htmlFor="nr-party"
              className="mb-1 block text-xs text-text-tertiary"
            >
              人数
            </label>
            <input
              id="nr-party"
              name="party_size"
              type="number"
              min={1}
              max={200}
              required
              value={partySize}
              onChange={(ev) => setPartySize(Number(ev.target.value))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label
              htmlFor="nr-amount"
              className="mb-1 block text-xs text-text-tertiary"
            >
              予約金額（任意・税込／円）
            </label>
            <input
              id="nr-amount"
              name="amount"
              type="number"
              min={0}
              step={100}
              value={amount}
              onChange={(ev) => {
                const v = ev.target.value;
                setAmount(v === "" ? "" : Number(v));
              }}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="例: 8000"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="mb-1 block text-xs text-text-tertiary">
                開始日
              </span>
              <input
                type="date"
                required
                value={startDate}
                onChange={(ev) =>
                  setDatetime((d) => ({ ...d, startDate: ev.target.value }))
                }
                className="w-full rounded-lg border border-border px-2 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <span className="mb-1 block text-xs text-text-tertiary">
                開始時刻
              </span>
              <input
                type="time"
                step={1800}
                required
                value={startTime}
                onChange={(ev) =>
                  setDatetime((d) => ({ ...d, startTime: ev.target.value }))
                }
                className="w-full rounded-lg border border-border px-2 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <span className="mb-1 block text-xs text-text-tertiary">
                終了日
              </span>
              <input
                type="date"
                required
                value={endDate}
                onChange={(ev) =>
                  setDatetime((d) => ({ ...d, endDate: ev.target.value }))
                }
                className="w-full rounded-lg border border-border px-2 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <span className="mb-1 block text-xs text-text-tertiary">
                終了時刻
              </span>
              <input
                type="time"
                step={1800}
                required
                value={endTime}
                onChange={(ev) =>
                  setDatetime((d) => ({ ...d, endTime: ev.target.value }))
                }
                className="w-full rounded-lg border border-border px-2 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
          <fieldset>
            <legend className="mb-1 text-xs text-text-tertiary">カテゴリ</legend>
            {bookingCategoryOptions.length === 0 ? (
              <p className="text-xs text-reservation-waitlist-text">
                予約フォームで選べるカテゴリがありません。オーナーの「カテゴリ」設定で「新規予約フォーム」を有効にしてください。
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {bookingCategoryOptions.map((c) => (
                  <label
                    key={c.value}
                    className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-xs has-[:checked]:border-accent has-[:checked]:bg-bg-hover"
                  >
                    <input
                      type="radio"
                      name="category"
                      value={c.value}
                    checked={resolvedCategoryId === c.value}
                    onChange={() => setCategoryId(c.value)}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <div>
            <label
              htmlFor="nr-notes"
              className="mb-1 block text-xs text-text-tertiary"
            >
              備考
            </label>
            <textarea
              id="nr-notes"
              name="notes"
              rows={3}
              value={notes}
              onChange={(ev) => setNotes(ev.target.value)}
              className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          {error ? (
            <p className="text-sm text-reservation-waitlist-text" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 min-w-[5.5rem] items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-hover touch-manipulation active:scale-[0.97]"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPending || bookingCategoryOptions.length === 0}
              className="inline-flex min-h-11 min-w-[7rem] items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-[13px] text-white transition-colors hover:bg-[#3B7DE8] disabled:opacity-50 touch-manipulation active:scale-[0.97]"
            >
              {isPending ? "作成中…" : "予約を作成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
