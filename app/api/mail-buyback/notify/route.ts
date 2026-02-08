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
  | 'kit_sent'          // キット送付
  | 'assessed'          // 本査定完了
  | 'waiting_payment'   // 振込待ち（お客様が承諾）
  | 'return_requested'  // 返送依頼（お客様が返却希望）
  | 'paid'              // 振込完了
  | 'returned'          // 返送完了
  // 旧互換性のため残す
  | 'approved'          // 旧: 承諾受付
  | 'rejected'          // 旧: 返却希望

// 旧形式（互換性のため）
type AssessmentIssue = {
  hasIssue: boolean
  description: string
  photos: string[]
}

type ItemChange = {
  field: string
  label: string
  beforeValue: string
  afterValue: string
  hasChanged: boolean
}

// 新形式: 写真+備考
type AssessmentPhoto = {
  path: string
  note: string
}

// 新旧両形式に対応
type AssessmentDetails = {
  // 新形式
  item_changes?: ItemChange[]
  photos?: AssessmentPhoto[]
  // 旧形式（互換性のため）
  screen_scratches?: AssessmentIssue
  body_scratches?: AssessmentIssue
  camera_stain?: AssessmentIssue
  other?: AssessmentIssue
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

      case 'waiting_payment':
      case 'approved': // 旧互換性
        results.slack = await sendSlackWaitingPayment(data)
        // お客様にも振込予定の通知を送信
        if (isLiff) {
          results.line = await sendLineWaitingPayment(data)
        } else if (data.email) {
          results.email = await sendEmailWaitingPayment(data)
        }
        break

      case 'return_requested':
      case 'rejected': // 旧互換性
        results.slack = await sendSlackReturnRequested(data)
        break

      case 'paid':
        results.slack = await sendSlackPaid(data)
        if (isLiff) {
          results.line = await sendLinePaid(data)
        } else if (data.email) {
          results.email = await sendEmailPaid(data)
        }
        break

      case 'returned':
        results.slack = await sendSlackReturned(data)
        if (isLiff) {
          results.line = await sendLineReturned(data)
        } else if (data.email) {
          results.email = await sendEmailReturned(data)
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

async function sendSlackPaid(data: RequestData): Promise<boolean> {
  const message = `💰 振込完了
申込番号: ${data.request_number}
氏名: ${data.customer_name} 様
振込金額: ¥${(data.final_price || data.total_estimated_price).toLocaleString()}
振込先: ${data.bank_name} ${data.branch_name} ${data.account_number}`
  return sendSlack(message)
}

async function sendSlackReturned(data: RequestData): Promise<boolean> {
  const message = `📮 返送完了
申込番号: ${data.request_number}
氏名: ${data.customer_name} 様
→ お客様に返送完了メールを送信しました`
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

■ 本人確認書類のお願い
運転免許証・マイナンバーカード等の画像をこのLINEにお送りください。
または端末と一緒にコピーを同封してください。

※マイナンバーカードは表面のみ。裏面は送付不要です。

ご不明点がございましたら、お気軽にメッセージください。`

  return sendLine(data.line_user_id!, message)
}

async function sendLineAssessed(data: RequestData): Promise<boolean> {
  const finalPrice = data.final_price || data.total_estimated_price
  const priceDiff = finalPrice - data.total_estimated_price

  // 本査定値の表示用フォーマット（顧客向け）
  const formatValueForCustomer = (field: string, value: string): string => {
    switch (field) {
      case 'nwStatus':
        return value === 'ok' ? '○' : value === 'triangle' ? '△' : '×'
      case 'cameraStain':
        return value === 'none' ? 'なし' : 'あり'
      case 'cameraBroken':
      case 'repairHistory':
        return value === 'yes' ? 'あり' : 'なし'
      default:
        return value
    }
  }

  let priceMessage = ''
  let changesText = ''

  // 項目変更リストを取得
  const itemChanges = data.assessment_details?.item_changes?.filter(c => c.hasChanged) || []

  if (priceDiff === 0) {
    priceMessage = '事前査定と同額となりました。'
  } else if (priceDiff > 0) {
    priceMessage = `事前査定より ¥${priceDiff.toLocaleString()} アップしました！`
    if (itemChanges.length > 0) {
      changesText = '\n■ 増額理由\n'
      itemChanges.forEach((change, idx) => {
        changesText += `${idx + 1}. ${change.label}: ${change.beforeValue} → ${formatValueForCustomer(change.field, change.afterValue)}\n`
      })
    }
  } else {
    priceMessage = `事前査定より ¥${Math.abs(priceDiff).toLocaleString()} 減額となりました。`
    if (itemChanges.length > 0) {
      changesText = '\n■ 減額理由\n'
      itemChanges.forEach((change, idx) => {
        changesText += `${idx + 1}. ${change.label}: ${change.beforeValue} → ${formatValueForCustomer(change.field, change.afterValue)}\n`
      })
    }
  }

  const responseUrl = `${BASE_URL}/liff/buyback-response?id=${data.id}`

  const message = `本査定が完了しました

${data.customer_name} 様

【申込番号】${data.request_number}

■ 査定結果
事前査定: ¥${data.total_estimated_price.toLocaleString()}
本査定: ¥${finalPrice.toLocaleString()}

${priceMessage}
${changesText}
下記URLから買取か返却の回答をお願いします。
${responseUrl}`

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

async function sendLineWaitingPayment(data: RequestData): Promise<boolean> {
  const finalPrice = data.final_price || data.total_estimated_price

  // 振込予定の判定（19時以前/以降）
  const now = new Date()
  const hour = now.getHours()
  const paymentTiming = hour < 19
    ? '翌営業日の朝9時までにお振込みいたします。'
    : '翌々営業日の朝9時までにお振込みいたします。'

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
${paymentTiming}

※内容に誤りがある場合は、お手数ですがこのLINEまたはお電話でご連絡ください。

━━━━━━━━━━━
ONE STOP
福井店：080-9361-6018
鯖江店：080-5720-1164
━━━━━━━━━━━`

  return sendLine(data.line_user_id!, message)
}

async function sendLineReturned(data: RequestData): Promise<boolean> {
  const message = `端末の返送が完了しました

${data.customer_name} 様

端末の返送手続きが完了いたしました。
数日中にお届け予定です。

【申込番号】${data.request_number}

この度はご利用いただき、誠にありがとうございました。`

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
本人確認書類（運転免許証・マイナンバーカード・パスポート等）の
画像またはコピーをお送りください。

＜送信方法＞※いずれか1つの方法でお送りください
・買取端末と一緒にコピーを同封して郵送
・このメールに画像を添付して返信
・公式LINEで画像を送信

※マイナンバーカードは表面のみお送りください。
　裏面（個人番号が記載された面）は送付しないでください。

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
  const responseUrl = `${BASE_URL}/buyback-response?id=${data.id}&token=${data.request_number}`
  const assessmentUrl = `${BASE_URL}/buyback-assessment?id=${data.id}&token=${data.request_number}`

  const subject = `【ONE STOP】本査定が完了しました（${data.request_number}）`

  // 本査定値の表示用フォーマット（顧客向け）
  // カメラ染みは管理画面では少/多を選択するが、顧客にはあり/なしのみ表示
  const formatAfterValue = (field: string, value: string): string => {
    switch (field) {
      case 'nwStatus':
        return value === 'ok' ? '○' : value === 'triangle' ? '△' : '×'
      case 'cameraStain':
        // 顧客には あり/なし のみ表示（管理画面では 少/多 を選択）
        return value === 'none' ? 'なし' : 'あり'
      case 'cameraBroken':
      case 'repairHistory':
        return value === 'yes' ? 'あり' : 'なし'
      default:
        return value
    }
  }

  // 項目変更リストを取得
  const itemChanges = data.assessment_details?.item_changes?.filter(c => c.hasChanged) || []

  let body = ''

  if (priceDiff === 0) {
    // パターン1: 価格変更なし
    body = `${data.customer_name} 様

本査定が完了しました。

■ 申込番号: ${data.request_number}

■ 査定結果
事前査定と同額のため、買取価格に変更はございません。

買取価格: ¥${finalPrice.toLocaleString()}

下記URLから買取か返却の回答をお願いします。
${responseUrl}

ご不明点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━
ONE STOP
福井店：080-9361-6018
鯖江店：080-5720-1164
メール：onestop.mobile2024@gmail.com
LINE：https://lin.ee/F5fr4V7
━━━━━━━━━━━━━━━━━━━━`

  } else if (priceDiff > 0) {
    // パターン2: 価格アップ（増額）
    let increaseReasons = ''
    if (itemChanges.length > 0) {
      increaseReasons = '\n■ 増額理由\n'
      itemChanges.forEach((change, idx) => {
        increaseReasons += `${idx + 1}. ${change.label}: ${change.beforeValue} → ${formatAfterValue(change.field, change.afterValue)}\n`
      })
    }

    body = `${data.customer_name} 様

本査定が完了しました。

■ 申込番号: ${data.request_number}

■ 査定結果
事前査定より ¥${priceDiff.toLocaleString()} アップしました！

事前査定: ¥${data.total_estimated_price.toLocaleString()}
　　↓
買取価格: ¥${finalPrice.toLocaleString()}
${increaseReasons}
下記URLから買取か返却の回答をお願いします。
${responseUrl}

ご不明点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━
ONE STOP
福井店：080-9361-6018
鯖江店：080-5720-1164
メール：onestop.mobile2024@gmail.com
LINE：https://lin.ee/F5fr4V7
━━━━━━━━━━━━━━━━━━━━`

  } else {
    // パターン3: 価格ダウン（減額）
    let decreaseReasons = ''
    if (itemChanges.length > 0) {
      decreaseReasons = '\n■ 減額理由\n'
      itemChanges.forEach((change, idx) => {
        decreaseReasons += `${idx + 1}. ${change.label}: ${change.beforeValue} → ${formatAfterValue(change.field, change.afterValue)}\n`
      })
      // 画像がある場合のみURLを表示
      const hasPhotos = data.assessment_details?.photos && data.assessment_details.photos.length > 0
      if (hasPhotos) {
        decreaseReasons += `\n減額理由の画像: ${assessmentUrl}\n`
      }
    }

    body = `${data.customer_name} 様

本査定が完了しました。

■ 申込番号: ${data.request_number}

■ 査定結果
事前査定より ¥${Math.abs(priceDiff).toLocaleString()} 減額となりました。

事前査定: ¥${data.total_estimated_price.toLocaleString()}
　　↓
買取価格: ¥${finalPrice.toLocaleString()}
${decreaseReasons}
下記URLから買取か返却の回答をお願いします。
${responseUrl}

ご不明点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━
ONE STOP
福井店：080-9361-6018
鯖江店：080-5720-1164
メール：onestop.mobile2024@gmail.com
LINE：https://lin.ee/F5fr4V7
━━━━━━━━━━━━━━━━━━━━`
  }

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

━━━━━━━━━━━━━━━━━━━━
ONE STOP
福井店：080-9361-6018
鯖江店：080-5720-1164
メール：onestop.mobile2024@gmail.com
LINE：https://lin.ee/F5fr4V7
━━━━━━━━━━━━━━━━━━━━`

  return sendEmail(data.email!, subject, body)
}

async function sendEmailWaitingPayment(data: RequestData): Promise<boolean> {
  const finalPrice = data.final_price || data.total_estimated_price

  // 振込予定の判定（19時以前/以降）
  const now = new Date()
  const hour = now.getHours()
  const paymentTiming = hour < 19
    ? '翌営業日の朝9時までにお振込みいたします。'
    : '翌々営業日の朝9時までにお振込みいたします。'

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
${paymentTiming}

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

async function sendEmailReturned(data: RequestData): Promise<boolean> {
  const subject = `【ONE STOP】端末を返送いたしました（${data.request_number}）`
  const body = `${data.customer_name} 様

端末の返送手続きが完了いたしました。

■ 申込番号: ${data.request_number}

数日中にお届け予定です。
届きましたらご確認ください。

この度はご利用いただき、誠にありがとうございました。

━━━━━━━━━━━━━━━━━━━━
ONE STOP
福井店：080-9361-6018
鯖江店：080-5720-1164
メール：onestop.mobile2024@gmail.com
LINE：https://lin.ee/F5fr4V7
━━━━━━━━━━━━━━━━━━━━`

  return sendEmail(data.email!, subject, body)
}
