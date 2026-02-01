// CSVデータ移行スクリプト v2 (csv-parser使用)
// 使用方法: node scripts/migrate-csv-data-v2.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(url, key)
const TENANT_ID = 1

// CSVをPromiseで読み込み
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = []
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject)
  })
}

// マスタデータをキャッシュ
let shopMap = {}
let staffMap = {}
let sourceMap = {}
let supplierMap = {}

async function loadMasterData() {
  console.log('マスタデータを読み込み中...')

  const { data: shops } = await supabase
    .from('m_shops').select('id, name').eq('tenant_id', TENANT_ID)
  shops?.forEach(s => {
    shopMap[s.name] = s.id
    if (s.name.includes('福井')) shopMap['福井店'] = s.id
    if (s.name.includes('鯖江')) shopMap['鯖江店'] = s.id
  })

  const { data: staff } = await supabase
    .from('m_staff').select('id, name').eq('tenant_id', TENANT_ID)
  staff?.forEach(s => {
    staffMap[s.name] = s.id
    const shortName = s.name.replace(/\s+/g, '').replace('　', '')
    staffMap[shortName] = s.id
    const lastName = s.name.split(/[\s　]/)[0]
    if (lastName && !staffMap[lastName]) {
      staffMap[lastName] = s.id
    }
  })

  const { data: sources } = await supabase
    .from('m_visit_sources').select('id, name').eq('tenant_id', TENANT_ID)
  sources?.forEach(s => {
    sourceMap[s.name] = s.id
    if (s.name.includes('リピーター')) sourceMap['リピーター'] = s.id
    if (s.name.includes('紹介')) sourceMap['紹介'] = s.id
    if (s.name.includes('通り')) sourceMap['通りがかり'] = s.id
    if (s.name.includes('検索')) sourceMap['ネット検索'] = s.id
  })

  const { data: suppliers } = await supabase
    .from('m_suppliers').select('id, code, name').eq('tenant_id', TENANT_ID)
  suppliers?.forEach(s => {
    supplierMap[s.code] = s.id
    supplierMap[s.name] = s.id
    if (s.name.includes('アイサポ') || s.code === 'aisapo') supplierMap['アイサポ'] = s.id
    if (s.name === 'HW' || s.code === 'hw') supplierMap['HW'] = s.id
  })

  console.log('  店舗:', Object.keys(shopMap).length, '件')
  console.log('  スタッフ:', Object.keys(staffMap).length, '件')
  console.log('  来店経路:', Object.keys(sourceMap).length, '件')
  console.log('  仕入先:', Object.keys(supplierMap).length, '件')
}

// 中古在庫を移行
async function migrateUsedInventory() {
  console.log('\n========================================')
  console.log('中古在庫を移行')
  console.log('========================================')

  const currentPath = path.join(__dirname, '../data/ONE STOP統合データベース - T_中古在庫 (2).csv')
  const archivePath = path.join(__dirname, '../data/ONE STOP統合データベース - T_中古在庫_アーカイブ.csv')

  const currentRows = await readCSV(currentPath)
  const archiveRows = await readCSV(archivePath)

  console.log(`  現在在庫: ${currentRows.length}件, 販売済: ${archiveRows.length}件`)

  function parseBatteryPercent(val) {
    if (!val) return null
    if (val.includes('90')) return 92
    if (val.includes('80')) return 85
    if (val.includes('79') || val.includes('~79')) return 75
    return null
  }

  function getShopId(shopName) {
    if (!shopName) return 1
    if (shopName.includes('鯖江')) return shopMap['鯖江店'] || 2
    return shopMap['福井店'] || 1
  }

  function convertRow(row, isSold = false) {
    const shopId = getShopId(row['入荷店舗'])
    const managementNumber = row['管理No'] || null

    let arrivalDate = null
    if (row['入荷日']) {
      const d = row['入荷日']
      if (d.includes('/')) {
        const parts = d.split('/')
        arrivalDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
      } else {
        arrivalDate = d
      }
    }

    let storage = parseInt(row['ストレージ']) || 64

    let cameraStainLevel = null
    const stain = row['カメラ染み']
    if (stain === '染みなし' || stain === '◯') cameraStainLevel = 'none'
    else if (stain === '染みあり' || stain === '染み有り') cameraStainLevel = 'minor'

    let cameraBroken = false
    const camWindow = row['カメラ窓']
    if (camWindow === '破損有り' || camWindow === '破損あり') cameraBroken = true

    return {
      tenant_id: TENANT_ID,
      shop_id: shopId,
      arrival_date: arrivalDate,
      model: row['モデル'] || null,
      storage: storage,
      rank: row['ランク'] || null,
      imei: row['IMEI'] || null,
      management_number: managementNumber,
      battery_percent: parseBatteryPercent(row['バッテリー%']),
      is_service_state: true,
      nw_status: row['NW制限'] === '◯' ? 'ok' : 'ok',
      camera_stain_level: cameraStainLevel,
      camera_broken: cameraBroken,
      repair_history: row['非正規修理'] !== '履歴なし',
      buyback_price: parseInt(row['買取価格']) || 0,
      repair_cost: parseInt(row['修理パーツ原価']) || 0,
      total_cost: parseInt(row['販売原価']) || 0,
      sales_price: parseInt(row['販売価格']) || 0,
      status: isSold ? '販売済' : (row['在庫ステータス'] || '在庫'),
      ec_status: row['ECステータス'] || null,
      memo: row['備考'] || null,
    }
  }

  console.log('  既存データを削除中...')
  const { error: deleteError } = await supabase
    .from('t_used_inventory')
    .delete()
    .eq('tenant_id', TENANT_ID)

  if (deleteError) {
    console.error('削除エラー:', deleteError)
    return
  }

  const currentRecords = currentRows.map(r => convertRow(r, false))
  console.log(`  現在在庫を登録中... (${currentRecords.length}件)`)

  for (let i = 0; i < currentRecords.length; i += 100) {
    const batch = currentRecords.slice(i, i + 100)
    const { error } = await supabase.from('t_used_inventory').insert(batch)
    if (error) {
      console.error(`バッチ ${i} でエラー:`, error.message)
    }
  }

  const archiveRecords = archiveRows.map(r => convertRow(r, true))
  console.log(`  販売済みを登録中... (${archiveRecords.length}件)`)

  for (let i = 0; i < archiveRecords.length; i += 100) {
    const batch = archiveRecords.slice(i, i + 100)
    const { error } = await supabase.from('t_used_inventory').insert(batch)
    if (error) {
      console.error(`バッチ ${i} でエラー:`, error.message)
    }
  }

  const { count } = await supabase
    .from('t_used_inventory')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)

  console.log(`  完了: ${count}件登録`)
}

