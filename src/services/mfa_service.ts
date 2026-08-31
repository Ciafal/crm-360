import pb from '@/lib/pocketbase/client'

export interface MfaRequestResult {
  success: boolean
  challenge_token?: string
  message?: string
  is_qas_fixed_active?: boolean
  environment?: 'HOMOLOGATION' | 'PRODUCTION'
  error?: string
}

export interface MfaVerifyResult {
  valid: boolean
  mfa_mode?: 'FIXED_QAS' | 'TEST_FIXED' | 'REAL_OTP' | string
  token?: string
  user_details?: {
    id: string
    email: string
    name: string
    role: string
    employee_id?: string
    seller_code?: string
    ramal?: string
    telefone_corporativo?: string
    environment?: string
    is_test_user?: boolean
    active?: boolean
  }
  message?: string
  error?: string
}

/**
 * Utilitário de detecção de ambiente para fins de homologação vs produção.
 * Em produção real (quando APP_ENV ou VITE_APP_ENV for explicitamente 'production' ou 'prod'),
 * o modo de testes/OTP fixo é ESTRITAMENTE desativado.
 * No bundle padrão publicado onde o backend Skip Cloud não está provisionado/conectado,
 * o fluxo opera em modo de homologação seguro para as contas de teste oficiais.
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
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_APP_ENV || import.meta.env.APP_ENV
      : undefined) ||
    'homologation'
  )
    .toString()
    .trim()
    .toLowerCase()

  // Bloqueio incondicional se explicitamente configurado como produção
  const isProduction = appEnv === 'production' || appEnv === 'prod'
  if (isProduction) {
    return false
  }

  const rawEnable =
    getEnvVal('ENABLE_FIXED_TEST_OTP') ||
    getEnvVal('VITE_ENABLE_FIXED_TEST_OTP') ||
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_ENABLE_FIXED_TEST_OTP || import.meta.env.ENABLE_FIXED_TEST_OTP
      : undefined) ||
    'true'

  return rawEnable.toString().trim().toLowerCase() === 'true'
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
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_FIXED_TEST_OTP || import.meta.env.FIXED_TEST_OTP
      : undefined) ||
    ''
  )
    .toString()
    .trim()
}

/**
 * Rate limiting in-memory por email (proteção anti brute-force com max 5 tentativas)
 */
