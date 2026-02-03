# データベーススキーマ設計書

すべてのテーブルはSupabase (PostgreSQL) 上に構築。
テーブル名のプレフィクス: `m_` = マスタ、`t_` = トランザクション

---

## マスタテーブル

### m_shops（店舗マスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| name | VARCHAR | NOT NULL | 店舗名 |
| code | VARCHAR | | 店舗コード |
| is_ec | BOOLEAN | | EC店舗フラグ |
| square_location_id | VARCHAR | nullable | Square連携ロケーションID |
| kiosk_passcode | VARCHAR(6) | nullable | キオスク用パスコード |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### m_staff（スタッフマスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| auth_user_id | VARCHAR | nullable | Supabase Auth UID |
| email | VARCHAR | nullable | メールアドレス |
| name | VARCHAR | NOT NULL | 氏名 |
| role | VARCHAR | NOT NULL | 'owner' / 'admin' / 'staff' |
| is_active | BOOLEAN | DEFAULT true | |
| is_2fa_enabled | BOOLEAN | DEFAULT false | 2段階認証 |
| last_login_at | TIMESTAMPTZ | nullable | |
| password_changed | BOOLEAN | DEFAULT false | 初回パスワード変更済み |
| invitation_token | VARCHAR | nullable | 招待トークン |
| invitation_expires_at | TIMESTAMPTZ | nullable | 招待期限 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### m_staff_shops（スタッフ-店舗紐付け）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| staff_id | BIGINT | FK → m_staff.id | |
| shop_id | BIGINT | FK → m_shops.id | |
| tenant_id | BIGINT | DEFAULT 1 | |

### m_iphone_models（iPhone機種マスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| model | VARCHAR | NOT NULL | モデルコード（例: '15Pro', '16e', 'Air'） |
| display_name | VARCHAR | NOT NULL | 表示名（例: 'iPhone 15 Pro'） |
| sort_order | INTEGER | | 表示順 |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**登録済みモデル一覧:**
SE, SE2, SE3, 6s, 7, 7P, 8, 8P, X, XS, XSMax, XR,
11, 11Pro, 11ProMax, 12mini, 12, 12Pro, 12ProMax,
13mini, 13, 13Pro, 13ProMax, 14, 14Plus, 14Pro, 14ProMax,
15, 15Plus, 15Pro, 15ProMax, 16, 16Plus, 16Pro, 16ProMax, 16e,
17, 17Pro, 17ProMax, Air

### m_suppliers（仕入先マスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| code | VARCHAR(20) | NOT NULL | 仕入先コード |
| name | VARCHAR(100) | NOT NULL | 仕入先名 |
| is_active | BOOLEAN | DEFAULT true | |
| sort_order | INTEGER | DEFAULT 0 | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**初期データ:** HW, アイサポ

### m_visit_sources（来店経路マスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| name | VARCHAR | NOT NULL | 経路名 |
| is_active | BOOLEAN | DEFAULT true | |
| sort_order | INTEGER | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**例:** リピーター, 紹介, 通りがかり, ネット検索 等

### m_repair_prices_iphone（iPhone修理価格マスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| model | VARCHAR | NOT NULL | モデルコード |
| repair_type | VARCHAR | NOT NULL | 修理種別 |
| price | INTEGER | NOT NULL | 修理価格（税抜） |
| cost | NUMERIC | nullable | 原価 |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**repair_type一覧:** TH-F, TH-L, HG-F, HG-L, バッテリー, HGバッテリー, 販売バッテリー, コネクタ, リアカメラ, インカメラ, カメラ窓

### m_repair_prices_ipad（iPad修理価格マスタ）

m_repair_prices_iphone と同一構造。

### m_repair_prices_android（Android修理価格マスタ）

m_repair_prices_iphone と同一構造。
repair_type: パネル, バッテリー

