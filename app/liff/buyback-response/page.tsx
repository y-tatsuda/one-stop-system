'use client'

/**
 * =====================================================
 * LIFF 買取承諾/返却選択ページ
 * =====================================================
 *
 * 本査定完了後、お客様が承諾または返却を選択するページ
 * 承諾の場合は振込先情報を入力
 * =====================================================
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

type RequestData = {
  id: number
  request_number: string
  customer_name: string
  items: Array<{
    modelDisplayName: string
    storage: string
    rank: string
    estimatedPrice: number
  }>
  total_estimated_price: number
  final_price: number | null
  status: string
}

export default function BuybackResponsePage() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get('id')

  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<RequestData | null>(null)
  const [phase, setPhase] = useState<'select' | 'bank-input' | 'complete'>('select')
  const [submitting, setSubmitting] = useState(false)

  // 振込先情報
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    branchName: '',
    accountType: '普通',
    accountNumber: '',
    accountHolder: '',
  })

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      if (!requestId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('t_mail_buyback_requests')
          .select('id, request_number, customer_name, items, total_estimated_price, final_price, status')
          .eq('id', requestId)
          .single()

        if (error) throw error
        setRequest(data)
      } catch (e) {
        console.error('データ取得エラー:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [requestId])

  // 承諾処理
  const handleApprove = async () => {
    if (!request) return

    // 振込先入力へ
    setPhase('bank-input')
  }

  // 振込先登録＆承諾確定
  const handleSubmitBank = async () => {
    if (!request) return
    if (!bankInfo.bankName || !bankInfo.branchName || !bankInfo.accountNumber || !bankInfo.accountHolder) {
      alert('すべての項目を入力してください')
      return
    }

    setSubmitting(true)
    try {
      // DB更新
      const { error } = await supabase
        .from('t_mail_buyback_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          bank_name: bankInfo.bankName,
          branch_name: bankInfo.branchName,
          account_type: bankInfo.accountType,
          account_number: bankInfo.accountNumber,
          account_holder: bankInfo.accountHolder,
        })
        .eq('id', request.id)

      if (error) throw error

      // 通知
      await fetch('/api/mail-buyback/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approved', requestId: request.id }),
      })

      setPhase('complete')
    } catch (e) {
      console.error('承諾エラー:', e)
      alert('エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  // 返却処理
  const handleReject = async () => {
    if (!request) return
    if (!confirm('返却を希望しますか？')) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('t_mail_buyback_requests')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
        })
        .eq('id', request.id)

      if (error) throw error

      // 通知
      await fetch('/api/mail-buyback/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rejected', requestId: request.id }),
      })

      alert('返却希望を受け付けました。\n端末は後日ご返送いたします。')
    } catch (e) {
      console.error('返却エラー:', e)
      alert('エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <p>読み込み中...</p>
      </div>
    )
  }

  if (!request) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <p>データが見つかりません</p>
      </div>
    )
  }

  if (request.status !== 'assessed') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '20px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', textAlign: 'center', maxWidth: '400px' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
            {request.status === 'approved' && '✅ 既に承諾済みです'}
            {request.status === 'rejected' && '返却希望を受け付け済みです'}
            {request.status === 'paid' && '✅ お振込み完了済みです'}
            {!['assessed', 'approved', 'rejected', 'paid'].includes(request.status) && 'この申込みは現在処理中です'}
          </p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>申込番号: {request.request_number}</p>
        </div>
      </div>
    )
  }

  const finalPrice = request.final_price || request.total_estimated_price

  // 完了画面
  if (phase === 'complete') {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
            <h1 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>承諾を受け付けました</h1>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              2営業日以内にお振込みいたします。
            </p>
            <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', textAlign: 'left' }}>
              <div style={{ marginBottom: '8px' }}><strong>振込金額:</strong> ¥{finalPrice.toLocaleString()}</div>
              <div style={{ marginBottom: '8px' }}><strong>振込先:</strong> {bankInfo.bankName} {bankInfo.branchName}</div>
              <div><strong>口座:</strong> {bankInfo.accountType} {bankInfo.accountNumber}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 振込先入力画面
  if (phase === 'bank-input') {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px' }}>
            <h1 style={{ fontSize: '1.2rem', marginBottom: '20px', textAlign: 'center' }}>振込先情報</h1>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.9rem' }}>銀行名</label>
              <input
                type="text"
                value={bankInfo.bankName}
                onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                placeholder="例: 三菱UFJ銀行"
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.9rem' }}>支店名</label>
              <input
                type="text"
                value={bankInfo.branchName}
                onChange={(e) => setBankInfo({ ...bankInfo, branchName: e.target.value })}
                placeholder="例: 渋谷支店"
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.9rem' }}>口座種別</label>
              <select
                value={bankInfo.accountType}
                onChange={(e) => setBankInfo({ ...bankInfo, accountType: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }}
              >
                <option value="普通">普通</option>
                <option value="当座">当座</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.9rem' }}>口座番号</label>
              <input
                type="text"
                value={bankInfo.accountNumber}
                onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                placeholder="例: 1234567"
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.9rem' }}>口座名義（カナ）</label>
              <input
                type="text"
                value={bankInfo.accountHolder}
                onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                placeholder="例: タナカ タロウ"
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }}
              />
            </div>

            <div style={{ background: '#FEF3C7', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem' }}>
              <strong>振込金額: ¥{finalPrice.toLocaleString()}</strong>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setPhase('select')}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  background: 'white',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                戻る
              </button>
              <button
                onClick={handleSubmitBank}
                disabled={submitting}
                style={{
                  flex: 2,
                  padding: '14px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#10B981',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {submitting ? '送信中...' : '承諾する'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 選択画面
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '1.2rem', marginBottom: '8px', textAlign: 'center' }}>本査定結果</h1>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
            申込番号: {request.request_number}
          </p>
        </div>

        {/* 端末情報 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '16px', color: '#666' }}>査定端末</h2>
          {request.items.map((item, i) => (
            <div key={i} style={{ marginBottom: i < request.items.length - 1 ? '12px' : 0, paddingBottom: i < request.items.length - 1 ? '12px' : 0, borderBottom: i < request.items.length - 1 ? '1px solid #eee' : 'none' }}>
              <div style={{ fontWeight: '600' }}>{item.modelDisplayName} {item.storage}GB</div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>ランク: {item.rank}</div>
            </div>
          ))}
        </div>

        {/* 価格 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#666' }}>事前査定</span>
            <span>¥{request.total_estimated_price.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '2px solid #eee' }}>
            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>本査定</span>
            <span style={{ fontWeight: '700', fontSize: '1.3rem', color: '#10B981' }}>¥{finalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleApprove}
            disabled={submitting}
            style={{
              padding: '18px',
              border: 'none',
              borderRadius: '12px',
              background: '#10B981',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            承諾する（振込先を入力）
          </button>
          <button
            onClick={handleReject}
            disabled={submitting}
            style={{
              padding: '18px',
              border: '2px solid #EF4444',
              borderRadius: '12px',
              background: 'white',
              color: '#EF4444',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            返却を希望する
          </button>
        </div>
      </div>
    </div>
  )
}
