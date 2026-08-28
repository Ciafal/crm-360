import type { ProviderHealth } from './types'

export interface AIAnalysisRequest {
  task:
    | 'transcribe'
    | 'summarize'
    | 'classify'
    | 'extract_intent'
    | 'sentiment'
    | 'extract_entities'
  content: string
  language?: string
  context?: Record<string, unknown>
}

export interface AIAnalysisResult {
  task: string
  result: Record<string, unknown> | string
  confidence: number
  model: string
  modelVersion?: string
  processedAt: string
}

import type { BICustomerSummary } from './BIProvider'
import type { DailyCommercialAction } from '@/types/models'

export interface AIRecommendation {
  action: string
  justification: string
  evidence: string[]
  confidence: number
  sources: string[]
  timestamp: string
  version: string
}

export interface DailyBriefing {
  sellerId: string
  date: string
  summaryText: string
  priorityCount: number
  totalRevenuePotential: number
  recommendedFocus: string
  highlights: string[]
}

export interface ContactPlan {
  customerId: string
  idealDate: string
  urgency: 'alta' | 'media' | 'baixa'
  recommendedChannel: 'whatsapp' | 'ligacao' | 'visita' | 'email'
  argument: string
  suggestedProducts: string[]
  abandonedItems: string[]
  stockAvailable: boolean
  valueAtStake: number
}

export interface ReactivationAnalysis {
  customerId: string
  reactivationScore: number
  urgency: 'critica' | 'alta' | 'media' | 'baixa'
  recommendedAction: string
  probabilityRehire: number
  keyInsight: string
}

export interface ProductSuggestion {
  code: string
  name: string
  family: string
  reason: string
  stockAvailable: boolean
  expectedMarginPercent: number
}

export interface QuoteCopilotInsight {
  priority: 'ALTA' | 'MEDIA' | 'BAIXA'
  priorityReason: string
  commercialArgument: string
  riskAssessment: {
    level: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
    factors: string[]
  }
  nextRecommendedAction: string
  suggestedFollowUpHours: 24 | 48 | 72
  contextSummary: {
    archetype: string
    abcCategory: string
    creditAvailableBRL: number
    creditStatus: string
    stockCoverageStatus: string
    lastPurchaseIntervalDays?: number
    competitionNoted?: string
    authorizedPriceTons: number
    priceSource: string
  }
}

export interface SellerCopilotAgent {
  generateDailyBriefing(sellerId: string): Promise<DailyBriefing>
  prioritizeActions(actions: DailyCommercialAction[]): Promise<DailyCommercialAction[]>
  explainPrioritization(actionId: string): Promise<string>
  analyzeQuoteOpportunity(context: {
    customerId: string
    customerName: string
    customerSapCode?: string
    archetype?: string
    abcCategory?: 'A' | 'B' | 'C'
    materialCodes: string[]
    totalTons: number
    authorizedPriceTons: number
    creditAvailable: number
    creditStatus: 'REGULAR' | 'RESTRITO' | 'BLOQUEADO'
    stockAvailableTons: number
    hasPlannedProduction: boolean
    competitionNotes?: string
  }): Promise<QuoteCopilotInsight>
}

export interface ReactivationAgent {
  analyzeInactiveCustomers(customers: BICustomerSummary[]): Promise<ReactivationAnalysis[]>
  generateContactPlan(customerId: string): Promise<ContactPlan>
  recommendChannel(customerId: string): Promise<'whatsapp' | 'ligacao' | 'visita' | 'email'>
  suggestProducts(customerId: string): Promise<ProductSuggestion[]>
}

export interface TeamDailySummary {
  date: string
  activeSellers: number
  totalPlannedActions: number
  totalCompletedActions: number
  totalPendingActions: number
  totalOverdueActions: number
  totalOpportunities: number
  totalPotentialRevenue: number
  totalPotentialTons: number
  highlights: string[]
  bottlenecks: string[]
  recommendedFollowUps: string[]
  confidence: number
  sources: string[]
}

