'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '../lib/supabase'

const BuybackContent = dynamic(() => import('./buyback-content'), { ssr: false })
const SalesContent = dynamic(() => import('./sales-content'), { ssr: false })

type Tab = 'buyback' | 'sales' | 'settings'

export default function KioskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [shopInfo, setShopInfo] = useState<{ shopId: number; shopName: string } | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('buyback')

  // パスコード変更用
  const [showPasscodeModal, setShowPasscodeModal] = useState(false)
  const [currentPasscode, setCurrentPasscode] = useState('')
  const [newPasscode, setNewPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [passcodeError, setPasscodeError] = useState('')
  const [passcodeSuccess, setPasscodeSuccess] = useState(false)

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

  const handleChangePasscode = async () => {
    setPasscodeError('')
    setPasscodeSuccess(false)

    if (newPasscode.length < 4) {
      setPasscodeError('新しいパスコードは4桁以上で入力してください')
      return
    }

    if (newPasscode !== confirmPasscode) {
      setPasscodeError('新しいパスコードが一致しません')
      return
    }

    // 現在のパスコードを検証
    const { data: shop } = await supabase
      .from('m_shops')
      .select('kiosk_passcode')
      .eq('id', shopInfo?.shopId)
      .single()

    if (shop?.kiosk_passcode !== currentPasscode) {
      setPasscodeError('現在のパスコードが正しくありません')
      return
    }

    // 新しいパスコードを保存
    const { error } = await supabase
      .from('m_shops')
      .update({ kiosk_passcode: newPasscode })
      .eq('id', shopInfo?.shopId)

    if (error) {
      setPasscodeError('パスコードの変更に失敗しました')
      return
    }

    setPasscodeSuccess(true)
    setCurrentPasscode('')
    setNewPasscode('')
    setConfirmPasscode('')

    setTimeout(() => {
      setShowPasscodeModal(false)
      setPasscodeSuccess(false)
    }, 2000)
  }

  const PasscodeInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div style={{ marginBottom: '16px' }}>
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '1.2rem',
          border: '2px solid #E5E7EB',
          borderRadius: '12px',
          textAlign: 'center',
          letterSpacing: '8px'
        }}
      />
    </div>
  )

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
      {/* ヘッダー */}
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
          <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700' }}>ONE STOP</span>
          <span style={{
            color: 'white',
            fontSize: '1rem',
            background: 'rgba(255,255,255,0.2)',
            padding: '6px 14px',
            borderRadius: '20px'
          }}>{shopInfo?.shopName}</span>
        </div>

        {/* タブ */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('buyback')}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              background: activeTab === 'buyback' ? 'white' : 'rgba(255,255,255,0.2)',
              color: activeTab === 'buyback' ? '#004AAD' : 'white',
            }}
          >
            買取
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              background: activeTab === 'sales' ? 'white' : 'rgba(255,255,255,0.2)',
              color: activeTab === 'sales' ? '#004AAD' : 'white',
            }}
          >
            販売
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              background: activeTab === 'settings' ? 'white' : 'rgba(255,255,255,0.2)',
              color: activeTab === 'settings' ? '#004AAD' : 'white',
            }}
          >
            設定
          </button>
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

      {/* コンテンツ */}
      <main className="kiosk-container" style={{ padding: '32px 40px' }}>
        {activeTab === 'buyback' && shopInfo && (
          <BuybackContent kioskShopId={shopInfo.shopId} />
        )}

        {activeTab === 'sales' && shopInfo && (
          <SalesContent shopId={shopInfo.shopId} shopName={shopInfo.shopName} />
        )}

        {activeTab === 'settings' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px', color: '#1F2937' }}>設定</h2>

              <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '20px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>パスコード変更</h3>
                <p style={{ color: '#6B7280', marginBottom: '16px' }}>キオスクログイン用のパスコードを変更します</p>
                <button
                  onClick={() => setShowPasscodeModal(true)}
                  style={{
                    padding: '12px 24px',
                    background: '#004AAD',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  パスコードを変更
                </button>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>店舗情報</h3>
                <p style={{ color: '#6B7280' }}>店舗: {shopInfo?.shopName}</p>
                <p style={{ color: '#6B7280' }}>店舗ID: {shopInfo?.shopId}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* パスコード変更モーダル */}
      {showPasscodeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            margin: '20px'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
              パスコード変更
            </h3>

            {passcodeSuccess ? (
              <div style={{
                background: '#D1FAE5',
                color: '#065F46',
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                パスコードを変更しました
              </div>
            ) : (
              <>
                <PasscodeInput
                  value={currentPasscode}
                  onChange={setCurrentPasscode}
                  placeholder="現在のパスコード"
                />
                <PasscodeInput
                  value={newPasscode}
                  onChange={setNewPasscode}
                  placeholder="新しいパスコード"
                />
                <PasscodeInput
                  value={confirmPasscode}
                  onChange={setConfirmPasscode}
                  placeholder="新しいパスコード（確認）"
                />

                {passcodeError && (
                  <div style={{
                    background: '#FEE2E2',
                    color: '#DC2626',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    {passcodeError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setShowPasscodeModal(false)
                      setCurrentPasscode('')
                      setNewPasscode('')
                      setConfirmPasscode('')
                      setPasscodeError('')
                    }}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: '#F3F4F6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleChangePasscode}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: '#004AAD',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    変更する
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
