'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// =====================================================
// 型定義
// =====================================================
type Shop = { id: number; name: string }
type Staff = { id: number; name: string }
type IphoneModel = { model: string; display_name: string }
type DeductionData = { deduction_type: string; amount: number }
type CostData = { parts_type: string; cost: number }

// 動作チェック項目
const OPERATION_CHECK_ITEMS = [
  { key: 'touch', label: 'タッチ操作' },
  { key: 'display', label: '液晶表示' },
  { key: 'volume_up', label: '音量ボタン（上）' },
  { key: 'volume_down', label: '音量ボタン（下）' },
  { key: 'mute_switch', label: 'マナースイッチ' },
  { key: 'vibration', label: 'バイブ' },
  { key: 'side_button', label: 'サイドボタン' },
  { key: 'home_button', label: 'ホームボタン', hasNotApplicable: true },
  { key: 'charging', label: '充電コネクタ' },
  { key: 'camera_rear', label: 'カメラ（外）' },
  { key: 'camera_front', label: 'カメラ（内）' },
  { key: 'face_touch_id', label: '顔(指紋)認証' },
  { key: 'light_sensor', label: '調光センサー' },
  { key: 'proximity_sensor', label: '近接センサー' },
  { key: 'mic_top', label: 'マイク（上）' },
  { key: 'mic_bottom', label: 'マイク（下）' },
  { key: 'speaker_top', label: 'スピーカー（上）' },
  { key: 'speaker_bottom', label: 'スピーカー（下）' },
  { key: 'sim', label: 'SIM認証' },
  { key: 'call', label: '発着信' },
]

// カラー選択肢
const COLOR_OPTIONS = [
  'ブラック', 'ホワイト', 'レッド', 'ゴールド', 'グリーン',
  'イエロー', 'ピンク', 'シルバー', 'ブルー', 'その他'
]

// ランク選択肢
const RANK_OPTIONS = ['超美品', '美品', '良品', '並品', 'リペア品']

// 修理種別
const REPAIR_TYPES = [
  { key: 'screen', label: '画面修理', partsType: '画面修理', exclusive: 'screen_oled' },
  { key: 'screen_oled', label: '画面修理 (有機EL)', partsType: '画面修理 (有機EL)', exclusive: 'screen' },
  { key: 'battery', label: 'バッテリー', partsType: 'バッテリー' },
  { key: 'connector', label: 'コネクタ', partsType: 'コネクタ' },
  { key: 'rear_camera', label: 'リアカメラ', partsType: 'リアカメラ' },
  { key: 'front_camera', label: 'インカメラ', partsType: 'インカメラ' },
  { key: 'camera_glass', label: 'カメラ窓', partsType: 'カメラ窓' },
]

// 職業選択肢
const OCCUPATION_OPTIONS = [
  '会社員', '自営業', '公務員', 'パート・アルバイト', '学生', '主婦・主夫', '無職', 'その他'
]

// 本人確認書類
const ID_DOCUMENT_OPTIONS = [
  '運転免許証', 'マイナンバーカード', 'パスポート', '健康保険証', 'その他'
]

// 店頭買取の同意項目（6項目）
const STORE_CONSENT_ITEMS = [
  '売却者は、上記スマートフォンの合法的な所有者であり、買取業者に対して売却する権利を有していることを保証します。',
  '売却者は、上記スマートフォンが盗難品、紛失品でないこと、また、いかなる法的な紛争の対象でもないことを保証します。',
  '買取業者は、上記スマートフォンを売却者から買取り、売却者に対して上記の買取価格を支払います。',
  '売却者は、買取後のスマートフォンに関する一切の権利を買取業者に譲渡します。',
  '本同意書の効力は、買取業者が売却者に対して買取価格を支払った時点で発生します。',
  '買い取ったスマートフォンのネットワーク利用制限が「×」になる場合、売却者は買取業者に全額返金するものとします。',
]

// 買取端末の型定義
type BuybackItem = {
  id: string
  model: string
  storage: string
  rank: string
  color: string
  colorOther: string
  imei: string
  batteryPercent: string
  isServiceState: boolean
  nwStatus: string
  cameraStain: string
  cameraBroken: boolean
  repairHistory: boolean
  operationCheck: { [key: string]: { status: string; detail: string } }
  needsRepair: boolean
  selectedRepairs: string[]
  repairCost: number
  basePrice: number
  totalDeduction: number
  calculatedPrice: number
  guaranteePrice: number
  specialPriceEnabled: boolean
  specialPrice: string
  specialPriceReason: string
  finalPrice: number
  salesPrice: number
  expectedProfit: number
  memo: string
  // 事前査定価格（本査定で変更があったか確認用）
  preliminaryPrice: number
  priceChanged: boolean
  priceChangeReason: string
}

// 顧客情報の型定義
type CustomerInfo = {
  name: string
  birthDate: string
  age: number | null
  postalCode: string
  address: string
  addressDetail: string
  occupation: string
  phone: string
  idDocumentType: string
  idVerificationMethod: string
  consentItems: boolean[]
}

// 振込情報の型定義
type BankInfo = {
  bankName: string
  bankBranch: string
  accountType: string
  accountNumber: string
  accountHolder: string
}

// 初期端末データ
const createEmptyItem = (): BuybackItem => ({
  id: crypto.randomUUID(),
  model: '',
  storage: '',
  rank: '',
  color: '',
  colorOther: '',
  imei: '',
  batteryPercent: '',
  isServiceState: false,
  nwStatus: 'ok',
  cameraStain: 'none',
  cameraBroken: false,
  repairHistory: false,
  operationCheck: OPERATION_CHECK_ITEMS.reduce((acc, item) => {
    acc[item.key] = { status: 'normal', detail: '' }
    return acc
  }, {} as { [key: string]: { status: string; detail: string } }),
  needsRepair: false,
  selectedRepairs: [],
  repairCost: 0,
  basePrice: 0,
  totalDeduction: 0,
  calculatedPrice: 0,
  guaranteePrice: 0,
  specialPriceEnabled: false,
  specialPrice: '',
  specialPriceReason: '',
  finalPrice: 0,
  salesPrice: 0,
  expectedProfit: 0,
  memo: '',
  preliminaryPrice: 0,
  priceChanged: false,
  priceChangeReason: '',
})

