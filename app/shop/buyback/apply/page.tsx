'use client'

/**
 * =====================================================
 * ECサイト - 郵送買取申込ページ
 * =====================================================
 *
 * 構成：
 * 1. お客様情報入力
 * 2. 端末情報入力
 * 3. 振込先情報
 * 4. 確認・送信
 * =====================================================
 */

import { useState } from 'react'
import Link from 'next/link'
import '../../shop.css'

type FormData = {
  // お客様情報
  name: string
  nameKana: string
  email: string
  phone: string
  postalCode: string
  prefecture: string
  city: string
  address: string
  building: string
  // 端末情報
  model: string
  storage: string
  color: string
  condition: string
  hasBox: boolean
  hasCharger: boolean
  memo: string
  // 振込先情報
  bankName: string
  branchName: string
  accountType: string
  accountNumber: string
  accountHolder: string
}

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

const MODELS = [
  'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
  'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
  'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini',
  'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini',
  'iPhone SE (第3世代)', 'iPhone SE (第2世代)',
  'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
  'その他'
]

const STORAGES = ['64GB', '128GB', '256GB', '512GB', '1TB']

const CONDITIONS = [
  { value: 'A', label: '美品 - 目立った傷や汚れがない' },
  { value: 'B', label: '良品 - 多少の使用感があるが目立つ傷はない' },
  { value: 'C', label: '並品 - 使用感や小傷がある' },
  { value: 'D', label: '訳あり品 - 画面割れ・バッテリー劣化など' },
]

