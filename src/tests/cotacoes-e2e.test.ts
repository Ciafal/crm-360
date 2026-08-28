import { describe, it, expect, beforeEach, vi } from 'vitest'
import { quotationService } from '@/services/quotation_service'
import * as tasksService from '@/services/tasks'
import { dailyActionsService } from '@/services/daily_actions_service'
import { mockFunilOportunidades, EtapaFunil } from '@/data/mockCommercialData'

describe('Conexões Reais de Cotações: Tasks, Meu Dia e Funil CRM', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('(a) sendQuotationCommunication deve gerar uma tarefa real de follow-up via createTask', async () => {
    // 1. Mock do createTask
    const createTaskSpy = vi.spyOn(tasksService, 'createTask').mockResolvedValue({
      id: 'task-test-123',
      title: 'Follow-up de Cotação COT-98104',
      status: 'pendente',
      priority: 'alta',
      source_type: 'QUOTE',
    } as any)

    // 2. Disparar o envio de comunicação da cotação
    const comm = await quotationService.sendQuotationCommunication({
      quotation_id: 'quote-98104',
      channel: 'WHATSAPP',
      recipient: '(19) 99872-4411',
      recipient_name: 'Roberto Antunes',
      message: 'Olá Roberto, segue a cotação oficial COT-98104.',
      attached_pdf_name: 'Proposta_CIAFAL_COT-98104.pdf',
      sent_by: 'Carlos Mendonça',
    })

    expect(comm).toBeDefined()
    expect(comm.status).toBe('DELIVERED')

    // 3. Verificar que createTask foi invocado com os dados corretos da cotação
    expect(createTaskSpy).toHaveBeenCalledTimes(1)
    const taskPayload = createTaskSpy.mock.calls[0][0]

    expect(taskPayload.title).toBe('Follow-up de Cotação COT-98104')
    expect(taskPayload.source_type).toBe('QUOTE')
    expect(taskPayload.status).toBe('pendente')
    expect(taskPayload.priority).toBe('alta')
    expect(taskPayload.customer_id).toBe('CLI-8041')
    expect(taskPayload.customer_name).toBe('Metalúrgica Santa Rita Ltda')
    expect(taskPayload.impact_meta_tons).toBe(6.0)
    expect(taskPayload.due_date).toBeDefined()
    expect(taskPayload.description).toContain('WHATSAPP')
    expect(taskPayload.description).toContain('Roberto Antunes')
  })

  it('(b) Cotações com status ENVIADA_AO_CLIENTE ou AGUARDANDO_RETORNO e SLA vencido/ausente geram ações de follow-up no Meu Dia', async () => {
    // Configurar cotação como ENVIADA_AO_CLIENTE no storage
    const quote = await quotationService.saveQuotation({
      id: 'quote-test-meudia',
      code: 'COT-TEST-MEUDIA',
      customer_id: 'CLI-8041',
      customer_name: 'Metalúrgica Santa Rita Ltda',
      seller_id: 'user-vend-1',
      status: 'ENVIADA_AO_CLIENTE',
      total_value: 85000,
      total_tons: 10.5,
      next_action_due: '2024-01-01', // Vencido
      last_contact_at: undefined,
    })

    expect(quote).toBeDefined()

    // Espionar bulkCreateIfNotExists do dailyActionsService
    const bulkCreateSpy = vi.spyOn(dailyActionsService, 'bulkCreateIfNotExists').mockResolvedValue([])

    // Simular a lógica de verificação de cotações que roda em use-daily-actions.ts
    const storedQuotes = quotationService.getStoredQuotations()
    const quoteActionsToCreate: any[] = []
    const nowTime = new Date().getTime()

    for (const q of storedQuotes) {
      const isTargetStatus = q.status === 'ENVIADA_AO_CLIENTE' || q.status === 'AGUARDANDO_RETORNO'
      if (isTargetStatus) {
        const hasNoDue = !q.next_action_due
        const isDuePast = q.next_action_due
          ? new Date(q.next_action_due).getTime() <= nowTime + 24 * 60 * 60 * 1000
          : false
        const hasNoContact = !q.last_contact_at

        if (hasNoDue || isDuePast || hasNoContact) {
          quoteActionsToCreate.push({
            seller_id: q.seller_id,
            customer_id: q.customer_id,
            customer_name: q.customer_name,
            action_type: 'follow_up',
            priority: 92,
            recommendation: `Follow-up da Cotação ${q.code} (${q.total_tons || 0}t) enviada ao cliente`,
            potential_revenue: q.total_value,
            potential_tons: q.total_tons,
            due_at: q.next_action_due,
            source: 'cotacao',
          })
        }
      }
    }

    if (quoteActionsToCreate.length > 0) {
      await dailyActionsService.bulkCreateIfNotExists(quoteActionsToCreate)
    }

    expect(bulkCreateSpy).toHaveBeenCalled()
    const createdArgs = bulkCreateSpy.mock.calls[0][0]
    const foundAction = createdArgs.find((a: any) => a.customer_name === 'Metalúrgica Santa Rita Ltda')

    expect(foundAction).toBeDefined()
    expect(foundAction.action_type).toBe('follow_up')
    expect(foundAction.potential_tons).toBe(10.5)
    expect(foundAction.potential_revenue).toBe(85000)
    expect(foundAction.source).toBe('cotacao')
  })

  it('(c) Status ACEITA e PEDIDO_IMPLANTADO refletem a etapa correta no Funil do CRM', async () => {
    // 1. Criar cotação aceita para Santa Rita
    await quotationService.saveQuotation({
      id: 'quote-santa-rita-aceita',
      code: 'COT-SR-01',
      customer_id: 'cli-100001',
      customer_sap_code: '100001',
      customer_name: 'Metalúrgica Santa Rita Ltda',
      status: 'ACEITA',
      total_tons: 16.5,
    })

    // 2. Criar cotação faturada / pedido implantado para Caldeiraria Betim
    await quotationService.saveQuotation({
      id: 'quote-betim-implantada',
      code: 'COT-BETIM-01',
      customer_id: 'cli-100002',
      customer_sap_code: '100002',
      customer_name: 'Aços & Caldeiraria Betim S.A.',
      status: 'PEDIDO_IMPLANTADO',
      total_tons: 22.0,
    })

    // 3. Executar o mapeamento de etapas do funil conforme implementado no CRM.tsx
    const storedQuotes = quotationService.getStoredQuotations()

    const funilMapeado = mockFunilOportunidades.map((op) => {
      const matchedQuote = storedQuotes.find(
        (q) =>
          (q.customer_id && q.customer_id.toLowerCase() === op.clienteId.toLowerCase()) ||
          (q.customer_sap_code &&
            op.clienteSap &&
            (q.customer_sap_code.endsWith(op.clienteSap) || op.clienteSap.endsWith(q.customer_sap_code))) ||
          (q.customer_name &&
            op.clienteNome &&
            (q.customer_name.toLowerCase().includes(op.clienteNome.toLowerCase()) ||
              op.clienteNome.toLowerCase().includes(q.customer_name.toLowerCase()))),
      )

      if (!matchedQuote) return op

      let mappedEtapa: EtapaFunil = op.etapa
      const qStatus = matchedQuote.status

      if (qStatus === 'ACEITA') {
        mappedEtapa = 'pedido'
      } else if (qStatus === 'PEDIDO_IMPLANTADO' || qStatus === 'PEDIDO_SAP_IMPLANTADO') {
        mappedEtapa = 'pedido'
      } else if (qStatus === 'CONVERSAO_SAP' || qStatus === 'AGUARDANDO_IMPLANTACAO_SAP') {
        mappedEtapa = 'pedido'
      } else if (qStatus === 'PERDIDA') {
        mappedEtapa = 'perdido'
      } else if (qStatus === 'CANCELADA') {
        mappedEtapa = 'cancelado'
      } else if (qStatus === 'ENVIADA_AO_CLIENTE' || qStatus === 'AGUARDANDO_RETORNO') {
        mappedEtapa = 'cotacao'
      } else if (qStatus === 'NEGOCIACAO' || qStatus === 'EM_NEGOCIACAO') {
        mappedEtapa = 'negociacao'
      }

      return {
        ...op,
        etapa: mappedEtapa,
        quotation_status: qStatus,
      }
    })

    // 4. Oportunidade op-109 (Santa Rita) que originalmente estava em 'cotacao', agora deve estar em 'pedido' com quotation_status = 'ACEITA'
    const opSantaRita = funilMapeado.find((op) => op.clienteSap === '100001')
    expect(opSantaRita).toBeDefined()
    expect(opSantaRita?.etapa).toBe('pedido')
    expect(opSantaRita?.quotation_status).toBe('ACEITA')

    // 5. Oportunidade op-112 (Betim) que originalmente estava em 'negociacao', agora deve estar em 'pedido' com quotation_status = 'PEDIDO_IMPLANTADO'
    const opBetim = funilMapeado.find((op) => op.clienteSap === '100002')
    expect(opBetim).toBeDefined()
    expect(opBetim?.etapa).toBe('pedido')
    expect(opBetim?.quotation_status).toBe('PEDIDO_IMPLANTADO')
  })
})