"use client";

import "./globals.css";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const publicPaths = ['/login', '/invite']

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  useEffect(() => {
    if (isPublicPath) {
      setIsAuthenticated(true)
      return
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check', { credentials: 'include' })
        const data = await res.json()
        
        if (data.authenticated) {
          setIsAuthenticated(true)
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      }
    }

    checkAuth()
  }, [pathname, isPublicPath, router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/login'
  }

  // 認証チェック中（公開ページ以外）
  if (isAuthenticated === null && !isPublicPath) {
    return (
      <html lang="ja">
        <body>
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </body>
      </html>
    )
  }

  // 公開ページ（ログイン、招待）
  if (isPublicPath) {
    return (
      <html lang="ja">
        <head>
          <title>ワンストップ管理システム</title>
          <meta name="description" content="スマホ修理・買取・販売管理" />
        </head>
        <body>{children}</body>
      </html>
    )
  }

  // 認証済みページ
  return (
    <html lang="ja">
      <head>
        <title>ワンストップ管理システム</title>
        <meta name="description" content="スマホ修理・買取・販売管理" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ONE STOP" />
      </head>
      <body>
        {/* ヘッダー */}
        <header className="header">
          <div className="header-inner">
            {/* ロゴ */}
            <Link href="/">
              <Image
                src="/logo.png"
                alt="ワンストップ"
                width={140}
                height={36}
                className="header-logo"
                priority
              />
            </Link>

            {/* PC用ナビゲーション */}
            <nav className="header-nav">
              <Link href="/" className="nav-link">
                ホーム
              </Link>
              <Link href="/sales" className="nav-link">
                売上
              </Link>
              <Link href="/buyback" className="nav-link">
                買取
              </Link>

              {/* 在庫ドロップダウン */}
              <div className="nav-dropdown">
                <button className="nav-dropdown-trigger">
                  在庫
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                </button>
                <div className="nav-dropdown-menu">
                  <Link href="/inventory" className="nav-dropdown-item">
                    中古在庫
                  </Link>
                  <Link href="/parts-inventory" className="nav-dropdown-item">
                    パーツ在庫
                  </Link>
                  <Link href="/accessory-inventory" className="nav-dropdown-item">
                    アクセサリ在庫
                  </Link>
                </div>
              </div>

              {/* 業務ドロップダウン */}
              <div className="nav-dropdown">
                <button className="nav-dropdown-trigger">
                  業務
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                </button>
                <div className="nav-dropdown-menu">
                  <Link href="/inventory-check" className="nav-dropdown-item">
                    棚卸し
                  </Link>
                  <Link href="/order" className="nav-dropdown-item">
                    発注
                  </Link>
                  <Link href="/daily-report" className="nav-dropdown-item">
                    日報
                  </Link>
                </div>
              </div>

              {/* 設定ドロップダウン */}
              <div className="nav-dropdown">
                <button className="nav-dropdown-trigger">
                  設定
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                </button>
                <div className="nav-dropdown-menu">
                  <Link href="/reports" className="nav-dropdown-item">
                    レポート
                  </Link>
                  <Link href="/staff-management" className="nav-dropdown-item">
                    スタッフ管理
                  </Link>
                  <Link href="/shop-management" className="nav-dropdown-item">
                    店舗管理
                  </Link>
                  <Link href="/master-management" className="nav-dropdown-item">
                    マスタ管理
                  </Link>
                  <Link href="/inventory-settings" className="nav-dropdown-item">
                    棚卸し設定
                  </Link>
                </div>
              </div>

              {/* ログアウトボタン */}
              <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                ログアウト
              </button>
            </nav>

            {/* ハンバーガーメニュー（モバイル用） */}
            <button
              className="hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="メニュー"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </header>

        {/* モバイルナビゲーション */}
        <nav className={`mobile-nav ${mobileMenuOpen ? "mobile-nav-open" : ""}`}>
          <Link
            href="/"
            className="mobile-nav-link mobile-nav-link-home"
            onClick={() => setMobileMenuOpen(false)}
          >
            ホーム
          </Link>
          <Link
            href="/sales"
            className="mobile-nav-link mobile-nav-link-sales"
            onClick={() => setMobileMenuOpen(false)}
          >
            売上入力
          </Link>
          <Link
            href="/buyback"
            className="mobile-nav-link mobile-nav-link-buyback"
            onClick={() => setMobileMenuOpen(false)}
          >
            買取入力
          </Link>

          <div className="mobile-nav-group-title mobile-nav-group-inventory">在庫</div>
          <Link
            href="/inventory"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            中古在庫
          </Link>
          <Link
            href="/parts-inventory"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            パーツ在庫
          </Link>
          <Link
            href="/accessory-inventory"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            アクセサリ在庫
          </Link>

          <div className="mobile-nav-group-title mobile-nav-group-work">業務</div>
          <Link
            href="/inventory-check"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            棚卸し
          </Link>
          <Link
            href="/order"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            発注
          </Link>
          <Link
            href="/daily-report"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            日報
          </Link>

          <div className="mobile-nav-group-title mobile-nav-group-settings">設定</div>
          <Link
            href="/reports"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            レポート
          </Link>
          <Link
            href="/staff-management"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            スタッフ管理
          </Link>
          <Link
            href="/shop-management"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            店舗管理
          </Link>
          <Link
            href="/master-management"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            マスタ管理
          </Link>
          <Link
            href="/inventory-settings"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            棚卸し設定
          </Link>

          {/* ログアウト */}
          <button
            className="mobile-nav-link"
            onClick={() => {
              setMobileMenuOpen(false)
              handleLogout()
            }}
            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', width: '100%', textAlign: 'left', marginTop: '16px' }}
          >
            ログアウト
          </button>
        </nav>

        {/* メインコンテンツ */}
        <main className="container">{children}</main>
      </body>
    </html>
  );
}