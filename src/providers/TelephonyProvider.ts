import type { ProviderHealth } from './types'

export type CallDirection = 'inbound' | 'outbound'
export type CallStatus = 'started' | 'ringing' | 'answered' | 'ended' | 'missed'

export interface CallEvent {
  callId: string
  from: string
  to: string
  extension?: string
  direction: CallDirection
  status: CallStatus
  timestamp: string
  duration?: number
  recordingUrl?: string
}

export interface TelephonyProvider {
  readonly name: string
  makeCall(fromExtension: string, to: string): Promise<{ callId: string }>
  hangup(callId: string): Promise<void>
  onCallEvent(callback: (event: CallEvent) => void): void
  getExtensions(): Promise<Array<{ extension: string; userId?: string; label: string }>>
  getHealth(): Promise<ProviderHealth>
}
