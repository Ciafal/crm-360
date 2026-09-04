import { describe, it, expect, beforeEach } from 'vitest'
import {
  DataExposurePolicyService,
  INITIAL_EXPOSURE_POLICIES,
} from '@/services/data_exposure_policy_service'
import { catalogoService } from '@/services/catalogoService'

describe('Central de Parâmetros de Dados SAP e Regras de Exposição (Requisito 11)', () => {
  let service: DataExposurePolicyService

  const vendedorUser = {
    id: 'user-vendedor-01',
    name: 'Carlos Vendedor',
    role: 'VENDEDOR',
    email: 'vendedor@ciafal.com.br',
  }

  const representanteUser = {
    id: 'user-rep-01',
    name: 'Roberto Representante',
    role: 'REPRESENTANTE_EXTERNO',
    email: 'representante@ciafal.com.br',
  }

  const adminUser = {
    id: 'user-admin-01',
    name: 'Fabiano Admin',
    role: 'ADMINISTRADOR',
    email: 'admin.teste@ciafal.local',
  }

  const gerenteUser = {
    id: 'user-gerente-01',
    name: 'Marcos Gerente',
    role: 'GERENTE',
    email: 'gerente@ciafal.com.br',
  }

  beforeEach(() => {
    service = DataExposurePolicyService.getInstance()
    // Resetar para as configurações de fábrica
    service.savePolicies(JSON.parse(JSON.stringify(INITIAL_EXPOSURE_POLICIES)))
  })

  // CASO 1: SAP = 124,7 t → "50 t+"
  it('Caso 1: SAP = 124,7 t para Vendedor deve retornar "50 t+", isCapped=true, canRequestCheck=false', () => {
    const result = service.evaluateStockExposure(124.7, vendedorUser)

    expect(result.authorized).toBe(true)
    expect(result.displayValue).toBe('50 t+')
    expect(result.numericDisplayValue).toBe(50)
    expect(result.isCapped).toBe(true)
    expect(result.isLowStock).toBe(false)
    expect(result.canRequestCheck).toBe(false)
    // Proteção de dados: saldo integral NUNCA é transmitido
    expect(result.originalValueHidden).toBe(true)
    expect(result.actualValueAudited).toBeUndefined()
  })

  // CASO 2: SAP = 50,00 t → "50,00 t"
  it('Caso 2: SAP = 50,00 t para Vendedor deve retornar "50,00 t", isCapped=false, canRequestCheck=false', () => {
    const result = service.evaluateStockExposure(50.0, vendedorUser)

    expect(result.authorized).toBe(true)
    expect(result.displayValue).toBe('50,00 t')
    expect(result.numericDisplayValue).toBe(50.0)
    expect(result.isCapped).toBe(false)
    expect(result.canRequestCheck).toBe(false)
  })

  // CASO 3: SAP = 27,8 t → "27,80 t"
  it('Caso 3: SAP = 27,8 t para Vendedor deve retornar "27,80 t", isCapped=false, canRequestCheck=false', () => {
    const result = service.evaluateStockExposure(27.8, vendedorUser)

    expect(result.authorized).toBe(true)
    expect(result.displayValue).toBe('27,80 t')
    expect(result.numericDisplayValue).toBe(27.8)
    expect(result.isCapped).toBe(false)
    expect(result.isLowStock).toBe(false)
    expect(result.canRequestCheck).toBe(false)
  })

  // CASO 4: SAP = 5 t → "5,00 t" sem checagem
  it('Caso 4: SAP = 5 t para Vendedor deve retornar "5,00 t" sem checagem física habilitada', () => {
    const result = service.evaluateStockExposure(5.0, vendedorUser)

    expect(result.authorized).toBe(true)
    expect(result.displayValue).toBe('5,00 t')
    expect(result.canRequestCheck).toBe(false)
    expect(result.isLowStock).toBe(false)
  })

  // CASO 5: SAP = 4,99 t → "4,99 t" com checagem
  it('Caso 5: SAP = 4,99 t para Vendedor deve retornar "4,99 t" com checagem física habilitada e baixo estoque', () => {
    const result = service.evaluateStockExposure(4.99, vendedorUser)

    expect(result.authorized).toBe(true)
    expect(result.displayValue).toBe('4,99 t')
    expect(result.numericDisplayValue).toBe(4.99)
    expect(result.isLowStock).toBe(true)
    expect(result.canRequestCheck).toBe(true)
    expect(result.slaHours).toBe(48)
  })

  // CASO 6: SAP = 0 t → "Sem estoque disponível" com checagem
  it('Caso 6: SAP = 0 t para Vendedor deve retornar "Sem estoque disponível" e canRequestCheck=true', () => {
    const result = service.evaluateStockExposure(0, vendedorUser)

    expect(result.authorized).toBe(true)
    expect(result.displayValue).toBe('Sem estoque disponível')
    expect(result.numericDisplayValue).toBe(0)
    expect(result.canRequestCheck).toBe(true)
    expect(result.originalValueHidden).toBe(true)
  })

  // CASO 6B: Estoque negativo do SAP nunca deve ser exibido como disponível
  it('Caso 6B: SAP < 0 t não deve expor número negativo', () => {
    const result = service.evaluateStockExposure(-12.5, vendedorUser)

    expect(result.displayValue).toBe('Sem estoque disponível')
    expect(result.numericDisplayValue).toBe(0)
    expect(result.canRequestCheck).toBe(true)
  })

  // CASO 7: Vendedor acessando gerenciamento de parâmetros → 403 Forbidden
  it('Caso 7: Vendedor tentando gerenciar parâmetros deve receber HTTP 403 Forbidden', () => {
    expect(service.isUserAuthorizedToManage(vendedorUser)).toBe(false)
    expect(service.isUserAuthorizedToManage(representanteUser)).toBe(false)

    expect(() => {
      service.enforceManagementAccess(vendedorUser)
    }).toThrow(/403/)

    expect(() => {
      service.updatePolicy(
        'pol-stock-display-limit',
        { maxDisplayedValue: 30 },
        vendedorUser,
        'Tentativa não autorizada',
      )
    }).toThrow(/403/)
  })

  // CASO 8: Endpoint / serviço catalogoService não retorna estoque integral a vendedor comercial
  it('Caso 8: catalogoService.consultarEstoqueIndividual aplica capping e oculta saldo integral para Vendedor', async () => {
    // Mat-001 possui 83.4 t no mock de catálogo (CATALOG_MATERIALS)
    const response = await catalogoService.consultarEstoqueIndividual(
      vendedorUser as any,
      'TUB-IND-001',
    )

    expect(response.autorizado).toBe(true)
    expect(response.produto).toBeDefined()
    expect(response.produto?.displayValue).toBe('50 t+')
    expect(response.produto?.isCapped).toBe(true)
    // O valor em toneladas entregue ao frontend comercial é limitado a 50 (nunca 83.4!)
    expect(response.produto?.disponivelTons).toBe(50)
  })

  // CASO 9: Admin e Gerente acessam e configuram parâmetros com auditoria imutável
  it('Caso 9: Admin e Gerente possuem permissão de gerenciamento e alteração registra auditoria', () => {
    expect(service.isUserAuthorizedToManage(adminUser)).toBe(true)
    expect(service.isUserAuthorizedToManage(gerenteUser)).toBe(true)

    const updated = service.updatePolicy(
      'pol-stock-display-limit',
      { maxDisplayedValue: 40 },
      gerenteUser,
      'Ajuste trimestral da política de segurança de estoque CIAFAL',
    )

    expect(updated.maxDisplayedValue).toBe(40)
    expect(updated.lastModifiedBy).toBe('Marcos Gerente')

    const auditLogs = service.getAuditLogs()
    expect(auditLogs.length).toBeGreaterThan(0)
    expect(auditLogs[0].policyCode).toBe('CRM_SAP_STOCK_DISPLAY_LIMIT')
    expect(auditLogs[0].justification).toContain('Ajuste trimestral')
    expect(auditLogs[0].changedBy).toBe('Marcos Gerente')
  })

  // CASO 10: Gerente altera 50 → 40 t, SAP = 72 t → Vendedor passa a receber "40 t+" imediatamente sem rebuild
  it('Caso 10: Gerente altera limite para 40 t; SAP = 72 t gera "40 t+" imediatamente', () => {
    // 1. Antes da alteração: limite padrão é 50 t -> 72 t gera "50 t+"
    const antes = service.evaluateStockExposure(72.0, vendedorUser)
    expect(antes.displayValue).toBe('50 t+')

    // 2. Gerente altera o limite para 40 t
    service.updatePolicy(
      'pol-stock-display-limit',
      { maxDisplayedValue: 40.0 },
      gerenteUser,
      'Redução de exposição para 40 t',
    )

    // 3. Imediatamente (sem rebuild), a avaliação passa a retornar 40 t+
    const depois = service.evaluateStockExposure(72.0, vendedorUser)
    expect(depois.displayValue).toBe('40 t+')
    expect(depois.numericDisplayValue).toBe(40.0)
    expect(depois.isCapped).toBe(true)
  })

  // CASO BÔNUS: Perfil isento (Admin/Supervisor) visualiza o saldo integral auditado
  it('Caso Bônus: Perfil isento (Admin / Gerente / Supervisor) visualiza o saldo integral com auditoria', () => {
    const resAdmin = service.evaluateStockExposure(124.7, adminUser)
    expect(resAdmin.isCapped).toBe(false)
    expect(resAdmin.displayValue).toBe('124,70 t')
    expect(resAdmin.numericDisplayValue).toBe(124.7)
    expect(resAdmin.originalValueHidden).toBe(false)
    expect(resAdmin.actualValueAudited).toBe(124.7)
  })
})
