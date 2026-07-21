-- 形式「弁当」とカテゴリ「弁当」（専用色: シアン）を追加

ALTER TYPE reservation_seating_style ADD VALUE IF NOT EXISTS 'bento';

DO $$
DECLARE
  con_rec RECORD;
BEGIN
  FOR con_rec IN
    SELECT pg_constraint.conname AS name
    FROM pg_constraint
    INNER JOIN pg_class ON pg_constraint.conrelid = pg_class.oid
    INNER JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_class.relname = 'reservation_categories'
      AND pg_namespace.nspname = 'public'
      AND pg_constraint.contype = 'c'
      AND pg_get_constraintdef(pg_constraint.oid) LIKE '%palette_key%'
  LOOP
    EXECUTE format(
      'ALTER TABLE reservation_categories DROP CONSTRAINT %I',
      con_rec.name
    );
  END LOOP;
END $$;

ALTER TABLE reservation_categories
  ADD CONSTRAINT reservation_categories_palette_key_check CHECK (
    palette_key IN ('青', '緑', 'アンバー', '赤', '紫', 'シアン')
  );

INSERT INTO reservation_categories (
  code,
  label,
  sort_order,
  show_in_booking_form,
  blocks_entire_calendar,
  palette_key
)
VALUES
  ('bento', '弁当', 90, TRUE, FALSE, 'シアン')
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  show_in_booking_form = EXCLUDED.show_in_booking_form,
  blocks_entire_calendar = EXCLUDED.blocks_entire_calendar,
  palette_key = EXCLUDED.palette_key;
