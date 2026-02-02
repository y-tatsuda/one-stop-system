'use client'

import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

type Shop = {
  id: number
  name: string
}

type AlertItem = {
  id: string
  type: 'parts' | 'accessory' | 'inventory' | 'ec' | 'check'
  shopId: number
  shopName: string
  title: string
  details: string[]
  severity: 'high' | 'medium' | 'low'
}

type TodaySale = {
  id: number
  shop_id: number
  shop_name: string
  staff_name: string
  total_amount: number
  total_profit: number
  details: { category: string; model: string; menu: string }[]
}

type ShopSummary = {
  shopId: number
  shopName: string
  salesCount: number
  salesAmount: number
  salesProfit: number
}

type MonthlyData = {
  salesCount: number
  salesAmount: number
  salesProfit: number
  buybackCount: number
  buybackAmount: number
}

export default function Home() {
  const [shops, setShops] = useState<Shop[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShop, setSelectedShop] = useState<number | null>(null)
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)
  const [todaySummary, setTodaySummary] = useState({
    salesCount: 0,
    salesAmount: 0,
    salesProfit: 0,
    buybackCount: 0,
    buybackAmount: 0,
  })
  const [todaySales, setTodaySales] = useState<TodaySale[]>([])
  const [shopSummaries, setShopSummaries] = useState<ShopSummary[]>([])
  const [selectedSalesShop, setSelectedSalesShop] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)

  // タブ: 'today' | 'month'
  const [activeTab, setActiveTab] = useState<'today' | 'month'>('today')

  // 月間データ
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({
    salesCount: 0,
    salesAmount: 0,
    salesProfit: 0,
    buybackCount: 0,
    buybackAmount: 0,
  })

  // 目標（将来的にはDBから取得）
  const [goals, setGoals] = useState({
    dailySales: 100000,   // 日次売上目標
    dailyProfit: 30000,   // 日次粗利目標
    monthlySales: 3000000, // 月次売上目標
    monthlyProfit: 900000, // 月次粗利目標
  })

  useEffect(() => {
    async function fetchData() {
      // 店舗データ取得
      const { data: shopsData } = await supabase
        .from('m_shops')
        .select('id, name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('id')

      if (!shopsData) {
        setLoading(false)
        return
      }
      setShops(shopsData)

      const alertList: AlertItem[] = []

      // 1. パーツ不足アラート
      const { data: partsData } = await supabase
        .from('t_parts_inventory')
        .select('shop_id, model, parts_type, required_qty, actual_qty')
        .eq('tenant_id', 1)

      if (partsData) {
        for (const shop of shopsData) {
          const shopParts = partsData.filter(p => p.shop_id === shop.id)
          const shortage = shopParts.filter(p => p.actual_qty < p.required_qty)
          
          if (shortage.length > 0) {
            const details = shortage.map(p => {
              const diff = p.required_qty - p.actual_qty
              return p.model + ' ' + p.parts_type + ' ×' + diff
            })
            
            alertList.push({
              id: 'parts-' + shop.id,
              type: 'parts',
              shopId: shop.id,
              shopName: shop.name,
              title: 'パーツ不足: ' + shortage.length + '件',
              details: details,
              severity: 'high',
            })
          }
        }
      }

      // 2. アクセサリ不足アラート
      const { data: accessoryData } = await supabase
        .from('t_accessory_inventory')
        .select('shop_id, accessory_id, required_qty, actual_qty, m_accessories(name)')
        .eq('tenant_id', 1)

      if (accessoryData) {
        for (const shop of shopsData) {
          const shopAccessories = accessoryData.filter(a => a.shop_id === shop.id)
          const shortage = shopAccessories.filter(a => a.actual_qty < a.required_qty)
          
          if (shortage.length > 0) {
            const details = shortage.map(a => {
              const diff = a.required_qty - a.actual_qty
              const name = (a.m_accessories as any)?.name || 'アクセサリ'
              return name + ' ×' + diff
            })
            
            alertList.push({
              id: 'accessory-' + shop.id,
              type: 'accessory',
              shopId: shop.id,
              shopName: shop.name,
              title: 'アクセサリ不足: ' + shortage.length + '件',
              details: details,
              severity: 'medium',
            })
          }
        }
      }

      // 3. 中古在庫滞留アラート（45日/60日/90日/120日）
      const { data: inventoryData } = await supabase
        .from('t_used_inventory')
        .select('id, shop_id, arrival_date, model, storage, ec_status')
        .eq('tenant_id', 1)
        .in('status', ['販売可', '修理中'])

      if (inventoryData) {
        const today = new Date()
        
        for (const shop of shopsData) {
          const shopInventory = inventoryData.filter(i => i.shop_id === shop.id)
          
          const over45: any[] = []
          const over60: any[] = []
          const over90: any[] = []
          const over120: any[] = []
          
          for (const item of shopInventory) {
            const arrival = new Date(item.arrival_date)
            const days = Math.floor((today.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24))
            
            if (days >= 120) {
              over120.push(item)
            } else if (days >= 90) {
              over90.push(item)
            } else if (days >= 60) {
              over60.push(item)
            } else if (days >= 45) {
              over45.push(item)
            }
          }
          
          const totalOverdue = over45.length + over60.length + over90.length + over120.length
          
          if (totalOverdue > 0) {
            const details: string[] = []
            if (over120.length > 0) {
              details.push('120日以上: ' + over120.length + '台')
              over120.slice(0, 3).forEach(i => {
                details.push('  ' + i.model + ' ' + i.storage + 'GB')
              })
            }
            if (over90.length > 0) {
              details.push('90日以上: ' + over90.length + '台')
              over90.slice(0, 3).forEach(i => {
                details.push('  ' + i.model + ' ' + i.storage + 'GB')
              })
            }
            if (over60.length > 0) {
              details.push('60日以上: ' + over60.length + '台')
            }
            if (over45.length > 0) {
              details.push('45日以上: ' + over45.length + '台')
            }
            
            alertList.push({
              id: 'inventory-' + shop.id,
              type: 'inventory',
              shopId: shop.id,
              shopName: shop.name,
              title: '滞留在庫: ' + totalOverdue + '台',
              details: details,
              severity: over120.length > 0 || over90.length > 0 ? 'high' : 'medium',
            })
          }

          // 4. EC未出品アラート
          const notListed = shopInventory.filter(i => !i.ec_status || i.ec_status === '未出品')
          
          if (notListed.length > 0) {
            const details = notListed.slice(0, 5).map(i => i.model + ' ' + i.storage + 'GB')
            if (notListed.length > 5) {
              details.push('他 ' + (notListed.length - 5) + '台')
            }
            
            alertList.push({
              id: 'ec-' + shop.id,
              type: 'ec',
              shopId: shop.id,
              shopName: shop.name,
              title: 'EC未出品: ' + notListed.length + '台',
              details: details,
              severity: 'low',
            })
          }
        }
      }

      // 5. 棚卸し未完了アラート
      const todayDate = new Date()
      const dayOfWeek = todayDate.getDay()
      
      const { data: checkSettings } = await supabase
        .from('m_inventory_check_settings')
        .select('day_of_week')
        .eq('tenant_id', 1)
        .eq('is_active', true)

      const checkDays = checkSettings?.map(s => s.day_of_week) || [0, 4]
      
      if (checkDays.includes(dayOfWeek)) {
        const todayStr = todayDate.toISOString().split('T')[0]
        
        for (const shop of shopsData) {
          const { data: checkData } = await supabase
            .from('t_inventory_checks')
            .select('id, status')
            .eq('tenant_id', 1)
            .eq('shop_id', shop.id)
            .eq('check_date', todayStr)
            .single()

          if (!checkData || checkData.status !== '完了') {
            alertList.push({
              id: 'check-' + shop.id,
              type: 'check',
              shopId: shop.id,
              shopName: shop.name,
              title: '棚卸し未完了',
              details: ['本日は棚卸し日です'],
              severity: 'medium',
            })
          }
        }
      }

      setAlerts(alertList)

      // 今日の実績
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

      const { data: salesData } = await supabase
        .from('t_sales')
        .select(`
          id, shop_id, total_amount, total_profit,
          m_shops(name),
          m_staff(name),
          t_sales_details(category, model, menu)
        `)
        .eq('tenant_id', 1)
        .eq('sale_date', today)
        .order('id', { ascending: false })

      const { data: buybackData } = await supabase
        .from('t_buyback')
        .select('final_price')
        .eq('tenant_id', 1)
        .eq('buyback_date', today)

      // 月間売上データ
      const { data: monthlySalesData } = await supabase
        .from('t_sales')
        .select('total_amount, total_profit')
        .eq('tenant_id', 1)
        .gte('sale_date', monthStart)
        .lte('sale_date', today)

      // 月間買取データ
      const { data: monthlyBuybackData } = await supabase
        .from('t_buyback')
        .select('final_price')
        .eq('tenant_id', 1)
        .gte('buyback_date', monthStart)
        .lte('buyback_date', today)

      // 月間データ集計
      setMonthlyData({
        salesCount: monthlySalesData?.length || 0,
        salesAmount: monthlySalesData?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0,
        salesProfit: monthlySalesData?.reduce((sum, s) => sum + (s.total_profit || 0), 0) || 0,
        buybackCount: monthlyBuybackData?.length || 0,
        buybackAmount: monthlyBuybackData?.reduce((sum, b) => sum + (b.final_price || 0), 0) || 0,
      })

      // 今日の売上一覧
      const salesList: TodaySale[] = (salesData || []).map((s: any) => ({
        id: s.id,
        shop_id: s.shop_id,
        shop_name: s.m_shops?.name || '',
        staff_name: s.m_staff?.name || '',
        total_amount: s.total_amount,
        total_profit: s.total_profit || 0,
        details: s.t_sales_details || [],
      }))
      setTodaySales(salesList)

      // 店舗別集計
      const summaries: ShopSummary[] = shopsData.map(shop => {
        const shopSales = salesList.filter(s => s.shop_id === shop.id)
        return {
          shopId: shop.id,
          shopName: shop.name,
          salesCount: shopSales.length,
          salesAmount: shopSales.reduce((sum, s) => sum + s.total_amount, 0),
          salesProfit: shopSales.reduce((sum, s) => sum + s.total_profit, 0),
        }
      })
      setShopSummaries(summaries)

      setTodaySummary({
        salesCount: salesData?.length || 0,
        salesAmount: salesData?.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0) || 0,
        salesProfit: salesData?.reduce((sum: number, s: any) => sum + (s.total_profit || 0), 0) || 0,
        buybackCount: buybackData?.length || 0,
        buybackAmount: buybackData?.reduce((sum, b) => sum + (b.final_price || 0), 0) || 0,
      })

      setLoading(false)
    }

    fetchData()
  }, [])

  // 売上削除
  const handleDeleteSale = async (saleId: number) => {
    // 明細削除
    await supabase.from('t_sales_details').delete().eq('sales_id', saleId)
    // ヘッダー削除
    const { error } = await supabase.from('t_sales').delete().eq('id', saleId)

    if (error) {
      alert('削除に失敗しました: ' + error.message)
      return
    }

    // 一覧から削除
    const newSales = todaySales.filter(s => s.id !== saleId)
    setTodaySales(newSales)

    // 集計を更新
    const newSummaries = shopSummaries.map(summary => {
      const shopSales = newSales.filter(s => s.shop_id === summary.shopId)
      return {
        ...summary,
        salesCount: shopSales.length,
        salesAmount: shopSales.reduce((sum, s) => sum + s.total_amount, 0),
        salesProfit: shopSales.reduce((sum, s) => sum + s.total_profit, 0),
      }
    })
    setShopSummaries(newSummaries)

    setTodaySummary(prev => ({
      ...prev,
      salesCount: newSales.length,
      salesAmount: newSales.reduce((sum, s) => sum + s.total_amount, 0),
      salesProfit: newSales.reduce((sum, s) => sum + s.total_profit, 0),
    }))

    setShowDeleteConfirm(null)
    alert('売上を削除しました')
  }

  // 売上フィルター
  const filteredTodaySales = selectedSalesShop
    ? todaySales.filter(s => s.shop_id === selectedSalesShop)
    : todaySales

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const filteredAlerts = selectedShop 
    ? alerts.filter(a => a.shopId === selectedShop)
    : alerts

  const getAlertCount = (shopId: number) => {
    return alerts.filter(a => a.shopId === shopId).length
  }

  const toggleAlert = (alertId: string) => {
    setExpandedAlert(expandedAlert === alertId ? null : alertId)
  }

  // タイプ別のタグスタイル
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'parts':
        return 'badge-danger'
      case 'accessory':
        return 'badge-warning'
      case 'inventory':
        return 'badge-info'
      case 'ec':
        return 'badge-primary'
      case 'check':
        return 'badge-success'
      default:
        return 'badge-gray'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'parts':
        return 'パーツ'
      case 'accessory':
        return 'アクセサリ'
      case 'inventory':
        return '滞留'
      case 'ec':
        return 'EC'
      case 'check':
        return '棚卸し'
      default:
        return ''
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">ホーム</h1>
      </div>

      {/* アラートセクション */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">アラート</h2>
        </div>
        <div className="card-body">
          {/* 店舗タブ */}
          <div className="flex flex-wrap gap-sm mb-md">
            <button
              onClick={() => setSelectedShop(null)}
              className={selectedShop === null ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            >
              全店舗
            </button>
            {shops.map(shop => {
              const count = getAlertCount(shop.id)
              return (
                <button
                  key={shop.id}
                  onClick={() => setSelectedShop(shop.id)}
                  className={selectedShop === shop.id ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                  style={{ position: 'relative' }}
                >
                  {shop.name}
                  {count > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#DC2626',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* アラート一覧 */}
          {filteredAlerts.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">アラートはありません</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <tbody>
                  {filteredAlerts.map(alert => {
                    const isExpanded = expandedAlert === alert.id
                    
                    return (
                      <tr 
                        key={alert.id}
                        onClick={() => toggleAlert(alert.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ width: '100%' }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold">{alert.shopName}</span>
                              <span className="text-secondary" style={{ margin: '0 8px' }}>-</span>
                              <span>{alert.title}</span>
                            </div>
                            <div className="flex items-center gap-sm">
                              <span className={'badge ' + getTypeStyle(alert.type)}>
                                {getTypeLabel(alert.type)}
                              </span>
                              <span className="text-secondary" style={{ fontSize: '12px' }}>
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div style={{ 
                              marginTop: '12px', 
                              paddingTop: '12px', 
                              borderTop: '1px solid var(--color-border)' 
                            }}>
                              {alert.details.map((detail, idx) => (
                                <div 
                                  key={idx} 
                                  className="text-secondary"
                                  style={{ 
                                    fontSize: '14px',
                                    padding: '2px 0',
                                    paddingLeft: detail.startsWith('  ') ? '16px' : '0'
                                  }}
                                >
                                  {detail.startsWith('  ') ? detail.trim() : '・' + detail}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* クイックメニュー */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">クイックメニュー</h2>
        </div>
        <div className="card-body">
          <div className="stat-grid">
            <a href="/sales" style={{ 
              textDecoration: 'none', 
              textAlign: 'center', 
              padding: '24px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #004AAD 0%, #0066CC 100%)',
              color: 'white',
              fontWeight: '600',
              fontSize: '1.1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(0, 74, 173, 0.3)',
            }}>
              売上入力
            </a>
            <a href="/buyback" style={{ 
              textDecoration: 'none', 
              textAlign: 'center', 
              padding: '24px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              color: 'white',
              fontWeight: '600',
              fontSize: '1.1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
            }}>
              買取入力
            </a>
            <a href="/inventory" style={{ 
              textDecoration: 'none', 
              textAlign: 'center', 
              padding: '24px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
              color: 'white',
              fontWeight: '600',
              fontSize: '1.1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            }}>
              在庫管理
            </a>
            <a href="/reports" style={{ 
              textDecoration: 'none', 
              textAlign: 'center', 
              padding: '24px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
              color: 'white',
              fontWeight: '600',
              fontSize: '1.1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
            }}>
              レポート
            </a>
          </div>
        </div>
      </div>

      {/* 実績セクション - タブ切り替え */}
      <div className="card mb-lg">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">実績</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('today')}
              className={activeTab === 'today' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            >
              今日
            </button>
            <button
              onClick={() => setActiveTab('month')}
              className={activeTab === 'month' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            >
              今月
            </button>
          </div>
        </div>
        <div className="card-body">
          {activeTab === 'today' ? (
            <>
              {/* 今日の目標・実績 */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: '#6B7280' }}>目標達成状況</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {/* 売上目標 */}
                  <div style={{ padding: '16px', borderRadius: '12px', background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                    <div style={{ fontSize: '0.8rem', color: '#0369A1', marginBottom: '8px' }}>売上</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0284C7' }}>
                        ¥{todaySummary.salesAmount.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                        / ¥{goals.dailySales.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#E0F2FE', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, (todaySummary.salesAmount / goals.dailySales) * 100)}%`,
                        height: '100%',
                        background: todaySummary.salesAmount >= goals.dailySales ? '#22C55E' : '#0284C7',
                        borderRadius: '4px',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px', textAlign: 'right' }}>
                      進捗 {Math.round((todaySummary.salesAmount / goals.dailySales) * 100)}%
                    </div>
                  </div>

                  {/* 粗利目標 */}
                  <div style={{ padding: '16px', borderRadius: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: '0.8rem', color: '#166534', marginBottom: '8px' }}>粗利</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22C55E' }}>
                        ¥{todaySummary.salesProfit.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                        / ¥{goals.dailyProfit.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#DCFCE7', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, (todaySummary.salesProfit / goals.dailyProfit) * 100)}%`,
                        height: '100%',
                        background: todaySummary.salesProfit >= goals.dailyProfit ? '#22C55E' : '#4ADE80',
                        borderRadius: '4px',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px', textAlign: 'right' }}>
                      進捗 {Math.round((todaySummary.salesProfit / goals.dailyProfit) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* 全体集計 */}
              <div className="stat-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card">
                  <div className="stat-label">売上件数</div>
                  <div className="stat-value">{todaySummary.salesCount}<span style={{ fontSize: '1rem', marginLeft: '4px' }}>件</span></div>
                </div>
                <div className="stat-card" style={{ background: 'var(--color-primary-light)' }}>
                  <div className="stat-label">売上金額</div>
                  <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
                    ¥{todaySummary.salesAmount.toLocaleString()}
                  </div>
                </div>
                <div className="stat-card" style={{ background: '#F0FDF4' }}>
                  <div className="stat-label">粗利</div>
                  <div className="stat-value" style={{ color: '#22C55E' }}>
                    ¥{todaySummary.salesProfit.toLocaleString()}
                  </div>
                </div>
                <div className="stat-card" style={{ background: 'var(--color-success-light)' }}>
                  <div className="stat-label">買取金額</div>
                  <div className="stat-value" style={{ color: 'var(--color-success)' }}>
                    ¥{todaySummary.buybackAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 店舗別集計 */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: '#6B7280' }}>店舗別売上</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  {shopSummaries.map(summary => (
                    <div
                      key={summary.shopId}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: selectedSalesShop === summary.shopId ? '#E0F2FE' : '#F9FAFB',
                        border: selectedSalesShop === summary.shopId ? '2px solid #0284C7' : '1px solid #E5E7EB',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedSalesShop(selectedSalesShop === summary.shopId ? null : summary.shopId)}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{summary.shopName}</div>
                      <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{summary.salesCount}件</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0284C7' }}>
                        ¥{summary.salesAmount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#22C55E' }}>
                        粗利 ¥{summary.salesProfit.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 売上一覧 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#6B7280' }}>
                    本日の売上一覧 {selectedSalesShop ? `(${shops.find(s => s.id === selectedSalesShop)?.name})` : '(全店)'}
                  </h3>
                  <a href="/sales-correction" className="btn btn-sm btn-secondary">
                    過去の売上訂正
                  </a>
                </div>
                {filteredTodaySales.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF' }}>
                    本日の売上はありません
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>店舗</th>
                          <th>担当</th>
                          <th>内容</th>
                          <th className="text-right">金額</th>
                          <th className="text-right">粗利</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTodaySales.map(sale => (
                          <tr key={sale.id}>
                            <td>{sale.id}</td>
                            <td>{sale.shop_name}</td>
                            <td>{sale.staff_name}</td>
                            <td>
                              {sale.details.slice(0, 2).map((d, i) => (
                                <div key={i} style={{ fontSize: '0.85rem' }}>
                                  {d.category}: {d.model} {d.menu}
                                </div>
                              ))}
                              {sale.details.length > 2 && (
                                <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                                  他{sale.details.length - 2}件
                                </div>
                              )}
                            </td>
                            <td className="text-right" style={{ fontWeight: '600' }}>
                              ¥{sale.total_amount.toLocaleString()}
                            </td>
                            <td className="text-right" style={{ fontWeight: '600', color: '#22C55E' }}>
                              ¥{sale.total_profit.toLocaleString()}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <a
                                  href={`/sales-history?date=${new Date().toISOString().split('T')[0]}&id=${sale.id}`}
                                  className="btn btn-sm btn-secondary"
                                >
                                  編集
                                </a>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => setShowDeleteConfirm(sale.id)}
                                >
                                  削除
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* 今月の目標・実績 */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: '#6B7280' }}>月間目標達成状況</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {/* 売上目標 */}
                  <div style={{ padding: '16px', borderRadius: '12px', background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                    <div style={{ fontSize: '0.8rem', color: '#0369A1', marginBottom: '8px' }}>売上</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0284C7' }}>
                        ¥{monthlyData.salesAmount.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                        / ¥{goals.monthlySales.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#E0F2FE', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, (monthlyData.salesAmount / goals.monthlySales) * 100)}%`,
                        height: '100%',
                        background: monthlyData.salesAmount >= goals.monthlySales ? '#22C55E' : '#0284C7',
                        borderRadius: '4px',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6B7280', marginTop: '8px' }}>
                      <span>進捗 {Math.round((monthlyData.salesAmount / goals.monthlySales) * 100)}%</span>
                      <span>着地予想 ¥{(() => {
                        const now = new Date()
                        const dayOfMonth = now.getDate()
                        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
                        const projected = Math.round((monthlyData.salesAmount / dayOfMonth) * daysInMonth)
                        return projected.toLocaleString()
                      })()}</span>
                    </div>
                  </div>

                  {/* 粗利目標 */}
                  <div style={{ padding: '16px', borderRadius: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: '0.8rem', color: '#166534', marginBottom: '8px' }}>粗利</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22C55E' }}>
                        ¥{monthlyData.salesProfit.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                        / ¥{goals.monthlyProfit.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#DCFCE7', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, (monthlyData.salesProfit / goals.monthlyProfit) * 100)}%`,
                        height: '100%',
                        background: monthlyData.salesProfit >= goals.monthlyProfit ? '#22C55E' : '#4ADE80',
                        borderRadius: '4px',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6B7280', marginTop: '8px' }}>
                      <span>進捗 {Math.round((monthlyData.salesProfit / goals.monthlyProfit) * 100)}%</span>
                      <span>着地予想 ¥{(() => {
                        const now = new Date()
                        const dayOfMonth = now.getDate()
                        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
                        const projected = Math.round((monthlyData.salesProfit / dayOfMonth) * daysInMonth)
                        return projected.toLocaleString()
                      })()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 月間集計 */}
              <div className="stat-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card">
                  <div className="stat-label">売上件数</div>
                  <div className="stat-value">{monthlyData.salesCount}<span style={{ fontSize: '1rem', marginLeft: '4px' }}>件</span></div>
                </div>
                <div className="stat-card" style={{ background: 'var(--color-primary-light)' }}>
                  <div className="stat-label">売上金額</div>
                  <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
                    ¥{monthlyData.salesAmount.toLocaleString()}
                  </div>
                </div>
                <div className="stat-card" style={{ background: '#F0FDF4' }}>
                  <div className="stat-label">粗利</div>
                  <div className="stat-value" style={{ color: '#22C55E' }}>
                    ¥{monthlyData.salesProfit.toLocaleString()}
                  </div>
                </div>
                <div className="stat-card" style={{ background: 'var(--color-success-light)' }}>
                  <div className="stat-label">買取金額</div>
                  <div className="stat-value" style={{ color: 'var(--color-success)' }}>
                    ¥{monthlyData.buybackAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 月間詳細リンク */}
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <a href="/reports" className="btn btn-primary">
                  詳細レポートを見る
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">売上削除確認</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>この売上を削除しますか？</p>
              <p style={{ color: '#DC2626', marginTop: '8px', fontSize: '0.9rem' }}>
                ※ この操作は取り消せません
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                キャンセル
              </button>
              <button className="btn btn-danger" onClick={() => handleDeleteSale(showDeleteConfirm)}>
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}