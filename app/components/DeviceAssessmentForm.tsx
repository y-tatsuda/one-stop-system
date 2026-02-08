'use client'

/**
 * =====================================================
 * 共通デバイス査定フォームコンポーネント
 * =====================================================
 *
 * 【使用箇所】
 * - 店頭買取 (/app/buyback/page.tsx)
 * - 郵送買取 (/app/buyback-mail/page.tsx)
 *
 * 【注意】
 * - 査定項目の追加・変更はここで一元管理
 * - 価格計算ロジックは /app/lib/pricing.ts を使用
 * =====================================================
 */

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_TENANT_ID } from '../lib/constants'
import { IphoneModel } from '../lib/types'

// =====================================================
// 型定義
// =====================================================

export type AssessmentData = {
  model: string
  modelDisplayName: string
  storage: string
  rank: string
  batteryPercent: string
  isServiceState: boolean
  imei: string
  nwStatus: '' | 'ok' | 'triangle' | 'cross'
  cameraStain: '' | 'none' | 'minor' | 'major'
  cameraBroken: boolean | ''
  repairHistory: boolean | ''
  // カメラ写真（郵送買取用）
  cameraPhoto?: string
  // カメラ染み画像（店頭買取用・少/多選択時）
  cameraStainPhotos?: string[]
}

export type AssessmentErrors = {
  [key: string]: string
}

type DeviceAssessmentFormProps = {
  data: AssessmentData
  errors: AssessmentErrors
  index: number
  iphoneModels: IphoneModel[]
  onUpdate: (updates: Partial<AssessmentData>) => void
  onCalculate: (model: string, storage: string, rank: string) => void
  // オプション
  showImei?: boolean
  showCameraPhoto?: boolean  // 郵送買取用：カメラ部分の写真撮影
  showCameraStainPhotos?: boolean  // 店頭買取用：カメラ染み選択時の画像
  readOnly?: boolean
}

// ランク選択肢
const RANK_OPTIONS = ['超美品', '美品', '良品', '並品', 'リペア品']

// ランクの説明
const RANK_DESCRIPTIONS: { rank: string; description: string }[] = [
  { rank: '超美品', description: '傷がなく、充放電回数1回未満' },
  { rank: '美品', description: '画面、本体共に傷無し' },
  { rank: '良品', description: '画面に傷無し' },
  { rank: '並品', description: '画面に傷あり' },
  { rank: 'リペア品', description: '画面割れなど重大な損傷あり' },
]

// =====================================================
// メインコンポーネント
// =====================================================

