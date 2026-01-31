-- ================================================
-- 全マスタデータ投入
-- 生成日時: 2026-01-31T08:25:33.576Z
--
-- 元データ:
-- - repair-prices-iphone.js
-- - costs-hw.js
-- - costs-aisapo.js
-- ================================================

-- ==========================================
-- 1. 修理価格（m_repair_prices_iphone）
-- ==========================================
DELETE FROM m_repair_prices_iphone WHERE tenant_id = 1;

INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE', 'TH-F', 5436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE', 'TH-L', 7436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE', 'バッテリー', 4527, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE', 'コネクタ', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE', 'リアカメラ', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE', 'インカメラ', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE', 'カメラ窓', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE2', 'TH-F', 4982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE2', 'TH-L', 6982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE2', 'HG-F', 7709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE2', 'HG-L', 11709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE2', 'バッテリー', 5436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE2', 'HGバッテリー', 8436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE2', 'コネクタ', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE2', 'リアカメラ', 9819, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE2', 'インカメラ', 9819, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE2', 'カメラ窓', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE3', 'TH-F', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE3', 'TH-L', 7891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE3', 'HG-F', 9527, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE3', 'HG-L', 13527, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE3', 'バッテリー', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE3', 'HGバッテリー', 8891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE3', 'コネクタ', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE3', 'リアカメラ', 9819, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE3', 'インカメラ', 9819, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'SE3', 'カメラ窓', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '6s', 'TH-F', 5436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '6s', 'TH-L', 7436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '6s', 'バッテリー', 4527, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '6s', 'コネクタ', 7255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '6s', 'リアカメラ', 8164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '6s', 'インカメラ', 8163, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '6s', 'カメラ窓', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7', 'TH-F', 4527, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7', 'TH-L', 6527, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7', 'HG-F', 7255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7', 'HG-L', 11255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7', 'バッテリー', 4982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7', 'コネクタ', 8164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7', 'リアカメラ', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7', 'インカメラ', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7', 'カメラ窓', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7P', 'TH-F', 5436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7P', 'TH-L', 7436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7P', 'HG-F', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7P', 'HG-L', 13073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7P', 'バッテリー', 4982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7P', 'コネクタ', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7P', 'リアカメラ', 12546, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7P', 'インカメラ', 11637, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '7P', 'カメラ窓', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8', 'TH-F', 4982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8', 'TH-L', 6982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8', 'HG-F', 7709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8', 'HG-L', 11709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8', 'バッテリー', 5255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8', 'コネクタ', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8', 'リアカメラ', 9819, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8', 'インカメラ', 9819, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8', 'カメラ窓', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8P', 'TH-F', 5436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8P', 'TH-L', 7436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8P', 'HG-F', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8P', 'HG-L', 13073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8P', 'バッテリー', 5255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8P', 'コネクタ', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8P', 'リアカメラ', 9819, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8P', 'インカメラ', 9819, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '8P', 'カメラ窓', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'X', 'TH-F', 6345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'X', 'TH-L', 10345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'X', 'HG-F', 11800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'X', 'HG-L', 15800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'X', 'バッテリー', 5436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'X', 'HGバッテリー', 8436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'X', 'コネクタ', 11637, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'X', 'リアカメラ', 15273, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'X', 'インカメラ', 16182, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'X', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XS', 'TH-F', 7255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XS', 'TH-L', 11255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XS', 'HG-F', 12709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XS', 'HG-L', 16709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XS', 'バッテリー', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XS', 'HGバッテリー', 8891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XS', 'コネクタ', 11637, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XS', 'リアカメラ', 15273, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XS', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XSMax', 'TH-F', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XSMax', 'TH-L', 13073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XSMax', 'HG-F', 17255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XSMax', 'HG-L', 21255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XSMax', 'バッテリー', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XSMax', 'コネクタ', 11637, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XSMax', 'リアカメラ', 15273, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XSMax', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XR', 'TH-F', 7255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XR', 'TH-L', 11255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XR', 'HG-F', 12709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XR', 'HG-L', 16709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XR', 'バッテリー', 5891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XR', 'HGバッテリー', 8891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XR', 'コネクタ', 11637, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XR', 'リアカメラ', 15273, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, 'XR', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11', 'TH-F', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11', 'TH-L', 13073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11', 'HG-F', 13618, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11', 'HG-L', 17618, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11', 'バッテリー', 6345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11', 'HGバッテリー', 9345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11', 'コネクタ', 11637, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11', 'リアカメラ', 15273, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11', 'インカメラ', 16182, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11Pro', 'TH-F', 9982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11Pro', 'TH-L', 13982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11Pro', 'HG-F', 18164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11Pro', 'HG-L', 22164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11Pro', 'バッテリー', 6800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11Pro', 'HGバッテリー', 9800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11Pro', 'コネクタ', 18000, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11Pro', 'リアカメラ', 15273, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11Pro', 'インカメラ', 16182, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11Pro', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11ProMax', 'TH-F', 10891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11ProMax', 'TH-L', 14891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11ProMax', 'HG-F', 19982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11ProMax', 'HG-L', 23982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11ProMax', 'バッテリー', 6800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11ProMax', 'コネクタ', 11637, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11ProMax', 'リアカメラ', 18000, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11ProMax', 'インカメラ', 16182, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '11ProMax', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12mini', 'TH-F', 11345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12mini', 'TH-L', 15345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12mini', 'HG-F', 23164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12mini', 'HG-L', 27164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12mini', 'バッテリー', 7709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12mini', 'HGバッテリー', 10709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12mini', 'コネクタ', 13455, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12mini', 'リアカメラ', 18000, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12mini', 'インカメラ', 16182, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12mini', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12', 'TH-F', 9982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12', 'TH-L', 13982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12', 'HG-F', 21800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12', 'HG-L', 25800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12', 'バッテリー', 7709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12', 'HGバッテリー', 10709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12', 'コネクタ', 13455, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12', 'リアカメラ', 15273, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12', 'インカメラ', 16182, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12Pro', 'TH-F', 9982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12Pro', 'TH-L', 13982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12Pro', 'HG-F', 21800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12Pro', 'HG-L', 25800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12Pro', 'バッテリー', 7709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12Pro', 'HGバッテリー', 10709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12Pro', 'コネクタ', 13455, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12Pro', 'リアカメラ', 18000, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12Pro', 'インカメラ', 16182, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12Pro', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12ProMax', 'TH-F', 13618, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12ProMax', 'TH-L', 17618, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12ProMax', 'HG-F', 30891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12ProMax', 'HG-L', 34891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12ProMax', 'バッテリー', 8164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12ProMax', 'コネクタ', 18000, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12ProMax', 'リアカメラ', 18000, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12ProMax', 'インカメラ', 16182, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '12ProMax', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13mini', 'TH-F', 13618, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13mini', 'TH-L', 17618, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13mini', 'HG-F', 27255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13mini', 'HG-L', 31255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13mini', 'バッテリー', 8618, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13mini', 'HGバッテリー', 11618, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13mini', 'コネクタ', 15273, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13mini', 'リアカメラ', 15273, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13mini', 'インカメラ', 18000, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13mini', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13', 'TH-F', 12709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13', 'TH-L', 16709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13', 'HG-F', 27255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13', 'HG-L', 31255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13', 'バッテリー', 8618, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13', 'HGバッテリー', 11618, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13', 'コネクタ', 13455, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13', 'リアカメラ', 15273, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13', 'インカメラ', 18000, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13Pro', 'TH-F', 16800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13Pro', 'TH-L', 20800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13Pro', 'HG-F', 39436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13Pro', 'HG-L', 43436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13Pro', 'バッテリー', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13Pro', 'HGバッテリー', 12073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13Pro', 'コネクタ', 15272, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13Pro', 'リアカメラ', 24364, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13Pro', 'インカメラ', 18000, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13Pro', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13ProMax', 'TH-F', 18164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13ProMax', 'TH-L', 22164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13ProMax', 'HG-F', 45436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13ProMax', 'HG-L', 49436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13ProMax', 'バッテリー', 9527, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13ProMax', 'コネクタ', 18000, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13ProMax', 'リアカメラ', 24364, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13ProMax', 'インカメラ', 18000, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '13ProMax', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14', 'TH-F', 14982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14', 'TH-L', 18982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14', 'HG-F', 31345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14', 'HG-L', 35345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14', 'バッテリー', 9982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14', 'HGバッテリー', 12982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14', 'コネクタ', 13454, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14', 'リアカメラ', 18000, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Plus', 'TH-F', 16345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Plus', 'TH-L', 20345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Plus', 'HG-F', 34527, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Plus', 'HG-L', 38527, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Plus', 'バッテリー', 10436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Plus', 'コネクタ', 14364, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Plus', 'リアカメラ', 18000, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Plus', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Pro', 'TH-F', 19982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Pro', 'TH-L', 23982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Pro', 'HG-F', 49982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Pro', 'HG-L', 53982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Pro', 'バッテリー', 10436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Pro', 'HGバッテリー', 13436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Pro', 'コネクタ', 15273, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Pro', 'リアカメラ', 24364, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14Pro', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14ProMax', 'TH-F', 22255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14ProMax', 'TH-L', 26255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14ProMax', 'HG-F', 55891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14ProMax', 'HG-L', 59891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14ProMax', 'バッテリー', 10891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14ProMax', 'コネクタ', 18000, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14ProMax', 'リアカメラ', 24364, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '14ProMax', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15', 'TH-F', 18164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15', 'TH-L', 22164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15', 'HG-F', 38164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15', 'HG-L', 42164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15', 'バッテリー', 10891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15', 'HGバッテリー', 13891, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15', 'コネクタ', 26182, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15', 'リアカメラ', 27091, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Plus', 'TH-F', 19073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Plus', 'TH-L', 23073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Plus', 'HG-F', 39982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Plus', 'HG-L', 43982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Plus', 'バッテリー', 11345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Plus', 'コネクタ', 31637, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Plus', 'リアカメラ', 27091, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Plus', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Pro', 'TH-F', 22255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Pro', 'TH-L', 26255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Pro', 'HG-F', 49527, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Pro', 'HG-L', 53527, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Pro', 'バッテリー', 11345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Pro', 'HGバッテリー', 14345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Pro', 'コネクタ', 31637, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Pro', 'リアカメラ', 27091, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15Pro', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15ProMax', 'TH-F', 24527, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15ProMax', 'TH-L', 28527, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15ProMax', 'HG-F', 59073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15ProMax', 'HG-L', 63073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15ProMax', 'バッテリー', 11800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15ProMax', 'コネクタ', 31637, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15ProMax', 'リアカメラ', 27091, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '15ProMax', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16', 'TH-F', 25436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16', 'TH-L', 29436, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16', 'HG-F', 63618, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16', 'HG-L', 67618, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16', 'バッテリー', 11800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16Plus', 'TH-F', 27255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16Plus', 'TH-L', 31255, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16Plus', 'HG-F', 66345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16Plus', 'HG-L', 70345, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16Plus', 'バッテリー', 11800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16Plus', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16Pro', 'TH-F', 29982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16Pro', 'TH-L', 33982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16Pro', 'HG-F', 69982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16Pro', 'HG-L', 73982, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16Pro', 'バッテリー', 13164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16Pro', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16ProMax', 'TH-F', 31800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16ProMax', 'TH-L', 35800, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16ProMax', 'HG-F', 72709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16ProMax', 'HG-L', 76709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16ProMax', 'バッテリー', 13618, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16ProMax', 'カメラ窓', 9073, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16e', 'TH-F', 18164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16e', 'TH-L', 22164, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16e', 'HG-F', 22709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16e', 'HG-L', 26709, true);
INSERT INTO m_repair_prices_iphone (tenant_id, model, repair_type, price, is_active) VALUES (1, '16e', 'カメラ窓', 9073, true);

