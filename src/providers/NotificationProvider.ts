import type { ProviderHealth } from './types'

export interface NotificationPayload {
  recipientId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  channel?: 'in_app' | 'email' | 'push' | 'sms'
  metadata?: Record<string, unknown>
}

export interface NotificationProvider {
  readonly name: string
  send(notification: NotificationPayload): Promise<{ notificationId: string; delivered: boolean }>
  sendBatch(
    notifications: NotificationPayload[],
  ): Promise<Array<{ notificationId: string; delivered: boolean }>>
  getHealth(): Promise<ProviderHealth>
}
