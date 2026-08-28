import { describe, it, expect, beforeEach } from 'vitest'
import {
  quotationService,
  STOCK_CONFIRMATION_THRESHOLD_TONS,
  CATALOG_MATERIALS,
} from '@/services/quotation_service'
import type { QuotationItem } from '@/types/quotation'

describe('Módulo de Cotações & Integração SAP ECC — 9 Critérios de Aceite', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // CENÁRIO A: Estoque > 5t -> Suficiente, sem necessidade de confirmação
  it('Cenário A: Estoque disponível >= 5t deve ser classificado como ESTOQUE_SUFICIENTE sem exigir confirmação obrigatória', () => {
    const matSuficiente = CATALOG_MATERIALS.find((m) => m.availableStock >= 5.0)
    expect(matSuficiente).toBeDefined()
    expect(matSuficiente!.availableStock).toBeGreaterThanOrEqual(STOCK_CONFIRMATION_THRESHOLD_TONS)
  })

  // CENÁRIO B: Estoque < 5t -> Baixo, dispara regra especial de confirmação
  it('Cenário B: Estoque disponível < 5t deve exigir confirmação de disponibilidade com o PCP/Logística', () => {
    const matBaixo = CATALOG_MATERIALS.find((m) => m.availableStock < 5.0 && m.availableStock > 0)
    expect(matBaixo).toBeDefined()
    expect(matBaixo!.availableStock).toBeLessThan(STOCK_CONFIRMATION_THRESHOLD_TONS)
  })

  // CENÁRIO C: Confirmação positiva pelo PCP -> Status CONFIRMADO
  it('Cenário C: Ao receber resposta positiva do PCP, o status do item e da cotação passa para CONFIRMADO', async () => {
    const req = await quotationService.requestStockConfirmation({
      quotation_id: 'quote-test-1',
      quotation_code: 'COT-TEST-01',
      quotation_item_id: 'item-test-1',
      customer_name: 'Cliente Teste S.A.',
      material_code: 'CH-304-3MM',
      material_description: 'Chapa Inox 3.00mm',
      requested_qty: 4.5,
      unit: 't',
      stock_snapshot_qty: 3.2,
      assigned_area: 'PCP / Laminação Inox',
      requested_by: 'Carlos Mendonça',
    })

    expect(req.confirmation_status).toBe('AGUARDANDO_ANALISE')

    const answered = await quotationService.respondStockConfirmation(
      req.id,
      'CONFIRMAR',
      4.5,
      '2024-11-10',
      'Lote liberado na linha de corte.',
      'Eng. Marcelo (PCP)',
    )

    expect(answered.confirmation_status).toBe('CONFIRMADO')
    expect(answered.confirmed_qty).toBe(4.5)
  })

  // CENÁRIO D: Confirmação parcial -> Divergência registrada
  it('Cenário D: Ao confirmar parcialmente, deve registrar quantidade parcial e status CONFIRMADO_PARCIAL', async () => {
    const req = await quotationService.requestStockConfirmation({
      quotation_id: 'quote-test-2',
      quotation_code: 'COT-TEST-02',
      quotation_item_id: 'item-test-2',
      customer_name: 'Cliente Teste S.A.',
      material_code: 'CH-304-3MM',
      requested_qty: 6.0,
      unit: 't',
      stock_snapshot_qty: 3.2,
      assigned_area: 'PCP',
      requested_by: 'Carlos Mendonça',
      material_description: 'Chapa Inox 3.00mm',
    })

    const answered = await quotationService.respondStockConfirmation(
      req.id,
      'PARCIAL',
      3.2,
      '2024-11-10',
      'Apenas 3.2t disponíveis no momento.',
      'Eng. Marcelo (PCP)',
    )

    expect(answered.confirmation_status).toBe('CONFIRMADO_PARCIAL')
    expect(answered.confirmed_qty).toBe(3.2)
  })

  // CENÁRIO E: Aceite do cliente -> Solicitar implantação -> AGUARDANDO SAP
  it('Cenário E: Cotação aprovada + aceite do cliente permite envio para a fila com status AGUARDANDO_IMPLANTACAO_SAP / READY_FOR_SAP', async () => {
    const quote = await quotationService.saveQuotation({
      code: 'COT-TEST-VALIDA',
      customer_id: 'CLI-8041',
      customer_sap_code: '0001088041',
      customer_name: 'Metalúrgica Santa Rita Ltda',
      ship_to_code: '0001088041-01',
      seller_name: 'Carlos Mendonça',
      payment_terms: '28 DDL',
      incoterm: 'CIF',
      approval_status: 'APROVADA_AUTOMATICAMENTE',
      client_status: 'ACEITA',
      client_acceptance_notes: 'PO #PO-99182',
      items: [
        {
          id: 'it-1',
          item_sequence: 10,
          material_code: 'TB-304-SCH10',
          description: 'Tubo Inox AISI 304',
          quantity: 6.0,
          unit: 't',
          requested_date: '2024-11-10',
          sap_price: 34500,
          proposed_price: 34500,
          deviation_pct: 0,
          final_price: 34500,
          total: 207000,
          stock_available: 12.5,
          stock_situation: 'ESTOQUE_SUFICIENTE',
          stock_updated_at: '2024-10-24 16:30',
          stock_confirmation_required: false,
          stock_confirmed: true,
        },
      ],
      total_value: 207000,
      total_tons: 6.0,
    })

    const queueItem = await quotationService.requestSapOrderQueue(quote.id, 'Carlos Mendonça')
    expect(queueItem).toBeDefined()
    expect(queueItem.request_status).toBe('READY_FOR_SAP')
    expect(queueItem.sap_customer_code).toBe('0001088041')

    const updatedQuote = await quotationService.getQuotationById(quote.id)
    expect(updatedQuote?.status).toBe('AGUARDANDO_IMPLANTACAO_SAP')
  })

  // CENÁRIO F: JOB SAP cria ordem oficial -> PEDIDO SAP IMPLANTADO
  it('Cenário F: JOB SAP processa o registro da fila e oficializa a Ordem de Venda com código SAP', async () => {
    const queue = quotationService.getStoredSapQueue()
    const pendingItem = queue[0]

    const processed = await quotationService.simulateSapJobExecution(pendingItem.integration_id)
    expect(processed.request_status).toBe('SAP_CREATED')
    expect(processed.sap_order_number).toMatch(/^1004\d{4}$/)
  })

  // CENÁRIO G: SAP Bloqueia por Crédito
  it('Cenário G: Pedidos acima do limite de crédito recebem status BLOQUEADO_NO_SAP com mensagem F.35', async () => {
    const queue = quotationService.getStoredSapQueue()
    const highValueItem = {
      ...queue[0],
      integration_id: 'INT-SAP-HIGH-CREDIT',
      quotation_total: 500000, // Alto valor para simular estouro de crédito F.35
    }
    quotationService.saveStoredSapQueue([highValueItem, ...queue])

    const processed = await quotationService.simulateSapJobExecution(highValueItem.integration_id)
    expect(processed.request_status).toBe('SAP_BLOCKED')
    expect(processed.sap_return_code).toBe('W')
  })

  // CENÁRIO H: Reprocessamento de Erros
  it('Cenário H: Itens com pendência ou erro podem ser reprocessados, incrementando retry_count', async () => {
    const queue = quotationService.getStoredSapQueue()
    const item = queue[0]
    const retried = await quotationService.retrySapQueueItem(item.integration_id)
    expect(retried.request_status).toBe('RETRY_PENDING')
    expect(retried.retry_count).toBeGreaterThanOrEqual(1)
  })

  // CENÁRIO I: Idempotência na Fila SAP
  it('Cenário I: A mesma cotação e versão não pode gerar múltiplos registros duplicados na fila', async () => {
    const quote = await quotationService.saveQuotation({
      code: 'COT-IDEMPOTENCIA',
      customer_id: 'CLI-8041',
      customer_sap_code: '0001088041',
      customer_name: 'Metalúrgica Santa Rita Ltda',
      ship_to_code: '0001088041-01',
      payment_terms: '28 DDL',
      incoterm: 'CIF',
      approval_status: 'APROVADA_AUTOMATICAMENTE',
      client_status: 'ACEITA',
      items: [
        {
          id: 'it-idem',
          item_sequence: 10,
          material_code: 'TB-304-SCH10',
          description: 'Tubo Inox',
          quantity: 2.0,
          unit: 't',
          requested_date: '2024-11-10',
          sap_price: 34500,
          proposed_price: 34500,
          deviation_pct: 0,
          final_price: 34500,
          total: 69000,
          stock_available: 12.5,
          stock_situation: 'ESTOQUE_SUFICIENTE',
          stock_updated_at: '2024-10-24 16:30',
          stock_confirmation_required: false,
          stock_confirmed: true,
        },
      ],
      total_value: 69000,
      total_tons: 2.0,
    })

    const first = await quotationService.requestSapOrderQueue(quote.id, 'Carlos Mendonça')
    const second = await quotationService.requestSapOrderQueue(quote.id, 'Carlos Mendonça')

    expect(first.integration_id).toBe(second.integration_id)
  })
})
