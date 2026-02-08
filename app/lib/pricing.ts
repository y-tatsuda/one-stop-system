/**
 * =====================================================
 * 【マスタ】価格計算の共有ユーティリティ
 * =====================================================
 *
 * 【重要】このファイルが価格計算の唯一のマスタです。
 * 買取・販売価格を計算する全てのページはこのファイルの関数を使用すること。
 *
 * 使用しているページ:
 * - /app/buyback/page.tsx（店頭買取・KIOSK経由）
 * - /app/buyback-mail/page.tsx（郵送買取管理）
 * - /app/liff/buyback/page.tsx（LIFF → リダイレクトのみ）
 * - /app/shop/buyback/apply/page.tsx（EC買取申込フォーム）
 * - /app/inventory/page.tsx（在庫管理・販売価格計算）
 *
 * 【減額ルールの違い】
 * - 買取: バッテリー90%未満は基準価格の10%減額（割合計算）
 * - 販売: 固定金額（モデル世代・状態ごとに設定）
 *
 * 新しいページを作成する場合は、必ずこのファイルの関数を使用し、
 * 独自の計算ロジックを実装しないこと。
 * =====================================================
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
  model: string                          // iPhoneモデル（例: '12', '13Pro'）
  batteryPercent: number | null          // バッテリー残量（%）
  isServiceState: boolean                // サービス状態
  cameraStain: 'none' | 'minor' | 'major'
  nwStatus: 'ok' | 'triangle' | 'cross'
}

// =====================================================
// 販売減額の定数
// =====================================================

/** バッテリー減額（全モデル共通） */
export const SALES_BATTERY_DEDUCTION = {
  PERCENT_90_PLUS: 0,      // 90%以上: 減額なし
  PERCENT_80_89: 1000,     // 89〜80%: 1,000円減額
  PERCENT_79_OR_SERVICE: 2000,  // 79%以下またはサービス状態: 2,000円減額
}

/** カメラ染み減額（モデル世代別） */
export const SALES_CAMERA_STAIN_DEDUCTION = {
  // 〜11までのモデル
  GEN_11_OR_EARLIER: { minor: 1000, major: 1000 },
  // 12
  GEN_12: { minor: 2000, major: 3000 },
  // 13以降
  GEN_13_OR_LATER: { minor: 3000, major: 5000 },
}

/** NW利用制限減額（モデル世代別） */
export const SALES_NW_DEDUCTION = {
  // 〜11までのモデル
  GEN_11_OR_EARLIER: { triangle: 1000, cross: 1000 },
  // 12
  GEN_12: { triangle: 2000, cross: 3000 },
  // 13以降
  GEN_13_OR_LATER: { triangle: 3000, cross: 5000 },
}

/**
 * モデル名から世代を判定する
 * @param model モデル名（例: '12', '13Pro', 'SE3'）
 * @returns 'gen_11_or_earlier' | 'gen_12' | 'gen_13_or_later'
 */
export function getModelGeneration(model: string): 'gen_11_or_earlier' | 'gen_12' | 'gen_13_or_later' {
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
 * 【ルール】固定金額（モデル世代・状態ごと）
 *
 * ■ バッテリー減額（全モデル共通）
 * - 90%以上: 減額なし
 * - 89〜80%: 1,000円減額
 * - 79%以下またはサービス状態: 2,000円減額
 *
 * ■ カメラ染み減額
 * - 〜11まで: 少1,000円 / 多1,000円
 * - 12: 少2,000円 / 多3,000円
 * - 13以降: 少3,000円 / 多5,000円
 *
 * ■ NW利用制限減額
 * - 〜11まで: △1,000円 / ×1,000円
 * - 12: △2,000円 / ×3,000円
 * - 13以降: △3,000円 / ×5,000円
 *
 * @param condition 端末状態（モデル含む）
 * @returns 総減額金額
 */
export function calculateSalesDeduction(condition: SalesCondition): number {
  let totalDeduction = 0
  const { model, batteryPercent, isServiceState, cameraStain, nwStatus } = condition

  // モデル世代を判定
  const generation = getModelGeneration(model)

  // バッテリー減額（全モデル共通）
  if (isServiceState || (batteryPercent !== null && batteryPercent < 80)) {
    totalDeduction += SALES_BATTERY_DEDUCTION.PERCENT_79_OR_SERVICE
  } else if (batteryPercent !== null && batteryPercent < 90) {
    totalDeduction += SALES_BATTERY_DEDUCTION.PERCENT_80_89
  }

  // カメラ染み減額（モデル世代別）
  if (cameraStain === 'minor' || cameraStain === 'major') {
    const deductionTable = generation === 'gen_11_or_earlier'
      ? SALES_CAMERA_STAIN_DEDUCTION.GEN_11_OR_EARLIER
      : generation === 'gen_12'
        ? SALES_CAMERA_STAIN_DEDUCTION.GEN_12
        : SALES_CAMERA_STAIN_DEDUCTION.GEN_13_OR_LATER

    totalDeduction += cameraStain === 'minor' ? deductionTable.minor : deductionTable.major
  }

  // NW利用制限減額（モデル世代別）
  if (nwStatus === 'triangle' || nwStatus === 'cross') {
    const deductionTable = generation === 'gen_11_or_earlier'
      ? SALES_NW_DEDUCTION.GEN_11_OR_EARLIER
      : generation === 'gen_12'
        ? SALES_NW_DEDUCTION.GEN_12
        : SALES_NW_DEDUCTION.GEN_13_OR_LATER

    totalDeduction += nwStatus === 'triangle' ? deductionTable.triangle : deductionTable.cross
  }

  return totalDeduction
}
