'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Shop = {
  id: number
  name: string
}

type Staff = {
  id: number
  name: string
}

type DeductionData = {
  deduction_type: string
  amount: number
}

type CostData = {
  parts_type: string
  cost: number
}

// ランクリスト
const rankOptions = ['超美品', '美品', '良品', '並品', 'リペア品']

// 修理種別リスト
const repairTypes = [
  { key: 'screen', label: '画面修理', partsType: '画面修理', exclusive: 'screen_oled' },
  { key: 'screen_oled', label: '画面修理 (有機EL)', partsType: '画面修理 (有機EL)', exclusive: 'screen' },
  { key: 'battery', label: 'バッテリー', partsType: 'バッテリー', exclusive: null },
  { key: 'connector', label: 'コネクタ', partsType: 'コネクタ', exclusive: null },
  { key: 'rear_camera', label: 'リアカメラ', partsType: 'リアカメラ', exclusive: null },
  { key: 'front_camera', label: 'インカメラ', partsType: 'インカメラ', exclusive: null },
  { key: 'camera_glass', label: 'カメラ窓', partsType: 'カメラ窓', exclusive: null },
]

export default function BuybackPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // iPhone機種リスト
  const [iphoneModels, setIphoneModels] = useState<{model: string, display_name: string}[]>([])
  
  // 容量リスト（機種ごとに動的取得）
  const [availableStorages, setAvailableStorages] = useState<number[]>([])
  
  // 減額データ
  const [deductions, setDeductions] = useState<DeductionData[]>([])
  
  // パーツ原価データ
  const [partsCosts, setPartsCosts] = useState<CostData[]>([])
  
  // 最低保証価格
  const [guaranteePrice, setGuaranteePrice] = useState<number>(0)

  // ★追加: 販売価格関連
  const [salesBasePrice, setSalesBasePrice] = useState<number>(0)
  const [salesDeductions, setSalesDeductions] = useState<DeductionData[]>([])
  const [calculatedSalesPrice, setCalculatedSalesPrice] = useState<number>(0)

  // フォームの状態
  const [formData, setFormData] = useState({
    buybackDate: new Date().toISOString().split('T')[0],
    shopId: '',
    staffId: '',
    model: '',
    storage: '',
    rank: '',
    imei: '',
    batteryPercent: '', // 実数入力
    isServiceState: false,
    nwStatus: 'ok',
    cameraStain: 'none',
    cameraBreak: false,
    repairHistory: false,
    basePrice: 0,
    deductionTotal: 0,
    calculatedPrice: 0, // 計算後価格
    finalPrice: 0, // 最終買取価格
    needsRepair: false,
    selectedRepairs: [] as string[], // 選択した修理種別
    repairCost: 0,
    memo: '',
  })

  // マスタデータ取得
  useEffect(() => {
    async function fetchMasterData() {
      const { data: shopsData } = await supabase
        .from('m_shops')
        .select('id, name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('id')

      const { data: staffData } = await supabase
        .from('m_staff')
        .select('id, name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('id')

      // iPhone機種リスト（買取対象外を除く）
      const { data: iphoneModelsData } = await supabase
        .from('m_iphone_models')
        .select('model, display_name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .not('model', 'in', '(SE,6s,7,7P)')
        .order('sort_order')

      setShops(shopsData || [])
      setStaff(staffData || [])
      setIphoneModels(iphoneModelsData || [])
      setLoading(false)
    }

    fetchMasterData()
  }, [])

  // 機種変更時に利用可能な容量を取得
  useEffect(() => {
    async function fetchAvailableStorages() {
      if (!formData.model) {
        setAvailableStorages([])
        return
      }

      const { data } = await supabase
        .from('m_buyback_prices')
        .select('storage')
        .eq('tenant_id', 1)
        .eq('model', formData.model)
        .eq('is_active', true)

      if (data) {
        const storages = [...new Set(data.map(d => d.storage))].sort((a, b) => a - b)
        setAvailableStorages(storages)
      } else {
        setAvailableStorages([])
      }
    }
    fetchAvailableStorages()
  }, [formData.model])

  // 機種変更時にパーツ原価を取得
  useEffect(() => {
    async function fetchPartsCosts() {
      if (!formData.model) {
        setPartsCosts([])
        return
      }

      const { data } = await supabase
        .from('m_costs_hw')
        .select('parts_type, cost')
        .eq('tenant_id', 1)
        .eq('model', formData.model)
        .eq('is_active', true)

      setPartsCosts(data || [])
    }
    fetchPartsCosts()
  }, [formData.model])

  // 基本買取価格、減額データ、保証価格を取得
  useEffect(() => {
    async function fetchPriceData() {
      if (formData.model && formData.storage && formData.rank) {
        // 基本買取価格取得
        const { data: priceData } = await supabase
          .from('m_buyback_prices')
          .select('price')
          .eq('tenant_id', 1)
          .eq('model', formData.model)
          .eq('storage', parseInt(formData.storage))
          .eq('rank', formData.rank)
          .single()

        // 減額データ取得
        const { data: deductionData } = await supabase
          .from('m_buyback_deductions')
          .select('deduction_type, amount')
          .eq('tenant_id', 1)
          .eq('model', formData.model)
          .eq('storage', parseInt(formData.storage))
          .eq('is_active', true)

        // 最低保証価格取得
        const { data: guaranteeData } = await supabase
          .from('m_buyback_guarantees')
          .select('guarantee_price')
          .eq('tenant_id', 1)
          .eq('model', formData.model)
          .eq('storage', parseInt(formData.storage))
          .single()

        // ★追加: 販売価格取得
        const { data: salesPriceData } = await supabase
          .from('m_sales_prices')
          .select('price')
          .eq('tenant_id', 1)
          .eq('model', formData.model)
          .eq('storage', parseInt(formData.storage))
          .eq('rank', formData.rank)
          .single()

        // ★追加: 販売減額データ取得
        const { data: salesDeductionData } = await supabase
          .from('m_sales_price_deductions')
          .select('deduction_type, amount')
          .eq('tenant_id', 1)
          .eq('model', formData.model)
          .eq('is_active', true)

        const basePrice = priceData?.price || 0
        setDeductions(deductionData || [])
        setGuaranteePrice(guaranteeData?.guarantee_price || 0)
        setSalesBasePrice(salesPriceData?.price || 0)
        setSalesDeductions(salesDeductionData || [])
        
        setFormData(prev => ({
          ...prev,
          basePrice,
        }))
      }
    }
    fetchPriceData()
  }, [formData.model, formData.storage, formData.rank])

  // 減額計算
  useEffect(() => {
    if (deductions.length === 0 && formData.basePrice === 0) {
      return
    }

    const deductionMap: { [key: string]: number } = {}
    deductions.forEach(d => {
      deductionMap[d.deduction_type] = d.amount
    })

    let deduction = 0
    const batteryPercent = parseInt(formData.batteryPercent) || 100

    // バッテリー減額
    if (formData.isServiceState) {
      // サービス状態の場合は79%以下扱い
      deduction += deductionMap['battery_79'] || 0
    } else if (batteryPercent >= 80 && batteryPercent <= 89) {
      deduction += deductionMap['battery_80_89'] || 0
    } else if (batteryPercent <= 79) {
      deduction += deductionMap['battery_79'] || 0
    }

    // NW制限減額
    if (formData.nwStatus === 'triangle') {
      deduction += deductionMap['nw_checking'] || 0
    } else if (formData.nwStatus === 'cross') {
      deduction += deductionMap['nw_ng'] || 0
    }

    // カメラ染み減額
    if (formData.cameraStain === 'minor') {
      deduction += deductionMap['camera_stain_minor'] || 0
    } else if (formData.cameraStain === 'major') {
      deduction += deductionMap['camera_stain_major'] || 0
    }

    // カメラ窓破損減額
    if (formData.cameraBreak) {
      deduction += deductionMap['camera_broken'] || 0
    }

    // 修理歴減額
    if (formData.repairHistory) {
      deduction += deductionMap['repair_history'] || 0
    }

    // 計算後価格
    const calculatedPrice = formData.basePrice - deduction

    // 最終買取価格（最低保証価格との比較）
    const finalPrice = Math.max(calculatedPrice, guaranteePrice)

    setFormData(prev => ({
      ...prev,
      deductionTotal: deduction,
      calculatedPrice,
      finalPrice,
    }))
  }, [formData.batteryPercent, formData.isServiceState, formData.nwStatus, formData.cameraStain, formData.cameraBreak, formData.repairHistory, formData.basePrice, deductions, guaranteePrice])

  // ★ここから追加（販売価格の減額計算）
  useEffect(() => {
    if (salesBasePrice === 0) {
      setCalculatedSalesPrice(0)
      return
    }

    const deductionMap: { [key: string]: number } = {}
    salesDeductions.forEach(d => {
      deductionMap[d.deduction_type] = d.amount
    })

    let salesDeduction = 0
    const batteryPercent = parseInt(formData.batteryPercent) || 100

    // バッテリー減額
    if (formData.isServiceState || batteryPercent <= 79) {
      salesDeduction += deductionMap['battery_79'] || 0
    } else if (batteryPercent >= 80 && batteryPercent <= 89) {
      salesDeduction += deductionMap['battery_80_89'] || 0
    }

    // カメラ染み減額
    if (formData.cameraStain === 'minor') {
      salesDeduction += deductionMap['camera_stain_minor'] || 0
    } else if (formData.cameraStain === 'major') {
      salesDeduction += deductionMap['camera_stain_major'] || 0
    }

    // NW制限減額
    if (formData.nwStatus === 'triangle') {
      salesDeduction += deductionMap['nw_triangle'] || 0
    } else if (formData.nwStatus === 'cross') {
      salesDeduction += deductionMap['nw_cross'] || 0
    }

    setCalculatedSalesPrice(salesBasePrice - salesDeduction)
  }, [salesBasePrice, salesDeductions, formData.batteryPercent, formData.isServiceState, formData.cameraStain, formData.nwStatus])

  // 修理原価計算
  useEffect(() => {
    if (!formData.needsRepair || formData.selectedRepairs.length === 0) {
      setFormData(prev => ({ ...prev, repairCost: 0 }))
      return
    }

    let totalCost = 0
    formData.selectedRepairs.forEach(repairKey => {
      const repairType = repairTypes.find(r => r.key === repairKey)
      if (repairType) {
        const costData = partsCosts.find(c => c.parts_type === repairType.partsType)
        if (costData) {
          totalCost += costData.cost
        }
      }
    })

    setFormData(prev => ({ ...prev, repairCost: totalCost }))
  }, [formData.selectedRepairs, formData.needsRepair, partsCosts])

  // 修理種別の選択ハンドラ
  const handleRepairSelect = (repairKey: string) => {
    const repair = repairTypes.find(r => r.key === repairKey)
    if (!repair) return

    setFormData(prev => {
      let newSelected = [...prev.selectedRepairs]

      if (newSelected.includes(repairKey)) {
        // 選択解除
        newSelected = newSelected.filter(k => k !== repairKey)
      } else {
        // 選択追加
        // 排他チェック
        if (repair.exclusive) {
          newSelected = newSelected.filter(k => k !== repair.exclusive)
        }
        newSelected.push(repairKey)
      }

      return { ...prev, selectedRepairs: newSelected }
    })
  }

  // パーツ原価を取得するヘルパー
  const getPartsCost = (partsType: string): number => {
    const cost = partsCosts.find(c => c.parts_type === partsType)
    return cost?.cost || 0
  }

  // 減額金額を取得するヘルパー
  const getDeductionAmount = (type: string): number => {
    const d = deductions.find(d => d.deduction_type === type)
    return d?.amount || 0
  }

  // IMEI バリデーション
  const validateImei = (imei: string): boolean => {
    return /^\d{15}$/.test(imei)
  }

  // 管理番号を取得（IMEI下4桁）
  const getManagementNumber = (imei: string): string => {
    if (imei.length >= 4) {
      return imei.slice(-4)
    }
    return ''
  }

  // 買取登録
  const saveBuyback = async () => {
    // バリデーション
    if (!formData.shopId || !formData.staffId || !formData.model || !formData.storage || !formData.rank) {
      alert('必須項目を入力してください')
      return
    }

    if (!formData.imei || !validateImei(formData.imei)) {
      alert('IMEIは15桁の数字で入力してください')
      return
    }

    if (!formData.batteryPercent || parseInt(formData.batteryPercent) < 0 || parseInt(formData.batteryPercent) > 100) {
      alert('バッテリー残量は0〜100の数値で入力してください')
      return
    }

    setSaving(true)

    const managementNumber = getManagementNumber(formData.imei)
    const batteryPercent = parseInt(formData.batteryPercent)
    const batteryStatus = formData.isServiceState ? '79' : (batteryPercent >= 90 ? '90' : (batteryPercent >= 80 ? '80-89' : '79'))
    const repairTypesStr = formData.selectedRepairs.join(',')

    // 買取データ保存
    const { data: buybackData, error: buybackError } = await supabase
      .from('t_buyback')
      .insert({
        tenant_id: 1,
        shop_id: parseInt(formData.shopId),
        staff_id: parseInt(formData.staffId),
        buyback_date: formData.buybackDate,
        model: formData.model,
        storage: parseInt(formData.storage),
        rank: formData.rank,
        imei: formData.imei,
        management_number: managementNumber,
        battery_percent: batteryPercent,
        battery_status: batteryStatus,
        is_service_state: formData.isServiceState,
        nw_status: formData.nwStatus,
        camera_stain: formData.cameraStain !== 'none',
        camera_stain_level: formData.cameraStain,
        camera_broken: formData.cameraBreak,
        repair_history: formData.repairHistory,
        base_price: formData.basePrice,
        total_deduction: formData.deductionTotal,
        calculated_price: formData.calculatedPrice,
        guarantee_price: guaranteePrice,
        final_price: formData.finalPrice,
        needs_repair: formData.needsRepair,
        repair_types: repairTypesStr || null,
        repair_cost: formData.repairCost,
        memo: formData.memo || null,
      })
      .select('id')
      .single()

    if (buybackError) {
      alert('買取登録に失敗しました: ' + buybackError.message)
      setSaving(false)
      return
    }

    // 中古在庫に追加
    const { error: inventoryError } = await supabase
      .from('t_used_inventory')
      .insert({
        tenant_id: 1,
        shop_id: parseInt(formData.shopId),
        arrival_date: formData.buybackDate,
        buyback_id: buybackData.id,
        model: formData.model,
        storage: parseInt(formData.storage),
        rank: formData.rank,
        imei: formData.imei,
        management_number: managementNumber,
        battery_percent: batteryPercent,
        is_service_state: formData.isServiceState,
        nw_status: formData.nwStatus,
        camera_stain_level: formData.cameraStain,
        camera_broken: formData.cameraBreak,
        repair_history: formData.repairHistory,
        repair_types: repairTypesStr || null,
        buyback_price: formData.finalPrice,
        repair_cost: formData.repairCost,
        total_cost: formData.finalPrice + formData.repairCost,
        sales_price: calculatedSalesPrice,
        status: formData.needsRepair ? '修理中' : '販売可',
      })

    if (inventoryError) {
      alert('在庫登録に失敗しました: ' + inventoryError.message)
      setSaving(false)
      return
    }

    alert('買取を登録しました！')
    
    // フォームリセット
    setFormData({
      buybackDate: new Date().toISOString().split('T')[0],
      shopId: formData.shopId,
      staffId: formData.staffId,
      model: '',
      storage: '',
      rank: '',
      imei: '',
      batteryPercent: '',
      isServiceState: false,
      nwStatus: 'ok',
      cameraStain: 'none',
      cameraBreak: false,
      repairHistory: false,
      basePrice: 0,
      deductionTotal: 0,
      calculatedPrice: 0,
      finalPrice: 0,
      needsRepair: false,
      selectedRepairs: [],
      repairCost: 0,
      memo: '',
    })
    setDeductions([])
    setPartsCosts([])
    setGuaranteePrice(0)
    setAvailableStorages([])
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="loading" style={{ height: '100vh' }}>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      {/* ページヘッダー */}
      <div className="page-header">
        <h1 className="page-title">買取入力</h1>
        <p className="page-subtitle">中古iPhoneの買取情報を入力します</p>
      </div>

      {/* 基本情報 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">基本情報</h2>
        </div>
        <div className="card-body">
          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label className="form-label form-label-required">買取日</label>
              <input
                type="date"
                value={formData.buybackDate}
                onChange={(e) => setFormData({ ...formData, buybackDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">店舗</label>
              <select
                value={formData.shopId}
                onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                className="form-select"
              >
                <option value="">選択してください</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">担当者</label>
              <select
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                className="form-select"
              >
                <option value="">選択してください</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 商品情報 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">商品情報</h2>
        </div>
        <div className="card-body">
          <div className="form-grid form-grid-4">
            <div className="form-group">
              <label className="form-label form-label-required">機種</label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  model: e.target.value, 
                  storage: '',
                  basePrice: 0, 
                  finalPrice: 0, 
                  calculatedPrice: 0,
                  deductionTotal: 0,
                  selectedRepairs: [],
                  repairCost: 0,
                })}
                className="form-select"
              >
                <option value="">選択してください</option>
                {iphoneModels.map((m) => (
                  <option key={m.model} value={m.model}>{m.display_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">容量</label>
              <select
                value={formData.storage}
                onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                className="form-select"
                disabled={!formData.model}
              >
                <option value="">選択してください</option>
                {availableStorages.map((storage) => (
                  <option key={storage} value={storage}>{storage === 1024 ? '1TB' : `${storage}GB`}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">ランク</label>
              <select
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                className="form-select"
              >
                <option value="">選択してください</option>
                {rankOptions.map((rank) => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">IMEI</label>
              <input
                type="text"
                value={formData.imei}
                onChange={(e) => setFormData({ ...formData, imei: e.target.value.replace(/\D/g, '').slice(0, 15) })}
                className="form-input"
                placeholder="15桁の数字"
                maxLength={15}
              />
              {formData.imei && formData.imei.length >= 4 && (
                <p className="form-hint">管理番号: {getManagementNumber(formData.imei)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 状態チェック */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">状態チェック</h2>
        </div>
        <div className="card-body">
          <div className="form-grid form-grid-3 mb-md">
            <div className="form-group">
              <label className="form-label form-label-required">バッテリー残量 (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.batteryPercent}
                onChange={(e) => setFormData({ ...formData, batteryPercent: e.target.value })}
                className="form-input"
                placeholder="0〜100"
                disabled={formData.isServiceState}
              />
              {formData.batteryPercent && !formData.isServiceState && (
                <p className="form-hint">
                  {parseInt(formData.batteryPercent) >= 90 ? '減額なし' : 
                   parseInt(formData.batteryPercent) >= 80 ? `減額: -¥${getDeductionAmount('battery_80_89').toLocaleString()}` :
                   `減額: -¥${getDeductionAmount('battery_79').toLocaleString()}`}
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">NW制限</label>
              <select
                value={formData.nwStatus}
                onChange={(e) => setFormData({ ...formData, nwStatus: e.target.value })}
                className="form-select"
              >
                <option value="ok">○（制限なし）</option>
                <option value="triangle">△{getDeductionAmount('nw_checking') > 0 && `（-¥${getDeductionAmount('nw_checking').toLocaleString()}）`}</option>
                <option value="cross">×{getDeductionAmount('nw_ng') > 0 && `（-¥${getDeductionAmount('nw_ng').toLocaleString()}）`}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">カメラ染み</label>
              <select
                value={formData.cameraStain}
                onChange={(e) => setFormData({ ...formData, cameraStain: e.target.value })}
                className="form-select"
              >
                <option value="none">なし</option>
                <option value="minor">少{getDeductionAmount('camera_stain_minor') > 0 && `（-¥${getDeductionAmount('camera_stain_minor').toLocaleString()}）`}</option>
                <option value="major">多{getDeductionAmount('camera_stain_major') > 0 && `（-¥${getDeductionAmount('camera_stain_major').toLocaleString()}）`}</option>
              </select>
            </div>
          </div>

          {/* チェックボックス */}
          <div className="flex flex-wrap gap-md">
            <label className="form-check">
              <input
                type="checkbox"
                checked={formData.isServiceState}
                onChange={(e) => setFormData({ ...formData, isServiceState: e.target.checked })}
              />
              <span>サービス状態{getDeductionAmount('battery_79') > 0 && `（-¥${getDeductionAmount('battery_79').toLocaleString()}）`}</span>
            </label>
            <label className="form-check">
              <input
                type="checkbox"
                checked={formData.cameraBreak}
                onChange={(e) => setFormData({ ...formData, cameraBreak: e.target.checked })}
              />
              <span>カメラ窓破損{getDeductionAmount('camera_broken') > 0 && `（-¥${getDeductionAmount('camera_broken').toLocaleString()}）`}</span>
            </label>
            <label className="form-check">
              <input
                type="checkbox"
                checked={formData.repairHistory}
                onChange={(e) => setFormData({ ...formData, repairHistory: e.target.checked })}
              />
              <span>修理歴あり{getDeductionAmount('repair_history') > 0 && `（-¥${getDeductionAmount('repair_history').toLocaleString()}）`}</span>
            </label>
          </div>
        </div>
      </div>

      {/* 修理が必要 */}
      <div className="card mb-lg">
        <div className="card-header">
          <label className="form-check" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={formData.needsRepair}
              onChange={(e) => setFormData({ ...formData, needsRepair: e.target.checked, selectedRepairs: e.target.checked ? formData.selectedRepairs : [] })}
              style={{ width: '20px', height: '20px' }}
            />
            <span className="card-title" style={{ margin: 0 }}>修理が必要</span>
          </label>
        </div>

        {formData.needsRepair && (
          <div className="card-body">
            <p className="form-hint mb-md">必要な修理を選択してください（複数選択可）</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              {repairTypes.map((repair) => {
                const cost = getPartsCost(repair.partsType)
                const isSelected = formData.selectedRepairs.includes(repair.key)
                const isDisabled = !!(repair.exclusive && formData.selectedRepairs.includes(repair.exclusive))
                
                return (
                  <button
                    key={repair.key}
                    type="button"
                    onClick={() => !isDisabled && handleRepairSelect(repair.key)}
                    disabled={isDisabled}
                    style={{
                      padding: '16px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isDisabled
                        ? 'linear-gradient(135deg, #D1D5DB 0%, #E5E7EB 100%)'
                        : isSelected 
                          ? 'linear-gradient(135deg, #004AAD 0%, #0066CC 100%)' 
                          : 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
                      color: isDisabled ? '#9CA3AF' : 'white',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: isSelected 
                        ? '0 4px 12px rgba(0, 74, 173, 0.4)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.15)',
                      textAlign: 'left',
                    }}
                  >
                    <div>{repair.label}</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.9 }}>¥{cost.toLocaleString()}</div>
                  </button>
                )
              })}
            </div>

            {formData.selectedRepairs.length > 0 && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>選択した修理:</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {formData.selectedRepairs.map(key => {
                    const repair = repairTypes.find(r => r.key === key)
                    const cost = repair ? getPartsCost(repair.partsType) : 0
                    return (
                      <li key={key} className="flex justify-between" style={{ padding: '4px 0' }}>
                        <span>{repair?.label}</span>
                        <span>¥{cost.toLocaleString()}</span>
                      </li>
                    )
                  })}
                </ul>
                <div className="flex justify-between font-semibold" style={{ borderTop: '1px solid var(--color-border)', marginTop: '8px', paddingTop: '8px' }}>
                  <span>修理原価合計</span>
                  <span>¥{formData.repairCost.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 買取価格 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">買取価格</h2>
        </div>
        <div className="card-body">
          {/* 基本買取価格 */}
          <div className="flex justify-between items-center" style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
            <span className="text-secondary">基本買取価格</span>
            <span className="price">¥{formData.basePrice.toLocaleString()}</span>
          </div>

          {/* 減額合計 */}
          <div className="flex justify-between items-center" style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
            <span className="text-secondary">減額合計</span>
            <span className="price text-danger">-¥{formData.deductionTotal.toLocaleString()}</span>
          </div>

          {/* 計算後価格 */}
          <div className="flex justify-between items-center" style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
            <span className="text-secondary">計算後価格</span>
            <span className="price">¥{formData.calculatedPrice.toLocaleString()}</span>
          </div>

          {/* 最低保証価格 */}
          {guaranteePrice > 0 && (
            <div className="flex justify-between items-center" style={{ padding: '12px 16px', margin: '0 -24px', background: 'var(--color-warning-light)', borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-warning font-medium">最低保証価格</span>
              <span className="price text-warning">¥{guaranteePrice.toLocaleString()}</span>
            </div>
          )}

          {/* 最終買取価格 */}
          <div className="flex justify-between items-center" style={{ padding: '16px', margin: '12px -24px 0', background: 'var(--color-primary-light)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
            <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>最終買取価格</span>
            <span className="price price-lg" style={{ color: 'var(--color-primary)' }}>¥{formData.finalPrice.toLocaleString()}</span>
          </div>

          {/* 修理原価 */}
          {formData.needsRepair && formData.repairCost > 0 && (
            <>
              <div className="flex justify-between items-center" style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', marginTop: '16px' }}>
                <span className="text-secondary">修理原価</span>
                <span className="price">¥{formData.repairCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center" style={{ padding: '16px', margin: '12px -24px 0', background: 'var(--color-success-light)', borderRadius: 'var(--radius)' }}>
                <span className="font-semibold text-success">商品原価（買取価格+修理原価）</span>
                <span className="price price-lg text-success">¥{(formData.finalPrice + formData.repairCost).toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 販売予定価格・想定粗利 */}
      {calculatedSalesPrice > 0 && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="card-title">販売予定価格・想定粗利</h2>
          </div>
          <div className="card-body">
            {(() => {
              const totalCost = formData.finalPrice + formData.repairCost
              const expectedProfit = calculatedSalesPrice - totalCost
              const profitRate = calculatedSalesPrice > 0 ? (expectedProfit / calculatedSalesPrice * 100) : 0
              const salesPriceTaxIncluded = Math.floor(calculatedSalesPrice * 1.1)
              
              return (
                <>
                  {/* 販売予定価格 */}
                  <div className="flex justify-between items-center" style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span className="text-secondary">販売予定価格</span>
                    <div style={{ textAlign: 'right' }}>
                      <div className="price">¥{salesPriceTaxIncluded.toLocaleString()}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>税抜 ¥{calculatedSalesPrice.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* 商品原価 */}
                  <div className="flex justify-between items-center" style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span className="text-secondary">商品原価（税抜）</span>
                    <span className="price">¥{totalCost.toLocaleString()}</span>
                  </div>

                  {/* 想定粗利 */}
                  <div className="flex justify-between items-center" style={{ padding: '16px', margin: '12px -24px 0', background: expectedProfit >= 0 ? 'var(--color-success-light)' : 'var(--color-danger-light)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
                    <span className="font-semibold" style={{ color: expectedProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>想定粗利</span>
                    <div style={{ textAlign: 'right' }}>
                      <span className="price price-lg" style={{ color: expectedProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        ¥{expectedProfit.toLocaleString()}
                      </span>
                      <div style={{ fontSize: '0.85rem', color: expectedProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: '600' }}>
                        利益率 {profitRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* メモ */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">メモ</h2>
        </div>
        <div className="card-body">
          <textarea
            value={formData.memo}
            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
            rows={3}
            className="form-textarea"
            placeholder="特記事項があれば入力"
          />
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <button
          onClick={saveBuyback}
          disabled={saving}
          className="btn btn-success btn-lg"
        >
          {saving ? '保存中...' : '買取を登録'}
        </button>
      </div>
    </div>
  )
}