export default function ApplyPage() {
  const [step, setStep] = useState(1)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    nameKana: '',
    email: '',
    phone: '',
    postalCode: '',
    prefecture: '',
    city: '',
    address: '',
    building: '',
    model: '',
    storage: '',
    color: '',
    condition: '',
    hasBox: false,
    hasCharger: false,
    memo: '',
    bankName: '',
    branchName: '',
    accountType: '普通',
    accountNumber: '',
    accountHolder: '',
  })

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep1 = () => {
    return formData.name && formData.nameKana && formData.email &&
           formData.phone && formData.postalCode && formData.prefecture &&
           formData.city && formData.address
  }

  const validateStep2 = () => {
    return formData.model && formData.storage && formData.condition
  }

  const validateStep3 = () => {
    return formData.bankName && formData.branchName &&
           formData.accountNumber && formData.accountHolder
  }

  const handleSubmit = async () => {
    if (!agreed) {
      alert('利用規約に同意してください')
      return
    }

    setSubmitting(true)
    // 実際はAPIへの送信処理
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="buyback-page">
        <div className="shop-container">
          <div className="apply-complete">
            <div className="apply-complete-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h1>お申し込みありがとうございます</h1>
            <p>
              お申し込みを受け付けました。<br />
              ご登録いただいたメールアドレスに確認メールをお送りしましたのでご確認ください。
            </p>
            <div className="apply-complete-next">
              <h2>次のステップ</h2>
              <ol>
                <li>確認メールに記載の発送方法に従って、端末をお送りください（送料無料・着払い）</li>
                <li>端末到着後、最短当日〜翌営業日に査定結果をご連絡します</li>
                <li>査定額にご承諾いただけましたら、即日振込いたします</li>
              </ol>
            </div>
            <div className="apply-complete-notice">
              <h3>発送前の確認事項</h3>
              <ul>
                <li>端末を初期化してください</li>
                <li>「iPhoneを探す」をOFFにしてください</li>
                <li>SIMカードを取り出してください</li>
              </ul>
            </div>
            <Link href="/shop" className="apply-complete-btn">
              トップページへ戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="buyback-page">
      {/* ヘッダー */}
      <section className="apply-header">
        <div className="apply-header-content">
          <nav className="estimate-breadcrumb">
            <Link href="/shop">ホーム</Link>
            <span>/</span>
            <Link href="/shop/buyback">買取</Link>
            <span>/</span>
            <span>郵送買取申込</span>
          </nav>
          <h1 className="apply-title">郵送買取申込</h1>
          <p className="apply-subtitle">
            送料無料・最短即日査定・即日入金
          </p>
        </div>
      </section>

      <div className="shop-container">
        <div className="apply-content">
          {/* ステップインジケーター */}
          <div className="apply-steps">
            <div className={`apply-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="apply-step-number">1</div>
              <div className="apply-step-label">お客様情報</div>
            </div>
            <div className="apply-step-line"></div>
            <div className={`apply-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="apply-step-number">2</div>
              <div className="apply-step-label">端末情報</div>
            </div>
            <div className="apply-step-line"></div>
            <div className={`apply-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <div className="apply-step-number">3</div>
              <div className="apply-step-label">振込先</div>
            </div>
            <div className="apply-step-line"></div>
            <div className={`apply-step ${step >= 4 ? 'active' : ''}`}>
              <div className="apply-step-number">4</div>
              <div className="apply-step-label">確認</div>
            </div>
          </div>

          {/* Step 1: お客様情報 */}
          {step === 1 && (
            <div className="apply-form-section">
              <h2 className="apply-form-title">お客様情報</h2>

              <div className="apply-form-row">
                <div className="apply-form-group">
                  <label className="apply-form-label">お名前 <span className="required">必須</span></label>
                  <input
                    type="text"
                    className="apply-form-input"
                    placeholder="山田 太郎"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>
                <div className="apply-form-group">
                  <label className="apply-form-label">フリガナ <span className="required">必須</span></label>
                  <input
                    type="text"
                    className="apply-form-input"
                    placeholder="ヤマダ タロウ"
                    value={formData.nameKana}
                    onChange={(e) => updateField('nameKana', e.target.value)}
                  />
                </div>
              </div>

              <div className="apply-form-row">
                <div className="apply-form-group">
                  <label className="apply-form-label">メールアドレス <span className="required">必須</span></label>
                  <input
                    type="email"
                    className="apply-form-input"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
                <div className="apply-form-group">
                  <label className="apply-form-label">電話番号 <span className="required">必須</span></label>
                  <input
                    type="tel"
                    className="apply-form-input"
                    placeholder="090-1234-5678"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="apply-form-group">
                <label className="apply-form-label">郵便番号 <span className="required">必須</span></label>
                <input
                  type="text"
                  className="apply-form-input apply-form-input-sm"
                  placeholder="123-4567"
                  value={formData.postalCode}
                  onChange={(e) => updateField('postalCode', e.target.value)}
                />
              </div>

              <div className="apply-form-row">
                <div className="apply-form-group">
                  <label className="apply-form-label">都道府県 <span className="required">必須</span></label>
                  <select
                    className="apply-form-select"
                    value={formData.prefecture}
                    onChange={(e) => updateField('prefecture', e.target.value)}
                  >
                    <option value="">選択してください</option>
                    {PREFECTURES.map(pref => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                </div>
                <div className="apply-form-group">
                  <label className="apply-form-label">市区町村 <span className="required">必須</span></label>
                  <input
                    type="text"
                    className="apply-form-input"
                    placeholder="渋谷区神南"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                </div>
              </div>

              <div className="apply-form-group">
                <label className="apply-form-label">番地 <span className="required">必須</span></label>
                <input
                  type="text"
                  className="apply-form-input"
                  placeholder="1-2-3"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>

              <div className="apply-form-group">
                <label className="apply-form-label">建物名・部屋番号</label>
                <input
                  type="text"
                  className="apply-form-input"
                  placeholder="〇〇マンション 101号室"
                  value={formData.building}
                  onChange={(e) => updateField('building', e.target.value)}
                />
              </div>

              <div className="apply-form-actions">
                <button
                  className="apply-next-btn"
                  onClick={() => setStep(2)}
                  disabled={!validateStep1()}
                >
                  次へ進む
                </button>
              </div>
            </div>
          )}

          {/* Step 2: 端末情報 */}
          {step === 2 && (
            <div className="apply-form-section">
              <h2 className="apply-form-title">端末情報</h2>

              <div className="apply-form-row">
                <div className="apply-form-group">
                  <label className="apply-form-label">機種名 <span className="required">必須</span></label>
                  <select
                    className="apply-form-select"
                    value={formData.model}
                    onChange={(e) => updateField('model', e.target.value)}
                  >
                    <option value="">選択してください</option>
                    {MODELS.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                <div className="apply-form-group">
                  <label className="apply-form-label">容量 <span className="required">必須</span></label>
                  <select
                    className="apply-form-select"
                    value={formData.storage}
                    onChange={(e) => updateField('storage', e.target.value)}
                  >
                    <option value="">選択してください</option>
                    {STORAGES.map(storage => (
                      <option key={storage} value={storage}>{storage}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="apply-form-group">
                <label className="apply-form-label">カラー</label>
                <input
                  type="text"
                  className="apply-form-input"
                  placeholder="例：スペースブラック"
                  value={formData.color}
                  onChange={(e) => updateField('color', e.target.value)}
                />
              </div>

              <div className="apply-form-group">
                <label className="apply-form-label">端末の状態 <span className="required">必須</span></label>
                <div className="apply-condition-options">
                  {CONDITIONS.map(condition => (
                    <label key={condition.value} className="apply-condition-option">
                      <input
                        type="radio"
                        name="condition"
                        value={condition.value}
                        checked={formData.condition === condition.value}
                        onChange={(e) => updateField('condition', e.target.value)}
                      />
                      <span>{condition.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="apply-form-group">
                <label className="apply-form-label">付属品</label>
                <div className="apply-checkbox-group">
                  <label className="apply-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.hasBox}
                      onChange={(e) => updateField('hasBox', e.target.checked)}
                    />
                    <span>箱あり</span>
                  </label>
                  <label className="apply-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.hasCharger}
                      onChange={(e) => updateField('hasCharger', e.target.checked)}
                    />
                    <span>充電器あり</span>
                  </label>
                </div>
              </div>

              <div className="apply-form-group">
                <label className="apply-form-label">備考</label>
                <textarea
                  className="apply-form-textarea"
                  placeholder="画面割れの箇所、バッテリーの状態など、端末の状態について詳しくお書きください"
                  rows={4}
                  value={formData.memo}
                  onChange={(e) => updateField('memo', e.target.value)}
                />
              </div>

              <div className="apply-form-actions">
                <button className="apply-back-btn" onClick={() => setStep(1)}>
                  戻る
                </button>
                <button
                  className="apply-next-btn"
                  onClick={() => setStep(3)}
                  disabled={!validateStep2()}
                >
                  次へ進む
                </button>
              </div>
            </div>
          )}

          {/* Step 3: 振込先情報 */}
          {step === 3 && (
            <div className="apply-form-section">
              <h2 className="apply-form-title">振込先情報</h2>
              <p className="apply-form-note">査定完了後、下記口座へお振込みいたします</p>

              <div className="apply-form-row">
                <div className="apply-form-group">
                  <label className="apply-form-label">金融機関名 <span className="required">必須</span></label>
                  <input
                    type="text"
                    className="apply-form-input"
                    placeholder="〇〇銀行"
                    value={formData.bankName}
                    onChange={(e) => updateField('bankName', e.target.value)}
                  />
                </div>
                <div className="apply-form-group">
                  <label className="apply-form-label">支店名 <span className="required">必須</span></label>
                  <input
                    type="text"
                    className="apply-form-input"
                    placeholder="〇〇支店"
                    value={formData.branchName}
                    onChange={(e) => updateField('branchName', e.target.value)}
                  />
                </div>
              </div>

              <div className="apply-form-row">
                <div className="apply-form-group">
                  <label className="apply-form-label">口座種別 <span className="required">必須</span></label>
                  <select
                    className="apply-form-select"
                    value={formData.accountType}
                    onChange={(e) => updateField('accountType', e.target.value)}
                  >
                    <option value="普通">普通</option>
                    <option value="当座">当座</option>
                  </select>
                </div>
                <div className="apply-form-group">
                  <label className="apply-form-label">口座番号 <span className="required">必須</span></label>
                  <input
                    type="text"
                    className="apply-form-input"
                    placeholder="1234567"
                    value={formData.accountNumber}
                    onChange={(e) => updateField('accountNumber', e.target.value)}
                  />
                </div>
              </div>

              <div className="apply-form-group">
                <label className="apply-form-label">口座名義（カタカナ） <span className="required">必須</span></label>
                <input
                  type="text"
                  className="apply-form-input"
                  placeholder="ヤマダ タロウ"
                  value={formData.accountHolder}
                  onChange={(e) => updateField('accountHolder', e.target.value)}
                />
              </div>

              <div className="apply-form-actions">
                <button className="apply-back-btn" onClick={() => setStep(2)}>
                  戻る
                </button>
                <button
                  className="apply-next-btn"
                  onClick={() => setStep(4)}
                  disabled={!validateStep3()}
                >
                  確認画面へ
                </button>
              </div>
            </div>
          )}

          {/* Step 4: 確認 */}
          {step === 4 && (
            <div className="apply-form-section">
              <h2 className="apply-form-title">入力内容の確認</h2>

              <div className="apply-confirm-section">
                <h3>お客様情報</h3>
                <dl className="apply-confirm-list">
                  <dt>お名前</dt>
                  <dd>{formData.name}（{formData.nameKana}）</dd>
                  <dt>メールアドレス</dt>
                  <dd>{formData.email}</dd>
                  <dt>電話番号</dt>
                  <dd>{formData.phone}</dd>
                  <dt>住所</dt>
                  <dd>
                    〒{formData.postalCode}<br />
                    {formData.prefecture}{formData.city}{formData.address}
                    {formData.building && <><br />{formData.building}</>}
                  </dd>
                </dl>
              </div>

              <div className="apply-confirm-section">
                <h3>端末情報</h3>
                <dl className="apply-confirm-list">
                  <dt>機種</dt>
                  <dd>{formData.model} {formData.storage} {formData.color}</dd>
                  <dt>状態</dt>
                  <dd>{CONDITIONS.find(c => c.value === formData.condition)?.label}</dd>
                  <dt>付属品</dt>
                  <dd>
                    {formData.hasBox && '箱あり '}
                    {formData.hasCharger && '充電器あり '}
                    {!formData.hasBox && !formData.hasCharger && 'なし'}
                  </dd>
                  {formData.memo && (
                    <>
                      <dt>備考</dt>
                      <dd>{formData.memo}</dd>
                    </>
                  )}
                </dl>
              </div>

              <div className="apply-confirm-section">
                <h3>振込先情報</h3>
                <dl className="apply-confirm-list">
                  <dt>金融機関</dt>
                  <dd>{formData.bankName} {formData.branchName}</dd>
                  <dt>口座</dt>
                  <dd>{formData.accountType} {formData.accountNumber}</dd>
                  <dt>口座名義</dt>
                  <dd>{formData.accountHolder}</dd>
                </dl>
              </div>

              <div className="apply-agreement">
                <label className="apply-agreement-checkbox">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <span>
                    <Link href="/shop/terms" target="_blank">利用規約</Link>および
                    <Link href="/shop/privacy" target="_blank">プライバシーポリシー</Link>に同意する
                  </span>
                </label>
              </div>

              <div className="apply-form-actions">
                <button className="apply-back-btn" onClick={() => setStep(3)}>
                  戻る
                </button>
                <button
                  className="apply-submit-btn"
                  onClick={handleSubmit}
                  disabled={!agreed || submitting}
                >
                  {submitting ? '送信中...' : '申し込む'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
