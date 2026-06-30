import type { ReactNode } from "react";

export default function AvailabilityLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="min-h-screen bg-[#faf6ec]">{children}</div>;
}
