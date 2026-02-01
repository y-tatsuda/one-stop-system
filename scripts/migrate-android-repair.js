// Android修理価格移行スクリプト
// 使用方法: node scripts/migrate-android-repair.js

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

// JavaScriptファイルからオブジェクトを読み込む
function loadJsData(filename) {
  const content = fs.readFileSync(path.join(__dirname, '../data', filename), 'utf-8')
  // constの宣言を取り除いてJSONとして評価
  const match = content.match(/const\s+\w+\s*=\s*(\{[\s\S]*\});?\s*$/)
  if (match) {
    // JavaScriptオブジェクトをJSONに変換（キーをクォートで囲む）
    let jsonStr = match[1]
    // 末尾のセミコロンを削除
    jsonStr = jsonStr.replace(/;$/, '')
    // evalで評価（信頼できるローカルファイルのみ）
    return eval('(' + jsonStr + ')')
  }
  return null
}

async function main() {
  console.log('========================================')
  console.log('Android修理価格移行')
  console.log('========================================')

  // 価格データ読み込み
  const prices = loadJsData('android-repair.js')
  const costs = loadJsData('costs-android.js')

  if (!prices || !costs) {
    console.error('データファイルの読み込みに失敗しました')
    return
  }

  const priceModels = Object.keys(prices)
  const costModels = Object.keys(costs)

  console.log(`価格データ: ${priceModels.length} モデル`)
  console.log(`原価データ: ${costModels.length} モデル`)

  // 既存データを削除
  console.log('\n既存データを削除中...')
  const { error: deleteError } = await supabase
    .from('m_repair_prices_android')
    .delete()
    .eq('tenant_id', TENANT_ID)

  if (deleteError) {
    console.error('削除エラー:', deleteError)
    return
  }

  // 登録用データ作成
  const records = []
  const repairTypes = ['パネル', 'バッテリー']

  for (const model of priceModels) {
    const priceData = prices[model]
    const costData = costs[model] || {}

    for (const repairType of repairTypes) {
      const price = priceData[repairType]
      const cost = costData[repairType] || 0

      // 価格が0または未設定のものはスキップ
      if (!price || price === 0) continue

      records.push({
        tenant_id: TENANT_ID,
        model: model,
        repair_type: repairType,
        price: price,
        cost: cost,
        is_active: true,
      })
    }
  }

  console.log(`登録レコード数: ${records.length}`)

  // バッチ挿入
  const batchSize = 100
  let insertedCount = 0

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const { error } = await supabase
      .from('m_repair_prices_android')
      .insert(batch)

    if (error) {
      console.error(`バッチ ${i} でエラー:`, error)
    } else {
      insertedCount += batch.length
    }
  }

  console.log(`登録完了: ${insertedCount} 件`)

  // 確認
  const { count } = await supabase
    .from('m_repair_prices_android')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)

  console.log(`最終件数: ${count} 件`)

  console.log('\n========================================')
  console.log('完了')
  console.log('========================================')
}

main().catch(console.error)