// 売上明細を移行
async function migrateSales() {
  console.log('\n========================================')
  console.log('売上明細を移行')
  console.log('========================================')

  const salesPath = path.join(__dirname, '../data/ONE STOP統合データベース - T_売上明細 (2).csv')
  const salesRows = await readCSV(salesPath)

  console.log(`  売上明細: ${salesRows.length}件`)

  console.log('  既存データを削除中...')
  const { data: existingSales } = await supabase
    .from('t_sales').select('id').eq('tenant_id', TENANT_ID)
  if (existingSales && existingSales.length > 0) {
    const salesIds = existingSales.map(s => s.id)
    await supabase.from('t_sales_details').delete().in('sales_id', salesIds)
  }
  await supabase.from('t_sales').delete().eq('tenant_id', TENANT_ID)

  const salesGroups = {}
  for (const row of salesRows) {
    const salesId = row['売上ID']
    if (!salesGroups[salesId]) {
      salesGroups[salesId] = { header: row, details: [] }
    }
    salesGroups[salesId].details.push(row)
  }

  console.log(`  売上グループ: ${Object.keys(salesGroups).length}件`)

  let insertedCount = 0
  let detailCount = 0

  for (const [salesId, group] of Object.entries(salesGroups)) {
    const header = group.header

    let shopId = 1
    const shopName = header['店舗']
    if (shopName.includes('鯖江')) shopId = shopMap['鯖江店'] || 2
    else if (shopName.includes('ECサイト')) shopId = shopMap['福井店'] || 1
    else shopId = shopMap['福井店'] || 1

    const staffName = header['担当者']
    let staffId = staffMap[staffName] || staffMap['龍田'] || 1

    const sourceName = header['来店経路']
    let sourceId = sourceMap[sourceName] || sourceMap['ネット検索'] || 1

    let saleDate = header['日付']
    if (saleDate && saleDate.includes('/')) {
      const parts = saleDate.split('/')
      saleDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
    }

    let totalAmount = 0
    let totalCost = 0
    let totalProfit = 0
    for (const d of group.details) {
      totalAmount += parseInt(d['最終売上']) || 0
      totalCost += parseInt(d['原価']) || 0
      totalProfit += parseInt(d['粗利']) || 0
    }

    const { data: salesData, error: headerError } = await supabase
      .from('t_sales')
      .insert({
        tenant_id: TENANT_ID,
        shop_id: shopId,
        staff_id: staffId,
        sale_date: saleDate,
        visit_source_id: sourceId,
        total_amount: totalAmount,
        total_cost: totalCost,
        total_profit: totalProfit,
        memo: header['備考'] || null,
      })
      .select('id')
      .single()

    if (headerError) {
      console.error(`売上 ${salesId} 登録エラー:`, headerError.message)
      continue
    }

    insertedCount++

    const detailRecords = group.details.map(d => {
      const supplierName = d['仕入先']
      let supplierId = supplierMap[supplierName] || supplierMap['アイサポ'] || 2

      let storage = null
      const menu = d['メニュー'] || ''
      if (menu.includes('GB')) {
        const match = menu.match(/(\d+)GB/)
        if (match) storage = parseInt(match[1])
      }

      let rank = null
      if (menu.includes('美品')) rank = '美品'
      else if (menu.includes('良品')) rank = '良品'
      else if (menu.includes('並品')) rank = '並品'
      else if (menu.includes('リペア品')) rank = 'リペア品'

      return {
        sales_id: salesData.id,
        category: d['大項目'] || '',
        sub_category: d['機種カテゴリ'] || '',
        model: d['機種'] || '',
        menu: d['メニュー'] || '',
        storage: storage,
        rank: rank,
        supplier_id: supplierId,
        quantity: 1,
        unit_price: parseInt(d['売上金額']) || 0,
        unit_cost: parseInt(d['原価']) || 0,
        amount: parseInt(d['最終売上']) || 0,
        cost: parseInt(d['原価']) || 0,
        profit: parseInt(d['粗利']) || 0,
      }
    })

    const { error: detailError } = await supabase
      .from('t_sales_details')
      .insert(detailRecords)

    if (detailError) {
      console.error(`売上 ${salesId} 明細登録エラー:`, detailError.message)
    } else {
      detailCount += detailRecords.length
    }
  }

  console.log(`  完了: 売上 ${insertedCount}件, 明細 ${detailCount}件`)
}

