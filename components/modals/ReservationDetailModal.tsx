"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { editModeCategoryChoicesForId } from "@/lib/calendar/category-display";
import {
  parseDateAndTime,
  toDateInputValue,
  toTimeSelectValue,
} from "@/lib/calendar/datetime-ui";
import { parsePaletteKey } from "@/lib/calendar/palette-key";
import { RESERVATION_TONE_CLASS } from "@/lib/calendar/reservation-palette-classes";
import {
  cancelReservation,
  updateReservation,
} from "@/lib/data/reservation-actions";
import type { ReservationWithTable } from "@/types";

export type ReservationDetailModalProps = {
  reservation: ReservationWithTable;
  categoryLabelById: Map<string, string>;
  bookingCategoryOptions: { value: string; label: string }[];
  onClose: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
};

function formatJapaneseRange(start: Date, end: Date): string {
  const y = start.getFullYear();
  const mo = start.getMonth() + 1;
  const d = start.getDate();
  const sh = String(start.getHours()).padStart(2, "0");
  const sm = String(start.getMinutes()).padStart(2, "0");
  const eh = String(end.getHours()).padStart(2, "0");
  const em = String(end.getMinutes()).padStart(2, "0");
  return `${y}年${mo}月${d}日 ${sh}:${sm} 〜 ${eh}:${em}`;
}

