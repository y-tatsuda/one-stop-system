'use client'

/**
 * =====================================================
 * ECサイト - オンライン査定ページ
 * =====================================================
 *
 * 構成：
 * 1. モデル選択
 * 2. 容量選択
 * 3. 状態選択
 * 4. 査定結果表示
 * 5. 申込への誘導
 * =====================================================
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import '../../shop.css'

// モデルリスト（実際はDBから取得することを想定）
const MODELS = [
  { value: 'iPhone 15 Pro Max', label: 'iPhone 15 Pro Max' },
  { value: 'iPhone 15 Pro', label: 'iPhone 15 Pro' },
  { value: 'iPhone 15 Plus', label: 'iPhone 15 Plus' },
  { value: 'iPhone 15', label: 'iPhone 15' },
  { value: 'iPhone 14 Pro Max', label: 'iPhone 14 Pro Max' },
  { value: 'iPhone 14 Pro', label: 'iPhone 14 Pro' },
  { value: 'iPhone 14 Plus', label: 'iPhone 14 Plus' },
  { value: 'iPhone 14', label: 'iPhone 14' },
  { value: 'iPhone 13 Pro Max', label: 'iPhone 13 Pro Max' },
  { value: 'iPhone 13 Pro', label: 'iPhone 13 Pro' },
  { value: 'iPhone 13', label: 'iPhone 13' },
  { value: 'iPhone 13 mini', label: 'iPhone 13 mini' },
  { value: 'iPhone 12 Pro Max', label: 'iPhone 12 Pro Max' },
  { value: 'iPhone 12 Pro', label: 'iPhone 12 Pro' },
  { value: 'iPhone 12', label: 'iPhone 12' },
  { value: 'iPhone 12 mini', label: 'iPhone 12 mini' },
  { value: 'iPhone SE (第3世代)', label: 'iPhone SE (第3世代)' },
  { value: 'iPhone SE (第2世代)', label: 'iPhone SE (第2世代)' },
  { value: 'iPhone 11 Pro Max', label: 'iPhone 11 Pro Max' },
  { value: 'iPhone 11 Pro', label: 'iPhone 11 Pro' },
  { value: 'iPhone 11', label: 'iPhone 11' },
]

// モデル別容量オプション
const getStorageOptions = (model: string) => {
  if (model.includes('Pro') || model.includes('Max')) {
    return [128, 256, 512, 1024]
  }
  if (model.includes('SE')) {
    return [64, 128, 256]
  }
  return [128, 256, 512]
}

// 状態オプション
const CONDITIONS = [
  { value: 'A', label: '美品', description: '目立った傷や汚れがなく、非常に綺麗な状態' },
  { value: 'B', label: '良品', description: '多少の使用感はあるが、目立つ傷はない' },
  { value: 'C', label: '並品', description: '使用感や小傷があるが、動作に問題なし' },
  { value: 'D', label: '訳あり品', description: '画面割れ・バッテリー劣化・水没歴など' },
]

// 基準価格（実際はDBから取得）
const BASE_PRICES: Record<string, Record<number, number>> = {
  'iPhone 15 Pro Max': { 128: 95000, 256: 100000, 512: 110000, 1024: 120000 },
  'iPhone 15 Pro': { 128: 85000, 256: 90000, 512: 100000, 1024: 110000 },
  'iPhone 15 Plus': { 128: 70000, 256: 75000, 512: 85000 },
  'iPhone 15': { 128: 65000, 256: 70000, 512: 80000 },
  'iPhone 14 Pro Max': { 128: 80000, 256: 85000, 512: 95000, 1024: 105000 },
  'iPhone 14 Pro': { 128: 70000, 256: 75000, 512: 85000, 1024: 95000 },
  'iPhone 14 Plus': { 128: 55000, 256: 60000, 512: 70000 },
  'iPhone 14': { 128: 50000, 256: 55000, 512: 65000 },
  'iPhone 13 Pro Max': { 128: 65000, 256: 70000, 512: 80000, 1024: 90000 },
  'iPhone 13 Pro': { 128: 55000, 256: 60000, 512: 70000, 1024: 80000 },
  'iPhone 13': { 128: 45000, 256: 50000, 512: 58000 },
  'iPhone 13 mini': { 128: 38000, 256: 42000, 512: 48000 },
  'iPhone 12 Pro Max': { 128: 48000, 256: 52000, 512: 58000 },
  'iPhone 12 Pro': { 128: 42000, 256: 46000, 512: 52000 },
  'iPhone 12': { 64: 30000, 128: 35000, 256: 40000 },
  'iPhone 12 mini': { 64: 25000, 128: 28000, 256: 32000 },
  'iPhone SE (第3世代)': { 64: 25000, 128: 28000, 256: 32000 },
  'iPhone SE (第2世代)': { 64: 15000, 128: 18000, 256: 22000 },
  'iPhone 11 Pro Max': { 64: 38000, 256: 42000, 512: 48000 },
  'iPhone 11 Pro': { 64: 32000, 256: 36000, 512: 42000 },
  'iPhone 11': { 64: 25000, 128: 28000, 256: 32000 },
}

// 状態による価格係数
const CONDITION_MULTIPLIERS: Record<string, number> = {
  'A': 1.0,
  'B': 0.85,
  'C': 0.70,
  'D': 0.45,
}

export default function EstimatePage() {
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedStorage, setSelectedStorage] = useState<number | null>(null)
  const [selectedCondition, setSelectedCondition] = useState('')
  const [showResult, setShowResult] = useState(false)

  const storageOptions = useMemo(() => {
    if (!selectedModel) return []
    return getStorageOptions(selectedModel)
  }, [selectedModel])

  const estimatedPrice = useMemo(() => {
    if (!selectedModel || !selectedStorage || !selectedCondition) return null
    const basePrice = BASE_PRICES[selectedModel]?.[selectedStorage]
    if (!basePrice) return null
    const multiplier = CONDITION_MULTIPLIERS[selectedCondition]
    return Math.floor(basePrice * multiplier)
  }, [selectedModel, selectedStorage, selectedCondition])

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
    setSelectedStorage(null)
    setSelectedCondition('')
    setShowResult(false)
  }

  const handleStorageChange = (storage: number) => {
    setSelectedStorage(storage)
    setSelectedCondition('')
    setShowResult(false)
  }

  const handleConditionChange = (condition: string) => {
    setSelectedCondition(condition)
    setShowResult(false)
  }

  const handleEstimate = () => {
    if (selectedModel && selectedStorage && selectedCondition) {
      setShowResult(true)
    }
  }

  const isComplete = selectedModel && selectedStorage && selectedCondition

  return (
    <div className="buyback-page">
      {/* ヘッダー */}
      <section className="estimate-header">
        <div className="estimate-header-content">
          <nav className="estimate-breadcrumb">
            <Link href="/shop">ホーム</Link>
            <span>/</span>
            <Link href="/shop/buyback">買取</Link>
            <span>/</span>
            <span>オンライン査定</span>
          </nav>
          <h1 className="estimate-title">無料オンライン査定</h1>
          <p className="estimate-subtitle">
            あなたのiPhoneの買取価格を今すぐチェック
          </p>
        </div>
      </section>

      <div className="shop-container">
        <div className="estimate-content">
          {/* ステップインジケーター */}
          <div className="estimate-steps">
            <div className={`estimate-step ${selectedModel ? 'completed' : 'active'}`}>
              <div className="estimate-step-number">1</div>
              <div className="estimate-step-label">モデル選択</div>
            </div>
            <div className="estimate-step-line"></div>
            <div className={`estimate-step ${selectedStorage ? 'completed' : selectedModel ? 'active' : ''}`}>
              <div className="estimate-step-number">2</div>
              <div className="estimate-step-label">容量選択</div>
            </div>
            <div className="estimate-step-line"></div>
            <div className={`estimate-step ${selectedCondition ? 'completed' : selectedStorage ? 'active' : ''}`}>
              <div className="estimate-step-number">3</div>
              <div className="estimate-step-label">状態選択</div>
            </div>
            <div className="estimate-step-line"></div>
            <div className={`estimate-step ${showResult ? 'completed' : isComplete ? 'active' : ''}`}>
              <div className="estimate-step-number">4</div>
              <div className="estimate-step-label">査定結果</div>
            </div>
          </div>

          {/* モデル選択 */}
          <div className="estimate-section">
            <h2 className="estimate-section-title">
              <span className="estimate-section-number">1</span>
              モデルを選択
            </h2>
            <div className="estimate-model-grid">
              {MODELS.map((model) => (
                <button
                  key={model.value}
                  className={`estimate-model-btn ${selectedModel === model.value ? 'active' : ''}`}
                  onClick={() => handleModelChange(model.value)}
                >
                  {model.label}
                </button>
              ))}
            </div>
          </div>

          {/* 容量選択 */}
          {selectedModel && (
            <div className="estimate-section">
              <h2 className="estimate-section-title">
                <span className="estimate-section-number">2</span>
                容量を選択
              </h2>
              <div className="estimate-storage-grid">
                {storageOptions.map((storage) => (
                  <button
                    key={storage}
                    className={`estimate-storage-btn ${selectedStorage === storage ? 'active' : ''}`}
                    onClick={() => handleStorageChange(storage)}
                  >
                    {storage >= 1024 ? `${storage / 1024}TB` : `${storage}GB`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 状態選択 */}
          {selectedStorage && (
            <div className="estimate-section">
              <h2 className="estimate-section-title">
                <span className="estimate-section-number">3</span>
                端末の状態を選択
              </h2>
              <div className="estimate-condition-grid">
                {CONDITIONS.map((condition) => (
                  <button
                    key={condition.value}
                    className={`estimate-condition-btn ${selectedCondition === condition.value ? 'active' : ''}`}
                    onClick={() => handleConditionChange(condition.value)}
                  >
                    <span className="estimate-condition-label">{condition.label}</span>
                    <span className="estimate-condition-desc">{condition.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 査定ボタン */}
          {isComplete && !showResult && (
            <div className="estimate-action">
              <button className="estimate-submit-btn" onClick={handleEstimate}>
                査定結果を見る
              </button>
            </div>
          )}

          {/* 査定結果 */}
          {showResult && estimatedPrice && (
            <div className="estimate-result">
              <div className="estimate-result-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h2>査定結果</h2>
              </div>
              <div className="estimate-result-device">
                <p>{selectedModel}</p>
                <p>
                  {selectedStorage && (selectedStorage >= 1024 ? `${selectedStorage / 1024}TB` : `${selectedStorage}GB`)}
                  {' / '}
                  {CONDITIONS.find(c => c.value === selectedCondition)?.label}
                </p>
              </div>
              <div className="estimate-result-price">
                <span className="estimate-result-label">買取予想価格</span>
                <span className="estimate-result-value">
                  <span className="estimate-result-yen">¥</span>
                  {estimatedPrice.toLocaleString()}
                </span>
                <span className="estimate-result-note">
                  ※実際の買取価格は端末の詳細な状態により変動する場合があります
                </span>
              </div>
              <div className="estimate-result-actions">
                <Link href="/shop/buyback/apply" className="estimate-apply-btn">
                  この査定額で申し込む
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
                <button
                  className="estimate-retry-btn"
                  onClick={() => {
                    setSelectedModel('')
                    setSelectedStorage(null)
                    setSelectedCondition('')
                    setShowResult(false)
                  }}
                >
                  別の端末を査定する
                </button>
              </div>
            </div>
          )}

          {/* 注意事項 */}
          <div className="estimate-notice">
            <h3>査定について</h3>
            <ul>
              <li>上記は概算の買取価格です。実際の買取価格は端末の状態を確認後に確定します。</li>
              <li>付属品（箱・充電器・イヤホン等）の有無により価格が変動する場合があります。</li>
              <li>初期化・「iPhoneを探す」のOFFをお願いします。</li>
              <li>ネットワーク利用制限が「×」の端末は買取をお断りする場合があります。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
