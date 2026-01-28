import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    // Slack Webhook URL
    const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/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'

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
        // リッチフォーマット用（オプション）
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message.replace(/\n/g, '\n'),
            },
          },
        ],
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
