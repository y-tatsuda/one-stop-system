'use client'

/**
 * =====================================================
 * ECサイト - 購入後の流れガイド
 * =====================================================
 */

import Link from 'next/link'
import '../../shop.css'

export default function AfterPurchaseGuidePage() {
  return (
    <div className="content-page">
      <h1>ご購入後の流れ</h1>

      <h2>商品到着までの流れ</h2>

      <div className="content-step">
        <div className="content-step-number">1</div>
        <div className="content-step-body">
          <h3 className="content-step-title">ご注文完了</h3>
          <p className="content-step-text">
            ご注文完了後、自動確認メールが届きます。<br />
            メールが届かない場合は、迷惑メールフォルダをご確認ください。
          </p>
        </div>
      </div>

      <div className="content-step">
        <div className="content-step-number">2</div>
        <div className="content-step-body">
          <h3 className="content-step-title">お支払い確認</h3>
          <p className="content-step-text">
            <strong>クレジットカードの場合：</strong>即時確認<br />
            <strong>銀行振込の場合：</strong>ご入金確認後、発送準備に入ります
          </p>
        </div>
      </div>

      <div className="content-step">
        <div className="content-step-number">3</div>
        <div className="content-step-body">
          <h3 className="content-step-title">発送準備</h3>
          <p className="content-step-text">
            ご注文から1〜2営業日以内に発送いたします。<br />
            ※土日祝日は発送業務をお休みしております
          </p>
        </div>
      </div>

      <div className="content-step">
        <div className="content-step-number">4</div>
        <div className="content-step-body">
          <h3 className="content-step-title">発送完了</h3>
          <p className="content-step-text">
            発送完了後、追跡番号をメールでお知らせします。
          </p>
        </div>
      </div>

      <div className="content-step">
        <div className="content-step-number">5</div>
        <div className="content-step-body">
          <h3 className="content-step-title">商品到着</h3>
          <p className="content-step-text">
            配送業者よりお届けいたします。
          </p>
        </div>
      </div>

      <h2>届いたらやること</h2>

      <h3>1. 外観チェック</h3>
      <ul>
        <li>傷や汚れが商品説明と相違ないか確認</li>
        <li>付属品が揃っているか確認</li>
      </ul>

      <h3>2. 動作チェック</h3>
      <ul>
        <li>電源が入るか</li>
        <li>タッチパネルは正常か</li>
        <li>音が出るか</li>
        <li>カメラは動作するか</li>
      </ul>

      <h3>3. SIMカードを入れる</h3>
      <ul>
        <li>SIMカードを挿入</li>
        <li>通話・データ通信を確認</li>
      </ul>

      <h3>4. データ移行</h3>
      <p>
        旧端末からのデータ移行方法は、詳しいガイドをご用意しています。
      </p>
      <p>
        <Link href="/shop/guide/data-transfer" style={{ color: 'var(--color-primary)' }}>
          データ移行ガイドはこちら →
        </Link>
      </p>

      <h2>届いた商品に問題があった場合</h2>

      <h3>初期不良の場合</h3>

      <div className="content-highlight">
        <p style={{ margin: 0 }}>
          商品到着後7日以内にご連絡ください。<br />
          返品・交換にて対応いたします。
        </p>
      </div>

      <p>
        <Link href="/shop/support" style={{ color: 'var(--color-primary)' }}>
          お問い合わせフォーム →
        </Link>
      </p>

      <h3>使用中の故障</h3>

      <p>360日保証の対象となります。</p>
      <p>
        <Link href="/shop/warranty" style={{ color: 'var(--color-primary)' }}>
          保証についてはこちら →
        </Link>
      </p>

      <h2>よくある質問</h2>

      <h3>Q: 届いたiPhoneにApple IDが残っていました</h3>
      <p>
        A: 大変申し訳ございません。すぐにご連絡ください。リモートで解除対応いたします。
      </p>

      <h3>Q: SIMカードが認識されません</h3>
      <p>
        A: SIMカードの向きをご確認ください。それでも認識されない場合は、キャリアにお問い合わせいただくか、当店までご連絡ください。
      </p>

      <h3>Q: 届いた商品のIMEIを確認したい</h3>
      <p>
        A: 設定 → 一般 → 情報 で確認できます。外箱のラベルにも記載されています。
      </p>

      <h2>保証書について</h2>

      <p>
        ご購入時にお送りした「注文確認メール」が保証書となります。<br />
        大切に保管してください。
      </p>

      <p>
        保証期間や状況は、IMEIを入力いただくことでWebからも確認いただけます。
      </p>

      <p>
        <Link href="/shop/support" style={{ color: 'var(--color-primary)' }}>
          保証状況を確認する →
        </Link>
      </p>

      <h2>何かお困りの際は</h2>

      <p>お気軽にお問い合わせください。</p>

      <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
        <Link href="/shop/support" className="btn btn-primary btn-lg">
          お問い合わせはこちら
        </Link>
      </div>
    </div>
  )
}
