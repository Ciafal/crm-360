/**
 * Tipos e Contratos Formais do submódulo:
 * "PLANEJAMENTO DE VENDAS & S&OP" — CRM 360º CIAFAL
 *
 * Regra Central de Governança de Fontes:
 * - PASSADO CONSOLIDADO = QLIK (verdade analítica histórica — o que aconteceu)
 * - PRESENTE TRANSACIONAL = SAP ECC + CRM + WMS + PCP + TMS
 * - FUTURO = Forecast + CRM + PCP + TMS
 */

export type DataSourceOrigin =
  | 'Fonte: QLIK'
  | 'Fonte: SAP ECC'
  | 'Fonte: WMS'
  | 'Fonte: Motor Preditivo'
  | 'Fonte: CRM 360º'
  | 'Fonte: PCP Robotizado'
  | 'Fonte: TMS'

export type UnitType = 't' | 'brl'

export type ForecastConfidence = 'ALTA' | 'MEDIA' | 'BAIXA'

export type BiasType = 'OPTIMISM' | 'CONSERVATIVE' | 'NEUTRAL'

export type WorkflowStatus =
  | 'RASCUNHO'
  | 'EM_ELABORACAO'
  | 'ENVIADO'
  | 'EM_REVISAO'
  | 'SOLICITADA_ALTERACAO'
  | 'APROVADO'
  | 'PUBLICADO'
  | 'SUBSTITUIDO'

export type ScenarioType =
  | 'BASE'
  | 'ESTATISTICO'
  | 'CONSENSUAL'
  | 'META'
  | 'CONSERVADOR'
  | 'OTIMISTA'
  | 'PESSIMISTA'
  | 'CUSTOM'

export type IndustrialGapStatus = 'ATENDIDO' | 'ATENCAO' | 'DEFICIT'

export type NextBestActionType =
  | 'Ligar'
  | 'WhatsApp'
  | 'E-mail'
  | 'Visita'
  | 'Cotação'
  | 'Catálogo'
  | 'Follow-up'
  | 'Reativação'

export interface HistoricalMonthData {
  yearMonth: string // YYYY-MM
  tons: number
  revenueBrl: number
  avgPricePerTon: number
  marginPercent: number
  source: 'QLIK' | 'SAP'
  qlikTimestamp?: string
}

export interface SopForecastRecord {
  id: string
  sellerId: string
  sellerName: string
  customerId: string
  customerName: string
  productId: string
  productName: string
  productFamily: string
  yearMonth: string // "2026-03"
  unit: UnitType // 't' ou 'brl'

  // 5 Camadas Fundamentais + Realizado
  f0Statistical: number // F0: Motor Matemático Puro
  f1AiEnriched: number // F1: F0 + Sinais Externos/Pipeline IA
  f2SellerAdjusted: number // F2: Ajuste Comercial do Vendedor
  f3ManagementAdjusted: number // F3: Ajuste da Gestão/Diretoria
  f4SopConsensual: number // F4: Número Oficial Consensual S&OP
  rActual?: number // R: Realizado histórico (quando consolidado)

  // Metas Versionadas
  targetSuggested: number // Sugerida pela IA
  targetProposed: number // Proposta pelo vendedor
  targetApproved: number // Aprovada pela gestão
  targetFinal: number // Meta oficial publicada

  // Metadados do Motor de Séries Temporais
  championModel: string // ex: "ENSEMBLE_PROPHET_ARIMA"
  challengerModel: string // ex: "HOLT_WINTERS_DAMPED"
  modelConfidence: ForecastConfidence
  historicalMonthsAnalyzed: number

  // Rastreabilidade de Alterações (F2 e F3)
  f2Justification?: string
  f2AdjustedBy?: string
  f2AdjustedAt?: string

  f3Justification?: string
  f3PreviousValue?: number
  f3AdjustedBy?: string
  f3AdjustedAt?: string
  f3ImpactSummary?: string

  // FVA (Forecast Value Add) & Bias
  fvaAi: number // F0 error vs F1 error
  fvaSeller: number // F1 error vs F2 error
  fvaManagement: number // F2 error vs F3 error
  fvaConsensual: number // F3 error vs F4 error
  biasType: BiasType
  accuracyScore: number // MAPE / WAPE accuracy %

  status: WorkflowStatus
  revisionCode: string // 'V0', 'V1', 'V2', 'V3'
  sourceSystem: string
  qlikTimestamp: string

  // Próxima Compra & Next Best
  nextPurchaseEstimate?: {
    lastPurchaseDate: string
    historicalIntervalDays: number
    probableWindowStart: string
    probableWindowEnd: string
    confidence: ForecastConfidence
  }
  nextBestProduct?: {
    productName: string
    reason: string
    stockAvailableTons: number
    pcpScheduled: boolean
  }
  nextBestAction?: {
    action: NextBestActionType
    reason: string
    urgency: 'ALTA' | 'MEDIA' | 'BAIXA'
  }
}

