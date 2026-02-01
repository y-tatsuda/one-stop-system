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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #004AAD 0%, #0066CC 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 25px 80px rgba(0,0,0,0.35)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#004AAD', marginBottom: '12px' }}>ONE STOP</h1>
          <p style={{ color: '#6B7280', fontSize: '1.1rem' }}>買取キオスクモード</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', color: '#374151', fontSize: '1.1rem' }}>店舗を選択</label>
            <select
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 18px',
                fontSize: '1.2rem',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                background: 'white',
                WebkitAppearance: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                backgroundSize: '20px',
              }}
              required
            >
              <option value="">選択してください</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px', color: '#374151', fontSize: '1.1rem' }}>パスコード</label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  style={{
                    width: '48px',
                    height: '58px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    fontWeight: '700',
                    background: passcode[i] ? '#EEF2FF' : 'white',
                    borderColor: passcode[i] ? '#004AAD' : '#E5E7EB',
                  }}
                >
                  {passcode[i] ? '●' : ''}
                </div>
              ))}
            </div>

            {/* テンキー */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxWidth: '320px', margin: '0 auto' }}>
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
                    padding: '20px',
                    fontSize: '1.8rem',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '12px',
                    background: key === 'C' ? '#FEE2E2' : key === '←' ? '#FEF3C7' : '#F3F4F6',
                    color: key === 'C' ? '#DC2626' : key === '←' ? '#D97706' : '#374151',
                    cursor: 'pointer',
                    transition: 'transform 0.1s',
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
              padding: '20px',
              fontSize: '1.3rem',
              fontWeight: '700',
              background: submitting || !shopId || passcode.length < 4 ? '#9CA3AF' : 'linear-gradient(135deg, #004AAD 0%, #0066CC 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: submitting || !shopId || passcode.length < 4 ? 'not-allowed' : 'pointer',
              boxShadow: submitting || !shopId || passcode.length < 4 ? 'none' : '0 4px 15px rgba(0, 74, 173, 0.4)',
              transition: 'transform 0.1s, box-shadow 0.1s',
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
