// ================================================
// 買取価格SQL生成スクリプト
//
// 元データ: buyback202602
// ================================================

const fs = require('fs')
const path = require('path')

// buyback202602ファイルを読み込み
const buybackContent = fs.readFileSync(path.join(__dirname, '../buyback202602'), 'utf8')

// JavaScriptオブジェクトとして評価
// constをvarに置換してグローバルスコープで使えるようにする
const modifiedContent = buybackContent.replace('const BUYBACK_PRICES', 'var BUYBACK_PRICES')
eval(modifiedContent)

// ランク一覧
const RANKS = ['超美品', '美品', '良品', '並品', 'リペア品']

// 減額種別一覧
const DEDUCTION_TYPES = [
  'battery_90', 'battery_80_89', 'battery_79',
  'nw_ok', 'nw_checking', 'nw_ng',
  'camera_broken', 'camera_stain', 'repair_history'
]

function generateSQL() {
  let sql = `-- ================================================
-- 買取価格マスタデータ投入
-- 生成日時: ${new Date().toISOString()}
--
-- 元データ: buyback202602
-- ================================================

`

  // ==========================================
  // 1. 買取価格（m_buyback_prices）
  // ==========================================
  sql += `-- ==========================================
-- 1. 買取価格（m_buyback_prices）
-- ==========================================
DELETE FROM m_buyback_prices WHERE tenant_id = 1;

`

  for (const model of Object.keys(BUYBACK_PRICES)) {
    const storages = BUYBACK_PRICES[model]
    for (const storage of Object.keys(storages)) {
      const data = storages[storage]
      if (!data.rank) continue

      for (const rank of RANKS) {
        const price = data.rank[rank]
        if (price !== undefined && price !== null) {
          sql += `INSERT INTO m_buyback_prices (tenant_id, model, storage, rank, price, is_active) VALUES (1, '${model}', ${storage}, '${rank}', ${price}, true);\n`
        }
      }
    }
  }

  // ==========================================
  // 2. 買取減額（m_buyback_deductions）
  // ==========================================
  sql += `
-- ==========================================
-- 2. 買取減額（m_buyback_deductions）
-- ==========================================
DELETE FROM m_buyback_deductions WHERE tenant_id = 1;

`

  for (const model of Object.keys(BUYBACK_PRICES)) {
    const storages = BUYBACK_PRICES[model]
    for (const storage of Object.keys(storages)) {
      const data = storages[storage]
      if (!data.deduction) continue

      for (const deductionType of DEDUCTION_TYPES) {
        const amount = data.deduction[deductionType]
        if (amount !== undefined && amount !== null) {
          sql += `INSERT INTO m_buyback_deductions (tenant_id, model, storage, deduction_type, amount, is_active) VALUES (1, '${model}', ${storage}, '${deductionType}', ${amount}, true);\n`
        }
      }
    }
  }

  // ==========================================
  // 3. 買取保証価格（m_buyback_guarantees）
  // ==========================================
  sql += `
-- ==========================================
-- 3. 買取保証価格（m_buyback_guarantees）
-- ==========================================
DELETE FROM m_buyback_guarantees WHERE tenant_id = 1;

`

  for (const model of Object.keys(BUYBACK_PRICES)) {
    const storages = BUYBACK_PRICES[model]
    for (const storage of Object.keys(storages)) {
      const data = storages[storage]
      if (data.guarantee !== undefined && data.guarantee !== null) {
        sql += `INSERT INTO m_buyback_guarantees (tenant_id, model, storage, guarantee_price, is_active) VALUES (1, '${model}', ${storage}, ${data.guarantee}, true);\n`
      }
    }
  }

  return sql
}

const sql = generateSQL()
fs.writeFileSync(path.join(__dirname, '06_insert_buyback_prices.sql'), sql)
console.log('SQLファイルを生成しました: data/sql/06_insert_buyback_prices.sql')

// 統計情報
let stats = {
  prices: 0,
  deductions: 0,
  guarantees: 0
}

for (const model of Object.keys(BUYBACK_PRICES)) {
  const storages = BUYBACK_PRICES[model]
  for (const storage of Object.keys(storages)) {
    const data = storages[storage]
    if (data.rank) {
      stats.prices += Object.keys(data.rank).length
    }
    if (data.deduction) {
      stats.deductions += Object.keys(data.deduction).length
    }
    if (data.guarantee !== undefined) {
      stats.guarantees++
    }
  }
}

console.log('\n生成統計:')
console.log(`- 対象機種: ${Object.keys(BUYBACK_PRICES).length}機種`)
console.log(`- 買取価格: ${stats.prices}件`)
console.log(`- 買取減額: ${stats.deductions}件`)
console.log(`- 保証価格: ${stats.guarantees}件`)
