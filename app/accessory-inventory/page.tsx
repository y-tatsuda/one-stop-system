'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Shop = {
  id: number
  name: string
}

type Category = {
  id: number
  name: string
}

type AccessoryInventory = {
  id: number
  shop_id: number
  accessory_id: number
  required_qty: number
  actual_qty: number
  accessory: {
    id: number
    name: string
    variation: string | null
    category_id: number
  } | null
}

type GroupedInventory = {
  categoryId: number
  categoryName: string
  items: AccessoryInventory[]
}

export default function AccessoryInventoryPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [inventory, setInventory] = useState<AccessoryInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showShortageOnly, setShowShortageOnly] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState<number>(0)

  // 初期データ取得
  useEffect(() => {
    async function fetchInitialData() {
      // 店舗データ取得
      const { data: shopsData } = await supabase
        .from('m_shops')
        .select('id, name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('id')

      // カテゴリデータ取得
      const { data: categoriesData } = await supabase
        .from('m_accessory_categories')
        .select('id, name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('sort_order')

      setShops(shopsData || [])
      setCategories(categoriesData || [])

      if (shopsData && shopsData.length > 0) {
        setSelectedShop(shopsData[0].id.toString())
      }

      setLoading(false)
    }

    fetchInitialData()
  }, [])

  // 店舗変更時に在庫取得
  useEffect(() => {
    async function fetchInventory() {
      if (!selectedShop) return

      const { data, error } = await supabase
        .from('t_accessory_inventory')
        .select(`
          id,
          shop_id,
          accessory_id,
          required_qty,
          actual_qty,
          accessory:m_accessories (
            id,
            name,
            variation,
            category_id
          )
        `)
        .eq('tenant_id', 1)
        .eq('shop_id', parseInt(selectedShop))

      if (error) {
        console.error('在庫取得エラー:', error)
        setInventory([])
        return
      }

      // 型変換
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typedData: AccessoryInventory[] = (data || []).map((item: any) => ({
        id: item.id,
        shop_id: item.shop_id,
        accessory_id: item.accessory_id,
        required_qty: item.required_qty,
        actual_qty: item.actual_qty,
        accessory: item.accessory ? {
          id: item.accessory.id,
          name: item.accessory.name,
          variation: item.accessory.variation,
          category_id: item.accessory.category_id,
        } : null,
      }))

      setInventory(typedData)
    }

    fetchInventory()
  }, [selectedShop])

  // フィルタリング
  const filteredInventory = inventory.filter(item => {
    if (!item.accessory) return false
    if (selectedCategory && item.accessory.category_id !== parseInt(selectedCategory)) return false
    if (showShortageOnly && item.actual_qty >= item.required_qty) return false
    return true
  })

  // カテゴリでグループ化
  const groupedInventory: GroupedInventory[] = categories
    .map(cat => ({
      categoryId: cat.id,
      categoryName: cat.name,
      items: filteredInventory.filter(item => item.accessory?.category_id === cat.id),
    }))
    .filter(group => group.items.length > 0)

  // 不足数カウント
  const shortageCount = inventory.filter(item => item.actual_qty < item.required_qty).length

  // 実在庫更新
  const updateActualQty = async (id: number, newQty: number) => {
    const { error } = await supabase
      .from('t_accessory_inventory')
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

  // 編集開始
  const startEdit = (id: number, currentQty: number) => {
    setEditingId(id)
    setEditValue(currentQty)
  }

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingId(null)
    setEditValue(0)
  }

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
        <h1 className="page-title">アクセサリ在庫管理</h1>
      </div>

      {/* フィルター */}
      <div className="card mb-lg">
        <div className="card-body">
          <div className="form-grid form-grid-4">
            {/* 店舗選択 */}
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

            {/* カテゴリ選択 */}
            <div className="form-group">
              <label className="form-label">カテゴリ</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select"
              >
                <option value="">すべて</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* 不足のみ表示 */}
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

            {/* 不足件数 */}
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              {shortageCount > 0 && (
                <span className="badge badge-danger" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                  不足: {shortageCount}件
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 在庫一覧 */}
      {filteredInventory.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">在庫データがありません</p>
          </div>
        </div>
      ) : (
        groupedInventory.map((group) => (
          <div key={group.categoryId} className="card mb-lg">
            {/* カテゴリヘッダー */}
            <div className="card-header">
              <h2 className="card-title">{group.categoryName}</h2>
            </div>

            {/* テーブル */}
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>商品名</th>
                      <th>バリエーション</th>
                      <th className="text-center">適正在庫</th>
                      <th className="text-center">実在庫</th>
                      <th className="text-center">不足数</th>
                      <th className="text-center">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => {
                      const shortage = item.required_qty - item.actual_qty
                      const isShortage = shortage > 0

                      return (
                        <tr key={item.id} style={isShortage ? { backgroundColor: 'var(--color-danger-light)' } : {}}>
                          <td>{item.accessory?.name || '-'}</td>
                          <td className="text-secondary">
                            {item.accessory?.variation || '-'}
                          </td>
                          <td className="text-center">{item.required_qty}</td>
                          <td className="text-center">
                            {editingId === item.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
                                  style={{ padding: '4px 8px' }}
                                >
                                  保存
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="btn btn-sm btn-secondary"
                                  style={{ padding: '4px 8px' }}
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEdit(item.id, item.actual_qty)}
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: 'var(--radius)',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                }}
                                title="クリックして編集"
                              >
                                {item.actual_qty}
                              </button>
                            )}
                          </td>
                          <td className="text-center">
                            {isShortage ? (
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
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}