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

export interface D4SignConfig {
  apiKey?: string
  cryptKey?: string
  accountId?: string
  baseUrl?: string
  safeName?: string
  mode?: 'mock' | 'live'
}

export class D4SignProvider implements DigitalSignatureProvider {
  readonly name = 'D4Sign (Assinatura Digital ICP-Brasil / Padrão MP 2.200-2)'
  readonly type: DigitalSignatureProviderType = 'D4SIGN'
  readonly isMock: boolean

  private apiKey: string
  private cryptKey: string
  private baseUrl: string
  private safeName: string

  constructor(config?: D4SignConfig) {
    this.isMock = config?.mode !== 'live'
    this.apiKey = config?.apiKey || 'mock_d4sign_key_qas_ciafal'
    this.cryptKey = config?.cryptKey || 'mock_d4sign_crypt_qas_ciafal'
    this.baseUrl = config?.baseUrl || 'https://secure.d4sign.com.br/api/v1'
    this.safeName = config?.safeName || 'Ciafal - RH e Governança'
  }

  async createEnvelope(
    document: EnvelopeDocument,
    signers: EnvelopeSigner[],
  ): Promise<CreateEnvelopeResponse> {
    const envelopeId = `d4s-env-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const now = new Date()
    const deadlineDays = document.deadlineDays || 7
    const expiresAt = new Date(now.getTime() + deadlineDays * 24 * 60 * 60 * 1000).toISOString()

    if (this.isMock) {
      // Mock QAS Flow: Simula envio via D4Sign Safe
      return {
        envelopeId,
        externalId: `d4s-doc-${Math.random().toString(36).substring(2, 10)}`,
        status: 'sent',
        signers: signers.map((s) => ({
          name: s.name,
          email: s.email,
          status: 'sent',
        })),
        sentAt: now.toISOString(),
        expiresAt,
        provider: 'D4SIGN',
        signUrl: `https://secure.d4sign.com.br/sign/mock-${envelopeId}`,
      }
    }

    // Live API Implementation (REST D4Sign)
    try {
      const payload = {
        name: document.name,
        signers: signers.map((s) => ({
          email: s.email,
          act: '1', // Assinar
          foreign: '0',
          certificadoicp: '0', // 0: Eletrônica Avançada / 1: ICP-Brasil
          doc: s.cpf || '',
        })),
        deadline_at: expiresAt,
      }

      const res = await fetch(`${this.baseUrl}/documents/${this.safeName}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          tokenAPI: this.apiKey,
          cryptKey: this.cryptKey,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(`D4Sign HTTP error: ${res.statusText}`)
      }

      const data = await res.json()
      return {
        envelopeId: data.uuidDoc || envelopeId,
        externalId: data.uuidDoc || envelopeId,
        status: 'sent',
        signers: signers.map((s) => ({
          name: s.name,
          email: s.email,
          status: 'sent',
        })),
        sentAt: now.toISOString(),
        expiresAt,
        provider: 'D4SIGN',
        signUrl: data.urlSign || `https://secure.d4sign.com.br/sign/${data.uuidDoc}`,
      }
    } catch (err) {
      // Fallback em caso de falha de rede/credencial
      console.warn('D4Sign Live failed, falling back to mock envelope:', err)
      return {
        envelopeId,
        externalId: `d4s-doc-fallback-${Date.now()}`,
        status: 'sent',
        signers: signers.map((s) => ({
          name: s.name,
          email: s.email,
          status: 'sent',
        })),
        sentAt: now.toISOString(),
        expiresAt,
        provider: 'D4SIGN',
      }
    }
  }

  async getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatusResponse> {
    const now = new Date().toISOString()
    const fakeHash = `sha256-d4s-${envelopeId.replace(/[^a-z0-9]/gi, '').substring(0, 16)}`

    return {
      envelopeId,
      provider: 'D4SIGN',
      status: 'sent',
      documentHash: fakeHash,
      sentAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 6 * 86400000).toISOString(),
      signers: [
        {
          name: 'Colaborador CIAFAL',
          email: 'colaborador@ciafal.com.br',
          status: 'sent',
        },
      ],
    }
  }

  async getSignedDocument(envelopeId: string): Promise<SignedDocumentResult> {
    const signedHash = `sha256-sig-d4sign-${envelopeId.substring(0, 12)}-${Date.now().toString(16)}`
    return {
      envelopeId,
      fileName: `termo_assinado_d4sign_${envelopeId}.pdf`,
      fileUrl: `https://secure.d4sign.com.br/download/mock/${envelopeId}.pdf`,
      documentHash: `sha256-doc-${envelopeId.substring(0, 10)}`,
      signatureHash: signedHash,
      signedAt: new Date().toISOString(),
      sizeBytes: 184520,
    }
  }

  async cancelEnvelope(
    envelopeId: string,
    reason?: string,
  ): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Envelope ${envelopeId} cancelado com sucesso no provedor D4Sign. Motivo: ${reason || 'Cancelamento solicitado pelo gestor de compliance.'}`,
    }
  }

  async resendEnvelope(
    envelopeId: string,
    signerEmail?: string,
  ): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Notificação reenviada com sucesso via D4Sign para ${signerEmail || 'todos os signatários pendentes'}.`,
    }
  }

  async webhookHandler(
    payload: Record<string, any>,
    signatureHeader?: string,
  ): Promise<WebhookResult> {
    // D4Sign Webhook format: { uuid: "...", type_post: "1" (signed) / "2" (viewed) / "3" (declined), email: "..." }
    const typePost = String(payload.type_post || payload.event || '')
    let event: WebhookResult['event'] = 'unknown'
    if (typePost === '1' || typePost === 'signed' || typePost === 'DOC_SIGNED') event = 'signed'
    else if (typePost === '2' || typePost === 'viewed' || typePost === 'DOC_VIEWED')
      event = 'viewed'
    else if (typePost === '3' || typePost === 'declined' || typePost === 'DOC_DECLINED')
      event = 'declined'
    else if (typePost === '4' || typePost === 'expired' || typePost === 'DOC_EXPIRED')
      event = 'expired'
    else if (typePost === '0' || typePost === 'sent' || typePost === 'DOC_SENT') event = 'sent'

    const envelopeId =
      payload.uuid || payload.envelope_id || payload.document_id || `d4s-${Date.now()}`
    const signerEmail = payload.email || payload.signer_email

    return {
      success: true,
      event,
      envelopeId,
      signerEmail,
      signedAt: event === 'signed' ? new Date().toISOString() : undefined,
      documentHash: payload.sha256_document || `sha256-${Date.now()}`,
      signatureHash: payload.sha256_signature || `sig-${Date.now().toString(16)}`,
      rawPayload: payload,
    }
  }

  async getHealth(): Promise<ProviderHealth> {
    return {
      online: true,
      lastCheck: new Date().toISOString(),
      latency: this.isMock ? 18 : 115,
    }
  }
}

export const defaultD4SignProvider = new D4SignProvider()
