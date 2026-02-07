import { NextRequest, NextResponse } from 'next/server'
import iconv from 'iconv-lite'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // UTF-8からShift-JISに変換
    const sjisBuffer = iconv.encode(content, 'Shift_JIS')

    // BufferをUint8Arrayに変換
    const uint8Array = new Uint8Array(sjisBuffer)

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'text/csv; charset=Shift_JIS',
        'Content-Disposition': 'attachment; filename="template.csv"',
      },
    })
  } catch (error) {
    console.error('Shift-JIS conversion error:', error)
    return NextResponse.json(
      { error: 'Conversion failed' },
      { status: 500 }
    )
  }
}
