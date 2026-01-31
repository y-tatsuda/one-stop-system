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

type VisitSource = {
  id: number
  name: string
}

type AndroidModel = {
  model: string
}

type Accessory = {
  id: number
  name: string
  variation: string | null
  price: number
  cost: number
  category_name: string
}

type UsedInventory = {
  id: number
  model: string
  storage: number
  rank: string
  sales_price: number
  total_cost: number
  management_number: string | null
}

type Supplier = {
  id: number
  code: string
  name: string
}

type SalesDetail = {
  id: string
  category: string
  subCategory: string
  model: string
  menu: string
  storage: number | null
  rank: string | null
  accessoryId: number | null
  usedInventoryId: number | null
  supplierId: number | null
  quantity: number
  unitPrice: number
  unitCost: number
  amount: number
  cost: number
  profit: number
}

// Android修理メニュー（固定）
const androidRepairMenus = [
  { value: 'パネル', label: 'パネル' },
  { value: 'バッテリー', label: 'バッテリー' },
]

// 色の区別があるモデル（白パネル/黒パネルが別々に存在）
const MODELS_WITH_COLOR = ['SE', '6s', '7', '7P', '8', '8P']

// HGパネルがないモデル
const MODELS_WITHOUT_HG = ['SE', '6s', '7', '7P']

// パネル修理メニュー（TH/HGを含むメニュー）
const PANEL_REPAIR_TYPES = ['TH-F', 'TH-L', 'HG-F', 'HG-L']

// 修理メニューの並び順（この順番でプルダウンに表示）
const REPAIR_TYPE_ORDER = [
  'TH-F', 'TH-L', 'HG-F', 'HG-L',
  'バッテリー', 'HGバッテリー',
  'コネクタ', 'リアカメラ', 'インカメラ', 'カメラ窓'
]

// 修理メニューの表示名を取得（そのまま表示）
const getRepairTypeLabel = (repairType: string): string => {
  return repairType
}

// モデルに応じてメニューをフィルター（HGなしモデルはHGを除外）
const getFilteredRepairMenus = (menus: string[], model?: string): string[] => {
  if (!model) return menus
  const hasHG = !MODELS_WITHOUT_HG.includes(model)
  if (hasHG) return menus
  // HGなしモデルの場合、HG系メニューを除外
  return menus.filter(menu => !menu.startsWith('HG'))
}

// 修理種別(TH-F等)とパネル色からパーツ種別(TH-白等)を取得
const getPartsType = (repairType: string, panelColor: string, model: string): string => {
  const hasColor = MODELS_WITH_COLOR.includes(model)

  // パネル修理の場合
  if (repairType === 'TH-F' || repairType === 'TH-L') {
    return hasColor ? `TH-${panelColor}` : 'TH'
  }
  if (repairType === 'HG-F' || repairType === 'HG-L') {
    return hasColor ? `HG-${panelColor}` : 'HG'
  }

  // その他のパーツはそのまま
  return repairType
}

// メニュー表示文字列からパーツ種別を取得（例: "TH-F(黒)" → "TH-黒"）
const getPartsTypeFromMenuDisplay = (menuDisplay: string, model: string): string => {
  // 括弧内の色を抽出
  const colorMatch = menuDisplay.match(/\((白|黒)\)$/)
  const color = colorMatch ? colorMatch[1] : ''

  // 括弧を除去して修理種別を取得
  const repairType = menuDisplay.replace(/\((白|黒)\)$/, '')

  return getPartsType(repairType, color, model)
}

// パーツを使用する修理メニューか判定（作業費系・フィルム系は除外）
const isPartsRepairMenu = (menu: string): boolean => {
  const baseMenu = menu.replace(/\((白|黒)\)$/, '')
  const partsMenus = [
    'TH-F', 'TH-L', 'HG-F', 'HG-L',
    'バッテリー', 'HGバッテリー',
    'コネクタ', 'リアカメラ', 'インカメラ', 'カメラ窓'
  ]
  return partsMenus.includes(baseMenu)
}

// データ移行メニュー（固定価格）
const dataMigrationMenus = [
  { value: 'データ移行', label: 'データ移行', price: 3000 },
  { value: 'データ移行α', label: 'データ移行α', price: 5000 },
]

// 操作案内メニュー（固定価格）
const operationGuideMenus = [
  { value: '個別10分', label: '個別10分', price: 1000 },
  { value: '個別20分', label: '個別20分', price: 2000 },
  { value: '個別30分', label: '個別30分', price: 3000 },
  { value: '個別60分', label: '個別60分', price: 5000 },
]

