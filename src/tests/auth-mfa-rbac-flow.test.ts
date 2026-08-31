import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import pb from '../lib/pocketbase/client'
import {
  isFixedTestOtpEnabled,
  getFixedTestOtpCode,
  verifyMfaOtp,
  initiateLoginAndMfa,
  resetRateLimit,
} from '../services/mfa_service'
import { defaultIdentityProvider } from '../providers/IdentityProvider'

describe('CRM 360º — Fluxo Completo de Autenticação, MFA e RBAC', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.APP_ENV = 'homologation'
    process.env.ENABLE_FIXED_TEST_OTP = 'true'
    import.meta.env.VITE_APP_ENV = 'homologation'
    import.meta.env.VITE_ENABLE_FIXED_TEST_OTP = 'true'
    import.meta.env.MODE = 'test'

    resetRateLimit('admin.teste@ciafal.local')
    resetRateLimit('supervisor.teste@ciafal.local')
    resetRateLimit('vendedor.teste@ciafal.local')
    resetRateLimit('vendedor2.teste@ciafal.local')
    resetRateLimit('representante.teste@crm360.local')
    resetRateLimit('rate.limit@ciafal.local')

    vi.spyOn(pb, 'send').mockImplementation(async (path: string, options: any) => {
      if (path === '/backend/v1/auth/login') {
        const { email, password } = options.body || {}
        if (!email || !password) {
          const err: any = new Error('Bad Request')
          err.status = 400
          err.response = { error: 'Usuário ou senha inválidos.' }
          throw err
        }
        if (password !== 'teste123') {
          const err: any = new Error('Unauthorized')
          err.status = 401
          err.response = { error: 'Usuário ou senha inválidos.' }
          throw err
        }

        let role = 'VENDEDOR'
        let name = 'Carlos Mendonça'
        let seller_code = 'VEND-TEST-01'
        let employee_id = 'TEST-VEND-01'

        if (email === 'admin.teste@ciafal.local') {
          role = 'ADMIN'
          name = 'Carlos Alberto (Diretoria & Adm)'
          seller_code = 'ADM-TESTE'
          employee_id = 'TEST-ADM-01'
        } else if (email === 'supervisor.teste@ciafal.local') {
          role = 'SUPERVISOR'
          name = 'Marcos Vinícius (Supervisor)'
          seller_code = 'SUP-TESTE'
          employee_id = 'TEST-SUP-01'
        } else if (email === 'vendedor2.teste@ciafal.local') {
          role = 'VENDEDOR'
          name = 'Mariana Azevedo'
          seller_code = 'VEND-TEST-02'
          employee_id = 'TEST-VEND-02'
        } else if (email === 'representante.teste@crm360.local') {
          role = 'REPRESENTANTE_EXTERNO'
          name = 'João Pedro Representações'
          seller_code = 'REP-EXT-01'
          employee_id = 'TEST-REP-01'
        }

        return {
          success: true,
          mfa_required: true,
          challenge_id: 'mfa_test_challenge_token_123',
          mfa_mode: 'TEST_FIXED',
          user: {
            id: 'usr-test-id',
            email,
            name,
            role,
            employee_id,
            seller_code,
            active: true,
            is_test_user: true,
          },
        }
      }

      if (path === '/backend/v1/auth/verify-mfa') {
        const { email, otp } = options.body || {}
        const isHomologation = process.env.APP_ENV !== 'production'

        if (otp !== '123456' || !isHomologation) {
          const err: any = new Error('Invalid MFA')
          err.status = 400
          err.response = { error: 'Código de verificação inválido.' }
          throw err
        }

        let role = 'VENDEDOR'
        if (email === 'admin.teste@ciafal.local') role = 'ADMIN'
        else if (email === 'supervisor.teste@ciafal.local') role = 'SUPERVISOR'
        else if (email === 'representante.teste@crm360.local') role = 'REPRESENTANTE_EXTERNO'

        return {
          authenticated: true,
          token: 'mock-session-jwt-token',
          user: {
            id: 'usr-test-id',
            email,
            role,
            name: 'Usuário Homologação',
            active: true,
            is_test_user: true,
          },
          message: 'Acesso autorizado.',
        }
      }

      if (path === '/backend/v1/auth/me') {
        return {
          authenticated: true,
          user: {
            id: 'usr-test-id',
            email: 'admin.teste@ciafal.local',
            role: 'ADMIN',
            name: 'Carlos Alberto (Diretoria & Adm)',
            active: true,
            is_test_user: true,
          },
        }
      }

      return {}
    })
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  // 1. ADMIN: Login com teste123 + MFA 123456 -> Sucesso e Role ADMIN
  it('1. Admin: login com credenciais oficiais + MFA 123456 -> Sucesso ADMIN', async () => {
    const email = 'admin.teste@ciafal.local'
    const loginRes = await initiateLoginAndMfa(email, 'teste123')
    expect(loginRes.success).toBe(true)
    expect(loginRes.mfa_required).toBe(true)
    expect(loginRes.user.role).toBe('ADMIN')

    const mfaRes = await verifyMfaOtp(email, '123456', loginRes.challenge_id)
    expect(mfaRes.valid).toBe(true)
    expect(mfaRes.user_details?.role).toBe('ADMIN')
  })

  // 2. SUPERVISOR: Login com teste123 + MFA 123456 -> Sucesso e Role SUPERVISOR
  it('2. Supervisor: login com credenciais oficiais + MFA 123456 -> Sucesso SUPERVISOR', async () => {
    const email = 'supervisor.teste@ciafal.local'
    const loginRes = await initiateLoginAndMfa(email, 'teste123')
    expect(loginRes.success).toBe(true)
    expect(loginRes.user.role).toBe('SUPERVISOR')

    const mfaRes = await verifyMfaOtp(email, '123456', loginRes.challenge_id)
    expect(mfaRes.valid).toBe(true)
    expect(mfaRes.user_details?.role).toBe('SUPERVISOR')
  })

  // 3. VENDEDOR 1: Login com teste123 + MFA 123456 -> Sucesso e Role VENDEDOR
  it('3. Vendedor 1: login com credenciais oficiais + MFA 123456 -> Sucesso VENDEDOR', async () => {
    const email = 'vendedor.teste@ciafal.local'
    const loginRes = await initiateLoginAndMfa(email, 'teste123')
    expect(loginRes.success).toBe(true)
    expect(loginRes.user.role).toBe('VENDEDOR')

    const mfaRes = await verifyMfaOtp(email, '123456', loginRes.challenge_id)
    expect(mfaRes.valid).toBe(true)
    expect(mfaRes.user_details?.role).toBe('VENDEDOR')
  })

  // 4. VENDEDOR 2: Login com teste123 + MFA 123456 -> Sucesso e Role VENDEDOR
  it('4. Vendedor 2: login com credenciais oficiais + MFA 123456 -> Sucesso VENDEDOR', async () => {
    const email = 'vendedor2.teste@ciafal.local'
    const loginRes = await initiateLoginAndMfa(email, 'teste123')
    expect(loginRes.success).toBe(true)
    expect(loginRes.user.role).toBe('VENDEDOR')

    const mfaRes = await verifyMfaOtp(email, '123456', loginRes.challenge_id)
    expect(mfaRes.valid).toBe(true)
    expect(mfaRes.user_details?.role).toBe('VENDEDOR')
  })

  // 5. REPRESENTANTE EXTERNO: Login com teste123 + MFA 123456 -> Sucesso e Role REPRESENTANTE_EXTERNO
  it('5. Representante Externo: login com credenciais oficiais + MFA 123456 -> Sucesso REPRESENTANTE_EXTERNO', async () => {
    const email = 'representante.teste@crm360.local'
    const loginRes = await initiateLoginAndMfa(email, 'teste123')
    expect(loginRes.success).toBe(true)
    expect(loginRes.user.role).toBe('REPRESENTANTE_EXTERNO')

    const mfaRes = await verifyMfaOtp(email, '123456', loginRes.challenge_id)
    expect(mfaRes.valid).toBe(true)
    expect(mfaRes.user_details?.role).toBe('REPRESENTANTE_EXTERNO')
  })

  // 6. Senha incorreta -> Rejeição imediata sem emitir MFA
  it('6. Senha incorreta -> Rejeição imediata', async () => {
    const loginRes = await initiateLoginAndMfa('admin.teste@ciafal.local', 'senha_errada')
    expect(loginRes.success).toBe(false)
    expect(loginRes.error).toBe('Usuário ou senha inválidos.')
  })

  // 7. OTP incorreto -> Rejeição na etapa MFA
  it('7. OTP incorreto -> Rejeição com Código de verificação inválido', async () => {
    const email = 'admin.teste@ciafal.local'
    const mfaRes = await verifyMfaOtp(email, '654321')
    expect(mfaRes.valid).toBe(false)
    expect(mfaRes.error).toBe('Código de verificação inválido.')
  })

  // 8. OTP não-numérico ou tamanho incorreto -> Rejeição
  it('8. Formato inválido de OTP -> Rejeição estrita de string', async () => {
    const email = 'admin.teste@ciafal.local'
    const invalidOtps = ['12345', '1234567', 'abcdef', '12345a', '']
    for (const code of invalidOtps) {
      const res = await verifyMfaOtp(email, code)
      expect(res.valid).toBe(false)
    }
  })

  // 9. RBAC: Isolamento entre Vendedor 1 e Vendedor 2
  it('9. RBAC: Vendedor 1 não acessa Vendedor 2 e vice-versa', () => {
    const v1Id = 'usr-vendedor-teste-01'
    const v2Id = 'usr-vendedor2-teste-01'
    expect(defaultIdentityProvider.canAccessCustomer(v1Id, 'vendedor', v2Id)).toBe(false)
    expect(defaultIdentityProvider.canAccessCustomer(v2Id, 'vendedor', v1Id)).toBe(false)
  })

  // 10. RBAC: Supervisor tem acesso à equipe
  it('10. RBAC: Supervisor acessa carteiras de ambos os vendedores', () => {
    const supId = 'usr-supervisor-teste-01'
    const v1Id = 'usr-vendedor-teste-01'
    const v2Id = 'usr-vendedor2-teste-01'
    expect(defaultIdentityProvider.canAccessCustomer(supId, 'supervisor', v1Id)).toBe(true)
    expect(defaultIdentityProvider.canAccessCustomer(supId, 'supervisor', v2Id)).toBe(true)
  })

  // 11. RBAC: Representante Externo só acessa própria carteira
  it('11. RBAC: Representante Externo tem menor privilégio', () => {
    const repId = 'usr-rep-teste-01'
    const v1Id = 'usr-vendedor-teste-01'
    expect(defaultIdentityProvider.canAccessCustomer(repId, 'representante_externo', repId)).toBe(true)
    expect(defaultIdentityProvider.canAccessCustomer(repId, 'representante_externo', v1Id)).toBe(false)
  })

  // 12. Rate Limit: Bloqueio após 5 tentativas de MFA inválidas
  it('12. Rate Limit: Bloqueio temporário após 5 tentativas consecutivas', async () => {
    const email = 'rate.limit@ciafal.local'
    resetRateLimit(email)

    for (let i = 0; i < 5; i++) {
      await verifyMfaOtp(email, '999999')
    }

    const blockedRes = await verifyMfaOtp(email, '123456')
    expect(blockedRes.valid).toBe(false)
    expect(blockedRes.error).toContain('Limite de tentativas de MFA excedido')
  })

  // 13. Produção: APP_ENV=production desabilita modo teste
  it('13. Produção: APP_ENV=production rejeita 123456 como OTP universal', async () => {
    process.env.APP_ENV = 'production'
    import.meta.env.VITE_APP_ENV = 'production'

    expect(isFixedTestOtpEnabled()).toBe(false)

    const res = await verifyMfaOtp('admin.teste@ciafal.local', '123456')
    expect(res.valid).toBe(false)
  })
})
