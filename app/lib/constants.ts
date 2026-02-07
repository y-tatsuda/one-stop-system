// アプリケーション定数

// デフォルトテナントID
// TODO: マルチテナント対応時は、認証コンテキストから動的に取得するよう変更
export const DEFAULT_TENANT_ID = 1

// =====================================================
// iPhone本体カラー定義
// =====================================================
//
// 【カラーコード一覧】
// ─────────────────────────────────────────────────────
// 基本カラー（多くのモデルで使用）:
//   BK  = ブラック系（ブラック/グラファイト/スペースグレイ/ミッドナイト/スペースブラック/ブラックチタニウム）
//   WH  = ホワイト系（ホワイト/シルバー/スターライト/クラウドホワイト）
//   GD  = ゴールド（ゴールド/ライトゴールド）
//   RD  = レッド（(PRODUCT)RED）
//
// ブルー系（注意：チタニウムは別コード）:
//   BL  = ブルー系（ブルー/パシフィックブルー/シエラブルー/ウルトラマリン/ディープブルー/スカイブルー）
//   BT  = ブルーチタニウム ※iPhone 15 Pro専用、BLとは別
//
// その他カラー:
//   OR  = オレンジ（コズミックオレンジ）※iPhone 17 Pro専用
//   YL  = イエロー
//   GR  = グリーン系（グリーン/アルパイングリーン/ミントグリーン/ティール）
//   PK  = ピンク ※iPhone 7はローズゴールドとして表示
//   PP  = パープル系（パープル/ディープパープル/ラベンダー）※17はラベンダー
//   CR  = コーラル ※iPhone XR専用
//   JBK = ジェットブラック ※iPhone 7専用
//
// チタニウム系（iPhone 15 Pro〜16 Pro）:
//   NT  = ナチュラルチタニウム（15 Pro, 16 Pro）
//   WT  = ホワイトチタニウム（15 Pro, 16 Pro）
//   BT  = ブルーチタニウム（15 Pro のみ）
//   DT  = デザートチタニウム（16 Pro のみ）
//   ※ブラックチタニウムはBKに統合（サムネ共通化のため）
//   ※17 Proはアルミボディのためチタニウム系なし
//
// 【サムネイル命名規則】
//   {モデルコード}_{カラーコード}.webp
//   例: 15P_NT.webp, 12_BK.webp
//   詳細: /public/shop/products/thumbnails/README.txt 参照
//
// ─────────────────────────────────────────────────────

export type IphoneColor = {
  code: string      // ファイル名用コード（BK, WH等）
  label: string     // 表示名（プルダウン用）
  variants: string[] // 含まれる正式カラー名
}

export const IPHONE_COLORS: IphoneColor[] = [
  // 基本カラー
  { code: 'BK', label: 'ブラック系', variants: ['ブラック', 'グラファイト', 'スペースグレイ', 'ミッドナイト', 'スペースブラック'] },
  { code: 'WH', label: 'ホワイト系', variants: ['ホワイト', 'シルバー', 'スターライト', 'クラウドホワイト'] },
  { code: 'GD', label: 'ゴールド', variants: ['ゴールド', 'ライトゴールド'] },
  { code: 'RD', label: 'レッド', variants: ['(PRODUCT)RED', 'レッド'] },
  // ブルー系
  { code: 'BL', label: 'ブルー系', variants: ['ブルー', 'パシフィックブルー', 'シエラブルー', 'ディープブルー', 'スカイブルー'] },  // 17Pディープブルー、Airスカイブルー含む
  { code: 'BT', label: 'ブルーチタニウム', variants: ['ブルーチタニウム'] },  // 15 Pro専用、BLとは別
  // その他カラー
  { code: 'OR', label: 'オレンジ', variants: ['コズミックオレンジ'] },  // 17 Pro専用
  { code: 'YL', label: 'イエロー', variants: ['イエロー'] },
  { code: 'GR', label: 'グリーン系', variants: ['グリーン', 'アルパイングリーン', 'ミントグリーン'] },
  { code: 'PK', label: 'ピンク', variants: ['ピンク'] },  // 7はローズゴールド
  { code: 'PP', label: 'パープル系', variants: ['パープル', 'ディープパープル', 'ラベンダー'] },  // 17はラベンダー
  { code: 'CR', label: 'コーラル', variants: ['コーラル'] },  // XR専用
  { code: 'JBK', label: 'ジェットブラック', variants: ['ジェットブラック'] },  // 7専用
  // チタニウム系（15 Pro以降）
  { code: 'NT', label: 'ナチュラルチタニウム', variants: ['ナチュラルチタニウム'] },  // 15P, 16P
  { code: 'WT', label: 'ホワイトチタニウム', variants: ['ホワイトチタニウム'] },  // 15P, 16P
  { code: 'DT', label: 'デザートチタニウム', variants: ['デザートチタニウム'] },  // 16P専用
]

