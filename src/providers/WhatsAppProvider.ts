import type { ProviderHealth } from './types'

export interface WhatsAppInboundMessage {
  externalId: string
  from: string
  to: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact'
  content?: string
  mediaUrl?: string
  mediaMimetype?: string
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface WhatsAppOutboundMessage {
  to: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document'
  content?: string
  mediaUrl?: string
  mediaMimetype?: string
  caption?: string
}

export interface WhatsAppProvider {
  readonly name: string
  sendMessage(msg: WhatsAppOutboundMessage): Promise<{ externalId: string }>
  sendMedia(msg: WhatsAppOutboundMessage): Promise<{ externalId: string }>
  onMessage(callback: (msg: WhatsAppInboundMessage) => void): void
  onStatusChange(callback: (status: { status: string; externalId: string }) => void): void
  getHealth(): Promise<ProviderHealth>
  disconnect(): Promise<void>
}
