'use client'

/**
 * =====================================================
 * ECサイト - 購入手続きページ
 * =====================================================
 *
 * お客様情報入力 → Square決済へ
 * 決済完了後、在庫ステータスを更新
 * =====================================================
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '../CartContext'
import '../shop.css'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    emailConfirm: '',
    phone: '',
    postalCode: '',
    prefecture: '',
    city: '',
    address: '',
    building: '',
  })

  const formatPrice = (price: number) => {
    return price.toLocaleString()
  }

  const totalPrice = items.reduce((sum, item) => sum + item.sales_price, 0)

  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!form.name.trim()) return 'お名前を入力してください'
    if (!form.email.trim()) return 'メールアドレスを入力してください'
    if (form.email !== form.emailConfirm) return 'メールアドレスが一致しません'
    if (!form.phone.trim()) return '電話番号を入力してください'
    if (!form.postalCode.trim()) return '郵便番号を入力してください'
    if (!form.prefecture) return '都道府県を選択してください'
    if (!form.city.trim()) return '市区町村を入力してください'
    if (!form.address.trim()) return '番地を入力してください'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (items.length === 0) {
      setError('カートが空です')
      return
    }

    setLoading(true)

    try {
      // ここでSquare決済APIを呼び出し
      // 決済成功後、在庫ステータスを更新

      const response = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form,
          items: items.map(item => ({
            id: item.id,
            model: item.model,
            storage: item.storage,
            rank: item.rank,
            price: item.sales_price,
          })),
          totalPrice,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '決済処理に失敗しました')
      }

      // 成功時はカートをクリアして完了ページへ
      clearCart()
      router.push(`/shop/complete?order=${result.orderId}`)

    } catch (err) {
      console.error('決済エラー:', err)
      setError(err instanceof Error ? err.message : '決済処理に失敗しました。再度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <div style={{ width: '48px', height: '48px', margin: '0 auto var(--space-md)', color: '#D1D5DB' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '100%', height: '100%' }}>
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <p className="cart-empty-text">カートに商品がありません</p>
          <Link href="/shop" className="btn btn-primary">
            商品一覧を見る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="shop-container" style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: 'var(--space-lg)' }}>
        購入手続き
      </h1>

      {/* 注文内容 */}
      <div style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: 'var(--space-md)' }}>注文内容</h2>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
            <div>
              <span style={{ fontWeight: '500' }}>{item.display_name || item.model}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginLeft: 'var(--space-sm)' }}>
                {item.storage}GB
              </span>
            </div>
            <span style={{ fontWeight: '600' }}>¥{formatPrice(item.sales_price)}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-sm)', marginTop: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: '600' }}>合計（税込）</span>
          <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--color-danger)' }}>
            ¥{formatPrice(totalPrice)}
          </span>
        </div>
      </div>

      {/* お客様情報フォーム */}
      <form onSubmit={handleSubmit} className="support-form" style={{ maxWidth: '100%' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: 'var(--space-md)' }}>お客様情報</h2>

        {error && (
          <div style={{ padding: 'var(--space-md)', background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-md)' }}>
            {error}
          </div>
        )}

        <div className="support-form-group">
          <label className="support-form-label">
            お名前 <span className="support-form-required">*</span>
          </label>
          <input
            type="text"
            name="name"
            className="support-form-input"
            value={form.name}
            onChange={handleChange}
            placeholder="山田 太郎"
          />
        </div>

        <div className="support-form-group">
          <label className="support-form-label">
            メールアドレス <span className="support-form-required">*</span>
          </label>
          <input
            type="email"
            name="email"
            className="support-form-input"
            value={form.email}
            onChange={handleChange}
            placeholder="example@email.com"
          />
        </div>

        <div className="support-form-group">
          <label className="support-form-label">
            メールアドレス（確認） <span className="support-form-required">*</span>
          </label>
          <input
            type="email"
            name="emailConfirm"
            className="support-form-input"
            value={form.emailConfirm}
            onChange={handleChange}
            placeholder="example@email.com"
          />
        </div>

        <div className="support-form-group">
          <label className="support-form-label">
            電話番号 <span className="support-form-required">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            className="support-form-input"
            value={form.phone}
            onChange={handleChange}
            placeholder="090-1234-5678"
          />
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: 'var(--space-lg) 0 var(--space-md)' }}>配送先住所</h2>

        <div className="support-form-group">
          <label className="support-form-label">
            郵便番号 <span className="support-form-required">*</span>
          </label>
          <input
            type="text"
            name="postalCode"
            className="support-form-input"
            value={form.postalCode}
            onChange={handleChange}
            placeholder="123-4567"
            style={{ maxWidth: '200px' }}
          />
        </div>

        <div className="support-form-group">
          <label className="support-form-label">
            都道府県 <span className="support-form-required">*</span>
          </label>
          <select
            name="prefecture"
            className="support-form-select"
            value={form.prefecture}
            onChange={handleChange}
          >
            <option value="">選択してください</option>
            {prefectures.map(pref => (
              <option key={pref} value={pref}>{pref}</option>
            ))}
          </select>
        </div>

        <div className="support-form-group">
          <label className="support-form-label">
            市区町村 <span className="support-form-required">*</span>
          </label>
          <input
            type="text"
            name="city"
            className="support-form-input"
            value={form.city}
            onChange={handleChange}
            placeholder="渋谷区"
          />
        </div>

        <div className="support-form-group">
          <label className="support-form-label">
            番地 <span className="support-form-required">*</span>
          </label>
          <input
            type="text"
            name="address"
            className="support-form-input"
            value={form.address}
            onChange={handleChange}
            placeholder="神南1-2-3"
          />
        </div>

        <div className="support-form-group">
          <label className="support-form-label">
            建物名・部屋番号
          </label>
          <input
            type="text"
            name="building"
            className="support-form-input"
            value={form.building}
            onChange={handleChange}
            placeholder="○○マンション 101号室"
          />
        </div>

        <div style={{ marginTop: 'var(--space-lg)' }}>
          <button
            type="submit"
            className="support-form-submit"
            disabled={loading}
          >
            {loading ? '処理中...' : '決済画面へ進む'}
          </button>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 'var(--space-sm)' }}>
            次の画面でクレジットカード情報を入力します
          </p>
        </div>
      </form>
    </div>
  )
}
