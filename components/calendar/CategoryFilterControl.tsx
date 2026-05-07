"use client";

export type CalendarCategoryFilterOption = {
  id: string;
  label: string;
};

type CategoryFilterControlProps = {
  options: CalendarCategoryFilterOption[];
  selectedIds: string[];
  onToggle: (categoryId: string) => void;
  onClear: () => void;
  className?: string;
};

export function CategoryFilterControl({
  options,
  selectedIds,
  onToggle,
  onClear,
  className,
}: CategoryFilterControlProps) {
  const activeCount = selectedIds.length;
  const isAll = activeCount === 0;

  return (
    <div
      className={["flex flex-wrap items-center gap-1.5", className]
        .filter(Boolean)
        .join(" ")}
      aria-label="カテゴリ絞り込み"
    >
      <button
        type="button"
        onClick={onClear}
        className={
          isAll
            ? "inline-flex min-h-9 items-center rounded-md border-[0.5px] border-border bg-bg-hover px-3 text-xs text-text-primary touch-manipulation"
            : "inline-flex min-h-9 items-center rounded-md border-[0.5px] border-border bg-bg-primary px-3 text-xs text-text-secondary touch-manipulation hover:bg-bg-hover"
        }
      >
        すべて
      </button>
      {options.map((opt) => {
        const active = selectedIds.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            aria-pressed={active}
            className={
              active
                ? "inline-flex min-h-9 items-center rounded-md border-[0.5px] border-border bg-bg-hover px-3 text-xs text-text-primary touch-manipulation"
                : "inline-flex min-h-9 items-center rounded-md border-[0.5px] border-border bg-bg-primary px-3 text-xs text-text-secondary touch-manipulation hover:bg-bg-hover"
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
