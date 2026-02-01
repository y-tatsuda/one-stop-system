// iPad修理価格移行スクリプト
// 使用方法: node scripts/migrate-ipad-repair.js

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

// iPadモデルリスト（repair-prices-iphone.jsから抽出）
const IPAD_MODELS = [
  'Air', 'Air2', 'Air3', 'Air4', 'Air5',
  'Pad5', 'Pad6', 'Pad7', 'Pad8', 'Pad9', 'Pad10',
  'mini 2', 'mini 3', 'mini 4', 'mini 5', 'mini 6', 'mini 7',
  'Pro11-1', 'Pro11-2', 'Pro11-3', 'Pro11-4',
  'Pro12.9-2', 'Pro12.9-3', 'Pro12.9-4', 'Pro12.9-5', 'Pro12.9-6', 'Pro12.9-7'
]

// iPad修理メニュー（価格が設定されているもの）
const IPAD_REPAIR_TYPES = [
  'TH-F', 'TH-L', 'HG-F', 'HG-L',
  'バッテリー',
  '作業費', '未修理',
  'フィルム', 'フィルム単',
  'ケース', 'ケース単',
  'データ移行', 'データ移行α',
  '個別10分', '個別20分', '個別30分', '個別60分'
]

// JavaScriptファイルからオブジェクトを読み込む
function loadJsData(filename) {
  const content = fs.readFileSync(path.join(__dirname, '../data', filename), 'utf-8')
  const match = content.match(/const\s+\w+\s*=\s*(\{[\s\S]*\});?\s*$/)
  if (match) {
    let jsonStr = match[1].replace(/;$/, '')
    return eval('(' + jsonStr + ')')
  }
  return null
}

async function main() {
  console.log('========================================')
  console.log('iPad修理価格移行')
  console.log('========================================')

  // 価格データ読み込み
  const allPrices = loadJsData('repair-prices-iphone.js')

  if (!allPrices) {
    console.error('価格データの読み込みに失敗しました')
    return
  }

  // 既存データを削除
  console.log('既存データを削除中...')
  const { error: deleteError } = await supabase
    .from('m_repair_prices_ipad')
    .delete()
    .eq('tenant_id', TENANT_ID)

  if (deleteError) {
    console.error('削除エラー:', deleteError.message)
    if (deleteError.message.includes('Could not find the table')) {
      console.log('\n※テーブルが存在しません。先にSupabaseでテーブルを作成してください。')
    }
    return
  }

  // 登録用データ作成
  const records = []

  for (const model of IPAD_MODELS) {
    const priceData = allPrices[model]
    if (!priceData) {
      console.log(`  モデル「${model}」が見つかりません`)
      continue
    }

    for (const repairType of IPAD_REPAIR_TYPES) {
      const price = priceData[repairType]

      // 価格が0または未設定のものはスキップ
      if (!price || price === 0) continue

      records.push({
        tenant_id: TENANT_ID,
        model: model,
        repair_type: repairType,
        price: price,
        is_active: true,
      })
    }
  }

  console.log(`登録レコード数: ${records.length}`)

  if (records.length === 0) {
    console.log('登録するデータがありません')
    return
  }

  // バッチ挿入
  const batchSize = 100
  let insertedCount = 0

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const { error } = await supabase
      .from('m_repair_prices_ipad')
      .insert(batch)

    if (error) {
      console.error(`バッチ ${i} でエラー:`, error.message)
    } else {
      insertedCount += batch.length
    }
  }

  console.log(`登録完了: ${insertedCount} 件`)

  // モデル別の件数を表示
  console.log('\nモデル別登録数:')
  const modelCounts = {}
  for (const r of records) {
    modelCounts[r.model] = (modelCounts[r.model] || 0) + 1
  }
  for (const [model, count] of Object.entries(modelCounts)) {
    console.log(`  ${model}: ${count}件`)
  }

  console.log('\n========================================')
  console.log('完了')
  console.log('========================================')
}

main().catch(console.error)
