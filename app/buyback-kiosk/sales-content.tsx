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

type RepairMenu = {
  model: string
  menu: string
  price: number
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

      // 売上ヘッダー登録
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

      // 売上明細登録
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

      // 中古在庫のステータス更新
      for (const detail of details) {
        if (detail.usedInventoryId) {
          await supabase
            .from('t_used_inventory')
            .update({ status: '販売済' })
            .eq('id', detail.usedInventoryId)
        }
      }

      // フォームリセット
      setDetails([])
      setSearchImei('')
      setSearchedInventory(null)

      if (useSquare) {
        // Square POSアプリを起動
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

        // iPadの場合はSquareアプリを起動
        const isMobile = /iPad|iPhone|iPod/.test(navigator.userAgent)
        if (isMobile) {
          window.location.href = squareUrl
        } else {
          alert(`売上を登録しました（ID: ${headerData.id}）\n\n合計金額: ¥${totalAmount.toLocaleString()}\n\nSquare POSアプリで決済してください。`)
        }
      } else {
        alert(`売上を登録しました（ID: ${headerData.id}）\n\nエアレジで ¥${totalAmount.toLocaleString()} を会計してください。`)
      }

      // 在庫リストを更新
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
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #E5E7EB', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* 担当者選択 */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '12px' }}>担当者</h3>
        <select
          value={selectedStaffId}
          onChange={(e) => setSelectedStaffId(e.target.value)}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '1.1rem',
            border: '2px solid #E5E7EB',
            borderRadius: '10px',
          }}
        >
          <option value="">選択してください</option>
          {staff.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* 中古在庫検索 */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '12px' }}>中古iPhone検索</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={searchImei}
            onChange={(e) => setSearchImei(e.target.value)}
            placeholder="管理番号（IMEI下4桁）を入力"
            style={{
              flex: 1,
              padding: '14px',
              fontSize: '1.1rem',
              border: '2px solid #E5E7EB',
              borderRadius: '10px',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchImei()}
          />
          <button
            onClick={handleSearchImei}
            style={{
              padding: '14px 28px',
              background: '#004AAD',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            検索
          </button>
        </div>

        {/* 検索結果 */}
        {searchedInventory && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: '#F0FDF4',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                {searchedInventory.model} {searchedInventory.storage}GB {searchedInventory.rank}
              </p>
              <p style={{ color: '#6B7280' }}>管理番号: #{searchedInventory.management_number}</p>
              <p style={{ fontWeight: '700', color: '#059669', fontSize: '1.2rem' }}>
                ¥{(searchedInventory.sales_price || 0).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => addUsedInventory(searchedInventory)}
              style={{
                padding: '12px 24px',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              追加
            </button>
          </div>
        )}

        {/* 在庫一覧（折りたたみ） */}
        <details style={{ marginTop: '16px' }}>
          <summary style={{ cursor: 'pointer', color: '#004AAD', fontWeight: '500' }}>
            販売可能な在庫一覧（{usedInventory.length}件）
          </summary>
          <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {usedInventory.map(inv => (
              <div
                key={inv.id}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ fontWeight: '500' }}>{inv.model} {inv.storage}GB {inv.rank}</span>
                  <span style={{ color: '#6B7280', marginLeft: '8px' }}>#{inv.management_number}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: '600' }}>¥{(inv.sales_price || 0).toLocaleString()}</span>
                  <button
                    onClick={() => addUsedInventory(inv)}
                    style={{
                      padding: '6px 16px',
                      background: '#E0E7FF',
                      color: '#004AAD',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    追加
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* 明細 */}
      {details.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>明細</h3>
          {details.map(d => (
            <div
              key={d.id}
              style={{
                padding: '14px',
                background: '#F9FAFB',
                borderRadius: '10px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <p style={{ fontWeight: '600' }}>{d.description}</p>
                <p style={{ color: '#059669', fontWeight: '700', fontSize: '1.1rem' }}>
                  ¥{d.amount.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => removeDetail(d.id)}
                style={{
                  padding: '8px 16px',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                削除
              </button>
            </div>
          ))}

          {/* 合計 */}
          <div style={{
            marginTop: '20px',
            padding: '20px',
            background: '#004AAD',
            borderRadius: '12px',
            color: 'white',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '1rem', marginBottom: '4px' }}>合計金額</p>
            <p style={{ fontSize: '2rem', fontWeight: '700' }}>¥{totalAmount.toLocaleString()}</p>
          </div>

          {/* ボタン */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '18px',
                background: submitting ? '#9CA3AF' : '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              登録（エアレジで会計）
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '18px',
                background: submitting ? '#9CA3AF' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              Squareで決済
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
