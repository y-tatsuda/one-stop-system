/**
 * =====================================================
 * 郵送買取 完了API（在庫登録 & 削除）
 * =====================================================
 *
 * 振込待ちの郵送買取を完了し、在庫に登録する
 * 1. t_used_inventory に INSERT
 * 2. t_mail_buyback_requests を DELETE
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'
import { requireAuth } from '@/app/lib/auth'

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
  items: Array<{
    model?: string
    modelDisplayName: string
    storage: string
    rank: string
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

    // 認証ユーザーの店舗IDを取得（m_staffテーブルから）
    let shopId = 1
    if (authResult.auth?.staffId) {
      const { data: staffData } = await supabaseAdmin
        .from('m_staff')
        .select('shop_id')
        .eq('id', authResult.auth.staffId)
        .single()
      if (staffData?.shop_id) {
        shopId = staffData.shop_id
      }
    }

    // 本査定後の値を取得
    const item = mailReq.items[0]
    const changes = mailReq.assessment_details?.item_changes || []

    const getChangedValue = (field: string, original: unknown): unknown => {
      const change = changes.find(c => c.field === field && c.hasChanged)
      if (change) {
        // 各フィールドに応じた値変換
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

    // 管理番号を生成
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

    // 今日の既存在庫数を取得
    const { data: existingInventory } = await supabaseAdmin
      .from('t_used_inventory')
      .select('management_number')
      .like('management_number', `UI-${dateStr}-%`)
      .order('management_number', { ascending: false })
      .limit(1)

    let sequence = 1
    if (existingInventory && existingInventory.length > 0) {
      const lastNumber = existingInventory[0].management_number
      const lastSeq = parseInt(lastNumber.split('-').pop() || '0')
      sequence = lastSeq + 1
    }

    const managementNumber = `UI-${dateStr}-${String(sequence).padStart(3, '0')}`

    // 在庫データを作成
    const inventoryData = {
      tenant_id: 1,
      shop_id: shopId,
      model: item?.model || item?.modelDisplayName || 'unknown',
      storage: parseInt(item?.storage) || 128,
      color: item?.color || null,
      rank: finalRank,
      imei: item?.imei || null,
      battery_percent: finalBatteryPercent,
      is_service_state: false,
      nw_status: finalNwStatus,
      camera_stain_level: finalCameraStain,
      camera_broken: finalCameraBroken,
      repair_history: finalRepairHistory,
      repair_types: null,
      buyback_price: buybackPrice,
      repair_cost: 0,
      total_cost: buybackPrice,
      sales_price: null,
      status: '販売可',
      ec_status: null,
      arrival_date: now.toISOString().split('T')[0],
      management_number: managementNumber,
      memo: `郵送買取 ${mailReq.request_number} より登録\n顧客: ${mailReq.customer_name}`,
      // 古物商に必要な情報
      buyback_customer_name: mailReq.customer_name,
      buyback_customer_kana: mailReq.customer_name_kana,
      buyback_address: [
        mailReq.postal_code ? `〒${mailReq.postal_code}` : '',
        mailReq.address || '',
        mailReq.address_detail || '',
      ].filter(Boolean).join(' '),
      buyback_birth_date: mailReq.birth_year && mailReq.birth_month && mailReq.birth_day
        ? `${mailReq.birth_year}-${String(mailReq.birth_month).padStart(2, '0')}-${String(mailReq.birth_day).padStart(2, '0')}`
        : null,
      buyback_date: now.toISOString().split('T')[0],
      agreement_document_path: mailReq.agreement_document_path,
      mail_buyback_request_number: mailReq.request_number,
    }

    // 在庫に登録
    const { data: insertedInventory, error: insertError } = await supabaseAdmin
      .from('t_used_inventory')
      .insert(inventoryData)
      .select()
      .single()

    if (insertError) {
      console.error('在庫登録エラー:', insertError)
      return NextResponse.json(
        { success: false, error: `在庫登録に失敗しました: ${insertError.message}` },
        { status: 500 }
      )
    }

    // 郵送買取リクエストを削除
    const { error: deleteError } = await supabaseAdmin
      .from('t_mail_buyback_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('削除エラー:', deleteError)
      // 削除に失敗しても在庫登録は成功しているので、警告として返す
      return NextResponse.json({
        success: true,
        warning: '在庫登録は成功しましたが、郵送買取リクエストの削除に失敗しました',
        inventoryId: insertedInventory.id,
        managementNumber,
      })
    }

    return NextResponse.json({
      success: true,
      inventoryId: insertedInventory.id,
      managementNumber,
    })
  } catch (error) {
    console.error('完了処理エラー:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
