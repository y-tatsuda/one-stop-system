'use client'

/**
 * =====================================================
 * 郵送買取ページ（EC・LIFF共通）
 * =====================================================
 *
 * 【役割】
 * - ECサイト・LIFF両方からアクセス可能な買取申込フォーム
 * - LIFF経由の場合、クエリパラメータでLINE情報を受け取る
 *   (line_uid, line_name, from=liff)
 *
 * 【注意】
 * - 買取価格計算のマスタロジックは /app/lib/pricing.ts に集約
 * - 新しい減額ルールを追加する場合は pricing.ts を修正すること
 * - 重複実装しないこと
 * =====================================================
 */

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { DEFAULT_TENANT_ID } from '../lib/constants'
import { IphoneModel } from '../lib/types'
import { calculateBuybackDeduction } from '../lib/pricing'

// =====================================================
// 型定義
// =====================================================

const RANK_OPTIONS = ['超美品', '美品', '良品', '並品', 'リペア品']

type MailBuybackItem = {
  id: string
  model: string
  modelDisplayName: string
  storage: string
  rank: string
  batteryPercent: string
  isServiceState: boolean
  imei: string
  nwStatus: 'ok' | 'triangle' | 'cross'
  cameraStain: 'none' | 'minor' | 'major'
  cameraBroken: boolean
  repairHistory: boolean
  basePrice: number
  totalDeduction: number
  estimatedPrice: number
  guaranteePrice: number  // 最低保証価格
}

type CustomerInfo = {
  name: string
  nameKana: string
  postalCode: string
  address: string
  addressDetail: string
  phone: string
  email: string
}

type Step = 'device' | 'customer' | 'confirm' | 'complete' | 'declined'

const createEmptyItem = (): MailBuybackItem => ({
  id: crypto.randomUUID(),
  model: '',
  modelDisplayName: '',
  storage: '',
  rank: '',
  batteryPercent: '',
  isServiceState: false,
  imei: '',
  nwStatus: 'ok',
  cameraStain: 'none',
  cameraBroken: false,
  repairHistory: false,
  basePrice: 0,
  totalDeduction: 0,
  estimatedPrice: 0,
  guaranteePrice: 0,
})

// ランクの説明
const RANK_DESCRIPTIONS: { rank: string; description: string }[] = [
  { rank: '超美品', description: '傷がなく、充放電回数1回未満' },
  { rank: '美品', description: '画面、本体共に傷無し' },
  { rank: '良品', description: '画面に傷無し' },
  { rank: '並品', description: '画面に傷あり' },
  { rank: 'リペア品', description: '画面割れなど重大な損傷あり' },
]

