'use client'

/**
 * =====================================================
 * ECサイト - 360日保証ページ
 * =====================================================
 */

import Link from 'next/link'
import '../shop.css'

export default function WarrantyPage() {
  return (
    <div className="content-page">
      <h1>360日保証について</h1>

      <div className="content-highlight" style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
        <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
          業界最長クラス 360日保証
        </p>
        <p style={{ margin: 'var(--space-sm) 0 0 0', color: 'var(--color-text-secondary)' }}>
          ONE STOPでは、お客様に安心してお使いいただくため、<br />
          すべての商品に360日間の保証をお付けしています。
        </p>
      </div>

      <h2>保証内容</h2>

      <table className="content-table">
        <thead>
          <tr>
            <th>期間</th>
            <th>返金率</th>
            <th>修理時のお客様負担</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>購入後 0〜59日</td>
            <td><strong style={{ color: 'var(--color-success)' }}>100%</strong></td>
            <td>無償修理</td>
          </tr>
          <tr>
            <td>購入後 60〜119日</td>
            <td>90%</td>
            <td>10%負担</td>
          </tr>
          <tr>
            <td>購入後 120〜179日</td>
            <td>80%</td>
            <td>20%負担</td>
          </tr>
          <tr>
            <td>購入後 180〜239日</td>
            <td>70%</td>
            <td>30%負担</td>
          </tr>
          <tr>
            <td>購入後 240〜299日</td>
            <td>60%</td>
            <td>40%負担</td>
          </tr>
          <tr>
            <td>購入後 300〜359日</td>
            <td>50%</td>
            <td>50%負担</td>
          </tr>
        </tbody>
      </table>

      <h2>保証対象</h2>

      <ul>
        <li>自然故障（通常使用での不具合）</li>
        <li>バッテリーの著しい劣化</li>
        <li>タッチパネルの不具合</li>
        <li>スピーカー・マイクの故障</li>
        <li>カメラの不具合</li>
        <li>その他、初期不良と認められるもの</li>
      </ul>

      <h2>保証対象外</h2>

      <div className="content-warning">
        <p style={{ margin: 0 }}>以下の場合は保証対象外となります。あらかじめご了承ください。</p>
      </div>

      <ul>
        <li>水没・水濡れによる故障</li>
        <li>落下・衝撃による破損</li>
        <li>お客様による改造・分解</li>
        <li>非正規修理店での修理後の不具合</li>
        <li>紛失・盗難</li>
        <li>自然災害による損傷</li>
      </ul>

      <h2>保証の申請方法</h2>

      <div className="content-step">
        <div className="content-step-number">1</div>
        <div className="content-step-body">
          <h3 className="content-step-title">Webから申請</h3>
          <p className="content-step-text">
            下記のサポートフォームより、症状と購入情報をお送りください。
          </p>
        </div>
      </div>

      <div className="content-step">
        <div className="content-step-number">2</div>
        <div className="content-step-body">
          <h3 className="content-step-title">確認のご連絡</h3>
          <p className="content-step-text">
            内容を確認後、対応方法をご案内します。（通常1〜2営業日以内）
          </p>
        </div>
      </div>

      <div className="content-step">
        <div className="content-step-number">3</div>
        <div className="content-step-body">
          <h3 className="content-step-title">修理または返金</h3>
          <p className="content-step-text">
            <strong>修理の場合：</strong>店舗へお持ち込み or 郵送<br />
            <strong>返金の場合：</strong>ご指定の口座へお振込み
          </p>
        </div>
      </div>

      <h2>よくある質問</h2>

      <h3>Q: 保証書は発行されますか？</h3>
      <p>A: 購入時の「注文確認メール」が保証書の代わりとなります。大切に保管してください。</p>

      <h3>Q: 購入日はどこで確認できますか？</h3>
      <p>A: 注文確認メールに記載されています。また、IMEIを入力いただくことで、当サイトからも確認いただけます。</p>

      <h3>Q: 修理にかかる日数は？</h3>
      <p>A: 症状により異なりますが、通常3〜7営業日程度です。お急ぎの場合はご相談ください。</p>

      <h3>Q: 郵送での修理は可能ですか？</h3>
      <p>A: はい、可能です。送料はお客様負担となりますが、着払いでお送りいただいても結構です。</p>

      <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
        <Link href="/shop/support" className="btn btn-primary btn-lg">
          保証・サポートに問い合わせる
        </Link>
      </div>
    </div>
  )
}