-- ==========================================
-- 2. パーツ原価（m_costs_hw）
-- ==========================================
DELETE FROM m_costs_hw WHERE tenant_id = 1;

-- HW原価
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE', 'TH-黒', 1364, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE', 'TH-白', 1364, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE', 'バッテリー', 590, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE', 'コネクタ', 500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE', 'リアカメラ', 591, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE', 'インカメラ', 455, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'TH', 1250, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'HG', 1800, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'バッテリー', 500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'HGバッテリー', 650, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'コネクタ', 1182, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'リアカメラ', 3000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'インカメラ', 782, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'カメラ窓', 137, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE3', 'TH', 1500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE3', 'HG', 2100, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE3', 'バッテリー', 660, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE3', 'HGバッテリー', 750, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE3', 'コネクタ', 1182, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE3', 'リアカメラ', 3000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE3', 'インカメラ', 782, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE3', 'カメラ窓', 137, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '6s', 'TH-黒', 1250, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '6s', 'TH-白', 1250, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '6s', 'バッテリー', 500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '6s', 'コネクタ', 500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '6s', 'リアカメラ', 910, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '6s', 'インカメラ', 364, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '6s', 'カメラ窓', 91, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'TH-黒', 1250, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'TH-白', 1250, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'バッテリー', 550, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'コネクタ', 591, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'リアカメラ', 2273, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'インカメラ', 800, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'カメラ窓', 137, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'TH-黒', 1500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'TH-白', 1500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'バッテリー', 610, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'コネクタ', 773, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'リアカメラ', 4527, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'インカメラ', 782, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'カメラ窓', 228, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'TH-黒', 1250, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'TH-白', 1250, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'HG-黒', 1800, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'HG-白', 1800, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'バッテリー', 400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'コネクタ', 1091, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'リアカメラ', 2000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'インカメラ', 782, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'カメラ窓', 137, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'TH-黒', 1500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'TH-白', 1500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'バッテリー', 610, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'コネクタ', 727, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'リアカメラ', 4000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'インカメラ', 864, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'カメラ窓', 228, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'TH', 1950, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'HG', 3200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'バッテリー', 800, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'HGバッテリー', 920, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'コネクタ', 800, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'リアカメラ', 3000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'インカメラ', 818, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'カメラ窓', 228, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'TH', 1950, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'HG', 3200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'バッテリー', 850, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'HGバッテリー', 950, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'コネクタ', 1000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'リアカメラ', 4000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'インカメラ', 700, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'カメラ窓', 228, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XSMax', 'TH', 2000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XSMax', 'HG', 4500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XSMax', 'バッテリー', 860, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XSMax', 'コネクタ', 1091, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XSMax', 'リアカメラ', 4000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XSMax', 'インカメラ', 1000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XSMax', 'カメラ窓', 228, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'TH', 1800, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'バッテリー', 706, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'HGバッテリー', 780, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'コネクタ', 700, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'リアカメラ', 4000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'インカメラ', 700, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'カメラ窓', 228, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'TH', 1900, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'バッテリー', 660, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'HGバッテリー', 850, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'コネクタ', 1000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'リアカメラ', 2864, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'インカメラ', 1000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'カメラ窓', 273, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'TH', 2250, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'HG', 3600, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'バッテリー', 860, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'HGバッテリー', 1000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'コネクタ', 3850, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'リアカメラ', 6300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'インカメラ', 1182, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'カメラ窓', 273, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11ProMax', 'TH', 2050, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11ProMax', 'HG', 4650, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11ProMax', 'バッテリー', 920, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11ProMax', 'コネクタ', 4300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11ProMax', 'リアカメラ', 6300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11ProMax', 'インカメラ', 1273, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11ProMax', 'カメラ窓', 273, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'TH', 3200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'HG', 6200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'バッテリー', 700, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'HGバッテリー', 800, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'コネクタ', 1650, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'リアカメラ', 5000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'インカメラ', 1273, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'カメラ窓', 300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'TH', 2200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'HG', 4400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'バッテリー', 600, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'HGバッテリー', 800, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'コネクタ', 1650, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'リアカメラ', 3455, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'インカメラ', 1364, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'カメラ窓', 300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'TH', 2200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'HG', 4400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'バッテリー', 600, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'HGバッテリー', 800, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'コネクタ', 1650, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'リアカメラ', 11500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'インカメラ', 1364, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'カメラ窓', 300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12ProMax', 'TH', 3600, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12ProMax', 'HG', 6980, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12ProMax', 'バッテリー', 960, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12ProMax', 'コネクタ', 2600, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12ProMax', 'リアカメラ', 10000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12ProMax', 'インカメラ', 1364, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12ProMax', 'カメラ窓', 300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'TH', 3200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'バッテリー', 720, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'HGバッテリー', 850, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'コネクタ', 3000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'リアカメラ', 4000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'インカメラ', 1800, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'カメラ窓', 300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'TH', 2850, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'HG', 5100, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'バッテリー', 700, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'HGバッテリー', 900, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'コネクタ', 2200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'リアカメラ', 4000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'インカメラ', 900, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'カメラ窓', 300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'TH', 3300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'HG', 6200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'バッテリー', 1050, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'HGバッテリー', 1200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'コネクタ', 3400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'リアカメラ', 10100, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'インカメラ', 2000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'カメラ窓', 300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13ProMax', 'TH', 3800, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13ProMax', 'HG', 7200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13ProMax', 'バッテリー', 1100, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13ProMax', 'コネクタ', 3900, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13ProMax', 'リアカメラ', 10100, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13ProMax', 'インカメラ', 2000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13ProMax', 'カメラ窓', 300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'TH', 3000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'HG', 5000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'バッテリー', 780, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'HGバッテリー', 900, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'コネクタ', 2200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'リアカメラ', 6500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'インカメラ', 2500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'カメラ窓', 300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Plus', 'TH', 3300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Plus', 'HG', 6600, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Plus', 'バッテリー', 980, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Plus', 'コネクタ', 2200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Plus', 'リアカメラ', 4600, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Plus', 'インカメラ', 3000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Plus', 'カメラ窓', 300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'TH', 3980, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'HG', 11500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'バッテリー', 1100, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'HGバッテリー', 1200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'コネクタ', 3200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'リアカメラ', 7500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'インカメラ', 2600, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'カメラ窓', 400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14ProMax', 'TH', 5700, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14ProMax', 'HG', 12500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14ProMax', 'バッテリー', 1350, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14ProMax', 'コネクタ', 4100, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14ProMax', 'リアカメラ', 8000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14ProMax', 'インカメラ', 3000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14ProMax', 'カメラ窓', 400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15', 'TH', 3580, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15', 'HG', 9300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15', 'バッテリー', 1000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15', 'HGバッテリー', 1100, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15', 'コネクタ', 2500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15', 'リアカメラ', 4500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15', 'インカメラ', 2300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15', 'カメラ窓', 400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Plus', 'TH', 4150, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Plus', 'HG', 10500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Plus', 'バッテリー', 1000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Plus', 'コネクタ', 3800, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Plus', 'リアカメラ', 4500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Plus', 'インカメラ', 2000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Plus', 'カメラ窓', 400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Pro', 'TH', 4500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Pro', 'HG', 13000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Pro', 'バッテリー', 1200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Pro', 'HGバッテリー', 1400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Pro', 'コネクタ', 3100, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Pro', 'リアカメラ', 6500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Pro', 'インカメラ', 2000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Pro', 'カメラ窓', 400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15ProMax', 'TH', 6100, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15ProMax', 'HG', 14000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15ProMax', 'バッテリー', 1300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15ProMax', 'コネクタ', 4500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15ProMax', 'リアカメラ', 7600, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15ProMax', 'インカメラ', 2500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15ProMax', 'カメラ窓', 400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16', 'TH', 6000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16', 'HG', 13000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16', 'バッテリー', 1500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16', 'コネクタ', 3600, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16', 'リアカメラ', 7300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16', 'インカメラ', 5400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16', 'カメラ窓', 400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Plus', 'TH', 6450, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Plus', 'HG', 13600, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Plus', 'バッテリー', 1500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Plus', 'コネクタ', 5000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Plus', 'リアカメラ', 8500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Plus', 'インカメラ', 5400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Plus', 'カメラ窓', 400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Pro', 'TH', 11200, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Pro', 'HG', 14500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Pro', 'バッテリー', 1750, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Pro', 'コネクタ', 4000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Pro', 'リアカメラ', 8300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Pro', 'インカメラ', 6300, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Pro', 'カメラ窓', 400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16ProMax', 'TH', 19680, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16ProMax', 'HG', 18900, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16ProMax', 'バッテリー', 1800, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16ProMax', 'コネクタ', 5000, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16ProMax', 'リアカメラ', 9100, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16ProMax', 'インカメラ', 11500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16ProMax', 'カメラ窓', 400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16e', 'TH', 3500, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16e', 'リアカメラ', 5600, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16e', 'カメラ窓', 400, true, (SELECT id FROM m_suppliers WHERE code = 'hw'));

