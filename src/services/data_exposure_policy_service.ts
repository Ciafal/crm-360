import type {
  DataExposurePolicy,
  ExposurePolicyAuditLog,
  ExposedValueResult,
} from '@/types/data_exposure_policy'
import { crmStorage } from '@/lib/crm-storage'

const STORAGE_KEY_POLICIES = 'ciafal_data_exposure_policies_v1'
const STORAGE_KEY_AUDIT = 'ciafal_data_exposure_audit_v1'

/**
 * SEED IDEMPOTENTE INICIAL CONFORME ESPECIFICAÇÃO
 * 1. CRM_SAP_STOCK_DISPLAY_LIMIT: limite 50 t para perfis comerciais (VENDEDOR, REPRESENTANTE_EXTERNO)
 * 2. CRM_SAP_STOCK_CHECK_THRESHOLD: limiar < 5 t habilita checagem física
 * 3. STOCK_CHECK_SLA_HOURS: SLA padrão de 48 horas
 *
 * Estrutura 100% genérica para suportar no futuro: CRÉDITO, PREÇO, MARGEM, CUSTO, IDADE DE ESTOQUE, LOTE.
 */
export const INITIAL_EXPOSURE_POLICIES: DataExposurePolicy[] = [
  {
    id: 'pol-stock-display-limit',
    code: 'CRM_SAP_STOCK_DISPLAY_LIMIT',
    name: 'Limite de Exposição de Estoque Disponível SAP',
    category: 'ESTOQUE',
    originSystem: 'SAP ECC',
    integrationType: 'RFC/BAPI Staging (ZSD_ESTOQUE_SRV)',
    sapObject: 'MARD/MARC',
    sourceField: 'LABST (Estoque de Utilização Livre)',
    unit: 't',
    consumerModule: 'CRM 360º / Cotações / Consultas',
    screenFeature: 'Catálogo, Grid de Cotação, Consulta Individual, Cockpit Comercial',
    affectedRoles: ['VENDEDOR', 'REPRESENTANTE_EXTERNO'],
    exemptRoles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'GERENTE', 'DIRETORIA'],
    ruleType: 'LIMITE_SUPERIOR',
    minValue: 0,
    maxDisplayedValue: 50.0,
    aboveLimitText: '+',
    actionTrigger: 'NENHUM',
    status: 'ATIVO',
    validFrom: '2024-01-01',
    description:
      'Limita o saldo de estoque disponível exibido no CRM para usuários comerciais a no máximo 50 t. Se saldo SAP for maior que o limite, exibe 50 t+ sem revelar o valor real.',
    lastModifiedAt: '2025-01-15 08:00',
    lastModifiedBy: 'Administrador Master',
    lastModifiedByRole: 'ADMIN',
    version: 1,
  },
  {
    id: 'pol-stock-check-threshold',
    code: 'CRM_SAP_STOCK_CHECK_THRESHOLD',
    name: 'Limiar para Solicitação de Checagem Física de Estoque',
    category: 'ESTOQUE',
    originSystem: 'SAP ECC / WMS',
    integrationType: 'RFC/BAPI + WMS Gateway',
    sapObject: 'MARD',
    sourceField: 'LABST / MD04',
    unit: 't',
    consumerModule: 'CRM 360º / Cotações / Consultas / Estoque',
    screenFeature: 'Botão de Solicitar Checagem no CRM e WMS',
    affectedRoles: ['VENDEDOR', 'REPRESENTANTE_EXTERNO', 'SUPERVISOR', 'ADMIN'],
    exemptRoles: [],
    ruleType: 'FAIXA',
    minValue: 0,
    triggerThreshold: 5.0,
    actionTrigger: 'SOLICITAR_CHECAGEM',
    status: 'ATIVO',
    validFrom: '2024-01-01',
    description:
      'Estoque a partir do qual é permitida solicitação de confirmação física. Se estoque < 5 t → habilita botão "Solicitar checagem"; se >= 5 t → sem botão de checagem.',
    lastModifiedAt: '2025-01-15 08:00',
    lastModifiedBy: 'Administrador Master',
    lastModifiedByRole: 'ADMIN',
    version: 1,
  },
  {
    id: 'pol-stock-check-sla',
    code: 'STOCK_CHECK_SLA_HOURS',
    name: 'SLA de Atendimento da Checagem Física WMS/Pátio',
    category: 'LOGISTICA',
    originSystem: 'SAP / WMS CIAFAL',
    integrationType: 'WMS Dispatch Service',
    sapObject: 'WMS_ORDEM_CONFERENCIA',
    sourceField: 'SLA_HOURS',
    unit: 'h',
    consumerModule: 'WMS / Estoque / Cotações',
    screenFeature: 'Prazo limite no card de checagem física',
    affectedRoles: ['VENDEDOR', 'REPRESENTANTE_EXTERNO', 'SUPERVISOR'],
    exemptRoles: ['ADMIN'],
    ruleType: 'LIMITE_SUPERIOR',
    maxDisplayedValue: 48,
    slaHours: 48,
    actionTrigger: 'NENHUM',
    status: 'ATIVO',
    validFrom: '2024-01-01',
    description:
      'SLA padrão para retorno da checagem física de pátio pela equipe WMS após solicitação do CRM. Valor inicial 48 horas.',
    lastModifiedAt: '2025-01-15 08:00',
    lastModifiedBy: 'Administrador Master',
    lastModifiedByRole: 'ADMIN',
    version: 1,
  },
  {
    id: 'pol-credit-exposure-limit',
    code: 'CRM_SAP_CREDIT_DISPLAY_RULE',
    name: 'Governança de Exposição de Limite de Crédito F.35',
    category: 'CREDITO',
    originSystem: 'SAP ECC',
    integrationType: 'BAPI_CREDIT_ACCOUNT_GET_DETAIL',
    sapObject: 'KNKK',
    sourceField: 'KLIMK (Limite de Crédito Concedido)',
    unit: 'R$',
    consumerModule: 'Gestão de Clientes / CRM 360º',
    screenFeature: 'Card Financeiro do Cliente',
    affectedRoles: ['REPRESENTANTE_EXTERNO'],
    exemptRoles: ['ADMIN', 'SUPERVISOR', 'VENDEDOR'],
    ruleType: 'MASCARAMENTO',
    status: 'ATIVO',
    validFrom: '2024-06-01',
    description:
      'Governança de exibição do limite de crédito do cliente para representantes externos (apenas status Regular/Bloqueado).',
    lastModifiedAt: '2025-01-10 14:30',
    lastModifiedBy: 'Administrador Master',
    lastModifiedByRole: 'ADMIN',
    version: 1,
  },
  {
    id: 'pol-margin-exposure-limit',
    code: 'CRM_SAP_MARGIN_DISPLAY_RULE',
    name: 'Governança de Exposição de Margem de Contribuição',
    category: 'MARGEM',
    originSystem: 'SAP ECC / CO-PA',
    integrationType: 'RFC_CALCULATE_MARGIN',
    sapObject: 'COPA',
    sourceField: 'CONTRIBUTION_MARGIN_PCT',
    unit: '%',
    consumerModule: 'Cotações / Cockpit Comercial',
    screenFeature: 'Indicador de Margem do Item',
    affectedRoles: ['VENDEDOR', 'REPRESENTANTE_EXTERNO'],
    exemptRoles: ['ADMIN', 'SUPERVISOR', 'GERENTE'],
    ruleType: 'FAIXA',
    status: 'ATIVO',
    validFrom: '2024-06-01',
    description:
      'Substitui o percentual exato da margem por faixas conceituais (Excelente, Regular, Requer Alçada).',
    lastModifiedAt: '2025-01-10 14:30',
    lastModifiedBy: 'Administrador Master',
    lastModifiedByRole: 'ADMIN',
    version: 1,
  },
]

