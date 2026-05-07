/**
 * 休業日を示す「休」ラベル（スマホのみ表示）。親に position: relative を付与すること。
 */
export function ClosedDayMobileBadge({ isToday }: { isToday: boolean }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute -right-0.5 -top-0.5 z-[1] inline-block text-[10px] font-medium leading-none text-reservation-waitlist-text sm:hidden ${isToday ? "rounded-[2px] ring-[0.5px] ring-accent" : ""}`}
    >
      休
    </span>
  );
}
