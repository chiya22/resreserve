"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { FORM_CATEGORY_OPTIONS } from "@/lib/calendar/calendar-constants";
import {
  addMinutes,
  defaultNewReservationRange,
  parseDateAndTime,
  toDateInputValue,
  toTimeSelectValue,
} from "@/lib/calendar/datetime-ui";
import { createReservation } from "@/lib/data/reservation-actions";
import type { ReservationCategory, Table } from "@/types";

export type NewReservationModalProps = {
  tables: Table[];
  defaultStartAt?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function NewReservationModal({
  tables,
  defaultStartAt,
  onClose,
  onSuccess,
}: NewReservationModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] =
    useState<ReservationCategory>("normal");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [tableId, setTableId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const categoryChoices = useMemo(
    () =>
      FORM_CATEGORY_OPTIONS.map((o) => ({
        value: o.value as ReservationCategory,
        label: o.label,
      })),
    [],
  );

  useEffect(() => {
    const base = defaultStartAt
      ? (() => {
          const s = new Date(defaultStartAt);
          return Number.isNaN(s.getTime())
            ? defaultNewReservationRange()
            : { start: s, end: addMinutes(s, 90) };
        })()
      : defaultNewReservationRange();
    setStartDate(toDateInputValue(base.start));
    setStartTime(toTimeSelectValue(base.start));
    setEndDate(toDateInputValue(base.end));
    setEndTime(toTimeSelectValue(base.end));
  }, [defaultStartAt]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const startAt = parseDateAndTime(startDate, startTime);
    const endAt = parseDateAndTime(endDate, endTime);
    const tid = tableId.trim();

    startTransition(async () => {
      const result = await createReservation({
        table_id: tid.length > 0 ? tid : null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        party_size: partySize,
        category,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        notes: notes.trim() || null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div
        className="w-full max-w-[480px] rounded-xl border-[0.5px] border-border bg-bg-primary p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
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
              max={50}
              required
              value={partySize}
              onChange={(ev) => setPartySize(Number(ev.target.value))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
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
                onChange={(ev) => setStartDate(ev.target.value)}
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
                onChange={(ev) => setStartTime(ev.target.value)}
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
                onChange={(ev) => setEndDate(ev.target.value)}
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
                onChange={(ev) => setEndTime(ev.target.value)}
                className="w-full rounded-lg border border-border px-2 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="nr-table"
              className="mb-1 block text-xs text-text-tertiary"
            >
              テーブル
            </label>
            <select
              id="nr-table"
              name="table_id"
              value={tableId}
              onChange={(ev) => setTableId(ev.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">未割当</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}（{t.capacity}名）
                </option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className="mb-1 text-xs text-text-tertiary">カテゴリ</legend>
            <div className="flex flex-wrap gap-2">
              {categoryChoices.map((c) => (
                <label
                  key={c.value}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-xs has-[:checked]:border-accent has-[:checked]:bg-bg-hover"
                >
                  <input
                    type="radio"
                    name="category"
                    value={c.value}
                    checked={category === c.value}
                    onChange={() => setCategory(c.value)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
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

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-hover"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-accent px-5 py-2 text-[13px] text-white transition-colors hover:bg-[#3B7DE8] disabled:opacity-50"
            >
              {isPending ? "作成中…" : "予約を作成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
