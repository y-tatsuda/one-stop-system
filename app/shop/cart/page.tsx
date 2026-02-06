'use client'

/**
 * =====================================================
 * ECサイト - カートページ
 * =====================================================
 *
 * LocalStorageに保存されたカート内容を表示
 * 決済ページへの遷移
 * =====================================================
 */

import Link from 'next/link'
import { useCart } from '../CartContext'
import '../shop.css'

export default function CartPage() {
  const { items, removeItem, clearCart } = useCart()

  const formatPrice = (price: number) => {
    return price.toLocaleString()
  }

  const totalPrice = items.reduce((sum, item) => sum + item.sales_price, 0)

  return (
    <div className="cart-container">
      <h1 className="cart-title">ショッピングカート</h1>

      {items.length === 0 ? (
        <div className="cart-empty">
          <div style={{ width: '48px', height: '48px', margin: '0 auto var(--space-md)', color: '#D1D5DB' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '100%', height: '100%' }}>
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <p className="cart-empty-text">カートに商品がありません</p>
          <Link href="/shop" className="btn btn-primary">
            商品一覧を見る
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                  </svg>
                </div>
                <div className="cart-item-info">
                  <h3 className="cart-item-title">
                    {item.display_name || item.model}
                  </h3>
                  <p className="cart-item-storage">
                    {item.storage}GB / {item.rank}
                    {item.battery_percent && ` / バッテリー ${item.battery_percent}%`}
                  </p>
                  <p className="cart-item-price">¥{formatPrice(item.sales_price)}</p>
                </div>
                <button
                  className="cart-item-remove"
                  onClick={() => removeItem(item.id)}
                  aria-label="削除"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>商品点数</span>
              <span>{items.length}点</span>
            </div>
            <div className="cart-summary-row cart-summary-total">
              <span>合計（税込）</span>
              <span style={{ color: 'var(--color-danger)' }}>¥{formatPrice(totalPrice)}</span>
            </div>

            <Link href="/shop/checkout" className="cart-checkout-btn">
              購入手続きへ
            </Link>

            <button
              className="btn btn-secondary btn-block"
              style={{ marginTop: 'var(--space-sm)' }}
              onClick={clearCart}
            >
              カートを空にする
            </button>
          </div>

          <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--color-success-light)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--color-success)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <div>
                <strong>すべての商品に360日保証付き</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
                  購入後60日間は100%返金保証。安心してお買い物ください。
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
