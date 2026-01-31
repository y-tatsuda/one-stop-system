// マスタデータ適用スクリプト
// 生成したSQLをSupabaseに適用する

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  'https://cfeuejuidjmywedmqgvv.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyMasterData() {
  console.log('========================================')
  console.log('マスタデータ適用開始')
  console.log('========================================\n')

  try {
    // 1. 修理価格をクリアして再投入
    console.log('1. 修理価格（m_repair_prices_iphone）を更新中...')
    const { error: deleteRepairError } = await supabase
      .from('m_repair_prices_iphone')
      .delete()
      .eq('tenant_id', 1)

    if (deleteRepairError) {
      console.error('修理価格削除エラー:', deleteRepairError)
      return
    }

    // 修理価格データをJSから直接取得
    const REPAIR_PRICES = require('../data/repair-prices-iphone.js')
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
    const REPAIR_MENUS = [
      'TH-F', 'TH-L', 'HG-F', 'HG-L',
      'バッテリー', 'HGバッテリー',
      'コネクタ', 'リアカメラ', 'インカメラ', 'カメラ窓'
    ]

    const repairPricesData = []
    for (const model of IPHONE_MODELS) {
      const prices = REPAIR_PRICES[model]
      if (!prices) continue

      for (const menu of REPAIR_MENUS) {
        const price = prices[menu]
        if (price && price > 0) {
          repairPricesData.push({
            tenant_id: 1,
            model,
            repair_type: menu,
            price,
            is_active: true
          })
        }
      }
    }

    const { error: insertRepairError } = await supabase
      .from('m_repair_prices_iphone')
      .insert(repairPricesData)

    if (insertRepairError) {
      console.error('修理価格挿入エラー:', insertRepairError)
      return
    }
    console.log(`  ${repairPricesData.length}件の修理価格を登録しました`)

    // 2. パーツ原価をクリアして再投入
    console.log('\n2. パーツ原価（m_costs_hw）を更新中...')
    const { error: deleteCostError } = await supabase
      .from('m_costs_hw')
      .delete()
      .eq('tenant_id', 1)

    if (deleteCostError) {
      console.error('パーツ原価削除エラー:', deleteCostError)
      return
    }

    // 仕入先IDを取得
    const { data: suppliers } = await supabase
      .from('m_suppliers')
      .select('id, code')
      .eq('tenant_id', 1)

    const supplierMap = {}
    suppliers?.forEach(s => supplierMap[s.code] = s.id)
    console.log('  仕入先:', Object.keys(supplierMap).join(', '))

    const COSTS_HW = require('../data/costs-hw.js')
    const COSTS_AISAPO = require('../data/costs-aisapo.js')
    const MODELS_WITH_COLOR = ['SE', '6s', '7', '7P', '8', '8P']

    function repairTypeToPartsTypes(repairType, model) {
      const hasColor = MODELS_WITH_COLOR.includes(model)
      if (repairType === 'TH-F' || repairType === 'TH-L') {
        return hasColor ? ['TH-黒', 'TH-白'] : ['TH']
      }
      if (repairType === 'HG-F' || repairType === 'HG-L') {
        return hasColor ? ['HG-黒', 'HG-白'] : ['HG']
      }
      return [repairType]
    }

    function getCostKey(repairType) {
      if (repairType === 'TH-F') return 'TH-L'
      if (repairType === 'HG-F') return 'HG-L'
      return repairType
    }

    const costsData = []

    // HW原価
    for (const model of IPHONE_MODELS) {
      const costs = COSTS_HW[model]
      if (!costs) continue

      const addedPartsTypes = new Set()
      for (const menu of REPAIR_MENUS) {
        const costKey = getCostKey(menu)
        const cost = costs[costKey]
        if (!cost || cost <= 0) continue

        const partsTypes = repairTypeToPartsTypes(menu, model)
        for (const partsType of partsTypes) {
          if (addedPartsTypes.has(partsType)) continue
          addedPartsTypes.add(partsType)
          costsData.push({
            tenant_id: 1,
            model,
            parts_type: partsType,
            cost,
            is_active: true,
            supplier_id: supplierMap['hw']
          })
        }
      }
    }

    // アイサポ原価
    for (const model of IPHONE_MODELS) {
      const costs = COSTS_AISAPO[model]
      if (!costs) continue

      const addedPartsTypes = new Set()
      for (const menu of REPAIR_MENUS) {
        const costKey = getCostKey(menu)
        const cost = costs[costKey]
        if (!cost || cost <= 0) continue

        const partsTypes = repairTypeToPartsTypes(menu, model)
        for (const partsType of partsTypes) {
          if (addedPartsTypes.has(partsType)) continue
          addedPartsTypes.add(partsType)
          costsData.push({
            tenant_id: 1,
            model,
            parts_type: partsType,
            cost,
            is_active: true,
            supplier_id: supplierMap['aisapo']
          })
        }
      }
    }

    const { error: insertCostError } = await supabase
      .from('m_costs_hw')
      .insert(costsData)

    if (insertCostError) {
      console.error('パーツ原価挿入エラー:', insertCostError)
      return
    }
    console.log(`  ${costsData.length}件のパーツ原価を登録しました`)

    // 3. パーツ在庫をクリアして再投入
    console.log('\n3. パーツ在庫（t_parts_inventory）を更新中...')
    const { error: deleteInvError } = await supabase
      .from('t_parts_inventory')
      .delete()
      .eq('tenant_id', 1)

    if (deleteInvError) {
      console.error('パーツ在庫削除エラー:', deleteInvError)
      return
    }

    // 店舗IDを取得
    const { data: shops } = await supabase
      .from('m_shops')
      .select('id')
      .eq('tenant_id', 1)
      .eq('is_active', true)

    console.log(`  対象店舗: ${shops?.length || 0}店舗`)
    console.log(`  対象仕入先: ${Object.keys(supplierMap).length}社`)

    const PARTS_TYPE_ORDER = [
      'TH', 'TH-黒', 'TH-白',
      'HG', 'HG-黒', 'HG-白',
      'バッテリー', 'HGバッテリー',
      'コネクタ', 'リアカメラ', 'インカメラ', 'カメラ窓'
    ]

    const inventoryData = []
    for (const model of IPHONE_MODELS) {
      const prices = REPAIR_PRICES[model]
      if (!prices) continue

      const partsTypesForModel = new Set()
      for (const menu of REPAIR_MENUS) {
        const price = prices[menu]
        if (price && price > 0) {
          const partsTypes = repairTypeToPartsTypes(menu, model)
          partsTypes.forEach(pt => partsTypesForModel.add(pt))
        }
      }

      if (partsTypesForModel.size === 0) continue

      // ソート
      const sortedPartsTypes = [...partsTypesForModel].sort((a, b) => {
        const indexA = PARTS_TYPE_ORDER.indexOf(a)
        const indexB = PARTS_TYPE_ORDER.indexOf(b)
        if (indexA === -1 && indexB === -1) return a.localeCompare(b)
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })

      for (const shop of shops || []) {
        for (const supplier of suppliers || []) {
          for (const partsType of sortedPartsTypes) {
            inventoryData.push({
              tenant_id: 1,
              shop_id: shop.id,
              model,
              parts_type: partsType,
              supplier_id: supplier.id,
              required_qty: 2,
              actual_qty: 0
            })
          }
        }
      }
    }

    // バッチで挿入（1000件ずつ）
    const batchSize = 1000
    for (let i = 0; i < inventoryData.length; i += batchSize) {
      const batch = inventoryData.slice(i, i + batchSize)
      const { error: insertInvError } = await supabase
        .from('t_parts_inventory')
        .insert(batch)

      if (insertInvError) {
        console.error(`パーツ在庫挿入エラー (batch ${i}):`, insertInvError)
        return
      }
    }
    console.log(`  ${inventoryData.length}件のパーツ在庫を登録しました`)

    console.log('\n========================================')
    console.log('マスタデータ適用完了')
    console.log('========================================')

    // 確認
    console.log('\n【確認】')
    const { count: repairCount } = await supabase
      .from('m_repair_prices_iphone')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', 1)
    console.log(`修理価格: ${repairCount}件`)

    const { count: costCount } = await supabase
      .from('m_costs_hw')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', 1)
    console.log(`パーツ原価: ${costCount}件`)

    const { count: invCount } = await supabase
      .from('t_parts_inventory')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', 1)
    console.log(`パーツ在庫: ${invCount}件`)

  } catch (err) {
    console.error('エラー:', err)
  }
}

applyMasterData()
