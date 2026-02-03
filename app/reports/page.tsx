'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DEFAULT_TENANT_ID } from '../lib/constants'
import { Shop, Staff } from '../lib/types'

// =============================================
// 型定義
// =============================================

type SalesTarget = {
  id?: number
  shop_id: number | null
  staff_id: number | null
  weekday_amount: number
  weekend_amount: number      // 後方互換用（使用しない）
  saturday_amount: number
  sunday_amount: number
  holiday_amount: number
  profit_rate: number
  kpi_oled_rate: number | null
  kpi_battery_combo_rate: number | null
  kpi_film_rate: number | null
  kpi_used_sales_rate: number | null
  kpi_accessory_avg: number | null
}

type Holiday = {
  id?: number
  shop_id: number | null
  holiday_date: string
  reason: string
}

type SummaryData = {
  salesCount: number
  totalAmount: number
  totalCost: number
  totalProfit: number
}

type KPIData = {
  oledScreenRepairCount: number
  oledTargetScreenRepairCount: number
  screenBatteryComboCount: number
  screenRepairSalesCount: number
  hgBatteryCount: number       // HGバッテリー件数
  batteryTargetCount: number   // バッテリー交換対象件数（HGバッテリー対象機種）
  filmSalesCount: number
  glassFilmCount: number       // ガラスフィルム（1000円系）
  privacyFilmCount: number     // 覗き見防止（2000円系）
  repairOrUsedSalesCount: number
  usedSalesFromRepairCount: number
  repairSalesCount: number
  accessoryQuantity: number
}

type StaffSummary = {
  staffId: number
  staffName: string
  summary: SummaryData
  kpi: KPIData
  target: SalesTarget | null
}

type ShopSummary = {
  shopId: number
  shopName: string
  isEc: boolean
  summary: SummaryData
  kpi: KPIData
  target: SalesTarget | null
  staffList: StaffSummary[]
}

type RankingItem = {
  name: string
  count: number
  amount: number
  profit: number
}

type DailySales = {
  date: string
  amount: number
  profit: number
  count: number
}

type WeeklyTrend = {
  weekLabel: string
  weekNum: number
  amount: number
  lastYearAmount: number
  profit: number
  count: number
}

type MonthlyWeekData = {
  month: number
  weeks: { week: number; amount: number }[]
}

// HGパネル（有機EL）対応機種
const OLED_TARGET_MODELS = [
  'X', 'XS', 'XSMax', '11Pro', '11ProMax',
  '12', '12mini', '12Pro', '12ProMax',
  '13', '13mini', '13Pro', '13ProMax',
  '14', '14Plus', '14Pro', '14ProMax',
  '15', '15Plus', '15Pro', '15ProMax',
  '16', '16Plus', '16Pro', '16ProMax', '16e'
]

// HGバッテリー対応機種（12以降）
const HG_BATTERY_TARGET_MODELS = [
  '12', '12mini', '12Pro', '12ProMax',
  '13', '13mini', '13Pro', '13ProMax',
  '14', '14Plus', '14Pro', '14ProMax',
  '15', '15Plus', '15Pro', '15ProMax',
  '16', '16Plus', '16Pro', '16ProMax', '16e'
]

// パネル修理の種別（DBの値）
const SCREEN_REPAIR_TYPES = ['TH-F', 'TH-L', 'HG-F', 'HG-L']
const STANDARD_SCREEN_TYPES = ['TH-F', 'TH-L']
const HG_SCREEN_TYPES = ['HG-F', 'HG-L']
const BATTERY_TYPES = ['バッテリー', 'HGバッテリー']

// ローカル日付をYYYY-MM-DD形式に変換（タイムゾーン問題を回避）
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// =============================================
// メインコンポーネント
// =============================================

