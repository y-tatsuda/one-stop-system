import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Square Webhook署名の検証
function verifySquareWebhook(
  body: string,
  signature: string,
  signatureKey: string,
  notificationUrl: string
): boolean {
  const hmac = crypto.createHmac('sha256', signatureKey)
  hmac.update(notificationUrl + body)
  const expectedSignature = hmac.digest('base64')
  return signature === expectedSignature
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-square-hmacsha256-signature') || ''

    // 署名キーを取得
    const { data: settings } = await supabase
      .from('m_system_settings')
      .select('value')
      .eq('key', 'square_webhook_signature_key')
      .single()

    const signatureKey = settings?.value || process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || ''
    const webhookUrl = process.env.SQUARE_WEBHOOK_URL || ''

    // 署名検証（本番環境では必須）
    if (signatureKey && webhookUrl) {
      const isValid = verifySquareWebhook(body, signature, signatureKey, webhookUrl)
      if (!isValid) {
        console.error('Square Webhook署名検証失敗')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)
    console.log('Square Webhook受信:', event.type)

    // イベントタイプに応じた処理
    switch (event.type) {
      case 'payment.created':
      case 'payment.updated':
        // 決済が完了した場合のみ処理
        if (event.data.object.payment?.status === 'COMPLETED') {
          await handlePaymentCompleted(event.data.object.payment)
        }
        break
      case 'order.created':
        await handleOrderCreated(event.data.object.order)
        break
      case 'order.updated':
        await handleOrderUpdated(event.data.object.order)
        break
      default:
        console.log('未処理のイベントタイプ:', event.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Square Webhook処理エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 決済完了時の処理
async function handlePaymentCompleted(payment: any) {
  console.log('決済完了:', payment.id)

  // 既に処理済みかチェック
  const { data: existing } = await supabase
    .from('t_sales')
    .select('id')
    .eq('square_payment_id', payment.id)
    .single()

  if (existing) {
    console.log('既に処理済みの決済:', payment.id)
    return
  }

  // Location IDから店舗を特定
  const { data: shop } = await supabase
    .from('m_shops')
    .select('id')
    .eq('square_location_id', payment.location_id)
    .single()

  if (!shop) {
    console.error('店舗が見つかりません。Location ID:', payment.location_id)
    return
  }

  // 決済方法の判定
  let paymentMethod = 'cash'
  if (payment.card_details) {
    paymentMethod = 'card'
  } else if (payment.wallet_details) {
    paymentMethod = 'electronic'
  }

  // 手数料率を取得
  const { data: feeSettings } = await supabase
    .from('m_system_settings')
    .select('value')
    .eq('key', `square_fee_rate_${paymentMethod}`)
    .single()

  const feeRate = parseFloat(feeSettings?.value || '0') / 100

  // 金額計算（Squareは金額をセント単位で返す場合があるため注意）
  const totalAmount = payment.amount_money.amount
  const feeAmount = Math.round(totalAmount * feeRate)

  // 売上登録
  const saleDate = new Date(payment.created_at).toISOString().split('T')[0]

  const { data: sale, error: saleError } = await supabase
    .from('t_sales')
    .insert({
      tenant_id: 1,
      shop_id: shop.id,
      sale_date: saleDate,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      square_payment_id: payment.id,
      square_order_id: payment.order_id,
      square_fee_amount: feeAmount,
      note: `Square決済 (${payment.id})`,
    })
    .select()
    .single()

  if (saleError) {
    console.error('売上登録エラー:', saleError)
    return
  }

  console.log('売上登録完了:', sale.id)
}

// 注文作成時の処理
async function handleOrderCreated(order: any) {
  console.log('注文作成:', order.id)
  // 注文の詳細を処理（明細登録など）
}

// 注文更新時の処理
async function handleOrderUpdated(order: any) {
  console.log('注文更新:', order.id)

  // 注文がCOMPLETEDになった場合、明細を登録
  if (order.state === 'COMPLETED') {
    await processOrderLineItems(order)
  }
}

// 注文明細の処理
async function processOrderLineItems(order: any) {
  const { data: sale } = await supabase
    .from('t_sales')
    .select('id')
    .eq('square_order_id', order.id)
    .single()

  if (!sale) {
    console.log('対応する売上が見つかりません:', order.id)
    return
  }

  for (const lineItem of order.line_items || []) {
    // カタログIDから商品情報を取得
    const catalogObjectId = lineItem.catalog_object_id

    if (catalogObjectId) {
      // 中古在庫の場合（カタログIDにused_inventory_idが含まれる）
      const { data: catalogMapping } = await supabase
        .from('m_square_catalog_mapping')
        .select('item_type, item_id')
        .eq('square_catalog_id', catalogObjectId)
        .single()

      if (catalogMapping) {
        if (catalogMapping.item_type === 'used_inventory') {
          // 中古在庫の場合、ステータスを販売済に更新
          await supabase
            .from('t_used_inventory')
            .update({ status: '販売済' })
            .eq('id', catalogMapping.item_id)

          // 売上明細に登録
          await supabase
            .from('t_sales_details')
            .insert({
              tenant_id: 1,
              sale_id: sale.id,
              sale_type: 'used',
              used_inventory_id: catalogMapping.item_id,
              unit_price: lineItem.base_price_money?.amount || 0,
              quantity: 1,
            })
        } else if (catalogMapping.item_type === 'repair') {
          // 修理の場合
          await supabase
            .from('t_sales_details')
            .insert({
              tenant_id: 1,
              sale_id: sale.id,
              sale_type: 'repair',
              repair_menu_id: catalogMapping.item_id,
              unit_price: lineItem.base_price_money?.amount || 0,
              quantity: parseInt(lineItem.quantity) || 1,
            })
        }
      }
    }
  }
}