// カラーコードからカラー情報を取得
export function getColorByCode(code: string): IphoneColor | undefined {
  return IPHONE_COLORS.find(c => c.code === code)
}

// =====================================================
// モデル×カラーコード → 正式カラー名のマッピング
// =====================================================
// ECサイトの商品詳細ページで正式名称を表示するために使用
// getOfficialColorName(model, colorCode) で取得
//
// 【注意点】
// - BKはブラック系だが、Proモデルでは「ブラックチタニウム」「グラファイト」等に変換
// - PKはピンクだが、iPhone 7では「ローズゴールド」に変換
// - モデルコードはgetModelThumbnailPrefix()の戻り値に対応（16P, 15, XR等）
//
// 参考: https://www.kashi-mo.com/media/36610/, Apple公式
// ─────────────────────────────────────────────────────
const OFFICIAL_COLOR_NAMES: { [modelPrefix: string]: { [colorCode: string]: string } } = {
  // iPhone 17 Pro系（アルミボディ）
  '17P': {
    'OR': 'コズミックオレンジ',
    'BL': 'ディープブルー',
    'WH': 'シルバー',
  },
  // iPhone 17 無印系
  '17': {
    'BK': 'ブラック',
    'WH': 'ホワイト',
    'BL': 'ブルー',
    'PK': 'ピンク',
    'PP': 'ラベンダー',
  },
  // iPhone Air
  'Air': {
    'BL': 'スカイブルー',
    'GD': 'ライトゴールド',
    'WH': 'クラウドホワイト',
    'BK': 'スペースブラック',
  },
  // iPhone 16e（2色のみ）
  '16e': {
    'BK': 'ブラック',
    'WH': 'ホワイト',
  },
  // iPhone 16 Pro系
  '16P': {
    'BK': 'ブラックチタニウム',
    'WT': 'ホワイトチタニウム',
    'NT': 'ナチュラルチタニウム',
    'DT': 'デザートチタニウム',
  },
  // iPhone 16 無印系
  '16': {
    'BK': 'ブラック',
    'WH': 'ホワイト',
    'BL': 'ウルトラマリン',
    'PK': 'ピンク',
    'GR': 'ティール',
  },
  // iPhone 15 Pro系
  '15P': {
    'BK': 'ブラックチタニウム',
    'WT': 'ホワイトチタニウム',
    'NT': 'ナチュラルチタニウム',
    'BT': 'ブルーチタニウム',
  },
  // iPhone 15 無印系
  '15': {
    'BK': 'ブラック',
    'PK': 'ピンク',
    'GR': 'グリーン',
    'YL': 'イエロー',
    'BL': 'ブルー',
  },
  // iPhone 14 Pro系
  '14P': {
    'BK': 'スペースブラック',
    'WH': 'シルバー',
    'GD': 'ゴールド',
    'PP': 'ディープパープル',
  },
  // iPhone 14 無印系
  '14': {
    'BK': 'ミッドナイト',
    'WH': 'スターライト',
    'RD': '(PRODUCT)RED',
    'BL': 'ブルー',
    'PP': 'パープル',
    'YL': 'イエロー',
  },
  // iPhone 13 Pro系
  '13P': {
    'BK': 'グラファイト',
    'WH': 'シルバー',
    'GD': 'ゴールド',
    'BL': 'シエラブルー',
    'GR': 'アルパイングリーン',
  },
  // iPhone 13 無印系
  '13': {
    'BK': 'ミッドナイト',
    'WH': 'スターライト',
    'RD': '(PRODUCT)RED',
    'BL': 'ブルー',
    'PK': 'ピンク',
    'GR': 'グリーン',
  },
  // iPhone 12 Pro系
  '12P': {
    'BK': 'グラファイト',
    'WH': 'シルバー',
    'GD': 'ゴールド',
    'BL': 'パシフィックブルー',
  },
  // iPhone 12 無印系
  '12': {
    'BK': 'ブラック',
    'WH': 'ホワイト',
    'RD': '(PRODUCT)RED',
    'GR': 'グリーン',
    'BL': 'ブルー',
    'PP': 'パープル',
  },
  // iPhone 11 Pro系
  '11P': {
    'BK': 'スペースグレイ',
    'WH': 'シルバー',
    'GD': 'ゴールド',
    'GR': 'ミッドナイトグリーン',
  },
  // iPhone 11 無印
  '11': {
    'BK': 'ブラック',
    'WH': 'ホワイト',
    'YL': 'イエロー',
    'RD': '(PRODUCT)RED',
    'PP': 'パープル',
    'GR': 'グリーン',
  },
  // iPhone XS系
  'XS': {
    'BK': 'スペースグレイ',
    'WH': 'シルバー',
    'GD': 'ゴールド',
  },
  // iPhone XR
  'XR': {
    'BK': 'ブラック',
    'WH': 'ホワイト',
    'BL': 'ブルー',
    'YL': 'イエロー',
    'CR': 'コーラル',
    'RD': '(PRODUCT)RED',
  },
  // iPhone X
  'X': {
    'BK': 'スペースグレイ',
    'WH': 'シルバー',
  },
  // iPhone 8系
  '8': {
    'BK': 'スペースグレイ',
    'WH': 'シルバー',
    'GD': 'ゴールド',
    'RD': '(PRODUCT)RED',
  },
  // iPhone 7系
  '7': {
    'BK': 'ブラック',
    'JBK': 'ジェットブラック',
    'WH': 'シルバー',
    'GD': 'ゴールド',
    'PK': 'ローズゴールド',
    'RD': '(PRODUCT)RED',
  },
  // iPhone SE (2/3世代共通)
  'SE': {
    'BK': 'ミッドナイト',
    'WH': 'スターライト',
    'RD': '(PRODUCT)RED',
  },
  // iPhone SE 初代
  'SE1': {
    'BK': 'スペースグレイ',
    'WH': 'シルバー',
    'GD': 'ゴールド',
    'PK': 'ローズゴールド',
  },
}

