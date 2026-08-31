import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import pb from '../lib/pocketbase/client'
import { isFixedTestOtpEnabled, verifyMfaOtp, getFixedTestOtpCode, requiresMfa } from '../services/mfa_service'

describe('CRM 360º — Fluxo de Autenticação e Auto-Provisionamento MFA QAS', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.APP_ENV = 'qas'
    process.env.ENABLE_FIXED_TEST_OTP = 'true'
    process.env.FIXED_TEST_OTP = '123456'
    import.meta.env.VITE_APP_ENV = 'qas'
    import.meta.env.VITE_ENABLE_FIXED_TEST_OTP = 'true'
    import.meta.env.VITE_FIXED_TEST_OTP = '123456'
    import.meta.env.MODE = 'test'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  const testAccounts = [
    { email: 'admin.teste@ciafal.local', role: 'administrador' },
    { email: 'supervisor.teste@ciafal.local', role: 'supervisor' },
    { email: 'vendedor.teste@ciafal.local', role: 'vendedor' },
    { email: 'vendedor2.teste@ciafal.local', role: 'vendedor' },
    { email: 'representante.teste@crm360.local', role: 'representante_externo' },
  ]

  for (const account of testAccounts) {
    it(`deve validar MFA e permitir login para ${account.email} com OTP 123456`, async () => {
      expect(requiresMfa(account.email, account.role)).toBe(true)
      expect(isFixedTestOtpEnabled()).toBe(true)
      expect(getFixedTestOtpCode()).toBe('123456')

      // Validação do OTP fixo
      const verifyResult = await verifyMfaOtp(account.email, '123456')
      expect(verifyResult.valid).toBe(true)
      expect(verifyResult.mfa_mode).toBe('FIXED_QAS')
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

  it('em produção (isFixedTestOtpEnabled=false), o OTP fixo 123456 é rejeitado e não auto-provisiona', async () => {
    process.env.APP_ENV = 'production'
    import.meta.env.VITE_APP_ENV = 'production'

    expect(isFixedTestOtpEnabled()).toBe(false)
    expect(getFixedTestOtpCode()).toBe('')

    const result = await verifyMfaOtp('admin.teste@ciafal.local', '123456')
    expect(result.valid).toBe(false)
  })
})
