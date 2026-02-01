-- ================================================
-- 店舗キオスクモード用パスコード追加
-- ================================================

-- m_shopsテーブルにキオスク用パスコードカラムを追加
ALTER TABLE m_shops ADD COLUMN IF NOT EXISTS kiosk_passcode VARCHAR(6);

-- 初期パスコードを設定（店舗ごとに変更してください）
-- UPDATE m_shops SET kiosk_passcode = '123456' WHERE tenant_id = 1;

-- コメント追加
COMMENT ON COLUMN m_shops.kiosk_passcode IS '店舗キオスクモード用パスコード（4-6桁）';
