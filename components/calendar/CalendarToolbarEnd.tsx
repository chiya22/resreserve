'use client'

import Link from 'next/link'

import { logout } from '@/lib/auth/actions'

type CalendarToolbarEndProps = {
  staffName: string | null | undefined
  staffIsOwner?: boolean
}

export function CalendarToolbarEnd({
  staffName,
  staffIsOwner = false,
}: CalendarToolbarEndProps) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-l border-border pl-3">
      {staffName ? (
        <span className="max-w-[160px] truncate text-xs text-text-secondary">{staffName}</span>
      ) : null}
      {staffIsOwner ? (
        <>
          <Link
            href="/settings/categories"
            className="rounded-md border border-border px-2.5 py-1 text-[11px] text-text-secondary transition-colors hover:bg-bg-hover"
          >
            カテゴリ
          </Link>
          <Link
            href="/settings/staff"
            className="rounded-md border border-border px-2.5 py-1 text-[11px] text-text-secondary transition-colors hover:bg-bg-hover"
          >
            アカウント管理
          </Link>
        </>
      ) : null}
      <form action={logout}>
        <button
          type="submit"
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-hover"
        >
          ログアウト
        </button>
      </form>
    </div>
  )
}
