'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type IphoneModel = {
  model: string
  display_name: string
}

type UsedInventory = {
  id: number
  arrival_date: string
  model: string
  storage: number
  rank: string
  imei: string | null
  management_number: string | null
  battery_percent: number | null
  is_service_state: boolean | null
  nw_status: string | null
  camera_stain_level: string | null
  camera_broken: boolean | null
  repair_history: boolean | null
  repair_types: string | null
  buyback_price: number
  repair_cost: number
  total_cost: number
  sales_price: number | null
  status: string
  ec_status: string | null
  storage_location: string | null  // 保管場所
  memo: string | null
  shop_id: number
  shop: {
    name: string
  }
  sale_date?: string | null // 販売日（販売済みの場合）
}

type Shop = {
  id: number
  name: string
}

type PartsInventory = {
  id: number
  model: string
  parts_type: string
  actual_qty: number
}

// 色の区別があるモデル（白パネルがあるモデル）
const MODELS_WITH_COLOR = ['SE', '6s', '7', '7P', '8', '8P']

// 修理に使用するパーツ種別（モデルに応じて表示を切り替え）
const getRepairTypesList = (model?: string) => {
  const hasColor = model ? MODELS_WITH_COLOR.includes(model) : false

  return [
    { key: 'TH-L', label: hasColor ? '標準パネル(黒)' : '標準パネル', partsType: 'TH-L' },
    { key: 'TH-F', label: '標準パネル(白)', partsType: 'TH-F', onlyWithColor: true },
    { key: 'HG-L', label: hasColor ? 'HGパネル(黒)' : 'HGパネル', partsType: 'HG-L' },
    { key: 'HG-F', label: 'HGパネル(白)', partsType: 'HG-F', onlyWithColor: true },
    { key: 'battery', label: '標準バッテリー', partsType: 'バッテリー' },
    { key: 'hg_battery', label: 'HGバッテリー', partsType: 'HGバッテリー' },
    { key: 'connector', label: 'コネクタ', partsType: 'コネクタ' },
    { key: 'rear_camera', label: 'リアカメラ', partsType: 'リアカメラ' },
    { key: 'front_camera', label: 'インカメラ', partsType: 'インカメラ' },
    { key: 'camera_glass', label: 'カメラ窓', partsType: 'カメラ窓' },
  ].filter(item => !item.onlyWithColor || hasColor)
}

const ITEMS_PER_PAGE = 20

