/**
 * 中古在庫の販売価格を再計算するスクリプト
 *
 * 計算ロジック：
 * 1. m_sales_pricesから基準価格（税抜）を取得
 * 2. 在庫のバッテリー状態・NW制限・カメラ染みから減額を計算
 * 3. (基準価格 - 減額) × 1.1 = 税込販売価格
 *
 * 実行: npx ts-node scripts/recalc-sales-prices.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const DEFAULT_TENANT_ID = 1

type Inventory = {
  id: number
  model: string
  storage: number
  rank: string
  battery_percent: number | null
  is_service_state: boolean | null
  nw_status: string | null
  camera_stain_level: string | null
  sales_price: number | null
  status: string
}

type SalesPrice = {
  model: string
  storage: number
  rank: string
  price: number
}

type Deduction = {
  model: string
  deduction_type: string
  amount: number
}

async function main() {
  console.log('=== 中古在庫 販売価格再計算スクリプト ===\n')

  // 1. 販売済み以外の在庫を取得
  const { data: inventories, error: invError } = await supabase
    .from('t_used_inventory')
    .select('id, model, storage, rank, battery_percent, is_service_state, nw_status, camera_stain_level, sales_price, status')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .neq('status', '販売済')

  if (invError) {
    console.error('在庫取得エラー:', invError)
    return
  }

  console.log(`対象在庫数: ${inventories?.length || 0}件\n`)

  if (!inventories || inventories.length === 0) {
    console.log('対象在庫がありません')
    return
  }

  // 2. 販売価格マスタを取得
  const { data: salesPrices, error: priceError } = await supabase
    .from('m_sales_prices')
    .select('model, storage, rank, price')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .eq('is_active', true)

  if (priceError) {
    console.error('価格マスタ取得エラー:', priceError)
    return
  }

  // 3. 減額マスタを取得
  const { data: deductions, error: dedError } = await supabase
    .from('m_sales_price_deductions')
    .select('model, deduction_type, amount')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .eq('is_active', true)

  if (dedError) {
    console.error('減額マスタ取得エラー:', dedError)
    return
  }

  // マップに変換
  const priceMap = new Map<string, number>()
  for (const p of salesPrices || []) {
    const key = `${p.model}-${p.storage}-${p.rank}`
    priceMap.set(key, p.price)
  }

  const deductionMap = new Map<string, number>()
  for (const d of deductions || []) {
    const key = `${d.model}-${d.deduction_type}`
    deductionMap.set(key, d.amount)
  }

  // 4. 各在庫の販売価格を再計算
  const updates: { id: number; oldPrice: number | null; newPrice: number; model: string; rank: string }[] = []
  const noPrice: Inventory[] = []

  for (const inv of inventories as Inventory[]) {
    const priceKey = `${inv.model}-${inv.storage}-${inv.rank}`
    const basePrice = priceMap.get(priceKey)

    if (!basePrice) {
      noPrice.push(inv)
      continue
    }

    // 減額計算
    let deduction = 0

    // バッテリー減額
    if (inv.is_service_state || (inv.battery_percent !== null && inv.battery_percent < 80)) {
      deduction += deductionMap.get(`${inv.model}-battery_79`) || 0
    } else if (inv.battery_percent !== null && inv.battery_percent < 90) {
      deduction += deductionMap.get(`${inv.model}-battery_80_89`) || 0
    }

    // カメラ染み減額
    if (inv.camera_stain_level === 'minor') {
      deduction += deductionMap.get(`${inv.model}-camera_stain_minor`) || 0
    } else if (inv.camera_stain_level === 'major') {
      deduction += deductionMap.get(`${inv.model}-camera_stain_major`) || 0
    }

    // NW制限減額
    if (inv.nw_status === 'triangle') {
      deduction += deductionMap.get(`${inv.model}-nw_triangle`) || 0
    } else if (inv.nw_status === 'cross') {
      deduction += deductionMap.get(`${inv.model}-nw_cross`) || 0
    }

    // 税込価格 = (税抜基準価格 - 減額) × 1.1
    const taxExcluded = basePrice - deduction
    const taxIncluded = Math.round(taxExcluded * 1.1)

    updates.push({
      id: inv.id,
      oldPrice: inv.sales_price,
      newPrice: taxIncluded,
      model: inv.model,
      rank: inv.rank,
    })
  }

  // 5. 結果表示
  console.log('--- 価格変更一覧 ---')
  for (const u of updates) {
    const oldStr = u.oldPrice ? `¥${u.oldPrice.toLocaleString()}` : '未設定'
    const newStr = `¥${u.newPrice.toLocaleString()}`
    const diff = u.oldPrice ? u.newPrice - u.oldPrice : 0
    const diffStr = diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff.toLocaleString()})` : ''
    console.log(`ID ${u.id}: ${u.model} ${u.rank} | ${oldStr} → ${newStr}${diffStr}`)
  }

  if (noPrice.length > 0) {
    console.log('\n--- 基準価格なし（スキップ） ---')
    for (const inv of noPrice) {
      console.log(`ID ${inv.id}: ${inv.model} ${inv.storage}GB ${inv.rank}`)
    }
  }

  // 6. 更新確認
  console.log(`\n合計 ${updates.length}件を更新します。`)
  console.log('続行しますか？ (Ctrl+Cでキャンセル、Enterで続行)')

  // Node.jsで入力待ち
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => resolve())
  })

  // 7. 更新実行
  console.log('\n更新中...')
  let successCount = 0
  let errorCount = 0

  for (const u of updates) {
    const { error } = await supabase
      .from('t_used_inventory')
      .update({ sales_price: u.newPrice, updated_at: new Date().toISOString() })
      .eq('id', u.id)

    if (error) {
      console.error(`ID ${u.id} 更新エラー:`, error.message)
      errorCount++
    } else {
      successCount++
    }
  }

  console.log(`\n完了: ${successCount}件成功, ${errorCount}件エラー`)
}

main().catch(console.error)
