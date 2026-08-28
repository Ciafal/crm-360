import { describe, it, expect, beforeEach } from 'vitest'
import {
  quotationService,
  CATALOG_MATERIALS,
  PRELOADED_CUSTOMERS,
  STOCK_CONFIRMATION_THRESHOLD_TONS,
} from '@/services/quotation_service'
import type { Quotation, QuotationItem } from '@/types/quotation'

describe('Ciclo Completo de Gestão de Cotações CRM 360º CIAFAL', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('1. Deve listar catálogo de materiais com lotes, peso médio, peso moda e produção prevista SAP', () => {
    expect(CATALOG_MATERIALS.length).toBeGreaterThan(0)
    const inox = CATALOG_MATERIALS.find((m) => m.code === 'TB-304-SCH10')
    expect(inox).toBeDefined()
    expect(inox?.availableStock).toBe(12.5)
    expect(inox?.stockDetails.batchCount).toBe(6)
    expect(inox?.stockDetails.averageBatchWeightTons).toBe(2.08)
    expect(inox?.stockDetails.modeBatchWeightTons).toBe(2.1)
    expect(inox?.plannedProduction.hasPlannedProduction).toBe(true)
    expect(inox?.plannedProduction.plannedQuantityTons).toBe(18.0)
    expect(inox?.plannedProduction.sourceSystem).toContain('SAP ECC')
  })

  it('2. Deve permitir criação de cotação com cliente SAP, contatos, produtos e quantidade em toneladas', async () => {
    const cust = PRELOADED_CUSTOMERS[0]
    const mat = CATALOG_MATERIALS[0]

    const item: QuotationItem = {
      id: 'test-it-1',
      item_sequence: 10,
      material_code: mat.code,
      description: mat.description,
      quantity: 5.0, // 5 t
      unit: 't',
      requested_date: '2024-11-10',
      sap_price: mat.sapPrice,
      proposed_price: mat.sapPrice,
      deviation_pct: 0,
      final_price: mat.sapPrice,
      total: mat.sapPrice * 5.0,
      stock_available: mat.availableStock,
      stock_situation: 'ESTOQUE_SUFICIENTE',
      stock_updated_at: mat.stockUpdatedAt,
      stock_confirmation_required: false,
      stock_confirmed: true,
    }

    const created = await quotationService.saveQuotation({
      customer_id: cust.id,
      customer_sap_code: cust.sapCode,
      customer_name: cust.razaoSocial,
      contact_name: cust.contatos[0].nome,
      ship_to_code: cust.shipToAddresses[0].code,
      items: [item],
      total_tons: 5.0,
      total_value: item.total,
      status: 'PRONTA_PARA_ENVIO',
    })

    expect(created.id).toBeDefined()
    expect(created.code).toMatch(/^COT-/)
    expect(created.total_tons).toBe(5.0)
    expect(created.status).toBe('PRONTA_PARA_ENVIO')
  })

  it('3. Saldo < 5t deve apenas alertar e permitir solicitar confirmação de estoque SLA 48h sem bloquear a cotação', async () => {
    const matLow = CATALOG_MATERIALS.find((m) => m.availableStock < STOCK_CONFIRMATION_THRESHOLD_TONS)
    expect(matLow).toBeDefined()
    expect(matLow!.availableStock).toBeLessThan(5.0)

    const req = await quotationService.requestStockConfirmation({
      quotation_id: 'quote-98105',
      quotation_code: 'COT-98105',
      quotation_item_id: 'item-105-1',
      customer_name: 'Caldeiraria & Tanques Industrial Paulista',
      material_code: matLow!.code,
      material_description: matLow!.description,
      requested_qty: 4.5,
      unit: 't',
      stock_snapshot_qty: matLow!.availableStock,
      requested_by: 'Carlos Mendonça',
      assigned_area: 'PCP / Laminação Inox',
    })

    expect(req.id).toBeDefined()
    expect(req.confirmation_status).toBe('AGUARDANDO_ANALISE')
    expect(req.sla_deadline).toBeDefined()

    // O retorno de confirmação
    const responded = await quotationService.respondStockConfirmation(
      req.id,
      'CONFIRMAR',
      4.5,
      '2024-11-05',
      'Lote complementar 1.3t liberado no pátio.',
      'Supervisor WMS Contagem',
    )
    expect(responded.confirmation_status).toBe('CONFIRMAR' ? 'CONFIRMADO' : 'CONFIRMADO')
    expect(responded.confirmed_qty).toBe(4.5)
  })

  it('4. Matriz de Alçada de Aprovação comercial deve calcular corretamente limites de Supervisor, Gerência e Diretoria', () => {
    // 1. Sem desvio
    const evalNormal = quotationService.calculateApprovalStatus([
      { deviation_pct: 0 } as any,
    ])
    expect(evalNormal.approvalStatus).toBe('NOT_REQUIRED')
    expect(evalNormal.approvalLevel).toBe('NENHUM')

    // 2. Desconto vendedor até 3%
    const evalSeller = quotationService.calculateApprovalStatus([
      { deviation_pct: -2.5 } as any,
    ])
    expect(evalSeller.approvalStatus).toBe('NOT_REQUIRED')

    // 3. Desconto Supervisor (entre 3% e 7%)
    const evalSup = quotationService.calculateApprovalStatus([
      { deviation_pct: -5.0 } as any,
    ])
    expect(evalSup.approvalStatus).toBe('PENDING')
    expect(evalSup.approvalLevel).toBe('SUPERVISOR')

    // 4. Desconto Gerência (entre 7% e 15%)
    const evalGer = quotationService.calculateApprovalStatus([
      { deviation_pct: -10.06 } as any,
    ])
    expect(evalGer.approvalStatus).toBe('PENDING')
    expect(evalGer.approvalLevel).toBe('GERENCIA')

    // 5. Desconto Diretoria (> 15%)
    const evalDir = quotationService.calculateApprovalStatus([
      { deviation_pct: -18.0 } as any,
    ])
    expect(evalDir.approvalStatus).toBe('PENDING')
    expect(evalDir.approvalLevel).toBe('DIRETORIA')
  })

  it('5. Versionamento formal de Cotação deve criar QuoteVersion e manter histórico auditável', async () => {
    const quotes = await quotationService.getAllQuotations()
    const baseQuote = quotes[0]

    const newVersion = await quotationService.createNewVersion(
      baseQuote.id,
      'Ajuste de volume de 6t para 10t solicitado pelo cliente Roberto.',
    )

    expect(newVersion.version).toBe(baseQuote.version + 1)
    expect(newVersion.versions_history?.length).toBeGreaterThan(0)
    expect(newVersion.versions_history?.[0].version).toBe(baseQuote.version)
  })

  it('6. Envio por WhatsApp e E-mail deve atualizar status para ENVIADA_AO_CLIENTE e agendar follow-up 48h', async () => {
    const comm = await quotationService.sendQuotationCommunication({
      quotation_id: 'quote-98104',
      channel: 'WHATSAPP',
      recipient: '(19) 99872-4411',
      recipient_name: 'Roberto Antunes',
      message: 'Olá Roberto, segue cotação COT-98104 em anexo.',
      attached_pdf_name: 'Proposta_CIAFAL_COT-98104_v1.pdf',
      sent_by: 'Carlos Mendonça',
    })

    expect(comm.id).toBeDefined()
    expect(comm.status).toBe('DELIVERED')

    const updated = await quotationService.getQuotationById('quote-98104')
    expect(updated?.status).toBe('ENVIADA_AO_CLIENTE')
    expect(updated?.next_action_due).toBeDefined()
    expect(updated?.next_action_description).toContain('Follow-up comercial')
  })

  it('7. Registro de Aceite do Cliente deve atualizar status para ACEITA com PO number', async () => {
    const updated = await quotationService.registerClientAcceptance(
      'quote-98104',
      'Cliente aprovou os valores negociados via WhatsApp.',
      'PO-99120',
      'WHATSAPP',
    )

    expect(updated.status).toBe('ACEITA')
    expect(updated.client_status).toBe('ACEITA')
    expect(updated.client_accepted_source).toBe('WHATSAPP')
    expect(updated.client_acceptance_notes).toContain('PO #PO-99120')
  })

  it('8. Registro de Perda deve exigir motivo formal e observações alimentando Pareto comercial', async () => {
    const lost = await quotationService.registerQuotationLoss(
      'quote-98105',
      'PRECO',
      'Distribuidor concorrente cobriu preço em 4.5%.',
    )

    expect(lost.status).toBe('PERDIDA')
    expect(lost.loss_reason).toBe('PRECO')
    expect(lost.loss_notes).toContain('Distribuidor concorrente')
  })

  it('9. Conversão em Pedido SAP ECC: deve criar QuoteOrderIntegration na fila e simular retorno do JOB SAP', async () => {
    // 1. Registrar na fila
    const queueItem = await quotationService.requestSapOrderQueue(
      'quote-98104',
      'Carlos Mendonça',
    )

    expect(queueItem.id).toBeDefined()
    expect(queueItem.status).toBe('READY_FOR_SAP')
    expect(queueItem.sap_customer_code).toBe('0001088041')
    expect(queueItem.items_payload.length).toBeGreaterThan(0)

    // 2. Simular JOB SAP SD lendo a fila e gerando a Ordem de Venda
    const executed = await quotationService.simulateSapJobExecution(queueItem.integration_id)
    expect(executed.status).toBe('IMPLANTED')
    expect(executed.sap_order_number).toMatch(/^1004/)
    expect(executed.sap_return_code).toBe('S')

    // 3. Verificar que a cotação vinculou o número do Pedido SAP
    const quote = await quotationService.getQuotationById('quote-98104')
    expect(quote?.sap_order_number).toBe(executed.sap_order_number)
    expect(quote?.status).toBe('PEDIDO_IMPLANTADO')
  })

  it('10. Pedido com valor muito alto (> R$ 400k) deve simular retorno SAP BLOCKED por Crédito F.35', async () => {
    // Criar cotação de alto valor
    const bigQuote = await quotationService.saveQuotation({
      id: 'quote-big-1',
      code: 'COT-BIG-01',
      customer_id: 'CLI-8041',
      customer_sap_code: '0001088041',
      customer_name: 'Metalúrgica Santa Rita Ltda',
      ship_to_code: '0001088041-01',
      client_status: 'ACEITA',
      approval_status: 'APPROVED',
      total_value: 520000,
      total_tons: 60.0,
      items: [
        {
          id: 'it-b-1',
          item_sequence: 10,
          material_code: 'TB-304-SCH10',
          description: 'Tubo Inox AISI 304',
          quantity: 60.0,
          unit: 't',
          requested_date: '2024-11-20',
          sap_price: 34500,
          proposed_price: 34500,
          deviation_pct: 0,
          final_price: 34500,
          total: 520000,
          stock_available: 100,
          stock_situation: 'ESTOQUE_SUFICIENTE',
          stock_updated_at: '2024-10-24',
          stock_confirmation_required: false,
          stock_confirmed: true,
        },
      ],
    })

    const queueItem = await quotationService.requestSapOrderQueue(bigQuote.id, 'Carlos Mendonça')
    const executed = await quotationService.simulateSapJobExecution(queueItem.integration_id)

    expect(executed.status).toBe('BLOCKED')
    expect(executed.sap_error_code).toBe('SAP_CREDIT_LOCK_02')
    expect(executed.sap_order_number).toBeDefined()

    const msgs = quotationService.getStoredSapMessages()
    const creditMsg = msgs.find((m) => m.integration_id === queueItem.integration_id)
    expect(creditMsg?.message_text).toContain('F.35')
  })
})