export interface SellerIndividualAnalysis {
  sellerId: string
  sellerName: string
  cargo: string
  resumoExecutivo: string
  pontosPositivos: Array<{
    titulo: string
    evidenciaNumerica: string
    impacto: string
  }>
  pontosAtencao: Array<{
    titulo: string
    evidenciaNumerica: string
    causaProvavel: string
    riscoMeta: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
  }>
  evidenciasContextuais: {
    metaVolume: string
    realizadoVolume: string
    atingimentoPercent: number
    forecastVolume: string
    ritmoAtual: string
    mediaHistorica: string
    carteiraTotal: number
    clientesAtivosMes: number
    taxaCarteiraAtivaPercent: number
    clientesA: number
    clientesB: number
    clientesC: number
    inativosCarteira: number
    leadsAtivos: number
    visitasMes: number
    contatosTotal: number
    cotacoesEmitidas: number
    followupsPendentes: number
    estoqueDisponivel: string
    limiteCreditoDisponivel: string
    tmsEntregasNoPrazo: string
  }
  oportunidades: Array<{
    cliente: string
    potencial: string
    produto: string
    motivo: string
  }>
  acoesRecomendadas: Array<{
    id: string
    titulo: string
    descricao: string
    prioridade: 'ALTA' | 'MEDIA' | 'BAIXA'
    prazoSugerido: string
    tipo: 'CLIENTES_A' | 'FOLLOWUP' | 'ESTOQUE' | 'CREDITO' | 'VISITA' | 'PROSPECCAO'
    clienteAlvo?: string
  }>
}

export interface SellerPerformanceAnalysisAgent {
  analyzeSellerPerformance(
    sellerId: string,
    filtersContext?: {
      periodo?: string
      produto?: string
      familia?: string
      segmento?: string
    },
  ): Promise<SellerIndividualAnalysis>
}

export interface SalesSupervisorAgent {
  summarizeTeamDaily(teamId?: string): Promise<TeamDailySummary>
  comparePlannedVsExecuted(sellerId: string): Promise<{
    sellerId: string
    adherencePercent: number
    criticalPending: string[]
    stalledOpportunities: string[]
    coachingRecommendation: string
  }>
  identifyBottlenecks(teamId?: string): Promise<string[]>
  analyzeSellerPerformance?(
    sellerId: string,
    filtersContext?: {
      periodo?: string
      produto?: string
      familia?: string
      segmento?: string
    },
  ): Promise<SellerIndividualAnalysis>
  runFullSupervisorDiagnostic?(): Promise<{
    diagnosticoGeral: string
    pontosAtencao: Array<{
      id: string
      vendedor: string
      problema: string
      evidencia: string
      impacto: string
      recomendacao: string
      tipo: 'RITMO' | 'LATENCIA' | 'CADENCIA' | 'CARTEIRA'
    }>
    feedbacksPositivos: Array<{
      id: string
      vendedor: string
      destaque: string
      evidencia: string
      pratica: string
    }>
  }>
}

import type {
  CommercialEmailDraftRequest,
  CommercialEmailDraftResult,
} from './Microsoft365Provider'

export interface EmailExtractionResult {
  intent: string
  product?: string
  quantity?: string
  price?: string
  deadline?: string
  competitor?: string
  objection?: string
  nextAction: string
  confidence: number
}

export interface AIProvider {
  readonly name: string
  analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult>
  transcribe(audioUrl: string, language?: string): Promise<{ text: string; confidence: number }>
  summarize(text: string, maxLength?: number): Promise<{ summary: string; confidence: number }>
  extractEntities(text: string): Promise<{
    intent?: string
    product?: string
    quantity?: string
    competitor?: string
    competitorPrice?: string
    nextAction?: string
    deadline?: string
    confidence: number
  }>
  extractEmailContext?(emailContent: string, subject?: string): Promise<EmailExtractionResult>
  generateCommercialEmailDraft?(
    request: CommercialEmailDraftRequest,
  ): Promise<CommercialEmailDraftResult>
  getHealth(): Promise<ProviderHealth>
  readonly copilot?: SellerCopilotAgent
  readonly reactivation?: ReactivationAgent
  readonly supervisor?: SalesSupervisorAgent
  readonly sellerAnalysis?: SellerPerformanceAnalysisAgent
}