### m_costs_hw（パーツ原価マスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| model | VARCHAR | NOT NULL | |
| parts_type | VARCHAR | NOT NULL | TH, HG, バッテリー, HGバッテリー, コネクタ 等 |
| cost | INTEGER | NOT NULL | 原価 |
| supplier_id | BIGINT | nullable, FK → m_suppliers.id | 仕入先 |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### m_buyback_prices（買取価格マスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| model | VARCHAR | NOT NULL | |
| storage | INTEGER | NOT NULL | 容量（GB） |
| rank | VARCHAR | NOT NULL | 超美品/美品/良品/並品/リペア品 |
| price | INTEGER | NOT NULL | 買取価格 |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### m_buyback_guarantees（買取最低保証価格マスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| model | VARCHAR | NOT NULL | |
| storage | INTEGER | NOT NULL | |
| rank | VARCHAR | NOT NULL | |
| guarantee_price | INTEGER | NOT NULL | 最低保証価格 |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### m_buyback_deductions（買取減額マスタ）※現在は参照のみ

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| model | VARCHAR | NOT NULL | |
| storage | INTEGER | NOT NULL | |
| deduction_type | VARCHAR | NOT NULL | 減額種別 |
| amount | INTEGER | NOT NULL | 減額金額 |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**注意:** 買取減額の計算は `app/lib/pricing.ts` のパーセンテージロジックに移行済み。このテーブルはマスタ管理画面から参照されるが、計算には使用されない。

### m_sales_prices（販売価格マスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| model | VARCHAR | NOT NULL | |
| storage | INTEGER | NOT NULL | |
| rank | VARCHAR | NOT NULL | |
| price | INTEGER | NOT NULL | 販売価格（税抜） |
| price_excl_tax | INTEGER | nullable | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### m_sales_price_deductions（販売減額マスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| model | VARCHAR | NOT NULL | |
| storage | INTEGER | nullable | storageなし=機種共通 |
| deduction_type | VARCHAR | NOT NULL | battery_80_89, battery_79, camera_stain_minor, camera_stain_major, nw_triangle, nw_cross |
| amount | INTEGER | NOT NULL | 固定減額金額 |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### m_accessory_categories（アクセサリカテゴリマスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| name | VARCHAR | NOT NULL | カテゴリ名 |
| sort_order | INTEGER | | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### m_accessories（アクセサリマスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| category_id | BIGINT | FK → m_accessory_categories.id | |
| name | VARCHAR | NOT NULL | 商品名 |
| variation | VARCHAR | nullable | バリエーション |
| price | INTEGER | NOT NULL | 販売価格 |
| cost | INTEGER | NOT NULL | 原価 |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### m_system_settings（システム設定）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| key | VARCHAR | NOT NULL | 設定キー |
| value | TEXT | | 設定値 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**設定キー例:** square_application_id, square_fee_rate_card, square_fee_rate_electronic 等

### m_sales_targets（売上目標マスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| shop_id | BIGINT | FK → m_shops.id | |
| year_month | VARCHAR | | 'YYYY-MM'形式 |
| target_amount | INTEGER | | 目標金額 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### m_holidays（休日マスタ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| shop_id | BIGINT | FK → m_shops.id | |
| holiday_date | DATE | | |
| reason | VARCHAR | nullable | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### m_inventory_check_settings（棚卸し設定）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| shop_id | BIGINT | FK → m_shops.id | |
| day_of_week | INTEGER | | 0=日〜6=土 |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### m_square_catalog_mapping（Squareカタログ連携）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| square_item_id | VARCHAR | | |
| model | VARCHAR | | |
| storage | INTEGER | nullable | |
| rank | VARCHAR | nullable | |
| catalog_object_id | VARCHAR | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## トランザクションテーブル