/**
 * モデルとカラーコードから正式カラー名を取得
 * @param model iPhoneモデル (例: 'iphone15pro')
 * @param colorCode カラーコード (例: 'BK')
 * @returns 正式カラー名 (例: 'ブラックチタニウム')
 */
export function getOfficialColorName(model: string, colorCode: string): string {
  const prefix = getModelThumbnailPrefix(model)
  const modelColors = OFFICIAL_COLOR_NAMES[prefix]

  if (modelColors && modelColors[colorCode]) {
    return modelColors[colorCode]
  }

  // マッピングにない場合はカラーコードの基本名を返す
  const colorInfo = getColorByCode(colorCode)
  return colorInfo ? colorInfo.variants[0] : colorCode
}

// カラー選択用のオプションを生成（プルダウン用）
export function getColorOptions(): { value: string, label: string }[] {
  return IPHONE_COLORS.map(c => ({
    value: c.code,
    label: `${c.code}（${c.variants.join('/')}）`
  }))
}

// モデル別のカラー選択オプションを生成（プルダウン用）
// 指定されたモデルで利用可能なカラーのみを返す
export function getColorOptionsForModel(model: string): { value: string, label: string }[] {
  const prefix = getModelThumbnailPrefix(model)
  const modelColors = OFFICIAL_COLOR_NAMES[prefix]

  if (!modelColors) {
    // マッピングにないモデルは全カラーを返す
    return getColorOptions()
  }

  // モデルに対応するカラーのみを返す
  return Object.entries(modelColors).map(([code, name]) => ({
    value: code,
    label: `${name}（${code}）`
  }))
}

