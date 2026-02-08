import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'
import { requireAuth } from '@/app/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 認可チェック（owner/adminのみ削除可能）
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

    const { staffId } = await request.json()

    if (!staffId) {
      return NextResponse.json(
        { success: false, error: 'スタッフIDが必要です' },
        { status: 400 }
      )
    }

    // 自分自身は削除できない
    if (staffId === authResult.auth.staffId) {
      return NextResponse.json(
        { success: false, error: '自分自身を削除することはできません' },
        { status: 400 }
      )
    }

    // スタッフ情報を取得
    const { data: staff, error: fetchError } = await supabaseAdmin
      .from('m_staff')
      .select('id, auth_user_id, name')
      .eq('id', staffId)
      .single()

    if (fetchError || !staff) {
      return NextResponse.json(
        { success: false, error: 'スタッフが見つかりません' },
        { status: 404 }
      )
    }

    // 所属店舗の紐付けを削除
    await supabaseAdmin
      .from('m_staff_shops')
      .delete()
      .eq('staff_id', staffId)

    // Supabase Authユーザーを削除（存在する場合）
    if (staff.auth_user_id) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
        staff.auth_user_id
      )
      if (authDeleteError) {
        console.error('Auth削除エラー:', authDeleteError)
      }
    }

    // m_staffから削除
    const { error: deleteError } = await supabaseAdmin
      .from('m_staff')
      .delete()
      .eq('id', staffId)

    if (deleteError) {
      console.error('スタッフ削除エラー:', deleteError)
      return NextResponse.json(
        { success: false, error: 'スタッフの削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${staff.name}さんを削除しました`,
    })

  } catch (error) {
    console.error('削除エラー:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}