-- 売上テーブルに値引き金額カラムを追加
ALTER TABLE t_sales ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;

-- コメント追加
COMMENT ON COLUMN t_sales.discount_amount IS '値引き金額（税抜）';
