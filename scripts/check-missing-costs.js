// 欠けているパーツ原価を確認
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://cfeuejuidjmywedmqgvv.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  const PARTS_MENUS = ['TH-F', 'TH-L', 'HG-F', 'HG-L', 'バッテリー', 'HGバッテリー', 'コネクタ', 'リアカメラ', 'インカメラ', 'カメラ窓']

  // 修理価格を取得
  const { data: prices } = await supabase
    .from('m_repair_prices_iphone')
    .select('model, repair_type')
    .eq('tenant_id', 1)

  // 原価を取得
  const { data: costs } = await supabase
    .from('m_costs_hw')
    .select('model, parts_type, supplier_id')
    .eq('tenant_id', 1)

  // 修理価格からパーツ種別を導出
  function getPartsType(repairType) {
    if (repairType === 'TH-F' || repairType === 'TH-L') return 'TH'
    if (repairType === 'HG-F' || repairType === 'HG-L') return 'HG'
    return repairType
  }

  // 仕入先ごとにチェック
  for (const supplierId of [1, 2]) {
    const supplierName = supplierId === 1 ? 'HW' : 'アイサポ'
    console.log(`\n=== ${supplierName}で欠けているパーツ原価 ===`)

    const costSet = new Set(
      costs
        .filter(c => c.supplier_id === supplierId)
        .map(c => `${c.model}:${c.parts_type}`)
    )

    const missing = []
    for (const price of prices) {
      if (!PARTS_MENUS.includes(price.repair_type)) continue
      const partsType = getPartsType(price.repair_type)
      const key = `${price.model}:${partsType}`
      if (!costSet.has(key)) {
        missing.push({ model: price.model, partsType })
      }
    }

    // 重複排除
    const unique = [...new Set(missing.map(m => `${m.model}: ${m.partsType}`))]
    if (unique.length === 0) {
      console.log('なし')
    } else {
      unique.forEach(m => console.log(m))
    }
  }
}

check().catch(console.error)
