import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'
import {
  getStaffByInvitationToken,
  validatePassword,
  logAuthAction
} from '@/app/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json()
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 入力チェック
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'すべての項目を入力してください' },
        { status: 400 }
      )
    }

    // パスワード一致チェック
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'パスワードが一致しません' },
        { status: 400 }
      )
    }

    // パスワードポリシーチェック
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.errors.join('\n') },
        { status: 400 }
      )
    }

    // 招待トークンでスタッフを検索
    const staff = await getStaffByInvitationToken(token)
    if (!staff) {
      return NextResponse.json(
        { success: false, error: '招待リンクが無効か、有効期限が切れています' },
        { status: 400 }
      )
    }

    // 既にアクティベート済みの場合
    if (staff.is_active && staff.auth_user_id) {
      return NextResponse.json(
        { success: false, error: 'このアカウントは既に有効化されています' },
        { status: 400 }
      )
    }

    // Supabase Auth でユーザー作成
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: staff.email!,
      password,
      email_confirm: true
    })

    if (authError || !authData.user) {
      console.error('Auth ユーザー作成エラー:', authError)
      return NextResponse.json(
        { success: false, error: 'アカウントの作成に失敗しました' },
        { status: 500 }
      )
    }

    // m_staff を更新
    const { error: updateError } = await supabaseAdmin
      .from('m_staff')
      .update({
        auth_user_id: authData.user.id,
        is_active: true,
        invitation_token: null,
        invitation_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', staff.id)

    if (updateError) {
      console.error('スタッフ更新エラー:', updateError)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { success: false, error: 'アカウントの有効化に失敗しました' },
        { status: 500 }
      )
    }

    await logAuthAction(staff.id, staff.email, 'account_activated', 'success', ipAddress, userAgent)

    return NextResponse.json({
      success: true,
      message: 'アカウントを有効化しました。ログインしてください。'
    })

  } catch (error) {
    console.error('アクティベーションエラー:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    )
  }
}

// 招待情報取得（GET）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'トークンが必要です' },
        { status: 400 }
      )
    }

    const staff = await getStaffByInvitationToken(token)
    if (!staff) {
      return NextResponse.json(
        { success: false, error: '招待リンクが無効か、有効期限が切れています' },
        { status: 400 }
      )
    }

    if (staff.is_active && staff.auth_user_id) {
      return NextResponse.json(
        { success: false, error: 'このアカウントは既に有効化されています' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      staff: {
        name: staff.name,
        email: staff.email
      }
    })

  } catch (error) {
    console.error('招待情報取得エラー:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    )
  }
}
