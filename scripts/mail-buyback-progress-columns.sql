-- 郵送買取 進捗管理用カラム追加
-- 実行: Supabase SQL Editor で実行

-- 進捗管理カラム
ALTER TABLE t_mail_buyback_requests
ADD COLUMN IF NOT EXISTS kit_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assessed_at TIMESTAMP WITH TIME ZONE;

-- 本査定結果
ALTER TABLE t_mail_buyback_requests
ADD COLUMN IF NOT EXISTS final_price INTEGER,
ADD COLUMN IF NOT EXISTS final_items JSONB,
ADD COLUMN IF NOT EXISTS price_changes JSONB,
ADD COLUMN IF NOT EXISTS assessment_photos TEXT[];

-- 承諾/返却
ALTER TABLE t_mail_buyback_requests
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 振込先情報
ALTER TABLE t_mail_buyback_requests
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS branch_name TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_holder TEXT;

-- 完了処理
ALTER TABLE t_mail_buyback_requests
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS inventory_id INTEGER,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP WITH TIME ZONE;

-- 担当者
ALTER TABLE t_mail_buyback_requests
ADD COLUMN IF NOT EXISTS staff_id INTEGER,
ADD COLUMN IF NOT EXISTS staff_notes TEXT;

-- ステータスのデフォルト値を確認（既存の場合はスキップ）
-- status: pending, kit_sent, arrived, assessing, assessed, approved, rejected, paid, completed, returned

COMMENT ON COLUMN t_mail_buyback_requests.kit_sent_at IS 'キット送付日時';
COMMENT ON COLUMN t_mail_buyback_requests.arrived_at IS '端末到着日時';
COMMENT ON COLUMN t_mail_buyback_requests.assessed_at IS '本査定完了日時';
COMMENT ON COLUMN t_mail_buyback_requests.final_price IS '本査定後の最終価格';
COMMENT ON COLUMN t_mail_buyback_requests.final_items IS '本査定後の端末情報';
COMMENT ON COLUMN t_mail_buyback_requests.price_changes IS '価格変更箇所と理由';
COMMENT ON COLUMN t_mail_buyback_requests.assessment_photos IS '査定写真URL配列';
COMMENT ON COLUMN t_mail_buyback_requests.approved_at IS '承諾日時';
COMMENT ON COLUMN t_mail_buyback_requests.rejected_at IS '返却希望日時';
COMMENT ON COLUMN t_mail_buyback_requests.rejection_reason IS '返却理由';
COMMENT ON COLUMN t_mail_buyback_requests.bank_name IS '銀行名';
COMMENT ON COLUMN t_mail_buyback_requests.branch_name IS '支店名';
COMMENT ON COLUMN t_mail_buyback_requests.account_type IS '口座種別';
COMMENT ON COLUMN t_mail_buyback_requests.account_number IS '口座番号';
COMMENT ON COLUMN t_mail_buyback_requests.account_holder IS '口座名義（カナ）';
COMMENT ON COLUMN t_mail_buyback_requests.paid_at IS '振込日時';
COMMENT ON COLUMN t_mail_buyback_requests.inventory_id IS '登録した在庫ID';
COMMENT ON COLUMN t_mail_buyback_requests.completed_at IS '完了日時';
COMMENT ON COLUMN t_mail_buyback_requests.returned_at IS '返送完了日時';
COMMENT ON COLUMN t_mail_buyback_requests.staff_id IS '担当スタッフID';
COMMENT ON COLUMN t_mail_buyback_requests.staff_notes IS 'スタッフメモ';
