// ================================================
// 修理価格データのSQL生成スクリプト
// 実行: node data/sql/generate-repair-prices-sql.js
// ================================================

const fs = require('fs');
const path = require('path');

// 修理価格データ
const REPAIR_PRICES_IPHONE = require('../repair-prices-iphone.js');

// 白パネル(TH-F, HG-F)があるモデル（SE初代, 6s〜8）
const MODELS_WITH_WHITE_PANEL = ['SE', '6s', '7', '7P', '8', '8P'];

// HGパネルがないモデル（SE初代, 6s, 7, 7P）
const MODELS_WITHOUT_HG = ['SE', '6s', '7', '7P'];

// 修理種別の並び順
const REPAIR_TYPE_ORDER = [
  'TH-F',      // 標準パネル(白)
  'TH-L',      // 標準パネル(黒)
  'HG-F',      // 有機EL(白)
  'HG-L',      // 有機EL(黒)
  'バッテリー',
  'HGバッテリー',
  'コネクタ',
  'リアカメラ',
  'インカメラ',
  'カメラ窓'
];

// モデルごとに利用可能な修理種別を取得
function getAvailableRepairTypes(model) {
  const hasWhitePanel = MODELS_WITH_WHITE_PANEL.includes(model);
  const hasHG = !MODELS_WITHOUT_HG.includes(model);

  const types = [];

  // 標準パネル
  if (hasWhitePanel) {
    types.push('TH-F');  // 白
  }
  types.push('TH-L');    // 黒（全モデル共通）

  // HGパネル
  if (hasHG) {
    if (hasWhitePanel) {
      types.push('HG-F');  // 白
    }
    types.push('HG-L');    // 黒
  }

  // バッテリー
  types.push('バッテリー');
  if (hasHG) {
    types.push('HGバッテリー');
  }

  // その他のパーツ
  types.push('コネクタ', 'リアカメラ', 'インカメラ', 'カメラ窓');

  return types;
}

function generateSQL() {
  let sql = `-- ================================================
-- 修理価格データ投入
-- 生成日時: ${new Date().toISOString()}
--
-- 白パネル(TH-F)対応: SE, 6s, 7, 7P, 8, 8P
-- HGパネル対応: 8以降（SE, 6s, 7, 7Pは非対応）
-- ================================================

-- 既存データを削除
DELETE FROM m_repair_prices_iphone WHERE tenant_id = 1;

-- 修理価格データ
`;

  for (const [model, prices] of Object.entries(REPAIR_PRICES_IPHONE)) {
    const availableTypes = getAvailableRepairTypes(model);

    for (const repairType of REPAIR_TYPE_ORDER) {
      // このモデルで利用可能な修理種別のみ
      if (!availableTypes.includes(repairType)) continue;

      const price = prices[repairType] || 0;
      if (price > 0) {
        sql += `INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '${model}', '${repairType}', ${price}, true);\n`;
      }
    }
  }

  return sql;
}

const sql = generateSQL();
fs.writeFileSync(path.join(__dirname, '04_insert_repair_prices.sql'), sql);
console.log('SQLファイルを生成しました: data/sql/04_insert_repair_prices.sql');
