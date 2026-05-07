import type {
  ReservationStatus,
  ReservationWithTable,
  Staff,
  StaffRole,
} from "@/types";

const STAFF_ROLE_JA: Record<StaffRole, string> = {
  owner: "オーナー",
  manager: "マネージャー",
  staff: "スタッフ",
};

/** オーナー向け予約通知メールに記載する操作者1行 */
export function formatReservationNotifyActorLine(actor: Staff | null): string {
  if (!actor) {
    return "【操作者】特定できませんでした（セッションまたはスタッフ情報の取得に失敗した可能性があります）。";
  }
  const name = actor.name.trim() || "（氏名未設定）";
  const login = actor.login_id?.trim() || "—";
  const role = STAFF_ROLE_JA[actor.role] ?? actor.role;
  return `【操作者】${name}／ログインID: ${login}／役割: ${role}`;
}

const STATUS_JA: Record<ReservationStatus, string> = {
  confirmed: "確定",
  pending: "仮予約",
  cancelled: "キャンセル",
  no_show: "来店なし",
  completed: "来店完了",
};

const fmt = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDt(iso: string): string {
  return fmt.format(new Date(iso));
}

function normPhone(p: string | null | undefined): string {
  return (p ?? "").trim();
}

function normNotes(n: string | null | undefined): string {
  return (n ?? "").trim() || "—";
}

/** 変更前後で値が異なる行番号（1〜11）。通知メールの目印に使用 */
export function getReservationNotifyChangedLineNumbers(
  before: ReservationWithTable,
  after: ReservationWithTable,
  options?: { statusBefore?: ReservationStatus; statusAfter?: ReservationStatus },
): Set<number> {
  const statusA = options?.statusBefore ?? before.status;
  const statusB = options?.statusAfter ?? after.status;
  const changed = new Set<number>();

  if (before.id !== after.id) changed.add(1);

  if (before.customer_name !== after.customer_name) changed.add(2);
  if (normPhone(before.customer_phone) !== normPhone(after.customer_phone)) {
    changed.add(3);
  }
  if (before.party_size !== after.party_size) changed.add(4);
  if (before.category_id !== after.category_id) changed.add(5);
  if (statusA !== statusB) changed.add(6);
  if (before.start_at !== after.start_at) changed.add(7);
  if (before.end_at !== after.end_at) changed.add(8);
  if ((before.table_id ?? null) !== (after.table_id ?? null)) changed.add(9);
  if (normNotes(before.notes) !== normNotes(after.notes)) changed.add(10);
  if (normNotes(before.internal_notes) !== normNotes(after.internal_notes)) {
    changed.add(11);
  }

  return changed;
}

type FormatOptions = {
  statusOverride?: ReservationStatus;
  /** 指定した行番号の先頭に lineMarker を付ける（更新通知の変更行の目印） */
  highlightLineNumbers?: ReadonlySet<number>;
  /** highlightLineNumbers 用。既定は「▶」 */
  lineMarker?: string;
};

function buildIndexedLines(
  row: ReservationWithTable,
  status: ReservationStatus,
  highlightLineNumbers: ReadonlySet<number> | undefined,
  lineMarker: string,
): string[] {
  const cat = row.reservation_categories?.label ?? "—";
  const tableName = row.table?.name ?? "—";
  const phone = normPhone(row.customer_phone);
  const phoneDisplay = phone || "—";
  const notes = normNotes(row.notes);
  const internal = normNotes(row.internal_notes);

  const raw: [number, string][] = [
    [1, `1. 予約ID: ${row.id}`],
    [2, `2. 顧客名: ${row.customer_name}`],
    [3, `3. 電話番号: ${phoneDisplay}`],
    [4, `4. 人数: ${row.party_size}`],
    [5, `5. カテゴリ: ${cat}`],
    [6, `6. ステータス: ${STATUS_JA[status] ?? row.status}`],
    [7, `7. 開始: ${formatDt(row.start_at)}`],
    [8, `8. 終了: ${formatDt(row.end_at)}`],
    [9, `9. テーブル: ${tableName}`],
    [10, `10. 備考: ${notes}`],
    [11, `11. スタッフ間メモ: ${internal}`],
  ];

  return raw.map(([num, text]) => {
    const mark =
      highlightLineNumbers?.has(num) === true ? `${lineMarker} ` : "";
    return `${mark}${text}`;
  });
}

/** 表示用に status を差し替え可能（キャンセル通知など） */
export function formatReservationIndexed(
  row: ReservationWithTable,
  options?: FormatOptions,
): string {
  const status = options?.statusOverride ?? row.status;
  const marker = options?.lineMarker ?? "▶";
  const lines = buildIndexedLines(
    row,
    status,
    options?.highlightLineNumbers,
    marker,
  );
  return lines.join("\n");
}