// =====================================================
// モデルコード → サムネイルプレフィックス変換
// =====================================================
// サムネイル画像ファイル名の先頭部分を取得
// 同じ色展開のモデルは統合してサムネを共通化
//
// 【統合ルール】
// - Pro Max → Pro と同じ（17PM → 17P）
// - Plus → 無印 と同じ（17Plus → 17）
// - mini → 無印 と同じ（13mini → 13）
// - SE2/SE3 → SE で共通
// - SE初代 → SE1
// - iPhone Air → Air
// - iPhone 16e → 16e（廉価版、2色のみ）
//
// 【使用例】
// getModelThumbnailPrefix('iphone17promax') → '17P'
// getModelThumbnailPrefix('iphoneair') → 'Air'
// サムネURL: `/shop/products/thumbnails/${prefix}_${colorCode}.webp`
// ─────────────────────────────────────────────────────
export function getModelThumbnailPrefix(model: string): string {
  const mapping: { [key: string]: string } = {
    // =====================================================
    // データベース形式（11Pro, SE2, 12mini等）
    // =====================================================
    // iPhone 17シリーズ
    '17promax': '17P', '17pro': '17P', '17plus': '17', '17': '17',
    // iPhone Air
    'air': 'Air',
    // iPhone 16シリーズ
    '16e': '16e',
    '16promax': '16P', '16pro': '16P', '16plus': '16', '16': '16',
    // iPhone 15シリーズ
    '15promax': '15P', '15pro': '15P', '15plus': '15', '15': '15',
    // iPhone 14シリーズ
    '14promax': '14P', '14pro': '14P', '14plus': '14', '14': '14',
    // iPhone 13シリーズ
    '13promax': '13P', '13pro': '13P', '13mini': '13', '13': '13',
    // iPhone 12シリーズ
    '12promax': '12P', '12pro': '12P', '12mini': '12', '12': '12',
    // iPhone 11シリーズ
    '11promax': '11P', '11pro': '11P', '11': '11',
    // iPhone X系
    'xsmax': 'XS', 'xs': 'XS', 'xr': 'XR', 'x': 'X',
    // iPhone SE
    'se3': 'SE', 'se2': 'SE', 'se': 'SE1',
    // 旧モデル
    '8plus': '8', '8p': '8', '8': '8',
    '7plus': '7', '7p': '7', '7': '7',

    // =====================================================
    // フルネーム形式（iphone15pro等）※互換性維持
    // =====================================================
    'iphone17promax': '17P', 'iphone17pro': '17P', 'iphone17plus': '17', 'iphone17': '17',
    'iphoneair': 'Air',
    'iphone16e': '16e',
    'iphone16promax': '16P', 'iphone16pro': '16P', 'iphone16plus': '16', 'iphone16': '16',
    'iphone15promax': '15P', 'iphone15pro': '15P', 'iphone15plus': '15', 'iphone15': '15',
    'iphone14promax': '14P', 'iphone14pro': '14P', 'iphone14plus': '14', 'iphone14': '14',
    'iphone13promax': '13P', 'iphone13pro': '13P', 'iphone13mini': '13', 'iphone13': '13',
    'iphone12promax': '12P', 'iphone12pro': '12P', 'iphone12mini': '12', 'iphone12': '12',
    'iphone11promax': '11P', 'iphone11pro': '11P', 'iphone11': '11',
    'iphonexsmax': 'XS', 'iphonexs': 'XS', 'iphonexr': 'XR', 'iphonex': 'X',
    'iphonese3': 'SE', 'iphonese2': 'SE', 'iphonese': 'SE1',
    'iphone8plus': '8', 'iphone8': '8',
    'iphone7plus': '7', 'iphone7': '7',
  }
  return mapping[model.toLowerCase()] || model
}

