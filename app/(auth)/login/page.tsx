'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type LoginStep = 'credentials' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<LoginStep>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [staffId, setStaffId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // ログイン（1段階目）
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      if (data.requiresOTP) {
        setStaffId(data.staffId)
        setMessage(data.message)
        setStep('otp')
      } else {
        router.push('/')
      }
    } catch (err) {
      setError('ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // OTP検証（2段階目）
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, otpCode })
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      router.push('/')
    } catch (err) {
      setError('認証に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // OTP再送信
  const handleResendOTP = async () => {
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId })
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      setMessage(data.message)
    } catch (err) {
      setError('再送信に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setStep('credentials')
    setOtpCode('')
    setError('')
    setMessage('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">ONE STOP</h1>
          <p className="text-gray-500 mt-2">
            {step === 'credentials' ? 'ログイン' : '2段階認証'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-sm">
            {message}
          </div>
        )}

        {step === 'credentials' && (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>

            <div className="mt-4 text-center">
              <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                パスワードをお忘れですか？
              </a>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP}>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                {email} に認証コードを送信しました。
                <br />
                メールに記載された6桁のコードを入力してください。
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                認証コード
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">※ コードは5分間有効です</p>
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
            >
              {isLoading ? '確認中...' : '認証する'}
            </button>

            <div className="mt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-gray-600 hover:underline"
              >
                ← 戻る
              </button>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:underline disabled:text-blue-300"
              >
                コードを再送信
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}