export default function ReportsPage() {
  // マスタデータ
  const [shops, setShops] = useState<Shop[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  // タブ
  const [activeTab, setActiveTab] = useState<'summary' | 'kpi' | 'ranking' | 'calendar' | 'trend' | 'buyback' | 'target'>('summary')

  // 期間選択
  const [periodType, setPeriodType] = useState<'month' | 'week'>('month')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.setDate(diff))
    return formatLocalDate(monday)
  })

  // カレンダー用
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [dailySales, setDailySales] = useState<DailySales[]>([])

  // 推移分析用
  const [trendYear, setTrendYear] = useState(() => new Date().getFullYear())
  const [weeklyTrendData, setWeeklyTrendData] = useState<WeeklyTrend[]>([])
  const [yearlyHeatmap, setYearlyHeatmap] = useState<MonthlyWeekData[]>([])

  // 展開状態
  const [expandedShops, setExpandedShops] = useState<number[]>([])

  // 集計データ
  const [overallSummary, setOverallSummary] = useState<SummaryData>({ salesCount: 0, totalAmount: 0, totalCost: 0, totalProfit: 0 })
  const [overallKPI, setOverallKPI] = useState<KPIData>({
    oledScreenRepairCount: 0, oledTargetScreenRepairCount: 0,
    screenBatteryComboCount: 0, screenRepairSalesCount: 0,
    hgBatteryCount: 0, batteryTargetCount: 0,
    filmSalesCount: 0, glassFilmCount: 0, privacyFilmCount: 0,
    repairOrUsedSalesCount: 0,
    usedSalesFromRepairCount: 0, repairSalesCount: 0,
    accessoryQuantity: 0
  })
  const [overallTarget, setOverallTarget] = useState<SalesTarget | null>(null)
  const [shopSummaries, setShopSummaries] = useState<ShopSummary[]>([])
  const [buybackSummary, setBuybackSummary] = useState({ count: 0, totalPrice: 0 })
  const [ecSalesSummary, setEcSalesSummary] = useState<SummaryData>({ salesCount: 0, totalAmount: 0, totalCost: 0, totalProfit: 0 })
  const [storeSalesSummary, setStoreSalesSummary] = useState<SummaryData>({ salesCount: 0, totalAmount: 0, totalCost: 0, totalProfit: 0 })
  const [lastYearSummary, setLastYearSummary] = useState<SummaryData | null>(null)

  // ランキングデータ
  const [modelRanking, setModelRanking] = useState<RankingItem[]>([])
  const [screenRepairRanking, setScreenRepairRanking] = useState<RankingItem[]>([])
  const [batteryRepairRanking, setBatteryRepairRanking] = useState<RankingItem[]>([])
  const [usedSalesRanking, setUsedSalesRanking] = useState<RankingItem[]>([])
  const [buybackRanking, setBuybackRanking] = useState<RankingItem[]>([])

  // 目標設定用
  const [targets, setTargets] = useState<SalesTarget[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [targetMonth, setTargetMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [editingTarget, setEditingTarget] = useState<SalesTarget | null>(null)
  const [newHoliday, setNewHoliday] = useState<Holiday>({ shop_id: null, holiday_date: '', reason: '' })
  const [savingTarget, setSavingTarget] = useState(false)
  const [businessDays, setBusinessDays] = useState({ weekdays: 0, saturdays: 0, sundays: 0, holidays: 0 })

  // =============================================
  // 期間計算
  // =============================================

  const getDateRange = () => {
    if (periodType === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      const today = new Date()
      const daysPassed = today.getFullYear() === year && today.getMonth() === month - 1
        ? Math.min(today.getDate(), endDate.getDate())
        : endDate.getDate()
      return {
        startDate: formatLocalDate(startDate),
        endDate: formatLocalDate(endDate),
        daysInPeriod: endDate.getDate(),
        daysPassed
      }
    } else {
      const startDate = new Date(selectedWeekStart)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
      const today = new Date()
      const daysPassed = Math.max(0, Math.min(7, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1))
      return {
        startDate: formatLocalDate(startDate),
        endDate: formatLocalDate(endDate),
        daysInPeriod: 7,
        daysPassed
      }
    }
  }

  const calculateBusinessDays = (yearMonth: string, holidayList: Holiday[]) => {
    const [year, month] = yearMonth.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    let weekdays = 0, saturdays = 0, sundays = 0, holidays = 0
    const holidayDates = holidayList.filter(h => h.shop_id === null).map(h => h.holiday_date)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString('sv-SE')
      if (holidayDates.includes(dateStr)) {
        holidays++
        continue
      }
      const dayOfWeek = d.getDay()
      if (dayOfWeek === 0) sundays++
      else if (dayOfWeek === 6) saturdays++
      else weekdays++
    }
    return { weekdays, saturdays, sundays, holidays }
  }

  const calculateMonthlyTarget = (target: SalesTarget, days: { weekdays: number; saturdays: number; sundays: number; holidays: number }) => {
    const amount = (target.weekday_amount * days.weekdays) +
                   (target.saturday_amount * days.saturdays) +
                   (target.sunday_amount * days.sundays) +
                   (target.holiday_amount * days.holidays)
    const profit = Math.round(amount * (target.profit_rate / 100))
    return { amount, profit }
  }

  // =============================================
  // データ取得
  // =============================================

  useEffect(() => {
    async function fetchMasterData() {
      const { data: shopsData } = await supabase.from('m_shops').select('id, name, is_ec').eq('tenant_id', DEFAULT_TENANT_ID).eq('is_active', true).order('id')
      const { data: staffData } = await supabase.from('m_staff').select('id, name').eq('tenant_id', DEFAULT_TENANT_ID).eq('is_active', true).order('id')
      setShops(shopsData || [])
      setStaff(staffData || [])
    }
    fetchMasterData()
  }, [])

  useEffect(() => {
    if (shops.length > 0 && staff.length > 0) fetchData()
  }, [selectedMonth, selectedWeekStart, periodType, shops, staff])

  useEffect(() => {
    if (activeTab === 'calendar') fetchCalendarData()
  }, [activeTab, calendarMonth])

  useEffect(() => {
    if (activeTab === 'trend') fetchTrendData()
  }, [activeTab, trendYear])

  useEffect(() => {
    if (activeTab === 'target') fetchTargetData()
  }, [activeTab, targetMonth])

  const fetchData = async () => {
    setLoading(true)
    const { startDate, endDate } = getDateRange()
    const yearMonth = periodType === 'month' ? selectedMonth : null

    const { data: salesData } = await supabase.from('t_sales')
      .select('id, shop_id, staff_id, sale_date, total_amount, total_cost, total_profit')
      .eq('tenant_id', DEFAULT_TENANT_ID).gte('sale_date', startDate).lte('sale_date', endDate)

    const salesIds = salesData?.map(s => s.id) || []
    let detailsData: any[] = []
    if (salesIds.length > 0) {
      const { data } = await supabase.from('t_sales_details').select('*').in('sales_id', salesIds)
      detailsData = data || []
    }

    let targetsData: any[] = []
    if (yearMonth) {
      const { data } = await supabase.from('m_sales_targets').select('*').eq('tenant_id', DEFAULT_TENANT_ID).eq('year_month', yearMonth)
      targetsData = data || []
    }

    const { data: holidaysData } = await supabase.from('m_holidays').select('*').eq('tenant_id', DEFAULT_TENANT_ID).gte('holiday_date', startDate).lte('holiday_date', endDate)
    if (yearMonth) setBusinessDays(calculateBusinessDays(yearMonth, holidaysData || []))

    const { data: buybackData } = await supabase.from('t_buyback')
      .select('id, model, storage, final_price').eq('tenant_id', DEFAULT_TENANT_ID).gte('buyback_date', startDate).lte('buyback_date', endDate)

    if (yearMonth) {
      const [year, month] = yearMonth.split('-').map(Number)
      const lastYearStart = `${year - 1}-${String(month).padStart(2, '0')}-01`
      const lastYearEnd = new Date(year - 1, month, 0).toLocaleDateString('sv-SE')
      const { data: lastYearData } = await supabase.from('t_sales')
        .select('total_amount, total_cost, total_profit').eq('tenant_id', DEFAULT_TENANT_ID).gte('sale_date', lastYearStart).lte('sale_date', lastYearEnd)
      if (lastYearData && lastYearData.length > 0) {
        setLastYearSummary({
          salesCount: lastYearData.length,
          totalAmount: lastYearData.reduce((sum, s) => sum + (s.total_amount || 0), 0),
          totalCost: lastYearData.reduce((sum, s) => sum + (s.total_cost || 0), 0),
          totalProfit: lastYearData.reduce((sum, s) => sum + (s.total_profit || 0), 0)
        })
      } else setLastYearSummary(null)
    }

    processData(salesData || [], detailsData, targetsData, buybackData || [])
    setLoading(false)
  }

  const fetchCalendarData = async () => {
    const [year, month] = calendarMonth.split('-').map(Number)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toLocaleDateString('sv-SE')

    const { data: salesData } = await supabase.from('t_sales')
      .select('sale_date, total_amount, total_profit')
      .eq('tenant_id', DEFAULT_TENANT_ID).gte('sale_date', startDate).lte('sale_date', endDate)

    const dailyMap = new Map<string, DailySales>()
    const daysInMonth = new Date(year, month, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      dailyMap.set(dateStr, { date: dateStr, amount: 0, profit: 0, count: 0 })
    }

    salesData?.forEach(s => {
      const existing = dailyMap.get(s.sale_date)
      if (existing) {
        existing.amount += s.total_amount || 0
        existing.profit += s.total_profit || 0
        existing.count++
      }
    })

    setDailySales(Array.from(dailyMap.values()))
  }

  const fetchTrendData = async () => {
    // 今年の週別データ
    const yearStart = `${trendYear}-01-01`
    const yearEnd = `${trendYear}-12-31`
    const { data: thisYearData } = await supabase.from('t_sales')
      .select('sale_date, total_amount, total_profit')
      .eq('tenant_id', DEFAULT_TENANT_ID).gte('sale_date', yearStart).lte('sale_date', yearEnd)

    // 前年の週別データ
    const lastYearStart = `${trendYear - 1}-01-01`
    const lastYearEnd = `${trendYear - 1}-12-31`
    const { data: lastYearData } = await supabase.from('t_sales')
      .select('sale_date, total_amount, total_profit')
      .eq('tenant_id', DEFAULT_TENANT_ID).gte('sale_date', lastYearStart).lte('sale_date', lastYearEnd)

    // 週番号を計算する関数
    const getWeekNumber = (date: Date): number => {
      const firstDay = new Date(date.getFullYear(), 0, 1)
      const pastDays = (date.getTime() - firstDay.getTime()) / 86400000
      return Math.ceil((pastDays + firstDay.getDay() + 1) / 7)
    }

    // 週別集計
    const weeklyMap = new Map<number, { amount: number; profit: number; count: number }>()
    const lastYearWeeklyMap = new Map<number, number>()

    for (let w = 1; w <= 53; w++) {
      weeklyMap.set(w, { amount: 0, profit: 0, count: 0 })
      lastYearWeeklyMap.set(w, 0)
    }

    thisYearData?.forEach(s => {
      const weekNum = getWeekNumber(new Date(s.sale_date))
      const existing = weeklyMap.get(weekNum)
      if (existing) {
        existing.amount += s.total_amount || 0
        existing.profit += s.total_profit || 0
        existing.count++
      }
    })

    lastYearData?.forEach(s => {
      const weekNum = getWeekNumber(new Date(s.sale_date))
      lastYearWeeklyMap.set(weekNum, (lastYearWeeklyMap.get(weekNum) || 0) + (s.total_amount || 0))
    })

    const weeklyTrend: WeeklyTrend[] = []
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    
    for (let w = 1; w <= 52; w++) {
      const data = weeklyMap.get(w) || { amount: 0, profit: 0, count: 0 }
      // 週番号から大体の月を計算
      const approxMonth = Math.min(11, Math.floor((w - 1) / 4.33))
      weeklyTrend.push({
        weekLabel: w % 4 === 1 ? monthNames[approxMonth] : '',
        weekNum: w,
        amount: data.amount,
        lastYearAmount: lastYearWeeklyMap.get(w) || 0,
        profit: data.profit,
        count: data.count
      })
    }
    setWeeklyTrendData(weeklyTrend)

    // 年間ヒートマップ（月×週）
    const heatmapData: MonthlyWeekData[] = []
    for (let m = 1; m <= 12; m++) {
      const monthStart = new Date(trendYear, m - 1, 1)
      const monthEnd = new Date(trendYear, m, 0)
      const weeks: { week: number; amount: number }[] = []
      
      let currentWeek = 1
      let weekAmount = 0
      
      for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toLocaleDateString('sv-SE')
        const daySales = thisYearData?.filter(s => s.sale_date === dateStr) || []
        weekAmount += daySales.reduce((sum, s) => sum + (s.total_amount || 0), 0)
        
        if (d.getDay() === 0 || d.getTime() === monthEnd.getTime()) {
          weeks.push({ week: currentWeek, amount: weekAmount })
          currentWeek++
          weekAmount = 0
        }
      }
      
      heatmapData.push({ month: m, weeks })
    }
    setYearlyHeatmap(heatmapData)
  }

  const fetchTargetData = async () => {
    const { data: targetsData } = await supabase.from('m_sales_targets').select('*').eq('tenant_id', DEFAULT_TENANT_ID).eq('year_month', targetMonth)
    const [year, month] = targetMonth.split('-').map(Number)
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const monthEnd = new Date(year, month, 0).toLocaleDateString('sv-SE')
    const { data: holidaysData } = await supabase.from('m_holidays').select('*').eq('tenant_id', DEFAULT_TENANT_ID).gte('holiday_date', monthStart).lte('holiday_date', monthEnd).order('holiday_date')
    setTargets(targetsData || [])
    setHolidays(holidaysData || [])
    setBusinessDays(calculateBusinessDays(targetMonth, holidaysData || []))
  }

  // =============================================
  // データ集計
  // =============================================

  const processData = (salesData: any[], detailsData: any[], targetsData: any[], buybackData: any[]) => {
    const detailsBySalesId = new Map<number, any[]>()
    detailsData.forEach(d => {
      const list = detailsBySalesId.get(d.sales_id) || []
      list.push(d)
      detailsBySalesId.set(d.sales_id, list)
    })

    const calculateKPI = (salesList: any[]): KPIData => {
      let oledScreenRepairCount = 0, oledTargetScreenRepairCount = 0
      let screenBatteryComboCount = 0, screenRepairSalesCount = 0
      let hgBatteryCount = 0, batteryTargetCount = 0
      let filmSalesCount = 0, glassFilmCount = 0, privacyFilmCount = 0
      let repairOrUsedSalesCount = 0
      let usedSalesFromRepairCount = 0, repairSalesCount = 0, accessoryQuantity = 0

      salesList.forEach(sale => {
        const details = detailsBySalesId.get(sale.id) || []
        const hasRepair = details.some(d => d.category === 'iPhone修理' || d.category === 'Android修理')
        const hasUsedSale = details.some(d => d.category === '中古販売')
        const hasScreenRepair = details.some(d => (d.category === 'iPhone修理' || d.category === 'Android修理') && SCREEN_REPAIR_TYPES.includes(d.menu))
        const hasBatteryRepair = details.some(d => (d.category === 'iPhone修理' || d.category === 'Android修理') && BATTERY_TYPES.includes(d.menu))
        const hasOledScreenRepair = details.some(d => d.category === 'iPhone修理' && HG_SCREEN_TYPES.includes(d.menu))
        const hasOledTargetScreenRepair = details.some(d => d.category === 'iPhone修理' && SCREEN_REPAIR_TYPES.includes(d.menu) && OLED_TARGET_MODELS.includes(d.model))

        // HGバッテリー獲得判定
        const hasHgBattery = details.some(d => d.category === 'iPhone修理' && d.menu === 'HGバッテリー')
        const hasBatteryTargetModel = details.some(d => d.category === 'iPhone修理' && BATTERY_TYPES.includes(d.menu) && HG_BATTERY_TARGET_MODELS.includes(d.model))

        // フィルム詳細判定
        const hasGlassFilm = details.some(d => d.category === 'アクセサリ' && (d.menu?.includes('HD') || (d.menu?.includes('フィルム') && !d.menu?.includes('覗き見'))))
        const hasPrivacyFilm = details.some(d => d.category === 'アクセサリ' && d.menu?.includes('覗き見'))
        const hasAnyFilm = hasGlassFilm || hasPrivacyFilm

        if (hasOledScreenRepair) oledScreenRepairCount++
        if (hasOledTargetScreenRepair) oledTargetScreenRepairCount++
        if (hasScreenRepair && hasBatteryRepair) screenBatteryComboCount++
        if (hasScreenRepair) screenRepairSalesCount++
        if (hasHgBattery) hgBatteryCount++
        if (hasBatteryTargetModel) batteryTargetCount++
        if (hasAnyFilm && (hasRepair || hasUsedSale)) filmSalesCount++
        if (hasGlassFilm && (hasRepair || hasUsedSale)) glassFilmCount++
        if (hasPrivacyFilm && (hasRepair || hasUsedSale)) privacyFilmCount++
        if (hasRepair || hasUsedSale) repairOrUsedSalesCount++
        if (hasRepair && hasUsedSale) usedSalesFromRepairCount++
        if (hasRepair) repairSalesCount++
        details.forEach(d => { if (d.category === 'アクセサリ') accessoryQuantity += d.quantity || 1 })
      })

      return {
        oledScreenRepairCount, oledTargetScreenRepairCount,
        screenBatteryComboCount, screenRepairSalesCount,
        hgBatteryCount, batteryTargetCount,
        filmSalesCount, glassFilmCount, privacyFilmCount,
        repairOrUsedSalesCount, usedSalesFromRepairCount, repairSalesCount, accessoryQuantity
      }
    }

    const calculateSummary = (salesList: any[]): SummaryData => ({
      salesCount: salesList.length,
      totalAmount: salesList.reduce((sum, s) => sum + (s.total_amount || 0), 0),
      totalCost: salesList.reduce((sum, s) => sum + (s.total_cost || 0), 0),
      totalProfit: salesList.reduce((sum, s) => sum + (s.total_profit || 0), 0)
    })

    setOverallSummary(calculateSummary(salesData))
    setOverallKPI(calculateKPI(salesData))
    setOverallTarget(targetsData.find(t => t.shop_id === null && t.staff_id === null) || null)

    const shopSummaryList: ShopSummary[] = shops.map(shop => {
      const shopSales = salesData.filter(s => s.shop_id === shop.id)
      const shopTarget = targetsData.find(t => t.shop_id === shop.id && t.staff_id === null)
      const staffList: StaffSummary[] = staff.map(st => {
        const staffSales = shopSales.filter(s => s.staff_id === st.id)
        const staffTarget = targetsData.find(t => t.shop_id === shop.id && t.staff_id === st.id)
        return { staffId: st.id, staffName: st.name, summary: calculateSummary(staffSales), kpi: calculateKPI(staffSales), target: staffTarget || null }
      }).filter(st => st.summary.salesCount > 0)
      return { shopId: shop.id, shopName: shop.name, isEc: shop.is_ec || false, summary: calculateSummary(shopSales), kpi: calculateKPI(shopSales), target: shopTarget || null, staffList }
    })
    setShopSummaries(shopSummaryList)
    setBuybackSummary({ count: buybackData.length, totalPrice: buybackData.reduce((sum, b) => sum + (b.final_price || 0), 0) })

    // EC店舗と実店舗の売上を分離
    const ecShopIds = shops.filter(s => s.is_ec).map(s => s.id)
    const ecSales = salesData.filter(s => ecShopIds.includes(s.shop_id))
    const storeSales = salesData.filter(s => !ecShopIds.includes(s.shop_id))
    setEcSalesSummary(calculateSummary(ecSales))
    setStoreSalesSummary(calculateSummary(storeSales))

    // ランキング集計
    const modelMap = new Map<string, RankingItem>()
    const screenMap = new Map<string, RankingItem>()
    const batteryMap = new Map<string, RankingItem>()
    const usedMap = new Map<string, RankingItem>()
    const buybackMap = new Map<string, RankingItem>()

    detailsData.filter(d => d.category === 'iPhone修理' || d.category === 'Android修理').forEach(d => {
      const key = d.model || '不明'
      const existing = modelMap.get(key) || { name: key, count: 0, amount: 0, profit: 0 }
      modelMap.set(key, { ...existing, count: existing.count + 1, amount: existing.amount + (d.amount || 0), profit: existing.profit + (d.profit || 0) })
    })
    setModelRanking(Array.from(modelMap.values()).sort((a, b) => b.count - a.count).slice(0, 10))

    detailsData.filter(d => (d.category === 'iPhone修理' || d.category === 'Android修理') && SCREEN_REPAIR_TYPES.includes(d.menu)).forEach(d => {
      const key = d.model || '不明'
      const existing = screenMap.get(key) || { name: key, count: 0, amount: 0, profit: 0 }
      screenMap.set(key, { ...existing, count: existing.count + 1, amount: existing.amount + (d.amount || 0), profit: existing.profit + (d.profit || 0) })
    })
    setScreenRepairRanking(Array.from(screenMap.values()).sort((a, b) => b.count - a.count).slice(0, 10))

    detailsData.filter(d => (d.category === 'iPhone修理' || d.category === 'Android修理') && BATTERY_TYPES.includes(d.menu)).forEach(d => {
      const key = d.model || '不明'
      const existing = batteryMap.get(key) || { name: key, count: 0, amount: 0, profit: 0 }
      batteryMap.set(key, { ...existing, count: existing.count + 1, amount: existing.amount + (d.amount || 0), profit: existing.profit + (d.profit || 0) })
    })
    setBatteryRepairRanking(Array.from(batteryMap.values()).sort((a, b) => b.count - a.count).slice(0, 10))

    detailsData.filter(d => d.category === '中古販売').forEach(d => {
      const key = `${d.model || ''} ${d.storage || ''}GB ${d.rank || ''}`
      const existing = usedMap.get(key) || { name: key, count: 0, amount: 0, profit: 0 }
      usedMap.set(key, { ...existing, count: existing.count + 1, amount: existing.amount + (d.amount || 0), profit: existing.profit + (d.profit || 0) })
    })
    setUsedSalesRanking(Array.from(usedMap.values()).sort((a, b) => b.count - a.count).slice(0, 10))

    buybackData.forEach(b => {
      const key = `${b.model || '不明'} ${b.storage || ''}GB`
      const existing = buybackMap.get(key) || { name: key, count: 0, amount: 0, profit: 0 }
      buybackMap.set(key, { ...existing, count: existing.count + 1, amount: existing.amount + (b.final_price || 0), profit: 0 })
    })
    setBuybackRanking(Array.from(buybackMap.values()).sort((a, b) => b.count - a.count).slice(0, 10))
  }

  // =============================================
  // 目標保存
  // =============================================

  const saveTarget = async (target: SalesTarget) => {
    setSavingTarget(true)
    const data = {
      tenant_id: DEFAULT_TENANT_ID, year_month: targetMonth, shop_id: target.shop_id, staff_id: target.staff_id,
      weekday_amount: target.weekday_amount,
      weekend_amount: target.saturday_amount || 0, // 後方互換用
      saturday_amount: target.saturday_amount || 0,
      sunday_amount: target.sunday_amount || 0,
      holiday_amount: target.holiday_amount || 0,
      profit_rate: target.profit_rate,
      kpi_oled_rate: target.kpi_oled_rate, kpi_battery_combo_rate: target.kpi_battery_combo_rate,
      kpi_film_rate: target.kpi_film_rate, kpi_used_sales_rate: target.kpi_used_sales_rate,
      kpi_accessory_avg: target.kpi_accessory_avg, updated_at: new Date().toISOString()
    }
    if (target.id) await supabase.from('m_sales_targets').update(data).eq('id', target.id)
    else await supabase.from('m_sales_targets').insert(data)
    setEditingTarget(null)
    setSavingTarget(false)
    fetchTargetData()
  }

  const addHoliday = async () => {
    if (!newHoliday.holiday_date) { alert('日付を選択してください'); return }
    await supabase.from('m_holidays').insert({ tenant_id: DEFAULT_TENANT_ID, shop_id: newHoliday.shop_id, holiday_date: newHoliday.holiday_date, reason: newHoliday.reason || null })
    setNewHoliday({ shop_id: null, holiday_date: '', reason: '' })
    fetchTargetData()
  }

  const deleteHoliday = async (id: number) => {
    if (!confirm('この休業日を削除しますか？')) return
    await supabase.from('m_holidays').delete().eq('id', id)
    fetchTargetData()
  }

  // =============================================
  // ヘルパー関数
  // =============================================

  const calcRate = (num: number, den: number): string => den === 0 ? '-' : ((num / den) * 100).toFixed(1) + '%'
  const calcProfitRate = (profit: number, amount: number): string => amount === 0 ? '0.0%' : ((profit / amount) * 100).toFixed(1) + '%'
  const calcUnitPrice = (amount: number, count: number): string => count === 0 ? '¥0' : '¥' + Math.round(amount / count).toLocaleString()
  const calculateProjection = (current: number, daysPassed: number, daysInPeriod: number): number => daysPassed === 0 ? 0 : Math.round(current + (current / daysPassed) * (daysInPeriod - daysPassed))
  const calculateAchievementRate = (current: number, target: number): number => target === 0 ? 0 : Math.round((current / target) * 100)
  const toggleShopExpand = (shopId: number) => setExpandedShops(prev => prev.includes(shopId) ? prev.filter(id => id !== shopId) : [...prev, shopId])
  
  const getWeekOptions = () => {
    const options = []
    const today = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - (i * 7))
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(d.setDate(diff))
      const sunday = new Date(monday)
      sunday.setDate(sunday.getDate() + 6)
      options.push({ value: monday.toLocaleDateString('sv-SE'), label: `${monday.getMonth() + 1}/${monday.getDate()} 〜 ${sunday.getMonth() + 1}/${sunday.getDate()}` })
    }
    return options
  }

  const getTargetForDisplay = (target: SalesTarget | null) => target ? calculateMonthlyTarget(target, businessDays) : null

  // 店舗目標の合計から全体目標を計算
  const getOverallTargetFromShops = () => {
    const shopTargets = shopSummaries.map(s => s.target).filter(Boolean) as SalesTarget[]
    if (shopTargets.length === 0) return null
    const totalWeekday = shopTargets.reduce((sum, t) => sum + (t.weekday_amount || 0), 0)
    const totalSaturday = shopTargets.reduce((sum, t) => sum + (t.saturday_amount || 0), 0)
    const totalSunday = shopTargets.reduce((sum, t) => sum + (t.sunday_amount || 0), 0)
    const totalHoliday = shopTargets.reduce((sum, t) => sum + (t.holiday_amount || 0), 0)
    const avgProfitRate = shopTargets.reduce((sum, t) => sum + (t.profit_rate || 0), 0) / shopTargets.length
    const amount = (totalWeekday * businessDays.weekdays) + (totalSaturday * businessDays.saturdays) + (totalSunday * businessDays.sundays) + (totalHoliday * businessDays.holidays)
    const profit = Math.round(amount * (avgProfitRate / 100))
    return { amount, profit }
  }

  const { daysInPeriod, daysPassed } = getDateRange()

  // カレンダー用ヘルパー
  const getCalendarData = () => {
    const [year, month] = calendarMonth.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const maxAmount = Math.max(...dailySales.map(d => d.amount), 1)
    return { year, month, firstDay, daysInMonth, maxAmount }
  }

  const getHeatmapColor = (amount: number, maxAmount: number): string => {
    if (amount === 0) return 'var(--color-bg)'
    const intensity = Math.min(amount / maxAmount, 1)
    if (intensity < 0.2) return '#fee2e2'  // 薄い赤
    if (intensity < 0.4) return '#fca5a5'  // 赤
    if (intensity < 0.6) return '#c4b5fd'  // 薄い紫
    if (intensity < 0.8) return '#93c5fd'  // 水色
    return '#3b82f6'  // 青
  }

  // =============================================
  // レンダリング
  // =============================================

  if (loading && shops.length === 0) return <div className="loading"><div className="loading-spinner"></div></div>

  return (
    <div>
      <div className="page-header"><h1 className="page-title">売上レポート</h1></div>

      {/* 期間選択（サマリー・KPI・ランキング・買取タブのみ） */}
      {['summary', 'kpi', 'ranking', 'buyback'].includes(activeTab) && (
        <div className="card mb-lg">
          <div className="card-body">
            <div className="flex flex-wrap items-center gap-md">
              <div className="flex gap-sm">
                <button onClick={() => setPeriodType('month')} className={`btn ${periodType === 'month' ? 'btn-primary' : 'btn-secondary'}`}>月単位</button>
                <button onClick={() => setPeriodType('week')} className={`btn ${periodType === 'week' ? 'btn-primary' : 'btn-secondary'}`}>週単位</button>
              </div>
              {periodType === 'month' ? (
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="form-input" style={{ width: 'auto' }} />
              ) : (
                <select value={selectedWeekStart} onChange={(e) => setSelectedWeekStart(e.target.value)} className="form-select" style={{ width: 'auto' }}>
                  {getWeekOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              )}
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{daysPassed} / {daysInPeriod} 日経過</span>
            </div>
          </div>
        </div>
      )}

      {/* タブ */}
      <div className="tabs mb-lg" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button className={`tab ${activeTab === 'summary' ? 'tab-active' : ''}`} onClick={() => setActiveTab('summary')}>サマリー</button>
        <button className={`tab ${activeTab === 'kpi' ? 'tab-active' : ''}`} onClick={() => setActiveTab('kpi')}>KPI分析</button>
        <button className={`tab ${activeTab === 'ranking' ? 'tab-active' : ''}`} onClick={() => setActiveTab('ranking')}>ランキング</button>
        <button className={`tab ${activeTab === 'calendar' ? 'tab-active' : ''}`} onClick={() => setActiveTab('calendar')}>カレンダー</button>
        <button className={`tab ${activeTab === 'trend' ? 'tab-active' : ''}`} onClick={() => setActiveTab('trend')}>推移分析</button>
        <button className={`tab ${activeTab === 'buyback' ? 'tab-active' : ''}`} onClick={() => setActiveTab('buyback')}>買取実績</button>
        <button className={`tab ${activeTab === 'target' ? 'tab-active' : ''}`} onClick={() => setActiveTab('target')}>目標設定</button>
      </div>

      {loading ? <div className="loading"><div className="loading-spinner"></div></div> : (
        <>
          {/* サマリータブ */}
          {activeTab === 'summary' && (
            <div>
              <div className="card mb-lg">
                <div className="card-header"><h2 className="card-title">全体実績</h2></div>
                <div className="card-body">
                  {periodType === 'month' && (() => {
                    const target = getOverallTargetFromShops()
                    if (!target) return null
                    return (
                      <div className="form-grid form-grid-2 mb-lg">
                        <div style={{ padding: '16px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius)' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '12px' }}>売上目標（店舗合計）</div>
                          <div className="form-grid form-grid-4" style={{ gap: '8px' }}>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>目標</div><div style={{ fontWeight: 600 }}>¥{target.amount.toLocaleString()}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>累計</div><div style={{ fontWeight: 600 }}>¥{overallSummary.totalAmount.toLocaleString()}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>着地予想</div><div style={{ fontWeight: 600 }}>¥{calculateProjection(overallSummary.totalAmount, daysPassed, daysInPeriod).toLocaleString()}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>達成率</div><div style={{ fontWeight: 700, fontSize: '1.2rem', color: calculateAchievementRate(overallSummary.totalAmount, target.amount) >= 100 ? 'var(--color-success)' : 'var(--color-danger)' }}>{calculateAchievementRate(overallSummary.totalAmount, target.amount)}%</div></div>
                          </div>
                        </div>
                        <div style={{ padding: '16px', background: 'var(--color-success-light)', borderRadius: 'var(--radius)' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-success)', marginBottom: '12px' }}>粗利目標（店舗合計）</div>
                          <div className="form-grid form-grid-4" style={{ gap: '8px' }}>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>目標</div><div style={{ fontWeight: 600 }}>¥{target.profit.toLocaleString()}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>累計</div><div style={{ fontWeight: 600 }}>¥{overallSummary.totalProfit.toLocaleString()}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>着地予想</div><div style={{ fontWeight: 600 }}>¥{calculateProjection(overallSummary.totalProfit, daysPassed, daysInPeriod).toLocaleString()}</div></div>
                            <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>達成率</div><div style={{ fontWeight: 700, fontSize: '1.2rem', color: calculateAchievementRate(overallSummary.totalProfit, target.profit) >= 100 ? 'var(--color-success)' : 'var(--color-danger)' }}>{calculateAchievementRate(overallSummary.totalProfit, target.profit)}%</div></div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                  <div className="stat-grid stat-grid-5">
                    <div className="stat-card"><div className="stat-label">接客数</div><div className="stat-value">{overallSummary.salesCount}件</div></div>
                    <div className="stat-card"><div className="stat-label">売上合計（税抜）</div><div className="stat-value" style={{ color: 'var(--color-primary)' }}>¥{overallSummary.totalAmount.toLocaleString()}</div></div>
                    <div className="stat-card"><div className="stat-label">粗利合計</div><div className="stat-value" style={{ color: 'var(--color-success)' }}>¥{overallSummary.totalProfit.toLocaleString()}</div></div>
                    <div className="stat-card"><div className="stat-label">粗利率</div><div className="stat-value">{calcProfitRate(overallSummary.totalProfit, overallSummary.totalAmount)}</div></div>
                    <div className="stat-card"><div className="stat-label">客単価</div><div className="stat-value">{calcUnitPrice(overallSummary.totalAmount, overallSummary.salesCount)}</div></div>
                  </div>

                  {/* 実店舗 vs EC内訳 */}
                  {(ecSalesSummary.salesCount > 0 || storeSalesSummary.salesCount > 0) && (
                    <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ padding: '12px 16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-secondary)' }}>実店舗</div>
                        <div className="flex gap-lg" style={{ fontSize: '0.9rem' }}>
                          <span>{storeSalesSummary.salesCount}件</span>
                          <span style={{ color: 'var(--color-primary)' }}>¥{storeSalesSummary.totalAmount.toLocaleString()}</span>
                          <span style={{ color: 'var(--color-success)' }}>粗利 ¥{storeSalesSummary.totalProfit.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ padding: '12px 16px', background: 'var(--color-primary-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--color-primary)' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--color-primary)' }}>EC売上（メルカリ・Shopify等）</div>
                        <div className="flex gap-lg" style={{ fontSize: '0.9rem' }}>
                          <span>{ecSalesSummary.salesCount}件</span>
                          <span style={{ color: 'var(--color-primary)' }}>¥{ecSalesSummary.totalAmount.toLocaleString()}</span>
                          <span style={{ color: 'var(--color-success)' }}>粗利 ¥{ecSalesSummary.totalProfit.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {lastYearSummary && periodType === 'month' && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>前年同月比</div>
                      <div className="flex gap-lg" style={{ fontSize: '0.9rem' }}>
                        <span>売上: {lastYearSummary.totalAmount > 0 ? Math.round((overallSummary.totalAmount / lastYearSummary.totalAmount) * 100) : '-'}%</span>
                        <span>粗利: {lastYearSummary.totalProfit > 0 ? Math.round((overallSummary.totalProfit / lastYearSummary.totalProfit) * 100) : '-'}%</span>
                        <span>件数: {lastYearSummary.salesCount > 0 ? Math.round((overallSummary.salesCount / lastYearSummary.salesCount) * 100) : '-'}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="card mb-lg">
                <div className="card-header"><h2 className="card-title">店舗別実績</h2></div>
                <div className="card-body" style={{ padding: 0 }}>
                  {shopSummaries.map(shop => (
                    <div key={shop.shopId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <div onClick={() => toggleShopExpand(shop.shopId)} style={{ padding: '16px 24px', cursor: 'pointer', background: expandedShops.includes(shop.shopId) ? 'var(--color-bg)' : 'transparent' }}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-md">
                            <span style={{ fontWeight: 600 }}>{expandedShops.includes(shop.shopId) ? '▼' : '▶'}</span>
                            <span style={{ fontWeight: 600 }}>{shop.shopName}</span>
                            {shop.isEc && <span className="badge badge-primary">EC</span>}
                          </div>
                          <div className="flex gap-lg" style={{ fontSize: '0.9rem' }}>
                            <span>接客: {shop.summary.salesCount}件</span>
                            <span style={{ color: 'var(--color-primary)' }}>売上: ¥{shop.summary.totalAmount.toLocaleString()}</span>
                            <span style={{ color: 'var(--color-success)' }}>粗利: ¥{shop.summary.totalProfit.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      {expandedShops.includes(shop.shopId) && shop.staffList.length > 0 && (
                        <div style={{ padding: '0 24px 16px 48px' }}>
                          <table className="data-table" style={{ fontSize: '0.85rem' }}>
                            <thead><tr><th>スタッフ</th><th className="text-right">接客数</th><th className="text-right">売上</th><th className="text-right">粗利</th><th className="text-right">粗利率</th><th className="text-right">客単価</th></tr></thead>
                            <tbody>
                              {shop.staffList.map(st => (
                                <tr key={st.staffId}>
                                  <td style={{ fontWeight: 500 }}>{st.staffName}</td>
                                  <td className="text-right">{st.summary.salesCount}件</td>
                                  <td className="text-right">¥{st.summary.totalAmount.toLocaleString()}</td>
                                  <td className="text-right" style={{ color: 'var(--color-success)' }}>¥{st.summary.totalProfit.toLocaleString()}</td>
                                  <td className="text-right">{calcProfitRate(st.summary.totalProfit, st.summary.totalAmount)}</td>
                                  <td className="text-right">{calcUnitPrice(st.summary.totalAmount, st.summary.salesCount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* KPI分析タブ */}
          {activeTab === 'kpi' && (
            <div>
              <div className="card mb-lg">
                <div className="card-header"><h2 className="card-title">全体KPI</h2></div>
                <div className="card-body">
                  {/* パネル・バッテリー関連 */}
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text-secondary)' }}>パネル・バッテリー</h3>
                  <div className="stat-grid stat-grid-4 mb-lg">
                    <div className="stat-card">
                      <div className="stat-label">HGパネル獲得率</div>
                      <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{calcRate(overallKPI.oledScreenRepairCount, overallKPI.oledTargetScreenRepairCount)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{overallKPI.oledScreenRepairCount} / {overallKPI.oledTargetScreenRepairCount}件</div>
                      {overallTarget?.kpi_oled_rate && <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>目標: {overallTarget.kpi_oled_rate}%</div>}
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">HGバッテリー獲得率</div>
                      <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{calcRate(overallKPI.hgBatteryCount, overallKPI.batteryTargetCount)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{overallKPI.hgBatteryCount} / {overallKPI.batteryTargetCount}件</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">同時交換率</div>
                      <div className="stat-value" style={{ color: 'var(--color-success)' }}>{calcRate(overallKPI.screenBatteryComboCount, overallKPI.screenRepairSalesCount)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{overallKPI.screenBatteryComboCount} / {overallKPI.screenRepairSalesCount}件</div>
                      {overallTarget?.kpi_battery_combo_rate && <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>目標: {overallTarget.kpi_battery_combo_rate}%</div>}
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">中古販売率</div>
                      <div className="stat-value" style={{ color: 'var(--color-success)' }}>{calcRate(overallKPI.usedSalesFromRepairCount, overallKPI.repairSalesCount)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{overallKPI.usedSalesFromRepairCount} / {overallKPI.repairSalesCount}件</div>
                      {overallTarget?.kpi_used_sales_rate && <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>目標: {overallTarget.kpi_used_sales_rate}%</div>}
                    </div>
                  </div>

                  {/* フィルム詳細 */}
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text-secondary)' }}>フィルム装着</h3>
                  <div className="stat-grid stat-grid-4 mb-lg">
                    <div className="stat-card">
                      <div className="stat-label">全体装着率</div>
                      <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{calcRate(overallKPI.filmSalesCount, overallKPI.repairOrUsedSalesCount)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{overallKPI.filmSalesCount} / {overallKPI.repairOrUsedSalesCount}件</div>
                      {overallTarget?.kpi_film_rate && <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>目標: {overallTarget.kpi_film_rate}%</div>}
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">ガラスフィルム（1000円）</div>
                      <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{calcRate(overallKPI.glassFilmCount, overallKPI.repairOrUsedSalesCount)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{overallKPI.glassFilmCount}件</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">覗き見防止（2000円）</div>
                      <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{calcRate(overallKPI.privacyFilmCount, overallKPI.repairOrUsedSalesCount)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{overallKPI.privacyFilmCount}件</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">アクセサリ添付</div>
                      <div className="stat-value">{overallSummary.salesCount > 0 ? (overallKPI.accessoryQuantity / overallSummary.salesCount).toFixed(2) : '-'}個/人</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>合計 {overallKPI.accessoryQuantity}個</div>
                      {overallTarget?.kpi_accessory_avg && <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>目標: {overallTarget.kpi_accessory_avg}個/人</div>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-header"><h2 className="card-title">店舗・スタッフ別KPI</h2></div>
                <div className="card-body" style={{ padding: 0 }}>
                  <div className="table-wrapper" style={{ border: 'none' }}>
                    <table className="data-table">
                      <thead><tr><th>店舗/スタッフ</th><th className="text-right">HGパネル</th><th className="text-right">HGバッテリー</th><th className="text-right">同時交換</th><th className="text-right">フィルム</th><th className="text-right">中古販売</th><th className="text-right">アクセサリ</th></tr></thead>
                      <tbody>
                        {shopSummaries.map(shop => (
                          <>
                            <tr key={`shop-${shop.shopId}`} style={{ background: 'var(--color-bg)' }}>
                              <td style={{ fontWeight: 600 }}>{shop.shopName}</td>
                              <td className="text-right">{calcRate(shop.kpi.oledScreenRepairCount, shop.kpi.oledTargetScreenRepairCount)}</td>
                              <td className="text-right">{calcRate(shop.kpi.hgBatteryCount, shop.kpi.batteryTargetCount)}</td>
                              <td className="text-right">{calcRate(shop.kpi.screenBatteryComboCount, shop.kpi.screenRepairSalesCount)}</td>
                              <td className="text-right">{calcRate(shop.kpi.filmSalesCount, shop.kpi.repairOrUsedSalesCount)}</td>
                              <td className="text-right">{calcRate(shop.kpi.usedSalesFromRepairCount, shop.kpi.repairSalesCount)}</td>
                              <td className="text-right">{shop.summary.salesCount > 0 ? (shop.kpi.accessoryQuantity / shop.summary.salesCount).toFixed(2) : '-'}</td>
                            </tr>
                            {shop.staffList.map(st => (
                              <tr key={`staff-${st.staffId}`}>
                                <td style={{ paddingLeft: '32px' }}>{st.staffName}</td>
                                <td className="text-right">{calcRate(st.kpi.oledScreenRepairCount, st.kpi.oledTargetScreenRepairCount)}</td>
                                <td className="text-right">{calcRate(st.kpi.hgBatteryCount, st.kpi.batteryTargetCount)}</td>
                                <td className="text-right">{calcRate(st.kpi.screenBatteryComboCount, st.kpi.screenRepairSalesCount)}</td>
                                <td className="text-right">{calcRate(st.kpi.filmSalesCount, st.kpi.repairOrUsedSalesCount)}</td>
                                <td className="text-right">{calcRate(st.kpi.usedSalesFromRepairCount, st.kpi.repairSalesCount)}</td>
                                <td className="text-right">{st.summary.salesCount > 0 ? (st.kpi.accessoryQuantity / st.summary.salesCount).toFixed(2) : '-'}</td>
                              </tr>
                            ))}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ランキングタブ */}
          {activeTab === 'ranking' && (
            <div>
              <div className="form-grid form-grid-3 mb-lg" style={{ gap: '16px' }}>
                <div className="card">
                  <div className="card-header"><h2 className="card-title">モデル別修理</h2></div>
                  <div className="card-body" style={{ padding: 0 }}>
                    <table className="data-table">
                      <thead><tr><th>機種</th><th className="text-right">件数</th><th className="text-right">売上</th></tr></thead>
                      <tbody>
                        {modelRanking.map((item, idx) => <tr key={idx}><td>{item.name}</td><td className="text-right">{item.count}件</td><td className="text-right">¥{item.amount.toLocaleString()}</td></tr>)}
                        {modelRanking.length === 0 && <tr><td colSpan={3} className="text-center" style={{ color: 'var(--color-text-secondary)' }}>データなし</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><h2 className="card-title">パネル修理</h2></div>
                  <div className="card-body" style={{ padding: 0 }}>
                    <table className="data-table">
                      <thead><tr><th>機種</th><th className="text-right">件数</th><th className="text-right">売上</th></tr></thead>
                      <tbody>
                        {screenRepairRanking.map((item, idx) => <tr key={idx}><td>{item.name}</td><td className="text-right">{item.count}件</td><td className="text-right">¥{item.amount.toLocaleString()}</td></tr>)}
                        {screenRepairRanking.length === 0 && <tr><td colSpan={3} className="text-center" style={{ color: 'var(--color-text-secondary)' }}>データなし</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><h2 className="card-title">バッテリー交換</h2></div>
                  <div className="card-body" style={{ padding: 0 }}>
                    <table className="data-table">
                      <thead><tr><th>機種</th><th className="text-right">件数</th><th className="text-right">売上</th></tr></thead>
                      <tbody>
                        {batteryRepairRanking.map((item, idx) => <tr key={idx}><td>{item.name}</td><td className="text-right">{item.count}件</td><td className="text-right">¥{item.amount.toLocaleString()}</td></tr>)}
                        {batteryRepairRanking.length === 0 && <tr><td colSpan={3} className="text-center" style={{ color: 'var(--color-text-secondary)' }}>データなし</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="form-grid form-grid-2" style={{ gap: '16px' }}>
                <div className="card">
                  <div className="card-header"><h2 className="card-title">中古販売</h2></div>
                  <div className="card-body" style={{ padding: 0 }}>
                    <table className="data-table">
                      <thead><tr><th>商品</th><th className="text-right">件数</th><th className="text-right">売上</th></tr></thead>
                      <tbody>
                        {usedSalesRanking.map((item, idx) => <tr key={idx}><td>{item.name}</td><td className="text-right">{item.count}件</td><td className="text-right">¥{item.amount.toLocaleString()}</td></tr>)}
                        {usedSalesRanking.length === 0 && <tr><td colSpan={3} className="text-center" style={{ color: 'var(--color-text-secondary)' }}>データなし</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><h2 className="card-title">買取</h2></div>
                  <div className="card-body" style={{ padding: 0 }}>
                    <table className="data-table">
                      <thead><tr><th>商品</th><th className="text-right">件数</th><th className="text-right">金額</th></tr></thead>
                      <tbody>
                        {buybackRanking.map((item, idx) => <tr key={idx}><td>{item.name}</td><td className="text-right">{item.count}件</td><td className="text-right">¥{item.amount.toLocaleString()}</td></tr>)}
                        {buybackRanking.length === 0 && <tr><td colSpan={3} className="text-center" style={{ color: 'var(--color-text-secondary)' }}>データなし</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* カレンダータブ */}
          {activeTab === 'calendar' && (() => {
            const { year, month, firstDay, daysInMonth, maxAmount } = getCalendarData()
            const monthTotal = dailySales.reduce((sum, d) => sum + d.amount, 0)
            return (
              <div className="card">
                <div className="card-header">
                  <div className="flex justify-between items-center">
                    <h2 className="card-title">日別売上カレンダー</h2>
                    <div className="flex items-center gap-md">
                      <button onClick={() => {
                        const [y, m] = calendarMonth.split('-').map(Number)
                        const prevMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
                        setCalendarMonth(prevMonth)
                      }} className="btn btn-secondary">◀</button>
                      <span style={{ fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>{year}年{month}月</span>
                      <button onClick={() => {
                        const [y, m] = calendarMonth.split('-').map(Number)
                        const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
                        setCalendarMonth(nextMonth)
                      }} className="btn btn-secondary">▶</button>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ marginBottom: '16px', textAlign: 'right' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>月合計: ¥{monthTotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                    {['月', '火', '水', '木', '金', '土', '日'].map((day, idx) => (
                      <div key={day} style={{ textAlign: 'center', fontWeight: 600, padding: '8px', color: idx >= 5 ? 'var(--color-primary)' : 'inherit' }}>{day}</div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {Array.from({ length: (firstDay === 0 ? 6 : firstDay - 1) }).map((_, idx) => (
                      <div key={`empty-${idx}`} style={{ minHeight: '80px' }}></div>
                    ))}
                    {dailySales.map((day, idx) => {
                      const date = new Date(day.date)
                      const dayOfWeek = date.getDay()
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                      const isToday = day.date === new Date().toLocaleDateString('sv-SE')
                      const isHighAmount = day.amount > maxAmount * 0.8
                      return (
                        <div key={day.date} style={{
                          minHeight: '80px', padding: '8px', borderRadius: 'var(--radius)',
                          background: getHeatmapColor(day.amount, maxAmount),
                          border: isToday ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          color: isHighAmount ? 'white' : 'inherit'
                        }}>
                          <div style={{ fontWeight: 600, color: isWeekend && !isHighAmount ? 'var(--color-primary)' : 'inherit' }}>
                            {idx + 1}
                          </div>
                          {day.amount > 0 && (
                            <>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>¥{(day.amount / 10000).toFixed(1)}万</div>
                              <div style={{ fontSize: '0.7rem' }}>{day.count}件</div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.8rem' }}>少ない</span>
                    <div style={{ width: '20px', height: '20px', background: '#fee2e2', borderRadius: '4px', border: '1px solid #fca5a5' }}></div>
                    <div style={{ width: '20px', height: '20px', background: '#fca5a5', borderRadius: '4px' }}></div>
                    <div style={{ width: '20px', height: '20px', background: '#c4b5fd', borderRadius: '4px' }}></div>
                    <div style={{ width: '20px', height: '20px', background: '#93c5fd', borderRadius: '4px' }}></div>
                    <div style={{ width: '20px', height: '20px', background: '#3b82f6', borderRadius: '4px' }}></div>
                    <span style={{ fontSize: '0.8rem' }}>多い</span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 推移分析タブ */}
          {activeTab === 'trend' && (
            <div>
              {/* 年選択 */}
              <div className="card mb-lg">
                <div className="card-body">
                  <div className="flex items-center gap-md">
                    <label className="form-label" style={{ marginBottom: 0 }}>対象年:</label>
                    <select value={trendYear} onChange={(e) => setTrendYear(Number(e.target.value))} className="form-select" style={{ width: 'auto' }}>
                      {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}年</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* 週別推移グラフ */}
              <div className="card mb-lg">
                <div className="card-header"><h2 className="card-title">週別売上推移（前年比較）</h2></div>
                <div className="card-body">
                  <div style={{ width: '100%', height: '400px' }}>
                    <ResponsiveContainer>
                      <LineChart data={weeklyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`} />
                        <Tooltip formatter={(value: any) => `¥${value?.toLocaleString()}`} labelFormatter={(label) => `${label}`} />
                        <Legend />
                        <Line type="monotone" dataKey="amount" name={`${trendYear}年`} stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="lastYearAmount" name={`${trendYear - 1}年`} stroke="var(--color-text-secondary)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 年間ヒートマップ */}
              <div className="card">
                <div className="card-header"><h2 className="card-title">年間売上ヒートマップ（月×週）</h2></div>
                <div className="card-body">
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '8px', textAlign: 'left' }}>月</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>第1週</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>第2週</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>第3週</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>第4週</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>第5週</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearlyHeatmap.map(monthData => {
                          const maxWeekAmount = Math.max(...yearlyHeatmap.flatMap(m => m.weeks.map(w => w.amount)), 1)
                          return (
                            <tr key={monthData.month}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>{monthData.month}月</td>
                              {[1, 2, 3, 4, 5].map(weekNum => {
                                const weekData = monthData.weeks.find(w => w.week === weekNum)
                                const amount = weekData?.amount || 0
                                return (
                                  <td key={weekNum} style={{ padding: '4px' }}>
                                    <div style={{
                                      padding: '12px 8px', borderRadius: 'var(--radius)', textAlign: 'center',
                                      background: getHeatmapColor(amount, maxWeekAmount),
                                      color: amount > maxWeekAmount * 0.8 ? 'white' : 'inherit',
                                      minWidth: '80px'
                                    }}>
                                      {amount > 0 ? `¥${(amount / 10000).toFixed(1)}万` : '-'}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.8rem' }}>少ない</span>
                    <div style={{ width: '20px', height: '20px', background: '#fee2e2', borderRadius: '4px', border: '1px solid #fca5a5' }}></div>
                    <div style={{ width: '20px', height: '20px', background: '#fca5a5', borderRadius: '4px' }}></div>
                    <div style={{ width: '20px', height: '20px', background: '#c4b5fd', borderRadius: '4px' }}></div>
                    <div style={{ width: '20px', height: '20px', background: '#93c5fd', borderRadius: '4px' }}></div>
                    <div style={{ width: '20px', height: '20px', background: '#3b82f6', borderRadius: '4px' }}></div>
                    <span style={{ fontSize: '0.8rem' }}>多い</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 買取実績タブ */}
          {activeTab === 'buyback' && (
            <div className="card">
              <div className="card-header"><h2 className="card-title">買取実績</h2></div>
              <div className="card-body">
                <div className="stat-grid stat-grid-2">
                  <div className="stat-card"><div className="stat-label">買取件数</div><div className="stat-value">{buybackSummary.count}件</div></div>
                  <div className="stat-card"><div className="stat-label">買取金額合計</div><div className="stat-value" style={{ color: 'var(--color-primary)' }}>¥{buybackSummary.totalPrice.toLocaleString()}</div></div>
                </div>
              </div>
            </div>
          )}

          {/* 目標設定タブ */}
          {activeTab === 'target' && (
            <div>
              <div className="card mb-lg">
                <div className="card-body">
                  <div className="flex items-center gap-md">
                    <label className="form-label" style={{ marginBottom: 0 }}>対象月:</label>
                    <input type="month" value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} className="form-input" style={{ width: 'auto' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>営業日: 平日{businessDays.weekdays}日 / 土曜{businessDays.saturdays}日 / 日曜{businessDays.sundays}日 / 祝日{businessDays.holidays}日</span>
                  </div>
                </div>
              </div>

              <div className="card mb-lg">
                <div className="card-header"><h2 className="card-title">休業日設定</h2></div>
                <div className="card-body">
                  <div className="flex flex-wrap items-end gap-md mb-md">
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">日付</label><input type="date" value={newHoliday.holiday_date} onChange={(e) => setNewHoliday({ ...newHoliday, holiday_date: e.target.value })} className="form-input" /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">店舗</label><select value={newHoliday.shop_id || ''} onChange={(e) => setNewHoliday({ ...newHoliday, shop_id: e.target.value ? Number(e.target.value) : null })} className="form-select"><option value="">全店</option>{shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">理由</label><input type="text" value={newHoliday.reason} onChange={(e) => setNewHoliday({ ...newHoliday, reason: e.target.value })} className="form-input" placeholder="任意" /></div>
                    <button onClick={addHoliday} className="btn btn-primary">追加</button>
                  </div>
                  {holidays.length > 0 && (
                    <table className="data-table">
                      <thead><tr><th>日付</th><th>店舗</th><th>理由</th><th></th></tr></thead>
                      <tbody>{holidays.map(h => <tr key={h.id}><td>{h.holiday_date}</td><td>{h.shop_id ? shops.find(s => s.id === h.shop_id)?.name : '全店'}</td><td>{h.reason || '-'}</td><td><button onClick={() => deleteHoliday(h.id!)} className="btn btn-sm btn-danger">削除</button></td></tr>)}</tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h2 className="card-title">売上・KPI目標</h2></div>
                <div className="card-body">
                  {/* 全体目標（店舗合計から自動計算） */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>全体目標（店舗合計）</h3>
                    {(() => {
                      const shopTargets = targets.filter(t => t.shop_id !== null && t.staff_id === null)
                      if (shopTargets.length === 0) {
                        return <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>各店舗の目標を設定すると自動で合算されます</p>
                      }
                      const totalWeekday = shopTargets.reduce((sum, t) => sum + (t.weekday_amount || 0), 0)
                      const totalSaturday = shopTargets.reduce((sum, t) => sum + (t.saturday_amount || 0), 0)
                      const totalSunday = shopTargets.reduce((sum, t) => sum + (t.sunday_amount || 0), 0)
                      const totalHoliday = shopTargets.reduce((sum, t) => sum + (t.holiday_amount || 0), 0)
                      const monthlyTarget = (totalWeekday * businessDays.weekdays) + (totalSaturday * businessDays.saturdays) + (totalSunday * businessDays.sundays) + (totalHoliday * businessDays.holidays)
                      return (
                        <div style={{ padding: '12px 16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                          <div className="flex flex-wrap gap-lg" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                            <span>平日: ¥{totalWeekday.toLocaleString()}/日</span>
                            <span>土曜: ¥{totalSaturday.toLocaleString()}/日</span>
                            <span>日曜: ¥{totalSunday.toLocaleString()}/日</span>
                            <span>祝日: ¥{totalHoliday.toLocaleString()}/日</span>
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>月間目標: ¥{monthlyTarget.toLocaleString()}</div>
                        </div>
                      )
                    })()}
                  </div>
                  {shops.filter(s => !s.is_ec).map(shop => (
                    <div key={shop.id} style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>{shop.name}</h3>
                      {(() => {
                        const t = targets.find(t => t.shop_id === shop.id && t.staff_id === null)
                        return t ? (
                          <div className="flex flex-wrap items-center gap-md mb-md">
                            <span>平日: ¥{t.weekday_amount?.toLocaleString()}</span>
                            <span>土曜: ¥{(t.saturday_amount || 0).toLocaleString()}</span>
                            <span>日曜: ¥{(t.sunday_amount || 0).toLocaleString()}</span>
                            <span>祝日: ¥{(t.holiday_amount || 0).toLocaleString()}</span>
                            <button onClick={() => setEditingTarget(t)} className="btn btn-sm btn-secondary">編集</button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingTarget({ shop_id: shop.id, staff_id: null, weekday_amount: 0, weekend_amount: 0, saturday_amount: 0, sunday_amount: 0, holiday_amount: 0, profit_rate: 75, kpi_oled_rate: 60, kpi_battery_combo_rate: 30, kpi_film_rate: 70, kpi_used_sales_rate: 5, kpi_accessory_avg: 1.5 })} className="btn btn-sm btn-secondary mb-md">店舗目標を設定</button>
                        )
                      })()}
                      <div style={{ paddingLeft: '24px' }}>
                        {staff.map(st => {
                          const t = targets.find(t => t.shop_id === shop.id && t.staff_id === st.id)
                          return (
                            <div key={st.id} className="flex flex-wrap items-center gap-md" style={{ marginBottom: '8px' }}>
                              <span style={{ width: '80px' }}>{st.name}</span>
                              {t ? (
                                <>
                                  <span style={{ fontSize: '0.85rem' }}>平日¥{t.weekday_amount?.toLocaleString()}</span>
                                  <span style={{ fontSize: '0.85rem' }}>土¥{(t.saturday_amount || 0).toLocaleString()}</span>
                                  <span style={{ fontSize: '0.85rem' }}>日¥{(t.sunday_amount || 0).toLocaleString()}</span>
                                  <span style={{ fontSize: '0.85rem' }}>祝¥{(t.holiday_amount || 0).toLocaleString()}</span>
                                  <button onClick={() => setEditingTarget(t)} className="btn btn-sm btn-secondary">編集</button>
                                </>
                              ) : (
                                <button onClick={() => setEditingTarget({ shop_id: shop.id, staff_id: st.id, weekday_amount: 0, weekend_amount: 0, saturday_amount: 0, sunday_amount: 0, holiday_amount: 0, profit_rate: 75, kpi_oled_rate: null, kpi_battery_combo_rate: null, kpi_film_rate: null, kpi_used_sales_rate: null, kpi_accessory_avg: null })} className="btn btn-sm btn-secondary">設定</button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {editingTarget && (
                <div className="modal-overlay" onClick={() => setEditingTarget(null)}>
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header"><h3 className="modal-title">目標設定</h3><button className="modal-close" onClick={() => setEditingTarget(null)}>×</button></div>
                    <div className="modal-body">
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>1日あたり売上目標</h4>
                      <div className="form-grid form-grid-4 mb-md">
                        <div className="form-group"><label className="form-label">平日（月〜金）</label><input type="number" value={editingTarget.weekday_amount} onChange={(e) => setEditingTarget({ ...editingTarget, weekday_amount: Number(e.target.value) })} className="form-input" /></div>
                        <div className="form-group"><label className="form-label">土曜日</label><input type="number" value={editingTarget.saturday_amount || 0} onChange={(e) => setEditingTarget({ ...editingTarget, saturday_amount: Number(e.target.value) })} className="form-input" /></div>
                        <div className="form-group"><label className="form-label">日曜日</label><input type="number" value={editingTarget.sunday_amount || 0} onChange={(e) => setEditingTarget({ ...editingTarget, sunday_amount: Number(e.target.value) })} className="form-input" /></div>
                        <div className="form-group"><label className="form-label">祝日</label><input type="number" value={editingTarget.holiday_amount || 0} onChange={(e) => setEditingTarget({ ...editingTarget, holiday_amount: Number(e.target.value) })} className="form-input" /></div>
                      </div>
                      <div className="form-group mb-md"><label className="form-label">粗利率（%）</label><input type="number" value={editingTarget.profit_rate} onChange={(e) => setEditingTarget({ ...editingTarget, profit_rate: Number(e.target.value) })} className="form-input" style={{ width: '100px' }} /></div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>KPI目標（任意）</h4>
                      <div className="form-grid form-grid-3">
                        <div className="form-group"><label className="form-label">HGパネル獲得率（%）</label><input type="number" value={editingTarget.kpi_oled_rate || ''} onChange={(e) => setEditingTarget({ ...editingTarget, kpi_oled_rate: e.target.value ? Number(e.target.value) : null })} className="form-input" /></div>
                        <div className="form-group"><label className="form-label">同時交換率（%）</label><input type="number" value={editingTarget.kpi_battery_combo_rate || ''} onChange={(e) => setEditingTarget({ ...editingTarget, kpi_battery_combo_rate: e.target.value ? Number(e.target.value) : null })} className="form-input" /></div>
                        <div className="form-group"><label className="form-label">フィルム獲得率（%）</label><input type="number" value={editingTarget.kpi_film_rate || ''} onChange={(e) => setEditingTarget({ ...editingTarget, kpi_film_rate: e.target.value ? Number(e.target.value) : null })} className="form-input" /></div>
                        <div className="form-group"><label className="form-label">中古販売率（%）</label><input type="number" value={editingTarget.kpi_used_sales_rate || ''} onChange={(e) => setEditingTarget({ ...editingTarget, kpi_used_sales_rate: e.target.value ? Number(e.target.value) : null })} className="form-input" /></div>
                        <div className="form-group"><label className="form-label">アクセサリ添付（個/人）</label><input type="number" step="0.1" value={editingTarget.kpi_accessory_avg || ''} onChange={(e) => setEditingTarget({ ...editingTarget, kpi_accessory_avg: e.target.value ? Number(e.target.value) : null })} className="form-input" /></div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button onClick={() => setEditingTarget(null)} className="btn btn-secondary">キャンセル</button>
                      <button onClick={() => saveTarget(editingTarget)} disabled={savingTarget} className="btn btn-primary">{savingTarget ? '保存中...' : '保存'}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}