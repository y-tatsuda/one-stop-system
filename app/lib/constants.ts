// アプリケーション定数

// デフォルトテナントID
// TODO: マルチテナント対応時は、認証コンテキストから動的に取得するよう変更
export const DEFAULT_TENANT_ID = 1

// トークン有効期限（ミリ秒）
export const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24時間
