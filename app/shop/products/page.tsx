'use client'

/**
 * =====================================================
 * ECサイト - 商品一覧ページ
 * =====================================================
 *
 * 構成：
 * - PC: 左サイドバー（フィルター）+ 商品グリッド
 * - スマホ: 上部フィルター + 商品グリッド
 * - ページネーション
 *
 * 改善点：
 * - モデル選択時に利用可能なストレージのみ表示
 * - 各選択肢に在庫数を（）で表示
 * - 在庫0の選択肢は非表示
 * =====================================================
 */

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { DEFAULT_TENANT_ID, getModelThumbnailPrefix, getModelPngFileName } from '../../lib/constants'
import '../shop.css'

type ShopProduct = {
  id: number
  model: string
  storage: number
  rank: string
  sales_price: number
  battery_percent: number | null
  is_service_state: boolean | null
  nw_status: string | null
  camera_stain_level: string | null
  arrival_date: string
  color: string | null
  shop_id: number
  shop: { name: string }
}

type IphoneModel = {
  model: string
  display_name: string
}

// 1ページあたりの表示件数
const ITEMS_PER_PAGE = 12

// モデルグループ定義
const MODEL_GROUPS = [
  { key: '17', label: 'iPhone 17', models: ['17promax', '17pro', '17plus', '17', 'air'] },
  { key: '16', label: 'iPhone 16', models: ['16promax', '16pro', '16plus', '16', '16e'] },
  { key: '15', label: 'iPhone 15', models: ['15promax', '15pro', '15plus', '15'] },
  { key: '14', label: 'iPhone 14', models: ['14promax', '14pro', '14plus', '14'] },
  { key: '13', label: 'iPhone 13', models: ['13promax', '13pro', '13mini', '13'] },
  { key: '12', label: 'iPhone 12', models: ['12promax', '12pro', '12mini', '12'] },
  { key: '11', label: 'iPhone 11', models: ['11promax', '11pro', '11'] },
  { key: 'se', label: 'iPhone SE', models: ['se3', 'se2'] },
]

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [models, setModels] = useState<IphoneModel[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileFilter, setShowMobileFilter] = useState(false)

  const [filters, setFilters] = useState({
    model: searchParams.get('model') || '',
    storage: searchParams.get('storage') || '',
    rank: searchParams.get('rank') || '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    showDeals: searchParams.get('deals') === 'true',
  })

  useEffect(() => {
    fetchData()
  }, [])

  // URLパラメータからフィルターを復元
  useEffect(() => {
    setFilters({
      model: searchParams.get('model') || '',
      storage: searchParams.get('storage') || '',
      rank: searchParams.get('rank') || '',
      priceMin: searchParams.get('priceMin') || '',
      priceMax: searchParams.get('priceMax') || '',
      showDeals: searchParams.get('deals') === 'true',
    })
    setCurrentPage(1)
  }, [searchParams])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('t_used_inventory')
        .select('id, model, storage, rank, sales_price, battery_percent, is_service_state, nw_status, camera_stain_level, arrival_date, color, shop_id, shop:m_shops(name)')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('status', '販売可')
        .not('sales_price', 'is', null)
        .order('arrival_date', { ascending: false })

      if (inventoryError) throw inventoryError

      const { data: modelData, error: modelError } = await supabase
        .from('m_iphone_models')
        .select('model, display_name')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('is_active', true)
        .order('sort_order')

      if (modelError) throw modelError

      // shopが配列で返ってくるので変換
      const transformedData = (inventoryData || []).map(item => ({
        ...item,
        shop: Array.isArray(item.shop) ? item.shop[0] : item.shop
      })) as ShopProduct[]
      setProducts(transformedData)
      setModels(modelData || [])
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

  const isDealProduct = (product: ShopProduct) => {
    return (
      product.camera_stain_level === 'minor' ||
      product.camera_stain_level === 'major' ||
      product.nw_status === 'triangle' ||
      (product.battery_percent !== null && product.battery_percent < 80) ||
      product.is_service_state === true
    )
  }

  // モデルグループでフィルター
  const matchesModelGroup = (productModel: string, filterModel: string) => {
    if (!filterModel) return true
    const group = MODEL_GROUPS.find(g => g.key === filterModel.toLowerCase())
    if (group) {
      return group.models.some(m => productModel.toLowerCase().includes(m.toLowerCase()))
    }
    return productModel.toLowerCase().includes(filterModel.toLowerCase())
  }

  // モデルでフィルタリングした商品（ストレージ等の選択肢計算用）
  const productsFilteredByModel = useMemo(() => {
    if (!filters.model) return products
    return products.filter(p => matchesModelGroup(p.model, filters.model))
  }, [products, filters.model])

  // 各モデルグループの在庫数
  const modelCounts = useMemo(() => {
    const counts: { [key: string]: number } = {}
    MODEL_GROUPS.forEach(group => {
      counts[group.key] = products.filter(p =>
        group.models.some(m => p.model.toLowerCase().includes(m.toLowerCase()))
      ).length
    })
    return counts
  }, [products])

  // 選択されたモデルで利用可能なストレージと在庫数
  const storageOptions = useMemo(() => {
    const counts: { [key: number]: number } = {}
    productsFilteredByModel.forEach(p => {
      counts[p.storage] = (counts[p.storage] || 0) + 1
    })
    // 在庫がある容量のみ、ソートして返す
    return Object.entries(counts)
      .map(([storage, count]) => ({ storage: parseInt(storage), count }))
      .filter(item => item.count > 0)
      .sort((a, b) => a.storage - b.storage)
  }, [productsFilteredByModel])

  // 選択されたモデル＋ストレージで利用可能なランクと在庫数
  const rankOptions = useMemo(() => {
    let filtered = productsFilteredByModel
    if (filters.storage) {
      filtered = filtered.filter(p => p.storage === parseInt(filters.storage))
    }
    const counts: { [key: string]: number } = {}
    filtered.forEach(p => {
      counts[p.rank] = (counts[p.rank] || 0) + 1
    })
    return ['美品', '良品', '並品', 'リペア品']
      .map(rank => ({ rank, count: counts[rank] || 0 }))
      .filter(item => item.count > 0)
  }, [productsFilteredByModel, filters.storage])

  // 価格帯ごとの在庫数
  const pricePresets = useMemo(() => {
    const presets = [
      { label: '〜3万円', min: 0, max: 30000 },
      { label: '3〜5万円', min: 30000, max: 50000 },
      { label: '5〜8万円', min: 50000, max: 80000 },
      { label: '8〜10万円', min: 80000, max: 100000 },
      { label: '10万円〜', min: 100000, max: Infinity },
    ]

    let filtered = productsFilteredByModel
    if (filters.storage) {
      filtered = filtered.filter(p => p.storage === parseInt(filters.storage))
    }
    if (filters.rank) {
      filtered = filtered.filter(p => p.rank === filters.rank)
    }

    return presets.map(preset => ({
      ...preset,
      minStr: preset.min === 0 ? '' : String(preset.min),
      maxStr: preset.max === Infinity ? '' : String(preset.max),
      count: filtered.filter(p =>
        p.sales_price >= preset.min &&
        (preset.max === Infinity || p.sales_price < preset.max)
      ).length
    })).filter(p => p.count > 0)
  }, [productsFilteredByModel, filters.storage, filters.rank])

  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      if (filters.model && !matchesModelGroup(product.model, filters.model)) {
        return false
      }
      if (filters.storage && product.storage !== parseInt(filters.storage)) {
        return false
      }
      if (filters.rank && product.rank !== filters.rank) {
        return false
      }
      if (filters.priceMin && product.sales_price < parseInt(filters.priceMin)) {
        return false
      }
      if (filters.priceMax && product.sales_price > parseInt(filters.priceMax)) {
        return false
      }
      return true
    })

    if (filters.showDeals) {
      result = result.filter(isDealProduct)
    }

    return result
  }, [products, filters])

  // ページネーション
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])

  // フィルター変更時にページをリセット
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  // モデル変更時にストレージ・ランク・価格フィルターをリセット
  const handleModelChange = (modelKey: string) => {
    const newModel = filters.model === modelKey ? '' : modelKey
    setFilters(prev => ({
      ...prev,
      model: newModel,
      storage: '', // ストレージをリセット
      rank: '',    // ランクをリセット
      priceMin: '', // 価格をリセット
      priceMax: '',
    }))
  }

  // ストレージ変更時にランク・価格フィルターをリセット
  const handleStorageChange = (storage: string) => {
    const newStorage = filters.storage === storage ? '' : storage
    setFilters(prev => ({
      ...prev,
      storage: newStorage,
      rank: '',    // ランクをリセット
      priceMin: '', // 価格をリセット
      priceMax: '',
    }))
  }

  // ランク変更時に価格フィルターをリセット
  const handleRankChange = (rank: string) => {
    const newRank = filters.rank === rank ? '' : rank
    setFilters(prev => ({
      ...prev,
      rank: newRank,
      priceMin: '', // 価格をリセット
      priceMax: '',
    }))
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString()
  }

  const getThumbnailUrl = (model: string, color: string | null) => {
    if (color) {
      const modelPrefix = getModelThumbnailPrefix(model)
      return `/shop/products/thumbnails/${modelPrefix}_${color}.png`
    }
    const pngName = getModelPngFileName(model)
    return `/shop/products/thumbnails/${pngName}.png`
  }

  const isNewArrival = (arrivalDate: string) => {
    const arrival = new Date(arrivalDate)
    const today = new Date()
    const diffDays = Math.floor((today.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  }

  const clearAllFilters = () => {
    setFilters({ model: '', storage: '', rank: '', priceMin: '', priceMax: '', showDeals: false })
    router.push('/shop/products')
  }

  const hasActiveFilters = filters.model || filters.storage || filters.rank || filters.priceMin || filters.priceMax || filters.showDeals

  return (
    <div className="products-page">
      {/* パンくず */}
      <div className="shop-container">
        <nav className="products-breadcrumb">
          <Link href="/shop">ホーム</Link>
          <span>/</span>
          <span>商品一覧</span>
        </nav>
      </div>

      <div className="shop-container">
        <div className="products-layout">
          {/* =====================================================
              サイドバー（PC用）
              ===================================================== */}
          <aside className="products-sidebar">
            <div className="products-sidebar-header">
              <h2>絞り込み</h2>
              {hasActiveFilters && (
                <button className="products-clear-btn" onClick={clearAllFilters}>
                  クリア
                </button>
              )}
            </div>

            {/* モデル */}
            <div className="products-filter-group">
              <h3>モデル</h3>
              <div className="products-filter-options">
                {MODEL_GROUPS.filter(group => modelCounts[group.key] > 0).map(group => (
                  <label key={group.key} className="products-filter-checkbox">
                    <input
                      type="radio"
                      name="model"
                      checked={filters.model === group.key}
                      onChange={() => handleModelChange(group.key)}
                    />
                    <span>{group.label}</span>
                    <span className="products-filter-count">({modelCounts[group.key]})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ストレージ */}
            <div className="products-filter-group">
              <h3>ストレージ</h3>
              <div className="products-filter-options">
                {storageOptions.map(({ storage, count }) => (
                  <label key={storage} className="products-filter-checkbox">
                    <input
                      type="radio"
                      name="storage"
                      checked={filters.storage === String(storage)}
                      onChange={() => handleStorageChange(String(storage))}
                    />
                    <span>{storage >= 1000 ? `${storage / 1024}TB` : `${storage}GB`}</span>
                    <span className="products-filter-count">({count})</span>
                  </label>
                ))}
                {storageOptions.length === 0 && (
                  <p className="products-filter-empty">在庫なし</p>
                )}
              </div>
            </div>

            {/* 状態ランク */}
            <div className="products-filter-group">
              <h3>状態ランク</h3>
              <div className="products-filter-options">
                {rankOptions.map(({ rank, count }) => (
                  <label key={rank} className="products-filter-checkbox">
                    <input
                      type="radio"
                      name="rank"
                      checked={filters.rank === rank}
                      onChange={() => handleRankChange(rank)}
                    />
                    <span>{rank}</span>
                    <span className="products-filter-count">({count})</span>
                  </label>
                ))}
                {rankOptions.length === 0 && (
                  <p className="products-filter-empty">在庫なし</p>
                )}
              </div>
            </div>

            {/* 価格帯 */}
            <div className="products-filter-group">
              <h3>価格帯</h3>
              <div className="products-filter-options">
                {pricePresets.map(preset => (
                  <label key={preset.label} className="products-filter-checkbox">
                    <input
                      type="radio"
                      name="price"
                      checked={filters.priceMin === preset.minStr && filters.priceMax === preset.maxStr}
                      onChange={() => {
                        if (filters.priceMin === preset.minStr && filters.priceMax === preset.maxStr) {
                          setFilters(prev => ({ ...prev, priceMin: '', priceMax: '' }))
                        } else {
                          setFilters(prev => ({ ...prev, priceMin: preset.minStr, priceMax: preset.maxStr }))
                        }
                      }}
                    />
                    <span>{preset.label}</span>
                    <span className="products-filter-count">({preset.count})</span>
                  </label>
                ))}
                {pricePresets.length === 0 && (
                  <p className="products-filter-empty">在庫なし</p>
                )}
              </div>
            </div>

            {/* お買い得 */}
            <div className="products-filter-group">
              <label className="products-filter-toggle">
                <input
                  type="checkbox"
                  checked={filters.showDeals}
                  onChange={(e) => setFilters(prev => ({ ...prev, showDeals: e.target.checked }))}
                />
                <span>お買い得商品のみ</span>
              </label>
              <p className="products-filter-hint">
                バッテリー80%未満・カメラ染みありなど、条件付きでお得な商品
              </p>
            </div>
          </aside>

          {/* =====================================================
              メインコンテンツ
              ===================================================== */}
          <main className="products-main">
            {/* モバイル用フィルターボタン */}
            <div className="products-mobile-header">
              <button
                className="products-mobile-filter-btn"
                onClick={() => setShowMobileFilter(!showMobileFilter)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6"></line>
                  <line x1="4" y1="12" x2="20" y2="12"></line>
                  <line x1="4" y1="18" x2="20" y2="18"></line>
                </svg>
                絞り込み
                {hasActiveFilters && <span className="products-filter-badge">!</span>}
              </button>
              <span className="products-count">{filteredProducts.length}件</span>
            </div>

            {/* モバイル用フィルターパネル */}
            {showMobileFilter && (
              <div className="products-mobile-filter">
                <div className="products-mobile-filter-header">
                  <h3>絞り込み</h3>
                  <button onClick={() => setShowMobileFilter(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="products-mobile-filter-content">
                  {/* モデル */}
                  <div className="products-mobile-filter-group">
                    <h4>モデル</h4>
                    <div className="products-mobile-filter-buttons">
                      {MODEL_GROUPS.filter(group => modelCounts[group.key] > 0).map(group => (
                        <button
                          key={group.key}
                          className={`products-mobile-filter-chip ${filters.model === group.key ? 'active' : ''}`}
                          onClick={() => handleModelChange(group.key)}
                        >
                          {group.label}（{modelCounts[group.key]}）
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ストレージ */}
                  <div className="products-mobile-filter-group">
                    <h4>ストレージ</h4>
                    <div className="products-mobile-filter-buttons">
                      {storageOptions.map(({ storage, count }) => (
                        <button
                          key={storage}
                          className={`products-mobile-filter-chip ${filters.storage === String(storage) ? 'active' : ''}`}
                          onClick={() => handleStorageChange(String(storage))}
                        >
                          {storage >= 1000 ? `${storage / 1024}TB` : `${storage}GB`}（{count}）
                        </button>
                      ))}
                      {storageOptions.length === 0 && (
                        <p className="products-filter-empty">モデルを選択してください</p>
                      )}
                    </div>
                  </div>

                  {/* ランク */}
                  <div className="products-mobile-filter-group">
                    <h4>状態ランク</h4>
                    <div className="products-mobile-filter-buttons">
                      {rankOptions.map(({ rank, count }) => (
                        <button
                          key={rank}
                          className={`products-mobile-filter-chip ${filters.rank === rank ? 'active' : ''}`}
                          onClick={() => handleRankChange(rank)}
                        >
                          {rank}（{count}）
                        </button>
                      ))}
                      {rankOptions.length === 0 && (
                        <p className="products-filter-empty">在庫なし</p>
                      )}
                    </div>
                  </div>

                  {/* 価格 */}
                  <div className="products-mobile-filter-group">
                    <h4>価格帯</h4>
                    <div className="products-mobile-filter-buttons">
                      {pricePresets.map(preset => (
                        <button
                          key={preset.label}
                          className={`products-mobile-filter-chip ${filters.priceMin === preset.minStr && filters.priceMax === preset.maxStr ? 'active' : ''}`}
                          onClick={() => {
                            if (filters.priceMin === preset.minStr && filters.priceMax === preset.maxStr) {
                              setFilters(prev => ({ ...prev, priceMin: '', priceMax: '' }))
                            } else {
                              setFilters(prev => ({ ...prev, priceMin: preset.minStr, priceMax: preset.maxStr }))
                            }
                          }}
                        >
                          {preset.label}（{preset.count}）
                        </button>
                      ))}
                      {pricePresets.length === 0 && (
                        <p className="products-filter-empty">在庫なし</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="products-mobile-filter-footer">
                  {hasActiveFilters && (
                    <button className="products-mobile-clear-btn" onClick={clearAllFilters}>
                      条件をクリア
                    </button>
                  )}
                  <button className="products-mobile-apply-btn" onClick={() => setShowMobileFilter(false)}>
                    {filteredProducts.length}件を表示
                  </button>
                </div>
              </div>
            )}

            {/* 商品ヘッダー */}
            <div className="products-header">
              <h1 className="products-title">
                商品一覧
                <span className="products-count-desktop">{filteredProducts.length}件</span>
              </h1>
            </div>

            {/* 商品グリッド */}
            {loading ? (
              <div className="shop-loading">
                <div className="loading-spinner"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="shop-empty">
                <p>条件に合う商品が見つかりませんでした</p>
                <button className="btn btn-primary" onClick={clearAllFilters}>
                  条件をリセット
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {paginatedProducts.map(product => (
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
                        {isDealProduct(product) && (
                          <span className="product-badge product-badge-deal">お買い得</span>
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

            {/* ページネーション */}
            {!loading && filteredProducts.length > ITEMS_PER_PAGE && (
              <div className="products-pagination">
                <button
                  className="products-pagination-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  前へ
                </button>
                <div className="products-pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // 現在ページの前後2ページと最初・最後のページを表示
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2
                    })
                    .map((page, index, arr) => (
                      <span key={page}>
                        {index > 0 && arr[index - 1] !== page - 1 && (
                          <span className="products-pagination-ellipsis">...</span>
                        )}
                        <button
                          className={`products-pagination-page ${currentPage === page ? 'active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </span>
                    ))}
                </div>
                <button
                  className="products-pagination-btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  次へ
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
