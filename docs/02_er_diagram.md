# ER図（テーブル関連図）

## 外部キー・リレーション一覧

```
┌─────────────────────────────────────────────────────────────────────┐
│                        マスタテーブル群                               │
│                                                                     │
│  m_shops ◄──── m_staff_shops ────► m_staff                         │
│    │                                  │                             │
│    │  m_iphone_models    m_suppliers  │  m_visit_sources            │
│    │  m_accessory_categories          │                             │
│    │    └── m_accessories             │                             │
│    │                                  │                             │
│    │  m_repair_prices_iphone          │                             │
│    │  m_repair_prices_ipad            │                             │
│    │  m_repair_prices_android         │                             │
│    │  m_costs_hw ── m_suppliers       │                             │
│    │                                  │                             │
│    │  m_buyback_prices                │                             │
│    │  m_buyback_guarantees            │                             │
│    │  m_buyback_deductions            │                             │
│    │  m_sales_prices                  │                             │
│    │  m_sales_price_deductions (非推奨)│                             │
│    │                                  │                             │
│    │  m_system_settings               │                             │
│    │  m_sales_targets ── m_shops      │                             │
│    │  m_holidays ── m_shops           │                             │
│    │  m_inventory_check_settings      │                             │
│    │  m_square_catalog_mapping        │                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     トランザクションテーブル群                        │
│                                                                     │
│  t_sales ◄──────────── t_sales_details                             │
│    │ shop_id→m_shops       │ accessory_id→m_accessories            │
│    │ staff_id→m_staff      │ used_inventory_id→t_used_inventory    │
│    │ visit_source_id       │ supplier_id→m_suppliers               │
│    │                       │ sale_id→t_sales                       │
│    │                                                                │
│  t_buyback ◄──────────── t_buyback_items                           │
│    │ customer_id→t_customers   │ buyback_id→t_buyback              │
│    │ shop_id→m_shops           │ used_inventory_id→t_used_inventory│
│    │ staff_id→m_staff                                              │
│    │ used_inventory_id→t_used_inventory                            │
│    │                                                                │
│  t_used_inventory                                                   │
│    │ shop_id→m_shops                                               │
│    │ buyback_id→t_buyback                                          │
│    │                                                                │
│  t_customers（t_buyback.customer_idから参照）                       │
│                                                                     │
│  t_parts_inventory                                                  │
│    │ shop_id→m_shops                                               │
│    │ supplier_id→m_suppliers                                       │
│                                                                     │
│  t_accessory_inventory                                              │
│    │ shop_id→m_shops                                               │
│    │ accessory_id→m_accessories                                    │
│                                                                     │
│  t_inventory_checks                                                 │
│    │ shop_id→m_shops                                               │
│                                                                     │
│  t_daily_reports                                                    │
│    │ shop_id→m_shops                                               │
│    │ staff_id→m_staff                                              │
│                                                                     │
│  t_mail_buyback_requests（独立、FK無し）                             │
│  t_auth_login_attempts                                              │
│    │ staff_id→m_staff                                              │
└─────────────────────────────────────────────────────────────────────┘
```

## 主要なデータフロー

### 売上登録フロー
```
m_shops + m_staff → t_sales（ヘッダー）
  → t_sales_details（明細）
    → t_used_inventory.status = '販売済'（中古販売時）
    → t_parts_inventory.actual_qty -= 1（パーツ使用時）
```

### 買取登録フロー
```
顧客入力 → t_customers（顧客情報保存）
  → t_buyback（買取ヘッダー、顧客情報を非正規化コピー）
    → t_buyback_items（端末ごとの明細）
      → t_used_inventory（在庫登録、status='修理中'or'販売可'）
        → t_buyback.used_inventory_id 更新
```

### 修理完了フロー
```
t_used_inventory.status = '修理中' → '販売可'
  → t_parts_inventory.actual_qty -= 1（使用パーツ分）
```
