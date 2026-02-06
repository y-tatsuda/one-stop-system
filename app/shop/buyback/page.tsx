'use client'

/**
 * =====================================================
 * ECサイト - 買取トップページ
 * =====================================================
 *
 * 構成：
 * 1. ヒーロー（キャッチ + CTA）
 * 2. 高価買取できる理由
 * 3. 買取価格表
 * 4. オンライン査定への誘導
 * 5. 買取の流れ
 * 6. よくある質問
 * =====================================================
 */

import Link from 'next/link'
import '../shop.css'

// 買取価格の目安（実際はDBから取得することを想定）
const BUYBACK_PRICES = [
  { model: 'iPhone 15 Pro Max', storage: '256GB', priceA: '95,000', priceB: '85,000', priceC: '70,000' },
  { model: 'iPhone 15 Pro', storage: '256GB', priceA: '85,000', priceB: '75,000', priceC: '60,000' },
  { model: 'iPhone 15', storage: '128GB', priceA: '65,000', priceB: '55,000', priceC: '45,000' },
  { model: 'iPhone 14 Pro Max', storage: '256GB', priceA: '80,000', priceB: '70,000', priceC: '55,000' },
  { model: 'iPhone 14 Pro', storage: '256GB', priceA: '70,000', priceB: '60,000', priceC: '48,000' },
  { model: 'iPhone 14', storage: '128GB', priceA: '50,000', priceB: '42,000', priceC: '35,000' },
  { model: 'iPhone 13 Pro Max', storage: '256GB', priceA: '65,000', priceB: '55,000', priceC: '45,000' },
  { model: 'iPhone 13 Pro', storage: '256GB', priceA: '55,000', priceB: '47,000', priceC: '38,000' },
  { model: 'iPhone 13', storage: '128GB', priceA: '45,000', priceB: '38,000', priceC: '30,000' },
  { model: 'iPhone 12 Pro Max', storage: '256GB', priceA: '48,000', priceB: '40,000', priceC: '32,000' },
  { model: 'iPhone 12 Pro', storage: '256GB', priceA: '42,000', priceB: '35,000', priceC: '28,000' },
  { model: 'iPhone 12', storage: '128GB', priceA: '32,000', priceB: '26,000', priceC: '20,000' },
  { model: 'iPhone SE (第3世代)', storage: '128GB', priceA: '28,000', priceB: '23,000', priceC: '18,000' },
]

const FAQ_ITEMS = [
  {
    question: '画面が割れていても買取できますか？',
    answer: '画面割れ、背面割れ、水没などの故障端末も買取可能です。状態に応じて査定額をご提示いたします。',
  },
  {
    question: '残債があっても買取できますか？',
    answer: 'ネットワーク利用制限が「△」の端末も買取可能です。ただし「×」の端末は買取をお断りする場合があります。',
  },
  {
    question: '本人確認書類は何が必要ですか？',
    answer: '運転免許証、マイナンバーカード、パスポートなどの顔写真付き身分証明書が必要です。古物営業法に基づく確認となります。',
  },
  {
    question: '査定後のキャンセルはできますか？',
    answer: '査定額にご納得いただけない場合は、無料でご返送いたします。キャンセル料は一切かかりません。',
  },
  {
    question: '入金までどれくらいかかりますか？',
    answer: '端末到着後、最短当日〜翌営業日に査定完了。ご承諾後、即日振込いたします。',
  },
  {
    question: 'データは消去してから送る必要がありますか？',
    answer: 'はい、発送前に必ず初期化をお願いします。iPhoneを探すもOFFにしてください。初期化方法がわからない場合はお問い合わせください。',
  },
]

