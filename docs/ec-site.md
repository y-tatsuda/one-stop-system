# ONE STOP ECサイト ドキュメント

## 概要

中古iPhone販売・買取を行うECサイト。「見やすい・迷わない・探しやすい」をコンセプトに設計。

---

## サイト構成

### 販売サイト（黒/白ベース）

| ページ | パス | 説明 |
|--------|------|------|
| ホーム | `/shop` | ヒーロー、モデル一覧、商品プレビュー、買取誘導、安心ポイント |
| 商品一覧 | `/shop/products` | フィルター付き商品一覧（モデル・容量・ランク・価格帯） |
| 商品詳細 | `/shop/[id]` | 個別商品の詳細情報、カート追加 |
| カート | `/shop/cart` | カート内容確認、削除 |
| チェックアウト | `/shop/checkout` | 購入手続き |
| 完了 | `/shop/complete` | 購入完了画面 |
| 保証について | `/shop/warranty` | 360日保証の詳細説明 |

### 買取サイト（ゴールド/イエローベース）

| ページ | パス | 説明 |
|--------|------|------|
| 買取トップ | `/shop/buyback` | 買取LP（理由・価格表・流れ・FAQ） |
| オンライン査定 | `/shop/buyback/estimate` | 機種・容量・状態を選んで概算査定 |
| 郵送買取申込 | `/shop/buyback/apply` | 申込フォーム（4ステップ） |

---

## デザインシステム

### カラーパレット

```css
/* 販売サイト */
--color-primary: #1A1A1A;        /* メインカラー（黒） */
--color-bg: #FFFFFF;             /* 背景（白） */
--color-text: #212529;           /* テキスト */
--color-text-secondary: #6C757D; /* サブテキスト */
--color-border: #E9ECEF;         /* ボーダー */
--color-success: #059669;        /* 成功（緑） */

/* 買取サイト */
--color-buyback: #F59E0B;        /* メインカラー（ゴールド） */
--color-buyback-hover: #D97706;  /* ホバー時 */
--color-buyback-dark: #B45309;   /* ダーク */
--color-buyback-bg: #FFFBEB;     /* 背景 */
--color-buyback-text: #92400E;   /* テキスト */
```

### タイポグラフィ

```css
--font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Noto Sans JP", sans-serif;
--font-size-xs: 11px;
--font-size-sm: 13px;
--font-size-base: 15px;
--font-size-lg: 17px;
--font-size-xl: 20px;
--font-size-2xl: 24px;
--font-size-3xl: 32px;
```

### スペーシング

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
```

---

## 主要機能

### 商品一覧フィルター

- **モデル選択**: iPhone 15シリーズ〜iPhone 11シリーズ、SE
- **容量選択**: 選択モデルに存在する容量のみ表示
- **ランク選択**: 美品/良品/並品/リペア品（在庫があるもののみ）
- **価格帯**: 〜5万/5-8万/8-10万/10万〜
- **在庫数表示**: 各フィルターオプションに（n件）表示

### カート機能

- `CartContext`でグローバル状態管理
- ローカルストレージに永続化
- 中古品のため同一商品は1点のみ

### 買取査定

- モデル・容量・状態から概算価格を計算
- 状態別係数: 美品100% / 良品85% / 並品70% / 訳あり45%

---

## ファイル構成

```
app/shop/
├── layout.tsx          # ECサイト共通レイアウト
├── page.tsx            # ホームページ
├── shop.css            # 全スタイル定義
├── CartContext.tsx     # カート状態管理
├── [id]/
│   └── page.tsx        # 商品詳細
├── products/
│   └── page.tsx        # 商品一覧
├── cart/
│   └── page.tsx        # カート
├── checkout/
│   └── page.tsx        # チェックアウト
├── complete/
│   └── page.tsx        # 購入完了
├── warranty/
│   └── page.tsx        # 保証説明
└── buyback/
    ├── page.tsx        # 買取トップ
    ├── estimate/
    │   └── page.tsx    # オンライン査定
    └── apply/
        └── page.tsx    # 郵送買取申込
```

---

## 商品サムネイル

### 配置場所

```
public/shop/products/thumbnails/
├── {model}_{color}.webp    # カラー別サムネイル
└── {model}.png             # モデル別デフォルト
```

### モデルプレフィックス対応

| モデル | プレフィックス |
|--------|----------------|
| iPhone 15 Pro Max | `15promax` |
| iPhone 15 Pro | `15pro` |
| iPhone 15 Plus | `15plus` |
| iPhone 15 | `15` |
| iPhone 14 Pro Max | `14promax` |
| ... | ... |

---

## データベース連携

### 使用テーブル

- `t_used_inventory`: 中古在庫（商品データ）
- `m_iphone_models`: iPhoneモデルマスタ

### 商品取得クエリ例

```typescript
const { data } = await supabase
  .from('t_used_inventory')
  .select('id, model, storage, rank, sales_price, battery_percent, color, ...')
  .eq('tenant_id', DEFAULT_TENANT_ID)
  .eq('status', '販売可')
  .order('created_at', { ascending: false })
```

---

## セキュリティ・注意事項

- スタッフメモ（memo）は絶対に商品詳細ページに表示しない
- 顧客情報の取り扱いは個人情報保護法に準拠
- 古物営業法に基づく本人確認が必要

---

## 今後の拡張予定

- [ ] 決済機能（Square連携）
- [ ] 会員登録・ログイン
- [ ] 購入履歴確認
- [ ] 下取り価格自動計算
- [ ] 買取価格表のDB管理化

---

## 開発サーバー

```bash
npm run dev -- -p 3001
```

アクセスURL: http://localhost:3001/shop
