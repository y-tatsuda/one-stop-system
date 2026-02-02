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

    switch (event.type) {
      case 'payment.created':
      case 'payment.updated':
        const payment = event.data?.object?.payment
        if (payment?.status === 'COMPLETED') {
          await handlePaymentCompleted(payment)
        } else if (payment?.status === 'CANCELED' || payment?.status === 'VOIDED') {
          await handlePaymentCanceled(payment)
        }
        break

      case 'refund.created':
      case 'refund.updated':
        const refund = event.data?.object?.refund
        if (refund?.status === 'COMPLETED') {
          await handleRefundCompleted(refund)
        }
        break

      case 'order.created':
      case 'order.updated':
        console.log('Order event:', event.type, event.data?.object?.order?.id)
        break

      default:
        console.log('未処理のイベントタイプ:', event.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Square Webhook処理エラー:', error)
    return NextResponse.json({ success: false, error: String(error) })
  }
}

// 決済完了時の処理
async function handlePaymentCompleted(payment: any) {
  try {
    console.log('決済完了処理開始:', payment.id)
    console.log('Payment note:', payment.note)

    // 既に処理済みかチェック
    const { data: existing } = await supabase
      .from('t_sales')
      .select('id')
      .eq('square_payment_id', payment.id)
      .eq('sale_type', 'sale')
      .maybeSingle()

    if (existing) {
      console.log('既に処理済みの決済:', payment.id)
      return
    }

    // 決済方法の判定（手数料計算用）
    // card: クレジットカード（2.5%）
    // electronic: 電子マネー - 交通系IC, iD, QUICPay（3.25%）
    // qr: QRコード - PayPay, d払い等（3.25%）
    // cash: 現金（0%）
    let feeRateKey = 'cash'
    let paymentMethod = '現金'

    if (payment.external_details) {
      // PayPay, d払い, 楽天ペイ等のQRコード決済
      feeRateKey = 'qr'
      paymentMethod = 'QRコード'
    } else if (payment.wallet_details) {
      // Apple Pay, Google Pay等のデジタルウォレット
      feeRateKey = 'electronic'
      paymentMethod = '電子マネー'
    } else if (payment.card_details) {
      // クレジットカード/デビットカード
      // entry_method で電子マネーとカードを区別
      const entryMethod = payment.card_details.entry_method
      const cardBrand = payment.card_details.card?.card_brand

      // 電子マネー（iD, QUICPay, 交通系IC）の判定
      // これらは通常 CONTACTLESS で、特定のブランド
      if (entryMethod === 'CONTACTLESS' &&
          (cardBrand === 'FELICA' || cardBrand === 'ID' || cardBrand === 'QUICPAY' ||
           cardBrand === 'SUICA' || cardBrand === 'PASMO' || !cardBrand)) {
        feeRateKey = 'electronic'
        paymentMethod = '電子マネー'
      } else {
        feeRateKey = 'card'
        paymentMethod = 'クレジットカード'
      }
    } else if (payment.cash_details) {
      feeRateKey = 'cash'
      paymentMethod = '現金'
    }

    console.log('決済方法:', paymentMethod, 'feeRateKey:', feeRateKey)

    // 手数料率を取得
    const { data: feeSettings } = await supabase
      .from('m_system_settings')
      .select('value')
      .eq('key', `square_fee_rate_${feeRateKey}`)
      .maybeSingle()

    const feeRate = parseFloat(feeSettings?.value || '0') / 100
    const totalAmount = payment.amount_money?.amount || 0
    const feeAmount = Math.round(totalAmount * feeRate)

    // noteから売上IDを抽出（KIOSKから登録した場合）
    const noteMatch = payment.note?.match(/\[SALE:(\d+)\]/)
    const existingSaleId = noteMatch ? parseInt(noteMatch[1]) : null

    if (existingSaleId) {
      // KIOSKから登録済みの売上を更新
      const { error: updateError } = await supabase
        .from('t_sales')
        .update({
          square_payment_id: payment.id,
          square_order_id: payment.order_id || null,
          square_fee_amount: feeAmount,
          memo: 'Square決済完了',
        })
        .eq('id', existingSaleId)

      if (updateError) {
        console.error('売上更新エラー:', updateError)
        return
      }

      console.log('既存売上を更新:', existingSaleId, '金額:', totalAmount, '手数料:', feeAmount)
      return
    }

    // PENDING_xxxで登録された売上を検索（金額とタイミングで紐付け）
    const { data: pendingSale } = await supabase
      .from('t_sales')
      .select('id')
      .like('square_payment_id', 'PENDING_%')
      .eq('total_amount', totalAmount)
      .eq('sale_type', 'sale')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (pendingSale) {
      // PENDING状態の売上を更新
      const { error: updateError } = await supabase
        .from('t_sales')
        .update({
          square_payment_id: payment.id,
          square_order_id: payment.order_id || null,
          square_fee_amount: feeAmount,
          memo: 'Square決済完了',
        })
        .eq('id', pendingSale.id)

      if (updateError) {
        console.error('売上更新エラー:', updateError)
        return
      }

      console.log('PENDING売上を更新:', pendingSale.id, '金額:', totalAmount, '手数料:', feeAmount)
      return
    }

    // 該当する既存売上がない場合は新規作成（Square単体での決済）
    // Location IDから店舗を特定
    const { data: shop } = await supabase
      .from('m_shops')
      .select('id, name')
      .eq('square_location_id', payment.location_id)
      .maybeSingle()

    const shopId = shop?.id || 1
    const saleDate = new Date(payment.created_at).toISOString().split('T')[0]

    const { data: sale, error: saleError } = await supabase
      .from('t_sales')
      .insert({
        tenant_id: 1,
        shop_id: shopId,
        staff_id: 1,
        sale_date: saleDate,
        total_amount: totalAmount,
        sale_type: 'sale',
        square_payment_id: payment.id,
        square_order_id: payment.order_id || null,
        square_fee_amount: feeAmount,
        memo: 'Square単体決済',
      })
      .select()
      .single()

    if (saleError) {
      console.error('売上登録エラー:', saleError)
      return
    }

    console.log('新規売上登録:', sale.id, '金額:', totalAmount, '店舗:', shop?.name || 'デフォルト', '手数料:', feeAmount)
  } catch (error) {
    console.error('handlePaymentCompleted エラー:', error)
  }
}

