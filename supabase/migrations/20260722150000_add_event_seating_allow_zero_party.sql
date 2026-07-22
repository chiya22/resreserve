-- 形式「イベント」追加・人数0許可、誤って追加したカテゴリ「イベント」を削除

ALTER TYPE reservation_seating_style ADD VALUE IF NOT EXISTS 'event';

DO $$
DECLARE
  con_rec RECORD;
BEGIN
  FOR con_rec IN
    SELECT pg_constraint.conname AS name
    FROM pg_constraint
    INNER JOIN pg_class ON pg_constraint.conrelid = pg_class.oid
    INNER JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_class.relname = 'reservations'
      AND pg_namespace.nspname = 'public'
      AND pg_constraint.contype = 'c'
      AND pg_get_constraintdef(pg_constraint.oid) LIKE '%party_size%'
  LOOP
    EXECUTE format(
      'ALTER TABLE reservations DROP CONSTRAINT %I',
      con_rec.name
    );
  END LOOP;
END $$;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_party_size_check CHECK (party_size >= 0);

-- カテゴリ「イベント」を削除（あれば）。主カテゴリ参照をフォールバックへ付け替え。
DO $$
DECLARE
  event_id UUID;
  fallback_id UUID;
BEGIN
  SELECT id INTO event_id FROM reservation_categories WHERE code = 'event';
  IF event_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO fallback_id
  FROM reservation_categories
  WHERE code <> 'event'
  ORDER BY sort_order, code
  LIMIT 1;

  IF fallback_id IS NULL THEN
    RAISE EXCEPTION 'イベントカテゴリ削除に必要なフォールバックカテゴリがありません';
  END IF;

  UPDATE reservations
  SET category_id = fallback_id
  WHERE category_id = event_id;

  DELETE FROM reservation_category_assignments
  WHERE category_id = event_id;

  DELETE FROM reservation_categories
  WHERE id = event_id;
END $$;
