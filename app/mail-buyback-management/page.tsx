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
  declined: { label: '査定辞退', color: '#94A3B8', next: null },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

// 本査定詳細の型
type AssessmentIssue = {
  hasIssue: boolean
  description: string
  photos: string[]
}

// 項目変更の型
type ItemChange = {
  field: string        // フィールド名
  label: string        // 表示名
  beforeValue: string  // 事前査定値
  afterValue: string   // 本査定値
  hasChanged: boolean  // 変更ありか
}

type AssessmentDetails = {
  screen_scratches: AssessmentIssue
  body_scratches: AssessmentIssue
  camera_stain: AssessmentIssue & { level?: 'none' | 'minor' | 'major' }
  other: AssessmentIssue
  item_changes?: ItemChange[]  // 項目変更リスト
}

// 画像アップロード対象のキー（item_changes以外）
type AssessmentIssueKey = 'screen_scratches' | 'body_scratches' | 'camera_stain' | 'other'

const createEmptyAssessmentDetails = (): AssessmentDetails => ({
  screen_scratches: { hasIssue: false, description: '', photos: [] },
  body_scratches: { hasIssue: false, description: '', photos: [] },
  camera_stain: { hasIssue: false, description: '', photos: [], level: 'none' },
  other: { hasIssue: false, description: '', photos: [] },
  item_changes: [],
})

type MailBuybackRequest = {
  id: number
  request_number: string
  status: StatusKey
  customer_name: string
  customer_name_kana: string | null
  birth_year: string | null
  birth_month: string | null
  birth_day: string | null
  occupation: string | null
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
    cameraPhoto?: string
    colorDisplayName?: string
    batteryPercent?: number
    imei?: string
    nwStatus?: string
    cameraStain?: string
    cameraBroken?: boolean
    repairHistory?: boolean
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
  assessment_details: AssessmentDetails | null
}

// 分析データの型
type AnalyticsData = {
  total: number
  byStatus: Record<StatusKey, number>
  bySource: { liff: number; web: number }
  totalEstimatedPrice: number
  totalFinalPrice: number
  conversionRates: {
    applicationToKit: number      // 申込 → キット送付
    kitToArrival: number          // キット送付 → 到着
    arrivalToAssessed: number     // 到着 → 査定完了
    assessedToApproved: number    // 査定完了 → 承諾
    assessedToRejected: number    // 査定完了 → 返却希望
    overallConversion: number     // 申込 → 完了
  }
  declinedCount: number           // 査定辞退数
  declinedRate: number            // 査定辞退率
}

