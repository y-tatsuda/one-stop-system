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
| `/app/buyback-mail/page.tsx` | 郵送買取フォーム（EC・LIFF共通） | お客様 | 不要 |
| `/app/liff/buyback/page.tsx` | LIFFエントリー（リダイレクトのみ） | お客様 | LINE認証 |
| `/app/shop/buyback/page.tsx` | ECサイト買取トップ（情報ページ） | お客様 | 不要 |
| `/app/mail-buyback-management/page.tsx` | 郵送買取管理（進捗・本査定・振込） | スタッフ | 要ログイン |
| `/app/buyback-response/page.tsx` | 承諾/返却選択（WEB） | お客様 | トークン |
| `/app/liff/buyback-response/page.tsx` | 承諾/返却選択（LINE） | お客様 | LINE認証 |
| `/app/buyback-assessment/page.tsx` | 減額理由確認（画像付き） | お客様 | トークン |

### バックエンド（API）

| パス | 用途 | 呼び出し元 |
|------|------|-----------|
| `/app/api/mail-buyback/route.ts` | 郵送買取申込み | `/buyback-mail` |
| `/app/api/mail-buyback/notify/route.ts` | 通知送信（LINE/メール/Slack） | `/mail-buyback-management` |
| `/app/api/mail-buyback/decline/route.ts` | 査定辞退記録 | `/buyback-mail` |
| `/app/api/generate-buyback-pdf/route.ts` | 買取同意書PDF生成 | `/mail-buyback-management` |
| `/app/api/upload-document/route.ts` | 画像アップロード | 各種フォーム |
| `/app/api/convert-to-sjis/route.ts` | CSV Shift-JIS変換 | `/mail-buyback-management` |

### 共通ライブラリ

| パス | 用途 |
|------|------|
| `/app/lib/pricing.ts` | 価格計算マスタ（唯一の計算ロジック） |
| `/app/lib/supabase.ts` | Supabaseクライアント |
| `/app/lib/supabase-admin.ts` | Supabase管理者クライアント |
| `/app/lib/auth.ts` | 認可チェック |

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

### 4. 郵送買取管理フロー

```
/mail-buyback-management
        ↓ ステータス更新
     /api/mail-buyback/notify
        ↓
        ├── Slack通知
        ├── LINE Push（LIFF経由の場合）
        └── メール送信（WEB経由の場合）
```

---

## 通知の条件分岐

### 申込み時（`/api/mail-buyback/route.ts`）

| 条件 | Slack | LINE返信 | メール返信 | Lステップ |
|------|-------|----------|-----------|----------|
| LIFF経由（lineUserId あり） | ✓ | ✓ | - | ✓ |
| WEB経由（email あり、lineUserId なし） | ✓ | - | ✓ | - |

### ステータス変更時（`/api/mail-buyback/notify/route.ts`）

| アクション | Slack | LINE | メール |
|-----------|-------|------|--------|
| kit_sent | ✓ | ✓（LIFF） | ✓（WEB） |
| assessed | ✓ | ✓（LIFF） | ✓（WEB） |
| approved | ✓ | - | - |
| rejected | ✓ | - | - |
| paid | ✓ | ✓（LIFF） | ✓（WEB） |

---

## 本査定メール 3パターン

| パターン | 条件 | 内容 |
|---------|------|------|
| 1. 変更なし | final_price = total_estimated_price | 事前査定と同額 |
| 2. 増額 | final_price > total_estimated_price | 増額理由リスト |
| 3. 減額 | final_price < total_estimated_price | 減額理由リスト + 画像確認URL |

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
| カメラ染み（小） | minor | 基準価格の10% |
| カメラ染み（大） | major | 基準価格の20% |
| カメラ窓破損 | あり | 基準価格の10% |
| 非正規修理歴 | あり | 基準価格の20% |

---

## データベース

### 郵送買取テーブル: `t_mail_buyback_requests`

