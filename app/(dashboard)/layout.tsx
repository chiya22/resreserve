import type { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-full flex-col bg-bg-primary">{children}</div>
}
