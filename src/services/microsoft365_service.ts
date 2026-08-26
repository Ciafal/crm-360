import pb from '@/lib/pocketbase/client'
import { defaultMicrosoft365Provider } from '@/providers/MicrosoftGraphProvider'
import type {
  CommercialEmail,
  MSContact,
  ContactSyncResult,
  ContactUpdateSuggestion,
  CommercialEvent,
  Interaction,
} from '@/providers/Microsoft365Provider'

export interface EmailIngestionResult {
  ingested: boolean
  reason: string
  interaction?: Interaction
  autoCompletedAction?: boolean
}

export class Microsoft365Service {
  private provider = defaultMicrosoft365Provider

  /**
   * Avalia e ingere um e-mail do Microsoft 365 de acordo com as regras estritas
   * comerciais da CIAFAL: nunca copia caixa postal inteira.
   */
  async ingestEmail(email: CommercialEmail, sellerId?: string): Promise<EmailIngestionResult> {
    // Validação de relevância comercial
    const subjectAndBody = `${email.subject} ${email.bodyPreview}`.toLowerCase()
    const hasCrmCategory = email.categories?.some((c) => c.toLowerCase().includes('crm 360'))
    const hasSapNumber = /(?:COT|PED|NF|SAP)[\s\-:]*([0-9]{4,10})/i.test(subjectAndBody)
    const hasKnownCustomerOrContact = Boolean(email.customerId || email.contactId)
    const hasKnownDomain = [
      'santarita.ind.br',
      'tanquespaulista.com.br',
      'mecanicaalvorada.com.br',
    ].some((d) => email.from.toLowerCase().includes(d))
    const hasCommercialKeywords = [
      'cotação',
      'cotacao',
      'preço',
      'preco',
      'prazo',
      'pedido',
      'proposta',
      'faturamento',
      'tonelada',
      'tubo',
      'chapa',
    ].some((kw) => subjectAndBody.includes(kw))

    const isCommerciallyRelevant =
      hasCrmCategory ||
      hasSapNumber ||
      hasKnownCustomerOrContact ||
      hasKnownDomain ||
      hasCommercialKeywords

    if (!isCommerciallyRelevant) {
      return {
        ingested: false,
        reason:
          'E-mail descartado da ingestão automática: não atende a nenhum critério comercial seguro.',
      }
    }

    // Processa pelo provider correspondente (Inbound ou Outbound)
    const isOutbound =
      email.from.toLowerCase().includes('ciafal.com.br') || Boolean(email.sentDateTime)
    const interactionData = isOutbound
      ? await this.provider.processOutboundEmail(email)
      : await this.provider.processInboundEmail(email)

    // Se houver quote detectada e for envio de e-mail (EMAIL_SENT), dispara auto-complete de ação comercial
    let autoCompletedAction = false
    if (isOutbound && (email.quoteId || hasSapNumber)) {
      try {
        await pb.send('/actions/auto-complete', {
          method: 'POST',
          body: {
            seller_id: sellerId,
            customer_id: interactionData.customer_id,
            channel: 'email_sent',
            external_id: email.messageId,
            occurred_at: interactionData.occurred_at,
            subject: interactionData.subject,
            quote_id: email.quoteId || interactionData.quote_id,
            message_id: email.messageId,
            conversation_id: email.conversationId,
            summary: `Envio de cotação por e-mail (${email.quoteId || 'SAP'}): ${email.subject}`,
          },
        })
        autoCompletedAction = true
      } catch (err) {
        console.warn('Auto-complete call warning (offline or demo mode):', err)
      }
    }

    return {
      ingested: true,
      reason: hasCrmCategory
        ? 'Ingerido via categoria Outlook CRM 360º'
        : hasSapNumber
          ? 'Ingerido via detecção de código SAP'
          : 'Ingerido via correspondência de contato/domínio comercial',
      interaction: interactionData,
      autoCompletedAction,
    }
  }

  /**
   * Sincroniza contatos do Outlook com a base do CRM.
   * Não sobrescreve silenciosamente em caso de divergência: cria ContactUpdateSuggestion.
   */
  async syncContacts(userId: string): Promise<ContactSyncResult> {
    return this.provider.syncContacts(userId)
  }

  /**
   * Retorna sugestões de atualização de contatos divergentes.
   */
  async getContactSuggestions(contactId: string): Promise<ContactUpdateSuggestion[]> {
    return this.provider.suggestContactUpdates(contactId)
  }

  /**
   * Retorna eventos comerciais do calendário Outlook (exclui privados).
   */
  async getCommercialCalendarEvents(customerId?: string): Promise<CommercialEvent[]> {
    return this.provider.getCommercialEvents(customerId)
  }

  /**
   * Retorna estado e saúde da integração Microsoft 365
   */
  async getIntegrationHealth() {
    return this.provider.getHealth()
  }
}

export const microsoft365Service = new Microsoft365Service()
