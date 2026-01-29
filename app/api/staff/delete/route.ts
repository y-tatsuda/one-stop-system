import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { staffId } = await request.json()

    if (!staffId) {
      return NextResponse.json(
        { success: false, error: 'スタッフIDが必要です' },
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
      console.error('スタッフ取得エラー:', fetchError)
      return NextResponse.json(
        { success: false, error: 'スタッフが見つかりません' },
        { status: 404 }
      )
    }

    const staffName = staff.name

    // 1. 所属店舗の紐付けを削除
    const { error: shopDeleteError } = await supabaseAdmin
      .from('m_staff_shops')
      .delete()
      .eq('staff_id', staffId)

    if (shopDeleteError) {
      console.error('店舗紐付け削除エラー:', shopDeleteError)
      // 続行（エラーがあっても次へ）
    }

    // 2. m_staffから削除
    const { error: deleteError } = await supabaseAdmin
      .from('m_staff')
      .delete()
      .eq('id', staffId)

    if (deleteError) {
      console.error('スタッフ削除エラー:', deleteError)
      return NextResponse.json(
        { success: false, error: 'スタッフの削除に失敗しました: ' + deleteError.message },
        { status: 500 }
      )
    }

    // 3. Supabase Authユーザーを削除（存在する場合のみ）
    if (staff.auth_user_id) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(staff.auth_user_id)
      } catch (authErr) {
        console.error('Auth削除エラー（無視）:', authErr)
        // Authユーザー削除に失敗しても、m_staffは既に削除されているので成功扱い
      }
    }

    return NextResponse.json({
      success: true,
      message: `${staffName}さんを削除しました`,
    })

  } catch (error) {
    console.error('削除エラー:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました: ' + (error as Error).message },
      { status: 500 }
    )
  }
}