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
  email: string
  role: string
  is_active: boolean
  is_2fa_enabled: boolean
  password_changed: boolean
  created_at: string
  shops: number[]
}

type StaffWithShops = {
  id: number
  name: string
  email: string
  role: string
  is_active: boolean
  is_2fa_enabled: boolean
  password_changed: boolean
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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // フォーム
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'owner' | 'admin' | 'staff',
    is_2fa_enabled: true,
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
      .select('id, name, email, role, is_active, is_2fa_enabled, password_changed, created_at, m_staff_shops(shop_id)')
      .eq('tenant_id', 1)
      .order('id')

    if (staffData) {
      const formattedStaff: Staff[] = (staffData as StaffWithShops[]).map(s => ({
        id: s.id,
        name: s.name,
        email: s.email || '',
        role: s.role || 'staff',
        is_active: s.is_active,
        is_2fa_enabled: s.is_2fa_enabled ?? false,
        password_changed: s.password_changed ?? false,
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

  // メッセージ自動消去
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('')
        setSuccess('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  // フィルタリング
  const filteredStaff = staffList.filter(s => showInactive || s.is_active)

  // 新規追加モーダルを開く
  const openAddModal = () => {
    setEditingStaff(null)
    setFormData({ 
      name: '', 
      email: '', 
      password: '', 
      role: 'staff', 
      is_2fa_enabled: true,
      shopIds: [] 
    })
    setShowModal(true)
  }

  // 編集モーダルを開く
  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff)
    setFormData({
      name: staff.name,
      email: staff.email,
      password: '',
      role: staff.role as 'owner' | 'admin' | 'staff',
      is_2fa_enabled: staff.is_2fa_enabled,
      shopIds: staff.shops,
    })
    setShowModal(true)
  }

  // モーダルを閉じる
  const closeModal = () => {
    setShowModal(false)
    setEditingStaff(null)
    setFormData({ 
      name: '', 
      email: '', 
      password: '', 
      role: 'staff', 
      is_2fa_enabled: true,
      shopIds: [] 
    })
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

  // パスワードバリデーション
  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) errors.push('8文字以上')
    if (!/[a-z]/.test(password)) errors.push('小文字を含む')
    if (!/[A-Z]/.test(password)) errors.push('大文字を含む')
    if (!/[0-9]/.test(password)) errors.push('数字を含む')
    return errors
  }

  // 保存
  const saveStaff = async () => {
    setError('')

    // バリデーション
    if (!formData.name.trim()) {
      setError('名前を入力してください')
      return
    }
    if (!editingStaff && !formData.email.trim()) {
      setError('メールアドレスを入力してください')
      return
    }
    if (!editingStaff && !formData.password) {
      setError('仮パスワードを入力してください')
      return
    }
    if (!editingStaff) {
      const pwErrors = validatePassword(formData.password)
      if (pwErrors.length > 0) {
        setError('パスワード要件: ' + pwErrors.join('、'))
        return
      }
    }
    if (formData.shopIds.length === 0) {
      setError('所属店舗を選択してください')
      return
    }

    setSaving(true)

    try {
      if (editingStaff) {
        // 更新（既存スタッフ）
        const { error: updateError } = await supabase
          .from('m_staff')
          .update({ 
            name: formData.name.trim(),
            role: formData.role,
            is_2fa_enabled: formData.is_2fa_enabled,
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

        setSuccess('更新しました')
      } else {
        // 新規追加（API経由でSupabase Auth連携）
        const res = await fetch('/api/staff/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role: formData.role,
            is_2fa_enabled: formData.is_2fa_enabled,
            shopIds: formData.shopIds,
          }),
        })

        const data = await res.json()

        if (!data.success) {
          throw new Error(data.error)
        }

        setSuccess('スタッフを追加しました。仮パスワードを本人に伝えてください。')
      }

      await fetchData()
      closeModal()
    } catch (err) {
      setError('保存に失敗しました: ' + (err as Error).message)
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
      setError('更新に失敗しました: ' + error.message)
      return
    }

    await fetchData()
    setSuccess(`${staff.name}さんを${action}にしました`)
  }

  // 権限ラベル
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'オーナー'
      case 'admin': return '管理者'
      case 'staff': return 'スタッフ'
      default: return role
    }
  }

  // 権限バッジ色
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'owner': return 'badge-primary'
      case 'admin': return 'badge-info'
      case 'staff': return 'badge-gray'
      default: return 'badge-gray'
    }
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

      {/* メッセージ */}
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      {success && (
        <div className="alert alert-success">{success}</div>
      )}

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
                  <th>名前</th>
                  <th>メール</th>
                  <th>権限</th>
                  <th>所属店舗</th>
                  <th className="text-center">2段階認証</th>
                  <th className="text-center">ステータス</th>
                  <th className="text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
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
                      <td style={{ fontWeight: 500 }}>{staff.name}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {staff.email || '-'}
                      </td>
                      <td>
                        <span className={`badge ${getRoleBadgeClass(staff.role)}`}>
                          {getRoleLabel(staff.role)}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-xs">
                          {staff.shops.map(shopId => {
                            const shop = shops.find(s => s.id === shopId)
                            return shop ? (
                              <span key={shopId} className="badge badge-primary">
                                {shop.name}
                              </span>
                            ) : null
                          })}
                        </div>
                      </td>
                      <td className="text-center">
                        {staff.is_2fa_enabled ? (
                          <span className="badge badge-success">ON</span>
                        ) : (
                          <span className="badge badge-gray">OFF</span>
                        )}
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
              <button onClick={closeModal} className="modal-close">✕</button>
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

              {/* メールアドレス（新規のみ） */}
              {!editingStaff && (
                <div className="form-group">
                  <label className="form-label form-label-required">メールアドレス</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                    placeholder="例：yamada@example.com"
                  />
                  <p className="form-hint">ログインと2段階認証コードの送信先になります</p>
                </div>
              )}

              {/* 仮パスワード（新規のみ） */}
              {!editingStaff && (
                <div className="form-group">
                  <label className="form-label form-label-required">仮パスワード</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="form-input"
                    placeholder="8文字以上、大小文字・数字を含む"
                  />
                  <p className="form-hint">初回ログイン後、本人が変更します</p>
                </div>
              )}

              {/* 権限 */}
              <div className="form-group">
                <label className="form-label form-label-required">権限</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'owner' | 'admin' | 'staff' })}
                  className="form-select"
                >
                  <option value="staff">スタッフ</option>
                  <option value="admin">管理者</option>
                  <option value="owner">オーナー</option>
                </select>
              </div>

              {/* 2段階認証 */}
              <div className="form-group">
                <label className="form-check" style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_2fa_enabled}
                    onChange={(e) => setFormData({ ...formData, is_2fa_enabled: e.target.checked })}
                  />
                  <span>2段階認証を有効にする（推奨）</span>
                </label>
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
              <button onClick={closeModal} className="btn btn-secondary">
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