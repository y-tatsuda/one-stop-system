/**
 * 中古在庫の販売価格を再計算するスクリプト
 *
 * 計算ロジック：
 * 1. m_sales_pricesから基準価格（税込）を取得
 * 2. 固定減額ルールで減額を計算
 * 3. 基準価格 - 減額 = 販売価格（税込）
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

// =====================================================
// 固定減額ルール（pricing.tsと同じ）
// =====================================================

/** バッテリー減額（全モデル共通） */
const SALES_BATTERY_DEDUCTION = {
  PERCENT_90_PLUS: 0,           // 90%以上: 減額なし
  PERCENT_80_89: 1000,          // 89〜80%: 1,000円減額
  PERCENT_79_OR_SERVICE: 2000,  // 79%以下またはサービス状態: 2,000円減額
}

/** カメラ染み減額（モデル世代別） */
const SALES_CAMERA_STAIN_DEDUCTION = {
  GEN_11_OR_EARLIER: { minor: 1000, major: 1000 },
  GEN_12: { minor: 2000, major: 3000 },
  GEN_13_OR_LATER: { minor: 3000, major: 5000 },
}

/** NW利用制限減額（モデル世代別） */
const SALES_NW_DEDUCTION = {
  GEN_11_OR_EARLIER: { triangle: 1000, cross: 1000 },
  GEN_12: { triangle: 2000, cross: 3000 },
  GEN_13_OR_LATER: { triangle: 3000, cross: 5000 },
}

/**
 * モデル名から世代を判定する
 */
function getModelGeneration(model: string): 'gen_11_or_earlier' | 'gen_12' | 'gen_13_or_later' {
  const m = model.toLowerCase()

  // 13以降のモデル
  if (m.startsWith('13') || m.startsWith('14') || m.startsWith('15') ||
      m.startsWith('16') || m.startsWith('17') || m === 'se3' || m === 'air') {
    return 'gen_13_or_later'
  }

  // 12シリーズ
  if (m.startsWith('12')) {
    return 'gen_12'
  }

  // 11以前（SE2含む）
  return 'gen_11_or_earlier'
}

/**
 * 販売減額を計算する
 */
function calculateDeduction(inv: Inventory): number {
  let totalDeduction = 0
  const generation = getModelGeneration(inv.model)

  // バッテリー減額（全モデル共通）
  if (inv.is_service_state || (inv.battery_percent !== null && inv.battery_percent < 80)) {
    totalDeduction += SALES_BATTERY_DEDUCTION.PERCENT_79_OR_SERVICE
  } else if (inv.battery_percent !== null && inv.battery_percent < 90) {
    totalDeduction += SALES_BATTERY_DEDUCTION.PERCENT_80_89
  }

  // カメラ染み減額（モデル世代別）
  if (inv.camera_stain_level === 'minor' || inv.camera_stain_level === 'major') {
    const deductionTable = generation === 'gen_11_or_earlier'
      ? SALES_CAMERA_STAIN_DEDUCTION.GEN_11_OR_EARLIER
      : generation === 'gen_12'
        ? SALES_CAMERA_STAIN_DEDUCTION.GEN_12
        : SALES_CAMERA_STAIN_DEDUCTION.GEN_13_OR_LATER

    totalDeduction += inv.camera_stain_level === 'minor' ? deductionTable.minor : deductionTable.major
  }

  // NW利用制限減額（モデル世代別）
  if (inv.nw_status === 'triangle' || inv.nw_status === 'cross') {
    const deductionTable = generation === 'gen_11_or_earlier'
      ? SALES_NW_DEDUCTION.GEN_11_OR_EARLIER
      : generation === 'gen_12'
        ? SALES_NW_DEDUCTION.GEN_12
        : SALES_NW_DEDUCTION.GEN_13_OR_LATER

    totalDeduction += inv.nw_status === 'triangle' ? deductionTable.triangle : deductionTable.cross
  }

  return totalDeduction
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

  // 2. 販売価格マスタを取得（税込価格）
  const { data: salesPrices, error: priceError } = await supabase
    .from('m_sales_prices')
    .select('model, storage, rank, price')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .eq('is_active', true)

  if (priceError) {
    console.error('価格マスタ取得エラー:', priceError)
    return
  }

  // マップに変換
  const priceMap = new Map<string, number>()
  for (const p of salesPrices || []) {
    const key = `${p.model}-${p.storage}-${p.rank}`
    priceMap.set(key, p.price)
  }

  // 3. 各在庫の販売価格を再計算（固定減額ルール使用）
  const updates: { id: number; oldPrice: number | null; newPrice: number; model: string; rank: string; deduction: number }[] = []
  const noPrice: Inventory[] = []

  for (const inv of inventories as Inventory[]) {
    const priceKey = `${inv.model}-${inv.storage}-${inv.rank}`
    const basePrice = priceMap.get(priceKey)

    if (!basePrice) {
      noPrice.push(inv)
      continue
    }

    // 固定減額ルールで計算
    const deduction = calculateDeduction(inv)

    // 税込価格 = 基準価格（税込） - 減額
    const finalPrice = basePrice - deduction

    updates.push({
      id: inv.id,
      oldPrice: inv.sales_price,
      newPrice: finalPrice,
      model: inv.model,
      rank: inv.rank,
      deduction,
    })
  }

  // 4. 結果表示
  console.log('--- 価格変更一覧 ---')
  for (const u of updates) {
    const oldStr = u.oldPrice ? `¥${u.oldPrice.toLocaleString()}` : '未設定'
    const newStr = `¥${u.newPrice.toLocaleString()}`
    const diff = u.oldPrice ? u.newPrice - u.oldPrice : 0
    const diffStr = diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff.toLocaleString()})` : ''
    const dedStr = u.deduction > 0 ? ` [減額: ¥${u.deduction.toLocaleString()}]` : ''
    console.log(`ID ${u.id}: ${u.model} ${u.rank} | ${oldStr} → ${newStr}${diffStr}${dedStr}`)
  }

  if (noPrice.length > 0) {
    console.log('\n--- 基準価格なし（スキップ） ---')
    for (const inv of noPrice) {
      console.log(`ID ${inv.id}: ${inv.model} ${inv.storage}GB ${inv.rank}`)
    }
  }

  // 5. 更新確認
  console.log(`\n合計 ${updates.length}件を更新します。`)
  console.log('続行しますか？ (Ctrl+Cでキャンセル、Enterで続行)')

  // Node.jsで入力待ち
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => resolve())
  })

  // 6. 更新実行
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