export class DataExposurePolicyService {
  private static instance: DataExposurePolicyService
  private cacheVersion = 0

  public static getInstance(): DataExposurePolicyService {
    if (!DataExposurePolicyService.instance) {
      DataExposurePolicyService.instance = new DataExposurePolicyService()
    }
    return DataExposurePolicyService.instance
  }

  // =========================================================================
  // 1. CARREGAMENTO E PERSISTÊNCIA DOS PARÂMETROS
  // =========================================================================

  public getPolicies(): DataExposurePolicy[] {
    try {
      const parsed = crmStorage.getJSON<DataExposurePolicy[] | null>(STORAGE_KEY_POLICIES, null)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    } catch {
      /* ignore */
    }
    // Seed idempotente inicial
    this.savePolicies(INITIAL_EXPOSURE_POLICIES)
    return INITIAL_EXPOSURE_POLICIES
  }

  public savePolicies(policies: DataExposurePolicy[]): void {
    try {
      crmStorage.setJSON(STORAGE_KEY_POLICIES, policies)
      this.cacheVersion++
    } catch {
      /* ignore */
    }
  }

  public getPolicyByCode(code: string): DataExposurePolicy | undefined {
    return this.getPolicies().find((p) => p.code === code && p.status === 'ATIVO')
  }

