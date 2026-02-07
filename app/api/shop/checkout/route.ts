/**
 * =====================================================
 * ECサイト - 決済API
 * =====================================================
 *
 * Square決済リンクを生成して返却
 * 決済完了後のWebhookで在庫ステータスを更新
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type CheckoutItem = {
  id: number
  model: string
  storage: number
  rank: string
  price: number
}

type CustomerInfo = {
  name: string
  email: string
  phone: string
  postalCode: string
  prefecture: string
  city: string
  address: string
  building?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer, items, totalPrice } = body as {
      customer: CustomerInfo
      items: CheckoutItem[]
      totalPrice: number
    }

    // バリデーション
    if (!customer || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: '注文情報が不正です' }, { status: 400 })
    }

    // 在庫確認（まだ販売されていないか）
    const itemIds = items.map(item => item.id)
    const { data: inventoryCheck, error: checkError } = await supabase
      .from('used_inventory')
      .select('id, status')
      .in('id', itemIds)

    if (checkError) {
      console.error('在庫確認エラー:', checkError)
      return NextResponse.json({ success: false, error: '在庫確認に失敗しました' }, { status: 500 })
    }

    // すでに販売済みの商品がないかチェック
    const soldItems = inventoryCheck?.filter(item => item.status !== '在庫')
    if (soldItems && soldItems.length > 0) {
      return NextResponse.json({
        success: false,
        error: '申し訳ありません。一部の商品がすでに販売済みです。カートを更新してください。'
      }, { status: 400 })
    }

    // 注文番号を生成
    const orderId = `OS-${Date.now().toString(36).toUpperCase()}`

    // EC注文を保存
    const { data: orderData, error: orderError } = await supabase
      .from('ec_orders')
      .insert({
        order_id: orderId,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        shipping_postal_code: customer.postalCode,
        shipping_prefecture: customer.prefecture,
        shipping_city: customer.city,
        shipping_address: customer.address,
        shipping_building: customer.building || null,
        total_amount: totalPrice,
        status: '決済待ち',
        items: items,
      })
      .select()
      .single()

    if (orderError) {
      console.error('注文保存エラー:', orderError)
      return NextResponse.json({ success: false, error: '注文の保存に失敗しました' }, { status: 500 })
    }

    // Square決済リンクを生成
    // TODO: Square APIを使用して決済リンクを生成
    // 現段階ではモック処理として成功を返す

    // 仮の決済完了処理（本番ではSquare Webhookで処理）
    // 在庫ステータスを「EC予約」に変更
    const { error: updateError } = await supabase
      .from('used_inventory')
      .update({ ec_status: 'EC予約', status: '在庫' })
      .in('id', itemIds)

    if (updateError) {
      console.error('在庫更新エラー:', updateError)
    }

    return NextResponse.json({
      success: true,
      orderId: orderId,
      // paymentUrl: squarePaymentUrl, // 本番では決済URLを返す
    })

  } catch (error) {
    console.error('決済APIエラー:', error)
    return NextResponse.json({ success: false, error: '処理中にエラーが発生しました' }, { status: 500 })
  }
}
