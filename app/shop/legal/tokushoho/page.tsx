'use client'

/**
 * =====================================================
 * ECサイト - 特定商取引法に基づく表記
 * =====================================================
 */

import Link from 'next/link'
import '../../shop.css'

export default function TokushohoPage() {
  return (
    <div className="content-page">
      <h1>特定商取引法に基づく表記</h1>

      <table className="content-table">
        <tbody>
          <tr>
            <th style={{ width: '30%' }}>販売業者</th>
            <td>合同会社niche</td>
          </tr>
          <tr>
            <th>運営責任者</th>
            <td>龍田 悠平</td>
          </tr>
          <tr>
            <th>所在地</th>
            <td>〒916-0038<br />福井県鯖江市下河端町16字下町16番1</td>
          </tr>
          <tr>
            <th>電話番号</th>
            <td>0778-78-2465</td>
          </tr>
          <tr>
            <th>メールアドレス</th>
            <td>onestop.mobile2024@gmail.com</td>
          </tr>
          <tr>
            <th>販売価格</th>
            <td>各商品ページに税込価格で表示</td>
          </tr>
          <tr>
            <th>商品代金以外の必要料金</th>
            <td>
              ・送料：税抜10,000円以上のご注文で無料<br />
              ・送料：税抜10,000円未満のご注文は全国一律550円（税込）
            </td>
          </tr>
          <tr>
            <th>お支払い方法</th>
            <td>
              ・クレジットカード（VISA、Mastercard、American Express、JCB）<br />
              ・銀行振込
            </td>
          </tr>
          <tr>
            <th>お支払い期限</th>
            <td>
              ・クレジットカード：ご注文時に決済<br />
              ・銀行振込：ご注文から7日以内
            </td>
          </tr>
          <tr>
            <th>商品の引渡時期</th>
            <td>
              ご注文確認後、1〜2営業日以内に発送<br />
              ※土日祝日は発送業務をお休みしております
            </td>
          </tr>
          <tr>
            <th>返品・交換について</th>
            <td>
              <strong>初期不良の場合：</strong><br />
              商品到着後7日以内にご連絡ください。返品・交換にて対応いたします。<br /><br />
              <strong>お客様都合の場合：</strong><br />
              商品の性質上、お客様都合による返品・交換はお受けできません。<br /><br />
              <strong>360日保証：</strong><br />
              購入後360日間、自然故障に対する保証があります。<br />
              詳細は<Link href="/shop/warranty" style={{ color: 'var(--color-primary)' }}>保証ページ</Link>をご確認ください。
            </td>
          </tr>
          <tr>
            <th>古物商許可</th>
            <td>福井県公安委員会 第521090010394号</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
        <Link href="/shop" className="btn btn-secondary">
          トップページへ戻る
        </Link>
      </div>
    </div>
  )
}
