/**
 * =====================================================
 * 買取同意書PDF生成API
 * =====================================================
 *
 * 事前査定内容を反映した買取同意書HTMLを生成
 * ブラウザの印刷機能でPDF化
 * 表面：同意書
 * 裏面：発送方法の案内
 */

import { NextRequest, NextResponse } from 'next/server'

type BuybackItem = {
  model: string
  modelDisplayName: string
  storage: string
  rank: string
  batteryPercent: number
  imei?: string
  nwStatus: string
  cameraStain: string
  cameraBroken: boolean
  repairHistory: boolean
  estimatedPrice: number
}

type RequestBody = {
  requestNumber: string
  customerName: string
  customerNameKana?: string
  birthDate?: string
  phone: string
  occupation?: string
  postalCode: string
  address: string
  addressDetail?: string
  idType?: string
  items: BuybackItem[]
  totalEstimatedPrice: number
  createdAt?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const item = body.items[0]

    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>買取同意書 - ${body.requestNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 10mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #000;
    }
    .page {
      width: 190mm;
      min-height: 277mm;
      padding: 5mm;
      page-break-after: always;
    }
    .page:last-child {
      page-break-after: auto;
    }
    h1 {
      font-size: 22px;
      text-align: center;
      margin-bottom: 5px;
    }
    .header-info {
      display: flex;
      justify-content: flex-end;
      gap: 20px;
      margin-bottom: 10px;
      font-size: 10px;
    }
    .device-box {
      border: 1px solid #000;
      padding: 8px 12px;
      margin-bottom: 10px;
    }
    .device-row {
      display: flex;
      gap: 15px;
      margin-bottom: 5px;
    }
    .device-row span {
      min-width: 100px;
    }
    .price-row {
      font-size: 14px;
      font-weight: bold;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #ccc;
    }
    .terms {
      margin-bottom: 10px;
    }
    .terms-title {
      font-weight: bold;
      margin-bottom: 5px;
      font-size: 10px;
    }
    .terms-list {
      font-size: 9px;
      line-height: 1.6;
    }
    .terms-list li {
      margin-bottom: 2px;
      list-style: none;
    }
    .customer-box {
      border: 1px solid #000;
      padding: 10px;
      margin-top: 10px;
    }
    .customer-row {
      display: flex;
      margin-bottom: 8px;
    }
    .customer-row label {
      width: 80px;
      font-weight: bold;
    }
    .customer-row .value {
      flex: 1;
      border-bottom: 1px solid #000;
      min-height: 20px;
    }
    .signature-row {
      margin-top: 15px;
      display: flex;
      align-items: flex-end;
    }
    .signature-row label {
      width: 60px;
      font-weight: bold;
    }
    .signature-line {
      flex: 1;
      border-bottom: 1px solid #000;
      height: 40px;
    }
    .date-row {
      margin-bottom: 10px;
    }
    .footer-note {
      margin-top: 10px;
      font-size: 9px;
      color: #666;
    }

    /* 裏面 */
    .page2 h1 {
      font-size: 20px;
      margin-bottom: 15px;
    }
    .step {
      margin-bottom: 15px;
    }
    .step-title {
      font-weight: bold;
      font-size: 12px;
      margin-bottom: 5px;
      background: #f5f5f5;
      padding: 5px 8px;
    }
    .step-content {
      padding: 5px 10px;
      font-size: 10px;
    }
    .checkbox-item {
      margin-bottom: 3px;
    }
    .checkbox-item input[type="checkbox"] {
      margin-right: 5px;
    }
    .shipping-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 10px;
    }
    .shipping-table td {
      padding: 5px 8px;
      border: 1px solid #ddd;
    }
    .shipping-table td:first-child {
      width: 100px;
      background: #f9f9f9;
      font-weight: bold;
    }
    .address-box {
      background: #f9f9f9;
      padding: 10px;
      margin-top: 10px;
      border: 1px solid #ddd;
    }
    .qr-placeholder {
      width: 80px;
      height: 80px;
      border: 1px solid #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #999;
      float: right;
      margin-left: 10px;
    }
    .instruction-images {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    .instruction-images div {
      width: 60px;
      height: 40px;
      border: 1px solid #ddd;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: #999;
    }
    @media print {
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <!-- 表面：買取同意書 -->
  <div class="page">
    <h1>買取同意書</h1>

    <div class="header-info">
      <span>管理番号：${body.requestNumber}</span>
      ${item?.imei ? `<span>IMEI：${item.imei}</span>` : ''}
    </div>

    <div class="device-box">
      <div class="device-row">
        <span><strong>機種：</strong>${item?.modelDisplayName || item?.model || ''}</span>
        <span><strong>容量：</strong>${item?.storage || ''}GB</span>
        <span><strong>ランク：</strong>${item?.rank || ''}</span>
      </div>
      <div class="device-row">
        <span><strong>バッテリー：</strong>${item?.batteryPercent || ''}%</span>
        <span><strong>NW制限：</strong>${formatNwStatus(item?.nwStatus)}</span>
      </div>
      <div class="device-row">
        <span><strong>カメラ染み：</strong>${formatCameraStain(item?.cameraStain)}</span>
        <span><strong>カメラ窓：</strong>${item?.cameraBroken ? '割れあり' : '割れなし'}</span>
        <span><strong>非正規修理：</strong>${item?.repairHistory ? '利用あり' : '利用なし'}</span>
      </div>
      <div class="price-row">
        事前査定価格：${body.totalEstimatedPrice.toLocaleString()}円
      </div>
    </div>

    <div class="terms">
      <div class="terms-title">以下の内容を確認し承諾頂けましたら、各記入欄とご署名の上、こちらの用紙を査定端末と一緒に発送をお願いします。</div>
      <ul class="terms-list">
        <li>・事前にご申告頂いたお名前・ご住所・生年月日が確認出来る本人確認書類の提出が必要です。査定端末と一緒にコピーを発送かLINEで画像の返信をお願いします。</li>
        <li>・※本人確認書類→免許証、マイナンバーカード、パスポート、健康保険証など</li>
        <li>・仮査定金額は端末状態・市場相場に基づく参考価格です。実機確認後にカメラシミ・画面や本体の傷・パーツ交換等が判明した場合、本査定金額が変更となる場合がございます。</li>
        <li>・仮査定金額の提示後、1週間以上経過すると価格が変動する可能性がございます。</li>
        <li>・本査定時、査定端末に貼り付けしている保護ガラス等は弊社にて取り外します。</li>
        <li>・本査定時に初期化、アクティベーションがオフにされていない端末に関しては、個人情報保護の観点から遠隔での初期化にご協力頂きます。</li>
        <li>・端末代金支払い途中の場合、最後までお支払いすることを条件に買取が可能です。途中でお支払いが滞った場合、端末の利用ができなくなるため、返金対応をして頂きます。</li>
        <li>・買取金額がご希望に添えなかった場合、弊社負担での返送致しますが、記載内容と実際の状態が著しく異なる場合（例：水没・不正改造・盗難端末など）は、返送時の送料をお客様にご負担いただきます。</li>
        <li>・お客様が査定金額に同意（承諾）された時点で買取契約が成立し、弊社からの入金をもって契約履行完了といたします。</li>
        <li>・買取成約後、お客様ご都合でのキャンセルはできかねます。</li>
        <li>・査定端末は盗難品、紛失品ではなく合法的な所有者であり、売却する権利を有している事を保証します。</li>
        <li>・買取後であっても、申告内容と異なる事実が発覚した場合は返金の対象となります。</li>
        <li>・ご提供いただいた個人情報は、本人確認および古物営業法に基づく記録保存のためにのみ使用し、法令に基づく場合を除き、第三者に提供することはありません。</li>
        <li style="color: #c00; font-weight: bold;">・※お振込先の口座名義は、買取申込者ご本人様と同一名義に限ります。</li>
        <li style="color: #c00; font-weight: bold;">・※ご住所はご本人様確認書類と同一の住所をご記入ください。</li>
      </ul>
    </div>

    <div class="date-row">
      記入日）西暦　　　　年　　　　月　　　　日
    </div>

    <div style="font-weight: bold; margin-bottom: 5px;">上記内容全て同意した上で買取を申込みます。</div>

    <div class="customer-box">
      <div class="customer-row">
        <label>氏名</label>
        <div class="value">${body.customerName || ''}</div>
        <label style="width: 60px; margin-left: 20px;">生年月日</label>
        <div class="value" style="max-width: 150px;">${body.birthDate || '西暦　　年　　月　　日'}</div>
      </div>
      <div class="customer-row">
        <label>電話番号</label>
        <div class="value" style="max-width: 150px;">${body.phone || ''}</div>
        <label style="width: 40px; margin-left: 20px;">職業</label>
        <div class="value">${body.occupation || ''}</div>
      </div>
      <div class="customer-row">
        <label>住所</label>
        <div class="value">〒${body.postalCode || ''} ${body.address || ''} ${body.addressDetail || ''}</div>
      </div>
      <div class="customer-row">
        <label>ご本人様確認書類</label>
        <div class="value">${formatIdType(body.idType)}</div>
      </div>
      <div class="signature-row">
        <label>ご署名</label>
        <div class="signature-line"></div>
      </div>
    </div>

    <div class="footer-note">
      ※裏面の発送方法をご参照の上、発送をお願いいたします。
    </div>
  </div>

  <!-- 裏面：発送方法 -->
  <div class="page page2">
    <h1>発送方法</h1>

    <div class="step">
      <div class="step-title">① 発送前に必ず初期化とiPhoneの場合は[iPhoneを探す]をオフにして下さい。</div>
      <div class="step-content">
        以下の手順で操作を行い、完了したらレ点チェックをお願いします。
        <div style="margin-top: 8px; padding: 10px; background: #f9f9f9; border: 1px solid #ddd;">
          <div class="checkbox-item">
            <input type="checkbox"> <strong>iPhoneを探すをオフ</strong><br>
            <span style="margin-left: 20px;">設定→一番上のアカウント名→探す→iPhoneを探す→オフ</span>
          </div>
          <div class="checkbox-item" style="margin-top: 5px; font-size: 9px; color: #666;">
            ※盗難デバイスの保護がオンの場合は以下の操作も必要です。<br>
            <span style="margin-left: 20px;">設定→FaceIDとパスコード→盗難デバイスの保護→オフ</span>
          </div>
          <div class="checkbox-item" style="margin-top: 8px;">
            <input type="checkbox"> <strong>iPhoneの初期化</strong><br>
            <span style="margin-left: 20px;">設定→一般→転送またはiPhoneをリセット→すべてのコンテンツと設定を消去</span>
          </div>
        </div>
        <div style="font-size: 9px; color: #c00; margin-top: 5px;">
          ※初期化が完了していない場合、買取後にご協力頂く場合がございます。
        </div>
      </div>
    </div>

    <div class="step">
      <div class="step-title">② 箱を組み立て査定端末と買取同意書を一緒に送って下さい。</div>
      <div class="step-content">
        必要に応じて緩衝材を入れて下さい。<br>
        ※組み立て方法は同封の説明書を参考にして下さい。
      </div>
    </div>

    <div class="step">
      <div class="step-title">③ 集荷用QRコードをカメラアプリで写し、[通常の荷物を送る]から以下の内容を設定し、集荷の日時指定をお願いします。</div>
      <div class="step-content">
        <table class="shipping-table">
          <tr><td>集荷お伺い先</td><td>集荷を依頼するお客様の住所</td></tr>
          <tr><td>ご利用サービス</td><td>宅急便コンパクト</td></tr>
          <tr><td>梱包資材</td><td>専用の梱包資材をご用意済みの方</td></tr>
          <tr><td>発送方法</td><td>着払い</td></tr>
          <tr><td>集荷希望日時</td><td>ご希望の日時をお選び下さい</td></tr>
          <tr><td>荷物の内容</td><td>精密機器</td></tr>
        </table>

        <div class="address-box">
          <strong>お届け先</strong><br>
          〒916-0038<br>
          福井県鯖江市下河端町16字下町16-1<br>
          アル・プラザ鯖江1F フードコート前<br>
          ONE STOP 鯖江店 宛<br>
          TEL:080-5720-1164
        </div>
      </div>
    </div>

    <div class="step">
      <div class="step-title">④ やり取り中のチャット（LINE）宛に本人確認書類を送信お願いします。</div>
      <div class="step-content">
        査定端末と一緒にコピーを発送いただくか、LINEで画像を送信してください。
      </div>
    </div>
  </div>

  <script>
    // 自動印刷（オプション）
    // window.onload = function() { window.print(); }
  </script>
</body>
</html>
`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { success: false, error: 'PDF generation failed' },
      { status: 500 }
    )
  }
}

// ヘルパー関数
function formatNwStatus(status?: string): string {
  switch (status) {
    case 'ok': return '○（制限なし）'
    case 'triangle': return '△（分割支払い中）'
    case 'cross': return '×（利用制限あり）'
    default: return '-'
  }
}

function formatCameraStain(stain?: string): string {
  switch (stain) {
    case 'none': return 'なし'
    case 'minor': return 'あり（少）'
    case 'major': return 'あり（多）'
    default: return '-'
  }
}

function formatIdType(type?: string): string {
  switch (type) {
    case 'drivers_license': return '□免許証 ☑その他（　　）'
    case 'insurance_card': return '□免許証 □マイナンバーカード ☑健康保険証'
    case 'passport': return '□免許証 □マイナンバーカード ☑パスポート'
    case 'my_number': return '□免許証 ☑マイナンバーカード'
    default: return '□免許証 □マイナンバーカード □その他（　　　）'
  }
}
