'use client'

/**
 * =====================================================
 * ECサイト専用レイアウト
 * =====================================================
 *
 * 認証不要の公開ページ用レイアウト
 * 独自のヘッダー・フッターを持つ
 * =====================================================
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CartProvider, useCart } from './CartContext'
import './shop.css'

// ショップヘッダー
function ShopHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { itemCount } = useCart()
  const pathname = usePathname()
  const isBuyback = pathname?.includes('/buyback')

  return (
    <>
      <header className="shop-header">
        <div className="shop-header-content">
          <Link href="/shop" className="shop-logo">
            <img src="/logo.png" alt="ONE STOP" className="shop-logo-img" />
          </Link>

          {/* 販売/買取 切り替えタブ */}
          <div className="shop-mode-toggle">
            <Link
              href="/shop/products"
              className={`shop-mode-btn ${!isBuyback ? 'active' : ''}`}
            >
              買う
            </Link>
            <Link
              href="/shop/buyback"
              className={`shop-mode-btn shop-mode-btn-sell ${isBuyback ? 'active' : ''}`}
            >
              売る
            </Link>
          </div>

          {/* デスクトップナビ */}
          <nav className="shop-nav-desktop">
            {!isBuyback ? (
              <>
                <Link href="/shop/products" className="shop-nav-link">商品一覧</Link>
                <Link href="/shop/warranty" className="shop-nav-link">360日保証</Link>
                <Link href="/shop/support" className="shop-nav-link">サポート</Link>
              </>
            ) : (
              <>
                <Link href="/shop/buyback" className="shop-nav-link">買取について</Link>
                <Link href="/shop/buyback/estimate" className="shop-nav-link">オンライン査定</Link>
                <Link href="/shop/buyback/apply" className="shop-nav-link">郵送買取申込</Link>
              </>
            )}
          </nav>

          <div className="shop-header-right">
            {!isBuyback && (
              <Link href="/shop/cart" className="shop-cart-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {itemCount > 0 && (
                  <span className="shop-cart-badge">{itemCount}</span>
                )}
              </Link>
            )}

            {/* モバイルメニューボタン */}
            <button
              className="shop-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="メニュー"
            >
              <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
            </button>
          </div>
        </div>
      </header>

      {/* モバイルメニュー */}
      {mobileMenuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}></div>
          <nav className="shop-mobile-nav">
            <div className="shop-mobile-nav-section">
              <span className="shop-mobile-nav-label">iPhoneを買う</span>
              <Link href="/shop/products" className="shop-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                商品一覧
              </Link>
              <Link href="/shop/warranty" className="shop-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                360日保証
              </Link>
              <Link href="/shop/support" className="shop-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                サポート
              </Link>
            </div>
            <div className="shop-mobile-nav-section shop-mobile-nav-section-sell">
              <span className="shop-mobile-nav-label">iPhoneを売る</span>
              <Link href="/shop/buyback" className="shop-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                買取について
              </Link>
              <Link href="/shop/buyback/estimate" className="shop-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                オンライン査定
              </Link>
              <Link href="/shop/buyback/apply" className="shop-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                郵送買取申込
              </Link>
            </div>
          </nav>
        </>
      )}
    </>
  )
}

// ショップフッター
function ShopFooter() {
  return (
    <footer className="shop-footer">
      <div className="shop-footer-content">
        <div className="shop-footer-grid">
          <div className="shop-footer-section">
            <h4 className="shop-footer-title">ONE STOP</h4>
            <p className="shop-footer-text">
              日本一の安心をお届けしたい。<br />
              360日保証付きの中古iPhone専門店。
            </p>
          </div>

          <div className="shop-footer-section">
            <h4 className="shop-footer-title">商品</h4>
            <ul className="shop-footer-links">
              <li><Link href="/shop">商品一覧</Link></li>
              <li><Link href="/shop?model=iphone16">iPhone 16シリーズ</Link></li>
              <li><Link href="/shop?model=iphone15">iPhone 15シリーズ</Link></li>
              <li><Link href="/shop?model=iphone14">iPhone 14シリーズ</Link></li>
            </ul>
          </div>

          <div className="shop-footer-section">
            <h4 className="shop-footer-title">サポート</h4>
            <ul className="shop-footer-links">
              <li><Link href="/shop/warranty">360日保証について</Link></li>
              <li><Link href="/shop/guide/data-transfer">データ移行ガイド</Link></li>
              <li><Link href="/shop/guide/after-purchase">購入後の流れ</Link></li>
              <li><Link href="/shop/support">お問い合わせ</Link></li>
            </ul>
          </div>

          <div className="shop-footer-section">
            <h4 className="shop-footer-title">法的情報</h4>
            <ul className="shop-footer-links">
              <li><Link href="/shop/legal/company">会社概要</Link></li>
              <li><Link href="/shop/legal/tokushoho">特定商取引法に基づく表記</Link></li>
              <li><Link href="/shop/legal/privacy">プライバシーポリシー</Link></li>
              <li><Link href="/shop/legal/terms">利用規約</Link></li>
            </ul>
          </div>
        </div>

        <div className="shop-footer-contact">
          <p>
            <strong>お問い合わせ</strong><br />
            TEL: 0778-78-2465<br />
            MAIL: onestop.mobile2024@gmail.com
          </p>
        </div>

        <div className="shop-footer-bottom">
          <p>&copy; {new Date().getFullYear()} ONE STOP. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

// 内部レイアウト（CartProviderの中で使用）
function ShopLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="shop-layout">
      <ShopHeader />
      <main className="shop-main">
        {children}
      </main>
      <ShopFooter />
    </div>
  )
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <ShopLayoutInner>{children}</ShopLayoutInner>
    </CartProvider>
  )
}