-- アイサポ原価
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE', 'TH-黒', 2870, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE', 'TH-白', 2870, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE', 'バッテリー', 1940, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE', 'コネクタ', 1500, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE', 'リアカメラ', 3525, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE', 'インカメラ', 3525, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'TH', 3040, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'HG', 4040, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'バッテリー', 2090, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'HGバッテリー', 3390, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'コネクタ', 3420, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'リアカメラ', 4400, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'インカメラ', 3420, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE2', 'カメラ窓', 164, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE3', 'TH', 3230, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE3', 'HG', 4040, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE3', 'バッテリー', 2290, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE3', 'HGバッテリー', 3590, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE3', 'コネクタ', 3420, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'SE3', 'リアカメラ', 4400, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '6s', 'TH-黒', 2980, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '6s', 'TH-白', 2980, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '6s', 'バッテリー', 1940, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '6s', 'コネクタ', 2035, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '6s', 'リアカメラ', 2711, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '6s', 'インカメラ', 2488, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '6s', 'カメラ窓', 82, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'TH-黒', 2790, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'TH-白', 2790, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'HG-黒', 3790, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'HG-白', 3790, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'バッテリー', 2140, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'コネクタ', 2545, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'リアカメラ', 3830, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'インカメラ', 3275, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7', 'カメラ窓', 82, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'TH-黒', 3060, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'TH-白', 3060, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'HG-黒', 4990, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'HG-白', 4990, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'バッテリー', 2190, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'コネクタ', 1635, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'リアカメラ', 8650, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'インカメラ', 2017, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '7P', 'カメラ窓', 82, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'TH-黒', 3040, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'TH-白', 3040, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'HG-黒', 4040, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'HG-白', 4040, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'バッテリー', 2110, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'コネクタ', 3742, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'リアカメラ', 3950, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'インカメラ', 1500, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8', 'カメラ窓', 82, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'TH-黒', 2750, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'TH-白', 2750, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'HG-黒', 4420, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'HG-白', 4420, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'バッテリー', 2360, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'コネクタ', 1545, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'リアカメラ', 6850, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'インカメラ', 3580, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '8P', 'カメラ窓', 164, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'TH', 4090, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'HG', 6190, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'バッテリー', 2240, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'HGバッテリー', 3540, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'コネクタ', 3855, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'リアカメラ', 6850, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'インカメラ', 3663, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'X', 'カメラ窓', 164, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'TH', 4190, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'HG', 6680, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'バッテリー', 2440, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'HGバッテリー', 3740, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'コネクタ', 3420, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'リアカメラ', 6850, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'インカメラ', 3420, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XS', 'カメラ窓', 164, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XSMax', 'TH', 5390, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XSMax', 'HG', 8990, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XSMax', 'バッテリー', 2490, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XSMax', 'コネクタ', 4320, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XSMax', 'リアカメラ', 6850, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XSMax', 'インカメラ', 3420, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XSMax', 'カメラ窓', 164, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'TH', 4290, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'HG', 5690, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'バッテリー', 2440, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'HGバッテリー', 3740, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'コネクタ', 3740, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'リアカメラ', 6850, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'インカメラ', 7960, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, 'XR', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'TH', 5280, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'HG', 6640, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'バッテリー', 2490, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'HGバッテリー', 3790, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'コネクタ', 3740, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'リアカメラ', 6850, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'インカメラ', 7960, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'TH', 5390, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'HG', 9190, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'バッテリー', 2790, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'HGバッテリー', 4090, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'コネクタ', 3740, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'リアカメラ', 8100, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'インカメラ', 7960, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11Pro', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11ProMax', 'TH', 6080, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11ProMax', 'HG', 9690, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11ProMax', 'バッテリー', 2790, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11ProMax', 'コネクタ', 3740, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11ProMax', 'リアカメラ', 8100, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11ProMax', 'インカメラ', 7960, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '11ProMax', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'TH', 6400, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'HG', 9830, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'バッテリー', 2990, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'HGバッテリー', 4340, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'コネクタ', 9000, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'リアカメラ', 9900, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'インカメラ', 6900, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12mini', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'TH', 5480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'HG', 9590, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'バッテリー', 2990, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'HGバッテリー', 4340, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'コネクタ', 3740, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'リアカメラ', 6850, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'インカメラ', 9250, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'TH', 5480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'HG', 9590, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'バッテリー', 2990, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'HGバッテリー', 4340, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'コネクタ', 6100, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'リアカメラ', 9900, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'インカメラ', 7600, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12Pro', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12ProMax', 'TH', 7490, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12ProMax', 'HG', 14820, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12ProMax', 'バッテリー', 3190, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12ProMax', 'コネクタ', 6800, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12ProMax', 'リアカメラ', 9900, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12ProMax', 'インカメラ', 6000, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '12ProMax', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'TH', 6680, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'HG', 14090, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'バッテリー', 3340, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'HGバッテリー', 4740, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'コネクタ', 6800, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'リアカメラ', 6850, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'インカメラ', 6000, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13mini', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'TH', 6740, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'HG', 10990, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'バッテリー', 3390, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'HGバッテリー', 4790, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'コネクタ', 6800, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'リアカメラ', 6850, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'インカメラ', 6000, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'TH', 11030, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'HG', 18290, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'バッテリー', 3590, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'HGバッテリー', 4990, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'コネクタ', 9000, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'リアカメラ', 10950, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'インカメラ', 6000, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13Pro', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13ProMax', 'TH', 11990, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13ProMax', 'HG', 22080, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13ProMax', 'バッテリー', 3740, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13ProMax', 'コネクタ', 6800, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13ProMax', 'リアカメラ', 10950, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '13ProMax', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'TH', 7640, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'HG', 13990, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'バッテリー', 3940, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'HGバッテリー', 5390, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'コネクタ', 6800, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'リアカメラ', 9850, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Plus', 'TH', 9180, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Plus', 'HG', 18540, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Plus', 'バッテリー', 4140, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Plus', 'コネクタ', 6800, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Plus', 'リアカメラ', 7580, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Plus', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'TH', 14530, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'HG', 28080, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'バッテリー', 3990, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'HGバッテリー', 5440, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'コネクタ', 6800, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'リアカメラ', 10950, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14Pro', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14ProMax', 'TH', 16540, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14ProMax', 'HG', 34930, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14ProMax', 'バッテリー', 4290, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14ProMax', 'リアカメラ', 10950, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '14ProMax', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15', 'TH', 11640, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15', 'HG', 20080, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15', 'バッテリー', 4290, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15', 'HGバッテリー', 5790, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15', 'リアカメラ', 15500, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Plus', 'TH', 12490, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Plus', 'HG', 27180, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Plus', 'バッテリー', 4490, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Plus', 'コネクタ', 5900, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Plus', 'リアカメラ', 15500, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Plus', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Pro', 'TH', 16030, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Pro', 'HG', 31330, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Pro', 'バッテリー', 4490, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Pro', 'HGバッテリー', 5990, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Pro', 'リアカメラ', 19500, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15Pro', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15ProMax', 'TH', 18880, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15ProMax', 'HG', 35590, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15ProMax', 'バッテリー', 4690, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15ProMax', 'リアカメラ', 19500, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '15ProMax', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16', 'TH', 17180, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16', 'HG', 44980, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16', 'バッテリー', 4690, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Plus', 'TH', 15980, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Plus', 'HG', 49980, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Plus', 'バッテリー', 4690, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Plus', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Pro', 'TH', 17980, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Pro', 'HG', 47980, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Pro', 'バッテリー', 4190, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16Pro', 'カメラ窓', 480, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16ProMax', 'TH', 19680, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16ProMax', 'HG', 49980, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16ProMax', 'バッテリー', 3890, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16e', 'TH', 8890, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));
INSERT INTO m_costs_hw (tenant_id, model, parts_type, cost, is_active, supplier_id) VALUES (1, '16e', 'HG', 12990, true, (SELECT id FROM m_suppliers WHERE code = 'aisapo'));

