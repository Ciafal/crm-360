import type { ProviderHealth } from './types'
import type {
  Microsoft365Provider,
  CommercialEmail,
  EmailQueryOptions,
  Interaction,
  MSContact,
  ContactSyncResult,
  ContactUpdateSuggestion,
  CommercialEvent,
  DateRange,
  Subscription,
  EmailClassification,
} from './Microsoft365Provider'

export class MicrosoftGraphProvider implements Microsoft365Provider {
  readonly name = 'Microsoft Graph 365 (CIAFAL Commercial Connector - Demonstration Mode)'
  readonly mode: 'MOCK' | 'REAL' = 'MOCK'
  private lastSync = new Date().toISOString()
  private processedMessageIds = new Set<string>()

  isDemoData(): boolean {
    return true
  }

  getLastSync(): string {
    return this.lastSync
  }

  async getHealth(): Promise<ProviderHealth> {
    return {
      online: true,
      lastCheck: this.lastSync,
      latency: 52,
    }
  }

  // Base mock de e-mails comerciais
  private mockEmails: CommercialEmail[] = [
    {
      id: 'msg-ms-001',
      messageId: 'AAMkAGI2TGFiYWNhLTAwMQ==',
      internetMessageId: '<CAB48291.904@santarita.ind.br>',
      conversationId: 'AAQkAGI2TGFiYWNhLWNvbnYtMDAx',
      subject: 'Solicitação de cotação - Tubos Inox AISI 304 SCH 10',
      bodyPreview:
        'Olá Carlos, bom dia! Gostaria de cotar 3 toneladas de Tubo Inox AISI 304 Redondo SCH 10 2" para entrega imediata em Campinas. Favor confirmar condição de frete CIF e prazo de pagamento.',
      from: 'compras@santarita.ind.br',
      fromName: 'Roberto Antunes (Metalúrgica Santa Rita)',
      to: ['carlos.mendonca@ciafal.com.br'],
      cc: ['juliana.costa@santarita.ind.br'],
      receivedDateTime: new Date(Date.now() - 3600000 * 3).toISOString(),
      hasAttachments: false,
      categories: ['CRM 360º', 'Cotação Comercial'],
      customerId: 'CLI-8041',
      contactId: 'contato-roberto-001',
      classification: 'QUOTE_REQUEST',
    },
    {
      id: 'msg-ms-002',
      messageId: 'AAMkAGI2TGFiYWNhLTAwMg==',
      internetMessageId: '<OUTLOOK-CIAFAL-98104@ciafal.com.br>',
      conversationId: 'AAQkAGI2TGFiYWNhLWNvbnYtMDAx',
      subject: 'RES: Proposta Comercial COT-SAP-98104 - CIAFAL Tubos Inox',
      bodyPreview:
        'Prezado Roberto, segue anexa a cotação formal COT-SAP-98104 com valor total de R$ 54.000,00 e condição 28 DDL. Temos pronta entrega com expedição em até 48h.',
      from: 'carlos.mendonca@ciafal.com.br',
      fromName: 'Carlos Mendonça',
      to: ['compras@santarita.ind.br'],
      sentDateTime: new Date(Date.now() - 3600000 * 2).toISOString(),
      receivedDateTime: new Date(Date.now() - 3600000 * 2).toISOString(),
      hasAttachments: true,
      categories: ['CRM 360º'],
      customerId: 'CLI-8041',
      contactId: 'contato-roberto-001',
      quoteId: 'COT-SAP-98104',
      opportunityId: 'opp-santa-rita-tubos',
      classification: 'QUOTE_SENT',
    },
    {
      id: 'msg-ms-003',
      messageId: 'AAMkAGI2TGFiYWNhLTAwMw==',
      internetMessageId: '<CAB48291.905@santarita.ind.br>',
      conversationId: 'AAQkAGI2TGFiYWNhLWNvbnYtMDAx',
      subject: 'RES: Proposta Comercial COT-SAP-98104 - CIAFAL Tubos Inox',
      bodyPreview:
        'Recebemos a cotação. O preço por kg está um pouco acima do concorrente regional. Conseguem melhorar a condição de pagamento para 30/60 DDL ou revisar para fechar até sexta-feira?',
      from: 'compras@santarita.ind.br',
      fromName: 'Roberto Antunes',
      to: ['carlos.mendonca@ciafal.com.br'],
      receivedDateTime: new Date(Date.now() - 3600000 * 1).toISOString(),
      hasAttachments: false,
      categories: ['CRM 360º'],
      customerId: 'CLI-8041',
      contactId: 'contato-roberto-001',
      quoteId: 'COT-SAP-98104',
      classification: 'NEGOTIATION',
    },
    {
      id: 'msg-ms-004',
      messageId: 'AAMkAGI2TGFiYWNhLTAwNA==',
      internetMessageId: '<CAB99812.100@tanquespaulista.com.br>',
      conversationId: 'AAQkAGI2TGFiYWNhLWNvbnYtMDAy',
      subject: 'Demanda de Chapas Inox 316L - Tanques Paulista',
      bodyPreview:
        'Carlos, me procure no próximo mês. Estamos finalizando o planejamento de paradas técnicas de novembro e teremos cotação de 15t de chapas 316L.',
      from: 'fernando@tanquespaulista.com.br',
      fromName: 'Fernando Silveira (Tanques Paulista)',
      to: ['carlos.mendonca@ciafal.com.br'],
      receivedDateTime: new Date(Date.now() - 86400000).toISOString(),
      hasAttachments: false,
      categories: ['CRM 360º'],
      customerId: 'CLI-7910',
      classification: 'FOLLOW_UP',
    },
  ]

