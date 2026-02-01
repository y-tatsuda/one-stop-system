'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { staff, updatePasswordChanged, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // パスワードの強度チェック
  const validatePassword = (password: string) => {
    const errors: string[] = []
    if (password.length < 8) {
      errors.push('8文字以上')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('小文字を含む')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('大文字を含む')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('数字を含む')
    }
    return errors
  }

  const passwordErrors = validatePassword(newPassword)
  const isPasswordValid = passwordErrors.length === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // バリデーション
    if (!isPasswordValid) {
      setError('パスワードの要件を満たしてください')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('新しいパスワードが一致しません')
      return
    }

    if (currentPassword === newPassword) {
      setError('新しいパスワードは現在のパスワードと異なる必要があります')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: staff?.id,
          currentPassword,
          newPassword
        })
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      // パスワード変更完了フラグを更新
      updatePasswordChanged()
      
      // ホームへリダイレクト
      router.replace('/')
    } catch (err) {
      setError('パスワードの変更に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">パスワード変更</h1>
          <p className="text-gray-500 mt-2">
            初回ログインのため、パスワードを変更してください
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              現在のパスワード
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ paddingRight: '48px' }}
                placeholder="現在のパスワード"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '14px',
                }}
              >
                {showCurrentPassword ? '非表示' : '表示'}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新しいパスワード
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ paddingRight: '48px' }}
                placeholder="新しいパスワード"
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '14px',
                }}
              >
                {showNewPassword ? '非表示' : '表示'}
              </button>
            </div>

            {/* パスワード要件 */}
            <div className="mt-2 text-xs space-y-1">
              <p className={`${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                ✓ 8文字以上
              </p>
              <p className={`${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                ✓ 小文字を含む
              </p>
              <p className={`${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                ✓ 大文字を含む
              </p>
              <p className={`${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                ✓ 数字を含む
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新しいパスワード（確認）
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ paddingRight: '48px' }}
                placeholder="新しいパスワード（確認）"
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '14px',
                }}
              >
                {showConfirmPassword ? '非表示' : '表示'}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-xs text-red-500">パスワードが一致しません</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !isPasswordValid || newPassword !== confirmPassword}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
          >
            {isLoading ? '変更中...' : 'パスワードを変更'}
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            ログアウト
          </button>
        </form>
      </div>
    </div>
  )
}