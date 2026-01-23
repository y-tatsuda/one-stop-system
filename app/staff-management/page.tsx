'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Shop = {
  id: number
  name: string
}

type Staff = {
  id: number
  name: string
  is_active: boolean
  created_at: string
  shops: number[]
}

type StaffWithShops = {
  id: number
  name: string
  is_active: boolean
  created_at: string
  m_staff_shops: { shop_id: number }[]
}

export default function StaffManagementPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [saving, setSaving] = useState(false)

  // フォーム
  const [formData, setFormData] = useState({
    name: '',
    shopIds: [] as number[],
  })

  // データ取得
  const fetchData = async () => {
    setLoading(true)

    // 店舗データ取得
    const { data: shopsData } = await supabase
      .from('m_shops')
      .select('id, name')
      .eq('tenant_id', 1)
      .eq('is_active', true)
      .order('id')

    setShops(shopsData || [])

    // スタッフデータ取得（所属店舗含む）
    const { data: staffData } = await supabase
      .from('m_staff')
      .select('id, name, is_active, created_at, m_staff_shops(shop_id)')
      .eq('tenant_id', 1)
      .order('id')

    if (staffData) {
      const formattedStaff: Staff[] = (staffData as StaffWithShops[]).map(s => ({
        id: s.id,
        name: s.name,
        is_active: s.is_active,
        created_at: s.created_at,
        shops: s.m_staff_shops?.map(ss => ss.shop_id) || [],
      }))
      setStaffList(formattedStaff)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // フィルタリング
  const filteredStaff = staffList.filter(s => showInactive || s.is_active)

  // 新規追加モーダルを開く
  const openAddModal = () => {
    setEditingStaff(null)
    setFormData({ name: '', shopIds: [] })
    setShowModal(true)
  }

  // 編集モーダルを開く
  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff)
    setFormData({
      name: staff.name,
      shopIds: staff.shops,
    })
    setShowModal(true)
  }

  // モーダルを閉じる
  const closeModal = () => {
    setShowModal(false)
    setEditingStaff(null)
    setFormData({ name: '', shopIds: [] })
  }

  // 店舗選択トグル
  const toggleShop = (shopId: number) => {
    if (formData.shopIds.includes(shopId)) {
      setFormData({
        ...formData,
        shopIds: formData.shopIds.filter(id => id !== shopId),
      })
    } else {
      setFormData({
        ...formData,
        shopIds: [...formData.shopIds, shopId],
      })
    }
  }

  // 保存
  const saveStaff = async () => {
    if (!formData.name.trim()) {
      alert('名前を入力してください')
      return
    }
    if (formData.shopIds.length === 0) {
      alert('所属店舗を選択してください')
      return
    }

    setSaving(true)

    try {
      if (editingStaff) {
        // 更新
        const { error: updateError } = await supabase
          .from('m_staff')
          .update({ 
            name: formData.name.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingStaff.id)

        if (updateError) throw updateError

        // 所属店舗を削除して再登録
        await supabase
          .from('m_staff_shops')
          .delete()
          .eq('staff_id', editingStaff.id)

        const shopInserts = formData.shopIds.map(shopId => ({
          staff_id: editingStaff.id,
          shop_id: shopId,
        }))

        const { error: shopError } = await supabase
          .from('m_staff_shops')
          .insert(shopInserts)

        if (shopError) throw shopError

      } else {
        // 新規追加
        const { data: newStaff, error: insertError } = await supabase
          .from('m_staff')
          .insert({
            tenant_id: 1,
            name: formData.name.trim(),
            is_active: true,
          })
          .select()
          .single()

        if (insertError) throw insertError

        // 所属店舗登録
        const shopInserts = formData.shopIds.map(shopId => ({
          staff_id: newStaff.id,
          shop_id: shopId,
        }))

        const { error: shopError } = await supabase
          .from('m_staff_shops')
          .insert(shopInserts)

        if (shopError) throw shopError
      }

      await fetchData()
      closeModal()
      alert(editingStaff ? '更新しました' : '追加しました')
    } catch (error) {
      alert('保存に失敗しました: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // ステータス切り替え
  const toggleStatus = async (staff: Staff) => {
    const newStatus = !staff.is_active
    const action = newStatus ? '有効' : '無効'
    
    if (!confirm(`${staff.name}さんを${action}にしますか？`)) {
      return
    }

    const { error } = await supabase
      .from('m_staff')
      .update({ 
        is_active: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', staff.id)

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
        <h1 className="page-title">スタッフ管理</h1>
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
              <span>無効スタッフも表示</span>
            </label>
          </div>
        </div>
      </div>

      {/* スタッフ一覧 */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名前</th>
                  <th>所属店舗</th>
                  <th className="text-center">ステータス</th>
                  <th className="text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <p className="empty-state-text">スタッフが登録されていません</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map(staff => (
                    <tr 
                      key={staff.id} 
                      style={!staff.is_active ? { backgroundColor: 'var(--color-bg)', opacity: 0.6 } : {}}
                    >
                      <td>{staff.id}</td>
                      <td style={{ fontWeight: 500 }}>{staff.name}</td>
                      <td>
                        <div className="flex flex-wrap gap-xs">
                          {staff.shops.map(shopId => {
                            const shop = shops.find(s => s.id === shopId)
                            return shop ? (
                              <span 
                                key={shopId}
                                className="badge badge-primary"
                              >
                                {shop.name}
                              </span>
                            ) : null
                          })}
                        </div>
                      </td>
                      <td className="text-center">
                        {staff.is_active ? (
                          <span className="badge badge-success">有効</span>
                        ) : (
                          <span className="badge badge-gray">無効</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-sm">
                          <button
                            onClick={() => openEditModal(staff)}
                            className="btn btn-sm btn-secondary"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => toggleStatus(staff)}
                            className={`btn btn-sm ${staff.is_active ? 'btn-warning' : 'btn-success'}`}
                          >
                            {staff.is_active ? '無効化' : '有効化'}
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
                {editingStaff ? 'スタッフ編集' : 'スタッフ追加'}
              </h2>
              <button
                onClick={closeModal}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* 名前 */}
              <div className="form-group">
                <label className="form-label form-label-required">名前</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="例：山田 太郎"
                />
              </div>

              {/* 所属店舗 */}
              <div className="form-group">
                <label className="form-label form-label-required">
                  所属店舗
                  <span className="form-hint" style={{ marginLeft: '8px' }}>（複数選択可）</span>
                </label>
                <div className="flex flex-col gap-sm">
                  {shops.map(shop => (
                    <label
                      key={shop.id}
                      className="form-check"
                      style={{
                        padding: '12px',
                        border: formData.shopIds.includes(shop.id) 
                          ? '2px solid var(--color-primary)' 
                          : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        backgroundColor: formData.shopIds.includes(shop.id) 
                          ? 'var(--color-primary-light)' 
                          : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.shopIds.includes(shop.id)}
                        onChange={() => toggleShop(shop.id)}
                      />
                      <span style={{ fontWeight: 500 }}>{shop.name}</span>
                    </label>
                  ))}
                </div>
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
                onClick={saveStaff}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? '保存中...' : (editingStaff ? '更新' : '追加')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}