export default function MailBuybackManagementPage() {
  const [requests, setRequests] = useState<MailBuybackRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<MailBuybackRequest | null>(null)
  const [filterStatus, setFilterStatus] = useState<StatusKey | 'all'>('all')
  const [filterSource, setFilterSource] = useState<'all' | 'liff' | 'web'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])  // クリックポスト印刷用

  // 分析タブ
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  // 本査定モーダル
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const [assessmentDetails, setAssessmentDetails] = useState<AssessmentDetails>(createEmptyAssessmentDetails())
  const [finalPrice, setFinalPrice] = useState<number>(0)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

  // チェックボックス操作
  const toggleSelection = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleAllSelection = () => {
    const pendingIds = filteredRequests.filter(r => r.status === 'pending').map(r => r.id)
    if (pendingIds.every(id => selectedIds.includes(id))) {
      setSelectedIds(prev => prev.filter(id => !pendingIds.includes(id)))
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...pendingIds])])
    }
  }

  // 買取同意書PDF印刷
  const printAgreementPdf = async (req: MailBuybackRequest) => {
    try {
      const res = await fetch('/api/generate-buyback-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestNumber: req.request_number,
          customerName: req.customer_name,
          customerNameKana: req.customer_name_kana,
          birthYear: req.birth_year,
          birthMonth: req.birth_month,
          birthDay: req.birth_day,
          occupation: req.occupation,
          phone: req.phone,
          postalCode: req.postal_code,
          address: req.address,
          addressDetail: req.address_detail,
          items: req.items,
          totalEstimatedPrice: req.total_estimated_price,
        }),
      })
      const html = await res.text()
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.onload = () => printWindow.print()
      }
    } catch (error) {
      console.error('PDF生成エラー:', error)
      alert('PDF生成に失敗しました')
    }
  }

  // クリックポストCSVダウンロード共通処理（Shift-JIS）
  const downloadClickPostCsv = async (reqs: MailBuybackRequest[]) => {
    // クリックポストCSVフォーマット
    const headers = [
      'お届け先郵便番号',
      'お届け先氏名',
      'お届け先敬称',
      'お届け先住所1行目',
      'お届け先住所2行目',
      'お届け先住所3行目',
      'お届け先住所4行目',
      '内容品',
    ]

    const rows = reqs.map(req => {
      const postalCode = (req.postal_code || '').replace(/-/g, '')
      return [
        postalCode,
        req.customer_name,
        '様',
        req.address || '',
        req.address_detail || '',
        '',
        '',
        '買取キット',
      ]
    })

    // CSV生成
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')

    // Shift-JISに変換してダウンロード
    try {
      const response = await fetch('/api/convert-to-sjis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: csvContent }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'template.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        alert(`${reqs.length}件のCSVをダウンロードしました`)
      } else {
        // フォールバック：UTF-8で出力
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'template.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        alert(`${reqs.length}件のCSVをダウンロードしました（UTF-8）`)
      }
    } catch {
      // エラー時はUTF-8で出力
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'template.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      alert(`${reqs.length}件のCSVをダウンロードしました（UTF-8）`)
    }
  }

  // 単一のクリックポストCSV出力
  const exportSingleClickPostCsv = async (req: MailBuybackRequest) => {
    await downloadClickPostCsv([req])
  }

  // クリックポストCSV出力（複数選択）
  const exportClickPostCsv = async () => {
    const selectedRequests = requests.filter(r => selectedIds.includes(r.id))
    if (selectedRequests.length === 0) {
      alert('出力する申込を選択してください')
      return
    }
    await downloadClickPostCsv(selectedRequests)
  }

  // 本査定モーダルを開く
  const openAssessmentModal = (req: MailBuybackRequest) => {
    setSelectedRequest(req)
    setFinalPrice(req.total_estimated_price)

    // 事前査定値から項目変更リストを初期化
    const item = req.items[0] // 1台目の端末
    const initialItemChanges: ItemChange[] = [
      {
        field: 'rank',
        label: 'ランク',
        beforeValue: item?.rank || '',
        afterValue: item?.rank || '',
        hasChanged: false,
      },
      {
        field: 'batteryPercent',
        label: 'バッテリー',
        beforeValue: item?.batteryPercent ? `${item.batteryPercent}%` : '',
        afterValue: item?.batteryPercent ? `${item.batteryPercent}%` : '',
        hasChanged: false,
      },
      {
        field: 'nwStatus',
        label: 'NW制限',
        beforeValue: item?.nwStatus === 'ok' ? '○' : item?.nwStatus === 'triangle' ? '△' : item?.nwStatus === 'cross' ? '×' : '',
        afterValue: item?.nwStatus || '',
        hasChanged: false,
      },
      {
        field: 'cameraStain',
        label: 'カメラ染み',
        beforeValue: item?.cameraStain === 'none' ? 'なし' : item?.cameraStain === 'minor' ? 'あり（小）' : item?.cameraStain === 'major' ? 'あり（大）' : 'なし',
        afterValue: item?.cameraStain || 'none',
        hasChanged: false,
      },
      {
        field: 'cameraBroken',
        label: 'カメラ窓破損',
        beforeValue: item?.cameraBroken ? 'あり' : 'なし',
        afterValue: item?.cameraBroken ? 'yes' : 'no',
        hasChanged: false,
      },
      {
        field: 'repairHistory',
        label: '非正規修理歴',
        beforeValue: item?.repairHistory ? 'あり' : 'なし',
        afterValue: item?.repairHistory ? 'yes' : 'no',
        hasChanged: false,
      },
    ]

    const existingDetails = req.assessment_details || createEmptyAssessmentDetails()
    setAssessmentDetails({
      ...existingDetails,
      item_changes: existingDetails.item_changes || initialItemChanges,
    })
    setShowAssessmentModal(true)
  }

  // 本査定画像アップロード
  const handleAssessmentPhotoUpload = async (key: AssessmentIssueKey, file: File) => {
    const details = assessmentDetails[key]
    if (details.photos.length >= 3) {
      alert('画像は各項目につき最大3枚までです')
      return
    }

    setUploadingKey(key)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', `assessment/${selectedRequest?.request_number}`)

      const res = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const { path } = await res.json()
        setAssessmentDetails(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            photos: [...prev[key].photos, path],
          },
        }))
      } else {
        alert('画像のアップロードに失敗しました')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('画像のアップロードに失敗しました')
    } finally {
      setUploadingKey(null)
    }
  }

  // 本査定画像削除
  const removeAssessmentPhoto = (key: AssessmentIssueKey, photoIndex: number) => {
    setAssessmentDetails(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        photos: prev[key].photos.filter((_, i) => i !== photoIndex),
      },
    }))
  }

  // 本査定完了処理
  const submitAssessment = async () => {
    if (!selectedRequest) return

    // 価格変更があるか確認
    const hasChange = finalPrice !== selectedRequest.total_estimated_price ||
      assessmentDetails.screen_scratches.hasIssue ||
      assessmentDetails.body_scratches.hasIssue ||
      assessmentDetails.camera_stain.hasIssue ||
      assessmentDetails.other.hasIssue

    if (hasChange && !confirm('事前査定と異なる点があります。この内容で本査定を完了しますか？')) {
      return
    }

    try {
      const { error } = await supabase
        .from('t_mail_buyback_requests')
        .update({
          status: 'assessed',
          assessed_at: new Date().toISOString(),
          final_price: finalPrice,
          assessment_details: assessmentDetails,
        })
        .eq('id', selectedRequest.id)

      if (error) throw error

      // 通知送信
      try {
        await fetch('/api/mail-buyback/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'assessed',
            requestId: selectedRequest.id,
            assessmentDetails,
            finalPrice,
          }),
        })
      } catch (notifyError) {
        console.error('通知エラー:', notifyError)
      }

      await fetchRequests()
      setShowAssessmentModal(false)
      setSelectedRequest(null)
      alert('本査定を完了しました')
    } catch (error) {
      console.error('本査定エラー:', error)
      alert('エラーが発生しました')
    }
  }

  // 分析データを計算
  const calculateAnalytics = useCallback((data: MailBuybackRequest[]): AnalyticsData => {
    const byStatus = {} as Record<StatusKey, number>
    Object.keys(STATUS_CONFIG).forEach(key => {
      byStatus[key as StatusKey] = 0
    })

    let liffCount = 0
    let webCount = 0
    let totalEstimatedPrice = 0
    let totalFinalPrice = 0

    data.forEach(req => {
      byStatus[req.status] = (byStatus[req.status] || 0) + 1
      if (req.source === 'liff') liffCount++
      else webCount++
      totalEstimatedPrice += req.total_estimated_price || 0
      totalFinalPrice += req.final_price || req.total_estimated_price || 0
    })

    // 各ステップの件数（累計ベース）
    const applied = data.length
    const kitSent = data.filter(r => ['kit_sent', 'arrived', 'assessing', 'assessed', 'approved', 'rejected', 'paid', 'completed', 'returned'].includes(r.status)).length
    const arrived = data.filter(r => ['arrived', 'assessing', 'assessed', 'approved', 'rejected', 'paid', 'completed', 'returned'].includes(r.status)).length
    const assessed = data.filter(r => ['assessed', 'approved', 'rejected', 'paid', 'completed', 'returned'].includes(r.status)).length
    const approved = data.filter(r => ['approved', 'paid', 'completed'].includes(r.status)).length
    const rejected = data.filter(r => ['rejected', 'returned'].includes(r.status)).length
    const completed = data.filter(r => r.status === 'completed').length
    const declined = data.filter(r => r.status === 'declined').length

    return {
      total: data.length,
      byStatus,
      bySource: { liff: liffCount, web: webCount },
      totalEstimatedPrice,
      totalFinalPrice,
      conversionRates: {
        applicationToKit: applied > 0 ? Math.round((kitSent / applied) * 100) : 0,
        kitToArrival: kitSent > 0 ? Math.round((arrived / kitSent) * 100) : 0,
        arrivalToAssessed: arrived > 0 ? Math.round((assessed / arrived) * 100) : 0,
        assessedToApproved: assessed > 0 ? Math.round((approved / assessed) * 100) : 0,
        assessedToRejected: assessed > 0 ? Math.round((rejected / assessed) * 100) : 0,
        overallConversion: applied > 0 ? Math.round((completed / applied) * 100) : 0,
      },
      declinedCount: declined,
      declinedRate: applied > 0 ? Math.round((declined / applied) * 100) : 0,
    }
  }, [])

  // データ取得
  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      // 分析用に全データを取得（フィルターなし）
      const { data: allData, error: allError } = await supabase
        .from('t_mail_buyback_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (allError) throw allError

      // 分析データを計算
      if (allData) {
        setAnalytics(calculateAnalytics(allData))
      }

      // フィルター適用したデータを表示用に取得
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
  }, [filterStatus, filterSource, calculateAnalytics])

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>郵送買取管理</h1>
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="btn"
          style={{
            background: showAnalytics ? '#004AAD' : '#f3f4f6',
            color: showAnalytics ? 'white' : '#374151',
            border: 'none',
          }}
        >
          📊 分析
        </button>
      </div>

      {/* 分析ダッシュボード */}
      {showAnalytics && analytics && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h2 className="card-title">分析ダッシュボード</h2>
          </div>
          <div className="card-body">
            {/* 概要指標 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0369a1' }}>{analytics.total}</div>
                <div style={{ fontSize: '0.85rem', color: '#0369a1' }}>総申込数</div>
              </div>
              <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#059669' }}>{analytics.byStatus.completed || 0}</div>
                <div style={{ fontSize: '0.85rem', color: '#059669' }}>完了</div>
              </div>
              <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#d97706' }}>{analytics.byStatus.pending || 0}</div>
                <div style={{ fontSize: '0.85rem', color: '#d97706' }}>申込受付中</div>
              </div>
              <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#64748b' }}>{analytics.declinedCount}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>査定辞退</div>
              </div>
            </div>

            {/* 経路別・ステータス別 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              {/* 経路別 */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>経路別</h4>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1, background: '#06C755', padding: '12px', borderRadius: '8px', textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{analytics.bySource.liff}</div>
                    <div style={{ fontSize: '0.8rem' }}>LINE</div>
                  </div>
                  <div style={{ flex: 1, background: '#4285F4', padding: '12px', borderRadius: '8px', textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{analytics.bySource.web}</div>
                    <div style={{ fontSize: '0.8rem' }}>WEB</div>
                  </div>
                </div>
              </div>

              {/* ステータス別 */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>ステータス別</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <div key={key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: '#f9fafb',
                      fontSize: '0.8rem',
                    }}>
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: config.color,
                      }} />
                      <span>{config.label}</span>
                      <span style={{ fontWeight: '600' }}>{analytics.byStatus[key as StatusKey] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* コンバージョン率 */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>コンバージョン率（ファネル）</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '140px', fontSize: '0.85rem' }}>申込 → キット送付</span>
                  <div style={{ flex: 1, height: '24px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${analytics.conversionRates.applicationToKit}%`, height: '100%', background: '#3B82F6', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ width: '50px', textAlign: 'right', fontWeight: '600' }}>{analytics.conversionRates.applicationToKit}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '140px', fontSize: '0.85rem' }}>キット送付 → 到着</span>
                  <div style={{ flex: 1, height: '24px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${analytics.conversionRates.kitToArrival}%`, height: '100%', background: '#8B5CF6', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ width: '50px', textAlign: 'right', fontWeight: '600' }}>{analytics.conversionRates.kitToArrival}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '140px', fontSize: '0.85rem' }}>到着 → 査定完了</span>
                  <div style={{ flex: 1, height: '24px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${analytics.conversionRates.arrivalToAssessed}%`, height: '100%', background: '#F59E0B', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ width: '50px', textAlign: 'right', fontWeight: '600' }}>{analytics.conversionRates.arrivalToAssessed}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '140px', fontSize: '0.85rem' }}>査定完了 → 承諾</span>
                  <div style={{ flex: 1, height: '24px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${analytics.conversionRates.assessedToApproved}%`, height: '100%', background: '#10B981', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ width: '50px', textAlign: 'right', fontWeight: '600' }}>{analytics.conversionRates.assessedToApproved}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '140px', fontSize: '0.85rem' }}>査定完了 → 返却希望</span>
                  <div style={{ flex: 1, height: '24px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${analytics.conversionRates.assessedToRejected}%`, height: '100%', background: '#EF4444', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ width: '50px', textAlign: 'right', fontWeight: '600' }}>{analytics.conversionRates.assessedToRejected}%</span>
                </div>
              </div>
              <div style={{ marginTop: '16px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>全体コンバージョン率（申込 → 完了）</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>{analytics.conversionRates.overallConversion}%</span>
              </div>
            </div>

            {/* 金額サマリー */}
            <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#faf5ff', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: '#7c3aed', marginBottom: '4px' }}>累計査定金額</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#7c3aed' }}>¥{analytics.totalEstimatedPrice.toLocaleString()}</div>
              </div>
              <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: '#059669', marginBottom: '4px' }}>累計買取金額（確定）</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>¥{analytics.totalFinalPrice.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

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

            {/* クリックポストCSV出力ボタン */}
            {selectedIds.length > 0 && (
              <button
                onClick={exportClickPostCsv}
                className="btn"
                style={{ background: '#F59E0B', color: 'white', border: 'none' }}
              >
                📮 クリックポストCSV ({selectedIds.length}件)
              </button>
            )}
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
              <table className="data-table" style={{ width: '100%', minWidth: '1000px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        onChange={toggleAllSelection}
                        checked={filteredRequests.filter(r => r.status === 'pending').every(r => selectedIds.includes(r.id)) && filteredRequests.some(r => r.status === 'pending')}
                        title="申込受付のみ選択"
                      />
                    </th>
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
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(req.id)}
                          onChange={() => toggleSelection(req.id)}
                          disabled={req.status !== 'pending'}
                          title={req.status !== 'pending' ? 'キット送付済以降は選択不可' : ''}
                        />
                      </td>
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
                    <div style={{ fontWeight: '600' }}>{i + 1}. {item.modelDisplayName} {item.storage}GB {item.colorDisplayName && `(${item.colorDisplayName})`}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      ランク: {item.rank} / 査定額: ¥{item.estimatedPrice.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {item.batteryPercent && `バッテリー: ${item.batteryPercent}%`}
                      {item.imei && ` / IMEI: ${item.imei}`}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {item.nwStatus && `NW制限: ${item.nwStatus === 'ok' ? '○' : item.nwStatus === 'triangle' ? '△' : '×'}`}
                      {item.cameraStain && ` / カメラ染み: ${item.cameraStain === 'none' ? 'なし' : 'あり'}`}
                      {item.cameraBroken !== undefined && ` / カメラ窓: ${item.cameraBroken ? '割れあり' : '割れなし'}`}
                      {item.repairHistory !== undefined && ` / 非正規修理: ${item.repairHistory ? 'あり' : 'なし'}`}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)', fontWeight: '700' }}>
                  合計: ¥{(selectedRequest.final_price || selectedRequest.total_estimated_price).toLocaleString()}
                </div>
              </div>

              {/* カメラ写真 */}
              {selectedRequest.items.some(item => item.cameraPhoto) && (
                <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>カメラ写真</h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {selectedRequest.items.map((item, i) => (
                      item.cameraPhoto && (
                        <div key={i} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                            {i + 1}台目
                          </div>
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buyback-documents/${item.cameraPhoto}`}
                            alt={`カメラ写真 ${i + 1}`}
                            style={{
                              width: 120,
                              height: 120,
                              objectFit: 'cover',
                              borderRadius: 8,
                              border: '1px solid var(--color-border)',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buyback-documents/${item.cameraPhoto}`
                              window.open(url, '_blank')
                            }}
                          />
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

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

              {/* 印刷ボタン */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                <button
                  onClick={() => printAgreementPdf(selectedRequest)}
                  className="btn"
                  style={{ background: '#059669', color: 'white', border: 'none' }}
                >
                  📄 買取同意書印刷
                </button>
                {selectedRequest.status === 'pending' && (
                  <button
                    onClick={() => exportSingleClickPostCsv(selectedRequest)}
                    className="btn"
                    style={{ background: '#F59E0B', color: 'white', border: 'none' }}
                  >
                    📮 クリックポストCSV
                  </button>
                )}
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
                    onClick={() => openAssessmentModal(selectedRequest)}
                    className="btn btn-primary"
                  >
                    本査定入力
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

      {/* 本査定モーダル */}
      {showAssessmentModal && selectedRequest && (
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
            zIndex: 1001,
            padding: '20px',
          }}
          onClick={() => setShowAssessmentModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                  本査定入力 - {selectedRequest.request_number}
                </h2>
                <button
                  onClick={() => setShowAssessmentModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              {/* 端末情報 */}
              <div style={{ marginBottom: '20px', padding: '12px', background: '#f3f4f6', borderRadius: '8px' }}>
                <strong>端末:</strong> {selectedRequest.items[0]?.modelDisplayName} {selectedRequest.items[0]?.storage}GB
                <span style={{ marginLeft: '20px' }}>
                  <strong>事前査定:</strong> ¥{selectedRequest.total_estimated_price.toLocaleString()}
                </span>
              </div>

              {/* 査定項目の比較 */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                  査定項目の比較
                </h3>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  {/* ヘッダー */}
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 120px 1fr', background: '#f9fafb', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280' }}>
                    <div>項目</div>
                    <div>事前査定</div>
                    <div>変更</div>
                    <div>本査定</div>
                  </div>
                  {/* 各項目 */}
                  {assessmentDetails.item_changes?.map((change, idx) => (
                    <div key={change.field} style={{ display: 'grid', gridTemplateColumns: '120px 100px 120px 1fr', padding: '10px 12px', borderBottom: idx < (assessmentDetails.item_changes?.length || 0) - 1 ? '1px solid #e5e7eb' : 'none', alignItems: 'center', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: '500' }}>{change.label}</div>
                      <div style={{ color: '#6b7280' }}>{change.beforeValue}</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={`change_${change.field}`}
                            checked={!change.hasChanged}
                            onChange={() => {
                              setAssessmentDetails(prev => ({
                                ...prev,
                                item_changes: prev.item_changes?.map(c =>
                                  c.field === change.field ? { ...c, hasChanged: false } : c
                                ),
                              }))
                            }}
                          />
                          <span style={{ fontSize: '0.8rem' }}>なし</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={`change_${change.field}`}
                            checked={change.hasChanged}
                            onChange={() => {
                              setAssessmentDetails(prev => ({
                                ...prev,
                                item_changes: prev.item_changes?.map(c =>
                                  c.field === change.field ? { ...c, hasChanged: true } : c
                                ),
                              }))
                            }}
                          />
                          <span style={{ fontSize: '0.8rem' }}>あり</span>
                        </label>
                      </div>
                      <div>
                        {change.hasChanged && (
                          <>
                            {change.field === 'rank' && (
                              <select
                                value={change.afterValue}
                                onChange={(e) => {
                                  setAssessmentDetails(prev => ({
                                    ...prev,
                                    item_changes: prev.item_changes?.map(c =>
                                      c.field === change.field ? { ...c, afterValue: e.target.value } : c
                                    ),
                                  }))
                                }}
                                className="form-select"
                                style={{ fontSize: '0.85rem', padding: '4px 8px' }}
                              >
                                <option value="超美品">超美品</option>
                                <option value="美品">美品</option>
                                <option value="良品">良品</option>
                                <option value="並品">並品</option>
                                <option value="リペア品">リペア品</option>
                              </select>
                            )}
                            {change.field === 'batteryPercent' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="number"
                                  value={change.afterValue.replace('%', '')}
                                  onChange={(e) => {
                                    setAssessmentDetails(prev => ({
                                      ...prev,
                                      item_changes: prev.item_changes?.map(c =>
                                        c.field === change.field ? { ...c, afterValue: `${e.target.value}%` } : c
                                      ),
                                    }))
                                  }}
                                  className="form-input"
                                  style={{ width: '80px', fontSize: '0.85rem', padding: '4px 8px' }}
                                  min={0}
                                  max={100}
                                />
                                <span>%</span>
                              </div>
                            )}
                            {change.field === 'nwStatus' && (
                              <select
                                value={change.afterValue}
                                onChange={(e) => {
                                  setAssessmentDetails(prev => ({
                                    ...prev,
                                    item_changes: prev.item_changes?.map(c =>
                                      c.field === change.field ? { ...c, afterValue: e.target.value } : c
                                    ),
                                  }))
                                }}
                                className="form-select"
                                style={{ fontSize: '0.85rem', padding: '4px 8px' }}
                              >
                                <option value="ok">○（制限なし）</option>
                                <option value="triangle">△（分割支払い中）</option>
                                <option value="cross">×（利用制限あり）</option>
                              </select>
                            )}
                            {change.field === 'cameraStain' && (
                              <select
                                value={change.afterValue}
                                onChange={(e) => {
                                  setAssessmentDetails(prev => ({
                                    ...prev,
                                    item_changes: prev.item_changes?.map(c =>
                                      c.field === change.field ? { ...c, afterValue: e.target.value } : c
                                    ),
                                  }))
                                }}
                                className="form-select"
                                style={{ fontSize: '0.85rem', padding: '4px 8px' }}
                              >
                                <option value="none">なし</option>
                                <option value="minor">あり（小）</option>
                                <option value="major">あり（大）</option>
                              </select>
                            )}
                            {change.field === 'cameraBroken' && (
                              <select
                                value={change.afterValue}
                                onChange={(e) => {
                                  setAssessmentDetails(prev => ({
                                    ...prev,
                                    item_changes: prev.item_changes?.map(c =>
                                      c.field === change.field ? { ...c, afterValue: e.target.value } : c
                                    ),
                                  }))
                                }}
                                className="form-select"
                                style={{ fontSize: '0.85rem', padding: '4px 8px' }}
                              >
                                <option value="no">なし</option>
                                <option value="yes">あり</option>
                              </select>
                            )}
                            {change.field === 'repairHistory' && (
                              <select
                                value={change.afterValue}
                                onChange={(e) => {
                                  setAssessmentDetails(prev => ({
                                    ...prev,
                                    item_changes: prev.item_changes?.map(c =>
                                      c.field === change.field ? { ...c, afterValue: e.target.value } : c
                                    ),
                                  }))
                                }}
                                className="form-select"
                                style={{ fontSize: '0.85rem', padding: '4px 8px' }}
                              >
                                <option value="no">なし</option>
                                <option value="yes">あり</option>
                              </select>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 本査定価格 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                  本査定価格
                </label>
                <input
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(parseInt(e.target.value) || 0)}
                  className="form-input"
                  style={{ width: '200px', fontSize: '1.1rem', fontWeight: '600' }}
                />
                {finalPrice !== selectedRequest.total_estimated_price && (
                  <span style={{ marginLeft: '12px', color: finalPrice < selectedRequest.total_estimated_price ? '#DC2626' : '#059669' }}>
                    ({finalPrice - selectedRequest.total_estimated_price > 0 ? '+' : ''}{(finalPrice - selectedRequest.total_estimated_price).toLocaleString()}円)
                  </span>
                )}
              </div>

              {/* 査定項目 */}
              {(['screen_scratches', 'body_scratches', 'camera_stain', 'other'] as const).map((key) => {
                const labels = {
                  screen_scratches: '画面の傷',
                  body_scratches: '本体の傷',
                  camera_stain: 'カメラ染み',
                  other: 'その他の状態',
                }
                const details = assessmentDetails[key]

                return (
                  <div key={key} style={{
                    marginBottom: '16px',
                    padding: '16px',
                    background: details.hasIssue ? '#fef3c7' : '#f9fafb',
                    borderRadius: '8px',
                    border: details.hasIssue ? '1px solid #f59e0b' : '1px solid #e5e7eb',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={details.hasIssue}
                          onChange={(e) => setAssessmentDetails(prev => ({
                            ...prev,
                            [key]: { ...prev[key], hasIssue: e.target.checked },
                          }))}
                        />
                        <span style={{ fontWeight: '600' }}>{labels[key]}</span>
                      </label>
                      {details.hasIssue && (
                        <span style={{ fontSize: '0.85rem', color: '#92400e' }}>
                          ※ 事前査定と異なる場合は画像を添付
                        </span>
                      )}
                    </div>

                    {details.hasIssue && (
                      <>
                        {/* 画像アップロード */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
                          {details.photos.map((photo, i) => (
                            <div key={i} style={{ position: 'relative' }}>
                              <img
                                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buyback-documents/${photo}`}
                                alt={`${labels[key]} ${i + 1}`}
                                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #e5e7eb', cursor: 'pointer' }}
                                onClick={() => window.open(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buyback-documents/${photo}`, '_blank')}
                              />
                              <button
                                type="button"
                                onClick={() => removeAssessmentPhoto(key, i)}
                                style={{
                                  position: 'absolute',
                                  top: -6,
                                  right: -6,
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: 12,
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {details.photos.length < 3 && (
                            <label style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 80,
                              height: 80,
                              background: 'white',
                              border: '2px dashed #d1d5db',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              color: '#666',
                            }}>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleAssessmentPhotoUpload(key, file)
                                  e.target.value = ''
                                }}
                                style={{ display: 'none' }}
                                disabled={uploadingKey === key}
                              />
                              {uploadingKey === key ? '...' : '📷 追加'}
                            </label>
                          )}
                          <span style={{ fontSize: '0.75rem', color: '#999' }}>
                            ({details.photos.length}/3)
                          </span>
                        </div>

                        {/* 備考欄（画像の下に表示） */}
                        <div style={{ marginTop: '8px' }}>
                          <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>
                            備考（お客様に表示・ECサイトにも使用）
                          </label>
                          <input
                            type="text"
                            placeholder="例：画面右下に2cm程度の傷あり"
                            value={details.description}
                            onChange={(e) => setAssessmentDetails(prev => ({
                              ...prev,
                              [key]: { ...prev[key], description: e.target.value },
                            }))}
                            className="form-input"
                            style={{ fontSize: '0.9rem' }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )
              })}

              {/* ボタン */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={submitAssessment}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', fontSize: '1rem' }}
                >
                  本査定結果を連絡する
                </button>
                <button
                  onClick={() => setShowAssessmentModal(false)}
                  className="btn btn-secondary"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