| カラム | 型 | 説明 |
|--------|-----|------|
| id | int | 主キー |
| request_number | text | 申込番号（MB-/DC-YYYY-MM-DD-NNN） |
| status | text | pending/kit_sent/arrived/assessing/assessed/approved/rejected/paid/completed/returned/declined |
| customer_name | text | 顧客名 |
| customer_name_kana | text | フリガナ |
| birth_year/month/day | text | 生年月日 |
| occupation | text | 職業 |
| phone | text | 電話番号 |
| email | text | メールアドレス |
| postal_code | text | 郵便番号 |
| address | text | 住所 |
| address_detail | text | 建物名等 |
| items | jsonb | 端末情報（配列） |
| total_estimated_price | int | 合計査定金額 |
| final_price | int | 最終査定金額 |
| assessment_details | jsonb | 本査定詳細（傷・写真・変更） |
| line_user_id | text | LINE UID（LIFF経由の場合） |
| line_display_name | text | LINE表示名 |
| source | text | web / liff |
| bank_name/branch_name | text | 振込先銀行 |
| account_type/number/holder | text | 口座情報 |
| kit_sent_at | timestamp | キット送付日時 |
| arrived_at | timestamp | 到着日時 |
| assessed_at | timestamp | 本査定完了日時 |
| approved_at | timestamp | 承諾日時 |
| rejected_at | timestamp | 返却希望日時 |
| paid_at | timestamp | 振込日時 |
| completed_at | timestamp | 完了日時 |
| returned_at | timestamp | 返送完了日時 |
| staff_notes | text | スタッフメモ |
| created_at | timestamp | 作成日時 |

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
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | 必須 |
| `NEXT_PUBLIC_BASE_URL` | サイトURL | 通知リンク用 |

---

## 開発の鉄則

### 絶対に守ること

1. **新しい計算ロジックを作らない**
   - 価格計算は `pricing.ts` の関数を使う
   - 同じ機能が既にあるなら、それを使う
   - 「似たようなコード」を新規作成しない

2. **既存コードを先に確認する**
   - 新機能を実装する前に、類似機能がないか確認
   - 正しく動いているコードを参考にする
   - コピー＆修正ではなく、共通化する

3. **一箇所に集約する**
   - 同じロジックを複数箇所に書かない
   - 変更が必要な場合は一箇所だけ直せばよい状態を維持

### 価格計算の統一

すべての買取ページは **同じ計算ロジック** を使用：

| ページ | 計算関数 |
|--------|---------|
| `/app/buyback/page.tsx`（店頭） | `calculateBuybackDeduction` |
| `/app/buyback-mail/page.tsx`（事前査定） | `calculateBuybackDeduction` |
| `/app/mail-buyback-management/page.tsx`（本査定） | `calculateBuybackDeduction` |

```typescript
// 正しい使い方
import { calculateBuybackDeduction } from '@/app/lib/pricing'

const deduction = calculateBuybackDeduction(
  basePrice,      // 選択ランクの価格
  condition,      // 端末状態
  [],             // 減額マスタ（未使用）
  bihinPrice      // 美品価格（減額計算の基準）← 重要
)
```

**注意:** 第4引数の `bihinPrice` を正しく渡さないと計算結果がズレる

---

## 修正時の注意

1. **価格計算を変更する場合**
   - `/app/lib/pricing.ts` のみを修正
   - 各ページには計算ロジックを書かない
   - 新しい計算関数を作らない

2. **通知を追加・変更する場合**
   - 申込み時: `/app/api/mail-buyback/route.ts`
   - ステータス変更時: `/app/api/mail-buyback/notify/route.ts`

3. **フォーム項目を追加する場合**
   - `/app/buyback-mail/page.tsx` のフォームを修正
   - `/app/api/mail-buyback/route.ts` のバリデーション・保存を修正
   - DBマイグレーションが必要な場合あり

4. **本査定の項目を追加する場合**
   - `/app/mail-buyback-management/page.tsx` の AssessmentDetails 型を修正
   - `/app/api/mail-buyback/notify/route.ts` のメール本文を修正
   - `/app/buyback-assessment/page.tsx` の表示を修正

5. **バグ修正の場合**
   - まず正しく動いているコードを探す
   - そのコードと同じ方法で修正する
   - 新しいアプローチを発明しない
