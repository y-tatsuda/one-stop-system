// ================================================
// 修理価格データのSQL生成スクリプト
// 実行: node data/sql/generate-repair-prices-sql.js
// ================================================

const fs = require('fs');
const path = require('path');

// 修理価格データ
const REPAIR_PRICES_IPHONE = require('../repair-prices-iphone.js');

// 対象の修理種別（パーツ原価と対応するもの）
const REPAIR_TYPES = [
  'TH-F', 'TH-L', 'HG-F', 'HG-L',
  'バッテリー', 'HGバッテリー',
  'コネクタ', 'リアカメラ', 'インカメラ', 'カメラ窓'
];

function generateSQL() {
  let sql = `-- ================================================
-- 修理価格データ投入
-- 生成日時: ${new Date().toISOString()}
-- ================================================

-- 既存データを削除
DELETE FROM m_repair_prices_iphone WHERE tenant_id = 1;

-- 修理価格データ
`;

  for (const [model, prices] of Object.entries(REPAIR_PRICES_IPHONE)) {
    for (const repairType of REPAIR_TYPES) {
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
