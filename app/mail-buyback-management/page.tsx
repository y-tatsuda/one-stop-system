'use client'

/**
 * =====================================================
 * 郵送買取管理ページ
 * =====================================================
 *
 * 【役割】
 * - 郵送買取申込みの一覧表示・進捗管理
 * - キット送付、本査定、振込などのアクション
 *
 * 【フロー】
 * pending → kit_sent → arrived → assessing → assessed → approved/rejected → paid → completed
 *
 * 【関連ファイル】
 * - /app/buyback-mail/page.tsx（申込みフォーム）
 * - /app/api/mail-buyback/route.ts（申込みAPI）
 * - /docs/mail-buyback-flow.md（設計ドキュメント）
 * =====================================================
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ステータス定義
const STATUS_CONFIG = {
  pending: { label: '申込受付', color: '#6B7280', next: 'kit_sent' },
  kit_sent: { label: 'キット送付済', color: '#3B82F6', next: 'arrived' },
  arrived: { label: '端末到着', color: '#8B5CF6', next: 'assessing' },
  assessing: { label: '本査定中', color: '#F59E0B', next: 'assessed' },
  assessed: { label: '承諾待ち', color: '#EC4899', next: null },
  approved: { label: '承諾済', color: '#10B981', next: 'paid' },
  rejected: { label: '返却希望', color: '#EF4444', next: 'returned' },
  paid: { label: '振込完了', color: '#059669', next: 'completed' },
  completed: { label: '完了', color: '#374151', next: null },
  returned: { label: '返送完了', color: '#9CA3AF', next: null },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

type MailBuybackRequest = {
  id: number
  request_number: string
  status: StatusKey
  customer_name: string
  customer_name_kana: string | null
  phone: string
  email: string | null
  postal_code: string | null
  address: string | null
  address_detail: string | null
  items: Array<{
    modelDisplayName: string
    storage: string
    rank: string
    estimatedPrice: number
  }>
  total_estimated_price: number
  final_price: number | null
  item_count: number
  line_user_id: string | null
  source: 'web' | 'liff'
  created_at: string
  kit_sent_at: string | null
  arrived_at: string | null
  assessed_at: string | null
  approved_at: string | null
  rejected_at: string | null
  paid_at: string | null
  bank_name: string | null
  branch_name: string | null
  account_type: string | null
  account_number: string | null
  account_holder: string | null
  staff_notes: string | null
}

export default function MailBuybackManagementPage() {
  const [requests, setRequests] = useState<MailBuybackRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<MailBuybackRequest | null>(null)
  const [filterStatus, setFilterStatus] = useState<StatusKey | 'all'>('all')
  const [filterSource, setFilterSource] = useState<'all' | 'liff' | 'web'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // データ取得
  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('t_mail_buyback_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }
      if (filterSource !== 'all') {
        query = query.eq('source', filterSource)
      }

      const { data, error } = await query

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterSource])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // ステータス更新
  const updateStatus = async (id: number, newStatus: StatusKey, additionalData?: Record<string, unknown>) => {
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        ...additionalData,
      }

      // ステータスに応じて日時を記録
      const now = new Date().toISOString()
      switch (newStatus) {
        case 'kit_sent':
          updateData.kit_sent_at = now
          break
        case 'arrived':
          updateData.arrived_at = now
          break
        case 'assessed':
          updateData.assessed_at = now
          break
        case 'approved':
          updateData.approved_at = now
          break
        case 'rejected':
          updateData.rejected_at = now
          break
        case 'paid':
          updateData.paid_at = now
          break
        case 'completed':
          updateData.completed_at = now
          break
        case 'returned':
          updateData.returned_at = now
          break
      }

      const { error } = await supabase
        .from('t_mail_buyback_requests')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      // 通知を送信（kit_sent, assessed, approved, rejected, paid）
      const notifyActions = ['kit_sent', 'assessed', 'approved', 'rejected', 'paid']
      if (notifyActions.includes(newStatus)) {
        try {
          const notifyRes = await fetch('/api/mail-buyback/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: newStatus, requestId: id }),
          })
          const notifyResult = await notifyRes.json()
          console.log('通知結果:', notifyResult)
        } catch (notifyError) {
          console.error('通知エラー:', notifyError)
          // 通知エラーでもステータス更新は成功とする
        }
      }

      await fetchRequests()
      setSelectedRequest(null)
      alert('ステータスを更新しました')
    } catch (error) {
      console.error('ステータス更新エラー:', error)
      alert('エラーが発生しました')
    }
  }

  // 削除処理
  const deleteRequest = async (id: number, requestNumber: string) => {
    if (!confirm(`${requestNumber} を削除しますか？\n\nこの操作は取り消せません。`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('t_mail_buyback_requests')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchRequests()
      setSelectedRequest(null)
      alert('削除しました')
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  // 検索フィルター
  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      req.request_number.toLowerCase().includes(q) ||
      req.customer_name.toLowerCase().includes(q) ||
      req.phone.includes(q) ||
      (req.email && req.email.toLowerCase().includes(q))
    )
  })

  // 日付フォーマット
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="page-container">
      <h1 className="page-title">郵送買取管理</h1>

      {/* フィルター */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* ステータスフィルター */}
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginRight: '8px' }}>
                ステータス:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as StatusKey | 'all')}
                className="form-select"
                style={{ width: 'auto' }}
              >
                <option value="all">すべて</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* 経路フィルター */}
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginRight: '8px' }}>
                経路:
              </label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value as 'all' | 'liff' | 'web')}
                className="form-select"
                style={{ width: 'auto' }}
              >
                <option value="all">すべて</option>
                <option value="liff">LINE</option>
                <option value="web">WEB</option>
              </select>
            </div>

            {/* 検索 */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                placeholder="申込番号・氏名・電話番号で検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
              />
            </div>

            <button onClick={fetchRequests} className="btn btn-secondary">
              更新
            </button>
          </div>
        </div>
      </div>

      {/* 一覧 */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>読み込み中...</div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              データがありません
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th>申込番号</th>
                    <th>経路</th>
                    <th>顧客名</th>
                    <th>端末</th>
                    <th>査定額</th>
                    <th>ステータス</th>
                    <th>申込日</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {req.request_number}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: req.source === 'liff' ? '#06C755' : '#4285F4',
                            color: 'white',
                          }}
                        >
                          {req.source === 'liff' ? 'LINE' : 'WEB'}
                        </span>
                      </td>
                      <td>{req.customer_name}</td>
                      <td>
                        {req.items[0]?.modelDisplayName} {req.items[0]?.storage}GB
                        {req.item_count > 1 && (
                          <span style={{ marginLeft: '4px', color: 'var(--color-text-secondary)' }}>
                            他{req.item_count - 1}台
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>
                        ¥{(req.final_price || req.total_estimated_price).toLocaleString()}
                        {req.final_price && req.final_price !== req.total_estimated_price && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>
                            (事前: ¥{req.total_estimated_price.toLocaleString()})
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            background: STATUS_CONFIG[req.status]?.color || '#6B7280',
                            color: 'white',
                          }}
                        >
                          {STATUS_CONFIG[req.status]?.label || req.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {formatDate(req.created_at)}
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="btn btn-sm btn-primary"
                        >
                          詳細
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 詳細モーダル */}
      {selectedRequest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedRequest(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px' }}>
              {/* ヘッダー */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                  {selectedRequest.request_number}
                </h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              {/* ステータス */}
              <div style={{ marginBottom: '20px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    background: STATUS_CONFIG[selectedRequest.status]?.color || '#6B7280',
                    color: 'white',
                  }}
                >
                  {STATUS_CONFIG[selectedRequest.status]?.label || selectedRequest.status}
                </span>
                <span style={{ marginLeft: '12px', color: 'var(--color-text-secondary)' }}>
                  {selectedRequest.source === 'liff' ? 'LINE経由' : 'WEB経由'}
                </span>
              </div>

              {/* 顧客情報 */}
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>顧客情報</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.9rem' }}>
                  <div><strong>氏名:</strong> {selectedRequest.customer_name}</div>
                  <div><strong>電話:</strong> {selectedRequest.phone}</div>
                  {selectedRequest.email && <div><strong>メール:</strong> {selectedRequest.email}</div>}
                  {selectedRequest.postal_code && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>住所:</strong> 〒{selectedRequest.postal_code} {selectedRequest.address} {selectedRequest.address_detail}
                    </div>
                  )}
                </div>
              </div>

              {/* 端末情報 */}
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>端末情報</h3>
                {selectedRequest.items.map((item, i) => (
                  <div key={i} style={{ marginBottom: i < selectedRequest.items.length - 1 ? '12px' : 0, paddingBottom: i < selectedRequest.items.length - 1 ? '12px' : 0, borderBottom: i < selectedRequest.items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <div style={{ fontWeight: '600' }}>{i + 1}. {item.modelDisplayName} {item.storage}GB</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      ランク: {item.rank} / 査定額: ¥{item.estimatedPrice.toLocaleString()}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)', fontWeight: '700' }}>
                  合計: ¥{(selectedRequest.final_price || selectedRequest.total_estimated_price).toLocaleString()}
                </div>
              </div>

              {/* 振込先情報（承諾済以降） */}
              {selectedRequest.bank_name && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#FEF3C7', borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#92400E' }}>振込先情報</h3>
                  <div style={{ fontSize: '0.9rem' }}>
                    <div>{selectedRequest.bank_name} {selectedRequest.branch_name}</div>
                    <div>{selectedRequest.account_type} {selectedRequest.account_number}</div>
                    <div>{selectedRequest.account_holder}</div>
                  </div>
                </div>
              )}

              {/* 進捗履歴 */}
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>進捗履歴</h3>
                <div style={{ fontSize: '0.85rem' }}>
                  <div>申込み: {formatDate(selectedRequest.created_at)}</div>
                  {selectedRequest.kit_sent_at && <div>キット送付: {formatDate(selectedRequest.kit_sent_at)}</div>}
                  {selectedRequest.arrived_at && <div>端末到着: {formatDate(selectedRequest.arrived_at)}</div>}
                  {selectedRequest.assessed_at && <div>本査定完了: {formatDate(selectedRequest.assessed_at)}</div>}
                  {selectedRequest.approved_at && <div>承諾: {formatDate(selectedRequest.approved_at)}</div>}
                  {selectedRequest.rejected_at && <div>返却希望: {formatDate(selectedRequest.rejected_at)}</div>}
                  {selectedRequest.paid_at && <div>振込完了: {formatDate(selectedRequest.paid_at)}</div>}
                </div>
              </div>

              {/* アクションボタン */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {selectedRequest.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'kit_sent')}
                    className="btn btn-primary"
                  >
                    キット送付済にする
                  </button>
                )}
                {selectedRequest.status === 'kit_sent' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'arrived')}
                    className="btn btn-primary"
                  >
                    端末到着
                  </button>
                )}
                {selectedRequest.status === 'arrived' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'assessing')}
                    className="btn btn-primary"
                  >
                    本査定開始
                  </button>
                )}
                {selectedRequest.status === 'assessing' && (
                  <button
                    onClick={() => {
                      // TODO: 本査定結果入力モーダルを表示
                      updateStatus(selectedRequest.id, 'assessed')
                    }}
                    className="btn btn-primary"
                  >
                    本査定完了
                  </button>
                )}
                {selectedRequest.status === 'approved' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'paid')}
                    className="btn btn-primary"
                  >
                    振込完了
                  </button>
                )}
                {selectedRequest.status === 'paid' && (
                  <button
                    onClick={() => {
                      // TODO: 在庫登録画面へ遷移
                      updateStatus(selectedRequest.id, 'completed')
                    }}
                    className="btn btn-primary"
                  >
                    完了（在庫登録へ）
                  </button>
                )}
                {selectedRequest.status === 'rejected' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'returned')}
                    className="btn btn-secondary"
                  >
                    返送完了
                  </button>
                )}
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="btn btn-secondary"
                >
                  閉じる
                </button>

                {/* 削除ボタン */}
                <button
                  onClick={() => deleteRequest(selectedRequest.id, selectedRequest.request_number)}
                  className="btn"
                  style={{
                    marginLeft: 'auto',
                    background: '#DC2626',
                    color: 'white',
                    border: 'none',
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
