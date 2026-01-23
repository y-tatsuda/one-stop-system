'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Shop = {
  id: number
  name: string
}

type PartsInventory = {
  id: number
  shop_id: number
  model: string
  parts_type: string
  required_qty: number
  actual_qty: number
}

type IphoneModel = {
  model: string
  display_name: string
  sort_order: number
}

// パーツ種類（新形式）
const partsTypes = [
  'LCDパネル',
  '有機ELパネル',
  'バッテリー',
  'コネクタ',
  'リアカメラ',
  'インカメラ',
  'カメラ窓',
]

export default function PartsInventoryPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [inventory, setInventory] = useState<PartsInventory[]>([])
  const [iphoneModels, setIphoneModels] = useState<IphoneModel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [selectedPartsType, setSelectedPartsType] = useState<string>('')
  const [showShortageOnly, setShowShortageOnly] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState<number>(0)

  // データ取得
  useEffect(() => {
    async function fetchData() {
      const { data: shopsData } = await supabase
        .from('m_shops')
        .select('id, name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('id')

      // 機種マスタ取得
      const { data: modelsData } = await supabase
        .from('m_iphone_models')
        .select('model, display_name, sort_order')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('sort_order')

      setShops(shopsData || [])
      setIphoneModels(modelsData || [])
      
      if (shopsData && shopsData.length > 0) {
        setSelectedShop(shopsData[0].id.toString())
      }
      
      setLoading(false)
    }

    fetchData()
  }, [])

  // 店舗変更時に在庫取得
  useEffect(() => {
    async function fetchInventory() {
      if (!selectedShop) return

      const { data } = await supabase
        .from('t_parts_inventory')
        .select('*')
        .eq('tenant_id', 1)
        .eq('shop_id', parseInt(selectedShop))
        .order('model')
        .order('parts_type')

      setInventory(data || [])
    }

    fetchInventory()
  }, [selectedShop])

  // 機種名を表示名に変換
  const getDisplayName = (model: string) => {
    const found = iphoneModels.find(m => m.model === model)
    return found ? found.display_name : model
  }

  // フィルタリング
  const filteredInventory = inventory.filter(item => {
    if (selectedPartsType && item.parts_type !== selectedPartsType) return false
    if (showShortageOnly && item.actual_qty >= item.required_qty) return false
    return true
  })

  // 機種でグループ化
  const groupedByModel = filteredInventory.reduce((acc, item) => {
    if (!acc[item.model]) {
      acc[item.model] = []
    }
    acc[item.model].push(item)
    return acc
  }, {} as Record<string, PartsInventory[]>)

  // sort_orderでソートされたモデル順
  const sortedModels = Object.keys(groupedByModel).sort((a, b) => {
    const modelA = iphoneModels.find(m => m.model === a)
    const modelB = iphoneModels.find(m => m.model === b)
    return (modelA?.sort_order || 999) - (modelB?.sort_order || 999)
  })

  // 実在庫更新
  const updateActualQty = async (id: number, newQty: number) => {
    const { error } = await supabase
      .from('t_parts_inventory')
      .update({ actual_qty: newQty, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      alert('更新に失敗しました: ' + error.message)
      return
    }

    setInventory(inventory.map(item => 
      item.id === id ? { ...item, actual_qty: newQty } : item
    ))
    setEditingId(null)
  }

  // 適正在庫更新
  const updateRequiredQty = async (id: number, newQty: number) => {
    const { error } = await supabase
      .from('t_parts_inventory')
      .update({ required_qty: newQty, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      alert('更新に失敗しました: ' + error.message)
      return
    }

    setInventory(inventory.map(item => 
      item.id === id ? { ...item, required_qty: newQty } : item
    ))
  }

  // 不足数計算
  const getShortage = (item: PartsInventory) => {
    return Math.max(0, item.required_qty - item.actual_qty)
  }

  // 全体の不足件数
  const totalShortageCount = inventory.filter(item => item.actual_qty < item.required_qty).length

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">パーツ在庫管理</h1>
      </div>

      {/* フィルター */}
      <div className="card mb-lg">
        <div className="card-body">
          <div className="form-grid form-grid-4">
            <div className="form-group">
              <label className="form-label">店舗</label>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="form-select"
              >
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">パーツ種類</label>
              <select
                value={selectedPartsType}
                onChange={(e) => setSelectedPartsType(e.target.value)}
                className="form-select"
              >
                <option value="">すべて</option>
                {partsTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label className="form-check">
                <input
                  type="checkbox"
                  checked={showShortageOnly}
                  onChange={(e) => setShowShortageOnly(e.target.checked)}
                />
                <span>不足のみ表示</span>
              </label>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              {totalShortageCount > 0 && (
                <span className="badge badge-danger" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                  不足: {totalShortageCount}件
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 在庫一覧 */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {Object.keys(groupedByModel).length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">在庫データがありません</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>機種</th>
                    <th>パーツ</th>
                    <th className="text-center">適正在庫</th>
                    <th className="text-center">実在庫</th>
                    <th className="text-center">不足</th>
                    <th className="text-center">状態</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedModels.map((model) => {
                    const items = groupedByModel[model]
                    return items.map((item, idx) => {
                      const shortage = getShortage(item)
                      const isShortage = item.actual_qty < item.required_qty
                      const isEditing = editingId === item.id

                      return (
                        <tr key={item.id} style={isShortage ? { backgroundColor: 'var(--color-danger-light)' } : {}}>
                          {idx === 0 ? (
                            <td rowSpan={items.length} style={{ fontWeight: 600, verticalAlign: 'middle' }}>
                              {getDisplayName(model)}
                            </td>
                          ) : null}
                          <td>{item.parts_type}</td>
                          <td className="text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.required_qty}
                              onChange={(e) => updateRequiredQty(item.id, parseInt(e.target.value) || 0)}
                              className="form-input"
                              style={{ width: '70px', textAlign: 'center', padding: '4px 8px' }}
                            />
                          </td>
                          <td className="text-center">
                            {isEditing ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <input
                                  type="number"
                                  min="0"
                                  value={editValue}
                                  onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                                  className="form-input"
                                  style={{ width: '70px', textAlign: 'center', padding: '4px 8px' }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => updateActualQty(item.id, editValue)}
                                  className="btn btn-sm btn-success"
                                  style={{ padding: '4px 8px', minWidth: 'auto' }}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="btn btn-sm btn-secondary"
                                  style={{ padding: '4px 8px', minWidth: 'auto' }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingId(item.id)
                                  setEditValue(item.actual_qty)
                                }}
                                style={{
                                  fontWeight: 600,
                                  padding: '4px 12px',
                                  borderRadius: 'var(--radius)',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  color: isShortage ? 'var(--color-danger)' : 'var(--color-text)',
                                }}
                              >
                                {item.actual_qty}
                              </button>
                            )}
                          </td>
                          <td className="text-center">
                            {shortage > 0 ? (
                              <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>-{shortage}</span>
                            ) : (
                              <span style={{ color: 'var(--color-text-light)' }}>-</span>
                            )}
                          </td>
                          <td className="text-center">
                            {isShortage ? (
                              <span className="badge badge-danger">不足</span>
                            ) : (
                              <span className="badge badge-success">OK</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}