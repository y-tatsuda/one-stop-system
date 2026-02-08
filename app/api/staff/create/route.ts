import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'
import { requireAuth } from '@/app/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 認可チェック（owner/adminのみスタッフ作成可能）
    const authResult = await requireAuth(
      request.headers.get('authorization'),
      ['owner', 'admin']
    )
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.message },
        { status: authResult.status }
      )
    }

    const { name, email, password, role, is_2fa_enabled, shopIds } = await request.json()

    // 入力チェック
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: '必須項目を入力してください' },
        { status: 400 }
      )
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      )
    }

    // パスワード要件チェック
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'パスワードは8文字以上必要です' },
        { status: 400 }
      )
    }

    // 既存メールアドレスチェック
    const { data: existingStaff } = await supabaseAdmin
      .from('m_staff')
      .select('id')
      .eq('email', email)
      .single()

    if (existingStaff) {
      return NextResponse.json(
        { success: false, error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    // Supabase Authでユーザー作成
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // メール確認をスキップ
    })

    if (authError || !authData.user) {
      console.error('Auth作成エラー:', authError)
      return NextResponse.json(
        { success: false, error: 'ユーザーの作成に失敗しました: ' + (authError?.message || '不明なエラー') },
        { status: 500 }
      )
    }

    // m_staffにレコード作成
    const { data: newStaff, error: staffError } = await supabaseAdmin
      .from('m_staff')
      .insert({
        tenant_id: authResult.auth.tenantId,
        auth_user_id: authData.user.id,
        email,
        name,
        role: role || 'staff',
        is_active: true,
        is_2fa_enabled: is_2fa_enabled ?? true,
        password_changed: false, // 初回ログイン時にパスワード変更を強制
      })
      .select()
      .single()

    if (staffError || !newStaff) {
      console.error('スタッフ作成エラー:', staffError)
      // ロールバック: Authユーザーを削除
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { success: false, error: 'スタッフの作成に失敗しました' },
        { status: 500 }
      )
    }

    // 所属店舗を登録
    if (shopIds && shopIds.length > 0) {
      const staffShops = shopIds.map((shopId: number) => ({
        staff_id: newStaff.id,
        shop_id: shopId,
      }))

      const { error: shopError } = await supabaseAdmin
        .from('m_staff_shops')
        .insert(staffShops)

      if (shopError) {
        console.error('店舗紐付けエラー:', shopError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'スタッフを追加しました',
      staff: {
        id: newStaff.id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
      },
    })

  } catch (error) {
    console.error('スタッフ作成エラー:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}