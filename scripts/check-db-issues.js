// DB問題点の詳細確認スクリプト
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://cfeuejuidjmywedmqgvv.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkIssues() {
  console.log('========================================')
  console.log('DB問題点の詳細確認')
  console.log('========================================\n')

  // 問題1: 12Proのパーツ在庫がない
  console.log('【問題1: 12Proのパーツ在庫】')
  const { data: inv12Pro } = await supabase
    .from('t_parts_inventory')
    .select('*')
    .eq('tenant_id', 1)
    .eq('model', '12Pro')
  console.log('12Proのパーツ在庫件数:', inv12Pro?.length || 0)

  // 比較: 12のパーツ在庫
  const { data: inv12 } = await supabase
    .from('t_parts_inventory')
    .select('parts_type, shop_id, supplier_id')
    .eq('tenant_id', 1)
    .eq('model', '12')
    .eq('shop_id', 1)
    .eq('supplier_id', 1)
  console.log('12のパーツ在庫（shop:1, supplier:1）:', inv12?.map(i => i.parts_type).join(', ') || 'なし')

  // 問題2: 8/8PのHGバッテリー
  console.log('\n【問題2: 8/8PのHGバッテリー】')

  // 8の修理価格
  const { data: price8 } = await supabase
    .from('m_repair_prices_iphone')
    .select('repair_type')
    .eq('tenant_id', 1)
    .eq('model', '8')
  console.log('8の修理価格:', price8?.map(p => p.repair_type).join(', ') || 'なし')

  // 8のパーツ在庫
  const { data: inv8 } = await supabase
    .from('t_parts_inventory')
    .select('parts_type')
    .eq('tenant_id', 1)
    .eq('model', '8')
    .eq('shop_id', 1)
    .eq('supplier_id', 1)
  console.log('8のパーツ在庫:', inv8?.map(i => i.parts_type).join(', ') || 'なし')

  // 問題3: SEのカメラ窓
  console.log('\n【問題3: SEのカメラ窓】')

  const { data: priceSE } = await supabase
    .from('m_repair_prices_iphone')
    .select('repair_type')
    .eq('tenant_id', 1)
    .eq('model', 'SE')
  console.log('SEの修理価格:', priceSE?.map(p => p.repair_type).join(', ') || 'なし')

  const { data: invSE } = await supabase
    .from('t_parts_inventory')
    .select('parts_type')
    .eq('tenant_id', 1)
    .eq('model', 'SE')
    .eq('shop_id', 1)
    .eq('supplier_id', 1)
  console.log('SEのパーツ在庫:', invSE?.map(i => i.parts_type).join(', ') || 'なし')

  // 全機種の修理価格とパーツ在庫の比較
  console.log('\n【全機種の整合性チェック】')

  const { data: models } = await supabase
    .from('m_iphone_models')
    .select('model')
    .eq('tenant_id', 1)
    .eq('is_active', true)
    .order('sort_order')

  for (const m of models || []) {
    const { data: prices } = await supabase
      .from('m_repair_prices_iphone')
      .select('repair_type')
      .eq('tenant_id', 1)
      .eq('model', m.model)

    const { data: inv } = await supabase
      .from('t_parts_inventory')
      .select('parts_type')
      .eq('tenant_id', 1)
      .eq('model', m.model)
      .eq('shop_id', 1)
      .eq('supplier_id', 1)

    const priceCount = prices?.length || 0
    const invCount = inv?.length || 0

    if (priceCount === 0 || invCount === 0) {
      console.log(`${m.model}: 修理価格=${priceCount}件, パーツ在庫=${invCount}件 ⚠️`)
    }
  }
}

checkIssues().catch(console.error)
