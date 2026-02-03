import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL_TRANSFER

    if (!SLACK_WEBHOOK_URL) {
      console.error('SLACK_WEBHOOK_URL is not set')
      return NextResponse.json({ success: false, error: 'Webhook URL not configured' }, { status: 500 })
    }

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Slack webhook error:', error)
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Slack send error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}