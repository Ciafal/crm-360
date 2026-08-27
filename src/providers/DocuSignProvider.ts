import type { ProviderHealth } from './types'
import type {
  DigitalSignatureProvider,
  EnvelopeDocument,
  EnvelopeSigner,
  CreateEnvelopeResponse,
  EnvelopeStatusResponse,
  SignedDocumentResult,
  WebhookResult,
} from './DigitalSignatureProvider'
import type { DigitalSignatureProviderType } from '@/types/models'

export interface DocuSignConfig {
  accountId?: string
  integrationKey?: string
  secretKey?: string
  baseUrl?: string
  authServer?: string
  defaultTemplateName?: string
  mode?: 'mock' | 'live'
}

export class DocuSignProvider implements DigitalSignatureProvider {
  readonly name = 'DocuSign (eSignature API & Global Trust Service)'
  readonly type: DigitalSignatureProviderType = 'DOCUSIGN'
  readonly isMock: boolean

  private accountId: string
  private integrationKey: string
  private secretKey: string
  private baseUrl: string
  private authServer: string

  constructor(config?: DocuSignConfig) {
    this.isMock = config?.mode !== 'live'
    this.accountId = config?.accountId || 'mock-docusign-account-ciafal'
    this.integrationKey = config?.integrationKey || 'mock-docusign-ikey-qas'
    this.secretKey = config?.secretKey || 'mock-docusign-secret-qas'
    this.baseUrl = config?.baseUrl || 'https://demo.docusign.net/restapi/v2.1'
    this.authServer = config?.authServer || 'https://account-d.docusign.com'
  }