  // Mock de contatos Microsoft
  private mockContacts: MSContact[] = [
    {
      id: 'ms-ct-001',
      displayName: 'Roberto Antunes',
      givenName: 'Roberto',
      surname: 'Antunes',
      emailAddresses: [{ address: 'compras@santarita.ind.br', name: 'Roberto Antunes' }],
      businessPhones: ['(19) 3884-9000'],
      mobilePhone: '(19) 99872-4411',
      companyName: 'Metalúrgica Santa Rita Ltda',
      jobTitle: 'Diretor de Suprimentos', // Cargo divergente para gerar suggestion
      department: 'Compras & Suprimentos',
    },
    {
      id: 'ms-ct-002',
      displayName: 'Juliana Costa',
      givenName: 'Juliana',
      surname: 'Costa',
      emailAddresses: [{ address: 'juliana.costa@santarita.ind.br' }],
      businessPhones: ['(19) 3884-9012'],
      mobilePhone: '(19) 98711-2299',
      companyName: 'Metalúrgica Santa Rita Ltda',
      jobTitle: 'Engenheira de Suprimentos',
    },
    {
      id: 'ms-ct-003',
      displayName: 'Fernando Silveira',
      givenName: 'Fernando',
      surname: 'Silveira',
      emailAddresses: [{ address: 'fernando@tanquespaulista.com.br' }],
      businessPhones: ['(16) 3946-1200'],
      mobilePhone: '(16) 99123-8877',
      companyName: 'Tanques Industrial Paulista',
      jobTitle: 'Diretor de Suprimentos',
    },
  ]

  // Mock de eventos de calendário comercial
  private mockEvents: CommercialEvent[] = [
    {
      id: 'evt-ms-001',
      subject: 'Reunião Comercial de Alinhamento Safra - Metalúrgica Santa Rita',
      start: new Date(Date.now() + 3600000 * 2).toISOString(),
      end: new Date(Date.now() + 3600000 * 3).toISOString(),
      location: 'Microsoft Teams / Sede Santa Rita',
      isOnlineMeeting: true,
      onlineMeetingUrl: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_mock',
      organizer: { email: 'carlos.mendonca@ciafal.com.br', name: 'Carlos Mendonça' },
      attendees: [
        { email: 'compras@santarita.ind.br', name: 'Roberto Antunes', status: 'accepted' },
        { email: 'juliana.costa@santarita.ind.br', name: 'Juliana Costa', status: 'accepted' },
      ],
      customerId: 'CLI-8041',
      customerName: 'Metalúrgica Santa Rita Ltda',
      isCommercial: true,
      isPrivate: false,
      bodyPreview:
        'Alinhamento sobre proposta COT-SAP-98104 e cronograma de entregas de tubos SCH 10.',
    },
    {
      id: 'evt-ms-002',
      subject: 'Follow-up de Fornecimento Inox 316L - Tanques Paulista',
      start: new Date(Date.now() + 86400000 * 2).toISOString(),
      end: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString(),
      location: 'Sertãozinho - SP / Presencial',
      organizer: { email: 'carlos.mendonca@ciafal.com.br', name: 'Carlos Mendonça' },
      attendees: [{ email: 'fernando@tanquespaulista.com.br', name: 'Fernando Silveira' }],
      customerId: 'CLI-7910',
      customerName: 'Caldeiraria & Tanques Industrial Paulista',
      isCommercial: true,
      isPrivate: false,
      bodyPreview: 'Visita técnica para levantamento de requisitos de chapas 316L.',
    },
  ]

