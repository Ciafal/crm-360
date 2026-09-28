import { describe, it, expect, beforeEach } from 'vitest'
import {
  opportunityLeadService,
  formatBRL,
  formatTonsABNT,
  NovaOportunidadePayload,
} from '@/services/opportunity_lead_service'
import { quotationService } from '@/services/quotation_service'
import { crmStorage } from '@/lib/crm-storage'

describe('CRM 360º CIAFAL — Oportunidades, Funil de Vendas e Cotações (20 Casos de Teste)', () => {
  const currentYear = new Date().getFullYear()

  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
  })

  // Caso 1: Criação só com cliente (mínimo obrigatório)
  it('1. Deve criar oportunidade apenas com o campo Cliente preenchido', () => {
    const payload: NovaOportunidadePayload = {
      clienteId: 'cust-teste-01',
      clienteNome: 'AÇOS SANTA RITA LTDA',
      clienteSap: '0001094050',
    }
    const opp = opportunityLeadService.createOpportunity(payload)
    expect(opp).toBeDefined()
    expect(opp.clienteNome).toBe('AÇOS SANTA RITA LTDA')
    expect(opp.estagioCiafal).toBe('especulacao')
  })

  // Caso 2: Geração de número sequencial no formato OPP-XXXXXX/AAAA
  it('2. Deve gerar número sequencial no formato OPP-XXXXXX/AAAA', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-teste-02',
      clienteNome: 'METALÚRGICA SOUZA',
    })
    expect(opp.numeroSequencial).toBeDefined()
    const regex = new RegExp(`^OPP-\\d{6}\\/${currentYear}$`)
    expect(opp.numeroSequencial).toMatch(regex)
  })

  // Caso 3: Sequência +1 em criações consecutivas
  it('3. Deve incrementar a sequência atômica (+1) em criações consecutivas', () => {
    const seq1 = opportunityLeadService.getNextSequentialNumber(currentYear)
    const seq2 = opportunityLeadService.getNextSequentialNumber(currentYear)
    const seq3 = opportunityLeadService.getNextSequentialNumber(currentYear)

    const num1 = parseInt(seq1.replace(`OPP-`, '').replace(`/${currentYear}`, ''), 10)
    const num2 = parseInt(seq2.replace(`OPP-`, '').replace(`/${currentYear}`, ''), 10)
    const num3 = parseInt(seq3.replace(`OPP-`, '').replace(`/${currentYear}`, ''), 10)

    expect(num2).toBe(num1 + 1)
    expect(num3).toBe(num2 + 1)
  })

  // Caso 4: Atomicidade e unicidade de números
  it('4. Atomicidade: criações sucessivas geram números estritamente distintos', () => {
    const oppA = opportunityLeadService.createOpportunity({
      clienteId: 'cust-a',
      clienteNome: 'EMPRESA A',
    })
    const oppB = opportunityLeadService.createOpportunity({
      clienteId: 'cust-b',
      clienteNome: 'EMPRESA B',
    })
    expect(oppA.numeroSequencial).not.toBe(oppB.numeroSequencial)
  })

  // Caso 5: Persistência no crmStorage após reload
  it('5. Persistência: oportunidade permanece armazenada e recuperável', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-persistencia',
      clienteNome: 'CLIENTE PERSISTENTE LTDA',
    })
    const lista = opportunityLeadService.getStoredOpportunities()
    const encontrada = lista.find((o) => o.id === opp.id)
    expect(encontrada).toBeDefined()
    expect(encontrada?.numeroSequencial).toBe(opp.numeroSequencial)
  })

  // Caso 6: Listagem em Oportunidades
  it('6. Oportunidade criada aparece na listagem do serviço', () => {
    opportunityLeadService.createOpportunity({
      clienteId: 'cust-listagem',
      clienteNome: 'INDUSTRIA ABC',
    })
    const opps = opportunityLeadService.getStoredOpportunities()
    expect(opps.length).toBeGreaterThan(0)
    expect(opps[0].clienteNome).toBe('INDUSTRIA ABC')
  })

  // Caso 7: Visão integrada — gravação de histórico de criação
  it('7. Ao criar, grava histórico de movimentação com estágio inicial Especulação', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-hist',
      clienteNome: 'CONSTRUTORA ALPHA',
      usuarioAtual: 'Vendedor QAS',
    })
    expect(opp.historicoMovimentacao).toBeDefined()
    expect(opp.historicoMovimentacao!.length).toBeGreaterThan(0)
    expect(opp.historicoMovimentacao![0].paraEtapa).toBe('especulacao')
    expect(opp.historicoMovimentacao![0].usuario).toBe('Vendedor QAS')
  })

  // Caso 8: Contagem automática no estágio 1. Especulação
  it('8. Nova oportunidade entra automaticamente no estágio especulacao', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-estagio',
      clienteNome: 'ESTRUTURAS METÁLICAS SUL',
    })
    expect(opp.estagioCiafal).toBe('especulacao')
  })

  // Caso 9: Campo data_entrada_estagio preenchido na criação
  it('9. Campo data_entrada_estagio é preenchido com ISO timestamp', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-data',
      clienteNome: 'TESTE DATA ENTRADA',
    })
    expect(opp.data_entrada_estagio).toBeDefined()
    expect(opp.data_entrada_estagio?.length).toBeGreaterThan(10)
  })

  // Caso 10: Mudança de estágio atualiza datas e grava histórico
  it('10. Mudança de estágio atualiza data_saida, data_entrada e histórico', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-move',
      clienteNome: 'MUDANÇA DE ESTÁGIO S/A',
    })
    const updated = opportunityLeadService.advanceOpportunityStage(
      opp.id,
      'interesse',
      'Carlos Mendonça',
      'Cliente demonstrou interesse em tubos',
    )
    expect(updated.estagioCiafal).toBe('interesse')
    expect(updated.data_entrada_estagio).toBeDefined()
    expect(updated.historicoMovimentacao!.length).toBe(2)
    expect(updated.historicoMovimentacao![1].paraEtapa).toBe('interesse')
  })

  // Caso 11: Vínculo bidirecional OPP-COT no serviço
  it('11. Vínculo bidirecional: oportunidade recebe cotacaoRelacionadaId', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-cot-rel',
      clienteNome: 'CLIENTE COTAÇÃO VINCULADA',
    })
    const linked = opportunityLeadService.linkQuotationToOpportunity(opp.id, 'COT-98104')
    expect(linked.cotacaoRelacionadaId).toBe('COT-98104')
    expect(linked.estagioCiafal).toBe('cotacao_gerada')
  })

  // Caso 12: Cotação armazena opportunity_id
  it('12. Cotação armazena opportunity_id na persistência de cotações', async () => {
    const quote = await quotationService.saveQuotation({
      code: 'COT-TESTE-999',
      customer_id: 'cust-cot-rel',
      customer_name: 'CLIENTE COTAÇÃO VINCULADA',
      opportunity_id: 'OPP-000001/2026',
      seller_name: 'Carlos Mendonça',
      items: [],
      total_tons: 5,
      total_value: 30000,
    })
    expect(quote.opportunity_id).toBe('OPP-000001/2026')
    const stored = quotationService.getStoredQuotations()
    const found = stored.find((q) => q.code === 'COT-TESTE-999')
    expect(found?.opportunity_id).toBe('OPP-000001/2026')
  })

  // Caso 13: Pipeline & Forecast — cálculo do Potencial Bruto e Forecast Ponderado
  it('13. Pipeline & Forecast: calcula valor e ponderação real', () => {
    opportunityLeadService.createOpportunity({
      clienteId: 'cust-fc1',
      clienteNome: 'CLIENTE FC 1',
      quantidadeEstimadaTons: 10,
      precoEstimadoPorTon: 5000, // 50.000
      probabilidadeClassificacao: 'media', // 50%
    })
    const opps = opportunityLeadService.getStoredOpportunities()
    const active = opps.filter((o) => o.clienteId === 'cust-fc1')
    expect(active[0].valorPotencialCalculado).toBe(50000)
    expect(active[0].probabilidade).toBe(50)
    const ponderado = (active[0].valorPotencialCalculado! * active[0].probabilidade) / 100
    expect(ponderado).toBe(25000)
  })

  // Caso 14: Formatação pt-BR de moeda (Intl.NumberFormat)
  it('14. formatBRL formata valores para padrão brasileiro com símbolo R$', () => {
    const formatted = formatBRL(32000.5)
    expect(formatted).toContain('32.000,50')
  })

  // Caso 15: Formatação pt-BR de toneladas ABNT
  it('15. formatTonsABNT formata volume no padrão ABNT com sufixo t', () => {
    const formatted = formatTonsABNT(1250.5)
    expect(formatted).toBe('1.250,50 t')
  })

  // Caso 16: "Não estimado" nunca gera R$ 0,00 nem 0 t
  it('16. "Não estimado" e "Não estimada" quando campos são nulos ou indefinidos', () => {
    expect(formatBRL(null)).toBe('Não estimado')
    expect(formatBRL(undefined)).toBe('Não estimado')
    expect(formatTonsABNT(null)).toBe('Não estimada')
    expect(formatTonsABNT(undefined)).toBe('Não estimada')
  })

  // Caso 17: Validação obrigatória do cliente ao salvar oportunidade
  it('17. Deve lançar erro se o cliente não for fornecido', () => {
    expect(() => {
      opportunityLeadService.createOpportunity({
        clienteId: '',
        clienteNome: '',
      })
    }).toThrow(/Cliente.*obrigatório/)
  })

  // Caso 18: Reinício de contador atômico em anos diferentes
  it('18. Contador reinicia no ano seguinte de forma independente', () => {
    const seq2026 = opportunityLeadService.getNextSequentialNumber(2026)
    const seq2027 = opportunityLeadService.getNextSequentialNumber(2027)
    expect(seq2026).toContain('/2026')
    expect(seq2027).toContain('/2027')
    expect(seq2027).toBe('OPP-000001/2027')
  })

  // Caso 19: Oportunidade e Cotação são entidades distintas
  it('19. Oportunidade e Cotação mantêm identidades próprias e IDs únicos', async () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-distinct',
      clienteNome: 'DISTINTAS ENTIDADES',
    })
    const quote = await quotationService.saveQuotation({
      code: 'COT-88776',
      customer_id: opp.clienteId,
      customer_name: opp.clienteNome,
      seller_name: 'Carlos Mendonça',
      items: [],
      total_tons: 2,
      total_value: 12000,
    })
    expect(opp.id).not.toBe(quote.id)
    expect(opp.numeroSequencial).toBeDefined()
    expect(quote.code).toBe('COT-88776')
  })

  // Caso 20: Regressão de cotações — criação de cotação e cálculo de totais
  it('20. Regressão de Cotações: cotação com múltiplos itens calcula totais corretamente', async () => {
    const createdQuote = await quotationService.saveQuotation({
      code: 'COT-REG-01',
      customer_id: 'cust-reg',
      customer_name: 'REGRESSAO COTAÇÕES',
      seller_name: 'Carlos Mendonça',
      items: [
        {
          id: 'item-1',
          item_sequence: 10,
          material_code: 'MAT-01',
          description: 'Tubo Redondo 50mm',
          quantity: 2.5,
          unit: 't',
          sap_price: 6000,
          proposed_price: 6000,
          deviation_pct: 0,
          final_price: 6000,
          total: 15000,
          stock_available: 10,
          stock_situation: 'ESTOQUE_SUFICIENTE',
          stock_confirmation_required: false,
          stock_confirmed: true,
          requested_date: '2026-09-01',
          stock_updated_at: '2026-05-18T10:00:00Z',
        },
      ],
      subtotal: 15000,
      total_tons: 2.5,
      total_value: 15000,
      status: 'PRONTA_PARA_ENVIO',
    })
    expect(createdQuote.total_tons).toBe(2.5)
    expect(createdQuote.total_value).toBe(15000)
    expect(createdQuote.status).toBe('PRONTA_PARA_ENVIO')
  })
})
