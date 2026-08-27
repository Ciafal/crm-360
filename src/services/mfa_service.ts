import pb from '@/lib/pocketbase/client'

export interface MfaRequestResult {
  success: boolean
  message?: string
  is_qas_fixed_active?: boolean
  error?: string
}

export interface MfaVerifyResult {
  valid: boolean
  mfa_mode?: 'FIXED_QAS' | 'REAL_OTP' | string
  message?: string
  error?: string
}

/**
 * Utilitário para verificar se o ambiente atual tem Fixed OTP habilitado.
 * Regra Estrita: Em produção (`APP_ENV=production` ou `APP_ENV=prod`),
 * `isFixedTestOtpEnabled()` retorna SEMPRE `false`, independente de `ENABLE_FIXED_TEST_OTP`.
 */
export function isFixedTestOtpEnabled(): boolean {
  const getEnvVal = (key: string): string | undefined => {
    try {
      if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
        return process.env[key]
      }
    } catch {
      /* ignore */
    }
    return undefined
  }

  const appEnv = (
    getEnvVal('APP_ENV') ||
    getEnvVal('VITE_APP_ENV') ||
    import.meta.env.VITE_APP_ENV ||
    import.meta.env.APP_ENV ||
    import.meta.env.MODE ||
    'qas'
  )
    .toString()
    .trim()
    .toLowerCase()

  const isProduction = appEnv === 'production' || appEnv === 'prod'

  // Em produção, fixed OTP é estritamente proibido
  if (isProduction) {
    return false
  }

  const rawEnable =
    getEnvVal('ENABLE_FIXED_TEST_OTP') ||
    getEnvVal('VITE_ENABLE_FIXED_TEST_OTP') ||
    import.meta.env.VITE_ENABLE_FIXED_TEST_OTP ||
    import.meta.env.ENABLE_FIXED_TEST_OTP ||
    'true'

  const enableFixedOtp = rawEnable.toString().trim().toLowerCase() === 'true'

  return enableFixedOtp
}

export function getFixedTestOtpCode(): string {
  if (!isFixedTestOtpEnabled()) return ''
  const getEnvVal = (key: string): string | undefined => {
    try {
      if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
        return process.env[key]
      }
    } catch {
      /* ignore */
    }
    return undefined
  }

  return (
    getEnvVal('FIXED_TEST_OTP') ||
    getEnvVal('VITE_FIXED_TEST_OTP') ||
    import.meta.env.VITE_FIXED_TEST_OTP ||
    import.meta.env.FIXED_TEST_OTP ||
    '123456'
  ).toString()
}

/**
 * In-memory rate limiting para tentativas de MFA por email
 * Máximo 5 tentativas consecutivas dentro da janela de 15 minutos
 */
