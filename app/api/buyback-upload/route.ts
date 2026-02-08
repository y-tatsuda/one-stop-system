/**
 * 買取フォーム用 公開アップロードAPI
 * - 認証不要（顧客向け）
 * - 許可されたフォルダのみアップロード可能
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 許可するフォルダ（買取関連のみ）
const ALLOWED_FOLDERS = ['camera-check', 'buyback-documents', 'id-documents']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'buyback-documents'

    console.log('📷 Upload request:', {
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      folder,
    })

    if (!file) {
      return NextResponse.json({ error: 'ファイルが指定されていません' }, { status: 400 })
    }

    // フォルダ制限チェック
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: '許可されていないフォルダです' }, { status: 403 })
    }

    // ファイルサイズチェック（10MB）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズが10MBを超えています' }, { status: 400 })
    }

    // MIMEタイプチェック（画像のみ許可）
    // 空のMIMEタイプも許可（ブラウザによってはHEICで空になる場合がある）
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', '']
    if (file.type && !allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type)
      return NextResponse.json({ error: `対応していないファイル形式です: ${file.type}` }, { status: 400 })
    }

    // ファイル名生成（拡張子から適切なContent-Typeを推測）
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    // 拡張子からContent-Typeを決定
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'heic': 'image/heic',
      'heif': 'image/heif',
    }
    const contentType = file.type || contentTypeMap[ext] || 'image/jpeg'

    // ArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('📤 Uploading:', { fileName, contentType, bufferSize: buffer.length })

    // アップロード
    const { data, error } = await supabaseAdmin.storage
      .from('buyback-documents')
      .upload(fileName, buffer, {
        contentType,
        upsert: false
      })

    if (error) {
      console.error('❌ Upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Upload success:', data.path)
    return NextResponse.json({ path: data.path })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'アップロードに失敗しました' }, { status: 500 })
  }
}
