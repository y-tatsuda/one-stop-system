/**
 * =====================================================
 * LIFF 買取申込み - 送信API
 * =====================================================
 *
 * 処理内容:
 * 1. Supabase に買取申込みを保存
 * 2. Lステップにタグ付け（API連携）
 * 3. Slackに通知
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const LSTEP_API_URL = 'https://api.lstep.app/v1'
const LSTEP_API_KEY = process.env.LSTEP_API_KEY
const LSTEP_ACCOUNT_ID = process.env.LSTEP_ACCOUNT_ID
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL_BUYBACK

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      lineUserId,
      lineDisplayName,
      items,
      customerInfo,
      totalEstimatedPrice,
    } = body

    // 申込番号を生成
    const requestNumber = generateRequestNumber()

    // ① Supabase に保存
    const { data: buybackRequest, error } = await supabase
      .from('t_mail_buyback_requests')
      .insert({
        tenant_id: 1,
        request_number: requestNumber,
        status: 'pending',
        customer_name: customerInfo.name,
        customer_name_kana: customerInfo.nameKana || null,
        postal_code: customerInfo.postalCode?.replace('-', '') || null,
        address: customerInfo.address || null,
        address_detail: customerInfo.addressDetail || null,
        phone: customerInfo.phone || null,
        email: customerInfo.email || null,
        line_user_id: lineUserId,
        line_display_name: lineDisplayName,
        items: items,
        total_estimated_price: totalEstimatedPrice,
        item_count: items.length,
        source: 'liff', // LIFFからの申込みを識別
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw new Error('データベースへの保存に失敗しました')
    }

    // ② Lステップにタグ付け（非同期で実行、エラーでも続行）
    const lstepPromise = tagLstepUser(lineUserId, customerInfo.name).catch(err => {
      console.error('Lステップ連携エラー:', err)
    })

    // ③ Slack通知（非同期で実行、エラーでも続行）
    const slackPromise = sendSlackNotification({
      requestNumber,
      customerName: customerInfo.name,
      lineDisplayName,
      items,
      totalEstimatedPrice,
    }).catch(err => {
      console.error('Slack通知エラー:', err)
    })

    // 並列実行を待つ（メイン処理は成功扱い）
    await Promise.allSettled([lstepPromise, slackPromise])

    return NextResponse.json({
      success: true,
      requestNumber,
      message: '買取申込みを受け付けました',
    })

  } catch (error) {
    console.error('買取申込みエラー:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '申込み処理に失敗しました' },
      { status: 500 }
    )
  }
}

// 申込番号生成
function generateRequestNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `MB-${year}-${month}${day}-${random}`
}

// Lステップにタグ付け
async function tagLstepUser(lineUserId: string, customerName: string) {
  if (!LSTEP_API_KEY || !LSTEP_ACCOUNT_ID) {
    console.log('Lステップ API未設定、スキップ')
    return
  }

  // タグ付け
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

  // 顧客名を更新
  await fetch(`${LSTEP_API_URL}/users/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LSTEP_API_KEY}`,
      'X-Account-Id': LSTEP_ACCOUNT_ID,
    },
    body: JSON.stringify({
      uid: lineUserId,
      name: customerName,
    }),
  })
}

// Slack通知
async function sendSlackNotification(data: {
  requestNumber: string
  customerName: string
  lineDisplayName: string
  items: any[]
  totalEstimatedPrice: number
}) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('Slack Webhook未設定、スキップ')
    return
  }

  const itemSummary = data.items.map((item: any) =>
    `• ${item.modelDisplayName} ${item.storage}GB ${item.rank}`
  ).join('\n')

  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `📱 買取申込みがありました`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📱 新規買取申込み',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*申込番号*\n\`${data.requestNumber}\``,
            },
            {
              type: 'mrkdwn',
              text: `*お客様*\n${data.customerName}\n(LINE: ${data.lineDisplayName})`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*端末*\n${itemSummary}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*概算金額*\n¥${data.totalEstimatedPrice.toLocaleString()}`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `LIFF経由 | ${new Date().toLocaleString('ja-JP')}`,
            },
          ],
        },
      ],
    }),
  })
}
