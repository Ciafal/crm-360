/**
 * Modelos de dados e tipos para o módulo de Gestão Comercial de Estoque CIAFAL
 * Padrão brasileiro: toneladas = "t", quilogramas = "kg", valores = "R$"
 */

export type StockMovementClassification =
  | 'NORMAL'
  | 'ATENCAO'
  | 'BAIXA_MOVIMENTACAO'
  | 'PARADO'
  | 'CRITICO'

export type StockAgeBracket = '0-30' | '31-60' | '61-90' | '91-120' | '121-180' | '>180'

export type CheckPriority = 'NORMAL' | 'ALTA' | 'URGENTE'

export type CheckStatus =
  | 'SOLICITADA'
  | 'RECEBIDA'
  | 'EM_VERIFICACAO'
  | 'CONFIRMADA'
  | 'CONFIRMADA_PARCIALMENTE'
  | 'DIVERGENCIA_ENCONTRADA'
  | 'INDISPONIVEL'
  | 'ENCERRADA'

export type OpportunityFitScore = 'MUITO_ALTA' | 'ALTA' | 'MEDIA' | 'BAIXA'

export interface StockItem {
  id: string
  materialCode: string
  description: string
  family: string
  groupCode?: string
  line: string
  bitola: string
  quality: string // Ex: A36, SAE 1020, Inox 304, CA-50
  plantCode: string // Centro SAP (ex: 1000 - Contagem Matriz, 2000 - Betim Industrial, 3000 - Filial SP)
  plantName: string
  storageLocation: string // Depósito SAP (ex: DEP-01 Pátio Principal, DEP-02 Pulmão Expedição)
  storageLocationName: string
  batchNumber?: string // Lote rastreável
  unit: 't' | 'kg' // Sempre exibido em t no CRM

  // Saldos de Estoque segregados (Regra 15)
  physicalTons: number // Físico no WMS/Pátio
  committedTons: number // Comprometido / Reservas de pedidos e cotações
  availableTons: number // Disponível real para venda imediata = Físico - Comprometido - Bloqueado - Em checagem
  blockedTons: number // Bloqueado (CQ / Avaria / Bloqueio Judicial)
  inspectionTons: number // Em inspeção / liberação técnica
  inCheckTons: number // Em checagem física em andamento
  projectedPcpTons: number // Estoque projetado (produção futura PCP robotizado — NÃO é saldo físico)

  // Parâmetros e Valores Financeiros
  costPricePerTon: number
  estimatedTotalValue: number // R$
  minStockTons: number
  maxStockTons: number
  criticalStockTons: number
  strategicSafetyTons: number

  // Idade e Movimentação (Aging)
  entryDate: string // DD/MM/AAAA
  ageDays: number
  ageBracket: StockAgeBracket
  lastMovementDate: string // DD/MM/AAAA
  daysWithoutMovement: number
  lastSaleDate?: string
  lastCustomerSap?: string
  lastCustomerName?: string
  lastSellerId?: string
  lastSellerName?: string
  historicAvgPriceKg: number // R$/kg
  historicTurnoverRate: number // Giro histórico (vezes ao ano ou ao mês)
  classification: StockMovementClassification

  // Governança e Isolamento de Vendedores (Regra 11 e 14)
  allowedSellerIds: string[] // Vendedores autorizados a visualizar/vender
  allowedRegions: string[]
  assignedSellerId?: string
  assignedSellerName?: string

  // Integrações
  sapSyncStatus: 'SINCRONIZADO' | 'PENDENTE' | 'ERRO'
  sapLastSync: string // DD/MM/AAAA HH:mm
  wmsSyncStatus: 'ONLINE' | 'PARCIAL' | 'OFFLINE'

  // TMS Logística (Regra 17)
  tmsComplementAvailable: boolean // Há frete/carga planejada para esta região
  tmsRegionDest?: string
  tmsNextLoadingWindow?: string // Data/Hora próxima saída de caminhão
  tmsPlannedTripCode?: string

  // PCP Robotizado (Regra 16)
  pcpNextProductionDate?: string
  pcpLine?: string
  pcpConfidenceLevel?: 'ALTO' | 'MEDIO' | 'PROJETADO'
  pcpStatus?: 'EM_PROGRAMACAO' | 'LAMINACAO_INICIADA' | 'PREVISTO'
}

