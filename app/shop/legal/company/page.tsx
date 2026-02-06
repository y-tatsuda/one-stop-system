'use client'

/**
 * =====================================================
 * ECサイト - 会社概要
 * =====================================================
 */

import Link from 'next/link'
import '../../shop.css'

export default function CompanyPage() {
  return (
    <div className="content-page">
      <h1>会社概要</h1>

      <table className="content-table">
        <tbody>
          <tr>
            <th style={{ width: '30%' }}>会社名</th>
            <td>合同会社niche</td>
          </tr>
          <tr>
            <th>屋号</th>
            <td>ONE STOP</td>
          </tr>
          <tr>
            <th>法人番号</th>
            <td>4210003001458</td>
          </tr>
          <tr>
            <th>所在地</th>
            <td>〒916-0038<br />福井県鯖江市下河端町16字下町16番1</td>
          </tr>
          <tr>
            <th>代表者</th>
            <td>龍田 悠平</td>
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
            <th>古物商許可</th>
            <td>福井県公安委員会 第521090010394号</td>
          </tr>
          <tr>
            <th>事業内容</th>
            <td>
              ・中古スマートフォンの販売<br />
              ・スマートフォン修理サービス<br />
              ・スマートフォン買取サービス
            </td>
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
