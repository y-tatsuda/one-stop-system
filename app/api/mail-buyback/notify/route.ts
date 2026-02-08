/**
 * =====================================================
 * 郵送買取 通知API
 * =====================================================
 *
 * 各ステータス変更時の通知を一括処理
 * - LINE Push Message（LIFF経由の場合）
 * - メール送信（WEB経由の場合）
 * - Slack通知（全経路）
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'
import { requireAuth } from '@/app/lib/auth'

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL_BUYBACK
const RESEND_API_KEY = process.env.RESEND_API_KEY
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://one-stop-system.vercel.app'

type NotifyAction =
  | 'kit_sent'      // キット送付
  | 'assessed'      // 本査定完了
  | 'approved'      // 承諾受付
  | 'rejected'      // 返却希望
  | 'paid'          // 振込完了

type AssessmentIssue = {
  hasIssue: boolean
  description: string
  photos: string[]
}

type AssessmentDetails = {
  screen_scratches: AssessmentIssue
  body_scratches: AssessmentIssue
  camera_stain: AssessmentIssue
  other: AssessmentIssue
}

type RequestData = {
  id: number
  request_number: string
  customer_name: string
  phone: string
  email: string | null
  postal_code: string | null
  address: string | null
  address_detail: string | null
  items: Array<{
    modelDisplayName: string
    storage: string
    rank: string
    estimatedPrice: number
  }>
  total_estimated_price: number
  final_price: number | null
  line_user_id: string | null
  source: 'web' | 'liff'
  bank_name: string | null
  branch_name: string | null
  account_type: string | null
  account_number: string | null
  account_holder: string | null
  price_changes: Array<{ field: string; before: string; after: string; diff: number }> | null
  assessment_details: AssessmentDetails | null
}

export async function POST(request: NextRequest) {
  try {
    // 認可チェック（スタッフ以上が通知操作可能）
    const authResult = await requireAuth(request.headers.get('authorization'))
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.message },
        { status: authResult.status }
      )
    }

    const { action, requestId } = await request.json() as { action: NotifyAction; requestId: number }

    // リクエストデータを取得
    const { data: reqData, error } = await supabaseAdmin
      .from('t_mail_buyback_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (error || !reqData) {
      return NextResponse.json({ success: false, error: 'データが見つかりません' }, { status: 404 })
    }

    const data = reqData as RequestData
    const isLiff = data.source === 'liff' && data.line_user_id

    // 通知を実行
    const results = {
      line: false,
      email: false,
      slack: false,
    }

    switch (action) {
      case 'kit_sent':
        results.slack = await sendSlackKitSent(data)
        if (isLiff) {
          results.line = await sendLineKitSent(data)
        } else if (data.email) {
          results.email = await sendEmailKitSent(data)
        }
        break

      case 'assessed':
        results.slack = await sendSlackAssessed(data)
        if (isLiff) {
          results.line = await sendLineAssessed(data)
        } else if (data.email) {
          results.email = await sendEmailAssessed(data)
        }
        break

      case 'approved':
        results.slack = await sendSlackApproved(data)
        break

      case 'rejected':
        results.slack = await sendSlackRejected(data)
        break

      case 'paid':
        results.slack = await sendSlackPaid(data)
        if (isLiff) {
          results.line = await sendLinePaid(data)
        } else if (data.email) {
          results.email = await sendEmailPaid(data)
        }
        break
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('通知エラー:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

// =====================================================
// Slack通知
// =====================================================

async function sendSlack(message: string): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) return false
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })
    return true
  } catch (e) {
    console.error('Slack送信エラー:', e)
    return false
  }
}

async function sendSlackKitSent(data: RequestData): Promise<boolean> {
  const items = data.items.map(i => `${i.modelDisplayName} ${i.storage}GB`).join(', ')
  const message = `📦 キット送付完了
申込番号: ${data.request_number}
氏名: ${data.customer_name} 様
端末: ${items}
経路: ${data.source === 'liff' ? 'LINE' : 'WEB'}`
  return sendSlack(message)
}

async function sendSlackAssessed(data: RequestData): Promise<boolean> {
  const items = data.items.map(i => `${i.modelDisplayName} ${i.storage}GB`).join(', ')
  const priceDiff = (data.final_price || data.total_estimated_price) - data.total_estimated_price
  const diffText = priceDiff === 0 ? '変更なし' : priceDiff > 0 ? `+¥${priceDiff.toLocaleString()}` : `¥${priceDiff.toLocaleString()}`

  const message = `🔍 本査定完了
申込番号: ${data.request_number}
氏名: ${data.customer_name} 様
端末: ${items}
事前査定: ¥${data.total_estimated_price.toLocaleString()}
本査定: ¥${(data.final_price || data.total_estimated_price).toLocaleString()} (${diffText})
→ お客様の承諾待ち`
  return sendSlack(message)
}

async function sendSlackApproved(data: RequestData): Promise<boolean> {
  const message = `✅ 買取承諾
申込番号: ${data.request_number}
氏名: ${data.customer_name} 様
最終価格: ¥${(data.final_price || data.total_estimated_price).toLocaleString()}

【振込先】
${data.bank_name || '未入力'} ${data.branch_name || ''}
${data.account_type || ''} ${data.account_number || ''}
${data.account_holder || ''}`
  return sendSlack(message)
}

async function sendSlackRejected(data: RequestData): Promise<boolean> {
  const message = `❌ 返却希望
申込番号: ${data.request_number}
氏名: ${data.customer_name} 様
→ 返送手続きが必要です`
  return sendSlack(message)
}

async function sendSlackPaid(data: RequestData): Promise<boolean> {
  const message = `💰 振込完了
申込番号: ${data.request_number}
氏名: ${data.customer_name} 様
振込金額: ¥${(data.final_price || data.total_estimated_price).toLocaleString()}
振込先: ${data.bank_name} ${data.branch_name} ${data.account_number}`
  return sendSlack(message)
}

// =====================================================
// LINE通知
// =====================================================

async function sendLine(userId: string, message: string): Promise<boolean> {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !userId) return false
  try {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: 'text', text: message }],
      }),
    })
    return true
  } catch (e) {
    console.error('LINE送信エラー:', e)
    return false
  }
}

async function sendLineKitSent(data: RequestData): Promise<boolean> {
  const message = `📦 買取キットを発送しました

${data.customer_name} 様

買取キットを本日発送いたしました。
到着まで1〜2日程度お待ちください。

【申込番号】${data.request_number}

届きましたら、端末をキットに入れてご返送ください。
ご不明点がございましたら、お気軽にメッセージください。`

  return sendLine(data.line_user_id!, message)
}

async function sendLineAssessed(data: RequestData): Promise<boolean> {
  const finalPrice = data.final_price || data.total_estimated_price
  const priceDiff = finalPrice - data.total_estimated_price

  let priceMessage = ''
  if (priceDiff === 0) {
    priceMessage = '事前査定と同額となりました。'
  } else if (priceDiff > 0) {
    priceMessage = `事前査定より ¥${priceDiff.toLocaleString()} アップしました！`
  } else {
    priceMessage = `事前査定より ¥${Math.abs(priceDiff).toLocaleString()} 減額となりました。`
  }

  // TODO: 変更箇所の詳細と写真を追加

  const responseUrl = `${BASE_URL}/liff/buyback-response?id=${data.id}`

  const message = `🔍 本査定が完了しました

${data.customer_name} 様

【申込番号】${data.request_number}

■ 査定結果
事前査定: ¥${data.total_estimated_price.toLocaleString()}
本査定: ¥${finalPrice.toLocaleString()}

${priceMessage}

以下のリンクから「承諾」または「返却希望」をお選びください。

${responseUrl}

ご不明点がございましたら、お気軽にメッセージください。`

  return sendLine(data.line_user_id!, message)
}

async function sendLinePaid(data: RequestData): Promise<boolean> {
  const message = `💰 お振込みが完了しました

${data.customer_name} 様

買取代金のお振込みが完了いたしました。

【申込番号】${data.request_number}
【振込金額】¥${(data.final_price || data.total_estimated_price).toLocaleString()}

この度はご利用いただき、誠にありがとうございました。
またのご利用をお待ちしております。`

  return sendLine(data.line_user_id!, message)
}

// =====================================================
// メール通知
// =====================================================

async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!RESEND_API_KEY || !to) return false
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ONE STOP <noreply@onestop-mobile.net>',
        reply_to: ['onestop.mobile2024@gmail.com'],
        to: [to],
        subject,
        text: body,
      }),
    })
    return true
  } catch (e) {
    console.error('メール送信エラー:', e)
    return false
  }
}

async function sendEmailKitSent(data: RequestData): Promise<boolean> {
  const subject = `【ONE STOP】買取キットを発送しました（${data.request_number}）`
  const body = `${data.customer_name} 様

買取キットを本日発送いたしました。

■ 申込番号: ${data.request_number}

■ お届けについて
・お届けまで2〜3日程度かかります
・離島など一部地域はさらにお時間がかかる場合がございます
・ポスト投函でのお届けとなりますので、届かない場合はポストもご確認ください

■ 返送期限について
キット到着後、1週間以内を目安にご返送をお願いいたします。

※発送日から14日以上経過した場合、市場価格の変動により
　買取査定額が変更となる場合がございます。あらかじめご了承ください。

■ キット到着後の手順

【STEP1】発送前の準備（必須）
・「iPhoneを探す」をオフにしてください
・端末を初期化してください

【STEP2】梱包
・買取同意書にご署名のうえ、端末と一緒に箱に入れてください

【STEP3】返送
・着払いで発送できます（送料無料）
・集荷依頼またはヤマト営業所への持ち込みで発送してください

【STEP4】本人確認書類の送付
・LINEで本人確認書類の画像を送信してください
　（免許証・マイナンバーカード・パスポート等）

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

  return sendEmail(data.email!, subject, body)
}

async function sendEmailAssessed(data: RequestData): Promise<boolean> {
  const finalPrice = data.final_price || data.total_estimated_price
  const priceDiff = finalPrice - data.total_estimated_price
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

  let priceMessage = ''
  if (priceDiff === 0) {
    priceMessage = '事前査定と同額となりました。'
  } else if (priceDiff > 0) {
    priceMessage = `事前査定より ¥${priceDiff.toLocaleString()} アップしました！`
  } else {
    priceMessage = `事前査定より ¥${Math.abs(priceDiff).toLocaleString()} 減額となりました。`
  }

  // 減額理由の詳細を生成
  let deductionDetails = ''
  if (priceDiff < 0 && data.assessment_details) {
    const labels: Record<string, string> = {
      screen_scratches: '画面の傷',
      body_scratches: '本体の傷',
      camera_stain: 'カメラ染み',
      other: 'その他',
    }
    const issues: string[] = []

    for (const [key, issue] of Object.entries(data.assessment_details)) {
      if (issue.hasIssue) {
        let issueText = `【${labels[key] || key}】`
        if (issue.description) {
          issueText += `\n${issue.description}`
        }
        if (issue.photos && issue.photos.length > 0) {
          issueText += '\n確認画像:'
          issue.photos.forEach((photo: string, i: number) => {
            issueText += `\n(${i + 1}) ${SUPABASE_URL}/storage/v1/object/public/buyback-documents/${photo}`
          })
        }
        issues.push(issueText)
      }
    }

    if (issues.length > 0) {
      deductionDetails = `\n■ 減額理由\n${issues.join('\n\n')}\n`
    }
  }

  const responseUrl = `${BASE_URL}/buyback-response?id=${data.id}&token=${data.request_number}`

  const subject = `【ONE STOP】本査定が完了しました（${data.request_number}）`
  const body = `${data.customer_name} 様

本査定が完了しましたのでお知らせいたします。

■ 申込番号: ${data.request_number}

■ 査定結果
事前査定: ¥${data.total_estimated_price.toLocaleString()}
本査定: ¥${finalPrice.toLocaleString()}

${priceMessage}
${deductionDetails}
■ ご確認のお願い
以下のリンクから「承諾」または「返却希望」をお選びください。

${responseUrl}

承諾いただいた場合は、振込先情報をご入力いただき、
2営業日以内にお振込みいたします。

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

  return sendEmail(data.email!, subject, body)
}

async function sendEmailPaid(data: RequestData): Promise<boolean> {
  const subject = `【ONE STOP】お振込みが完了しました（${data.request_number}）`
  const body = `${data.customer_name} 様

買取代金のお振込みが完了いたしました。

■ 申込番号: ${data.request_number}
■ 振込金額: ¥${(data.final_price || data.total_estimated_price).toLocaleString()}

お振込先:
${data.bank_name} ${data.branch_name}
${data.account_type} ${data.account_number}
${data.account_holder} 様

この度はご利用いただき、誠にありがとうございました。
またのご利用をお待ちしております。

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

  return sendEmail(data.email!, subject, body)
}
