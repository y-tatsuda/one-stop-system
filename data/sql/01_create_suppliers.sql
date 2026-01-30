-- ================================================
-- 仕入先マスタの作成と初期データ投入
-- 実行タイミング: 最初に1回だけ
-- ================================================

-- テーブル作成（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS m_suppliers (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL DEFAULT 1,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 既存データを削除して再投入
DELETE FROM m_suppliers WHERE tenant_id = 1;

INSERT INTO m_suppliers (tenant_id, code, name, sort_order, is_active) VALUES
(1, 'hw', 'HW', 1, true),
(1, 'aisapo', 'アイサポ', 2, true);
