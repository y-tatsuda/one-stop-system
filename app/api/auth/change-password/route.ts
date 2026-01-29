import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'
import { getStaffById, logAuthAction, validatePassword } from '@/app/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { staffId, currentPassword, newPassword } = await request.json()
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 入力チェック
    if (!staffId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: '全ての項目を入力してください' },
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

    // 現在のパスワードで認証
    const { error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: staff.email,
      password: currentPassword
    })

    if (authError) {
      await logAuthAction(staffId, staff.email, 'password_change_failure', 'failure', ipAddress, userAgent, 'Invalid current password')
      return NextResponse.json(
        { success: false, error: '現在のパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // 新しいパスワードのバリデーション
    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Auth User IDを取得
    if (!staff.auth_user_id) {
      return NextResponse.json(
        { success: false, error: 'ユーザー情報が不完全です' },
        { status: 400 }
      )
    }

    // Supabase Authでパスワードを更新
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      staff.auth_user_id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('パスワード更新エラー:', updateError)
      return NextResponse.json(
        { success: false, error: 'パスワードの更新に失敗しました' },
        { status: 500 }
      )
    }

    // m_staffのpassword_changedフラグを更新
    const { error: staffUpdateError } = await supabaseAdmin
      .from('m_staff')
      .update({ 
        password_changed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)

    if (staffUpdateError) {
      console.error('スタッフ情報更新エラー:', staffUpdateError)
    }

    // ログ記録
    await logAuthAction(staffId, staff.email, 'password_change', 'success', ipAddress, userAgent)

    return NextResponse.json({
      success: true,
      message: 'パスワードを変更しました'
    })

  } catch (error) {
    console.error('パスワード変更エラー:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
