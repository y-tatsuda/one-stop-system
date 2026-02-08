'use client'

/**
 * 買取査定 - 減額理由確認ページ
 * 本査定で減額となった場合の理由を画像付きで確認できるページ
 */

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase'

// 旧形式（互換性のため残す）
type AssessmentIssue = {
  hasIssue: boolean
  description: string
  photos: string[]
}

type ItemChange = {
  field: string
  label: string
  beforeValue: string
  afterValue: string
  hasChanged: boolean
}

// 新形式: 写真+備考
type AssessmentPhoto = {
  path: string
  note: string
}

// 新旧両形式に対応
type AssessmentDetails = {
  // 新形式
  item_changes?: ItemChange[]
  photos?: AssessmentPhoto[]
  // 旧形式（互換性のため）
  screen_scratches?: AssessmentIssue
  body_scratches?: AssessmentIssue
  camera_stain?: AssessmentIssue
  other?: AssessmentIssue
}

type RequestData = {
  id: number
  request_number: string
  customer_name: string
  items: Array<{
    modelDisplayName: string
    storage: string
  }>
  total_estimated_price: number
  final_price: number | null
  assessment_details: AssessmentDetails | null
}

function AssessmentPageContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<RequestData | null>(null)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!id || !token) {
        setError('無効なURLです')
        setLoading(false)
        return
      }

      try {
        const { data: reqData, error: fetchError } = await supabase
          .from('t_mail_buyback_requests')
          .select('id, request_number, customer_name, items, total_estimated_price, final_price, assessment_details')
          .eq('id', id)
          .eq('request_number', token)
          .single()

        if (fetchError || !reqData) {
          setError('データが見つかりません')
          setLoading(false)
          return
        }

        setData(reqData as RequestData)
      } catch (err) {
        console.error('Fetch error:', err)
        setError('データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, token])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fb' }}>
        <p style={{ color: '#666' }}>読み込み中...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fb' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#dc2626', fontSize: '1.1rem' }}>{error || 'エラーが発生しました'}</p>
        </div>
      </div>
    )
  }

  const assessmentDetails = data.assessment_details
  const finalPrice = data.final_price || data.total_estimated_price
  const priceDiff = finalPrice - data.total_estimated_price

  // 新形式の写真リスト
  const newFormatPhotos = assessmentDetails?.photos || []

  // 旧形式の画像付きの減額項目（互換性のため）
  const issueLabels: Record<string, string> = {
    screen_scratches: '画面の傷',
    body_scratches: '本体の傷',
    camera_stain: 'カメラ染み',
    other: 'その他',
  }

  const oldFormatIssues = assessmentDetails
    ? Object.entries(assessmentDetails)
        .filter(([key, value]) =>
          key !== 'item_changes' &&
          key !== 'photos' &&
          (value as AssessmentIssue)?.hasIssue
        )
        .map(([key, value]) => ({
          key,
          label: issueLabels[key] || key,
          ...(value as AssessmentIssue),
        }))
    : []

  // 項目変更
  const itemChanges = assessmentDetails?.item_changes?.filter(c => c.hasChanged) || []

  // 本査定値の表示用フォーマット
  const formatAfterValue = (field: string, value: string): string => {
    switch (field) {
      case 'nwStatus':
        return value === 'ok' ? '○' : value === 'triangle' ? '△' : '×'
      case 'cameraStain':
        return value === 'none' ? 'なし' : value === 'minor' ? 'あり（小）' : 'あり（大）'
      case 'cameraBroken':
      case 'repairHistory':
        return value === 'yes' ? 'あり' : 'なし'
      default:
        return value
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', padding: '24px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/logo.png" alt="ONE STOP" style={{ height: 40, display: 'block', margin: '0 auto 12px' }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#004AAD' }}>減額理由のご説明</h1>
        </div>

        {/* 申込情報 */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>申込番号</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{data.request_number}</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>端末</div>
            <div style={{ fontSize: 15, marginBottom: 12 }}>{data.items[0]?.modelDisplayName} {data.items[0]?.storage}GB</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #e5e7eb' }}>
              <div>
                <div style={{ fontSize: 13, color: '#666' }}>事前査定</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>¥{data.total_estimated_price.toLocaleString()}</div>
              </div>
              <div style={{ fontSize: 24, color: '#9ca3af' }}>→</div>
              <div>
                <div style={{ fontSize: 13, color: '#666' }}>本査定</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>¥{finalPrice.toLocaleString()}</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 14, color: '#dc2626', fontWeight: 600 }}>
              {priceDiff.toLocaleString()}円の減額
            </div>
          </div>
        </div>

        {/* 項目変更 */}
        {itemChanges.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 className="card-title" style={{ fontSize: 16 }}>査定項目の変更</h2>
            </div>
            <div className="card-body">
              {itemChanges.map((change, idx) => (
                <div key={change.field} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: idx < itemChanges.length - 1 ? '1px solid #e5e7eb' : 'none',
                }}>
                  <span style={{ fontWeight: 500 }}>{change.label}</span>
                  <span>
                    <span style={{ color: '#6b7280' }}>{change.beforeValue}</span>
                    <span style={{ margin: '0 8px', color: '#9ca3af' }}>→</span>
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>{formatAfterValue(change.field, change.afterValue)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 確認画像（新形式） */}
        {newFormatPhotos.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 className="card-title" style={{ fontSize: 16 }}>確認画像</h2>
            </div>
            <div className="card-body">
              {newFormatPhotos.map((photo, idx) => (
                <div key={idx} style={{
                  marginBottom: idx < newFormatPhotos.length - 1 ? 16 : 0,
                  paddingBottom: idx < newFormatPhotos.length - 1 ? 16 : 0,
                  borderBottom: idx < newFormatPhotos.length - 1 ? '1px solid #e5e7eb' : 'none',
                }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buyback-documents/${photo.path}`}
                      alt={`確認画像 ${idx + 1}`}
                      style={{
                        width: 100,
                        height: 100,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      onClick={() => setExpandedImage(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buyback-documents/${photo.path}`)}
                    />
                    {photo.note && (
                      <div style={{ fontSize: 14, color: '#374151', paddingTop: 4 }}>
                        {photo.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 画像付きの減額項目（旧形式 - 互換性のため） */}
        {oldFormatIssues.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 className="card-title" style={{ fontSize: 16 }}>確認画像</h2>
            </div>
            <div className="card-body">
              {oldFormatIssues.map((issue, idx) => (
                <div key={issue.key} style={{
                  marginBottom: idx < oldFormatIssues.length - 1 ? 20 : 0,
                  paddingBottom: idx < oldFormatIssues.length - 1 ? 20 : 0,
                  borderBottom: idx < oldFormatIssues.length - 1 ? '1px solid #e5e7eb' : 'none',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>{issue.label}</div>
                  {issue.description && (
                    <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>{issue.description}</div>
                  )}
                  {issue.photos.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {issue.photos.map((photo, i) => (
                        <img
                          key={i}
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buyback-documents/${photo}`}
                          alt={`${issue.label} ${i + 1}`}
                          style={{
                            width: 100,
                            height: 100,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer',
                          }}
                          onClick={() => setExpandedImage(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buyback-documents/${photo}`)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* お問い合わせ */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
            ご不明点などございましたら、公式LINEまでお問い合わせください。
          </p>
          <a
            href="https://lin.ee/F5fr4V7"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#06C755',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            公式LINEで問い合わせ
          </a>
        </div>
      </div>

      {/* 画像拡大モーダル */}
      {expandedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="拡大画像"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
          <button
            onClick={() => setExpandedImage(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              fontSize: 24,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fb' }}>
        <p style={{ color: '#666' }}>読み込み中...</p>
      </div>
    }>
      <AssessmentPageContent />
    </Suspense>
  )
}
