-- 郵送買取 顧客情報追加カラム
-- 実行: Supabase SQL Editor で実行

-- 生年月日
ALTER TABLE t_mail_buyback_requests
ADD COLUMN IF NOT EXISTS birth_year VARCHAR(4),
ADD COLUMN IF NOT EXISTS birth_month VARCHAR(2),
ADD COLUMN IF NOT EXISTS birth_day VARCHAR(2);

-- 職業
ALTER TABLE t_mail_buyback_requests
ADD COLUMN IF NOT EXISTS occupation VARCHAR(50);

COMMENT ON COLUMN t_mail_buyback_requests.birth_year IS '生年（西暦4桁）';
COMMENT ON COLUMN t_mail_buyback_requests.birth_month IS '生月（1-12）';
COMMENT ON COLUMN t_mail_buyback_requests.birth_day IS '生日（1-31）';
COMMENT ON COLUMN t_mail_buyback_requests.occupation IS '職業';
