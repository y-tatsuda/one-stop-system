// DB詳細確認スクリプト
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://cfeuejuidjmywedmqgvv.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDBDetail() {
  console.log('========================================')
  console.log('データベース詳細確認')
  console.log('========================================\n')

  // 1. 修理価格のrepair_type一覧（売上登録で使う）
  console.log('【1. m_repair_prices_iphone - repair_type一覧】')
  console.log('（売上登録の修理メニューで使用）\n')
  const { data: repairTypes } = await supabase
    .from('m_repair_prices_iphone')
    .select('repair_type')
    .eq('tenant_id', 1)

  const uniqueRepairTypes = [...new Set(repairTypes?.map(r => r.repair_type))].sort()
  console.log('repair_type値:', uniqueRepairTypes.join(', '))
  console.log('')

  // 2. パーツ原価のparts_type一覧
  console.log('【2. m_costs_hw - parts_type一覧】')
  console.log('（パーツ原価で使用）\n')
  const { data: costTypes } = await supabase
    .from('m_costs_hw')
    .select('parts_type')
    .eq('tenant_id', 1)

  const uniqueCostTypes = [...new Set(costTypes?.map(c => c.parts_type))].sort()
  console.log('parts_type値:', uniqueCostTypes.join(', '))
  console.log('')

  // 3. パーツ在庫のparts_type一覧
  console.log('【3. t_parts_inventory - parts_type一覧】')
  console.log('（パーツ在庫管理で使用）\n')
  const { data: invTypes } = await supabase
    .from('t_parts_inventory')
    .select('parts_type')
    .eq('tenant_id', 1)

  const uniqueInvTypes = [...new Set(invTypes?.map(i => i.parts_type))].sort()
  console.log('parts_type値:', uniqueInvTypes.join(', '))
  console.log('')

  // 4. 色区別モデル（SE, 6s, 7, 7P, 8, 8P）の確認
  console.log('【4. 色区別モデルのデータ確認】')
  console.log('（SE, 6s, 7, 7P, 8, 8P は白/黒パネルが別々）\n')

  for (const model of ['SE', '6s', '7', '7P', '8', '8P']) {
    console.log(`--- ${model} ---`)

    // 修理価格
    const { data: prices } = await supabase
      .from('m_repair_prices_iphone')
      .select('repair_type, price')
      .eq('tenant_id', 1)
      .eq('model', model)
      .order('repair_type')

    console.log('修理価格:', prices?.map(p => p.repair_type).join(', ') || 'なし')

    // パーツ在庫
    const { data: inv } = await supabase
      .from('t_parts_inventory')
      .select('parts_type')
      .eq('tenant_id', 1)
      .eq('model', model)
      .eq('shop_id', 1)
      .eq('supplier_id', 1)
      .order('parts_type')

    console.log('パーツ在庫:', inv?.map(i => i.parts_type).join(', ') || 'なし')
    console.log('')
  }

  // 5. 色区別なしモデルの確認（SE2, 12, 12Pro）
  console.log('【5. 色区別なしモデルのデータ確認】')
  console.log('（SE2, 12, 12Pro など）\n')

  for (const model of ['SE2', '12', '12Pro']) {
    console.log(`--- ${model} ---`)

    // 修理価格
    const { data: prices } = await supabase
      .from('m_repair_prices_iphone')
      .select('repair_type, price')
      .eq('tenant_id', 1)
      .eq('model', model)
      .order('repair_type')

    console.log('修理価格:', prices?.map(p => p.repair_type).join(', ') || 'なし')

    // パーツ在庫
    const { data: inv } = await supabase
      .from('t_parts_inventory')
      .select('parts_type')
      .eq('tenant_id', 1)
      .eq('model', model)
      .eq('shop_id', 1)
      .eq('supplier_id', 1)
      .order('parts_type')

    console.log('パーツ在庫:', inv?.map(i => i.parts_type).join(', ') || 'なし')
    console.log('')
  }

  // 6. 機種マスタ全件
  console.log('【6. m_iphone_models - 機種マスタ全件】\n')
  const { data: models } = await supabase
    .from('m_iphone_models')
    .select('model, display_name, sort_order, is_active')
    .eq('tenant_id', 1)
    .order('sort_order')

  models?.forEach(m => {
    console.log(`${m.sort_order}. ${m.model} (${m.display_name}) ${m.is_active ? '' : '[無効]'}`)
  })
}

checkDBDetail().catch(console.error)
