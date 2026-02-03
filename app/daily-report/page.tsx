'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_TENANT_ID } from '../lib/constants'
import { Shop } from '../lib/types'

type Staff = {
  id: number
  name: string
}

type DailySummary = {
  totalSales: number
  repairCount: number
  buybackCount: number
  salesCount: number
  accessoryCount: number
  dataTransferCount: number
}

type CategoryBreakdown = {
  category: string
  count: number
  amount: number
}

export default function DailyReportPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [summary, setSummary] = useState<DailySummary>({
    totalSales: 0,
    repairCount: 0,
    buybackCount: 0,
    salesCount: 0,
    accessoryCount: 0,
    dataTransferCount: 0,
  })
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([])

  // フォーム
  const [formData, setFormData] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    shopId: '',
    staffId: '',
    memo: '',
  })

  // 既存の日報
  const [existingReport, setExistingReport] = useState<{
    id: number
    sent_to_chat: boolean
    sent_at: string | null
  } | null>(null)

  // 初期データ取得
  useEffect(() => {
    async function fetchInitialData() {
      const { data: shopsData } = await supabase
        .from('m_shops')
        .select('id, name')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('is_active', true)
        .order('id')

      const { data: staffData } = await supabase
        .from('m_staff')
        .select('id, name')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('is_active', true)
        .order('id')

      setShops(shopsData || [])
      setStaff(staffData || [])

      if (shopsData && shopsData.length > 0) {
        setFormData(prev => ({ ...prev, shopId: shopsData[0].id.toString() }))
      }

      setLoading(false)
    }

    fetchInitialData()
  }, [])

  // 日付・店舗変更時にデータ集計
  useEffect(() => {
    async function fetchDailyData() {
      if (!formData.shopId || !formData.reportDate) return

      const shopId = parseInt(formData.shopId)

      // 売上データ取得
      const { data: salesData } = await supabase
        .from('t_sales')
        .select(`
          id,
          total_amount,
          t_sales_details (
            category,
            quantity,
            amount
          )
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('shop_id', shopId)
        .eq('sale_date', formData.reportDate)

      // 買取データ取得
      const { data: buybackData } = await supabase
        .from('t_buyback')
        .select('id')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('shop_id', shopId)
        .eq('buyback_date', formData.reportDate)

      // 集計
      let totalSales = 0
      let repairCount = 0
      let salesCount = 0
      let accessoryCount = 0
      let dataTransferCount = 0
      const categoryMap: Record<string, { count: number; amount: number }> = {}

      if (salesData) {
        for (const sale of salesData) {
          totalSales += sale.total_amount || 0

          const details = sale.t_sales_details as Array<{
            category: string
            quantity: number
            amount: number
          }> | null

          if (details) {
            for (const detail of details) {
              const cat = detail.category
              const qty = detail.quantity || 1
              const amt = detail.amount || 0

              if (!categoryMap[cat]) {
                categoryMap[cat] = { count: 0, amount: 0 }
              }
              categoryMap[cat].count += qty
              categoryMap[cat].amount += amt

              if (cat === 'iPhone修理' || cat === 'Android修理' || cat === 'iPad修理') {
                repairCount += qty
              } else if (cat === '中古販売') {
                salesCount += qty
              } else if (cat === 'アクセサリ') {
                accessoryCount += qty
              } else if (cat === 'データ移行') {
                dataTransferCount += qty
              }
            }
          }
        }
      }

      setSummary({
        totalSales,
        repairCount,
        buybackCount: buybackData?.length || 0,
        salesCount,
        accessoryCount,
        dataTransferCount,
      })

      setBreakdown(
        Object.entries(categoryMap).map(([category, data]) => ({
          category,
          count: data.count,
          amount: data.amount,
        }))
      )

      // 既存の日報確認
      const { data: reportData } = await supabase
        .from('t_daily_reports')
        .select('id, memo, sent_to_chat, sent_at, staff_id')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('shop_id', shopId)
        .eq('report_date', formData.reportDate)
        .single()

      if (reportData) {
        setExistingReport({
          id: reportData.id,
          sent_to_chat: reportData.sent_to_chat,
          sent_at: reportData.sent_at,
        })
        setFormData(prev => ({
          ...prev,
          memo: reportData.memo || '',
          staffId: reportData.staff_id?.toString() || '',
        }))
      } else {
        setExistingReport(null)
        setFormData(prev => ({ ...prev, memo: '' }))
      }
    }

    fetchDailyData()
  }, [formData.shopId, formData.reportDate])

  // 日報保存
  const saveReport = async () => {
    if (!formData.shopId || !formData.staffId) {
      alert('店舗と担当者を選択してください')
      return
    }

    setSaving(true)

    const reportData = {
      tenant_id: DEFAULT_TENANT_ID,
      shop_id: parseInt(formData.shopId),
      staff_id: parseInt(formData.staffId),
      report_date: formData.reportDate,
      total_sales: summary.totalSales,
      repair_count: summary.repairCount,
      buyback_count: summary.buybackCount,
      sales_count: summary.salesCount,
      memo: formData.memo || null,
    }

    if (existingReport) {
      // 更新
      const { error } = await supabase
        .from('t_daily_reports')
        .update({ ...reportData, updated_at: new Date().toISOString() })
        .eq('id', existingReport.id)

      if (error) {
        alert('更新に失敗しました: ' + error.message)
        setSaving(false)
        return
      }
    } else {
      // 新規作成
      const { data, error } = await supabase
        .from('t_daily_reports')
        .insert(reportData)
        .select('id')
        .single()

      if (error) {
        alert('保存に失敗しました: ' + error.message)
        setSaving(false)
        return
      }

      setExistingReport({
        id: data.id,
        sent_to_chat: false,
        sent_at: null,
      })
    }

    setSaving(false)
    alert(existingReport ? '更新しました' : '保存しました')
  }

  // 日報テキスト生成
  const generateReportText = () => {
    const shopName = shops.find(s => s.id === parseInt(formData.shopId))?.name || ''
    const totalSalesTaxIncluded = Math.floor(summary.totalSales * 1.1)
    const lines = [
      `【${formData.reportDate} ${shopName} 日報】`,
      '',
      `■ 売上合計: ¥${summary.totalSales.toLocaleString()}（税込 ¥${totalSalesTaxIncluded.toLocaleString()}）`,
      '',
      '■ 件数',
      `  修理: ${summary.repairCount}件`,
      `  買取: ${summary.buybackCount}件`,
      `  中古販売: ${summary.salesCount}件`,
      `  アクセサリ: ${summary.accessoryCount}件`,
      `  データ移行: ${summary.dataTransferCount}件`,
    ]

    if (breakdown.length > 0) {
      lines.push('')
      lines.push('■ カテゴリ別（税抜）')
      for (const item of breakdown) {
        lines.push(`  ${item.category}: ${item.count}件 ¥${item.amount.toLocaleString()}`)
      }
    }

    if (formData.memo) {
      lines.push('')
      lines.push('■ 特記事項')
      lines.push(formData.memo)
    }

    return lines.join('\n')
  }

  // クリップボードにコピー
  const copyToClipboard = async () => {
    const text = generateReportText()
    await navigator.clipboard.writeText(text)
    alert('クリップボードにコピーしました')
  }

  // Google Chat送信
  const sendToChat = async () => {
    if (!existingReport) {
      alert('先に日報を保存してください')
      return
    }

    // 送信済みフラグ更新
    const { error } = await supabase
      .from('t_daily_reports')
      .update({ sent_to_chat: true, sent_at: new Date().toISOString() })
      .eq('id', existingReport.id)

    if (error) {
      alert('更新に失敗しました')
      return
    }

    setExistingReport({ ...existingReport, sent_to_chat: true, sent_at: new Date().toISOString() })
    alert('送信しました（※Webhook URL設定後に実際の送信が有効になります）')
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
        <h1 className="page-title">日報入力</h1>
      </div>

      {/* 基本情報 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">基本情報</h2>
        </div>
        <div className="card-body">
          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label className="form-label">日付</label>
              <input
                type="date"
                value={formData.reportDate}
                onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">店舗</label>
              <select
                value={formData.shopId}
                onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                className="form-select"
              >
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">担当者</label>
              <select
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                className="form-select"
              >
                <option value="">選択してください</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* サマリー */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">本日の実績</h2>
        </div>
        <div className="card-body">
          {/* 売上合計 */}
          <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 500, marginBottom: '4px' }}>売上合計（税抜）</p>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>¥{summary.totalSales.toLocaleString()}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginTop: '4px' }}>税込 ¥{Math.floor(summary.totalSales * 1.1).toLocaleString()}</p>
          </div>

          {/* 件数 */}
          <div className="stat-grid stat-grid-5">
            <div className="stat-card">
              <div className="stat-label">修理</div>
              <div className="stat-value">{summary.repairCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">買取</div>
              <div className="stat-value">{summary.buybackCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">中古販売</div>
              <div className="stat-value">{summary.salesCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">アクセサリ</div>
              <div className="stat-value">{summary.accessoryCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">データ移行</div>
              <div className="stat-value">{summary.dataTransferCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* カテゴリ別内訳 */}
      {breakdown.length > 0 && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="card-title">カテゴリ別内訳</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>カテゴリ</th>
                    <th className="text-right">件数</th>
                    <th className="text-right">金額（税抜）</th>
                    <th className="text-right">税込</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((item, index) => (
                    <tr key={index}>
                      <td>{item.category}</td>
                      <td className="text-right">{item.count}件</td>
                      <td className="text-right">¥{item.amount.toLocaleString()}</td>
                      <td className="text-right text-secondary">¥{Math.floor(item.amount * 1.1).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 特記事項 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">特記事項</h2>
        </div>
        <div className="card-body">
          <textarea
            value={formData.memo}
            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
            placeholder="今日の出来事、引き継ぎ事項など..."
            className="form-textarea"
            rows={4}
          />
        </div>
      </div>

      {/* ステータス表示 */}
      {existingReport && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="card-title">ステータス</h2>
          </div>
          <div className="card-body">
            <div className="flex items-center gap-md">
              <span className={`badge ${existingReport.sent_to_chat ? 'badge-success' : 'badge-gray'}`} style={{ padding: '8px 16px' }}>
                {existingReport.sent_to_chat ? '送信済み' : '未送信'}
              </span>
              {existingReport.sent_at && (
                <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
                  送信日時: {new Date(existingReport.sent_at).toLocaleString('ja-JP')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex flex-wrap gap-md justify-end">
        <button
          onClick={copyToClipboard}
          className="btn btn-secondary"
        >
          コピー
        </button>
        <button
          onClick={sendToChat}
          disabled={!existingReport}
          className="btn btn-primary"
        >
          Chat送信
        </button>
        <button
          onClick={saveReport}
          disabled={saving}
          className="btn btn-success"
        >
          {saving ? '保存中...' : (existingReport ? '更新' : '保存')}
        </button>
      </div>
    </div>
  )
}