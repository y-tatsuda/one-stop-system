# ECサイト構成

## 概要

ONE STOPのECサイトは、中古在庫管理システムと統合された自社ECサイトです。
既存の在庫データをそのまま利用し、決済はSquareを経由します。

**ビジョン**: 日本一の安心をお届けしたい

## ページ構成

### 公開ページ（認証不要）

| パス | 説明 |
|------|------|
| `/shop` | 商品一覧（トップページ） |
| `/shop/[id]` | 商品詳細 |
| `/shop/cart` | カート（LocalStorage） |
| `/shop/checkout` | 購入手続き |
| `/shop/complete` | 注文完了 |
| `/shop/warranty` | 360日保証について |
| `/shop/guide/data-transfer` | データ移行ガイド |
| `/shop/guide/after-purchase` | 購入後の流れ |
| `/shop/support` | サポート・保証確認 |

## 技術構成

### フロントエンド

- Next.js App Router
- 独自レイアウト（`/app/shop/layout.tsx`）
- カート: LocalStorage + React Context
- CSS: `/app/shop/shop.css`

### バックエンド

- Supabase（既存）
- Square決済連携（既存のSquare統合を利用）

### データベース

新規テーブル（`scripts/ec-tables.sql`で作成）:
- `ec_orders`: EC注文情報
- `shop_inquiries`: お問い合わせ

既存テーブルの利用:
- `used_inventory`: 商品データ（`ec_status`で公開/非公開制御）
- `m_iphone_models`: モデルマスタ

## 商品公開フロー

1. 中古在庫管理で `ec_status` を「公開」に設定
2. ECサイトで自動的に商品が表示される
3. 購入されると `ec_status` が「EC予約」→「販売」に更新

## 決済フロー

```
カート追加 → 購入手続き → Square決済
         → 決済完了 → 在庫ステータス更新 → 確認メール送信
```

## 保証確認機能

サポートページでIMEIを入力すると、保証状況を確認できます:
- 購入日から何日経過しているか
- 現在の返金率/修理負担率
- 次の保証段階までの日数

## セットアップ

### 1. データベーステーブル作成

```sql
-- Supabase SQL Editorで実行
-- scripts/ec-tables.sql の内容
```

### 2. 在庫をEC公開

中古在庫管理ページで、公開したい商品の `ec_status` を「公開」に変更

### 3. コンテンツ設定

`/content/shop/` 配下のMarkdownファイルを編集:
- `site-config.md`: 連絡先、送料、支払い方法など
- `top-page.md`: ヒーロー・キャッチコピー
- `warranty.md`: 保証内容
- `data-transfer.md`: データ移行ガイド
- `after-purchase.md`: 購入後の流れ

## 今後の拡張

- [ ] 商品画像アップロード・表示
- [ ] Square決済リンク生成（現在はモック）
- [ ] 注文確認メール自動送信
- [ ] 在庫自動連動（決済完了→販売済み）
- [ ] 法的ページ（特定商取引法、プライバシーポリシー等）
- [ ] 管理画面での注文・問い合わせ管理
