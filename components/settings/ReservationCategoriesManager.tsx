"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  RESERVATION_PALETTE_KEYS,
  type ReservationPaletteKey,
} from "@/lib/calendar/types";
import {
  createReservationCategory,
  deleteReservationCategory,
  saveReservationCategoriesBulk,
} from "@/lib/data/reservation-category-actions";
import { CATEGORY_CODE_REGEX } from "@/lib/data/reservation-category-shared";
import { sortReservationCategories } from "@/lib/calendar/category-display";
import type { ReservationCategoryRow } from "@/types";

type ReservationCategoriesManagerProps = {
  initialRows: ReservationCategoryRow[];
};

/** 選択肢の value と表示はいずれも色名のみ（DB の palette_key と一致） */
const PALETTE_OPTIONS = RESERVATION_PALETTE_KEYS;

export function ReservationCategoriesManager({
  initialRows,
}: ReservationCategoriesManagerProps) {
  const [rows, setRows] = useState<ReservationCategoryRow[]>(() => [
    ...initialRows,
  ]);
  const router = useRouter();

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCreatePending, startCreateTransition] = useTransition();

  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newPalette, setNewPalette] =
    useState<ReservationPaletteKey>("青");
  const [newSort, setNewSort] = useState(100);
  const [newShowBooking, setNewShowBooking] = useState(true);
  const [newExclusive, setNewExclusive] = useState(false);

  function patch<K extends keyof ReservationCategoryRow>(
    id: string,
    field: K,
    value: ReservationCategoryRow[K],
  ) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  }

  function handleSaveAll() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const payload = rows.map((r) => ({
        id: r.id,
        label: r.label,
        sort_order: r.sort_order,
        show_in_booking_form: r.show_in_booking_form,
        blocks_entire_calendar: r.blocks_entire_calendar,
        palette_key: r.palette_key,
      }));
      const result = await saveReservationCategoriesBulk(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage("一覧を保存しました");
      router.refresh();
    });
  }

  function handleDelete(id: string, label: string) {
    const okConfirm = window.confirm(
      `「${label}」を削除しますか？（予約で使われている場合は削除できません）`,
    );
    if (!okConfirm) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await deleteReservationCategory(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      setMessage("削除しました");
      router.refresh();
    });
  }

  function handleCreate() {
    setCreateError(null);
    setMessage(null);

    const code = newCode.trim();
    if (!CATEGORY_CODE_REGEX.test(code)) {
      setCreateError(
        "コードは英小文字ではじめ、a-z・数字・アンダースコアのみ（40文字以内）です",
      );
      return;
    }

    const label = newLabel.trim();
    if (!label.length) {
      setCreateError("表示名を入力してください");
      return;
    }

    startCreateTransition(async () => {
      const result = await createReservationCategory({
        code,
        label,
        palette_key: newPalette,
        sort_order: newSort,
        show_in_booking_form: newShowBooking,
        blocks_entire_calendar: newExclusive,
      });

      if (!result.success) {
        setCreateError(result.error);
        return;
      }

      setRows((prev) => {
        const without = prev.filter((r) => r.id !== result.data.id);
        return sortReservationCategories([...without, result.data]);
      });

      setNewCode("");
      setNewLabel("");
      setNewPalette("青");
      setNewSort(100);
      setNewShowBooking(true);
      setNewExclusive(false);

      setMessage("追加しました");

      router.refresh();
    });
  }

  return (
    <div className="space-y-10">
      <div className="rounded-[10px] border-[0.5px] border-border bg-bg-primary p-4">
        <h2 className="text-sm font-medium text-text-primary">
          新規カテゴリ
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          コードは新規追加時のみ指定します（一覧では変更しません）。予約は{" "}
          <code className="text-[11px]">category_id</code>{" "}
          でひも付くため、コードを変えても既存予約は維持されます。使用中のカテゴリは削除できません。
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs text-text-tertiary">
            コード（英小文字+_）
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="welcome_party"
              className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
              maxLength={40}
            />
          </label>
          <label className="block text-xs text-text-tertiary">
            表示名
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
              maxLength={40}
            />
          </label>
          <label className="block text-xs text-text-tertiary">
            色テーマ
            <select
              value={newPalette}
              onChange={(e) =>
                setNewPalette(e.target.value as ReservationPaletteKey)
              }
              className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
            >
              {PALETTE_OPTIONS.map((p) => (
                <option key={`new-category-palette:${p}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-text-tertiary">
            並び順
            <input
              type="number"
              min={0}
              max={32767}
              value={newSort}
              onChange={(e) => setNewSort(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
            />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={newShowBooking}
            onChange={(e) => setNewShowBooking(e.target.checked)}
          />
          新規予約フォームで選べる
        </label>
        <label className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={newExclusive}
            onChange={(e) => setNewExclusive(e.target.checked)}
          />
          時間帯貸し切り（ほか予約との重複不可）
        </label>

        {createError ? (
          <p className="mt-3 text-sm text-reservation-waitlist-text">{createError}</p>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={isCreatePending}
            onClick={handleCreate}
            className="rounded-lg bg-accent px-4 py-2 text-[13px] text-white hover:bg-[#3B7DE8] disabled:opacity-50"
          >
            {isCreatePending ? "作成中…" : "追加"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-text-primary">一覧</h2>
        <div className="mt-3 divide-y-[0.5px] divide-border rounded-[10px] border-[0.5px] border-border bg-bg-primary">
          <div className="hidden gap-3 px-3 py-2 text-[11px] text-text-tertiary xl:grid xl:grid-cols-[88px_minmax(0,1fr)_120px_minmax(0,104px)_80px_auto_auto_auto]">
            <span>コード</span>
            <span>表示名</span>
            <span>テーマ色</span>
            <span>並び順</span>
            <span>予約</span>
            <span>貸切</span>
            <span className="text-right">操作</span>
          </div>

          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-2 px-3 py-4 xl:grid xl:grid-cols-[88px_minmax(0,1fr)_120px_minmax(0,104px)_80px_auto_auto_auto] xl:items-center"
            >
              <code className="break-all text-[11px] text-text-secondary">
                {row.code}
              </code>
              <input
                aria-label={`${row.code} の表示名`}
                value={row.label}
                onChange={(e) =>
                  patch(row.id, "label", e.target.value)
                }
                className="w-full rounded-lg border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
                maxLength={40}
              />
              <select
                aria-label={`${row.code} のテーマ`}
                value={row.palette_key}
                onChange={(e) =>
                  patch(row.id, "palette_key", e.target.value)
                }
                className="w-full rounded-lg border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
              >
                {PALETTE_OPTIONS.map((p) => (
                  <option
                    key={`${row.id}:${row.code}:palette:${p}`}
                    value={p}
                  >
                    {p}
                  </option>
                ))}
              </select>
              <input
                aria-label={`${row.code} の並び`}
                type="number"
                min={0}
                max={32767}
                value={row.sort_order}
                onChange={(e) =>
                  patch(row.id, "sort_order", Number(e.target.value))
                }
                className="w-full rounded-lg border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
              />
              <label className="flex items-center gap-1 text-xs text-text-secondary">
                <span className="xl:hidden">新規フォーム</span>
                <input
                  type="checkbox"
                  checked={row.show_in_booking_form}
                  onChange={(e) =>
                    patch(
                      row.id,
                      "show_in_booking_form",
                      e.target.checked,
                    )
                  }
                />
              </label>
              <label className="flex items-center gap-1 text-xs text-text-secondary">
                <span className="xl:hidden">貸し切り帯</span>
                <input
                  type="checkbox"
                  checked={row.blocks_entire_calendar}
                  onChange={(e) =>
                    patch(
                      row.id,
                      "blocks_entire_calendar",
                      e.target.checked,
                    )
                  }
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(row.id, row.label)}
                  disabled={isPending}
                  className="rounded-md border border-border px-2 py-1 text-[11px] text-text-secondary hover:bg-bg-hover disabled:opacity-50"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>

        {error ? (
          <p className="mt-3 text-sm text-reservation-waitlist-text">{error}</p>
        ) : null}
        {message ? (
          <p className="mt-3 text-sm text-reservation-course-text">{message}</p>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={isPending}
            onClick={handleSaveAll}
            className="rounded-lg bg-accent px-5 py-2 text-[13px] text-white transition-colors hover:bg-[#3B7DE8] disabled:opacity-50"
          >
            {isPending ? "保存中…" : "一覧を保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
