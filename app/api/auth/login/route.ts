import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'
import {
  getStaffByEmail,
  generateOTP,
  sendOTPEmail,
  logAuthAction,
  checkLoginAttempts,
  recordLoginFailure,
  clearLoginAttempts
} from '@/app/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    console.log('🚀 Login attempt started for:', email)

    // 入力チェック
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスとパスワードを入力してください' },
        { status: 400 }
      )
    }

    // ブルートフォース対策：試行回数チェック
    const attemptCheck = await checkLoginAttempts(email, ipAddress)
    if (!attemptCheck.allowed) {
      const unlockTime = attemptCheck.lockedUntil
        ? new Date(attemptCheck.lockedUntil).toLocaleTimeString('ja-JP')
        : '15分後'

      return NextResponse.json(
        {
          success: false,
          error: `ログイン試行回数が上限に達しました。${unlockTime}以降に再度お試しください。`
        },
        { status: 429 }
      )
    }

    // Supabase Auth でパスワード認証
    console.log('🔐 Attempting password auth for:', email)
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    })

    console.log('🔐 Auth result - error:', authError)
    console.log('🔐 Auth result - user:', authData?.user?.id)

    if (authError || !authData.user) {
      // ログイン失敗を記録
      await recordLoginFailure(email, ipAddress)
      await logAuthAction(null, email, 'login_failure', 'failure', ipAddress, userAgent, 'Invalid credentials')

      const remaining = attemptCheck.remainingAttempts - 1

      return NextResponse.json(
        {
          success: false,
          error: `メールアドレスまたはパスワードが正しくありません。（残り${remaining}回）`
        },
        { status: 401 }
      )
    }

    // スタッフ情報を取得
    console.log('👤 Getting staff info for:', email)
    const staff = await getStaffByEmail(email)
    console.log('👤 Staff result:', staff)

    if (!staff) {
      await logAuthAction(null, email, 'login_failure', 'failure', ipAddress, userAgent, 'Staff not found')
      return NextResponse.json(
        { success: false, error: 'このアカウントは無効です。管理者にお問い合わせください。' },
        { status: 403 }
      )
    }

    // アカウントが無効化されている場合
    if (!staff.is_active) {
      await logAuthAction(staff.id, email, 'login_failure', 'failure', ipAddress, userAgent, 'Account disabled')
      return NextResponse.json(
        { success: false, error: 'このアカウントは無効化されています。' },
        { status: 403 }
      )
    }

    // 2段階認証が有効な場合
    if (staff.is_2fa_enabled) {
      // OTPを生成
      const otpCode = await generateOTP(staff.id)
      if (!otpCode) {
        return NextResponse.json(
          { success: false, error: '認証コードの生成に失敗しました。' },
          { status: 500 }
        )
      }

      // OTPをメールで送信
      const emailSent = await sendOTPEmail(email, otpCode)
      if (!emailSent) {
        console.warn('OTPメール送信に失敗しましたが、処理を継続します')
      }

      await logAuthAction(staff.id, email, 'otp_requested', 'success', ipAddress, userAgent)

      return NextResponse.json({
        success: true,
        requiresOTP: true,
        staffId: staff.id,
        message: '認証コードをメールに送信しました'
      })
    }

    // 2段階認証なしの場合 → 直接ログイン成功
    await logAuthAction(staff.id, email, 'login_success', 'success', ipAddress, userAgent)
    await clearLoginAttempts(email)

    // 最終ログイン日時を更新
    await supabaseAdmin
      .from('m_staff')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', staff.id)

    // トークンを生成
    const tokenData = {
      staffId: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      tenantId: staff.tenant_id,
      passwordChanged: staff.password_changed ?? false,
      exp: Date.now() + 24 * 60 * 60 * 1000
    }
    const authToken = Buffer.from(JSON.stringify(tokenData)).toString('base64')

    return NextResponse.json({
      success: true,
      requiresOTP: false,
      token: authToken,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        tenant_id: staff.tenant_id,
        password_changed: staff.password_changed ?? false
      }
    })

  } catch (error) {
    console.error('ログインエラー:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    )
  }
}