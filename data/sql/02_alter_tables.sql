-- ================================================
-- テーブル構造の変更（supplier_id追加）
-- 実行タイミング: 最初に1回だけ
-- ================================================

-- パーツ原価テーブルにsupplier_id追加
ALTER TABLE m_costs_hw ADD COLUMN IF NOT EXISTS supplier_id BIGINT;

-- パーツ在庫テーブルにsupplier_id追加
ALTER TABLE t_parts_inventory ADD COLUMN IF NOT EXISTS supplier_id BIGINT;

-- 売上明細テーブルにsupplier_id追加
ALTER TABLE t_sales_details ADD COLUMN IF NOT EXISTS supplier_id BIGINT;

-- 既存データはHWとして設定
UPDATE m_costs_hw SET supplier_id = (SELECT id FROM m_suppliers WHERE code = 'hw' LIMIT 1) WHERE supplier_id IS NULL;
UPDATE t_parts_inventory SET supplier_id = (SELECT id FROM m_suppliers WHERE code = 'hw' LIMIT 1) WHERE supplier_id IS NULL;
