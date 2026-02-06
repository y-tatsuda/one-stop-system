-- パーツ在庫の適正在庫更新スクリプト
-- 実行日: 2026-02-06

-- 1. コネクタ、リアカメラ、インカメラの適正在庫を0に設定
UPDATE t_parts_inventory
SET
  required_qty = 0,
  updated_at = NOW()
WHERE parts_type IN ('コネクタ', 'リアカメラ', 'インカメラ');

-- 2. カメラ窓のレコードを削除
DELETE FROM t_parts_inventory
WHERE parts_type = 'カメラ窓';

-- 確認用クエリ
-- SELECT parts_type, COUNT(*), SUM(required_qty) as total_required
-- FROM t_parts_inventory
-- GROUP BY parts_type
-- ORDER BY parts_type;
