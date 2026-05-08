'use client'

import Link from 'next/link'

import { logout } from '@/lib/auth/actions'

type CalendarToolbarEndProps = {
  staffName: string | null | undefined
  staffIsOwner?: boolean
  staffCanManageClosedDays?: boolean
}

export function CalendarToolbarEnd({
  staffName,
  staffIsOwner = false,
  staffCanManageClosedDays = false,
}: CalendarToolbarEndProps) {
  return (
    <div className="hidden shrink-0 items-center gap-3 border-l border-border pl-3 sm:flex">
      {staffName ? (
        <span className="max-w-[160px] truncate text-xs text-text-secondary">{staffName}</span>
      ) : null}
      {staffCanManageClosedDays ? (
        <Link
          href="/settings/closed-days"
          className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-md border border-border px-4 text-[11px] text-text-secondary transition-colors hover:bg-bg-hover touch-manipulation active:scale-[0.97]"
        >
          休業日
        </Link>
      ) : null}
      {staffIsOwner ? (
        <>
          <Link
            href="/settings/categories"
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-md border border-border px-4 text-[11px] text-text-secondary transition-colors hover:bg-bg-hover touch-manipulation active:scale-[0.97]"
          >
            カテゴリ
          </Link>
          <Link
            href="/settings/staff"
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-md border border-border px-4 text-[11px] text-text-secondary transition-colors hover:bg-bg-hover touch-manipulation active:scale-[0.97]"
          >
            アカウント管理
          </Link>
        </>
      ) : null}
      <form action={logout}>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg border border-border px-4 text-xs text-text-secondary transition-colors hover:bg-bg-hover touch-manipulation active:scale-[0.97]"
        >
          ログアウト
        </button>
      </form>
    </div>
  )
}
