/**
 * =====================================================
 * 郵送買取 完了API（在庫登録 & 削除 & 振込完了通知）
 * =====================================================
 *
 * 振込待ちの郵送買取を完了し、在庫に登録する
 * 既存の店頭買取と同じテーブル構造を使用:
 * 1. t_customers に顧客登録
 * 2. t_buyback にヘッダー登録
 * 3. t_used_inventory に在庫登録（複数アイテム対応）
 * 4. t_buyback_items に明細登録（複数アイテム対応）
 * 5. 振込完了通知（LINE/メール）を送信
 * 6. t_mail_buyback_requests を DELETE
 *
 * 【重要】トランザクション処理
 * - エラー発生時は作成済みデータを削除してロールバック
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'
import { requireAuth } from '@/app/lib/auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

// =====================================================
// 販売価格計算ロジック（recalc-sales-prices.tsと同じ）
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
function calculateSalesDeduction(
  model: string,
  batteryPercent: number | null,
  isServiceState: boolean,
  nwStatus: string | null,
  cameraStainLevel: string | null
): number {
  let totalDeduction = 0
  const generation = getModelGeneration(model)

  // バッテリー減額（全モデル共通）
  if (isServiceState || (batteryPercent !== null && batteryPercent < 80)) {
    totalDeduction += SALES_BATTERY_DEDUCTION.PERCENT_79_OR_SERVICE
  } else if (batteryPercent !== null && batteryPercent < 90) {
    totalDeduction += SALES_BATTERY_DEDUCTION.PERCENT_80_89
  }

  // カメラ染み減額（モデル世代別）
  if (cameraStainLevel === 'minor' || cameraStainLevel === 'major') {
    const deductionTable = generation === 'gen_11_or_earlier'
      ? SALES_CAMERA_STAIN_DEDUCTION.GEN_11_OR_EARLIER
      : generation === 'gen_12'
        ? SALES_CAMERA_STAIN_DEDUCTION.GEN_12
        : SALES_CAMERA_STAIN_DEDUCTION.GEN_13_OR_LATER

    totalDeduction += cameraStainLevel === 'minor' ? deductionTable.minor : deductionTable.major
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

// =====================================================
// 型定義
// =====================================================

type ItemChange = {
  field: string
  label: string
  beforeValue: string
  afterValue: string
  hasChanged: boolean
}

type AssessmentDetails = {
  item_changes: ItemChange[]
  photos: string[]
  notes: string
}

type MailBuybackItem = {
  model?: string
  modelDisplayName: string
  storage: string
  rank: string
  basePrice?: number
  estimatedPrice: number
  color?: string
  batteryPercent?: number
  isServiceState?: boolean
  imei?: string
  nwStatus?: string
  cameraStain?: string
  cameraBroken?: boolean
  repairHistory?: boolean
}

type MailBuybackRequest = {
  id: number
  request_number: string
  status: string
  customer_name: string
  customer_name_kana: string | null
  birth_year: string | null
  birth_month: string | null
  birth_day: string | null
  occupation: string | null
  phone: string
  email: string | null
  postal_code: string | null
  address: string | null
  address_detail: string | null
  line_user_id: string | null
  source: 'web' | 'liff'
  items: MailBuybackItem[]
  total_estimated_price: number
  final_price: number | null
  assessment_details: AssessmentDetails | null
  agreement_document_path: string | null
  bank_name: string | null
  branch_name: string | null
  account_type: string | null
  account_number: string | null
  account_holder: string | null
}

// ロールバック用：作成したデータを削除
async function rollback(customerId?: number, buybackId?: number, inventoryIds?: number[]) {
  console.log('ロールバック実行中...', { customerId, buybackId, inventoryIds })

  try {
    // 明細削除
    if (buybackId) {
      await supabaseAdmin
        .from('t_buyback_items')
        .delete()
        .eq('buyback_id', buybackId)
    }

    // 在庫削除
    if (inventoryIds && inventoryIds.length > 0) {
      await supabaseAdmin
        .from('t_used_inventory')
        .delete()
        .in('id', inventoryIds)
    }

    // 買取ヘッダー削除
    if (buybackId) {
      await supabaseAdmin
        .from('t_buyback')
        .delete()
        .eq('id', buybackId)
    }

    // 顧客削除
    if (customerId) {
      await supabaseAdmin
        .from('t_customers')
        .delete()
        .eq('id', customerId)
    }

    console.log('ロールバック完了')
  } catch (rollbackError) {
    console.error('ロールバックエラー:', rollbackError)
  }
}

export async function POST(request: NextRequest) {
  // ロールバック用の変数
  let customerId: number | undefined
  let buybackId: number | undefined
  const inventoryIds: number[] = []

  try {
    // 認可チェック（スタッフ以上が操作可能）
    const authResult = await requireAuth(request.headers.get('authorization'))
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.message },
        { status: authResult.status }
      )
    }

    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'requestIdが必要です' },
        { status: 400 }
      )
    }

    // 郵送買取データを取得
    const { data: reqData, error: fetchError } = await supabaseAdmin
      .from('t_mail_buyback_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !reqData) {
      return NextResponse.json(
        { success: false, error: 'データが見つかりません' },
        { status: 404 }
      )
    }

    const mailReq = reqData as MailBuybackRequest

    // ステータスチェック（waiting_paymentのみ完了可能）
    if (mailReq.status !== 'waiting_payment') {
      return NextResponse.json(
        { success: false, error: '振込待ちステータスのみ完了できます' },
        { status: 400 }
      )
    }

    // 認証ユーザーの店舗ID・スタッフIDを取得
    let shopId = 1
    let staffId = 1
    if (authResult.auth?.staffId) {
      const { data: staffData } = await supabaseAdmin
        .from('m_staff')
        .select('id, shop_id')
        .eq('id', authResult.auth.staffId)
        .single()
      if (staffData) {
        staffId = staffData.id
        if (staffData.shop_id) {
          shopId = staffData.shop_id
        }
      }
    }

    const changes = mailReq.assessment_details?.item_changes || []
    const buybackPrice = mailReq.final_price || mailReq.total_estimated_price
    const now = new Date()
    const buybackDate = now.toISOString().split('T')[0]

    // 生年月日を組み立て
    const birthDate = mailReq.birth_year && mailReq.birth_month && mailReq.birth_day
      ? `${mailReq.birth_year}-${String(mailReq.birth_month).padStart(2, '0')}-${String(mailReq.birth_day).padStart(2, '0')}`
      : null

    // 本査定後の値を取得するヘルパー関数
    const getChangedValue = (field: string, original: unknown): unknown => {
      const change = changes.find(c => c.field === field && c.hasChanged)
      if (change) {
        if (field === 'batteryPercent') {
          return parseInt(change.afterValue.replace('%', '')) || original
        }
        if (field === 'cameraBroken' || field === 'repairHistory') {
          return change.afterValue === 'yes'
        }
        return change.afterValue
      }
      return original
    }

    // ========================================
    // 1. 顧客登録（t_customers）
    // ========================================
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('t_customers')
      .insert({
        tenant_id: 1,
        name: mailReq.customer_name,
        name_kana: mailReq.customer_name_kana,
        birth_date: birthDate,
        phone: mailReq.phone || '',
        address: [mailReq.address || '', mailReq.address_detail || ''].filter(Boolean).join(' '),
      })
      .select()
      .single()

    if (customerError || !customerData) {
      console.error('顧客登録エラー:', customerError)
      return NextResponse.json(
        { success: false, error: `顧客登録に失敗しました: ${customerError?.message}` },
        { status: 500 }
      )
    }
    customerId = customerData.id

    // 1台目のアイテム情報（買取ヘッダー用の後方互換）
    const firstItem = mailReq.items[0]
    const firstItemRank = getChangedValue('rank', firstItem?.rank || '良品') as string
    const firstItemBattery = getChangedValue('batteryPercent', firstItem?.batteryPercent || 80) as number
    const firstItemNwStatus = getChangedValue('nwStatus', firstItem?.nwStatus || 'ok') as string
    const firstItemCameraStain = getChangedValue('cameraStain', firstItem?.cameraStain || 'none') as string
    const firstItemCameraBroken = getChangedValue('cameraBroken', firstItem?.cameraBroken || false) as boolean
    const firstItemRepairHistory = getChangedValue('repairHistory', firstItem?.repairHistory || false) as boolean

    // ========================================
    // 2. 買取ヘッダー登録（t_buyback）
    // ========================================
    const { data: buybackData, error: buybackError } = await supabaseAdmin
      .from('t_buyback')
      .insert({
        customer_id: customerData.id,
        tenant_id: 1,
        shop_id: shopId,
        staff_id: staffId,
        buyback_date: buybackDate,
        buyback_type: 'mail',
        item_count: mailReq.items.length,
        total_buyback_price: buybackPrice,
        total_sales_price: 0,
        total_expected_profit: 0,
        customer_name: mailReq.customer_name,
        customer_birth_date: birthDate,
        customer_postal_code: mailReq.postal_code,
        customer_address: mailReq.address,
        customer_address_detail: mailReq.address_detail,
        customer_occupation: mailReq.occupation,
        customer_phone: mailReq.phone,
        id_verified: true,
        id_verification_method: 'image',
        consent_completed: true,
        consent_image_url: mailReq.agreement_document_path,
        payment_method: 'transfer',
        bank_name: mailReq.bank_name,
        bank_branch: mailReq.branch_name,
        bank_account_type: mailReq.account_type,
        bank_account_number: mailReq.account_number,
        bank_account_holder: mailReq.account_holder,
        // 後方互換性（1台目のアイテム情報）
        model: firstItem?.model || firstItem?.modelDisplayName,
        storage: parseInt(firstItem?.storage) || 128,
        rank: firstItemRank,
        imei: firstItem?.imei,
        battery_percent: firstItemBattery,
        nw_status: firstItemNwStatus,
        camera_broken: firstItemCameraBroken,
        camera_stain: firstItemCameraStain !== 'none',
        repair_history: firstItemRepairHistory,
        base_price: firstItem?.basePrice || firstItem?.estimatedPrice || buybackPrice,
        total_deduction: 0,
        final_price: buybackPrice,
        needs_repair: false,
        repair_cost: 0,
        memo: `郵送買取 ${mailReq.request_number}`,
      })
      .select()
      .single()

    if (buybackError || !buybackData) {
      console.error('買取ヘッダー登録エラー:', buybackError)
      await rollback(customerId)
      return NextResponse.json(
        { success: false, error: `買取登録に失敗しました: ${buybackError?.message}` },
        { status: 500 }
      )
    }
    buybackId = buybackData.id

    // ========================================
    // 3 & 4. 各アイテムの在庫登録と明細登録（複数対応）
    // ========================================
    for (let i = 0; i < mailReq.items.length; i++) {
      const item = mailReq.items[i]

      // 各アイテムの本査定後の値を取得
      const itemRank = getChangedValue('rank', item?.rank || '良品') as string
      const itemBattery = getChangedValue('batteryPercent', item?.batteryPercent || 80) as number
      const itemNwStatus = getChangedValue('nwStatus', item?.nwStatus || 'ok') as string
      const itemCameraStain = getChangedValue('cameraStain', item?.cameraStain || 'none') as string
      const itemCameraBroken = getChangedValue('cameraBroken', item?.cameraBroken || false) as boolean
      const itemRepairHistory = getChangedValue('repairHistory', item?.repairHistory || false) as boolean
      const itemIsServiceState = item?.isServiceState || false

      // 各アイテムの価格（複数台の場合は均等割りではなく個別価格を使用）
      const itemPrice = item?.estimatedPrice || Math.floor(buybackPrice / mailReq.items.length)

      // 販売価格を計算（m_sales_pricesから基準価格を取得）
      const modelCode = item?.model || item?.modelDisplayName || 'unknown'
      const storageNum = parseInt(item?.storage) || 128
      let salesPrice: number | null = null

      try {
        const { data: salesPriceData } = await supabaseAdmin
          .from('m_sales_prices')
          .select('price')
          .eq('tenant_id', 1)
          .eq('model', modelCode)
          .eq('storage', storageNum)
          .eq('rank', itemRank)
          .eq('is_active', true)
          .single()

        if (salesPriceData?.price) {
          // 減額を計算して販売価格を決定
          const salesDeduction = calculateSalesDeduction(
            modelCode,
            itemBattery,
            itemIsServiceState,
            itemNwStatus,
            itemCameraStain
          )
          salesPrice = salesPriceData.price - salesDeduction
        }
      } catch (priceErr) {
        console.log(`販売価格マスタなし: ${modelCode} ${storageNum}GB ${itemRank}`)
      }

      // 在庫登録（t_used_inventory）
      const { data: inventoryData, error: inventoryError } = await supabaseAdmin
        .from('t_used_inventory')
        .insert({
          tenant_id: 1,
          shop_id: shopId,
          arrival_date: buybackDate,
          model: modelCode,
          storage: storageNum,
          rank: itemRank,
          color: item?.color || null,
          imei: item?.imei || null,
          management_number: item?.imei ? item.imei.slice(-4) : `${mailReq.request_number}-${i + 1}`,
          battery_percent: itemBattery,
          is_service_state: itemIsServiceState,
          nw_status: itemNwStatus,
          camera_stain_level: itemCameraStain,
          camera_broken: itemCameraBroken,
          repair_history: itemRepairHistory,
          buyback_price: itemPrice,
          repair_cost: 0,
          total_cost: itemPrice,
          sales_price: salesPrice,
          status: '販売可',
          buyback_id: buybackId,
          memo: `郵送買取 ${mailReq.request_number} より登録（${i + 1}/${mailReq.items.length}台目）`,
        })
        .select()
        .single()

      if (inventoryError || !inventoryData) {
        console.error(`在庫登録エラー (${i + 1}台目):`, inventoryError)
        await rollback(customerId, buybackId, inventoryIds)
        return NextResponse.json(
          { success: false, error: `在庫登録に失敗しました (${i + 1}台目): ${inventoryError?.message}` },
          { status: 500 }
        )
      }
      inventoryIds.push(inventoryData.id)

      // 明細登録（t_buyback_items）
      const { error: itemError } = await supabaseAdmin
        .from('t_buyback_items')
        .insert({
          tenant_id: 1,
          buyback_id: buybackId,
          item_number: i + 1,
          model: item?.model || item?.modelDisplayName,
          storage: parseInt(item?.storage) || 128,
          rank: itemRank,
          color: item?.color || null,
          imei: item?.imei || null,
          battery_percent: itemBattery,
          is_service_state: itemIsServiceState,
          nw_status: itemNwStatus,
          camera_stain: itemCameraStain,
          camera_broken: itemCameraBroken,
          repair_history: itemRepairHistory,
          needs_repair: false,
          repair_cost: 0,
          base_price: item?.basePrice || itemPrice,
          total_deduction: 0,
          calculated_price: itemPrice,
          guarantee_price: 0,
          special_price_enabled: false,
          final_price: itemPrice,
          sales_price: 0,
          expected_profit: 0,
          used_inventory_id: inventoryData.id,
        })

      if (itemError) {
        console.error(`明細登録エラー (${i + 1}台目):`, itemError)
        await rollback(customerId, buybackId, inventoryIds)
        return NextResponse.json(
          { success: false, error: `明細登録に失敗しました (${i + 1}台目): ${itemError.message}` },
          { status: 500 }
        )
      }
    }

    // 買取ヘッダーにused_inventory_idを更新（1台目のみ、後方互換）
    if (inventoryIds.length > 0) {
      await supabaseAdmin
        .from('t_buyback')
        .update({ used_inventory_id: inventoryIds[0] })
        .eq('id', buybackId)
    }

    // ========================================
    // 5. 振込完了通知を送信（削除前に実行）
    // ========================================
    const finalPrice = mailReq.final_price || mailReq.total_estimated_price
    const isLiff = mailReq.source === 'liff' && mailReq.line_user_id

    if (isLiff) {
      // LINE通知
      try {
        const message = `💰 お振込みが完了しました

${mailReq.customer_name} 様

買取代金のお振込みが完了いたしました。

【申込番号】${mailReq.request_number}
【振込金額】¥${finalPrice.toLocaleString()}

この度はご利用いただき、誠にありがとうございました。
またのご利用をお待ちしております。`

        const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            to: mailReq.line_user_id,
            messages: [{ type: 'text', text: message }],
          }),
        })

        if (!lineRes.ok) {
          console.error('LINE通知失敗:', await lineRes.text())
        }
      } catch (lineErr) {
        console.error('LINE通知エラー:', lineErr)
      }
    } else if (mailReq.email) {
      // メール通知
      try {
        await resend.emails.send({
          from: 'ONE STOP <noreply@and-and.net>',
          to: mailReq.email,
          subject: `【ONE STOP】お振込みが完了しました（${mailReq.request_number}）`,
          text: `${mailReq.customer_name} 様

買取代金のお振込みが完了いたしました。

■ 申込番号: ${mailReq.request_number}
■ 振込金額: ¥${finalPrice.toLocaleString()}

お振込先:
${mailReq.bank_name} ${mailReq.branch_name}
${mailReq.account_type} ${mailReq.account_number}
${mailReq.account_holder} 様

この度はご利用いただき、誠にありがとうございました。
またのご利用をお待ちしております。

━━━━━━━━━━━━━━━━━━━━
ONE STOP
福井店：080-9361-6018
鯖江店：080-5720-1164
メール：onestop.mobile2024@gmail.com
LINE：https://lin.ee/F5fr4V7
━━━━━━━━━━━━━━━━━━━━`,
        })
      } catch (emailErr) {
        console.error('メール通知エラー:', emailErr)
      }
    }

    // ========================================
    // 6. 郵送買取リクエストを削除
    // ========================================
    const { error: deleteError } = await supabaseAdmin
      .from('t_mail_buyback_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('削除エラー:', deleteError)
      // 在庫登録は成功しているので警告のみ
      return NextResponse.json({
        success: true,
        warning: '在庫登録は成功しましたが、郵送買取リクエストの削除に失敗しました',
        inventoryIds,
        buybackId,
      })
    }

    return NextResponse.json({
      success: true,
      inventoryIds,
      managementNumbers: inventoryIds.map((_, i) =>
        mailReq.items[i]?.imei
          ? mailReq.items[i].imei!.slice(-4)
          : `${mailReq.request_number}-${i + 1}`
      ),
      buybackId,
      itemCount: mailReq.items.length,
    })
  } catch (error) {
    console.error('完了処理エラー:', error)
    // エラー発生時はロールバック
    await rollback(customerId, buybackId, inventoryIds)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
