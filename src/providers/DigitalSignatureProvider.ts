import type { ProviderHealth } from './types'
import type { DigitalSignatureProviderType, SignatureEnvelopeSummary } from '@/types/models'

export interface EnvelopeSigner {
  name: string
  email: string
  cpf?: string
  role?: string
  order?: number
}

export interface EnvelopeDocument {
  name: string
  contentMarkdown?: string
  base64Content?: string
  fileUrl?: string
  documentHash: string
  policyId: string
  policyVersion: string
  deadlineDays?: number
}

export interface CreateEnvelopeResponse {
  envelopeId: string
  externalId: string
  status: 'sent' | 'created' | 'pending'
  signers: Array<{
    name: string
    email: string
    status: 'sent' | 'pending'
  }>
  sentAt: string
  expiresAt: string
  provider: DigitalSignatureProviderType
  signUrl?: string
}

export interface EnvelopeStatusResponse {
  envelopeId: string
  provider: DigitalSignatureProviderType
  status: 'sent' | 'viewed' | 'signed' | 'declined' | 'expired' | 'canceled'
  documentHash: string
  signatureHash?: string
  sentAt: string
  viewedAt?: string
  signedAt?: string
  expiresAt?: string
  declineReason?: string
  signers: Array<{
    name: string
    email: string
    status: 'sent' | 'viewed' | 'signed' | 'declined'
    signedAt?: string
  }>
  signedDocumentUrl?: string
}

export interface SignedDocumentResult {
  envelopeId: string
  fileName: string
  fileUrl: string
  documentHash: string
  signatureHash: string
  signedAt: string
  contentBase64?: string
  sizeBytes?: number
}

export interface WebhookResult {
  success: boolean
  event: 'signed' | 'viewed' | 'declined' | 'expired' | 'sent' | 'unknown'
  envelopeId: string
  signerEmail?: string
  signedAt?: string
  documentHash?: string
  signatureHash?: string
  rawPayload?: Record<string, unknown>
}

export interface DigitalSignatureProvider {
  readonly name: string
  readonly type: DigitalSignatureProviderType
  readonly isMock: boolean

  createEnvelope(
    document: EnvelopeDocument,
    signers: EnvelopeSigner[],
  ): Promise<CreateEnvelopeResponse>

  getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatusResponse>

  getSignedDocument(envelopeId: string): Promise<SignedDocumentResult>

  cancelEnvelope(
    envelopeId: string,
    reason?: string,
  ): Promise<{ success: boolean; message: string }>

  resendEnvelope(
    envelopeId: string,
    signerEmail?: string,
  ): Promise<{ success: boolean; message: string }>

  webhookHandler(payload: Record<string, any>, signatureHeader?: string): Promise<WebhookResult>

  getHealth(): Promise<ProviderHealth>
}
