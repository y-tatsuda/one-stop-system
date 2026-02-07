'use client'

/**
 * =====================================================
 * LIFF 買取 - LINE認証＆リダイレクト
 * =====================================================
 *
 * 【役割】
 * - LIFFでLINE UIDと表示名を取得
 * - 既存のEC買取申込ページにリダイレクト
 *
 * 【注意】
 * - 価格計算ロジックは /app/lib/pricing.ts に集約
 * - 買取フォームは /app/shop/buyback/apply を使用
 * - 重複実装しないこと
 * =====================================================
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import liff from '@line/liff'
import './liff-buyback.css'

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || ''

export default function LiffBuybackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const initLiff = async () => {
      try {
        // 開発モード（LIFF IDなし）
        if (!LIFF_ID) {
          console.log('LIFF ID not set, redirecting without LINE info')
          router.push('/shop/buyback/apply')
          return
        }

        // LIFF初期化
        await liff.init({ liffId: LIFF_ID })

        // ログインチェック
        if (!liff.isLoggedIn()) {
          liff.login()
          return
        }

        // プロフィール取得
        const profile = await liff.getProfile()
        const lineUserId = profile.userId
        const lineDisplayName = encodeURIComponent(profile.displayName)

        // LINE情報をクエリパラメータで渡してEC買取ページにリダイレクト
        router.push(`/shop/buyback/apply?line_uid=${lineUserId}&line_name=${lineDisplayName}&from=liff`)

      } catch (err) {
        console.error('LIFF init error:', err)
        setStatus('error')
        setErrorMessage('LINEの初期化に失敗しました')
      }
    }

    initLiff()
  }, [router])

  // ローディング画面
  if (status === 'loading') {
    return (
      <div className="liff-container">
        <div className="liff-loading">
          <div className="liff-spinner"></div>
          <p>LINEから情報を取得中...</p>
        </div>
      </div>
    )
  }

  // エラー画面
  return (
    <div className="liff-container">
      <div className="liff-error">
        <p>{errorMessage}</p>
        <button onClick={() => window.location.reload()}>再読み込み</button>
        <button
          onClick={() => router.push('/shop/buyback/apply')}
          style={{ marginTop: '12px', background: '#6B7280' }}
        >
          LINE連携なしで続ける
        </button>
      </div>
    </div>
  )
}
