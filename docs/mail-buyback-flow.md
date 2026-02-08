# 郵送買取 自動化フロー設計

## 概要

郵送買取の申込みから在庫登録までを自動化・一元管理するシステム。

---

## 全体図

```
┌─────────────────────────────────────────────────────────────┐
│                        買取システム                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  【店頭買取】                  【郵送買取】                   │
│                                                              │
│   スタッフ/KIOSK                お客様                       │
│        ↓                      ↓          ↓                  │
│    /buyback               LINE経由      WEB経由              │
│        ↓                      ↓          ↓                  │
│   店頭買取フォーム         /liff/buyback  /buyback-mail      │
│        ↓                      ↓          ↓                  │
│    t_buybacks             /buyback-mail（共通フォーム）      │
│                                    ↓                         │
│                           t_mail_buyback_requests            │
│                                    ↓                         │
│                         /mail-buyback-management             │
│                           （進捗管理・本査定・振込）          │
│                                    ↓                         │
│                              在庫登録へ                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 郵送買取フロー

### ステップ一覧

| # | ステップ | お客様側 | 管理側 | 自動処理 |
|---|---------|---------|--------|---------|
| 1 | 申込み | フォーム入力 | - | LINE/メール返信、Slack通知、DB保存 |
| 2 | キット送付 | - | 「送付済」ボタン | LINE/メール自動送信、Slack通知 |
| 3 | 端末到着 | - | 「到着」ボタン | - |
| 4 | 本査定 | - | 査定結果入力、写真アップ | LINE/メール自動送信（3パターン）、Slack通知 |
| 5 | 承諾/返却 | LIFF or メールリンクから選択 | - | Slack通知（振込先情報含む）、DB更新 |
| 6 | 振込完了 | - | 「振込済」ボタン | LINE/メール通知、Slack通知 |
| 7 | 在庫登録 | - | 在庫登録画面へ遷移 | 同意書読み込み、DB登録 |

---

## 進捗ステータス

| ステータス | 説明 | 次のアクション |
|-----------|------|---------------|
| `pending` | 申込み受付 | キット送付 |
| `kit_sent` | キット送付済 | 端末到着待ち |
| `arrived` | 端末到着 | 本査定開始 |
| `assessing` | 本査定中 | 査定完了 |
| `assessed` | 本査定完了・承諾待ち | お客様の回答待ち |
| `approved` | 承諾済 | 振込処理 |
| `rejected` | 返却希望 | 返送処理 |
| `paid` | 振込完了 | 在庫登録 |
| `completed` | 在庫登録完了 | - |
| `returned` | 返送完了 | - |
| `declined` | 査定辞退（申込前に辞退） | - |

---

## DB設計

### テーブル: `t_mail_buyback_requests`

#### 基本カラム
| カラム | 型 | 説明 |
|--------|-----|------|
| id | serial | 主キー |
| tenant_id | int | テナントID |
| request_number | text | 申込番号（MB-YYYY-MM-DD-NNN / DC-YYYY-MM-DD-NNN） |
| status | text | ステータス |
| customer_name | text | 顧客名 |
| customer_name_kana | text | フリガナ |
| birth_year | text | 生年 |
| birth_month | text | 生月 |
| birth_day | text | 生日 |
| occupation | text | 職業 |
| postal_code | text | 郵便番号 |
| address | text | 住所 |
| address_detail | text | 建物名等 |
| phone | text | 電話番号 |
| email | text | メールアドレス |
| items | jsonb | 端末情報（配列） |
| total_estimated_price | int | 合計事前査定金額 |
| item_count | int | 端末数 |
| memo | text | メモ |
| line_user_id | text | LINE UID |
| line_display_name | text | LINE表示名 |
| source | text | 経路（web / liff） |
| created_at | timestamp | 作成日時 |

#### 進捗管理カラム
| カラム | 型 | 説明 |
|--------|-----|------|
| kit_sent_at | timestamp | キット送付日時 |
| arrived_at | timestamp | 端末到着日時 |
| assessed_at | timestamp | 本査定完了日時 |
| final_price | int | 本査定後の最終価格 |
| assessment_details | jsonb | 本査定詳細（傷・写真・項目変更） |
| approved_at | timestamp | 承諾日時 |
| rejected_at | timestamp | 返却希望日時 |
| bank_name | text | 銀行名 |
| branch_name | text | 支店名 |
| account_type | text | 口座種別（普通/当座） |
| account_number | text | 口座番号 |
| account_holder | text | 口座名義（カナ） |
| paid_at | timestamp | 振込日時 |
| completed_at | timestamp | 完了日時 |
| returned_at | timestamp | 返送完了日時 |
| staff_notes | text | スタッフメモ |

#### items JSONの構造
```typescript
{
  modelDisplayName: string      // 機種名
  storage: string               // 容量
  rank: string                  // ランク
  batteryPercent: number        // バッテリー
  imei: string                  // IMEI
  nwStatus: 'ok' | 'triangle' | 'cross'  // NW制限
  cameraStain: 'none' | 'minor' | 'major'  // カメラ染み
  cameraBroken: boolean         // カメラ窓破損
  repairHistory: boolean        // 非正規修理歴
  estimatedPrice: number        // 査定価格
  guaranteePrice: number        // 最低保証価格
  cameraPhoto?: string          // カメラ写真パス
  colorDisplayName?: string     // 色
}
```

#### assessment_details JSONの構造
```typescript
{
  screen_scratches: {
    hasIssue: boolean
    description: string
    photos: string[]
  }
  body_scratches: {
    hasIssue: boolean
    description: string
    photos: string[]
  }
  camera_stain: {
    hasIssue: boolean
    description: string
    photos: string[]
    level?: 'none' | 'minor' | 'major'
  }
  other: {
    hasIssue: boolean
    description: string
    photos: string[]
  }
  item_changes?: Array<{
    field: string        // フィールド名
    label: string        // 表示名
    beforeValue: string  // 事前査定値
    afterValue: string   // 本査定値
    hasChanged: boolean  // 変更ありか
  }>
}
```

---

## 通知設計

### Slack通知

| タイミング | 通知内容 |
|-----------|---------|
| 申込み受付 | 申込番号、顧客情報、端末情報、査定金額 |
| キット送付 | 申込番号、顧客名、送付日時 |
| 本査定完了 | 申込番号、顧客名、事前価格→最終価格、差額 |
| 承諾（振込先入力） | 申込番号、顧客名、最終価格、振込先情報 |
| 返却希望 | 申込番号、顧客名 |
| 振込完了 | 申込番号、顧客名、振込金額、振込先 |

### LINE/メール通知

| タイミング | 内容 |
|-----------|------|
| 申込み完了 | 申込内容確認、今後の流れ、端末情報詳細 |
| キット送付 | 発送連絡、到着目安、返送手順、注意事項 |
| 本査定完了（3パターン） | 下記参照 |
| 振込完了 | 振込完了のお知らせ、金額、振込先 |

#### 本査定完了メール 3パターン

**1. 価格変更なし**
- 「事前査定と同額のため、買取価格に変更はございません」
- 振込先入力リンク

**2. 価格アップ（増額）**
- 「事前査定より ¥X,XXX アップしました！」
- 増額理由（項目変更リスト）
- 振込先入力リンク

**3. 価格ダウン（減額）**
- 「事前査定より ¥X,XXX 減額となりました」
- 減額理由（項目変更リスト）
- 減額理由確認ページへのリンク（画像付き）
- 振込先入力リンク

---

## Lステップ タグ付け

| タイミング | タグ名 |
|-----------|-------|
| 申込み完了 | `買取申込み済` |
| 承諾 | `買取承諾済` |
| 振込完了 | `買取完了` |
| 返却希望 | `買取返却` |

---

## 管理画面設計

### パス: `/mail-buyback-management`

### 機能一覧
- 一覧表示（ページネーション）
- フィルター（経路、ステータス）
- 検索（申込番号、顧客名、電話番号、メール）
- 詳細モーダル
- アクションボタン
  - キット送付
  - 到着確認
  - 本査定開始
  - 本査定入力（比較UI付き）
  - 振込完了
  - 在庫登録へ
- 写真アップロード（本査定用）
- カメラ写真表示（申込時アップロード分）
- クリックポストCSV出力（複数選択対応）
- 買取同意書PDF印刷
- 分析ダッシュボード

### 分析ダッシュボード機能
- 総申込数
- ステータス別件数
- 経路別件数（LINE/WEB）
- 査定辞退数・辞退率
- コンバージョン率（ファネル表示）
  - 申込 → キット送付
  - キット送付 → 到着
  - 到着 → 査定完了
  - 査定完了 → 承諾/返却
  - 全体コンバージョン率
- 累計査定金額
- 累計買取金額（確定）

### 一覧表示項目
| 項目 | 説明 |
|------|------|
| チェックボックス | クリックポストCSV選択用 |
| 申込番号 | MB-YYYY-MM-DD-NNN |
| 経路 | LINE / WEB アイコン |
| 顧客名 | - |
| 端末 | 機種名（複数の場合は件数） |
| 査定額 | 事前/最終価格 |
| ステータス | バッジ表示 |
| 申込日 | MM/DD HH:mm |
| 操作 | 詳細ボタン |

---

## ファイル構成

### フロントエンド

| パス | 用途 |
|------|------|
| `/app/buyback-mail/page.tsx` | 郵送買取申込フォーム |
| `/app/mail-buyback-management/page.tsx` | 管理画面 |
| `/app/buyback-response/page.tsx` | 承諾/返却選択ページ（WEB） |
| `/app/liff/buyback-response/page.tsx` | 承諾/返却選択ページ（LINE） |
| `/app/buyback-assessment/page.tsx` | 減額理由確認ページ（画像付き） |

### バックエンド

| パス | 用途 |
|------|------|
| `/app/api/mail-buyback/route.ts` | 申込みAPI |
| `/app/api/mail-buyback/notify/route.ts` | 通知API（LINE/メール/Slack） |
| `/app/api/mail-buyback/decline/route.ts` | 査定辞退記録API |
| `/app/api/generate-buyback-pdf/route.ts` | 買取同意書PDF生成 |
| `/app/api/upload-document/route.ts` | 画像アップロード |
| `/app/api/convert-to-sjis/route.ts` | CSV Shift-JIS変換 |

---

## 環境変数

| 変数名 | 用途 |
|--------|------|
| `RESEND_API_KEY` | メール送信（Resend） |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE返信 |
| `LSTEP_API_KEY` | Lステップタグ付け |
| `LSTEP_ACCOUNT_ID` | Lステップアカウント |
| `SLACK_WEBHOOK_URL_BUYBACK` | Slack通知 |
| `NEXT_PUBLIC_LIFF_ID` | LIFF初期化 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_BASE_URL` | サイトURL（通知リンク用） |
