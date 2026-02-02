import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const event = JSON.parse(body)

    console.log('Square Webhook受信:', event.type)

    // イベントタイプに応じた処理
    switch (event.type) {
      case 'payment.created':
      case 'payment.updated':
        // 決済が完了した場合のみ処理
        const payment = event.data?.object?.payment
        if (payment?.status === 'COMPLETED') {
          await handlePaymentCompleted(payment)
        }
        break
      case 'order.created':
      case 'order.updated':
        // orderイベントは現時点ではログのみ
        console.log('Order event:', event.type, event.data?.object?.order?.id)
        break
      default:
        console.log('未処理のイベントタイプ:', event.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Square Webhook処理エラー:', error)
    // エラーでも200を返す（リトライを防ぐ）
    return NextResponse.json({ success: false, error: String(error) })
  }
}

// 決済完了時の処理
async function handlePaymentCompleted(payment: any) {
  try {
    console.log('決済完了処理開始:', payment.id)

    // 既に処理済みかチェック
    const { data: existing } = await supabase
      .from('t_sales')
      .select('id')
      .eq('square_payment_id', payment.id)
      .maybeSingle()

    if (existing) {
      console.log('既に処理済みの決済:', payment.id)
      return
    }

    // Location IDから店舗を特定
    const { data: shop } = await supabase
      .from('m_shops')
      .select('id, name')
      .eq('square_location_id', payment.location_id)
      .maybeSingle()

    if (!shop) {
      console.error('店舗が見つかりません。Location ID:', payment.location_id)
      // 店舗が見つからない場合はデフォルトで1を使用
      console.log('デフォルト店舗ID 1 を使用')
    }

    const shopId = shop?.id || 1

    // 決済方法の判定
    let paymentMethod = 'cash'
    if (payment.card_details) {
      paymentMethod = 'card'
    } else if (payment.wallet_details) {
      paymentMethod = 'electronic'
    } else if (payment.cash_details) {
      paymentMethod = 'cash'
    }

    // 手数料率を取得
    const { data: feeSettings } = await supabase
      .from('m_system_settings')
      .select('value')
      .eq('key', `square_fee_rate_${paymentMethod}`)
      .maybeSingle()

    const feeRate = parseFloat(feeSettings?.value || '0') / 100

    // 金額計算（Squareは円単位で返す）
    const totalAmount = payment.amount_money?.amount || 0
    const feeAmount = Math.round(totalAmount * feeRate)

    // 売上登録
    const saleDate = new Date(payment.created_at).toISOString().split('T')[0]

    const { data: sale, error: saleError } = await supabase
      .from('t_sales')
      .insert({
        tenant_id: 1,
        shop_id: shopId,
        sale_date: saleDate,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        square_payment_id: payment.id,
        square_order_id: payment.order_id || null,
        square_fee_amount: feeAmount,
        note: `Square決済`,
      })
      .select()
      .single()

    if (saleError) {
      console.error('売上登録エラー:', saleError)
      return
    }

    console.log('売上登録完了:', sale.id, '金額:', totalAmount, '店舗:', shop?.name || 'デフォルト')
  } catch (error) {
    console.error('handlePaymentCompleted エラー:', error)
  }
}
