// ================================================
// パーツ原価データのSQL生成スクリプト
// 実行: node data/sql/generate-costs-sql.js
// ================================================
//
// TH = 標準パネル, HG = ハイグレードパネル
// パーツは色別に管理（該当機種のみ）
// F/L（軽度/重度）は修理種別であり、パーツは同じ
// ================================================

const fs = require('fs');
const path = require('path');

// HW原価データ
const REPAIR_COSTS_HW = require('../costs-hw.js');

// アイサポ原価データ
const REPAIR_COSTS_AISAPO = require('../costs-aisapo.js');

// 色の区別があるモデル（白/黒パネルが別々に存在）
const MODELS_WITH_COLOR = ['SE', '6s', '7', '7P', '8', '8P'];

// HGパネルがないモデル（SE初代, 6s, 7, 7P）
const MODELS_WITHOUT_HG = ['SE', '6s', '7', '7P'];

// パーツ種別の出力順序（THパネル→HGパネル→バッテリー...の順、黒が先）
const PARTS_TYPE_ORDER = [
  'TH', 'TH-黒', 'TH-白',
  'HG', 'HG-黒', 'HG-白',
  'バッテリー', 'HGバッテリー',
  'コネクタ', 'リアカメラ', 'インカメラ', 'カメラ窓'
];

// モデルごとに利用可能なパーツ種別を取得
function getAvailablePartsTypes(model) {
  const hasColor = MODELS_WITH_COLOR.includes(model);
  const hasHG = !MODELS_WITHOUT_HG.includes(model);

  const types = [];

  // 標準パネル
  if (hasColor) {
    types.push('TH-白');
    types.push('TH-黒');
  } else {
    types.push('TH');
  }

  // HGパネル
  if (hasHG) {
    if (hasColor) {
      types.push('HG-白');
      types.push('HG-黒');
    } else {
      types.push('HG');
    }
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

// パーツ種別から原価データのキーを取得
function getCostKey(partsType) {
  if (partsType === 'TH-白' || partsType === 'TH-黒' || partsType === 'TH') {
    return 'TH-L';  // TH系は全てTH-Lの原価を使用
  }
  if (partsType === 'HG-白' || partsType === 'HG-黒' || partsType === 'HG') {
    return 'HG-L';  // HG系は全てHG-Lの原価を使用
  }
  return partsType;  // その他はそのまま
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

      // パーツ種別から元データのキーを取得（TH-白/TH-黒/TH → TH-L、HG-白/HG-黒/HG → HG-L）
      const costKey = getCostKey(partsType);
      const cost = parts[costKey] || 0;
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

      // パーツ種別から元データのキーを取得（TH-白/TH-黒/TH → TH-L、HG-白/HG-黒/HG → HG-L）
      const costKey = getCostKey(partsType);
      const cost = parts[costKey] || 0;
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
