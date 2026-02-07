# 買取システム アーキテクチャ

## 概要

買取機能は **3つの経路** から利用できます：
1. 店頭（スタッフ操作 / KIOSK）
2. WEB（ECサイト）
3. LIFF（LINE経由）

---

## ファイル構成

### フロントエンド（ページ）

| パス | 用途 | 利用者 | 認証 |
|------|------|--------|------|
| `/app/buyback/page.tsx` | 店頭買取入力 | スタッフ | 要ログイン |
| `/app/buyback-kiosk/page.tsx` | KIOSKメニュー | お客様 | パスコード |
| `/app/buyback-mail/page.tsx` | **郵送買取フォーム（EC・LIFF共通）** | お客様 | 不要 |
| `/app/liff/buyback/page.tsx` | LIFFエントリー（リダイレクトのみ） | お客様 | LINE認証 |
| `/app/shop/buyback/page.tsx` | ECサイト買取トップ（情報ページ） | お客様 | 不要 |

### バックエンド（API）

| パス | 用途 | 呼び出し元 |
|------|------|-----------|
| `/app/api/mail-buyback/route.ts` | **郵送買取API（メイン）** | `/buyback-mail` |
| `/app/api/liff/buyback/submit/route.ts` | ⚠️ **重複・未使用** | なし |

### 共通ライブラリ

| パス | 用途 |
|------|------|
| `/app/lib/pricing.ts` | **価格計算マスタ（唯一の計算ロジック）** |

---

## 処理フロー

### 1. LIFF経由（LINE）

```
[LINE] → /liff/buyback
        ↓ LINE認証・UID取得
        ↓ リダイレクト（クエリパラメータ付与）
     /buyback-mail?line_uid=xxx&line_name=xxx&from=liff
        ↓ フォーム入力
        ↓ POST
     /api/mail-buyback
        ↓
        ├── Supabase保存
        ├── Slack通知
        ├── LINE自動返信 ← lineUserId がある場合
        └── Lステップタグ付け
```

### 2. WEB経由（ECサイト）

```
[ブラウザ] → /buyback-mail
        ↓ フォーム入力
        ↓ POST
     /api/mail-buyback
        ↓
        ├── Supabase保存
        ├── Slack通知
        └── メール自動返信 ← email があり、lineUserId がない場合
```

### 3. 店頭（KIOSK）

```
[KIOSK端末] → /buyback-kiosk
        ↓ パスコード認証
        ↓ リダイレクト
     /buyback?kiosk=true&shopId=xxx
        ↓ スタッフが入力・確定
        ↓
     Supabase保存（別テーブル: t_buybacks）
```

---

## 通知の条件分岐

`/api/mail-buyback/route.ts` の処理：

| 条件 | Slack | LINE返信 | メール返信 | Lステップ |
|------|-------|----------|-----------|----------|
| LIFF経由（lineUserId あり） | ✅ | ✅ | ❌ | ✅ |
| WEB経由（email あり、lineUserId なし） | ✅ | ❌ | ✅ | ❌ |

```typescript
// LINE返信・Lステップ
if (lineUserId) {
  // LINE Push Message
  // Lステップタグ付け
}

// メール返信
if (email && !lineUserId) {
  // Resend でメール送信
}
```

---

## 価格計算

**すべての買取ページは `/app/lib/pricing.ts` を使用すること**

```typescript
import { calculateBuybackDeduction } from '@/app/lib/pricing'

const deduction = calculateBuybackDeduction(basePrice, {
  batteryPercent: 85,
  isServiceState: false,
  nwStatus: 'ok',
  cameraStain: 'none',
  cameraBroken: false,
  repairHistory: false,
})
```

### 減額ルール（買取）

| 項目 | 条件 | 減額 |
|------|------|------|
| バッテリー | 90%未満 | 基準価格の10% |
| バッテリー | 80%未満 or サービス状態 | 基準価格の20% |
| NW利用制限 | △ | 基準価格の20% |
| NW利用制限 | × | 基準価格の40% |
| カメラ染み | あり | 基準価格の20% |
| カメラ窓破損 | あり | 基準価格の10% |
| 非正規修理歴 | あり | 基準価格の20% |

---

## データベース

### 郵送買取テーブル: `t_mail_buyback_requests`

| カラム | 型 | 説明 |
|--------|-----|------|
| id | int | 主キー |
| request_number | text | 申込番号（MB-YYYY-MM-DD-NNN） |
| status | text | pending / completed / cancelled |
| customer_name | text | 顧客名 |
| phone | text | 電話番号 |
| email | text | メールアドレス |
| items | jsonb | 端末情報（配列） |
| total_estimated_price | int | 合計査定金額 |
| line_user_id | text | LINE UID（LIFF経由の場合） |
| source | text | web / liff |

### 店頭買取テーブル: `t_buybacks`

（店頭用は別テーブル）

---

## 環境変数

| 変数名 | 用途 | 必須 |
|--------|------|------|
| `RESEND_API_KEY` | メール送信（Resend） | WEBメール用 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE返信 | LIFF用 |
| `LSTEP_API_KEY` | Lステップタグ付け | LIFF用 |
| `LSTEP_ACCOUNT_ID` | Lステップアカウント | LIFF用 |
| `SLACK_WEBHOOK_URL_BUYBACK` | Slack通知 | 全経路 |
| `NEXT_PUBLIC_LIFF_ID` | LIFF初期化 | LIFF用 |

---

## 整理が必要な箇所

### ⚠️ 重複API
- `/app/api/liff/buyback/submit/route.ts` は未使用
- `/app/api/mail-buyback/route.ts` に統合済み
- **削除推奨**

### ⚠️ ECサイト買取トップ
- `/app/shop/buyback/page.tsx` の価格表はハードコード
- Supabaseから取得するよう変更推奨

---

## 修正時の注意

1. **価格計算を変更する場合**
   - `/app/lib/pricing.ts` のみを修正
   - 各ページには計算ロジックを書かない

2. **通知を追加する場合**
   - `/app/api/mail-buyback/route.ts` に追加

3. **フォーム項目を追加する場合**
   - `/app/buyback-mail/page.tsx` のフォームを修正
   - `/app/api/mail-buyback/route.ts` のバリデーション・保存を修正
   - DBマイグレーションが必要な場合あり
