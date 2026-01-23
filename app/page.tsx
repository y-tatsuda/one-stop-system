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

export default function Home() {
  const [shops, setShops] = useState<Shop[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShop, setSelectedShop] = useState<number | null>(null)
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)
  const [todaySummary, setTodaySummary] = useState({
    salesCount: 0,
    salesAmount: 0,
    buybackCount: 0,
    buybackAmount: 0,
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
              const name = (a.m_accessories as { name: string } | null)?.name || 'アクセサリ'
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
        .eq('status', '在庫')

      if (inventoryData) {
        const today = new Date()
        
        for (const shop of shopsData) {
          const shopInventory = inventoryData.filter(i => i.shop_id === shop.id)
          
          const over45: typeof inventoryData = []
          const over60: typeof inventoryData = []
          const over90: typeof inventoryData = []
          const over120: typeof inventoryData = []
          
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
      
      const { data: salesData } = await supabase
        .from('t_sales')
        .select('total_amount')
        .eq('tenant_id', 1)
        .eq('sale_date', today)

      const { data: buybackData } = await supabase
        .from('t_buyback')
        .select('final_price')
        .eq('tenant_id', 1)
        .eq('buyback_date', today)

      setTodaySummary({
        salesCount: salesData?.length || 0,
        salesAmount: salesData?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0,
        buybackCount: buybackData?.length || 0,
        buybackAmount: buybackData?.reduce((sum, b) => sum + (b.final_price || 0), 0) || 0,
      })

      setLoading(false)
    }

    fetchData()
  }, [])

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

      {/* 今日の実績 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">今日の実績</h2>
        </div>
        <div className="card-body">
          <div className="stat-grid">
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
            <div className="stat-card">
              <div className="stat-label">買取件数</div>
              <div className="stat-value">{todaySummary.buybackCount}<span style={{ fontSize: '1rem', marginLeft: '4px' }}>件</span></div>
            </div>
            <div className="stat-card" style={{ background: 'var(--color-success-light)' }}>
              <div className="stat-label">買取金額</div>
              <div className="stat-value" style={{ color: 'var(--color-success)' }}>
                ¥{todaySummary.buybackAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}