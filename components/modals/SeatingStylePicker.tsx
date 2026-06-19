import type { ReservationSeatingStyle } from "@/types";
import { SEATING_STYLE_OPTIONS } from "@/lib/reservation/seating-style";

type SeatingStylePickerProps = {
  value: ReservationSeatingStyle;
  onChange: (value: ReservationSeatingStyle) => void;
  name?: string;
};

export function SeatingStylePicker({
  value,
  onChange,
  name = "seating_style",
}: SeatingStylePickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="立食/着席">
      {SEATING_STYLE_OPTIONS.map((option) => (
        <label
          key={option.value}
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-xs has-[:checked]:border-accent has-[:checked]:bg-bg-hover touch-manipulation active:scale-[0.97]"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
