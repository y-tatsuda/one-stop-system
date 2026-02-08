import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'

const LSTEP_API_URL = 'https://api.lstep.app/v1'
const LSTEP_API_KEY = process.env.LSTEP_API_KEY
const LSTEP_ACCOUNT_ID = process.env.LSTEP_ACCOUNT_ID
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerName,
      customerNameKana,
      birthYear,
      birthMonth,
      birthDay,
      occupation,
      postalCode,
      address,
      addressDetail,
      phone,
      email,
      items,
      totalEstimatedPrice,
      memo,
      // LINE情報（LIFF経由の場合）
      lineUserId,
      lineDisplayName,
      source,
      // 未成年の場合の保護者情報
      isMinor,
      guardianConsent,
      guardianName,
      guardianNameKana,
      guardianRelationship,
      guardianPhone,
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
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
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
        birth_year: birthYear || null,
        birth_month: birthMonth || null,
        birth_day: birthDay || null,
        occupation: occupation || null,
        postal_code: postalCode || null,
        address: address || null,
        address_detail: addressDetail || null,
        phone: phone,
        email: email || null,
        items: items,
        total_estimated_price: totalEstimatedPrice,
        item_count: items.length,
        memo: memo || null,
        // LINE情報
        line_user_id: lineUserId || null,
        line_display_name: lineDisplayName || null,
        source: source || 'web',
        // 未成年の場合の保護者情報
        is_minor: isMinor || false,
        guardian_consent: guardianConsent || null,
        guardian_name: guardianName || null,
        guardian_name_kana: guardianNameKana || null,
        guardian_relationship: guardianRelationship || null,
        guardian_phone: guardianPhone || null,
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

    // LINE連携（LIFF経由の場合のみ）
    if (lineUserId) {
      // Lステップタグ付け
      try {
        if (LSTEP_API_KEY && LSTEP_ACCOUNT_ID) {
          await fetch(`${LSTEP_API_URL}/tags/add`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${LSTEP_API_KEY}`,
              'X-Account-Id': LSTEP_ACCOUNT_ID,
            },
            body: JSON.stringify({
              uid: lineUserId,
              tag_name: '買取申込み済',
            }),
          })
          console.log('Lステップタグ付け完了:', lineUserId)
        }
      } catch (lstepError) {
        console.error('Lステップ連携エラー:', lstepError)
      }

      // LINE返信メッセージ
      try {
        if (LINE_CHANNEL_ACCESS_TOKEN) {
          // 端末情報を整形
          const itemDetails = items.map((item: {
            modelDisplayName: string
            storage: string
            rank: string
            batteryPercent: number
            imei: string
            isServiceState?: boolean
            nwStatus: string
            cameraStain: string
            cameraBroken: boolean
            repairHistory: boolean
            estimatedPrice: number
            guaranteePrice: number
          }, i: number) => {
            const isGuaranteePrice = item.guaranteePrice > 0 && item.estimatedPrice <= item.guaranteePrice
            const nwDeduction20 = Math.round(item.estimatedPrice * 0.2)
            const nwDeduction40 = Math.round(item.estimatedPrice * 0.4)

            let details = `${i + 1}台目\n`
            details += `機種: ${item.modelDisplayName}\n`
            details += `容量: ${item.storage}GB\n`
            details += `ランク: ${item.rank}\n`
            details += `バッテリー: ${item.batteryPercent}%${item.isServiceState ? '(サービス状態)' : ''}\n`
            details += `IMEI: ${item.imei || '未入力'}\n`
            details += `カメラ染み: ${item.cameraStain !== 'none' ? 'あり' : 'なし'}\n`
            details += `カメラ窓破損: ${item.cameraBroken ? 'あり' : 'なし'}\n`
            details += `非正規修理歴: ${item.repairHistory ? 'あり' : 'なし'}\n\n`
            details += `事前査定価格: ¥${item.estimatedPrice.toLocaleString()}\n`

            if (isGuaranteePrice) {
              details += `※最低保証価格のため、これ以上の減額はありません。\n`
              details += `※水没などがあった場合は別途ご相談させていただきます。\n`
            }

            details += `\nネットワーク利用制限（△）の場合: ¥${nwDeduction20.toLocaleString()}減額`

            return details
          }).join('\n\n───────────\n\n')

          // 住所整形
          const fullAddress = [
            postalCode ? `〒${postalCode}` : '',
            address || '',
            addressDetail || '',
          ].filter(Boolean).join(' ')

          const lineMessageText = `📱 買取申込みありがとうございます

この度は買取査定をお申し込みいただき、誠にありがとうございます。

申込番号: ${requestNumber}

【今後の流れ】
1. 郵送キットをお送りいたします
2. 端末をキットに入れてご返送ください
3. 到着後、本査定を行いご連絡いたします
4. 査定額にご了承いただけましたらお振込みいたします

【お申し込み内容】
${itemDetails}

合計査定金額: ¥${totalEstimatedPrice.toLocaleString()}

【買取キット送付先住所】
${customerName} 様
${fullAddress}
TEL: ${phone}

ご不明点がございましたら、お気軽にメッセージください。`

          const lineMessage = {
            to: lineUserId,
            messages: [{ type: 'text', text: lineMessageText }],
          }
          await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify(lineMessage),
          })
          console.log('LINE返信送信完了:', lineUserId)
        }
      } catch (lineError) {
        console.error('LINE返信エラー:', lineError)
      }
    }

    // WEB経由でメールアドレスがある場合はメール送信
    if (email && !lineUserId) {
      try {
        // 端末情報を整形
        const emailItemDetails = items.map((item: {
          modelDisplayName: string
          storage: string
          rank: string
          batteryPercent: number
          imei: string
          isServiceState?: boolean
          nwStatus: string
          cameraStain: string
          cameraBroken: boolean
          repairHistory: boolean
          estimatedPrice: number
          guaranteePrice: number
        }, i: number) => {
          const isGuaranteePrice = item.guaranteePrice > 0 && item.estimatedPrice <= item.guaranteePrice
          const nwDeduction20 = Math.round(item.estimatedPrice * 0.2)

          let details = `【${i + 1}台目】\n`
          details += `機種: ${item.modelDisplayName}\n`
          details += `容量: ${item.storage}GB\n`
          details += `ランク: ${item.rank}\n`
          details += `バッテリー: ${item.batteryPercent}%${item.isServiceState ? '(サービス状態)' : ''}\n`
          details += `IMEI: ${item.imei || '未入力'}\n`
          details += `カメラ染み: ${item.cameraStain !== 'none' ? 'あり' : 'なし'}\n`
          details += `カメラ窓破損: ${item.cameraBroken ? 'あり' : 'なし'}\n`
          details += `非正規修理歴: ${item.repairHistory ? 'あり' : 'なし'}\n\n`
          details += `事前査定価格: ¥${item.estimatedPrice.toLocaleString()}\n`

          if (isGuaranteePrice) {
            details += `※最低保証価格のため、これ以上の減額はありません。\n`
            details += `※水没などがあった場合は別途ご相談させていただきます。\n`
          }

          details += `ネットワーク利用制限（△）の場合: ¥${nwDeduction20.toLocaleString()}減額`

          return details
        }).join('\n\n')

        // 住所整形
        const emailFullAddress = [
          postalCode ? `〒${postalCode}` : '',
          address || '',
          addressDetail || '',
        ].filter(Boolean).join(' ')

        const emailBody = `${customerName} 様

この度は買取査定をお申し込みいただき、誠にありがとうございます。

■ 申込番号: ${requestNumber}

■ 今後の流れ
1. 郵送キットをお送りいたします
2. 端末をキットに入れてご返送ください
3. 到着後、本査定を行いご連絡いたします
4. 査定額にご了承いただけましたらお振込みいたします

■ お申し込み内容
${emailItemDetails}

合計査定金額: ¥${totalEstimatedPrice.toLocaleString()}

■ 買取キット送付先住所
${customerName} 様
${emailFullAddress}
TEL: ${phone}

■ お問い合わせ
ご不明点などございましたら、いずれかの方法でお問い合わせください。

・公式LINE（オススメ）
https://lin.ee/F5fr4V7

・メール
このメールに直接ご返信ください。

※公式LINEの方が回答までのスピードが早いためオススメです。
※メールでのお問い合わせは回答までにお時間がかかる場合がございます。

━━━━━━━━━━━━━━━━━━━━
ONE STOP
福井店：080-9361-6018
鯖江店：080-5720-1164
メール：onestop.mobile2024@gmail.com
━━━━━━━━━━━━━━━━━━━━`

        const RESEND_API_KEY = process.env.RESEND_API_KEY
        if (RESEND_API_KEY) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'ONE STOP <noreply@onestop-mobile.net>',
              reply_to: ['onestop.mobile2024@gmail.com'],
              to: [email],
              subject: `【ONE STOP】買取申込みを受け付けました（${requestNumber}）`,
              text: emailBody,
            }),
          })
          console.log('メール送信完了:', email)
        }
      } catch (emailError) {
        console.error('メール送信エラー:', emailError)
      }
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
