/**
 * 共通型定義
 * 複数のページで使用される型を一元管理
 */

// =====================================================
// マスタデータの型
// =====================================================

/** 店舗 */
export type Shop = {
  id: number
  name: string
  square_location_id?: string | null
  is_ec?: boolean
}

/** スタッフ */
export type Staff = {
  id: number
  name: string
}

/** iPhoneモデル */
export type IphoneModel = {
  model: string
  display_name: string
}

/** 来店経路 */
export type VisitSource = {
  id: number
  name: string
}

/** 仕入先 */
export type Supplier = {
  id: number
  code: string
  name: string
}

// =====================================================
// 在庫関連の型
// =====================================================

/** 中古在庫（基本） */
export type UsedInventoryBase = {
  id: number
  model: string
  storage: number
  rank: string
  sales_price: number | null
  total_cost: number
  management_number: string | null
}

/** 中古在庫（詳細） */
export type UsedInventory = UsedInventoryBase & {
  arrival_date: string
  imei: string | null
  battery_percent: number | null
  is_service_state: boolean | null
  nw_status: string | null
  camera_stain_level: string | null
  camera_broken: boolean | null
  repair_history: boolean | null
  repair_types: string | null
  buyback_price: number
  repair_cost: number
  status: string
  ec_status: string | null
  memo: string | null
  shop_id: number
  shop: { name: string }
  sale_date?: string | null
  color: string | null  // iPhone本体色コード（BK/WH/GD等）
}

// =====================================================
// アクセサリ関連の型
// =====================================================

/** アクセサリ */
export type Accessory = {
  id: number
  name: string
  variation: string | null
  price: number
  cost: number
  category_id: number
  category_name: string
}

// =====================================================
// 修理価格関連の型
// =====================================================

/** 修理価格（iPad/Android共通） */
export type RepairPrice = {
  model: string
  repair_type: string
  price: number
  cost: number
}

/** パーツ原価 */
export type PartsCost = {
  model: string
  parts_type: string
  cost?: number
}
