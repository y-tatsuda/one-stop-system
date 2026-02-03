# API リファレンス

すべてのAPIは `/app/api/` 配下の Route Handler として実装。

---

## 認証 API

### POST /api/auth/login
ログイン処理。

**リクエスト:**
```json
{ "email": "string", "password": "string" }
```

**レスポンス（2FA無効時）:**
```json
{ "success": true, "token": "JWT文字列", "staff": { "id": 1, "name": "...", "role": "staff" } }
```

**レスポンス（2FA有効時）:**
```json
{ "success": true, "requiresOTP": true, "staffId": 1 }
```

**処理フロー:**
1. レート制限チェック（5回/15分）
2. Supabase Auth でパスワード検証
3. m_staff から is_active, is_2fa_enabled 確認
4. 2FA有効: OTP生成 → メール送信 → requiresOTP返却
5. 2FA無効: JWT生成 → トークン返却

### POST /api/auth/verify-otp
OTP検証。

**リクエスト:**
```json
{ "staffId": 1, "otp": "123456" }
```

**レスポンス:**
```json
{ "success": true, "token": "JWT文字列", "staff": { ... } }
```

### POST /api/auth/resend-otp
OTP再送信。

**リクエスト:**
```json
{ "staffId": 1, "email": "..." }
```

### POST /api/auth/change-password
パスワード変更。

**リクエスト:**
```json
{ "staffId": 1, "currentPassword": "...", "newPassword": "..." }
```

**パスワード要件:** 8文字以上、小文字、大文字、数字を各1つ以上含む

### GET /api/auth/logout
ログアウト。認証操作ログに記録。

---

## キオスク API

### POST /api/kiosk/auth
キオスクログイン。

**リクエスト:**
```json
{ "shopId": "1", "passcode": "1234" }
```

**処理:** m_shops.kiosk_passcode と照合。成功時Cookieセット。

### GET /api/kiosk/auth
キオスクセッション確認。

### DELETE /api/kiosk/auth
キオスクログアウト。Cookie削除。

---

## スタッフ管理 API

### POST /api/staff/create
スタッフ新規作成。

**リクエスト:**
```json
{
  "name": "田中太郎",
  "email": "tanaka@example.com",
  "password": "Password123",
  "role": "staff",
  "shopIds": [1, 2],
  "is2faEnabled": false
}
```

**処理:**
1. Supabase Auth ユーザー作成
2. m_staff レコード作成
3. m_staff_shops に店舗紐付け

### POST /api/staff/invite
スタッフ招待メール送信。

**リクエスト:**
```json
{ "staffId": 1 }
```

**処理:** 招待トークン生成（24時間有効）→ メール送信

### POST /api/staff/activate
スタッフ有効/無効切り替え。

**リクエスト:**
```json
{ "staffId": 1, "isActive": true }
```

### POST /api/staff/delete
スタッフ削除。

**リクエスト:**
```json
{ "staffId": 1 }
```

---

## 外部連携 API

### POST /api/send-email
メール送信（Resend API経由）。

**リクエスト:**
```json
{
  "to": "user@example.com",
  "subject": "件名",
  "body": "本文"
}
```

**送信元:** ONE STOP <noreply@nichellc.net>

### POST /api/send-slack
Slack通知送信。

**リクエスト:**
```json
{ "message": "通知メッセージ" }
```

**Webhook:** `SLACK_WEBHOOK_URL_TRANSFER` 環境変数

### POST /api/mail-buyback
郵送買取申込処理。

**リクエスト:**
```json
{
  "customerName": "山田太郎",
  "customerNameKana": "ヤマダ タロウ",
  "postalCode": "1500001",
  "address": "東京都...",
  "addressDetail": "101号室",
  "phone": "090-1234-5678",
  "email": "yamada@example.com",
  "items": [
    {
      "model": "15Pro",
      "storage": 256,
      "rank": "美品",
      "batteryPercent": 92,
      "nwStatus": "ok",
      "cameraStain": "none",
      "cameraBroken": false,
      "repairHistory": false,
      "estimatedPrice": 85000,
      "imei": "..."
    }
  ],
  "totalEstimatedPrice": 85000
}
```

**処理:**
1. リクエスト番号生成（MB-YYYY-MMDD-NNN）
2. t_mail_buyback_requests にレコード作成
3. Slack通知送信（`SLACK_WEBHOOK_URL_BUYBACK`）

### POST /api/upload-document
書類アップロード（Supabase Storage）。

**リクエスト:** FormData（file, folder）
**レスポンス:**
```json
{ "path": "buyback-documents/consent/xxx.jpg" }
```

---

## Square API

### POST /api/square/webhook
Square決済イベント受信。

**対応イベント:**
- `payment.created` / `payment.updated`
- `refund.created` / `refund.updated`

**処理:**
- COMPLETED: 売上作成/更新、手数料計算
- CANCELED/VOIDED: 売上取消、在庫ステータス復旧
- 全額返金: 在庫ステータスを'販売可'に復旧

### POST /api/square/sync-catalog
Squareカタログ同期。手動実行。
