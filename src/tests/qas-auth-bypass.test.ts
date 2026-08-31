/**
 * QAS AUTH BYPASS — TEMPORARY — MUST NEVER RUN IN PRODUCTION
 *
 * Testes Automatizados da Homologação sem Login (Auth Bypass QAS) e RBAC do CRM 360º CIAFAL
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  QAS_PROFILES,
  getAppEnvironment,
  isAuthBypassEnabled,
  shouldUseQASAuthBypass,
  logQASAudit,
} from '@/config/qas-auth-config'
import { createQASTestSessionUser } from '@/hooks/use-auth'
import { defaultIdentityProvider } from '@/providers/IdentityProvider'
import { catalogoService } from '@/services/catalogoService'

describe('QAS Auth Bypass & RBAC — CRM 360º CIAFAL', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  // 1. Verificação dos 5 perfis com botões exatos
  it('1. Deve conter exatamente os 5 perfis oficiais de homologação com os botões e e-mails corretos', () => {
    expect(QAS_PROFILES.length).toBe(5)

    const admin = QAS_PROFILES.find((p) => p.role === 'ADMIN')
    const sup = QAS_PROFILES.find((p) => p.role === 'SUPERVISOR')
    const v1 = QAS_PROFILES.find((p) => p.email === 'vendedor.teste@ciafal.local')
    const v2 = QAS_PROFILES.find((p) => p.email === 'vendedor2.teste@ciafal.local')
    const rep = QAS_PROFILES.find((p) => p.role === 'REPRESENTANTE_EXTERNO')

    expect(admin?.buttonText).toBe('Entrar como Administrador')
    expect(admin?.email).toBe('admin.teste@ciafal.local')

    expect(sup?.buttonText).toBe('Entrar como Supervisor')
    expect(sup?.email).toBe('supervisor.teste@ciafal.local')

    expect(v1?.buttonText).toBe('Entrar como Vendedor 1')
    expect(v1?.email).toBe('vendedor.teste@ciafal.local')
    expect(v1?.role).toBe('VENDEDOR')

    expect(v2?.buttonText).toBe('Entrar como Vendedor 2')
    expect(v2?.email).toBe('vendedor2.teste@ciafal.local')
    expect(v2?.role).toBe('VENDEDOR')

    expect(rep?.buttonText).toBe('Entrar como Representante Externo')
    expect(rep?.email).toBe('representante.teste@crm360.local')
  })

  // 2. Geração da TestSession estruturada com is_test_session = true
  it('2. Deve criar objeto de sessão de homologação estruturado com RBAC, session_id e timestamp', () => {
    const adminProfile = QAS_PROFILES[0]
    const sessionUser = createQASTestSessionUser(adminProfile)

    expect(sessionUser.id).toBe('qas-admin_teste')
    expect(sessionUser.email).toBe('admin.teste@ciafal.local')
    expect(sessionUser.role).toBe('ADMIN')
    expect(sessionUser.is_test_session).toBe(true)
    expect(sessionUser.is_test_user).toBe(true)
    expect(sessionUser.environment).toBe('HOMOLOGAÇÃO')
    expect(sessionUser.session_id).toBeDefined()
    expect(sessionUser.login_timestamp).toBeDefined()
    expect(sessionUser.permissions).toContain('ALL')
  })

  // 3. RBAC de cada perfil
  it('3. Deve validar permissões específicas de cada perfil', () => {
    // ADMIN: Visão ampla
    const adminAccess = defaultIdentityProvider.canAccessCustomer('qas-admin_teste', 'administrador', 'outro_vendedor')
    expect(adminAccess).toBe(true)

    // SUPERVISOR: Equipe e vendedores
    const supAccess = defaultIdentityProvider.canAccessCustomer('qas-supervisor_teste', 'supervisor', 'vendedor_qualquer')
    expect(supAccess).toBe(true)

    // VENDEDOR 1 e VENDEDOR 2: Restritos à própria carteira
    const v1Id = 'qas-vendedor_teste'
    const v2Id = 'qas-vendedor2_teste'
    expect(defaultIdentityProvider.canAccessCustomer(v1Id, 'vendedor', v1Id)).toBe(true)
    expect(defaultIdentityProvider.canAccessCustomer(v1Id, 'vendedor', v2Id)).toBe(false)
    expect(defaultIdentityProvider.canAccessCustomer(v2Id, 'vendedor', v1Id)).toBe(false)

    // REPRESENTANTE EXTERNO: Apenas carteira própria, proibido acessar vendedores internos
    const repId = 'qas-representante_teste'
    expect(defaultIdentityProvider.canAccessCustomer(repId, 'representante_externo', repId)).toBe(true)
    expect(defaultIdentityProvider.canAccessCustomer(repId, 'representante_externo', v1Id)).toBe(false)
  })

  // 4. Governança de estoque para Vendedores (consulta individual permitida)
  it('4. Vendedor pode consultar individualmente saldo de um material no catalogoService', () => {
    const sellerUser = createQASTestSessionUser(QAS_PROFILES[2])
    const res = catalogoService.consultarEstoqueIndividual(sellerUser as any, 'V20200360600')

    expect(res.autorizado).toBe(true)
    expect(res.produto).toBeDefined()
    expect(res.produto?.codigo).toBe('V20200360600')
    expect(res.produto?.disponivelTons).toBeGreaterThanOrEqual(0)
  })

  // 5. Proteção contra produção
  it('5. CRÍTICO: Em produção (APP_ENV=production), o Bypass QAS é ESTRITAMENTE bloqueado', () => {
    process.env.APP_ENV = 'production'
    process.env.AUTH_BYPASS_ENABLED = 'true'

    const bypassActive = isAuthBypassEnabled()
    expect(bypassActive).toBe(false)

    const shouldBypass = shouldUseQASAuthBypass()
    expect(shouldBypass).toBe(false)
  })

  // 6. Ativação correta em QAS/Homologação
  it('6. Em homologação (APP_ENV=homologation / qas), o Bypass QAS está ativo por padrão', () => {
    process.env.APP_ENV = 'homologation'
    delete process.env.AUTH_BYPASS_ENABLED

    expect(isAuthBypassEnabled()).toBe(true)
    expect(shouldUseQASAuthBypass()).toBe(true)
  })

  // 7. Possibilidade de desativar o bypass via feature flag futura (AUTH_BYPASS_ENABLED=false)
  it('7. Se AUTH_BYPASS_ENABLED for definido como false, desativa o bypass e preserva o login real', () => {
    process.env.APP_ENV = 'homologation'
    process.env.AUTH_BYPASS_ENABLED = 'false'

    expect(isAuthBypassEnabled()).toBe(false)
    expect(shouldUseQASAuthBypass()).toBe(false)
  })

  // 8. Auditoria sem credenciais sensíveis
  it('8. logQASAudit grava eventos com marcação TEST_SESSION / QAS sem expor secrets', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logQASAudit('TEST_EVENT', { user_id: 'qas-test', action: 'SELECT_PROFILE' })

    expect(spy).toHaveBeenCalled()
    const logCall = spy.mock.calls[0][1]
    expect(logCall).toContain('TEST_SESSION / QAS')
    expect(logCall).toContain('SELECT_PROFILE')
    expect(logCall).not.toContain('password')
    expect(logCall).not.toContain('secret')
    spy.mockRestore()
  })
})
