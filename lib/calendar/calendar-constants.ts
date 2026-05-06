export const TABLE_OPTIONS = [
  "A-1",
  "A-2",
  "B-1",
  "B-2",
  "C-1",
  "C-2",
  "D-1",
  "D-2",
  "個室",
] as const;

export type TableOption = (typeof TABLE_OPTIONS)[number];

export const HOUR_START = 11;
export const HOUR_END = 22;

/** 30分刻みの時刻オプション（HH:MM） */
export function buildTimeOptions(): string[] {
  const out: string[] = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h < HOUR_END) {
      out.push(`${String(h).padStart(2, "0")}:30`);
    }
  }
  return out;
}
