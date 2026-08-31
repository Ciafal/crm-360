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
 * Em produção (APP_ENV=production ou prod), o modo de testes/OTP fixo é ESTRITAMENTE desativado.
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
    '123456'
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
const HOMOLOGATION_ACCOUNTS: Record<
  string,
  {
    id: string
    name: string
    role: 'ADMIN' | 'SUPERVISOR' | 'VENDEDOR' | 'REPRESENTANTE_EXTERNO'
    employee_id: string
    seller_code: string
    ramal: string
    telefone_corporativo: string
    manager_id: string
  }
> = {
  'admin.teste@ciafal.local': {
    id: 'usr-admin-teste-01',
    name: 'Carlos Alberto (Diretoria & Adm)',
    role: 'ADMIN',
    employee_id: 'TEST-ADM-01',
    seller_code: 'ADM-TESTE',
    ramal: '4099',
    telefone_corporativo: '(11) 98888-0000',
    manager_id: '',
  },
  'supervisor.teste@ciafal.local': {
    id: 'usr-supervisor-teste-01',
    name: 'Marcos Vinícius (Supervisor)',
    role: 'SUPERVISOR',
    employee_id: 'TEST-SUP-01',
    seller_code: 'SUP-TESTE',
    ramal: '4090',
    telefone_corporativo: '(11) 98888-0001',
    manager_id: '',
  },
  'vendedor.teste@ciafal.local': {
    id: 'usr-vendedor-teste-01',
    name: 'Carlos Mendonça',
    role: 'VENDEDOR',
    employee_id: 'TEST-VEND-01',
    seller_code: 'VEND-TEST-01',
    ramal: '4091',
    telefone_corporativo: '(11) 98888-0002',
    manager_id: 'supervisor.teste@ciafal.local',
  },
  'vendedor2.teste@ciafal.local': {
    id: 'usr-vendedor2-teste-01',
    name: 'Mariana Azevedo',
    role: 'VENDEDOR',
    employee_id: 'TEST-VEND-02',
    seller_code: 'VEND-TEST-02',
    ramal: '4092',
    telefone_corporativo: '(11) 98888-0003',
    manager_id: 'supervisor.teste@ciafal.local',
  },
  'representante.teste@crm360.local': {
    id: 'usr-rep-teste-01',
    name: 'João Pedro Representações',
    role: 'REPRESENTANTE_EXTERNO',
    employee_id: 'TEST-REP-01',
    seller_code: 'REP-EXT-01',
    ramal: '4095',
    telefone_corporativo: '(11) 98888-0005',
    manager_id: '',
  },
}