export default function InventoryPage() {
  const [inventory, setInventory] = useState<UsedInventory[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [iphoneModels, setIphoneModels] = useState<IphoneModel[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const [filters, setFilters] = useState({
    shopId: '',
    status: '',
    model: '',
    managementNumber: '',
    storageLocation: '',
  })

  const [selectedItem, setSelectedItem] = useState<UsedInventory | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editData, setEditData] = useState({
    sales_price: 0,
    sales_price_tax_included: '', // 入力用の税込価格（文字列）
    ec_status: '',
    status: '',
    storage_location: '',
    memo: '',
  })

  // 一括変更用
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkLocation, setBulkLocation] = useState('')

  const [showRepairModal, setShowRepairModal] = useState(false)
  const [selectedParts, setSelectedParts] = useState<string[]>([])
  const [partsInventory, setPartsInventory] = useState<PartsInventory[]>([])

  const getDisplayName = (model: string) => {
    const found = iphoneModels.find(m => m.model === model)
    return found ? found.display_name : model
  }

  const calculateDaysInStock = (arrivalDate: string) => {
    const arrival = new Date(arrivalDate)
    const today = new Date()
    const diffTime = today.getTime() - arrival.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  // 保証期間の計算
  const getWarrantyInfo = (saleDate: string | null | undefined) => {
    if (!saleDate) return null

    const sale = new Date(saleDate)
    const today = new Date()
    const diffTime = today.getTime() - sale.getTime()
    const daysSinceSale = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (daysSinceSale > 360) {
      return { status: '保証終了', color: '#6B7280', daysLeft: 0 }
    }

    // 現在の保証段階を計算
    const stage = Math.floor(daysSinceSale / 60) // 0-5
    const refundRate = 100 - (stage * 10)
    const repairRate = stage * 10

    // 次の段階までの日数
    const nextStageDay = (stage + 1) * 60
    const daysUntilNextStage = nextStageDay - daysSinceSale

    // 保証終了までの日数
    const daysUntilExpiry = 360 - daysSinceSale

    let statusText = ''
    if (stage === 0) {
      statusText = `全額返金/無償修理（残${daysUntilNextStage}日）`
    } else if (stage < 6) {
      statusText = `${refundRate}%返金/${repairRate}%負担（残${daysUntilNextStage}日）`
    }

    return {
      status: statusText,
      color: stage === 0 ? '#059669' : stage < 3 ? '#D97706' : '#DC2626',
      daysLeft: daysUntilExpiry,
      daysSinceSale
    }
  }

  const getDaysBadgeClass = (days: number) => {
    if (days >= 120) return 'badge-danger'
    if (days >= 90) return 'badge-warning'
    if (days >= 60) return 'badge-warning'
    if (days >= 45) return 'badge-primary'
    return 'badge-gray'
  }

  const getNwStatusDisplay = (status: string | null) => {
    if (status === 'ok') return '○'
    if (status === 'triangle') return '△'
    if (status === 'cross') return '×'
    return '-'
  }

  const getCameraStainDisplay = (level: string | null) => {
    if (level === 'none') return 'なし'
    if (level === 'minor') return '少'
    if (level === 'major') return '多'
    return '-'
  }

  const getEcStatusDisplay = (status: string | null) => {
    if (!status) return '未出品'
    if (status === 'shopify') return 'Shopify'
    if (status === 'mercari') return 'メルカリ'
    if (status === 'both') return '両方'
    return status
  }

  const getStatusDisplay = (status: string) => {
    return status
  }

  useEffect(() => {
    async function fetchData() {
      const { data: shopsData } = await supabase
        .from('m_shops')
        .select('id, name')
        .eq('is_active', true)
        .order('id')

      setShops(shopsData || [])

      const { data: modelsData } = await supabase
        .from('m_iphone_models')
        .select('model, display_name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('sort_order')

      setIphoneModels(modelsData || [])
      await fetchInventory()
    }

    fetchData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    fetchInventory()
  }, [filters])

  const fetchInventory = async () => {
    setLoading(true)

    let query = supabase
      .from('t_used_inventory')
      .select(`*, shop:m_shops(name)`)
      .eq('tenant_id', 1)
      .order('arrival_date', { ascending: false })

    if (filters.shopId) query = query.eq('shop_id', parseInt(filters.shopId))
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.model) query = query.ilike('model', `%${filters.model}%`)
    if (filters.managementNumber) query = query.ilike('management_number', `%${filters.managementNumber}%`)
    if (filters.storageLocation) query = query.ilike('storage_location', `%${filters.storageLocation}%`)

    const { data, error } = await query
    if (error) {
      console.error('Error:', error)
      setLoading(false)
      return
    }

    // 販売済みの端末の販売日を取得
    const inventoryWithSaleDate = await Promise.all((data || []).map(async (item) => {
      if (item.status === '販売済') {
        // t_sales_detailsからsale_idを取得し、t_salesからsale_dateを取得
        const { data: detailData } = await supabase
          .from('t_sales_details')
          .select('sale_id')
          .eq('used_inventory_id', item.id)
          .limit(1)
          .single()

        if (detailData?.sale_id) {
          const { data: salesData } = await supabase
            .from('t_sales')
            .select('sale_date')
            .eq('id', detailData.sale_id)
            .single()

          return {
            ...item,
            sale_date: salesData?.sale_date || null
          }
        }
      }
      return item
    }))

    setInventory(inventoryWithSaleDate)
    setLoading(false)
  }

  const openDetailModal = (item: UsedInventory) => {
    setSelectedItem(item)
    const salesPrice = item.sales_price || 0
    setEditData({
      sales_price: salesPrice,
      sales_price_tax_included: String(salesPrice),
      ec_status: item.ec_status || '',
      status: item.status,
      storage_location: item.storage_location || '',
      memo: item.memo || '',
    })
    setShowDetailModal(true)
  }

  const saveDetail = async () => {
    if (!selectedItem) return

    if (selectedItem.status === '修理中' && editData.status === '販売可') {
      await fetchPartsInventory(selectedItem.shop_id, selectedItem.model)
      setShowRepairModal(true)
      return
    }

    const { error } = await supabase
      .from('t_used_inventory')
      .update({
        sales_price: editData.sales_price,
        ec_status: editData.ec_status || null,
        status: editData.status,
        storage_location: editData.storage_location || null,
        memo: editData.memo || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedItem.id)

    if (error) {
      alert('更新に失敗しました: ' + error.message)
      return
    }

    setShowDetailModal(false)
    setSelectedItem(null)
    fetchInventory()
  }

  // 一括で保管場所を更新
  const bulkUpdateLocation = async () => {
    if (selectedIds.length === 0) {
      alert('在庫を選択してください')
      return
    }
    if (!bulkLocation.trim()) {
      alert('保管場所を入力してください')
      return
    }

    const { error } = await supabase
      .from('t_used_inventory')
      .update({
        storage_location: bulkLocation.trim(),
        updated_at: new Date().toISOString(),
      })
      .in('id', selectedIds)

    if (error) {
      alert('更新に失敗しました: ' + error.message)
      return
    }

    alert(`${selectedIds.length}件の保管場所を更新しました`)
    setShowBulkModal(false)
    setSelectedIds([])
    setBulkLocation('')
    fetchInventory()
  }

  // 全選択/全解除
  const toggleSelectAll = () => {
    const pageItems = paginatedInventory.filter(item => item.status !== '販売済')
    if (selectedIds.length === pageItems.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(pageItems.map(item => item.id))
    }
  }

  // 個別選択
  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const fetchPartsInventory = async (shopId: number, model: string) => {
    const { data } = await supabase
      .from('t_parts_inventory')
      .select('id, model, parts_type, actual_qty')
      .eq('tenant_id', 1)
      .eq('shop_id', shopId)
      .eq('model', model)

    setPartsInventory(data || [])
    
    if (selectedItem?.repair_types) {
      setSelectedParts(selectedItem.repair_types.split(','))
    } else {
      setSelectedParts([])
    }
  }

  const togglePart = (key: string) => {
    if (selectedParts.includes(key)) {
      setSelectedParts(selectedParts.filter(p => p !== key))
    } else {
      setSelectedParts([...selectedParts, key])
    }
  }

  const getPartsQty = (partsType: string) => {
    const found = partsInventory.find(p => p.parts_type === partsType)
    return found ? found.actual_qty : 0
  }

  const completeRepair = async () => {
    if (!selectedItem) return

    const { error: updateError } = await supabase
      .from('t_used_inventory')
      .update({
        sales_price: editData.sales_price,
        ec_status: editData.ec_status || null,
        status: '販売可',
        memo: editData.memo || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedItem.id)

    if (updateError) {
      alert('ステータス更新に失敗しました: ' + updateError.message)
      return
    }

    const repairTypesList = getRepairTypesList(selectedItem.model)
    for (const partKey of selectedParts) {
      const repairType = repairTypesList.find(r => r.key === partKey)
      if (!repairType) continue
      const partsRecord = partsInventory.find(p => p.parts_type === repairType.partsType)
      if (!partsRecord) continue

      await supabase
        .from('t_parts_inventory')
        .update({ actual_qty: partsRecord.actual_qty - 1, updated_at: new Date().toISOString() })
        .eq('id', partsRecord.id)
    }

    alert('修理完了処理が完了しました')
    setShowRepairModal(false)
    setShowDetailModal(false)
    setSelectedItem(null)
    setSelectedParts([])
    fetchInventory()
  }

  // サマリー計算（「在庫」ステータスも含む）
  const isActiveStock = (status: string) => status === '販売可' || status === '修理中'
  const totalStock = inventory.filter(i => isActiveStock(i.status)).length
  const totalInStock = inventory.filter(i => i.status === '販売可').length
  const totalRepairing = inventory.filter(i => i.status === '修理中').length
  const over45Days = inventory.filter(i => isActiveStock(i.status) && calculateDaysInStock(i.arrival_date) >= 45).length
  const over90Days = inventory.filter(i => isActiveStock(i.status) && calculateDaysInStock(i.arrival_date) >= 90).length
  const totalNoEc = inventory.filter(i => isActiveStock(i.status) && !i.ec_status).length

  const getShopStats = (shopId: number) => {
    const shopItems = inventory.filter(i => i.shop_id === shopId)
    const inStock = shopItems.filter(i => i.status === '販売可').length
    const repairing = shopItems.filter(i => i.status === '修理中').length
    const noEc = shopItems.filter(i => isActiveStock(i.status) && !i.ec_status).length
    return { total: inStock + repairing, inStock, repairing, noEc }
  }

  const showRepairingCount = filters.status === ''

  // ページネーション計算
  const totalPages = Math.ceil(inventory.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedInventory = inventory.slice(startIndex, endIndex)

  if (loading && inventory.length === 0) {
    return <div className="loading" style={{ height: '100vh' }}><div className="loading-spinner"></div></div>
  }

  return (
    <div className="container">
      <style jsx>{`
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          align-items: end;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .shop-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 10px;
        }
        .summary-card {
          background: #F8FAFC;
          border-radius: 6px;
          padding: 10px 12px;
        }
        .summary-label {
          font-size: 0.7rem;
          color: #6B7280;
          margin-bottom: 2px;
        }
        .summary-value {
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.2;
        }
        .summary-sub {
          font-size: 0.65rem;
          color: #6B7280;
          margin-top: 2px;
        }
        @media (max-width: 768px) {
          .filter-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .shop-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">中古在庫管理</h1>
        <p className="page-subtitle">中古iPhoneの在庫状況を管理します</p>
      </div>

      {/* フィルター */}
      <div className="card mb-md">
        <div className="card-body" style={{ padding: '12px 16px' }}>
          <div className="filter-grid">
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: '#6B7280' }}>店舗</label>
              <select value={filters.shopId} onChange={(e) => setFilters({ ...filters, shopId: e.target.value })} className="form-select" style={{ padding: '6px 10px', fontSize: '0.85rem' }}>
                <option value="">全店舗</option>
                {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: '#6B7280' }}>ステータス</label>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="form-select" style={{ padding: '6px 10px', fontSize: '0.85rem' }}>
                <option value="">すべて</option>
                <option value="修理中">修理中</option>
                <option value="販売可">販売可</option>
                <option value="販売済">販売済</option>
                <option value="移動中">移動中</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: '#6B7280' }}>機種</label>
              <input type="text" value={filters.model} onChange={(e) => setFilters({ ...filters, model: e.target.value })} placeholder="機種名" className="form-input" style={{ padding: '6px 10px', fontSize: '0.85rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: '#6B7280' }}>管理番号</label>
              <input type="text" value={filters.managementNumber} onChange={(e) => setFilters({ ...filters, managementNumber: e.target.value })} placeholder="IMEI下4桁" className="form-input" style={{ padding: '6px 10px', fontSize: '0.85rem' }} maxLength={4} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: '#6B7280' }}>保管場所</label>
              <input type="text" value={filters.storageLocation} onChange={(e) => setFilters({ ...filters, storageLocation: e.target.value })} placeholder="保管場所" className="form-input" style={{ padding: '6px 10px', fontSize: '0.85rem' }} />
            </div>
            <div>
              <button onClick={() => setFilters({ shopId: '', status: '', model: '', managementNumber: '', storageLocation: '' })} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', width: '100%' }}>リセット</button>
            </div>
          </div>
        </div>
      </div>

      {/* 在庫サマリー */}
      <div className="card mb-md">
        <div className="card-body" style={{ padding: '12px 16px' }}>
          <div className="summary-grid">
            <div className="summary-card">
              <p className="summary-label">累計在庫</p>
              <p className="summary-value">{totalStock}台</p>
              {showRepairingCount && <p className="summary-sub">販売可{totalInStock} / 修理中{totalRepairing}</p>}
            </div>
            <div className="summary-card">
              <p className="summary-label">45日以上</p>
              <p className="summary-value" style={{ color: '#D97706' }}>{over45Days}台</p>
            </div>
            <div className="summary-card">
              <p className="summary-label">90日以上</p>
              <p className="summary-value" style={{ color: '#EA580C' }}>{over90Days}台</p>
            </div>
            <div className="summary-card">
              <p className="summary-label">EC未出品</p>
              <p className="summary-value" style={{ color: '#DC2626' }}>{totalNoEc}台</p>
            </div>
          </div>
          <div className="shop-grid">
            {shops.map((shop) => {
              const stats = getShopStats(shop.id)
              return (
                <div key={shop.id} className="summary-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{shop.name}</span>
                    <span style={{ marginLeft: '8px', fontWeight: '700' }}>{stats.total}台</span>
                    {showRepairingCount && <span style={{ fontSize: '0.7rem', color: '#6B7280', marginLeft: '6px' }}>（販売可{stats.inStock}/修理中{stats.repairing}）</span>}
                  </div>
                  {stats.noEc > 0 && <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>未出品{stats.noEc}</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 在庫一覧 */}
      <div className="card">
        <div className="card-header" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title" style={{ fontSize: '0.95rem' }}>在庫一覧（{inventory.length}件）</h2>
          {selectedIds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>{selectedIds.length}件選択中</span>
              <button onClick={() => setShowBulkModal(true)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                保管場所を一括変更
              </button>
              <button onClick={() => setSelectedIds([])} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                選択解除
              </button>
            </div>
          )}
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading"><div className="loading-spinner"></div></div>
          ) : inventory.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">在庫がありません</p>
              <p className="empty-state-text">フィルター条件を変更してください</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === paginatedInventory.filter(i => i.status !== '販売済').length}
                      onChange={toggleSelectAll}
                      style={{ width: '16px', height: '16px' }}
                    />
                  </th>
                  <th>店舗</th>
                  <th>入荷日</th>
                  <th>滞留</th>
                  <th>機種</th>
                  <th>容量</th>
                  <th>ランク</th>
                  <th>管理番号</th>
                  <th>保管場所</th>
                  <th className="text-right">原価</th>
                  <th className="text-right">販売価格</th>
                  <th>EC</th>
                  <th>ステータス</th>
                  <th className="text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInventory.map((item) => {
                  const days = calculateDaysInStock(item.arrival_date)
                  const warranty = item.status === '販売済' ? getWarrantyInfo(item.sale_date) : null
                  return (
                    <tr key={item.id}>
                      <td>
                        {item.status !== '販売済' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            style={{ width: '16px', height: '16px' }}
                          />
                        )}
                      </td>
                      <td>{item.shop?.name}</td>
                      <td>{item.arrival_date}</td>
                      <td><span className={`badge ${getDaysBadgeClass(days)}`}>{days}日</span></td>
                      <td className="font-medium">{getDisplayName(item.model)}</td>
                      <td>{item.storage === 1000 ? '1TB' : `${item.storage}GB`}</td>
                      <td>{item.rank}</td>
                      <td style={{ fontFamily: 'monospace' }}>{item.management_number ? String(item.management_number).padStart(4, '0') : '-'}</td>
                      <td>{item.storage_location || '-'}</td>
                      <td className="text-right">¥{item.total_cost.toLocaleString()}</td>
                      <td className="text-right">
                        {item.sales_price ? (
                          <div>
                            <div style={{ fontWeight: '600' }}>¥{Math.floor(item.sales_price * 1.1).toLocaleString()}</div>
                            <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>税抜 ¥{item.sales_price.toLocaleString()}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td><span className={`badge ${item.ec_status === 'both' ? 'badge-success' : item.ec_status ? 'badge-primary' : 'badge-gray'}`}>{getEcStatusDisplay(item.ec_status)}</span></td>
                      <td>
                        <span className={`badge ${item.status === '修理中' ? 'badge-primary' : item.status === '販売可' ? 'badge-success' : item.status === '販売済' ? 'badge-gray' : 'badge-warning'}`}>{getStatusDisplay(item.status)}</span>
                        {warranty && (
                          <div style={{ marginTop: '4px', fontSize: '0.7rem', fontWeight: 600, color: warranty.color }}>
                            {warranty.status}
                          </div>
                        )}
                      </td>
                      <td className="text-center"><button onClick={() => openDetailModal(item)} className="btn btn-sm btn-secondary">詳細</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        {/* ページネーション */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            padding: '16px',
            borderTop: '1px solid #E5E7EB'
          }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="btn btn-sm btn-secondary"
              style={{ padding: '6px 10px', minWidth: 'auto' }}
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-sm btn-secondary"
              style={{ padding: '6px 10px', minWidth: 'auto' }}
            >
              ‹
            </button>
            <span style={{ fontSize: '0.85rem', color: '#6B7280', margin: '0 8px' }}>
              {currentPage} / {totalPages} ページ
              <span style={{ marginLeft: '8px', fontSize: '0.75rem' }}>
                （{startIndex + 1}-{Math.min(endIndex, inventory.length)} / {inventory.length}件）
              </span>
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-sm btn-secondary"
              style={{ padding: '6px 10px', minWidth: 'auto' }}
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="btn btn-sm btn-secondary"
              style={{ padding: '6px 10px', minWidth: 'auto' }}
            >
              »
            </button>
          </div>
        )}
      </div>

      {/* 詳細モーダル */}
      {showDetailModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">在庫詳細</h2>
              <button onClick={() => setShowDetailModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#F8FAFC', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>商品情報</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.8rem' }}>
                  <div><span style={{ color: '#6B7280' }}>機種:</span> <span style={{ fontWeight: '500' }}>{getDisplayName(selectedItem.model)}</span></div>
                  <div><span style={{ color: '#6B7280' }}>容量:</span> <span style={{ fontWeight: '500' }}>{selectedItem.storage === 1000 ? '1TB' : `${selectedItem.storage}GB`}</span></div>
                  <div><span style={{ color: '#6B7280' }}>ランク:</span> <span style={{ fontWeight: '500' }}>{selectedItem.rank}</span></div>
                  <div><span style={{ color: '#6B7280' }}>IMEI:</span> <span style={{ fontFamily: 'monospace' }}>{selectedItem.imei || '-'}</span></div>
                  <div><span style={{ color: '#6B7280' }}>管理番号:</span> <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>{selectedItem.management_number ? String(selectedItem.management_number).padStart(4, '0') : '-'}</span></div>
                  <div><span style={{ color: '#6B7280' }}>滞留:</span> <span>{calculateDaysInStock(selectedItem.arrival_date)}日</span></div>
                </div>
              </div>
              <div style={{ background: '#F8FAFC', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>状態・価格</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.8rem' }}>
                  <div><span style={{ color: '#6B7280' }}>バッテリー:</span> <span style={{ fontWeight: '500' }}>{selectedItem.is_service_state ? 'サービス' : selectedItem.battery_percent ? `${selectedItem.battery_percent}%` : '-'}</span></div>
                  <div><span style={{ color: '#6B7280' }}>NW制限:</span> <span style={{ fontWeight: '500' }}>{getNwStatusDisplay(selectedItem.nw_status)}</span></div>
                  <div><span style={{ color: '#6B7280' }}>カメラ染み:</span> <span style={{ fontWeight: '500' }}>{getCameraStainDisplay(selectedItem.camera_stain_level)}</span></div>
                  <div><span style={{ color: '#6B7280' }}>買取価格:</span> <span style={{ fontWeight: '500' }}>¥{selectedItem.buyback_price.toLocaleString()}</span></div>
                  <div><span style={{ color: '#6B7280' }}>修理費:</span> <span style={{ fontWeight: '500' }}>¥{selectedItem.repair_cost.toLocaleString()}</span></div>
                  <div><span style={{ color: '#6B7280' }}>原価合計:</span> <span style={{ fontWeight: '700' }}>¥{selectedItem.total_cost.toLocaleString()}</span><span style={{ fontSize: '0.7rem', color: '#6B7280', marginLeft: '4px' }}>(税込¥{Math.floor(selectedItem.total_cost * 1.1).toLocaleString()})</span></div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>販売価格（税抜）</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editData.sales_price || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      setEditData({ ...editData, sales_price: parseInt(value) || 0, sales_price_tax_included: value })
                    }}
                    className="form-input"
                    placeholder="税抜価格を入力"
                  />
                  {editData.sales_price > 0 && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: '#F0FDF4', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#6B7280' }}>税込価格:</span>
                        <span style={{ fontWeight: '600' }}>¥{Math.floor(editData.sales_price * 1.1).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#6B7280' }}>原価:</span>
                        <span style={{ fontWeight: '600' }}>¥{selectedItem.total_cost.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #D1FAE5', paddingTop: '4px' }}>
                        <span style={{ color: '#059669', fontWeight: '600' }}>粗利:</span>
                        <span style={{ fontWeight: '700', color: editData.sales_price - selectedItem.total_cost >= 0 ? '#059669' : '#DC2626' }}>
                          ¥{(editData.sales_price - selectedItem.total_cost).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div><label className="form-label" style={{ fontSize: '0.8rem' }}>EC出品</label><select value={editData.ec_status} onChange={(e) => setEditData({ ...editData, ec_status: e.target.value })} className="form-select"><option value="">未出品</option><option value="shopify">Shopify</option><option value="mercari">メルカリ</option><option value="both">両方</option></select></div>
                <div><label className="form-label" style={{ fontSize: '0.8rem' }}>ステータス</label><select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })} className="form-select"><option value="修理中">修理中</option><option value="販売可">販売可</option><option value="販売済">販売済</option><option value="移動中">移動中</option></select></div>
                <div><label className="form-label" style={{ fontSize: '0.8rem' }}>保管場所</label><input type="text" value={editData.storage_location} onChange={(e) => setEditData({ ...editData, storage_location: e.target.value })} className="form-input" placeholder="例: 棚A-1, バックヤード" /></div>
                <div><label className="form-label" style={{ fontSize: '0.8rem' }}>メモ</label><textarea value={editData.memo} onChange={(e) => setEditData({ ...editData, memo: e.target.value })} rows={2} className="form-textarea" /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDetailModal(false)} className="btn btn-secondary">キャンセル</button>
              <button onClick={saveDetail} className="btn btn-primary">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 修理完了モーダル */}
      {showRepairModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">修理完了確認</h2>
              <button onClick={() => { setShowRepairModal(false); setSelectedParts([]) }} className="modal-close">✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#E8F0FE', borderRadius: '6px', padding: '10px', marginBottom: '12px', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: '500' }}>{getDisplayName(selectedItem.model)}</span>
                <span style={{ marginLeft: '6px' }}>{selectedItem.storage}GB</span>
                <span style={{ color: '#6B7280', marginLeft: '6px' }}>（{selectedItem.management_number ? String(selectedItem.management_number).padStart(4, '0') : '-'}）</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '10px' }}>使用パーツを選択:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {getRepairTypesList(selectedItem.model).map((repair) => {
                  const qty = getPartsQty(repair.partsType)
                  const isSelected = selectedParts.includes(repair.key)
                  const willBeNegative = isSelected && qty <= 0
                  return (
                    <label key={repair.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${isSelected ? '#004AAD' : '#E5E7EB'}`, background: isSelected ? '#E8F0FE' : 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => togglePart(repair.key)} />
                        <span style={{ fontWeight: '500' }}>{repair.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: qty <= 0 ? '#DC2626' : '#6B7280' }}>在庫:{qty}</span>
                        {willBeNegative && <span>⚠️</span>}
                      </div>
                    </label>
                  )
                })}
              </div>
              {/* 在庫0警告 */}
              {selectedParts.some(key => {
                const repairTypesList = getRepairTypesList(selectedItem.model)
                const repair = repairTypesList.find(r => r.key === key)
                return repair && getPartsQty(repair.partsType) <= 0
              }) && (
                <div style={{ background: '#FEF3C7', border: '1px solid #D97706', borderRadius: '6px', padding: '10px', marginBottom: '12px' }}>
                  <p style={{ fontWeight: '600', color: '#92400E', fontSize: '0.85rem', marginBottom: '4px' }}>⚠️ 以下のパーツは在庫が0のためマイナスになります</p>
                  <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: '#92400E', margin: 0 }}>
                    {selectedParts.map(key => {
                      const repairTypesList = getRepairTypesList(selectedItem.model)
                      const repair = repairTypesList.find(r => r.key === key)
                      if (!repair) return null
                      const qty = getPartsQty(repair.partsType)
                      if (qty > 0) return null
                      return <li key={key}>{repair.label}（現在:{qty} → 処理後:{qty - 1}）</li>
                    })}
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => { setShowRepairModal(false); setSelectedParts([]) }} className="btn btn-secondary">キャンセル</button>
              <button onClick={completeRepair} className="btn btn-success">修理完了</button>
            </div>
          </div>
        </div>
      )}

      {/* 一括保管場所変更モーダル */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">保管場所を一括変更</h2>
              <button onClick={() => setShowBulkModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                {selectedIds.length}件の在庫の保管場所を変更します
              </p>
              <div className="form-group">
                <label className="form-label">新しい保管場所</label>
                <input
                  type="text"
                  value={bulkLocation}
                  onChange={(e) => setBulkLocation(e.target.value)}
                  className="form-input"
                  placeholder="例: 棚A-1, バックヤード, 福井店棚B"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowBulkModal(false)} className="btn btn-secondary">キャンセル</button>
              <button onClick={bulkUpdateLocation} className="btn btn-primary">一括変更</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}