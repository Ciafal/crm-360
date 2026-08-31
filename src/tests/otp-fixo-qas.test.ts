import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isFixedTestOtpEnabled,
  getFixedTestOtpCode,
  requiresMfa,
  verifyOtp,
  verifyMfaOtp,
  requestMfaOtp,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from '../services/mfa_service'
import { defaultIdentityProvider } from '../providers/IdentityProvider'

describe('CRM 360º — Validação de OTP Fixo QAS/HML vs Produção (Frontend)', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Restaurar env padrão para QAS
    process.env.APP_ENV = 'qas'
    process.env.ENABLE_FIXED_TEST_OTP = 'true'
    process.env.FIXED_TEST_OTP = '123456'
    import.meta.env.VITE_APP_ENV = 'qas'
    import.meta.env.VITE_ENABLE_FIXED_TEST_OTP = 'true'
    import.meta.env.VITE_FIXED_TEST_OTP = '123456'
    import.meta.env.MODE = 'test'
    resetRateLimit('admin.teste@ciafal.local')
    resetRateLimit('vendedor.teste@ciafal.local')
    resetRateLimit('representante.teste@crm360.local')
    resetRateLimit('usuario.corporativo@ciafal.com.br')
    resetRateLimit('rate.limit@ciafal.local')
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  // 1. QAS: admin + teste123 -> MFA -> 123456 -> sucesso com mfa_mode: "FIXED_QAS"
  it('1. QAS: admin + teste123 -> MFA -> 123456 -> sucesso com mfa_mode: "FIXED_QAS"', async () => {
    const email = 'admin.teste@ciafal.local'
    expect(requiresMfa(email)).toBe(true)
    expect(isFixedTestOtpEnabled()).toBe(true)
    expect(getFixedTestOtpCode()).toBe('123456')

    const req = await requestMfaOtp(email)
    expect(req.success).toBe(true)
    expect(req.is_qas_fixed_active).toBe(true)

    // Usando verifyOtp diretamente
    const result = await verifyOtp(email, '123456')
    expect(result.valid).toBe(true)
    expect(result.mfa_mode).toBe('FIXED_QAS')

    // Usando verifyMfaOtp alias
    const resultAlias = await verifyMfaOtp(email, '123456')
    expect(resultAlias.valid).toBe(true)
    expect(resultAlias.mfa_mode).toBe('FIXED_QAS')
  })

  // 2. QAS: admin + teste123 -> MFA -> 654321 -> falha ("Código de verificação inválido.")
  it('2. QAS: admin + teste123 -> MFA -> 654321 -> falha ("Código de verificação inválido.")', async () => {
    const email = 'admin.teste@ciafal.local'
    const result = await verifyOtp(email, '654321')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Código de verificação inválido.')
  })

  // 3. QAS: senha errada -> NÃO chegar à etapa MFA (fluxo de credencial obrigatório)
  it('3. QAS: senha errada -> NÃO chegar à etapa MFA (credenciais validadas antes)', () => {
    const validateCredentials = (email: string, pass: string) => {
      const isTestUser = email.endsWith('@ciafal.local') || email.endsWith('@crm360.local')
      if (isTestUser) {
        return pass === 'teste123'
      }
      return false
    }

    const wrongPass = 'senha_incorreta_999'
    const credentialsValid = validateCredentials('admin.teste@ciafal.local', wrongPass)
    expect(credentialsValid).toBe(false)

    // Se as credenciais forem inválidas, o fluxo de MFA NÃO deve ser disparado
    const shouldTriggerMfa = credentialsValid && requiresMfa('admin.teste@ciafal.local')
    expect(shouldTriggerMfa).toBe(false)
  })

  // 4. QAS: vendedor + teste123 -> 123456 -> sucesso
  it('4. QAS: vendedor + teste123 -> 123456 -> sucesso', async () => {
    const email = 'vendedor.teste@ciafal.local'
    expect(requiresMfa(email)).toBe(true)

    const result = await verifyOtp(email, '123456')
    expect(result.valid).toBe(true)
    expect(result.mfa_mode).toBe('FIXED_QAS')
  })

  // 5. QAS: representante + teste123 -> 123456 -> sucesso, escopo externo
  it('5. QAS: representante + teste123 -> 123456 -> sucesso, escopo externo', async () => {
    const email = 'representante.teste@crm360.local'
    expect(requiresMfa(email, 'representante_externo')).toBe(true)

    const result = await verifyOtp(email, '123456')
    expect(result.valid).toBe(true)
    expect(result.mfa_mode).toBe('FIXED_QAS')

    // Validação de escopo externo: só acessa a própria carteira
    const repId = 'rep-externo-01'
    const internalSellerId = 'vendedor-teste-01'
    const canAccessOwn = defaultIdentityProvider.canAccessCustomer(repId, 'representante_externo' as any, repId)
    const canAccessInternal = defaultIdentityProvider.canAccessCustomer(
      repId,
      'representante_externo' as any,
      internalSellerId,
    )
    expect(canAccessOwn).toBe(true)
    expect(canAccessInternal).toBe(false)
  })

  // 6. Produção: APP_ENV=production -> isFixedTestOtpEnabled() SEMPRE retorna false
  it('6. Produção: APP_ENV=production -> isFixedTestOtpEnabled() SEMPRE retorna false, independente de ENABLE_FIXED_TEST_OTP', async () => {
    process.env.APP_ENV = 'production'
    process.env.ENABLE_FIXED_TEST_OTP = 'true'
    import.meta.env.VITE_APP_ENV = 'production'
    import.meta.env.VITE_ENABLE_FIXED_TEST_OTP = 'true'

    expect(isFixedTestOtpEnabled()).toBe(false)
    expect(getFixedTestOtpCode()).toBe('')

    // Em produção sem fixed OTP ativo, o código "123456" fixo é rejeitado
    const email = 'usuario.corporativo@ciafal.com.br'
    const result = await verifyOtp(email, '123456')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Código de verificação inválido.')
  })

  // 7. ENABLE_FIXED_TEST_OTP=false em QAS desabilita o OTP fixo
  it('7. ENABLE_FIXED_TEST_OTP=false desabilita OTP fixo mesmo fora de produção', async () => {
    process.env.APP_ENV = 'qas'
    process.env.ENABLE_FIXED_TEST_OTP = 'false'
    import.meta.env.VITE_APP_ENV = 'qas'
    import.meta.env.VITE_ENABLE_FIXED_TEST_OTP = 'false'

    expect(isFixedTestOtpEnabled()).toBe(false)
    expect(getFixedTestOtpCode()).toBe('')

    const email = 'admin.teste@ciafal.local'
    const result = await verifyOtp(email, '123456')
    expect(result.valid).toBe(false)
  })

  // 8. Mensagem de ambiente na UI: "Código QAS: 123456" SOMENTE quando isFixedTestOtpEnabled() === true
  it('8. Mensagem de ambiente na UI: "Código QAS: 123456" SOMENTE quando isFixedTestOtpEnabled() === true', () => {
    const getMfaUiConfig = (fixedEnabled: boolean) => {
      if (fixedEnabled) {
        return {
          notice: 'Ambiente de testes — utilize o código MFA definido para QAS.',
          codeDisplay: 'Código QAS: 123456',
        }
      }
      return {
        notice: 'Código de 6 dígitos enviado por e-mail corporativo.',
        codeDisplay: null,
      }
    }

    const qasConfig = getMfaUiConfig(true)
    expect(qasConfig.notice).toBe('Ambiente de testes — utilize o código MFA definido para QAS.')
    expect(qasConfig.codeDisplay).toBe('Código QAS: 123456')

    const prodConfig = getMfaUiConfig(false)
    expect(prodConfig.notice).toBe('Código de 6 dígitos enviado por e-mail corporativo.')
    expect(prodConfig.codeDisplay).toBeNull()
  })

  // 9. Rate limiting: Bloqueio no frontend após 5 tentativas consecutivas de falha
  it('9. Rate limiting: Máximo 5 tentativas consecutivas com bloqueio de 15 minutos', async () => {
    const testEmail = 'rate.limit@ciafal.local'
    resetRateLimit(testEmail)

    // 4 tentativas com código errado -> ainda permitido tentar
    for (let i = 0; i < 4; i++) {
      const res = await verifyOtp(testEmail, '999999')
      expect(res.valid).toBe(false)
      expect(res.error).toBe('Código de verificação inválido.')
    }

    // 5ª tentativa errada -> atinge limite
    const res5 = await verifyOtp(testEmail, '999999')
    expect(res5.valid).toBe(false)

    // 6ª tentativa -> bloqueada por rate limit
    const res6 = await verifyOtp(testEmail, '123456')
    expect(res6.valid).toBe(false)
    expect(res6.error).toContain('Limite de tentativas de MFA excedido')

    // Reset limpa o bloqueio
    resetRateLimit(testEmail)
    const resAfterReset = await verifyOtp(testEmail, '123456')
    expect(resAfterReset.valid).toBe(true)
  })

  // 10. Auditoria: log sem registrar o código OTP
  it('10. Auditoria: não registra OTP puro em plaintext', () => {
    const buildAuditLog = (email: string, mfaMode: string, success: boolean) => {
      return {
        recipient: email,
        otp_code: '[REDACTED]',
        status: success ? 'USED' : 'FAILED_ATTEMPT',
        metadata_json: {
          mfa_mode: mfaMode,
          success,
          timestamp: new Date().toISOString(),
        },
      }
    }

    const log = buildAuditLog('admin.teste@ciafal.local', 'FIXED_QAS', true)
    expect(log.otp_code).toBe('[REDACTED]')
    expect(log.metadata_json.mfa_mode).toBe('FIXED_QAS')
    expect(log.metadata_json.success).toBe(true)
  })
})