// パーツ在庫の実在数を更新
async function migratePartsInventory() {
  console.log('\n========================================')
  console.log('パーツ在庫の実在数を更新')
  console.log('========================================')

  const partsPath = path.join(__dirname, '../data/ONE STOP統合データベース - T_パーツ在庫.csv')
  const partsRows = await readCSV(partsPath)

  console.log(`  CSVレコード: ${partsRows.length}件`)

  const partsTypeMap = {
    '標準パネル': 'TH',
    'HGパネル': 'HG',
    'バッテリー': 'バッテリー',
    'HGバッテリー': 'HGバッテリー',
    'コネクタ': 'コネクタ',
    'iPadパネル': 'iPadパネル',
    'iPadバッテリー': 'iPadバッテリー',
    'iPad一体黒': 'iPad一体黒',
    'iPad液晶': 'iPad液晶',
    'iPadFP黒': 'iPadFP黒',
  }

  function normalizeModel(csvModel) {
    let model = csvModel.replace('黒', '').replace('白', '')
    if (model === '8/SE2') return 'SE2'
    if (model === '12/12Pro') return '12'
    if (model === 'iPad5/Air') return 'iPad5'
    if (model === 'iPad7/8') return 'iPad7'
    if (model === 'iPad7/8/9液晶') return 'iPad7'
    if (model === 'iPad5~9/Air') return 'iPad5'
    return model
  }

  const updateConfigs = [
    { shopId: 1, supplierId: 2, requiredCol: '福井ア必要', actualCol: '福井ア実在' },
    { shopId: 1, supplierId: 1, requiredCol: '福井HW必要', actualCol: '福井HW実在' },
    { shopId: 2, supplierId: 2, requiredCol: '鯖江ア必要', actualCol: '鯖江ア実在' },
    { shopId: 2, supplierId: 1, requiredCol: '鯖江HW必要', actualCol: '鯖江HW実在' },
  ]

  let updatedCount = 0
  let notFoundCount = 0

  for (const row of partsRows) {
    const csvModel = row['モデル']
    const csvPartsType = row['パーツ種類']

    const model = normalizeModel(csvModel)
    const partsType = partsTypeMap[csvPartsType] || csvPartsType

    for (const config of updateConfigs) {
      const required = parseInt(row[config.requiredCol]) || 0
      const actual = parseInt(row[config.actualCol]) || 0

      const { data: existing } = await supabase
        .from('t_parts_inventory')
        .select('id')
        .eq('tenant_id', TENANT_ID)
        .eq('shop_id', config.shopId)
        .eq('model', model)
        .eq('parts_type', partsType)
        .eq('supplier_id', config.supplierId)
        .single()

      if (existing) {
        const { error } = await supabase
          .from('t_parts_inventory')
          .update({ required_qty: required, actual_qty: actual })
          .eq('id', existing.id)

        if (!error) updatedCount++
      } else {
        notFoundCount++
      }
    }
  }

  console.log(`  完了: 更新 ${updatedCount}件, 未発見 ${notFoundCount}件`)
}

// メイン処理
async function main() {
  console.log('========================================')
  console.log('CSVデータ移行開始 (v2)')
  console.log('========================================')

  await loadMasterData()
  await migrateUsedInventory()
  await migrateSales()
  await migratePartsInventory()

  console.log('\n========================================')
  console.log('移行完了')
  console.log('========================================')
}

main().catch(console.error)
