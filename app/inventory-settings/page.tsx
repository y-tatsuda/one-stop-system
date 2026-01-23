'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type CheckSetting = {
  id: number
  day_of_week: number
  is_active: boolean
}

const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']

export default function InventoryCheckSettingsPage() {
  const [settings, setSettings] = useState<CheckSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // データ取得
  const fetchData = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('m_inventory_check_settings')
      .select('id, day_of_week, is_active')
      .eq('tenant_id', 1)
      .order('day_of_week')

    setSettings(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 設定されている曜日
  const activeDays = settings.filter(s => s.is_active).map(s => s.day_of_week)

  // 追加可能な曜日
  const availableDays = [0, 1, 2, 3, 4, 5, 6].filter(day => !activeDays.includes(day))

  // 曜日追加
  const addDay = async () => {
    if (selectedDay === null) {
      alert('曜日を選択してください')
      return
    }

    setSaving(true)

    try {
      // 既存の設定があるか確認
      const existingSetting = settings.find(s => s.day_of_week === selectedDay)

      if (existingSetting) {
        // 既存設定を有効化
        const { error } = await supabase
          .from('m_inventory_check_settings')
          .update({ is_active: true })
          .eq('id', existingSetting.id)

        if (error) throw error
      } else {
        // 新規追加
        const { error } = await supabase
          .from('m_inventory_check_settings')
          .insert({
            tenant_id: 1,
            day_of_week: selectedDay,
            is_active: true,
          })

        if (error) throw error
      }

      await fetchData()
      setSelectedDay(null)
      alert('追加しました')
    } catch (error) {
      alert('追加に失敗しました: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // 曜日削除（無効化）
  const removeDay = async (setting: CheckSetting) => {
    if (!confirm(`${dayNames[setting.day_of_week]}の棚卸しを削除しますか？`)) {
      return
    }

    const { error } = await supabase
      .from('m_inventory_check_settings')
      .update({ is_active: false })
      .eq('id', setting.id)

    if (error) {
      alert('削除に失敗しました: ' + error.message)
      return
    }

    await fetchData()
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const activeSettings = settings.filter(s => s.is_active)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">棚卸し設定</h1>
      </div>

      {/* 説明 */}
      <div className="alert alert-info mb-lg">
        <p>棚卸しを実施する曜日を設定します。設定した曜日に棚卸しが未完了の場合、ホーム画面にアラートが表示されます。</p>
      </div>

      {/* 現在の設定 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">現在の棚卸し曜日</h2>
        </div>
        <div className="card-body">
          {activeSettings.length === 0 ? (
            <p className="text-secondary">棚卸し曜日が設定されていません</p>
          ) : (
            <div className="flex flex-wrap gap-md">
              {activeSettings.map(setting => (
                <div
                  key={setting.id}
                  className="flex items-center gap-sm"
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'var(--color-success-light)',
                    border: '1px solid var(--color-success)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <span style={{ fontWeight: 500, color: 'var(--color-success)' }}>
                    ✓ {dayNames[setting.day_of_week]}
                  </span>
                  <button
                    onClick={() => removeDay(setting)}
                    className="btn btn-sm btn-danger"
                    style={{ marginLeft: '8px', padding: '4px 8px' }}
                    title="削除"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 曜日追加 */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">棚卸し曜日を追加</h2>
        </div>
        <div className="card-body">
          {availableDays.length === 0 ? (
            <p className="text-secondary">すべての曜日が設定済みです</p>
          ) : (
            <div>
              <div className="form-grid form-grid-4 mb-lg">
                {availableDays.map(day => (
                  <label
                    key={day}
                    className="form-check"
                    style={{
                      padding: '12px',
                      border: selectedDay === day 
                        ? '2px solid var(--color-primary)' 
                        : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      backgroundColor: selectedDay === day 
                        ? 'var(--color-primary-light)' 
                        : 'transparent',
                      justifyContent: 'center',
                    }}
                  >
                    <input
                      type="radio"
                      name="day"
                      value={day}
                      checked={selectedDay === day}
                      onChange={() => setSelectedDay(day)}
                    />
                    <span style={{ fontWeight: 500 }}>{dayNames[day]}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={addDay}
                disabled={saving || selectedDay === null}
                className="btn btn-primary"
              >
                {saving ? '追加中...' : '+ 追加'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* カレンダー表示 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">週間カレンダー</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {[0, 1, 2, 3, 4, 5, 6].map(day => {
              const isActive = activeDays.includes(day)
              return (
                <div
                  key={day}
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    borderRadius: 'var(--radius)',
                    backgroundColor: isActive ? 'var(--color-success-light)' : 'var(--color-bg)',
                    border: isActive ? '2px solid var(--color-success)' : '1px solid var(--color-border)',
                  }}
                >
                  <p style={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: day === 0 ? 'var(--color-danger)' : day === 6 ? 'var(--color-primary)' : 'var(--color-text)',
                    margin: 0,
                  }}>
                    {dayNames[day].replace('曜日', '')}
                  </p>
                  {isActive && (
                    <span style={{ color: 'var(--color-success)', fontSize: '1.2rem' }}>✓</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}