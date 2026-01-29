'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

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
  login: (token: string, staffData: Staff) => void
  logout: () => void
  updatePasswordChanged: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 認証不要のパス
const PUBLIC_PATHS = ['/login', '/invite', '/change-password']

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
  const router = useRouter()
  const pathname = usePathname()

  // 初期化時にトークンをチェック
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('auth_token')
        
        if (!token) {
          setStaff(null)
          setIsLoading(false)
          return
        }

        // トークンをデコード（UTF-8対応）
        const tokenData: TokenData = JSON.parse(decodeBase64UTF8(token))
        
        // 有効期限チェック
        if (tokenData.exp < Date.now()) {
          localStorage.removeItem('auth_token')
          setStaff(null)
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
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // 認証状態に応じたリダイレクト
  useEffect(() => {
    if (isLoading) return

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
  }, [staff, isLoading, pathname, router])

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
