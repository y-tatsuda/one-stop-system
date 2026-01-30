'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Shop = {
  id: number
  name: string
}

type Supplier = {
  id: number
  code: string
  name: string
}

type IphoneModel = {
  model: string
  display_name: string
}

type ShortageItem = {
  id: number
  shop_id: number
  shop_name: string
  supplier_id: number | null
  supplier_name: string
  model: string
  parts_type: string
  required_qty: number
  actual_qty: number
  shortage: number
  checked: boolean
}

// パーツ種別の表示名
const partsTypeLabels: { [key: string]: string } = {
  'TH-F': '標準パネル(白)',
  'TH-L': '標準パネル(黒)',
  'HG-F': '有機EL(白)',
  'HG-L': '有機EL(黒)',
  'バッテリー': 'バッテリー',
  'HGバッテリー': 'HGバッテリー',
  'コネクタ': 'コネクタ',
  'リアカメラ': 'リアカメラ',
  'インカメラ': 'インカメラ',
  'カメラ窓': 'カメラ窓',
}

export default function OrderPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [shortageItems, setShortageItems] = useState<ShortageItem[]>([])
  const [iphoneModels, setIphoneModels] = useState<IphoneModel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [showOrderModal, setShowOrderModal] = useState(false)

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
        .select('model, display_name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('sort_order')

      // 仕入先マスタ取得
      const { data: suppliersData } = await supabase
        .from('m_suppliers')
        .select('id, code, name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('sort_order')

      setShops(shopsData || [])
      setIphoneModels(modelsData || [])
      setSuppliers(suppliersData || [])

      // デフォルトで最初の仕入先を選択
      if (suppliersData && suppliersData.length > 0) {
        setSelectedSupplier(suppliersData[0].id.toString())
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  // 不足パーツ取得
  useEffect(() => {
    async function fetchShortage() {
      let query = supabase
        .from('t_parts_inventory')
        .select('id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty')
        .eq('tenant_id', 1)

      // 仕入先でフィルタ
      if (selectedSupplier) {
        query = query.eq('supplier_id', parseInt(selectedSupplier))
      }

      const { data } = await query

      if (data && shops.length > 0) {
        const shortages: ShortageItem[] = data
          .filter(item => item.actual_qty < item.required_qty)
          .filter(item => !selectedShop || item.shop_id === parseInt(selectedShop))
          .map(item => {
            const shop = shops.find(s => s.id === item.shop_id)
            const supplier = suppliers.find(s => s.id === item.supplier_id)
            return {
              id: item.id,
              shop_id: item.shop_id,
              shop_name: shop?.name || '',
              supplier_id: item.supplier_id,
              supplier_name: supplier?.name || '',
              model: item.model,
              parts_type: item.parts_type,
              required_qty: item.required_qty,
              actual_qty: item.actual_qty,
              shortage: item.required_qty - item.actual_qty,
              checked: true,
            }
          })
          .sort((a, b) => {
            if (a.shop_name !== b.shop_name) {
              return a.shop_name.localeCompare(b.shop_name)
            }
            if (a.model !== b.model) {
              return a.model.localeCompare(b.model)
            }
            return a.parts_type.localeCompare(b.parts_type)
          })

        setShortageItems(shortages)
      } else {
        setShortageItems([])
      }
    }

    if (shops.length > 0 && suppliers.length > 0) {
      fetchShortage()
    }
  }, [shops, suppliers, selectedShop, selectedSupplier, iphoneModels])

  // 機種名を表示名に変換
  const getDisplayName = (model: string) => {
    const found = iphoneModels.find(m => m.model === model)
    return found ? found.display_name : model
  }

  // チェック状態更新
  const toggleCheck = (id: number) => {
    setShortageItems(shortageItems.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  // 全選択/全解除
  const toggleAll = (checked: boolean) => {
    setShortageItems(shortageItems.map(item => ({ ...item, checked })))
  }

  // チェックされたアイテム取得
  const getCheckedItems = () => {
    return shortageItems.filter(item => item.checked)
  }

  // 発注書テキスト生成
  const generateOrderText = () => {
    const checkedItems = getCheckedItems()

    // 選択された仕入先名を取得
    const supplierName = suppliers.find(s => s.id === parseInt(selectedSupplier))?.name || ''

    // 店舗別にグループ化
    const byShop = checkedItems.reduce((acc, item) => {
      if (!acc[item.shop_name]) {
        acc[item.shop_name] = []
      }
      acc[item.shop_name].push(item)
      return acc
    }, {} as Record<string, ShortageItem[]>)

    let text = `【発注依頼】${new Date().toLocaleDateString('ja-JP')}\n`
    text += `仕入先: ${supplierName}\n\n`

    for (const [shopName, items] of Object.entries(byShop)) {
      text += `■ ${shopName}\n`
      for (const item of items) {
        text += `・${getDisplayName(item.model)} ${partsTypeLabels[item.parts_type] || item.parts_type} ×${item.shortage}\n`
      }
      text += '\n'
    }

    return text.trim()
  }

  // クリップボードにコピー
  const copyToClipboard = async () => {
    const text = generateOrderText()
    try {
      await navigator.clipboard.writeText(text)
      alert('クリップボードにコピーしました')
    } catch {
      alert('コピーに失敗しました')
    }
  }

  // チェック数
  const checkedCount = getCheckedItems().length

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
        <h1 className="page-title">発注</h1>
      </div>

      {/* フィルター */}
      <div className="card mb-lg">
        <div className="card-body">
          <div className="flex flex-wrap gap-md items-end">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">店舗</label>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="form-select"
              >
                <option value="">全店舗</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">仕入先</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="form-select"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-sm">
              <button
                onClick={() => toggleAll(true)}
                className="btn btn-secondary"
              >
                全選択
              </button>
              <button
                onClick={() => toggleAll(false)}
                className="btn btn-secondary"
              >
                全解除
              </button>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button
                onClick={() => setShowOrderModal(true)}
                disabled={checkedCount === 0}
                className="btn btn-primary"
              >
                発注書出力（{checkedCount}件）
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 不足パーツ一覧 */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {shortageItems.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">不足しているパーツはありません</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: '48px' }}>
                      <input
                        type="checkbox"
                        checked={shortageItems.every(item => item.checked)}
                        onChange={(e) => toggleAll(e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                    </th>
                    <th>店舗</th>
                    <th>機種</th>
                    <th>パーツ</th>
                    <th className="text-center">適正</th>
                    <th className="text-center">実在庫</th>
                    <th className="text-center">不足</th>
                  </tr>
                </thead>
                <tbody>
                  {shortageItems.map((item) => (
                    <tr key={item.id} style={item.checked ? { backgroundColor: 'var(--color-primary-light)' } : {}}>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleCheck(item.id)}
                          style={{ width: '18px', height: '18px' }}
                        />
                      </td>
                      <td>{item.shop_name}</td>
                      <td style={{ fontWeight: 500 }}>{getDisplayName(item.model)}</td>
                      <td>{partsTypeLabels[item.parts_type] || item.parts_type}</td>
                      <td className="text-center">{item.required_qty}</td>
                      <td className="text-center" style={{ color: 'var(--color-danger)', fontWeight: 500 }}>{item.actual_qty}</td>
                      <td className="text-center">
                        <span className="badge badge-danger">
                          {item.shortage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 発注確認モーダル */}
      {showOrderModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">発注内容確認</h2>
            </div>
            <div className="modal-body">
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                <pre style={{ 
                  background: 'var(--color-bg)', 
                  padding: '16px', 
                  borderRadius: 'var(--radius)', 
                  fontSize: '0.9rem',
                  whiteSpace: 'pre-wrap'
                }}>
                  {generateOrderText()}
                </pre>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowOrderModal(false)}
                className="btn btn-secondary"
              >
                閉じる
              </button>
              <button
                onClick={copyToClipboard}
                className="btn btn-primary"
              >
                コピー
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}