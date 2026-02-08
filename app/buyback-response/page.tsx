'use client'

/**
 * =====================================================
 * WEB 買取承諾/返却選択ページ
 * =====================================================
 *
 * 本査定完了後、お客様が承諾または返却を選択するページ（WEB経由用）
 * LIFF版と同じ機能（/liff/buyback-response）をWEB用にコピー
 * =====================================================
 */

import { useEffect, useState, Suspense } from 'react'
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
  // 住所情報（返送先用）
  postal_code: string | null
  address: string | null
  address_detail: string | null
  phone: string | null
}

function BuybackResponseContent() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get('id')
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<RequestData | null>(null)
  const [phase, setPhase] = useState<'select' | 'bank-input' | 'return-address' | 'complete-approve' | 'complete-return'>('select')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 振込先情報
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    branchName: '',
    accountType: '普通',
    accountNumber: '',
    accountHolder: '',
  })

  // 返送先情報
  const [useSameAddress, setUseSameAddress] = useState(true)
  const [returnAddress, setReturnAddress] = useState({
    postalCode: '',
    address: '',
    addressDetail: '',
    phone: '',
  })

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      if (!requestId || !token) {
        setError('無効なURLです')
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('t_mail_buyback_requests')
          .select('id, request_number, customer_name, items, total_estimated_price, final_price, status, postal_code, address, address_detail, phone')
          .eq('id', requestId)
          .eq('request_number', token)
          .single()

        if (error || !data) {
          setError('データが見つかりません')
          return
        }
        setRequest(data)
        // 返送先の初期値をセット
        setReturnAddress({
          postalCode: data.postal_code || '',
          address: data.address || '',
          addressDetail: data.address_detail || '',
          phone: data.phone || '',
        })
      } catch (e) {
        console.error('データ取得エラー:', e)
        setError('エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [requestId, token])

  // 承諾処理
  const handleApprove = async () => {
    if (!request) return
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
      const { error } = await supabase
        .from('t_mail_buyback_requests')
        .update({
          status: 'waiting_payment',
          waiting_payment_at: new Date().toISOString(),
          bank_name: bankInfo.bankName,
          branch_name: bankInfo.branchName,
          account_type: bankInfo.accountType,
          account_number: bankInfo.accountNumber,
          account_holder: bankInfo.accountHolder,
        })
        .eq('id', request.id)

      if (error) throw error

      await fetch('/api/mail-buyback/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'waiting_payment', requestId: request.id }),
      })

      setPhase('complete-approve')
    } catch (e) {
      console.error('承諾エラー:', e)
      alert('エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  // 返却希望 → 住所入力画面へ
  const handleReject = () => {
    if (!request) return
    setPhase('return-address')
  }

  // 返送先登録＆返却確定
  const handleSubmitReturn = async () => {
    if (!request) return

    // 別住所の場合はバリデーション
    if (!useSameAddress) {
      if (!returnAddress.postalCode || !returnAddress.address || !returnAddress.phone) {
        alert('郵便番号、住所、電話番号を入力してください')
        return
      }
    }

    setSubmitting(true)
    try {
      // 返送先住所を決定
      const finalAddress = useSameAddress
        ? {
            return_postal_code: request.postal_code,
            return_address: request.address,
            return_address_detail: request.address_detail,
            return_phone: request.phone,
          }
        : {
            return_postal_code: returnAddress.postalCode,
            return_address: returnAddress.address,
            return_address_detail: returnAddress.addressDetail,
            return_phone: returnAddress.phone,
          }

      const { error } = await supabase
        .from('t_mail_buyback_requests')
        .update({
          status: 'return_requested',
          return_requested_at: new Date().toISOString(),
          ...finalAddress,
        })
        .eq('id', request.id)

      if (error) throw error

      await fetch('/api/mail-buyback/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'return_requested', requestId: request.id }),
      })

      setPhase('complete-return')
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

  if (error || !request) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <p>{error || 'データが見つかりません'}</p>
      </div>
    )
  }

  if (request.status !== 'assessed') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '20px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', textAlign: 'center', maxWidth: '400px' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
            {request.status === 'waiting_payment' && '✅ 既に承諾済みです。振込をお待ちください。'}
            {request.status === 'return_requested' && '返却希望を受け付け済みです'}
            {request.status === 'returned' && '端末は返送済みです'}
            {!['assessed', 'waiting_payment', 'return_requested', 'returned'].includes(request.status) && 'この申込みは現在処理中です'}
          </p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>申込番号: {request.request_number}</p>
        </div>
      </div>
    )
  }

  const finalPrice = request.final_price || request.total_estimated_price

  // 承諾完了画面
  if (phase === 'complete-approve') {
    // 現在時刻が19時以前か以降かで振込予定を変更
    const now = new Date()
    const hour = now.getHours()
    const isBefore19 = hour < 19

    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#10B981' }}>買取のご依頼ありがとうございます</h1>
            <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ marginBottom: '8px' }}><strong>振込金額:</strong> ¥{finalPrice.toLocaleString()}</div>
              <div style={{ marginBottom: '8px' }}><strong>振込先:</strong> {bankInfo.bankName} {bankInfo.branchName}</div>
              <div><strong>口座:</strong> {bankInfo.accountType} {bankInfo.accountNumber}</div>
            </div>
            <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '8px', textAlign: 'left', fontSize: '0.9rem', marginBottom: '20px' }}>
              <strong>振込予定</strong>
              <p style={{ margin: '8px 0 0', color: '#92400e' }}>
                {isBefore19
                  ? '19時までの振込依頼は、翌営業日の朝9時までにお振込みいたします。'
                  : '19時以降の振込依頼は、翌々営業日の朝9時までにお振込みいたします。'}
              </p>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>このまま画面を閉じてください。</p>
          </div>
        </div>
      </div>
    )
  }

  // 返却完了画面
  if (phase === 'complete-return') {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>回答ありがとうございます</h1>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              端末は後日ご返送いたします。
            </p>
            <p style={{ color: '#999', fontSize: '0.9rem' }}>
              このページを閉じてください。
            </p>
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
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.9rem' }}>支店名</label>
              <input
                type="text"
                value={bankInfo.branchName}
                onChange={(e) => setBankInfo({ ...bankInfo, branchName: e.target.value })}
                placeholder="例: 渋谷支店"
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.9rem' }}>口座種別</label>
              <select
                value={bankInfo.accountType}
                onChange={(e) => setBankInfo({ ...bankInfo, accountType: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
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
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.9rem' }}>口座名義（カナ）</label>
              <input
                type="text"
                value={bankInfo.accountHolder}
                onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                placeholder="例: タナカ タロウ"
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
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

  // 返送先住所入力画面
  if (phase === 'return-address') {
    const originalAddress = [
      request.postal_code ? `〒${request.postal_code}` : '',
      request.address || '',
      request.address_detail || '',
    ].filter(Boolean).join(' ')

    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px' }}>
            <h1 style={{ fontSize: '1.2rem', marginBottom: '20px', textAlign: 'center' }}>返送先住所</h1>

            {/* 同じ住所か別住所か選択 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', border: useSameAddress ? '2px solid #10B981' : '1px solid #ddd', borderRadius: '8px', marginBottom: '12px', cursor: 'pointer', background: useSameAddress ? '#f0fdf4' : 'white' }}>
                <input
                  type="radio"
                  checked={useSameAddress}
                  onChange={() => setUseSameAddress(true)}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>買取キットと同じ住所に返送</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>{originalAddress}</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', border: !useSameAddress ? '2px solid #10B981' : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: !useSameAddress ? '#f0fdf4' : 'white' }}>
                <input
                  type="radio"
                  checked={!useSameAddress}
                  onChange={() => setUseSameAddress(false)}
                  style={{ marginTop: '3px' }}
                />
                <div style={{ fontWeight: '600' }}>別の住所に返送</div>
              </label>
            </div>

            {/* 別住所の入力フォーム */}
            {!useSameAddress && (
              <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>郵便番号</label>
                  <input
                    type="text"
                    value={returnAddress.postalCode}
                    onChange={(e) => setReturnAddress({ ...returnAddress, postalCode: e.target.value })}
                    placeholder="例: 123-4567"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>住所</label>
                  <input
                    type="text"
                    value={returnAddress.address}
                    onChange={(e) => setReturnAddress({ ...returnAddress, address: e.target.value })}
                    placeholder="例: 東京都渋谷区..."
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>建物名・部屋番号</label>
                  <input
                    type="text"
                    value={returnAddress.addressDetail}
                    onChange={(e) => setReturnAddress({ ...returnAddress, addressDetail: e.target.value })}
                    placeholder="例: ○○マンション 101号室"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>電話番号</label>
                  <input
                    type="tel"
                    value={returnAddress.phone}
                    onChange={(e) => setReturnAddress({ ...returnAddress, phone: e.target.value })}
                    placeholder="例: 090-1234-5678"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

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
                onClick={handleSubmitReturn}
                disabled={submitting}
                style={{
                  flex: 2,
                  padding: '14px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#EF4444',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {submitting ? '送信中...' : '返却を依頼する'}
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
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '1.2rem', marginBottom: '8px', textAlign: 'center' }}>本査定結果</h1>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
            申込番号: {request.request_number}
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '16px', color: '#666' }}>査定端末</h2>
          {request.items.map((item, i) => (
            <div key={i} style={{ marginBottom: i < request.items.length - 1 ? '12px' : 0, paddingBottom: i < request.items.length - 1 ? '12px' : 0, borderBottom: i < request.items.length - 1 ? '1px solid #eee' : 'none' }}>
              <div style={{ fontWeight: '600' }}>{item.modelDisplayName} {item.storage}GB</div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>ランク: {item.rank}</div>
            </div>
          ))}
        </div>

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

export default function BuybackResponsePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>読み込み中...</div>}>
      <BuybackResponseContent />
    </Suspense>
  )
}
