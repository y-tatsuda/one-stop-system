'use client'

/**
 * =====================================================
 * LIFF 買取申込みページ
 * =====================================================
 *
 * LINEアプリ内で開く買取査定・申込みフォーム
 * - LIFFからLINE UIDを取得
 * - Supabaseの価格マスタからリアルタイム査定
 * - 申込み時にLステップにタグ付け + Slack通知
 * =====================================================
 */

import { useEffect, useState } from 'react'
import liff from '@line/liff'
import { supabase } from '../../lib/supabase'
import { DEFAULT_TENANT_ID } from '../../lib/constants'
import './liff-buyback.css'

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || ''

type Step = 'loading' | 'model' | 'condition' | 'result' | 'address' | 'confirm' | 'complete'

type LineProfile = {
  userId: string
  displayName: string
  pictureUrl?: string
}

type DeviceInfo = {
  model: string
  modelDisplayName: string
  storage: number
  rank: string
}

type ConditionInfo = {
  batteryPercent: number | null
  isServiceState: boolean
  hasScreenCrack: boolean
  cameraStainLevel: string
  nwStatus: string
}

type PriceResult = {
  basePrice: number
  deductions: { reason: string; amount: number }[]
  totalDeduction: number
  guaranteePrice: number
  finalPrice: number
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

type IphoneModel = {
  model: string
  display_name: string
}

export default function LiffBuybackPage() {
  const [step, setStep] = useState<Step>('loading')
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null)
  const [isInClient, setIsInClient] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // フォームデータ
  const [models, setModels] = useState<IphoneModel[]>([])
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    model: '',
    modelDisplayName: '',
    storage: 0,
    rank: '',
  })
  const [conditionInfo, setConditionInfo] = useState<ConditionInfo>({
    batteryPercent: null,
    isServiceState: false,
    hasScreenCrack: false,
    cameraStainLevel: 'none',
    nwStatus: 'ok',
  })
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    nameKana: '',
    postalCode: '',
    address: '',
    addressDetail: '',
    phone: '',
    email: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [requestNumber, setRequestNumber] = useState<string | null>(null)

  // LIFF初期化
  useEffect(() => {
    const initLiff = async () => {
      try {
        if (!LIFF_ID) {
          // 開発時: LIFF IDがない場合はモックモード
          console.log('LIFF ID not set, running in mock mode')
          setLineProfile({
            userId: 'mock_user_id',
            displayName: 'テストユーザー',
          })
          await fetchModels()
          setStep('model')
          return
        }

        await liff.init({ liffId: LIFF_ID })
        setIsInClient(liff.isInClient())

        if (!liff.isLoggedIn()) {
          liff.login()
          return
        }

        const profile = await liff.getProfile()
        setLineProfile({
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        })

        await fetchModels()
        setStep('model')
      } catch (err) {
        console.error('LIFF init error:', err)
        setError('LINEの初期化に失敗しました')
      }
    }

    initLiff()
  }, [])

  // モデル一覧を取得
  const fetchModels = async () => {
    const { data } = await supabase
      .from('m_iphone_models')
      .select('model, display_name')
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .eq('is_active', true)
      .order('sort_order')

    setModels(data || [])
  }

  // 容量オプションを取得
  const getStorageOptions = (model: string): number[] => {
    // モデルによって異なる容量オプション
    const storageMap: { [key: string]: number[] } = {
      '16ProMax': [256, 512, 1000],
      '16Pro': [128, 256, 512, 1000],
      '16Plus': [128, 256, 512],
      '16': [128, 256, 512],
      '16e': [128, 256],
      '15ProMax': [256, 512, 1000],
      '15Pro': [128, 256, 512, 1000],
      '15Plus': [128, 256, 512],
      '15': [128, 256, 512],
      '14ProMax': [128, 256, 512, 1000],
      '14Pro': [128, 256, 512, 1000],
      '14Plus': [128, 256, 512],
      '14': [128, 256, 512],
      '13ProMax': [128, 256, 512, 1000],
      '13Pro': [128, 256, 512, 1000],
      '13': [128, 256, 512],
      '13mini': [128, 256, 512],
      '12ProMax': [128, 256, 512],
      '12Pro': [128, 256, 512],
      '12': [64, 128, 256],
      '12mini': [64, 128, 256],
      'SE3': [64, 128, 256],
      'SE2': [64, 128, 256],
    }
    return storageMap[model] || [64, 128, 256, 512]
  }

  // 価格計算
  const calculatePrice = async () => {
    const { data: priceData } = await supabase
      .from('m_buyback_prices')
      .select('price')
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .eq('model', deviceInfo.model)
      .eq('storage', deviceInfo.storage)
      .eq('rank', deviceInfo.rank)
      .eq('is_active', true)
      .single()

    if (!priceData) {
      setError('価格情報が見つかりませんでした')
      return
    }

    const basePrice = priceData.price
    const deductions: { reason: string; amount: number }[] = []
    let totalDeduction = 0

    // 減額計算
    if (conditionInfo.batteryPercent && conditionInfo.batteryPercent < 80) {
      const amount = Math.floor(basePrice * 0.1)
      deductions.push({ reason: 'バッテリー80%未満', amount })
      totalDeduction += amount
    }

    if (conditionInfo.isServiceState) {
      const amount = Math.floor(basePrice * 0.15)
      deductions.push({ reason: 'サービス表示', amount })
      totalDeduction += amount
    }

    if (conditionInfo.hasScreenCrack) {
      const amount = Math.floor(basePrice * 0.2)
      deductions.push({ reason: '画面割れあり', amount })
      totalDeduction += amount
    }

    if (conditionInfo.cameraStainLevel === 'minor') {
      const amount = Math.floor(basePrice * 0.05)
      deductions.push({ reason: 'カメラ染み（軽度）', amount })
      totalDeduction += amount
    } else if (conditionInfo.cameraStainLevel === 'major') {
      const amount = Math.floor(basePrice * 0.1)
      deductions.push({ reason: 'カメラ染み（重度）', amount })
      totalDeduction += amount
    }

    if (conditionInfo.nwStatus === 'triangle') {
      const amount = Math.floor(basePrice * 0.1)
      deductions.push({ reason: 'ネットワーク制限△', amount })
      totalDeduction += amount
    } else if (conditionInfo.nwStatus === 'cross') {
      const amount = Math.floor(basePrice * 0.3)
      deductions.push({ reason: 'ネットワーク制限×', amount })
      totalDeduction += amount
    }

    // 最低保証価格
    const { data: guaranteeData } = await supabase
      .from('m_buyback_guarantees')
      .select('guarantee_price')
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .eq('model', deviceInfo.model)
      .eq('storage', deviceInfo.storage)
      .eq('rank', deviceInfo.rank)
      .single()

    const guaranteePrice = guaranteeData?.guarantee_price || 0
    const finalPrice = Math.max(basePrice - totalDeduction, guaranteePrice)

    setPriceResult({
      basePrice,
      deductions,
      totalDeduction,
      guaranteePrice,
      finalPrice,
    })
    setStep('result')
  }

  // 申込み送信
  const submitApplication = async () => {
    if (!lineProfile) return
    setSubmitting(true)

    try {
      const response = await fetch('/api/liff/buyback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId: lineProfile.userId,
          lineDisplayName: lineProfile.displayName,
          items: [{
            model: deviceInfo.model,
            modelDisplayName: deviceInfo.modelDisplayName,
            storage: deviceInfo.storage,
            rank: deviceInfo.rank,
            condition: conditionInfo,
            estimatedPrice: priceResult?.finalPrice,
          }],
          customerInfo,
          totalEstimatedPrice: priceResult?.finalPrice || 0,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setRequestNumber(result.requestNumber)
        setStep('complete')
      } else {
        setError(result.error || '申込みに失敗しました')
      }
    } catch (err) {
      console.error('Submit error:', err)
      setError('申込みに失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  // ローディング画面
  if (step === 'loading') {
    return (
      <div className="liff-container">
        <div className="liff-loading">
          <div className="liff-spinner"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  // エラー画面
  if (error) {
    return (
      <div className="liff-container">
        <div className="liff-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>再読み込み</button>
        </div>
      </div>
    )
  }

  return (
    <div className="liff-container">
      {/* ヘッダー */}
      <header className="liff-header">
        <h1>買取査定</h1>
        {lineProfile && (
          <div className="liff-user">
            {lineProfile.pictureUrl && (
              <img src={lineProfile.pictureUrl} alt="" className="liff-avatar" />
            )}
            <span>{lineProfile.displayName}</span>
          </div>
        )}
      </header>

      {/* ステップインジケーター */}
      <div className="liff-steps">
        {['機種選択', '状態入力', '査定結果', '配送先', '確認'].map((label, i) => {
          const stepIndex = ['model', 'condition', 'result', 'address', 'confirm'].indexOf(step)
          return (
            <div
              key={label}
              className={`liff-step ${i <= stepIndex ? 'active' : ''} ${i < stepIndex ? 'completed' : ''}`}
            >
              <span className="liff-step-number">{i + 1}</span>
              <span className="liff-step-label">{label}</span>
            </div>
          )
        })}
      </div>

      {/* メインコンテンツ */}
      <main className="liff-main">
        {/* ① 機種選択 */}
        {step === 'model' && (
          <div className="liff-section">
            <h2>機種を選択してください</h2>

            <div className="liff-form-group">
              <label>モデル</label>
              <select
                value={deviceInfo.model}
                onChange={(e) => {
                  const model = e.target.value
                  const displayName = models.find(m => m.model === model)?.display_name || model
                  setDeviceInfo({ ...deviceInfo, model, modelDisplayName: displayName, storage: 0 })
                }}
              >
                <option value="">選択してください</option>
                {models.map(m => (
                  <option key={m.model} value={m.model}>{m.display_name}</option>
                ))}
              </select>
            </div>

            {deviceInfo.model && (
              <div className="liff-form-group">
                <label>容量</label>
                <div className="liff-button-group">
                  {getStorageOptions(deviceInfo.model).map(storage => (
                    <button
                      key={storage}
                      className={`liff-option-btn ${deviceInfo.storage === storage ? 'selected' : ''}`}
                      onClick={() => setDeviceInfo({ ...deviceInfo, storage })}
                    >
                      {storage >= 1000 ? `${storage / 1000}TB` : `${storage}GB`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {deviceInfo.storage > 0 && (
              <div className="liff-form-group">
                <label>状態ランク</label>
                <div className="liff-button-group">
                  {['美品', '良品', '並品', '訳あり'].map(rank => (
                    <button
                      key={rank}
                      className={`liff-option-btn ${deviceInfo.rank === rank ? 'selected' : ''}`}
                      onClick={() => setDeviceInfo({ ...deviceInfo, rank })}
                    >
                      {rank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className="liff-primary-btn"
              disabled={!deviceInfo.model || !deviceInfo.storage || !deviceInfo.rank}
              onClick={() => setStep('condition')}
            >
              次へ
            </button>
          </div>
        )}

        {/* ② 状態入力 */}
        {step === 'condition' && (
          <div className="liff-section">
            <h2>端末の状態を教えてください</h2>

            <div className="liff-form-group">
              <label>バッテリー最大容量</label>
              <div className="liff-input-with-unit">
                <input
                  type="number"
                  value={conditionInfo.batteryPercent || ''}
                  onChange={(e) => setConditionInfo({
                    ...conditionInfo,
                    batteryPercent: e.target.value ? parseInt(e.target.value) : null,
                    isServiceState: false,
                  })}
                  placeholder="80"
                  min="0"
                  max="100"
                />
                <span>%</span>
              </div>
              <label className="liff-checkbox">
                <input
                  type="checkbox"
                  checked={conditionInfo.isServiceState}
                  onChange={(e) => setConditionInfo({
                    ...conditionInfo,
                    isServiceState: e.target.checked,
                    batteryPercent: e.target.checked ? null : conditionInfo.batteryPercent,
                  })}
                />
                「サービス」と表示されている
              </label>
            </div>

            <div className="liff-form-group">
              <label>画面の状態</label>
              <div className="liff-button-group">
                <button
                  className={`liff-option-btn ${!conditionInfo.hasScreenCrack ? 'selected' : ''}`}
                  onClick={() => setConditionInfo({ ...conditionInfo, hasScreenCrack: false })}
                >
                  割れなし
                </button>
                <button
                  className={`liff-option-btn ${conditionInfo.hasScreenCrack ? 'selected' : ''}`}
                  onClick={() => setConditionInfo({ ...conditionInfo, hasScreenCrack: true })}
                >
                  割れあり
                </button>
              </div>
            </div>

            <div className="liff-form-group">
              <label>カメラ染み</label>
              <div className="liff-button-group">
                {[
                  { value: 'none', label: 'なし' },
                  { value: 'minor', label: '軽度' },
                  { value: 'major', label: '重度' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`liff-option-btn ${conditionInfo.cameraStainLevel === opt.value ? 'selected' : ''}`}
                    onClick={() => setConditionInfo({ ...conditionInfo, cameraStainLevel: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="liff-form-group">
              <label>ネットワーク利用制限</label>
              <div className="liff-button-group">
                {[
                  { value: 'ok', label: '○' },
                  { value: 'triangle', label: '△' },
                  { value: 'cross', label: '×' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`liff-option-btn ${conditionInfo.nwStatus === opt.value ? 'selected' : ''}`}
                    onClick={() => setConditionInfo({ ...conditionInfo, nwStatus: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="liff-btn-group">
              <button className="liff-secondary-btn" onClick={() => setStep('model')}>
                戻る
              </button>
              <button className="liff-primary-btn" onClick={calculatePrice}>
                査定する
              </button>
            </div>
          </div>
        )}

        {/* ③ 査定結果 */}
        {step === 'result' && priceResult && (
          <div className="liff-section">
            <h2>査定結果</h2>

            <div className="liff-result-card">
              <div className="liff-result-device">
                <strong>{deviceInfo.modelDisplayName}</strong>
                <span>{deviceInfo.storage >= 1000 ? `${deviceInfo.storage / 1000}TB` : `${deviceInfo.storage}GB`} / {deviceInfo.rank}</span>
              </div>

              <div className="liff-result-price">
                <div className="liff-result-row">
                  <span>基本買取価格</span>
                  <span>¥{priceResult.basePrice.toLocaleString()}</span>
                </div>
                {priceResult.deductions.map((d, i) => (
                  <div key={i} className="liff-result-row deduction">
                    <span>{d.reason}</span>
                    <span>-¥{d.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="liff-result-row total">
                  <span>買取価格</span>
                  <span>¥{priceResult.finalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <p className="liff-note">
              ※ 実際の買取価格は端末の状態を確認後に確定します
            </p>

            <div className="liff-btn-group">
              <button className="liff-secondary-btn" onClick={() => setStep('condition')}>
                条件を変更
              </button>
              <button className="liff-primary-btn" onClick={() => setStep('address')}>
                この価格で申し込む
              </button>
            </div>
          </div>
        )}

        {/* ④ 配送先入力 */}
        {step === 'address' && (
          <div className="liff-section">
            <h2>配送先情報</h2>

            <div className="liff-form-group">
              <label>お名前 <span className="required">必須</span></label>
              <input
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                placeholder="山田 太郎"
              />
            </div>

            <div className="liff-form-group">
              <label>フリガナ</label>
              <input
                type="text"
                value={customerInfo.nameKana}
                onChange={(e) => setCustomerInfo({ ...customerInfo, nameKana: e.target.value })}
                placeholder="ヤマダ タロウ"
              />
            </div>

            <div className="liff-form-group">
              <label>郵便番号 <span className="required">必須</span></label>
              <input
                type="text"
                value={customerInfo.postalCode}
                onChange={(e) => setCustomerInfo({ ...customerInfo, postalCode: e.target.value })}
                placeholder="123-4567"
                maxLength={8}
              />
            </div>

            <div className="liff-form-group">
              <label>住所 <span className="required">必須</span></label>
              <input
                type="text"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                placeholder="福井県○○市○○町1-2-3"
              />
            </div>

            <div className="liff-form-group">
              <label>建物名・部屋番号</label>
              <input
                type="text"
                value={customerInfo.addressDetail}
                onChange={(e) => setCustomerInfo({ ...customerInfo, addressDetail: e.target.value })}
                placeholder="○○マンション 101号室"
              />
            </div>

            <div className="liff-form-group">
              <label>電話番号 <span className="required">必須</span></label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                placeholder="090-1234-5678"
              />
            </div>

            <div className="liff-form-group">
              <label>メールアドレス</label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                placeholder="example@email.com"
              />
            </div>

            <div className="liff-btn-group">
              <button className="liff-secondary-btn" onClick={() => setStep('result')}>
                戻る
              </button>
              <button
                className="liff-primary-btn"
                disabled={!customerInfo.name || !customerInfo.postalCode || !customerInfo.address || !customerInfo.phone}
                onClick={() => setStep('confirm')}
              >
                確認画面へ
              </button>
            </div>
          </div>
        )}

        {/* ⑤ 確認 */}
        {step === 'confirm' && priceResult && (
          <div className="liff-section">
            <h2>申込み内容の確認</h2>

            <div className="liff-confirm-card">
              <h3>端末情報</h3>
              <dl>
                <dt>機種</dt>
                <dd>{deviceInfo.modelDisplayName}</dd>
                <dt>容量</dt>
                <dd>{deviceInfo.storage >= 1000 ? `${deviceInfo.storage / 1000}TB` : `${deviceInfo.storage}GB`}</dd>
                <dt>状態</dt>
                <dd>{deviceInfo.rank}</dd>
                <dt>査定価格</dt>
                <dd className="price">¥{priceResult.finalPrice.toLocaleString()}</dd>
              </dl>
            </div>

            <div className="liff-confirm-card">
              <h3>配送先</h3>
              <dl>
                <dt>お名前</dt>
                <dd>{customerInfo.name}</dd>
                <dt>住所</dt>
                <dd>〒{customerInfo.postalCode}<br/>{customerInfo.address} {customerInfo.addressDetail}</dd>
                <dt>電話番号</dt>
                <dd>{customerInfo.phone}</dd>
                {customerInfo.email && (
                  <>
                    <dt>メール</dt>
                    <dd>{customerInfo.email}</dd>
                  </>
                )}
              </dl>
            </div>

            <div className="liff-btn-group">
              <button className="liff-secondary-btn" onClick={() => setStep('address')}>
                修正する
              </button>
              <button
                className="liff-primary-btn"
                disabled={submitting}
                onClick={submitApplication}
              >
                {submitting ? '送信中...' : '申込みを確定する'}
              </button>
            </div>
          </div>
        )}

        {/* 完了 */}
        {step === 'complete' && (
          <div className="liff-section liff-complete">
            <div className="liff-complete-icon">✓</div>
            <h2>申込みが完了しました</h2>
            <p className="liff-request-number">
              申込番号: <strong>{requestNumber}</strong>
            </p>
            <p>
              配送キットを発送いたします。<br/>
              届きましたら端末を梱包してご返送ください。
            </p>
            <p className="liff-note">
              進捗はLINEでお知らせします
            </p>
            {isInClient && (
              <button className="liff-primary-btn" onClick={() => liff.closeWindow()}>
                閉じる
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
