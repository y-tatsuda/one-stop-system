'use client'

/**
 * =====================================================
 * ECサイト - ホームページ（トップ）
 * =====================================================
 *
 * 構成：
 * 1. ヒーロー（キャッチ＋店舗写真）
 * 2. モデルから探す（横スクロールカード）
 * 3. 在庫一覧プレビュー（3×3 = 9件）＋「すべて見る」
 * 4. 安心ポイント（360日保証など）
 * 5. 人気ランキング
 * 6. 用語解説
 * 7. サポートリンク
 * =====================================================
 */

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { DEFAULT_TENANT_ID, getModelThumbnailPrefix, getModelPngFileName } from '../lib/constants'
import './shop.css'

type ShopProduct = {
  id: number
  model: string
  storage: number
  rank: string
  sales_price: number
  battery_percent: number | null
  arrival_date: string
  color: string | null
  shop_id: number
  shop: { name: string }
}

type IphoneModel = {
  model: string
  display_name: string
}

type RankingItem = {
  model: string
  storage: number
  count: number
}

// モデルグループ定義（表示順）
const MODEL_GROUPS = [
  { key: '16', label: 'iPhone 16', models: ['16promax', '16pro', '16plus', '16', '16e'] },
  { key: '15', label: 'iPhone 15', models: ['15promax', '15pro', '15plus', '15'] },
  { key: '14', label: 'iPhone 14', models: ['14promax', '14pro', '14plus', '14'] },
  { key: '13', label: 'iPhone 13', models: ['13promax', '13pro', '13mini', '13'] },
  { key: '12', label: 'iPhone 12', models: ['12promax', '12pro', '12mini', '12'] },
  { key: '11', label: 'iPhone 11', models: ['11promax', '11pro', '11'] },
  { key: 'xs', label: 'iPhone XS', models: ['xsmax', 'xs'] },
  { key: 'x', label: 'iPhone X', models: ['x'] },
  { key: 'se', label: 'iPhone SE', models: ['se3', 'se2', 'se1'] },
]

