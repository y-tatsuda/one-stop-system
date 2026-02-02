require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrate() {
  console.log('Square連携用のテーブル・カラムを追加します...\n')

  // 1. m_shops に square_location_id カラムを追加
  console.log('1. m_shops に square_location_id を追加...')
  try {
    // カラムが存在するか確認
    const { data: shops } = await supabase
      .from('m_shops')
      .select('square_location_id')
      .limit(1)
    console.log('   → 既に存在します')
  } catch (error) {
    // カラムが存在しない場合はSQLで追加
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE m_shops ADD COLUMN IF NOT EXISTS square_location_id TEXT'
    })
    if (alterError) {
      console.log('   → 手動で追加が必要です: ALTER TABLE m_shops ADD COLUMN square_location_id TEXT')
    } else {
      console.log('   → 追加しました')
    }
  }

  // 2. m_system_settings テーブルを作成
  console.log('\n2. m_system_settings テーブルを確認...')
  const { error: settingsError } = await supabase
    .from('m_system_settings')
    .select('key')
    .limit(1)

  if (settingsError && settingsError.code === '42P01') {
    console.log('   → テーブルが存在しません。作成が必要です。')
    console.log(`
CREATE TABLE m_system_settings (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL DEFAULT 1,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);
    `)
  } else {
    console.log('   → 既に存在します')
  }

  // 3. m_square_catalog_mapping テーブルを作成
  console.log('\n3. m_square_catalog_mapping テーブルを確認...')
  const { error: mappingError } = await supabase
    .from('m_square_catalog_mapping')
    .select('id')
    .limit(1)

  if (mappingError && mappingError.code === '42P01') {
    console.log('   → テーブルが存在しません。作成が必要です。')
    console.log(`
CREATE TABLE m_square_catalog_mapping (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL DEFAULT 1,
  square_catalog_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_type, item_id)
);
CREATE INDEX idx_square_catalog_mapping_catalog_id ON m_square_catalog_mapping(square_catalog_id);
    `)
  } else {
    console.log('   → 既に存在します')
  }

  // 4. t_sales に Square関連カラムを追加
  console.log('\n4. t_sales に Square関連カラムを確認...')
  try {
    const { data: sales } = await supabase
      .from('t_sales')
      .select('square_payment_id')
      .limit(1)
    console.log('   → 既に存在します')
  } catch (error) {
    console.log('   → 手動で追加が必要です:')
    console.log(`
ALTER TABLE t_sales ADD COLUMN IF NOT EXISTS square_payment_id TEXT;
ALTER TABLE t_sales ADD COLUMN IF NOT EXISTS square_order_id TEXT;
ALTER TABLE t_sales ADD COLUMN IF NOT EXISTS square_fee_amount INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_t_sales_square_payment_id ON t_sales(square_payment_id);
    `)
  }

  console.log('\n=== 完了 ===')
  console.log('\n上記のSQLが表示された場合は、Supabase SQL Editorで手動実行してください。')
}

migrate()
