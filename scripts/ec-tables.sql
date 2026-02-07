-- =====================================================
-- ECサイト用テーブル定義
-- =====================================================
-- 実行方法: SupabaseダッシュボードのSQL Editorで実行

-- EC注文テーブル
CREATE TABLE IF NOT EXISTS ec_orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  shipping_postal_code VARCHAR(10),
  shipping_prefecture VARCHAR(20),
  shipping_city VARCHAR(100),
  shipping_address TEXT,
  shipping_building VARCHAR(200),
  total_amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT '決済待ち',
  items JSONB,
  square_payment_id VARCHAR(255),
  square_order_id VARCHAR(255),
  tracking_number VARCHAR(100),
  shipped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EC注文テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_ec_orders_order_id ON ec_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_ec_orders_customer_email ON ec_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_ec_orders_status ON ec_orders(status);
CREATE INDEX IF NOT EXISTS idx_ec_orders_created_at ON ec_orders(created_at);

-- お問い合わせテーブル
CREATE TABLE IF NOT EXISTS shop_inquiries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  imei VARCHAR(20),
  inquiry_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT '未対応',
  staff_notes TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- お問い合わせテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_shop_inquiries_status ON shop_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_shop_inquiries_created_at ON shop_inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_shop_inquiries_imei ON shop_inquiries(imei);

-- used_inventoryにEC用カラムを追加（既存テーブルの場合）
-- ALTER TABLE used_inventory ADD COLUMN IF NOT EXISTS ec_status VARCHAR(20) DEFAULT '非公開';

-- RLS (Row Level Security) ポリシー
-- EC注文は認証不要で作成可能、閲覧は管理者のみ
ALTER TABLE ec_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders" ON ec_orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can view orders" ON ec_orders
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can update orders" ON ec_orders
  FOR UPDATE TO authenticated
  USING (true);

-- お問い合わせは認証不要で作成可能、閲覧は管理者のみ
ALTER TABLE shop_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create inquiries" ON shop_inquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can view inquiries" ON shop_inquiries
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can update inquiries" ON shop_inquiries
  FOR UPDATE TO authenticated
  USING (true);

-- 更新時刻を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ec_orders_updated_at
  BEFORE UPDATE ON ec_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_inquiries_updated_at
  BEFORE UPDATE ON shop_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ブログ記事テーブル
CREATE TABLE IF NOT EXISTS t_blog_posts (
  id SERIAL PRIMARY KEY,
  tenant_id BIGINT DEFAULT 1,
  slug VARCHAR(200) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  excerpt TEXT,
  content TEXT,
  category VARCHAR(100),
  thumbnail_url TEXT,
  status VARCHAR(20) DEFAULT 'draft', -- draft, published
  published_at TIMESTAMP WITH TIME ZONE,
  author_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ブログテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_blog_posts_tenant ON t_blog_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON t_blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON t_blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON t_blog_posts(published_at);

-- ブログRLSポリシー
ALTER TABLE t_blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published posts" ON t_blog_posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Authenticated users can manage posts" ON t_blog_posts
  FOR ALL TO authenticated
  USING (true);

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON t_blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
