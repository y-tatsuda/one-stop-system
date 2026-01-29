import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 認証不要のパス
const publicPaths = ['/login', '/invite', '/api/auth']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公開パスはスキップ
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 静的ファイルはスキップ
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // 認証Cookieをチェック
  const authToken = request.cookies.get('auth_token')

  if (!authToken) {
    // 未ログインならログインページへリダイレクト
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}