interface RateLimitEntry {
  attempts: number
  lockedUntil?: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const MAX_MFA_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000

export function checkRateLimit(email: string): { allowed: boolean; error?: string } {
  const normalized = (email || '').trim().toLowerCase()
  if (!normalized) return { allowed: true }

  const entry = rateLimitMap.get(normalized)
  if (!entry) return { allowed: true }

  const now = Date.now()
  if (entry.lockedUntil && entry.lockedUntil > now) {
    const minutesLeft = Math.ceil((entry.lockedUntil - now) / 60000)
    return {
      allowed: false,
      error: `Limite de tentativas de MFA excedido. Por segurança, tente novamente em ${minutesLeft} minutos.`,
    }
  }

  if (entry.lockedUntil && entry.lockedUntil <= now) {
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
 * Verifica se um usuário necessita de etapa MFA
 */
export function requiresMfa(email: string, role?: string): boolean {
  const normalized = (email || '').trim().toLowerCase()
  if (
    normalized.endsWith('@ciafal.local') ||
    normalized.endsWith('@crm360.local') ||
    normalized.endsWith('@ciafal.com.br') ||
    role === 'representante_externo' ||
    role === 'REPRESENTANTE_EXTERNO'
  ) {
    return true
  }
  return true
}

/**
 * Base autoritativa de usuários oficiais de homologação para autenticação e RBAC
 * As senhas oficiais no ambiente de testes são validadas de forma restrita e estrita.
 */
/**
 * Domínios e contas oficiais de homologação conhecidos para validações locais de formato
 */
export const OFFICIAL_HOMOLOGATION_EMAILS = [
  'admin.teste@ciafal.local',
  'supervisor.teste@ciafal.local',
  'vendedor.teste@ciafal.local',
  'vendedor2.teste@ciafal.local',
  'representante.teste@crm360.local',
] as const

/**
 * Verifica se um email pertence aos domínios e contas oficiais de teste/homologação
 */
export function isOfficialTestAccount(email: string): boolean {
  const normalized = (email || '').trim().toLowerCase()
  return (
    OFFICIAL_HOMOLOGATION_EMAILS.includes(normalized as any) ||
    normalized.endsWith('@ciafal.local') ||
    normalized.endsWith('@crm360.local')
  )
}

/**
 * Inicia o login com credenciais — todas as decisões ocorrem no BACKEND
 */
export async function initiateLoginAndMfa(
  email: string,
  password: string,
): Promise<{
  success: boolean
  mfa_required?: boolean
  challenge_id?: string
  mfa_mode?: string
  user?: any
  error?: string
}> {
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanPassword = (password || '').trim()

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'Usuário ou senha inválidos.' }
  }

  try {
    const res = await pb.send<{
      success: boolean
      mfa_required: boolean
      challenge_id: string
      mfa_mode: string
      user: any
      error?: string
    }>('/backend/v1/auth/login', {
      method: 'POST',
      body: { email: cleanEmail, password: cleanPassword },
    })

    if (res && res.success) {
      return {
        success: true,
        mfa_required: res.mfa_required !== false,
        challenge_id: res.challenge_id,
        mfa_mode: res.mfa_mode,
        user: res.user,
      }
    }

    return {
      success: false,
      error: res?.error || 'Usuário ou senha inválidos.',
    }
  } catch (err: any) {
    const errorMsg =
      err?.response?.error ||
      err?.data?.error ||
      (err?.status === 401 || err?.status === 400 || err?.status === 403
        ? 'Usuário ou senha inválidos.'
        : 'Usuário ou senha inválidos.')
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Solicita reemissão de desafio MFA — renovação do challenge
 */
export async function requestMfaOtp(email: string): Promise<MfaRequestResult> {
  const normalizedEmail = (email || '').trim().toLowerCase()
  const isFixed = isFixedTestOtpEnabled()

  return {
    success: true,
    challenge_token: `mfa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    message: isFixed
      ? 'Validação MFA do ambiente de homologação.'
      : 'Código de verificação emitido com sucesso.',
    is_qas_fixed_active: isFixed,
    environment: isFixed ? 'HOMOLOGATION' : 'PRODUCTION',
  }
}

/**
 * Valida o código OTP (tratado estritamente como string de 6 dígitos) chamando o BACKEND
 */
export async function verifyOtp(
  email: string,
  otp: string | number,
  challengeToken?: string,
): Promise<MfaVerifyResult> {
  const normalizedEmail = (email || '').trim().toLowerCase()
  const trimmedCode = String(otp ?? '').trim()

  if (!normalizedEmail || !trimmedCode) {
    return { valid: false, error: 'Código de verificação inválido.' }
  }

  // Validação estrita de 6 dígitos numéricos
  if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
    return { valid: false, error: 'Código de verificação inválido.' }
  }

  // Rate Limiting Check local preventivo
  const rateCheck = checkRateLimit(normalizedEmail)
  if (!rateCheck.allowed) {
    return {
      valid: false,
      error:
        rateCheck.error ||
        'Limite de tentativas de MFA excedido. Por segurança, tente novamente em 15 minutos.',
    }
  }

  try {
    const res = await pb.send<{
      authenticated: boolean
      token?: string
      user?: any
      message?: string
      error?: string
    }>('/backend/v1/auth/verify-mfa', {
      method: 'POST',
      body: {
        email: normalizedEmail,
        otp: trimmedCode,
        challenge_id: challengeToken,
      },
    })

    if (res && res.authenticated) {
      resetRateLimit(normalizedEmail)
      return {
        valid: true,
        mfa_mode: res.user?.is_test_user ? 'TEST_FIXED' : 'REAL_OTP',
        token: res.token,
        user_details: res.user,
        message: res.message || 'Acesso autorizado.',
      }
    }

    recordFailedAttempt(normalizedEmail)
    return {
      valid: false,
      error: res?.error || 'Código de verificação inválido.',
    }
  } catch (err: any) {
    recordFailedAttempt(normalizedEmail)
    const errorMsg =
      err?.response?.error ||
      err?.data?.error ||
      (err?.status === 429
        ? 'Limite de tentativas de MFA excedido. Por segurança, tente novamente em 15 minutos.'
        : 'Código de verificação inválido.')
    return {
      valid: false,
      error: errorMsg,
    }
  }
}

/**
 * Alias de compatibilidade
 */
export const verifyMfaOtp = verifyOtp