  // =========================================================================
  // 2. AUDITORIA IMUTÁVEL DE ALTERAÇÕES
  // =========================================================================

  public getAuditLogs(): ExposurePolicyAuditLog[] {
    try {
      const parsed = crmStorage.getJSON<ExposurePolicyAuditLog[]>(STORAGE_KEY_AUDIT, [])
      if (Array.isArray(parsed)) return parsed
    } catch {
      /* ignore */
    }
    return []
  }

  public saveAuditLogs(logs: ExposurePolicyAuditLog[]): void {
    try {
      crmStorage.setJSON(STORAGE_KEY_AUDIT, logs)
    } catch {
      /* ignore */
    }
  }

  public registerAudit(
    entry: Omit<ExposurePolicyAuditLog, 'id' | 'changedAt'>,
  ): ExposurePolicyAuditLog {
    const logs = this.getAuditLogs()
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const newLog: ExposurePolicyAuditLog = {
      ...entry,
      id: `audit-pol-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      changedAt: nowStr,
    }

    logs.unshift(newLog)
    if (logs.length > 500) logs.pop() // Manter últimos 500 logs
    this.saveAuditLogs(logs)
    return newLog
  }

  // =========================================================================
  // 3. CONTROLE DE ACESSO (RBAC) DA CENTRAL DE PARÂMETROS
  // Somente ADMINISTRADOR e GERENTE/SUPERVISOR podem visualizar/gerenciar
  // Vendedor, Representante e demais recebem negação (403)
  // =========================================================================

  public isUserAuthorizedToManage(
    user: { role?: string; email?: string } | null | undefined,
  ): boolean {
    if (!user) return false
    const role = (user.role || '').toString().trim().toUpperCase()
    // Perfis autorizados: ADMIN, ADMINISTRADOR, SUPERVISOR, GERENTE, DIRETORIA
    const allowed = [
      'ADMIN',
      'ADMINISTRADOR',
      'SUPERVISOR',
      'GERENTE',
      'GERENTE_COMERCIAL',
      'DIRETORIA',
    ]
    if (allowed.includes(role)) return true
    if (user.email === 'admin.teste@ciafal.local' || user.email === 'fabiano@adapta.org')
      return true
    return false
  }

  public enforceManagementAccess(user: { role?: string; email?: string } | null | undefined): void {
    if (!this.isUserAuthorizedToManage(user)) {
      const err = new Error(
        'HTTP 403 - Acesso não autorizado. Apenas Administrador e Gerente podem gerenciar parâmetros SAP.',
      )
      ;(err as any).statusCode = 403
      throw err
    }
  }

  // =========================================================================
  // 4. ATUALIZAÇÃO / PUBLICAÇÃO SEGURA DE PARÂMETROS
  // Alteração passa a valer IMEDIATAMENTE sem rebuild
  // =========================================================================

  public updatePolicy(
    policyId: string,
    updates: Partial<DataExposurePolicy>,
    operator: { id?: string; name: string; role: string },
    justification: string,
  ): DataExposurePolicy {
    this.enforceManagementAccess(operator)

    if (!justification || justification.trim().length < 5) {
      throw new Error(
        'A justificativa é obrigatória para alteração de parâmetros sensíveis SAP (mínimo 5 caracteres).',
      )
    }

    const policies = this.getPolicies()
    const index = policies.findIndex((p) => p.id === policyId || p.code === policyId)
    if (index < 0) {
      throw new Error(`Parâmetro com ID ${policyId} não encontrado.`)
    }

    const current = policies[index]
    const previousSnapshot = { ...current }

    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const updated: DataExposurePolicy = {
      ...current,
      ...updates,
      version: (current.version || 1) + 1,
      lastModifiedAt: nowStr,
      lastModifiedBy: operator.name,
      lastModifiedByRole: operator.role,
    }

    policies[index] = updated
    this.savePolicies(policies)

    // Registrar auditoria imutável
    this.registerAudit({
      policyId: updated.id,
      policyCode: updated.code,
      consumerModule: updated.consumerModule,
      sourceField: updated.sourceField,
      ruleType: updated.ruleType,
      previousValue: {
        maxDisplayedValue: previousSnapshot.maxDisplayedValue,
        triggerThreshold: previousSnapshot.triggerThreshold,
        slaHours: previousSnapshot.slaHours,
        status: previousSnapshot.status,
      },
      newValue: {
        maxDisplayedValue: updated.maxDisplayedValue,
        triggerThreshold: updated.triggerThreshold,
        slaHours: updated.slaHours,
        status: updated.status,
      },
      changedBy: operator.name,
      changedByRole: operator.role,
      justification: justification.trim(),
      snapshot: updated,
    })

    return updated
  }

  // =========================================================================
  // 5. MOTOR CENTRAL DE EXPOSIÇÃO DE DADOS (DataExposurePolicyService)
  //
  // FLUXO:
  //   Valor Real SAP
  //       ↓
  //   DataExposurePolicyService (resolve política ativa)
  //       ↓
  //   Regra por perfil / módulo / campo
  //       ↓
  //   Valor Autorizado { displayValue, isCapped, canRequestCheck }
  //
  // SEGURANÇA: Se o usuário não for isento, o valor integral NÃO é transmitido!
  // =========================================================================

  /**
   * Formata número para o padrão pt-BR / ABNT com separador decimal por vírgula.
   * Ex: 3.25 -> "3,25 t", 5 -> "5,00 t", 50 -> "50,00 t"
   */
  public formatQuantityBR(val: number, unit = 't', decimals = 2): string {
    const formattedNum = val.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    return `${formattedNum} ${unit}`
  }

  /**
   * Avalia a exposição do Estoque Disponível SAP para um dado perfil de usuário.
   *
   * Regras estritas:
   * - SAP = 83,40 t e Limite = 50 t → "50 t+" (isCapped = true, canRequestCheck = false)
   * - SAP = 50,00 t → "50,00 t" (isCapped = false, canRequestCheck = false)
   * - SAP = 32,75 t → "32,75 t" (isCapped = false, canRequestCheck = false)
   * - SAP = 8,20 t → "8,20 t" (isCapped = false, canRequestCheck = false)
   * - SAP < 5 t (ex: 4,70 t) → "4,70 t" (isLowStock = true, canRequestCheck = true)
   * - SAP = 0 → "Sem estoque disponível" (canRequestCheck = true)
   * - SAP < 0 → Nunca exibir quantidade negativa como disponível; trata como 0 ("Sem estoque disponível")
   * - Unidade SEMPRE "t" com vírgula padrão ABNT pt-BR
   */
  public evaluateStockExposure(
    actualStockTons: number,
    currentUser: { id?: string; role?: string; email?: string } | null | undefined,
    options?: { consumerModule?: string },
  ): ExposedValueResult {
    // 1. Sanitizar valor de entrada: estoque negativo nunca é exibido como disponível
    const sanitizedStock = Math.max(0, Number(actualStockTons) || 0)

    // 2. Carregar parâmetros ativos dinamicamente
    const limitPolicy = this.getPolicyByCode('CRM_SAP_STOCK_DISPLAY_LIMIT')
    const thresholdPolicy = this.getPolicyByCode('CRM_SAP_STOCK_CHECK_THRESHOLD')
    const slaPolicy = this.getPolicyByCode('STOCK_CHECK_SLA_HOURS')

    const maxLimit = limitPolicy?.maxDisplayedValue ?? 50.0
    const checkThreshold = thresholdPolicy?.triggerThreshold ?? 5.0
    const slaHours = slaPolicy?.slaHours ?? slaPolicy?.maxDisplayedValue ?? 48
    const unit = limitPolicy?.unit || 't'

    // 3. Checar se o perfil do usuário é ISENTO da regra de corte
    const userRole = (currentUser?.role || '').toString().trim().toUpperCase()

    // Regra de Isenção: ADMIN e SUPERVISOR/GERENTE podem visualizar valor integral
    const isExempt =
      userRole === 'ADMIN' ||
      userRole === 'ADMINISTRADOR' ||
      userRole === 'SUPERVISOR' ||
      userRole === 'GERENTE' ||
      userRole === 'GERENTE_COMERCIAL' ||
      userRole === 'DIRETORIA' ||
      currentUser?.email === 'admin.teste@ciafal.local'

    // Checar se o perfil está na lista de afetados da política de limite
    const affectedRoles = limitPolicy?.affectedRoles?.map((r) => r.toUpperCase()) || [
      'VENDEDOR',
      'REPRESENTANTE_EXTERNO',
    ]
    const isRoleSubjectToLimit =
      !isExempt && (affectedRoles.includes(userRole) || affectedRoles.includes('ALL'))

    // 4. AVALIAÇÃO DE CHECAGEM (< limiar)
    const canRequestCheck = sanitizedStock < checkThreshold
    const isLowStock = sanitizedStock > 0 && sanitizedStock < checkThreshold

    // 5. SE ISENTO: recebe o valor real formatado com auditoria
    if (isExempt) {
      if (sanitizedStock === 0) {
        return {
          authorized: true,
          displayValue: 'Sem estoque disponível',
          numericDisplayValue: 0,
          unit,
          isCapped: false,
          isLowStock: false,
          canRequestCheck: true,
          appliedRule: 'PERFIL_ISENTO_AUDITADO',
          slaHours,
          originalValueHidden: false,
          actualValueAudited: sanitizedStock,
          tooltip: 'Perfil gestor/admin com acesso ao saldo físico integral auditado.',
        }
      }

      return {
        authorized: true,
        displayValue: this.formatQuantityBR(sanitizedStock, unit),
        numericDisplayValue: sanitizedStock,
        unit,
        isCapped: false,
        isLowStock,
        canRequestCheck,
        appliedRule: 'PERFIL_ISENTO_AUDITADO',
        slaHours,
        originalValueHidden: false,
        actualValueAudited: sanitizedStock,
        tooltip: `Saldo integral auditado: ${this.formatQuantityBR(sanitizedStock, unit)}`,
      }
    }

    // 6. SE SUJEITO À REGRA COMERCIAL (Vendedor / Representante):
    // CASO A: Estoque ZERO
    if (sanitizedStock === 0) {
      return {
        authorized: true,
        displayValue: 'Sem estoque disponível',
        numericDisplayValue: 0,
        unit,
        isCapped: false,
        isLowStock: false,
        canRequestCheck: true,
        appliedRule: limitPolicy?.code || 'CRM_SAP_STOCK_DISPLAY_LIMIT',
        slaHours,
        originalValueHidden: true, // Valor integral omitido
        tooltip: 'Sem saldo disponível para faturamento imediato no SAP.',
      }
    }

    // CASO B: Estoque ACIMA do limite (ex: 83,40 t > 50 t)
    // Regra estrita: exibir "50 t+" (nunca o valor real)
    if (isRoleSubjectToLimit && sanitizedStock > maxLimit) {
      const displayValue = `${Math.round(maxLimit)} ${unit}+` // ex: "50 t+"
      return {
        authorized: true,
        displayValue,
        numericDisplayValue: maxLimit,
        unit,
        isCapped: true,
        isLowStock: false,
        canRequestCheck: false,
        appliedRule: limitPolicy?.code || 'CRM_SAP_STOCK_DISPLAY_LIMIT',
        slaHours,
        originalValueHidden: true, // NUNCA expor o saldo real!
        tooltip:
          'Quantidade disponível acima do limite de exibição definido pela política comercial.',
      }
    }

    // CASO C: Estoque entre limiar e limite (ex: 50 t, 32,75 t, 8,20 t, 5 t)
    // Se for exatamente o limite ou menor, exibe o valor formatado
    if (sanitizedStock >= checkThreshold) {
      return {
        authorized: true,
        displayValue: this.formatQuantityBR(sanitizedStock, unit),
        numericDisplayValue: sanitizedStock,
        unit,
        isCapped: false,
        isLowStock: false,
        canRequestCheck: false,
        appliedRule: limitPolicy?.code || 'CRM_SAP_STOCK_DISPLAY_LIMIT',
        slaHours,
        originalValueHidden: false,
        tooltip: `Disponibilidade comercial: ${this.formatQuantityBR(sanitizedStock, unit)}`,
      }
    }

    // CASO D: Estoque BAIXO (< 5 t, ex: 4,70 t, 3,25 t, 4,99 t)
    // Exibe valor formatado + indicador discreto de baixo estoque + habilita solicitação de checagem
    return {
      authorized: true,
      displayValue: this.formatQuantityBR(sanitizedStock, unit),
      numericDisplayValue: sanitizedStock,
      unit,
      isCapped: false,
      isLowStock: true,
      canRequestCheck: true,
      appliedRule: thresholdPolicy?.code || 'CRM_SAP_STOCK_CHECK_THRESHOLD',
      slaHours,
      originalValueHidden: false,
      tooltip: 'Baixo estoque físico: solicitação de checagem no pátio disponível.',
    }
  }

  // =========================================================================
  // 6. SIMULADOR DE POLÍTICA EM TEMPO REAL
  // Permite ao Administrador testar valores e perfis antes de salvar
  // =========================================================================

  public simulatePolicyResult(
    actualValue: number,
    role: string,
    customParams?: {
      maxLimit?: number
      checkThreshold?: number
      unit?: string
    },
  ): ExposedValueResult {
    const mockUser = { id: 'sim-user', role, email: `${role.toLowerCase()}@teste.local` }

    if (customParams) {
      // Simulação com parâmetros temporários ainda não salvos
      const sanitized = Math.max(0, Number(actualValue) || 0)
      const maxLimit = customParams.maxLimit ?? 50.0
      const threshold = customParams.checkThreshold ?? 5.0
      const unit = customParams.unit || 't'

      const isExempt = ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'GERENTE', 'DIRETORIA'].includes(
        role.toUpperCase(),
      )

      if (isExempt) {
        return {
          authorized: true,
          displayValue:
            sanitized === 0 ? 'Sem estoque disponível' : this.formatQuantityBR(sanitized, unit),
          numericDisplayValue: sanitized,
          unit,
          isCapped: false,
          isLowStock: sanitized > 0 && sanitized < threshold,
          canRequestCheck: sanitized < threshold,
          appliedRule: 'SIMULACAO_PERFIL_ISENTO',
          originalValueHidden: false,
          actualValueAudited: sanitized,
          tooltip: 'Perfil gestor/admin (simulação).',
        }
      }

      if (sanitized === 0) {
        return {
          authorized: true,
          displayValue: 'Sem estoque disponível',
          numericDisplayValue: 0,
          unit,
          isCapped: false,
          isLowStock: false,
          canRequestCheck: true,
          appliedRule: 'SIMULACAO_ESTOQUE_ZERO',
          originalValueHidden: true,
          tooltip: 'Sem estoque disponível (simulação).',
        }
      }

      if (sanitized > maxLimit) {
        return {
          authorized: true,
          displayValue: `${Math.round(maxLimit)} ${unit}+`,
          numericDisplayValue: maxLimit,
          unit,
          isCapped: true,
          isLowStock: false,
          canRequestCheck: false,
          appliedRule: 'SIMULACAO_LIMITE_SUPERIOR',
          originalValueHidden: true,
          tooltip: 'Quantidade disponível acima do limite (simulação).',
        }
      }

      return {
        authorized: true,
        displayValue: this.formatQuantityBR(sanitized, unit),
        numericDisplayValue: sanitized,
        unit,
        isCapped: false,
        isLowStock: sanitized < threshold,
        canRequestCheck: sanitized < threshold,
        appliedRule: 'SIMULACAO_VALOR_AUTORIZADO',
        originalValueHidden: false,
        tooltip: 'Valor autorizado (simulação).',
      }
    }

    return this.evaluateStockExposure(actualValue, mockUser)
  }

  // =========================================================================
  // 7. RESTAURAÇÃO DE PADRÕES (Reset Idempotente para Homologação)
  // =========================================================================

  public resetToDefaults(operator: { id?: string; name: string; role: string }): void {
    this.enforceManagementAccess(operator)
    this.savePolicies(INITIAL_EXPOSURE_POLICIES)
    this.registerAudit({
      policyId: 'ALL',
      policyCode: 'RESET_TO_DEFAULTS',
      consumerModule: 'CRM_ADMIN',
      sourceField: 'ALL',
      ruleType: 'LIMITE_SUPERIOR',
      previousValue: 'custom',
      newValue: 'defaults',
      changedBy: operator.name,
      changedByRole: operator.role,
      justification: 'Restauração idempotente para parâmetros de fábrica homologados CIAFAL.',
    })
  }
}

export const dataExposurePolicyService = DataExposurePolicyService.getInstance()