/**
 * Inicia o login com credenciais (validação e geração de challenge)
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

  // 1. Tentar autenticação via hook do PocketBase (/backend/v1/auth/login) se disponível
  try {
    const res = await pb.send('/backend/v1/auth/login', {
      method: 'POST',
      body: { email: cleanEmail, password: cleanPassword },
    })

    if (res && res.success) {
      return {
        success: true,
        mfa_required: true,
        challenge_id: res.challenge_id,
        mfa_mode: res.mfa_mode,
        user: res.user,
      }
    }
  } catch (err: any) {
    if (err?.status === 401 || err?.status === 403) {
      return { success: false, error: err?.response?.error || 'Usuário ou senha inválidos.' }
    }
  }

  // 2. Tentar autenticação direta via PocketBase SDK authWithPassword
  try {
    const authRes = await pb.collection('users').authWithPassword(cleanEmail, cleanPassword)
    if (authRes && authRes.record) {
      const rec = authRes.record
      const challengeToken = `mfa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      return {
        success: true,
        mfa_required: true,
        challenge_id: challengeToken,
        mfa_mode: rec.is_test_user ? 'TEST_FIXED' : 'REAL_OTP',
        user: {
          id: rec.id,
          email: rec.email,
          name: rec.name || 'Colaborador CIAFAL',
          role: (rec.role || 'VENDEDOR').toUpperCase(),
          employee_id: rec.employee_id,
          seller_code: rec.seller_code,
          ramal: rec.ramal,
          telefone_corporativo: rec.telefone_corporativo,
          active: rec.active !== false,
          is_test_user: rec.is_test_user === true,
        },
      }
    }
  } catch {
    /* ignore fallback error */
  }

  // 3. Fallback controlado para ambiente de HOMOLOGAÇÃO com os 5 usuários oficiais de teste
  // Ocorre de forma segura APENAS fora de produção
  const isHomologation = isFixedTestOtpEnabled()
  if (isHomologation && HOMOLOGATION_ACCOUNTS[cleanEmail]) {
    // Validar senha de homologação
    if (cleanPassword === 'teste123') {
      const account = HOMOLOGATION_ACCOUNTS[cleanEmail]
      const challengeToken = `mfa_hml_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      return {
        success: true,
        mfa_required: true,
        challenge_id: challengeToken,
        mfa_mode: 'TEST_FIXED',
        user: {
          id: account.id,
          email: cleanEmail,
          name: account.name,
          role: account.role,
          employee_id: account.employee_id,
          seller_code: account.seller_code,
          ramal: account.ramal,
          telefone_corporativo: account.telefone_corporativo,
          active: true,
          is_test_user: true,
          environment: 'HOMOLOGAÇÃO',
        },
      }
    }
  }

  return { success: false, error: 'Usuário ou senha inválidos.' }
}

/**
 * Solicita reemissão de desafio MFA
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
 * Valida o código OTP (tratado estritamente como string de 6 dígitos)
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

  // Rate Limiting Check
  const rateCheck = checkRateLimit(normalizedEmail)
  if (!rateCheck.allowed) {
    return {
      valid: false,
      error:
        rateCheck.error ||
        'Limite de tentativas de MFA excedido. Por segurança, tente novamente em 15 minutos.',
    }
  }

  // 1. Chamada ao endpoint real do Backend PocketBase (/backend/v1/auth/verify-mfa)
  try {
    const res = await pb.send('/backend/v1/auth/verify-mfa', {
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
        message: 'Acesso autorizado.',
      }
    }
  } catch (err: any) {
    if (err?.status === 400 || err?.status === 429) {
      recordFailedAttempt(normalizedEmail)
      return {
        valid: false,
        error: err?.response?.error || 'Código de verificação inválido.',
      }
    }
  }

  // 2. Validação para ambiente de HOMOLOGAÇÃO (usuários de teste oficiais e OTP 123456)
  if (isFixedTestOtpEnabled()) {
    const fixedCode = getFixedTestOtpCode()
    const isOfficialTestUser =
      Boolean(HOMOLOGATION_ACCOUNTS[normalizedEmail]) || normalizedEmail.endsWith('.local')

    if (trimmedCode === fixedCode && isOfficialTestUser) {
      resetRateLimit(normalizedEmail)
      const account = HOMOLOGATION_ACCOUNTS[normalizedEmail]
      return {
        valid: true,
        mfa_mode: 'FIXED_QAS',
        user_details: account
          ? {
              id: account.id,
              email: normalizedEmail,
              name: account.name,
              role: account.role,
              employee_id: account.employee_id,
              seller_code: account.seller_code,
              ramal: account.ramal,
              telefone_corporativo: account.telefone_corporativo,
              active: true,
              is_test_user: true,
              environment: 'HOMOLOGAÇÃO',
            }
          : undefined,
        message: 'MFA validado com sucesso via OTP de homologação.',
      }
    } else {
      recordFailedAttempt(normalizedEmail)
      return {
        valid: false,
        error: 'Código de verificação inválido.',
      }
    }
  }

  recordFailedAttempt(normalizedEmail)
  return {
    valid: false,
    error: 'Código de verificação inválido.',
  }
}

/**
 * Alias de compatibilidade
 */
export const verifyMfaOtp = verifyOtp
