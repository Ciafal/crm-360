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
  getHealth(): Promise<ProviderHealth>
  readonly copilot?: SellerCopilotAgent
  readonly reactivation?: ReactivationAgent
}
