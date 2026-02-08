/**
 * 郵送買取 辞退記録API
 * 査定だけして買取を辞退した場合にデータを保存
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      items,
      totalEstimatedPrice,
      source,
      lineUserId,
    } = body

    // バリデーション
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: '端末情報がありません' },
        { status: 400 }
      )
    }

    // 申込番号を生成（DC-YYYY-MMDD-NNN）※Declinedの略
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const prefix = `DC-${dateStr}`

    // 今日の既存辞退数を取得して連番を決定
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

    // DBに保存（顧客情報なし、端末情報のみ）
    const { error: insertError } = await supabaseAdmin
      .from('t_mail_buyback_requests')
      .insert({
        tenant_id: 1,
        request_number: requestNumber,
        status: 'declined',
        customer_name: '(辞退)',  // 匿名
        phone: '-',
        items: items,
        total_estimated_price: totalEstimatedPrice,
        item_count: items.length,
        line_user_id: lineUserId || null,
        source: source || 'web',
        // declined_atはcreated_atで代用（テーブルにカラムがない場合に備え）
      })

    if (insertError) {
      console.error('DB insert error:', insertError)
      return NextResponse.json(
        { success: false, error: 'データの保存に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      requestNumber,
    })
  } catch (error) {
    console.error('Decline API error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
