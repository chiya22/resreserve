/** 公開空き状況（○△×）の判定対象カテゴリ名（reservation_categories.label） */
export const PUBLIC_AVAILABILITY_CATEGORY_LABELS = {
  main: "メイン",
  lobby: "ロビー",
  deck: "デッキ",
} as const;

export type PublicAvailabilityCategoryKey =
  keyof typeof PUBLIC_AVAILABILITY_CATEGORY_LABELS;

export const PUBLIC_AVAILABILITY_CATEGORY_LABEL_SET: ReadonlySet<string> =
  new Set(Object.values(PUBLIC_AVAILABILITY_CATEGORY_LABELS));