export default function SalesPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [visitSources, setVisitSources] = useState<VisitSource[]>([])
  const [androidModels, setAndroidModels] = useState<AndroidModel[]>([])
  const [accessories, setAccessories] = useState<Accessory[]>([])
  const [usedInventory, setUsedInventory] = useState<UsedInventory[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [details, setDetails] = useState<SalesDetail[]>([])

  // 【新規】iPhone機種リスト（機種マスタから取得）
  const [iphoneModels, setIphoneModels] = useState<{model: string, display_name: string}[]>([])
  // 【新規】iPhone修理メニュー（DBから取得）
  const [iphoneRepairMenus, setIphoneRepairMenus] = useState<string[]>([])

  // フォームの状態
  const [formData, setFormData] = useState({
    saleDate: new Date().toISOString().split('T')[0],
    shopId: '',
    staffId: '',
    visitSourceId: '',
  })

  // iPhone修理フォーム
  const [iphoneForm, setIphoneForm] = useState({
    model: '',
    menu: '',
    panelColor: '', // パネル色（白/黒）- 色区別モデルのパネル修理時のみ使用
    supplierId: '',
    unitPrice: 0,
    unitCost: 0,
  })

  // Android修理フォーム
  const [androidForm, setAndroidForm] = useState({
    model: '',
    menu: '',
    unitPrice: 0,
    unitCost: 0,
  })

  // 中古販売フォーム（減額対応版）
  const [usedSalesForm, setUsedSalesForm] = useState({
    inventoryId: '',
    searchNumber: '',
    basePrice: 0,      // 基準価格（マスタから取得）
    batteryStatus: '90',   // '90' | '80_89' | '79'
    cameraStain: 'none',   // 'none' | 'minor' | 'major'
    nwStatus: 'ok',        // 'ok' | 'triangle' | 'cross'
    deductionTotal: 0,     // 減額合計
    unitPrice: 0,          // 最終販売価格
    unitCost: 0,           // 原価
  })

// 販売価格減額マスタ
const [salesDeductionMaster, setSalesDeductionMaster] = useState<{deduction_type: string, amount: number}[]>([])

  // アクセサリフォーム
  const [accessoryForm, setAccessoryForm] = useState({
    accessoryId: '',
    quantity: 1,
    unitPrice: 0,
    unitCost: 0,
  })

  // データ移行フォーム
  const [dataMigrationForm, setDataMigrationForm] = useState({
    menu: '',
    unitPrice: 0,
  })

  // 操作案内フォーム
  const [operationGuideForm, setOperationGuideForm] = useState({
    menu: '',
    unitPrice: 0,
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

      const { data: visitSourcesData } = await supabase
        .from('m_visit_sources')
        .select('id, name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('sort_order')

      // Android機種取得（ユニークなモデル名）
      const { data: androidData } = await supabase
        .from('m_repair_prices_android')
        .select('model')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('model')

      // 重複削除
      const uniqueAndroid = androidData
        ? [...new Set(androidData.map(d => d.model))].map(model => ({ model }))
        : []

      // アクセサリ取得
      const { data: accessoriesData } = await supabase
        .from('m_accessories')
        .select('id, name, variation, price, cost, category_name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('category_name')
        .order('name')

      // 【新規】iPhone機種リストを機種マスタから取得
      const { data: iphoneModelsData } = await supabase
        .from('m_iphone_models')
        .select('model, display_name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('sort_order')

      // 【新規】iPhone修理メニューをDBから取得
      const { data: iphoneMenusData } = await supabase
        .from('m_repair_prices_iphone')
        .select('repair_type')
        .eq('tenant_id', 1)
        .eq('is_active', true)

      // 重複削除して順序を調整（REPAIR_TYPE_ORDER定数を使用）
      const uniqueIphoneMenus = iphoneMenusData
        ? [...new Set(iphoneMenusData.map(d => d.repair_type))]
            .sort((a, b) => {
              const indexA = REPAIR_TYPE_ORDER.indexOf(a)
              const indexB = REPAIR_TYPE_ORDER.indexOf(b)
              if (indexA === -1 && indexB === -1) return a.localeCompare(b)
              if (indexA === -1) return 1
              if (indexB === -1) return -1
              return indexA - indexB
            })
        : []

      // 仕入先マスタ取得
      const { data: suppliersData } = await supabase
        .from('m_suppliers')
        .select('id, code, name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('sort_order')

      setShops(shopsData || [])
      setStaff(staffData || [])
      setVisitSources(visitSourcesData || [])
      setAndroidModels(uniqueAndroid)
      setAccessories(accessoriesData || [])
      setIphoneModels(iphoneModelsData || [])
      setIphoneRepairMenus(uniqueIphoneMenus)
      setSuppliers(suppliersData || [])
      setLoading(false)
    }

    fetchMasterData()
  }, [])

  // 中古在庫取得（店舗選択時）
  useEffect(() => {
    async function fetchUsedInventory() {
      if (!formData.shopId) {
        setUsedInventory([])
        return
      }

      const { data } = await supabase
        .from('t_used_inventory')
        .select('id, model, storage, rank, sales_price, total_cost, management_number')
        .eq('tenant_id', 1)
        .eq('shop_id', formData.shopId)
        .eq('status', '販売可')
        .order('model')

      setUsedInventory(data || [])
    }

    fetchUsedInventory()
  }, [formData.shopId])

  // iPhone価格取得（仕入先対応版）
  useEffect(() => {
    async function fetchIphonePrice() {
      if (!iphoneForm.model || !iphoneForm.menu) return

      // パネル修理で色区別モデルの場合、色が未選択なら価格取得しない
      const isPanelRepair = PANEL_REPAIR_TYPES.includes(iphoneForm.menu)
      const needsColor = isPanelRepair && MODELS_WITH_COLOR.includes(iphoneForm.model)
      if (needsColor && !iphoneForm.panelColor) {
        setIphoneForm(prev => ({ ...prev, unitPrice: 0, unitCost: 0 }))
        return
      }

      // 修理価格取得（仕入先によらず共通）
      const { data } = await supabase
        .from('m_repair_prices_iphone')
        .select('price')
        .eq('tenant_id', 1)
        .eq('model', iphoneForm.model)
        .eq('repair_type', iphoneForm.menu)
        .single()

      // パーツ種別を決定（修理種別 + パネル色 → パーツ種別）
      const partsType = getPartsType(iphoneForm.menu, iphoneForm.panelColor, iphoneForm.model)

      // パーツ原価取得（仕入先別）
      let costQuery = supabase
        .from('m_costs_hw')
        .select('cost')
        .eq('tenant_id', 1)
        .eq('model', iphoneForm.model)
        .eq('parts_type', partsType)

      // 仕入先が選択されている場合はその仕入先の原価を取得
      if (iphoneForm.supplierId) {
        costQuery = costQuery.eq('supplier_id', parseInt(iphoneForm.supplierId))
      }

      const { data: costData } = await costQuery.single()

      setIphoneForm(prev => ({
        ...prev,
        unitPrice: data?.price || 0,
        unitCost: costData?.cost || 0,
      }))
    }
    fetchIphonePrice()
  }, [iphoneForm.model, iphoneForm.menu, iphoneForm.panelColor, iphoneForm.supplierId])

  // Android価格取得
  useEffect(() => {
    async function fetchAndroidPrice() {
      if (androidForm.model && androidForm.menu) {
        const { data } = await supabase
          .from('m_repair_prices_android')
          .select('price')
          .eq('tenant_id', 1)
          .eq('model', androidForm.model)
          .eq('repair_type', androidForm.menu)
          .single()

        const { data: costData } = await supabase
          .from('m_costs_android')
          .select('cost')
          .eq('tenant_id', 1)
          .eq('model', androidForm.model)
          .eq('parts_type', androidForm.menu)
          .single()

        setAndroidForm(prev => ({
          ...prev,
          unitPrice: data?.price || 0,
          unitCost: costData?.cost || 0,
        }))
      }
    }
    fetchAndroidPrice()
  }, [androidForm.model, androidForm.menu])

  // 中古在庫選択時（基準価格と減額マスタを取得）
  useEffect(() => {
    async function fetchSalesData() {
      if (!usedSalesForm.inventoryId) {
        setSalesDeductionMaster([])
        return
      }

      const inventory = usedInventory.find(i => i.id === parseInt(usedSalesForm.inventoryId))
      if (!inventory) return

      // 基準価格を取得（m_sales_pricesから）
      const { data: priceData } = await supabase
        .from('m_sales_prices')
        .select('price')
        .eq('tenant_id', 1)
        .eq('model', inventory.model)
        .eq('storage', inventory.storage)
        .eq('rank', inventory.rank)
        .single()

      const basePrice = priceData?.price || inventory.sales_price || 0

      // 減額マスタを取得
      const { data: deductionData } = await supabase
        .from('m_sales_price_deductions')
        .select('deduction_type, amount')
        .eq('tenant_id', 1)
        .eq('model', inventory.model)
        .eq('is_active', true)

      setSalesDeductionMaster(deductionData || [])

      setUsedSalesForm(prev => ({
        ...prev,
        basePrice,
        unitPrice: basePrice,
        unitCost: inventory.total_cost || 0,
        batteryStatus: '90',
        cameraStain: 'none',
        nwStatus: 'ok',
        deductionTotal: 0,
      }))
    }
    fetchSalesData()
  }, [usedSalesForm.inventoryId, usedInventory])

  // 販売価格の減額計算
    useEffect(() => {
    if (salesDeductionMaster.length === 0 || !usedSalesForm.basePrice) return

    const getDeduction = (type: string): number => {
      const found = salesDeductionMaster.find(d => d.deduction_type === type)
      return found?.amount || 0
    }

    let total = 0

    // バッテリー減額
    if (usedSalesForm.batteryStatus === '80_89') {
      total += getDeduction('battery_80_89')
    } else if (usedSalesForm.batteryStatus === '79') {
      total += getDeduction('battery_79')
    }

    // カメラ染み減額
    if (usedSalesForm.cameraStain === 'minor') {
      total += getDeduction('camera_stain_minor')
    } else if (usedSalesForm.cameraStain === 'major') {
      total += getDeduction('camera_stain_major')
    }

    // NW制限減額
    if (usedSalesForm.nwStatus === 'triangle') {
      total += getDeduction('nw_triangle')
    } else if (usedSalesForm.nwStatus === 'cross') {
      total += getDeduction('nw_cross')
    }

    setUsedSalesForm(prev => ({
      ...prev,
      deductionTotal: total,
      unitPrice: prev.basePrice - total,
    }))
  }, [usedSalesForm.batteryStatus, usedSalesForm.cameraStain, usedSalesForm.nwStatus, usedSalesForm.basePrice, salesDeductionMaster])

  // アクセサリ選択時
  useEffect(() => {
    if (accessoryForm.accessoryId) {
      const accessory = accessories.find(a => a.id === parseInt(accessoryForm.accessoryId))
      if (accessory) {
        setAccessoryForm(prev => ({
          ...prev,
          unitPrice: accessory.price || 0,
          unitCost: accessory.cost || 0,
        }))
      }
    }
  }, [accessoryForm.accessoryId, accessories])

  // データ移行価格取得（固定価格から取得）
  useEffect(() => {
    if (dataMigrationForm.menu) {
      const menuItem = dataMigrationMenus.find(m => m.value === dataMigrationForm.menu)
      setDataMigrationForm(prev => ({
        ...prev,
        unitPrice: menuItem?.price || 0,
      }))
    }
  }, [dataMigrationForm.menu])

  // 操作案内価格取得（固定価格から取得）
  useEffect(() => {
    if (operationGuideForm.menu) {
      const menuItem = operationGuideMenus.find(m => m.value === operationGuideForm.menu)
      setOperationGuideForm(prev => ({
        ...prev,
        unitPrice: menuItem?.price || 0,
      }))
    }
  }, [operationGuideForm.menu])

  // iPhone修理追加
  const addIphoneDetail = () => {
    if (!iphoneForm.model || !iphoneForm.menu) {
      alert('機種とメニューを選択してください')
      return
    }

    // パネル修理で色区別モデルの場合、色が必須
    const isPanelRepair = PANEL_REPAIR_TYPES.includes(iphoneForm.menu)
    const needsColor = isPanelRepair && MODELS_WITH_COLOR.includes(iphoneForm.model)
    if (needsColor && !iphoneForm.panelColor) {
      alert('パネル色を選択してください')
      return
    }

    const amount = iphoneForm.unitPrice
    const cost = iphoneForm.unitCost
    const profit = amount - cost

    // メニュー表示名（色区別モデルのパネル修理の場合は色を追加）
    let menuDisplay = getRepairTypeLabel(iphoneForm.menu)
    if (needsColor && iphoneForm.panelColor) {
      menuDisplay = `${menuDisplay}(${iphoneForm.panelColor})`
    }

    const newDetail: SalesDetail = {
      id: Date.now().toString(),
      category: 'iPhone修理',
      subCategory: 'iPhone修理',
      model: iphoneForm.model,
      menu: menuDisplay,
      storage: null,
      rank: null,
      accessoryId: null,
      usedInventoryId: null,
      supplierId: iphoneForm.supplierId ? parseInt(iphoneForm.supplierId) : null,
      quantity: 1,
      unitPrice: iphoneForm.unitPrice,
      unitCost: iphoneForm.unitCost,
      amount,
      cost,
      profit,
    }
    setDetails([...details, newDetail])
    setIphoneForm({ model: '', menu: '', panelColor: '', supplierId: '', unitPrice: 0, unitCost: 0 })
  }

  // Android修理追加
  const addAndroidDetail = () => {
    if (!androidForm.model || !androidForm.menu) {
      alert('機種とメニューを選択してください')
      return
    }
    const amount = androidForm.unitPrice
    const cost = androidForm.unitCost
    const profit = amount - cost
    const newDetail: SalesDetail = {
      id: Date.now().toString(),
      category: 'Android修理',
      subCategory: 'Android修理',
      model: androidForm.model,
      menu: androidForm.menu,
      storage: null,
      rank: null,
      accessoryId: null,
      usedInventoryId: null,
      supplierId: null,
      quantity: 1,
      unitPrice: androidForm.unitPrice,
      unitCost: androidForm.unitCost,
      amount,
      cost,
      profit,
    }
    setDetails([...details, newDetail])
    setAndroidForm({ model: '', menu: '', unitPrice: 0, unitCost: 0 })
  }

  // 中古販売追加
  const addUsedSalesDetail = () => {
    if (!usedSalesForm.inventoryId) {
      alert('在庫を選択してください')
      return
    }
    const inventory = usedInventory.find(i => i.id === parseInt(usedSalesForm.inventoryId))
    if (!inventory) return

    const amount = usedSalesForm.unitPrice
    const cost = usedSalesForm.unitCost
    const profit = amount - cost
    const newDetail: SalesDetail = {
      id: Date.now().toString(),
      category: '中古販売',
      subCategory: '中古販売',
      model: inventory.model,
      menu: `${inventory.storage}GB ${inventory.rank}`,
      storage: inventory.storage,
      rank: inventory.rank,
      accessoryId: null,
      usedInventoryId: inventory.id,
      supplierId: null,
      quantity: 1,
      unitPrice: usedSalesForm.unitPrice,
      unitCost: usedSalesForm.unitCost,
      amount,
      cost,
      profit,
    }
    setDetails([...details, newDetail])
    setUsedSalesForm({
      inventoryId: '',
      searchNumber: '',
      basePrice: 0,
      batteryStatus: '90',
      cameraStain: 'none',
      nwStatus: 'ok',
      deductionTotal: 0,
      unitPrice: 0,
      unitCost: 0,
    })
    setSalesDeductionMaster([])
  }

  // アクセサリ追加
  const addAccessoryDetail = () => {
    if (!accessoryForm.accessoryId) {
      alert('アクセサリを選択してください')
      return
    }
    const accessory = accessories.find(a => a.id === parseInt(accessoryForm.accessoryId))
    if (!accessory) return

    const quantity = accessoryForm.quantity
    const amount = accessoryForm.unitPrice * quantity
    const cost = accessoryForm.unitCost * quantity
    const profit = amount - cost
    const newDetail: SalesDetail = {
      id: Date.now().toString(),
      category: 'アクセサリ',
      subCategory: accessory.category_name,
      model: accessory.name,
      menu: accessory.variation || '',
      storage: null,
      rank: null,
      accessoryId: accessory.id,
      usedInventoryId: null,
      supplierId: null,
      quantity,
      unitPrice: accessoryForm.unitPrice,
      unitCost: accessoryForm.unitCost,
      amount,
      cost,
      profit,
    }
    setDetails([...details, newDetail])
    setAccessoryForm({ accessoryId: '', quantity: 1, unitPrice: 0, unitCost: 0 })
  }

  // データ移行追加
  const addDataMigrationDetail = () => {
    if (!dataMigrationForm.menu) {
      alert('メニューを選択してください')
      return
    }
    const menuItem = dataMigrationMenus.find(m => m.value === dataMigrationForm.menu)
    const amount = dataMigrationForm.unitPrice
    const profit = amount
    const newDetail: SalesDetail = {
      id: Date.now().toString(),
      category: 'データ移行',
      subCategory: 'データ移行',
      model: '',
      menu: menuItem?.label || dataMigrationForm.menu,
      storage: null,
      rank: null,
      accessoryId: null,
      usedInventoryId: null,
      supplierId: null,
      quantity: 1,
      unitPrice: dataMigrationForm.unitPrice,
      unitCost: 0,
      amount,
      cost: 0,
      profit,
    }
    setDetails([...details, newDetail])
    setDataMigrationForm({ menu: '', unitPrice: 0 })
  }

  // 操作案内追加
  const addOperationGuideDetail = () => {
    if (!operationGuideForm.menu) {
      alert('メニューを選択してください')
      return
    }
    const menuItem = operationGuideMenus.find(m => m.value === operationGuideForm.menu)
    const amount = operationGuideForm.unitPrice
    const profit = amount
    const newDetail: SalesDetail = {
      id: Date.now().toString(),
      category: '操作案内',
      subCategory: '操作案内',
      model: '',
      menu: menuItem?.label || operationGuideForm.menu,
      storage: null,
      rank: null,
      accessoryId: null,
      usedInventoryId: null,
      supplierId: null,
      quantity: 1,
      unitPrice: operationGuideForm.unitPrice,
      unitCost: 0,
      amount,
      cost: 0,
      profit,
    }
    setDetails([...details, newDetail])
    setOperationGuideForm({ menu: '', unitPrice: 0 })
  }

  // 明細削除
  const removeDetail = (id: string) => {
    setDetails(details.filter(d => d.id !== id))
  }

  // 合計計算
  const totalAmount = details.reduce((sum, d) => sum + d.amount, 0)
  const totalCost = details.reduce((sum, d) => sum + d.cost, 0)
  const totalProfit = details.reduce((sum, d) => sum + d.profit, 0)

  // 売上登録
  const handleSubmit = async () => {
    if (!formData.shopId || !formData.staffId) {
      alert('店舗と担当者を選択してください')
      return
    }
    if (details.length === 0) {
      alert('明細を追加してください')
      return
    }

    // トランザクションヘッダー作成
    const { data: headerData, error: headerError } = await supabase
      .from('t_sales')
      .insert({
        tenant_id: 1,
        shop_id: parseInt(formData.shopId),
        staff_id: parseInt(formData.staffId),
        visit_source_id: formData.visitSourceId ? parseInt(formData.visitSourceId) : null,
        sale_date: formData.saleDate,
        total_amount: totalAmount,
        total_cost: totalCost,
        total_profit: totalProfit,
      })
      .select('id')
      .single()

    if (headerError) {
      alert('売上登録に失敗しました: ' + headerError.message)
      return
    }

    // 明細登録
    const detailRecords = details.map(d => ({
      sales_id: headerData.id,
      category: d.category,
      sub_category: d.subCategory,
      model: d.model,
      menu: d.menu,
      storage: d.storage,
      rank: d.rank,
      accessory_id: d.accessoryId,
      used_inventory_id: d.usedInventoryId,
      supplier_id: d.supplierId,
      quantity: d.quantity,
      unit_price: d.unitPrice,
      unit_cost: d.unitCost,
      amount: d.amount,
      cost: d.cost,
      profit: d.profit,
    }))

    const { error: detailError } = await supabase
      .from('t_sales_details')
      .insert(detailRecords)

    if (detailError) {
      alert('明細登録に失敗しました: ' + detailError.message)
      return
    }

    // 中古在庫のステータス更新
    for (const detail of details) {
      if (detail.usedInventoryId) {
        const { error: updateError } = await supabase
          .from('t_used_inventory')
          .update({ status: '販売済' })
          .eq('id', detail.usedInventoryId)

        if (updateError) {
          console.error('在庫ステータス更新エラー:', updateError)
          alert('売上は登録されましたが、在庫ステータスの更新に失敗しました。\n中古在庫管理画面で手動でステータスを「販売済」に変更してください。')
          setDetails([])
          setSelectedCategory('')
          return
        }
      }
    }

    // iPhone修理のパーツ在庫を減算
    for (const detail of details) {
      if (detail.category === 'iPhone修理' && detail.model && detail.menu && detail.supplierId) {
        // パーツを使用する修理メニューのみ在庫を減算
        if (!isPartsRepairMenu(detail.menu)) {
          continue
        }

        // メニュー表示からパーツ種別を取得
        const partsType = getPartsTypeFromMenuDisplay(detail.menu, detail.model)

        // 在庫レコードを取得して減算
        const { data: invData, error: invFetchError } = await supabase
          .from('t_parts_inventory')
          .select('id, actual_qty')
          .eq('tenant_id', 1)
          .eq('shop_id', parseInt(formData.shopId))
          .eq('model', detail.model)
          .eq('parts_type', partsType)
          .eq('supplier_id', detail.supplierId)
          .single()

        if (invFetchError) {
          console.error('パーツ在庫取得エラー:', invFetchError, { model: detail.model, partsType, supplierId: detail.supplierId })
          // 在庫が見つからなくても売上登録は完了しているのでエラーにはしない
          continue
        }

        if (invData) {
          const newQty = Math.max(0, (invData.actual_qty || 0) - detail.quantity)
          const { error: invUpdateError } = await supabase
            .from('t_parts_inventory')
            .update({ actual_qty: newQty })
            .eq('id', invData.id)

          if (invUpdateError) {
            console.error('パーツ在庫更新エラー:', invUpdateError)
          }
        }
      }
    }

    alert('売上を登録しました')
    // フォームリセット
    setDetails([])
    setSelectedCategory('')
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">売上入力</h1>
      </div>

      {/* 基本情報 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">基本情報</h2>
        </div>
        <div className="card-body">
          <div className="form-grid form-grid-4">
            <div className="form-group">
              <label className="form-label">売上日</label>
              <input
                type="date"
                value={formData.saleDate}
                onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">店舗</label>
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
              <label className="form-label">担当者</label>
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
            <div className="form-group">
              <label className="form-label">来店経路</label>
              <select
                value={formData.visitSourceId}
                onChange={(e) => setFormData({ ...formData, visitSourceId: e.target.value })}
                className="form-select"
              >
                <option value="">選択してください</option>
                {visitSources.map((vs) => (
                  <option key={vs.id} value={vs.id}>{vs.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* カテゴリ選択 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">売上カテゴリ</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <button
              onClick={() => setSelectedCategory('iPhone修理')}
              style={{
                padding: '20px 16px',
                borderRadius: '10px',
                border: 'none',
                background: selectedCategory === 'iPhone修理' 
                  ? 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)' 
                  : 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: selectedCategory === 'iPhone修理' 
                  ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              iPhone修理
            </button>
            <button
              onClick={() => setSelectedCategory('Android修理')}
              style={{
                padding: '20px 16px',
                borderRadius: '10px',
                border: 'none',
                background: selectedCategory === 'Android修理' 
                  ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' 
                  : 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: selectedCategory === 'Android修理' 
                  ? '0 4px 12px rgba(5, 150, 105, 0.4)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              Android修理
            </button>
            <button
              onClick={() => setSelectedCategory('中古販売')}
              style={{
                padding: '20px 16px',
                borderRadius: '10px',
                border: 'none',
                background: selectedCategory === '中古販売' 
                  ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' 
                  : 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: selectedCategory === '中古販売' 
                  ? '0 4px 12px rgba(124, 58, 237, 0.4)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              中古販売
            </button>
            <button
              onClick={() => setSelectedCategory('アクセサリ')}
              style={{
                padding: '20px 16px',
                borderRadius: '10px',
                border: 'none',
                background: selectedCategory === 'アクセサリ' 
                  ? 'linear-gradient(135deg, #DB2777 0%, #EC4899 100%)' 
                  : 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: selectedCategory === 'アクセサリ' 
                  ? '0 4px 12px rgba(219, 39, 119, 0.4)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              アクセサリ
            </button>
            <button
              onClick={() => setSelectedCategory('データ移行')}
              style={{
                padding: '20px 16px',
                borderRadius: '10px',
                border: 'none',
                background: selectedCategory === 'データ移行' 
                  ? 'linear-gradient(135deg, #0891B2 0%, #22D3EE 100%)' 
                  : 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: selectedCategory === 'データ移行' 
                  ? '0 4px 12px rgba(8, 145, 178, 0.4)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              データ移行
            </button>
            <button
              onClick={() => setSelectedCategory('操作案内')}
              style={{
                padding: '20px 16px',
                borderRadius: '10px',
                border: 'none',
                background: selectedCategory === '操作案内' 
                  ? 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)' 
                  : 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: selectedCategory === '操作案内' 
                  ? '0 4px 12px rgba(217, 119, 6, 0.4)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              操作案内
            </button>
          </div>
        </div>
      </div>

      {/* iPhone修理フォーム */}
      {selectedCategory === 'iPhone修理' && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="card-title">iPhone修理</h2>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-6">
              <div className="form-group">
                <label className="form-label">機種</label>
                <select
                  value={iphoneForm.model}
                  onChange={(e) => setIphoneForm({ ...iphoneForm, model: e.target.value, menu: '', panelColor: '', unitPrice: 0, unitCost: 0 })}
                  className="form-select"
                >
                  <option value="">選択してください</option>
                  {iphoneModels.map((m) => (
                    <option key={m.model} value={m.model}>{m.display_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">メニュー</label>
                <select
                  value={iphoneForm.menu}
                  onChange={(e) => setIphoneForm({ ...iphoneForm, menu: e.target.value, panelColor: '' })}
                  className="form-select"
                >
                  <option value="">選択してください</option>
                  {getFilteredRepairMenus(iphoneRepairMenus, iphoneForm.model).map((menu) => (
                    <option key={menu} value={menu}>{getRepairTypeLabel(menu)}</option>
                  ))}
                </select>
              </div>
              {/* パネル色選択（色区別モデルのパネル修理時のみ表示） */}
              {iphoneForm.model && MODELS_WITH_COLOR.includes(iphoneForm.model) && PANEL_REPAIR_TYPES.includes(iphoneForm.menu) && (
                <div className="form-group">
                  <label className="form-label">パネル色</label>
                  <select
                    value={iphoneForm.panelColor}
                    onChange={(e) => setIphoneForm({ ...iphoneForm, panelColor: e.target.value })}
                    className="form-select"
                  >
                    <option value="">選択してください</option>
                    <option value="白">白</option>
                    <option value="黒">黒</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">仕入先</label>
                <select
                  value={iphoneForm.supplierId}
                  onChange={(e) => setIphoneForm({ ...iphoneForm, supplierId: e.target.value })}
                  className="form-select"
                >
                  <option value="">選択してください</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">価格（税抜）</label>
                <input
                  type="number"
                  value={iphoneForm.unitPrice}
                  onChange={(e) => setIphoneForm({ ...iphoneForm, unitPrice: parseInt(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">原価（税抜）</label>
                <input
                  type="number"
                  value={iphoneForm.unitCost}
                  onChange={(e) => setIphoneForm({ ...iphoneForm, unitCost: parseInt(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>
            </div>
            <button onClick={addIphoneDetail} className="btn btn-primary">
              明細に追加
            </button>
          </div>
        </div>
      )}

      {/* Android修理フォーム */}
      {selectedCategory === 'Android修理' && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="card-title">Android修理</h2>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-4">
              <div className="form-group">
                <label className="form-label">機種</label>
                <select
                  value={androidForm.model}
                  onChange={(e) => setAndroidForm({ ...androidForm, model: e.target.value, menu: '', unitPrice: 0, unitCost: 0 })}
                  className="form-select"
                >
                  <option value="">選択してください</option>
                  {androidModels.map((model) => (
                    <option key={model.model} value={model.model}>{model.model}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">メニュー</label>
                <select
                  value={androidForm.menu}
                  onChange={(e) => setAndroidForm({ ...androidForm, menu: e.target.value })}
                  className="form-select"
                >
                  <option value="">選択してください</option>
                  {androidRepairMenus.map((menu) => (
                    <option key={menu.value} value={menu.value}>{menu.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">価格（税抜）</label>
                <input
                  type="number"
                  value={androidForm.unitPrice}
                  onChange={(e) => setAndroidForm({ ...androidForm, unitPrice: parseInt(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">原価（税抜）</label>
                <input
                  type="number"
                  value={androidForm.unitCost}
                  onChange={(e) => setAndroidForm({ ...androidForm, unitCost: parseInt(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>
            </div>
            <button onClick={addAndroidDetail} className="btn btn-primary">
              明細に追加
            </button>
          </div>
        </div>
      )}

      {/* 中古販売フォーム */}
      {selectedCategory === '中古販売' && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="card-title">中古販売</h2>
          </div>
          <div className="card-body">
            {!formData.shopId ? (
              <p className="text-secondary">店舗を選択してください</p>
            ) : usedInventory.length === 0 ? (
              <p className="text-secondary">在庫がありません</p>
            ) : (
              <>
                {/* 管理番号検索 */}
                <div className="form-group">
                  <label className="form-label">管理番号で検索（IMEI下4桁）</label>
                  <input
                    type="text"
                    placeholder="例: 2345"
                    maxLength={4}
                    value={usedSalesForm.searchNumber || ''}
                    onChange={(e) => setUsedSalesForm({ ...usedSalesForm, searchNumber: e.target.value, inventoryId: '' })}
                    className="form-input"
                  />
                </div>

                {/* 在庫選択 */}
                <div className="form-group">
                  <label className="form-label">在庫選択</label>
                  <select
                    value={usedSalesForm.inventoryId}
                    onChange={(e) => setUsedSalesForm({ ...usedSalesForm, inventoryId: e.target.value })}
                    className="form-select"
                  >
                    <option value="">選択してください</option>
                    {usedInventory
                      .filter(inv => !usedSalesForm.searchNumber || inv.management_number?.includes(usedSalesForm.searchNumber))
                      .map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          [{inv.management_number || '----'}] {inv.model} {inv.storage}GB {inv.rank}
                        </option>
                      ))}
                  </select>
                </div>

                {/* 減額選択（在庫選択後に表示） */}
                {usedSalesForm.inventoryId && (
                  <>
                    <div className="form-grid form-grid-3">
                      <div className="form-group">
                        <label className="form-label">バッテリー状態</label>
                        <select
                          value={usedSalesForm.batteryStatus}
                          onChange={(e) => setUsedSalesForm({ ...usedSalesForm, batteryStatus: e.target.value })}
                          className="form-select"
                        >
                          <option value="90">90%以上（減額なし）</option>
                          <option value="80_89">80-89%</option>
                          <option value="79">79%以下 / サービス状態</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">カメラ染み</label>
                        <select
                          value={usedSalesForm.cameraStain}
                          onChange={(e) => setUsedSalesForm({ ...usedSalesForm, cameraStain: e.target.value })}
                          className="form-select"
                        >
                          <option value="none">なし（減額なし）</option>
                          <option value="minor">少ない</option>
                          <option value="major">多い</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">NW制限</label>
                        <select
                          value={usedSalesForm.nwStatus}
                          onChange={(e) => setUsedSalesForm({ ...usedSalesForm, nwStatus: e.target.value })}
                          className="form-select"
                        >
                          <option value="ok">○（減額なし）</option>
                          <option value="triangle">△</option>
                          <option value="cross">×</option>
                        </select>
                      </div>
                    </div>

                    {/* 価格表示（税抜・税込両方表示） */}
                    <div className="form-grid form-grid-4">
                      <div className="form-group">
                        <label className="form-label">基準価格（税抜）</label>
                        <div style={{ padding: '8px 12px', background: 'var(--color-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                          <div style={{ fontWeight: '600' }}>¥{usedSalesForm.basePrice.toLocaleString()}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>税込 ¥{Math.floor(usedSalesForm.basePrice * 1.1).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">減額合計（税抜）</label>
                        <div style={{ padding: '8px 12px', background: usedSalesForm.deductionTotal > 0 ? 'var(--color-danger-light)' : 'var(--color-bg)', borderRadius: '6px', border: usedSalesForm.deductionTotal > 0 ? '1px solid var(--color-danger)' : '1px solid var(--color-border)' }}>
                          <div style={{ fontWeight: '600', color: usedSalesForm.deductionTotal > 0 ? 'var(--color-danger)' : 'inherit' }}>-¥{usedSalesForm.deductionTotal.toLocaleString()}</div>
                          <div style={{ fontSize: '0.75rem', color: usedSalesForm.deductionTotal > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>税込 -¥{Math.floor(usedSalesForm.deductionTotal * 1.1).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">販売価格（税抜）</label>
                        <div style={{ padding: '8px 12px', background: 'var(--color-primary-light)', borderRadius: '6px', border: '1px solid var(--color-primary)' }}>
                          <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>¥{usedSalesForm.unitPrice.toLocaleString()}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '600' }}>税込 ¥{Math.floor(usedSalesForm.unitPrice * 1.1).toLocaleString()}</div>
                        </div>
                        <input
                          type="number"
                          value={usedSalesForm.unitPrice}
                          onChange={(e) => setUsedSalesForm({ ...usedSalesForm, unitPrice: parseInt(e.target.value) || 0 })}
                          className="form-input"
                          placeholder="手動調整可"
                          style={{ fontSize: '0.85rem', marginTop: '6px' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">原価（税抜）</label>
                        <div style={{ padding: '8px 12px', background: 'var(--color-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                          <div style={{ fontWeight: '600' }}>¥{usedSalesForm.unitCost.toLocaleString()}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>税込 ¥{Math.floor(usedSalesForm.unitCost * 1.1).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <button 
                  onClick={addUsedSalesDetail} 
                  disabled={!usedSalesForm.inventoryId}
                  className="btn btn-primary"
                >
                  明細に追加
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* アクセサリフォーム */}
      {selectedCategory === 'アクセサリ' && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="card-title">アクセサリ</h2>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-4">
              <div className="form-group">
                <label className="form-label">アクセサリ</label>
                <select
                  value={accessoryForm.accessoryId}
                  onChange={(e) => setAccessoryForm({ ...accessoryForm, accessoryId: e.target.value })}
                  className="form-select"
                >
                  <option value="">選択してください</option>
                  {accessories.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      [{acc.category_name}] {acc.name} {acc.variation || ''} - ¥{acc.price?.toLocaleString()}（税抜）
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">数量</label>
                <input
                  type="number"
                  min="1"
                  value={accessoryForm.quantity}
                  onChange={(e) => setAccessoryForm({ ...accessoryForm, quantity: parseInt(e.target.value) || 1 })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">単価（税抜）</label>
                <input
                  type="number"
                  value={accessoryForm.unitPrice}
                  onChange={(e) => setAccessoryForm({ ...accessoryForm, unitPrice: parseInt(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">原価（税抜）</label>
                <input
                  type="number"
                  value={accessoryForm.unitCost}
                  readOnly
                  className="form-input"
                  style={{ background: 'var(--color-bg)' }}
                />
              </div>
            </div>
            <button onClick={addAccessoryDetail} className="btn btn-primary">
              明細に追加
            </button>
          </div>
        </div>
      )}

      {/* データ移行フォーム */}
      {selectedCategory === 'データ移行' && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="card-title">データ移行</h2>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">メニュー</label>
                <select
                  value={dataMigrationForm.menu}
                  onChange={(e) => setDataMigrationForm({ ...dataMigrationForm, menu: e.target.value })}
                  className="form-select"
                >
                  <option value="">選択してください</option>
                  {dataMigrationMenus.map((menu) => (
                    <option key={menu.value} value={menu.value}>{menu.label} - ¥{menu.price.toLocaleString()}（税抜）</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">価格（税抜）</label>
                <input
                  type="number"
                  value={dataMigrationForm.unitPrice}
                  onChange={(e) => setDataMigrationForm({ ...dataMigrationForm, unitPrice: parseInt(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>
            </div>
            <button onClick={addDataMigrationDetail} className="btn btn-primary">
              明細に追加
            </button>
          </div>
        </div>
      )}

      {/* 操作案内フォーム */}
      {selectedCategory === '操作案内' && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="card-title">操作案内</h2>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">メニュー</label>
                <select
                  value={operationGuideForm.menu}
                  onChange={(e) => setOperationGuideForm({ ...operationGuideForm, menu: e.target.value })}
                  className="form-select"
                >
                  <option value="">選択してください</option>
                  {operationGuideMenus.map((menu) => (
                    <option key={menu.value} value={menu.value}>{menu.label} - ¥{menu.price.toLocaleString()}（税抜）</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">価格（税抜）</label>
                <input
                  type="number"
                  value={operationGuideForm.unitPrice}
                  onChange={(e) => setOperationGuideForm({ ...operationGuideForm, unitPrice: parseInt(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>
            </div>
            <button onClick={addOperationGuideDetail} className="btn btn-primary">
              明細に追加
            </button>
          </div>
        </div>
      )}

      {/* 明細一覧 */}
      {details.length > 0 && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="card-title">明細一覧</h2>
          </div>
          <div className="card-body">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>カテゴリ</th>
                    <th>機種/商品</th>
                    <th>メニュー</th>
                    <th className="text-right">数量</th>
                    <th className="text-right">単価（税抜）</th>
                    <th className="text-right">金額（税抜）</th>
                    <th className="text-right">原価（税抜）</th>
                    <th className="text-right">利益（税抜）</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail) => {
                    const profitRate = detail.amount > 0 ? (detail.profit / detail.amount * 100) : 0
                    return (
                      <tr key={detail.id}>
                        <td>{detail.category}</td>
                        <td>{detail.model}</td>
                        <td>{detail.menu}</td>
                        <td className="text-right">{detail.quantity}</td>
                        <td className="text-right">¥{detail.unitPrice.toLocaleString()}</td>
                        <td className="text-right">¥{detail.amount.toLocaleString()}</td>
                        <td className="text-right">¥{detail.cost.toLocaleString()}</td>
                        <td className="text-right">
                          <div>¥{detail.profit.toLocaleString()}</div>
                          <div style={{ fontSize: '0.75rem', color: profitRate >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(1)}%
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => removeDetail(detail.id)}
                            className="btn btn-sm btn-danger"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="font-semibold">合計</td>
                    <td className="text-right font-semibold">¥{totalAmount.toLocaleString()}</td>
                    <td className="text-right font-semibold">¥{totalCost.toLocaleString()}</td>
                    <td className="text-right font-semibold">
                      <div>¥{totalProfit.toLocaleString()}</div>
                      <div style={{ fontSize: '0.75rem', color: (totalAmount > 0 ? totalProfit / totalAmount * 100 : 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {(totalAmount > 0 ? totalProfit / totalAmount * 100 : 0) >= 0 ? '+' : ''}{(totalAmount > 0 ? (totalProfit / totalAmount * 100).toFixed(1) : '0.0')}%
                      </div>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 登録ボタン */}
      {details.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="btn btn-success btn-lg"
          >
            売上を登録
          </button>
        </div>
      )}
    </div>
  )
}