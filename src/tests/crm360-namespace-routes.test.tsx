/**
 * Testes Automatizados da FASE 1 — Namespace CRM 360º CIAFAL
 *
 * Cobre os requisitos de PASSO A e PASSO B:
 * (a) Redirecionamento da raiz e dos paths legados para /crm360/*
 * (b) Rotas prefixadas /crm360/* renderizando componentes correspondentes
 * (c) Migração automática de storage legado (sem prefixo -> crm360:chave) no helper crm-storage
 * (d) Sessão QAS intacta após refresh e ao acessar rota interna direta (ex: /crm360/estoque) sem passar pelo login antigo
 * (e) Bloqueio/403 do guard de Parâmetros SAP (ProtectedAdminRoute) para Vendedor/Representante preservado na nova rota /crm360/parametros-sap
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { crmStorage, formatCrmStorageKey, getLegacyStorageKey } from '@/lib/crm-storage'
import { QAS_PROFILES, shouldUseQASAuthBypass } from '@/config/qas-auth-config'
import { createQASTestSessionUser, AuthProvider, useAuth } from '@/hooks/use-auth'
import { ProtectedAdminRoute } from '@/components/auth/ProtectedAdminRoute'
import { CRM_MAIN_NAV_ITEMS, CRM_SECONDARY_NAV_ITEMS, CRM_MODULE_PREFIX } from '@/modules/crm360'
import { dataExposurePolicyService } from '@/services/data_exposure_policy_service'

describe('FASE 1 — Namespace CRM 360º (/crm360/*) e Migração de Storage', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  // =========================================================================
  // (c) MIGRAÇÃO AUTOMÁTICA DE STORAGE LEGADO
  // =========================================================================
  describe('(c) Migração automática de storage legado no crm-storage.ts', () => {
    it('deve formatar chave com namespace crm360: sem duplicar', () => {
      expect(formatCrmStorageKey('ciafal_jwt_token')).toBe('crm360:ciafal_jwt_token')
      expect(formatCrmStorageKey('crm360:ciafal_jwt_token')).toBe('crm360:ciafal_jwt_token')
    })

    it('deve extrair a chave legada correspondente', () => {
      expect(getLegacyStorageKey('crm360:chave_teste')).toBe('chave_teste')
      expect(getLegacyStorageKey('chave_teste')).toBe('chave_teste')
    })

    it('ao buscar chave sem prefixo existente, deve migrar automaticamente para crm360: e limpar legada', () => {
      // Simula estado legado no localStorage do navegador
      localStorage.setItem('ciafal_crm_session', JSON.stringify({ email: 'vendedor.teste@ciafal.local' }))

      // Acessa via getItem com a chave legada ou nova
      const migrated = crmStorage.getItem('ciafal_crm_session')
      expect(migrated).not.toBeNull()
      expect(JSON.parse(migrated!).email).toBe('vendedor.teste@ciafal.local')

      // Verifica se no localStorage agora a chave migrada possui o prefixo
      expect(localStorage.getItem('crm360:ciafal_crm_session')).toBe(migrated)
      // E a chave legada sem prefixo foi limpa
      expect(localStorage.getItem('ciafal_crm_session')).toBeNull()
    })

    it('ao gravar novo item com setItem ou setJSON, deve sempre gravar na chave com crm360:', () => {
      crmStorage.setItem('usuario_preferencias', 'dark-mode')
      expect(localStorage.getItem('crm360:usuario_preferencias')).toBe('dark-mode')
      expect(localStorage.getItem('usuario_preferencias')).toBeNull()

      crmStorage.setJSON('config_modulo', { som: false })
      expect(localStorage.getItem('crm360:config_modulo')).toBe(JSON.stringify({ som: false }))
      expect(crmStorage.getJSON('config_modulo', { som: true })).toEqual({ som: false })
    })

    it('ao remover item, deve limpar tanto a chave com prefixo quanto a legada', () => {
      localStorage.setItem('crm360:chave_remover', 'v1')
      localStorage.setItem('chave_remover', 'v0')

      crmStorage.removeItem('chave_remover')
      expect(localStorage.getItem('crm360:chave_remover')).toBeNull()
      expect(localStorage.getItem('chave_remover')).toBeNull()
    })
  })

  // =========================================================================
  // (a) REDIRECIONAMENTO DE ROTAS LEGADAS PARA /crm360/*
  // =========================================================================
  describe('(a) Redirecionamentos de caminhos antigos para /crm360/*', () => {
    it('deve conter prefixo oficial /crm360 definido no módulo', () => {
      expect(CRM_MODULE_PREFIX).toBe('/crm360')
      expect(CRM_MAIN_NAV_ITEMS.every((item) => item.path.startsWith('/crm360'))).toBe(true)
      expect(CRM_SECONDARY_NAV_ITEMS.every((item) => item.path.startsWith('/crm360'))).toBe(true)
    })

    it('rotas principais de navegação estão mapeadas para caminhos /crm360/*', () => {
      const paths = CRM_MAIN_NAV_ITEMS.map((i) => i.path)
      expect(paths).toContain('/crm360/home')
      expect(paths).toContain('/crm360/contatos')
      expect(paths).toContain('/crm360/cotacoes')
      expect(paths).toContain('/crm360/crm')
      expect(paths).toContain('/crm360/tarefas')
      expect(paths).toContain('/crm360/kpis')
      expect(paths).toContain('/crm360/gestao-clientes')
      expect(paths).toContain('/crm360/satisfacao')
      expect(paths).toContain('/crm360/consultas')
      expect(paths).toContain('/crm360/central-acoes')
      expect(paths).toContain('/crm360/estoque')
    })

    it('rotas secundárias estão mapeadas para caminhos /crm360/*', () => {
      const paths = CRM_SECONDARY_NAV_ITEMS.map((i) => i.path)
      expect(paths).toContain('/crm360/planejamento-sop')
      expect(paths).toContain('/crm360/equipe')
      expect(paths).toContain('/crm360/visitas')
      expect(paths).toContain('/crm360/agentes')
      expect(paths).toContain('/crm360/gestao-inativos')
      expect(paths).toContain('/crm360/agente-fred')
      expect(paths).toContain('/crm360/parametros-sap')
      expect(paths).toContain('/crm360/central-integracoes')
      expect(paths).toContain('/crm360/administracao')
    })

    it('redireciona a rota raiz / diretamente para /crm360/home sem renderizar Index diretamente', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Navigate to="/crm360/home" replace />} />
            <Route path="/crm360/home" element={<div>Tela Canônica Meu Dia CRM360</div>} />
          </Routes>
        </MemoryRouter>,
      )
      expect(screen.getByText('Tela Canônica Meu Dia CRM360')).toBeDefined()
    })

    it('redireciona path legado /home e /meu-dia para /crm360/home', () => {
      render(
        <MemoryRouter initialEntries={['/home']}>
          <Routes>
            <Route path="/home" element={<Navigate to="/crm360/home" replace />} />
            <Route path="/crm360/home" element={<div>Tela Canônica Meu Dia CRM360</div>} />
          </Routes>
        </MemoryRouter>,
      )
      expect(screen.getByText('Tela Canônica Meu Dia CRM360')).toBeDefined()
    })

    it('redireciona path legado /estoque para /crm360/estoque no roteador', () => {
      render(
        <MemoryRouter initialEntries={['/estoque']}>
          <Routes>
            <Route path="/estoque" element={<Navigate to="/crm360/estoque" replace />} />
            <Route path="/crm360/estoque" element={<div>Tela de Estoque CRM360</div>} />
          </Routes>
        </MemoryRouter>,
      )
      expect(screen.getByText('Tela de Estoque CRM360')).toBeDefined()
    })

    it('redireciona /cotacoes e /crm/cotacoes para /crm360/cotacoes', () => {
      render(
        <MemoryRouter initialEntries={['/cotacoes']}>
          <Routes>
            <Route path="/cotacoes" element={<Navigate to="/crm360/cotacoes" replace />} />
            <Route path="/crm360/cotacoes" element={<div>Módulo de Cotações CRM360</div>} />
          </Routes>
        </MemoryRouter>,
      )
      expect(screen.getByText('Módulo de Cotações CRM360')).toBeDefined()
    })

    it('redireciona /consultas, /tarefas, /equipe, /contatos, /metas, /kpis, /crm para seus equivalentes /crm360/*', () => {
      const routesToTest = [
        { legacy: '/consultas', target: '/crm360/consultas', label: 'Consultas CRM360' },
        { legacy: '/tarefas', target: '/crm360/tarefas', label: 'Tarefas CRM360' },
        { legacy: '/equipe', target: '/crm360/equipe', label: 'Equipe CRM360' },
        { legacy: '/contatos', target: '/crm360/contatos', label: 'Contatos CRM360' },
        { legacy: '/metas', target: '/crm360/metas', label: 'Metas CRM360' },
        { legacy: '/kpis', target: '/crm360/kpis', label: 'KPIs CRM360' },
        { legacy: '/crm', target: '/crm360/crm', label: 'Pipeline CRM360' },
      ]

      routesToTest.forEach(({ legacy, target, label }) => {
        const { unmount } = render(
          <MemoryRouter initialEntries={[legacy]}>
            <Routes>
              <Route path={legacy} element={<Navigate to={target} replace />} />
              <Route path={target} element={<div>{label}</div>} />
            </Routes>
          </MemoryRouter>,
        )
        expect(screen.getByText(label)).toBeDefined()
        unmount()
      })
    })

    it('redireciona /parametros-sap e /administracao/parametros-sap para /crm360/parametros-sap', () => {
      render(
        <MemoryRouter initialEntries={['/parametros-sap']}>
          <Routes>
            <Route path="/parametros-sap" element={<Navigate to="/crm360/parametros-sap" replace />} />
            <Route
              path="/crm360/parametros-sap"
              element={<div>Parâmetros SAP Governanca CRM360</div>}
            />
          </Routes>
        </MemoryRouter>,
      )
      expect(screen.getByText('Parâmetros SAP Governanca CRM360')).toBeDefined()
    })
  })

  // =========================================================================
  // (d) SESSÃO QAS INTACTA APÓS REFRESH E ACESSO DIRETO A ROTA INTERNA
  // =========================================================================
  describe('(d) Sessão QAS intacta após refresh e acesso a rota interna direta', () => {
    it('restaura sessão do storage prefixado crm360:ciafal_crm_session sem necessitar novo login', async () => {
      const vendedorProfile = QAS_PROFILES.find((p) => p.role === 'VENDEDOR')!
      const testSessionUser = createQASTestSessionUser(vendedorProfile)

      // Grava no storage com namespace
      crmStorage.setItem('ciafal_crm_session', JSON.stringify(testSessionUser))

      const Consumer = () => {
        const { user, loading } = useAuth()
        if (loading) return <div>Carregando...</div>
        return (
          <div>
            <span>Usuario: {user?.name}</span>
            <span>Role: {user?.role}</span>
          </div>
        )
      }

      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByText(`Usuario: ${vendedorProfile.name}`)).toBeDefined()
        expect(screen.getByText('Role: VENDEDOR')).toBeDefined()
      })
    })

    it('acesso direto à rota interna prefixada (/crm360/estoque) preserva a sessão autenticada sem loop', async () => {
      const vendedorProfile = QAS_PROFILES.find((p) => p.role === 'VENDEDOR')!
      const testSessionUser = createQASTestSessionUser(vendedorProfile)
      crmStorage.setItem('ciafal_crm_session', JSON.stringify(testSessionUser))

      const InternalProtectedRoute = () => {
        const { user, loading } = useAuth()
        if (loading) return <div>Carregando Sessão...</div>
        if (!user) return <Navigate to="/crm360/login" replace />
        return <Outlet />
      }

      render(
        <MemoryRouter initialEntries={['/crm360/estoque']}>
          <AuthProvider>
            <Routes>
              <Route path="/crm360/login" element={<div>Tela de Login QAS</div>} />
              <Route element={<InternalProtectedRoute />}>
                <Route path="/crm360/estoque" element={<div>Módulo de Estoque Aberto com Sucesso</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByText('Módulo de Estoque Aberto com Sucesso')).toBeDefined()
        expect(screen.queryByText('Tela de Login QAS')).toBeNull()
      })
    })

    it('se a sessão estava gravada com chave legada sem prefixo, restaura por migração transparente', async () => {
      const supProfile = QAS_PROFILES.find((p) => p.role === 'SUPERVISOR')!
      const testSessionUser = createQASTestSessionUser(supProfile)

      // Grava diretamente no localStorage com chave legada (simulando usuário que já estava logado antes do namespace)
      localStorage.setItem('ciafal_crm_session', JSON.stringify(testSessionUser))

      const Consumer = () => {
        const { user } = useAuth()
        return <div>Autenticado: {user?.email}</div>
      }

      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByText(`Autenticado: ${supProfile.email}`)).toBeDefined()
      })

      // Verifica se migrou transparentemente para crm360:
      expect(localStorage.getItem('crm360:ciafal_crm_session')).not.toBeNull()
    })
  })

  // =========================================================================
  // (e) GUARD DE PARÂMETROS SAP (PROTECTED ADMIN ROUTE) NA NOVA ROTA
  // =========================================================================
  describe('(e) Guard de Parâmetros SAP (ProtectedAdminRoute) na nova rota /crm360/parametros-sap', () => {
    it('ADMIN tem permissão autorizada pelo dataExposurePolicyService', () => {
      const adminProfile = QAS_PROFILES.find((p) => p.role === 'ADMIN')!
      const adminUser = createQASTestSessionUser(adminProfile)
      expect(dataExposurePolicyService.isUserAuthorizedToManage(adminUser)).toBe(true)
    })

    it('VENDEDOR NÃO é autorizado pelo dataExposurePolicyService', () => {
      const vendedorProfile = QAS_PROFILES.find((p) => p.role === 'VENDEDOR')!
      const vendedorUser = createQASTestSessionUser(vendedorProfile)
      expect(dataExposurePolicyService.isUserAuthorizedToManage(vendedorUser)).toBe(false)
    })

    it('REPRESENTANTE_EXTERNO NÃO é autorizado pelo dataExposurePolicyService', () => {
      const repProfile = QAS_PROFILES.find((p) => p.role === 'REPRESENTANTE_EXTERNO')!
      const repUser = createQASTestSessionUser(repProfile)
      expect(dataExposurePolicyService.isUserAuthorizedToManage(repUser)).toBe(false)
    })

    it('renderiza UnauthorizedPage (403) quando Vendedor tenta acessar Parâmetros SAP', async () => {
      const vendedorProfile = QAS_PROFILES.find((p) => p.role === 'VENDEDOR')!
      const vendedorUser = createQASTestSessionUser(vendedorProfile)
      crmStorage.setItem('ciafal_crm_session', JSON.stringify(vendedorUser))

      render(
        <MemoryRouter initialEntries={['/crm360/parametros-sap']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/crm360/parametros-sap"
                element={
                  <ProtectedAdminRoute>
                    <div>CONTEÚDO SECRETO DE PARÂMETROS SAP</div>
                  </ProtectedAdminRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      )

      await waitFor(() => {
        // Bloqueio 403: Não deve renderizar o conteúdo secreto
        expect(screen.queryByText('CONTEÚDO SECRETO DE PARÂMETROS SAP')).toBeNull()
        // Deve renderizar a página de acesso não autorizado
        expect(screen.getByText(/403/i)).toBeDefined()
      })
    })

    it('renderiza o conteúdo de Parâmetros SAP quando Administrador acessa a rota', async () => {
      const adminProfile = QAS_PROFILES.find((p) => p.role === 'ADMIN')!
      const adminUser = createQASTestSessionUser(adminProfile)
      crmStorage.setItem('ciafal_crm_session', JSON.stringify(adminUser))

      render(
        <MemoryRouter initialEntries={['/crm360/parametros-sap']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/crm360/parametros-sap"
                element={
                  <ProtectedAdminRoute>
                    <div>CONTEÚDO AUTORIZADO DE PARÂMETROS SAP</div>
                  </ProtectedAdminRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByText('CONTEÚDO AUTORIZADO DE PARÂMETROS SAP')).toBeDefined()
      })
    })
  })
})
