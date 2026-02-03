import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerName,
      customerNameKana,
      postalCode,
      address,
      addressDetail,
      phone,
      email,
      items,
      totalEstimatedPrice,
      memo,
    } = body

    // バリデーション
    if (!customerName || !phone || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: '必須項目が入力されていません' },
        { status: 400 }
      )
    }

    // 申込番号を生成（MB-YYYY-MMDD-NNN）
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const prefix = `MB-${dateStr}`

    // 今日の既存申込数を取得して連番を決定
    const { data: existingRequests } = await supabaseAdmin
      .from('t_mail_buyback_requests')
      .select('request_number')
      .like('request_number', `${prefix}-%`)
      .order('request_number', { ascending: false })
      .limit(1)

    let sequence = 1
    if (existingRequests && existingRequests.length > 0) {
      const lastNumber = existingRequests[0].request_number
      const lastSeq = parseInt(lastNumber.split('-').pop() || '0')
      sequence = lastSeq + 1
    }

    const requestNumber = `${prefix}-${String(sequence).padStart(3, '0')}`

    // DBに保存
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('t_mail_buyback_requests')
      .insert({
        tenant_id: 1,
        request_number: requestNumber,
        status: 'pending',
        customer_name: customerName,
        customer_name_kana: customerNameKana || null,
        postal_code: postalCode || null,
        address: address || null,
        address_detail: addressDetail || null,
        phone: phone,
        email: email || null,
        items: items,
        total_estimated_price: totalEstimatedPrice,
        item_count: items.length,
        memo: memo || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('DB insert error:', insertError)
      return NextResponse.json(
        { success: false, error: 'データの保存に失敗しました' },
        { status: 500 }
      )
    }

    // Slack通知を送信
    const cameraStainLabel = (v: string) => v === 'none' ? 'なし' : v === 'minor' ? '小' : '大'

    const itemLines = items.map((item: {
      modelDisplayName: string; storage: string; rank: string;
      batteryPercent: number; imei: string;
      cameraStain: string; cameraBroken: boolean; repairHistory: boolean;
      estimatedPrice: number
    }, i: number) => {
      const num = String.fromCodePoint(0x2460 + i) // ①②③...
      const details = [
        `機種: ${item.modelDisplayName} ${item.storage}GB`,
        `ランク: ${item.rank}`,
        `バッテリー: ${item.batteryPercent}%`,
        `IMEI: ${item.imei || '未入力'}`,
        `カメラ染み: ${cameraStainLabel(item.cameraStain)}`,
        `カメラ窓破損: ${item.cameraBroken ? 'あり' : 'なし'}`,
        `非正規修理歴: ${item.repairHistory ? 'あり' : 'なし'}`,
        `査定金額: ¥${item.estimatedPrice.toLocaleString()}`,
      ]
      return `${num}\n${details.join('\n')}`
    }).join('\n\n')

    const addressLine = [
      postalCode ? `〒${postalCode}` : '',
      address || '',
      addressDetail || '',
    ].filter(Boolean).join(' ')

    const slackMessage = [
      '📦 郵送買取申込',
      `申込番号: ${requestNumber}`,
      '',
      '【お客様情報】',
      `氏名: ${customerName} 様`,
      ...(customerNameKana ? [`フリガナ: ${customerNameKana}`] : []),
      `電話: ${phone}`,
      ...(email ? [`メール: ${email}`] : []),
      ...(addressLine ? [`住所: ${addressLine}`] : []),
      '',
      '【端末情報】',
      itemLines,
      '',
      `合計査定金額: ¥${totalEstimatedPrice.toLocaleString()}`,
    ].join('\n')

    // Slack通知（失敗しても申込自体は成功とする）
    try {
      const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL_BUYBACK
      if (SLACK_WEBHOOK_URL) {
        await fetch(SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: slackMessage }),
        })
      }
    } catch (slackError) {
      console.error('Slack notification error:', slackError)
    }

    return NextResponse.json({
      success: true,
      requestNumber,
      id: insertedData.id,
    })
  } catch (error) {
    console.error('Mail buyback API error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
