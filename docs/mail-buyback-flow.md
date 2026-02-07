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
| 4 | 本査定 | - | 査定結果入力、写真アップ | LINE/メール自動送信（変更点・写真付き）、Slack通知 |
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

---

## DB設計

### テーブル: `t_mail_buyback_requests`

#### 既存カラム
| カラム | 型 | 説明 |
|--------|-----|------|
| id | serial | 主キー |
| tenant_id | int | テナントID |
| request_number | text | 申込番号（MB-YYYY-MM-DD-NNN） |
| status | text | ステータス |
| customer_name | text | 顧客名 |
| customer_name_kana | text | フリガナ |
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

#### 追加カラム（進捗管理用）
| カラム | 型 | 説明 |
|--------|-----|------|
| kit_sent_at | timestamp | キット送付日時 |
| arrived_at | timestamp | 端末到着日時 |
| assessed_at | timestamp | 本査定完了日時 |
| final_price | int | 本査定後の最終価格 |
| final_items | jsonb | 本査定後の端末情報 |
| price_changes | jsonb | 変更箇所と理由 |
| assessment_photos | text[] | 査定写真URL配列 |
| approved_at | timestamp | 承諾日時 |
| rejected_at | timestamp | 返却希望日時 |
| rejection_reason | text | 返却理由 |
| bank_name | text | 銀行名 |
| branch_name | text | 支店名 |
| account_type | text | 口座種別（普通/当座） |
| account_number | text | 口座番号 |
| account_holder | text | 口座名義（カナ） |
| paid_at | timestamp | 振込日時 |
| inventory_id | int | 登録した在庫ID（外部キー） |
| completed_at | timestamp | 完了日時 |
| returned_at | timestamp | 返送完了日時 |
| staff_id | int | 担当スタッフID |
| staff_notes | text | スタッフメモ |

---

## 通知設計

### Slack通知

| タイミング | 通知内容 |
|-----------|---------|
| 申込み受付 | 申込番号、顧客情報、端末情報、査定金額 |
| キット送付 | 申込番号、顧客名、送付日時 |
| 本査定完了 | 申込番号、顧客名、事前価格→最終価格、変更点 |
| 承諾（振込先入力） | 申込番号、顧客名、最終価格、**振込先情報** |
| 返却希望 | 申込番号、顧客名、返却理由 |
| 振込完了 | 申込番号、顧客名、振込金額 |

### LINE/メール通知

| タイミング | 内容 |
|-----------|------|
| 申込み完了 | 申込内容確認、今後の流れ |
| キット送付 | 発送連絡、届いたらご連絡ください |
| 本査定完了 | 査定結果、変更箇所、写真、承諾/返却ボタン |
| 承諾受付 | 振込先入力フォームへのリンク |
| 返却受付 | 返却手続きの案内 |
| 振込完了 | 振込完了のお知らせ |

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
- フィルター（経路、ステータス、日付）
- 検索（申込番号、顧客名、電話番号）
- 詳細モーダル
- アクションボタン
  - キット送付
  - 到着確認
  - 本査定入力
  - 振込完了
  - 在庫登録へ
- 写真アップロード
- スタッフメモ

### 一覧表示項目
| 項目 | 説明 |
|------|------|
| 申込番号 | MB-YYYY-MM-DD-NNN |
| 経路 | LINE / WEB アイコン |
| 顧客名 | - |
| 端末 | 機種名（複数の場合は件数） |
| 事前査定 | ¥xx,xxx |
| 最終価格 | ¥xx,xxx（本査定後） |
| ステータス | バッジ表示 |
| 申込日 | YYYY/MM/DD |
| 操作 | 詳細ボタン |

---

## 実装タスク

### Phase 1: 基盤整備
- [ ] `/buyback` から店頭/郵送選択を削除
- [ ] DBマイグレーション（カラム追加）
- [ ] `/mail-buyback-management` 基本画面作成

### Phase 2: 進捗管理
- [ ] キット送付機能（ボタン + 自動通知）
- [ ] 到着確認機能
- [ ] 本査定入力機能（写真アップロード含む）

### Phase 3: 承諾フロー
- [ ] 承諾/返却のLIFFページ作成
- [ ] 振込先入力フォーム作成
- [ ] 各種自動通知実装

### Phase 4: 完了処理
- [ ] 振込完了機能
- [ ] 在庫登録連携
- [ ] 同意書読み込み機能

### Phase 5: 仕上げ
- [ ] Lステップタグ付け
- [ ] 通知本文の調整
- [ ] テスト・動作確認

---

## 既存コードとの関係

| ファイル | 変更内容 |
|---------|---------|
| `/app/buyback/page.tsx` | 店頭/郵送選択を削除、店頭専用に |
| `/app/buyback-mail/page.tsx` | 変更なし（申込みフォーム） |
| `/app/api/mail-buyback/route.ts` | 通知追加、ステータス管理 |
| `/app/mail-buyback-management/page.tsx` | **新規作成** |
| `/app/api/mail-buyback/[action]/route.ts` | **新規作成**（各アクション用API） |
| `/app/liff/buyback-response/page.tsx` | **新規作成**（承諾/返却用） |