  // Critérios de Ingestão Comercial
  private evaluateCommercialRelevance(email: CommercialEmail): {
    shouldIngest: boolean
    reason: string
    classification: EmailClassification
  } {
    // 1. Categoria manual CRM 360º no Outlook
    if (email.categories?.some((c) => c.toLowerCase().includes('crm 360'))) {
      return {
        shouldIngest: true,
        reason: 'Marcado com categoria Outlook "CRM 360º"',
        classification: email.classification || 'NEGOTIATION',
      }
    }

    // 2. Número SAP de cotação ou pedido no assunto ou corpo
    const sapMatch = (email.subject + ' ' + email.bodyPreview).match(
      /(?:COT|PED|NF|SAP)[\s\-:]*([0-9]{4,10})/i,
    )
    if (sapMatch) {
      return {
        shouldIngest: true,
        reason: `Contém identificador SAP (${sapMatch[0]})`,
        classification: email.classification || 'QUOTE_SENT',
      }
    }

    // 3. Remetente ou destinatário é contato de cliente conhecido
    if (email.customerId || email.contactId) {
      return {
        shouldIngest: true,
        reason: 'Associado a Customer/Contact conhecido no CRM',
        classification: email.classification || 'NEGOTIATION',
      }
    }

    // 4. Domínio corporativo conhecido
    const knownDomains = ['santarita.ind.br', 'tanquespaulista.com.br', 'mecanicaalvorada.com.br']
    const fromDomain = email.from.split('@')[1] || ''
    if (knownDomains.includes(fromDomain)) {
      return {
        shouldIngest: true,
        reason: `Domínio corporativo cliente identificado (@${fromDomain})`,
        classification: email.classification || 'QUOTE_REQUEST',
      }
    }

    // 5. Palavras-chave comerciais explícitas
    const commercialKeywords = [
      'cotação',
      'cotacao',
      'preço',
      'preco',
      'prazo',
      'pedido',
      'proposta',
      'faturamento',
      'tonelada',
    ]
    const combinedText = (email.subject + ' ' + email.bodyPreview).toLowerCase()
    const hasCommercialKeywords = commercialKeywords.some((kw) => combinedText.includes(kw))

    if (hasCommercialKeywords) {
      return {
        shouldIngest: true,
        reason: 'Termos comerciais explícitos na mensagem',
        classification: email.classification || 'POSSIBLE_COMMERCIAL_INTERACTION',
      }
    }

    // Nenhum critério atendido: não ingerir
    return {
      shouldIngest: false,
      reason: 'E-mail não comercial (pessoal, newsletter ou interno genérico)',
      classification: 'IRRELEVANT',
    }
  }

  async getCommercialEmails(
    customerId?: string,
    contactId?: string,
    options?: EmailQueryOptions,
  ): Promise<CommercialEmail[]> {
    let result = [...this.mockEmails]

    if (customerId) {
      result = result.filter(
        (e) =>
          e.customerId === customerId ||
          (customerId === 'CLI-8041' && e.from.includes('santarita')) ||
          (customerId === 'CLI-7910' && e.from.includes('tanquespaulista')),
      )
    }

    if (contactId) {
      result = result.filter((e) => e.contactId === contactId)
    }

    if (options?.limit) {
      result = result.slice(0, options.limit)
    }

    return result
  }

