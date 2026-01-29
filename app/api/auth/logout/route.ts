import { NextRequest, NextResponse } from 'next/server'
import { logAuthAction } from '@/app/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { staffId, email } = body
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // ログアウトアクションを記録（オプション）
    if (staffId && email) {
      await logAuthAction(staffId, email, 'logout', 'success', ipAddress, userAgent)
    }

    return NextResponse.json({
      success: true,
      message: 'ログアウトしました'
    })

  } catch (error) {
    console.error('ログアウトエラー:', error)
    return NextResponse.json({
      success: true,
      message: 'ログアウトしました'
    })
  }
}