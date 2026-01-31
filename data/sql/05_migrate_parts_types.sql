-- ================================================
-- パーツ在庫データ初期化
--
-- パーツ並び順:
-- THパネル → HGパネル → バッテリー → HGバッテリー → コネクタ → リアカメラ → インカメラ → カメラ窓
--
-- パーツ共有:
-- - 8 と SE2: バッテリー、リアカメラ、インカメラ以外は同じ
-- - 12 と 12Pro: リアカメラ、インカメラ以外は同じ
-- ================================================

-- 既存の在庫データをクリア
DELETE FROM t_parts_inventory WHERE tenant_id = 1;

-- 色区別モデル - HGなし（SE, 6s, 7, 7P）
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, m.model, pt.parts_type, sup.id, 2, 0
FROM m_shops s
CROSS JOIN (
  SELECT 'SE' as model UNION ALL
  SELECT '6s' UNION ALL
  SELECT '7' UNION ALL
  SELECT '7P'
) m
CROSS JOIN (
  SELECT 'TH-黒' as parts_type, 1 as sort_order UNION ALL
  SELECT 'TH-白', 2 UNION ALL
  SELECT 'バッテリー', 3 UNION ALL
  SELECT 'コネクタ', 4 UNION ALL
  SELECT 'リアカメラ', 5 UNION ALL
  SELECT 'インカメラ', 6 UNION ALL
  SELECT 'カメラ窓', 7
) pt
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 色区別モデル - HGあり（8, 8P）
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, m.model, pt.parts_type, sup.id, 2, 0
FROM m_shops s
CROSS JOIN (
  SELECT '8' as model UNION ALL
  SELECT '8P'
) m
CROSS JOIN (
  SELECT 'TH-黒' as parts_type, 1 as sort_order UNION ALL
  SELECT 'TH-白', 2 UNION ALL
  SELECT 'HG-黒', 3 UNION ALL
  SELECT 'HG-白', 4 UNION ALL
  SELECT 'バッテリー', 5 UNION ALL
  SELECT 'HGバッテリー', 6 UNION ALL
  SELECT 'コネクタ', 7 UNION ALL
  SELECT 'リアカメラ', 8 UNION ALL
  SELECT 'インカメラ', 9 UNION ALL
  SELECT 'カメラ窓', 10
) pt
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 色区別なしモデル（SE2, SE3, X, XS, XR, 11, 12, 12Pro, 13, 14, 15, 16）
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, m.model, pt.parts_type, sup.id, 2, 0
FROM m_shops s
CROSS JOIN (
  SELECT 'SE2' as model UNION ALL
  SELECT 'SE3' UNION ALL
  SELECT 'X' UNION ALL
  SELECT 'XS' UNION ALL
  SELECT 'XR' UNION ALL
  SELECT '11' UNION ALL
  SELECT '12' UNION ALL
  SELECT '12Pro' UNION ALL
  SELECT '13' UNION ALL
  SELECT '14' UNION ALL
  SELECT '15' UNION ALL
  SELECT '16'
) m
CROSS JOIN (
  SELECT 'TH' as parts_type, 1 as sort_order UNION ALL
  SELECT 'HG', 2 UNION ALL
  SELECT 'バッテリー', 3 UNION ALL
  SELECT 'HGバッテリー', 4 UNION ALL
  SELECT 'コネクタ', 5 UNION ALL
  SELECT 'リアカメラ', 6 UNION ALL
  SELECT 'インカメラ', 7 UNION ALL
  SELECT 'カメラ窓', 8
) pt
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- SE初代のカメラ窓を削除（存在しない）
DELETE FROM t_parts_inventory WHERE model = 'SE' AND parts_type = 'カメラ窓';
