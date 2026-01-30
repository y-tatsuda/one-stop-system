'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type MainTab = 'repair_parts' | 'buyback' | 'sales' | 'accessory'
type BuybackSubTab = 'price' | 'deduction' | 'guarantee'
type SalesSubTab = 'price' | 'deduction'

type IphoneModel = {
  model: string
  display_name: string
}

type RepairPrice = {
  id: number
  model: string
  repair_type: string
  price: number
}

type PartsCost = {
  id: number
  model: string
  parts_type: string
  cost: number
  supplier_id: number | null
}

type Supplier = {
  id: number
  code: string
  name: string
}

type BuybackPrice = {
  id: number
  model: string
  storage: number
  rank: string
  price: number
}

type BuybackDeduction = {
  id: number
  model: string
  storage: number
  deduction_type: string
  amount: number
}

type BuybackGuarantee = {
  id: number
  model: string
  storage: number
  guarantee_price: number
}

type SalesPrice = {
  id: number
  model: string
  storage: number
  rank: string
  price: number
  price_excl_tax: number
}

type SalesDeduction = {
  id: number
  model: string
  deduction_type: string
  amount: number
}

type Accessory = {
  id: number
  name: string
  variation: string | null
  price: number
  cost: number
  category_id: number
  category_name: string
}

type AccessoryCategory = {
  id: number
  name: string
}

// 修理種別とパーツ種別のマッピング（原価テーブルのparts_typeに対応）
const REPAIR_PARTS_MAP: { [key: string]: string } = {
  '画面修理': 'TH-F',
  '画面修理 (有機EL)': 'HG-F',
  'バッテリー': 'バッテリー',
  'HGバッテリー': 'HGバッテリー',
  'コネクタ': 'コネクタ',
  'リアカメラ': 'リアカメラ',
  'インカメラ': 'インカメラ',
  'カメラ窓': 'カメラ窓',
}

const REPAIR_TYPES = Object.keys(REPAIR_PARTS_MAP)
const RANKS = ['超美品', '美品', '良品', '並品', 'リペア品']
const STORAGES = [64, 128, 256, 512, 1024]

// 買取減額種別
const BUYBACK_DEDUCTION_TYPES: { [key: string]: string } = {
  'battery_90': 'バッテリー90%以上',
  'battery_80_89': 'バッテリー80-89%',
  'battery_79': 'バッテリー79%以下',
  'nw_ok': 'NW制限なし',
  'nw_checking': 'NW制限△',
  'nw_ng': 'NW制限×',
  'camera_broken': 'カメラ窓破損',
  'camera_stain': 'カメラ染み',
  'repair_history': '非正規修理履歴',
}

// 販売減額種別
const SALES_DEDUCTION_TYPES: { [key: string]: string } = {
  'battery_90': 'バッテリー90%以上',
  'battery_80_89': 'バッテリー80-89%',
  'battery_79': 'バッテリー79%以下',
}

