// iPhone 17シリーズ・Air 買取価格移行スクリプト
// 使用方法: node scripts/migrate-ip17-buyback.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(url, key)
const TENANT_ID = 1

// ランク一覧
const RANKS = ['超美品', '美品', '良品', '並品', 'リペア品']

// カンマ区切りの数値をパース
function parseNumber(str) {
  if (!str) return 0
  return parseInt(str.replace(/,/g, '').replace(/"/g, ''), 10) || 0
}

async function main() {
  console.log('========================================')
  console.log('iPhone 17シリーズ・Air 買取価格移行')
  console.log('========================================')

  // CSVファイル読み込み
  const csvPath = path.join(__dirname, '../data/ip17buyback.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const lines = csvContent.trim().split('\n')

  // ヘッダーをスキップ
  const dataLines = lines.slice(1)

  console.log(`読み込みデータ: ${dataLines.length}行`)

  // 登録用データ作成
  const records = []

  for (const line of dataLines) {
    // CSVパース（カンマ区切り、ダブルクォート内のカンマを考慮）
    const cols = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        cols.push(current)
        current = ''
      } else {
        current += char
      }
    }
    cols.push(current)

    const model = cols[0]  // 17, 17Pro, 17ProMax, Air
    const storage = parseInt(cols[1], 10)  // 256, 512, 1024, 2048
    const prices = {
      '超美品': parseNumber(cols[2]),
      '美品': parseNumber(cols[3]),
      '良品': parseNumber(cols[4]),
      '並品': parseNumber(cols[5]),
      'リペア品': parseNumber(cols[6]),
    }

    for (const rank of RANKS) {
      const price = prices[rank]
      if (price > 0) {
        records.push({
          tenant_id: TENANT_ID,
          model: model,
          storage: storage,
          rank: rank,
          price: price,
          is_active: true,
        })
      }
    }
  }

  console.log(`登録レコード数: ${records.length}`)

  if (records.length === 0) {
    console.log('登録するデータがありません')
    return
  }

  // 既存の17シリーズ・Airデータを削除
  const modelsToDelete = ['17', '17Pro', '17ProMax', 'Air']
  console.log('\n既存データを削除中...')

  for (const model of modelsToDelete) {
    const { error } = await supabase
      .from('m_buyback_prices')
      .delete()
      .eq('tenant_id', TENANT_ID)
      .eq('model', model)

    if (error) {
      console.error(`  ${model} 削除エラー:`, error.message)
    } else {
      console.log(`  ${model} の既存データを削除`)
    }
  }

  // バッチ挿入
  console.log('\nデータ登録中...')
  const batchSize = 50
  let insertedCount = 0

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const { error } = await supabase
      .from('m_buyback_prices')
      .insert(batch)

    if (error) {
      console.error(`バッチ ${i} でエラー:`, error.message)
    } else {
      insertedCount += batch.length
    }
  }

  console.log(`\n登録完了: ${insertedCount} 件`)

  // モデル別の件数を表示
  console.log('\nモデル別登録数:')
  const modelCounts = {}
  for (const r of records) {
    const key = `${r.model} ${r.storage}GB`
    modelCounts[key] = (modelCounts[key] || 0) + 1
  }
  for (const [model, count] of Object.entries(modelCounts)) {
    console.log(`  ${model}: ${count}件`)
  }

  // 確認
  const { data: checkData, count } = await supabase
    .from('m_buyback_prices')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .in('model', modelsToDelete)

  console.log(`\nDBの17/Air系合計: ${count} 件`)

  console.log('\n========================================')
  console.log('完了')
  console.log('========================================')
}

main().catch(console.error)
