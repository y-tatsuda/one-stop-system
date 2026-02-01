import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'documents'

    if (!file) {
      return NextResponse.json({ error: 'ファイルが指定されていません' }, { status: 400 })
    }

    // ファイルサイズチェック（10MB）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズが10MBを超えています' }, { status: 400 })
    }

    // MIMEタイプチェック
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '対応していないファイル形式です' }, { status: 400 })
    }

    // ファイル名生成
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    // ArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // アップロード
    const { data, error } = await supabaseAdmin.storage
      .from('buyback-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ path: data.path })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'アップロードに失敗しました' }, { status: 500 })
  }
}
