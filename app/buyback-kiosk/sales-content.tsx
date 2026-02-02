'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Props = {
  shopId: number
  shopName: string
}

type Staff = {
  id: number
  name: string
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

type SaleDetail = {
  id: string
  type: 'used' | 'repair' | 'accessory'
  description: string
  unitPrice: number
  quantity: number
  amount: number
  usedInventoryId?: number
  model?: string
  menu?: string
}

export default function SalesContent({ shopId, shopName }: Props) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [usedInventory, setUsedInventory] = useState<UsedInventory[]>([])
  const [searchImei, setSearchImei] = useState('')
  const [searchedInventory, setSearchedInventory] = useState<UsedInventory | null>(null)
  const [details, setDetails] = useState<SaleDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [squareLocationId, setSquareLocationId] = useState<string | null>(null)
  const [showInventoryList, setShowInventoryList] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: staffData } = await supabase
        .from('m_staff')
        .select('id, name')
        .eq('tenant_id', 1)
        .eq('is_active', true)
        .order('id')

      const { data: inventoryData } = await supabase
        .from('t_used_inventory')
        .select('id, model, storage, rank, sales_price, total_cost, management_number')
        .eq('tenant_id', 1)
        .eq('shop_id', shopId)
        .eq('status', '販売可')
        .order('model')

      const { data: shopData } = await supabase
        .from('m_shops')
        .select('square_location_id')
        .eq('id', shopId)
        .single()

      setStaff(staffData || [])
      setUsedInventory(inventoryData || [])
      setSquareLocationId(shopData?.square_location_id || null)
      setLoading(false)
    }

    fetchData()
  }, [shopId])

  const handleSearchImei = () => {
    if (!searchImei) return

    const found = usedInventory.find(
      inv => inv.management_number === searchImei || inv.management_number?.includes(searchImei)
    )

    setSearchedInventory(found || null)

    if (!found) {
      alert('該当する在庫が見つかりません')
    }
  }

  const addUsedInventory = (inv: UsedInventory) => {
    if (details.some(d => d.usedInventoryId === inv.id)) {
      alert('既に追加されています')
      return
    }

    const newDetail: SaleDetail = {
      id: `used-${inv.id}`,
      type: 'used',
      description: `${inv.model} ${inv.storage}GB ${inv.rank} #${inv.management_number}`,
      unitPrice: inv.sales_price || 0,
      quantity: 1,
      amount: inv.sales_price || 0,
      usedInventoryId: inv.id,
      model: inv.model,
    }

    setDetails([...details, newDetail])
    setSearchedInventory(null)
    setSearchImei('')
    setShowInventoryList(false)
  }

  const removeDetail = (id: string) => {
    setDetails(details.filter(d => d.id !== id))
  }

  const totalAmount = details.reduce((sum, d) => sum + d.amount, 0)

  const handleSubmit = async (useSquare: boolean) => {
    if (!selectedStaffId) {
      alert('担当者を選択してください')
      return
    }
    if (details.length === 0) {
      alert('明細を追加してください')
      return
    }

    setSubmitting(true)

    try {
      const saleDate = new Date().toISOString().split('T')[0]

      const { data: headerData, error: headerError } = await supabase
        .from('t_sales')
        .insert({
          tenant_id: 1,
          shop_id: shopId,
          staff_id: parseInt(selectedStaffId),
          sale_date: saleDate,
          total_amount: totalAmount,
          sale_type: 'sale',
        })
        .select('id')
        .single()

      if (headerError) throw headerError

      const detailRecords = details.map(d => ({
        sales_id: headerData.id,
        category: d.type === 'used' ? '中古販売' : d.type === 'repair' ? 'iPhone修理' : 'アクセサリ',
        model: d.model || null,
        menu: d.menu || null,
        used_inventory_id: d.usedInventoryId || null,
        quantity: d.quantity,
        unit_price: d.unitPrice,
        amount: d.amount,
      }))

      await supabase.from('t_sales_details').insert(detailRecords)

      for (const detail of details) {
        if (detail.usedInventoryId) {
          await supabase
            .from('t_used_inventory')
            .update({ status: '販売済' })
            .eq('id', detail.usedInventoryId)
        }
      }

      setDetails([])
      setSearchImei('')
      setSearchedInventory(null)

      if (useSquare) {
        const itemDescriptions = details.map(d => d.description).join(', ')

        const squareData = {
          amount_money: {
            amount: totalAmount,
            currency_code: 'JPY'
          },
          callback_url: window.location.href,
          note: itemDescriptions.substring(0, 500),
          location_id: squareLocationId || ''
        }

        const squareUrl = `square-commerce-v1://payment/create?data=${encodeURIComponent(JSON.stringify(squareData))}`

        const isMobile = /iPad|iPhone|iPod/.test(navigator.userAgent)
        if (isMobile) {
          window.location.href = squareUrl
        } else {
          alert(`売上を登録しました（ID: ${headerData.id}）\n\n合計金額: ¥${totalAmount.toLocaleString()}\n\nSquare POSアプリで決済してください。`)
        }
      } else {
        alert(`売上を登録しました（ID: ${headerData.id}）\n\nエアレジで ¥${totalAmount.toLocaleString()} を会計してください。`)
      }

      const { data: inventoryData } = await supabase
        .from('t_used_inventory')
        .select('id, model, storage, rank, sales_price, total_cost, management_number')
        .eq('tenant_id', 1)
        .eq('shop_id', shopId)
        .eq('status', '販売可')
        .order('model')

      setUsedInventory(inventoryData || [])
    } catch (error: any) {
      alert('登録に失敗しました: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.mainGrid}>
        {/* 左側: 商品選択エリア */}
        <div style={styles.leftPanel}>
          {/* 担当者選択 */}
          <div style={styles.card}>
            <label style={styles.cardLabel}>担当者</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              style={styles.select}
            >
              <option value="">選択してください</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 在庫検索 */}
          <div style={styles.card}>
            <label style={styles.cardLabel}>商品を検索</label>
            <div style={styles.searchRow}>
              <input
                type="text"
                value={searchImei}
                onChange={(e) => setSearchImei(e.target.value)}
                placeholder="管理番号（IMEI下4桁）"
                style={styles.searchInput}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchImei()}
              />
              <button onClick={handleSearchImei} style={styles.searchBtn}>
                検索
              </button>
            </div>

            {/* 検索結果 */}
            {searchedInventory && (
              <div style={styles.searchResult}>
                <div style={styles.searchResultInfo}>
                  <p style={styles.searchResultModel}>
                    {searchedInventory.model} {searchedInventory.storage}GB {searchedInventory.rank}
                  </p>
                  <p style={styles.searchResultMgmt}>#{searchedInventory.management_number}</p>
                  <p style={styles.searchResultPrice}>
                    ¥{(searchedInventory.sales_price || 0).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => addUsedInventory(searchedInventory)} style={styles.addBtn}>
                  追加
                </button>
              </div>
            )}

            {/* 在庫一覧ボタン */}
            <button
              onClick={() => setShowInventoryList(!showInventoryList)}
              style={styles.inventoryListBtn}
            >
              販売可能な在庫一覧（{usedInventory.length}件）
              <span style={{ marginLeft: '8px' }}>{showInventoryList ? '▲' : '▼'}</span>
            </button>

            {/* 在庫一覧 */}
            {showInventoryList && (
              <div style={styles.inventoryList}>
                {usedInventory.length === 0 ? (
                  <p style={styles.noInventory}>販売可能な在庫がありません</p>
                ) : (
                  usedInventory.map(inv => (
                    <div key={inv.id} style={styles.inventoryItem}>
                      <div style={styles.inventoryItemInfo}>
                        <span style={styles.inventoryItemModel}>
                          {inv.model} {inv.storage}GB {inv.rank}
                        </span>
                        <span style={styles.inventoryItemMgmt}>#{inv.management_number}</span>
                      </div>
                      <div style={styles.inventoryItemRight}>
                        <span style={styles.inventoryItemPrice}>
                          ¥{(inv.sales_price || 0).toLocaleString()}
                        </span>
                        <button onClick={() => addUsedInventory(inv)} style={styles.addBtnSmall}>
                          追加
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右側: カート・決済エリア */}
        <div style={styles.rightPanel}>
          <div style={styles.cartCard}>
            <h3 style={styles.cartTitle}>明細</h3>

            {details.length === 0 ? (
              <div style={styles.emptyCart}>
                <p>商品を追加してください</p>
              </div>
            ) : (
              <div style={styles.cartItems}>
                {details.map(d => (
                  <div key={d.id} style={styles.cartItem}>
                    <div style={styles.cartItemInfo}>
                      <p style={styles.cartItemDesc}>{d.description}</p>
                      <p style={styles.cartItemPrice}>¥{d.amount.toLocaleString()}</p>
                    </div>
                    <button onClick={() => removeDetail(d.id)} style={styles.removeBtn}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 合計 */}
            <div style={styles.totalSection}>
              <span style={styles.totalLabel}>合計金額</span>
              <span style={styles.totalAmount}>¥{totalAmount.toLocaleString()}</span>
            </div>

            {/* 決済ボタン */}
            <div style={styles.actionButtons}>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting || details.length === 0}
                style={{
                  ...styles.actionBtn,
                  ...styles.actionBtnAirRegi,
                  opacity: (submitting || details.length === 0) ? 0.5 : 1,
                }}
              >
                登録（エアレジで会計）
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting || details.length === 0}
                style={{
                  ...styles.actionBtn,
                  ...styles.actionBtnSquare,
                  opacity: (submitting || details.length === 0) ? 0.5 : 1,
                }}
              >
                Squareで決済
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #E5E7EB',
    borderTopColor: '#004AAD',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '24px',
    alignItems: 'start',
  },

  // 左パネル
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
  cardLabel: {
    display: 'block',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '1.1rem',
    border: '2px solid #E5E7EB',
    borderRadius: '10px',
    background: 'white',
    cursor: 'pointer',
  },

  // 検索
  searchRow: {
    display: 'flex',
    gap: '12px',
  },
  searchInput: {
    flex: 1,
    padding: '14px 16px',
    fontSize: '1.1rem',
    border: '2px solid #E5E7EB',
    borderRadius: '10px',
  },
  searchBtn: {
    padding: '14px 28px',
    background: '#004AAD',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // 検索結果
  searchResult: {
    marginTop: '16px',
    padding: '16px',
    background: '#F0FDF4',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '2px solid #059669',
  },
  searchResultInfo: {},
  searchResultModel: {
    fontWeight: '600',
    fontSize: '1.1rem',
    color: '#1F2937',
    margin: 0,
  },
  searchResultMgmt: {
    color: '#6B7280',
    fontSize: '0.9rem',
    margin: '4px 0',
  },
  searchResultPrice: {
    fontWeight: '700',
    color: '#059669',
    fontSize: '1.2rem',
    margin: 0,
  },
  addBtn: {
    padding: '12px 28px',
    background: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // 在庫一覧
  inventoryListBtn: {
    width: '100%',
    marginTop: '16px',
    padding: '14px',
    background: '#F3F4F6',
    color: '#374151',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
  },
  inventoryList: {
    marginTop: '12px',
    maxHeight: '300px',
    overflowY: 'auto',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
  },
  noInventory: {
    padding: '20px',
    textAlign: 'center',
    color: '#6B7280',
  },
  inventoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderBottom: '1px solid #E5E7EB',
  },
  inventoryItemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  inventoryItemModel: {
    fontWeight: '500',
    color: '#1F2937',
  },
  inventoryItemMgmt: {
    fontSize: '0.85rem',
    color: '#6B7280',
  },
  inventoryItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  inventoryItemPrice: {
    fontWeight: '600',
    color: '#1F2937',
  },
  addBtnSmall: {
    padding: '8px 20px',
    background: '#E0E7FF',
    color: '#004AAD',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // 右パネル（カート）
  rightPanel: {},
  cartCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    position: 'sticky',
    top: '100px',
  },
  cartTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #E5E7EB',
  },
  emptyCart: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#9CA3AF',
  },
  cartItems: {
    maxHeight: '250px',
    overflowY: 'auto',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px',
    background: '#F9FAFB',
    borderRadius: '10px',
    marginBottom: '10px',
  },
  cartItemInfo: {},
  cartItemDesc: {
    fontWeight: '500',
    color: '#1F2937',
    fontSize: '0.95rem',
    margin: 0,
  },
  cartItemPrice: {
    fontWeight: '700',
    color: '#059669',
    fontSize: '1.1rem',
    margin: '4px 0 0 0',
  },
  removeBtn: {
    width: '36px',
    height: '36px',
    background: '#FEE2E2',
    color: '#DC2626',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.2rem',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // 合計
  totalSection: {
    marginTop: '20px',
    padding: '20px',
    background: 'linear-gradient(135deg, #004AAD 0%, #0052CC 100%)',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '1rem',
    fontWeight: '500',
  },
  totalAmount: {
    color: 'white',
    fontSize: '1.8rem',
    fontWeight: '700',
  },

  // アクションボタン
  actionButtons: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  actionBtn: {
    width: '100%',
    padding: '16px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.05rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  actionBtnAirRegi: {
    background: '#6B7280',
    color: 'white',
  },
  actionBtnSquare: {
    background: '#059669',
    color: 'white',
  },
}
