import { supabaseAdmin } from './supabase-admin'

// 型定義
export interface Staff {
  id: number
  tenant_id: number
  auth_user_id: string | null
  email: string | null
  name: string
  role: 'owner' | 'admin' | 'staff'
  is_2fa_enabled: boolean
  is_active: boolean
  last_login_at: string | null
  password_changed?: boolean
}

export interface AuthResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

// OTP生成
export async function generateOTP(staffId: number): Promise<string | null> {
  const { data, error } = await supabaseAdmin.rpc('generate_otp', {
    p_staff_id: staffId
  })

  if (error) {
    console.error('OTP生成エラー:', error)
    return null
  }

  return data
}

// OTP検証
export async function verifyOTP(staffId: number, otpCode: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('verify_otp', {
    p_staff_id: staffId,
    p_otp: otpCode
  })

  if (error) {
    console.error('OTP検証エラー:', error)
    return false
  }

  return data === true
}

// 認証コードをメール送信
export async function sendOTPEmail(email: string, otpCode: string): Promise<boolean> {
  try {
    // 開発環境ではコンソールにも出力
    console.log(`📧 OTP送信: ${email} → ${otpCode}`)

    // Resendでメール送信
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const { error } = await resend.emails.send({
      from: 'ONE STOP <noreply@nichellc.net>',
      to: email,
      subject: '【ONE STOP】ログイン認証コード',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">ログイン認証コード</h2>
          <p>以下の認証コードを入力してください。</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #333;">${otpCode}</span>
          </div>
          <p style="color: #666;">このコードは5分間有効です。</p>
          <p style="color: #999; font-size: 12px;">心当たりがない場合は、このメールを無視してください。</p>
        </div>
      `
    })

    if (error) {
      console.error('Resendエラー:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('メール送信エラー:', error)
    return false
  }
}

// メールでスタッフを検索
export async function getStaffByEmail(email: string): Promise<Staff | null> {
  console.log('🔍 getStaffByEmail called with:', email)
  
  const { data, error } = await supabaseAdmin
    .from('m_staff')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single()

  console.log('🔍 Query result - data:', data)
  console.log('🔍 Query result - error:', error)

  if (error || !data) {
    console.log('❌ Staff not found or error occurred')
    return null
  }

  console.log('✅ Staff found:', data.name)
  return data as Staff
}

// スタッフIDでスタッフを検索
export async function getStaffById(staffId: number): Promise<Staff | null> {
  const { data, error } = await supabaseAdmin
    .from('m_staff')
    .select('*')
    .eq('id', staffId)
    .single()

  if (error || !data) {
    return null
  }

  return data as Staff
}

// Auth User IDでスタッフを検索
export async function getStaffByAuthUserId(authUserId: string): Promise<Staff | null> {
  const { data, error } = await supabaseAdmin
    .from('m_staff')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single()

  if (error || !data) {
    return null
  }

  return data as Staff
}

// 招待トークンでスタッフを検索
export async function getStaffByInvitationToken(token: string): Promise<Staff | null> {
  const { data, error } = await supabaseAdmin
    .from('m_staff')
    .select('*')
    .eq('invitation_token', token)
    .gt('invitation_expires_at', new Date().toISOString())
    .single()

  if (error || !data) {
    return null
  }

  return data as Staff
}

// 認証ログを記録
export async function logAuthAction(
  staffId: number | null,
  email: string | null,
  action: string,
  status: 'success' | 'failure',
  ipAddress?: string,
  userAgent?: string,
  errorMessage?: string
): Promise<void> {
  await supabaseAdmin.rpc('log_auth_action', {
    p_staff_id: staffId,
    p_email: email,
    p_action: action,
    p_status: status,
    p_ip_address: ipAddress || null,
    p_user_agent: userAgent || null,
    p_error_message: errorMessage || null
  })
}

// ログイン試行回数チェック（ブルートフォース対策）
export async function checkLoginAttempts(email: string, ipAddress: string): Promise<{
  allowed: boolean
  remainingAttempts: number
  lockedUntil?: Date
}> {
  const { data } = await supabaseAdmin
    .from('t_auth_login_attempts')
    .select('*')
    .eq('email', email)
    .single()

  if (!data) {
    return { allowed: true, remainingAttempts: 5 }
  }

  if (data.locked_until && new Date(data.locked_until) > new Date()) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: new Date(data.locked_until)
    }
  }

  if (data.locked_until && new Date(data.locked_until) <= new Date()) {
    await supabaseAdmin
      .from('t_auth_login_attempts')
      .delete()
      .eq('email', email)
    return { allowed: true, remainingAttempts: 5 }
  }

  const remaining = 5 - data.attempt_count
  return {
    allowed: remaining > 0,
    remainingAttempts: Math.max(0, remaining)
  }
}

// ログイン失敗を記録
export async function recordLoginFailure(email: string, ipAddress: string): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from('t_auth_login_attempts')
    .select('*')
    .eq('email', email)
    .single()

  if (existing) {
    const newCount = existing.attempt_count + 1
    const locked_until = newCount >= 5
      ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
      : null

    await supabaseAdmin
      .from('t_auth_login_attempts')
      .update({
        attempt_count: newCount,
        locked_until,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
  } else {
    await supabaseAdmin
      .from('t_auth_login_attempts')
      .insert({
        email,
        ip_address: ipAddress,
        attempt_count: 1
      })
  }
}

// ログイン成功時にカウントをリセット
export async function clearLoginAttempts(email: string): Promise<void> {
  await supabaseAdmin
    .from('t_auth_login_attempts')
    .delete()
    .eq('email', email)
}

// パスワードバリデーション
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('パスワードは8文字以上必要です')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('小文字を含めてください')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('大文字を含めてください')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('数字を含めてください')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// 招待メール送信
export async function sendInvitationEmail(
  email: string,
  staffName: string,
  invitationToken: string
): Promise<boolean> {
  try {
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite?token=${invitationToken}`

    // 開発環境ではコンソールに出力
    console.log(`📧 招待メール送信: ${email}`)
    console.log(`   招待URL: ${invitationUrl}`)

    return true
  } catch (error) {
    console.error('招待メール送信エラー:', error)
    return false
  }
}
