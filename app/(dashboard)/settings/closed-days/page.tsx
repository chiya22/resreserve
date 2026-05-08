import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ClosedDaysManager } from "@/components/settings/ClosedDaysManager";
import { getCurrentStaff } from "@/lib/data/auth";
import { listClosedDaysAll } from "@/lib/data/closed-days";

export const metadata: Metadata = {
  title: "休業日設定 | 予約管理",
  description: "休業日を登録・更新・削除します（オーナー・マネージャー）",
};

export default async function SettingsClosedDaysPage() {
  const me = await getCurrentStaff();
  if (!me) redirect("/login?message=staff_required");
  if (me.role !== "owner" && me.role !== "manager") redirect("/calendar");

  const closedDays = await listClosedDaysAll();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[17px] font-medium text-text-primary">休業日設定</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/settings/categories"
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-hover"
          >
            予約カテゴリ
          </Link>
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
      <ClosedDaysManager initialRows={closedDays} />
    </div>
  );
}
