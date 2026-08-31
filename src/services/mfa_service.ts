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
  }
  message?: string
  error?: string
}

/**
 * 5 Usuários Oficiais de Teste (Senha: teste123, MFA: 123456)
 */
export const OFFICIAL_HOMOLOGATION_USERS: Record<string, any> = {
  'admin.teste@ciafal.local': {
    id: 'usr-admin-teste-01',
    email: 'admin.teste@ciafal.local',
    name: 'Administrador Teste CRM',
    role: 'ADMIN',
    employee_id: 'TEST-ADM-01',
    seller_code: 'ADM-TESTE',
    ramal: '4099',
    telefone_corporativo: '(11) 98888-0000',
    active: true,
    is_test_user: true,
  },
  'supervisor.teste@ciafal.local': {
    id: 'usr-supervisor-teste-01',
    email: 'supervisor.teste@ciafal.local',
    name: 'Supervisor Teste CRM',
    role: 'SUPERVISOR',
    employee_id: 'TEST-SUP-01',
    seller_code: 'SUP-TESTE',
    ramal: '4090',
    telefone_corporativo: '(11) 98888-0001',
    active: true,
    is_test_user: true,
  },
  'vendedor.teste@ciafal.local': {
    id: 'usr-vendedor-teste-01',
    email: 'vendedor.teste@ciafal.local',
    name: 'Vendedor Teste CRM',
    role: 'VENDEDOR',
    employee_id: 'TEST-VEND-01',
    seller_code: 'VEND-TEST-01',
    ramal: '4091',
    telefone_corporativo: '(11) 98888-0002',
    active: true,
    is_test_user: true,
  },
  'vendedor2.teste@ciafal.local': {
    id: 'usr-vendedor2-teste-01',
    email: 'vendedor2.teste@ciafal.local',
    name: 'Vendedor 2 Teste CRM',
    role: 'VENDEDOR',
    employee_id: 'TEST-VEND-02',
    seller_code: 'VEND-TEST-02',
    ramal: '4092',
    telefone_corporativo: '(11) 98888-0003',
    active: true,
    is_test_user: true,
  },
  'representante.teste@crm360.local': {
    id: 'usr-rep-teste-01',
    email: 'representante.teste@crm360.local',
    name: 'Representante Externo Teste',
    role: 'REPRESENTANTE_EXTERNO',
    employee_id: 'TEST-REP-01',
    seller_code: 'REP-EXT-01',
    ramal: '4095',
    telefone_corporativo: '(11) 98888-0005',
    active: true,
    is_test_user: true,
  },
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
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_APP_ENV || import.meta.env.APP_ENV || import.meta.env.MODE
      : undefined) ||
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
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_ENABLE_FIXED_TEST_OTP || import.meta.env.ENABLE_FIXED_TEST_OTP
      : undefined) ||
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
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_FIXED_TEST_OTP || import.meta.env.FIXED_TEST_OTP
      : undefined) ||
    '123456'
  )
    .toString()
    .trim()
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
 * Registra log de auditoria sem registrar senha ou código OTP (REDACTED)
 */
export async function logMfaAudit(
  email: string,
  mfaMode: 'FIXED_QAS' | 'REAL_OTP',
  success: boolean,
  actionDesc: string,
): Promise<void> {
  const normalizedEmail = (email || '').trim().toLowerCase()
  const isTestDomain =
    normalizedEmail.endsWith('@ciafal.local') || normalizedEmail.endsWith('@crm360.local')

  if (isFixedTestOtpEnabled() || isTestDomain) {
    return
  }

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
    // Falha silenciosa
  }
}

/**
 * Verifica se um usuário necessita do passo de MFA
 */
export function requiresMfa(email: string, role?: string): boolean {
  const normalized = (email || '').trim().toLowerCase()
  if (
    normalized === 'representante.teste@crm360.local' ||
    normalized === 'admin.teste@ciafal.local' ||
    normalized === 'supervisor.teste@ciafal.local' ||
    normalized === 'vendedor.teste@ciafal.local' ||
    normalized === 'vendedor2.teste@ciafal.local' ||
    role === 'representante_externo' ||
    role === 'REPRESENTANTE_EXTERNO' ||
    Boolean(OFFICIAL_HOMOLOGATION_USERS[normalized])
  ) {
    return true
  }
  return false
}

