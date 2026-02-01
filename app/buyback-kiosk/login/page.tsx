'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

type Shop = {
  id: number
  name: string
}

export default function KioskLoginPage() {
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [shopId, setShopId] = useState('')
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // 既にログイン済みか確認
    const checkSession = async () => {
      const res = await fetch('/api/kiosk/auth')
      const data = await res.json()
      if (data.authenticated) {
        router.push('/buyback-kiosk')
        return
      }
      setLoading(false)
    }

    // 店舗リスト取得
    const fetchShops = async () => {
      const { data } = await supabase
        .from('m_shops')
        .select('id, name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('id')

      setShops(data || [])
    }

    checkSession()
    fetchShops()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/kiosk/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId: parseInt(shopId), passcode })
      })

      const data = await res.json()

      if (data.success) {
        router.push('/buyback-kiosk')
      } else {
        setError(data.message || 'ログインに失敗しました')
      }
    } catch {
      setError('エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasscodeInput = (digit: string) => {
    if (passcode.length < 6) {
      setPasscode(passcode + digit)
    }
  }

  const handlePasscodeDelete = () => {
    setPasscode(passcode.slice(0, -1))
  }

  const handlePasscodeClear = () => {
    setPasscode('')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #E5E7EB', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #004AAD 0%, #0066CC 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#004AAD', marginBottom: '8px' }}>ONE STOP</h1>
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>買取キオスクモード</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>店舗を選択</label>
            <select
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              style={{ width: '100%', padding: '14px', fontSize: '1.1rem', border: '2px solid #E5E7EB', borderRadius: '8px', background: 'white' }}
              required
            >
              <option value="">選択してください</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>パスコード</label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  style={{
                    width: '40px',
                    height: '50px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    background: passcode[i] ? '#F3F4F6' : 'white'
                  }}
                >
                  {passcode[i] ? '●' : ''}
                </div>
              ))}
            </div>

            {/* テンキー */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', maxWidth: '280px', margin: '0 auto' }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'].map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === 'C') handlePasscodeClear()
                    else if (key === '←') handlePasscodeDelete()
                    else handlePasscodeInput(key)
                  }}
                  style={{
                    padding: '16px',
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '8px',
                    background: key === 'C' ? '#FEE2E2' : key === '←' ? '#FEF3C7' : '#F3F4F6',
                    color: key === 'C' ? '#DC2626' : key === '←' ? '#D97706' : '#374151',
                    cursor: 'pointer'
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !shopId || passcode.length < 4}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.2rem',
              fontWeight: '700',
              background: submitting || !shopId || passcode.length < 4 ? '#9CA3AF' : '#004AAD',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: submitting || !shopId || passcode.length < 4 ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
