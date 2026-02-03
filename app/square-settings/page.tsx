'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_TENANT_ID } from '../lib/constants'
import { Shop } from '../lib/types'

type SyncStatus = {
  loading: boolean
  message: string
  success: boolean | null
}

export default function SquareSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shops, setShops] = useState<Shop[]>([])
  const [settings, setSettings] = useState({
    applicationId: '',
    accessToken: '',
    webhookSignatureKey: '',
    feeRateCard: '2.5',
    feeRateElectronic: '3.25',
    feeRateQr: '3.25',
    feeRateCash: '0',
  })
  const [locationIds, setLocationIds] = useState<{ [shopId: number]: string }>({})
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ loading: false, message: '', success: null })
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // 店舗データ取得
    const { data: shopsData } = await supabase
      .from('m_shops')
      .select('id, name, square_location_id')
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .eq('is_active', true)
      .order('id')

    setShops(shopsData || [])

    // Location IDsを設定
    const locIds: { [key: number]: string } = {}
    shopsData?.forEach(shop => {
      locIds[shop.id] = shop.square_location_id || ''
    })
    setLocationIds(locIds)

    // システム設定取得
    const { data: settingsData } = await supabase
      .from('m_system_settings')
      .select('key, value')
      .in('key', [
        'square_application_id',
        'square_access_token',
        'square_webhook_signature_key',
        'square_fee_rate_card',
        'square_fee_rate_electronic',
        'square_fee_rate_qr',
        'square_fee_rate_cash',
      ])

    const settingsMap: { [key: string]: string } = {}
    settingsData?.forEach(s => {
      settingsMap[s.key] = s.value
    })

    setSettings({
      applicationId: settingsMap['square_application_id'] || '',
      accessToken: settingsMap['square_access_token'] || '',
      webhookSignatureKey: settingsMap['square_webhook_signature_key'] || '',
      feeRateCard: settingsMap['square_fee_rate_card'] || '2.5',
      feeRateElectronic: settingsMap['square_fee_rate_electronic'] || '3.25',
      feeRateQr: settingsMap['square_fee_rate_qr'] || '3.25',
      feeRateCash: settingsMap['square_fee_rate_cash'] || '0',
    })

    setLoading(false)
  }

  const saveSettings = async () => {
    setSaving(true)

    try {
      // システム設定を保存
      const settingsToSave = [
        { key: 'square_application_id', value: settings.applicationId },
        { key: 'square_access_token', value: settings.accessToken },
        { key: 'square_webhook_signature_key', value: settings.webhookSignatureKey },
        { key: 'square_fee_rate_card', value: settings.feeRateCard },
        { key: 'square_fee_rate_electronic', value: settings.feeRateElectronic },
        { key: 'square_fee_rate_qr', value: settings.feeRateQr },
        { key: 'square_fee_rate_cash', value: settings.feeRateCash },
      ]

      for (const setting of settingsToSave) {
        await supabase
          .from('m_system_settings')
          .upsert({
            tenant_id: DEFAULT_TENANT_ID,
            key: setting.key,
            value: setting.value,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'tenant_id,key' })
      }

      // 店舗のLocation IDを保存
      for (const [shopId, locationId] of Object.entries(locationIds)) {
        await supabase
          .from('m_shops')
          .update({ square_location_id: locationId || null })
          .eq('id', parseInt(shopId))
      }

      alert('設定を保存しました')
    } catch (error) {
      alert('保存に失敗しました')
      console.error(error)
    }

    setSaving(false)
  }

  const testConnection = async () => {
    setTestResult(null)

    try {
      const response = await fetch('/api/square/sync-catalog')
      const data = await response.json()

      if (data.error) {
        setTestResult({ success: false, message: data.error })
      } else {
        setTestResult({ success: true, message: `接続成功！カタログに${data.objects?.length || 0}件の商品があります` })
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message })
    }
  }

  const syncCatalog = async (action: string, shopId?: number) => {
    setSyncStatus({ loading: true, message: '同期中...', success: null })

    try {
      const response = await fetch('/api/square/sync-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, shopId }),
      })

      const data = await response.json()

      if (data.error) {
        setSyncStatus({ loading: false, message: data.error, success: false })
      } else {
        setSyncStatus({
          loading: false,
          message: `${data.synced}/${data.total}件を同期しました`,
          success: true,
        })
      }
    } catch (error: any) {
      setSyncStatus({ loading: false, message: error.message, success: false })
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/square/webhook`
    : ''

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Square連携設定</h1>
        <p className="page-subtitle">Square POSとの連携を設定します</p>
      </div>

      {/* API設定 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">API認証設定</h2>
        </div>
        <div className="card-body">
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Application ID</label>
              <input
                type="text"
                value={settings.applicationId}
                onChange={(e) => setSettings({ ...settings, applicationId: e.target.value })}
                className="form-input"
                placeholder="sq0idp-XXXX..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Access Token（本番用）</label>
              <input
                type="password"
                value={settings.accessToken}
                onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                className="form-input"
                placeholder="EAAA..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Webhook署名キー</label>
              <input
                type="password"
                value={settings.webhookSignatureKey}
                onChange={(e) => setSettings({ ...settings, webhookSignatureKey: e.target.value })}
                className="form-input"
                placeholder="Webhook設定画面から取得"
              />
              <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
                Square Developer Dashboard → Webhooks → Signature Key
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Webhook URL（Squareに登録）</label>
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="form-input"
                style={{ background: '#F3F4F6' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
                このURLをSquare Developer DashboardのWebhook設定に登録してください
              </p>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={testConnection} className="btn btn-secondary">
              接続テスト
            </button>
            {testResult && (
              <span style={{ color: testResult.success ? '#059669' : '#DC2626' }}>
                {testResult.message}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 店舗Location ID設定 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">店舗とLocation IDの紐付け</h2>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '16px' }}>
            Square Developer Dashboard → Locations で確認できるLocation IDを各店舗に設定してください
          </p>
          {shops.map((shop) => (
            <div key={shop.id} className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">{shop.name}</label>
              <input
                type="text"
                value={locationIds[shop.id] || ''}
                onChange={(e) => setLocationIds({ ...locationIds, [shop.id]: e.target.value })}
                className="form-input"
                placeholder="LXXXX..."
              />
            </div>
          ))}
        </div>
      </div>

      {/* 手数料率設定 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">決済手数料率</h2>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '16px' }}>
            2025年1月〜 中小企業（年間決済3,000万円以下）はカード2.5%、電子マネー・QR3.25%
          </p>
          <div className="form-grid form-grid-4">
            <div className="form-group">
              <label className="form-label">クレジットカード（%）</label>
              <input
                type="text"
                value={settings.feeRateCard}
                onChange={(e) => setSettings({ ...settings, feeRateCard: e.target.value })}
                className="form-input"
                placeholder="2.5"
              />
              <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
                Visa, Mastercard, JCB, Amex等
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">電子マネー（%）</label>
              <input
                type="text"
                value={settings.feeRateElectronic}
                onChange={(e) => setSettings({ ...settings, feeRateElectronic: e.target.value })}
                className="form-input"
                placeholder="3.25"
              />
              <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
                交通系IC, iD, QUICPay
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">QRコード（%）</label>
              <input
                type="text"
                value={settings.feeRateQr}
                onChange={(e) => setSettings({ ...settings, feeRateQr: e.target.value })}
                className="form-input"
                placeholder="3.25"
              />
              <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
                PayPay, d払い, 楽天ペイ等
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">現金（%）</label>
              <input
                type="text"
                value={settings.feeRateCash}
                onChange={(e) => setSettings({ ...settings, feeRateCash: e.target.value })}
                className="form-input"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 保存ボタン */}
      <div style={{ marginBottom: '24px' }}>
        <button onClick={saveSettings} disabled={saving} className="btn btn-primary">
          {saving ? '保存中...' : '設定を保存'}
        </button>
      </div>

      {/* カタログ同期 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">カタログ同期</h2>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '16px' }}>
            このシステムの商品・メニューをSquareのカタログに同期します
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button
              onClick={() => syncCatalog('sync_repair_menus')}
              disabled={syncStatus.loading}
              className="btn btn-secondary"
            >
              修理メニューを同期
            </button>
            {shops.map((shop) => (
              <button
                key={shop.id}
                onClick={() => syncCatalog('sync_used_inventory', shop.id)}
                disabled={syncStatus.loading}
                className="btn btn-secondary"
              >
                {shop.name}の中古在庫を同期
              </button>
            ))}
          </div>

          {syncStatus.message && (
            <div
              style={{
                padding: '12px',
                borderRadius: '6px',
                background: syncStatus.success === null ? '#F3F4F6' : syncStatus.success ? '#D1FAE5' : '#FEE2E2',
                color: syncStatus.success === null ? '#374151' : syncStatus.success ? '#065F46' : '#991B1B',
              }}
            >
              {syncStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* Webhook設定ガイド */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Webhook設定手順</h2>
        </div>
        <div className="card-body">
          <ol style={{ paddingLeft: '20px', fontSize: '0.9rem', lineHeight: '1.8' }}>
            <li>Square Developer Dashboardにログイン</li>
            <li>作成したアプリケーションを選択</li>
            <li>左メニューから「Webhooks」を選択</li>
            <li>「Add Endpoint」をクリック</li>
            <li>
              URL に <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{webhookUrl}</code> を入力
            </li>
            <li>
              Events で以下を選択：
              <ul style={{ marginTop: '4px' }}>
                <li><code>payment.completed</code></li>
                <li><code>order.created</code></li>
                <li><code>order.updated</code></li>
              </ul>
            </li>
            <li>「Save」をクリック</li>
            <li>表示される「Signature Key」をコピーして上記の設定に入力</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