export default function DeviceAssessmentForm({
  data,
  errors,
  index,
  iphoneModels,
  onUpdate,
  onCalculate,
  showImei = true,
  showCameraPhoto = false,
  showCameraStainPhotos = false,
  readOnly = false,
}: DeviceAssessmentFormProps) {
  const [showCameraStainExample, setShowCameraStainExample] = useState(false)
  const [uploadingCameraPhoto, setUploadingCameraPhoto] = useState(false)
  const [uploadingStainPhoto, setUploadingStainPhoto] = useState(false)

  // モデル別の容量オプション
  const availableStorages = useMemo(() => {
    if (!data.model) return []
    const modelLower = data.model.toLowerCase()

    // Pro Max / Pro models
    if (modelLower.includes('pro')) {
      if (data.model.match(/^(15|16|17)/)) {
        return [256, 512, 1024]
      }
      return [128, 256, 512, 1024]
    }
    // Plus models
    if (modelLower.includes('plus')) {
      return [128, 256, 512]
    }
    // SE models
    if (modelLower.includes('se')) {
      return [64, 128, 256]
    }
    // mini models
    if (modelLower.includes('mini')) {
      return [64, 128, 256, 512]
    }
    // Air model
    if (modelLower === 'air') {
      return [128, 256, 512]
    }
    // 16e model
    if (modelLower === '16e') {
      return [128, 256, 512]
    }
    // Standard models (11, 12, 13, 14, 15, 16, 17)
    if (data.model.match(/^(11|12|13|14)$/)) {
      return [64, 128, 256]
    }
    if (data.model.match(/^(15|16|17)$/)) {
      return [128, 256, 512]
    }
    // Older models
    if (data.model.match(/^(8|X|XR|XS)/)) {
      return [64, 128, 256]
    }
    return [64, 128, 256, 512]
  }, [data.model])

  // モデル変更時に容量リセット
  useEffect(() => {
    if (data.model && data.storage) {
      const storageNum = parseInt(data.storage)
      if (!availableStorages.includes(storageNum)) {
        onUpdate({ storage: '' })
      }
    }
  }, [data.model, availableStorages])

  // バッテリー入力後の価格再計算
  const handleBatteryBlur = () => {
    if (data.model && data.storage && data.rank) {
      onCalculate(data.model, data.storage, data.rank)
    }
  }

  // カメラ写真アップロード（郵送買取用）
  const handleCameraPhotoUpload = async (file: File) => {
    if (!file) return

    setUploadingCameraPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'camera-check')

      const res = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const { path } = await res.json()
        onUpdate({ cameraPhoto: path })
      } else {
        alert('画像のアップロードに失敗しました')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('画像のアップロードに失敗しました')
    } finally {
      setUploadingCameraPhoto(false)
    }
  }

  // カメラ染み画像アップロード（店頭買取用）
  const handleCameraStainPhotoUpload = async (file: File) => {
    if (!file) return

    const currentPhotos = data.cameraStainPhotos || []
    if (currentPhotos.length >= 3) {
      alert('画像は最大3枚までです')
      return
    }

    setUploadingStainPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'camera-stain')

      const res = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const { path } = await res.json()
        onUpdate({ cameraStainPhotos: [...currentPhotos, path] })
      } else {
        alert('画像のアップロードに失敗しました')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('画像のアップロードに失敗しました')
    } finally {
      setUploadingStainPhoto(false)
    }
  }

  // カメラ染み画像削除
  const handleRemoveCameraStainPhoto = (photoIndex: number) => {
    const currentPhotos = data.cameraStainPhotos || []
    const newPhotos = currentPhotos.filter((_, i) => i !== photoIndex)
    onUpdate({ cameraStainPhotos: newPhotos })
  }

  // シリーズでグループ化
  const groupedModels = useMemo(() => {
    const groups: { series: string; label: string; models: IphoneModel[] }[] = []
    for (const m of iphoneModels) {
      let series: string
      if (m.model.startsWith('SE')) {
        series = 'SE'
      } else if (m.model === 'Air') {
        series = '17'
      } else if (m.model === '16e') {
        series = '16'
      } else {
        series = m.model.match(/^(\d+)/)?.[1] || m.model
      }
      let group = groups.find(g => g.series === series)
      if (!group) {
        group = { series, label: `${series}シリーズ`, models: [] }
        groups.push(group)
      }
      group.models.push(m)
    }
    return groups
  }, [iphoneModels])

  return (
    <div className="assessment-form">
      {/* 機種 */}
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label form-label-required">機種</label>
        <select
          value={data.model}
          onChange={(e) => {
            const selectedModel = iphoneModels.find(m => m.model === e.target.value)
            onUpdate({
              model: e.target.value,
              modelDisplayName: selectedModel?.display_name || e.target.value,
              storage: '',
              rank: '',
            })
          }}
          className={`form-select ${errors[`item_${index}_model`] ? 'form-input-error' : ''}`}
          disabled={readOnly}
        >
          <option value="">選択</option>
          {groupedModels.map(g => (
            <optgroup key={g.series} label={g.label}>
              {g.models.map(m => (
                <option key={m.model} value={m.model}>{m.display_name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {errors[`item_${index}_model`] && <div className="form-error">{errors[`item_${index}_model`]}</div>}
      </div>

      {/* 容量 */}
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label form-label-required">容量</label>
        <select
          value={data.storage}
          onChange={(e) => onUpdate({ storage: e.target.value })}
          className={`form-select ${errors[`item_${index}_storage`] ? 'form-input-error' : ''}`}
          disabled={!data.model || readOnly}
        >
          <option value="">選択</option>
          {availableStorages.map(s => (
            <option key={s} value={s}>{s >= 1024 ? `${s / 1024}TB` : `${s}GB`}</option>
          ))}
        </select>
        {errors[`item_${index}_storage`] && <div className="form-error">{errors[`item_${index}_storage`]}</div>}
      </div>

      {/* ランク */}
      <div className="form-group" style={{ marginBottom: 8 }}>
        <label className="form-label form-label-required">ランク</label>
        <select
          value={data.rank}
          onChange={(e) => onUpdate({ rank: e.target.value })}
          className={`form-select ${errors[`item_${index}_rank`] ? 'form-input-error' : ''}`}
          disabled={readOnly}
        >
          <option value="">選択</option>
          {RANK_OPTIONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {errors[`item_${index}_rank`] && <div className="form-error">{errors[`item_${index}_rank`]}</div>}
      </div>

      {/* ランク目安 */}
      <div style={{
        background: '#f9fafb',
        borderRadius: 8,
        padding: '10px 14px',
        marginBottom: 8,
        fontSize: 12,
        lineHeight: 1.8,
        color: '#555',
      }}>
        <div style={{ fontWeight: 600, marginBottom: 2, color: '#374151' }}>ランクの目安</div>
        {RANK_DESCRIPTIONS.map(rd => (
          <div key={rd.rank}>
            <strong>{rd.rank}</strong>：{rd.description}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 16 }}>
        ※ 背面割れや水没は買取不可です。
      </div>

      {/* バッテリー最大容量 */}
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label form-label-required">バッテリー最大容量(%)</label>
        <input
          type="number"
          value={data.batteryPercent}
          onChange={(e) => onUpdate({ batteryPercent: e.target.value })}
          onBlur={handleBatteryBlur}
          className={`form-input ${errors[`item_${index}_battery`] ? 'form-input-error' : ''}`}
          placeholder="95"
          min={0}
          max={100}
          disabled={readOnly}
        />
        <div style={{ fontSize: 12, color: '#666', marginTop: 4, lineHeight: 1.6 }}>
          ※ 設定→バッテリー→バッテリーの状態の順番で確認出来ます
        </div>
        {errors[`item_${index}_battery`] && <div className="form-error">{errors[`item_${index}_battery`]}</div>}
      </div>

      {/* IMEI */}
      {showImei && (
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">IMEI</label>
          <input
            type="text"
            value={data.imei}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 15)
              onUpdate({ imei: val })
            }}
            className="form-input"
            placeholder="35XXXXXXXXXXXXX"
            maxLength={15}
            inputMode="numeric"
            disabled={readOnly}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4, lineHeight: 1.6 }}>
            ※ 発信画面で＊＃06＃と入力すると確認出来ます<br />
            ※ 35からはじまる15桁の数字です
          </div>
        </div>
      )}

      {/* ネットワーク利用制限 */}
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label form-label-required">ネットワーク利用制限</label>
        <select
          value={data.nwStatus}
          onChange={(e) => onUpdate({ nwStatus: e.target.value as '' | 'ok' | 'triangle' | 'cross' })}
          className={`form-select ${errors[`item_${index}_nwStatus`] ? 'form-input-error' : ''}`}
          disabled={readOnly}
        >
          <option value="">選択してください</option>
          <option value="ok">○（制限なし）</option>
          <option value="triangle">△（分割支払い中）</option>
          <option value="cross">×（利用制限あり）</option>
        </select>
        <div style={{ fontSize: 12, color: '#666', marginTop: 4, lineHeight: 1.6 }}>
          ※ 各キャリアの「ネットワーク利用制限確認」ページでIMEIを入力すると確認できます
        </div>
        {errors[`item_${index}_nwStatus`] && <div className="form-error">{errors[`item_${index}_nwStatus`]}</div>}
      </div>

      {/* カメラ染み */}
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label form-label-required">カメラ染み</label>
        <select
          value={data.cameraStain === '' ? '' : (data.cameraStain === 'none' ? 'none' : 'yes')}
          onChange={(e) => onUpdate({
            cameraStain: e.target.value === 'yes' ? 'minor' : (e.target.value === 'none' ? 'none' : '' as '' | 'none' | 'minor' | 'major'),
            cameraStainPhotos: e.target.value === 'none' ? [] : data.cameraStainPhotos,
          })}
          className={`form-select ${errors[`item_${index}_cameraStain`] ? 'form-input-error' : ''}`}
          disabled={readOnly}
        >
          <option value="">選択してください</option>
          <option value="none">なし</option>
          <option value="yes">あり</option>
        </select>
        <div style={{ fontSize: 12, color: '#666', marginTop: 4, lineHeight: 1.6 }}>
          ※ 白い無地の背景にカメラをかざすと確認出来ます<br />
          <span
            onClick={() => setShowCameraStainExample(!showCameraStainExample)}
            style={{ color: '#004AAD', textDecoration: 'underline', cursor: 'pointer' }}
          >
            このような症状です。(例)
          </span>
        </div>
        {showCameraStainExample && (
          <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <img
              src="/camerastain.png"
              alt="カメラ染みの例"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        )}
        {errors[`item_${index}_cameraStain`] && <div className="form-error">{errors[`item_${index}_cameraStain`]}</div>}

        {/* 店頭買取用：カメラ染み「あり」選択時の画像アップロード */}
        {showCameraStainPhotos && data.cameraStain !== '' && data.cameraStain !== 'none' && (
          <div style={{ marginTop: 12, padding: 12, background: '#fef3c7', borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#92400e' }}>
              カメラ染みの画像（最大3枚）
            </div>

            {/* アップロード済み画像 */}
            {data.cameraStainPhotos && data.cameraStainPhotos.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {data.cameraStainPhotos.map((photo, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buyback-documents/${photo}`}
                      alt={`カメラ染み ${i + 1}`}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #e5e7eb' }}
                    />
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCameraStainPhoto(i)}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* アップロードボタン */}
            {!readOnly && (!data.cameraStainPhotos || data.cameraStainPhotos.length < 3) && (
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
              }}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleCameraStainPhotoUpload(file)
                    e.target.value = ''
                  }}
                  style={{ display: 'none' }}
                  disabled={uploadingStainPhoto}
                />
                {uploadingStainPhoto ? 'アップロード中...' : '📷 画像を追加'}
              </label>
            )}
          </div>
        )}
      </div>

      {/* カメラ部分の写真（郵送買取用） */}
      {showCameraPhoto && (
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label form-label-required">カメラ部分の写真</label>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8, lineHeight: 1.6 }}>
            ※ 白またはグレーの無地の背景にカメラをかざして撮影してください
          </div>

          {data.cameraPhoto ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buyback-documents/${data.cameraPhoto}`}
                alt="カメラ部分の写真"
                style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onUpdate({ cameraPhoto: undefined })}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ) : (
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: 120,
              background: '#f9fafb',
              border: '2px dashed #d1d5db',
              borderRadius: 8,
              cursor: readOnly ? 'default' : 'pointer',
            }}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleCameraPhotoUpload(file)
                  e.target.value = ''
                }}
                style={{ display: 'none' }}
                disabled={readOnly || uploadingCameraPhoto}
              />
              <span style={{ fontSize: 32, marginBottom: 4 }}>📷</span>
              <span style={{ fontSize: 13, color: '#666' }}>
                {uploadingCameraPhoto ? 'アップロード中...' : 'タップして撮影'}
              </span>
            </label>
          )}
          {errors[`item_${index}_cameraPhoto`] && <div className="form-error">{errors[`item_${index}_cameraPhoto`]}</div>}
        </div>
      )}

      {/* カメラ窓の破損 */}
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label form-label-required">カメラ窓の破損</label>
        <select
          value={data.cameraBroken === '' ? '' : (data.cameraBroken ? 'yes' : 'no')}
          onChange={(e) => onUpdate({ cameraBroken: e.target.value === 'yes' ? true : (e.target.value === 'no' ? false : '') })}
          className={`form-select ${errors[`item_${index}_cameraBroken`] ? 'form-input-error' : ''}`}
          disabled={readOnly}
        >
          <option value="">選択してください</option>
          <option value="no">なし</option>
          <option value="yes">あり</option>
        </select>
        {errors[`item_${index}_cameraBroken`] && <div className="form-error">{errors[`item_${index}_cameraBroken`]}</div>}
      </div>

      {/* 非正規修理の利用歴 */}
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label form-label-required">非正規修理の利用歴</label>
        <select
          value={data.repairHistory === '' ? '' : (data.repairHistory ? 'yes' : 'no')}
          onChange={(e) => onUpdate({ repairHistory: e.target.value === 'yes' ? true : (e.target.value === 'no' ? false : '') })}
          className={`form-select ${errors[`item_${index}_repairHistory`] ? 'form-input-error' : ''}`}
          disabled={readOnly}
        >
          <option value="">選択してください</option>
          <option value="no">なし</option>
          <option value="yes">あり</option>
        </select>
        {errors[`item_${index}_repairHistory`] && <div className="form-error">{errors[`item_${index}_repairHistory`]}</div>}
      </div>
    </div>
  )
}

// =====================================================
// バリデーション関数（外部から利用可能）
// =====================================================

export function validateAssessmentData(
  data: AssessmentData,
  index: number,
  options?: { requireCameraPhoto?: boolean }
): AssessmentErrors {
  const errors: AssessmentErrors = {}
  const prefix = `item_${index}`

  if (!data.model) errors[`${prefix}_model`] = '機種を選択してください'
  if (!data.storage) errors[`${prefix}_storage`] = '容量を選択してください'
  if (!data.rank) errors[`${prefix}_rank`] = 'ランクを選択してください'
  if (!data.batteryPercent && !data.isServiceState) {
    errors[`${prefix}_battery`] = 'バッテリー残量を入力してください'
  }
  if (!data.nwStatus) errors[`${prefix}_nwStatus`] = 'ネットワーク利用制限を選択してください'
  if (data.cameraStain === '') errors[`${prefix}_cameraStain`] = 'カメラ染みを選択してください'
  if (data.cameraBroken === '') errors[`${prefix}_cameraBroken`] = 'カメラ窓の破損を選択してください'
  if (data.repairHistory === '') errors[`${prefix}_repairHistory`] = '非正規修理の利用歴を選択してください'

  if (options?.requireCameraPhoto && !data.cameraPhoto) {
    errors[`${prefix}_cameraPhoto`] = 'カメラ部分の写真を撮影してください'
  }

  return errors
}

// =====================================================
// 空のデータ作成関数
// =====================================================

export function createEmptyAssessmentData(): AssessmentData {
  return {
    model: '',
    modelDisplayName: '',
    storage: '',
    rank: '',
    batteryPercent: '',
    isServiceState: false,
    imei: '',
    nwStatus: '',
    cameraStain: '',
    cameraBroken: '',
    repairHistory: '',
    cameraPhoto: undefined,
    cameraStainPhotos: [],
  }
}
