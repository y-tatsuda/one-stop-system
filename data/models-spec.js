// 全機種の仕様定義
// このファイルを元にSQLを生成する

// パネルの色区別があるモデル（白/黒パネルが別々に存在）
const MODELS_WITH_COLOR = ['SE', '6s', '7', '7P', '8', '8P']

// HGパネルがないモデル
const MODELS_WITHOUT_HG = ['SE', '6s', '7', '7P']

// HGバッテリーがないモデル（HGパネルがないモデルと同じ + 一部Pro/Max）
const MODELS_WITHOUT_HG_BATTERY = ['SE', '6s', '7', '7P', 'XSMax', '11ProMax', '12ProMax', '13ProMax', '14Plus', '14ProMax', '15Plus', '15ProMax', '16', '16Plus', '16Pro', '16ProMax', '16e']

// インカメラ修理がないモデル
const MODELS_WITHOUT_INCAMERA = ['XS', '14', '14Plus', '14Pro', '14ProMax', '15', '15Plus', '15Pro', '15ProMax', '16', '16Plus', '16Pro', '16ProMax', '16e']

// カメラ窓がないモデル
const MODELS_WITHOUT_CAMERA_WINDOW = ['SE']  // SE初代のみ

// パーツ共有（同じパーツを使用するモデルのグループ）
// ※ただしリアカメラとインカメラは各機種固有
const PARTS_SHARING = {
  // 8とSE2: バッテリー、リアカメラ、インカメラ以外は同じパーツ
  // → パネル（TH/HG）、コネクタ、カメラ窓は共有

  // 12と12Pro: リアカメラ、インカメラ以外は同じパーツ
  // → パネル（TH/HG）、バッテリー、HGバッテリー、コネクタ、カメラ窓は共有
}

// 全機種リスト（sort_order順）
const ALL_MODELS = [
  { model: 'SE', hasColor: true, hasHG: false, hasHGBattery: false, hasCameraWindow: false },
  { model: 'SE2', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true },
  { model: 'SE3', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true },
  { model: '6s', hasColor: true, hasHG: false, hasHGBattery: false, hasCameraWindow: true },
  { model: '7', hasColor: true, hasHG: false, hasHGBattery: false, hasCameraWindow: true },
  { model: '7P', hasColor: true, hasHG: false, hasHGBattery: false, hasCameraWindow: true },
  { model: '8', hasColor: true, hasHG: true, hasHGBattery: true, hasCameraWindow: true },
  { model: '8P', hasColor: true, hasHG: true, hasHGBattery: true, hasCameraWindow: true },
  { model: 'X', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true },
  { model: 'XR', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true },
  { model: 'XS', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true, hasInCamera: false },
  { model: 'XSMax', hasColor: false, hasHG: true, hasHGBattery: false, hasCameraWindow: true },
  { model: '11', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true },
  { model: '11Pro', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true },
  { model: '11ProMax', hasColor: false, hasHG: true, hasHGBattery: false, hasCameraWindow: true },
  { model: '12mini', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true },
  { model: '12', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true },
  { model: '12Pro', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true },
  { model: '12ProMax', hasColor: false, hasHG: true, hasHGBattery: false, hasCameraWindow: true },
  { model: '13mini', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true },
  { model: '13', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true },
  { model: '13Pro', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true },
  { model: '13ProMax', hasColor: false, hasHG: true, hasHGBattery: false, hasCameraWindow: true },
  { model: '14', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true, hasInCamera: false },
  { model: '14Plus', hasColor: false, hasHG: true, hasHGBattery: false, hasCameraWindow: true, hasInCamera: false },
  { model: '14Pro', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true, hasInCamera: false },
  { model: '14ProMax', hasColor: false, hasHG: true, hasHGBattery: false, hasCameraWindow: true, hasInCamera: false },
  { model: '15', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true, hasInCamera: false },
  { model: '15Plus', hasColor: false, hasHG: true, hasHGBattery: false, hasCameraWindow: true, hasInCamera: false },
  { model: '15Pro', hasColor: false, hasHG: true, hasHGBattery: true, hasCameraWindow: true, hasInCamera: false },
  { model: '15ProMax', hasColor: false, hasHG: true, hasHGBattery: false, hasCameraWindow: true, hasInCamera: false },
  { model: '16', hasColor: false, hasHG: true, hasHGBattery: false, hasCameraWindow: true, hasInCamera: false },
  { model: '16Plus', hasColor: false, hasHG: true, hasHGBattery: false, hasCameraWindow: true, hasInCamera: false },
  { model: '16Pro', hasColor: false, hasHG: true, hasHGBattery: false, hasCameraWindow: true, hasInCamera: false },
  { model: '16ProMax', hasColor: false, hasHG: true, hasHGBattery: false, hasCameraWindow: true, hasInCamera: false },
  { model: '16e', hasColor: false, hasHG: true, hasHGBattery: false, hasCameraWindow: true, hasInCamera: false },
]

module.exports = {
  MODELS_WITH_COLOR,
  MODELS_WITHOUT_HG,
  MODELS_WITHOUT_HG_BATTERY,
  MODELS_WITHOUT_INCAMERA,
  MODELS_WITHOUT_CAMERA_WINDOW,
  PARTS_SHARING,
  ALL_MODELS
}
