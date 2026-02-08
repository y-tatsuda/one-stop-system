/**
 * =====================================================
 * 郵送買取 完了API（在庫登録 & 削除 & 振込完了通知）
 * =====================================================
 *
 * 振込待ちの郵送買取を完了し、在庫に登録する
 * 既存の店頭買取と同じテーブル構造を使用:
 * 1. t_customers に顧客登録
 * 2. t_buyback にヘッダー登録
 * 3. t_used_inventory に在庫登録
 * 4. t_buyback_items に明細登録
 * 5. 振込完了通知（LINE/メール）を送信
 * 6. t_mail_buyback_requests を DELETE
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'
import { requireAuth } from '@/app/lib/auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

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
  items: Array<{
    model?: string
    modelDisplayName: string
    storage: string
    rank: string
    basePrice?: number
    estimatedPrice: number
    color?: string
    batteryPercent?: number
    imei?: string
    nwStatus?: string
    cameraStain?: string
    cameraBroken?: boolean
    repairHistory?: boolean
  }>
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

export async function POST(request: NextRequest) {
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

    // 本査定後の値を取得
    const item = mailReq.items[0]
    const changes = mailReq.assessment_details?.item_changes || []

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

    const finalRank = getChangedValue('rank', item?.rank || '良品') as string
    const finalBatteryPercent = getChangedValue('batteryPercent', item?.batteryPercent || 80) as number
    const finalNwStatus = getChangedValue('nwStatus', item?.nwStatus || 'ok') as string
    const finalCameraStain = getChangedValue('cameraStain', item?.cameraStain || 'none') as string
    const finalCameraBroken = getChangedValue('cameraBroken', item?.cameraBroken || false) as boolean
    const finalRepairHistory = getChangedValue('repairHistory', item?.repairHistory || false) as boolean

    const buybackPrice = mailReq.final_price || mailReq.total_estimated_price
    const now = new Date()
    const buybackDate = now.toISOString().split('T')[0]

    // 生年月日を組み立て
    const birthDate = mailReq.birth_year && mailReq.birth_month && mailReq.birth_day
      ? `${mailReq.birth_year}-${String(mailReq.birth_month).padStart(2, '0')}-${String(mailReq.birth_day).padStart(2, '0')}`
      : null

    // 1. 顧客登録（t_customers）
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

    if (customerError) {
      console.error('顧客登録エラー:', customerError)
      return NextResponse.json(
        { success: false, error: `顧客登録に失敗しました: ${customerError.message}` },
        { status: 500 }
      )
    }

    // 2. 買取ヘッダー登録（t_buyback）
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
        // 後方互換性（店頭買取と同じカラム）
        model: item?.model || item?.modelDisplayName,
        storage: parseInt(item?.storage) || 128,
        rank: finalRank,
        imei: item?.imei,
        battery_percent: finalBatteryPercent,
        nw_status: finalNwStatus,
        camera_broken: finalCameraBroken,
        camera_stain: finalCameraStain !== 'none',
        repair_history: finalRepairHistory,
        base_price: item?.basePrice || item?.estimatedPrice || buybackPrice,
        total_deduction: 0,
        final_price: buybackPrice,
        needs_repair: false,
        repair_cost: 0,
        memo: `郵送買取 ${mailReq.request_number}`,
      })
      .select()
      .single()

    if (buybackError) {
      console.error('買取ヘッダー登録エラー:', buybackError)
      // 顧客は登録済みだが続行不可
      return NextResponse.json(
        { success: false, error: `買取登録に失敗しました: ${buybackError.message}` },
        { status: 500 }
      )
    }

    const buybackId = buybackData.id

    // 3. 在庫登録（t_used_inventory）
    const { data: inventoryData, error: inventoryError } = await supabaseAdmin
      .from('t_used_inventory')
      .insert({
        tenant_id: 1,
        shop_id: shopId,
        arrival_date: buybackDate,
        model: item?.model || item?.modelDisplayName || 'unknown',
        storage: parseInt(item?.storage) || 128,
        rank: finalRank,
        color: item?.color || null,
        imei: item?.imei || null,
        management_number: item?.imei ? item.imei.slice(-4) : null,
        battery_percent: finalBatteryPercent,
        is_service_state: false,
        nw_status: finalNwStatus,
        camera_stain_level: finalCameraStain,
        camera_broken: finalCameraBroken,
        repair_history: finalRepairHistory,
        buyback_price: buybackPrice,
        repair_cost: 0,
        total_cost: buybackPrice,
        sales_price: null,
        status: '販売可',
        buyback_id: buybackId,
        memo: `郵送買取 ${mailReq.request_number} より登録`,
      })
      .select()
      .single()

    if (inventoryError) {
      console.error('在庫登録エラー:', inventoryError)
      return NextResponse.json(
        { success: false, error: `在庫登録に失敗しました: ${inventoryError.message}` },
        { status: 500 }
      )
    }

    // 4. 明細登録（t_buyback_items）
    const { error: itemError } = await supabaseAdmin
      .from('t_buyback_items')
      .insert({
        tenant_id: 1,
        buyback_id: buybackId,
        item_number: 1,
        model: item?.model || item?.modelDisplayName,
        storage: parseInt(item?.storage) || 128,
        rank: finalRank,
        color: item?.color || null,
        imei: item?.imei || null,
        battery_percent: finalBatteryPercent,
        is_service_state: false,
        nw_status: finalNwStatus,
        camera_stain: finalCameraStain,
        camera_broken: finalCameraBroken,
        repair_history: finalRepairHistory,
        needs_repair: false,
        repair_cost: 0,
        base_price: item?.estimatedPrice || buybackPrice,
        total_deduction: 0,
        calculated_price: buybackPrice,
        guarantee_price: 0,
        special_price_enabled: false,
        final_price: buybackPrice,
        sales_price: 0,
        expected_profit: 0,
        used_inventory_id: inventoryData.id,
      })

    if (itemError) {
      console.error('明細登録エラー:', itemError)
      // 続行可能（在庫は登録済み）
    }

    // 買取ヘッダーにused_inventory_idを更新（後方互換）
    await supabaseAdmin
      .from('t_buyback')
      .update({ used_inventory_id: inventoryData.id })
      .eq('id', buybackId)

    // 5. 振込完了通知を送信（削除前に実行）
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

        await fetch('https://api.line.me/v2/bot/message/push', {
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

    // 6. 郵送買取リクエストを削除
    const { error: deleteError } = await supabaseAdmin
      .from('t_mail_buyback_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('削除エラー:', deleteError)
      return NextResponse.json({
        success: true,
        warning: '在庫登録は成功しましたが、郵送買取リクエストの削除に失敗しました',
        inventoryId: inventoryData.id,
        managementNumber: inventoryData.management_number,
      })
    }

    return NextResponse.json({
      success: true,
      inventoryId: inventoryData.id,
      managementNumber: inventoryData.management_number,
      buybackId: buybackId,
    })
  } catch (error) {
    console.error('完了処理エラー:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
