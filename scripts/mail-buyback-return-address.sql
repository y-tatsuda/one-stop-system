-- 郵送買取 返送先住所カラム追加
-- 実行: Supabase SQL Editor で実行

-- 返送先住所カラムを追加（キットと異なる場合に使用）
ALTER TABLE t_mail_buyback_requests
ADD COLUMN IF NOT EXISTS return_postal_code TEXT,
ADD COLUMN IF NOT EXISTS return_address TEXT,
ADD COLUMN IF NOT EXISTS return_address_detail TEXT,
ADD COLUMN IF NOT EXISTS return_phone TEXT;

-- コメント追加
COMMENT ON COLUMN t_mail_buyback_requests.return_postal_code IS '返送先郵便番号（キットと異なる場合）';
COMMENT ON COLUMN t_mail_buyback_requests.return_address IS '返送先住所（キットと異なる場合）';
COMMENT ON COLUMN t_mail_buyback_requests.return_address_detail IS '返送先建物名等（キットと異なる場合）';
COMMENT ON COLUMN t_mail_buyback_requests.return_phone IS '返送先電話番号（キットと異なる場合）';
