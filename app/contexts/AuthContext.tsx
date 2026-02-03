'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

// スタッフ情報の型定義
interface Staff {
  id: number
  name: string
  email: string
  role: string
  tenant_id: number
  password_changed: boolean
}

// 認証トークンの型定義
interface TokenData {
  staffId: number
  name: string
  email: string
  role: string
  tenantId: number
  passwordChanged: boolean
  exp: number
}

// コンテキストの型定義
interface AuthContextType {
  staff: Staff | null
  isAuthenticated: boolean
  isLoading: boolean
  isKioskMode: boolean
  login: (token: string, staffData: Staff) => void
  logout: () => void
  updatePasswordChanged: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 認証不要のパス
const PUBLIC_PATHS = ['/login', '/invite', '/change-password', '/buyback-kiosk', '/buyback-mail']

// UTF-8対応のBase64デコード
function decodeBase64UTF8(str: string): string {
  const bytes = Uint8Array.from(atob(str), c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

// UTF-8対応のBase64エンコード
function encodeBase64UTF8(str: string): string {
  const bytes = new TextEncoder().encode(str)
  return btoa(String.fromCharCode(...bytes))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isKioskMode, setIsKioskMode] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // キオスクモードかどうかを判定（URLパラメータから）
  const kioskParam = searchParams.get('kiosk')
  const isKioskRequest = kioskParam === 'true'

  // 初期認証チェック（一度だけ実行）
  useEffect(() => {
    const initAuth = async () => {
      // キオスクモードの場合
      if (isKioskRequest) {
        try {
          const res = await fetch('/api/kiosk/auth')
          const data = await res.json()
          if (data.authenticated) {
            setIsKioskMode(true)
            setAuthChecked(true)
            setIsLoading(false)
            return
          } else {
            // キオスク認証失敗 → キオスクログインへ
            window.location.href = '/buyback-kiosk/login'
            return
          }
        } catch {
          window.location.href = '/buyback-kiosk/login'
          return
        }
      }

      // 通常モードの場合
      try {
        const token = localStorage.getItem('auth_token')

        if (!token) {
          // トークンがない場合、KIOSK Cookieがあるかフォールバックチェック
          // （Square POS戻り時など、URLにkiosk=trueがない場合の救済）
          try {
            const kioskRes = await fetch('/api/kiosk/auth')
            const kioskData = await kioskRes.json()
            if (kioskData.authenticated) {
              setIsKioskMode(true)
              setAuthChecked(true)
              setIsLoading(false)
              return
            }
          } catch {}
          setStaff(null)
          setAuthChecked(true)
          setIsLoading(false)
          return
        }

        // トークンをデコード（UTF-8対応）
        const tokenData: TokenData = JSON.parse(decodeBase64UTF8(token))

        // 有効期限チェック
        if (tokenData.exp < Date.now()) {
          localStorage.removeItem('auth_token')
          setStaff(null)
          setAuthChecked(true)
          setIsLoading(false)
          return
        }

        // スタッフ情報を設定
        setStaff({
          id: tokenData.staffId,
          name: tokenData.name,
          email: tokenData.email,
          role: tokenData.role,
          tenant_id: tokenData.tenantId,
          password_changed: tokenData.passwordChanged
        })
      } catch (error) {
        console.error('認証チェックエラー:', error)
        localStorage.removeItem('auth_token')
        setStaff(null)
      } finally {
        setAuthChecked(true)
        setIsLoading(false)
      }
    }

    initAuth()
  }, [isKioskRequest])

  // 認証状態に応じたリダイレクト
  useEffect(() => {
    // 認証チェックが完了していない場合は何もしない
    if (!authChecked || isLoading) return

    // キオスクモードの場合はリダイレクトしない
    if (isKioskMode || isKioskRequest) return

    const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path))

    if (!staff && !isPublicPath) {
      // 未認証で保護されたページにアクセス → ログインへ
      router.replace('/login')
    } else if (staff && pathname === '/login') {
      // 認証済みでログインページにアクセス
      if (!staff.password_changed) {
        // パスワード未変更 → パスワード変更画面へ
        router.replace('/change-password')
      } else {
        // パスワード変更済み → ホームへ
        router.replace('/')
      }
    } else if (staff && !staff.password_changed && pathname !== '/change-password') {
      // パスワード未変更で他のページにアクセス → パスワード変更画面へ
      router.replace('/change-password')
    }
  }, [staff, authChecked, isLoading, pathname, router, isKioskMode, isKioskRequest])

  // ログイン処理
  const login = (token: string, staffData: Staff) => {
    localStorage.setItem('auth_token', token)
    setStaff(staffData)
  }

  // ログアウト処理
  const logout = () => {
    localStorage.removeItem('auth_token')
    setStaff(null)
    router.replace('/login')
  }

  // パスワード変更完了後の処理
  const updatePasswordChanged = () => {
    if (staff) {
      const updatedStaff = { ...staff, password_changed: true }
      setStaff(updatedStaff)

      // トークンも更新（UTF-8対応）
      const token = localStorage.getItem('auth_token')
      if (token) {
        const tokenData: TokenData = JSON.parse(decodeBase64UTF8(token))
        tokenData.passwordChanged = true
        const newToken = encodeBase64UTF8(JSON.stringify(tokenData))
        localStorage.setItem('auth_token', newToken)
      }
    }
  }

  return (
    <AuthContext.Provider value={{
      staff,
      isAuthenticated: !!staff,
      isLoading,
      isKioskMode,
      login,
      logout,
      updatePasswordChanged
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// カスタムフック
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
