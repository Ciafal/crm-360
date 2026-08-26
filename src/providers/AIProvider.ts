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

export interface SellerCopilotAgent {
  generateDailyBriefing(sellerId: string): Promise<DailyBriefing>
  prioritizeActions(actions: DailyCommercialAction[]): Promise<DailyCommercialAction[]>
  explainPrioritization(actionId: string): Promise<string>
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
}