// 決済取消時の処理（マイナス売上として記録）
async function handlePaymentCanceled(payment: any) {
  try {
    console.log('決済取消処理開始:', payment.id)

    // 元の売上を検索
    const { data: originalSale } = await supabase
      .from('t_sales')
      .select('id, shop_id, total_amount')
      .eq('square_payment_id', payment.id)
      .eq('sale_type', 'sale')
      .maybeSingle()

    if (!originalSale) {
      console.log('対応する売上が見つかりません:', payment.id)
      return
    }

    // 既に取消済みかチェック
    const { data: existingCancel } = await supabase
      .from('t_sales')
      .select('id')
      .eq('original_sale_id', originalSale.id)
      .eq('sale_type', 'cancel')
      .maybeSingle()

    if (existingCancel) {
      console.log('既に取消済み:', payment.id)
      return
    }

    const saleDate = new Date().toISOString().split('T')[0]

    // マイナス売上として記録
    const { data: cancelSale, error: cancelError } = await supabase
      .from('t_sales')
      .insert({
        tenant_id: 1,
        shop_id: originalSale.shop_id,
        staff_id: 1,
        sale_date: saleDate,
        total_amount: -originalSale.total_amount, // マイナス金額
        sale_type: 'cancel',
        original_sale_id: originalSale.id,
        square_payment_id: payment.id + '_cancel',
      })
      .select()
      .single()

    if (cancelError) {
      console.error('取消登録エラー:', cancelError)
      return
    }

    // 中古在庫があれば販売可に戻す
    await revertInventoryStatus(originalSale.id)

    console.log('取消登録完了:', cancelSale.id, '元売上:', originalSale.id)
  } catch (error) {
    console.error('handlePaymentCanceled エラー:', error)
  }
}

// 返金完了時の処理
async function handleRefundCompleted(refund: any) {
  try {
    console.log('返金処理開始:', refund.id)

    // 返金に対応する決済を検索
    const paymentId = refund.payment_id

    const { data: originalSale } = await supabase
      .from('t_sales')
      .select('id, shop_id, total_amount')
      .eq('square_payment_id', paymentId)
      .eq('sale_type', 'sale')
      .maybeSingle()

    if (!originalSale) {
      console.log('対応する売上が見つかりません。Payment ID:', paymentId)
      return
    }

    // 既に返金済みかチェック
    const { data: existingRefund } = await supabase
      .from('t_sales')
      .select('id')
      .eq('square_payment_id', refund.id)
      .maybeSingle()

    if (existingRefund) {
      console.log('既に返金処理済み:', refund.id)
      return
    }

    const refundAmount = refund.amount_money?.amount || 0
    const saleDate = new Date().toISOString().split('T')[0]

    // マイナス売上として記録
    const { data: refundSale, error: refundError } = await supabase
      .from('t_sales')
      .insert({
        tenant_id: 1,
        shop_id: originalSale.shop_id,
        staff_id: 1,
        sale_date: saleDate,
        total_amount: -refundAmount, // マイナス金額
        sale_type: 'refund',
        original_sale_id: originalSale.id,
        square_payment_id: refund.id,
      })
      .select()
      .single()

    if (refundError) {
      console.error('返金登録エラー:', refundError)
      return
    }

    // 全額返金の場合、中古在庫を販売可に戻す
    if (refundAmount >= originalSale.total_amount) {
      await revertInventoryStatus(originalSale.id)
    }

    console.log('返金登録完了:', refundSale.id, '金額:', -refundAmount, '元売上:', originalSale.id)
  } catch (error) {
    console.error('handleRefundCompleted エラー:', error)
  }
}

// 中古在庫のステータスを販売可に戻す
async function revertInventoryStatus(saleId: number) {
  try {
    // 売上明細から中古在庫IDを取得
    const { data: details } = await supabase
      .from('t_sales_details')
      .select('used_inventory_id')
      .eq('sale_id', saleId)
      .not('used_inventory_id', 'is', null)

    if (!details || details.length === 0) {
      return
    }

    for (const detail of details) {
      if (detail.used_inventory_id) {
        await supabase
          .from('t_used_inventory')
          .update({ status: '販売可' })
          .eq('id', detail.used_inventory_id)

        console.log('在庫ステータス復元:', detail.used_inventory_id, '→ 販売可')
      }
    }
  } catch (error) {
    console.error('在庫ステータス復元エラー:', error)
  }
}
