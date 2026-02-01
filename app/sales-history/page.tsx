'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Shop = { id: number; name: string }
type Staff = { id: number; name: string }

type SalesRecord = {
  id: number
  sale_date: string
  shop_id: number
  staff_id: number
  total_amount: number
  total_cost: number
  total_profit: number
  shop_name: string
  staff_name: string
  details: SalesDetail[]
}

type SalesDetail = {
  id: number
  category: string
  sub_category: string
  model: string
  menu: string
  quantity: number
  unit_price: number
  unit_cost: number
  amount: number
  cost: number
  profit: number
}

export default function SalesHistoryPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState<SalesRecord | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // フィルター
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [filterShopId, setFilterShopId] = useState('')
  const [filterStaffId, setFilterStaffId] = useState('')

  // 編集フォーム
  const [editForm, setEditForm] = useState({
    saleDate: '',
    shopId: '',
    staffId: '',
  })
  const [editDetails, setEditDetails] = useState<SalesDetail[]>([])

  useEffect(() => {
    fetchMasterData()
  }, [])

  useEffect(() => {
    fetchSales()
  }, [filterDate, filterShopId, filterStaffId])

  const fetchMasterData = async () => {
    const [shopsRes, staffRes] = await Promise.all([
      supabase.from('m_shops').select('id, name').eq('tenant_id', 1).eq('is_active', true).order('id'),
      supabase.from('m_staff').select('id, name').eq('tenant_id', 1).eq('is_active', true).order('id'),
    ])
    setShops(shopsRes.data || [])
    setStaffList(staffRes.data || [])
    setLoading(false)
  }

  const fetchSales = async () => {
    let query = supabase
      .from('t_sales')
      .select(`
        id, sale_date, shop_id, staff_id, total_amount, total_cost, total_profit,
        m_shops(name),
        m_staff(name),
        t_sales_details(id, category, sub_category, model, menu, quantity, unit_price, unit_cost, amount, cost, profit)
      `)
      .eq('tenant_id', 1)
      .order('sale_date', { ascending: false })
      .order('id', { ascending: false })

    if (filterDate) {
      query = query.eq('sale_date', filterDate)
    }
    if (filterShopId) {
      query = query.eq('shop_id', parseInt(filterShopId))
    }
    if (filterStaffId) {
      query = query.eq('staff_id', parseInt(filterStaffId))
    }

    const { data, error } = await query.limit(100)

    if (error) {
      console.error('売上取得エラー:', error)
      return
    }

    const records: SalesRecord[] = (data || []).map((row: any) => ({
      id: row.id,
      sale_date: row.sale_date,
      shop_id: row.shop_id,
      staff_id: row.staff_id,
      total_amount: row.total_amount,
      total_cost: row.total_cost,
      total_profit: row.total_profit,
      shop_name: row.m_shops?.name || '',
      staff_name: row.m_staff?.name || '',
      details: row.t_sales_details || [],
    }))

    setSalesRecords(records)
  }

  const openEditModal = (sale: SalesRecord) => {
    setSelectedSale(sale)
    setEditForm({
      saleDate: sale.sale_date,
      shopId: String(sale.shop_id),
      staffId: String(sale.staff_id),
    })
    setEditDetails([...sale.details])
    setShowEditModal(true)
  }

  const openDeleteConfirm = (sale: SalesRecord) => {
    setSelectedSale(sale)
    setShowDeleteConfirm(true)
  }

  const handleDetailChange = (index: number, field: string, value: number) => {
    const updated = [...editDetails]
    if (field === 'unit_price') {
      updated[index].unit_price = value
      updated[index].amount = value * updated[index].quantity
      updated[index].profit = updated[index].amount - updated[index].cost
    } else if (field === 'quantity') {
      updated[index].quantity = value
      updated[index].amount = updated[index].unit_price * value
      updated[index].cost = updated[index].unit_cost * value
      updated[index].profit = updated[index].amount - updated[index].cost
    }
    setEditDetails(updated)
  }

  const removeDetail = (index: number) => {
    setEditDetails(editDetails.filter((_, i) => i !== index))
  }

  const calculateEditTotals = () => {
    const totalAmount = editDetails.reduce((sum, d) => sum + d.amount, 0)
    const totalCost = editDetails.reduce((sum, d) => sum + d.cost, 0)
    const totalProfit = totalAmount - totalCost
    return { totalAmount, totalCost, totalProfit }
  }

  const handleSaveEdit = async () => {
    if (!selectedSale) return

    const { totalAmount, totalCost, totalProfit } = calculateEditTotals()

    // ヘッダー更新
    const { error: headerError } = await supabase
      .from('t_sales')
      .update({
        sale_date: editForm.saleDate,
        shop_id: parseInt(editForm.shopId),
        staff_id: parseInt(editForm.staffId),
        total_amount: totalAmount,
        total_cost: totalCost,
        total_profit: totalProfit,
      })
      .eq('id', selectedSale.id)

    if (headerError) {
      alert('売上更新に失敗しました: ' + headerError.message)
      return
    }

    // 既存明細を削除
    await supabase
      .from('t_sales_details')
      .delete()
      .eq('sales_id', selectedSale.id)

    // 明細を再登録
    if (editDetails.length > 0) {
      const detailRecords = editDetails.map(d => ({
        sales_id: selectedSale.id,
        category: d.category,
        sub_category: d.sub_category,
        model: d.model,
        menu: d.menu,
        quantity: d.quantity,
        unit_price: d.unit_price,
        unit_cost: d.unit_cost,
        amount: d.amount,
        cost: d.cost,
        profit: d.profit,
      }))

      const { error: detailError } = await supabase
        .from('t_sales_details')
        .insert(detailRecords)

      if (detailError) {
        alert('明細更新に失敗しました: ' + detailError.message)
        return
      }
    }

    alert('売上を更新しました')
    setShowEditModal(false)
    fetchSales()
  }

  const handleDelete = async () => {
    if (!selectedSale) return

    // 中古販売の場合、在庫ステータスを戻す
    for (const detail of selectedSale.details) {
      if (detail.category === '中古販売') {
        // used_inventory_idがある場合はステータスを戻す
        const { data: detailData } = await supabase
          .from('t_sales_details')
          .select('used_inventory_id')
          .eq('id', detail.id)
          .single()

        if (detailData?.used_inventory_id) {
          await supabase
            .from('t_used_inventory')
            .update({ status: '販売可' })
            .eq('id', detailData.used_inventory_id)
        }
      }
    }

    // 明細削除
    await supabase
      .from('t_sales_details')
      .delete()
      .eq('sales_id', selectedSale.id)

    // ヘッダー削除
    const { error } = await supabase
      .from('t_sales')
      .delete()
      .eq('id', selectedSale.id)

    if (error) {
      alert('削除に失敗しました: ' + error.message)
      return
    }

    alert('売上を削除しました')
    setShowDeleteConfirm(false)
    fetchSales()
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString() + '円'
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const { totalAmount: editTotalAmount, totalCost: editTotalCost, totalProfit: editTotalProfit } = calculateEditTotals()

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">売上履歴</h1>
      </div>

      {/* フィルター */}
      <div className="card mb-lg">
        <div className="card-body">
          <div className="form-grid form-grid-4">
            <div className="form-group">
              <label className="form-label">日付</label>
              <input
                type="date"
                className="form-input"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">店舗</label>
              <select
                className="form-select"
                value={filterShopId}
                onChange={(e) => setFilterShopId(e.target.value)}
              >
                <option value="">全店舗</option>
                {shops.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">担当者</label>
              <select
                className="form-select"
                value={filterStaffId}
                onChange={(e) => setFilterStaffId(e.target.value)}
              >
                <option value="">全員</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => {
                setFilterDate('')
                setFilterShopId('')
                setFilterStaffId('')
              }}>
                フィルターをクリア
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 売上一覧 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">売上一覧（{salesRecords.length}件）</h2>
        </div>
        <div className="card-body">
          {salesRecords.length === 0 ? (
            <p className="text-center text-muted">該当する売上がありません</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>日付</th>
                    <th>店舗</th>
                    <th>担当</th>
                    <th>内容</th>
                    <th className="text-right">売上</th>
                    <th className="text-right">利益</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {salesRecords.map(sale => (
                    <tr key={sale.id}>
                      <td>{sale.id}</td>
                      <td>{sale.sale_date}</td>
                      <td>{sale.shop_name}</td>
                      <td>{sale.staff_name}</td>
                      <td>
                        {sale.details.map((d, i) => (
                          <div key={i} style={{ fontSize: '0.85rem' }}>
                            {d.category}: {d.model} {d.menu} ×{d.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="text-right">{formatCurrency(sale.total_amount)}</td>
                      <td className="text-right">{formatCurrency(sale.total_profit)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => openEditModal(sale)}
                          >
                            編集
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => openDeleteConfirm(sale)}
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 編集モーダル */}
      {showEditModal && selectedSale && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">売上編集（ID: {selectedSale.id}）</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* 基本情報 */}
              <div className="form-grid form-grid-4 mb-md">
                <div className="form-group">
                  <label className="form-label">売上日</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editForm.saleDate}
                    onChange={(e) => setEditForm({ ...editForm, saleDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">店舗</label>
                  <select
                    className="form-select"
                    value={editForm.shopId}
                    onChange={(e) => setEditForm({ ...editForm, shopId: e.target.value })}
                  >
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">担当者</label>
                  <select
                    className="form-select"
                    value={editForm.staffId}
                    onChange={(e) => setEditForm({ ...editForm, staffId: e.target.value })}
                  >
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 明細 */}
              <h4 style={{ marginBottom: '12px' }}>明細</h4>
              <div className="table-container mb-md">
                <table className="table">
                  <thead>
                    <tr>
                      <th>カテゴリ</th>
                      <th>機種/商品</th>
                      <th>メニュー</th>
                      <th className="text-right">数量</th>
                      <th className="text-right">単価</th>
                      <th className="text-right">金額</th>
                      <th>削除</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editDetails.map((d, i) => (
                      <tr key={i}>
                        <td>{d.category}</td>
                        <td>{d.model}</td>
                        <td>{d.menu}</td>
                        <td className="text-right">
                          <input
                            type="number"
                            className="form-input"
                            style={{ width: '60px', textAlign: 'right' }}
                            value={d.quantity}
                            onChange={(e) => handleDetailChange(i, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            className="form-input"
                            style={{ width: '100px', textAlign: 'right' }}
                            value={d.unit_price}
                            onChange={(e) => handleDetailChange(i, 'unit_price', parseInt(e.target.value) || 0)}
                            step="100"
                          />
                        </td>
                        <td className="text-right">{formatCurrency(d.amount)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => removeDetail(i)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 合計 */}
              <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  売上合計: {formatCurrency(editTotalAmount)}
                </div>
                <div style={{ color: '#6B7280' }}>
                  原価: {formatCurrency(editTotalCost)} / 利益: {formatCurrency(editTotalProfit)}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                キャンセル
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {showDeleteConfirm && selectedSale && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">売上削除確認</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>以下の売上を削除しますか？</p>
              <div style={{ background: '#F3F4F6', padding: '16px', borderRadius: '8px', marginTop: '12px' }}>
                <div><strong>ID:</strong> {selectedSale.id}</div>
                <div><strong>日付:</strong> {selectedSale.sale_date}</div>
                <div><strong>店舗:</strong> {selectedSale.shop_name}</div>
                <div><strong>金額:</strong> {formatCurrency(selectedSale.total_amount)}</div>
                <div style={{ marginTop: '8px' }}>
                  <strong>明細:</strong>
                  {selectedSale.details.map((d, i) => (
                    <div key={i} style={{ marginLeft: '16px', fontSize: '0.9rem' }}>
                      ・{d.category}: {d.model} {d.menu}
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ color: '#DC2626', marginTop: '16px' }}>
                ※ この操作は取り消せません
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                キャンセル
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
