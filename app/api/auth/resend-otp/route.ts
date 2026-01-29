import { NextRequest, NextResponse } from 'next/server'
import {
  getStaffById,
  generateOTP,
  sendOTPEmail,
  logAuthAction
} from '@/app/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { staffId } = await request.json()
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 入力チェック
    if (!staffId) {
      return NextResponse.json(
        { success: false, error: '無効なリクエストです' },
        { status: 400 }
      )
    }

    // スタッフ情報を取得
    const staff = await getStaffById(staffId)
    if (!staff || !staff.email) {
      return NextResponse.json(
        { success: false, error: '無効なリクエストです' },
        { status: 400 }
      )
    }

    // アカウントが無効化されている場合
    if (!staff.is_active) {
      return NextResponse.json(
        { success: false, error: 'このアカウントは無効化されています。' },
        { status: 403 }
      )
    }

    // 新しいOTPを生成
    const otpCode = await generateOTP(staff.id)
    if (!otpCode) {
      return NextResponse.json(
        { success: false, error: '認証コードの生成に失敗しました。' },
        { status: 500 }
      )
    }

    // OTPをメール送信
    const sent = await sendOTPEmail(staff.email, otpCode)
    if (!sent) {
      return NextResponse.json(
        { success: false, error: '認証コードの送信に失敗しました。' },
        { status: 500 }
      )
    }

    await logAuthAction(staff.id, staff.email, '2fa_sent', 'success', ipAddress, userAgent)

    return NextResponse.json({
      success: true,
      message: '認証コードを再送信しました。'
    })

  } catch (error) {
    console.error('OTP再送信エラー:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    )
  }
}