export function ReservationDetailModal({
  reservation,
  categoryLabelById,
  bookingCategoryOptions,
  onClose,
  onUpdated,
  onDeleted,
}: ReservationDetailModalProps) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const cat = reservation.reservation_categories;

  const [customerName, setCustomerName] = useState(reservation.customer_name);
  const [customerPhone, setCustomerPhone] = useState(
    reservation.customer_phone ?? "",
  );
  const [partySize, setPartySize] = useState(reservation.party_size);
  const [categoryId, setCategoryId] = useState<string>(reservation.category_id);
  const [notes, setNotes] = useState(reservation.notes ?? "");
  const [startDate, setStartDate] = useState(
    toDateInputValue(new Date(reservation.start_at)),
  );
  const [startTime, setStartTime] = useState(
    toTimeSelectValue(new Date(reservation.start_at)),
  );
  const [endDate, setEndDate] = useState(
    toDateInputValue(new Date(reservation.end_at)),
  );
  const [endTime, setEndTime] = useState(
    toTimeSelectValue(new Date(reservation.end_at)),
  );

  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect --
     別予約切替・Realtime 更新時のみ id / updated_at でフォーム全体を同期 */
  useEffect(() => {
    setMode("view");
    setError(null);
    setCustomerName(reservation.customer_name);
    setCustomerPhone(reservation.customer_phone ?? "");
    setPartySize(reservation.party_size);
    setCategoryId(reservation.category_id);
    setNotes(reservation.notes ?? "");
    setStartDate(toDateInputValue(new Date(reservation.start_at)));
    setStartTime(toTimeSelectValue(new Date(reservation.start_at)));
    setEndDate(toDateInputValue(new Date(reservation.end_at)));
    setEndTime(toTimeSelectValue(new Date(reservation.end_at)));
  }, [reservation.id, reservation.updated_at]);
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

  const categoryChoices = useMemo(() => {
    return editModeCategoryChoicesForId(
      reservation.category_id,
      bookingCategoryOptions,
      categoryLabelById,
    );
  }, [
    reservation.category_id,
    bookingCategoryOptions,
    categoryLabelById,
  ]);

  function handleCancelReservation() {
    setError(null);
    startTransition(async () => {
      const result = await cancelReservation(reservation.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onDeleted?.();
      onClose();
    });
  }

  function handleUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const startAt = parseDateAndTime(startDate, startTime);
    const endAt = parseDateAndTime(endDate, endTime);

    startTransition(async () => {
      const result = await updateReservation(reservation.id, {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        party_size: partySize,
        category_id: categoryId,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        notes: notes.trim() || null,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      onUpdated?.();
      onClose();
    });
  }

  const startD = new Date(reservation.start_at);
  const endD = new Date(reservation.end_at);

  const viewBadgeTone = RESERVATION_TONE_CLASS[
    parsePaletteKey(cat.palette_key)
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))] backdrop-blur-[2px] sm:items-center sm:pb-4 sm:pt-4">
      <div
        className="relative max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom)-2rem))] w-full max-w-[440px] overflow-y-auto overscroll-contain rounded-xl border-[0.5px] border-border bg-bg-primary shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-reservation-title"
      >
        <div className="flex items-start justify-between gap-2 border-b border-border px-5 py-3">
          <span
            id="detail-reservation-title"
            className={`inline-flex max-w-full items-center rounded-xl px-2.5 py-1 text-[11px] font-medium ${viewBadgeTone}`}
          >
            {cat.label}
          </span>
          <button
            type="button"
            aria-label="閉じる"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-sm text-text-secondary hover:bg-bg-hover touch-manipulation active:scale-[0.97]"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {mode === "confirm-delete" ? (
          <div className="px-6 pb-6 pt-4">
            <p className="text-sm leading-relaxed text-text-primary">
              この予約をキャンセルしてもよいですか？（ステータスがキャンセルになります）
            </p>
            {error ? (
              <p className="mt-3 text-sm text-reservation-waitlist-text">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("view");
                  setError(null);
                }}
                className="inline-flex min-h-11 min-w-[4.5rem] items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-hover touch-manipulation active:scale-[0.97]"
              >
                戻る
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleCancelReservation}
                className="inline-flex min-h-11 min-w-[7rem] items-center justify-center rounded-lg border border-reservation-waitlist-border bg-reservation-waitlist-bg px-4 py-2.5 text-sm text-reservation-waitlist-text hover:opacity-90 disabled:opacity-50 touch-manipulation active:scale-[0.97]"
              >
                {isPending ? "処理中…" : "キャンセルする"}
              </button>
            </div>
          </div>
        ) : mode === "edit" ? (
          <form onSubmit={handleUpdate} className="px-6 pb-6 pt-4">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-text-tertiary">
                  顧客名
                </label>
                <input
                  required
                  value={customerName}
                  onChange={(ev) => setCustomerName(ev.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-tertiary">
                  電話
                </label>
                <input
                  value={customerPhone}
                  onChange={(ev) => setCustomerPhone(ev.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-tertiary">
                  人数
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  required
                  value={partySize}
                  onChange={(ev) => setPartySize(Number(ev.target.value))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="mb-1 block text-xs text-text-tertiary">
                    開始日
                  </span>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(ev) => setStartDate(ev.target.value)}
                    className="w-full rounded-lg border border-border px-2 py-2 text-sm"
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
                    className="w-full rounded-lg border border-border px-2 py-2 text-sm"
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
                    className="w-full rounded-lg border border-border px-2 py-2 text-sm"
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
                    className="w-full rounded-lg border border-border px-2 py-2 text-sm"
                  />
                </div>
              </div>
              <fieldset>
                <legend className="mb-1 text-xs text-text-tertiary">
                  カテゴリ
                </legend>
                <div className="flex flex-wrap gap-2">
                  {categoryChoices.map((c) => (
                    <label
                      key={c.value}
                      className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-xs has-[:checked]:border-accent"
                    >
                      <input
                        type="radio"
                        checked={categoryId === c.value}
                        onChange={() => setCategoryId(c.value)}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label className="mb-1 block text-xs text-text-tertiary">
                  備考
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(ev) => setNotes(ev.target.value)}
                  className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
            </div>
            {error ? (
              <p className="mt-3 text-sm text-reservation-waitlist-text">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setMode("view")}
                className="inline-flex min-h-11 min-w-[4.5rem] items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-hover touch-manipulation active:scale-[0.97]"
              >
                戻る
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex min-h-11 min-w-[5rem] items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm text-white hover:bg-[#3B7DE8] disabled:opacity-50 touch-manipulation active:scale-[0.97]"
              >
                {isPending ? "保存中…" : "保存"}
              </button>
            </div>
          </form>
        ) : (
          <div className="px-6 pb-6 pt-4">
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="w-20 shrink-0 text-text-tertiary">顧客名</span>
                <span className="text-text-primary">
                  {reservation.customer_name}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="w-20 shrink-0 text-text-tertiary">人数</span>
                <span className="text-text-primary">
                  {reservation.party_size}名
                </span>
              </div>
              <div className="flex gap-2">
                <span className="w-20 shrink-0 text-text-tertiary">日時</span>
                <span className="text-text-primary">
                  {formatJapaneseRange(startD, endD)}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="w-20 shrink-0 text-text-tertiary">カテゴリ</span>
                <span className="text-text-primary">{cat.label}</span>
              </div>
              {reservation.notes ? (
                <div className="flex gap-2">
                  <span className="w-20 shrink-0 text-text-tertiary">備考</span>
                  <span className="whitespace-pre-wrap text-text-primary">
                    {reservation.notes}
                  </span>
                </div>
              ) : null}
            </div>
            {error ? (
              <p className="mt-3 text-sm text-reservation-waitlist-text">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setMode("confirm-delete")}
                className="inline-flex min-h-11 min-w-[5.5rem] items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-hover touch-manipulation active:scale-[0.97]"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="inline-flex min-h-11 min-w-[4.5rem] items-center justify-center rounded-lg bg-bg-hover px-4 py-2.5 text-sm text-text-primary hover:opacity-90 touch-manipulation active:scale-[0.97]"
              >
                編集
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
