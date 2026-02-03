/**
 * 価格計算の共有ユーティリティ
 *
 * 【重要】減額ルールの違い
 * - 買取: バッテリー90%未満は基準価格の10%減額（割合計算）
 * - 販売: すべてDBマスタから固定金額を取得（モデル・状態ごとに設定）
 */

// =====================================================
// 型定義
// =====================================================

/** 減額マスタの型（DBから取得） */
export type DeductionData = {
  deduction_type: string
  amount: number
}

/** 買取時の端末状態 */
export type BuybackCondition = {
  batteryPercent: number       // バッテリー残量（%）
  isServiceState: boolean      // サービス状態（バッテリー残量が取得できない）
  nwStatus: 'ok' | 'triangle' | 'cross'  // ネットワーク利用制限
  cameraStain: 'none' | 'minor' | 'major' // カメラ染み
  cameraBroken: boolean        // カメラ故障
  repairHistory: boolean       // 修理歴
}

/** 販売時の端末状態 */
export type SalesCondition = {
  batteryStatus: '90' | '80_89' | '79'  // バッテリー状態区分
  cameraStain: 'none' | 'minor' | 'major'
  nwStatus: 'ok' | 'triangle' | 'cross'
}

// =====================================================
// 定数（買取用）
// =====================================================

/** バッテリー減額率（買取時：90%未満で10%、80%未満/サービス状態で20%） */
export const BATTERY_DEDUCTION_RATE = 0.10
export const BATTERY_DEDUCTION_RATE_SEVERE = 0.20

/** バッテリー閾値 */
export const BATTERY_THRESHOLD = 90
export const BATTERY_THRESHOLD_SEVERE = 80

// =====================================================
// 買取減額計算
// =====================================================

/**
 * 買取減額を計算する
 *
 * 【ルール】すべて美品基準価格に対するパーセント減額
 * - バッテリー90%未満: 美品価格の10%減額
 * - バッテリー80%未満 or サービス状態: 美品価格の20%減額
 * - NW利用制限 △: 美品価格の20%減額
 * - NW利用制限 ×: 美品価格の40%減額
 * - カメラ染み（大小問わず）: 美品価格の20%減額
 * - カメラ窓割れ: 美品価格の10%減額
 * - 非正規修理歴あり: 美品価格の20%減額
 *
 * @param basePrice 該当ランクの基本買取価格
 * @param condition 端末状態
 * @param _deductions 減額マスタ（互換性のため残すが未使用）
 * @param bihinPrice 美品ランクの基準価格（減額計算のベース）
 * @returns 総減額金額
 */
export function calculateBuybackDeduction(
  basePrice: number,
  condition: BuybackCondition,
  _deductions: DeductionData[],
  bihinPrice?: number
): number {
  // 美品価格が渡されなければbasePriceを使用（後方互換）
  const referencePrice = bihinPrice ?? basePrice
  let totalDeduction = 0
  const { batteryPercent, isServiceState, nwStatus, cameraStain, cameraBroken, repairHistory } = condition

  // バッテリー減額
  if (isServiceState || batteryPercent < BATTERY_THRESHOLD_SEVERE) {
    // 80%未満 or サービス状態 → 20%減額
    totalDeduction += Math.round(referencePrice * BATTERY_DEDUCTION_RATE_SEVERE)
  } else if (batteryPercent < BATTERY_THRESHOLD) {
    // 90%未満 → 10%減額
    totalDeduction += Math.round(referencePrice * BATTERY_DEDUCTION_RATE)
  }

  // ネットワーク利用制限
  if (nwStatus === 'triangle') {
    totalDeduction += Math.round(referencePrice * 0.20)
  } else if (nwStatus === 'cross') {
    totalDeduction += Math.round(referencePrice * 0.40)
  }

  // カメラ染み（大小問わず20%）
  if (cameraStain === 'minor' || cameraStain === 'major') {
    totalDeduction += Math.round(referencePrice * 0.20)
  }

  // カメラ窓割れ（10%）
  if (cameraBroken) {
    totalDeduction += Math.round(referencePrice * 0.10)
  }

  // 非正規修理歴あり（20%）
  if (repairHistory) {
    totalDeduction += Math.round(referencePrice * 0.20)
  }

  return totalDeduction
}

// =====================================================
// 販売減額計算
// =====================================================

/**
 * 販売減額を計算する
 *
 * 【ルール】
 * - すべての項目がDBマスタから固定金額（モデルごとに設定）
 * - バッテリー80-89%: battery_80_89 の金額（例: 1000円）
 * - バッテリー79%以下/サービス状態: battery_79 の金額（例: 2000円）
 * - カメラ染み: camera_stain_minor / camera_stain_major
 * - NW制限: nw_triangle / nw_cross
 *
 * @param condition 端末状態
 * @param deductions 減額マスタ（m_sales_price_deductionsから取得）
 * @returns 総減額金額
 */
export function calculateSalesDeduction(
  condition: SalesCondition,
  deductions: DeductionData[]
): number {
  let totalDeduction = 0
  const { batteryStatus, cameraStain, nwStatus } = condition

  // ヘルパー関数
  const getDeduction = (type: string): number => {
    const found = deductions.find(d => d.deduction_type === type)
    return found?.amount || 0
  }

  // バッテリー減額（固定金額）
  if (batteryStatus === '80_89') {
    totalDeduction += getDeduction('battery_80_89')
  } else if (batteryStatus === '79') {
    totalDeduction += getDeduction('battery_79')
  }

  // カメラ染み減額（固定金額）
  if (cameraStain === 'minor') {
    totalDeduction += getDeduction('camera_stain_minor')
  } else if (cameraStain === 'major') {
    totalDeduction += getDeduction('camera_stain_major')
  }

  // NW制限減額（固定金額）
  if (nwStatus === 'triangle') {
    totalDeduction += getDeduction('nw_triangle')
  } else if (nwStatus === 'cross') {
    totalDeduction += getDeduction('nw_cross')
  }

  return totalDeduction
}