export default function BuybackPage() {
  return (
    <div className="buyback-page">
      {/* =====================================================
          ヒーローセクション
          ===================================================== */}
      <section className="buyback-hero">
        <div className="buyback-hero-content">
          <span className="buyback-hero-label">iPhone 高価買取</span>
          <h1 className="buyback-hero-title">
            あなたのiPhone、<br />
            高く買い取ります。
          </h1>
          <p className="buyback-hero-subtitle">
            郵送買取で全国対応・送料無料<br />
            最短即日査定・即日入金
          </p>
          <div className="buyback-hero-actions">
            <Link href="/shop/buyback/estimate" className="buyback-hero-btn-primary">
              無料で査定する
            </Link>
            <Link href="#price-table" className="buyback-hero-btn-secondary">
              買取価格を見る
            </Link>
          </div>
        </div>
      </section>

      <div className="shop-container">
        {/* =====================================================
            高価買取できる理由
            ===================================================== */}
        <section className="buyback-reason-section">
          <h2 className="buyback-section-title">高価買取できる理由</h2>
          <div className="buyback-reason-grid">
            <div className="buyback-reason-card">
              <div className="buyback-reason-number">01</div>
              <h3>自社販売だから中間マージンなし</h3>
              <p>
                買い取ったiPhoneは自社のECサイトで直接販売。
                中間業者を挟まないから、その分を買取価格に還元できます。
              </p>
            </div>
            <div className="buyback-reason-card">
              <div className="buyback-reason-number">02</div>
              <h3>修理技術があるから状態問わず買取</h3>
              <p>
                画面割れ・バッテリー劣化も自社で修理可能。
                他社で断られた端末も、適正価格で買い取ります。
              </p>
            </div>
            <div className="buyback-reason-card">
              <div className="buyback-reason-number">03</div>
              <h3>在庫回転が早いから高値をキープ</h3>
              <p>
                SNSでの集客力と360日保証の信頼で、在庫がすぐに売れる。
                だから相場より高く買い取っても利益が出せます。
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            買取価格表
            ===================================================== */}
        <section id="price-table" className="buyback-price-section">
          <h2 className="buyback-section-title">買取価格表</h2>
          <p className="buyback-price-note">
            ※下記は目安価格です。実際の買取価格は端末の状態により変動します。
          </p>
          <div className="buyback-price-table-wrapper">
            <table className="buyback-price-table">
              <thead>
                <tr>
                  <th>モデル</th>
                  <th>容量</th>
                  <th>美品</th>
                  <th>良品</th>
                  <th>並品</th>
                </tr>
              </thead>
              <tbody>
                {BUYBACK_PRICES.map((item, index) => (
                  <tr key={index}>
                    <td className="buyback-price-model">{item.model}</td>
                    <td>{item.storage}</td>
                    <td className="buyback-price-value">¥{item.priceA}</td>
                    <td className="buyback-price-value">¥{item.priceB}</td>
                    <td className="buyback-price-value">¥{item.priceC}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="buyback-price-cta">
            <p>お持ちのiPhoneの正確な査定額を知りたい方は</p>
            <Link href="/shop/buyback/estimate" className="buyback-btn">
              無料オンライン査定へ
            </Link>
          </div>
        </section>

        {/* =====================================================
            買取の流れ
            ===================================================== */}
        <section className="buyback-flow-section">
          <h2 className="buyback-section-title">買取の流れ</h2>
          <div className="buyback-flow-steps">
            <div className="buyback-flow-step">
              <div className="buyback-flow-number">1</div>
              <div className="buyback-flow-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
              </div>
              <h3>オンライン査定</h3>
              <p>機種・容量・状態を選択して概算査定額を確認</p>
            </div>
            <div className="buyback-flow-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
            <div className="buyback-flow-step">
              <div className="buyback-flow-number">2</div>
              <div className="buyback-flow-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3>申込・発送</h3>
              <p>フォーム入力後、着払いで発送（送料無料）</p>
            </div>
            <div className="buyback-flow-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
            <div className="buyback-flow-step">
              <div className="buyback-flow-number">3</div>
              <div className="buyback-flow-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3>査定・ご連絡</h3>
              <p>到着後最短当日に査定、結果をご連絡</p>
            </div>
            <div className="buyback-flow-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
            <div className="buyback-flow-step">
              <div className="buyback-flow-number">4</div>
              <div className="buyback-flow-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3>即日入金</h3>
              <p>ご承諾後、指定口座へ即日振込</p>
            </div>
          </div>
        </section>

        {/* =====================================================
            CTA セクション
            ===================================================== */}
        <section className="buyback-cta-section">
          <div className="buyback-cta-content">
            <h2>まずは無料査定から</h2>
            <p>あなたのiPhoneがいくらになるか、今すぐチェック</p>
            <Link href="/shop/buyback/estimate" className="buyback-cta-btn">
              無料オンライン査定
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </div>
        </section>

        {/* =====================================================
            よくある質問
            ===================================================== */}
        <section className="buyback-faq-section">
          <h2 className="buyback-section-title">よくある質問</h2>
          <div className="buyback-faq-list">
            {FAQ_ITEMS.map((item, index) => (
              <details key={index} className="buyback-faq-item">
                <summary className="buyback-faq-question">
                  <span>{item.question}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </summary>
                <div className="buyback-faq-answer">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
