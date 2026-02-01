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
