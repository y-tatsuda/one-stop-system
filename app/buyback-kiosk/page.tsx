'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// 買取ページを動的インポート（キオスクモード用）
const BuybackContent = dynamic(() => import('./buyback-content'), { ssr: false })

export default function KioskBuybackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [shopInfo, setShopInfo] = useState<{ shopId: number; shopName: string } | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/kiosk/auth')
        const data = await res.json()

        if (!data.authenticated) {
          router.push('/buyback-kiosk/login')
          return
        }

        setShopInfo({ shopId: data.shopId, shopName: data.shopName })
        setLoading(false)
      } catch {
        router.push('/buyback-kiosk/login')
      }
    }

    checkSession()
  }, [router])

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await fetch('/api/kiosk/auth', { method: 'DELETE' })
      router.push('/buyback-kiosk/login')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #E5E7EB', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '16px', color: '#6B7280' }}>読み込み中...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
      {/* キオスクモード用ヘッダー */}
      <header style={{
        background: 'linear-gradient(135deg, #004AAD 0%, #0066CC 100%)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700' }}>ONE STOP 買取</span>
          <span style={{
            color: 'white',
            fontSize: '1rem',
            background: 'rgba(255,255,255,0.2)',
            padding: '6px 14px',
            borderRadius: '20px'
          }}>{shopInfo?.shopName}</span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          ログアウト
        </button>
      </header>

      {/* 買取コンテンツ */}
      <main className="kiosk-container" style={{ padding: '24px' }}>
        {shopInfo && <BuybackContent kioskShopId={shopInfo.shopId} />}
      </main>
    </div>
  )
}
