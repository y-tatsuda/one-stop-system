'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'

// 認証不要のパス
const PUBLIC_PATHS = ['/login', '/invite', '/change-password']

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { staff, isLoading, isAuthenticated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 公開ページはナビゲーションなしで表示
  const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path))
  
  if (isPublicPath) {
    return <>{children}</>
  }

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未認証の場合は何も表示しない（AuthContextでリダイレクト）
  if (!isAuthenticated) {
    return null
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: staff?.id,
          email: staff?.email
        })
      })
    } catch (error) {
      console.error('ログアウト通知エラー:', error)
    }
    logout()
  }

  return (
    <>
      {/* ヘッダー */}
      <header className="header">
        <div className="header-content">
          <Link href="/" className="header-logo">
            <img src="/logo.png" alt="ONE STOP" className="header-logo-img" />
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="desktop-nav">
            <Link href="/" className="desktop-nav-link">ホーム</Link>
            <Link href="/sales" className="desktop-nav-link">売上入力</Link>
            <Link href="/buyback" className="desktop-nav-link">買取入力</Link>
            <Link href="/inventory" className="desktop-nav-link">中古在庫</Link>
            <Link href="/parts-inventory" className="desktop-nav-link">パーツ在庫</Link>
            <Link href="/inventory-check" className="desktop-nav-link">棚卸し</Link>
            <Link href="/order" className="desktop-nav-link">発注</Link>
            <Link href="/daily-report" className="desktop-nav-link">日報</Link>
            <Link href="/reports" className="desktop-nav-link">レポート</Link>
            <Link href="/master-management" className="desktop-nav-link">マスタ管理</Link>
          </nav>

          {/* ユーザー情報とログアウト（デスクトップ） */}
          <div className="header-user-area">
            {staff && (
              <span className="header-user-name">{staff.name}</span>
            )}
            <button
              onClick={handleLogout}
              className="header-logout-btn"
            >
              ログアウト
            </button>
          </div>

          {/* ハンバーガーメニュー（モバイル） */}
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="メニュー"
          >
            <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </header>

      {/* モバイルメニュー */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
      
      <nav className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        {staff && (
          <div className="mobile-nav-user">
            <span className="mobile-nav-user-name">{staff.name}</span>
            <span className="mobile-nav-user-role">{staff.role}</span>
          </div>
        )}

        <div className="mobile-nav-group-title mobile-nav-group-main">メイン</div>
        <Link href="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          ホーム
        </Link>
        <Link href="/sales" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          売上入力
        </Link>
        <Link href="/buyback" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          買取入力
        </Link>

        <div className="mobile-nav-group-title mobile-nav-group-inventory">在庫管理</div>
        <Link href="/inventory" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          中古在庫
        </Link>
        <Link href="/parts-inventory" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          パーツ在庫
        </Link>
        <Link href="/accessory-inventory" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          アクセサリ在庫
        </Link>

        <div className="mobile-nav-group-title mobile-nav-group-work">業務</div>
        <Link href="/inventory-check" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          棚卸し
        </Link>
        <Link href="/order" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          発注
        </Link>
        <Link href="/daily-report" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          日報
        </Link>

        <div className="mobile-nav-group-title mobile-nav-group-settings">設定</div>
        <Link href="/reports" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          レポート
        </Link>
        <Link href="/staff-management" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          スタッフ管理
        </Link>
        <Link href="/shop-management" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          店舗管理
        </Link>
        <Link href="/master-management" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          マスタ管理
        </Link>
        <Link href="/inventory-settings" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          棚卸し設定
        </Link>

        {/* ログアウト */}
        <button
          className="mobile-nav-logout"
          onClick={() => {
            setMobileMenuOpen(false)
            handleLogout()
          }}
        >
          ログアウト
        </button>
      </nav>

      {/* メインコンテンツ */}
      <main className="container">{children}</main>
    </>
  )
}