'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '../lib/supabase'

const SalesContent = dynamic(() => import('./sales-content'), { ssr: false })

type Screen = 'menu' | 'sales' | 'settings'

export default function KioskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [shopInfo, setShopInfo] = useState<{ shopId: number; shopName: string } | null>(null)
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu')

  // パスコード変更用
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

    const { data: shop } = await supabase
      .from('m_shops')
      .select('kiosk_passcode')
      .eq('id', shopInfo?.shopId)
      .single()

    if (shop?.kiosk_passcode !== currentPasscode) {
      setPasscodeError('現在のパスコードが正しくありません')
      return
    }

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
      setPasscodeSuccess(false)
    }, 3000)
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>読み込み中...</p>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // メインメニュー画面
  if (currentScreen === 'menu') {
    return (
      <div style={styles.container}>
        {/* ヘッダー */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.logo}>ONE STOP</h1>
            <span style={styles.shopBadge}>{shopInfo?.shopName}</span>
          </div>
          <div style={styles.headerRight}>
            <button onClick={() => setCurrentScreen('settings')} style={styles.settingsBtn}>
              設定
            </button>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              ログアウト
            </button>
          </div>
        </header>

        {/* メインメニュー */}
        <main style={styles.menuContainer}>
          <h2 style={styles.menuTitle}>メニューを選択してください</h2>

          <div style={styles.menuGrid}>
            {/* 買取ボタン - 通常の買取ページに直接遷移 */}
            <button
              onClick={() => router.push(`/buyback?kiosk=true&shop=${shopInfo?.shopId}`)}
              style={styles.menuCard}
            >
              <div style={styles.menuIconBuyback}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 17" />
                </svg>
              </div>
              <span style={styles.menuCardTitle}>買取登録</span>
              <span style={styles.menuCardDesc}>iPhoneの買取査定・登録</span>
            </button>

            {/* 販売ボタン */}
            <button
              onClick={() => setCurrentScreen('sales')}
              style={styles.menuCardSales}
            >
              <div style={styles.menuIconSales}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <span style={styles.menuCardTitle}>販売登録</span>
              <span style={styles.menuCardDesc}>中古iPhoneの販売・決済</span>
            </button>
          </div>
        </main>

        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // 設定画面
  if (currentScreen === 'settings') {
    return (
      <div style={styles.container}>
        <header style={styles.subHeader}>
          <button onClick={() => setCurrentScreen('menu')} style={styles.backBtn}>
            ← メニューに戻る
          </button>
          <h1 style={styles.subHeaderTitle}>設定</h1>
          <div style={{ width: '160px' }}></div>
        </header>

        <main style={styles.settingsContainer}>
          <div style={styles.settingsCard}>
            {/* パスコード変更 */}
            <div style={styles.settingsSection}>
              <h3 style={styles.settingsSectionTitle}>パスコード変更</h3>
              <p style={styles.settingsSectionDesc}>キオスクログイン用のパスコードを変更します</p>

              {passcodeSuccess && (
                <div style={styles.successMessage}>
                  パスコードを変更しました
                </div>
              )}

              {passcodeError && (
                <div style={styles.errorMessage}>
                  {passcodeError}
                </div>
              )}

              <div style={styles.passcodeForm}>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={currentPasscode}
                  onChange={(e) => setCurrentPasscode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="現在のパスコード"
                  style={styles.passcodeInput}
                />
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="新しいパスコード"
                  style={styles.passcodeInput}
                />
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="新しいパスコード（確認）"
                  style={styles.passcodeInput}
                />
                <button onClick={handleChangePasscode} style={styles.changePasscodeBtn}>
                  パスコードを変更
                </button>
              </div>
            </div>

            {/* 店舗情報 */}
            <div style={styles.settingsSection}>
              <h3 style={styles.settingsSectionTitle}>店舗情報</h3>
              <div style={styles.shopInfoItem}>
                <span style={styles.shopInfoLabel}>店舗名</span>
                <span style={styles.shopInfoValue}>{shopInfo?.shopName}</span>
              </div>
              <div style={styles.shopInfoItem}>
                <span style={styles.shopInfoLabel}>店舗ID</span>
                <span style={styles.shopInfoValue}>{shopInfo?.shopId}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 販売画面
  if (currentScreen === 'sales') {
    return (
      <div style={styles.container}>
        <header style={styles.subHeader}>
          <button onClick={() => setCurrentScreen('menu')} style={styles.backBtn}>
            ← メニューに戻る
          </button>
          <h1 style={styles.subHeaderTitle}>販売登録</h1>
          <div style={{ width: '160px' }}></div>
        </header>

        <main style={styles.contentArea}>
          {shopInfo && <SalesContent shopId={shopInfo.shopId} shopName={shopInfo.shopName} />}
        </main>
      </div>
    )
  }

  return null
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #F0F4F8 0%, #E2E8F0 100%)',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F3F4F6',
  },
  spinner: {
    width: '56px',
    height: '56px',
    border: '4px solid #E5E7EB',
    borderTopColor: '#004AAD',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '20px',
    color: '#6B7280',
    fontSize: '1.1rem',
  },

  // ヘッダー（メインメニュー用）
  header: {
    background: 'linear-gradient(135deg, #004AAD 0%, #0052CC 100%)',
    padding: '20px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(0,74,173,0.3)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  logo: {
    color: 'white',
    fontSize: '1.8rem',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  shopBadge: {
    color: 'white',
    fontSize: '1rem',
    background: 'rgba(255,255,255,0.2)',
    padding: '8px 20px',
    borderRadius: '24px',
    fontWeight: '500',
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
  },
  settingsBtn: {
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '12px 24px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(255,255,255,0.2)',
    padding: '12px 24px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },

  // サブヘッダー（各機能画面用）
  subHeader: {
    background: 'linear-gradient(135deg, #004AAD 0%, #0052CC 100%)',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(0,74,173,0.3)',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    minWidth: '160px',
  },
  subHeaderTitle: {
    color: 'white',
    fontSize: '1.4rem',
    fontWeight: '700',
    margin: 0,
  },

  // メインメニュー
  menuContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 80px)',
    padding: '40px',
  },
  menuTitle: {
    fontSize: '1.6rem',
    color: '#1F2937',
    marginBottom: '48px',
    fontWeight: '600',
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '32px',
    maxWidth: '800px',
    width: '100%',
  },
  menuCard: {
    background: 'white',
    border: 'none',
    borderRadius: '24px',
    padding: '48px 32px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    borderLeft: '6px solid #059669',
  },
  menuCardSales: {
    background: 'white',
    border: 'none',
    borderRadius: '24px',
    padding: '48px 32px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    borderLeft: '6px solid #004AAD',
  },
  menuIconBuyback: {
    width: '100px',
    height: '100px',
    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    marginBottom: '8px',
  },
  menuIconSales: {
    width: '100px',
    height: '100px',
    background: 'linear-gradient(135deg, #004AAD 0%, #0066CC 100%)',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    marginBottom: '8px',
  },
  menuCardTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1F2937',
  },
  menuCardDesc: {
    fontSize: '1rem',
    color: '#6B7280',
  },

  // コンテンツエリア
  contentArea: {
    padding: '32px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },

  // 設定画面
  settingsContainer: {
    padding: '40px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  settingsCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  },
  settingsSection: {
    paddingBottom: '24px',
    marginBottom: '24px',
    borderBottom: '1px solid #E5E7EB',
  },
  settingsSectionTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '8px',
  },
  settingsSectionDesc: {
    fontSize: '0.95rem',
    color: '#6B7280',
    marginBottom: '20px',
  },
  passcodeForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  passcodeInput: {
    width: '100%',
    padding: '16px',
    fontSize: '1.1rem',
    border: '2px solid #E5E7EB',
    borderRadius: '12px',
    textAlign: 'center',
    letterSpacing: '6px',
    boxSizing: 'border-box',
  },
  changePasscodeBtn: {
    background: '#004AAD',
    color: 'white',
    border: 'none',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  successMessage: {
    background: '#D1FAE5',
    color: '#065F46',
    padding: '16px',
    borderRadius: '12px',
    textAlign: 'center',
    marginBottom: '16px',
    fontWeight: '600',
  },
  errorMessage: {
    background: '#FEE2E2',
    color: '#DC2626',
    padding: '16px',
    borderRadius: '12px',
    textAlign: 'center',
    marginBottom: '16px',
    fontWeight: '500',
  },
  shopInfoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #F3F4F6',
  },
  shopInfoLabel: {
    color: '#6B7280',
    fontSize: '1rem',
  },
  shopInfoValue: {
    color: '#1F2937',
    fontWeight: '600',
    fontSize: '1rem',
  },
}