### t_sales（売上ヘッダー）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| shop_id | BIGINT | FK → m_shops.id | |
| staff_id | BIGINT | nullable, FK → m_staff.id | ECの場合null |
| visit_source_id | BIGINT | nullable, FK → m_visit_sources.id | |
| sale_date | DATE | NOT NULL | |
| total_amount | INTEGER | | 売上合計 |
| total_cost | INTEGER | | 原価合計 |
| total_profit | INTEGER | | 粗利合計 |
| square_order_id | VARCHAR | nullable | |
| square_payment_id | VARCHAR | nullable | |
| square_fee_amount | INTEGER | nullable | Square手数料 |
| ec_order_id | VARCHAR | nullable | |
| sale_type | VARCHAR | nullable | 'square_pending' 等 |
| memo | TEXT | nullable | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### t_sales_details（売上明細）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| sale_id | BIGINT | FK → t_sales.id | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| category | VARCHAR | NOT NULL | 修理/中古販売/アクセサリ/データ移行/操作案内 |
| sub_category | VARCHAR | nullable | |
| model | VARCHAR | nullable | |
| menu | VARCHAR | NOT NULL | 修理種別や商品名 |
| storage | INTEGER | nullable | |
| rank | VARCHAR | nullable | |
| accessory_id | BIGINT | nullable, FK → m_accessories.id | |
| used_inventory_id | BIGINT | nullable, FK → t_used_inventory.id | |
| supplier_id | BIGINT | nullable, FK → m_suppliers.id | |
| quantity | INTEGER | NOT NULL | |
| unit_price | INTEGER | NOT NULL | 単価 |
| unit_cost | INTEGER | NOT NULL | 単価原価 |
| discount | INTEGER | nullable | 値引き |
| amount | INTEGER | NOT NULL | 売上金額（値引き後） |
| cost | INTEGER | NOT NULL | 原価 |
| profit | INTEGER | NOT NULL | 粗利 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### t_used_inventory（中古在庫）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| shop_id | BIGINT | FK → m_shops.id | 保管店舗 |
| buyback_id | BIGINT | nullable, FK → t_buyback.id | 買取元 |
| arrival_date | DATE | NOT NULL | 入荷日 |
| model | VARCHAR | NOT NULL | |
| storage | INTEGER | NOT NULL | |
| rank | VARCHAR | NOT NULL | |
| color | VARCHAR | nullable | |
| imei | VARCHAR | nullable | |
| battery_percent | INTEGER | nullable | |
| is_service_state | BOOLEAN | nullable | |
| nw_status | VARCHAR | nullable | 'ok'/'triangle'/'cross' |
| camera_stain_level | VARCHAR | nullable | 'none'/'minor'/'major' |
| camera_broken | BOOLEAN | nullable | |
| repair_history | BOOLEAN | nullable | |
| repair_types | VARCHAR | nullable | 使用修理パーツ（カンマ区切り） |
| buyback_price | INTEGER | NOT NULL | 買取価格 |
| repair_cost | INTEGER | NOT NULL | 修理費 |
| total_cost | INTEGER | NOT NULL | 原価合計（buyback_price + repair_cost） |
| sales_price | INTEGER | nullable | 販売価格（税抜） |
| status | VARCHAR | NOT NULL | '販売可'/'修理中'/'販売済'/'移動中' |
| ec_status | VARCHAR | nullable | 'shopify'/'mercari'/'both'/null |
| management_number | VARCHAR | nullable | 管理番号（IMEI下4桁等） |
| memo | TEXT | nullable | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### t_buyback（買取ヘッダー）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| customer_id | BIGINT | FK → t_customers.id | |
| shop_id | BIGINT | FK → m_shops.id | |
| staff_id | BIGINT | FK → m_staff.id | |
| buyback_date | DATE | NOT NULL | |
| buyback_type | VARCHAR | | 'store'/'mail' |
| item_count | INTEGER | | 端末数 |
| total_buyback_price | INTEGER | | 合計買取金額 |
| total_sales_price | INTEGER | | 合計販売見込 |
| total_expected_profit | INTEGER | | 合計見込利益 |
| customer_name | VARCHAR | | 非正規化: 顧客名 |
| customer_birth_date | DATE | nullable | 非正規化: 生年月日 |
| customer_age | INTEGER | nullable | 非正規化: 年齢 |
| customer_postal_code | VARCHAR | nullable | 非正規化: 郵便番号 |
| customer_address | VARCHAR | nullable | 非正規化: 住所 |
| customer_address_detail | VARCHAR | nullable | 非正規化: 住所詳細 |
| customer_occupation | VARCHAR | nullable | 非正規化: 職業 |
| customer_phone | VARCHAR | nullable | 非正規化: 電話番号 |
| id_document_type | VARCHAR | nullable | 本人確認書類種別 |
| id_verified | BOOLEAN | | 本人確認済み |
| id_verification_method | VARCHAR | nullable | 'visual'/'copy'/'image' |
| consent_completed | BOOLEAN | | 同意完了 |
| consent_image_url | VARCHAR | nullable | 同意書画像URL |
| payment_method | VARCHAR | | 'cash'/'transfer' |
| bank_name | VARCHAR | nullable | |
| bank_branch | VARCHAR | nullable | |
| bank_account_type | VARCHAR | nullable | 'ordinary'/'checking' |
| bank_account_number | VARCHAR | nullable | |
| bank_account_holder | VARCHAR | nullable | |
| transfer_notified_at | TIMESTAMPTZ | nullable | 振込通知送信日時 |
| used_inventory_id | BIGINT | nullable, FK → t_used_inventory.id | 後方互換用 |
| model | VARCHAR | nullable | 後方互換: 1台目のモデル |
| storage | INTEGER | nullable | 後方互換 |
| rank | VARCHAR | nullable | 後方互換 |
| imei | VARCHAR | nullable | 後方互換 |
| battery_percent | INTEGER | nullable | 後方互換 |
| is_service_state | BOOLEAN | nullable | 後方互換 |
| nw_status | VARCHAR | nullable | 後方互換 |
| camera_broken | BOOLEAN | nullable | 後方互換 |
| camera_stain | BOOLEAN | nullable | 後方互換 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### t_buyback_items（買取明細）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| buyback_id | BIGINT | FK → t_buyback.id | |
| item_number | INTEGER | | 端末番号（1始まり） |
| model | VARCHAR | | |
| storage | INTEGER | | |
| rank | VARCHAR | | |
| color | VARCHAR | nullable | |
| color_other | VARCHAR | nullable | |
| imei | VARCHAR | nullable | |
| battery_percent | INTEGER | nullable | |
| is_service_state | BOOLEAN | | |
| nw_status | VARCHAR | | |
| camera_stain | VARCHAR | | |
| camera_broken | BOOLEAN | | |
| repair_history | BOOLEAN | | |
| operation_check | JSONB | nullable | 動作チェック結果 |
| needs_repair | BOOLEAN | | |
| repair_types | JSONB/TEXT | nullable | 修理種別リスト |
| repair_cost | INTEGER | | |
| base_price | INTEGER | | 基本買取価格 |
| total_deduction | INTEGER | | 減額合計 |
| calculated_price | INTEGER | | 計算後価格 |
| guarantee_price | INTEGER | | 最低保証価格 |
| special_price_enabled | BOOLEAN | | 特別価格適用 |
| special_price | INTEGER | nullable | 特別価格 |
| special_price_reason | VARCHAR | nullable | 特別価格理由 |
| final_price | INTEGER | | 最終買取価格 |
| sales_price | INTEGER | | 想定販売価格 |
| expected_profit | INTEGER | | 見込利益 |
| used_inventory_id | BIGINT | FK → t_used_inventory.id | 対応する在庫 |
| memo | TEXT | nullable | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### t_customers（顧客）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| name | VARCHAR | NOT NULL | 氏名 |
| name_kana | VARCHAR | nullable | フリガナ |
| birth_date | DATE | nullable | 生年月日 |
| phone | VARCHAR | NOT NULL | 電話番号 |
| address | TEXT | nullable | 住所 |
| id_type | VARCHAR | nullable | drivers_license/insurance_card/passport/mynumber/residence_card/student_id |
| id_number | VARCHAR | nullable | 本人確認書類番号 |
| is_minor | BOOLEAN | DEFAULT false | 18歳未満 |
| guardian_consent | BOOLEAN | DEFAULT false | |
| guardian_name | VARCHAR | nullable | 保護者氏名 |
| guardian_name_kana | VARCHAR | nullable | |
| guardian_relationship | VARCHAR | nullable | father/mother/guardian |
| guardian_phone | VARCHAR | nullable | |
| guardian_postal_code | VARCHAR | nullable | |
| guardian_address | VARCHAR | nullable | |
| guardian_id_type | VARCHAR | nullable | |
| guardian_id_number | VARCHAR | nullable | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### t_parts_inventory（パーツ在庫）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| shop_id | BIGINT | FK → m_shops.id | |
| model | VARCHAR | NOT NULL | |
| parts_type | VARCHAR | NOT NULL | TH, HG, バッテリー, HGバッテリー, コネクタ 等 |
| supplier_id | BIGINT | FK → m_suppliers.id | |
| required_qty | INTEGER | | 適正在庫数 |
| actual_qty | INTEGER | | 実在庫数 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**ユニーク制約:** tenant_id + shop_id + model + parts_type + supplier_id

