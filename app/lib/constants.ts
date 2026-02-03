// アプリケーション定数

// デフォルトテナントID
// TODO: マルチテナント対応時は、認証コンテキストから動的に取得するよう変更
export const DEFAULT_TENANT_ID = 1

// トークン有効期限（ミリ秒）
export const TOKEN_EXPIRY_MS = 12 * 60 * 60 * 1000 // 12時間

// パーツ共通グループ（在庫を合算して表示）
export const PARTS_MODEL_GROUPS: { [groupName: string]: { models: string[], sharedParts: string[] } } = {
  '8/SE2': {
    models: ['8', 'SE2'],
    sharedParts: ['TH', 'HG', 'コネクタ']
  },
  '12/12Pro': {
    models: ['12', '12Pro'],
    sharedParts: ['TH', 'HG', 'バッテリー', 'HGバッテリー', 'コネクタ']
  }
}

// デフォルト非表示モデル
export const DEFAULT_HIDDEN_MODELS = ['SE', '6s', '7', '7P', '8P']

// デフォルト非表示パーツ
export const DEFAULT_HIDDEN_PARTS = ['カメラ窓', 'リアカメラ', 'インカメラ']

// =====================================================
// 修理関連の定数
// =====================================================

// 色の区別があるモデル（白パネルがあるモデル）
export const MODELS_WITH_COLOR = ['SE', '6s', '7', '7P', '8', '8P']

// 修理種別の定義
export type RepairType = {
  key: string
  label: string
  partsType: string
  exclusive?: string      // 排他的な修理種別（例：TH-LとTH-Fは同時選択不可）
  onlyWithColor?: boolean // 色モデル限定
}

/**
 * モデルに応じた修理種別リストを取得
 * @param model iPhoneモデル（例：'13Pro', '8'）
 * @returns 利用可能な修理種別リスト
 */
export function getRepairTypes(model?: string): RepairType[] {
  const hasColor = model ? MODELS_WITH_COLOR.includes(model) : false

  return [
    { key: 'TH-L', label: hasColor ? '標準パネル(黒)' : '標準パネル', partsType: 'TH-L', exclusive: 'TH-F' },
    { key: 'TH-F', label: '標準パネル(白)', partsType: 'TH-F', exclusive: 'TH-L', onlyWithColor: true },
    { key: 'HG-L', label: hasColor ? 'HGパネル(黒)' : 'HGパネル', partsType: 'HG-L', exclusive: 'HG-F' },
    { key: 'HG-F', label: 'HGパネル(白)', partsType: 'HG-F', exclusive: 'HG-L', onlyWithColor: true },
    { key: 'battery', label: '標準バッテリー', partsType: 'バッテリー' },
    { key: 'hg_battery', label: 'HGバッテリー', partsType: 'HGバッテリー' },
    { key: 'connector', label: 'コネクタ', partsType: 'コネクタ' },
    { key: 'rear_camera', label: 'リアカメラ', partsType: 'リアカメラ' },
    { key: 'front_camera', label: 'インカメラ', partsType: 'インカメラ' },
    { key: 'camera_glass', label: 'カメラ窓', partsType: 'カメラ窓' },
  ].filter(item => !item.onlyWithColor || hasColor)
}
