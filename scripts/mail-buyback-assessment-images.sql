-- 郵送買取 本査定画像用カラム追加
-- 実行: Supabase SQL Editor で実行

-- 本査定の詳細情報（画像込み）
-- assessment_details: {
--   screen_scratches: { hasIssue: boolean, description: string, photos: string[] },
--   body_scratches: { hasIssue: boolean, description: string, photos: string[] },
--   camera_stain: { hasIssue: boolean, level: 'none'|'minor'|'major', photos: string[] },
--   other: { hasIssue: boolean, description: string, photos: string[] }
-- }
ALTER TABLE t_mail_buyback_requests
ADD COLUMN IF NOT EXISTS assessment_details JSONB;

COMMENT ON COLUMN t_mail_buyback_requests.assessment_details IS '本査定詳細（画像含む）: screen_scratches, body_scratches, camera_stain, other';

-- assessment_photos を assessment_details に統合するため削除（新規の場合）
-- 既存データがある場合は手動で移行が必要
