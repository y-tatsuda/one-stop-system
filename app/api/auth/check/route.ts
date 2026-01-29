import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')

  if (!authToken) {
    return NextResponse.json({ authenticated: false })
  }

  try {
    const tokenData = JSON.parse(Buffer.from(authToken.value, 'base64').toString())
    
    if (tokenData.exp < Date.now()) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({ 
      authenticated: true,
      staff: {
        id: tokenData.staffId,
        name: tokenData.name,
        email: tokenData.email,
        role: tokenData.role
      }
    })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}