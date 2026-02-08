'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { supabase } from '@/app/lib/supabase'

// 認証不要のパス
const PUBLIC_PATHS = ['/login', '/invite', '/change-password', '/buyback-kiosk', '/buyback-mail', '/buyback-response', '/shop', '/liff']

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { staff, isLoading, isAuthenticated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 郵送買取の未処理件数
  const [mailBuybackCounts, setMailBuybackCounts] = useState({ pending: 0, waitingPayment: 0 })

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // キット送付待ち（pending）
        const { count: pendingCount } = await supabase
          .from('t_mail_buyback_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        // 振込待ち（waiting_payment）← お客様承諾済み、振込が必要
        const { count: waitingPaymentCount } = await supabase
          .from('t_mail_buyback_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'waiting_payment')

        setMailBuybackCounts({
          pending: pendingCount || 0,
          waitingPayment: waitingPaymentCount || 0,
        })
      } catch (e) {
        console.error('郵送買取件数取得エラー:', e)
      }
    }

    if (isAuthenticated) {
      fetchCounts()
      // 30秒ごとに更新
      const interval = setInterval(fetchCounts, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  // キオスクモードチェック
  const isKioskMode = searchParams.get('kiosk') === 'true'

  // 公開ページはナビゲーションなしで表示
  const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path))

  // キオスクモードまたは公開ページはナビゲーションなしで表示
  // ちらつき防止: 公開ページは即座に表示
  if (isPublicPath || isKioskMode) {
    return <>{children}</>
  }

  // パスがまだ確定していない場合は何も表示しない（ちらつき防止）
  if (!pathname) {
    return null
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
          {/* ロゴ（クリックでホームへ） */}
          <Link href="/" className="header-logo">
            <img src="/logo.png" alt="ONE STOP" className="header-logo-img" />
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="desktop-nav">
            <Link href="/sales" className="desktop-nav-link">売上入力</Link>
            <Link href="/sales-history" className="desktop-nav-link">売上履歴</Link>
            <Link href="/buyback" className="desktop-nav-link">店頭買取</Link>
            <Link href="/mail-buyback-management" className="desktop-nav-link" style={{ position: 'relative' }}>
              郵送買取
              {(mailBuybackCounts.waitingPayment > 0 || mailBuybackCounts.pending > 0) && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '9px',
                  background: mailBuybackCounts.waitingPayment > 0 ? '#EF4444' : '#F59E0B',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}>
                  {mailBuybackCounts.waitingPayment > 0 ? mailBuybackCounts.waitingPayment : mailBuybackCounts.pending}
                </span>
              )}
            </Link>

            {/* 在庫ドロップダウン */}
            <div className="nav-dropdown">
              <button className="desktop-nav-link nav-dropdown-trigger">
                在庫 <span className="dropdown-arrow">▼</span>
              </button>
              <div className="nav-dropdown-menu">
                <Link href="/inventory" className="nav-dropdown-item">中古在庫</Link>
                <Link href="/parts-inventory" className="nav-dropdown-item">パーツ在庫</Link>
                <Link href="/accessory-inventory" className="nav-dropdown-item">アクセサリ在庫</Link>
              </div>
            </div>

            {/* 業務ドロップダウン */}
            <div className="nav-dropdown">
              <button className="desktop-nav-link nav-dropdown-trigger">
                業務 <span className="dropdown-arrow">▼</span>
              </button>
              <div className="nav-dropdown-menu">
                <Link href="/inventory-check" className="nav-dropdown-item">棚卸し</Link>
                <Link href="/order" className="nav-dropdown-item">発注</Link>
                <Link href="/daily-report" className="nav-dropdown-item">日報</Link>
              </div>
            </div>

            {/* 管理ドロップダウン */}
            <div className="nav-dropdown">
              <button className="desktop-nav-link nav-dropdown-trigger">
                管理 <span className="dropdown-arrow">▼</span>
              </button>
              <div className="nav-dropdown-menu">
                <Link href="/reports" className="nav-dropdown-item">レポート</Link>
                <Link href="/staff-management" className="nav-dropdown-item">スタッフ管理</Link>
                <Link href="/shop-management" className="nav-dropdown-item">店舗管理</Link>
                <Link href="/master-management" className="nav-dropdown-item">マスタ管理</Link>
                <Link href="/inventory-settings" className="nav-dropdown-item">棚卸し設定</Link>
                <Link href="/square-settings" className="nav-dropdown-item">Square連携</Link>
              </div>
            </div>
          </nav>

          {/* ユーザー情報とログアウト（デスクトップ） */}
          <div className="header-user-area">
            {staff && (
              <span className="header-user-name">{staff.name}</span>
            )}
            <button onClick={handleLogout} className="header-logout-btn">
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
        <Link href="/sales-history" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          売上履歴
        </Link>
        <Link href="/buyback" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          店頭買取
        </Link>
        <Link href="/mail-buyback-management" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          郵送買取
          {(mailBuybackCounts.waitingPayment > 0 || mailBuybackCounts.pending > 0) && (
            <span style={{
              minWidth: '20px',
              height: '20px',
              borderRadius: '10px',
              background: mailBuybackCounts.waitingPayment > 0 ? '#EF4444' : '#F59E0B',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 6px',
            }}>
              {mailBuybackCounts.waitingPayment > 0 ? mailBuybackCounts.waitingPayment : mailBuybackCounts.pending}
            </span>
          )}
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
        <Link href="/square-settings" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          Square連携
        </Link>

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