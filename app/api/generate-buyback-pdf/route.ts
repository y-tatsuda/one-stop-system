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
  birthYear?: string
  birthMonth?: string
  birthDay?: string
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

// QRコード生成用URL（QR Server API）
const getQRCodeUrl = (data: string, size: number = 100) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&format=png`
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const item = body.items[0]

    // QRコードURL
    const videoQRUrl = getQRCodeUrl('https://youtu.be/_1ih3kMC3xU?si=EgXU3yLhdmstsAY7', 80)
    const pickupQRUrl = getQRCodeUrl('https://shuka.kuronekoyamato.co.jp/shuka_req/TopAction_doInit.action', 100)

    // 職業チェック用関数
    const occupationCheck = (occ: string) => body.occupation === occ ? '☑' : '□'

    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>買取同意書 - ${body.requestNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 8mm 10mm;
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
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 100%;
      max-width: 190mm;
      height: 277mm;
      margin: 0 auto;
      padding: 3mm;
      page-break-after: always;
      display: flex;
      flex-direction: column;
    }
    .page:last-child {
      page-break-after: auto;
    }
    h1 {
      font-size: 22px;
      text-align: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #000;
    }
    .header-info {
      display: flex;
      justify-content: flex-end;
      gap: 25px;
      margin-bottom: 12px;
      font-size: 10px;
    }
    .device-box {
      border: 2px solid #000;
      padding: 12px 15px;
      margin-bottom: 15px;
    }
    .device-row {
      display: flex;
      gap: 15px;
      margin-bottom: 5px;
      font-size: 11px;
    }
    .device-row span {
      min-width: 100px;
    }
    .price-row {
      font-size: 15px;
      font-weight: bold;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #ccc;
    }
    .terms {
      margin-bottom: 12px;
    }
    .terms-title {
      font-weight: bold;
      margin-bottom: 6px;
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
      border: 2px solid #000;
      padding: 15px;
      margin-top: 12px;
    }
    .customer-row {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      min-height: 28px;
    }
    .customer-row label {
      width: 80px;
      font-weight: bold;
      font-size: 10px;
      flex-shrink: 0;
    }
    .customer-row .value {
      flex: 1;
      border-bottom: 1px solid #000;
      min-height: 26px;
      padding: 4px 6px;
      font-size: 12px;
    }
    .birth-value {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
    }
    .birth-value .year {
      width: 55px;
      text-align: center;
      border-bottom: 1px solid #000;
      padding: 3px;
    }
    .birth-value .month, .birth-value .day {
      width: 35px;
      text-align: center;
      border-bottom: 1px solid #000;
      padding: 3px;
    }
    .occupation-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 11px;
    }
    .occupation-row span {
      white-space: nowrap;
    }
    .signature-row {
      margin-top: 15px;
      display: flex;
      align-items: flex-end;
    }
    .signature-row label {
      width: 60px;
      font-weight: bold;
      font-size: 11px;
    }
    .signature-line {
      flex: 1;
      height: 55px;
      background: #f0f0f0;
      border: 1px solid #999;
      border-radius: 4px;
    }
    .date-row {
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 11px;
    }
    .date-input {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .date-input .input-box {
      width: 50px;
      height: 26px;
      background: #f0f0f0;
      border: 1px solid #999;
      border-radius: 3px;
      text-align: center;
    }
    .footer-note {
      margin-top: 12px;
      font-size: 10px;
      color: #333;
      font-weight: bold;
    }
    /* 裏面 */
    .page2 h1 {
      font-size: 22px;
      margin-bottom: 20px;
    }
    .step {
      margin-bottom: 20px;
    }
    .step-title {
      font-weight: bold;
      font-size: 12px;
      margin-bottom: 8px;
      background: #e8e8e8;
      padding: 8px 12px;
      border-left: 4px solid #333;
    }
    .step-content {
      padding: 8px 12px;
      font-size: 10px;
      line-height: 1.7;
    }
    .checkbox-item {
      margin-bottom: 4px;
    }
    .checkbox-item input[type="checkbox"] {
      margin-right: 6px;
    }
    .shipping-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 10px;
    }
    .shipping-table td {
      padding: 6px 8px;
      border: 1px solid #ddd;
    }
    .shipping-table td:first-child {
      width: 100px;
      background: #f9f9f9;
      font-weight: bold;
    }
    .address-box {
      background: #f9f9f9;
      padding: 12px;
      margin-top: 12px;
      border: 1px solid #ddd;
      font-size: 11px;
      line-height: 1.6;
    }
    .qr-section {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      margin-top: 10px;
    }
    .qr-box {
      text-align: center;
      flex-shrink: 0;
    }
    .qr-box img {
      border: 1px solid #ddd;
      display: block;
      width: auto;
      height: auto;
    }
    .qr-label {
      font-size: 9px;
      margin-top: 4px;
      color: #666;
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

    <div style="display: flex; gap: 15px; margin-bottom: 15px;">
      <!-- 左側：事前査定 -->
      <div class="device-box" style="flex: 1; margin-bottom: 0;">
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 8px; background: #e8e8e8; padding: 5px 8px; border-left: 3px solid #333;">事前査定</div>
        <div class="device-row">
          <span><strong>機種：</strong>${item?.modelDisplayName || item?.model || ''}</span>
          <span><strong>容量：</strong>${item?.storage || ''}GB</span>
        </div>
        <div class="device-row">
          <span><strong>ランク：</strong>${item?.rank || ''}</span>
          <span><strong>バッテリー：</strong>${item?.batteryPercent || ''}%</span>
        </div>
        <div class="device-row">
          <span><strong>NW制限：</strong>${formatNwStatus(item?.nwStatus)}</span>
          <span><strong>カメラ染み：</strong>${formatCameraStain(item?.cameraStain)}</span>
        </div>
        <div class="device-row">
          <span><strong>カメラ窓：</strong>${item?.cameraBroken ? '割れあり' : '割れなし'}</span>
          <span><strong>非正規修理：</strong>${item?.repairHistory ? '利用あり' : '利用なし'}</span>
        </div>
        <div class="price-row">
          事前査定価格：${body.totalEstimatedPrice.toLocaleString()}円
        </div>
      </div>

      <!-- 右側：本査定での変更点（スタッフ記入） -->
      <div style="flex: 1; border: 2px solid #000; padding: 12px 15px;">
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 8px; background: #f0f0f0; padding: 5px 8px; border-left: 3px solid #c00;">本査定での変更点</div>
        <div style="font-size: 9px; color: #666; margin-bottom: 8px;">※事前査定との差異がある場合に記入</div>
        <div style="display: flex; gap: 10px; margin-bottom: 8px;">
          <div style="flex: 1;">
            <div style="font-size: 9px; margin-bottom: 3px;">□ ランク</div>
            <div style="height: 20px; border-bottom: 1px solid #999;"></div>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 9px; margin-bottom: 3px;">□ バッテリー</div>
            <div style="height: 20px; border-bottom: 1px solid #999;"></div>
          </div>
        </div>
        <div style="display: flex; gap: 10px; margin-bottom: 8px;">
          <div style="flex: 1;">
            <div style="font-size: 9px; margin-bottom: 3px;">□ カメラ染み</div>
            <div style="height: 20px; border-bottom: 1px solid #999;"></div>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 9px; margin-bottom: 3px;">□ その他</div>
            <div style="height: 20px; border-bottom: 1px solid #999;"></div>
          </div>
        </div>
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #ccc;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; font-weight: bold;">本査定価格：</span>
            <div style="width: 80px; height: 24px; background: #f9f9f9; border: 1px solid #999; border-radius: 3px;"></div>
            <span style="font-size: 11px;">円</span>
          </div>
        </div>
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
      <span>記入日）西暦</span>
      <div class="date-input">
        <div class="input-box"></div>
        <span>年</span>
        <div class="input-box" style="width: 35px;"></div>
        <span>月</span>
        <div class="input-box" style="width: 35px;"></div>
        <span>日</span>
      </div>
    </div>

    <div style="font-weight: bold; margin-bottom: 5px; font-size: 11px;">上記内容全て同意した上で買取を申込みます。</div>

    <div class="customer-box">
      <div class="customer-row">
        <label>氏名</label>
        <div class="value">${body.customerName || ''}</div>
      </div>
      <div class="customer-row">
        <label>生年月日</label>
        <div class="birth-value">
          <span>西暦</span>
          <div class="year">${body.birthYear || ''}</div>
          <span>年</span>
          <div class="month">${body.birthMonth || ''}</div>
          <span>月</span>
          <div class="day">${body.birthDay || ''}</div>
          <span>日</span>
        </div>
      </div>
      <div class="customer-row">
        <label>電話番号</label>
        <div class="value" style="max-width: 180px;">${body.phone || ''}</div>
        <label style="width: 40px; margin-left: 15px;">職業</label>
        <div class="occupation-row">
          <span>${occupationCheck('会社員')}会社員</span>
          <span>${occupationCheck('自営業')}自営業</span>
          <span>${occupationCheck('パート・アルバイト')}パート</span>
          <span>${occupationCheck('学生')}学生</span>
          <span>${occupationCheck('その他')}その他</span>
        </div>
      </div>
      <div class="customer-row">
        <label>住所</label>
        <div class="value">〒${body.postalCode || ''} ${body.address || ''} ${body.addressDetail || ''}</div>
      </div>
      <div class="customer-row" style="font-size: 8px; color: #666; margin-bottom: 0;">
        <label></label>
        <span>※ご本人様確認書類と同一の住所をご記入ください</span>
      </div>
      <div class="customer-row">
        <label>ご本人様確認書類</label>
        <div style="font-size: 10px;">□免許証　□マイナンバーカード　□健康保険証　□パスポート　□その他（　　　　）</div>
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
        <div style="margin-top: 10px; padding: 12px; background: #f9f9f9; border: 1px solid #ddd;">
          <div class="checkbox-item" style="margin-bottom: 8px;">
            <input type="checkbox"> <strong>iPhoneを探すをオフ</strong><br>
            <span style="margin-left: 20px; font-size: 10px;">設定→一番上のアカウント名→探す→iPhoneを探す→オフ</span>
          </div>
          <div class="checkbox-item" style="margin-top: 6px; font-size: 9px; color: #666;">
            ※盗難デバイスの保護がオンの場合は以下の操作も必要です。<br>
            <span style="margin-left: 20px;">設定→FaceIDとパスコード→盗難デバイスの保護→オフ</span>
          </div>
          <div class="checkbox-item" style="margin-top: 10px;">
            <input type="checkbox"> <strong>iPhoneの初期化</strong><br>
            <span style="margin-left: 20px; font-size: 10px;">設定→一般→転送またはiPhoneをリセット→すべてのコンテンツと設定を消去</span>
          </div>
        </div>
        <div style="font-size: 10px; color: #c00; margin-top: 8px; font-weight: bold;">
          ※初期化が完了していない場合、買取後にご協力頂く場合がございます。
        </div>
      </div>
    </div>

    <div class="step">
      <div class="step-title">② 箱を組み立て査定端末と買取同意書を一緒に送って下さい。</div>
      <div class="step-content">
        <div style="display: flex; align-items: flex-start; gap: 20px;">
          <div style="flex: 1; font-size: 11px;">
            必要に応じて緩衝材を入れて下さい。<br><br>
            <strong>※組み立て方法は右のQRコードの動画（2:10以降）を参考にして下さい。</strong>
          </div>
          <div class="qr-box">
            <img src="${videoQRUrl}" alt="組み立て動画QR" width="90" height="90">
            <div class="qr-label">組み立て動画</div>
          </div>
        </div>
      </div>
    </div>

    <div class="step">
      <div class="step-title">③ 集荷用QRコードをカメラアプリで写し、[通常の荷物を送る]から以下の内容を設定し、集荷の日時指定をお願いします。</div>
      <div class="step-content">
        <div class="qr-section">
          <div class="qr-box">
            <img src="${pickupQRUrl}" alt="集荷用QR" width="110" height="110">
            <div class="qr-label">集荷用QRコード</div>
          </div>
          <div style="flex: 1;">
            <table class="shipping-table">
              <tr><td>集荷お伺い先</td><td>集荷を依頼するお客様の住所</td></tr>
              <tr><td>ご利用サービス</td><td>宅急便コンパクト</td></tr>
              <tr><td>梱包資材</td><td>専用の梱包資材をご用意済みの方</td></tr>
              <tr><td>発送方法</td><td>着払い</td></tr>
              <tr><td>集荷希望日時</td><td>ご希望の日時をお選び下さい</td></tr>
              <tr><td>荷物の内容</td><td>精密機器</td></tr>
            </table>
          </div>
        </div>

        <div class="address-box">
          <strong style="font-size: 12px;">お届け先</strong><br><br>
          〒916-0038<br>
          福井県鯖江市下河端町16字下町16-1<br>
          アル・プラザ鯖江1F フードコート前<br>
          <strong>ONE STOP 鯖江店 宛</strong><br>
          TEL:080-5720-1164
        </div>
      </div>
    </div>

    <div class="step" style="margin-top: auto;">
      <div class="step-title">④ やり取り中のチャット（LINE）宛に本人確認書類を送信お願いします。</div>
      <div class="step-content" style="font-size: 11px; padding: 12px;">
        査定端末と一緒にコピーを発送いただくか、LINEで画像を送信してください。<br><br>
        <div style="background: #fff3cd; padding: 10px; border: 1px solid #ffc107; border-radius: 4px;">
          <strong>本人確認書類の例：</strong><br>
          運転免許証 / マイナンバーカード / パスポート / 健康保険証 など
        </div>
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
