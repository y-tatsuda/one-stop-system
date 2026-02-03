# 外部連携・インフラ設計書

## 1. Supabase

### 接続クライアント

| ファイル | 用途 | キー |
|----------|------|------|
| `app/lib/supabase.ts` | ブラウザ側（匿名） | NEXT_PUBLIC_SUPABASE_ANON_KEY |
| `app/lib/supabase-admin.ts` | サーバー側（管理者） | SUPABASE_SERVICE_ROLE_KEY |

### 使用サービス

- **Database**: PostgreSQL（全テーブル）
- **Auth**: メール/パスワード認証（ユーザー作成・検証・パスワード変更）
- **Storage**: `buyback-documents` バケット（本人確認書類・同意書画像）
- **RPC**: `generate_otp`, `verify_otp`, `log_auth_action`

---

## 2. Slack連携

### Webhook

| 環境変数 | 用途 | 送信タイミング |
|----------|------|--------------|
| SLACK_WEBHOOK_URL_TRANSFER | 振込通知 | 買取で振込選択時 |
| SLACK_WEBHOOK_URL_BUYBACK | 買取通知 | 郵送買取申込時 |

### 通知内容

**振込通知（TRANSFER）:**
- 顧客名、電話番号
- 端末情報（機種、容量、ランク、IMEI）
- 査定詳細（バッテリー、NW、カメラ等の全回答項目）
- 買取金額
- 振込先口座情報
- 住所

**買取通知（BUYBACK）:**
- 申込番号
- 顧客名、フリガナ、電話番号、メール、住所
- 端末リスト（機種、容量、ランク、状態、見積価格）
- 合計見積金額

---

## 3. Square POS連携

### 設定

`m_system_settings` テーブルで管理:
- `square_application_id`
- `square_fee_rate_card` (例: 0.025)
- `square_fee_rate_electronic` (例: 0.0325)
- `square_fee_rate_qr` (例: 0.0325)

### Webhook

`/api/square/webhook` でイベント受信:
- `payment.created/updated` → 売上データ自動作成
- `refund.created/updated` → 返金処理

### カタログ同期

`/api/square/sync-catalog` で手動実行。
`m_square_catalog_mapping` テーブルでSquare商品IDとモデル/容量/ランクをマッピング。

---

## 4. Resend（メール）

### 設定

`RESEND_API_KEY` 環境変数で認証。
送信元: `ONE STOP <noreply@nichellc.net>`

### 送信タイミング

| 用途 | トリガー |
|------|---------|
| OTPコード | ログイン時（2FA有効） |
| スタッフ招待 | スタッフ招待ボタン |
| 振込依頼通知 | 買取確定（振込選択時） |

---

## 5. PWA対応

### マニフェスト

| ファイル | 用途 |
|----------|------|
| `public/manifest.json` | メインアプリ |
| `public/manifest-kiosk.json` | キオスクモード |

### アイコン

- `public/icons/icon-192.png` (192x192)
- `public/icons/icon-512.png` (512x512)
- `public/icons/apple-touch-icon.png`

### 対応機能

- ホーム画面追加
- スタンドアロン表示
- iOS SafariのPWA対応（`globals.css` で `-webkit-overflow-scrolling` 等の調整あり）

---

## 6. 認証フロー詳細

### JWT トークン構造

```json
{
  "staffId": 1,
  "name": "田中太郎",
  "email": "tanaka@example.com",
  "role": "staff",
  "tenantId": 1,
  "passwordChanged": true,
  "exp": 1706000000000
}
```

Base64エンコードして localStorage に保存。有効期限: 12時間。

### キオスク認証

通常認証とは別系統。`m_shops.kiosk_passcode` で店舗ごとにパスコード設定。
Cookie（`kiosk_session`）でセッション管理。

### 認証が不要なパス

- `/login`
- `/invite`
- `/change-password`
- `/buyback-kiosk/*`
- `/buyback-mail`
