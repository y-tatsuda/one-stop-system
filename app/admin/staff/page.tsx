'use client'

import { useState, useEffect } from 'react'

interface Staff {
  id: number
  email: string
  name: string
  role: 'owner' | 'admin' | 'staff'
  is_active: boolean
  last_login_at: string | null
  invited_at: string | null
}

interface Shop {
  id: number
  name: string
}

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'staff' as 'admin' | 'staff',
    shopIds: [] as number[]
  })
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    fetchStaffList()
    fetchShops()
  }, [])

  const fetchStaffList = async () => {
    try {
      const res = await fetch('/api/staff')
      const data = await res.json()
      if (data.success) {
        setStaffList(data.staff)
      }
    } catch (err) {
      setError('スタッフ一覧の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/shops')
      const data = await res.json()
      if (data.success) {
        setShops(data.shops)
      }
    } catch (err) {
      console.error('店舗一覧の取得に失敗:', err)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsInviting(true)

    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm)
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      setSuccess('招待メールを送信しました')
      setShowInviteModal(false)
      setInviteForm({ email: '', name: '', role: 'staff', shopIds: [] })
      fetchStaffList()
    } catch (err) {
      setError('招待に失敗しました')
    } finally {
      setIsInviting(false)
    }
  }

  const handleDeactivate = async (staffId: number) => {
    if (!confirm('このスタッフを無効化しますか？')) return

    try {
      const res = await fetch(`/api/staff/${staffId}`, { method: 'DELETE' })
      const data = await res.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      setSuccess('スタッフを無効化しました')
      fetchStaffList()
    } catch (err) {
      setError('無効化に失敗しました')
    }
  }

  const handleReset2FA = async (staffId: number) => {
    if (!confirm('このスタッフの2段階認証をリセットしますか？')) return

    try {
      const res = await fetch(`/api/staff/${staffId}/reset-2fa`, { method: 'POST' })
      const data = await res.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      setSuccess('2段階認証をリセットしました')
    } catch (err) {
      setError('リセットに失敗しました')
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'オーナー'
      case 'admin': return '管理者'
      case 'staff': return 'スタッフ'
      default: return role
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'staff': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">スタッフ管理</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + スタッフを招待
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg">{success}</div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メール</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">権限</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最終ログイン</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">読み込み中...</td></tr>
            ) : staffList.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">スタッフがいません</td></tr>
            ) : (
              staffList.map((staff) => (
                <tr key={staff.id} className={!staff.is_active ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(staff.role)}`}>
                      {getRoleLabel(staff.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {staff.is_active ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">有効</span>
                    ) : staff.invited_at && !staff.is_active ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">招待中</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">無効</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {staff.last_login_at ? new Date(staff.last_login_at).toLocaleString('ja-JP') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {staff.role !== 'owner' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleReset2FA(staff.id)} className="text-blue-600 hover:text-blue-800">
                          2FAリセット
                        </button>
                        {staff.is_active && (
                          <button onClick={() => handleDeactivate(staff.id)} className="text-red-600 hover:text-red-800">
                            無効化
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">スタッフを招待</h2>
            <form onSubmit={handleInvite}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">名前 *</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">権限</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'staff' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="staff">スタッフ</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">所属店舗</label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {shops.map((shop) => (
                    <label key={shop.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={inviteForm.shopIds.includes(shop.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setInviteForm({ ...inviteForm, shopIds: [...inviteForm.shopIds, shop.id] })
                          } else {
                            setInviteForm({ ...inviteForm, shopIds: inviteForm.shopIds.filter((id) => id !== shop.id) })
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{shop.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-gray-600">
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {isInviting ? '送信中...' : '招待メールを送信'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