export interface StockCheckRequest {
  id: string
  protocol: string // Ex: CHK-2024-00892
  materialCode: string
  materialDescription: string
  plantCode: string
  plantName: string
  storageLocation: string
  batchNumber?: string
  systemicBalanceTons: number
  requestedTons: number
  confirmedPhysicalTons?: number
  divergenceTons?: number
  divergenceFound?: boolean
  divergenceReason?: string
  occurrenceNumber?: string // Gerado se houver divergência
  status: CheckStatus
  priority: CheckPriority
  quotationId?: string
  quotationCode?: string
  customerId?: string
  customerName?: string
  requesterId: string
  requesterName: string
  requesterRole: string
  requesterNotes?: string
  wmsRequestId?: string
  wmsIntegrationStatus?: 'ENVIADO' | 'PROCESSADO' | 'PENDENTE' | 'CONFERENCIA_CONCLUIDA'
  inspectorName?: string
  inspectedDatetime?: string // DD/MM/AAAA HH:mm
  inspectorNotes?: string
  slaDeadline: string // DD/MM/AAAA HH:mm
  closedAt?: string
  historyLog: {
    datetime: string
    actor: string
    action: string
    comment?: string
  }[]
  createdAt: string
  updatedAt: string
}

export interface CommercialOpportunity {
  id: string
  stockItemId: string
  materialCode: string
  materialDescription: string
  plantName: string
  availableTons: number
  ageDays: number
  classification: StockMovementClassification
  estimatedValue: number

  // Cliente Recomendado pela IA (Regra 6)
  customerId: string
  customerSap: string
  customerName: string
  customerCity: string
  customerUf: string
  customerSegment: string
  assignedSellerId: string
  assignedSellerName: string
  creditLimit: number
  availableCredit: number
  creditStatus: 'Regular' | 'Restrito' | 'Bloqueado'

  // Histórico de Consumo
  consumptionHistoryTons12m: number
  lastPurchaseDate: string
  lastPurchasePriceKg: number
  daysSinceLastPurchase: number
  ordersInPipeline: number
  purchaseFrequency: string

  // Recomendação IA
  fitScore: OpportunityFitScore
  aiRationale: string
  aiSuggestedApproach: string
  recommendedAction: string
  potentialTons: number
  estimatedMarginScore: string
}

export interface StockAuditLog {
  id: string
  userId: string
  userName: string
  userRole: string
  actionType:
    | 'CONSULTA'
    | 'SOLICITACAO_CHECAGEM'
    | 'RESPOSTA_CHECAGEM'
    | 'EXPORTACAO_EXCEL'
    | 'EXPORTACAO_PDF'
    | 'ANALISE_IA'
    | 'ALTERACAO_PARAMETRO'
    | 'INTEGRACAO_SAP'
    | 'INTEGRACAO_WMS'
    | 'INTEGRACAO_TMS'
    | 'INTEGRACAO_PCP'
  targetObject: string
  targetId?: string
  filtersApplied?: Record<string, any>
  exportFormat?: 'EXCEL' | 'PDF'
  previousValue?: any
  newValue?: any
  details: string
  ipSession?: string
  createdAt: string
}

export interface StockGovernanceParam {
  id: string
  paramKey: string
  paramLabel: string
  category:
    | 'AGING'
    | 'PARADOS'
    | 'ESTOQUE_MIN_MAX'
    | 'CENTROS_DEPOSITOS'
    | 'REGRAS_ACESSO'
    | 'CHECAGEM_WMS'
  paramValue: any
  description: string
  lastModifiedBy: string
  updatedAt: string
}

export interface StockFilterState {
  period: string
  plantCode: string // Centro
  storageLocation: string // Depósito
  materialCode: string
  family: string
  line: string
  bitola: string
  quality: string
  sellerId: string
  team: string
  region: string
  customerId: string
  segment: string
  ageBracket: string
  classification: string
  status: string
  searchTerm: string
}

export interface StockOverviewKpis {
  totalPhysicalTons: number
  totalAvailableTons: number
  totalCommittedTons: number
  totalBlockedTons: number
  totalInspectionTons: number
  totalInCheckTons: number
  totalProjectedPcpTons: number
  totalEstimatedValueBrl: number
  availableForSaleValueBrl: number
  belowMinStockCount: number
  aboveMaxStockCount: number
  noMovementCount: number
  lowMovementCount: number
  availableSkusCount: number
  criticalProductsCount: number
  avgStockTons: number
  avgTurnoverRate: number
  estimatedCoverageDays: number
  agingStockPercent: number
  imobilizedCapitalInStagnantBrl: number
}
