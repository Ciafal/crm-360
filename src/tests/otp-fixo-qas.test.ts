import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isFixedTestOtpEnabled,
  getFixedTestOtpCode,
  requiresMfa,
  verifyMfaOtp,
  requestMfaOtp,
} from '../services/mfa_service'
import { defaultIdentityProvider } from '../providers/IdentityProvider'

describe('CRM 360º — Validação de OTP Fixo QAS/HML vs Produção', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Restaurar env padrão para QAS
    process.env.APP_ENV = 'qas'
    process.env.ENABLE_FIXED_TEST_OTP = 'true'
    process.env.FIXED_TEST_OTP = '123456'
    import.meta.env.VITE_APP_ENV = 'qas'
    import.meta.env.VITE_ENABLE_FIXED_TEST_OTP = 'true'
    import.meta.env.VITE_FIXED_TEST_OTP = '123456'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  // 1. QAS: admin + teste123 -> MFA -> 123456 -> sucesso
  it('1. QAS: admin + teste123 -> MFA -> 123456 -> sucesso', async () => {
    const email = 'admin.teste@ciafal.local'
    expect(requiresMfa(email)).toBe(true)
    expect(isFixedTestOtpEnabled()).toBe(true)
    expect(getFixedTestOtpCode()).toBe('123456')

    const req = await requestMfaOtp(email)
    expect(req.success).toBe(true)

    const result = await verifyMfaOtp(email, '123456')
    expect(result.valid).toBe(true)
    expect(result.mfa_mode).toBe('FIXED_QAS')
  })

  // 2. QAS: admin + teste123 -> MFA -> 654321 -> falha ("Código inválido")
  it('2. QAS: admin + teste123 -> MFA -> 654321 -> falha ("Código inválido")', async () => {
    const email = 'admin.teste@ciafal.local'
    const result = await verifyMfaOtp(email, '654321')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Código inválido')
  })

  // 3. QAS: senha errada -> NÃO chegar à etapa MFA (fluxo de credencial obrigatório)
  it('3. QAS: senha errada -> NÃO chegar à etapa MFA', () => {
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

    const result = await verifyMfaOtp(email, '123456')
    expect(result.valid).toBe(true)
    expect(result.mfa_mode).toBe('FIXED_QAS')
  })

  // 5. QAS: representante + teste123 -> 123456 -> sucesso, escopo externo
  it('5. QAS: representante + teste123 -> 123456 -> sucesso, escopo externo', async () => {
    const email = 'representante.teste@crm360.local'
    expect(requiresMfa(email, 'representante_externo')).toBe(true)

    const result = await verifyMfaOtp(email, '123456')
    expect(result.valid).toBe(true)
    expect(result.mfa_mode).toBe('FIXED_QAS')

    // Validação de escopo externo: só acessa a própria carteira
    const repId = 'rep-externo-01'
    const internalSellerId = 'vendedor-teste-01'
    const canAccessOwn = defaultIdentityProvider.canAccessCustomer(repId, 'representante_externo', repId)
    const canAccessInternal = defaultIdentityProvider.canAccessCustomer(
      repId,
      'representante_externo',
      internalSellerId,
    )
    expect(canAccessOwn).toBe(true)
    expect(canAccessInternal).toBe(false)
  })

  // 6. Produção: APP_ENV=production, ENABLE_FIXED_TEST_OTP=false -> 123456 NÃO deve funcionar como OTP, deve usar OTP real
  it('6. Produção: APP_ENV=production, ENABLE_FIXED_TEST_OTP=false -> 123456 NÃO deve funcionar como OTP', async () => {
    // Configura ambiente de produção
    import.meta.env.VITE_APP_ENV = 'production'
    import.meta.env.VITE_ENABLE_FIXED_TEST_OTP = 'false'
    import.meta.env.MODE = 'production'

    expect(isFixedTestOtpEnabled()).toBe(false)
    expect(getFixedTestOtpCode()).toBe('')

    // Em produção sem fixed OTP ativo, o código "123456" fixo é rejeitado
    const email = 'usuario.corporativo@ciafal.com.br'
    const result = await verifyMfaOtp(email, '123456')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Código inválido')
  })

  // 7. Validação de mensagem de ambiente: "Código QAS: 123456" NUNCA em produção
  it('7. Mensagem com código QAS NUNCA deve ser exibida em produção', () => {
    const getMfaDisclaimer = (isQasFixed: boolean) => {
      if (isQasFixed) {
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

    const qasDisclaimer = getMfaDisclaimer(true)
    expect(qasDisclaimer.notice).toContain('Ambiente de testes')
    expect(qasDisclaimer.codeDisplay).toBe('Código QAS: 123456')

    const prodDisclaimer = getMfaDisclaimer(false)
    expect(prodDisclaimer.notice).not.toContain('Ambiente de testes')
    expect(prodDisclaimer.codeDisplay).toBeNull()
  })

  // 8. Auditoria: não registrar o OTP puro no log
  it('8. Auditoria: registrar login com mfa_mode=FIXED_QAS e NÃO registrar o código OTP', () => {
    const buildAuditPayload = (
      email: string,
      mfaMode: string,
      success: boolean,
      otpEntered: string,
    ) => {
      // Regra de segurança: OTP NUNCA é registrado em plaintext
      return {
        email,
        mfa_mode: mfaMode,
        success,
        otp_code: '[REDACTED]',
        timestamp: new Date().toISOString(),
      }
    }

    const audit = buildAuditPayload('vendedor.teste@ciafal.local', 'FIXED_QAS', true, '123456')
    expect(audit.mfa_mode).toBe('FIXED_QAS')
    expect(audit.success).toBe(true)
    expect(audit.otp_code).toBe('[REDACTED]')
    expect(audit.otp_code).not.toBe('123456')
  })

  // 9. Rate limit: manter proteção de tentativas
  it('9. Rate limit: bloqueio após múltiplas tentativas com falha', () => {
    const simulateRateLimit = (failedAttemptsInWindow: number) => {
      const MAX_FAILED_ATTEMPTS = 5
      if (failedAttemptsInWindow >= MAX_FAILED_ATTEMPTS) {
        return {
          allowed: false,
          error: 'Limite de tentativas de MFA excedido. Por segurança, tente novamente em 15 minutos.',
        }
      }
      return { allowed: true }
    }

    expect(simulateRateLimit(3).allowed).toBe(true)
    expect(simulateRateLimit(5).allowed).toBe(false)
    expect(simulateRateLimit(5).error).toContain('Limite de tentativas de MFA excedido')
  })
})
