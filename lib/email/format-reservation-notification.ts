import type {
  ReservationStatus,
  ReservationWithTable,
  Staff,
  StaffRole,
} from "@/types";
import { reservationCategoryLabelsText } from "@/lib/calendar/reservation-category-labels";
import { formatSeatingStyleJa } from "@/lib/reservation/seating-style";

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
  timeZone: "Asia/Tokyo",
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

function normAmount(a: number | null | undefined): number | null {
  return a ?? null;
}

function formatAmountJa(a: number | null | undefined): string {
  if (a == null) return "—";
  return `${a.toLocaleString("ja-JP")}円（税込）`;
}

/** 変更前後で値が異なる行番号（1〜13）。通知メールの目印に使用 */
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
  if (before.seating_style !== after.seating_style) changed.add(5);
  if (
    reservationCategoryLabelsText(before) !==
    reservationCategoryLabelsText(after)
  ) {
    changed.add(6);
  }
  if (statusA !== statusB) changed.add(7);
  if (before.start_at !== after.start_at) changed.add(8);
  if (before.end_at !== after.end_at) changed.add(9);
  if ((before.table_id ?? null) !== (after.table_id ?? null)) changed.add(10);
  if (normAmount(before.amount) !== normAmount(after.amount)) changed.add(11);
  if (normNotes(before.notes) !== normNotes(after.notes)) changed.add(12);
  if (normNotes(before.internal_notes) !== normNotes(after.internal_notes)) {
    changed.add(13);
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
  const cat = reservationCategoryLabelsText(row);
  const tableName = row.table?.name ?? "—";
  const phone = normPhone(row.customer_phone);
  const phoneDisplay = phone || "—";
  const amountDisplay = formatAmountJa(row.amount);
  const notes = normNotes(row.notes);
  const internal = normNotes(row.internal_notes);

  const raw: [number, string][] = [
    [1, `1. 予約ID: ${row.id}`],
    [2, `2. 顧客名: ${row.customer_name}`],
    [3, `3. 電話番号: ${phoneDisplay}`],
    [4, `4. 人数: ${row.party_size}`],
    [5, `5. 立食/着席: ${formatSeatingStyleJa(row.seating_style)}`],
    [6, `6. カテゴリ: ${cat}`],
    [7, `7. ステータス: ${STATUS_JA[status] ?? row.status}`],
    [8, `8. 開始: ${formatDt(row.start_at)}`],
    [9, `9. 終了: ${formatDt(row.end_at)}`],
    [10, `10. テーブル: ${tableName}`],
    [11, `11. 予約金額: ${amountDisplay}`],
    [12, `12. 備考: ${notes}`],
    [13, `13. スタッフ間メモ: ${internal}`],
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
