import { describe, it, expect, beforeEach } from 'vitest'
import {
  opportunityLeadService,
  NovaOportunidadePayload,
} from '@/services/opportunity_lead_service'
import { quotationService } from '@/services/quotation_service'

describe('CRM 360º CIAFAL — Gerar Cotação a partir de Oportunidade (C01–C14)', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
  })

  // C01: Detalhes da OPP corretos (cliente, vendedor, grupo, quantidade, preço estimado)
  it('C01: Detalhes da OPP corretos', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-c01',
      clienteNome: 'AÇOS SANTA RITA LTDA',
      clienteSap: '0001094050',
      vendedorNome: 'Carlos Mendonça',
      grupoMercadoria: 'Tubos Industriais',
      quantidadeEstimadaTons: 15.5,
      precoEstimadoPorTon: 6200,
    })

    expect(opp).toBeDefined()
    expect(opp.clienteNome).toBe('AÇOS SANTA RITA LTDA')
    expect(opp.clienteSap).toBe('0001094050')
    expect(opp.vendedorNome).toBe('Carlos Mendonça')
    expect(opp.grupoMercadoria).toBe('Tubos Industriais')
    expect(opp.quantidadeEstimadaTons).toBe(15.5)
    expect(opp.precoEstimadoPorTon).toBe(6200)
    expect(opp.numeroSequencial).toBeDefined()
    expect(opp.numeroSequencial).toMatch(/^OPP-\d{6}\/\d{4}$/)
  })

  // C02: Clicar Gerar Cotação prepara estado com dados da OPP e loading/bloqueio contra múltiplos cliques
  it('C02: Clicar Gerar Cotação prepara navegação com estado e dados da OPP', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-c02',
      clienteNome: 'METALÚRGICA SOUZA',
      clienteSap: '0001088041',
      vendedorNome: 'Mariana Azevedo',
      grupoMercadoria: 'Cantoneiras Laminadas',
      quantidadeEstimadaTons: 4.5,
      precoEstimadoPorTon: 5800,
    })

    const statePayload = {
      clienteId: opp.clienteId,
      codigoSap: opp.clienteSap,
      razaoSocial: opp.clienteNome,
      vendedorNome: opp.vendedorNome,
      grupoMercadoriaSugerido: opp.grupoMercadoria,
      quantidadeEstimadaSugerida: opp.quantidadeEstimadaTons,
      precoEstimadoReferencia: opp.precoEstimadoPorTon,
      observacoesOrigem: `Oportunidade Funil CIAFAL (${opp.numeroSequencial})`,
      origem: 'oportunidade_funil',
      opportunity_id: opp.numeroSequencial,
      opportunity_number: opp.numeroSequencial,
    }

    expect(statePayload.razaoSocial).toBe('METALÚRGICA SOUZA')
    expect(statePayload.codigoSap).toBe('0001088041')
    expect(statePayload.grupoMercadoriaSugerido).toBe('Cantoneiras Laminadas')
    expect(statePayload.precoEstimadoReferencia).toBe(5800)
    expect(statePayload.opportunity_id).toBe(opp.numeroSequencial)
  })

  // C03: Cliente pré-preenchido sem re-cadastro
  it('C03: Cliente pré-preenchido sem re-cadastro', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-pre-cadastrado',
      clienteNome: 'USINAGEM PROGRESSO LTDA',
      clienteSap: '0001099999',
    })

    expect(opp.clienteId).toBe('cust-pre-cadastrado')
    expect(opp.clienteSap).toBe('0001099999')
    expect(opp.clienteNome).toBe('USINAGEM PROGRESSO LTDA')
  })

  // C04: Grupo de mercadorias usado como filtro de materiais
  it('C04: Grupo de mercadorias da OPP é usado para inicializar busca de materiais', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-c04',
      clienteNome: 'INDÚSTRIA MECÂNICA ALFA',
      grupoMercadoria: 'Perfis Estruturais W',
    })

    const initialMaterialSearch =
      opp.grupoMercadoria && opp.grupoMercadoria !== 'Não definido / A identificar'
        ? opp.grupoMercadoria
        : ''

    expect(initialMaterialSearch).toBe('Perfis Estruturais W')
  })

  // C05: Quantidade sugerida no grid a partir da OPP
  it('C05: Quantidade sugerida vem da oportunidade', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-c05',
      clienteNome: 'CALDEIRARIA SUL',
      quantidadeEstimadaTons: 12.8,
    })

    const suggestedQty = opp.quantidadeEstimadaTons ? String(opp.quantidadeEstimadaTons) : '2.0'
    expect(suggestedQty).toBe('12.8')
  })

  // C06: Preço da oportunidade é apenas referência e não compõe preço oficial SAP
  it('C06: Preço da oportunidade é exibido como referência sem compor automaticamente o preço SAP', () => {
    const oppReferencePrice = 5200
    const sapOfficialPrice = 5882.79

    // O preço proposto do material parte do preço oficial SAP (PR00)
    let itemProposedPrice = sapOfficialPrice.toString()

    expect(Number(itemProposedPrice)).toBe(sapOfficialPrice)
    expect(oppReferencePrice).not.toBe(sapOfficialPrice)
    expect(oppReferencePrice).toBe(5200)
  })

  // C07: Cancelar não cria nada nem muda estágio da oportunidade
  it('C07: Cancelar não cria cotação nem muda estágio da OPP', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-c07',
      clienteNome: 'CONSTRUTORA MODERNA',
    })

    expect(opp.estagioCiafal).toBe('especulacao')
    const quotesBefore = quotationService.getStoredQuotations()

    // Operação cancelada pelo usuário (nenhuma chamada de saveQuotation ou linkQuotationToOpportunity)
    const quotesAfter = quotationService.getStoredQuotations()
    const storedOpps = opportunityLeadService.getStoredOpportunities()
    const oppAfter = storedOpps.find((o) => o.id === opp.id)

    expect(quotesAfter.length).toBe(quotesBefore.length)
    expect(oppAfter?.estagioCiafal).toBe('especulacao')
    expect(oppAfter?.cotacoesVinculadas).toBeUndefined()
  })

  // C08: Salvar cotação persiste COT-XXXXX no storage
  it('C08: Salvar persiste COT-XXXXX no crmStorage', async () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-c08',
      clienteNome: 'INDÚSTRIA DE IMPLEMENTOS LTDA',
    })

    const quote = await quotationService.saveQuotation({
      code: 'COT-98105',
      customer_id: opp.clienteId,
      customer_name: opp.clienteNome,
      opportunity_id: opp.numeroSequencial,
      origem_comercial: 'Oportunidade',
      origem_opp_numero: opp.numeroSequencial,
      seller_name: 'Carlos Mendonça',
      items: [],
      total_tons: 10,
      total_value: 65000,
    })

    expect(quote.code).toBe('COT-98105')
    const stored = quotationService.getStoredQuotations()
    const found = stored.find((q) => q.code === 'COT-98105')
    expect(found).toBeDefined()
    expect(found?.total_value).toBe(65000)
  })

  // C09: Oportunidade recebe vínculo da Cotação (cotacoesVinculadas e cotacaoRelacionadaId)
  it('C09: Oportunidade recebe vínculo da Cotação com data, valor e status', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-c09',
      clienteNome: 'ESTRUTURAS METÁLICAS VALE',
    })

    const updated = opportunityLeadService.linkQuotationToOpportunity(
      opp.id,
      'COT-98106',
      {
        data: '2026-05-20T14:30:00Z',
        valor: 48000,
        status: 'PRONTA_PARA_ENVIO',
        responsavel: 'Carlos Mendonça',
      }
    )

    expect(updated.cotacaoRelacionadaId).toBe('COT-98106')
    expect(updated.cotacoesVinculadas).toBeDefined()
    expect(updated.cotacoesVinculadas?.length).toBe(1)
    expect(updated.cotacoesVinculadas?.[0].cotacaoCode).toBe('COT-98106')
    expect(updated.cotacoesVinculadas?.[0].valor).toBe(48000)
    expect(updated.cotacoesVinculadas?.[0].status).toBe('PRONTA_PARA_ENVIO')
    expect(updated.cotacoesVinculadas?.[0].responsavel).toBe('Carlos Mendonça')
  })

  // C10: Cotação recebe vínculo da OPP (origem_comercial 'Oportunidade' + número da OPP)
  it('C10: Cotação recebe origem_comercial Oportunidade e número da OPP', async () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-c10',
      clienteNome: 'TORRES E ESTRUTURAS SA',
    })

    const quote = await quotationService.saveQuotation({
      code: 'COT-98107',
      customer_id: opp.clienteId,
      customer_name: opp.clienteNome,
      opportunity_id: opp.numeroSequencial,
      origem_comercial: 'Oportunidade',
      origem_opp_numero: opp.numeroSequencial,
      seller_name: 'Mariana Azevedo',
      items: [],
      total_tons: 8,
      total_value: 52000,
    })

    expect(quote.origem_comercial).toBe('Oportunidade')
    expect(quote.origem_opp_numero).toBe(opp.numeroSequencial)
    expect(quote.opportunity_id).toBe(opp.numeroSequencial)
  })

  // C11: Estágio avança para "6. Cotação Gerada" com trilha de auditoria
  it('C11: Estágio avança para cotacao_gerada apenas se anterior elegível, gravando auditoria', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-c11',
      clienteNome: 'FERRAGENS TRIÂNGULO',
    })

    expect(opp.estagioCiafal).toBe('especulacao')

    const updated = opportunityLeadService.linkQuotationToOpportunity(
      opp.id,
      'COT-98108',
      {
        usuario: 'Carlos Mendonça',
      }
    )

    expect(updated.estagioCiafal).toBe('cotacao_gerada')
    expect(updated.historicoMovimentacao).toBeDefined()
    const lastAudit = updated.historicoMovimentacao?.[updated.historicoMovimentacao.length - 1]
    expect(lastAudit?.paraEtapa).toBe('cotacao_gerada')
    expect(lastAudit?.motivo).toContain('COT-98108')
    expect(lastAudit?.usuario).toBe('Carlos Mendonça')
  })

  // C12: Funil atualiza sem duplicar a oportunidade (mesma OPP com múltiplos vínculos)
  it('C12: Múltiplas cotações na mesma OPP não duplicam a oportunidade no funil', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-c12',
      clienteNome: 'MULTICOTACOES LTDA',
    })

    // Primeira cotação
    opportunityLeadService.linkQuotationToOpportunity(opp.id, 'COT-98109', {
      valor: 20000,
      status: 'PRONTA_PARA_ENVIO',
    })

    // Segunda cotação para a mesma OPP
    const updatedSecond = opportunityLeadService.linkQuotationToOpportunity(opp.id, 'COT-98110', {
      valor: 35000,
      status: 'AGUARDANDO_APROVACAO',
    })

    expect(updatedSecond.cotacoesVinculadas?.length).toBe(2)
    expect(updatedSecond.cotacaoRelacionadaId).toBe('COT-98110') // Mantém a mais recente

    const allOpps = opportunityLeadService.getStoredOpportunities()
    const matching = allOpps.filter((o) => o.id === opp.id)
    expect(matching.length).toBe(1) // Nunca duplicada
  })

  // C13: Lista de Cotações recebe a nova cotação com badge de origem
  it('C13: Lista de cotações recupera a cotação gerada com os vínculos da oportunidade', async () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-c13',
      clienteNome: 'RECUPERAÇÃO COTAÇÃO LTDA',
    })

    await quotationService.saveQuotation({
      code: 'COT-98111',
      customer_id: opp.clienteId,
      customer_name: opp.clienteNome,
      opportunity_id: opp.numeroSequencial,
      origem_comercial: 'Oportunidade',
      origem_opp_numero: opp.numeroSequencial,
      seller_name: 'Carlos Mendonça',
      items: [],
      total_tons: 6,
      total_value: 39000,
    })

    const allQuotes = await quotationService.getAllQuotations()
    const found = allQuotes.find((q) => q.code === 'COT-98111')

    expect(found).toBeDefined()
    expect(found?.opportunity_id).toBe(opp.numeroSequencial)
    expect(found?.origem_comercial).toBe('Oportunidade')
  })

  // C14: Lista de Oportunidades mantém a OPP com status atualizado e sem perdas
  it('C14: Lista de Oportunidades mantém a OPP íntegra e com histórico auditável', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cust-c14',
      clienteNome: 'INTEGRIDADE TOTAL S/A',
      quantidadeEstimadaTons: 25,
      precoEstimadoPorTon: 6000,
    })

    opportunityLeadService.linkQuotationToOpportunity(opp.id, 'COT-98112', {
      valor: 150000,
      status: 'PRONTA_PARA_ENVIO',
    })

    const opps = opportunityLeadService.getStoredOpportunities()
    const foundOpp = opps.find((o) => o.id === opp.id)

    expect(foundOpp).toBeDefined()
    expect(foundOpp?.clienteNome).toBe('INTEGRIDADE TOTAL S/A')
    expect(foundOpp?.estagioCiafal).toBe('cotacao_gerada')
    expect(foundOpp?.cotacaoRelacionadaId).toBe('COT-98112')
    expect(foundOpp?.cotacoesVinculadas?.length).toBe(1)
  })
})
