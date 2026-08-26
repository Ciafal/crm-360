// Tipos base para todos os providers

export interface ProviderConfig {
  enabled: boolean
  name: string
}

export interface ProviderHealth {
  online: boolean
  lastCheck: string
  latency?: number
  error?: string
}

export interface IntegrationEvent {
  event_id: string
  type: string
  occurred_at: string
  producer: string
  aggregate_id: string
  payload: Record<string, unknown>
  correlation_id?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}