export default function ShopHomePage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [models, setModels] = useState<IphoneModel[]>([])
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)

  // スライダー自動切り替え
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev === 0 ? 1 : 0))
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 商品一覧を取得（最新9件 + 総数）
      const { data: inventoryData, error: inventoryError, count } = await supabase
        .from('t_used_inventory')
        .select('id, model, storage, rank, sales_price, battery_percent, arrival_date, color, shop_id, shop:m_shops(name)', { count: 'exact' })
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('status', '販売可')
        .not('sales_price', 'is', null)
        .order('arrival_date', { ascending: false })
        .limit(9)

      if (inventoryError) throw inventoryError

      // モデルマスタを取得
      const { data: modelData, error: modelError } = await supabase
        .from('m_iphone_models')
        .select('model, display_name')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('is_active', true)
        .order('sort_order')

      if (modelError) throw modelError

      // 販売実績からランキングを取得
      const { data: salesData } = await supabase
        .from('t_used_inventory')
        .select('model, storage')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('status', '販売済み')

      const rankingMap = new Map<string, RankingItem>()
      salesData?.forEach(item => {
        const key = `${item.model}-${item.storage}`
        const existing = rankingMap.get(key)
        if (existing) {
          existing.count++
        } else {
          rankingMap.set(key, { model: item.model, storage: item.storage, count: 1 })
        }
      })
      const rankingList = Array.from(rankingMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setProducts(inventoryData || [])
      setModels(modelData || [])
      setRanking(rankingList)
      setTotalCount(count || 0)
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDisplayName = (model: string) => {
    const found = models.find(m => m.model === model)
    return found ? found.display_name : model
  }

  const getRankClass = (rank: string) => {
    switch (rank) {
      case '美品': return 'rank-美品'
      case '良品': return 'rank-良品'
      case '並品': return 'rank-並品'
      case 'リペア品': return 'rank-リペア品'
      default: return ''
    }
  }

  const getThumbnailUrl = (model: string, color: string | null) => {
    if (color) {
      const modelPrefix = getModelThumbnailPrefix(model)
      return `/shop/products/thumbnails/${modelPrefix}_${color}.webp`
    }
    const pngName = getModelPngFileName(model)
    return `/shop/products/thumbnails/${pngName}.png`
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString()
  }

  const isNewArrival = (arrivalDate: string) => {
    const arrival = new Date(arrivalDate)
    const today = new Date()
    const diffDays = Math.floor((today.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  }

  return (
    <>
      {/* =====================================================
          ヒーロースライダー - 販売と買取
          ===================================================== */}
      <section className="home-slider">
        <div className="home-slider-wrapper">
          {/* スライド1: 販売 */}
          <div className={`home-slide home-slide-buy ${currentSlide === 0 ? 'active' : ''}`}>
            <img src="/shop/slide-buy.png" alt="" className="home-slide-bg" />
            <div className="home-slide-content">
              <h1 className="home-slide-title">
                日本一の安心を<br />お届けしたい
              </h1>
              <p className="home-slide-desc">
                360日保証・全品動作チェック済み
              </p>
              <Link href="/shop/products" className="home-slide-btn">
                在庫を見る
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </div>
          </div>

          {/* スライド2: 買取 */}
          <div className={`home-slide home-slide-sell ${currentSlide === 1 ? 'active' : ''}`}>
            <img src="/shop/slide-sell.png" alt="" className="home-slide-bg" />
            <div className="home-slide-content">
              <h1 className="home-slide-title">
                日本一の買取満足度を<br />目指したい
              </h1>
              <p className="home-slide-desc">
                送料無料・最短即日入金
              </p>
              <Link href="/shop/buyback" className="home-slide-btn home-slide-btn-gold">
                無料査定する
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* スライダーインジケーター（ドットのみ） */}
        <div className="home-slider-dots">
          <button
            className={`home-slider-dot ${currentSlide === 0 ? 'active' : ''}`}
            onClick={() => setCurrentSlide(0)}
            aria-label="販売"
          />
          <button
            className={`home-slider-dot ${currentSlide === 1 ? 'active' : ''}`}
            onClick={() => setCurrentSlide(1)}
            aria-label="買取"
          />
        </div>
      </section>

      <div className="shop-container">
        {/* =====================================================
            モデルから探すセクション
            ===================================================== */}
        <section className="home-models-section">
          <h2 className="home-section-title">モデルから探す</h2>
          <div className="home-models-scroll-container">
            <div className="home-models-scroll">
              {MODEL_GROUPS.map(group => (
                <Link
                  key={group.key}
                  href={`/shop/products?model=${group.key}`}
                  className="home-model-card"
                >
                  <div className="home-model-thumbnail">
                    <img
                      src={getThumbnailUrl(group.models[0], null)}
                      alt={group.label}
                      onError={(e) => { e.currentTarget.src = '/shop/products/default-iphone.svg' }}
                    />
                  </div>
                  <span className="home-model-name">{group.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            在庫一覧プレビュー（3×3 = 9件）
            ===================================================== */}
        <section className="home-products-section">
          <div className="home-products-header">
            <h2 className="home-section-title">
              在庫一覧
              <span className="home-section-count">{totalCount}台</span>
            </h2>
            <Link href="/shop/products" className="home-products-link">
              すべて見る
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="shop-loading">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="home-products-grid">
              {products.map(product => (
                <Link
                  key={product.id}
                  href={`/shop/${product.id}`}
                  className="product-card"
                >
                  <div className="product-card-image">
                    <img
                      src={getThumbnailUrl(product.model, product.color)}
                      alt={getDisplayName(product.model)}
                      onError={(e) => {
                        if (e.currentTarget.src !== '/shop/products/default-iphone.svg') {
                          e.currentTarget.src = '/shop/products/default-iphone.svg'
                        }
                      }}
                    />
                    <div className="product-card-badges">
                      {isNewArrival(product.arrival_date) && (
                        <span className="product-badge product-badge-new">新着</span>
                      )}
                    </div>
                  </div>
                  <div className="product-card-body">
                    <div className="product-card-rank">
                      <span className={`product-rank ${getRankClass(product.rank)}`}>{product.rank}</span>
                      {product.battery_percent && (
                        <span className="product-battery">{product.battery_percent}%</span>
                      )}
                    </div>
                    <h3 className="product-card-title">{getDisplayName(product.model)}</h3>
                    <p className="product-card-storage">{product.storage}GB</p>
                    <p className="product-card-price">
                      <span className="product-price-yen">¥</span>
                      <span className="product-price-value">{formatPrice(product.sales_price)}</span>
                      <span className="product-price-tax">税込</span>
                    </p>
                    {product.shop?.name && (
                      <p className="product-card-store">{product.shop.name}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="home-products-footer">
            <Link href="/shop/products" className="home-products-btn">
              すべての在庫を見る（{totalCount}台）
            </Link>
          </div>
        </section>

        {/* =====================================================
            安心ポイントセクション
            ===================================================== */}
        <section className="home-trust-section">
          <h2 className="home-section-title">ONE STOPが選ばれる理由</h2>
          <div className="home-trust-grid">
            <div className="home-trust-card">
              <div className="home-trust-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3>業界最長360日保証</h3>
              <p>
                購入後60日間は全額返金保証。その後も360日間の修理保証で、
                万が一の故障にも安心して対応いたします。
              </p>
            </div>
            <div className="home-trust-card">
              <div className="home-trust-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3>プロによる徹底検品</h3>
              <p>
                修理のプロが1台1台丁寧に検品。バッテリー、カメラ、各種センサーまで
                50項目以上のチェックを実施しています。
              </p>
            </div>
            <div className="home-trust-card">
              <div className="home-trust-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
              </div>
              <h3>安心・安全な決済</h3>
              <p>
                クレジットカード、Apple Pay、PayPayなど多彩な決済に対応。
                SSL暗号化通信で個人情報も安全に保護されます。
              </p>
            </div>
            <div className="home-trust-card">
              <div className="home-trust-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <h3>迅速・丁寧な配送</h3>
              <p>
                ご注文から最短翌日発送。丁寧な梱包でお届けします。
                追跡番号付きで配送状況もリアルタイムで確認可能。
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            人気ランキングセクション
            ===================================================== */}
        {ranking.length > 0 && (
          <section className="home-ranking-section">
            <h2 className="home-section-title">
              人気ランキング
              <span className="home-section-subtitle">販売実績に基づく</span>
            </h2>
            <div className="home-ranking-grid">
              {ranking.map((item, index) => (
                <Link
                  key={`${item.model}-${item.storage}`}
                  href={`/shop/products?model=${item.model}&storage=${item.storage}`}
                  className="home-ranking-card"
                >
                  <div className={`home-ranking-badge rank-${index + 1}`}>{index + 1}</div>
                  <div className="home-ranking-thumbnail">
                    <img
                      src={getThumbnailUrl(item.model, null)}
                      alt={getDisplayName(item.model)}
                      onError={(e) => { e.currentTarget.src = '/shop/products/default-iphone.svg' }}
                    />
                  </div>
                  <div className="home-ranking-info">
                    <span className="home-ranking-name">{getDisplayName(item.model)}</span>
                    <span className="home-ranking-storage">{item.storage}GB</span>
                    <span className="home-ranking-count">{item.count}台販売</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* =====================================================
            用語解説セクション
            ===================================================== */}
        <section className="home-glossary-section">
          <h2 className="home-section-title">用語解説</h2>
          <div className="home-glossary-grid">
            <div className="home-glossary-item">
              <h3>ネットワーク利用制限とは</h3>
              <p>
                携帯キャリア（docomo/au/SoftBank等）が端末の利用を制限する仕組みです。
                <strong>○</strong>は制限なし、<strong>△</strong>は残債あり（支払い中）、<strong>×</strong>は制限中で通信不可の可能性があります。
                当店では○または△の端末のみ販売しています。
              </p>
            </div>
            <div className="home-glossary-item">
              <h3>カメラ染みとは</h3>
              <p>
                カメラレンズ内部に発生するシミや曇りのことです。
                撮影した写真にぼやけや影が写り込む場合があります。
                「なし」は問題なし、「少」は軽微で通常使用に支障なし、「中」「多」は写真に影響が出る場合があります。
              </p>
            </div>
            <div className="home-glossary-item">
              <h3>バッテリー最大容量とは</h3>
              <p>
                新品時と比較したバッテリーの性能を示します。
                80%以上であれば通常使用に問題ありません。
                80%未満の場合は充電の減りが早くなるため「お買い得」商品として割引販売しています。
              </p>
            </div>
            <div className="home-glossary-item">
              <h3>状態ランクとは</h3>
              <p>
                <strong>美品</strong>：目立った傷や汚れがなく非常に綺麗な状態。
                <strong>良品</strong>：多少の使用感はあるが目立つ傷はなし。
                <strong>並品</strong>：使用感や小傷があるが動作に問題なし。
                <strong>リペア品</strong>：当店で修理・整備済みの商品。
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            サポートリンクセクション
            ===================================================== */}
        <section className="home-support-section">
          <h2 className="home-section-title">サポート</h2>
          <div className="home-support-grid">
            <Link href="/shop/guide/data-transfer" className="home-support-card">
              <div className="home-support-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 1l4 4-4 4"></path>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                  <path d="M7 23l-4-4 4-4"></path>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                </svg>
              </div>
              <div className="home-support-text">
                <h3>データ移行ガイド</h3>
                <p>旧端末からのデータ移行方法</p>
              </div>
            </Link>
            <Link href="/shop/guide/after-purchase" className="home-support-card">
              <div className="home-support-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <div className="home-support-text">
                <h3>購入後の流れ</h3>
                <p>届いたらやること</p>
              </div>
            </Link>
            <Link href="/shop/warranty" className="home-support-card">
              <div className="home-support-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div className="home-support-text">
                <h3>360日保証</h3>
                <p>業界最長クラスの保証</p>
              </div>
            </Link>
            <Link href="/shop/support" className="home-support-card">
              <div className="home-support-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <div className="home-support-text">
                <h3>お問い合わせ</h3>
                <p>ご質問・保証申請</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
