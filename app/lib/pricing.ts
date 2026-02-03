/**
 * 価格計算の共有ユーティリティ
 * 買取・販売の両方で使用される計算ロジックを集約
 */

import { supabase } from './supabase'

// =====================================================
// 型定義
// =====================================================
export type DeductionData = { deduction_type: string; amount: number }

export type BuybackCondition = {
  batteryPercent: number
  isServiceState: boolean
  nwStatus: 'ok' | 'triangle' | 'cross'
  cameraStain: 'none' | 'minor' | 'major'
  cameraBroken: boolean
  repairHistory: boolean
}

export type SalesCondition = {
  batteryPercent: number
  isServiceState: boolean
  cameraStain: 'none' | 'minor'
  nwStatus: 'ok' | 'ng'
}

export type PriceResult = {
  basePrice: number
  totalDeduction: number
  calculatedPrice: number
  guaranteePrice: number
  finalPrice: number
}

export type SalesPriceResult = {
  basePrice: number
  deductionTotal: number
  finalPrice: number
}

// =====================================================
// 定数
// =====================================================

// バッテリー減額率（90%未満で10%減額）
export const BATTERY_DEDUCTION_RATE = 0.10

// バッテリー閾値
export const BATTERY_THRESHOLD = 90

// =====================================================
// 買取価格計算
// =====================================================

/**
 * 買取減額を計算する
 * @param basePrice 基本買取価格
 * @param condition 状態条件
 * @param deductions DB減額マスタ（固定金額用）
 * @returns 総減額金額
 */
export function calculateBuybackDeduction(
  basePrice: number,
  condition: BuybackCondition,
  deductions: DeductionData[]
): number {
  let totalDeduction = 0
  const { batteryPercent, isServiceState, nwStatus, cameraStain, cameraBroken, repairHistory } = condition

  // バッテリー減額（90%未満で10%減額）
  if (isServiceState || batteryPercent < BATTERY_THRESHOLD) {
    // 10%減額（割合計算）
    totalDeduction += Math.round(basePrice * BATTERY_DEDUCTION_RATE)
  }

  // ネットワーク利用制限
  if (nwStatus === 'triangle') {
    const d = deductions.find(d => d.deduction_type === 'nw_checking')
    if (d) totalDeduction += d.amount
  } else if (nwStatus === 'cross') {
    const d = deductions.find(d => d.deduction_type === 'nw_ng')
    if (d) totalDeduction += d.amount
  }

  // カメラシミ
  if (cameraStain === 'minor' || cameraStain === 'major') {
    const d = deductions.find(d => d.deduction_type === 'camera_stain')
    if (d) totalDeduction += d.amount
  }

  // カメラ故障
  if (cameraBroken) {
    const d = deductions.find(d => d.deduction_type === 'camera_broken')
    if (d) totalDeduction += d.amount
  }

  // 修理歴あり
  if (repairHistory) {
    const d = deductions.find(d => d.deduction_type === 'repair_history')
    if (d) totalDeduction += d.amount
  }

  return totalDeduction
}

/**
 * 買取価格を計算する
 * @param basePrice 基本買取価格
 * @param guaranteePrice 最低保証価格
 * @param condition 状態条件
 * @param deductions DB減額マスタ
 * @returns 計算結果
 */
export function calculateBuybackPrice(
  basePrice: number,
  guaranteePrice: number,
  condition: BuybackCondition,
  deductions: DeductionData[]
): PriceResult {
  const totalDeduction = calculateBuybackDeduction(basePrice, condition, deductions)
  const calculatedPrice = basePrice - totalDeduction
  const finalPrice = Math.max(calculatedPrice, guaranteePrice)

  return {
    basePrice,
    totalDeduction,
    calculatedPrice,
    guaranteePrice,
    finalPrice
  }
}

// =====================================================
// 販売価格計算
// =====================================================

/**
 * 販売減額を計算する
 * @param basePrice 基本販売価格
 * @param condition 状態条件
 * @param deductions DB減額マスタ（固定金額用）
 * @returns 総減額金額
 */
export function calculateSalesDeduction(
  basePrice: number,
  condition: SalesCondition,
  deductions: DeductionData[]
): number {
  let totalDeduction = 0
  const { batteryPercent, isServiceState } = condition

  // バッテリー減額（90%未満で10%減額）
  if (isServiceState || batteryPercent < BATTERY_THRESHOLD) {
    // 10%減額（割合計算）
    totalDeduction += Math.round(basePrice * BATTERY_DEDUCTION_RATE)
  }

  // 他の減額項目はDBから取得（必要に応じて追加）

  return totalDeduction
}

/**
 * 販売価格を計算する
 * @param basePrice 基本販売価格
 * @param condition 状態条件
 * @param deductions DB減額マスタ
 * @returns 計算結果
 */
export function calculateSalesPrice(
  basePrice: number,
  condition: SalesCondition,
  deductions: DeductionData[]
): SalesPriceResult {
  const deductionTotal = calculateSalesDeduction(basePrice, condition, deductions)
  const finalPrice = basePrice - deductionTotal

  return {
    basePrice,
    deductionTotal,
    finalPrice
  }
}

// =====================================================
// データ取得ヘルパー
// =====================================================

/**
 * 買取価格マスタを取得
 */
export async function fetchBuybackPrice(
  model: string,
  storage: number,
  rank: string
): Promise<number> {
  const { data } = await supabase
    .from('m_buyback_prices')
    .select('price')
    .eq('tenant_id', 1)
    .eq('model', model)
    .eq('storage', storage)
    .eq('rank', rank)
    .single()

  return data?.price || 0
}

/**
 * 買取減額マスタを取得
 */
export async function fetchBuybackDeductions(
  model: string,
  storage: number
): Promise<DeductionData[]> {
  const { data } = await supabase
    .from('m_buyback_deductions')
    .select('deduction_type, amount')
    .eq('tenant_id', 1)
    .eq('model', model)
    .eq('storage', storage)
    .eq('is_active', true)

  return data || []
}

/**
 * 最低保証価格を取得
 */
export async function fetchGuaranteePrice(
  model: string,
  storage: number
): Promise<number> {
  const { data } = await supabase
    .from('m_buyback_guarantees')
    .select('guarantee_price')
    .eq('tenant_id', 1)
    .eq('model', model)
    .eq('storage', storage)
    .single()

  return data?.guarantee_price || 0
}

/**
 * 販売価格マスタを取得
 */
export async function fetchSalesPrice(
  model: string,
  storage: number,
  rank: string
): Promise<number> {
  const { data } = await supabase
    .from('m_sales_prices')
    .select('price')
    .eq('tenant_id', 1)
    .eq('model', model)
    .eq('storage', storage)
    .eq('rank', rank)
    .single()

  return data?.price || 0
}

/**
 * 販売減額マスタを取得
 */
export async function fetchSalesDeductions(
  model: string
): Promise<DeductionData[]> {
  const { data } = await supabase
    .from('m_sales_price_deductions')
    .select('deduction_type, amount')
    .eq('tenant_id', 1)
    .eq('model', model)
    .eq('is_active', true)

  return data || []
}
