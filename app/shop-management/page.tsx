'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_TENANT_ID } from '../lib/constants'

type Shop = {
  id: number
  name: string
  code: string
  is_active: boolean
  is_ec: boolean
  created_at: string
}

export default function ShopManagementPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [saving, setSaving] = useState(false)

  // フォーム
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is_ec: false,
  })

  // データ取得
  const fetchData = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('m_shops')
      .select('id, name, code, is_active, is_ec, created_at')
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .order('id')

    setShops(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // フィルタリング
  const filteredShops = shops.filter(s => showInactive || s.is_active)

  // 新規追加モーダルを開く
  const openAddModal = () => {
    setEditingShop(null)
    setFormData({ name: '', code: '', is_ec: false })
    setShowModal(true)
  }

  // 編集モーダルを開く
  const openEditModal = (shop: Shop) => {
    setEditingShop(shop)
    setFormData({
      name: shop.name,
      code: shop.code,
      is_ec: shop.is_ec || false,
    })
    setShowModal(true)
  }

  // モーダルを閉じる
  const closeModal = () => {
    setShowModal(false)
    setEditingShop(null)
    setFormData({ name: '', code: '', is_ec: false })
  }

  // 保存
  const saveShop = async () => {
    if (!formData.name.trim()) {
      alert('店舗名を入力してください')
      return
    }
    if (!formData.code.trim()) {
      alert('店舗コードを入力してください')
      return
    }

    setSaving(true)

    try {
      if (editingShop) {
        // 更新
        const { error } = await supabase
          .from('m_shops')
          .update({
            name: formData.name.trim(),
            code: formData.code.trim(),
            is_ec: formData.is_ec,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingShop.id)

        if (error) throw error
      } else {
        // 新規追加
        const { error } = await supabase
          .from('m_shops')
          .insert({
            tenant_id: DEFAULT_TENANT_ID,
            name: formData.name.trim(),
            code: formData.code.trim(),
            is_ec: formData.is_ec,
            is_active: true,
          })

        if (error) throw error
      }

      await fetchData()
      closeModal()
      alert(editingShop ? '更新しました' : '追加しました')
    } catch (error) {
      alert('保存に失敗しました: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // ステータス切り替え
  const toggleStatus = async (shop: Shop) => {
    const newStatus = !shop.is_active
    const action = newStatus ? '有効' : '無効'
    
    if (!confirm(`${shop.name}を${action}にしますか？`)) {
      return
    }

    const { error } = await supabase
      .from('m_shops')
      .update({ 
        is_active: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shop.id)

    if (error) {
      alert('更新に失敗しました: ' + error.message)
      return
    }

    await fetchData()
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
        <h1 className="page-title">店舗管理</h1>
      </div>

      {/* 操作バー */}
      <div className="card mb-lg">
        <div className="card-body">
          <div className="flex flex-wrap justify-between items-center gap-md">
            <button
              onClick={openAddModal}
              className="btn btn-primary"
            >
              + 新規追加
            </button>
            <label className="form-check">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              <span>無効店舗も表示</span>
            </label>
          </div>
        </div>
      </div>

      {/* 店舗一覧 */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>店舗名</th>
                  <th>店舗コード</th>
                  <th className="text-center">種別</th>
                  <th className="text-center">ステータス</th>
                  <th className="text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredShops.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <p className="empty-state-text">店舗が登録されていません</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredShops.map(shop => (
                    <tr 
                      key={shop.id} 
                      style={!shop.is_active ? { backgroundColor: 'var(--color-bg)', opacity: 0.6 } : {}}
                    >
                      <td>{shop.id}</td>
                      <td style={{ fontWeight: 500 }}>{shop.name}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: 'var(--color-bg)',
                          borderRadius: 'var(--radius-sm)',
                          fontFamily: 'monospace',
                          fontSize: '0.9rem'
                        }}>
                          {shop.code}
                        </span>
                      </td>
                      <td className="text-center">
                        {shop.is_ec ? (
                          <span className="badge badge-primary">EC</span>
                        ) : (
                          <span className="badge badge-gray">実店舗</span>
                        )}
                      </td>
                      <td className="text-center">
                        {shop.is_active ? (
                          <span className="badge badge-success">有効</span>
                        ) : (
                          <span className="badge badge-gray">無効</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-sm">
                          <button
                            onClick={() => openEditModal(shop)}
                            className="btn btn-sm btn-secondary"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => toggleStatus(shop)}
                            className={`btn btn-sm ${shop.is_active ? 'btn-warning' : 'btn-success'}`}
                          >
                            {shop.is_active ? '無効化' : '有効化'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 追加/編集モーダル */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingShop ? '店舗編集' : '店舗追加'}
              </h2>
              <button
                onClick={closeModal}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* 店舗名 */}
              <div className="form-group">
                <label className="form-label form-label-required">店舗名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="例：福井店"
                />
              </div>

              {/* 店舗コード */}
              <div className="form-group">
                <label className="form-label form-label-required">店舗コード</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="form-input"
                  style={{ fontFamily: 'monospace' }}
                  placeholder="例：FUKUI"
                />
                <p className="form-hint">半角英数字で入力（システム内部で使用）</p>
              </div>

              {/* EC店舗フラグ */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_ec}
                    onChange={(e) => setFormData({ ...formData, is_ec: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: 500 }}>EC店舗（メルカリ・Shopify等）</span>
                </label>
                <p className="form-hint">EC店舗の場合、売上入力が簡略化されます</p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={closeModal}
                className="btn btn-secondary"
              >
                キャンセル
              </button>
              <button
                onClick={saveShop}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? '保存中...' : (editingShop ? '更新' : '追加')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}