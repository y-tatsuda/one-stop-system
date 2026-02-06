'use client'

/**
 * =====================================================
 * ECサイト - 注文完了ページ
 * =====================================================
 */

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import '../shop.css'

export default function OrderCompletePage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')

  return (
    <div className="shop-container" style={{ maxWidth: '600px', textAlign: 'center' }}>
      <div style={{ padding: 'var(--space-xl)', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <div style={{ width: '64px', height: '64px', margin: '0 auto var(--space-md)', color: '#10B981' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '100%', height: '100%' }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 var(--space-sm) 0' }}>
          ご注文ありがとうございます
        </h1>

        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
          ご注文を受け付けました。<br />
          確認メールをお送りしましたのでご確認ください。
        </p>

        {orderId && (
          <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-lg)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>注文番号</span>
            <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
              {orderId}
            </p>
          </div>
        )}

        <div style={{ padding: 'var(--space-md)', background: 'var(--color-success-light)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-lg)', textAlign: 'left' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-success)', margin: '0 0 var(--space-sm) 0' }}>
            360日保証が適用されます
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', margin: 0 }}>
            ご購入いただいた商品には360日間の保証が付いています。
            万が一の故障も安心です。
          </p>
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 var(--space-md) 0' }}>
          次にやること
        </h2>

        <div style={{ textAlign: 'left', marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <span style={{ width: '24px', height: '24px', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '600', flexShrink: 0 }}>1</span>
            <p style={{ margin: 0 }}>確認メールを保存（保証書として使用）</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <span style={{ width: '24px', height: '24px', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '600', flexShrink: 0 }}>2</span>
            <p style={{ margin: 0 }}>商品到着後、動作確認を行う</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <span style={{ width: '24px', height: '24px', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '600', flexShrink: 0 }}>3</span>
            <p style={{ margin: 0 }}>データ移行を行う</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <Link href="/shop/guide/after-purchase" className="btn btn-primary btn-block">
            購入後の流れを確認する
          </Link>
          <Link href="/shop/guide/data-transfer" className="btn btn-secondary btn-block">
            データ移行ガイドを見る
          </Link>
          <Link href="/shop" className="btn btn-secondary btn-block">
            トップページへ戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
