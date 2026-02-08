-- 郵送買取 ステータス更新マイグレーション
-- 実行: Supabase SQL Editor で実行
--
-- ステータスの簡略化:
-- 旧: pending → kit_sent → arrived → assessing → assessed → approved/rejected → paid → completed/returned
-- 新: pending → kit_sent → assessed → waiting_payment/return_requested → returned (1ヶ月後削除)
--
-- 注意: 完了時は在庫登録後に削除されるため、completed ステータスは使用しない

-- 新しい進捗カラムを追加
ALTER TABLE t_mail_buyback_requests
ADD COLUMN IF NOT EXISTS waiting_payment_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMP WITH TIME ZONE;

-- コメント追加
COMMENT ON COLUMN t_mail_buyback_requests.waiting_payment_at IS '振込待ち（お客様承諾）日時';
COMMENT ON COLUMN t_mail_buyback_requests.return_requested_at IS '返送依頼日時';

-- 既存データのステータスをマイグレーション（オプション）
-- approved → waiting_payment
UPDATE t_mail_buyback_requests
SET status = 'waiting_payment',
    waiting_payment_at = approved_at
WHERE status = 'approved';

-- rejected → return_requested
UPDATE t_mail_buyback_requests
SET status = 'return_requested',
    return_requested_at = rejected_at
WHERE status = 'rejected';

-- 1ヶ月以上経過したreturned ステータスを削除（クリーンアップジョブ用）
-- 本番環境では cron または Supabase Edge Function で定期実行
-- DELETE FROM t_mail_buyback_requests
-- WHERE status = 'returned'
--   AND returned_at < NOW() - INTERVAL '1 month';
