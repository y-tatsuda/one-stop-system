# Claude Code 開発ガイド

**このファイルは新セッション開始時に必ず最初に読むこと**

---

## 1. 絶対ルール

### やってはいけないこと

1. **新しい計算ロジックを作成しない**
   - 価格計算は `/app/lib/pricing.ts` のみ
   - 既に動いているコードがあれば、それを使う

2. **テーブル構造を推測しない**
   - 必ず実DBを確認してからカラム追加を提案
   - ドキュメントは古い可能性がある

3. **削除後にデータを参照しない**
   - 通知送信 → 削除 の順序を守る
   - 削除してからAPIを呼んでもデータは取れない

4. **型定義を推測しない**
   - 実際のDBカラム名を確認する
   - `bank_branch` ≠ `branch_name` のような違いに注意

---

## 2. 開発前チェックリスト

### 新機能を作る前に

- [ ] 類似機能が既にないか確認したか？
- [ ] 使うべき共通関数を確認したか？
- [ ] テーブル構造を実DBで確認したか？
- [ ] 処理順序（通知→削除など）を確認したか？

### コード修正前に

- [ ] 正しく動いている類似コードを見つけたか？
- [ ] そのコードと同じ方法で修正できるか？
- [ ] 新しいアプローチを発明しようとしていないか？

---

## 3. 確認用SQL

### テーブル構造確認

```sql
-- カラム一覧を取得
SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
FROM information_schema.columns
WHERE table_name = 'テーブル名';

-- 詳細なカラム情報
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'テーブル名'
ORDER BY ordinal_position;
```

### 主要テーブル

| テーブル | 用途 |
|---------|------|
| `t_mail_buyback_requests` | 郵送買取申込 |
| `t_buyback` | 買取ヘッダー（店頭・郵送共通） |
| `t_buyback_items` | 買取明細 |
| `t_used_inventory` | 中古在庫 |
| `t_customers` | 顧客 |
| `m_buyback_prices` | 買取価格マスタ |

---

## 4. 共通ライブラリ

| ファイル | 用途 | 使用例 |
|---------|------|--------|
| `/app/lib/pricing.ts` | 価格計算 | `calculateBuybackDeduction(basePrice, condition, [], bihinPrice)` |
| `/app/lib/supabase.ts` | DBクライアント | `supabase.from('table').select()` |
| `/app/lib/supabase-admin.ts` | 管理者クライアント | API内で使用 |
| `/app/lib/auth.ts` | 認可チェック | `requireAuth(header)` |

---

## 5. 既存コード参照先

### 価格計算

```typescript
// 正しい使い方（buyback-mail, mail-buyback-management で同じ）
import { calculateBuybackDeduction } from '@/app/lib/pricing'

const deduction = calculateBuybackDeduction(
  basePrice,      // 選択ランクの価格
  condition,      // 端末状態
  [],             // 減額マスタ（未使用）
  bihinPrice      // 美品価格（減額計算の基準）
)
```

### 在庫登録

参照先: `/app/buyback/page.tsx` 700-780行目付近
1. `t_customers` に顧客登録
2. `t_buyback` にヘッダー登録
3. `t_used_inventory` に在庫登録（`buyback_id` で紐付け）
4. `t_buyback_items` に明細登録

### メール送信

参照先: `/app/api/mail-buyback/notify/route.ts`
- Resend API を使用
- LINE は LINE Messaging API を使用

---

## 6. よくあるミスと対策

| ミス | 対策 |
|------|------|
| 新しい計算ロジックを作成 | `pricing.ts` を使う |
| DBに存在しないカラムを使用 | 実DBでカラム確認 |
| 削除後にデータ参照 | 通知→削除の順序を守る |
| 型定義とDBカラム名の不一致 | 実DBのカラム名を使う |
| ドキュメントを信じすぎ | 実コード・実DBを確認 |

---

## 7. 関連ドキュメント

詳細は以下を参照：
- `/docs/buyback-architecture.md` - 買取システム全体
- `/docs/mail-buyback-flow.md` - 郵送買取フロー
- `/docs/01_database_schema.md` - DB設計（古い可能性あり）

---

## 8. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-02-09 | 初版作成 |
