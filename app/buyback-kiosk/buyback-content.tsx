'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  kioskShopId: number
}

export default function BuybackContent({ kioskShopId }: Props) {
  const router = useRouter()

  useEffect(() => {
    // 買取ページにリダイレクト（キオスクモード）
    router.push(`/buyback?kiosk=true&shop=${kioskShopId}`)
  }, [kioskShopId, router])

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ width: '48px', height: '48px', border: '4px solid #E5E7EB', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
      <p style={{ marginTop: '16px', color: '#6B7280' }}>買取画面を読み込み中...</p>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
