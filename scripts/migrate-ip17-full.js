// iPhone 17シリーズ・Air 完全移行スクリプト
// 買取価格 + 減額データ + モデルマスタ
// 使用方法: node scripts/migrate-ip17-full.js

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

// CSVパース（カンマ区切り、ダブルクォート対応）
function parseCSVLine(line) {
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
  return cols
}

async function main() {
  console.log('========================================')
  console.log('iPhone 17シリーズ・Air 完全移行')
  console.log('========================================')

  // CSVファイル読み込み
  const csvPath = path.join(__dirname, '../data/ip17buyback.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const lines = csvContent.trim().split('\n')
  const dataLines = lines.slice(1)

  console.log(`読み込みデータ: ${dataLines.length}行`)

  const modelsToDelete = ['17', '17Pro', '17ProMax', 'Air']

  // =====================================
  // 1. モデルマスタ登録
  // =====================================
  console.log('\n--- 1. モデルマスタ登録 ---')

  // 既存のsort_orderの最大値を取得
  const { data: maxSortData } = await supabase
    .from('m_iphone_models')
    .select('sort_order')
    .eq('tenant_id', TENANT_ID)
    .order('sort_order', { ascending: false })
    .limit(1)

  let sortOrder = (maxSortData?.[0]?.sort_order || 100) + 1

  // 新モデル定義
  const newModels = [
    { model: '17', display_name: 'iPhone 17' },
    { model: '17Pro', display_name: 'iPhone 17 Pro' },
    { model: '17ProMax', display_name: 'iPhone 17 Pro Max' },
    { model: 'Air', display_name: 'iPhone Air' },
  ]

  for (const m of newModels) {
    // 既存チェック
    const { data: existing } = await supabase
      .from('m_iphone_models')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('model', m.model)
      .single()

    if (existing) {
      console.log(`  ${m.model}: 既存`)
    } else {
      const { error } = await supabase
        .from('m_iphone_models')
        .insert({
          tenant_id: TENANT_ID,
          model: m.model,
          display_name: m.display_name,
          sort_order: sortOrder++,
          is_active: true,
        })
      if (error) {
        console.error(`  ${m.model} 登録エラー:`, error.message)
      } else {
        console.log(`  ${m.model}: 新規登録`)
      }
    }
  }

  // =====================================
  // 2. 買取価格登録
  // =====================================
  console.log('\n--- 2. 買取価格登録 ---')

  // 既存データ削除
  for (const model of modelsToDelete) {
    await supabase
      .from('m_buyback_prices')
      .delete()
      .eq('tenant_id', TENANT_ID)
      .eq('model', model)
  }
  console.log('  既存価格データ削除完了')

  const priceRecords = []
  for (const line of dataLines) {
    const cols = parseCSVLine(line)
    const model = cols[0]
    const storage = parseInt(cols[1], 10)
    const prices = {
      '超美品': parseNumber(cols[2]),
      '美品': parseNumber(cols[3]),
      '良品': parseNumber(cols[4]),
      '並品': parseNumber(cols[5]),
      'リペア品': parseNumber(cols[6]),
    }

    for (const rank of RANKS) {
      if (prices[rank] > 0) {
        priceRecords.push({
          tenant_id: TENANT_ID,
          model, storage, rank,
          price: prices[rank],
          is_active: true,
        })
      }
    }
  }

  // バッチ挿入
  for (let i = 0; i < priceRecords.length; i += 50) {
    const batch = priceRecords.slice(i, i + 50)
    await supabase.from('m_buyback_prices').insert(batch)
  }
  console.log(`  価格データ ${priceRecords.length}件登録`)

  // =====================================
  // 3. 減額データ登録
  // =====================================
  console.log('\n--- 3. 減額データ登録 ---')

  // 既存データ削除
  for (const model of modelsToDelete) {
    await supabase
      .from('m_buyback_deductions')
      .delete()
      .eq('tenant_id', TENANT_ID)
      .eq('model', model)
  }
  console.log('  既存減額データ削除完了')

  // CSVのカラム:
  // 0:モデル, 1:容量, 2:超美品, 3:美品, 4:良品, 5:並品, 6:リペア品
  // 7:美品減額, 8:良品減額, 9:並品減額, 10:リペア品減額
  // 11:90%~, 12:80%~89%, 13:~79%
  // 14:◯, 15:△, 16:✕
  // 17:破損有り, 18:染み有り, 19:履歴有り

  const deductionRecords = []
  for (const line of dataLines) {
    const cols = parseCSVLine(line)
    const model = cols[0]
    const storage = parseInt(cols[1], 10)

    // バッテリー減額
    deductionRecords.push({ tenant_id: TENANT_ID, model, storage, deduction_type: 'battery_90', amount: parseNumber(cols[11]), is_active: true })
    deductionRecords.push({ tenant_id: TENANT_ID, model, storage, deduction_type: 'battery_80_89', amount: parseNumber(cols[12]), is_active: true })
    deductionRecords.push({ tenant_id: TENANT_ID, model, storage, deduction_type: 'battery_79', amount: parseNumber(cols[13]), is_active: true })

    // ネットワーク減額
    deductionRecords.push({ tenant_id: TENANT_ID, model, storage, deduction_type: 'nw_ok', amount: parseNumber(cols[14]), is_active: true })
    deductionRecords.push({ tenant_id: TENANT_ID, model, storage, deduction_type: 'nw_checking', amount: parseNumber(cols[15]), is_active: true })
    deductionRecords.push({ tenant_id: TENANT_ID, model, storage, deduction_type: 'nw_ng', amount: parseNumber(cols[16]), is_active: true })

    // カメラ・履歴減額
    deductionRecords.push({ tenant_id: TENANT_ID, model, storage, deduction_type: 'camera_broken', amount: parseNumber(cols[17]), is_active: true })
    deductionRecords.push({ tenant_id: TENANT_ID, model, storage, deduction_type: 'camera_stain', amount: parseNumber(cols[18]), is_active: true })
    deductionRecords.push({ tenant_id: TENANT_ID, model, storage, deduction_type: 'repair_history', amount: parseNumber(cols[19]), is_active: true })
  }

  // バッチ挿入
  for (let i = 0; i < deductionRecords.length; i += 50) {
    const batch = deductionRecords.slice(i, i + 50)
    await supabase.from('m_buyback_deductions').insert(batch)
  }
  console.log(`  減額データ ${deductionRecords.length}件登録`)

  // =====================================
  // 確認
  // =====================================
  console.log('\n--- 登録確認 ---')

  const { count: priceCount } = await supabase
    .from('m_buyback_prices')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .in('model', modelsToDelete)

  const { count: deductionCount } = await supabase
    .from('m_buyback_deductions')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .in('model', modelsToDelete)

  console.log(`  買取価格: ${priceCount}件`)
  console.log(`  減額データ: ${deductionCount}件`)

  console.log('\n========================================')
  console.log('完了')
  console.log('========================================')
}

main().catch(console.error)
