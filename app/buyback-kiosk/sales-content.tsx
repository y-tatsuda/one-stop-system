'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BATTERY_DEDUCTION_RATE, BATTERY_THRESHOLD } from '../lib/pricing'

type Props = {
  shopId: number
  shopName: string
}

type Staff = {
  id: number
  name: string
}

type VisitSource = {
  id: number
  name: string
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
  discount: number
  amount: number
  cost: number
  profit: number
}

// 修理メニューの並び順
const REPAIR_TYPE_ORDER = [
  'TH-F', 'TH-L', 'HG-F', 'HG-L',
  'バッテリー', 'HGバッテリー',
  'コネクタ', 'リアカメラ', 'インカメラ', 'カメラ窓'
]

const getPartsTypeFromMenu = (repairType: string): string => {
  if (repairType === 'TH-F' || repairType === 'TH-L') return 'TH'
  if (repairType === 'HG-F' || repairType === 'HG-L') return 'HG'
  return repairType
}

const isPartsRepairMenu = (menu: string): boolean => {
  const partsMenus = ['TH-F', 'TH-L', 'HG-F', 'HG-L', 'バッテリー', 'HGバッテリー', 'コネクタ', 'リアカメラ', 'インカメラ', 'カメラ窓']
  return partsMenus.includes(menu)
}

const dataMigrationMenus = [
  { value: 'データ移行', label: 'データ移行', price: 3000 },
  { value: 'データ移行α', label: 'データ移行α', price: 5000 },
]

const operationGuideMenus = [
  { value: '個別10分', label: '個別10分', price: 1000 },
  { value: '個別20分', label: '個別20分', price: 2000 },
  { value: '個別30分', label: '個別30分', price: 3000 },
  { value: '個別60分', label: '個別60分', price: 5000 },
]

