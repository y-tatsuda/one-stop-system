'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_TENANT_ID, PARTS_MODEL_GROUPS, DEFAULT_HIDDEN_MODELS, DEFAULT_HIDDEN_PARTS } from '../lib/constants'
import { Shop, Supplier } from '../lib/types'

type PartsInventory = {
  id: number
  shop_id: number
  model: string
  parts_type: string
  supplier_id: number | null
  required_qty: number
  actual_qty: number
}

type IphoneModel = {
  model: string
  display_name: string
  sort_order: number
}

type GroupedInventoryItem = {
  groupKey: string
  displayName: string
  partsType: string
  items: PartsInventory[]
  totalRequired: number
  totalActual: number
  isGrouped: boolean
}

// パーツ種別の並び順
const PARTS_TYPE_ORDER = [
  'TH',
  'HG',
  'バッテリー',
  'HGバッテリー',
  'コネクタ',
  'リアカメラ',
  'インカメラ',
  'カメラ窓',
]

// パーツ種別の表示名
const partsTypeLabels: { [key: string]: string } = {
  'TH': 'THパネル',
  'HG': 'HGパネル',
  'バッテリー': '標準バッテリー',
  'HGバッテリー': 'HGバッテリー',
  'コネクタ': 'コネクタ',
  'リアカメラ': 'リアカメラ',
  'インカメラ': 'インカメラ',
  'カメラ窓': 'カメラ窓',
}

const getPartsTypeLabel = (partsType: string): string => {
  return partsTypeLabels[partsType] || partsType
}

// LocalStorage キー
const STORAGE_KEY_HIDDEN_MODELS = 'partsInventory_hiddenModels'
const STORAGE_KEY_HIDDEN_PARTS = 'partsInventory_hiddenParts'

