import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/app/lib/supabase-admin'
import { DEFAULT_TENANT_ID } from '@/app/lib/constants'

// キオスクモード認証（パスコードのみ）
export async function POST(request: NextRequest) {
  try {
    const { shopId, passcode } = await request.json()

    if (!shopId || !passcode) {
      return NextResponse.json(
        { success: false, message: '店舗とパスコードを入力してください' },
        { status: 400 }
      )
    }

    // 店舗のパスコードを検証
    const { data: shop, error } = await supabaseAdmin
      .from('m_shops')
      .select('id, name, kiosk_passcode')
      .eq('id', shopId)
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .eq('is_active', true)
      .single()

    if (error || !shop) {
      return NextResponse.json(
        { success: false, message: '店舗が見つかりません' },
        { status: 404 }
      )
    }

    if (!shop.kiosk_passcode) {
      return NextResponse.json(
        { success: false, message: 'この店舗はキオスクモードが設定されていません' },
        { status: 403 }
      )
    }

    if (shop.kiosk_passcode !== passcode) {
      return NextResponse.json(
        { success: false, message: 'パスコードが正しくありません' },
        { status: 401 }
      )
    }

    // セッションCookieを設定（12時間有効）
    const cookieStore = await cookies()
    const sessionData = {
      shopId: shop.id,
      shopName: shop.name,
      isKiosk: true,
      exp: Date.now() + 12 * 60 * 60 * 1000
    }

    cookieStore.set('kiosk_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60, // 12時間
      path: '/'
    })

    return NextResponse.json({
      success: true,
      message: 'ログイン成功',
      shopName: shop.name
    })

  } catch (error) {
    console.error('キオスク認証エラー:', error)
    return NextResponse.json(
      { success: false, message: 'エラーが発生しました' },
      { status: 500 }
    )
  }
}

// セッション確認
export async function GET() {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('kiosk_session')

    if (!session) {
      return NextResponse.json({ authenticated: false })
    }

    const sessionData = JSON.parse(session.value)

    // 有効期限チェック
    if (sessionData.exp < Date.now()) {
      cookieStore.delete('kiosk_session')
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      shopId: sessionData.shopId,
      shopName: sessionData.shopName
    })

  } catch {
    return NextResponse.json({ authenticated: false })
  }
}

// ログアウト
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('kiosk_session')
  return NextResponse.json({ success: true })
}
