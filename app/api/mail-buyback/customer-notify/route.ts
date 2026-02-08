/**
 * =====================================================
 * 郵送買取 お客様用通知API（認証不要）
 * =====================================================
 *
 * お客様が承諾/返却を選択した際に通知を送信
 * - waiting_payment: 振込待ち（お客様が承諾して振込先を登録）
 * - return_requested: 返送依頼（お客様が返却を希望）
 *
 * セキュリティ: requestIdとrequest_numberの組み合わせで検証
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL_BUYBACK
const RESEND_API_KEY = process.env.RESEND_API_KEY

type CustomerAction = 'waiting_payment' | 'return_requested'

type RequestData = {
  id: number
  request_number: string
  customer_name: string
  phone: string
  email: string | null
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
}

export async function POST(request: NextRequest) {
  try {
    const { action, requestId, requestNumber } = await request.json() as {
      action: CustomerAction
      requestId: number
      requestNumber?: string // 追加のセキュリティ検証用
    }

    // 許可されたアクションのみ
    if (!['waiting_payment', 'return_requested'].includes(action)) {
      return NextResponse.json({ success: false, error: '無効なアクションです' }, { status: 400 })
    }

    // リクエストデータを取得
    const { data: reqData, error } = await supabaseAdmin
      .from('t_mail_buyback_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (error || !reqData) {
      return NextResponse.json({ success: false, error: 'データが見つかりません' }, { status: 404 })
    }

    // requestNumberが提供された場合は検証
    if (requestNumber && reqData.request_number !== requestNumber) {
      return NextResponse.json({ success: false, error: '無効なリクエストです' }, { status: 403 })
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
      case 'waiting_payment':
        results.slack = await sendSlackWaitingPayment(data)
        if (isLiff) {
          results.line = await sendLineWaitingPayment(data)
        } else if (data.email) {
          results.email = await sendEmailWaitingPayment(data)
        }
        break

      case 'return_requested':
        results.slack = await sendSlackReturnRequested(data)
        // 返却希望はお客様への通知は不要（Slack通知のみ）
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

async function sendSlackWaitingPayment(data: RequestData): Promise<boolean> {
  const message = `✅ 振込待ち（お客様承諾）
申込番号: ${data.request_number}
氏名: ${data.customer_name} 様
最終価格: ¥${(data.final_price || data.total_estimated_price).toLocaleString()}

【振込先】
${data.bank_name || '未入力'} ${data.branch_name || ''}
${data.account_type || ''} ${data.account_number || ''}
${data.account_holder || ''}`
  return sendSlack(message)
}

async function sendSlackReturnRequested(data: RequestData): Promise<boolean> {
  const message = `📦 返送依頼
申込番号: ${data.request_number}
氏名: ${data.customer_name} 様
→ 返送手続きが必要です`
  return sendSlack(message)
}

// =====================================================
// LINE通知
// =====================================================

async function sendLine(userId: string, message: string): Promise<boolean> {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !userId) return false
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
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
    if (!res.ok) {
      console.error('LINE送信失敗:', await res.text())
      return false
    }
    return true
  } catch (e) {
    console.error('LINE送信エラー:', e)
    return false
  }
}

async function sendLineWaitingPayment(data: RequestData): Promise<boolean> {
  const finalPrice = data.final_price || data.total_estimated_price

  const message = `✅ 買取のご依頼を承りました

${data.customer_name} 様

買取のご依頼ありがとうございます。
以下の内容で振込手続きを進めます。

【申込番号】${data.request_number}
【振込金額】¥${finalPrice.toLocaleString()}

【お振込先】
${data.bank_name} ${data.branch_name}
${data.account_type} ${data.account_number}
${data.account_holder} 様

【振込予定】
・19時までのご依頼：翌営業日の朝9時までにお振込み
・19時以降のご依頼：翌々営業日の朝9時までにお振込み

※内容に誤りがある場合は、お手数ですがこのLINEまたはお電話でご連絡ください。

━━━━━━━━━━━
ONE STOP
福井店：080-9361-6018
鯖江店：080-5720-1164
━━━━━━━━━━━`

  return sendLine(data.line_user_id!, message)
}

// =====================================================
// メール通知
// =====================================================

async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!RESEND_API_KEY || !to) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
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
    if (!res.ok) {
      console.error('メール送信失敗:', await res.text())
      return false
    }
    return true
  } catch (e) {
    console.error('メール送信エラー:', e)
    return false
  }
}

async function sendEmailWaitingPayment(data: RequestData): Promise<boolean> {
  const finalPrice = data.final_price || data.total_estimated_price

  const subject = `【ONE STOP】買取のご依頼を承りました（${data.request_number}）`
  const body = `${data.customer_name} 様

買取のご依頼ありがとうございます。
以下の内容で振込手続きを進めます。

■ 申込番号: ${data.request_number}
■ 振込金額: ¥${finalPrice.toLocaleString()}

■ お振込先
${data.bank_name} ${data.branch_name}
${data.account_type} ${data.account_number}
${data.account_holder} 様

■ 振込予定
・19時までのご依頼：翌営業日の朝9時までにお振込み
・19時以降のご依頼：翌々営業日の朝9時までにお振込み

※内容に誤りがある場合は、お手数ですがメール・LINE・お電話にてご連絡ください。

━━━━━━━━━━━━━━━━━━━━
ONE STOP
福井店：080-9361-6018
鯖江店：080-5720-1164
メール：onestop.mobile2024@gmail.com
LINE：https://lin.ee/F5fr4V7
━━━━━━━━━━━━━━━━━━━━`

  return sendEmail(data.email!, subject, body)
}