export default function SalesContent({ shopId, shopName }: Props) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [visitSources, setVisitSources] = useState<VisitSource[]>([])
  const [accessories, setAccessories] = useState<Accessory[]>([])
  const [usedInventory, setUsedInventory] = useState<UsedInventory[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [details, setDetails] = useState<SalesDetail[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [squareLocationId, setSquareLocationId] = useState<string | null>(null)
  const [squareApplicationId, setSquareApplicationId] = useState<string | null>(null)
  const [testMode, setTestMode] = useState(false)
  const [testModeReduceInventory, setTestModeReduceInventory] = useState(false)

  const [iphoneModels, setIphoneModels] = useState<{model: string, display_name: string}[]>([])
  const [iphoneRepairMenus, setIphoneRepairMenus] = useState<string[]>([])
  const [partsCosts, setPartsCosts] = useState<{model: string, parts_type: string}[]>([])
  const [ipadRepairPrices, setIpadRepairPrices] = useState<{model: string, repair_type: string, price: number, cost: number}[]>([])
  const [androidRepairPrices, setAndroidRepairPrices] = useState<{model: string, repair_type: string, price: number, cost: number}[]>([])
  const [salesDeductionMaster, setSalesDeductionMaster] = useState<{deduction_type: string, amount: number}[]>([])

  const [formData, setFormData] = useState({
    staffId: '',
    visitSourceId: '',
  })

  const [iphoneForm, setIphoneForm] = useState({
    model: '', menu: '', supplierId: '', unitPrice: 0, unitCost: 0,
  })

  const [ipadForm, setIpadForm] = useState({
    model: '', menu: '', unitPrice: 0, unitCost: 0,
  })

  const [androidForm, setAndroidForm] = useState({
    manufacturer: '', model: '', menu: '', unitPrice: 0, unitCost: 0,
  })

  const [usedSalesForm, setUsedSalesForm] = useState({
    inventoryId: '', searchNumber: '', basePrice: 0, batteryStatus: '90',
    cameraStain: 'none', nwStatus: 'ok', deductionTotal: 0, unitPrice: 0, unitCost: 0,
  })

  const [accessoryForm, setAccessoryForm] = useState({
    accessoryId: '', quantity: 1, unitPrice: 0, unitCost: 0,
  })

  const [dataMigrationForm, setDataMigrationForm] = useState({ menu: '', unitPrice: 0 })
  const [operationGuideForm, setOperationGuideForm] = useState({ menu: '', unitPrice: 0 })

  const ipadModels = [...new Set(ipadRepairPrices.map(p => p.model))]
  const ipadMenus = ipadRepairPrices.filter(p => p.model === ipadForm.model && p.price > 0).map(p => p.repair_type)

  const androidManufacturers = [...new Set(androidRepairPrices.map(p => p.model.split(' ')[0]))]
  const androidFilteredModels = [...new Set(androidRepairPrices.filter(p => p.model.startsWith(androidForm.manufacturer)).map(p => p.model))]
  const androidMenus = androidRepairPrices.filter(p => p.model === androidForm.model && p.price > 0).map(p => p.repair_type)

  useEffect(() => {
    async function fetchMasterData() {
      const [staffRes, visitRes, accRes, iphoneModelsRes, iphoneMenusRes, suppliersRes, partsCostsRes, ipadPricesRes, androidPricesRes, shopRes, inventoryRes, squareSettingsRes] = await Promise.all([
        supabase.from('m_staff').select('id, name').eq('tenant_id', 1).eq('is_active', true).order('id'),
        supabase.from('m_visit_sources').select('id, name').eq('tenant_id', 1).eq('is_active', true).order('sort_order'),
        supabase.from('m_accessories').select('id, name, variation, price, cost, category_id, category:m_accessory_categories(name)').eq('tenant_id', 1).eq('is_active', true).order('category_id').order('name'),
        supabase.from('m_iphone_models').select('model, display_name').eq('tenant_id', 1).eq('is_active', true).order('sort_order'),
        supabase.from('m_repair_prices_iphone').select('repair_type').eq('tenant_id', 1).eq('is_active', true),
        supabase.from('m_suppliers').select('id, code, name').eq('tenant_id', 1).eq('is_active', true).order('sort_order'),
        supabase.from('m_costs_hw').select('model, parts_type').eq('tenant_id', 1).eq('is_active', true),
        supabase.from('m_repair_prices_ipad').select('model, repair_type, price, cost').eq('tenant_id', 1).eq('is_active', true),
        supabase.from('m_repair_prices_android').select('model, repair_type, price, cost').eq('tenant_id', 1).eq('is_active', true),
        supabase.from('m_shops').select('square_location_id').eq('id', shopId).single(),
        supabase.from('t_used_inventory').select('id, model, storage, rank, sales_price, total_cost, management_number').eq('tenant_id', 1).eq('shop_id', shopId).eq('status', '販売可').order('model'),
        supabase.from('m_system_settings').select('value').eq('key', 'square_application_id').single(),
      ])

      const accessoriesData = (accRes.data || []).map((a: any) => ({
        id: a.id, name: a.name, variation: a.variation, price: a.price, cost: a.cost,
        category_id: a.category_id, category_name: a.category?.name || 'その他',
      }))

      const uniqueIphoneMenus = iphoneMenusRes.data
        ? [...new Set(iphoneMenusRes.data.map(d => d.repair_type))].sort((a, b) => {
            const indexA = REPAIR_TYPE_ORDER.indexOf(a)
            const indexB = REPAIR_TYPE_ORDER.indexOf(b)
            if (indexA === -1 && indexB === -1) return a.localeCompare(b)
            if (indexA === -1) return 1
            if (indexB === -1) return -1
            return indexA - indexB
          })
        : []

      setStaff(staffRes.data || [])
      setVisitSources(visitRes.data || [])
      setAccessories(accessoriesData)
      setIphoneModels(iphoneModelsRes.data || [])
      setIphoneRepairMenus(uniqueIphoneMenus)
      setSuppliers(suppliersRes.data || [])
      setPartsCosts(partsCostsRes.data || [])
      setIpadRepairPrices(ipadPricesRes.data || [])
      setAndroidRepairPrices(androidPricesRes.data || [])
      setSquareLocationId(shopRes.data?.square_location_id || null)
      setSquareApplicationId(squareSettingsRes.data?.value || null)
      setUsedInventory(inventoryRes.data || [])
      setLoading(false)
    }
    fetchMasterData()
  }, [shopId])

  const getAvailableRepairMenus = (model: string): string[] => {
    if (!model) return []
    const availablePartsTypes = new Set(partsCosts.filter(p => p.model === model).map(p => p.parts_type))
    return iphoneRepairMenus.filter(menu => {
      const partsType = getPartsTypeFromMenu(menu)
      return availablePartsTypes.has(partsType)
    })
  }

  // iPhone価格取得
  useEffect(() => {
    async function fetchIphonePrice() {
      if (!iphoneForm.model || !iphoneForm.menu) return
      const { data } = await supabase.from('m_repair_prices_iphone').select('price').eq('tenant_id', 1).eq('model', iphoneForm.model).eq('repair_type', iphoneForm.menu).single()
      const partsType = getPartsTypeFromMenu(iphoneForm.menu)
      let costQuery = supabase.from('m_costs_hw').select('cost').eq('tenant_id', 1).eq('model', iphoneForm.model).eq('parts_type', partsType)
      if (iphoneForm.supplierId) costQuery = costQuery.eq('supplier_id', parseInt(iphoneForm.supplierId))
      const { data: costData } = await costQuery.single()
      setIphoneForm(prev => ({ ...prev, unitPrice: data?.price || 0, unitCost: costData?.cost || 0 }))
    }
    fetchIphonePrice()
  }, [iphoneForm.model, iphoneForm.menu, iphoneForm.supplierId])

  // 中古在庫選択時
  useEffect(() => {
    async function fetchSalesData() {
      if (!usedSalesForm.inventoryId) { setSalesDeductionMaster([]); return }
      const inventory = usedInventory.find(i => i.id === parseInt(usedSalesForm.inventoryId))
      if (!inventory) return
      const { data: priceData } = await supabase.from('m_sales_prices').select('price').eq('tenant_id', 1).eq('model', inventory.model).eq('storage', inventory.storage).eq('rank', inventory.rank).single()
      const basePrice = inventory.sales_price || priceData?.price || 0
      const { data: deductionData } = await supabase.from('m_sales_price_deductions').select('deduction_type, amount').eq('tenant_id', 1).eq('model', inventory.model).eq('is_active', true)
      setSalesDeductionMaster(deductionData || [])
      setUsedSalesForm(prev => ({ ...prev, basePrice, unitPrice: basePrice, unitCost: inventory.total_cost || 0, batteryStatus: '90', cameraStain: 'none', nwStatus: 'ok', deductionTotal: 0 }))
    }
    fetchSalesData()
  }, [usedSalesForm.inventoryId, usedInventory])

  // 販売価格の減額計算
  useEffect(() => {
    if (!usedSalesForm.basePrice) return
    const getDeduction = (type: string): number => salesDeductionMaster.find(d => d.deduction_type === type)?.amount || 0
    let total = 0

    // バッテリー減額（90%未満で10%減額）
    if (usedSalesForm.batteryStatus === '80_89' || usedSalesForm.batteryStatus === '79') {
      total += Math.round(usedSalesForm.basePrice * BATTERY_DEDUCTION_RATE)
    }

    // その他の減額（固定金額）
    if (usedSalesForm.cameraStain === 'minor') total += getDeduction('camera_stain_minor')
    else if (usedSalesForm.cameraStain === 'major') total += getDeduction('camera_stain_major')
    if (usedSalesForm.nwStatus === 'triangle') total += getDeduction('nw_triangle')
    else if (usedSalesForm.nwStatus === 'cross') total += getDeduction('nw_cross')
    setUsedSalesForm(prev => ({ ...prev, deductionTotal: total, unitPrice: prev.basePrice - total }))
  }, [usedSalesForm.batteryStatus, usedSalesForm.cameraStain, usedSalesForm.nwStatus, usedSalesForm.basePrice, salesDeductionMaster])

  // アクセサリ選択時
  useEffect(() => {
    if (accessoryForm.accessoryId) {
      const accessory = accessories.find(a => a.id === parseInt(accessoryForm.accessoryId))
      if (accessory) setAccessoryForm(prev => ({ ...prev, unitPrice: accessory.price || 0, unitCost: accessory.cost || 0 }))
    }
  }, [accessoryForm.accessoryId, accessories])

  // データ移行価格
  useEffect(() => {
    if (dataMigrationForm.menu) {
      const menuItem = dataMigrationMenus.find(m => m.value === dataMigrationForm.menu)
      setDataMigrationForm(prev => ({ ...prev, unitPrice: menuItem?.price || 0 }))
    }
  }, [dataMigrationForm.menu])

  // 操作案内価格
  useEffect(() => {
    if (operationGuideForm.menu) {
      const menuItem = operationGuideMenus.find(m => m.value === operationGuideForm.menu)
      setOperationGuideForm(prev => ({ ...prev, unitPrice: menuItem?.price || 0 }))
    }
  }, [operationGuideForm.menu])

  // 各種追加関数
  const addIphoneDetail = () => {
    if (!iphoneForm.model || !iphoneForm.menu) { alert('機種とメニューを選択してください'); return }
    const amount = iphoneForm.unitPrice, cost = iphoneForm.unitCost
    setDetails([...details, {
      id: Date.now().toString(), category: 'iPhone修理', subCategory: 'iPhone修理', model: iphoneForm.model,
      menu: iphoneForm.menu, storage: null, rank: null, accessoryId: null, usedInventoryId: null,
      supplierId: iphoneForm.supplierId ? parseInt(iphoneForm.supplierId) : null,
      quantity: 1, unitPrice: iphoneForm.unitPrice, unitCost: iphoneForm.unitCost, discount: 0, amount, cost, profit: amount - cost,
    }])
    setIphoneForm({ model: '', menu: '', supplierId: '', unitPrice: 0, unitCost: 0 })
  }

  const addIpadDetail = () => {
    if (!ipadForm.model || !ipadForm.menu) { alert('機種とメニューを選択してください'); return }
    const amount = ipadForm.unitPrice, cost = ipadForm.unitCost
    setDetails([...details, {
      id: Date.now().toString(), category: 'iPad修理', subCategory: 'iPad修理', model: ipadForm.model,
      menu: ipadForm.menu, storage: null, rank: null, accessoryId: null, usedInventoryId: null, supplierId: null,
      quantity: 1, unitPrice: ipadForm.unitPrice, unitCost: ipadForm.unitCost, discount: 0, amount, cost, profit: amount - cost,
    }])
    setIpadForm({ model: '', menu: '', unitPrice: 0, unitCost: 0 })
  }

  const addAndroidDetail = () => {
    if (!androidForm.model || !androidForm.menu) { alert('機種とメニューを選択してください'); return }
    const amount = androidForm.unitPrice, cost = androidForm.unitCost
    setDetails([...details, {
      id: Date.now().toString(), category: 'Android修理', subCategory: 'Android修理', model: androidForm.model,
      menu: androidForm.menu, storage: null, rank: null, accessoryId: null, usedInventoryId: null, supplierId: null,
      quantity: 1, unitPrice: androidForm.unitPrice, unitCost: androidForm.unitCost, discount: 0, amount, cost, profit: amount - cost,
    }])
    setAndroidForm({ manufacturer: '', model: '', menu: '', unitPrice: 0, unitCost: 0 })
  }

  const addUsedSalesDetail = async () => {
    if (!usedSalesForm.inventoryId) { alert('在庫を選択してください'); return }
    const inventory = usedInventory.find(i => i.id === parseInt(usedSalesForm.inventoryId))
    if (!inventory) return
    if (usedSalesForm.unitPrice !== inventory.sales_price) {
      await supabase.from('t_used_inventory').update({ sales_price: usedSalesForm.unitPrice }).eq('id', inventory.id)
    }
    const amount = usedSalesForm.unitPrice, cost = usedSalesForm.unitCost
    setDetails([...details, {
      id: Date.now().toString(), category: '中古販売', subCategory: '中古販売', model: inventory.model,
      menu: `${inventory.storage}GB ${inventory.rank}`, storage: inventory.storage, rank: inventory.rank,
      accessoryId: null, usedInventoryId: inventory.id, supplierId: null,
      quantity: 1, unitPrice: usedSalesForm.unitPrice, unitCost: usedSalesForm.unitCost, discount: 0, amount, cost, profit: amount - cost,
    }])
    setUsedSalesForm({ inventoryId: '', searchNumber: '', basePrice: 0, batteryStatus: '90', cameraStain: 'none', nwStatus: 'ok', deductionTotal: 0, unitPrice: 0, unitCost: 0 })
    setSalesDeductionMaster([])
  }

  const addAccessoryDetail = () => {
    if (!accessoryForm.accessoryId) { alert('アクセサリを選択してください'); return }
    const accessory = accessories.find(a => a.id === parseInt(accessoryForm.accessoryId))
    if (!accessory) return
    const quantity = accessoryForm.quantity
    const amount = accessoryForm.unitPrice * quantity, cost = accessoryForm.unitCost * quantity
    setDetails([...details, {
      id: Date.now().toString(), category: 'アクセサリ', subCategory: accessory.category_name, model: accessory.name,
      menu: accessory.variation || '', storage: null, rank: null, accessoryId: accessory.id, usedInventoryId: null, supplierId: null,
      quantity, unitPrice: accessoryForm.unitPrice, unitCost: accessoryForm.unitCost, discount: 0, amount, cost, profit: amount - cost,
    }])
    setAccessoryForm({ accessoryId: '', quantity: 1, unitPrice: 0, unitCost: 0 })
  }

  const addDataMigrationDetail = () => {
    if (!dataMigrationForm.menu) { alert('メニューを選択してください'); return }
    const menuItem = dataMigrationMenus.find(m => m.value === dataMigrationForm.menu)
    setDetails([...details, {
      id: Date.now().toString(), category: 'データ移行', subCategory: 'データ移行', model: '',
      menu: menuItem?.label || dataMigrationForm.menu, storage: null, rank: null, accessoryId: null, usedInventoryId: null, supplierId: null,
      quantity: 1, unitPrice: dataMigrationForm.unitPrice, unitCost: 0, discount: 0, amount: dataMigrationForm.unitPrice, cost: 0, profit: dataMigrationForm.unitPrice,
    }])
    setDataMigrationForm({ menu: '', unitPrice: 0 })
  }

  const addOperationGuideDetail = () => {
    if (!operationGuideForm.menu) { alert('メニューを選択してください'); return }
    const menuItem = operationGuideMenus.find(m => m.value === operationGuideForm.menu)
    setDetails([...details, {
      id: Date.now().toString(), category: '操作案内', subCategory: '操作案内', model: '',
      menu: menuItem?.label || operationGuideForm.menu, storage: null, rank: null, accessoryId: null, usedInventoryId: null, supplierId: null,
      quantity: 1, unitPrice: operationGuideForm.unitPrice, unitCost: 0, discount: 0, amount: operationGuideForm.unitPrice, cost: 0, profit: operationGuideForm.unitPrice,
    }])
    setOperationGuideForm({ menu: '', unitPrice: 0 })
  }

  const removeDetail = (id: string) => setDetails(details.filter(d => d.id !== id))

  const updateDetailDiscount = (id: string, discount: number) => {
    setDetails(details.map(d => {
      if (d.id === id) {
        const newAmount = (d.unitPrice * d.quantity) - discount
        return { ...d, discount, amount: newAmount, profit: newAmount - d.cost }
      }
      return d
    }))
  }

  const totalAmount = details.reduce((sum, d) => sum + d.amount, 0)
  const totalCost = details.reduce((sum, d) => sum + d.cost, 0)
  const totalProfit = totalAmount - totalCost

  const handleSubmit = async (useSquare: boolean) => {
    if (!formData.staffId) { alert('担当者を選択してください'); return }
    if (details.length === 0) { alert('明細を追加してください'); return }

    if (useSquare && !squareApplicationId) {
      alert('Square Application IDが設定されていません。\n管理画面のSquare連携設定を確認してください。')
      return
    }

    setSubmitting(true)
    try {
      const saleDate = new Date().toISOString().split('T')[0]
      // Square決済の場合、仮のsquare_payment_idを設定（Webhookで更新される）
      const pendingPaymentId = useSquare ? `PENDING_${Date.now()}` : null

      // テストモード対応: memoに【テスト】を追加
      let memo = useSquare ? 'Square決済予定' : null
      if (testMode) {
        memo = memo ? `【テスト】${memo}` : '【テスト】'
      }

      const { data: headerData, error: headerError } = await supabase
        .from('t_sales')
        .insert({
          tenant_id: 1, shop_id: shopId, staff_id: parseInt(formData.staffId),
          visit_source_id: formData.visitSourceId ? parseInt(formData.visitSourceId) : null,
          sale_date: saleDate, total_amount: totalAmount, total_cost: totalCost, total_profit: totalProfit,
          sale_type: 'sale',
          memo,
          square_payment_id: pendingPaymentId,
        })
        .select('id').single()

      if (headerError) throw headerError

      const detailRecords = details.map(d => ({
        sales_id: headerData.id, category: d.category, sub_category: d.subCategory, model: d.model, menu: d.menu,
        storage: d.storage, rank: d.rank, accessory_id: d.accessoryId, used_inventory_id: d.usedInventoryId,
        supplier_id: d.supplierId, quantity: d.quantity, unit_price: d.unitPrice, unit_cost: d.unitCost,
        amount: d.amount, cost: d.cost, profit: d.profit,
      }))
      await supabase.from('t_sales_details').insert(detailRecords)

      // 中古在庫のステータス更新（テストモードで在庫減らさない場合はスキップ）
      if (!testMode || testModeReduceInventory) {
        for (const detail of details) {
          if (detail.usedInventoryId) {
            await supabase.from('t_used_inventory').update({ status: '販売済' }).eq('id', detail.usedInventoryId)
          }
        }

        // パーツ在庫減算
        for (const detail of details) {
          if (detail.category === 'iPhone修理' && detail.model && detail.menu && detail.supplierId && isPartsRepairMenu(detail.menu)) {
            const partsType = getPartsTypeFromMenu(detail.menu)
            const { data: invData } = await supabase.from('t_parts_inventory').select('id, actual_qty').eq('tenant_id', 1).eq('shop_id', shopId).eq('model', detail.model).eq('parts_type', partsType).eq('supplier_id', detail.supplierId).single()
            if (invData) {
              await supabase.from('t_parts_inventory').update({ actual_qty: Math.max(0, (invData.actual_qty || 0) - detail.quantity) }).eq('id', invData.id)
            }
          }
        }
      }

      setDetails([])
      setSelectedCategory('')

      if (useSquare) {
        // Square POSアプリ起動用のデータ
        const itemDescriptions = details.map(d => d.category === '中古販売' ? `${d.model} ${d.storage}GB ${d.rank}` : d.category === 'iPhone修理' ? `${d.model} ${d.menu}` : d.subCategory || d.category).join(', ')

        // noteにsale_idを含めてWebhookで紐付けできるようにする
        const noteWithId = `[SALE:${headerData.id}] ${itemDescriptions}`.substring(0, 500)

        const squareData = {
          client_id: squareApplicationId,
          amount_money: {
            amount: totalAmount,
            currency_code: 'JPY'
          },
          callback_url: `${window.location.origin}/buyback-kiosk`,
          location_id: squareLocationId || '',
          notes: noteWithId,
        }

        const squareUrl = `square-commerce-v1://payment/create?data=${encodeURIComponent(JSON.stringify(squareData))}`

        console.log('Square POS URL:', squareUrl)
        console.log('Square Data:', squareData)

        const isMobile = /iPad|iPhone|iPod/.test(navigator.userAgent)
        if (isMobile) {
          window.location.href = squareUrl
        } else {
          alert(`売上を登録しました（ID: ${headerData.id}）\n\n合計金額: ¥${totalAmount.toLocaleString()}\n\nSquare POSアプリで決済してください。\n（iPadからアクセスするとSquareアプリが自動で開きます）`)
        }
      } else {
        alert(`売上を登録しました（ID: ${headerData.id}）\n\nエアレジで ¥${totalAmount.toLocaleString()} を会計してください。`)
      }

      // 在庫リストを更新
      const { data: inventoryData } = await supabase.from('t_used_inventory').select('id, model, storage, rank, sales_price, total_cost, management_number').eq('tenant_id', 1).eq('shop_id', shopId).eq('status', '販売可').order('model')
      setUsedInventory(inventoryData || [])
    } catch (error: any) {
      alert('登録に失敗しました: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #E5E7EB', borderTopColor: '#004AAD', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const cardStyle: React.CSSProperties = {
    background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '6px' }
  const selectStyle: React.CSSProperties = { width: '100%', padding: '12px', fontSize: '1rem', border: '2px solid #E5E7EB', borderRadius: '8px', background: 'white' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', fontSize: '1rem', border: '2px solid #E5E7EB', borderRadius: '8px', boxSizing: 'border-box' }
  const btnStyle: React.CSSProperties = { padding: '12px 24px', background: '#004AAD', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }

  const categoryButtons = [
    { key: 'iPhone修理', color: '#1a1a1a' },
    { key: 'iPad修理', color: '#374151' },
    { key: 'Android修理', color: '#059669' },
    { key: '中古販売', color: '#7C3AED' },
    { key: 'アクセサリ', color: '#DB2777' },
    { key: 'データ移行', color: '#0891B2' },
    { key: '操作案内', color: '#D97706' },
  ]

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* テストモード */}
      <div style={{
        background: testMode ? '#FEF3C7' : 'white',
        border: testMode ? '2px solid #F59E0B' : '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: '600', color: testMode ? '#B45309' : '#374151' }}>
              テストモード {testMode && '(有効)'}
            </span>
          </label>
          {testMode && (
            <>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={testModeReduceInventory}
                  onChange={(e) => setTestModeReduceInventory(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span>在庫も減らす</span>
              </label>
              <span style={{ fontSize: '0.85rem', color: '#92400E' }}>
                ※テストデータは後で一括削除可能
              </span>
            </>
          )}
        </div>
      </div>

      {/* 担当者・来店経路 */}
      <div style={cardStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>担当者 *</label>
            <select value={formData.staffId} onChange={(e) => setFormData({ ...formData, staffId: e.target.value })} style={selectStyle}>
              <option value="">選択してください</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>来店経路</label>
            <select value={formData.visitSourceId} onChange={(e) => setFormData({ ...formData, visitSourceId: e.target.value })} style={selectStyle}>
              <option value="">選択してください</option>
              {visitSources.map(vs => <option key={vs.id} value={vs.id}>{vs.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* カテゴリ選択 */}
      <div style={cardStyle}>
        <label style={labelStyle}>売上カテゴリ</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
          {categoryButtons.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              style={{
                padding: '14px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: selectedCategory === cat.key ? cat.color : '#9CA3AF',
                color: 'white', fontWeight: '600', fontSize: '0.9rem',
                boxShadow: selectedCategory === cat.key ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {cat.key}
            </button>
          ))}
        </div>
      </div>

      {/* iPhone修理 */}
      {selectedCategory === 'iPhone修理' && (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>iPhone修理</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>機種</label>
              <select value={iphoneForm.model} onChange={(e) => setIphoneForm({ ...iphoneForm, model: e.target.value, menu: '', unitPrice: 0, unitCost: 0 })} style={selectStyle}>
                <option value="">選択</option>
                {iphoneModels.map(m => <option key={m.model} value={m.model}>{m.display_name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>メニュー</label>
              <select value={iphoneForm.menu} onChange={(e) => setIphoneForm({ ...iphoneForm, menu: e.target.value })} style={selectStyle}>
                <option value="">選択</option>
                {getAvailableRepairMenus(iphoneForm.model).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>仕入先</label>
              <select value={iphoneForm.supplierId} onChange={(e) => setIphoneForm({ ...iphoneForm, supplierId: e.target.value })} style={selectStyle}>
                <option value="">選択</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>価格</label>
              <input type="tel" inputMode="numeric" value={iphoneForm.unitPrice || ''} onChange={(e) => setIphoneForm({ ...iphoneForm, unitPrice: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>原価</label>
              <input type="tel" inputMode="numeric" value={iphoneForm.unitCost || ''} onChange={(e) => setIphoneForm({ ...iphoneForm, unitCost: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} style={inputStyle} />
            </div>
          </div>
          <button onClick={addIphoneDetail} style={btnStyle}>明細に追加</button>
        </div>
      )}

      {/* iPad修理 */}
      {selectedCategory === 'iPad修理' && (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>iPad修理</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>機種</label>
              <select value={ipadForm.model} onChange={(e) => setIpadForm({ ...ipadForm, model: e.target.value, menu: '', unitPrice: 0, unitCost: 0 })} style={selectStyle}>
                <option value="">選択</option>
                {ipadModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>メニュー</label>
              <select value={ipadForm.menu} onChange={(e) => {
                const menu = e.target.value
                const priceData = ipadRepairPrices.find(p => p.model === ipadForm.model && p.repair_type === menu)
                setIpadForm({ ...ipadForm, menu, unitPrice: priceData?.price || 0, unitCost: priceData?.cost || 0 })
              }} style={selectStyle} disabled={!ipadForm.model}>
                <option value="">選択</option>
                {ipadMenus.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>価格</label>
              <input type="tel" inputMode="numeric" value={ipadForm.unitPrice || ''} onChange={(e) => setIpadForm({ ...ipadForm, unitPrice: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>原価</label>
              <input type="tel" inputMode="numeric" value={ipadForm.unitCost || ''} onChange={(e) => setIpadForm({ ...ipadForm, unitCost: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} style={inputStyle} />
            </div>
          </div>
          <button onClick={addIpadDetail} style={btnStyle}>明細に追加</button>
        </div>
      )}

      {/* Android修理 */}
      {selectedCategory === 'Android修理' && (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>Android修理</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>メーカー</label>
              <select value={androidForm.manufacturer} onChange={(e) => setAndroidForm({ ...androidForm, manufacturer: e.target.value, model: '', menu: '', unitPrice: 0, unitCost: 0 })} style={selectStyle}>
                <option value="">選択</option>
                {androidManufacturers.sort().map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>機種</label>
              <select value={androidForm.model} onChange={(e) => setAndroidForm({ ...androidForm, model: e.target.value, menu: '', unitPrice: 0, unitCost: 0 })} style={selectStyle} disabled={!androidForm.manufacturer}>
                <option value="">選択</option>
                {androidFilteredModels.sort().map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>メニュー</label>
              <select value={androidForm.menu} onChange={(e) => {
                const menu = e.target.value
                const priceData = androidRepairPrices.find(p => p.model === androidForm.model && p.repair_type === menu)
                setAndroidForm({ ...androidForm, menu, unitPrice: priceData?.price || 0, unitCost: priceData?.cost || 0 })
              }} style={selectStyle} disabled={!androidForm.model}>
                <option value="">選択</option>
                {androidMenus.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>価格</label>
              <input type="tel" inputMode="numeric" value={androidForm.unitPrice || ''} onChange={(e) => setAndroidForm({ ...androidForm, unitPrice: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>原価</label>
              <input type="tel" inputMode="numeric" value={androidForm.unitCost || ''} onChange={(e) => setAndroidForm({ ...androidForm, unitCost: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} style={inputStyle} />
            </div>
          </div>
          <button onClick={addAndroidDetail} style={btnStyle}>明細に追加</button>
        </div>
      )}

      {/* 中古販売 */}
      {selectedCategory === '中古販売' && (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>中古販売</h3>
          {usedInventory.length === 0 ? (
            <p style={{ color: '#6B7280' }}>販売可能な在庫がありません</p>
          ) : (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>管理番号で検索（IMEI下4桁）</label>
                <input type="tel" inputMode="numeric" maxLength={4} placeholder="例: 2345" value={usedSalesForm.searchNumber || ''} onChange={(e) => setUsedSalesForm({ ...usedSalesForm, searchNumber: e.target.value.replace(/\D/g, ''), inventoryId: '' })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>在庫選択</label>
                <select value={usedSalesForm.inventoryId} onChange={(e) => setUsedSalesForm({ ...usedSalesForm, inventoryId: e.target.value })} style={selectStyle}>
                  <option value="">選択してください</option>
                  {usedInventory.filter(inv => !usedSalesForm.searchNumber || (inv.management_number || '').includes(usedSalesForm.searchNumber)).map(inv => (
                    <option key={inv.id} value={inv.id}>[{inv.management_number || '----'}] {inv.model} {inv.storage}GB {inv.rank}</option>
                  ))}
                </select>
              </div>
              {usedSalesForm.inventoryId && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={labelStyle}>バッテリー状態</label>
                      <select value={usedSalesForm.batteryStatus} onChange={(e) => setUsedSalesForm({ ...usedSalesForm, batteryStatus: e.target.value })} style={selectStyle}>
                        <option value="90">90%以上</option>
                        <option value="80_89">80-89%</option>
                        <option value="79">79%以下</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>カメラ染み</label>
                      <select value={usedSalesForm.cameraStain} onChange={(e) => setUsedSalesForm({ ...usedSalesForm, cameraStain: e.target.value })} style={selectStyle}>
                        <option value="none">なし</option>
                        <option value="minor">少ない</option>
                        <option value="major">多い</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>NW制限</label>
                      <select value={usedSalesForm.nwStatus} onChange={(e) => setUsedSalesForm({ ...usedSalesForm, nwStatus: e.target.value })} style={selectStyle}>
                        <option value="ok">○</option>
                        <option value="triangle">△</option>
                        <option value="cross">×</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: '#F3F4F6', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>基準価格</div>
                      <div style={{ fontWeight: '600' }}>¥{usedSalesForm.basePrice.toLocaleString()}</div>
                    </div>
                    <div style={{ background: usedSalesForm.deductionTotal > 0 ? '#FEE2E2' : '#F3F4F6', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.85rem', color: usedSalesForm.deductionTotal > 0 ? '#DC2626' : '#6B7280' }}>減額合計</div>
                      <div style={{ fontWeight: '600', color: usedSalesForm.deductionTotal > 0 ? '#DC2626' : 'inherit' }}>-¥{usedSalesForm.deductionTotal.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#E0E7FF', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#004AAD' }}>販売価格</div>
                      <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>¥{usedSalesForm.unitPrice.toLocaleString()}</div>
                    </div>
                  </div>
                </>
              )}
              <button onClick={addUsedSalesDetail} disabled={!usedSalesForm.inventoryId} style={{ ...btnStyle, opacity: usedSalesForm.inventoryId ? 1 : 0.5 }}>明細に追加</button>
            </>
          )}
        </div>
      )}

      {/* アクセサリ */}
      {selectedCategory === 'アクセサリ' && (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>アクセサリ</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>アクセサリ</label>
              <select value={accessoryForm.accessoryId} onChange={(e) => setAccessoryForm({ ...accessoryForm, accessoryId: e.target.value })} style={selectStyle}>
                <option value="">選択してください</option>
                {accessories.map(acc => (
                  <option key={acc.id} value={acc.id}>[{acc.category_name}] {acc.name} {acc.variation || ''} - ¥{acc.price?.toLocaleString()}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>数量</label>
              <input type="tel" inputMode="numeric" value={accessoryForm.quantity || ''} onChange={(e) => setAccessoryForm({ ...accessoryForm, quantity: parseInt(e.target.value.replace(/\D/g, '')) || 1 })} style={inputStyle} />
            </div>
          </div>
          <button onClick={addAccessoryDetail} style={btnStyle}>明細に追加</button>
        </div>
      )}

      {/* データ移行 */}
      {selectedCategory === 'データ移行' && (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>データ移行</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>メニュー</label>
              <select value={dataMigrationForm.menu} onChange={(e) => setDataMigrationForm({ ...dataMigrationForm, menu: e.target.value })} style={selectStyle}>
                <option value="">選択してください</option>
                {dataMigrationMenus.map(m => <option key={m.value} value={m.value}>{m.label} - ¥{m.price.toLocaleString()}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>価格</label>
              <input type="tel" inputMode="numeric" value={dataMigrationForm.unitPrice || ''} onChange={(e) => setDataMigrationForm({ ...dataMigrationForm, unitPrice: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} style={inputStyle} />
            </div>
          </div>
          <button onClick={addDataMigrationDetail} style={btnStyle}>明細に追加</button>
        </div>
      )}

      {/* 操作案内 */}
      {selectedCategory === '操作案内' && (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>操作案内</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>メニュー</label>
              <select value={operationGuideForm.menu} onChange={(e) => setOperationGuideForm({ ...operationGuideForm, menu: e.target.value })} style={selectStyle}>
                <option value="">選択してください</option>
                {operationGuideMenus.map(m => <option key={m.value} value={m.value}>{m.label} - ¥{m.price.toLocaleString()}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>価格</label>
              <input type="tel" inputMode="numeric" value={operationGuideForm.unitPrice || ''} onChange={(e) => setOperationGuideForm({ ...operationGuideForm, unitPrice: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} style={inputStyle} />
            </div>
          </div>
          <button onClick={addOperationGuideDetail} style={btnStyle}>明細に追加</button>
        </div>
      )}

      {/* 明細一覧 */}
      {details.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>明細一覧</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#F3F4F6' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #E5E7EB' }}>カテゴリ</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #E5E7EB' }}>内容</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>値引</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>金額</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '2px solid #E5E7EB' }}></th>
                </tr>
              </thead>
              <tbody>
                {details.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '10px 8px' }}>{d.category}</td>
                    <td style={{ padding: '10px 8px' }}>{d.model} {d.menu}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <input type="tel" inputMode="numeric" value={d.discount || ''} onChange={(e) => updateDetailDiscount(d.id, parseInt(e.target.value.replace(/\D/g, '')) || 0)} placeholder="0" style={{ width: '70px', padding: '6px', textAlign: 'right', border: '1px solid #E5E7EB', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '600' }}>¥{d.amount.toLocaleString()}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <button onClick={() => removeDetail(d.id)} style={{ padding: '6px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>削除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#004AAD', color: 'white' }}>
                  <td colSpan={3} style={{ padding: '14px', fontWeight: '700', fontSize: '1rem' }}>合計</td>
                  <td style={{ padding: '14px', textAlign: 'right', fontWeight: '700', fontSize: '1.2rem' }}>¥{totalAmount.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 決済ボタン */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button onClick={() => handleSubmit(false)} disabled={submitting} style={{ flex: 1, padding: '16px', background: submitting ? '#9CA3AF' : '#6B7280', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer' }}>
              登録（エアレジで会計）
            </button>
            <button onClick={() => handleSubmit(true)} disabled={submitting} style={{ flex: 1, padding: '16px', background: submitting ? '#9CA3AF' : '#059669', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer' }}>
              Squareで決済
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
