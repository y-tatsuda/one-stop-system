# ONE STOP システム 完全設計書

## 概要

スマートフォン修理・中古買取販売店舗向けの統合業務管理システム。
Next.js + Supabase (PostgreSQL) で構築されたWebアプリケーション。

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 16.1.2 (App Router) |
| 言語 | TypeScript 5 |
| UI | React 19.2.3 |
| スタイリング | Tailwind CSS 4 + カスタムCSS変数 |
| DB / BaaS | Supabase (PostgreSQL) |
| チャート | Recharts 3.7.0 |
| メール | Resend API |
| 通知 | Slack Webhook |
| 決済連携 | Square POS |
| アイコン | FontAwesome 7 |
| PWA | manifest.json 対応 |

## 環境変数 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase プロジェクトURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase 匿名キー
SUPABASE_SERVICE_ROLE_KEY=       # Supabase サービスロールキー（秘匿）
NEXT_PUBLIC_APP_URL=             # アプリケーションURL
RESEND_API_KEY=                  # Resend メール送信APIキー
SLACK_WEBHOOK_URL_TRANSFER=      # Slack 振込通知用Webhook
SLACK_WEBHOOK_URL_BUYBACK=       # Slack 買取通知用Webhook
```

## ファイル構成

```
one-stop-system/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認証グループ（共通レイアウト）
│   │   ├── change-password/page.tsx
│   │   ├── invite/page.tsx
│   │   └── login/page.tsx
│   ├── accessory-inventory/page.tsx  # アクセサリ在庫
│   ├── admin/staff/page.tsx          # スタッフ設定
│   ├── api/                          # APIルート
│   │   ├── auth/                     # 認証API
│   │   │   ├── change-password/route.ts
│   │   │   ├── check/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── resend-otp/route.ts
│   │   │   └── verify-otp/route.ts
│   │   ├── kiosk/auth/route.ts       # キオスク認証
│   │   ├── mail-buyback/route.ts     # 郵送買取API
│   │   ├── send-email/route.ts       # メール送信
│   │   ├── send-slack/route.ts       # Slack通知
│   │   ├── square/                   # Square連携
│   │   │   ├── sync-catalog/route.ts
│   │   │   └── webhook/route.ts
│   │   ├── staff/                    # スタッフ管理API
│   │   │   ├── activate/route.ts
│   │   │   ├── create/route.ts
│   │   │   ├── delete/route.ts
│   │   │   └── invite/route.ts
│   │   └── upload-document/route.ts  # 書類アップロード
│   ├── buyback/page.tsx              # 買取入力
│   ├── buyback-kiosk/                # キオスクモード
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── page.tsx
│   ├── buyback-mail/                 # 郵送買取（お客様向け）
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── contexts/AuthContext.tsx       # 認証コンテキスト
│   ├── daily-report/page.tsx         # 日報
│   ├── inventory/page.tsx            # 中古在庫管理
│   ├── inventory-check/page.tsx      # 棚卸し
│   ├── inventory-settings/page.tsx   # 在庫設定
│   ├── lib/                          # 共有ライブラリ
│   │   ├── auth.ts                   # 認証ロジック
│   │   ├── constants.ts              # 定数
│   │   ├── pricing.ts                # 価格計算ロジック
│   │   ├── supabase.ts               # Supabaseクライアント
│   │   ├── supabase-admin.ts         # Supabase管理者クライアント
│   │   └── types.ts                  # TypeScript型定義
│   ├── master-management/page.tsx    # マスタ管理
│   ├── order/page.tsx                # パーツ発注
│   ├── parts-inventory/page.tsx      # パーツ在庫
│   ├── reports/page.tsx              # レポート・分析
│   ├── sales/page.tsx                # 売上入力
│   ├── sales-correction/page.tsx     # 売上修正
│   ├── sales-history/page.tsx        # 売上履歴
│   ├── shop-management/page.tsx      # 店舗管理
│   ├── square-settings/page.tsx      # Square設定
│   ├── staff-management/page.tsx     # スタッフ管理
│   ├── auth-wrapper.tsx              # 認証ラッパー
│   ├── client-layout.tsx             # クライアントレイアウト（ナビ）
│   ├── globals.css                   # グローバルCSS
│   ├── layout.tsx                    # ルートレイアウト
│   └── page.tsx                      # ダッシュボード
├── data/                             # データ・移行用ファイル
│   ├── sql/                          # SQLマイグレーション
│   └── *.js, *.csv                   # マスタデータソース
├── docs/                             # ドキュメント
├── public/                           # 静的ファイル
│   ├── icons/                        # PWAアイコン
│   ├── images/                       # 画像
│   ├── manifest.json                 # PWAマニフェスト
│   └── manifest-kiosk.json           # キオスク用マニフェスト
├── scripts/                          # データ移行スクリプト
├── .env.local                        # 環境変数
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

## 主要機能一覧

| 機能 | ページ | 概要 |
|------|--------|------|
| ダッシュボード | `/` | アラート、本日売上、月次サマリー |
| 売上入力 | `/sales` | iPhone/iPad/Android修理、中古販売、アクセサリ |
| 売上履歴 | `/sales-history` | 売上検索・編集・取消 |
| 買取入力 | `/buyback` | 多段階フォーム（査定→顧客情報→確認→支払） |
| キオスク | `/buyback-kiosk` | 店頭iPad用の簡易インターフェース |
| 郵送買取 | `/buyback-mail` | お客様向けWeb申込フォーム |
| 中古在庫 | `/inventory` | 中古端末の在庫管理・売却者情報表示 |
| パーツ在庫 | `/parts-inventory` | 修理パーツの在庫管理 |
| アクセサリ在庫 | `/accessory-inventory` | アクセサリの在庫管理 |
| 棚卸し | `/inventory-check` | 実在庫とシステム在庫の照合 |
| パーツ発注 | `/order` | 不足パーツの発注管理 |
| 日報 | `/daily-report` | 日次レポート（Slack送信可） |
| レポート | `/reports` | 売上分析・KPI・ランキング・目標管理 |
| マスタ管理 | `/master-management` | 修理価格・買取価格・アクセサリ等のマスタ編集 |
| スタッフ管理 | `/staff-management` | スタッフのCRUD・2FA設定 |
| 店舗管理 | `/shop-management` | 店舗情報の管理 |
| Square設定 | `/square-settings` | Square POS連携設定 |

## マルチテナント

全テーブルに `tenant_id` カラムがあり、マルチテナント対応可能。
現在は `DEFAULT_TENANT_ID = 1` で単一テナント運用。

## 認証

- Supabase Auth（メール/パスワード）
- OTP 2段階認証（オプション、Resendでメール送信）
- JWT トークン（12時間有効、localStorage保存）
- ブルートフォース保護（5回失敗で15分ロック）
- 初回ログイン時のパスワード変更強制
- キオスクモード用パスコード認証（別系統）