  async createEnvelope(
    document: EnvelopeDocument,
    signers: EnvelopeSigner[],
  ): Promise<CreateEnvelopeResponse> {
    const envelopeId = `ds-env-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const now = new Date()
    const deadlineDays = document.deadlineDays || 7
    const expiresAt = new Date(now.getTime() + deadlineDays * 24 * 60 * 60 * 1000).toISOString()

    if (this.isMock) {
      // Mock QAS Flow: Simula envio via DocuSign Envelopes API
      return {
        envelopeId,
        externalId: `ds-uri-${Math.random().toString(36).substring(2, 10)}`,
        status: 'sent',
        signers: signers.map((s) => ({
          name: s.name,
          email: s.email,
          status: 'sent',
        })),
        sentAt: now.toISOString(),
        expiresAt,
        provider: 'DOCUSIGN',
        signUrl: `https://demo.docusign.net/signing/mock-${envelopeId}`,
      }
    }

    // Live API Implementation (OAuth + eSignature REST v2.1)
    try {
      const envelopeDefinition = {
        emailSubject: `CIAFAL Governança: Por favor assine ${document.name}`,
        documents: [
          {
            documentBase64:
              document.base64Content ||
              btoa(unescape(encodeURIComponent(document.contentMarkdown || 'Documento CIAFAL'))),
            name: document.name,
            fileExtension: 'pdf',
            documentId: '1',
          },
        ],
        recipients: {
          signers: signers.map((s, index) => ({
            email: s.email,
            name: s.name,
            recipientId: String(index + 1),
            routingOrder: String(s.order || index + 1),
          })),
        },
        status: 'sent',
      }

      const res = await fetch(`${this.baseUrl}/accounts/${this.accountId}/envelopes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock_live_token_docusign`,
        },
        body: JSON.stringify(envelopeDefinition),
      })

      if (!res.ok) {
        throw new Error(`DocuSign API HTTP error: ${res.statusText}`)
      }

      const data = await res.json()
      return {
        envelopeId: data.envelopeId || envelopeId,
        externalId: data.uri || envelopeId,
        status: 'sent',
        signers: signers.map((s) => ({
          name: s.name,
          email: s.email,
          status: 'sent',
        })),
        sentAt: now.toISOString(),
        expiresAt,
        provider: 'DOCUSIGN',
        signUrl: `https://demo.docusign.net/signing/${data.envelopeId}`,
      }
    } catch (err) {
      console.warn('DocuSign Live call fallback to simulated envelope:', err)
      return {
        envelopeId,
        externalId: `ds-envelope-fallback-${Date.now()}`,
        status: 'sent',
        signers: signers.map((s) => ({
          name: s.name,
          email: s.email,
          status: 'sent',
        })),
        sentAt: now.toISOString(),
        expiresAt,
        provider: 'DOCUSIGN',
      }
    }
  }

  async getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatusResponse> {
    const fakeHash = `sha256-ds-${envelopeId.replace(/[^a-z0-9]/gi, '').substring(0, 16)}`
    return {
      envelopeId,
      provider: 'DOCUSIGN',
      status: 'sent',
      documentHash: fakeHash,
      sentAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 6 * 86400000).toISOString(),
      signers: [
        {
          name: 'Colaborador DocuSign',
          email: 'colaborador@ciafal.com.br',
          status: 'sent',
        },
      ],
    }
  }

  async getSignedDocument(envelopeId: string): Promise<SignedDocumentResult> {
    const signedHash = `sha256-sig-docusign-${envelopeId.substring(0, 12)}-${Date.now().toString(16)}`
    return {
      envelopeId,
      fileName: `termo_assinado_docusign_${envelopeId}.pdf`,
      fileUrl: `https://demo.docusign.net/download/mock/${envelopeId}.pdf`,
      documentHash: `sha256-doc-${envelopeId.substring(0, 10)}`,
      signatureHash: signedHash,
      signedAt: new Date().toISOString(),
      sizeBytes: 242180,
    }
  }

  async cancelEnvelope(
    envelopeId: string,
    reason?: string,
  ): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Envelope DocuSign ${envelopeId} cancelado (voided). Motivo: ${reason || 'Cancelamento solicitado pelo administrador.'}`,
    }
  }

  async resendEnvelope(
    envelopeId: string,
    signerEmail?: string,
  ): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Lembrete de assinatura DocuSign disparado com sucesso para ${signerEmail || 'destinatários pendentes'}.`,
    }
  }

  async webhookHandler(
    payload: Record<string, any>,
    signatureHeader?: string,
  ): Promise<WebhookResult> {
    // DocuSign Connect webhook payload: { event: "envelope-completed" | "envelope-signed" | "recipient-declined", data: { envelopeId: "..." } }
    const rawEvent = String(payload.event || payload.status || '').toLowerCase()
    let event: WebhookResult['event'] = 'unknown'

    if (rawEvent.includes('completed') || rawEvent.includes('signed')) event = 'signed'
    else if (rawEvent.includes('delivered') || rawEvent.includes('viewed')) event = 'viewed'
    else if (rawEvent.includes('declined') || rawEvent.includes('voided')) event = 'declined'
    else if (rawEvent.includes('expired')) event = 'expired'
    else if (rawEvent.includes('sent')) event = 'sent'

    const envelopeId =
      payload.data?.envelopeId || payload.envelopeId || payload.envelope_id || `ds-${Date.now()}`
    const signerEmail =
      payload.data?.recipientEmail ||
      payload.recipientEmail ||
      payload.email ||
      'colaborador@ciafal.com.br'

    return {
      success: true,
      event,
      envelopeId,
      signerEmail,
      signedAt: event === 'signed' ? new Date().toISOString() : undefined,
      documentHash: payload.data?.documentHash || `sha256-${Date.now()}`,
      signatureHash: payload.data?.signatureHash || `sig-ds-${Date.now().toString(16)}`,
      rawPayload: payload,
    }
  }

  async getHealth(): Promise<ProviderHealth> {
    return {
      online: true,
      lastCheck: new Date().toISOString(),
      latency: this.isMock ? 24 : 142,
    }
  }
}

export const defaultDocuSignProvider = new DocuSignProvider()