// =====================================================
// メインコンポーネント
// =====================================================
export default function BuybackPage() {
  // フェーズ管理
  const [phase, setPhase] = useState<'select' | 'assessment' | 'customer-view' | 'operation-check' | 'customer-input' | 'verification' | 'payment'>('select')
  const [buybackType, setBuybackType] = useState<'store' | 'mail'>('store')
  
  // マスタデータ
  const [shops, setShops] = useState<Shop[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [iphoneModels, setIphoneModels] = useState<IphoneModel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // 基本情報
  const [buybackDate, setBuybackDate] = useState(new Date().toISOString().split('T')[0])
  const [shopId, setShopId] = useState('')
  const [staffId, setStaffId] = useState('')
  
  // 買取端末リスト（複数台対応）
  const [items, setItems] = useState<BuybackItem[]>([createEmptyItem()])
  const [activeItemIndex, setActiveItemIndex] = useState(0)
  
  // 顧客情報
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    birthDate: '',
    age: null,
    postalCode: '',
    address: '',
    addressDetail: '',
    occupation: '',
    phone: '',
    idDocumentType: '',
    idVerificationMethod: 'visual',
    consentItems: new Array(buybackType === 'store' ? 6 : 12).fill(false),
  })
  
  // 本人確認
  const [idVerified, setIdVerified] = useState(false)
  
  // 振込情報
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bankName: '',
    bankBranch: '',
    accountType: 'ordinary',
    accountNumber: '',
    accountHolder: '',
  })
  
  // 支払方法
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash')
  
  // 同意書画像（郵送用）
  const [consentImageFile, setConsentImageFile] = useState<File | null>(null)
  const [consentImagePreview, setConsentImagePreview] = useState<string>('')

  // =====================================================
  // マスタデータ取得
  // =====================================================
  useEffect(() => {
    async function fetchMasterData() {
      const [shopsRes, staffRes, modelsRes] = await Promise.all([
        supabase.from('m_shops').select('id, name').eq('tenant_id', 1).eq('is_active', true).order('id'),
        supabase.from('m_staff').select('id, name').eq('tenant_id', 1).eq('is_active', true).order('id'),
        supabase.from('m_iphone_models').select('model, display_name').eq('tenant_id', 1).eq('is_active', true).not('model', 'in', '(SE,6s,7,7P)').order('sort_order'),
      ])
      
      setShops(shopsRes.data || [])
      setStaff(staffRes.data || [])
      setIphoneModels(modelsRes.data || [])
      setLoading(false)
    }
    fetchMasterData()
  }, [])

  // =====================================================
  // 合計計算
  // =====================================================
  const totalBuybackPrice = items.reduce((sum, item) => sum + item.finalPrice, 0)
  const totalSalesPrice = items.reduce((sum, item) => sum + item.salesPrice, 0)
  const totalExpectedProfit = items.reduce((sum, item) => sum + item.expectedProfit, 0)
  const averageProfitRate = totalSalesPrice > 0 ? (totalExpectedProfit / totalSalesPrice * 100) : 0

  // =====================================================
  // 端末追加・削除
  // =====================================================
  const addItem = () => {
    setItems([...items, createEmptyItem()])
    setActiveItemIndex(items.length)
  }
  
  const removeItem = (index: number) => {
    if (items.length <= 1) return
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    if (activeItemIndex >= newItems.length) {
      setActiveItemIndex(newItems.length - 1)
    }
  }

  // =====================================================
  // 端末情報更新
  // =====================================================
  const updateItem = (index: number, updates: Partial<BuybackItem>) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], ...updates }
    setItems(newItems)
  }

  // =====================================================
  // 価格計算（機種・容量・ランク変更時）
  // =====================================================
  const calculatePrices = useCallback(async (index: number, model: string, storage: string, rank: string) => {
    if (!model || !storage || !rank) return

    // 基本買取価格取得
    const { data: priceData } = await supabase
      .from('m_buyback_prices')
      .select('price')
      .eq('tenant_id', 1)
      .eq('model', model)
      .eq('storage', parseInt(storage))
      .eq('rank', rank)
      .single()

    // 減額データ取得
    const { data: deductionData } = await supabase
      .from('m_buyback_deductions')
      .select('deduction_type, amount')
      .eq('tenant_id', 1)
      .eq('model', model)
      .eq('storage', parseInt(storage))
      .eq('is_active', true)

    // 最低保証価格取得
    const { data: guaranteeData } = await supabase
      .from('m_buyback_guarantees')
      .select('guarantee_price')
      .eq('tenant_id', 1)
      .eq('model', model)
      .eq('storage', parseInt(storage))
      .single()

    // 販売価格取得
    const { data: salesPriceData } = await supabase
      .from('m_sales_prices')
      .select('price')
      .eq('tenant_id', 1)
      .eq('model', model)
      .eq('storage', parseInt(storage))
      .eq('rank', rank)
      .single()

    // 販売減額取得
    const { data: salesDeductionData } = await supabase
      .from('m_sales_price_deductions')
      .select('deduction_type, amount')
      .eq('tenant_id', 1)
      .eq('model', model)
      .eq('storage', parseInt(storage))
      .eq('is_active', true)

    const basePrice = priceData?.price || 0
    const guaranteePrice = guaranteeData?.guarantee_price || 0
    const salesBasePrice = salesPriceData?.price || 0

    // 現在のアイテムの状態を取得して減額計算
    const item = items[index]
    const deductions = deductionData || []
    const salesDeductions = salesDeductionData || []
    
    // 買取減額計算
    let totalDeduction = 0
    const batteryPercent = parseInt(item.batteryPercent) || 100
    
    if (item.isServiceState || batteryPercent <= 79) {
      const d = deductions.find(d => d.deduction_type === 'battery_79')
      if (d) totalDeduction += d.amount
    } else if (batteryPercent <= 89) {
      const d = deductions.find(d => d.deduction_type === 'battery_80_89')
      if (d) totalDeduction += d.amount
    }
    
    if (item.nwStatus === 'triangle') {
      const d = deductions.find(d => d.deduction_type === 'nw_checking')
      if (d) totalDeduction += d.amount
    } else if (item.nwStatus === 'cross') {
      const d = deductions.find(d => d.deduction_type === 'nw_ng')
      if (d) totalDeduction += d.amount
    }
    
    if (item.cameraStain === 'minor') {
      const d = deductions.find(d => d.deduction_type === 'camera_stain_minor')
      if (d) totalDeduction += d.amount
    } else if (item.cameraStain === 'major') {
      const d = deductions.find(d => d.deduction_type === 'camera_stain_major')
      if (d) totalDeduction += d.amount
    }
    
    if (item.cameraBroken) {
      const d = deductions.find(d => d.deduction_type === 'camera_broken')
      if (d) totalDeduction += d.amount
    }
    
    if (item.repairHistory) {
      const d = deductions.find(d => d.deduction_type === 'repair_history')
      if (d) totalDeduction += d.amount
    }

    const calculatedPrice = basePrice - totalDeduction
    const finalPrice = Math.max(calculatedPrice, guaranteePrice)

    // 販売価格減額計算
    let salesDeductionTotal = 0
    if (item.isServiceState || batteryPercent <= 79) {
      const d = salesDeductions.find(d => d.deduction_type === 'battery_79')
      if (d) salesDeductionTotal += d.amount
    } else if (batteryPercent <= 89) {
      const d = salesDeductions.find(d => d.deduction_type === 'battery_80_89')
      if (d) salesDeductionTotal += d.amount
    }

    const salesPrice = salesBasePrice - salesDeductionTotal
    const totalCost = finalPrice + item.repairCost
    const expectedProfit = salesPrice - totalCost

    updateItem(index, {
      basePrice,
      totalDeduction,
      calculatedPrice,
      guaranteePrice,
      finalPrice: item.specialPriceEnabled && item.specialPrice ? parseInt(item.specialPrice) : finalPrice,
      salesPrice,
      expectedProfit: item.specialPriceEnabled && item.specialPrice 
        ? salesPrice - (parseInt(item.specialPrice) + item.repairCost)
        : expectedProfit,
    })
  }, [items])

  // =====================================================
  // 郵便番号から住所を自動入力
  // =====================================================
  const fetchAddressFromPostalCode = async (postalCode: string) => {
    if (postalCode.length !== 7) return
    
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`)
      const data = await res.json()
      if (data.results && data.results[0]) {
        const result = data.results[0]
        setCustomerInfo(prev => ({
          ...prev,
          address: `${result.address1}${result.address2}${result.address3}`
        }))
      }
    } catch (e) {
      console.error('住所取得エラー:', e)
    }
  }

  // =====================================================
  // 生年月日から年齢を計算
  // =====================================================
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // =====================================================
  // 振込通知送信
  // =====================================================
  const sendTransferNotification = async (buybackId: number) => {
    const itemDetails = items.map((item, i) => {
      const model = iphoneModels.find(m => m.model === item.model)
      const priceNote = item.specialPriceEnabled ? '（他店対抗）' : ''
      return `${i + 1}. ${model?.display_name || item.model} ${item.storage}GB ${item.rank} ¥${item.finalPrice.toLocaleString()}${priceNote}`
    }).join('\n')

    const shopName = shops.find(s => s.id === parseInt(shopId))?.name || ''
    const staffName = staff.find(s => s.id === parseInt(staffId))?.name || ''

    const message = `【振込依頼】
顧客名：${customerInfo.name}

■ 買取明細
${itemDetails}

合計買取金額：¥${totalBuybackPrice.toLocaleString()}

■ 振込先
${bankInfo.bankName} ${bankInfo.bankBranch}
${bankInfo.accountType === 'ordinary' ? '普通' : '当座'} ${bankInfo.accountNumber}
${bankInfo.accountHolder}

買取日：${buybackDate}
店舗：${shopName}
担当：${staffName}`

    // メール送信
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'y-tatsuda@nichellc.net',
          subject: `【振込依頼】${customerInfo.name}様 ¥${totalBuybackPrice.toLocaleString()}`,
          body: message,
        }),
      })
    } catch (e) {
      console.error('メール送信エラー:', e)
    }

    // Slack送信
    try {
      await fetch('/api/send-slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
    } catch (e) {
      console.error('Slack送信エラー:', e)
    }

    // 通知日時を記録
    await supabase
      .from('t_buyback')
      .update({ transfer_notified_at: new Date().toISOString() })
      .eq('id', buybackId)
  }

  // =====================================================
  // 買取確定処理
  // =====================================================
  const saveBuyback = async () => {
    setSaving(true)
    
    try {
      // 同意書画像アップロード（郵送の場合）
      let consentImageUrl = ''
      if (buybackType === 'mail' && consentImageFile) {
        const fileName = `consent/${Date.now()}_${consentImageFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('buyback-documents')
          .upload(fileName, consentImageFile)
        
        if (uploadError) throw uploadError
        consentImageUrl = uploadData.path
      }

      // ヘッダー登録
      const { data: buybackData, error: buybackError } = await supabase
        .from('t_buyback')
        .insert({
          tenant_id: 1,
          shop_id: parseInt(shopId),
          staff_id: parseInt(staffId),
          buyback_date: buybackDate,
          buyback_type: buybackType,
          item_count: items.length,
          total_buyback_price: totalBuybackPrice,
          total_sales_price: totalSalesPrice,
          total_expected_profit: totalExpectedProfit,
          customer_name: customerInfo.name,
          customer_birth_date: customerInfo.birthDate || null,
          customer_age: customerInfo.age,
          customer_postal_code: customerInfo.postalCode,
          customer_address: customerInfo.address,
          customer_address_detail: customerInfo.addressDetail,
          customer_occupation: customerInfo.occupation,
          customer_phone: customerInfo.phone,
          id_document_type: customerInfo.idDocumentType,
          id_verified: idVerified,
          id_verification_method: buybackType === 'mail' ? customerInfo.idVerificationMethod : 'visual',
          consent_completed: true,
          consent_image_url: consentImageUrl || null,
          payment_method: paymentMethod,
          bank_name: paymentMethod === 'transfer' ? bankInfo.bankName : null,
          bank_branch: paymentMethod === 'transfer' ? bankInfo.bankBranch : null,
          bank_account_type: paymentMethod === 'transfer' ? bankInfo.accountType : null,
          bank_account_number: paymentMethod === 'transfer' ? bankInfo.accountNumber : null,
          bank_account_holder: paymentMethod === 'transfer' ? bankInfo.accountHolder : null,
          // 後方互換性のため旧カラムにも値を入れる
          model: items[0].model,
          storage: parseInt(items[0].storage),
          rank: items[0].rank,
          imei: items[0].imei,
          battery_percent: parseInt(items[0].batteryPercent) || null,
          is_service_state: items[0].isServiceState,
          nw_status: items[0].nwStatus,
          camera_broken: items[0].cameraBroken,
          camera_stain: items[0].cameraStain !== 'none',
          repair_history: items[0].repairHistory,
          base_price: items[0].basePrice,
          total_deduction: items[0].totalDeduction,
          final_price: items[0].finalPrice,
          needs_repair: items[0].needsRepair,
          repair_cost: items[0].repairCost,
          memo: items[0].memo,
        })
        .select()
        .single()

      if (buybackError) throw buybackError

      const buybackId = buybackData.id

      // 明細登録
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        
        // 在庫登録
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('t_used_inventory')
          .insert({
            tenant_id: 1,
            shop_id: parseInt(shopId),
            arrival_date: buybackDate,
            model: item.model,
            storage: parseInt(item.storage),
            rank: item.rank,
            imei: item.imei,
            battery_percent: parseInt(item.batteryPercent) || null,
            buyback_price: item.finalPrice,
            repair_cost: item.repairCost,
            total_cost: item.finalPrice + item.repairCost,
            sales_price: item.salesPrice,
            status: item.needsRepair ? '修理中' : '在庫',
            buyback_id: buybackId,
          })
          .select()
          .single()

        if (inventoryError) throw inventoryError

        // 明細登録
        await supabase
          .from('t_buyback_items')
          .insert({
            tenant_id: 1,
            buyback_id: buybackId,
            item_number: i + 1,
            model: item.model,
            storage: parseInt(item.storage),
            rank: item.rank,
            color: item.color !== 'その他' ? item.color : null,
            color_other: item.color === 'その他' ? item.colorOther : null,
            imei: item.imei,
            battery_percent: parseInt(item.batteryPercent) || null,
            is_service_state: item.isServiceState,
            nw_status: item.nwStatus,
            camera_stain: item.cameraStain,
            camera_broken: item.cameraBroken,
            repair_history: item.repairHistory,
            operation_check: item.operationCheck,
            needs_repair: item.needsRepair,
            repair_types: item.selectedRepairs.length > 0 ? item.selectedRepairs : null,
            repair_cost: item.repairCost,
            base_price: item.basePrice,
            total_deduction: item.totalDeduction,
            calculated_price: item.calculatedPrice,
            guarantee_price: item.guaranteePrice,
            special_price_enabled: item.specialPriceEnabled,
            special_price: item.specialPriceEnabled ? parseInt(item.specialPrice) : null,
            special_price_reason: item.specialPriceEnabled ? item.specialPriceReason : null,
            final_price: item.finalPrice,
            sales_price: item.salesPrice,
            expected_profit: item.expectedProfit,
            memo: item.memo,
            used_inventory_id: inventoryData.id,
          })
      }

      // ヘッダーにused_inventory_idを更新（後方互換性）
      const firstInventoryId = (await supabase
        .from('t_buyback_items')
        .select('used_inventory_id')
        .eq('buyback_id', buybackId)
        .eq('item_number', 1)
        .single()).data?.used_inventory_id

      await supabase
        .from('t_buyback')
        .update({ used_inventory_id: firstInventoryId })
        .eq('id', buybackId)

      // 振込通知（振込の場合）
      if (paymentMethod === 'transfer') {
        await sendTransferNotification(buybackId)
      }

      alert('買取を登録しました')
      
      // リセット
      setPhase('select')
      setBuybackType('store')
      setItems([createEmptyItem()])
      setActiveItemIndex(0)
      setCustomerInfo({
        name: '',
        birthDate: '',
        age: null,
        postalCode: '',
        address: '',
        addressDetail: '',
        occupation: '',
        phone: '',
        idDocumentType: '',
        idVerificationMethod: 'visual',
        consentItems: new Array(6).fill(false),
      })
      setIdVerified(false)
      setBankInfo({
        bankName: '',
        bankBranch: '',
        accountType: 'ordinary',
        accountNumber: '',
        accountHolder: '',
      })
      setPaymentMethod('cash')
      setConsentImageFile(null)
      setConsentImagePreview('')

    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // =====================================================
  // ローディング
  // =====================================================
  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">読み込み中...</div>
      </div>
    )
  }

  // =====================================================
  // 買取方法選択画面
  // =====================================================
  if (phase === 'select') {
    return (
      <div className="page-container">
        <h1 className="page-title">買取入力</h1>
        
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">買取方法を選択してください</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
              <button
                onClick={() => { setBuybackType('store'); setPhase('assessment') }}
                className="btn btn-primary btn-lg"
                style={{ padding: '40px 20px', fontSize: '1.2rem' }}
              >
                店頭買取
                <div style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.9 }}>
                  お客様が来店して対面で買取
                </div>
              </button>
              <button
                onClick={() => { setBuybackType('mail'); setPhase('assessment') }}
                className="btn btn-secondary btn-lg"
                style={{ padding: '40px 20px', fontSize: '1.2rem' }}
              >
                郵送買取
                <div style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.9 }}>
                  郵送で届いた端末を買取
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =====================================================
  // 以降のフェーズはパート2で実装
  // =====================================================
  
  return (
    <div className="page-container">
      <h1 className="page-title">
        買取入力
        <span style={{ fontSize: '0.9rem', marginLeft: '12px', padding: '4px 12px', background: buybackType === 'store' ? '#004AAD' : '#6B7280', color: 'white', borderRadius: '20px' }}>
          {buybackType === 'store' ? '店頭買取' : '郵送買取'}
        </span>
      </h1>

      {/* フェーズ表示 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['assessment', 'customer-view', 'operation-check', 'customer-input', 'verification', 'payment'].map((p, i) => {
          const labels = buybackType === 'store'
            ? ['1.事前査定', '2.価格案内', '3.本査定', '4.同意・入力', '5.本人確認', '6.支払']
            : ['1.査定', '', '', '2.顧客情報', '3.確定', '']
          if (!labels[i]) return null
          return (
            <div
              key={p}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                background: phase === p ? '#004AAD' : '#E5E7EB',
                color: phase === p ? 'white' : '#6B7280',
                fontWeight: phase === p ? '600' : '400',
                fontSize: '0.9rem',
              }}
            >
              {labels[i]}
            </div>
          )
        })}
      </div>

      {/* 査定フェーズ（スタッフ操作） */}
      {phase === 'assessment' && (
        <>
          {/* 基本情報 */}
          <div className="card mb-lg">
            <div className="card-header">
              <h2 className="card-title">基本情報</h2>
            </div>
            <div className="card-body">
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label form-label-required">買取日</label>
                  <input
                    type="date"
                    value={buybackDate}
                    onChange={(e) => setBuybackDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">店舗</label>
                  <select value={shopId} onChange={(e) => setShopId(e.target.value)} className="form-select">
                    <option value="">選択してください</option>
                    {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">担当者</label>
                  <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="form-select">
                    <option value="">選択してください</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 端末タブ */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setActiveItemIndex(index)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeItemIndex === index ? '#004AAD' : '#E5E7EB',
                  color: activeItemIndex === index ? 'white' : '#374151',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {index + 1}台目
                {item.model && ` (${iphoneModels.find(m => m.model === item.model)?.display_name || item.model})`}
              </button>
            ))}
            <button
              onClick={addItem}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '2px dashed #9CA3AF',
                background: 'transparent',
                color: '#6B7280',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              ＋ 端末を追加
            </button>
          </div>

          {/* アクティブな端末の入力フォーム */}
          {items[activeItemIndex] && (
            <ItemForm
              item={items[activeItemIndex]}
              index={activeItemIndex}
              iphoneModels={iphoneModels}
              onUpdate={(updates) => updateItem(activeItemIndex, updates)}
              onCalculate={(model, storage, rank) => calculatePrices(activeItemIndex, model, storage, rank)}
              onRemove={items.length > 1 ? () => removeItem(activeItemIndex) : undefined}
            />
          )}

          {/* 合計表示 */}
          <div className="card mb-lg" style={{ background: 'linear-gradient(135deg, #004AAD 0%, #0066CC 100%)' }}>
            <div className="card-body" style={{ color: 'white' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>合計買取価格</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>¥{totalBuybackPrice.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>合計販売予定価格</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>¥{totalSalesPrice.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>合計粗利（利益率）</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>
                    ¥{totalExpectedProfit.toLocaleString()}
                    <span style={{ fontSize: '1rem', marginLeft: '8px' }}>({averageProfitRate.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 次へボタン */}
          <div className="flex justify-between">
            <button onClick={() => setPhase('select')} className="btn btn-secondary">
              戻る
            </button>
            <button
              onClick={() => {
                // 事前査定価格を保存
                const updatedItems = items.map(item => ({
                  ...item,
                  preliminaryPrice: item.finalPrice,
                  priceChanged: false,
                  priceChangeReason: '',
                }))
                setItems(updatedItems)
                setPhase(buybackType === 'store' ? 'customer-view' : 'customer-input')
              }}
              disabled={!shopId || !staffId || items.some(item => !item.model || !item.storage || !item.rank)}
              className="btn btn-primary btn-lg"
            >
              {buybackType === 'store' ? 'お客様に買取価格を案内する' : '顧客情報入力へ'}
            </button>
          </div>
        </>
      )}

      {/* お客様向け査定結果画面（店頭のみ） */}
      {phase === 'customer-view' && buybackType === 'store' && (
        <CustomerViewScreen
          items={items}
          iphoneModels={iphoneModels}
          totalBuybackPrice={totalBuybackPrice}
          onNext={() => setPhase('operation-check')}
          onBack={() => setPhase('assessment')}
        />
      )}

      {/* 動作チェック画面（店頭のみ） */}
      {phase === 'operation-check' && buybackType === 'store' && (
        <OperationCheckScreen
          items={items}
          iphoneModels={iphoneModels}
          onUpdateItem={updateItem}
          onNext={() => setPhase('customer-input')}
          onBack={() => setPhase('customer-view')}
        />
      )}

      {/* 同意・顧客情報入力画面 */}
      {phase === 'customer-input' && (
        <CustomerInputScreen
          buybackType={buybackType}
          items={items}
          iphoneModels={iphoneModels}
          totalBuybackPrice={totalBuybackPrice}
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          consentImageFile={consentImageFile}
          setConsentImageFile={setConsentImageFile}
          consentImagePreview={consentImagePreview}
          setConsentImagePreview={setConsentImagePreview}
          fetchAddressFromPostalCode={fetchAddressFromPostalCode}
          calculateAge={calculateAge}
          onNext={() => setPhase('verification')}
          onBack={() => setPhase(buybackType === 'store' ? 'operation-check' : 'assessment')}
        />
      )}

      {/* 本人確認・確定画面 */}
      {phase === 'verification' && (
        <VerificationScreen
          buybackType={buybackType}
          customerInfo={customerInfo}
          items={items}
          iphoneModels={iphoneModels}
          totalBuybackPrice={totalBuybackPrice}
          idVerified={idVerified}
          setIdVerified={setIdVerified}
          onConfirm={() => {
            if (buybackType === 'store') {
              setPhase('payment')
            } else {
              // 郵送は必ず振込
              setPaymentMethod('transfer')
              setPhase('payment')
            }
          }}
          onBack={() => setPhase('customer-input')}
        />
      )}

      {/* 支払画面 */}
      {phase === 'payment' && (
        <PaymentScreen
          buybackType={buybackType}
          totalBuybackPrice={totalBuybackPrice}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          bankInfo={bankInfo}
          setBankInfo={setBankInfo}
          saving={saving}
          onComplete={saveBuyback}
          onBack={() => setPhase('verification')}
        />
      )}
    </div>
  )
}

// =====================================================
// サブコンポーネント: 端末入力フォーム
// =====================================================
function ItemForm({
  item,
  index,
  iphoneModels,
  onUpdate,
  onCalculate,
  onRemove,
}: {
  item: BuybackItem
  index: number
  iphoneModels: IphoneModel[]
  onUpdate: (updates: Partial<BuybackItem>) => void
  onCalculate: (model: string, storage: string, rank: string) => void
  onRemove?: () => void
}) {
  const [availableStorages, setAvailableStorages] = useState<number[]>([])
  const [partsCosts, setPartsCosts] = useState<CostData[]>([])

  // 機種変更時に容量リストを取得
  useEffect(() => {
    async function fetchStorages() {
      if (!item.model) {
        setAvailableStorages([])
        return
      }
      const { data } = await supabase
        .from('m_buyback_prices')
        .select('storage')
        .eq('tenant_id', 1)
        .eq('model', item.model)
        .eq('is_active', true)
      
      if (data) {
        const storages = [...new Set(data.map(d => d.storage))].sort((a, b) => a - b)
        setAvailableStorages(storages)
      }
    }
    fetchStorages()
  }, [item.model])

  // 機種変更時にパーツ原価を取得
  useEffect(() => {
    async function fetchPartsCosts() {
      if (!item.model) {
        setPartsCosts([])
        return
      }
      const { data } = await supabase
        .from('m_costs_hw')
        .select('parts_type, cost')
        .eq('tenant_id', 1)
        .eq('model', item.model)
        .eq('is_active', true)
      
      setPartsCosts(data || [])
    }
    fetchPartsCosts()
  }, [item.model])

  // 価格計算トリガー
  useEffect(() => {
    if (item.model && item.storage && item.rank) {
      onCalculate(item.model, item.storage, item.rank)
    }
  }, [item.model, item.storage, item.rank])

  // 修理選択
  const handleRepairSelect = (key: string) => {
    const repair = REPAIR_TYPES.find(r => r.key === key)
    let newRepairs = [...item.selectedRepairs]
    
    if (newRepairs.includes(key)) {
      newRepairs = newRepairs.filter(r => r !== key)
    } else {
      if (repair?.exclusive) {
        newRepairs = newRepairs.filter(r => r !== repair.exclusive)
      }
      newRepairs.push(key)
    }
    
    // 修理原価計算
    const repairCost = newRepairs.reduce((sum, r) => {
      const repairType = REPAIR_TYPES.find(rt => rt.key === r)
      const cost = partsCosts.find(c => c.parts_type === repairType?.partsType)?.cost || 0
      return sum + cost
    }, 0)
    
    onUpdate({ selectedRepairs: newRepairs, repairCost })
  }

  const getPartsCost = (partsType: string) => {
    return partsCosts.find(c => c.parts_type === partsType)?.cost || 0
  }

  return (
    <div className="card mb-lg">
      <div className="card-header flex justify-between items-center">
        <h2 className="card-title">{index + 1}台目 端末情報</h2>
        {onRemove && (
          <button onClick={onRemove} className="btn btn-danger btn-sm">削除</button>
        )}
      </div>
      <div className="card-body">
        {/* 基本情報 */}
        <div className="form-grid-4 mb-lg">
          <div className="form-group">
            <label className="form-label form-label-required">機種</label>
            <select
              value={item.model}
              onChange={(e) => onUpdate({ model: e.target.value, storage: '', rank: '' })}
              className="form-select"
            >
              <option value="">選択</option>
              {iphoneModels.map(m => <option key={m.model} value={m.model}>{m.display_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label form-label-required">容量</label>
            <select
              value={item.storage}
              onChange={(e) => onUpdate({ storage: e.target.value })}
              className="form-select"
              disabled={!item.model}
            >
              <option value="">選択</option>
              {availableStorages.map(s => (
                <option key={s} value={s}>{s >= 1024 ? `${s/1024}TB` : `${s}GB`}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label form-label-required">ランク</label>
            <select
              value={item.rank}
              onChange={(e) => onUpdate({ rank: e.target.value })}
              className="form-select"
            >
              <option value="">選択</option>
              {RANK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">カラー</label>
            <select
              value={item.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="form-select"
            >
              <option value="">選択</option>
              {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {item.color === 'その他' && (
          <div className="form-group mb-lg">
            <label className="form-label">その他カラー</label>
            <input
              type="text"
              value={item.colorOther}
              onChange={(e) => onUpdate({ colorOther: e.target.value })}
              className="form-input"
              placeholder="カラーを入力"
            />
          </div>
        )}

        <div className="form-group mb-lg">
          <label className="form-label form-label-required">IMEI</label>
          <input
            type="text"
            value={item.imei}
            onChange={(e) => onUpdate({ imei: e.target.value.replace(/\D/g, '').slice(0, 15) })}
            className="form-input"
            placeholder="15桁の数字"
            maxLength={15}
          />
        </div>

        {/* 状態チェック */}
        <div className="form-grid-3 mb-lg">
          <div className="form-group">
            <label className="form-label form-label-required">バッテリー残量</label>
            <div className="flex items-center gap-sm">
              <input
                type="number"
                value={item.batteryPercent}
                onChange={(e) => onUpdate({ batteryPercent: e.target.value })}
                className="form-input"
                style={{ width: '100px' }}
                min="0"
                max="100"
              />
              <span>%</span>
              <label className="form-check" style={{ marginLeft: '16px' }}>
                <input
                  type="checkbox"
                  checked={item.isServiceState}
                  onChange={(e) => onUpdate({ isServiceState: e.target.checked })}
                />
                <span>サービス状態</span>
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label form-label-required">NW制限</label>
            <select
              value={item.nwStatus}
              onChange={(e) => onUpdate({ nwStatus: e.target.value })}
              className="form-select"
            >
              <option value="ok">○（制限なし）</option>
              <option value="triangle">△（支払中）</option>
              <option value="cross">×（制限あり）</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label form-label-required">カメラ染み</label>
            <select
              value={item.cameraStain}
              onChange={(e) => onUpdate({ cameraStain: e.target.value })}
              className="form-select"
            >
              <option value="none">なし</option>
              <option value="minor">少</option>
              <option value="major">多</option>
            </select>
          </div>
        </div>

        <div className="form-grid-2 mb-lg">
          <label className="form-check">
            <input
              type="checkbox"
              checked={item.cameraBroken}
              onChange={(e) => onUpdate({ cameraBroken: e.target.checked })}
            />
            <span>カメラ窓破損</span>
          </label>
          <label className="form-check">
            <input
              type="checkbox"
              checked={item.repairHistory}
              onChange={(e) => onUpdate({ repairHistory: e.target.checked })}
            />
            <span>修理歴あり</span>
          </label>
        </div>

        {/* 動作チェックは本査定フェーズで実施するため、ここでは省略 */}
        <div className="card mb-lg" style={{ background: '#F0F9FF', border: '1px dashed #60A5FA' }}>
          <div className="card-body" style={{ padding: '16px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#3B82F6', fontSize: '0.9rem' }}>
              💡 動作チェック（20項目）は「本査定」フェーズで実施します
            </p>
          </div>
        </div>

        {/* 修理が必要 */}
        <div className="card mb-lg" style={{ background: '#F9FAFB' }}>
          <div className="card-header">
            <label className="form-check" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={item.needsRepair}
                onChange={(e) => onUpdate({ needsRepair: e.target.checked, selectedRepairs: e.target.checked ? item.selectedRepairs : [], repairCost: 0 })}
                style={{ width: '20px', height: '20px' }}
              />
              <span className="card-title" style={{ margin: 0 }}>修理が必要</span>
            </label>
          </div>
          {item.needsRepair && (
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                {REPAIR_TYPES.map(repair => {
                  const cost = getPartsCost(repair.partsType)
                  const isSelected = item.selectedRepairs.includes(repair.key)
                  const isDisabled = repair.exclusive ? item.selectedRepairs.includes(repair.exclusive) : false
                  
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
                        background: isDisabled ? '#E5E7EB' : isSelected ? '#004AAD' : '#6B7280',
                        color: isDisabled ? '#9CA3AF' : 'white',
                        fontWeight: '600',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div>{repair.label}</div>
                      <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.9 }}>¥{cost.toLocaleString()}</div>
                    </button>
                  )
                })}
              </div>
              {item.repairCost > 0 && (
                <div style={{ marginTop: '16px', fontWeight: '600' }}>
                  修理原価合計: ¥{item.repairCost.toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 他店対抗価格 */}
        <div className="card mb-lg" style={{ background: '#FEF3C7' }}>
          <div className="card-header">
            <label className="form-check" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={item.specialPriceEnabled}
                onChange={(e) => onUpdate({ specialPriceEnabled: e.target.checked })}
                style={{ width: '20px', height: '20px' }}
              />
              <span className="card-title" style={{ margin: 0 }}>他店対抗価格を適用</span>
            </label>
          </div>
          {item.specialPriceEnabled && (
            <div className="card-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label form-label-required">対抗価格</label>
                  <input
                    type="number"
                    value={item.specialPrice}
                    onChange={(e) => {
                      const newPrice = parseInt(e.target.value) || 0
                      const newProfit = item.salesPrice - (newPrice + item.repairCost)
                      onUpdate({ specialPrice: e.target.value, finalPrice: newPrice, expectedProfit: newProfit })
                    }}
                    className="form-input"
                    placeholder="買取価格を入力"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">理由</label>
                  <input
                    type="text"
                    value={item.specialPriceReason}
                    onChange={(e) => onUpdate({ specialPriceReason: e.target.value })}
                    className="form-input"
                    placeholder="例: 近隣店舗対抗"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 価格表示 */}
        <div className="card" style={{ background: '#F0F9FF' }}>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>基本買取価格</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>¥{item.basePrice.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#DC2626' }}>減額合計</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#DC2626' }}>-¥{item.totalDeduction.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>最低保証</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>¥{item.guaranteePrice.toLocaleString()}</div>
              </div>
              <div style={{ background: '#004AAD', padding: '12px', borderRadius: '8px', color: 'white' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>最終買取価格</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>¥{item.finalPrice.toLocaleString()}</div>
              </div>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>販売予定価格</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>¥{item.salesPrice.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>商品原価</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>¥{(item.finalPrice + item.repairCost).toLocaleString()}</div>
              </div>
              <div style={{ background: item.expectedProfit >= 0 ? '#059669' : '#DC2626', padding: '12px', borderRadius: '8px', color: 'white' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>想定粗利</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>
                  ¥{item.expectedProfit.toLocaleString()}
                  <span style={{ fontSize: '0.9rem', marginLeft: '8px' }}>
                    ({item.salesPrice > 0 ? (item.expectedProfit / item.salesPrice * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* メモ */}
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">メモ</label>
          <textarea
            value={item.memo}
            onChange={(e) => onUpdate({ memo: e.target.value })}
            className="form-textarea"
            rows={2}
            placeholder="特記事項"
          />
        </div>
      </div>
    </div>
  )
}

// =====================================================
// サブコンポーネント: お客様向け査定結果画面
// =====================================================
function CustomerViewScreen({
  items,
  iphoneModels,
  totalBuybackPrice,
  onNext,
  onBack,
}: {
  items: BuybackItem[]
  iphoneModels: IphoneModel[]
  totalBuybackPrice: number
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="card-body" style={{ padding: '40px 24px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '32px', color: '#004AAD' }}>査定結果</h2>
          
          {items.map((item, index) => {
            const modelName = iphoneModels.find(m => m.model === item.model)?.display_name || item.model
            return (
              <div key={item.id} style={{ marginBottom: '24px', padding: '20px', background: '#F9FAFB', borderRadius: '12px', textAlign: 'left' }}>
                <div style={{ fontWeight: '700', fontSize: '1.2rem', marginBottom: '16px' }}>
                  {items.length > 1 && `${index + 1}台目: `}{modelName} {item.storage}GB {item.rank}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>基本買取価格</span>
                  <span>¥{item.basePrice.toLocaleString()}</span>
                </div>
                
                {item.totalDeduction > 0 && (
                  <>
                    {item.isServiceState || (parseInt(item.batteryPercent) <= 89) ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#DC2626' }}>
                        <span>バッテリー減額（{item.batteryPercent}%）</span>
                        <span>-¥{(() => {
                          const bp = parseInt(item.batteryPercent) || 100
                          if (item.isServiceState || bp <= 79) return item.totalDeduction
                          if (bp <= 89) return item.totalDeduction
                          return 0
                        })().toLocaleString()}</span>
                      </div>
                    ) : null}
                  </>
                )}
                
                <div style={{ borderTop: '2px solid #E5E7EB', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.2rem', color: '#004AAD' }}>
                  <span>買取価格</span>
                  <span>¥{item.finalPrice.toLocaleString()}</span>
                </div>
                
                {item.specialPriceEnabled && (
                  <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#6B7280' }}>
                    （他店対抗価格適用）
                  </div>
                )}
              </div>
            )
          })}

          {items.length > 1 && (
            <div style={{ padding: '20px', background: '#004AAD', borderRadius: '12px', color: 'white', marginBottom: '32px' }}>
              <div style={{ fontSize: '1rem', marginBottom: '8px' }}>合計買取価格</div>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>¥{totalBuybackPrice.toLocaleString()}</div>
            </div>
          )}

          {items.length === 1 && (
            <div style={{ padding: '20px', background: '#004AAD', borderRadius: '12px', color: 'white', marginBottom: '32px' }}>
              <div style={{ fontSize: '1rem', marginBottom: '8px' }}>買取価格</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>¥{totalBuybackPrice.toLocaleString()}</div>
            </div>
          )}

          <div style={{ background: '#FEF3C7', padding: '16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
            <p style={{ fontSize: '0.95rem', color: '#92400E', margin: 0 }}>
              ※ これは事前査定の金額です。本査定（動作チェック）の結果により、金額が変更になる場合があります。
            </p>
          </div>

          <button
            onClick={onNext}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', padding: '20px', fontSize: '1.2rem' }}
          >
            本査定を依頼する
          </button>

          <button
            onClick={onBack}
            className="btn btn-secondary"
            style={{ marginTop: '16px', width: '100%' }}
          >
            スタッフ画面に戻る
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// サブコンポーネント: 同意・顧客情報入力画面
// =====================================================
function CustomerInputScreen({
  buybackType,
  items,
  iphoneModels,
  totalBuybackPrice,
  customerInfo,
  setCustomerInfo,
  consentImageFile,
  setConsentImageFile,
  consentImagePreview,
  setConsentImagePreview,
  fetchAddressFromPostalCode,
  calculateAge,
  onNext,
  onBack,
}: {
  buybackType: 'store' | 'mail'
  items: BuybackItem[]
  iphoneModels: IphoneModel[]
  totalBuybackPrice: number
  customerInfo: CustomerInfo
  setCustomerInfo: (info: CustomerInfo) => void
  consentImageFile: File | null
  setConsentImageFile: (file: File | null) => void
  consentImagePreview: string
  setConsentImagePreview: (url: string) => void
  fetchAddressFromPostalCode: (code: string) => void
  calculateAge: (date: string) => number | null
  onNext: () => void
  onBack: () => void
}) {
  // 価格変更があったかどうか
  const hasPriceChange = items.some(item => item.priceChanged)
  const totalPreliminaryPrice = items.reduce((sum, item) => sum + item.preliminaryPrice, 0)
  const consentItems = buybackType === 'store' ? STORE_CONSENT_ITEMS : []
  const allConsented = buybackType === 'mail' || customerInfo.consentItems.every(c => c)
  
  const canProceed = 
    customerInfo.name &&
    customerInfo.birthDate &&
    customerInfo.postalCode &&
    customerInfo.address &&
    customerInfo.addressDetail &&
    customerInfo.occupation &&
    customerInfo.phone &&
    customerInfo.idDocumentType &&
    allConsented &&
    (buybackType === 'store' || (consentImageFile && customerInfo.idVerificationMethod))

  const handleConsentChange = (index: number, checked: boolean) => {
    const newConsents = [...customerInfo.consentItems]
    newConsents[index] = checked
    setCustomerInfo({ ...customerInfo, consentItems: newConsents })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setConsentImageFile(file)
      const reader = new FileReader()
      reader.onload = () => setConsentImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div style={{ maxWidth: buybackType === 'store' ? '600px' : '800px', margin: '0 auto' }}>
      {/* 店頭買取: 買取価格表示 */}
      {buybackType === 'store' && (
        <div className="card mb-lg" style={{ background: hasPriceChange ? '#FEF3C7' : '#F0F9FF' }}>
          <div className="card-header" style={{ background: hasPriceChange ? '#F59E0B' : '#004AAD', color: 'white' }}>
            <h2 className="card-title" style={{ color: 'white', margin: 0 }}>
              {hasPriceChange ? '⚠️ 買取価格が変更されました' : '✓ 買取価格（確定）'}
            </h2>
          </div>
          <div className="card-body">
            {items.map((item, index) => {
              const modelName = iphoneModels.find(m => m.model === item.model)?.display_name || item.model
              return (
                <div key={item.id} style={{ marginBottom: index < items.length - 1 ? '16px' : '0', paddingBottom: index < items.length - 1 ? '16px' : '0', borderBottom: index < items.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                    {items.length > 1 && `${index + 1}台目: `}{modelName} {item.storage}GB {item.rank}
                  </div>
                  {item.priceChanged ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#6B7280', textDecoration: 'line-through' }}>事前査定: ¥{item.preliminaryPrice.toLocaleString()}</span>
                        <span style={{ fontWeight: '700', color: '#D97706' }}>→ ¥{item.finalPrice.toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#92400E', background: '#FEF9C3', padding: '8px', borderRadius: '4px' }}>
                        理由: {item.priceChangeReason}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>買取価格</span>
                      <span style={{ fontWeight: '700', color: '#004AAD' }}>¥{item.finalPrice.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )
            })}

            {/* 合計 */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #004AAD' }}>
              {hasPriceChange && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#6B7280' }}>
                  <span>事前査定合計</span>
                  <span style={{ textDecoration: 'line-through' }}>¥{totalPreliminaryPrice.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.3rem' }}>
                <span>最終買取価格</span>
                <span style={{ color: hasPriceChange ? '#D97706' : '#004AAD' }}>¥{totalBuybackPrice.toLocaleString()}</span>
              </div>
              {hasPriceChange && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.9rem', color: totalBuybackPrice < totalPreliminaryPrice ? '#DC2626' : '#059669' }}>
                    （{totalBuybackPrice < totalPreliminaryPrice ? '' : '+'}¥{(totalBuybackPrice - totalPreliminaryPrice).toLocaleString()}）
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 店頭買取: 同意項目 */}
      {buybackType === 'store' && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="card-title">同意事項</h2>
          </div>
          <div className="card-body">
            <p style={{ marginBottom: '20px', color: '#6B7280' }}>以下のすべての項目に同意してください。</p>
            {consentItems.map((text, index) => (
              <label key={index} className="form-check" style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <input
                  type="checkbox"
                  checked={customerInfo.consentItems[index]}
                  onChange={(e) => handleConsentChange(index, e.target.checked)}
                  style={{ width: '24px', height: '24px', marginTop: '2px', flexShrink: 0 }}
                />
                <span style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{text}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 郵送買取: 本人確認方法・同意書画像 */}
      {buybackType === 'mail' && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="card-title">本人確認・同意書</h2>
          </div>
          <div className="card-body">
            <div className="form-group mb-lg">
              <label className="form-label form-label-required">本人確認方法</label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label className="form-check">
                  <input
                    type="radio"
                    name="idVerificationMethod"
                    value="copy"
                    checked={customerInfo.idVerificationMethod === 'copy'}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, idVerificationMethod: e.target.value })}
                  />
                  <span>コピーで確認</span>
                </label>
                <label className="form-check">
                  <input
                    type="radio"
                    name="idVerificationMethod"
                    value="image"
                    checked={customerInfo.idVerificationMethod === 'image'}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, idVerificationMethod: e.target.value })}
                  />
                  <span>画像で確認</span>
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label form-label-required">同意書画像</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="form-input"
              />
              {consentImagePreview && (
                <div style={{ marginTop: '12px' }}>
                  <img src={consentImagePreview} alt="同意書" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 顧客情報入力 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">お客様情報</h2>
        </div>
        <div className="card-body">
          <div className="form-group mb-md">
            <label className="form-label form-label-required">氏名</label>
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              className="form-input"
              placeholder="山田 太郎"
              style={{ fontSize: '1.1rem' }}
            />
          </div>

          <div className="form-group mb-md">
            <label className="form-label form-label-required">生年月日</label>
            <input
              type="date"
              value={customerInfo.birthDate}
              onChange={(e) => {
                const age = calculateAge(e.target.value)
                setCustomerInfo({ ...customerInfo, birthDate: e.target.value, age })
              }}
              className="form-input"
            />
            {customerInfo.age !== null && (
              <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#374151' }}>
                年齢: {customerInfo.age}歳
              </div>
            )}
          </div>

          <div className="form-grid-2 mb-md">
            <div className="form-group">
              <label className="form-label form-label-required">郵便番号</label>
              <input
                type="text"
                value={customerInfo.postalCode}
                onChange={(e) => {
                  const code = e.target.value.replace(/\D/g, '').slice(0, 7)
                  setCustomerInfo({ ...customerInfo, postalCode: code })
                  if (code.length === 7) {
                    fetchAddressFromPostalCode(code)
                  }
                }}
                className="form-input"
                placeholder="1234567"
                maxLength={7}
              />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">住所（自動入力）</label>
              <input
                type="text"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                className="form-input"
                placeholder="都道府県・市区町村"
              />
            </div>
          </div>

          <div className="form-group mb-md">
            <label className="form-label form-label-required">番地・建物名・部屋番号</label>
            <input
              type="text"
              value={customerInfo.addressDetail}
              onChange={(e) => setCustomerInfo({ ...customerInfo, addressDetail: e.target.value })}
              className="form-input"
              placeholder="1-2-3 ○○マンション 101号室"
            />
          </div>

          <div className="form-grid-2 mb-md">
            <div className="form-group">
              <label className="form-label form-label-required">職業</label>
              <select
                value={customerInfo.occupation}
                onChange={(e) => setCustomerInfo({ ...customerInfo, occupation: e.target.value })}
                className="form-select"
              >
                <option value="">選択してください</option>
                {OCCUPATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">電話番号</label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                className="form-input"
                placeholder="090-1234-5678"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label form-label-required">本人確認書類</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {ID_DOCUMENT_OPTIONS.map(doc => (
                <label key={doc} className="form-check">
                  <input
                    type="radio"
                    name="idDocumentType"
                    value={doc}
                    checked={customerInfo.idDocumentType === doc}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, idDocumentType: e.target.value })}
                  />
                  <span>{doc}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 店頭買取: お客様への案内メッセージ */}
      {buybackType === 'store' && (
        <div className="card mb-lg" style={{ background: '#FEF3C7', border: '2px solid #F59E0B' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '24px' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
              入力が完了したら下のボタンを押してください。
            </p>
            <p style={{ color: '#92400E' }}>
              本人確認書類と一緒にiPadをスタッフへお返しください。
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="btn btn-secondary">
          戻る
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="btn btn-primary btn-lg"
        >
          {buybackType === 'store' ? '入力完了' : '次へ'}
        </button>
      </div>
    </div>
  )
}

// =====================================================
// サブコンポーネント: 本人確認・確定画面
// =====================================================
function VerificationScreen({
  buybackType,
  customerInfo,
  items,
  iphoneModels,
  totalBuybackPrice,
  idVerified,
  setIdVerified,
  onConfirm,
  onBack,
}: {
  buybackType: 'store' | 'mail'
  customerInfo: CustomerInfo
  items: BuybackItem[]
  iphoneModels: IphoneModel[]
  totalBuybackPrice: number
  idVerified: boolean
  setIdVerified: (verified: boolean) => void
  onConfirm: () => void
  onBack: () => void
}) {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">お客様情報の確認</h2>
        </div>
        <div className="card-body">
          <table style={{ width: '100%' }}>
            <tbody>
              <tr><td style={{ padding: '8px 0', color: '#6B7280' }}>氏名</td><td style={{ fontWeight: '600' }}>{customerInfo.name}</td></tr>
              <tr><td style={{ padding: '8px 0', color: '#6B7280' }}>生年月日</td><td style={{ fontWeight: '600' }}>{customerInfo.birthDate}（{customerInfo.age}歳）</td></tr>
              <tr><td style={{ padding: '8px 0', color: '#6B7280' }}>住所</td><td style={{ fontWeight: '600' }}>〒{customerInfo.postalCode} {customerInfo.address} {customerInfo.addressDetail}</td></tr>
              <tr><td style={{ padding: '8px 0', color: '#6B7280' }}>職業</td><td style={{ fontWeight: '600' }}>{customerInfo.occupation}</td></tr>
              <tr><td style={{ padding: '8px 0', color: '#6B7280' }}>電話番号</td><td style={{ fontWeight: '600' }}>{customerInfo.phone}</td></tr>
              <tr><td style={{ padding: '8px 0', color: '#6B7280' }}>本人確認書類</td><td style={{ fontWeight: '600' }}>{customerInfo.idDocumentType}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">買取内容</h2>
        </div>
        <div className="card-body">
          {items.map((item, index) => {
            const modelName = iphoneModels.find(m => m.model === item.model)?.display_name || item.model
            return (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: index < items.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                <span>{modelName} {item.storage}GB {item.rank}</span>
                <span style={{ fontWeight: '600' }}>¥{item.finalPrice.toLocaleString()}</span>
              </div>
            )
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', marginTop: '8px', borderTop: '2px solid #004AAD', fontWeight: '700', fontSize: '1.2rem', color: '#004AAD' }}>
            <span>合計買取価格</span>
            <span>¥{totalBuybackPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="card mb-lg" style={{ background: '#FEF3C7' }}>
        <div className="card-body">
          <label className="form-check" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="checkbox"
              checked={idVerified}
              onChange={(e) => setIdVerified(e.target.checked)}
              style={{ width: '28px', height: '28px' }}
            />
            <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>
              本人確認書類との一致を確認しました
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="btn btn-secondary">
          戻る
        </button>
        <button
          onClick={onConfirm}
          disabled={!idVerified}
          className="btn btn-success btn-lg"
        >
          買取を確定する
        </button>
      </div>
    </div>
  )
}

// =====================================================
// サブコンポーネント: 支払画面
// =====================================================
function PaymentScreen({
  buybackType,
  totalBuybackPrice,
  paymentMethod,
  setPaymentMethod,
  bankInfo,
  setBankInfo,
  saving,
  onComplete,
  onBack,
}: {
  buybackType: 'store' | 'mail'
  totalBuybackPrice: number
  paymentMethod: 'cash' | 'transfer'
  setPaymentMethod: (method: 'cash' | 'transfer') => void
  bankInfo: BankInfo
  setBankInfo: (info: BankInfo) => void
  saving: boolean
  onComplete: () => void
  onBack: () => void
}) {
  const canComplete = paymentMethod === 'cash' || (
    bankInfo.bankName &&
    bankInfo.bankBranch &&
    bankInfo.accountNumber &&
    bankInfo.accountHolder
  )

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card mb-lg" style={{ background: '#004AAD', color: 'white', textAlign: 'center' }}>
        <div className="card-body" style={{ padding: '32px' }}>
          <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>お渡し金額</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>¥{totalBuybackPrice.toLocaleString()}</div>
        </div>
      </div>

      {buybackType === 'store' && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="card-title">支払方法</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`btn ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-secondary'} btn-lg`}
                style={{ padding: '24px' }}
              >
                現金払い
              </button>
              <button
                onClick={() => setPaymentMethod('transfer')}
                className={`btn ${paymentMethod === 'transfer' ? 'btn-primary' : 'btn-secondary'} btn-lg`}
                style={{ padding: '24px' }}
              >
                振込
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === 'transfer' && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="card-title">振込先情報</h2>
          </div>
          <div className="card-body">
            <div className="form-grid-2 mb-md">
              <div className="form-group">
                <label className="form-label form-label-required">銀行名</label>
                <input
                  type="text"
                  value={bankInfo.bankName}
                  onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                  className="form-input"
                  placeholder="○○銀行"
                />
              </div>
              <div className="form-group">
                <label className="form-label form-label-required">支店名</label>
                <input
                  type="text"
                  value={bankInfo.bankBranch}
                  onChange={(e) => setBankInfo({ ...bankInfo, bankBranch: e.target.value })}
                  className="form-input"
                  placeholder="○○支店"
                />
              </div>
            </div>
            
            <div className="form-group mb-md">
              <label className="form-label form-label-required">口座種別</label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label className="form-check">
                  <input
                    type="radio"
                    name="accountType"
                    value="ordinary"
                    checked={bankInfo.accountType === 'ordinary'}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountType: e.target.value })}
                  />
                  <span>普通</span>
                </label>
                <label className="form-check">
                  <input
                    type="radio"
                    name="accountType"
                    value="checking"
                    checked={bankInfo.accountType === 'checking'}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountType: e.target.value })}
                  />
                  <span>当座</span>
                </label>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label form-label-required">口座番号</label>
                <input
                  type="text"
                  value={bankInfo.accountNumber}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 7) })}
                  className="form-input"
                  placeholder="1234567"
                  maxLength={7}
                />
              </div>
              <div className="form-group">
                <label className="form-label form-label-required">口座名義（カタカナ）</label>
                <input
                  type="text"
                  value={bankInfo.accountHolder}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                  className="form-input"
                  placeholder="ヤマダ タロウ"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="btn btn-secondary">
          戻る
        </button>
        <button
          onClick={onComplete}
          disabled={!canComplete || saving}
          className="btn btn-success btn-lg"
        >
          {saving ? '処理中...' : paymentMethod === 'cash' ? '買取を終了する' : '振込依頼を送信して終了'}
        </button>
      </div>
    </div>
  )
}

// =====================================================
// サブコンポーネント: 動作チェック画面（本査定）
// =====================================================
function OperationCheckScreen({
  items,
  iphoneModels,
  onUpdateItem,
  onNext,
  onBack,
}: {
  items: BuybackItem[]
  iphoneModels: IphoneModel[]
  onUpdateItem: (index: number, updates: Partial<BuybackItem>) => void
  onNext: () => void
  onBack: () => void
}) {
  const [activeItemIndex, setActiveItemIndex] = useState(0)
  const [showPriceChange, setShowPriceChange] = useState<boolean[]>(new Array(items.length).fill(false))

  const activeItem = items[activeItemIndex]
  const modelName = iphoneModels.find(m => m.model === activeItem?.model)?.display_name || activeItem?.model

  // すべての端末で動作チェック完了しているか
  const allChecked = items.every((item, i) => {
    // 価格変更なしを選択済み、または価格変更ありで理由入力済み
    return !showPriceChange[i] || (item.priceChanged && item.priceChangeReason)
  })

  const handleNoChange = (index: number) => {
    onUpdateItem(index, { priceChanged: false, priceChangeReason: '' })
    const newShowPriceChange = [...showPriceChange]
    newShowPriceChange[index] = false
    setShowPriceChange(newShowPriceChange)

    // 次の端末へ、または完了
    if (index < items.length - 1) {
      setActiveItemIndex(index + 1)
    }
  }

  const handleHasChange = (index: number) => {
    const newShowPriceChange = [...showPriceChange]
    newShowPriceChange[index] = true
    setShowPriceChange(newShowPriceChange)
    onUpdateItem(index, { priceChanged: true })
  }

  const handlePriceUpdate = (index: number, newPrice: number, reason: string) => {
    const item = items[index]
    const newExpectedProfit = item.salesPrice - (newPrice + item.repairCost)
    onUpdateItem(index, {
      finalPrice: newPrice,
      expectedProfit: newExpectedProfit,
      priceChangeReason: reason,
    })
  }

  const handleRankChange = async (index: number, newRank: string) => {
    const item = items[index]
    onUpdateItem(index, { rank: newRank })

    // 新しいランクで価格を再計算（簡易版：本来はcalculatePricesを呼ぶべき）
    const { data: priceData } = await supabase
      .from('m_buyback_prices')
      .select('price')
      .eq('tenant_id', 1)
      .eq('model', item.model)
      .eq('storage', parseInt(item.storage))
      .eq('rank', newRank)
      .single()

    if (priceData) {
      const newBasePrice = priceData.price
      const newCalculatedPrice = newBasePrice - item.totalDeduction
      const newFinalPrice = Math.max(newCalculatedPrice, item.guaranteePrice)
      const newExpectedProfit = item.salesPrice - (newFinalPrice + item.repairCost)

      onUpdateItem(index, {
        basePrice: newBasePrice,
        calculatedPrice: newCalculatedPrice,
        finalPrice: newFinalPrice,
        expectedProfit: newExpectedProfit,
      })
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card mb-lg" style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', color: 'white' }}>
        <div className="card-body" style={{ textAlign: 'center', padding: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>本査定（動作チェック）</h2>
          <p style={{ margin: '8px 0 0', opacity: 0.9 }}>端末の動作を確認し、問題があれば買取価格を修正してください</p>
        </div>
      </div>

      {/* 端末タブ（複数台の場合） */}
      {items.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {items.map((item, index) => {
            const itemModelName = iphoneModels.find(m => m.model === item.model)?.display_name || item.model
            const isCompleted = !showPriceChange[index] ? false : (item.priceChanged ? !!item.priceChangeReason : true)
            return (
              <button
                key={item.id}
                onClick={() => setActiveItemIndex(index)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeItemIndex === index ? '#004AAD' : isCompleted ? '#059669' : '#E5E7EB',
                  color: activeItemIndex === index || isCompleted ? 'white' : '#374151',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {index + 1}台目 {itemModelName && `(${itemModelName})`}
                {isCompleted && ' ✓'}
              </button>
            )
          })}
        </div>
      )}

      {/* 動作チェック項目 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h3 className="card-title">
            {items.length > 1 && `${activeItemIndex + 1}台目: `}
            {modelName} {activeItem?.storage}GB {activeItem?.rank}
          </h3>
        </div>
        <div className="card-body">
          <div style={{ marginBottom: '24px', padding: '16px', background: '#F0F9FF', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '4px' }}>事前査定価格</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#004AAD' }}>
              ¥{activeItem?.preliminaryPrice.toLocaleString()}
            </div>
          </div>

          <h4 style={{ marginBottom: '16px', fontSize: '1rem' }}>動作チェック（20項目）</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {OPERATION_CHECK_ITEMS.map(checkItem => {
              const check = activeItem?.operationCheck[checkItem.key]
              return (
                <div key={checkItem.key} style={{ padding: '12px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>{checkItem.label}</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['normal', 'minor', 'abnormal'].map(status => (
                      <label key={status} className="form-check" style={{ fontSize: '0.85rem' }}>
                        <input
                          type="radio"
                          name={`${activeItem?.id}-${checkItem.key}`}
                          checked={check?.status === status}
                          onChange={() => onUpdateItem(activeItemIndex, {
                            operationCheck: {
                              ...activeItem?.operationCheck,
                              [checkItem.key]: { ...check, status }
                            }
                          })}
                        />
                        <span style={{ color: status === 'normal' ? '#059669' : status === 'minor' ? '#D97706' : '#DC2626' }}>
                          {status === 'normal' ? '正常' : status === 'minor' ? '軽度' : '異常'}
                        </span>
                      </label>
                    ))}
                    {checkItem.hasNotApplicable && (
                      <label className="form-check" style={{ fontSize: '0.85rem' }}>
                        <input
                          type="radio"
                          name={`${activeItem?.id}-${checkItem.key}`}
                          checked={check?.status === 'not_applicable'}
                          onChange={() => onUpdateItem(activeItemIndex, {
                            operationCheck: {
                              ...activeItem?.operationCheck,
                              [checkItem.key]: { ...check, status: 'not_applicable', detail: '' }
                            }
                          })}
                        />
                        <span style={{ color: '#6B7280' }}>対象外</span>
                      </label>
                    )}
                  </div>
                  {(check?.status === 'minor' || check?.status === 'abnormal') && (
                    <input
                      type="text"
                      value={check?.detail || ''}
                      onChange={(e) => onUpdateItem(activeItemIndex, {
                        operationCheck: {
                          ...activeItem?.operationCheck,
                          [checkItem.key]: { ...check, detail: e.target.value }
                        }
                      })}
                      placeholder="詳細を入力"
                      className="form-input"
                      style={{ marginTop: '8px', fontSize: '0.85rem' }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* 価格変更の選択 */}
          {!showPriceChange[activeItemIndex] ? (
            <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: '24px' }}>
              <h4 style={{ marginBottom: '16px', textAlign: 'center' }}>動作チェックの結果、買取価格に変更はありますか？</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
                <button
                  onClick={() => handleNoChange(activeItemIndex)}
                  className="btn btn-success btn-lg"
                  style={{ padding: '20px' }}
                >
                  変更なし
                  <div style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.9 }}>
                    ¥{activeItem?.preliminaryPrice.toLocaleString()}で確定
                  </div>
                </button>
                <button
                  onClick={() => handleHasChange(activeItemIndex)}
                  className="btn btn-warning btn-lg"
                  style={{ padding: '20px' }}
                >
                  変更あり
                  <div style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.9 }}>
                    価格を修正する
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: '#D97706' }}>価格修正</h4>

              <div className="form-grid-2 mb-lg">
                <div className="form-group">
                  <label className="form-label">ランク変更</label>
                  <select
                    value={activeItem?.rank || ''}
                    onChange={(e) => handleRankChange(activeItemIndex, e.target.value)}
                    className="form-select"
                  >
                    {RANK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">修正後の買取価格</label>
                  <input
                    type="number"
                    value={activeItem?.finalPrice || 0}
                    onChange={(e) => handlePriceUpdate(activeItemIndex, parseInt(e.target.value) || 0, activeItem?.priceChangeReason || '')}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group mb-lg">
                <label className="form-label form-label-required">価格変更の理由</label>
                <input
                  type="text"
                  value={activeItem?.priceChangeReason || ''}
                  onChange={(e) => onUpdateItem(activeItemIndex, { priceChangeReason: e.target.value })}
                  className="form-input"
                  placeholder="例: 動作チェックで○○に異常が見つかったため"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '16px', background: '#FEF3C7', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#92400E' }}>事前査定価格</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>¥{activeItem?.preliminaryPrice.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#92400E' }}>修正後価格</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#D97706' }}>¥{activeItem?.finalPrice.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#92400E' }}>差額</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600', color: activeItem && activeItem.finalPrice < activeItem.preliminaryPrice ? '#DC2626' : '#059669' }}>
                    {activeItem && activeItem.finalPrice < activeItem.preliminaryPrice ? '-' : '+'}
                    ¥{Math.abs((activeItem?.finalPrice || 0) - (activeItem?.preliminaryPrice || 0)).toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  onClick={() => {
                    const newShowPriceChange = [...showPriceChange]
                    newShowPriceChange[activeItemIndex] = false
                    setShowPriceChange(newShowPriceChange)
                    onUpdateItem(activeItemIndex, {
                      priceChanged: false,
                      priceChangeReason: '',
                      finalPrice: activeItem?.preliminaryPrice || 0,
                    })
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  変更を取り消す
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="btn btn-secondary">
          戻る
        </button>
        <button
          onClick={onNext}
          disabled={items.some((item, i) => showPriceChange[i] && item.priceChanged && !item.priceChangeReason)}
          className="btn btn-primary btn-lg"
        >
          同意・入力に進む
        </button>
      </div>
    </div>
  )
}