// =====================================================
// メインコンポーネント
// =====================================================
function MailBuybackPageContent() {
  const searchParams = useSearchParams()

  // LIFF経由の場合、クエリパラメータからLINE情報を取得
  const lineUserId = searchParams.get('line_uid') || ''
  const lineDisplayName = decodeURIComponent(searchParams.get('line_name') || '')
  const isFromLiff = searchParams.get('from') === 'liff'

  const [step, setStep] = useState<Step>('device')
  const [iphoneModels, setIphoneModels] = useState<IphoneModel[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [requestNumber, setRequestNumber] = useState('')

  // 端末リスト
  const [items, setItems] = useState<MailBuybackItem[]>([createEmptyItem()])
  const [activeItemIndex, setActiveItemIndex] = useState(0)

  // 顧客情報
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    nameKana: '',
    postalCode: '',
    address: '',
    addressDetail: '',
    phone: '',
    email: '',
  })

  // 同意チェック
  const [agreed, setAgreed] = useState(false)

  // バリデーションエラー
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // =====================================================
  // マスタデータ取得
  // =====================================================
  useEffect(() => {
    async function fetchMasterData() {
      const { data: modelsRes } = await supabase
        .from('m_iphone_models')
        .select('model, display_name')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('is_active', true)
        .not('model', 'in', '(SE,6s,7,7P)')
        .order('sort_order', { ascending: false })

      setIphoneModels(modelsRes || [])
      setLoading(false)
    }
    fetchMasterData()
  }, [])

  // ステップ変更時にスクロール
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  // =====================================================
  // 端末操作
  // =====================================================
  const updateItem = (index: number, updates: Partial<MailBuybackItem>) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], ...updates }
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, createEmptyItem()])
    setActiveItemIndex(items.length)
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    if (activeItemIndex >= newItems.length) {
      setActiveItemIndex(newItems.length - 1)
    } else if (activeItemIndex === index && activeItemIndex > 0) {
      setActiveItemIndex(activeItemIndex - 1)
    }
  }

  // =====================================================
  // 価格計算
  // =====================================================
  const calculatePrice = useCallback(async (index: number, model: string, storage: string, rank: string) => {
    if (!model || !storage || !rank) return

    const queries = [
      supabase
        .from('m_buyback_prices')
        .select('price')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('model', model)
        .eq('storage', parseInt(storage))
        .eq('rank', rank)
        .single(),
      supabase
        .from('m_buyback_prices')
        .select('price')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('model', model)
        .eq('storage', parseInt(storage))
        .eq('rank', '美品')
        .single(),
      // 最低保証価格
      supabase
        .from('m_buyback_guarantees')
        .select('guarantee_price')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('model', model)
        .eq('storage', parseInt(storage))
        .single(),
    ]

    const [priceRes, bihinRes, guaranteeRes] = await Promise.all(queries)

    const basePrice = (priceRes.data as { price: number } | null)?.price || 0
    const bihinPrice = (bihinRes.data as { price: number } | null)?.price || basePrice
    const guaranteePrice = (guaranteeRes.data as { guarantee_price: number } | null)?.guarantee_price || 0

    const item = items[index]
    const batteryPercent = parseInt(item.batteryPercent) || 100

    const totalDeduction = calculateBuybackDeduction(
      basePrice,
      {
        batteryPercent,
        isServiceState: item.isServiceState,
        nwStatus: item.nwStatus,
        cameraStain: item.cameraStain,
        cameraBroken: item.cameraBroken,
        repairHistory: item.repairHistory,
      },
      [],
      bihinPrice
    )

    // 最終価格は最低保証価格を下回らない
    const calculatedPrice = Math.max(basePrice - totalDeduction, 0)
    const estimatedPrice = Math.max(calculatedPrice, guaranteePrice)

    updateItem(index, { basePrice, totalDeduction, estimatedPrice, guaranteePrice })
  }, [items])

  // =====================================================
  // 郵便番号から住所自動入力
  // =====================================================
  const fetchAddressFromPostalCode = async (postalCode: string) => {
    if (postalCode.length !== 7) return

    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`)
      const data = await res.json()

      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        setCustomerInfo(prev => ({
          ...prev,
          address: `${result.address1}${result.address2}${result.address3}`,
        }))
      }
    } catch (error) {
      console.error('住所検索エラー:', error)
    }
  }

  // =====================================================
  // 合計金額
  // =====================================================
  const totalEstimatedPrice = items.reduce((sum, item) => sum + item.estimatedPrice, 0)

  // =====================================================
  // バリデーション
  // =====================================================
  const validateDeviceStep = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // 価格が設定された端末のみバリデーション（空の端末は除外）
    const validItems = items.filter(item => item.model || item.storage || item.rank)

    validItems.forEach((item) => {
      const originalIndex = items.findIndex(it => it.id === item.id)
      if (!item.model) newErrors[`item_${originalIndex}_model`] = '機種を選択してください'
      if (!item.storage) newErrors[`item_${originalIndex}_storage`] = '容量を選択してください'
      if (!item.rank) newErrors[`item_${originalIndex}_rank`] = 'ランクを選択してください'
    })

    if (validItems.length === 0) {
      newErrors.general = '少なくとも1台の端末情報を入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateCustomerStep = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!customerInfo.name.trim()) newErrors.name = '氏名を入力してください'
    if (!customerInfo.phone.trim()) newErrors.phone = '電話番号を入力してください'

    // LIFF経由でない場合はメールアドレス必須
    if (!isFromLiff && !customerInfo.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください'
    } else if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.email = '正しいメールアドレスを入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // =====================================================
  // ステップ遷移
  // =====================================================
  const goToCustomer = () => {
    if (validateDeviceStep()) {
      setStep('customer')
    }
  }

  const goToConfirm = () => {
    if (validateCustomerStep()) {
      setStep('confirm')
    }
  }

  // =====================================================
  // 申込送信
  // =====================================================
  const handleSubmit = async () => {
    if (!agreed) return

    setSubmitting(true)
    try {
      const validItems = items.filter(item => item.estimatedPrice > 0)

      const submitItems = validItems.map((item) => ({
        model: item.model,
        modelDisplayName: item.modelDisplayName,
        storage: item.storage,
        rank: item.rank,
        batteryPercent: parseInt(item.batteryPercent) || 100,
        imei: item.imei,
        nwStatus: item.nwStatus,
        cameraStain: item.cameraStain,
        cameraBroken: item.cameraBroken,
        repairHistory: item.repairHistory,
        estimatedPrice: item.estimatedPrice,
        guaranteePrice: item.guaranteePrice,
      }))

      const res = await fetch('/api/mail-buyback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerInfo.name,
          customerNameKana: customerInfo.nameKana,
          postalCode: customerInfo.postalCode,
          address: customerInfo.address,
          addressDetail: customerInfo.addressDetail,
          phone: customerInfo.phone,
          email: customerInfo.email,
          items: submitItems,
          totalEstimatedPrice,
          // LINE情報（LIFF経由の場合）
          lineUserId: lineUserId || null,
          lineDisplayName: lineDisplayName || null,
          source: isFromLiff ? 'liff' : 'web',
        }),
      })

      const result = await res.json()

      if (result.success) {
        setRequestNumber(result.requestNumber)
        setStep('complete')
      } else {
        alert('申込に失敗しました。もう一度お試しください。')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('通信エラーが発生しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  // =====================================================
  // ステップインジケーター
  // =====================================================
  const steps: { key: Step; label: string }[] = [
    { key: 'device', label: '事前査定' },
    { key: 'customer', label: 'お客様情報' },
    { key: 'confirm', label: '確認' },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === step)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fb' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: '#666' }}>読み込み中...</p>
        </div>
      </div>
    )
  }

  // =====================================================
  // 完了画面
  // =====================================================
  if (step === 'complete') {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f7fb', padding: '24px 16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src="/logo.png" alt="ONE STOP" style={{ height: 40, display: 'block', margin: '0 auto' }} />
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#x2705;</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#004AAD', marginBottom: 16 }}>
              お申込みが完了しました
            </h1>
            <p style={{ fontSize: 15, color: '#555', marginBottom: 24, lineHeight: 1.8 }}>
              お申込みありがとうございます。<br />
              {isFromLiff
                ? 'LINEでお知らせをお送りしますのでお待ちください。'
                : '以下の申込番号をお控えください。'}
            </p>
            <div style={{
              background: '#f0f4ff',
              borderRadius: 12,
              padding: '20px 24px',
              marginBottom: 24,
              border: '2px solid #004AAD',
            }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>申込番号</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#004AAD', letterSpacing: 1 }}>
                {requestNumber}
              </div>
            </div>
            <div style={{
              background: '#fffbeb',
              borderRadius: 8,
              padding: 16,
              textAlign: 'left',
              fontSize: 14,
              color: '#92400e',
              lineHeight: 1.8,
            }}>
              <strong>今後の流れ</strong>
              <ol style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                <li>郵送キットをお送りいたします</li>
                <li>端末をキットに入れてご返送ください</li>
                <li>到着後、査定を行いご連絡いたします</li>
                <li>査定額にご了承いただけましたらお振込みいたします</li>
              </ol>
            </div>
            {isFromLiff && (
              <button
                onClick={() => {
                  import('@line/liff').then(liff => {
                    if (liff.default.isInClient()) {
                      liff.default.closeWindow()
                    } else {
                      window.close()
                    }
                  })
                }}
                style={{
                  marginTop: 24,
                  width: '100%',
                  padding: '14px',
                  fontSize: 16,
                  fontWeight: 600,
                  background: '#06C755',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                LINEに戻る
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // =====================================================
  // 辞退画面
  // =====================================================
  if (step === 'declined') {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f7fb', padding: '24px 16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src="/logo.png" alt="ONE STOP" style={{ height: 40, display: 'block', margin: '0 auto' }} />
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#004AAD', marginBottom: 16 }}>
              買取査定をご利用頂き<br />ありがとうございました
            </h1>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.8 }}>
              またのご利用をお待ちしております。
            </p>
          </div>
        </div>
      </div>
    )
  }

  // =====================================================
  // メインレンダリング
  // =====================================================
  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/logo.png" alt="ONE STOP" style={{ height: 40, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#004AAD' }}>事前査定</h1>
        </div>

        {/* ステップインジケーター */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 4,
          marginBottom: 28,
        }}>
          {steps.map((s, i) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: i <= currentStepIndex ? 600 : 400,
                background: i <= currentStepIndex ? '#004AAD' : '#e5e7eb',
                color: i <= currentStepIndex ? '#fff' : '#888',
                transition: 'all 0.3s',
              }}>
                <span style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: i <= currentStepIndex ? 'rgba(255,255,255,0.3)' : '#ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: i <= currentStepIndex ? '#fff' : '#888',
                }}>
                  {i + 1}
                </span>
                {s.label}
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 20, height: 2, background: i < currentStepIndex ? '#004AAD' : '#ddd' }} />
              )}
            </div>
          ))}
        </div>

        {/* STEP1: 事前査定 */}
        {step === 'device' && (
          <div>
            {/* 端末タブ */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 16,
              alignItems: 'center'
            }}>
              {items.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setActiveItemIndex(i)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: activeItemIndex === i ? '2px solid #004AAD' : '1px solid #ddd',
                    background: activeItemIndex === i ? '#e8f0fe' : '#fff',
                    fontWeight: activeItemIndex === i ? 600 : 400,
                    color: activeItemIndex === i ? '#004AAD' : '#555',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {i + 1}台目
                  {item.estimatedPrice > 0 && (
                    <span style={{ fontSize: 12, color: '#059669' }}>✓</span>
                  )}
                  {items.length > 1 && (
                    <span
                      onClick={(e) => { e.stopPropagation(); removeItem(i); }}
                      style={{
                        marginLeft: 4,
                        color: '#999',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={addItem}
                style={{
                  padding: '8px 12px',
                  borderRadius: 20,
                  border: '1px dashed #999',
                  background: '#f9fafb',
                  color: '#666',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                ＋ 端末を追加
              </button>
            </div>

            <DeviceItemForm
              key={items[activeItemIndex].id}
              item={items[activeItemIndex]}
              index={activeItemIndex}
              iphoneModels={iphoneModels}
              errors={errors}
              onUpdate={(updates) => updateItem(activeItemIndex, updates)}
              onCalculate={(model, storage, rank) => calculatePrice(activeItemIndex, model, storage, rank)}
            />

            {/* 査定結果 */}
            {totalEstimatedPrice > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-body">
                  {items.length > 1 && (
                    <div style={{ marginBottom: 12 }}>
                      {items.map((item, i) => (
                        item.estimatedPrice > 0 && (
                          <div key={item.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderBottom: '1px solid #eee',
                            fontSize: 14,
                          }}>
                            <span>{i + 1}台目: {item.modelDisplayName} {item.storage}GB</span>
                            <span style={{ fontWeight: 600 }}>¥{item.estimatedPrice.toLocaleString()}</span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                      {items.length > 1 ? '合計査定金額' : '査定金額'}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#004AAD' }}>
                      ¥{totalEstimatedPrice.toLocaleString()}
                    </div>
                    {items.filter(item => item.guaranteePrice > 0).length > 0 && (
                      <div style={{ fontSize: 12, color: '#059669', marginTop: 8 }}>
                        ※ 最低保証価格: ¥{items.reduce((sum, item) => sum + item.guaranteePrice, 0).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* 注意事項 */}
                  <div style={{
                    background: '#fffbeb',
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginTop: 16,
                    textAlign: 'left',
                    fontSize: 13,
                    color: '#92400e',
                    lineHeight: 1.8,
                  }}>
                    ドコモ、ソフトバンク、au、楽天の分割支払いが残っている場合、上記の査定金額から減額となります。<br />
                    ・支払い中（△）の場合: ¥{Math.round(totalEstimatedPrice * 0.2).toLocaleString()} の減額<br />
                    ・利用制限（×）の場合: ¥{Math.round(totalEstimatedPrice * 0.4).toLocaleString()} の減額
                  </div>
                </div>
              </div>
            )}
            {items[activeItemIndex].model && items[activeItemIndex].storage && items[activeItemIndex].rank && items[activeItemIndex].estimatedPrice === 0 && items[activeItemIndex].basePrice === 0 && (
              <div style={{
                background: '#fef2f2',
                borderRadius: 10,
                padding: '14px 18px',
                textAlign: 'center',
                border: '1px solid #fecaca',
                fontSize: 14,
                color: '#dc2626',
                marginBottom: 20,
              }}>
                この組み合わせの価格データがありません
              </div>
            )}

            {/* アクションボタン */}
            {totalEstimatedPrice > 0 && items.every(item => item.estimatedPrice > 0 || (!item.model && !item.storage && !item.rank)) && items.some(item => item.estimatedPrice > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={goToCustomer}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: 16, fontWeight: 600 }}
                >
                  上記の金額で買取を申し込む
                </button>
                <button
                  onClick={() => setStep('declined')}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '14px', fontSize: 15 }}
                >
                  今回は買取を止めておく
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP2: お客様情報入力 */}
        {step === 'customer' && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <h2 className="card-title">お客様情報</h2>
              </div>
              <div className="card-body">
                <div className="form-grid-2" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label form-label-required">氏名</label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                      placeholder="山田 太郎"
                    />
                    {errors.name && <div className="form-error">{errors.name}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">フリガナ</label>
                    <input
                      type="text"
                      value={customerInfo.nameKana}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, nameKana: e.target.value })}
                      className="form-input"
                      placeholder="ヤマダ タロウ"
                    />
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">郵便番号</label>
                    <input
                      type="text"
                      value={customerInfo.postalCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 7)
                        setCustomerInfo({ ...customerInfo, postalCode: val })
                        if (val.length === 7) fetchAddressFromPostalCode(val)
                      }}
                      className="form-input"
                      placeholder="1234567"
                      maxLength={7}
                    />
                    <div className="form-hint">ハイフンなし7桁</div>
                  </div>
                  <div></div>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">住所</label>
                  <input
                    type="text"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    className="form-input"
                    placeholder="東京都渋谷区..."
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">建物名・部屋番号</label>
                  <input
                    type="text"
                    value={customerInfo.addressDetail}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, addressDetail: e.target.value })}
                    className="form-input"
                    placeholder="○○マンション 101号室"
                  />
                </div>

                <div className="form-grid-2" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label form-label-required">電話番号</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                      placeholder="090-1234-5678"
                    />
                    {errors.phone && <div className="form-error">{errors.phone}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      メールアドレス
                      {!isFromLiff && <span className="form-label-required" style={{ marginLeft: 4 }}>必須</span>}
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                      placeholder="example@email.com"
                    />
                    {errors.email && <div className="form-error">{errors.email}</div>}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setErrors({}); setStep('device') }}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '14px', fontSize: 15 }}
              >
                戻る
              </button>
              <button
                onClick={goToConfirm}
                className="btn btn-primary"
                style={{ flex: 2, padding: '14px', fontSize: 16, fontWeight: 600 }}
              >
                次へ：確認画面
              </button>
            </div>
          </div>
        )}

        {/* STEP3: 確認画面 */}
        {step === 'confirm' && (
          <div>
            {/* 端末情報確認 */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <h2 className="card-title">端末情報</h2>
              </div>
              <div className="card-body">
                {items.map((item, i) => (
                  <div key={item.id} style={{
                    padding: '12px 0',
                    borderBottom: i < items.length - 1 ? '1px solid #eee' : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>
                          {item.modelDisplayName} {item.storage}GB
                        </div>
                        <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                          {item.rank}
                          {item.batteryPercent ? ` / バッテリー:${item.batteryPercent}%` : ''}
                          {item.imei && ` / IMEI:${item.imei}`}
                          {item.cameraStain !== 'none' && ` / カメラ染み:${item.cameraStain === 'minor' ? '小' : '大'}`}
                          {item.cameraBroken && ' / カメラ窓破損'}
                          {item.repairHistory && ' / 非正規修理歴あり'}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#004AAD' }}>
                        ¥{item.estimatedPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 16,
                  marginTop: 8,
                  borderTop: '2px solid #004AAD',
                }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>合計見積金額</span>
                  <span style={{ fontWeight: 700, fontSize: 22, color: '#004AAD' }}>
                    ¥{totalEstimatedPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* お客様情報確認 */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <h2 className="card-title">お客様情報</h2>
              </div>
              <div className="card-body">
                <ConfirmRow label="氏名" value={customerInfo.name} />
                {customerInfo.nameKana && <ConfirmRow label="フリガナ" value={customerInfo.nameKana} />}
                {customerInfo.postalCode && <ConfirmRow label="郵便番号" value={customerInfo.postalCode} />}
                {customerInfo.address && <ConfirmRow label="住所" value={`${customerInfo.address}${customerInfo.addressDetail ? ` ${customerInfo.addressDetail}` : ''}`} />}
                <ConfirmRow label="電話番号" value={customerInfo.phone} />
                {customerInfo.email && <ConfirmRow label="メールアドレス" value={customerInfo.email} />}
              </div>
            </div>

            {/* 注意事項 */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-body">
                <div style={{
                  fontSize: 13,
                  color: '#555',
                  lineHeight: 1.8,
                  marginBottom: 16,
                }}>
                  <strong>ご注意事項</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                    <li>表示価格はあくまで見積金額です。本査定にて買取価格が変更になる場合がございます。</li>
                    <li>端末の状態が申告内容と異なる場合、買取金額が変更になることがあります。</li>
                    <li>未成年の方の買取には保護者の同意が必要です。</li>
                    <li>買取の依頼者名とお振込み口座の名義が一致している必要があります。</li>
                    <li>申込後、郵送キットをお送りいたします。届きましたら端末を入れてご返送ください。</li>
                    <li>ネットワーク利用制限が「×」の端末は買取できない場合がございます。</li>
                  </ul>
                </div>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  background: agreed ? '#f0fdf4' : '#f9fafb',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: `1px solid ${agreed ? '#86efac' : '#e5e7eb'}`,
                  transition: 'all 0.2s',
                }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#004AAD' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    上記の注意事項を確認し、申込内容に同意します
                  </span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setStep('customer')}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '14px', fontSize: 15 }}
              >
                戻る
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
                style={{ flex: 2, padding: '14px', fontSize: 16, fontWeight: 600 }}
                disabled={!agreed || submitting}
              >
                {submitting ? '送信中...' : '申込みを送信する'}
              </button>
            </div>
          </div>
        )}

        {/* 注意書きフッター */}
        <div style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 24 }}>
          ※ 査定金額は端末到着後の査定により変動する場合があります
        </div>
      </div>
    </div>
  )
}

// =====================================================
// 端末入力フォーム
// =====================================================
function DeviceItemForm({
  item,
  index,
  iphoneModels,
  errors,
  onUpdate,
  onCalculate,
}: {
  item: MailBuybackItem
  index: number
  iphoneModels: IphoneModel[]
  errors: { [key: string]: string }
  onUpdate: (updates: Partial<MailBuybackItem>) => void
  onCalculate: (model: string, storage: string, rank: string) => void
}) {
  const [availableStorages, setAvailableStorages] = useState<number[]>([])
  const [showCameraStainExample, setShowCameraStainExample] = useState(false)

  // 機種変更時に容量リストを取得
  useEffect(() => {
    async function fetchStorages() {
      if (!item.model) {
        setAvailableStorages([])
        return
      }
      const { data } = await supabase
        .from('m_buyback_prices')
        .select('storage')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('model', item.model)
        .eq('is_active', true)

      if (data) {
        const storages = [...new Set(data.map(d => d.storage))].sort((a: number, b: number) => a - b)
        setAvailableStorages(storages)
      }
    }
    fetchStorages()
  }, [item.model])

  // 価格再計算トリガー
  useEffect(() => {
    if (item.model && item.storage && item.rank) {
      onCalculate(item.model, item.storage, item.rank)
    }
  }, [item.model, item.storage, item.rank, item.isServiceState, item.nwStatus, item.cameraStain, item.cameraBroken, item.repairHistory])

  const handleBatteryBlur = () => {
    if (item.model && item.storage && item.rank) {
      onCalculate(item.model, item.storage, item.rank)
    }
  }

  const handleModelChange = (modelValue: string) => {
    const modelObj = iphoneModels.find(m => m.model === modelValue)
    onUpdate({
      model: modelValue,
      modelDisplayName: modelObj?.display_name || modelValue,
      storage: '',
      rank: '',
      basePrice: 0,
      totalDeduction: 0,
      estimatedPrice: 0,
    })
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <h2 className="card-title">買取査定フォーム</h2>
      </div>
      <div className="card-body">
        {/* 機種 */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label form-label-required">機種</label>
          <select
            value={item.model}
            onChange={(e) => handleModelChange(e.target.value)}
            className={`form-select ${errors[`item_${index}_model`] ? 'form-input-error' : ''}`}
          >
            <option value="">選択してください</option>
            {(() => {
              const groups: { series: string; label: string; models: typeof iphoneModels }[] = []
              for (const m of iphoneModels) {
                let series: string
                if (m.model.startsWith('SE') || m.model === 'SE') {
                  series = 'SE'
                } else if (['X', 'XS', 'XSMax', 'XR'].includes(m.model)) {
                  series = 'X'
                } else if (m.model === 'Air') {
                  series = '17'
                } else if (m.model === '16e') {
                  series = '16'
                } else {
                  series = m.model.match(/^(\d+)/)?.[1] || m.model
                }
                let group = groups.find(g => g.series === series)
                if (!group) {
                  group = { series, label: `${series}シリーズ`, models: [] }
                  groups.push(group)
                }
                group.models.push(m)
              }
              return groups.map(g => (
                <optgroup key={g.series} label={g.label}>
                  {g.models.map(m => (
                    <option key={m.model} value={m.model}>{m.display_name}</option>
                  ))}
                </optgroup>
              ))
            })()}
          </select>
          {errors[`item_${index}_model`] && <div className="form-error">{errors[`item_${index}_model`]}</div>}
        </div>

        {/* 容量 */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label form-label-required">容量</label>
          <select
            value={item.storage}
            onChange={(e) => onUpdate({ storage: e.target.value })}
            className={`form-select ${errors[`item_${index}_storage`] ? 'form-input-error' : ''}`}
            disabled={!item.model}
          >
            <option value="">選択</option>
            {availableStorages.map(s => (
              <option key={s} value={s}>{s >= 1024 ? `${s / 1024}TB` : `${s}GB`}</option>
            ))}
          </select>
          {errors[`item_${index}_storage`] && <div className="form-error">{errors[`item_${index}_storage`]}</div>}
        </div>

        {/* ランク */}
        <div className="form-group" style={{ marginBottom: 8 }}>
          <label className="form-label form-label-required">ランク</label>
          <select
            value={item.rank}
            onChange={(e) => onUpdate({ rank: e.target.value })}
            className={`form-select ${errors[`item_${index}_rank`] ? 'form-input-error' : ''}`}
          >
            <option value="">選択</option>
            {RANK_OPTIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {errors[`item_${index}_rank`] && <div className="form-error">{errors[`item_${index}_rank`]}</div>}
        </div>

        {/* ランク目安 */}
        <div style={{
          background: '#f9fafb',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 8,
          fontSize: 12,
          lineHeight: 1.8,
          color: '#555',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 2, color: '#374151' }}>ランクの目安</div>
          {RANK_DESCRIPTIONS.map(rd => (
            <div key={rd.rank}>
              <strong>{rd.rank}</strong>：{rd.description}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 16 }}>
          ※ 背面割れや水没は買取不可です。
        </div>

        {/* バッテリー残量 */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">バッテリー残量(%)</label>
          <input
            type="number"
            value={item.batteryPercent}
            onChange={(e) => onUpdate({ batteryPercent: e.target.value })}
            onBlur={handleBatteryBlur}
            className="form-input"
            placeholder="95"
            min={0}
            max={100}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4, lineHeight: 1.6 }}>
            ※ 設定→バッテリー→バッテリーの状態の順番で確認出来ます
          </div>
        </div>

        {/* IMEI */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">IMEI</label>
          <input
            type="text"
            value={item.imei}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 15)
              onUpdate({ imei: val })
            }}
            className="form-input"
            placeholder="35XXXXXXXXXXXXX"
            maxLength={15}
            inputMode="numeric"
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4, lineHeight: 1.6 }}>
            ※ 発信画面で＊＃06＃と入力すると確認出来ます<br />
            ※ 35からはじまる15桁の数字です
          </div>
        </div>

        {/* カメラ染み */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">カメラ染み</label>
          <select
            value={item.cameraStain === 'none' ? 'none' : 'yes'}
            onChange={(e) => onUpdate({ cameraStain: e.target.value === 'yes' ? 'minor' : 'none' })}
            className="form-select"
          >
            <option value="none">なし</option>
            <option value="yes">あり</option>
          </select>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4, lineHeight: 1.6 }}>
            ※ 白い無地の背景にカメラをかざすと確認出来ます<br />
            <span
              onClick={() => setShowCameraStainExample(!showCameraStainExample)}
              style={{ color: '#004AAD', textDecoration: 'underline', cursor: 'pointer' }}
            >
              このような症状です。(例)
            </span>
          </div>
          {showCameraStainExample && (
            <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <img
                src="/camerastain.png"
                alt="カメラ染みの例"
                style={{ width: '100%', display: 'block' }}
              />
            </div>
          )}
        </div>

        {/* カメラ窓の破損 */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">カメラ窓の破損</label>
          <select
            value={item.cameraBroken ? 'yes' : 'no'}
            onChange={(e) => onUpdate({ cameraBroken: e.target.value === 'yes' })}
            className="form-select"
          >
            <option value="no">なし</option>
            <option value="yes">あり</option>
          </select>
        </div>

        {/* 非正規修理の利用歴 */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">非正規修理の利用歴</label>
          <select
            value={item.repairHistory ? 'yes' : 'no'}
            onChange={(e) => onUpdate({ repairHistory: e.target.value === 'yes' })}
            className="form-select"
          >
            <option value="no">なし</option>
            <option value="yes">あり</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// 確認行コンポーネント
// =====================================================
function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      padding: '10px 0',
      borderBottom: '1px solid #f3f4f6',
      fontSize: 14,
    }}>
      <span style={{ width: 120, flexShrink: 0, color: '#666', fontWeight: 500 }}>{label}</span>
      <span style={{ color: '#111' }}>{value}</span>
    </div>
  )
}

// =====================================================
// Suspense境界（useSearchParams用）
// =====================================================
export default function MailBuybackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fb' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: '#666' }}>読み込み中...</p>
        </div>
      </div>
    }>
      <MailBuybackPageContent />
    </Suspense>
  )
}