// =====================================================
// モデル名 → PNG ファイル名変換（カラー未選択時用）
// =====================================================
// PNGファイル名はwebpと命名規則が異なるため別マッピング
// 例: 11Pro → 11.png, 12Pro → 12P.png
export function getModelPngFileName(model: string): string {
  const mapping: { [key: string]: string } = {
    // iPhone 17シリーズ
    '17promax': '17P', '17pro': '17P', '17plus': '17', '17': '17',
    // iPhone Air
    'air': 'Air', 'ipair': 'Air',
    // iPhone 16シリーズ
    '16e': '16e',
    '16promax': '16P', '16pro': '16P', '16plus': '16', '16': '16',
    // iPhone 15シリーズ
    '15promax': '15P', '15pro': '15P', '15plus': '15', '15': '15',
    // iPhone 14シリーズ
    '14promax': '14P', '14pro': '14P', '14plus': '14', '14': '14',
    // iPhone 13シリーズ
    '13promax': '13P', '13pro': '13P', '13mini': '13', '13': '13',
    // iPhone 12シリーズ
    '12promax': '12P', '12pro': '12P', '12mini': '12', '12': '12',
    // iPhone 11シリーズ（11Proは11.pngを使用）
    '11promax': '11_pro_max', '11pro': '11', '11': '11',
    // iPhone X系
    'xsmax': 'xs', 'xs': 'xs', 'xr': 'xr', 'x': 'x',
    // iPhone SE
    'se3': 'se3', 'se2': 'se2', 'se': 'se2',
    // 旧モデル
    '8plus': '8', '8p': '8', '8': '8',
    '7plus': '7', '7p': '7', '7': '7',
    '6s': '7',  // 6sはPNGなし、7で代用
  }
  return mapping[model.toLowerCase()] || model.toLowerCase()
}

// =====================================================
// 表示名 → モデルコード変換（ECサイト用）
// =====================================================
// ECサイトのフォームで使う表示名からモデルコードへの変換
// 例: "iPhone 15 Pro Max" → "15PM"
export function displayNameToModelCode(displayName: string): string {
  const mapping: { [key: string]: string } = {
    // iPhone 17系
    'iPhone 17 Pro Max': '17PM', 'iPhone 17 Pro': '17P', 'iPhone 17 Plus': '17Plus', 'iPhone 17': '17',
    // iPhone Air
    'iPhone Air': 'Air',
    // iPhone 16系
    'iPhone 16e': '16e',
    'iPhone 16 Pro Max': '16PM', 'iPhone 16 Pro': '16P', 'iPhone 16 Plus': '16Plus', 'iPhone 16': '16',
    // iPhone 15系
    'iPhone 15 Pro Max': '15PM', 'iPhone 15 Pro': '15P', 'iPhone 15 Plus': '15Plus', 'iPhone 15': '15',
    // iPhone 14系
    'iPhone 14 Pro Max': '14PM', 'iPhone 14 Pro': '14P', 'iPhone 14 Plus': '14Plus', 'iPhone 14': '14',
    // iPhone 13系
    'iPhone 13 Pro Max': '13PM', 'iPhone 13 Pro': '13P', 'iPhone 13 mini': '13mini', 'iPhone 13': '13',
    // iPhone 12系
    'iPhone 12 Pro Max': '12PM', 'iPhone 12 Pro': '12P', 'iPhone 12 mini': '12mini', 'iPhone 12': '12',
    // iPhone 11系
    'iPhone 11 Pro Max': '11PM', 'iPhone 11 Pro': '11P', 'iPhone 11': '11',
    // iPhone X系
    'iPhone XS Max': 'XSMax', 'iPhone XS': 'XS', 'iPhone XR': 'XR', 'iPhone X': 'X',
    // iPhone SE
    'iPhone SE (第3世代)': 'SE3', 'iPhone SE (第2世代)': 'SE2', 'iPhone SE': 'SE',
    // 旧モデル
    'iPhone 8 Plus': '8P', 'iPhone 8': '8',
    'iPhone 7 Plus': '7P', 'iPhone 7': '7',
  }
  return mapping[displayName] || displayName
}

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
export const DEFAULT_HIDDEN_PARTS = ['リアカメラ', 'インカメラ', 'コネクタ']

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
  ].filter(item => !item.onlyWithColor || hasColor)
}
