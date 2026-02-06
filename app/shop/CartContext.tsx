'use client'

/**
 * =====================================================
 * カートコンテキスト
 * =====================================================
 *
 * LocalStorageベースのショッピングカート
 * =====================================================
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type CartItem = {
  id: number
  model: string
  storage: number
  rank: string
  sales_price: number
  battery_percent: number | null
  display_name?: string
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: number) => void
  clearCart: () => void
  itemCount: number
}

const CartContext = createContext<CartContextType | null>(null)

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // LocalStorageから復元
  useEffect(() => {
    const saved = localStorage.getItem('one-stop-cart')
    if (saved) {
      try {
        setItems(JSON.parse(saved))
      } catch {
        // ignore
      }
    }
    setIsLoaded(true)
  }, [])

  // LocalStorageに保存
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('one-stop-cart', JSON.stringify(items))
    }
  }, [items, isLoaded])

  const addItem = (item: CartItem) => {
    setItems(prev => {
      // 同じIDがあれば追加しない（中古品は1点もの）
      if (prev.some(i => i.id === item.id)) {
        return prev
      }
      return [...prev, item]
    })
  }

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const clearCart = () => {
    setItems([])
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, itemCount: items.length }}>
      {children}
    </CartContext.Provider>
  )
}