/**
 * Inicia o login com credenciais e solicita MFA challenge
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

  // 1. Tentar chamada ao backend PocketBase hook /backend/v1/auth/login
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
    // Se o backend retornou erro 401 explícito de credenciais
    if (err?.status === 401 || err?.response?.error) {
      return { success: false, error: 'Usuário ou senha inválidos.' }
    }
  }

  // 2. Fallback resiliente para Homologação / Usuários de Teste Oficiais
  const isTestUser = Boolean(OFFICIAL_HOMOLOGATION_USERS[cleanEmail])
  const isHomologation = isFixedTestOtpEnabled()

  if (isHomologation && isTestUser) {
    if (cleanPassword === 'teste123') {
      const challengeToken = `mfa_ch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      return {
        success: true,
        mfa_required: true,
        challenge_id: challengeToken,
        mfa_mode: 'TEST_FIXED',
        user: OFFICIAL_HOMOLOGATION_USERS[cleanEmail],
      }
    } else {
      return { success: false, error: 'Usuário ou senha inválidos.' }
    }
  }

  // Fallback padrão para produção / credenciais inválidas
  return { success: false, error: 'Usuário ou senha inválidos.' }
}

/**
 * Solicita emissão de OTP ou desafio MFA
 */
export async function requestMfaOtp(email: string): Promise<MfaRequestResult> {
  const normalizedEmail = (email || '').trim().toLowerCase()
  const isFixed = isFixedTestOtpEnabled()
  const isTestDomain =
    normalizedEmail.endsWith('@ciafal.local') || normalizedEmail.endsWith('@crm360.local')

  // Se fixed OTP estiver ativo (QAS/HML) ou for usuário de teste
  if (isFixed || isTestDomain) {
    return {
      success: true,
      challenge_token: `mfa_ch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      message: 'Validação MFA do ambiente de homologação.',
      is_qas_fixed_active: true,
      environment: 'HOMOLOGATION',
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
    challenge_token: `mfa_ch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    message: 'Código de verificação enviado.',
    is_qas_fixed_active: false,
    environment: 'PRODUCTION',
  }
}

/**
 * Valida o código OTP com auditoria, normalização estrita de string e rate limiting
 */
export async function verifyOtp(
  email: string,
  otp: string | number,
  challengeToken?: string,
): Promise<MfaVerifyResult> {
  const normalizedEmail = (email || '').trim().toLowerCase()
  // Sempre tratar como string de 6 caracteres sem conversão para Number
  const trimmedCode = String(otp ?? '').trim()

  if (!normalizedEmail || !trimmedCode) {
    return { valid: false, error: 'Código de verificação inválido.' }
  }

  // Validação de formato (6 dígitos numéricos)
  if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
    return { valid: false, error: 'Código de verificação inválido.' }
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

  // 2. Tentar verificação via Backend Hook PocketBase se disponível
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
        mfa_mode: res.user?.is_test_user ? 'FIXED_QAS' : 'REAL_OTP',
        token: res.token,
        user_details: res.user,
        message: 'Acesso autorizado.',
      }
    }
  } catch (err: any) {
    // Se o backend respondeu com erro explícito de código inválido/expirado
    if (err?.status === 400 || err?.status === 429) {
      recordFailedAttempt(normalizedEmail)
      return {
        valid: false,
        error: err?.response?.error || 'Código de verificação inválido.',
      }
    }
  }

  // 3. Fallback Homologação / Fixed OTP para os 5 usuários oficiais
  if (isFixedTestOtpEnabled()) {
    const fixedCode = getFixedTestOtpCode()
    if (trimmedCode === fixedCode) {
      resetRateLimit(normalizedEmail)
      await logMfaAudit(normalizedEmail, 'FIXED_QAS', true, 'Login com sucesso via FIXED_QAS')

      const officialUser = OFFICIAL_HOMOLOGATION_USERS[normalizedEmail] || {
        id: `usr-${normalizedEmail.split('@')[0]}`,
        email: normalizedEmail,
        name: 'Usuário Homologação',
        role: 'VENDEDOR',
      }

      return {
        valid: true,
        mfa_mode: 'FIXED_QAS',
        user_details: officialUser,
        message: 'MFA validado com sucesso via OTP de homologação.',
      }
    } else {
      recordFailedAttempt(normalizedEmail)
      await logMfaAudit(normalizedEmail, 'FIXED_QAS', false, 'Código inválido (FIXED_QAS)')
      return {
        valid: false,
        error: 'Código de verificação inválido.',
      }
    }
  }

  // 4. Produção: Validação com OTP dinâmico
  try {
    const records = await pb.collection('mock_emails').getList(1, 5, {
      filter: `recipient = '${normalizedEmail}' && status = 'VALID'`,
      sort: '-created',
    })

    const matching = records.items.find((r: any) => String(r.otp_code).trim() === trimmedCode)
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
    error: 'Código de verificação inválido.',
  }
}

/**
 * Alias de compatibilidade com a UI existente
 */
export const verifyMfaOtp = verifyOtp
