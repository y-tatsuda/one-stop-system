'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_TENANT_ID } from '../lib/constants'
import { Shop } from '../lib/types'

type PartsItem = {
  id: number
  model: string
  parts_type: string
  actual_qty: number
  input_qty: number | null
}

type AccessoryItem = {
  id: number
  accessory_name: string
  accessory_variation: string | null
  category_name: string
  actual_qty: number
  input_qty: number | null
}

type InventoryCheck = {
  id: number
  check_date: string
  check_type: string
  status: string
}

export default function InventoryCheckPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [checkType, setCheckType] = useState<'parts' | 'accessory'>('parts')
  const [partsItems, setPartsItems] = useState<PartsItem[]>([])
  const [accessoryItems, setAccessoryItems] = useState<AccessoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [existingCheck, setExistingCheck] = useState<InventoryCheck | null>(null)
  const [showDiffOnly, setShowDiffOnly] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  // 初期データ取得
  useEffect(() => {
    async function fetchData() {
      const { data: shopsData } = await supabase
        .from('m_shops')
        .select('id, name')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('is_active', true)
        .order('id')

      setShops(shopsData || [])
      
      if (shopsData && shopsData.length > 0) {
        setSelectedShop(shopsData[0].id.toString())
      }
      
      setLoading(false)
    }

    fetchData()
  }, [])

  // 店舗・種別変更時にデータ取得
  useEffect(() => {
    async function fetchInventory() {
      if (!selectedShop) return

      // 既存の棚卸しチェック
      const { data: checkData } = await supabase
        .from('t_inventory_checks')
        .select('id, check_date, check_type, status')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('shop_id', parseInt(selectedShop))
        .eq('check_date', today)
        .eq('check_type', checkType)
        .single()

      setExistingCheck(checkData || null)

      if (checkType === 'parts') {
        const { data } = await supabase
          .from('t_parts_inventory')
          .select('id, model, parts_type, actual_qty')
          .eq('tenant_id', DEFAULT_TENANT_ID)
          .eq('shop_id', parseInt(selectedShop))
          .order('model')
          .order('parts_type')

        setPartsItems((data || []).map(item => ({
          ...item,
          input_qty: null,
        })))
      } else {
        const { data } = await supabase
          .from('t_accessory_inventory')
          .select(`
            id,
            actual_qty,
            m_accessories (
              name,
              variation,
              m_accessory_categories (
                name
              )
            )
          `)
          .eq('tenant_id', DEFAULT_TENANT_ID)
          .eq('shop_id', parseInt(selectedShop))

        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formatted: AccessoryItem[] = data.map((item: any) => {
            const accessory = item.m_accessories

            return {
              id: item.id,
              accessory_name: accessory?.name || '',
              accessory_variation: accessory?.variation || null,
              category_name: accessory?.m_accessory_categories?.name || '',
              actual_qty: item.actual_qty,
              input_qty: null,
            }
          })

          formatted.sort((a, b) => {
            if (a.category_name !== b.category_name) {
              return a.category_name.localeCompare(b.category_name)
            }
            return a.accessory_name.localeCompare(b.accessory_name)
          })

          setAccessoryItems(formatted)
        } else {
          setAccessoryItems([])
        }
      }
    }

    fetchInventory()
  }, [selectedShop, checkType, today])

  // パーツ入力値更新
  const updatePartsInput = (id: number, value: number | null) => {
    setPartsItems(partsItems.map(item =>
      item.id === id ? { ...item, input_qty: value } : item
    ))
  }

  // アクセサリ入力値更新
  const updateAccessoryInput = (id: number, value: number | null) => {
    setAccessoryItems(accessoryItems.map(item =>
      item.id === id ? { ...item, input_qty: value } : item
    ))
  }

  // 差異計算
  const getPartsDiff = () => {
    return partsItems.filter(item => 
      item.input_qty !== null && item.input_qty !== item.actual_qty
    )
  }

  const getAccessoryDiff = () => {
    return accessoryItems.filter(item => 
      item.input_qty !== null && item.input_qty !== item.actual_qty
    )
  }

  // 棚卸し完了
  const completeCheck = async () => {
    const diff = checkType === 'parts' ? getPartsDiff() : getAccessoryDiff()
    
    if (diff.length > 0) {
      setShowConfirmModal(true)
      return
    }

    await saveCheck(false)
  }

  // 差異反映して保存
  const saveCheck = async (applyDiff: boolean) => {
    try {
      // 棚卸し記録作成/更新
      let checkId = existingCheck?.id

      if (!checkId) {
        const { data, error } = await supabase
          .from('t_inventory_checks')
          .insert({
            tenant_id: DEFAULT_TENANT_ID,
            shop_id: parseInt(selectedShop),
            check_date: today,
            check_type: checkType,
            status: '完了',
            completed_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) throw error
        checkId = data.id
      } else {
        await supabase
          .from('t_inventory_checks')
          .update({
            status: '完了',
            completed_at: new Date().toISOString(),
          })
          .eq('id', checkId)
      }

      // 差異を反映
      if (applyDiff) {
        if (checkType === 'parts') {
          for (const item of getPartsDiff()) {
            await supabase
              .from('t_parts_inventory')
              .update({ actual_qty: item.input_qty })
              .eq('id', item.id)
          }
        } else {
          for (const item of getAccessoryDiff()) {
            await supabase
              .from('t_accessory_inventory')
              .update({ actual_qty: item.input_qty })
              .eq('id', item.id)
          }
        }
      }

      alert('棚卸しを完了しました')
      setShowConfirmModal(false)
      
      // リロード
      window.location.reload()
    } catch (error) {
      alert('エラーが発生しました')
      console.error(error)
    }
  }

  // フィルタリング
  const filteredPartsItems = showDiffOnly 
    ? partsItems.filter(item => item.input_qty !== null && item.input_qty !== item.actual_qty)
    : partsItems

  const filteredAccessoryItems = showDiffOnly
    ? accessoryItems.filter(item => item.input_qty !== null && item.input_qty !== item.actual_qty)
    : accessoryItems

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
        <h1 className="page-title">棚卸し</h1>
        <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{today}</div>
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
              <label className="form-label">種別</label>
              <select
                value={checkType}
                onChange={(e) => setCheckType(e.target.value as 'parts' | 'accessory')}
                className="form-select"
              >
                <option value="parts">パーツ</option>
                <option value="accessory">アクセサリ</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label className="form-check">
                <input
                  type="checkbox"
                  checked={showDiffOnly}
                  onChange={(e) => setShowDiffOnly(e.target.checked)}
                />
                <span>差異のみ表示</span>
              </label>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              {existingCheck?.status === '完了' && (
                <span className="badge badge-success" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                  完了済み
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* パーツ棚卸し */}
      {checkType === 'parts' && (
        <div className="card mb-lg">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>機種</th>
                    <th>パーツ</th>
                    <th className="text-center">システム在庫</th>
                    <th className="text-center">実数</th>
                    <th className="text-center">差異</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartsItems.map((item) => {
                    const diff = item.input_qty !== null ? item.input_qty - item.actual_qty : null
                    const hasDiff = diff !== null && diff !== 0

                    return (
                      <tr key={item.id} style={hasDiff ? { backgroundColor: 'var(--color-warning-light)' } : {}}>
                        <td style={{ fontWeight: 500 }}>{item.model}</td>
                        <td>{item.parts_type}</td>
                        <td className="text-center" style={{ fontWeight: 500 }}>{item.actual_qty}</td>
                        <td className="text-center">
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={item.input_qty ?? ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '')
                              updatePartsInput(
                                item.id,
                                value === '' ? null : parseInt(value)
                              )
                            }}
                            placeholder="-"
                            className="form-input"
                            style={{ width: '80px', textAlign: 'center', padding: '4px 8px' }}
                          />
                        </td>
                        <td className="text-center">
                          {diff !== null && diff !== 0 ? (
                            <span style={{ color: diff > 0 ? 'var(--color-primary)' : 'var(--color-danger)', fontWeight: 600 }}>
                              {diff > 0 ? '+' : ''}{diff}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-text-light)' }}>-</span>
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
      )}

      {/* アクセサリ棚卸し */}
      {checkType === 'accessory' && (
        <div className="card mb-lg">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>カテゴリ</th>
                    <th>商品名</th>
                    <th className="text-center">システム在庫</th>
                    <th className="text-center">実数</th>
                    <th className="text-center">差異</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccessoryItems.map((item) => {
                    const diff = item.input_qty !== null ? item.input_qty - item.actual_qty : null
                    const hasDiff = diff !== null && diff !== 0
                    const displayName = item.accessory_variation
                      ? item.accessory_name + ' ' + item.accessory_variation
                      : item.accessory_name

                    return (
                      <tr key={item.id} style={hasDiff ? { backgroundColor: 'var(--color-warning-light)' } : {}}>
                        <td>{item.category_name}</td>
                        <td style={{ fontWeight: 500 }}>{displayName}</td>
                        <td className="text-center" style={{ fontWeight: 500 }}>{item.actual_qty}</td>
                        <td className="text-center">
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={item.input_qty ?? ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '')
                              updateAccessoryInput(
                                item.id,
                                value === '' ? null : parseInt(value)
                              )
                            }}
                            placeholder="-"
                            className="form-input"
                            style={{ width: '80px', textAlign: 'center', padding: '4px 8px' }}
                          />
                        </td>
                        <td className="text-center">
                          {diff !== null && diff !== 0 ? (
                            <span style={{ color: diff > 0 ? 'var(--color-primary)' : 'var(--color-danger)', fontWeight: 600 }}>
                              {diff > 0 ? '+' : ''}{diff}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-text-light)' }}>-</span>
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
      )}

      {/* 完了ボタン */}
      <div className="flex justify-end">
        <button
          onClick={completeCheck}
          disabled={existingCheck?.status === '完了'}
          className="btn btn-success btn-lg"
        >
          棚卸し完了
        </button>
      </div>

      {/* 差異確認モーダル */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">差異レポート</h2>
            </div>
            <div className="modal-body">
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {checkType === 'parts' ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {getPartsDiff().map(item => (
                      <li key={item.id} className="flex justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span>{item.model} {item.parts_type}</span>
                        <span>
                          システム {item.actual_qty} → 実数 {item.input_qty}
                          <span style={{ color: (item.input_qty! - item.actual_qty) > 0 ? 'var(--color-primary)' : 'var(--color-danger)', fontWeight: 600, marginLeft: '8px' }}>
                            （{(item.input_qty! - item.actual_qty) > 0 ? '+' : ''}{item.input_qty! - item.actual_qty}）
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {getAccessoryDiff().map(item => {
                      const displayName = item.accessory_variation 
                        ? item.accessory_name + ' ' + item.accessory_variation 
                        : item.accessory_name
                      return (
                        <li key={item.id} className="flex justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                          <span>{displayName}</span>
                          <span>
                            システム {item.actual_qty} → 実数 {item.input_qty}
                            <span style={{ color: (item.input_qty! - item.actual_qty) > 0 ? 'var(--color-primary)' : 'var(--color-danger)', fontWeight: 600, marginLeft: '8px' }}>
                              （{(item.input_qty! - item.actual_qty) > 0 ? '+' : ''}{item.input_qty! - item.actual_qty}）
                            </span>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-secondary"
              >
                キャンセル
              </button>
              <button
                onClick={() => saveCheck(false)}
                className="btn btn-secondary"
              >
                差異を反映しない
              </button>
              <button
                onClick={() => saveCheck(true)}
                className="btn btn-success"
              >
                差異を反映
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}