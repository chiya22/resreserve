-- 公開空き状況（○△×）判定用カテゴリ（メイン・ロビー・デッキ）
-- 設定画面の reservation_categories と同じ。予約フォームで複数選択して紐付ける。
INSERT INTO reservation_categories (
  code,
  label,
  sort_order,
  show_in_booking_form,
  blocks_entire_calendar,
  palette_key
)
VALUES
  ('main', 'メイン', 60, TRUE, FALSE, '青'),
  ('lobby', 'ロビー', 70, TRUE, FALSE, '緑'),
  ('deck', 'デッキ', 80, TRUE, FALSE, 'アンバー')
ON CONFLICT (code) DO NOTHING;
