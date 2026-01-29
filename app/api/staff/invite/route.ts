import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'
import {
  logAuthAction,
  sendInvitationEmail
} from '@/app/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, name, role = 'staff', shopIds = [] } = await request.json()
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 入力チェック
    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスと名前を入力してください' },
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

    // TODO: セッション管理実装後に権限チェックを追加
    // 現在は tenant_id: 1 固定で動作させる
    const tenantId = 1

    // 既存のメールアドレスチェック
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

    // 招待トークンを生成
    const invitationToken = crypto.randomUUID() + crypto.randomUUID()

    // スタッフレコードを作成（auth_user_idは後で紐付け）
    const { data: newStaff, error: insertError } = await supabaseAdmin
      .from('m_staff')
      .insert({
        tenant_id: tenantId,
        email,
        name,
        role,
        is_active: false,
        invitation_token: invitationToken,
        invited_at: new Date().toISOString(),
        invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (insertError || !newStaff) {
      console.error('スタッフ作成エラー:', insertError)
      return NextResponse.json(
        { success: false, error: 'スタッフの作成に失敗しました' },
        { status: 500 }
      )
    }

    // 店舗を紐付け（shopIdsが指定されている場合）
    if (shopIds.length > 0) {
      const staffShops = shopIds.map((shopId: number) => ({
        staff_id: newStaff.id,
        shop_id: shopId
      }))

      await supabaseAdmin
        .from('m_staff_shops')
        .insert(staffShops)
    }

    // 招待メールを送信
    const sent = await sendInvitationEmail(email, name, invitationToken)
    if (!sent) {
      console.warn('招待メール送信失敗:', email)
    }

    await logAuthAction(newStaff.id, email, 'invitation_sent', 'success', ipAddress, userAgent)

    return NextResponse.json({
      success: true,
      message: '招待メールを送信しました',
      staff: {
        id: newStaff.id,
        email: newStaff.email,
        name: newStaff.name,
        role: newStaff.role
      }
    })

  } catch (error) {
    console.error('招待エラー:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    )
  }
}