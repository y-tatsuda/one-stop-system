// DB確認スクリプト
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://cfeuejuidjmywedmqgvv.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDB() {
  console.log('=== テーブル確認 ===\n')

  // 1. m_costs_hw - パーツ原価
  console.log('【m_costs_hw - パーツ原価】')
  const { data: costs, error: costsError } = await supabase
    .from('m_costs_hw')
    .select('model, parts_type, cost, supplier_id')
    .eq('tenant_id', 1)
    .order('model')
    .order('parts_type')
    .limit(20)

  if (costsError) {
    console.log('エラー:', costsError.message)
  } else {
    console.log('件数:', costs?.length || 0)
    if (costs && costs.length > 0) {
      console.log('サンプル:')
      costs.slice(0, 10).forEach(c => {
        console.log(`  ${c.model} / ${c.parts_type} / ¥${c.cost}`)
      })
    }
  }

  // 2. m_repair_prices_iphone - 修理価格
  console.log('\n【m_repair_prices_iphone - 修理価格】')
  const { data: prices, error: pricesError } = await supabase
    .from('m_repair_prices_iphone')
    .select('model, repair_type, price')
    .eq('tenant_id', 1)
    .order('model')
    .order('repair_type')
    .limit(20)

  if (pricesError) {
    console.log('エラー:', pricesError.message)
  } else {
    console.log('件数:', prices?.length || 0)
    if (prices && prices.length > 0) {
      console.log('サンプル:')
      prices.slice(0, 10).forEach(p => {
        console.log(`  ${p.model} / ${p.repair_type} / ¥${p.price}`)
      })
    }
  }

  // 3. t_parts_inventory - パーツ在庫
  console.log('\n【t_parts_inventory - パーツ在庫】')
  const { data: inventory, error: invError } = await supabase
    .from('t_parts_inventory')
    .select('model, parts_type, shop_id, supplier_id')
    .eq('tenant_id', 1)
    .order('model')
    .order('parts_type')
    .limit(20)

  if (invError) {
    console.log('エラー:', invError.message)
  } else {
    console.log('件数:', inventory?.length || 0)
    if (inventory && inventory.length > 0) {
      console.log('サンプル:')
      inventory.slice(0, 10).forEach(i => {
        console.log(`  ${i.model} / ${i.parts_type} / shop:${i.shop_id}`)
      })
    }
  }

  // 4. m_suppliers - 仕入先
  console.log('\n【m_suppliers - 仕入先】')
  const { data: suppliers, error: supError } = await supabase
    .from('m_suppliers')
    .select('id, code, name')
    .eq('tenant_id', 1)

  if (supError) {
    console.log('エラー:', supError.message)
  } else {
    console.log('仕入先一覧:')
    suppliers?.forEach(s => {
      console.log(`  id:${s.id} / ${s.code} / ${s.name}`)
    })
  }

  // 5. m_iphone_models - 機種マスタ
  console.log('\n【m_iphone_models - 機種マスタ】')
  const { data: models, error: modelsError } = await supabase
    .from('m_iphone_models')
    .select('model, display_name, sort_order')
    .eq('tenant_id', 1)
    .eq('is_active', true)
    .order('sort_order')
    .limit(20)

  if (modelsError) {
    console.log('エラー:', modelsError.message)
  } else {
    console.log('機種一覧:')
    models?.forEach(m => {
      console.log(`  ${m.model} / ${m.display_name} / sort:${m.sort_order}`)
    })
  }

  // 全件数取得
  console.log('\n=== 全件数 ===')
  const { count: costsCount } = await supabase.from('m_costs_hw').select('*', { count: 'exact', head: true }).eq('tenant_id', 1)
  const { count: pricesCount } = await supabase.from('m_repair_prices_iphone').select('*', { count: 'exact', head: true }).eq('tenant_id', 1)
  const { count: invCount } = await supabase.from('t_parts_inventory').select('*', { count: 'exact', head: true }).eq('tenant_id', 1)

  console.log('m_costs_hw:', costsCount, '件')
  console.log('m_repair_prices_iphone:', pricesCount, '件')
  console.log('t_parts_inventory:', invCount, '件')
}

checkDB().catch(console.error)
