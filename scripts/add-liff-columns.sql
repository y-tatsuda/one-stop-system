-- LIFF連携用カラムを追加
-- t_mail_buyback_requests テーブル

ALTER TABLE t_mail_buyback_requests
ADD COLUMN IF NOT EXISTS line_user_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS line_display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'web';

-- LINE UIDでの検索用インデックス
CREATE INDEX IF NOT EXISTS idx_mail_buyback_line_user
ON t_mail_buyback_requests(line_user_id);

-- コメント追加
COMMENT ON COLUMN t_mail_buyback_requests.line_user_id IS 'LINE ユーザーID（LIFF経由の場合）';
COMMENT ON COLUMN t_mail_buyback_requests.line_display_name IS 'LINE表示名';
COMMENT ON COLUMN t_mail_buyback_requests.source IS '申込み元: web / liff';