  async processInboundEmail(email: CommercialEmail): Promise<Interaction> {
    const evaluation = this.evaluateCommercialRelevance(email)

    // Idempotência: não duplica Interaction por message_id
    if (this.processedMessageIds.has(email.messageId)) {
      return {
        occurred_at: email.receivedDateTime,
        channel: 'email',
        direction: 'inbound',
        source: 'microsoft_graph_idempotent',
        message_id: email.messageId,
        subject: email.subject,
        summary: 'E-mail já processado anteriormente (idempotente).',
        email_classification: evaluation.classification,
      }
    }
    this.processedMessageIds.add(email.messageId)

    const interaction: Interaction = {
      customer_id: email.customerId || 'CLI-8041',
      contact_id: email.contactId || 'contato-001',
      channel: 'email',
      direction: 'inbound',
      occurred_at: email.receivedDateTime,
      source: 'microsoft_365_graph',
      external_id: email.id,
      subject: email.subject,
      email_from: email.from,
      email_to: email.to.join(', '),
      email_cc: email.cc?.join(', '),
      body_preview: email.bodyPreview.slice(0, 300),
      message_id: email.messageId,
      conversation_id: email.conversationId,
      internet_message_id: email.internetMessageId,
      has_attachments: email.hasAttachments,
      email_classification: evaluation.classification,
      summary: `${email.subject} — ${email.bodyPreview.slice(0, 120)}...`,
      detected_intent: evaluation.classification,
      quote_id: email.quoteId,
      opportunity_id: email.opportunityId,
      ai_confidence: 0.94,
      created_by_system: true,
    }

    return interaction
  }

  async processOutboundEmail(email: CommercialEmail): Promise<Interaction> {
    const evaluation = this.evaluateCommercialRelevance(email)
    this.processedMessageIds.add(email.messageId)

    const interaction: Interaction = {
      customer_id: email.customerId || 'CLI-8041',
      contact_id: email.contactId || 'contato-001',
      channel: 'email',
      direction: 'outbound',
      occurred_at: email.sentDateTime || email.receivedDateTime,
      source: 'microsoft_365_graph',
      external_id: email.id,
      subject: email.subject,
      email_from: email.from,
      email_to: email.to.join(', '),
      email_cc: email.cc?.join(', '),
      body_preview: email.bodyPreview.slice(0, 300),
      message_id: email.messageId,
      conversation_id: email.conversationId,
      internet_message_id: email.internetMessageId,
      has_attachments: email.hasAttachments,
      email_classification: evaluation.classification,
      summary: `Envio comercial: ${email.subject}`,
      quote_id: email.quoteId,
      opportunity_id: email.opportunityId,
      ai_confidence: 0.96,
      created_by_system: true,
    }

    return interaction
  }

  async syncContacts(userId: string): Promise<ContactSyncResult> {
    return {
      totalSynced: this.mockContacts.length,
      matchedExisting: 2,
      suggestionsCreated: 1, // Ex: Roberto Antunes com cargo divergente
      newContactsSuggested: 1,
      syncedAt: new Date().toISOString(),
    }
  }

  async getContactByEmail(email: string): Promise<MSContact | null> {
    const contact = this.mockContacts.find((c) =>
      c.emailAddresses.some((e) => e.address.toLowerCase() === email.toLowerCase()),
    )
    return contact || null
  }

  async suggestContactUpdates(contactId: string): Promise<ContactUpdateSuggestion[]> {
    return [
      {
        id: 'sugg-001',
        contact_id: contactId,
        field_name: 'jobTitle',
        crm_value: 'Gerente de Compras',
        ms_value: 'Diretor de Suprimentos',
        status: 'PENDING',
        created_at: new Date().toISOString(),
      },
    ]
  }

  async getCommercialEvents(
    customerId?: string,
    contactId?: string,
    dateRange?: DateRange,
  ): Promise<CommercialEvent[]> {
    let events = [...this.mockEvents]
    if (customerId) {
      events = events.filter((e) => e.customerId === customerId)
    }
    // Garante que eventos privados não sejam retornados
    return events.filter((e) => e.isCommercial && !e.isPrivate)
  }

  async subscribeToNotifications(resource: string): Promise<Subscription> {
    return {
      id: `sub-ms-${Date.now()}`,
      resource: resource || 'me/mailFolders/inbox/messages',
      expirationDateTime: new Date(Date.now() + 4230 * 60000).toISOString(), // ~3 dias
      changeType: 'created',
      notificationUrl: 'https://conectado-whatsapp-app.goskip.dev/api/webhooks/ms365',
      clientState: 'ciafal-crm-360-ms-state',
    }
  }

  async renewSubscription(subscriptionId: string): Promise<Subscription> {
    return {
      id: subscriptionId,
      resource: 'me/mailFolders/inbox/messages',
      expirationDateTime: new Date(Date.now() + 4230 * 60000).toISOString(),
      changeType: 'created',
      notificationUrl: 'https://conectado-whatsapp-app.goskip.dev/api/webhooks/ms365',
    }
  }
}

export const defaultMicrosoft365Provider = new MicrosoftGraphProvider()
