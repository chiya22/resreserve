"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createClosedDay,
  deleteClosedDay,
  updateClosedDay,
} from "@/lib/data/closed-day-actions";
import type { ClosedDay } from "@/types";

type ClosedDaysManagerProps = {
  initialRows: ClosedDay[];
};

export function ClosedDaysManager({ initialRows }: ClosedDaysManagerProps) {
  const router = useRouter();
  const [rows, setRows] = useState<ClosedDay[]>(initialRows);
  const [newDate, setNewDate] = useState("");
  const [newNote, setNewNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const visibleRows = rows.filter((row) => row.closed_on >= today);

  function handleCreate() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await createClosedDay({
        closed_on: newDate,
        note: newNote,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setRows((prev) =>
        [...prev, result.data].sort((a, b) => a.closed_on.localeCompare(b.closed_on)),
      );
      setNewDate("");
      setNewNote("");
      setMessage("休業日を追加しました");
      router.refresh();
    });
  }

  function patch(id: string, row: Partial<ClosedDay>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...row } : r)));
  }

  function handleUpdate(row: ClosedDay) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateClosedDay({
        id: row.id,
        closed_on: row.closed_on,
        note: row.note,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage("休業日を更新しました");
      router.refresh();
    });
  }

  function handleDelete(row: ClosedDay) {
    if (!window.confirm(`${row.closed_on} を削除しますか？`)) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await deleteClosedDay(row.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setMessage("休業日を削除しました");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[10px] border-[0.5px] border-border bg-bg-primary p-4">
        <h2 className="text-sm font-medium text-text-primary">新規休業日</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="min-h-11 rounded-lg border border-border px-3 text-sm outline-none focus:border-accent"
          />
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="備考（任意） 例: 年末年始休業"
            className="min-h-11 rounded-lg border border-border px-3 text-sm outline-none focus:border-accent"
            maxLength={200}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending || !newDate}
            className="min-h-11 rounded-lg bg-accent px-5 text-[13px] text-white transition-colors hover:bg-[#3B7DE8] disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </div>

      <div className="divide-y-[0.5px] divide-border rounded-[10px] border-[0.5px] border-border bg-bg-primary">
        {visibleRows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-text-secondary">
            休業日はまだ登録されていません。
          </div>
        ) : null}
        {visibleRows.map((row) => (
          <div
            key={row.id}
            className="grid gap-3 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)_auto]"
          >
            <input
              type="date"
              value={row.closed_on}
              onChange={(e) => patch(row.id, { closed_on: e.target.value })}
              className="min-h-11 rounded-lg border border-border px-3 text-sm outline-none focus:border-accent"
            />
            <input
              value={row.note ?? ""}
              onChange={(e) => patch(row.id, { note: e.target.value })}
              className="min-h-11 rounded-lg border border-border px-3 text-sm outline-none focus:border-accent"
              placeholder="備考（任意）"
              maxLength={200}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleUpdate(row)}
                disabled={isPending}
                className="min-h-11 rounded-md border border-border px-3 text-xs text-text-secondary hover:bg-bg-hover"
              >
                更新
              </button>
              <button
                type="button"
                onClick={() => handleDelete(row)}
                disabled={isPending}
                className="min-h-11 rounded-md border border-border px-3 text-xs text-text-secondary hover:bg-bg-hover"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-reservation-waitlist-text">{error}</p> : null}
      {message ? <p className="text-sm text-reservation-course-text">{message}</p> : null}
    </div>
  );
}
