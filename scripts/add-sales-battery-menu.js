// 全iPhoneモデルに「販売バッテリー」メニューを追加するスクリプト
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/repair-prices-iphone.js');

// 現在のデータを読み込み
const REPAIR_PRICES_IPHONE = require('../data/repair-prices-iphone.js');

// iPhoneモデルのみを対象（iPadモデルは除外）
const ipadPrefixes = ['mini', 'Pro11', 'Pro12.9', 'Air', '第'];

Object.keys(REPAIR_PRICES_IPHONE).forEach(model => {
  // iPadモデルはスキップ
  const isIpad = ipadPrefixes.some(prefix => model.startsWith(prefix));
  if (isIpad) {
    console.log(`⏭ ${model} はiPadのためスキップ`);
    return;
  }

  // 既に販売バッテリーがある場合はスキップ
  if (REPAIR_PRICES_IPHONE[model]['販売バッテリー'] !== undefined) {
    console.log(`⏭ ${model} は既に「販売バッテリー」があるためスキップ`);
    return;
  }

  // 販売バッテリーを追加（税抜3000円）
  REPAIR_PRICES_IPHONE[model]['販売バッテリー'] = 3000;
  console.log(`✓ ${model} に「販売バッテリー」を追加`);
});

// ファイルを生成
const header = `// ==========================================
// iPhone修理価格マスタ（税抜き）
// 最終更新: ${new Date().toISOString().split('T')[0]}
// ==========================================

const REPAIR_PRICES_IPHONE = `;

const footer = `;\nmodule.exports = REPAIR_PRICES_IPHONE;`;

// オブジェクトを整形してJSファイルとして書き出し
const content = header + JSON.stringify(REPAIR_PRICES_IPHONE, null, 2)
  .replace(/"([^"]+)":/g, '"$1":') + footer;

fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ 完了: repair-prices-iphone.js を更新しました');
console.log('📝 「販売バッテリー」: 3000円（税抜）を全iPhoneモデルに追加');
