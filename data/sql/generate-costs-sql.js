// ================================================
// パーツ原価データのSQL生成スクリプト
// 実行: node data/sql/generate-costs-sql.js
// ================================================

const fs = require('fs');
const path = require('path');

// HW原価データ
const REPAIR_COSTS_HW = require('../costs-hw.js');

// アイサポ原価データ
const REPAIR_COSTS_AISAPO = require('../costs-aisapo.js');

// 白パネル(TH-F, HG-F)があるモデル（SE初代, 6s〜8）
const MODELS_WITH_WHITE_PANEL = ['SE', '6s', '7', '7P', '8', '8P'];

// HGパネルがないモデル（SE初代, 6s, 7, 7P）
const MODELS_WITHOUT_HG = ['SE', '6s', '7', '7P'];

// パーツ種別の並び順
const PARTS_TYPE_ORDER = [
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

// モデルごとに利用可能なパーツ種別を取得
function getAvailablePartsTypes(model) {
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
-- パーツ原価データ投入
-- 生成日時: ${new Date().toISOString()}
--
-- 白パネル(TH-F)対応: SE, 6s, 7, 7P, 8, 8P
-- HGパネル対応: 8以降（SE, 6s, 7, 7Pは非対応）
-- ================================================

-- 既存データを削除
DELETE FROM m_costs_hw WHERE tenant_id = 1;

-- HW原価データ
`;

  // HWデータ
  for (const [model, parts] of Object.entries(REPAIR_COSTS_HW)) {
    const availableTypes = getAvailablePartsTypes(model);

    for (const partsType of PARTS_TYPE_ORDER) {
      if (!availableTypes.includes(partsType)) continue;

      const cost = parts[partsType] || 0;
      if (cost > 0) {
        sql += `INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '${model}', '${partsType}', ${cost}, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));\n`;
      }
    }
  }

  sql += `\n-- アイサポ原価データ\n`;

  // アイサポデータ
  for (const [model, parts] of Object.entries(REPAIR_COSTS_AISAPO)) {
    const availableTypes = getAvailablePartsTypes(model);

    for (const partsType of PARTS_TYPE_ORDER) {
      if (!availableTypes.includes(partsType)) continue;

      const cost = parts[partsType] || 0;
      if (cost > 0) {
        sql += `INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '${model}', '${partsType}', ${cost}, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));\n`;
      }
    }
  }

  return sql;
}

const sql = generateSQL();
fs.writeFileSync(path.join(__dirname, '03_insert_costs.sql'), sql);
console.log('SQLファイルを生成しました: data/sql/03_insert_costs.sql');