export default function MasterManagementPage() {
  const [activeTab, setActiveTab] = useState<MainTab>('repair_parts')
  const [buybackSubTab, setBuybackSubTab] = useState<BuybackSubTab>('price')
  const [salesSubTab, setSalesSubTab] = useState<SalesSubTab>('price')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // マスタデータ
  const [iphoneModels, setIphoneModels] = useState<IphoneModel[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [repairPrices, setRepairPrices] = useState<RepairPrice[]>([])
  const [partsCosts, setPartsCosts] = useState<PartsCost[]>([])
  const [buybackPrices, setBuybackPrices] = useState<BuybackPrice[]>([])
  const [buybackDeductions, setBuybackDeductions] = useState<BuybackDeduction[]>([])
  const [buybackGuarantees, setBuybackGuarantees] = useState<BuybackGuarantee[]>([])
  const [salesPrices, setSalesPrices] = useState<SalesPrice[]>([])
  const [salesDeductions, setSalesDeductions] = useState<SalesDeduction[]>([])
  const [accessories, setAccessories] = useState<Accessory[]>([])
  const [accessoryCategories, setAccessoryCategories] = useState<AccessoryCategory[]>([])

  // 編集中
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingTable, setEditingTable] = useState<string>('')
  const [editValue, setEditValue] = useState<number>(0)
  const [editValue2, setEditValue2] = useState<number>(0)

  // フィルター
  const [modelFilter, setModelFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState<string>('')

  // モーダル
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkAddModal, setShowBulkAddModal] = useState(false)

  // 新規追加用
  const [newModel, setNewModel] = useState('')
  const [newRepairType, setNewRepairType] = useState('')
  const [newPrice, setNewPrice] = useState(0)
  const [newCost, setNewCost] = useState(0)
  const [newSupplierId, setNewSupplierId] = useState<string>('')
  const [newStorage, setNewStorage] = useState(64)
  const [newRank, setNewRank] = useState('超美品')
  const [newPriceExclTax, setNewPriceExclTax] = useState(0)
  const [newDeductionType, setNewDeductionType] = useState('')
  const [newAmount, setNewAmount] = useState(0)
  const [newGuaranteePrice, setNewGuaranteePrice] = useState(0)
  const [newAccessoryName, setNewAccessoryName] = useState('')
  const [newAccessoryVariation, setNewAccessoryVariation] = useState('')
  const [newAccessoryCategoryId, setNewAccessoryCategoryId] = useState(0)

  // 一括追加用
  const [bulkModel, setBulkModel] = useState('')
  const [bulkStorages, setBulkStorages] = useState<number[]>([])
  const [bulkPrices, setBulkPrices] = useState<{ [key: string]: number }>({})

  // 機種名を表示名に変換
  const getDisplayName = (model: string) => {
    const found = iphoneModels.find(m => m.model === model)
    return found ? found.display_name : model
  }

  // データ取得
  const fetchData = async () => {
    setLoading(true)

    // 機種マスタ取得
    const { data: modelsData } = await supabase
      .from('m_iphone_models')
      .select('model, display_name')
      .eq('tenant_id', 1)
      .eq('is_active', true)
      .order('sort_order')

    setIphoneModels(modelsData || [])

    // 仕入先マスタ取得
    const { data: suppliersData } = await supabase
      .from('m_suppliers')
      .select('id, code, name')
      .eq('tenant_id', 1)
      .eq('is_active', true)
      .order('sort_order')

    setSuppliers(suppliersData || [])
    // デフォルトで最初の仕入先を選択
    if (suppliersData && suppliersData.length > 0 && !supplierFilter) {
      setSupplierFilter(suppliersData[0].id.toString())
    }

    // iPhone修理価格
    const { data: repairData } = await supabase
      .from('m_repair_prices_iphone')
      .select('id, model, repair_type, price')
      .eq('tenant_id', 1)
      .eq('is_active', true)
      .order('model')
      .order('repair_type')

    setRepairPrices(repairData || [])

    // パーツ原価
    const { data: partsData } = await supabase
      .from('m_costs_hw')
      .select('id, model, parts_type, cost, supplier_id')
      .eq('tenant_id', 1)
      .eq('is_active', true)
      .order('model')
      .order('parts_type')

    setPartsCosts(partsData || [])

    // 買取価格
    const { data: buybackData } = await supabase
      .from('m_buyback_prices')
      .select('id, model, storage, rank, price')
      .eq('tenant_id', 1)
      .eq('is_active', true)
      .order('model')
      .order('storage')
      .order('rank')

    setBuybackPrices(buybackData || [])

    // 買取減額
    const { data: buybackDeductionData } = await supabase
      .from('m_buyback_deductions')
      .select('id, model, storage, deduction_type, amount')
      .eq('tenant_id', 1)
      .eq('is_active', true)
      .order('model')
      .order('storage')
      .order('deduction_type')

    setBuybackDeductions(buybackDeductionData || [])

    // 買取保証価格
    const { data: buybackGuaranteeData } = await supabase
      .from('m_buyback_guarantees')
      .select('id, model, storage, guarantee_price')
      .eq('tenant_id', 1)
      .eq('is_active', true)
      .order('model')
      .order('storage')

    setBuybackGuarantees(buybackGuaranteeData || [])

    // 販売価格
    const { data: salesData } = await supabase
      .from('m_sales_prices')
      .select('id, model, storage, rank, price, price_excl_tax')
      .eq('tenant_id', 1)
      .eq('is_active', true)
      .order('model')
      .order('storage')
      .order('rank')

    setSalesPrices(salesData || [])

    // 販売減額
    const { data: salesDeductionData } = await supabase
      .from('m_sales_price_deductions')
      .select('id, model, deduction_type, amount')
      .eq('tenant_id', 1)
      .eq('is_active', true)
      .order('model')
      .order('deduction_type')

    setSalesDeductions(salesDeductionData || [])

    // アクセサリカテゴリ
    const { data: categoryData } = await supabase
      .from('m_accessory_categories')
      .select('id, name')
      .eq('tenant_id', 1)
      .eq('is_active', true)
      .order('sort_order')

    setAccessoryCategories(categoryData || [])

    // アクセサリ
    const { data: accessoryData } = await supabase
      .from('m_accessories')
      .select('id, name, variation, price, cost, category_id, m_accessory_categories(name)')
      .eq('tenant_id', 1)
      .eq('is_active', true)
      .order('name')

    if (accessoryData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted = accessoryData.map((a: any) => ({
        id: a.id,
        name: a.name,
        variation: a.variation,
        price: a.price,
        cost: a.cost,
        category_id: a.category_id,
        category_name: a.m_accessory_categories?.name || '',
      }))
      setAccessories(formatted)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 編集開始
  const startEdit = (id: number, table: string, value: number, value2?: number) => {
    setEditingId(id)
    setEditingTable(table)
    setEditValue(value)
    setEditValue2(value2 || 0)
  }

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingId(null)
    setEditingTable('')
    setEditValue(0)
    setEditValue2(0)
  }

  // 汎用更新関数
  const updateRecord = async (table: string, id: number, updates: Record<string, unknown>) => {
    setSaving(true)
    const { error } = await supabase
      .from(table)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      alert('更新に失敗しました')
      setSaving(false)
      return false
    }
    setSaving(false)
    return true
  }

  // 修理価格更新
  const updateRepairPrice = async (id: number) => {
    if (await updateRecord('m_repair_prices_iphone', id, { price: editValue })) {
      setRepairPrices(repairPrices.map(p => p.id === id ? { ...p, price: editValue } : p))
      cancelEdit()
    }
  }

  // パーツ原価更新
  const updatePartsCost = async (id: number) => {
    if (await updateRecord('m_costs_hw', id, { cost: editValue })) {
      setPartsCosts(partsCosts.map(p => p.id === id ? { ...p, cost: editValue } : p))
      cancelEdit()
    }
  }

  // 買取価格更新
  const updateBuybackPrice = async (id: number) => {
    if (await updateRecord('m_buyback_prices', id, { price: editValue })) {
      setBuybackPrices(buybackPrices.map(p => p.id === id ? { ...p, price: editValue } : p))
      cancelEdit()
    }
  }

  // 買取減額更新
  const updateBuybackDeduction = async (id: number) => {
    if (await updateRecord('m_buyback_deductions', id, { amount: editValue })) {
      setBuybackDeductions(buybackDeductions.map(d => d.id === id ? { ...d, amount: editValue } : d))
      cancelEdit()
    }
  }

  // 買取保証更新
  const updateBuybackGuarantee = async (id: number) => {
    if (await updateRecord('m_buyback_guarantees', id, { guarantee_price: editValue })) {
      setBuybackGuarantees(buybackGuarantees.map(g => g.id === id ? { ...g, guarantee_price: editValue } : g))
      cancelEdit()
    }
  }

  // 販売価格更新
  const updateSalesPrice = async (id: number) => {
    if (await updateRecord('m_sales_prices', id, { price: editValue, price_excl_tax: editValue2 })) {
      setSalesPrices(salesPrices.map(p => p.id === id ? { ...p, price: editValue, price_excl_tax: editValue2 } : p))
      cancelEdit()
    }
  }

  // 販売減額更新
  const updateSalesDeduction = async (id: number) => {
    if (await updateRecord('m_sales_price_deductions', id, { amount: editValue })) {
      setSalesDeductions(salesDeductions.map(d => d.id === id ? { ...d, amount: editValue } : d))
      cancelEdit()
    }
  }

  // アクセサリ更新
  const updateAccessory = async (id: number) => {
    if (await updateRecord('m_accessories', id, { price: editValue, cost: editValue2 })) {
      setAccessories(accessories.map(a => a.id === id ? { ...a, price: editValue, cost: editValue2 } : a))
      cancelEdit()
    }
  }

  // 削除（論理削除）
  const deleteItem = async (table: string, id: number, itemName: string) => {
    if (!confirm(`「${itemName}」を削除しますか？\n（削除後は一覧に表示されなくなります）`)) return

    setSaving(true)
    const { error } = await supabase
      .from(table)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      alert('削除に失敗しました')
    } else {
      switch (table) {
        case 'm_repair_prices_iphone':
          setRepairPrices(repairPrices.filter(p => p.id !== id))
          break
        case 'm_costs_hw':
          setPartsCosts(partsCosts.filter(p => p.id !== id))
          break
        case 'm_buyback_prices':
          setBuybackPrices(buybackPrices.filter(p => p.id !== id))
          break
        case 'm_buyback_deductions':
          setBuybackDeductions(buybackDeductions.filter(d => d.id !== id))
          break
        case 'm_buyback_guarantees':
          setBuybackGuarantees(buybackGuarantees.filter(g => g.id !== id))
          break
        case 'm_sales_prices':
          setSalesPrices(salesPrices.filter(p => p.id !== id))
          break
        case 'm_sales_price_deductions':
          setSalesDeductions(salesDeductions.filter(d => d.id !== id))
          break
        case 'm_accessories':
          setAccessories(accessories.filter(a => a.id !== id))
          break
      }
    }
    setSaving(false)
  }

  // 新規追加モーダルを開く
  const openAddModal = () => {
    setNewModel(iphoneModels[0]?.model || '')
    setNewRepairType(REPAIR_TYPES[0])
    setNewPrice(0)
    setNewCost(0)
    setNewSupplierId('')
    setNewStorage(64)
    setNewRank('超美品')
    setNewPriceExclTax(0)
    setNewDeductionType(Object.keys(BUYBACK_DEDUCTION_TYPES)[0])
    setNewAmount(0)
    setNewGuaranteePrice(0)
    setNewAccessoryName('')
    setNewAccessoryVariation('')
    setNewAccessoryCategoryId(accessoryCategories[0]?.id || 0)
    setShowAddModal(true)
  }

  // 一括追加モーダルを開く
  const openBulkAddModal = () => {
    setBulkModel(iphoneModels[0]?.model || '')
    setBulkStorages([])
    setBulkPrices({})
    setShowBulkAddModal(true)
  }

  // 修理/パーツ新規追加
  const addRepairParts = async () => {
    if (!newModel || !newRepairType) {
      alert('機種と種別を選択してください')
      return
    }

    if (!newSupplierId) {
      alert('仕入先を選択してください')
      return
    }

    setSaving(true)

    const { data: repairData, error: repairError } = await supabase
      .from('m_repair_prices_iphone')
      .insert({ tenant_id: 1, model: newModel, repair_type: newRepairType, price: newPrice, is_active: true })
      .select()
      .single()

    if (repairError) {
      if (repairError.code === '23505') {
        alert('この機種・種別の組み合わせは既に登録されています')
      } else {
        alert('修理価格の追加に失敗しました')
      }
      setSaving(false)
      return
    }

    const partsType = REPAIR_PARTS_MAP[newRepairType]
    const { data: partsData } = await supabase
      .from('m_costs_hw')
      .insert({ tenant_id: 1, model: newModel, parts_type: partsType, cost: newCost, supplier_id: parseInt(newSupplierId), is_active: true })
      .select()
      .single()

    if (repairData) setRepairPrices([...repairPrices, repairData])
    if (partsData) setPartsCosts([...partsCosts, { ...partsData, supplier_id: parseInt(newSupplierId) }])

    setShowAddModal(false)
    setSaving(false)
  }

  // 買取価格新規追加
  const addBuybackPrice = async () => {
    if (!newModel) { alert('機種を選択してください'); return }

    setSaving(true)
    const { data, error } = await supabase
      .from('m_buyback_prices')
      .insert({ tenant_id: 1, model: newModel, storage: newStorage, rank: newRank, price: newPrice, is_active: true })
      .select()
      .single()

    if (error) {
      alert(error.code === '23505' ? 'この組み合わせは既に登録されています' : '追加に失敗しました')
    } else if (data) {
      setBuybackPrices([...buybackPrices, data])
      setShowAddModal(false)
    }
    setSaving(false)
  }

  // 買取減額新規追加
  const addBuybackDeduction = async () => {
    if (!newModel || !newDeductionType) { alert('機種と減額種別を選択してください'); return }

    setSaving(true)
    const { data, error } = await supabase
      .from('m_buyback_deductions')
      .insert({ tenant_id: 1, model: newModel, storage: newStorage, deduction_type: newDeductionType, amount: newAmount, is_active: true })
      .select()
      .single()

    if (error) {
      alert(error.code === '23505' ? 'この組み合わせは既に登録されています' : '追加に失敗しました')
    } else if (data) {
      setBuybackDeductions([...buybackDeductions, data])
      setShowAddModal(false)
    }
    setSaving(false)
  }

  // 買取保証新規追加
  const addBuybackGuarantee = async () => {
    if (!newModel) { alert('機種を選択してください'); return }

    setSaving(true)
    const { data, error } = await supabase
      .from('m_buyback_guarantees')
      .insert({ tenant_id: 1, model: newModel, storage: newStorage, guarantee_price: newGuaranteePrice, is_active: true })
      .select()
      .single()

    if (error) {
      alert(error.code === '23505' ? 'この組み合わせは既に登録されています' : '追加に失敗しました')
    } else if (data) {
      setBuybackGuarantees([...buybackGuarantees, data])
      setShowAddModal(false)
    }
    setSaving(false)
  }

  // 販売価格新規追加
  const addSalesPrice = async () => {
    if (!newModel) { alert('機種を選択してください'); return }

    setSaving(true)
    const { data, error } = await supabase
      .from('m_sales_prices')
      .insert({ tenant_id: 1, model: newModel, storage: newStorage, rank: newRank, price: newPrice, price_excl_tax: newPriceExclTax, is_active: true })
      .select()
      .single()

    if (error) {
      alert(error.code === '23505' ? 'この組み合わせは既に登録されています' : '追加に失敗しました')
    } else if (data) {
      setSalesPrices([...salesPrices, data])
      setShowAddModal(false)
    }
    setSaving(false)
  }

  // 販売減額新規追加
  const addSalesDeduction = async () => {
    if (!newModel || !newDeductionType) { alert('機種と減額種別を選択してください'); return }

    setSaving(true)
    const { data, error } = await supabase
      .from('m_sales_price_deductions')
      .insert({ tenant_id: 1, model: newModel, deduction_type: newDeductionType, amount: newAmount, is_active: true })
      .select()
      .single()

    if (error) {
      alert(error.code === '23505' ? 'この組み合わせは既に登録されています' : '追加に失敗しました')
    } else if (data) {
      setSalesDeductions([...salesDeductions, data])
      setShowAddModal(false)
    }
    setSaving(false)
  }

  // アクセサリ新規追加
  const addAccessory = async () => {
    if (!newAccessoryName || !newAccessoryCategoryId) { alert('商品名とカテゴリを入力してください'); return }

    setSaving(true)
    const { data, error } = await supabase
      .from('m_accessories')
      .insert({ tenant_id: 1, category_id: newAccessoryCategoryId, name: newAccessoryName, variation: newAccessoryVariation || null, price: newPrice, cost: newCost, is_active: true })
      .select('id, name, variation, price, cost, category_id, m_accessory_categories(name)')
      .single()

    if (error) {
      alert('追加に失敗しました')
    } else if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = data as any
      setAccessories([...accessories, {
        id: d.id, name: d.name, variation: d.variation, price: d.price, cost: d.cost,
        category_id: d.category_id, category_name: d.m_accessory_categories?.name || '',
      }])
      setShowAddModal(false)
    }
    setSaving(false)
  }

  // 一括追加（買取価格）
  const bulkAddBuyback = async () => {
    if (!bulkModel || bulkStorages.length === 0) { alert('機種と容量を選択してください'); return }

    setSaving(true)
    const insertData = bulkStorages.flatMap(storage =>
      RANKS.map(rank => ({
        tenant_id: 1, model: bulkModel, storage, rank, price: bulkPrices[`${storage}_${rank}`] || 0, is_active: true
      }))
    )

    const { data, error } = await supabase.from('m_buyback_prices').insert(insertData).select()

    if (error && error.code === '23505') {
      alert('一部のデータが既に存在します')
    } else if (error) {
      alert('追加に失敗しました: ' + error.message)
    }

    if (data && data.length > 0) setBuybackPrices([...buybackPrices, ...data])

    setShowBulkAddModal(false)
    setSaving(false)
    fetchData()
  }

  // 一括追加（販売価格）
  const bulkAddSales = async () => {
    if (!bulkModel || bulkStorages.length === 0) { alert('機種と容量を選択してください'); return }

    setSaving(true)
    const insertData = bulkStorages.flatMap(storage =>
      RANKS.map(rank => {
        const priceExclTax = bulkPrices[`${storage}_${rank}`] || 0
        return {
          tenant_id: 1, model: bulkModel, storage, rank, price: Math.floor(priceExclTax * 1.1), price_excl_tax: priceExclTax, is_active: true
        }
      })
    )

    const { data, error } = await supabase.from('m_sales_prices').insert(insertData).select()

    if (error && error.code === '23505') {
      alert('一部のデータが既に存在します')
    } else if (error) {
      alert('追加に失敗しました: ' + error.message)
    }

    if (data && data.length > 0) setSalesPrices([...salesPrices, ...data])

    setShowBulkAddModal(false)
    setSaving(false)
    fetchData()
  }

  // 容量チェックボックス切り替え
  const toggleStorage = (storage: number) => {
    setBulkStorages(bulkStorages.includes(storage) ? bulkStorages.filter(s => s !== storage) : [...bulkStorages, storage])
  }

  const tabs = [
    { id: 'repair_parts' as MainTab, label: '修理/パーツ' },
    { id: 'buyback' as MainTab, label: '買取マスタ' },
    { id: 'sales' as MainTab, label: '販売マスタ' },
    { id: 'accessory' as MainTab, label: 'アクセサリ' },
  ]

  if (loading) {
    return <div className="loading"><div className="loading-spinner"></div></div>
  }

  // 修理/パーツの統合データを作成（仕入先フィルター対応）
  const getRepairPartsData = () => {
    const result: { model: string; repairType: string; repairId: number | null; repairPrice: number; partsId: number | null; partsCost: number; sortOrder: number; repairSortOrder: number }[] = []

    // 選択された仕入先でパーツ原価をフィルタ
    const filteredPartsCosts = supplierFilter
      ? partsCosts.filter(p => p.supplier_id === parseInt(supplierFilter))
      : partsCosts

    for (const repair of repairPrices) {
      if (!REPAIR_TYPES.includes(repair.repair_type)) continue

      const partsType = REPAIR_PARTS_MAP[repair.repair_type]
      const parts = filteredPartsCosts.find(p => p.model === repair.model && p.parts_type === partsType)
      const modelIndex = iphoneModels.findIndex(m => m.model === repair.model)
      const repairTypeIndex = REPAIR_TYPES.indexOf(repair.repair_type)

      result.push({
        model: repair.model, repairType: repair.repair_type, repairId: repair.id, repairPrice: repair.price,
        partsId: parts?.id || null, partsCost: parts?.cost || 0,
        sortOrder: modelIndex >= 0 ? modelIndex : 999, repairSortOrder: repairTypeIndex >= 0 ? repairTypeIndex : 999
      })
    }

    result.sort((a, b) => a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : a.repairSortOrder - b.repairSortOrder)
    return result
  }

  const repairPartsData = getRepairPartsData()

  // フィルタリング関数
  const filterByModel = <T extends { model: string }>(items: T[]) => {
    if (!modelFilter) return items
    const filter = modelFilter.toLowerCase()
    return items.filter(item => {
      const displayName = getDisplayName(item.model).toLowerCase()
      return item.model.toLowerCase().includes(filter) || displayName.includes(filter)
    })
  }

  // ソート関数
  const sortByModel = <T extends { model: string; storage?: number }>(items: T[]) => {
    return [...items].sort((a, b) => {
      const aIndex = iphoneModels.findIndex(m => m.model === a.model)
      const bIndex = iphoneModels.findIndex(m => m.model === b.model)
      if (aIndex !== bIndex) return (aIndex >= 0 ? aIndex : 999) - (bIndex >= 0 ? bIndex : 999)
      if (a.storage !== undefined && b.storage !== undefined && a.storage !== b.storage) return a.storage - b.storage
      return 0
    })
  }

  const filteredRepairParts = repairPartsData.filter(p => {
    if (!modelFilter) return true
    const displayName = getDisplayName(p.model).toLowerCase()
    const filter = modelFilter.toLowerCase()
    return p.model.toLowerCase().includes(filter) || displayName.includes(filter)
  })

  const filteredBuybackPrices = sortByModel(filterByModel(buybackPrices)).sort((a, b) => {
    if (a.model === b.model && a.storage === b.storage) return RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)
    return 0
  })

  const filteredBuybackDeductions = sortByModel(filterByModel(buybackDeductions))
  const filteredBuybackGuarantees = sortByModel(filterByModel(buybackGuarantees))

  const filteredSalesPrices = sortByModel(filterByModel(salesPrices)).sort((a, b) => {
    if (a.model === b.model && a.storage === b.storage) return RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)
    return 0
  })

  const filteredSalesDeductions = sortByModel(filterByModel(salesDeductions))

  const filteredAccessories = accessories.filter(a =>
    !modelFilter || a.name.toLowerCase().includes(modelFilter.toLowerCase()) || a.category_name.toLowerCase().includes(modelFilter.toLowerCase())
  )

  // 現在のタブ・サブタブに応じた追加処理
  const handleAdd = () => {
    if (activeTab === 'repair_parts') addRepairParts()
    else if (activeTab === 'buyback') {
      if (buybackSubTab === 'price') addBuybackPrice()
      else if (buybackSubTab === 'deduction') addBuybackDeduction()
      else if (buybackSubTab === 'guarantee') addBuybackGuarantee()
    } else if (activeTab === 'sales') {
      if (salesSubTab === 'price') addSalesPrice()
      else if (salesSubTab === 'deduction') addSalesDeduction()
    } else if (activeTab === 'accessory') addAccessory()
  }

  // 一括追加処理
  const handleBulkAdd = () => {
    if (activeTab === 'buyback' && buybackSubTab === 'price') bulkAddBuyback()
    else if (activeTab === 'sales' && salesSubTab === 'price') bulkAddSales()
  }

  // モーダルタイトル
  const getModalTitle = () => {
    if (activeTab === 'repair_parts') return '修理/パーツ 新規追加'
    if (activeTab === 'buyback') {
      if (buybackSubTab === 'price') return '買取価格 新規追加'
      if (buybackSubTab === 'deduction') return '買取減額 新規追加'
      if (buybackSubTab === 'guarantee') return '買取保証 新規追加'
    }
    if (activeTab === 'sales') {
      if (salesSubTab === 'price') return '販売価格 新規追加'
      if (salesSubTab === 'deduction') return '販売減額 新規追加'
    }
    if (activeTab === 'accessory') return 'アクセサリ 新規追加'
    return '新規追加'
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">マスタ管理</h1>
      </div>

      {/* メインタブ */}
      <div className="card mb-lg">
        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setModelFilter(''); cancelEdit(); }}
              className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 買取マスタのサブタブ */}
        {activeTab === 'buyback' && (
          <div style={{ borderTop: '1px solid var(--color-border)', padding: '8px 16px', background: 'var(--color-bg)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'price' as BuybackSubTab, label: '価格' },
                { id: 'deduction' as BuybackSubTab, label: '減額' },
                { id: 'guarantee' as BuybackSubTab, label: '保証価格' },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => { setBuybackSubTab(sub.id); cancelEdit(); }}
                  className={`btn btn-sm ${buybackSubTab === sub.id ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 販売マスタのサブタブ */}
        {activeTab === 'sales' && (
          <div style={{ borderTop: '1px solid var(--color-border)', padding: '8px 16px', background: 'var(--color-bg)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'price' as SalesSubTab, label: '価格' },
                { id: 'deduction' as SalesSubTab, label: '減額' },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => { setSalesSubTab(sub.id); cancelEdit(); }}
                  className={`btn btn-sm ${salesSubTab === sub.id ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* フィルターと追加ボタン */}
        <div className="card-body" style={{ borderTop: '1px solid var(--color-border)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="検索..."
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="form-input"
            style={{ maxWidth: '250px' }}
          />
          {activeTab === 'repair_parts' && (
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="form-select"
              style={{ maxWidth: '150px' }}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <button onClick={openAddModal} className="btn btn-primary">新規追加</button>
          {((activeTab === 'buyback' && buybackSubTab === 'price') || (activeTab === 'sales' && salesSubTab === 'price')) && (
            <button onClick={openBulkAddModal} className="btn btn-secondary">一括追加</button>
          )}
        </div>

        {/* 修理/パーツ */}
        {activeTab === 'repair_parts' && (
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>機種</th>
                    <th>種別</th>
                    <th className="text-right">修理価格（税抜）</th>
                    <th className="text-right">パーツ原価</th>
                    <th className="text-right">粗利</th>
                    <th className="text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepairParts.length === 0 ? (
                    <tr><td colSpan={6}><div className="empty-state"><p className="empty-state-text">データがありません</p></div></td></tr>
                  ) : (
                    filteredRepairParts.map((item, idx) => {
                      const isEditingRepair = editingId === item.repairId && editingTable === 'repair'
                      const isEditingParts = editingId === item.partsId && editingTable === 'parts'
                      const profit = item.repairPrice - item.partsCost
                      
                      return (
                        <tr key={`${item.model}-${item.repairType}-${idx}`}>
                          <td style={{ fontWeight: 500 }}>{getDisplayName(item.model)}</td>
                          <td>{item.repairType}</td>
                          <td className="text-right">
                            {isEditingRepair ? (
                              <input type="number" value={editValue} onChange={(e) => setEditValue(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '100px', textAlign: 'right', padding: '4px 8px' }} autoFocus />
                            ) : (
                              <span onClick={() => item.repairId && startEdit(item.repairId, 'repair', item.repairPrice)} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }} className="hover-highlight">
                                ¥{item.repairPrice.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="text-right">
                            {isEditingParts ? (
                              <input type="number" value={editValue} onChange={(e) => setEditValue(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '100px', textAlign: 'right', padding: '4px 8px' }} autoFocus />
                            ) : (
                              <span onClick={() => item.partsId && startEdit(item.partsId, 'parts', item.partsCost)} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }} className="hover-highlight">
                                ¥{item.partsCost.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="text-right" style={{ color: profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 500 }}>
                            ¥{profit.toLocaleString()}
                          </td>
                          <td className="text-center">
                            {isEditingRepair ? (
                              <div className="flex justify-center gap-xs">
                                <button onClick={() => updateRepairPrice(item.repairId!)} disabled={saving} className="btn btn-sm btn-success">保存</button>
                                <button onClick={cancelEdit} className="btn btn-sm btn-secondary">取消</button>
                              </div>
                            ) : isEditingParts ? (
                              <div className="flex justify-center gap-xs">
                                <button onClick={() => updatePartsCost(item.partsId!)} disabled={saving} className="btn btn-sm btn-success">保存</button>
                                <button onClick={cancelEdit} className="btn btn-sm btn-secondary">取消</button>
                              </div>
                            ) : (
                              <button onClick={() => item.repairId && deleteItem('m_repair_prices_iphone', item.repairId, `${getDisplayName(item.model)} ${item.repairType}`)} className="btn btn-sm btn-danger" disabled={saving}>削除</button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 買取価格 */}
        {activeTab === 'buyback' && buybackSubTab === 'price' && (
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>機種</th>
                    <th className="text-center">容量</th>
                    <th>ランク</th>
                    <th className="text-right">買取価格</th>
                    <th className="text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuybackPrices.length === 0 ? (
                    <tr><td colSpan={5}><div className="empty-state"><p className="empty-state-text">データがありません</p></div></td></tr>
                  ) : (
                    filteredBuybackPrices.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{getDisplayName(item.model)}</td>
                        <td className="text-center">{item.storage >= 1024 ? `${item.storage / 1024}TB` : `${item.storage}GB`}</td>
                        <td>{item.rank}</td>
                        <td className="text-right">
                          {editingId === item.id && editingTable === 'buyback_price' ? (
                            <input type="number" value={editValue} onChange={(e) => setEditValue(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '100px', textAlign: 'right', padding: '4px 8px' }} autoFocus />
                          ) : (
                            <span>¥{item.price.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="text-center">
                          {editingId === item.id && editingTable === 'buyback_price' ? (
                            <div className="flex justify-center gap-xs">
                              <button onClick={() => updateBuybackPrice(item.id)} disabled={saving} className="btn btn-sm btn-success">保存</button>
                              <button onClick={cancelEdit} className="btn btn-sm btn-secondary">取消</button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-xs">
                              <button onClick={() => startEdit(item.id, 'buyback_price', item.price)} className="btn btn-sm btn-secondary">編集</button>
                              <button onClick={() => deleteItem('m_buyback_prices', item.id, `${getDisplayName(item.model)} ${item.storage}GB ${item.rank}`)} className="btn btn-sm btn-danger" disabled={saving}>削除</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 買取減額 */}
        {activeTab === 'buyback' && buybackSubTab === 'deduction' && (
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>機種</th>
                    <th className="text-center">容量</th>
                    <th>減額種別</th>
                    <th className="text-right">減額金額</th>
                    <th className="text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuybackDeductions.length === 0 ? (
                    <tr><td colSpan={5}><div className="empty-state"><p className="empty-state-text">データがありません</p></div></td></tr>
                  ) : (
                    filteredBuybackDeductions.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{getDisplayName(item.model)}</td>
                        <td className="text-center">{item.storage >= 1024 ? `${item.storage / 1024}TB` : `${item.storage}GB`}</td>
                        <td>{BUYBACK_DEDUCTION_TYPES[item.deduction_type] || item.deduction_type}</td>
                        <td className="text-right">
                          {editingId === item.id && editingTable === 'buyback_deduction' ? (
                            <input type="number" value={editValue} onChange={(e) => setEditValue(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '100px', textAlign: 'right', padding: '4px 8px' }} autoFocus />
                          ) : (
                            <span>¥{item.amount.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="text-center">
                          {editingId === item.id && editingTable === 'buyback_deduction' ? (
                            <div className="flex justify-center gap-xs">
                              <button onClick={() => updateBuybackDeduction(item.id)} disabled={saving} className="btn btn-sm btn-success">保存</button>
                              <button onClick={cancelEdit} className="btn btn-sm btn-secondary">取消</button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-xs">
                              <button onClick={() => startEdit(item.id, 'buyback_deduction', item.amount)} className="btn btn-sm btn-secondary">編集</button>
                              <button onClick={() => deleteItem('m_buyback_deductions', item.id, `${getDisplayName(item.model)} ${item.storage}GB ${BUYBACK_DEDUCTION_TYPES[item.deduction_type]}`)} className="btn btn-sm btn-danger" disabled={saving}>削除</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 買取保証価格 */}
        {activeTab === 'buyback' && buybackSubTab === 'guarantee' && (
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>機種</th>
                    <th className="text-center">容量</th>
                    <th className="text-right">保証価格</th>
                    <th className="text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuybackGuarantees.length === 0 ? (
                    <tr><td colSpan={4}><div className="empty-state"><p className="empty-state-text">データがありません</p></div></td></tr>
                  ) : (
                    filteredBuybackGuarantees.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{getDisplayName(item.model)}</td>
                        <td className="text-center">{item.storage >= 1024 ? `${item.storage / 1024}TB` : `${item.storage}GB`}</td>
                        <td className="text-right">
                          {editingId === item.id && editingTable === 'buyback_guarantee' ? (
                            <input type="number" value={editValue} onChange={(e) => setEditValue(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '100px', textAlign: 'right', padding: '4px 8px' }} autoFocus />
                          ) : (
                            <span>¥{item.guarantee_price.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="text-center">
                          {editingId === item.id && editingTable === 'buyback_guarantee' ? (
                            <div className="flex justify-center gap-xs">
                              <button onClick={() => updateBuybackGuarantee(item.id)} disabled={saving} className="btn btn-sm btn-success">保存</button>
                              <button onClick={cancelEdit} className="btn btn-sm btn-secondary">取消</button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-xs">
                              <button onClick={() => startEdit(item.id, 'buyback_guarantee', item.guarantee_price)} className="btn btn-sm btn-secondary">編集</button>
                              <button onClick={() => deleteItem('m_buyback_guarantees', item.id, `${getDisplayName(item.model)} ${item.storage}GB`)} className="btn btn-sm btn-danger" disabled={saving}>削除</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 販売価格 */}
        {activeTab === 'sales' && salesSubTab === 'price' && (
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>機種</th>
                    <th className="text-center">容量</th>
                    <th>ランク</th>
                    <th className="text-right">税込価格</th>
                    <th className="text-right">税抜価格</th>
                    <th className="text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalesPrices.length === 0 ? (
                    <tr><td colSpan={6}><div className="empty-state"><p className="empty-state-text">データがありません</p></div></td></tr>
                  ) : (
                    filteredSalesPrices.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{getDisplayName(item.model)}</td>
                        <td className="text-center">{item.storage >= 1024 ? `${item.storage / 1024}TB` : `${item.storage}GB`}</td>
                        <td>{item.rank}</td>
                        <td className="text-right">
                          {editingId === item.id && editingTable === 'sales_price' ? (
                            <input type="number" value={editValue} onChange={(e) => setEditValue(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '100px', textAlign: 'right', padding: '4px 8px' }} />
                          ) : (
                            <span>¥{item.price.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="text-right">
                          {editingId === item.id && editingTable === 'sales_price' ? (
                            <input type="number" value={editValue2} onChange={(e) => setEditValue2(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '100px', textAlign: 'right', padding: '4px 8px' }} autoFocus />
                          ) : (
                            <span>¥{item.price_excl_tax.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="text-center">
                          {editingId === item.id && editingTable === 'sales_price' ? (
                            <div className="flex justify-center gap-xs">
                              <button onClick={() => updateSalesPrice(item.id)} disabled={saving} className="btn btn-sm btn-success">保存</button>
                              <button onClick={cancelEdit} className="btn btn-sm btn-secondary">取消</button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-xs">
                              <button onClick={() => startEdit(item.id, 'sales_price', item.price, item.price_excl_tax)} className="btn btn-sm btn-secondary">編集</button>
                              <button onClick={() => deleteItem('m_sales_prices', item.id, `${getDisplayName(item.model)} ${item.storage}GB ${item.rank}`)} className="btn btn-sm btn-danger" disabled={saving}>削除</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 販売減額 */}
        {activeTab === 'sales' && salesSubTab === 'deduction' && (
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>機種</th>
                    <th>減額種別</th>
                    <th className="text-right">減額金額</th>
                    <th className="text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalesDeductions.length === 0 ? (
                    <tr><td colSpan={4}><div className="empty-state"><p className="empty-state-text">データがありません</p></div></td></tr>
                  ) : (
                    filteredSalesDeductions.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{getDisplayName(item.model)}</td>
                        <td>{SALES_DEDUCTION_TYPES[item.deduction_type] || item.deduction_type}</td>
                        <td className="text-right">
                          {editingId === item.id && editingTable === 'sales_deduction' ? (
                            <input type="number" value={editValue} onChange={(e) => setEditValue(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '100px', textAlign: 'right', padding: '4px 8px' }} autoFocus />
                          ) : (
                            <span>¥{item.amount.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="text-center">
                          {editingId === item.id && editingTable === 'sales_deduction' ? (
                            <div className="flex justify-center gap-xs">
                              <button onClick={() => updateSalesDeduction(item.id)} disabled={saving} className="btn btn-sm btn-success">保存</button>
                              <button onClick={cancelEdit} className="btn btn-sm btn-secondary">取消</button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-xs">
                              <button onClick={() => startEdit(item.id, 'sales_deduction', item.amount)} className="btn btn-sm btn-secondary">編集</button>
                              <button onClick={() => deleteItem('m_sales_price_deductions', item.id, `${getDisplayName(item.model)} ${SALES_DEDUCTION_TYPES[item.deduction_type]}`)} className="btn btn-sm btn-danger" disabled={saving}>削除</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* アクセサリ */}
        {activeTab === 'accessory' && (
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>カテゴリ</th>
                    <th>商品名</th>
                    <th>バリエーション</th>
                    <th className="text-right">販売価格</th>
                    <th className="text-right">原価</th>
                    <th className="text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccessories.length === 0 ? (
                    <tr><td colSpan={6}><div className="empty-state"><p className="empty-state-text">データがありません</p></div></td></tr>
                  ) : (
                    filteredAccessories.map(item => (
                      <tr key={item.id}>
                        <td><span className="badge badge-gray">{item.category_name}</span></td>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td className="text-secondary">{item.variation || '-'}</td>
                        <td className="text-right">
                          {editingId === item.id && editingTable === 'accessory' ? (
                            <input type="number" value={editValue} onChange={(e) => setEditValue(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '100px', textAlign: 'right', padding: '4px 8px' }} autoFocus />
                          ) : (
                            <span>¥{item.price.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="text-right">
                          {editingId === item.id && editingTable === 'accessory' ? (
                            <input type="number" value={editValue2} onChange={(e) => setEditValue2(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '100px', textAlign: 'right', padding: '4px 8px' }} />
                          ) : (
                            <span>¥{item.cost.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="text-center">
                          {editingId === item.id && editingTable === 'accessory' ? (
                            <div className="flex justify-center gap-xs">
                              <button onClick={() => updateAccessory(item.id)} disabled={saving} className="btn btn-sm btn-success">保存</button>
                              <button onClick={cancelEdit} className="btn btn-sm btn-secondary">取消</button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-xs">
                              <button onClick={() => startEdit(item.id, 'accessory', item.price, item.cost)} className="btn btn-sm btn-secondary">編集</button>
                              <button onClick={() => deleteItem('m_accessories', item.id, item.name)} className="btn btn-sm btn-danger" disabled={saving}>削除</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 新規追加モーダル */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{getModalTitle()}</h2>
              <button onClick={() => setShowAddModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              {/* 修理/パーツ */}
              {activeTab === 'repair_parts' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label form-label-required">機種</label>
                    <select value={newModel} onChange={e => setNewModel(e.target.value)} className="form-select">
                      {iphoneModels.map(m => <option key={m.model} value={m.model}>{m.display_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">種別</label>
                    <select value={newRepairType} onChange={e => setNewRepairType(e.target.value)} className="form-select">
                      {REPAIR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">仕入先</label>
                    <select value={newSupplierId} onChange={e => setNewSupplierId(e.target.value)} className="form-select">
                      <option value="">選択してください</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">修理価格（税抜）</label>
                    <input type="number" value={newPrice} onChange={e => setNewPrice(parseInt(e.target.value) || 0)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">パーツ原価</label>
                    <input type="number" value={newCost} onChange={e => setNewCost(parseInt(e.target.value) || 0)} className="form-input" />
                  </div>
                </div>
              )}

              {/* 買取価格 */}
              {activeTab === 'buyback' && buybackSubTab === 'price' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label form-label-required">機種</label>
                    <select value={newModel} onChange={e => setNewModel(e.target.value)} className="form-select">
                      {iphoneModels.map(m => <option key={m.model} value={m.model}>{m.display_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">容量</label>
                    <select value={newStorage} onChange={e => setNewStorage(parseInt(e.target.value))} className="form-select">
                      {STORAGES.map(s => <option key={s} value={s}>{s >= 1024 ? `${s / 1024}TB` : `${s}GB`}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">ランク</label>
                    <select value={newRank} onChange={e => setNewRank(e.target.value)} className="form-select">
                      {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">買取価格</label>
                    <input type="number" value={newPrice} onChange={e => setNewPrice(parseInt(e.target.value) || 0)} className="form-input" />
                  </div>
                </div>
              )}

              {/* 買取減額 */}
              {activeTab === 'buyback' && buybackSubTab === 'deduction' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label form-label-required">機種</label>
                    <select value={newModel} onChange={e => setNewModel(e.target.value)} className="form-select">
                      {iphoneModels.map(m => <option key={m.model} value={m.model}>{m.display_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">容量</label>
                    <select value={newStorage} onChange={e => setNewStorage(parseInt(e.target.value))} className="form-select">
                      {STORAGES.map(s => <option key={s} value={s}>{s >= 1024 ? `${s / 1024}TB` : `${s}GB`}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">減額種別</label>
                    <select value={newDeductionType} onChange={e => setNewDeductionType(e.target.value)} className="form-select">
                      {Object.entries(BUYBACK_DEDUCTION_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">減額金額</label>
                    <input type="number" value={newAmount} onChange={e => setNewAmount(parseInt(e.target.value) || 0)} className="form-input" />
                  </div>
                </div>
              )}

              {/* 買取保証 */}
              {activeTab === 'buyback' && buybackSubTab === 'guarantee' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label form-label-required">機種</label>
                    <select value={newModel} onChange={e => setNewModel(e.target.value)} className="form-select">
                      {iphoneModels.map(m => <option key={m.model} value={m.model}>{m.display_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">容量</label>
                    <select value={newStorage} onChange={e => setNewStorage(parseInt(e.target.value))} className="form-select">
                      {STORAGES.map(s => <option key={s} value={s}>{s >= 1024 ? `${s / 1024}TB` : `${s}GB`}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">保証価格</label>
                    <input type="number" value={newGuaranteePrice} onChange={e => setNewGuaranteePrice(parseInt(e.target.value) || 0)} className="form-input" />
                  </div>
                </div>
              )}

              {/* 販売価格 */}
              {activeTab === 'sales' && salesSubTab === 'price' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label form-label-required">機種</label>
                    <select value={newModel} onChange={e => setNewModel(e.target.value)} className="form-select">
                      {iphoneModels.map(m => <option key={m.model} value={m.model}>{m.display_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">容量</label>
                    <select value={newStorage} onChange={e => setNewStorage(parseInt(e.target.value))} className="form-select">
                      {STORAGES.map(s => <option key={s} value={s}>{s >= 1024 ? `${s / 1024}TB` : `${s}GB`}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">ランク</label>
                    <select value={newRank} onChange={e => setNewRank(e.target.value)} className="form-select">
                      {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">税込価格</label>
                    <input type="number" value={newPrice} onChange={e => setNewPrice(parseInt(e.target.value) || 0)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">税抜価格</label>
                    <input type="number" value={newPriceExclTax} onChange={e => setNewPriceExclTax(parseInt(e.target.value) || 0)} className="form-input" />
                  </div>
                </div>
              )}

              {/* 販売減額 */}
              {activeTab === 'sales' && salesSubTab === 'deduction' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label form-label-required">機種</label>
                    <select value={newModel} onChange={e => setNewModel(e.target.value)} className="form-select">
                      {iphoneModels.map(m => <option key={m.model} value={m.model}>{m.display_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">減額種別</label>
                    <select value={newDeductionType} onChange={e => setNewDeductionType(e.target.value)} className="form-select">
                      {Object.entries(SALES_DEDUCTION_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">減額金額</label>
                    <input type="number" value={newAmount} onChange={e => setNewAmount(parseInt(e.target.value) || 0)} className="form-input" />
                  </div>
                </div>
              )}

              {/* アクセサリ */}
              {activeTab === 'accessory' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label form-label-required">カテゴリ</label>
                    <select value={newAccessoryCategoryId} onChange={e => setNewAccessoryCategoryId(parseInt(e.target.value))} className="form-select">
                      {accessoryCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">商品名</label>
                    <input type="text" value={newAccessoryName} onChange={e => setNewAccessoryName(e.target.value)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">バリエーション</label>
                    <input type="text" value={newAccessoryVariation} onChange={e => setNewAccessoryVariation(e.target.value)} className="form-input" placeholder="1m, 2m, 色など" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">販売価格</label>
                    <input type="number" value={newPrice} onChange={e => setNewPrice(parseInt(e.target.value) || 0)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">原価</label>
                    <input type="number" value={newCost} onChange={e => setNewCost(parseInt(e.target.value) || 0)} className="form-input" />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">キャンセル</button>
              <button onClick={handleAdd} disabled={saving} className="btn btn-primary">{saving ? '保存中...' : '追加'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 一括追加モーダル */}
      {showBulkAddModal && (
        <div className="modal-overlay" onClick={() => setShowBulkAddModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {activeTab === 'buyback' && '買取価格 一括追加'}
                {activeTab === 'sales' && '販売価格 一括追加'}
              </h2>
              <button onClick={() => setShowBulkAddModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2 mb-md">
                <div className="form-group">
                  <label className="form-label form-label-required">機種</label>
                  <select value={bulkModel} onChange={e => setBulkModel(e.target.value)} className="form-select">
                    {iphoneModels.map(m => <option key={m.model} value={m.model}>{m.display_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">容量（複数選択可）</label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {STORAGES.map(s => (
                      <label key={s} className="form-check">
                        <input type="checkbox" checked={bulkStorages.includes(s)} onChange={() => toggleStorage(s)} />
                        <span>{s >= 1024 ? `${s / 1024}TB` : `${s}GB`}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {bulkStorages.length > 0 && (
                <div>
                  <p className="form-hint mb-sm">
                    {activeTab === 'buyback' ? '各ランクの買取価格を入力してください' : '各ランクの税抜価格を入力してください（税込は自動計算）'}
                  </p>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>容量</th>
                          {RANKS.map(r => <th key={r} className="text-right">{r}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {bulkStorages.sort((a, b) => a - b).map(storage => (
                          <tr key={storage}>
                            <td style={{ fontWeight: 500 }}>{storage >= 1024 ? `${storage / 1024}TB` : `${storage}GB`}</td>
                            {RANKS.map(rank => {
                              const key = `${storage}_${rank}`
                              return (
                                <td key={rank}>
                                  <input
                                    type="number"
                                    value={bulkPrices[key] || ''}
                                    onChange={e => setBulkPrices({ ...bulkPrices, [key]: parseInt(e.target.value) || 0 })}
                                    className="form-input"
                                    style={{ width: '100px', textAlign: 'right', padding: '4px 8px' }}
                                    placeholder="0"
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowBulkAddModal(false)} className="btn btn-secondary">キャンセル</button>
              <button onClick={handleBulkAdd} disabled={saving || bulkStorages.length === 0} className="btn btn-primary">
                {saving ? '保存中...' : `${bulkStorages.length * RANKS.length}件を一括追加`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .hover-highlight:hover {
          background-color: var(--color-primary-light);
        }
      `}</style>
    </div>
  )
}