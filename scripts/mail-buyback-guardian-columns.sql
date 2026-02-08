-- 郵送買取 未成年対応（保護者/後見人情報）カラム追加
-- 実行: Supabase SQL Editor で実行

-- 保護者/後見人情報カラムを追加
ALTER TABLE t_mail_buyback_requests
ADD COLUMN IF NOT EXISTS is_minor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS guardian_consent BOOLEAN,
ADD COLUMN IF NOT EXISTS guardian_name TEXT,
ADD COLUMN IF NOT EXISTS guardian_name_kana TEXT,
ADD COLUMN IF NOT EXISTS guardian_relationship TEXT,
ADD COLUMN IF NOT EXISTS guardian_phone TEXT;

-- コメント追加
COMMENT ON COLUMN t_mail_buyback_requests.is_minor IS '未成年かどうか';
COMMENT ON COLUMN t_mail_buyback_requests.guardian_consent IS '保護者/後見人の同意';
COMMENT ON COLUMN t_mail_buyback_requests.guardian_name IS '保護者/後見人の氏名';
COMMENT ON COLUMN t_mail_buyback_requests.guardian_name_kana IS '保護者/後見人のフリガナ';
COMMENT ON COLUMN t_mail_buyback_requests.guardian_relationship IS '続柄（father/mother/guardian）';
COMMENT ON COLUMN t_mail_buyback_requests.guardian_phone IS '保護者/後見人の電話番号';
