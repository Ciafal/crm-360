export type ExposurePolicyCategory =
  | 'ESTOQUE'
  | 'CREDITO'
  | 'PRECO'
  | 'MARGEM'
  | 'CUSTO'
  | 'LOGISTICA'
  | 'GERAL'

export type ExposureRuleType =
  | 'LIMITE_SUPERIOR' // Limita valor máximo com sufixo (ex: 50 t+)
  | 'MASCARAMENTO' // Mascara parcialmente ou totalmente
  | 'FAIXA' // Agrupa em faixas (ex: 0-10, 10-50)
  | 'BLOQUEIO' // Oculta o campo por completo

export type ExposurePolicyStatus = 'ATIVO' | 'INATIVO' | 'RASCUNHO'

export type ActionTriggerType =
  | 'NENHUM'
  | 'SOLICITAR_CHECAGEM' // Dispara botão de solicitar checagem física
  | 'SOLICITAR_APROVACAO' // Exige aprovação de alçada
  | 'ALERTA_DISCRETO' // Alerta visual discreto

export interface DataExposurePolicy {
  id: string
  code: string // Ex: CRM_SAP_STOCK_DISPLAY_LIMIT
  name: string // Ex: Limite de Exibição de Estoque SAP
  category: ExposurePolicyCategory
  originSystem: string // SAP
  integrationType: string // RFC/BAPI Staging, OData, etc.
  sapObject: string // Ex: MARD / MARC / MCHB
  sourceField: string // Ex: LABST (Estoque de Livre Utilização)
  unit: string // Ex: 't', 'kg', 'R$', 'un.'
  consumerModule: string // Ex: CRM, Cotações, Catálogo, Consultas
  screenFeature: string // Ex: Consulta Individual, Grid de Cotação, Cockpit Vendedor
  affectedRoles: string[] // Perfis sujeitos à regra, ex: ['VENDEDOR', 'REPRESENTANTE_EXTERNO']
  exemptRoles: string[] // Perfis isentos (veem integral), ex: ['ADMIN', 'SUPERVISOR', 'GERENTE']
  ruleType: ExposureRuleType
  minValue?: number // Valor mínimo se aplicável
  maxDisplayedValue?: number // Valor máximo exibido (ex: 50)
  aboveLimitText?: string // Texto ou sufixo acima do limite (ex: '+', '50 t+')
  actionTrigger?: ActionTriggerType
  triggerThreshold?: number // Ex: < 5 t dispara ação
  slaHours?: number // SLA da ação em horas (ex: 48h)
  status: ExposurePolicyStatus
  validFrom: string // Data ISO ou YYYY-MM-DD
  validTo?: string // Opcional
  description?: string
  lastModifiedAt: string
  lastModifiedBy: string
  lastModifiedByRole?: string
  version: number
}

export interface ExposurePolicyAuditLog {
  id: string
  policyId: string
  policyCode: string
  consumerModule: string
  sourceField: string
  ruleType: ExposureRuleType
  previousValue: any
  newValue: any
  changedBy: string
  changedByRole: string
  changedAt: string
  justification: string // Motivo obrigatório para alterações sensíveis
  snapshot?: Partial<DataExposurePolicy>
}

/**
 * Payload seguro entregue aos componentes comerciais frontend.
 * O valor real bruto do SAP NUNCA chega a perfis não autorizados!
 */
export interface ExposedValueResult {
  authorized: boolean
  displayValue: string // Ex: "50 t+", "3,25 t", "Sem estoque disponível"
  numericDisplayValue?: number // Valor numérico capped se aplicável (ex: 50.0 ou 3.25)
  unit: string // 't'
  isCapped: boolean // true se o valor original excedeu o limite
  isLowStock: boolean // true se < limiar de checagem (ex: 5 t)
  canRequestCheck: boolean // true se elegível para solicitar checagem física
  appliedRule?: string // Identificador da regra aplicada
  slaHours?: number // SLA configurado para checagem física (ex: 48)
  tooltip?: string // Tooltip informativo (sem revelar o valor real)
  originalValueHidden: boolean // Confirmação de que o valor bruto foi omitido
  // Somente presente se o usuário for ADMIN / GERENTE isento:
  actualValueAudited?: number
}
