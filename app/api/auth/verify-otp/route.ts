import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'
import {
  getStaffById,
  verifyOTP,
  logAuthAction,
  clearLoginAttempts
} from '@/app/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { staffId, otpCode } = await request.json()
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 入力チェック
    if (!staffId || !otpCode) {
      return NextResponse.json(
        { success: false, error: 'スタッフIDと認証コードを入力してください' },
        { status: 400 }
      )
    }

    // OTPの形式チェック（6桁の数字）
    if (!/^\d{6}$/.test(otpCode)) {
      return NextResponse.json(
        { success: false, error: '認証コードは6桁の数字で入力してください' },
        { status: 400 }
      )
    }

    // スタッフ情報を取得
    const staff = await getStaffById(staffId)
    if (!staff) {
      return NextResponse.json(
        { success: false, error: '無効なリクエストです' },
        { status: 400 }
      )
    }

    // OTP検証
    const isValid = await verifyOTP(staffId, otpCode)

    if (!isValid) {
      await logAuthAction(staffId, staff.email, '2fa_failure', 'failure', ipAddress, userAgent, 'Invalid OTP')

      return NextResponse.json(
        { success: false, error: '認証コードが正しくないか、有効期限が切れています。' },
        { status: 401 }
      )
    }

    // OTP検証成功 → ログイン成功
    await logAuthAction(staffId, staff.email, '2fa_success', 'success', ipAddress, userAgent)
    await logAuthAction(staffId, staff.email, 'login_success', 'success', ipAddress, userAgent)

    // ログイン試行カウントをリセット
    if (staff.email) {
      await clearLoginAttempts(staff.email)
    }

    // 最終ログイン日時を更新
    await supabaseAdmin
      .from('m_staff')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', staffId)

    // 認証トークンを生成（簡易版：スタッフ情報をBase64エンコード）
    const tokenData = {
      staffId: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      tenantId: staff.tenant_id,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24時間
    }
    const authToken = Buffer.from(JSON.stringify(tokenData)).toString('base64')

    // レスポンスを作成
    const response = NextResponse.json({
      success: true,
      message: 'ログインに成功しました',
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        tenant_id: staff.tenant_id
      }
    })

    // 認証Cookieを設定
    response.cookies.set('auth_token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24時間
      path: '/'
    })

    return response

  } catch (error) {
    console.error('OTP検証エラー:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    )
  }
}