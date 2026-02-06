'use client'

/**
 * =====================================================
 * ECサイト - データ移行ガイド
 * =====================================================
 */

import Link from 'next/link'
import '../../shop.css'

export default function DataTransferGuidePage() {
  return (
    <div className="content-page">
      <h1>データ移行ガイド</h1>

      <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
        新しいiPhoneへのデータ移行は、思っているより簡単です。<br />
        このガイドに沿って進めれば、写真もLINEも連絡先も、すべて新しいiPhoneに移行できます。
      </p>

      <h2>iPhoneからiPhoneへの移行</h2>

      <h3>方法1: クイックスタート（おすすめ）</h3>

      <div className="content-highlight">
        <strong>必要なもの:</strong>
        <ul style={{ margin: 'var(--space-xs) 0 0 0' }}>
          <li>旧iPhone（iOS 12.4以降）</li>
          <li>新iPhone（ONE STOPで購入した端末）</li>
          <li>Wi-Fi環境</li>
          <li>充電ケーブル（両方とも充電しておく）</li>
        </ul>
      </div>

      <div className="content-step">
        <div className="content-step-number">1</div>
        <div className="content-step-body">
          <h3 className="content-step-title">両方のiPhoneを近づける</h3>
          <p className="content-step-text">
            新しいiPhoneの電源を入れ、旧iPhoneの近くに置きます。<br />
            旧iPhoneに「新しいiPhoneを設定」と表示されます。
          </p>
        </div>
      </div>

      <div className="content-step">
        <div className="content-step-number">2</div>
        <div className="content-step-body">
          <h3 className="content-step-title">Apple IDを確認</h3>
          <p className="content-step-text">
            「続ける」をタップし、Apple IDを確認します。
          </p>
        </div>
      </div>

      <div className="content-step">
        <div className="content-step-number">3</div>
        <div className="content-step-body">
          <h3 className="content-step-title">アニメーションをスキャン</h3>
          <p className="content-step-text">
            新しいiPhoneに表示されるアニメーションを、旧iPhoneのカメラでスキャンします。
          </p>
        </div>
      </div>

      <div className="content-step">
        <div className="content-step-number">4</div>
        <div className="content-step-body">
          <h3 className="content-step-title">パスコードを入力</h3>
          <p className="content-step-text">
            旧iPhoneのパスコードを新しいiPhoneに入力します。
          </p>
        </div>
      </div>

      <div className="content-step">
        <div className="content-step-number">5</div>
        <div className="content-step-body">
          <h3 className="content-step-title">転送開始</h3>
          <p className="content-step-text">
            「iPhoneから転送」を選択し、転送が完了するまで待ちます。<br />
            （データ量によって30分〜1時間程度）
          </p>
        </div>
      </div>

      <h3>方法2: iCloudバックアップから復元</h3>

      <p><strong>事前準備（旧iPhone）:</strong></p>
      <ol>
        <li>設定 → [自分の名前] → iCloud → iCloudバックアップ</li>
        <li>「今すぐバックアップを作成」をタップ</li>
        <li>バックアップ完了まで待つ</li>
      </ol>

      <p><strong>新iPhoneでの操作:</strong></p>
      <ol>
        <li>初期設定を進める</li>
        <li>「Appとデータ」画面で「iCloudバックアップから復元」を選択</li>
        <li>Apple IDでサインイン</li>
        <li>最新のバックアップを選択</li>
        <li>復元完了まで待つ</li>
      </ol>

      <h3>方法3: パソコン（Mac/Windows）を使う</h3>

      <p><strong>事前準備:</strong></p>
      <ol>
        <li>パソコンにiTunes（Windows）またはFinder（Mac）を用意</li>
        <li>旧iPhoneをパソコンに接続</li>
        <li>「今すぐバックアップ」を実行</li>
      </ol>

      <p><strong>新iPhoneへの復元:</strong></p>
      <ol>
        <li>新iPhoneをパソコンに接続</li>
        <li>「バックアップを復元」を選択</li>
        <li>先ほど作成したバックアップを選択</li>
      </ol>

      <h2>AndroidからiPhoneへの移行</h2>

      <h3>「iOSに移行」アプリを使用</h3>

      <div className="content-step">
        <div className="content-step-number">1</div>
        <div className="content-step-body">
          <h3 className="content-step-title">アプリをダウンロード</h3>
          <p className="content-step-text">
            AndroidのGoogle Playストアから「iOSに移行」アプリをダウンロード
          </p>
        </div>
      </div>

      <div className="content-step">
        <div className="content-step-number">2</div>
        <div className="content-step-body">
          <h3 className="content-step-title">新iPhoneを設定開始</h3>
          <p className="content-step-text">
            初期設定の「Appとデータ」画面で「Androidからデータを移行」を選択
          </p>
        </div>
      </div>

      <div className="content-step">
        <div className="content-step-number">3</div>
        <div className="content-step-body">
          <h3 className="content-step-title">コードを入力</h3>
          <p className="content-step-text">
            iPhoneに表示されるコードをAndroidの「iOSに移行」アプリに入力
          </p>
        </div>
      </div>

      <div className="content-step">
        <div className="content-step-number">4</div>
        <div className="content-step-body">
          <h3 className="content-step-title">転送するデータを選択</h3>
          <p className="content-step-text">
            連絡先、メッセージ、写真、ブックマークなど移行したいデータを選択
          </p>
        </div>
      </div>

      <h2>LINEの引き継ぎ</h2>

      <div className="content-warning">
        <strong>重要：</strong>LINEの引き継ぎ設定は必ず事前に行ってください。設定後36時間以内に新端末で引き継ぎが必要です。
      </div>

      <h3>事前準備（旧端末で必ず行ってください）</h3>
      <ol>
        <li>旧端末でLINEを開く</li>
        <li>設定 → アカウント引き継ぎ設定</li>
        <li>「アカウントを引き継ぐ」をON</li>
      </ol>

      <h3>新端末での操作</h3>
      <ol>
        <li>LINEをインストール</li>
        <li>電話番号でログイン</li>
        <li>SMS認証コードを入力</li>
        <li>引き継ぎ完了</li>
      </ol>

      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
        <strong>注意：</strong>トーク履歴はiCloudバックアップから復元可能です（事前設定が必要）。LINEコインやスタンプは自動で引き継がれます。
      </p>

      <h2>移行できるデータ一覧</h2>

      <table className="content-table">
        <thead>
          <tr>
            <th>データ</th>
            <th>iPhone→iPhone</th>
            <th>Android→iPhone</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>連絡先</td>
            <td>○</td>
            <td>○</td>
          </tr>
          <tr>
            <td>写真・動画</td>
            <td>○</td>
            <td>○</td>
          </tr>
          <tr>
            <td>アプリ</td>
            <td>○</td>
            <td>△（再DL必要）</td>
          </tr>
          <tr>
            <td>LINEトーク</td>
            <td>○</td>
            <td>×</td>
          </tr>
          <tr>
            <td>ゲームデータ</td>
            <td>△（アプリによる）</td>
            <td>△（アプリによる）</td>
          </tr>
          <tr>
            <td>電子マネー残高</td>
            <td>△（移行手続き必要）</td>
            <td>△（移行手続き必要）</td>
          </tr>
        </tbody>
      </table>

      <h2>困ったときは</h2>

      <p>データ移行でお困りの場合は、お気軽にご相談ください。</p>

      <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
        <Link href="/shop/support" className="btn btn-primary btn-lg">
          サポートに問い合わせる
        </Link>
      </div>
    </div>
  )
}
