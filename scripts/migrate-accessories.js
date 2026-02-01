// アクセサリ在庫移行スクリプト
// 使用方法: node scripts/migrate-accessories.js

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

// CSVパース
function parseCSV(content) {
  const rows = []
  let headers = []

  let currentRow = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim())
      currentField = ''
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      if (char === '\r') i++
      currentRow.push(currentField.trim())
      currentField = ''

      if (currentRow.length > 0 && currentRow.some(v => v)) {
        if (headers.length === 0) {
          headers = currentRow
        } else {
          const row = {}
          headers.forEach((h, idx) => {
            row[h] = currentRow[idx] || ''
          })
          rows.push(row)
        }
      }
      currentRow = []
    } else {
      currentField += char
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (headers.length > 0 && currentRow.length > 0) {
      const row = {}
      headers.forEach((h, idx) => {
        row[h] = currentRow[idx] || ''
      })
      rows.push(row)
    }
  }

  return rows
}

async function main() {
  console.log('========================================')
  console.log('アクセサリ在庫移行')
  console.log('========================================')

  // カテゴリマッピングを取得
  const { data: categories } = await supabase
    .from('m_accessory_categories')
    .select('id, name')
    .eq('tenant_id', TENANT_ID)

  const categoryMap = {}
  categories?.forEach(c => {
    categoryMap[c.name] = c.id
  })
  console.log('カテゴリ:', Object.keys(categoryMap).join(', '))

  // 新しいカテゴリを追加（必要な場合）
  const neededCategories = ['フィルム', 'マグセーフアクセサリ', 'ストラップ']
  for (const catName of neededCategories) {
    if (!categoryMap[catName]) {
      const { data: newCat, error } = await supabase
        .from('m_accessory_categories')
        .insert({
          tenant_id: TENANT_ID,
          name: catName,
          sort_order: Object.keys(categoryMap).length + 1,
          is_active: true,
        })
        .select('id, name')
        .single()

      if (!error && newCat) {
        categoryMap[newCat.name] = newCat.id
        console.log(`  カテゴリ追加: ${newCat.name} (ID: ${newCat.id})`)
      }
    }
  }

  // CSVファイルを読み込み
  const csvPath = path.join(__dirname, '../data/ONE STOP統合データベース - T_アクセサリ在庫.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(csvContent)

  console.log(`CSVレコード: ${rows.length}件`)

  // 現在のアクセサリを取得
  const { data: existingAccessories, error: fetchError } = await supabase
    .from('m_accessories')
    .select('id, name, variation, category_id')
    .eq('tenant_id', TENANT_ID)

  if (fetchError) {
    console.error('アクセサリ取得エラー:', fetchError)
    return
  }

  console.log(`既存アクセサリ: ${existingAccessories?.length || 0}件`)

  // 重複チェック用のセット
  const existingSet = new Set()
  existingAccessories?.forEach(a => {
    existingSet.add(`${a.name}_${a.variation || ''}_${a.category_id}`)
  })

  // CSVデータをアクセサリマスタに変換
  const newAccessories = []
  for (const row of rows) {
    const name = row['商品名']
    const categoryName = row['カテゴリ'] || 'その他アクセサリ'
    const variation = row['カラー'] || null
    const cost = parseInt(row['原価']) || 0
    const price = parseInt(row['販売価格_店頭']) || 0

    // カテゴリIDを取得（見つからない場合は「その他アクセサリ」）
    let categoryId = categoryMap[categoryName] || categoryMap['その他アクセサリ'] || 3

    // 重複チェック
    const key = `${name}_${variation || ''}_${categoryId}`
    if (existingSet.has(key)) {
      console.log(`  スキップ（重複）: ${name}`)
      continue
    }

    newAccessories.push({
      tenant_id: TENANT_ID,
      category_id: categoryId,
      name: name,
      variation: variation,
      cost: cost,
      price: price,
      is_active: true,
    })

    existingSet.add(key)
  }

  console.log(`新規追加: ${newAccessories.length}件`)

  if (newAccessories.length === 0) {
    console.log('追加するアクセサリがありません')
    return
  }

  // データを登録
  const { data, error } = await supabase
    .from('m_accessories')
    .insert(newAccessories)
    .select('id, name, cost, price')

  if (error) {
    console.error('登録エラー:', error)
    return
  }

  console.log(`登録完了: ${data?.length || 0}件`)

  // 登録内容を表示
  for (const acc of data || []) {
    console.log(`  ID ${acc.id}: ${acc.name} (原価: ${acc.cost}円, 販売: ${acc.price}円)`)
  }

  console.log('\n========================================')
  console.log('完了')
  console.log('========================================')
}

main().catch(console.error)