-- ==========================================
-- 3. パーツ在庫初期化（t_parts_inventory）
-- ==========================================
DELETE FROM t_parts_inventory WHERE tenant_id = 1;

-- SE
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE', 'TH-黒', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE', 'TH-白', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- SE2
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE2', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE2', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE2', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE2', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE2', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE2', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE2', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE2', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- SE3
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE3', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE3', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE3', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE3', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE3', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE3', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE3', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'SE3', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 6s
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '6s', 'TH-黒', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '6s', 'TH-白', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '6s', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '6s', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '6s', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '6s', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '6s', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 7
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7', 'TH-黒', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7', 'TH-白', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7', 'HG-黒', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7', 'HG-白', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 7P
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7P', 'TH-黒', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7P', 'TH-白', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7P', 'HG-黒', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7P', 'HG-白', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7P', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7P', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7P', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7P', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '7P', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 8
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8', 'TH-黒', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8', 'TH-白', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8', 'HG-黒', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8', 'HG-白', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 8P
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8P', 'TH-黒', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8P', 'TH-白', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8P', 'HG-黒', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8P', 'HG-白', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8P', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8P', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8P', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8P', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '8P', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- X
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'X', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'X', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'X', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'X', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'X', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'X', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'X', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'X', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- XS
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XS', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XS', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XS', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XS', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XS', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XS', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XS', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- XSMax
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XSMax', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XSMax', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XSMax', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XSMax', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XSMax', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XSMax', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- XR
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XR', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XR', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XR', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XR', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XR', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XR', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, 'XR', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 11
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 11Pro
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11Pro', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11Pro', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11Pro', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11Pro', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11Pro', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11Pro', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11Pro', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11Pro', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 11ProMax
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11ProMax', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11ProMax', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11ProMax', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11ProMax', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11ProMax', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11ProMax', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '11ProMax', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 12mini
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12mini', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12mini', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12mini', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12mini', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12mini', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12mini', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12mini', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12mini', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 12
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 12Pro
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12Pro', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12Pro', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12Pro', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12Pro', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12Pro', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12Pro', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12Pro', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12Pro', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 12ProMax
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12ProMax', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12ProMax', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12ProMax', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12ProMax', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12ProMax', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12ProMax', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '12ProMax', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 13mini
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13mini', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13mini', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13mini', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13mini', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13mini', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13mini', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13mini', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13mini', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 13
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 13Pro
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13Pro', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13Pro', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13Pro', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13Pro', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13Pro', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13Pro', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13Pro', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13Pro', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 13ProMax
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13ProMax', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13ProMax', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13ProMax', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13ProMax', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13ProMax', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13ProMax', 'インカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '13ProMax', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 14
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 14Plus
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14Plus', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14Plus', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14Plus', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14Plus', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14Plus', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14Plus', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 14Pro
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14Pro', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14Pro', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14Pro', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14Pro', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14Pro', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14Pro', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14Pro', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 14ProMax
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14ProMax', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14ProMax', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14ProMax', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14ProMax', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14ProMax', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '14ProMax', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 15
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 15Plus
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15Plus', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15Plus', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15Plus', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15Plus', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15Plus', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15Plus', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 15Pro
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15Pro', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15Pro', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15Pro', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15Pro', 'HGバッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15Pro', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15Pro', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15Pro', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 15ProMax
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15ProMax', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15ProMax', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15ProMax', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15ProMax', 'コネクタ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15ProMax', 'リアカメラ', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '15ProMax', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 16
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 16Plus
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16Plus', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16Plus', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16Plus', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16Plus', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 16Pro
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16Pro', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16Pro', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16Pro', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16Pro', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 16ProMax
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16ProMax', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16ProMax', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16ProMax', 'バッテリー', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16ProMax', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

-- 16e
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16e', 'TH', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16e', 'HG', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;
INSERT INTO t_parts_inventory (tenant_id, shop_id, model, parts_type, supplier_id, required_qty, actual_qty)
SELECT 1, s.id, '16e', 'カメラ窓', sup.id, 2, 0
FROM m_shops s
CROSS JOIN m_suppliers sup
WHERE s.tenant_id = 1 AND s.is_active = true
AND sup.tenant_id = 1 AND sup.is_active = true;

