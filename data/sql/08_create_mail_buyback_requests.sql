-- 郵送買取申込テーブル
CREATE TABLE t_mail_buyback_requests (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER DEFAULT 1,
  request_number VARCHAR(20) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'pending',
  -- お客様情報
  customer_name VARCHAR(100) NOT NULL,
  customer_name_kana VARCHAR(100),
  postal_code VARCHAR(7),
  address TEXT,
  address_detail VARCHAR(200),
  phone VARCHAR(20),
  email VARCHAR(200),
  -- 端末情報（JSON配列）
  items JSONB NOT NULL,
  -- 合計見積金額
  total_estimated_price INTEGER NOT NULL,
  item_count INTEGER NOT NULL,
  -- メモ
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_mail_buyback_requests_tenant_id ON t_mail_buyback_requests(tenant_id);
CREATE INDEX idx_mail_buyback_requests_request_number ON t_mail_buyback_requests(request_number);
CREATE INDEX idx_mail_buyback_requests_status ON t_mail_buyback_requests(status);
CREATE INDEX idx_mail_buyback_requests_created_at ON t_mail_buyback_requests(created_at);
