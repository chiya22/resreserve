import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PublicAvailabilityMonthView } from "@/components/public/PublicAvailabilityMonthView";
import {
  getPublicMonthlyAvailability,
  resolvePublicAvailabilityYearMonth,
} from "@/lib/data/public-availability";
import { isYearMonthQueryAbsent } from "@/lib/public/availability-status";
import { ymdToStartOfDay } from "@/lib/calendar/week";

export const metadata: Metadata = {
  title: "予約状況 | 空き状況",
  description: "月別の予約状況（予約可・要確認・予約不可）を公開表示します。",
};

export default async function PublicAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const sp = await searchParams;

  if (isYearMonthQueryAbsent(sp.year, sp.month)) {
    const current = resolvePublicAvailabilityYearMonth(undefined, undefined);
    if (current) {
      redirect(
        `/availability?year=${current.year}&month=${current.month}`,
      );
    }
  }

  const parsed = resolvePublicAvailabilityYearMonth(sp.year, sp.month);
  const now = new Date();

  if (!parsed) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-reservation-waitlist-text">
          年月の指定が不正です。URL の year と month（1〜12）を確認してください。
        </p>
      </main>
    );
  }

  const availability = await getPublicMonthlyAvailability(
    parsed.year,
    parsed.month,
  );

  if (!availability) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-reservation-waitlist-text">
          空き状況を取得できませんでした。しばらくしてから再度お試しください。
        </p>
      </main>
    );
  }

  const monthAnchor = ymdToStartOfDay(
    `${parsed.year}-${String(parsed.month).padStart(2, "0")}-01`,
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-center text-[17px] font-medium text-text-primary">
          神田無垢食堂　予約状況
        </h1>
      </div>
      <PublicAvailabilityMonthView
        monthAnchor={monthAnchor}
        availability={availability}
        now={now}
      />
    </main>
  );
}
