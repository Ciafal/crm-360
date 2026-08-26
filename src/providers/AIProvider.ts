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
}
