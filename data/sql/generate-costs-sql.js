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

// 対象パーツ種別（m_costs_hwに登録するもの）
const PARTS_TYPES = [
  'TH-F', 'TH-L', 'HG-F', 'HG-L',
  'バッテリー', 'HGバッテリー',
  'コネクタ', 'リアカメラ', 'インカメラ', 'カメラ窓'
];

function generateSQL() {
  let sql = `-- ================================================
-- パーツ原価データ投入
-- 生成日時: ${new Date().toISOString()}
-- ================================================

-- 既存データを削除
DELETE FROM m_costs_hw WHERE tenant_id = 1;

-- HW原価データ
`;

  // HWデータ
  for (const [model, parts] of Object.entries(REPAIR_COSTS_HW)) {
    for (const partsType of PARTS_TYPES) {
      const cost = parts[partsType] || 0;
      if (cost > 0) {
        sql += `INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '${model}', '${partsType}', ${cost}, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));\n`;
      }
    }
  }

  sql += `\n-- アイサポ原価データ\n`;

  // アイサポデータ
  for (const [model, parts] of Object.entries(REPAIR_COSTS_AISAPO)) {
    for (const partsType of PARTS_TYPES) {
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
