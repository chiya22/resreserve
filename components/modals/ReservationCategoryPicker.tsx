type ReservationCategoryPickerProps = {
  options: { value: string; label: string }[];
  selectedIds: string[];
  onToggle: (categoryId: string) => void;
  emptyMessage?: string;
};

export function ReservationCategoryPicker({
  options,
  selectedIds,
  onToggle,
  emptyMessage = "選択できるカテゴリがありません",
}: ReservationCategoryPickerProps) {
  if (options.length === 0) {
    return <p className="text-xs text-reservation-waitlist-text">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((option) => {
        const checked = selectedIds.includes(option.value);
        return (
          <label
            key={option.value}
            className={`inline-flex min-h-10 cursor-pointer items-center rounded-md border px-3 py-2 text-xs transition-colors touch-manipulation active:scale-[0.97] ${
              checked
                ? "border-accent bg-bg-hover font-medium text-text-primary"
                : "border-border text-text-secondary hover:bg-bg-hover"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={() => onToggle(option.value)}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

function toggleCategoryId(selectedIds: string[], categoryId: string): string[] {
  if (selectedIds.includes(categoryId)) {
    if (selectedIds.length === 1) return selectedIds;
    return selectedIds.filter((id) => id !== categoryId);
  }
  return [...selectedIds, categoryId];
}

export { toggleCategoryId };
