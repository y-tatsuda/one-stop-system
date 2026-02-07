/**
 * 販売価格CSVをm_sales_pricesテーブルにインポートするスクリプト
 *
 * CSVフォーマット:
 * 機種名,容量,超美品,美品,良品,並品,リペア品
 * iPhone SE 2,64GB,"24,980","21,980","19,980","17,980","14,980"
 *
 * 実行: npx ts-node scripts/import-sales-prices.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const DEFAULT_TENANT_ID = 1
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CSV_PATH = path.join(__dirname, '../data/master/m_sales_prices.csv')

const RANK_COLUMNS = ['超美品', '美品', '良品', '並品', 'リペア品']

// モデル名の正規化マップ（CSV → DB短縮形）
const MODEL_MAP: Record<string, string> = {
  'iPhone 8': '8',
  'iPhone 8 Plus': '8Plus',
  'iPhone X': 'X',
  'iPhone XR': 'XR',
  'iPhone XS': 'XS',
  'iPhone XS Max': 'XSMax',
  'iPhone 11': '11',
  'iPhone 11 Pro': '11Pro',
  'iPhone 11 Pro Max': '11ProMax',
  'iPhone 12': '12',
  'iPhone 12 mini': '12mini',
  'iPhone 12 Pro': '12Pro',
  'iPhone 12 Pro Max': '12ProMax',
  'iPhone 13': '13',
  'iPhone 13 mini': '13mini',
  'iPhone 13 Pro': '13Pro',
  'iPhone 13 Pro Max': '13ProMax',
  'iPhone 14': '14',
  'iPhone 14 Plus': '14Plus',
  'iPhone 14 Pro': '14Pro',
  'iPhone 14 Pro Max': '14ProMax',
  'iPhone 15': '15',
  'iPhone 15 Plus': '15Plus',
  'iPhone 15 Pro': '15Pro',
  'iPhone 15 Pro Max': '15ProMax',
  'iPhone 16': '16',
  'iPhone 16 Plus': '16Plus',
  'iPhone 16 Pro': '16Pro',
  'iPhone 16 Pro Max': '16ProMax',
  'iPhone 16e': '16e',
  'iPhone SE 2': 'SE2',
  'iPhone SE 3': 'SE3',
}

function normalizeModel(csvModel: string): string {
  return MODEL_MAP[csvModel] || csvModel
}

function parsePrice(priceStr: string): number {
  // "24,980" → 24980 （改行コード \r も除去）
  return parseInt(priceStr.replace(/[",\r\n]/g, ''), 10)
}

function parseStorage(storageStr: string): number {
  // "64GB" → 64, "1TB" → 1024
  const match = storageStr.match(/(\d+)(GB|TB)/i)
  if (!match) return 0
  const value = parseInt(match[1], 10)
  const unit = match[2].toUpperCase()
  return unit === 'TB' ? value * 1024 : value
}

async function main() {
  console.log('=== 販売価格CSVインポート ===\n')

  // CSVファイル読み込み
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSVファイルが見つかりません: ${CSV_PATH}`)
    return
  }

  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8')
  const lines = csvContent.split('\n').filter(line => line.trim())

  // ヘッダー確認（2行目）
  const header = lines[1].split(',')
  console.log('ヘッダー:', header)

  // データ行をパース（3行目から）
  const records: { model: string; storage: number; rank: string; price: number }[] = []

  for (let i = 2; i < lines.length; i++) {
    // 改行コードを除去してからパース
    const line = lines[i].replace(/\r/g, '')
    // CSVパース（カンマ区切り、引用符内のカンマを考慮）
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        fields.push(current)
        current = ''
      } else {
        current += char
      }
    }
    fields.push(current) // 最後のフィールド

    if (fields.length < 7) continue

    const csvModel = fields[0].trim()
    const storageStr = fields[1].trim()
    const model = normalizeModel(csvModel)
    const storage = parseStorage(storageStr)

    for (let j = 0; j < RANK_COLUMNS.length; j++) {
      const priceStr = fields[2 + j]
      if (!priceStr) continue
      const price = parsePrice(priceStr)
      if (isNaN(price) || price === 0) continue

      records.push({
        model,
        storage,
        rank: RANK_COLUMNS[j],
        price,
      })
    }
  }

  console.log(`パースしたレコード数: ${records.length}件\n`)

  // 既存データを一旦無効化
  console.log('既存データを無効化中...')
  const { error: deactivateError } = await supabase
    .from('m_sales_prices')
    .update({ is_active: false })
    .eq('tenant_id', DEFAULT_TENANT_ID)

  if (deactivateError) {
    console.error('無効化エラー:', deactivateError)
    return
  }

  // 新しいデータをupsert
  console.log('新しいデータをインポート中...')

  let successCount = 0
  let errorCount = 0

  for (const record of records) {
    // 既存レコードを検索
    const { data: existing } = await supabase
      .from('m_sales_prices')
      .select('id')
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .eq('model', record.model)
      .eq('storage', record.storage)
      .eq('rank', record.rank)
      .single()

    if (existing) {
      // 更新
      const { error } = await supabase
        .from('m_sales_prices')
        .update({ price: record.price, is_active: true, updated_at: new Date().toISOString() })
        .eq('id', existing.id)

      if (error) {
        console.error(`更新エラー (${record.model} ${record.storage}GB ${record.rank}):`, error.message)
        errorCount++
      } else {
        successCount++
      }
    } else {
      // 新規挿入
      const { error } = await supabase
        .from('m_sales_prices')
        .insert({
          tenant_id: DEFAULT_TENANT_ID,
          model: record.model,
          storage: record.storage,
          rank: record.rank,
          price: record.price,
          is_active: true,
        })

      if (error) {
        console.error(`挿入エラー (${record.model} ${record.storage}GB ${record.rank}):`, error.message)
        errorCount++
      } else {
        successCount++
      }
    }
  }

  console.log(`\n=== 完了 ===`)
  console.log(`成功: ${successCount}件`)
  console.log(`エラー: ${errorCount}件`)

  // サンプル確認
  console.log('\n--- インポート後のサンプル（iPhone 16 Pro Max 256GB） ---')
  const { data: sample } = await supabase
    .from('m_sales_prices')
    .select('model, storage, rank, price')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .eq('model', 'iPhone 16 Pro Max')
    .eq('storage', 256)
    .eq('is_active', true)
    .order('rank')

  for (const s of sample || []) {
    console.log(`${s.rank}: ¥${s.price.toLocaleString()}`)
  }
}

main().catch(console.error)
