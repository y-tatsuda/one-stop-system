'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_TENANT_ID } from '../lib/constants'
import { Shop, Staff } from '../lib/types'

type Sale = {
  id: number
  sale_date: string
  shop_id: number
  shop_name: string
  staff_id: number
  staff_name: string
  total_amount: number
  total_profit: number
  details: { category: string; model: string; menu: string }[]
}

export default function SalesCorrectionPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  // フィルター
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  })
  const [selectedShop, setSelectedShop] = useState<number | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null)

  // ページネーション
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  // 削除確認
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)

  useEffect(() => {
    async function fetchMasters() {
      const [{ data: shopsData }, { data: staffData }] = await Promise.all([
        supabase.from('m_shops').select('id, name').eq('tenant_id', DEFAULT_TENANT_ID).eq('is_active', true).order('id'),
        supabase.from('m_staff').select('id, name').eq('tenant_id', DEFAULT_TENANT_ID).eq('is_active', true).order('name'),
      ])
      setShops(shopsData || [])
      setStaffList(staffData || [])
    }
    fetchMasters()
  }, [])

  useEffect(() => {
    fetchSales()
  }, [startDate, endDate, selectedShop, selectedStaff, page])

  async function fetchSales() {
    setLoading(true)

    let query = supabase
      .from('t_sales')
      .select(`
        id, sale_date, shop_id, staff_id, total_amount, total_profit,
        m_shops(name),
        m_staff(name),
        t_sales_details(category, model, menu)
      `, { count: 'exact' })
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .order('sale_date', { ascending: false })
      .order('id', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (selectedShop) {
      query = query.eq('shop_id', selectedShop)
    }
    if (selectedStaff) {
      query = query.eq('staff_id', selectedStaff)
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching sales:', error)
      setLoading(false)
      return
    }

    const salesList: Sale[] = (data || []).map((s: any) => ({
      id: s.id,
      sale_date: s.sale_date,
      shop_id: s.shop_id,
      shop_name: s.m_shops?.name || '',
      staff_id: s.staff_id,
      staff_name: s.m_staff?.name || '',
      total_amount: s.total_amount,
      total_profit: s.total_profit || 0,
      details: s.t_sales_details || [],
    }))

    setSales(salesList)
    setTotalCount(count || 0)
    setLoading(false)
  }

  const handleDeleteSale = async (saleId: number) => {
    await supabase.from('t_sales_details').delete().eq('sales_id', saleId)
    const { error } = await supabase.from('t_sales').delete().eq('id', saleId)

    if (error) {
      alert('削除に失敗しました: ' + error.message)
      return
    }

    setSales(sales.filter(s => s.id !== saleId))
    setTotalCount(prev => prev - 1)
    setShowDeleteConfirm(null)
    alert('売上を削除しました')
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">過去の売上訂正</h1>
      </div>

      {/* フィルター */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">検索条件</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">開始日</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setPage(1) }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">終了日</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setPage(1) }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">店舗</label>
              <select
                className="form-select"
                value={selectedShop || ''}
                onChange={e => { setSelectedShop(e.target.value ? Number(e.target.value) : null); setPage(1) }}
              >
                <option value="">全店舗</option>
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">担当者</label>
              <select
                className="form-select"
                value={selectedStaff || ''}
                onChange={e => { setSelectedStaff(e.target.value ? Number(e.target.value) : null); setPage(1) }}
              >
                <option value="">全担当者</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 売上一覧 */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">売上一覧</h2>
          <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>
            {totalCount}件中 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)}件
          </span>
        </div>
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : sales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
              該当する売上はありません
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>日付</th>
                      <th>店舗</th>
                      <th>担当</th>
                      <th>内容</th>
                      <th className="text-right">金額</th>
                      <th className="text-right">粗利</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(sale => (
                      <tr key={sale.id}>
                        <td>{sale.id}</td>
                        <td>{sale.sale_date}</td>
                        <td>{sale.shop_name}</td>
                        <td>{sale.staff_name}</td>
                        <td>
                          {sale.details.slice(0, 2).map((d, i) => (
                            <div key={i} style={{ fontSize: '0.85rem' }}>
                              {d.category}: {d.model} {d.menu}
                            </div>
                          ))}
                          {sale.details.length > 2 && (
                            <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                              他{sale.details.length - 2}件
                            </div>
                          )}
                        </td>
                        <td className="text-right" style={{ fontWeight: '600' }}>
                          ¥{sale.total_amount.toLocaleString()}
                        </td>
                        <td className="text-right" style={{ fontWeight: '600', color: '#22C55E' }}>
                          ¥{sale.total_profit.toLocaleString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a
                              href={`/sales-history?date=${sale.sale_date}&id=${sale.id}`}
                              className="btn btn-sm btn-secondary"
                            >
                              編集
                            </a>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => setShowDeleteConfirm(sale.id)}
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

              {/* ページネーション */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    前へ
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1
                    if (totalPages > 5) {
                      if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`btn btn-sm ${page === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    次へ
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">売上削除確認</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>この売上を削除しますか？</p>
              <p style={{ color: '#DC2626', marginTop: '8px', fontSize: '0.9rem' }}>
                ※ この操作は取り消せません
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                キャンセル
              </button>
              <button className="btn btn-danger" onClick={() => handleDeleteSale(showDeleteConfirm)}>
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
