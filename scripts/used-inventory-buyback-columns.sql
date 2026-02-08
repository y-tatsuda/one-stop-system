-- 中古在庫テーブルに郵送買取関連カラムを追加
-- 実行: Supabase SQL Editor で実行

-- 古物商に必要な顧客情報を在庫に紐づける
ALTER TABLE t_used_inventory
ADD COLUMN IF NOT EXISTS buyback_customer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS buyback_customer_kana VARCHAR(100),
ADD COLUMN IF NOT EXISTS buyback_address TEXT,
ADD COLUMN IF NOT EXISTS buyback_birth_date DATE,
ADD COLUMN IF NOT EXISTS buyback_date DATE,
ADD COLUMN IF NOT EXISTS agreement_document_path TEXT,
ADD COLUMN IF NOT EXISTS mail_buyback_request_number VARCHAR(20);

-- コメント追加
COMMENT ON COLUMN t_used_inventory.buyback_customer_name IS '買取顧客名（古物商法対応）';
COMMENT ON COLUMN t_used_inventory.buyback_customer_kana IS '買取顧客名カナ';
COMMENT ON COLUMN t_used_inventory.buyback_address IS '買取時の顧客住所';
COMMENT ON COLUMN t_used_inventory.buyback_birth_date IS '買取顧客の生年月日';
COMMENT ON COLUMN t_used_inventory.buyback_date IS '買取日';
COMMENT ON COLUMN t_used_inventory.agreement_document_path IS '買取同意書の保存パス';
COMMENT ON COLUMN t_used_inventory.mail_buyback_request_number IS '郵送買取申込番号（MB-XXXX形式）';