export default function PartsInventoryPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventory, setInventory] = useState<PartsInventory[]>([])
  const [iphoneModels, setIphoneModels] = useState<IphoneModel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [selectedPartsType, setSelectedPartsType] = useState<string>('')
  const [showShortageOnly, setShowShortageOnly] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('0')
  const [editingRequiredKey, setEditingRequiredKey] = useState<string | null>(null)
  const [editRequiredValue, setEditRequiredValue] = useState<string>('0')

  // 表示設定
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [hiddenModels, setHiddenModels] = useState<string[]>([])
  const [hiddenParts, setHiddenParts] = useState<string[]>([])
  const [tempHiddenModels, setTempHiddenModels] = useState<string[]>([])
  const [tempHiddenParts, setTempHiddenParts] = useState<string[]>([])

  // 適正在庫見直しモーダル
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewInventory, setReviewInventory] = useState<PartsInventory[]>([])
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewSelectedShops, setReviewSelectedShops] = useState<number[]>([])
  const [reviewHiddenModels, setReviewHiddenModels] = useState<string[]>([])
  const [reviewHiddenParts, setReviewHiddenParts] = useState<string[]>([])
  const [changedCells, setChangedCells] = useState<Map<string, number>>(new Map())
  const [reviewEditingKey, setReviewEditingKey] = useState<string | null>(null)
  const [reviewEditValue, setReviewEditValue] = useState<string>('0')

  // LocalStorageから設定を読み込み
  useEffect(() => {
    const savedHiddenModels = localStorage.getItem(STORAGE_KEY_HIDDEN_MODELS)
    const savedHiddenParts = localStorage.getItem(STORAGE_KEY_HIDDEN_PARTS)

    if (savedHiddenModels) {
      setHiddenModels(JSON.parse(savedHiddenModels))
    } else {
      setHiddenModels(DEFAULT_HIDDEN_MODELS)
    }

    if (savedHiddenParts) {
      setHiddenParts(JSON.parse(savedHiddenParts))
    } else {
      setHiddenParts(DEFAULT_HIDDEN_PARTS)
    }
  }, [])

  // データ取得
  useEffect(() => {
    async function fetchData() {
      const { data: shopsData } = await supabase
        .from('m_shops')
        .select('id, name')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('is_active', true)
        .order('id')

      const { data: modelsData } = await supabase
        .from('m_iphone_models')
        .select('model, display_name, sort_order')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('is_active', true)
        .order('sort_order')

      const { data: suppliersData } = await supabase
        .from('m_suppliers')
        .select('id, code, name')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('is_active', true)
        .order('sort_order')

      setShops(shopsData || [])
      setIphoneModels(modelsData || [])
      setSuppliers(suppliersData || [])

      if (shopsData && shopsData.length > 0) {
        setSelectedShop(shopsData[0].id.toString())
      }

      if (suppliersData && suppliersData.length > 0) {
        setSelectedSupplier(suppliersData[0].id.toString())
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  // 店舗・仕入先変更時に在庫取得
  useEffect(() => {
    async function fetchInventory() {
      if (!selectedShop || !selectedSupplier) return

      const { data } = await supabase
        .from('t_parts_inventory')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('shop_id', parseInt(selectedShop))
        .eq('supplier_id', parseInt(selectedSupplier))
        .order('model')
        .order('parts_type')

      setInventory(data || [])
    }

    fetchInventory()
  }, [selectedShop, selectedSupplier])

  // 機種名を表示名に変換
  const getDisplayName = (model: string) => {
    const found = iphoneModels.find(m => m.model === model)
    return found ? found.display_name : model
  }

  // モデルがグループに属しているか確認
  const getModelGroup = (model: string): string | null => {
    for (const [groupName, group] of Object.entries(PARTS_MODEL_GROUPS)) {
      if (group.models.includes(model)) {
        return groupName
      }
    }
    return null
  }

  // パーツがグループで共有されているか確認
  const isSharedPart = (model: string, partsType: string): boolean => {
    const groupName = getModelGroup(model)
    if (!groupName) return false
    return PARTS_MODEL_GROUPS[groupName].sharedParts.includes(partsType)
  }

  // グループ内のモデル一覧を取得
  const getGroupModels = (groupName: string): string[] => {
    return PARTS_MODEL_GROUPS[groupName]?.models || []
  }

  // 表示用のモデル一覧を生成（グループ化済み）
  const getDisplayModels = (): string[] => {
    const displayModels: string[] = []
    const processedGroups = new Set<string>()

    // sort_order順にモデルを処理
    const sortedModels = [...iphoneModels].sort((a, b) => a.sort_order - b.sort_order)

    for (const model of sortedModels) {
      const groupName = getModelGroup(model.model)
      if (groupName) {
        if (!processedGroups.has(groupName)) {
          displayModels.push(groupName)
          processedGroups.add(groupName)
        }
      } else {
        displayModels.push(model.model)
      }
    }

    return displayModels
  }

  // グループ化された在庫データを生成
  const getGroupedInventory = (): Map<string, GroupedInventoryItem[]> => {
    const result = new Map<string, GroupedInventoryItem[]>()
    const processedKeys = new Set<string>()

    // フィルタリング（非表示パーツ・未定義パーツを除外）
    const filteredInventory = inventory.filter(item => {
      if (!PARTS_TYPE_ORDER.includes(item.parts_type)) return false
      if (hiddenParts.includes(item.parts_type)) return false
      if (selectedPartsType && item.parts_type !== selectedPartsType) return false
      return true
    })

    for (const item of filteredInventory) {
      const groupName = getModelGroup(item.model)
      const isShared = isSharedPart(item.model, item.parts_type)

      let groupKey: string
      let displayName: string
      let isGrouped: boolean

      if (groupName && isShared) {
        groupKey = `${groupName}:${item.parts_type}`
        displayName = groupName
        isGrouped = true
      } else {
        groupKey = `${item.model}:${item.parts_type}`
        displayName = getDisplayName(item.model)
        isGrouped = false
      }

      if (processedKeys.has(groupKey)) {
        // 既存のグループに追加
        for (const [modelKey, items] of result) {
          const existingItem = items.find(i => i.groupKey === groupKey)
          if (existingItem) {
            existingItem.items.push(item)
            existingItem.totalRequired += item.required_qty
            existingItem.totalActual += item.actual_qty
            break
          }
        }
        continue
      }

      processedKeys.add(groupKey)

      // モデルキーを決定
      let modelKey: string
      if (groupName && isShared) {
        modelKey = groupName
      } else {
        modelKey = item.model
      }

      if (!result.has(modelKey)) {
        result.set(modelKey, [])
      }

      result.get(modelKey)!.push({
        groupKey,
        displayName,
        partsType: item.parts_type,
        items: [item],
        totalRequired: item.required_qty,
        totalActual: item.actual_qty,
        isGrouped,
      })
    }

    // 各モデル内のパーツをソート
    for (const [, items] of result) {
      items.sort((a, b) => {
        const indexA = PARTS_TYPE_ORDER.indexOf(a.partsType)
        const indexB = PARTS_TYPE_ORDER.indexOf(b.partsType)
        if (indexA === -1 && indexB === -1) return a.partsType.localeCompare(b.partsType)
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })
    }

    return result
  }

  // 表示するモデルのキー一覧（ソート済み、非表示除外済み）
  const getVisibleModelKeys = (): string[] => {
    const groupedInventory = getGroupedInventory()
    const allKeys = Array.from(groupedInventory.keys())

    // 非表示モデルを除外
    const visibleKeys = allKeys.filter(key => {
      // グループの場合は、グループに属するすべてのモデルが非表示かどうかチェック
      if (PARTS_MODEL_GROUPS[key]) {
        const groupModels = getGroupModels(key)
        return !groupModels.every(m => hiddenModels.includes(m))
      }
      // 単独モデルの場合
      return !hiddenModels.includes(key)
    })

    // sort_order順にソート
    return visibleKeys.sort((a, b) => {
      const getMinSortOrder = (key: string): number => {
        if (PARTS_MODEL_GROUPS[key]) {
          const groupModels = getGroupModels(key)
          const orders = groupModels.map(m => {
            const model = iphoneModels.find(im => im.model === m)
            return model?.sort_order || 999
          })
          return Math.min(...orders)
        }
        const model = iphoneModels.find(im => im.model === key)
        return model?.sort_order || 999
      }
      return getMinSortOrder(a) - getMinSortOrder(b)
    })
  }

  // 不足のみフィルタリングを適用
  const applyShortageFilter = (items: GroupedInventoryItem[]): GroupedInventoryItem[] => {
    if (!showShortageOnly) return items
    return items.filter(item => item.totalActual < item.totalRequired)
  }

  // 実在庫更新（グループ対応）
  const updateActualQty = async (groupedItem: GroupedInventoryItem, newQty: number) => {
    if (groupedItem.isGrouped) {
      // グループ化されている場合は、各モデルの在庫を同じ値に更新
      const itemCount = groupedItem.items.length
      const qtyPerItem = Math.floor(newQty / itemCount)
      const remainder = newQty % itemCount

      for (let i = 0; i < groupedItem.items.length; i++) {
        const item = groupedItem.items[i]
        const qty = qtyPerItem + (i < remainder ? 1 : 0)
        const { error } = await supabase
          .from('t_parts_inventory')
          .update({ actual_qty: qty, updated_at: new Date().toISOString() })
          .eq('id', item.id)

        if (error) {
          alert('更新に失敗しました: ' + error.message)
          return
        }
      }

      // ローカル状態を更新
      setInventory(prev => prev.map(item => {
        const idx = groupedItem.items.findIndex(gi => gi.id === item.id)
        if (idx !== -1) {
          const qty = qtyPerItem + (idx < remainder ? 1 : 0)
          return { ...item, actual_qty: qty }
        }
        return item
      }))
    } else {
      // 単独モデルの場合は通常更新
      const item = groupedItem.items[0]
      const { error } = await supabase
        .from('t_parts_inventory')
        .update({ actual_qty: newQty, updated_at: new Date().toISOString() })
        .eq('id', item.id)

      if (error) {
        alert('更新に失敗しました: ' + error.message)
        return
      }

      setInventory(prev => prev.map(i =>
        i.id === item.id ? { ...i, actual_qty: newQty } : i
      ))
    }
    setEditingKey(null)
  }

  // 適正在庫更新（グループ対応）
  const updateRequiredQty = async (groupedItem: GroupedInventoryItem, newQty: number) => {
    if (groupedItem.isGrouped) {
      // グループ化されている場合は、各モデルの在庫を同じ値に更新
      const itemCount = groupedItem.items.length
      const qtyPerItem = Math.floor(newQty / itemCount)
      const remainder = newQty % itemCount

      for (let i = 0; i < groupedItem.items.length; i++) {
        const item = groupedItem.items[i]
        const qty = qtyPerItem + (i < remainder ? 1 : 0)
        const { error } = await supabase
          .from('t_parts_inventory')
          .update({ required_qty: qty, updated_at: new Date().toISOString() })
          .eq('id', item.id)

        if (error) {
          alert('更新に失敗しました: ' + error.message)
          return
        }
      }

      // ローカル状態を更新
      setInventory(prev => prev.map(item => {
        const idx = groupedItem.items.findIndex(gi => gi.id === item.id)
        if (idx !== -1) {
          const qty = qtyPerItem + (idx < remainder ? 1 : 0)
          return { ...item, required_qty: qty }
        }
        return item
      }))
    } else {
      // 単独モデルの場合は通常更新
      const item = groupedItem.items[0]
      const { error } = await supabase
        .from('t_parts_inventory')
        .update({ required_qty: newQty, updated_at: new Date().toISOString() })
        .eq('id', item.id)

      if (error) {
        alert('更新に失敗しました: ' + error.message)
        return
      }

      setInventory(prev => prev.map(i =>
        i.id === item.id ? { ...i, required_qty: newQty } : i
      ))
    }
    setEditingRequiredKey(null)
  }

  // 不足数計算
  const getShortage = (item: GroupedInventoryItem) => {
    return Math.max(0, item.totalRequired - item.totalActual)
  }

  // 全体の不足件数
  const groupedInventory = getGroupedInventory()
  const visibleModelKeys = getVisibleModelKeys()
  let totalShortageCount = 0
  for (const key of visibleModelKeys) {
    const items = groupedInventory.get(key) || []
    for (const item of items) {
      if (item.totalActual < item.totalRequired) {
        totalShortageCount++
      }
    }
  }

  // 設定モーダルを開く
  const openSettingsModal = () => {
    setTempHiddenModels([...hiddenModels])
    setTempHiddenParts([...hiddenParts])
    setShowSettingsModal(true)
  }

  // 設定を保存
  const saveSettings = () => {
    setHiddenModels(tempHiddenModels)
    setHiddenParts(tempHiddenParts)
    localStorage.setItem(STORAGE_KEY_HIDDEN_MODELS, JSON.stringify(tempHiddenModels))
    localStorage.setItem(STORAGE_KEY_HIDDEN_PARTS, JSON.stringify(tempHiddenParts))
    setShowSettingsModal(false)
  }

  // 適正在庫見直しモーダルを開く
  const openReviewModal = async () => {
    setShowReviewModal(true)
    setReviewLoading(true)
    setChangedCells(new Map())
    setReviewHiddenModels([...hiddenModels])
    setReviewHiddenParts([...hiddenParts])
    setReviewEditingKey(null)
    // 全店舗を選択状態にする
    const allShopIds = shops.map(s => s.id)
    setReviewSelectedShops(allShopIds)

    // 全店舗のデータを取得
    const { data } = await supabase
      .from('t_parts_inventory')
      .select('*')
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .in('shop_id', allShopIds)
      .order('shop_id')
      .order('model')
      .order('parts_type')

    setReviewInventory(data || [])
    setReviewLoading(false)
  }

  // 見直しモーダル: 店舗選択切り替え
  const toggleReviewShop = (shopId: number) => {
    setReviewSelectedShops(prev => {
      if (prev.includes(shopId)) {
        if (prev.length <= 1) return prev // 最低1店舗は選択
        return prev.filter(id => id !== shopId)
      }
      return [...prev, shopId]
    })
  }

  // 見直しモーダル: セル変更を記録（複数アイテムを一括対応）
  const handleReviewCellChangeBatch = (changes: { itemId: number; newValue: number }[]) => {
    setChangedCells(prev => {
      const newMap = new Map(prev)
      for (const { itemId, newValue } of changes) {
        newMap.set(itemId.toString(), newValue)
      }
      return newMap
    })

    setReviewInventory(prev => prev.map(item => {
      const change = changes.find(c => c.itemId === item.id)
      if (change) return { ...item, required_qty: change.newValue }
      return item
    }))
    setReviewEditingKey(null)
  }

  // 見直しモーダル: 保存
  const saveReviewChanges = async () => {
    if (changedCells.size === 0) {
      setShowReviewModal(false)
      return
    }

    setReviewSaving(true)

    const entries = Array.from(changedCells.entries())
    for (const [idStr, newQty] of entries) {
      const { error } = await supabase
        .from('t_parts_inventory')
        .update({ required_qty: newQty, updated_at: new Date().toISOString() })
        .eq('id', parseInt(idStr))

      if (error) {
        alert('更新に失敗しました: ' + error.message)
        setReviewSaving(false)
        return
      }
    }

    setReviewSaving(false)
    setShowReviewModal(false)

    // メイン画面の在庫データをリフレッシュ
    if (selectedShop && selectedSupplier) {
      const { data } = await supabase
        .from('t_parts_inventory')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('shop_id', parseInt(selectedShop))
        .eq('supplier_id', parseInt(selectedSupplier))
        .order('model')
        .order('parts_type')

      setInventory(data || [])
    }
  }

  // 見直しモーダル用: 店舗×仕入先 の列定義を生成
  const getReviewColumns = (): { shopId: number; shopName: string; supplierId: number; supplierName: string }[] => {
    const cols: { shopId: number; shopName: string; supplierId: number; supplierName: string }[] = []
    for (const shop of shops) {
      if (!reviewSelectedShops.includes(shop.id)) continue
      for (const supplier of suppliers) {
        cols.push({ shopId: shop.id, shopName: shop.name, supplierId: supplier.id, supplierName: supplier.name })
      }
    }
    return cols
  }

  // 見直しモーダル用: グループ化された在庫データを店舗×仕入先別に生成
  type ReviewCell = { shopId: number; supplierId: number; items: PartsInventory[]; totalRequired: number }
  type ReviewRow = { modelKey: string; displayName: string; partsType: string; cells: ReviewCell[]; cumulativeRequired: number }

  const getReviewGroupedData = (): ReviewRow[] => {
    const result: ReviewRow[] = []
    const columns = getReviewColumns()

    // フィルタリング（選択店舗のみ）
    const filteredInventory = reviewInventory.filter(item => {
      if (!reviewSelectedShops.includes(item.shop_id)) return false
      if (!PARTS_TYPE_ORDER.includes(item.parts_type)) return false
      if (reviewHiddenParts.includes(item.parts_type)) return false
      return true
    })

    const displayModels = getDisplayModels()
    const processedKeys = new Set<string>()

    for (const modelOrGroup of displayModels) {
      if (PARTS_MODEL_GROUPS[modelOrGroup]) {
        const groupModels = getGroupModels(modelOrGroup)
        if (groupModels.every(m => reviewHiddenModels.includes(m))) continue
      } else {
        if (reviewHiddenModels.includes(modelOrGroup)) continue
      }

      for (const partsType of PARTS_TYPE_ORDER) {
        if (reviewHiddenParts.includes(partsType)) continue

        const key = `${modelOrGroup}:${partsType}`
        if (processedKeys.has(key)) continue
        processedKeys.add(key)

        const cells: ReviewCell[] = []
        let cumulativeRequired = 0

        for (const col of columns) {
          let matchingItems: PartsInventory[]

          if (PARTS_MODEL_GROUPS[modelOrGroup]) {
            const groupModels = getGroupModels(modelOrGroup)
            const isShared = PARTS_MODEL_GROUPS[modelOrGroup].sharedParts.includes(partsType)

            if (isShared) {
              matchingItems = filteredInventory.filter(item =>
                groupModels.includes(item.model) && item.parts_type === partsType &&
                item.shop_id === col.shopId && item.supplier_id === col.supplierId
              )
            } else {
              cells.push({ shopId: col.shopId, supplierId: col.supplierId, items: [], totalRequired: 0 })
              continue
            }
          } else {
            matchingItems = filteredInventory.filter(item =>
              item.model === modelOrGroup && item.parts_type === partsType &&
              item.shop_id === col.shopId && item.supplier_id === col.supplierId
            )
          }

          const totalRequired = matchingItems.reduce((sum, item) => sum + item.required_qty, 0)
          cumulativeRequired += totalRequired

          cells.push({ shopId: col.shopId, supplierId: col.supplierId, items: matchingItems, totalRequired })
        }

        const hasData = cells.some(c => c.items.length > 0)
        if (!hasData) continue

        result.push({
          modelKey: modelOrGroup,
          displayName: PARTS_MODEL_GROUPS[modelOrGroup] ? modelOrGroup : getDisplayName(modelOrGroup),
          partsType,
          cells,
          cumulativeRequired,
        })
      }
    }

    return result
  }

  // 見直しモーダル: モデル表示切り替え
  const toggleReviewModelVisibility = (modelOrGroup: string) => {
    if (PARTS_MODEL_GROUPS[modelOrGroup]) {
      const groupModels = getGroupModels(modelOrGroup)
      const allHidden = groupModels.every(m => reviewHiddenModels.includes(m))
      if (allHidden) {
        setReviewHiddenModels(reviewHiddenModels.filter(m => !groupModels.includes(m)))
      } else {
        setReviewHiddenModels([...reviewHiddenModels, ...groupModels.filter(m => !reviewHiddenModels.includes(m))])
      }
    } else {
      if (reviewHiddenModels.includes(modelOrGroup)) {
        setReviewHiddenModels(reviewHiddenModels.filter(m => m !== modelOrGroup))
      } else {
        setReviewHiddenModels([...reviewHiddenModels, modelOrGroup])
      }
    }
  }

  // 見直しモーダル: パーツ表示切り替え
  const toggleReviewPartsVisibility = (partsType: string) => {
    if (reviewHiddenParts.includes(partsType)) {
      setReviewHiddenParts(reviewHiddenParts.filter(p => p !== partsType))
    } else {
      setReviewHiddenParts([...reviewHiddenParts, partsType])
    }
  }

  // 見直しモーダル: モデルが表示されているか
  const isReviewModelVisible = (modelOrGroup: string): boolean => {
    if (PARTS_MODEL_GROUPS[modelOrGroup]) {
      const groupModels = getGroupModels(modelOrGroup)
      return !groupModels.every(m => reviewHiddenModels.includes(m))
    }
    return !reviewHiddenModels.includes(modelOrGroup)
  }

  // 見直しモーダル: パーツが表示されているか
  const isReviewPartsVisible = (partsType: string): boolean => {
    return !reviewHiddenParts.includes(partsType)
  }

  // モデル表示切り替え
  const toggleModelVisibility = (modelOrGroup: string) => {
    if (PARTS_MODEL_GROUPS[modelOrGroup]) {
      // グループの場合は、グループ内のすべてのモデルを切り替え
      const groupModels = getGroupModels(modelOrGroup)
      const allHidden = groupModels.every(m => tempHiddenModels.includes(m))
      if (allHidden) {
        setTempHiddenModels(tempHiddenModels.filter(m => !groupModels.includes(m)))
      } else {
        setTempHiddenModels([...tempHiddenModels, ...groupModels.filter(m => !tempHiddenModels.includes(m))])
      }
    } else {
      // 単独モデルの場合
      if (tempHiddenModels.includes(modelOrGroup)) {
        setTempHiddenModels(tempHiddenModels.filter(m => m !== modelOrGroup))
      } else {
        setTempHiddenModels([...tempHiddenModels, modelOrGroup])
      }
    }
  }

  // パーツ表示切り替え
  const togglePartsVisibility = (partsType: string) => {
    if (tempHiddenParts.includes(partsType)) {
      setTempHiddenParts(tempHiddenParts.filter(p => p !== partsType))
    } else {
      setTempHiddenParts([...tempHiddenParts, partsType])
    }
  }

  // モデルが表示されているか（設定用）
  const isModelVisible = (modelOrGroup: string): boolean => {
    if (PARTS_MODEL_GROUPS[modelOrGroup]) {
      const groupModels = getGroupModels(modelOrGroup)
      return !groupModels.every(m => tempHiddenModels.includes(m))
    }
    return !tempHiddenModels.includes(modelOrGroup)
  }

  // パーツが表示されているか（設定用）
  const isPartsVisible = (partsType: string): boolean => {
    return !tempHiddenParts.includes(partsType)
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
        <h1 className="page-title">パーツ在庫管理</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            onClick={openReviewModal}
            className="btn btn-primary"
          >
            適正在庫 見直し
          </button>
          <button
            onClick={openSettingsModal}
            className="btn btn-secondary"
          >
            ⚙ 表示設定
          </button>
        </div>
      </div>

      {/* フィルター */}
      <div className="card mb-lg">
        <div className="card-body">
          <div className="form-grid form-grid-5">
            <div className="form-group">
              <label className="form-label">店舗</label>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="form-select"
              >
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">仕入先</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="form-select"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">パーツ種類</label>
              <select
                value={selectedPartsType}
                onChange={(e) => setSelectedPartsType(e.target.value)}
                className="form-select"
              >
                <option value="">すべて</option>
                {PARTS_TYPE_ORDER.filter(type => !hiddenParts.includes(type)).map((type) => (
                  <option key={type} value={type}>{partsTypeLabels[type] || type}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label className="form-check">
                <input
                  type="checkbox"
                  checked={showShortageOnly}
                  onChange={(e) => setShowShortageOnly(e.target.checked)}
                />
                <span>不足のみ表示</span>
              </label>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              {totalShortageCount > 0 && (
                <span className="badge badge-danger" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                  不足: {totalShortageCount}件
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 在庫一覧 */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {visibleModelKeys.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">在庫データがありません</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>機種</th>
                    <th>パーツ</th>
                    <th className="text-center">適正在庫</th>
                    <th className="text-center">実在庫</th>
                    <th className="text-center">不足</th>
                    <th className="text-center">状態</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleModelKeys.map((modelKey) => {
                    const items = applyShortageFilter(groupedInventory.get(modelKey) || [])
                    if (items.length === 0) return null

                    return items.map((item, idx) => {
                      const shortage = getShortage(item)
                      const isShortage = item.totalActual < item.totalRequired
                      const isEditingActual = editingKey === item.groupKey
                      const isEditingRequired = editingRequiredKey === item.groupKey

                      return (
                        <tr key={item.groupKey} style={isShortage ? { backgroundColor: 'var(--color-danger-light)' } : {}}>
                          {idx === 0 ? (
                            <td rowSpan={items.length} style={{ fontWeight: 600, verticalAlign: 'middle' }}>
                              {item.displayName}
                            </td>
                          ) : null}
                          <td>{getPartsTypeLabel(item.partsType)}</td>
                          <td className="text-center">
                            {isEditingRequired ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <input
                                  type="tel"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={editRequiredValue}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '')
                                    setEditRequiredValue(value)
                                  }}
                                  className="form-input"
                                  style={{ width: '70px', textAlign: 'center', padding: '4px 8px' }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => updateRequiredQty(item, parseInt(editRequiredValue) || 0)}
                                  className="btn btn-sm btn-success"
                                  style={{ padding: '4px 8px', minWidth: 'auto' }}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingRequiredKey(null)}
                                  className="btn btn-sm btn-secondary"
                                  style={{ padding: '4px 8px', minWidth: 'auto' }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingRequiredKey(item.groupKey)
                                  setEditRequiredValue(item.totalRequired.toString())
                                }}
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: 'var(--radius)',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  color: 'var(--color-text)',
                                }}
                              >
                                {item.totalRequired}
                              </button>
                            )}
                          </td>
                          <td className="text-center">
                            {isEditingActual ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <input
                                  type="tel"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={editValue}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '')
                                    setEditValue(value)
                                  }}
                                  className="form-input"
                                  style={{ width: '70px', textAlign: 'center', padding: '4px 8px' }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => updateActualQty(item, parseInt(editValue) || 0)}
                                  className="btn btn-sm btn-success"
                                  style={{ padding: '4px 8px', minWidth: 'auto' }}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingKey(null)}
                                  className="btn btn-sm btn-secondary"
                                  style={{ padding: '4px 8px', minWidth: 'auto' }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingKey(item.groupKey)
                                  setEditValue(item.totalActual.toString())
                                }}
                                style={{
                                  fontWeight: 600,
                                  padding: '4px 12px',
                                  borderRadius: 'var(--radius)',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  color: isShortage ? 'var(--color-danger)' : 'var(--color-text)',
                                }}
                              >
                                {item.totalActual}
                              </button>
                            )}
                          </td>
                          <td className="text-center">
                            {shortage > 0 ? (
                              <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>-{shortage}</span>
                            ) : (
                              <span style={{ color: 'var(--color-text-light)' }}>-</span>
                            )}
                          </td>
                          <td className="text-center">
                            {isShortage ? (
                              <span className="badge badge-danger">不足</span>
                            ) : (
                              <span className="badge badge-success">OK</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 適正在庫見直しモーダル */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95vw', width: '1100px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2 className="modal-title">適正在庫 見直し</h2>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ overflow: 'auto', flex: 1, padding: '16px' }}>
              {reviewLoading ? (
                <div className="loading">
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <>
                  {/* 店舗選択 */}
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-light)' }}>店舗</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {shops.map((shop) => (
                        <button
                          key={shop.id}
                          onClick={() => toggleReviewShop(shop.id)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '16px',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            backgroundColor: reviewSelectedShops.includes(shop.id) ? 'var(--color-primary)' : 'transparent',
                            color: reviewSelectedShops.includes(shop.id) ? '#fff' : 'var(--color-text)',
                          }}
                        >
                          {shop.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* モデル表示切り替え */}
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-light)' }}>モデル</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {getDisplayModels().map((modelOrGroup) => (
                        <button
                          key={modelOrGroup}
                          onClick={() => toggleReviewModelVisibility(modelOrGroup)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '16px',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            backgroundColor: isReviewModelVisible(modelOrGroup) ? 'var(--color-primary)' : 'transparent',
                            color: isReviewModelVisible(modelOrGroup) ? '#fff' : 'var(--color-text)',
                          }}
                        >
                          {PARTS_MODEL_GROUPS[modelOrGroup] ? modelOrGroup : getDisplayName(modelOrGroup)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* パーツ表示切り替え */}
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-light)' }}>パーツ</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {PARTS_TYPE_ORDER.map((partsType) => (
                        <button
                          key={partsType}
                          onClick={() => toggleReviewPartsVisibility(partsType)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '16px',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            backgroundColor: isReviewPartsVisible(partsType) ? 'var(--color-primary)' : 'transparent',
                            color: isReviewPartsVisible(partsType) ? '#fff' : 'var(--color-text)',
                          }}
                        >
                          {getPartsTypeLabel(partsType)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* テーブル */}
                  {(() => {
                    const reviewData = getReviewGroupedData()
                    const columns = getReviewColumns()

                    if (reviewData.length === 0) {
                      return (
                        <div className="empty-state">
                          <p className="empty-state-text">データがありません</p>
                        </div>
                      )
                    }

                    // モデルごとにグループ化
                    const modelGroups = new Map<string, ReviewRow[]>()
                    for (const row of reviewData) {
                      if (!modelGroups.has(row.modelKey)) {
                        modelGroups.set(row.modelKey, [])
                      }
                      modelGroups.get(row.modelKey)!.push(row)
                    }

                    // 選択中の店舗名（ヘッダー用）
                    const selectedShopObjects = shops.filter(s => reviewSelectedShops.includes(s.id))
                    const showCumulative = reviewSelectedShops.length > 1

                    return (
                      <div className="table-wrapper" style={{ border: 'none' }}>
                        <table className="data-table" style={{ fontSize: '0.85rem' }}>
                          <thead>
                            {/* 店舗グループヘッダー */}
                            <tr>
                              <th rowSpan={2} style={{ minWidth: '70px', verticalAlign: 'middle' }}>機種</th>
                              <th rowSpan={2} style={{ minWidth: '90px', verticalAlign: 'middle' }}>パーツ</th>
                              {selectedShopObjects.map(shop => (
                                <th
                                  key={shop.id}
                                  colSpan={suppliers.length}
                                  className="text-center"
                                  style={{ borderBottom: 'none', background: 'var(--color-bg-secondary, #f8f9fa)' }}
                                >
                                  {shop.name}
                                </th>
                              ))}
                              {showCumulative && (
                                <th rowSpan={2} className="text-center" style={{ minWidth: '60px', verticalAlign: 'middle', background: 'var(--color-primary-light, #e8f0fe)' }}>
                                  累計
                                </th>
                              )}
                            </tr>
                            {/* 仕入先サブヘッダー */}
                            <tr>
                              {selectedShopObjects.map(shop => (
                                suppliers.map(s => (
                                  <th key={`${shop.id}-${s.id}`} className="text-center" style={{ minWidth: '60px', fontSize: '0.8rem' }}>
                                    {s.name}
                                  </th>
                                ))
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from(modelGroups.entries()).map(([, rows]) => (
                              rows.map((row, idx) => (
                                <tr key={`${row.modelKey}:${row.partsType}`}>
                                  {idx === 0 ? (
                                    <td rowSpan={rows.length} style={{ fontWeight: 600, verticalAlign: 'middle' }}>
                                      {row.displayName}
                                    </td>
                                  ) : null}
                                  <td>{getPartsTypeLabel(row.partsType)}</td>
                                  {row.cells.map((cell, cellIdx) => {
                                    const cellKey = `${row.modelKey}:${row.partsType}:${cell.shopId}:${cell.supplierId}`
                                    const isEditing = reviewEditingKey === cellKey

                                    if (cell.items.length === 0) {
                                      return <td key={cellIdx} className="text-center" style={{ color: 'var(--color-text-light)' }}>-</td>
                                    }

                                    const hasChanges = cell.items.some(item => changedCells.has(item.id.toString()))

                                    return (
                                      <td key={cellIdx} className="text-center">
                                        {isEditing ? (
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <input
                                              type="tel"
                                              inputMode="numeric"
                                              pattern="[0-9]*"
                                              value={reviewEditValue}
                                              onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9]/g, '')
                                                setReviewEditValue(value)
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  const newQty = parseInt(reviewEditValue) || 0
                                                  const changes: { itemId: number; newValue: number }[] = []
                                                  if (cell.items.length === 1) {
                                                    changes.push({ itemId: cell.items[0].id, newValue: newQty })
                                                  } else {
                                                    const perItem = Math.floor(newQty / cell.items.length)
                                                    const remainder = newQty % cell.items.length
                                                    cell.items.forEach((item, i) => {
                                                      changes.push({ itemId: item.id, newValue: perItem + (i < remainder ? 1 : 0) })
                                                    })
                                                  }
                                                  handleReviewCellChangeBatch(changes)
                                                } else if (e.key === 'Escape') {
                                                  setReviewEditingKey(null)
                                                }
                                              }}
                                              className="form-input"
                                              style={{ width: '55px', textAlign: 'center', padding: '2px 4px', fontSize: '0.85rem' }}
                                              autoFocus
                                            />
                                            <button
                                              onClick={() => {
                                                const newQty = parseInt(reviewEditValue) || 0
                                                const changes: { itemId: number; newValue: number }[] = []
                                                if (cell.items.length === 1) {
                                                  changes.push({ itemId: cell.items[0].id, newValue: newQty })
                                                } else {
                                                  const perItem = Math.floor(newQty / cell.items.length)
                                                  const remainder = newQty % cell.items.length
                                                  cell.items.forEach((item, i) => {
                                                    changes.push({ itemId: item.id, newValue: perItem + (i < remainder ? 1 : 0) })
                                                  })
                                                }
                                                handleReviewCellChangeBatch(changes)
                                              }}
                                              className="btn btn-sm btn-success"
                                              style={{ padding: '2px 6px', minWidth: 'auto', fontSize: '0.75rem' }}
                                            >
                                              ✓
                                            </button>
                                            <button
                                              onClick={() => setReviewEditingKey(null)}
                                              className="btn btn-sm btn-secondary"
                                              style={{ padding: '2px 6px', minWidth: 'auto', fontSize: '0.75rem' }}
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setReviewEditingKey(cellKey)
                                              setReviewEditValue(cell.totalRequired.toString())
                                            }}
                                            style={{
                                              padding: '2px 10px',
                                              borderRadius: 'var(--radius)',
                                              border: 'none',
                                              background: hasChanges ? 'var(--color-warning-light, #fff3cd)' : 'transparent',
                                              cursor: 'pointer',
                                              color: 'var(--color-text)',
                                              fontSize: '0.85rem',
                                            }}
                                          >
                                            {cell.totalRequired}
                                          </button>
                                        )}
                                      </td>
                                    )
                                  })}
                                  {showCumulative && (
                                    <td className="text-center" style={{ fontWeight: 600, background: 'var(--color-primary-light, #e8f0fe)' }}>
                                      {row.cumulativeRequired}
                                    </td>
                                  )}
                                </tr>
                              ))
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                {changedCells.size > 0 ? `${changedCells.size}件の変更あり` : '変更なし'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>
                  キャンセル
                </button>
                <button
                  className="btn btn-primary"
                  onClick={saveReviewChanges}
                  disabled={reviewSaving || changedCells.size === 0}
                >
                  {reviewSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 表示設定モーダル */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">表示設定</h2>
              <button className="modal-close" onClick={() => setShowSettingsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>表示するモデル</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {getDisplayModels().map((modelOrGroup) => (
                    <label
                      key={modelOrGroup}
                      className="form-check"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        backgroundColor: isModelVisible(modelOrGroup) ? 'var(--color-primary-light)' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isModelVisible(modelOrGroup)}
                        onChange={() => toggleModelVisibility(modelOrGroup)}
                        style={{ marginRight: '6px' }}
                      />
                      <span>{PARTS_MODEL_GROUPS[modelOrGroup] ? modelOrGroup : getDisplayName(modelOrGroup)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>表示するパーツ</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {PARTS_TYPE_ORDER.map((partsType) => (
                    <label
                      key={partsType}
                      className="form-check"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        backgroundColor: isPartsVisible(partsType) ? 'var(--color-primary-light)' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isPartsVisible(partsType)}
                        onChange={() => togglePartsVisibility(partsType)}
                        style={{ marginRight: '6px' }}
                      />
                      <span>{getPartsTypeLabel(partsType)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSettingsModal(false)}>
                キャンセル
              </button>
              <button className="btn btn-primary" onClick={saveSettings}>
                設定を保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
