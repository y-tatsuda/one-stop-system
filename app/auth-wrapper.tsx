'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const publicPaths = ['/login', '/invite']

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

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

  if (isAuthenticated === null && !isPublicPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  if (isPublicPath) {
    return <>{children}</>
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          <Link href="/" className="logo">ONE STOP</Link>
        </div>
        <div className="header-right">
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">ログアウト</button>
        </div>
      </header>

      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="nav-section">
          <div className="nav-title">メイン</div>
          <Link href="/" className="nav-link" onClick={() => setMenuOpen(false)}>ホーム</Link>
          <Link href="/sales" className="nav-link" onClick={() => setMenuOpen(false)}>売上入力</Link>
          <Link href="/buyback" className="nav-link" onClick={() => setMenuOpen(false)}>買取入力</Link>
        </div>
        <div className="nav-section">
          <div className="nav-title">在庫管理</div>
          <Link href="/inventory" className="nav-link" onClick={() => setMenuOpen(false)}>中古在庫</Link>
          <Link href="/parts-inventory" className="nav-link" onClick={() => setMenuOpen(false)}>パーツ在庫</Link>
          <Link href="/accessory-inventory" className="nav-link" onClick={() => setMenuOpen(false)}>アクセサリ在庫</Link>
          <Link href="/inventory-check" className="nav-link" onClick={() => setMenuOpen(false)}>棚卸し</Link>
          <Link href="/inventory-settings" className="nav-link" onClick={() => setMenuOpen(false)}>在庫設定</Link>
        </div>
        <div className="nav-section">
          <div className="nav-title">レポート</div>
          <Link href="/reports" className="nav-link" onClick={() => setMenuOpen(false)}>レポート</Link>
          <Link href="/daily-report" className="nav-link" onClick={() => setMenuOpen(false)}>日報</Link>
        </div>
        <div className="nav-section">
          <div className="nav-title">発注</div>
          <Link href="/order" className="nav-link" onClick={() => setMenuOpen(false)}>パーツ発注</Link>
        </div>
        <div className="nav-section">
          <div className="nav-title">設定</div>
          <Link href="/shop-management" className="nav-link" onClick={() => setMenuOpen(false)}>店舗管理</Link>
          <Link href="/staff-management" className="nav-link" onClick={() => setMenuOpen(false)}>スタッフ管理</Link>
          <Link href="/master-management" className="nav-link" onClick={() => setMenuOpen(false)}>マスタ管理</Link>
          <Link href="/admin/staff" className="nav-link" onClick={() => setMenuOpen(false)}>スタッフ設定</Link>
        </div>
      </nav>

      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}

      <main className="main-content">{children}</main>
    </div>
  )
}