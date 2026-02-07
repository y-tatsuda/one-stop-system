'use client'

/**
 * =====================================================
 * ECサイト - 商品詳細ページ
 * =====================================================
 *
 * 個別商品の詳細情報を表示
 * カートへの追加機能付き
 * =====================================================
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { DEFAULT_TENANT_ID, getModelThumbnailPrefix, getModelPngFileName, getOfficialColorName } from '../../lib/constants'
import { useCart } from '../CartContext'
import '../shop.css'

type ProductDetail = {
  id: number
  model: string
  storage: number
  rank: string
  sales_price: number
  battery_percent: number | null
  is_service_state: boolean | null
  nw_status: string | null
  camera_stain_level: string | null
  status: string
  imei: string | null
  color: string | null
  shop_id: number
  shop: { name: string }
}

// 店舗連絡先マッピング
const STORE_CONTACTS: { [key: string]: string } = {
  '福井店': '080-9361-6018',
  '鯖江店': '080-5720-1164',
}

type IphoneModel = {
  model: string
  display_name: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem, items } = useCart()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [models, setModels] = useState<IphoneModel[]>([])
  const [loading, setLoading] = useState(true)
  const [addedToCart, setAddedToCart] = useState(false)

  const productId = parseInt(params.id as string)

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      // 商品詳細を取得（店舗情報も含む）
      const { data: productData, error: productError } = await supabase
        .from('t_used_inventory')
        .select('id, model, storage, rank, sales_price, battery_percent, is_service_state, nw_status, camera_stain_level, status, imei, color, shop_id, shop:m_shops(name)')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('id', productId)
        .single()

      if (productError) throw productError

      // 在庫ありかチェック
      if (!productData || productData.status !== '販売可') {
        setProduct(null)
        setLoading(false)
        return
      }

      // モデルマスタを取得
      const { data: modelData } = await supabase
        .from('m_iphone_models')
        .select('model, display_name')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('is_active', true)

      // shopが配列で返ってくるので変換
      const shopData = Array.isArray(productData.shop) ? productData.shop[0] : productData.shop
      setProduct({ ...productData, shop: shopData } as ProductDetail)
      setModels(modelData || [])
    } catch (error) {
      console.error('データ取得エラー:', error)
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }

  const getDisplayName = (model: string) => {
    const found = models.find(m => m.model === model)
    return found ? found.display_name : model
  }

  // サムネイル画像のURLを生成
  // カラー未選択時はモデル別のPNG（コレクション用サムネ）を使用
  const getThumbnailUrl = (model: string, color: string | null) => {
    if (color) {
      const modelPrefix = getModelThumbnailPrefix(model)
      return `/shop/products/thumbnails/${modelPrefix}_${color}.png`
    }
    // カラー未設定時はモデル別PNG
    const pngName = getModelPngFileName(model)
    return `/shop/products/thumbnails/${pngName}.png`
  }


  const getRankDescription = (rank: string) => {
    switch (rank) {
      case '美品': return '目立った傷や汚れがなく、非常に綺麗な状態です。'
      case '良品': return '多少の使用感はありますが、目立つ傷はありません。'
      case '並品': return '使用感や小傷がありますが、動作に問題はありません。'
      case 'リペア品': return '当店で修理・整備済みの商品です。'
      default: return ''
    }
  }

  const getNWStatusLabel = (status: string | null) => {
    switch (status) {
      case '○': return '○（利用制限なし）'
      case '△': return '△（残債あり）'
      case '×': return '×（利用制限あり）'
      default: return status || '確認中'
    }
  }

  const getCameraStainLabel = (level: string | null) => {
    switch (level) {
      case 'なし': return 'なし'
      case '少': return '少（軽微）'
      case '中': return '中（ややあり）'
      case '多': return '多（目立つ）'
      default: return level || '確認中'
    }
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString()
  }

  const isInCart = items.some(item => item.id === productId)

  const handleAddToCart = () => {
    if (!product) return

    addItem({
      id: product.id,
      model: product.model,
      storage: product.storage,
      rank: product.rank,
      sales_price: product.sales_price,
      battery_percent: product.battery_percent,
      display_name: getDisplayName(product.model),
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 3000)
  }

  if (loading) {
    return (
      <div className="shop-container">
        <div className="shop-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="shop-container">
        <div className="shop-empty">
          <div style={{ width: '48px', height: '48px', margin: '0 auto var(--space-md)', color: '#D1D5DB' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '100%', height: '100%' }}>
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
          </div>
          <p>商品が見つかりませんでした</p>
          <p style={{ fontSize: '0.9rem', marginTop: 'var(--space-sm)' }}>
            この商品は販売終了または非公開になった可能性があります。
          </p>
          <Link href="/shop" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>
            商品一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="shop-container">
      {/* パンくず */}
      <nav style={{ marginBottom: 'var(--space-md)', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
        <Link href="/shop" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>商品一覧</Link>
        <span style={{ margin: '0 var(--space-sm)' }}>/</span>
        <span>{getDisplayName(product.model)}</span>
      </nav>

      <div className="product-detail">
        {/* 商品画像 */}
        <div className="product-gallery">
          <div className="product-main-image">
            <img
              src={getThumbnailUrl(product.model, product.color)}
              alt={getDisplayName(product.model)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '24px' }}
              onError={(e) => {
                if (e.currentTarget.src !== '/shop/products/default-iphone.svg') {
                  e.currentTarget.src = '/shop/products/default-iphone.svg'
                }
              }}
            />
          </div>
          {/* サブ画像（準備中） */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px' }}>
            {[2, 3, 4, 5].map((num) => (
              <div
                key={num}
                style={{
                  aspectRatio: '1',
                  background: '#F3F4F6',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #E5E7EB',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: '4px' }}>準備中</span>
              </div>
            ))}
          </div>
        </div>

        {/* 商品情報 */}
        <div className="product-info">
          <h1 className="product-title">
            {getDisplayName(product.model)} {product.storage}GB
          </h1>

          {/* 価格 */}
          <div className="product-price-box">
            <span className="product-price-main">
              ¥{formatPrice(product.sales_price)}
            </span>
            <span className="product-price-label">（税込）</span>
          </div>

          {/* 360日保証の案内 */}
          <div className="product-warranty-notice">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <div>
              <strong>360日保証付き</strong>
              <span style={{ display: 'block', fontSize: '0.85rem', opacity: 0.8 }}>
                購入後60日間は100%返金保証
              </span>
            </div>
          </div>

          {/* スペック */}
          <div className="product-specs">
            <div className="product-spec">
              <div className="product-spec-label">状態ランク</div>
              <div className="product-spec-value">{product.rank}</div>
            </div>
            {product.color && (
              <div className="product-spec">
                <div className="product-spec-label">カラー</div>
                <div className="product-spec-value">{getOfficialColorName(product.model, product.color)}</div>
              </div>
            )}
            <div className="product-spec">
              <div className="product-spec-label">バッテリー</div>
              <div className="product-spec-value">
                {product.is_service_state ? (
                  <span style={{ color: 'var(--color-warning)' }}>要交換</span>
                ) : (
                  product.battery_percent ? `${product.battery_percent}%` : '確認中'
                )}
              </div>
            </div>
            <div className="product-spec">
              <div className="product-spec-label">ネットワーク制限</div>
              <div className="product-spec-value">{getNWStatusLabel(product.nw_status)}</div>
            </div>
            <div className="product-spec">
              <div className="product-spec-label">カメラ染み</div>
              <div className="product-spec-value">{getCameraStainLabel(product.camera_stain_level)}</div>
            </div>
          </div>

          {/* 状態の説明 */}
          <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: 'var(--space-xs)' }}>
              {product.rank}について
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              {getRankDescription(product.rank)}
            </p>
          </div>

          {/* 取扱店舗 */}
          {product.shop?.name && (
            <div className="product-store-info">
              <div className="product-store-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>取扱店舗</span>
              </div>
              <div className="product-store-name">{product.shop.name}</div>
              {STORE_CONTACTS[product.shop.name] && (
                <a
                  href={`tel:${STORE_CONTACTS[product.shop.name].replace(/-/g, '')}`}
                  className="product-store-tel"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  {STORE_CONTACTS[product.shop.name]}
                </a>
              )}
            </div>
          )}

          {/* カートに追加 */}
          <div className="product-actions">
            {isInCart ? (
              <>
                <button className="product-add-btn" disabled>
                  カートに追加済み
                </button>
                <Link href="/shop/cart" className="btn btn-secondary btn-block" style={{ textAlign: 'center' }}>
                  カートを見る
                </Link>
              </>
            ) : (
              <button className="product-add-btn" onClick={handleAddToCart}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                カートに追加
              </button>
            )}

            {addedToCart && (
              <div style={{
                padding: 'var(--space-md)',
                background: 'var(--color-success-light)',
                borderRadius: 'var(--radius)',
                color: 'var(--color-success)',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                カートに追加しました
              </div>
            )}
          </div>

          {/* サポートリンク */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginTop: 'var(--space-sm)' }}>
            <Link href="/shop/warranty" style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>
              保証について詳しく →
            </Link>
            <Link href="/shop/guide/data-transfer" style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>
              データ移行ガイド →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