interface RateLimitEntry {
  attempts: number
  lockedUntil?: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const MAX_MFA_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutos

export function checkRateLimit(email: string): { allowed: boolean; error?: string } {
  const normalized = (email || '').trim().toLowerCase()
  if (!normalized) return { allowed: true }

  const entry = rateLimitMap.get(normalized)
  if (!entry) return { allowed: true }

  const now = Date.now()

  // Se bloqueado, verificar se a janela de 15 minutos já expirou
  if (entry.lockedUntil && entry.lockedUntil > now) {
    const minutesLeft = Math.ceil((entry.lockedUntil - now) / 60000)
    return {
      allowed: false,
      error: `Limite de tentativas de MFA excedido. Por segurança, tente novamente em ${minutesLeft} minutos.`,
    }
  }

  if (entry.lockedUntil && entry.lockedUntil <= now) {
    // Janela expirou, reseta o rate limit
    rateLimitMap.delete(normalized)
    return { allowed: true }
  }

  if (entry.attempts >= MAX_MFA_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS
    return {
      allowed: false,
      error: 'Limite de tentativas de MFA excedido. Por segurança, tente novamente em 15 minutos.',
    }
  }

  return { allowed: true }
}

export function recordFailedAttempt(email: string): void {
  const normalized = (email || '').trim().toLowerCase()
  if (!normalized) return

  const now = Date.now()
  const entry = rateLimitMap.get(normalized) || { attempts: 0 }

  if (entry.lockedUntil && entry.lockedUntil <= now) {
    entry.attempts = 1
    entry.lockedUntil = undefined
  } else {
    entry.attempts += 1
  }

  if (entry.attempts >= MAX_MFA_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS
  }

  rateLimitMap.set(normalized, entry)
}

export function resetRateLimit(email: string): void {
  const normalized = (email || '').trim().toLowerCase()
  if (normalized) {
    rateLimitMap.delete(normalized)
  }
}

/**
 * Registra log de auditoria no PocketBase sem registrar o código OTP (REDACTED)
 */
export async function logMfaAudit(
  email: string,
  mfaMode: 'FIXED_QAS' | 'REAL_OTP',
  success: boolean,
  actionDesc: string,
): Promise<void> {
  const normalizedEmail = (email || '').trim().toLowerCase()
  try {
    await pb.collection('mock_emails').create({
      recipient: normalizedEmail,
      subject: `Auditoria MFA: ${actionDesc}`,
      otp_code: '[REDACTED]',
      status: success ? 'USED' : 'FAILED_ATTEMPT',
      metadata_json: {
        mfa_mode: mfaMode,
        success,
        timestamp: new Date().toISOString(),
      },
    })
  } catch {
    // Falha silenciosa em caso de offline/mock sem banco
  }
}

/**
 * Verifica se um usuário necessita do passo de MFA
 */
export function requiresMfa(email: string, role?: string): boolean {
  const normalized = (email || '').trim().toLowerCase()
  // Usuários de teste e perfis com obrigatoriedade de MFA
  if (
    normalized === 'representante.teste@crm360.local' ||
    normalized === 'admin.teste@ciafal.local' ||
    normalized === 'supervisor.teste@ciafal.local' ||
    normalized === 'vendedor.teste@ciafal.local' ||
    normalized === 'vendedor2.teste@ciafal.local' ||
    role === 'representante_externo'
  ) {
    return true
  }
  return false
}

/**
 * Solicita emissão de OTP
 */
export async function requestMfaOtp(email: string): Promise<MfaRequestResult> {
  const normalizedEmail = (email || '').trim().toLowerCase()
  const isFixed = isFixedTestOtpEnabled()

  // Se fixed OTP estiver ativo (QAS/HML)
  if (isFixed) {
    const fixedCode = getFixedTestOtpCode()
    try {
      await pb.collection('mock_emails').create({
        recipient: normalizedEmail,
        subject: 'Seu código de acesso MFA — CRM 360º (QAS)',
        otp_code: fixedCode,
        status: 'VALID',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        metadata_json: {
          purpose: 'MFA_LOGIN',
          channel: 'MOCK_EMAIL',
          mfa_mode: 'FIXED_QAS',
        },
      })
    } catch {
      /* ignore */
    }

    return {
      success: true,
      message: 'Código de verificação gerado para o ambiente de testes.',
      is_qas_fixed_active: true,
    }
  }

  // Em produção / OTP dinâmico: gera OTP de 6 dígitos
  const dynamicOtp = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  try {
    await pb.collection('mock_emails').create({
      recipient: normalizedEmail,
      subject: 'Seu código de acesso MFA — CRM 360º',
      otp_code: dynamicOtp,
      status: 'VALID',
      expires_at: expiresAt,
      metadata_json: {
        purpose: 'MFA_LOGIN',
        channel: 'MOCK_EMAIL',
        mfa_mode: 'REAL_DYNAMIC',
      },
    })
  } catch {
    /* ignore */
  }

  return {
    success: true,
    message: 'Código de verificação enviado.',
    is_qas_fixed_active: false,
  }
}

/**
 * Valida o código OTP diretamente no frontend com auditoria e rate limiting
 */
export async function verifyOtp(email: string, otp: string): Promise<MfaVerifyResult> {
  const normalizedEmail = (email || '').trim().toLowerCase()
  const trimmedCode = (otp || '').trim()

  if (!normalizedEmail || !trimmedCode) {
    return { valid: false, error: 'E-mail e código OTP são obrigatórios' }
  }

  // 1. Rate Limiting Check
  const rateCheck = checkRateLimit(normalizedEmail)
  if (!rateCheck.allowed) {
    await logMfaAudit(
      normalizedEmail,
      isFixedTestOtpEnabled() ? 'FIXED_QAS' : 'REAL_OTP',
      false,
      'RATE_LIMIT_EXCEEDED',
    )
    return {
      valid: false,
      error:
        rateCheck.error ||
        'Limite de tentativas de MFA excedido. Por segurança, tente novamente em 15 minutos.',
    }
  }

  // 2. Verificação de QAS Fixed OTP
  if (isFixedTestOtpEnabled()) {
    const fixedCode = getFixedTestOtpCode()
    if (trimmedCode === fixedCode) {
      resetRateLimit(normalizedEmail)
      await logMfaAudit(normalizedEmail, 'FIXED_QAS', true, 'Login com sucesso via FIXED_QAS')
      return {
        valid: true,
        mfa_mode: 'FIXED_QAS',
        message: 'MFA validado com sucesso via OTP QAS.',
      }
    } else {
      recordFailedAttempt(normalizedEmail)
      await logMfaAudit(normalizedEmail, 'FIXED_QAS', false, 'Código inválido (FIXED_QAS)')
      return {
        valid: false,
        error: 'Código inválido',
      }
    }
  }

  // 3. Produção ou Fixed OTP Desabilitado: Validação com OTP dinâmico
  try {
    const records = await pb.collection('mock_emails').getList(1, 5, {
      filter: `recipient = '${normalizedEmail}' && status = 'VALID'`,
      sort: '-created',
    })

    const matching = records.items.find((r: any) => r.otp_code === trimmedCode)
    if (matching) {
      try {
        await pb.collection('mock_emails').update(matching.id, {
          status: 'USED',
        })
      } catch {
        /* ignore */
      }

      resetRateLimit(normalizedEmail)
      await logMfaAudit(normalizedEmail, 'REAL_OTP', true, 'Login com sucesso (PROD/REAL)')

      return {
        valid: true,
        mfa_mode: 'REAL_OTP',
        message: 'MFA validado com sucesso.',
      }
    }
  } catch {
    /* ignore */
  }

  // Se não coincidiu com nenhum código válido dinâmico
  recordFailedAttempt(normalizedEmail)
  await logMfaAudit(normalizedEmail, 'REAL_OTP', false, 'Código inválido ou expirado (PROD/REAL)')

  return {
    valid: false,
    error: 'Código inválido',
  }
}

/**
 * Alias de compatibilidade com a UI existente
 */
export const verifyMfaOtp = verifyOtp
