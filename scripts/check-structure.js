// テーブル構造確認用スクリプト
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(url, key)

async function check() {
  console.log('=== テーブル構造確認 ===\n')

  // 店舗
  const { data: shops } = await supabase.from('m_shops').select('id, name').eq('tenant_id', 1).eq('is_active', true)
  console.log('店舗:', JSON.stringify(shops, null, 2))

  // スタッフ
  const { data: staff } = await supabase.from('m_staff').select('id, name').eq('tenant_id', 1).eq('is_active', true)
  console.log('\nスタッフ:', JSON.stringify(staff, null, 2))

  // 仕入先
  const { data: suppliers } = await supabase.from('m_suppliers').select('id, code, name').eq('tenant_id', 1)
  console.log('\n仕入先:', JSON.stringify(suppliers, null, 2))

  // 来店経路
  const { data: sources } = await supabase.from('m_visit_sources').select('id, name').eq('tenant_id', 1)
  console.log('\n来店経路:', JSON.stringify(sources, null, 2))

  // 中古在庫サンプル
  const { data: inv } = await supabase.from('t_used_inventory').select('*').eq('tenant_id', 1).limit(1)
  console.log('\n中古在庫カラム:', inv && inv[0] ? Object.keys(inv[0]).join(', ') : 'なし')
  if (inv && inv[0]) {
    console.log('サンプルデータ:', JSON.stringify(inv[0], null, 2))
  }

  // 売上サンプル
  const { data: sales } = await supabase.from('t_sales').select('*').eq('tenant_id', 1).limit(1)
  console.log('\n売上カラム:', sales && sales[0] ? Object.keys(sales[0]).join(', ') : 'なし')
  if (sales && sales[0]) {
    console.log('サンプルデータ:', JSON.stringify(sales[0], null, 2))
  }

  // 売上明細サンプル
  const { data: details } = await supabase.from('t_sales_details').select('*').eq('tenant_id', 1).limit(1)
  console.log('\n売上明細カラム:', details && details[0] ? Object.keys(details[0]).join(', ') : 'なし')
  if (details && details[0]) {
    console.log('サンプルデータ:', JSON.stringify(details[0], null, 2))
  }
}

check().catch(console.error)