### t_accessory_inventory（アクセサリ在庫）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| shop_id | BIGINT | FK → m_shops.id | |
| accessory_id | BIGINT | FK → m_accessories.id | |
| required_qty | INTEGER | | |
| actual_qty | INTEGER | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### t_inventory_checks（棚卸し記録）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| shop_id | BIGINT | FK → m_shops.id | |
| check_date | DATE | | |
| check_type | VARCHAR | | 'parts'/'accessories' |
| status | VARCHAR | | '未実施'/'進行中'/'完了' |
| completed_at | TIMESTAMPTZ | nullable | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### t_daily_reports（日報）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| tenant_id | BIGINT | NOT NULL DEFAULT 1 | |
| shop_id | BIGINT | FK → m_shops.id | |
| report_date | DATE | | |
| status | VARCHAR | nullable | |
| memo | TEXT | nullable | |
| sent_to_chat | BOOLEAN | DEFAULT false | |
| sent_at | TIMESTAMPTZ | nullable | |
| staff_id | BIGINT | nullable, FK → m_staff.id | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### t_mail_buyback_requests（郵送買取申込）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | SERIAL | PK | |
| tenant_id | INTEGER | DEFAULT 1 | |
| request_number | VARCHAR(20) | UNIQUE | MB-YYYY-MMDD-NNN形式 |
| status | VARCHAR(20) | DEFAULT 'pending' | pending/processing/completed/rejected |
| customer_name | VARCHAR(100) | NOT NULL | |
| customer_name_kana | VARCHAR(100) | nullable | |
| postal_code | VARCHAR(7) | nullable | |
| address | TEXT | nullable | |
| address_detail | VARCHAR(200) | nullable | |
| phone | VARCHAR(20) | nullable | |
| email | VARCHAR(200) | nullable | |
| items | JSONB | NOT NULL | 端末情報の配列 |
| total_estimated_price | INTEGER | NOT NULL | |
| item_count | INTEGER | NOT NULL | |
| memo | TEXT | nullable | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### t_auth_login_attempts（ログイン試行記録）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | BIGSERIAL | PK | |
| staff_id | BIGINT | FK → m_staff.id | |
| attempt_timestamp | TIMESTAMPTZ | | |
| success | BOOLEAN | | |
| otp_code | VARCHAR | nullable | OTPコード |
| otp_expires_at | TIMESTAMPTZ | nullable | OTP期限 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## Supabase Storage

### buyback-documents バケット
買取時の本人確認書類・同意書画像を保存。
`/api/upload-document` 経由でアップロード。

---

## Supabase RPC関数

| 関数名 | 用途 |
|--------|------|
| generate_otp(p_staff_id, p_email) | OTPコード生成・保存 |
| verify_otp(p_staff_id, p_otp) | OTPコード検証 |
| log_auth_action(p_staff_id, p_email, p_action, p_status, ...) | 認証操作ログ |
