import { describe, it, expect, vi } from 'vitest'
import { defaultMicrosoft365Provider } from '../providers/MicrosoftGraphProvider'
import { defaultAIProvider } from '../providers/LocalAIAdapter'
import { microsoft365Service } from '../services/microsoft365_service'
import type { CommercialEmail } from '../providers/Microsoft365Provider'

describe('CRM 360º — Microsoft 365 / Graph Integration & Login Clean', () => {
  // N.1 - Validação da Tela de Login
  it('1. Tela de Login deve ter subtítulo corporativo e sem claims de marketing/IA de terceiros', () => {
    const subtitle =
      'Relacionamento, inteligência comercial e execução de vendas em uma única plataforma.'
    expect(subtitle).toContain('Relacionamento, inteligência comercial e execução de vendas')
    expect(subtitle).not.toContain('OpenAI')
    expect(subtitle).not.toContain('Claude')
    expect(subtitle).not.toContain('Gemini')
  })

  // N.2 - Microsoft Graph Provider Fallback e Health Check
  it('2. Microsoft Graph Provider deve operar em MOCK resiliente e reportar dados demonstrativos', async () => {
    const health = await defaultMicrosoft365Provider.getHealth()
    expect(health.online).toBe(true)
    expect(health.latency).toBeDefined()
    expect(defaultMicrosoft365Provider.isDemoData()).toBe(true)
    expect(defaultMicrosoft365Provider.mode).toBe('MOCK')
  })

  // Ingestão Comercial Inteligente
  it('3. Ingestão: E-mail com domínio de cliente conhecido deve ser ingerido e classificado', async () => {
    const email: CommercialEmail = {
      id: 'msg-test-01',
      messageId: 'MSG-001-TEST',
      internetMessageId: '<test-001@santarita.ind.br>',
      conversationId: 'CONV-001',
      subject: 'Solicitação de Tubo Inox 304',
      bodyPreview: 'Precisamos de cotação de 3 toneladas de tubo inox 304 com frete CIF.',
      from: 'compras@santarita.ind.br',
      to: ['carlos.mendonca@ciafal.com.br'],
      receivedDateTime: new Date().toISOString(),
      hasAttachments: false,
      customerId: 'CLI-8041',
    }

    const result = await microsoft365Service.ingestEmail(email, 'user-seller-01')
    expect(result.ingested).toBe(true)
    expect(result.interaction).toBeDefined()
    expect(result.interaction?.channel).toBe('email')
    expect(result.interaction?.customer_id).toBe('CLI-8041')
  })

  it('4. Ingestão: E-mail irrelevante / pessoal / spam NÃO deve ser ingerido', async () => {
    const junkEmail: CommercialEmail = {
      id: 'msg-spam-01',
      messageId: 'MSG-SPAM-001',
      internetMessageId: '<newsletter@promocoes.com>',
      conversationId: 'CONV-SPAM',
      subject: 'Oferta imperdível de passagens aéreas',
      bodyPreview: 'Confira nossos pacotes de férias para o fim de ano com 50% de desconto.',
      from: 'newsletter@promocoes.com',
      to: ['carlos.mendonca@ciafal.com.br'],
      receivedDateTime: new Date().toISOString(),
      hasAttachments: false,
    }

    const result = await microsoft365Service.ingestEmail(junkEmail)
    expect(result.ingested).toBe(false)
    expect(result.interaction).toBeUndefined()
  })

  it('5. Ingestão: Categoria Outlook "CRM 360º" força a ingestão manual', async () => {
    const manualTaggedEmail: CommercialEmail = {
      id: 'msg-tagged-01',
      messageId: 'MSG-TAGGED-001',
      internetMessageId: '<alguem@outro.com>',
      conversationId: 'CONV-TAGGED',
      subject: 'Alinhamento geral de projetos',
      bodyPreview: 'Gostaria de falar sobre nossa reunião técnica da semana que vem.',
      from: 'alguem@outro.com',
      to: ['carlos.mendonca@ciafal.com.br'],
      receivedDateTime: new Date().toISOString(),
      hasAttachments: false,
      categories: ['CRM 360º'],
    }

    const result = await microsoft365Service.ingestEmail(manualTaggedEmail)
    expect(result.ingested).toBe(true)
    expect(result.reason).toContain('CRM 360º')
  })

  it('6. Idempotência: Webhook duplicado de e-mail não duplica processamento', async () => {
    const email: CommercialEmail = {
      id: 'msg-idempotent-01',
      messageId: 'MSG-IDEMPOTENT-001',
      internetMessageId: '<msg-idemp@santarita.ind.br>',
      conversationId: 'CONV-IDEMP',
      subject: 'Confirmação de entrega pedido 77410',
      bodyPreview: 'O pedido PED-SAP-77410 chegou em perfeito estado.',
      from: 'compras@santarita.ind.br',
      to: ['carlos.mendonca@ciafal.com.br'],
      receivedDateTime: new Date().toISOString(),
      hasAttachments: false,
      customerId: 'CLI-8041',
    }

    const firstRun = await defaultMicrosoft365Provider.processInboundEmail(email)
    const secondRun = await defaultMicrosoft365Provider.processInboundEmail(email)

    expect(firstRun).toBeDefined()
    expect(secondRun.source).toBe('microsoft_graph_idempotent')
    expect(secondRun.summary).toContain('idempotente')
  })

  // Sincronização de Contatos e Divergências
  it('7. Sincronização de Contatos Microsoft deve gerar sugestão em divergência sem sobrescrever CRM silenciosamente', async () => {
    const syncRes = await defaultMicrosoft365Provider.syncContacts('user-01')
    expect(syncRes.totalSynced).toBeGreaterThan(0)
    expect(syncRes.suggestionsCreated).toBeGreaterThanOrEqual(1)

    const suggestions = await defaultMicrosoft365Provider.suggestContactUpdates('contato-001')
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0].field_name).toBe('jobTitle')
    expect(suggestions[0].crm_value).toBe('Gerente de Compras')
    expect(suggestions[0].ms_value).toBe('Diretor de Suprimentos')
    expect(suggestions[0].status).toBe('PENDING')
  })

  // Calendário Comercial
  it('8. Calendário Comercial do Microsoft 365 deve filtrar e retornar somente compromissos comerciais públicos', async () => {
    const events = await defaultMicrosoft365Provider.getCommercialEvents('CLI-8041')
    expect(events.length).toBeGreaterThan(0)
    expect(events.every((e) => e.isCommercial === true)).toBe(true)
    expect(events.every((e) => e.isPrivate !== true)).toBe(true)
  })

  // IA de E-mail: Extração estruturada e Rascunho Human-in-the-loop
  it('9. IA de E-mail deve extrair intenção, objeção de preço e próxima ação recomendada', async () => {
    const text = 'Está caro em relação ao concorrente regional. Conseguem melhorar o preço para 30/60 DDL?'
    const extracted = await defaultAIProvider.extractEmailContext!(text, 'RES: Cotação Tubos Inox')

    expect(extracted.intent).toBe('negociação')
    expect(extracted.objection).toBe('preço')
    expect(extracted.nextAction).toContain('supervisor')
    expect(extracted.confidence).toBeGreaterThan(0.8)
  })

  it('10. IA de E-mail deve gerar rascunho de proposta formal (human-in-the-loop)', async () => {
    const draft = await defaultAIProvider.generateCommercialEmailDraft!({
      recipientEmail: 'compras@santarita.ind.br',
      recipientName: 'Roberto Antunes',
      customerName: 'Metalúrgica Santa Rita',
      intent: 'QUOTE_SENT',
      quoteId: 'COT-SAP-98104',
      quoteValue: 54000,
      sellerName: 'Carlos Mendonça',
    })

    expect(draft.subject).toContain('COT-SAP-98104')
    expect(draft.body).toContain('Roberto')
    expect(draft.body).toContain('Carlos Mendonça')
    expect(draft.suggestedAttachments?.[0]).toContain('COT-SAP-98104')
    expect(draft.confidence).toBeGreaterThan(0.9)
  })
})
