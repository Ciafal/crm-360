import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import pb from '../lib/pocketbase/client'
import { isFixedTestOtpEnabled, verifyMfaOtp, requiresMfa } from '../services/mfa_service'

describe('CRM 360º — Fluxo de Autenticação e MFA QAS', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.APP_ENV = 'qas'
    process.env.ENABLE_FIXED_TEST_OTP = 'true'
    import.meta.env.VITE_APP_ENV = 'qas'
    import.meta.env.VITE_ENABLE_FIXED_TEST_OTP = 'true'
    import.meta.env.MODE = 'test'

    vi.spyOn(pb, 'send').mockImplementation(async (path: string, options: any) => {
      if (path === '/backend/v1/auth/verify-mfa') {
        const { email, otp } = options.body || {}
        const isHomologation = process.env.APP_ENV !== 'production'

        if (otp !== '123456' || !isHomologation) {
          const err: any = new Error('Invalid MFA')
          err.status = 400
          err.response = { error: 'Código de verificação inválido.' }
          throw err
        }

        return {
          authenticated: true,
          token: 'token-jwt-test',
          user: {
            id: 'usr-test',
            email,
            is_test_user: true,
          },
          message: 'Acesso autorizado.',
        }
      }
      return {}
    })
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  const testAccounts = [
    { email: 'admin.teste@ciafal.local', role: 'ADMIN' },
    { email: 'supervisor.teste@ciafal.local', role: 'SUPERVISOR' },
    { email: 'vendedor.teste@ciafal.local', role: 'VENDEDOR' },
    { email: 'vendedor2.teste@ciafal.local', role: 'VENDEDOR' },
    { email: 'representante.teste@crm360.local', role: 'REPRESENTANTE_EXTERNO' },
  ]

  for (const account of testAccounts) {
    it(`deve validar MFA e permitir login para ${account.email} com OTP 123456`, async () => {
      expect(requiresMfa(account.email, account.role)).toBe(true)
      expect(isFixedTestOtpEnabled()).toBe(true)

      // Validação do OTP no backend
      const verifyResult = await verifyMfaOtp(account.email, '123456')
      expect(verifyResult.valid).toBe(true)
      expect(verifyResult.mfa_mode).toBe('TEST_FIXED')
    })
  }

  it('deve rejeitar qualquer OTP diferente de 123456 em QAS', async () => {
    const email = 'admin.teste@ciafal.local'
    const wrongOtps = ['000000', '111111', '654321', '999999']

    for (const otp of wrongOtps) {
      const result = await verifyMfaOtp(email, otp)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Código de verificação inválido.')
    }
  })

  it('em produção (isFixedTestOtpEnabled=false), o OTP fixo 123456 é rejeitado', async () => {
    process.env.APP_ENV = 'production'
    import.meta.env.VITE_APP_ENV = 'production'

    expect(isFixedTestOtpEnabled()).toBe(false)

    const result = await verifyMfaOtp('admin.teste@ciafal.local', '123456')
    expect(result.valid).toBe(false)
  })
})
