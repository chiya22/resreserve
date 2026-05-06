import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ReservationCategoriesManager } from "@/components/settings/ReservationCategoriesManager";
import { getCurrentStaff } from "@/lib/data/auth";
import { listReservationCategories } from "@/lib/data/reservation-categories";

export const metadata: Metadata = {
  title: "予約カテゴリ | 予約管理",
  description:
    "予約カテゴリの作成・並び順・表示色テーマなどを管理します（オーナーのみ）",
};

export default async function SettingsCategoriesPage() {
  const me = await getCurrentStaff();
  if (!me) redirect("/login?message=staff_required");
  if (me.role !== "owner") redirect("/calendar");

  const categories = await listReservationCategories();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[17px] font-medium text-text-primary">
          予約カテゴリ
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/settings/staff"
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-hover"
          >
            アカウント管理
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-hover"
          >
            カレンダーへ
          </Link>
        </div>
      </div>
      <ReservationCategoriesManager initialRows={categories} />
    </div>
  );
}
