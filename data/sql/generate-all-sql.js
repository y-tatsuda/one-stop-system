// ================================================
// 全データSQL生成スクリプト
//
// 元データファイル:
// - repair-prices-iphone.js: 修理価格
// - costs-hw.js: HW原価
// - costs-aisapo.js: アイサポ原価
//
// 0円 = 非対応メニュー（DBに登録しない）
// ================================================

const fs = require('fs')
const path = require('path')

const REPAIR_PRICES = require('../repair-prices-iphone.js')
const COSTS_HW = require('../costs-hw.js')
const COSTS_AISAPO = require('../costs-aisapo.js')

// 色区別モデル（パネルに白/黒の区別がある）
const MODELS_WITH_COLOR = ['SE', '6s', '7', '7P', '8', '8P']

// 修理メニュー（パーツ関連のみ）
const REPAIR_MENUS = [
  'TH-F', 'TH-L', 'HG-F', 'HG-L',
  'バッテリー', 'HGバッテリー',
  'コネクタ', 'リアカメラ', 'インカメラ', 'カメラ窓'
]

// パーツ種別の順序（黒が先）
const PARTS_TYPE_ORDER = [
  'TH', 'TH-黒', 'TH-白',
  'HG', 'HG-黒', 'HG-白',
  'バッテリー', 'HGバッテリー',
  'コネクタ', 'リアカメラ', 'インカメラ', 'カメラ窓'
]

// 修理メニューからパーツ種別への変換
function repairTypeToPartsTypes(repairType, model) {
  const hasColor = MODELS_WITH_COLOR.includes(model)

  if (repairType === 'TH-F' || repairType === 'TH-L') {
    return hasColor ? ['TH-黒', 'TH-白'] : ['TH']
  }
  if (repairType === 'HG-F' || repairType === 'HG-L') {
    return hasColor ? ['HG-黒', 'HG-白'] : ['HG']
  }
  // その他はそのまま
  return [repairType]
}

// 原価キーを取得（TH-F/TH-L → TH-L等）
function getCostKey(repairType) {
  if (repairType === 'TH-F') return 'TH-L'
  if (repairType === 'HG-F') return 'HG-L'
  return repairType
}

// iPhone機種のみフィルタ（iPad等を除外）
const IPHONE_MODELS = [
  'SE', 'SE2', 'SE3', '6s', '7', '7P', '8', '8P',
  'X', 'XS', 'XSMax', 'XR',
  '11', '11Pro', '11ProMax',
  '12mini', '12', '12Pro', '12ProMax',
  '13mini', '13', '13Pro', '13ProMax',
  '14', '14Plus', '14Pro', '14ProMax',
  '15', '15Plus', '15Pro', '15ProMax',
  '16', '16Plus', '16Pro', '16ProMax', '16e'
]

function generateSQL() {
  let sql = `-- ================================================
-- 全マスタデータ投入
-- 生成日時: ${new Date().toISOString()}
--
-- 元データ:
-- - repair-prices-iphone.js
-- - costs-hw.js
-- - costs-aisapo.js
-- ================================================

`

  // ==========================================
  // 1. 修理価格
  // ==========================================
  sql += `-- ==========================================
-- 1. 修理価格（m_repair_prices_iphone）
-- ==========================================
DELETE FROM m_repair_prices_iphone WHERE tenant_id = 1;

`

  for (const model of IPHONE_MODELS) {
    const prices = REPAIR_PRICES[model]
    if (!prices) continue

    for (const menu of REPAIR_MENUS) {
      const price = prices[menu]
      if (price && price > 0) {
        sql += `INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '${model}', '${menu}', ${price}, true);\n`
      }
    }
  }

  // ==========================================
  // 2. パーツ原価（HW）
  // ==========================================
  sql += `
-- ==========================================
-- 2. パーツ原価（m_costs_hw）
-- ==========================================
DELETE FROM m_costs_hw WHERE tenant_id = 1;

-- HW原価
`

  for (const model of IPHONE_MODELS) {
    const costs = COSTS_HW[model]
    if (!costs) continue

    const hasColor = MODELS_WITH_COLOR.includes(model)
    const addedPartsTypes = new Set()

    for (const menu of REPAIR_MENUS) {
      const costKey = getCostKey(menu)
      const cost = costs[costKey]
      if (!cost || cost <= 0) continue

      const partsTypes = repairTypeToPartsTypes(menu, model)
      for (const partsType of partsTypes) {
        if (addedPartsTypes.has(partsType)) continue
        addedPartsTypes.add(partsType)
        sql += `INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '${model}', '${partsType}', ${cost}, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));\n`
      }
    }
  }

  // ==========================================
  // 3. パーツ原価（アイサポ）
  // ==========================================
  sql += `
-- アイサポ原価
`

  for (const model of IPHONE_MODELS) {
    const costs = COSTS_AISAPO[model]
    if (!costs) continue

    const hasColor = MODELS_WITH_COLOR.includes(model)
    const addedPartsTypes = new Set()

    for (const menu of REPAIR_MENUS) {
      const costKey = getCostKey(menu)
      const cost = costs[costKey]
      if (!cost || cost <= 0) continue

      const partsTypes = repairTypeToPartsTypes(menu, model)
      for (const partsType of partsTypes) {
        if (addedPartsTypes.has(partsType)) continue
        addedPartsTypes.add(partsType)
        sql += `INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '${model}', '${partsType}', ${cost}, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));\n`
      }
    }
  }

  // ==========================================
  // 4. パーツ在庫初期化
  // ==========================================
  sql += `
-- ==========================================
-- 3. パーツ在庫初期化（t_parts_inventory）
-- ==========================================
DELETE FROM t_parts_inventory WHERE tenant_id = 1;

`

  // 各機種・各店舗・各仕入先ごとにパーツ在庫を作成
  for (const model of IPHONE_MODELS) {
    const prices = REPAIR_PRICES[model]
    if (!prices) continue

    const partsTypesForModel = new Set()

    // 提供している修理メニューからパーツ種別を導出
    for (const menu of REPAIR_MENUS) {
      const price = prices[menu]
      if (price && price > 0) {
        const partsTypes = repairTypeToPartsTypes(menu, model)
        partsTypes.forEach(pt => partsTypesForModel.add(pt))
      }
    }

    if (partsTypesForModel.size === 0) continue

    // PARTS_TYPE_ORDER順でソート
    const sortedPartsTypes = [...partsTypesForModel].sort((a, b) => {
      const indexA = PARTS_TYPE_ORDER.indexOf(a)
      const indexB = PARTS_TYPE_ORDER.indexOf(b)
      if (indexA === -1 && indexB === -1) return a.localeCompare(b)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })

    sql += `-- ${model}\n`
    for (const partsType of sortedPartsTypes) {
      sql += `INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '${model}', '${partsType}', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;\n`
    }
    sql += '\n'
  }

  return sql
}

const sql = generateSQL()
fs.writeFileSync(path.join(__dirname, 'all_master_data.sql'), sql)
console.log('SQLファイルを生成しました: data/sql/all_master_data.sql')

// 統計情報
const stats = {
  repairPrices: 0,
  costsHW: 0,
  costsAisapo: 0,
  inventory: 0
}

for (const model of IPHONE_MODELS) {
  const prices = REPAIR_PRICES[model]
  if (prices) {
    for (const menu of REPAIR_MENUS) {
      if (prices[menu] && prices[menu] > 0) stats.repairPrices++
    }
  }
}

console.log('\n生成統計:')
console.log(`- 対象機種: ${IPHONE_MODELS.length}機種`)
console.log(`- 修理価格: ${stats.repairPrices}件`)
