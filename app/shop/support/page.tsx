'use client'

/**
 * =====================================================
 * ECサイト - サポート・お問い合わせページ
 * =====================================================
 *
 * IMEI検索で保証状況確認機能付き
 * お問い合わせフォーム
 * =====================================================
 */

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { DEFAULT_TENANT_ID } from '../../lib/constants'
import '../shop.css'

type WarrantyInfo = {
  model: string
  storage: number
  saleDate: string
  daysSinceSale: number
  stage: number
  refundRate: number
  repairRate: number
  daysUntilNextStage: number
  expired: boolean
}

export default function SupportPage() {
  const [imei, setImei] = useState('')
  const [warrantyInfo, setWarrantyInfo] = useState<WarrantyInfo | null>(null)
  const [warrantyLoading, setWarrantyLoading] = useState(false)
  const [warrantyError, setWarrantyError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    imei: '',
    inquiryType: '',
    message: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  const handleWarrantyCheck = async () => {
    if (!imei.trim()) {
      setWarrantyError('IMEIを入力してください')
      return
    }

    setWarrantyLoading(true)
    setWarrantyError('')
    setWarrantyInfo(null)

    try {
      // IMEIで在庫を検索（販売済みのもの）
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('t_used_inventory')
        .select('id, model, storage')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('imei', imei.trim())
        .eq('status', '販売済')
        .single()

      if (inventoryError || !inventoryData) {
        setWarrantyError('この端末の情報が見つかりませんでした。IMEIをご確認ください。')
        return
      }

      // 販売日を取得
      const { data: detailData } = await supabase
        .from('t_sales_details')
        .select('sales_id')
        .eq('used_inventory_id', inventoryData.id)
        .limit(1)
        .single()

      if (!detailData?.sales_id) {
        setWarrantyError('販売情報が見つかりませんでした。')
        return
      }

      const { data: salesData } = await supabase
        .from('t_sales')
        .select('sale_date')
        .eq('id', detailData.sales_id)
        .single()

      if (!salesData?.sale_date) {
        setWarrantyError('販売日情報が見つかりませんでした。')
        return
      }

      // 保証情報を計算
      const saleDate = new Date(salesData.sale_date)
      const today = new Date()
      const diffTime = today.getTime() - saleDate.getTime()
      const daysSinceSale = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      const expired = daysSinceSale > 360
      const stage = expired ? -1 : Math.floor(daysSinceSale / 60)
      const refundRate = stage >= 0 ? 100 - (stage * 10) : 0
      const repairRate = stage >= 0 ? stage * 10 : 0
      const nextStageDay = (stage + 1) * 60
      const daysUntilNextStage = Math.max(0, nextStageDay - daysSinceSale)

      setWarrantyInfo({
        model: inventoryData.model,
        storage: inventoryData.storage,
        saleDate: salesData.sale_date,
        daysSinceSale,
        stage,
        refundRate,
        repairRate,
        daysUntilNextStage,
        expired,
      })
    } catch (error) {
      console.error('保証確認エラー:', error)
      setWarrantyError('確認中にエラーが発生しました。')
    } finally {
      setWarrantyLoading(false)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess(false)

    if (!form.name.trim() || !form.email.trim() || !form.inquiryType || !form.message.trim()) {
      setFormError('必須項目を入力してください')
      return
    }

    setFormLoading(true)

    try {
      // お問い合わせを保存
      const { error } = await supabase
        .from('shop_inquiries')
        .insert({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          imei: form.imei || null,
          inquiry_type: form.inquiryType,
          message: form.message,
          status: '未対応',
        })

      if (error) throw error

      setFormSuccess(true)
      setForm({
        name: '',
        email: '',
        phone: '',
        imei: '',
        inquiryType: '',
        message: '',
      })
    } catch (error) {
      console.error('送信エラー:', error)
      setFormError('送信に失敗しました。再度お試しください。')
    } finally {
      setFormLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <div className="content-page">
      <h1>サポート・お問い合わせ</h1>

      {/* 保証状況確認 */}
      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <h2>保証状況を確認する</h2>
        <p>IMEIを入力すると、保証期間と現在の保証状況を確認できます。</p>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
          <input
            type="text"
            className="support-form-input"
            placeholder="IMEI番号を入力（15桁）"
            value={imei}
            onChange={(e) => setImei(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleWarrantyCheck}
            disabled={warrantyLoading}
          >
            {warrantyLoading ? '確認中...' : '確認する'}
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          IMEIの確認方法: 設定 → 一般 → 情報 → IMEI
        </p>

        {warrantyError && (
          <div style={{ padding: 'var(--space-md)', background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius)', marginTop: 'var(--space-md)' }}>
            {warrantyError}
          </div>
        )}

        {warrantyInfo && (
          <div style={{ padding: 'var(--space-lg)', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', marginTop: 'var(--space-md)' }}>
            <h3 style={{ margin: '0 0 var(--space-md) 0' }}>保証状況</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>機種</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: '600' }}>{warrantyInfo.model}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>容量</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: '600' }}>{warrantyInfo.storage}GB</p>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>購入日</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: '600' }}>{formatDate(warrantyInfo.saleDate)}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>経過日数</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: '600' }}>{warrantyInfo.daysSinceSale}日</p>
              </div>
            </div>

            {warrantyInfo.expired ? (
              <div style={{ padding: 'var(--space-md)', background: 'var(--color-danger-light)', borderRadius: 'var(--radius)', color: 'var(--color-danger)' }}>
                <strong>保証期間が終了しています</strong>
                <p style={{ margin: 'var(--space-xs) 0 0 0', fontSize: '0.9rem' }}>
                  360日の保証期間が終了しました。有料での修理対応は可能です。
                </p>
              </div>
            ) : (
              <div style={{ padding: 'var(--space-md)', background: 'var(--color-success-light)', borderRadius: 'var(--radius)', color: 'var(--color-success)' }}>
                <strong>保証期間内です</strong>
                <p style={{ margin: 'var(--space-xs) 0 0 0', fontSize: '0.9rem' }}>
                  返金率: {warrantyInfo.refundRate}% / 修理負担: {warrantyInfo.repairRate}%
                </p>
                {warrantyInfo.daysUntilNextStage > 0 && warrantyInfo.stage < 5 && (
                  <p style={{ margin: 'var(--space-xs) 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
                    次の保証段階まで: あと{warrantyInfo.daysUntilNextStage}日
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* お問い合わせフォーム */}
      <section>
        <h2>お問い合わせフォーム</h2>

        {formSuccess ? (
          <div style={{ padding: 'var(--space-lg)', background: 'var(--color-success-light)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-success)' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 style={{ color: 'var(--color-success)', margin: '0 0 var(--space-sm) 0' }}>
              お問い合わせを受け付けました
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              1〜2営業日以内にご連絡いたします。
            </p>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="support-form" style={{ maxWidth: '100%' }}>
            {formError && (
              <div style={{ padding: 'var(--space-md)', background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-md)' }}>
                {formError}
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
                onChange={handleFormChange}
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
                onChange={handleFormChange}
              />
            </div>

            <div className="support-form-group">
              <label className="support-form-label">
                電話番号
              </label>
              <input
                type="tel"
                name="phone"
                className="support-form-input"
                value={form.phone}
                onChange={handleFormChange}
              />
            </div>

            <div className="support-form-group">
              <label className="support-form-label">
                IMEI番号（お分かりの場合）
              </label>
              <input
                type="text"
                name="imei"
                className="support-form-input"
                value={form.imei}
                onChange={handleFormChange}
                placeholder="設定→一般→情報で確認可能"
              />
            </div>

            <div className="support-form-group">
              <label className="support-form-label">
                お問い合わせ種別 <span className="support-form-required">*</span>
              </label>
              <select
                name="inquiryType"
                className="support-form-select"
                value={form.inquiryType}
                onChange={handleFormChange}
              >
                <option value="">選択してください</option>
                <option value="保証申請">保証申請</option>
                <option value="商品について">商品について</option>
                <option value="配送について">配送について</option>
                <option value="返品・交換">返品・交換</option>
                <option value="データ移行">データ移行サポート</option>
                <option value="その他">その他</option>
              </select>
            </div>

            <div className="support-form-group">
              <label className="support-form-label">
                お問い合わせ内容 <span className="support-form-required">*</span>
              </label>
              <textarea
                name="message"
                className="support-form-textarea"
                value={form.message}
                onChange={handleFormChange}
                placeholder="症状やお困りの内容を詳しくお聞かせください"
              />
            </div>

            <button
              type="submit"
              className="support-form-submit"
              disabled={formLoading}
            >
              {formLoading ? '送信中...' : '送信する'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
