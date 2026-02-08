import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 認可チェック（認証済みユーザーのみ）
    const authResult = await requireAuth(request.headers.get('authorization'))
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.message },
        { status: authResult.status }
      )
    }

    const { to, subject, body } = await request.json()

    // Resend APIを使用（または他のメール送信サービス）
    // 環境変数 RESEND_API_KEY が必要
    const RESEND_API_KEY = process.env.RESEND_API_KEY

    if (!RESEND_API_KEY) {
      // APIキーがない場合はログのみ
      console.log('===== メール送信（テストモード） =====')
      console.log('To:', to)
      console.log('Subject:', subject)
      console.log('Body:', body)
      console.log('=====================================')
      return NextResponse.json({ success: true, mode: 'test' })
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ONE STOP <noreply@onestop-system.com>',
        to: [to],
        subject: subject,
        text: body,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