export interface SopExecutivePlan {
  id: string
  cycleYearMonth: string // "2026-03"
  status: 'ATIVO' | 'FECHADO' | 'EM_REVISAO'

  // Demanda S&OP (Evitar Dupla Contagem)
  targetTotalTons: number
  targetTotalBrl: number
  forecastTotalTons: number
  forecastTotalBrl: number
  sapBacklogTons: number // Demanda Confirmada (Carteira SAP)
  sapBacklogBrl: number
  unconvertedForecastTons: number // Demanda Prevista (Forecast não convertido)
  sopTotalDemandTons: number // Demanda Total S&OP

  // Operações & Estoque
  wmsStockTons: number // WMS verdade operacional
  scheduledProductionTons: number // PCP programado
  netProductionRequirementTons: number // Demanda Total - Estoque - Programado
  pcpCapacityTons: number // Capacidade Nominal PCP
  industrialGapTons: number // Capacidade - Necessidade
  industrialStatus: IndustrialGapStatus

  // Logística & Expedição
  expeditionCapacityTons: number
  tmsProgrammedTons: number // TMS verdade logística
  logisticsGapTons: number

  // Funil e Previsão de Faturamento
  revenueForecastBrl: number
  actualBilledBrl: number
  actualBilledTons: number

  // Decomposição dos Gaps (Waterfall)
  gapCauses: {
    commercialGapTons: number
    creditBlockGapTons: number
    stockShortageGapTons: number
    pcpCapacityGapTons: number
    logisticsTmsGapTons: number
    customerPostponedGapTons: number
    otherGapTons: number
  }

  waterfallSteps: Array<{
    name: string
    value: number
    type: 'initial' | 'negative' | 'positive' | 'total'
    unit: string
    description: string
  }>

  // Capacidade Ociosa -> Oportunidades Comerciais (Fluxo Reverso)
  idleCapacityOpportunities: Array<{
    id: string
    productFamily: string
    idleTons: number
    targetCustomers: Array<{
      customerId: string
      customerName: string
      historicalVolumeTons: number
      potentialTons: number
      confidence: ForecastConfidence
      suggestedAction: NextBestActionType
    }>
  }>
}

export interface SopMeeting {
  id: string
  cycleYearMonth: string
  title: string
  meetingDate: string
  locationType: 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO'
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'

  participants: Array<{
    name: string
    role: string
    area: 'Comercial' | 'PCP' | 'WMS' | 'Logística TMS' | 'Diretoria' | 'Financeiro'
    confirmed: boolean
  }>

  agendaTopics: string[]

  // Briefing Pré-Reunião gerado por IA
  aiBriefing: {
    summary: string
    whatChanged: string[]
    fvaHighlights: string
    identifiedBiases: string
    keyRisks: string[]
    strategicOpportunities: string[]
    recommendedDecisions: string[]
  }

  // ATA Pós-Reunião (SOP Executive Minutes)
  meetingMinutesAta?: {
    recordedAt: string
    summary: string
    decisions: Array<{
      topic: string
      decision: string
      rationale: string
      responsible: string
      deadline: string
    }>
    actionItems: Array<{
      task: string
      owner: string
      dueDate: string
      status: 'PENDENTE' | 'CONCLUIDA'
    }>
    memoryBaseline: {
      finalConsensualTons: number
      revenueForecastBrl: number
      acceptedIndustrialGapTons: number
    }
  }
  transcriptionSnippet?: string
  recordingUrl?: string
}

export interface SopScenarioSimulation {
  id: string
  title: string
  scenarioType: ScenarioType
  cycleYearMonth: string
  description: string
  deltaTons: number
  deltaRevenueBrl: number
  industrialImpact: string
  logisticsImpact: string
  authorName: string
  isFavorite: boolean
  createdAt: string
}

export interface FvaMetricSummary {
  layerName: 'F0 Estatístico' | 'F1 IA Enriquecido' | 'F2 Vendedor' | 'F3 Gestão' | 'F4 Consensual'
  accuracyPercent: number // 100 - WAPE
  wapePercent: number
  maeValue: number
  fvaAverage: number // positivo = agregou acurácia, negativo = degradou
  bias: BiasType
  sampleSize: number
}

export interface SopGlobalFilter {
  cycleYearMonth: string // "2026-03"
  horizon: '1M' | '3M' | '6M' | '12M' | 'NEXT_YEAR' | 'ROLLING_12M'
  unit: UnitType
  sellerId: string // 'ALL' ou id do vendedor
  productFamily: string // 'ALL' ou família
  customerId: string // 'ALL' ou id do cliente
  scenario: ScenarioType
  revision: string // 'V0', 'V1', 'V2', 'V3', 'LATEST'
}
