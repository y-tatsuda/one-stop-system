import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_TENANT_ID } from '@/app/lib/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getSquareConfig(): Promise<{ baseUrl: string; accessToken: string; applicationId: string; mode: string }> {
  const { data: settingsData } = await supabase
    .from('m_system_settings')
    .select('key, value')
    .in('key', [
      'square_mode',
      'square_application_id',
      'square_sandbox_application_id',
      'square_access_token',
      'square_sandbox_access_token',
    ])

  const settingsMap: { [key: string]: string } = {}
  settingsData?.forEach(s => {
    settingsMap[s.key] = s.value
  })

  const mode = settingsMap['square_mode'] || 'production'
  const isSandbox = mode === 'sandbox'

  const accessToken = isSandbox
    ? (settingsMap['square_sandbox_access_token'] || '')
    : (settingsMap['square_access_token'] || process.env.SQUARE_ACCESS_TOKEN || '')

  const applicationId = isSandbox
    ? (settingsMap['square_sandbox_application_id'] || '')
    : (settingsMap['square_application_id'] || '')

  if (!accessToken) {
    throw new Error(`Square Access Token（${isSandbox ? 'Sandbox' : '本番'}）が設定されていません`)
  }

  const baseUrl = isSandbox
    ? 'https://connect.squareupsandbox.com/v2'
    : 'https://connect.squareup.com/v2'

  return { baseUrl, accessToken, applicationId, mode }
}

async function squareRequest(endpoint: string, method: string, body?: any) {
  const { baseUrl, accessToken, mode } = await getSquareConfig()

  console.log(`Square API リクエスト [${mode}]: ${method} ${endpoint}`)

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': '2024-01-18',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Square API Error:', data)
    throw new Error(data.errors?.[0]?.detail || 'Square API error')
  }

  return data
}

// カタログに商品を登録/更新
async function upsertCatalogItem(item: {
  id: string
  name: string
  price: number
  description?: string
  categoryId?: string
}) {
  const idempotencyKey = `${item.id}-${Date.now()}`

  const catalogObject = {
    type: 'ITEM',
    id: `#${item.id}`,
    item_data: {
      name: item.name,
      description: item.description || '',
      variations: [
        {
          type: 'ITEM_VARIATION',
          id: `#${item.id}-variation`,
          item_variation_data: {
            name: 'Regular',
            pricing_type: 'FIXED_PRICING',
            price_money: {
              amount: item.price,
              currency: 'JPY',
            },
          },
        },
      ],
    },
  }

  const response = await squareRequest('/catalog/object', 'POST', {
    idempotency_key: idempotencyKey,
    object: catalogObject,
  })

  return response.catalog_object
}

export async function POST(request: NextRequest) {
  try {
    const { action, shopId } = await request.json()

    if (action === 'sync_repair_menus') {
      // 修理メニューの同期
      const { data: repairPrices } = await supabase
        .from('m_repair_prices_iphone')
        .select('id, model, menu, price')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('is_active', true)

      let synced = 0
      for (const item of repairPrices || []) {
        try {
          const catalogItem = await upsertCatalogItem({
            id: `repair-${item.id}`,
            name: `${item.model} ${item.menu}`,
            price: Math.round(item.price * 1.1), // 税込価格
            description: `iPhone修理: ${item.model} ${item.menu}`,
          })

          // マッピングを保存
          await supabase
            .from('m_square_catalog_mapping')
            .upsert({
              tenant_id: DEFAULT_TENANT_ID,
              square_catalog_id: catalogItem.id,
              item_type: 'repair',
              item_id: item.id,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'item_type,item_id' })

          synced++
        } catch (error) {
          console.error('修理メニュー同期エラー:', item.id, error)
        }
      }

      return NextResponse.json({ success: true, synced, total: repairPrices?.length || 0 })
    }

    if (action === 'sync_used_inventory') {
      // 中古在庫の同期
      const { data: inventory } = await supabase
        .from('t_used_inventory')
        .select('id, model, storage, rank, sales_price, management_number')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('status', '販売可')
        .eq('shop_id', shopId)

      let synced = 0
      for (const item of inventory || []) {
        if (!item.sales_price) continue

        try {
          const catalogItem = await upsertCatalogItem({
            id: `used-${item.id}`,
            name: `【中古】iPhone ${item.model} ${item.storage}GB ${item.rank} #${item.management_number}`,
            price: Math.round(item.sales_price * 1.1), // 税込価格
            description: `管理番号: ${item.management_number}`,
          })

          // マッピングを保存
          await supabase
            .from('m_square_catalog_mapping')
            .upsert({
              tenant_id: DEFAULT_TENANT_ID,
              square_catalog_id: catalogItem.id,
              item_type: 'used_inventory',
              item_id: item.id,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'item_type,item_id' })

          synced++
        } catch (error) {
          console.error('中古在庫同期エラー:', item.id, error)
        }
      }

      return NextResponse.json({ success: true, synced, total: inventory?.length || 0 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('カタログ同期エラー:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// カタログ一覧を取得
export async function GET() {
  try {
    const response = await squareRequest('/catalog/list?types=ITEM', 'GET')
    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
