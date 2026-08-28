// src/services/customer_management_service.ts
import type {
  CustomerManagementItem,
  CoverageSummaryKpi,
  SellerCoverageItem,
  CatalogProduct,
  EspeculacaoItem,
  MarketingCampaign,
  RegionalGeoMetric,
  AIClientDiagnostic,
  AIWhoToContactSuggestion,
  ClassificationType,
  SuggestedProduct,
} from '@/types/customer_management'
import {
  mockCustomerManagementList,
  mockEspeculacoes,
  mockMarketingCampaigns,
  mockRegionalGeoMetrics,
} from '@/data/mockCustomerManagementData'
import { mockCatalogProducts } from '@/data/mockCatalogData'

// Parâmetros de Frequência Padrão (Regra 13)
export const DEFAULT_COVERAGE_FREQUENCIES: Record<ClassificationType, number> = {
  ESTRATEGICO: 15,
  CLIENTE_A: 30,
  CLIENTE_B: 45,
  CLIENTE_C: 60,
  PROSPECT: 20,
  EM_RISCO: 15,
}

const STORAGE_KEY_CUSTOMERS = 'ciafal_crm_customer_management_v1'
const STORAGE_KEY_ESPECULACOES = 'ciafal_crm_especulacoes_v1'
const STORAGE_KEY_CAMPAIGNS = 'ciafal_crm_campaigns_v1'
const STORAGE_KEY_CATALOG = 'ciafal_crm_catalog_v1'

class CustomerManagementService {
  private getStored<T>(key: string, defaultData: T): T {
    try {
      const item = localStorage.getItem(key)
      if (item) return JSON.parse(item)
    } catch {
      // fallback
    }
    return defaultData
  }

  private setStored<T>(key: string, data: T) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch {
      // silent
    }
  }

  public getCustomers(): CustomerManagementItem[] {
    return this.getStored<CustomerManagementItem[]>(
      STORAGE_KEY_CUSTOMERS,
      mockCustomerManagementList,
    )
  }

  public saveCustomers(customers: CustomerManagementItem[]): void {
    this.setStored(STORAGE_KEY_CUSTOMERS, customers)
  }

  public getCatalog(): CatalogProduct[] {
    return this.getStored<CatalogProduct[]>(STORAGE_KEY_CATALOG, mockCatalogProducts)
  }

  public saveCatalog(catalog: CatalogProduct[]): void {
    this.setStored(STORAGE_KEY_CATALOG, catalog)
  }

  public getEspeculacoes(): EspeculacaoItem[] {
    return this.getStored<EspeculacaoItem[]>(STORAGE_KEY_ESPECULACOES, mockEspeculacoes)
  }

  public saveEspeculacoes(items: EspeculacaoItem[]): void {
    this.setStored(STORAGE_KEY_ESPECULACOES, items)
  }

  public getCampaigns(): MarketingCampaign[] {
    return this.getStored<MarketingCampaign[]>(STORAGE_KEY_CAMPAIGNS, mockMarketingCampaigns)
  }

  public saveCampaigns(campaigns: MarketingCampaign[]): void {
    this.setStored(STORAGE_KEY_CAMPAIGNS, campaigns)
  }

  public getRegionalMetrics(): RegionalGeoMetric[] {
    return mockRegionalGeoMetrics
  }

  // Cobertura da Carteira — Fórmulas e KPIs (Regras 11 a 22)
  public calculateCoverageKpis(
    customers: CustomerManagementItem[],
    targetPct = 95,
  ): CoverageSummaryKpi {
    const elegiveis = customers.length
    if (elegiveis === 0) {
      return {
        coberturaGeralPct: 0,
        coberturaEstrategicosPct: 0,
        coberturaClientesAPct: 0,
        coberturaClientesBPct: 0,
        coberturaClientesCPct: 0,
        coberturaEmRiscoPct: 0,
        coberturaProspectsPct: 0,
        totalElegiveis: 0,
        totalCobertos: 0,
        totalDescobertos: 0,
        totalVencidos: 0,
        totalProximoVencimento: 0,
        metaCoberturaPct: targetPct,
        coberturaMesAnteriorPct: 82,
        coberturaYtdPct: 84,
        tendencia: 'alta',
        gapParaMetaPct: targetPct,
      }
    }

    const cobertos = customers.filter((c) => c.coberto)
    const totalCobertos = cobertos.length
    const totalDescobertos = elegiveis - totalCobertos
    const totalVencidos = customers.filter((c) => c.coberturaVencidaDias > 0).length
    const totalProximoVencimento = customers.filter(
      (c) =>
        c.coberto &&
        c.frequenciaEsperadaDias - c.diasSemContato <= 3 &&
        c.frequenciaEsperadaDias - c.diasSemContato >= 0,
    ).length

    const byClass = (cls: ClassificationType) => {
      const subset = customers.filter((c) => c.classificacao === cls)
      if (subset.length === 0) return 100
      const cob = subset.filter((c) => c.coberto).length
      return Math.round((cob / subset.length) * 100)
    }

    const coberturaGeralPct = Math.round((totalCobertos / elegiveis) * 100)
    const gapParaMetaPct = Math.max(0, targetPct - coberturaGeralPct)

    return {
      coberturaGeralPct,
      coberturaEstrategicosPct: byClass('ESTRATEGICO'),
      coberturaClientesAPct: byClass('CLIENTE_A'),
      coberturaClientesBPct: byClass('CLIENTE_B'),
      coberturaClientesCPct: byClass('CLIENTE_C'),
      coberturaEmRiscoPct: byClass('EM_RISCO'),
      coberturaProspectsPct: byClass('PROSPECT'),
      totalElegiveis: elegiveis,
      totalCobertos,
      totalDescobertos,
      totalVencidos,
      totalProximoVencimento,
      metaCoberturaPct: targetPct,
      coberturaMesAnteriorPct: 82.4,
      coberturaYtdPct: 85.1,
      tendencia: coberturaGeralPct >= 82 ? 'alta' : 'baixa',
      gapParaMetaPct,
    }
  }

  // Cobertura por Vendedor (Regra 20)
  public calculateSellerCoverage(customers: CustomerManagementItem[]): SellerCoverageItem[] {
    const sellersMap = new Map<string, CustomerManagementItem[]>()
    for (const c of customers) {
      const key = c.vendedorId || 'qas-vendedor_teste'
      if (!sellersMap.has(key)) {
        sellersMap.set(key, [])
      }
      sellersMap.get(key)!.push(c)
    }

    const result: SellerCoverageItem[] = []
    sellersMap.forEach((list, vendedorId) => {
      const first = list[0]
      const total = list.length
      const cobertos = list.filter((c) => c.coberto).length
      const descobertos = total - cobertos
      const pct = total > 0 ? Math.round((cobertos / total) * 100) : 0

      const estTotal = list.filter((c) => c.classificacao === 'ESTRATEGICO').length
      const estCob = list.filter((c) => c.classificacao === 'ESTRATEGICO' && c.coberto).length

      const riscoTotal = list.filter((c) => c.classificacao === 'EM_RISCO').length
      const riscoCob = list.filter((c) => c.classificacao === 'EM_RISCO' && c.coberto).length

      const sumDias = list.reduce((acc, c) => acc + c.diasSemContato, 0)
      const sumIsc = list.reduce((acc, c) => acc + c.isc, 0)
      const sumOtif = list.reduce((acc, c) => acc + c.otif, 0)

      result.push({
        vendedorId,
        vendedorNome: first.vendedorNome || 'Vendedor Comercial',
        equipe: first.regional || 'Equipe Sudeste',
        regional: first.regional || 'Minas Gerais',
        clientesElegiveis: total,
        cobertos,
        descobertos,
        coberturaPct: pct,
        metaPct: 95,
        estrategicosTotal: estTotal,
        estrategicosCobertos: estCob,
        emRiscoTotal: riscoTotal,
        emRiscoCobertos: riscoCob,
        diasSemContatoMedio: total > 0 ? Math.round(sumDias / total) : 0,
        iscMedio: total > 0 ? Math.round(sumIsc / total) : 0,
        otifMedio: total > 0 ? Math.round(sumOtif / total) : 0,
      })
    })

    return result.sort((a, b) => b.coberturaPct - a.coberturaPct)
  }

  // IA: "QUEM DEVO CONTATAR HOJE?" (Regras 64 e 65)
  public getWhoToContactToday(customers: CustomerManagementItem[]): AIWhoToContactSuggestion[] {
    const scoredList = customers.map((c) => {
      let score = 0
      const reasons: string[] = []

      // 1) Cobertura vencida (+40 pontos)
      if (c.coberturaVencidaDias > 0) {
        score += 40 + Math.min(c.coberturaVencidaDias, 30)
        reasons.push(`Cobertura vencida há ${c.coberturaVencidaDias} dias`)
      }

      // 2) Cliente Estratégico (+30 pontos)
      if (c.classificacao === 'ESTRATEGICO') {
        score += 30
        reasons.push('Cliente Estratégico (Alto Impacto)')
      } else if (c.classificacao === 'EM_RISCO') {
        score += 35
        reasons.push('Cliente em Risco de Evasão')
      }

      // 3) ISC Baixo (+25 pontos)
      if (c.isc < 70) {
        score += 25
        reasons.push(`ISC crítico (${c.isc}/100)`)
      }

      // 4) Queda de Volume / Sem Compra (+20 pontos)
      if (c.diasSemCompra > 60) {
        score += 20
        reasons.push(`Sem compra há ${c.diasSemCompra} dias`)
      }

      // 5) Oportunidade ou Cotação Parada (+15 pontos)
      if (c.cotacoesAbertasCount > 0) {
        score += 15
        reasons.push('Cotação aberta aguardando fechamento')
      } else if (c.oportunidadeAberta) {
        score += 10
        reasons.push('Oportunidade aberta em negociação')
      }

      // 6) Produto sugerido com estoque disponível (+10 pontos)
      const prodSugerido = c.produtosSugeridos[0] || {
        id: 'sug-padrao',
        codigo: 'BC-200-14',
        descricao: 'Barra Chata 2" x 1/4" SAE 1020',
        familia: 'Barras Chatas',
        tipo: 'compra_recorrente' as const,
        motivo: 'Produto de alta saída com disponibilidade imediata no pátio',
        potencialTons: 10.0,
      }

      if ((prodSugerido.saldoEstoqueTons || 0) > 5) {
        score += 10
        reasons.push(`Estoque imediato de ${prodSugerido.descricao}`)
      }

      let prioridade: AIWhoToContactSuggestion['prioridade'] = 'Acompanhamento'
      if (score >= 70) prioridade = 'Prioridade 1'
      else if (score >= 45) prioridade = 'Prioridade 2'
      else if (score >= 25) prioridade = 'Prioridade 3'

      let acaoRecomendada: AIWhoToContactSuggestion['acaoRecomendada'] = 'WhatsApp'
      if (c.classificacao === 'ESTRATEGICO' || c.classificacao === 'EM_RISCO') {
        acaoRecomendada = c.diasSemContato > 30 ? 'Ligar' : 'WhatsApp'
      } else if (c.cotacoesAbertasCount > 0) {
        acaoRecomendada = 'Ligar'
      } else if (c.classificacao === 'PROSPECT') {
        acaoRecomendada = 'Enviar Catálogo'
      }

      return {
        id: `wtc-${c.id}`,
        cliente: c,
        prioridade,
        score,
        motivoOrdem: reasons.join(' • '),
        motivo: reasons.join(' • '),
        produtoSugerido: prodSugerido,
        ultimoContatoStr: `${c.ultimoContatoData || 'Sem registro'} (${c.ultimoContatoCanal || 'Nenhum'})`,
        diasSemContato: c.diasSemContato,
        ultimaCompraStr: c.ultimaCompraData
          ? `${c.ultimaCompraData} (há ${c.diasSemCompra} dias)`
          : 'Nunca comprou',
        diasSemCompra: c.diasSemCompra,
        oportunidadeTitulo: c.proximaAcao,
        acaoRecomendada,
      }
    })

    return scoredList.sort((a, b) => b.score - a.score).map(({ score, ...rest }) => rest)
  }

  // IA: Diagnóstico 360 do Cliente (Regra 25)
  public analyzeClientWithAI(cliente: CustomerManagementItem): AIClientDiagnostic {
    const riscos: string[] = []
    const oportunidades: string[] = []

    if (cliente.coberturaVencidaDias > 0) {
      riscos.push(`Cobertura comercial atrasada em ${cliente.coberturaVencidaDias} dias.`)
    }
    if (cliente.isc < 75) {
      riscos.push(`ISC de ${cliente.isc}/100 indica vulnerabilidade a ofertas da concorrência.`)
    }
    if (cliente.otif < 90) {
      riscos.push(`OTIF recente de ${cliente.otif}% (com gap em relação à data desejada).`)
    }
    if (cliente.diasSemCompra > 60) {
      riscos.push(`Queda de compras nos últimos 60 dias vs média dos últimos 12 meses.`)
    }

    if (cliente.oportunidadesCount > 0) {
      oportunidades.push(
        `${cliente.oportunidadesCount} oportunidade(s) ativa(s) totalizando R$ ${cliente.oportunidadesValor.toLocaleString('pt-BR')}.`,
      )
    }
    if (cliente.especulacoesCount > 0) {
      oportunidades.push(
        `${cliente.especulacoesCount} especulação(ões) em qualificação para o próximo ciclo de demanda.`,
      )
    }

    const prodRecomendado = cliente.produtosSugeridos[0] || {
      id: 'sug-def',
      codigo: 'PER-W-200-22',
      descricao: 'Perfil W 200 x 22.5 kg/m ASTM A572',
      familia: 'Perfis W',
      tipo: 'compra_recorrente' as const,
      motivo: 'Demanda recorrente histórica confirmada nos registros de faturamento',
      potencialTons: 15.0,
      precoReferenciaKg: 8.4,
    }

    oportunidades.push(
      `Cross-sell identificado para o segmento "${cliente.segmento}": ofertar ${prodRecomendado.descricao}.`,
    )

    let situacao = `Cliente ${cliente.nomeFantasia} (${cliente.classificacao}) classificado como ${cliente.prioridadeCarteira}. `
    if (cliente.coberto) {
      situacao += `Relacionamento ativo com último contato via ${cliente.ultimoContatoCanal} há ${cliente.diasSemContato} dias.`
    } else {
      situacao += `ATENÇÃO: Carteira descoberta há ${cliente.coberturaVencidaDias} dias além da janela recomendada de ${cliente.frequenciaEsperadaDias} dias.`
    }

    return {
      situacao,
      riscos:
        riscos.length > 0 ? riscos : ['Sem riscos operacionais críticos identificados no momento.'],
      oportunidades,
      produtoRecomendado: prodRecomendado,
      motivoRecomendacao: prodRecomendado.motivo,
      proximaAcao: cliente.proximaAcao,
      scoreUrgencia: cliente.coberturaVencidaDias > 0 ? 85 : 45,
    }
  }

  // Motor de Cross-Sell Inteligente (Regras 26, 27, 28)
  public getCrossSellSuggestions(
    cliente: CustomerManagementItem,
    currentCatalog: CatalogProduct[],
  ): SuggestedProduct[] {
    const suggestions: SuggestedProduct[] = []

    // 1. Recorrentes do cliente
    if (cliente.produtosSugeridos && cliente.produtosSugeridos.length > 0) {
      suggestions.push(...cliente.produtosSugeridos)
    }

    // 2. Baseado no segmento (Regra 27)
    if (cliente.segmento.includes('Construção')) {
      const vergalhao = currentCatalog.find((c) => c.codigo.includes('VER-CA50'))
      if (vergalhao && !suggestions.some((s) => s.codigo === vergalhao.codigo)) {
        suggestions.push({
          id: `cs-${vergalhao.id}`,
          codigo: vergalhao.codigo,
          descricao: vergalhao.descricaoComercial,
          familia: vergalhao.familia,
          bitola: vergalhao.bitola,
          tipo: 'cross_sell',
          motivo: 'Construção Civil: 84% dos clientes de Perfis compram também Vergalhão CA-50',
          potencialTons: 20.0,
          precoReferenciaKg: vergalhao.precoTabelaKg,
          saldoEstoqueTons: vergalhao.estoqueDisponivelTons,
        })
      }
    }

    // 3. Estoque Estratégico com disponibilidade imediata
    const estoquePronto = currentCatalog.filter(
      (c) => c.estoqueDisponivelTons > 15 && !suggestions.some((s) => s.codigo === c.codigo),
    )
    if (estoquePronto.length > 0) {
      const item = estoquePronto[0]
      suggestions.push({
        id: `cs-est-${item.id}`,
        codigo: item.codigo,
        descricao: item.descricaoComercial,
        familia: item.familia,
        bitola: item.bitola,
        tipo: 'estoque_estrategico',
        motivo: `Pronta entrega: ${item.estoqueDisponivelTons} t disponíveis em pátio com saída imediata`,
        potencialTons: 12.0,
        precoReferenciaKg: item.precoTabelaKg,
        saldoEstoqueTons: item.estoqueDisponivelTons,
      })
    }

    return suggestions
  }

  // Regra de Cotação — Validação de Estoque & PCP (Regras 29, 30, 31, 32, 33)
  public validateQuotationAvailability(
    productCode: string,
    requestedTons: number,
    desiredDateStr: string, // DD/MM/AAAA
  ): {
    canImmediate: boolean
    availableStockTons: number
    committedStockTons: number
    physicalStockTons: number
    pcpProgrammedDate: string
    minimumPossibleDate: string // Data Mínima = PCP + 1 dia
    gapDays: number
    requiresStockCheck: boolean
    validationMessage: string
  } {
    const catalog = this.getCatalog()
    const product = catalog.find((p) => p.codigo === productCode) || catalog[0]

    const available = product.estoqueDisponivelTons
    const physical = product.estoqueFisicoTons
    const committed = product.estoqueComprometidoTons
    const canImmediate = available >= requestedTons
    const requiresStockCheck = available < 5.0 && available > 0

    // Cálculo da data mínima caso sem estoque: PCP + 1 dia
    const pcpDateParts = product.pcpProximaData.split('/')
    let minDateFormatted = product.pcpProximaData
    if (pcpDateParts.length === 3) {
      const day = parseInt(pcpDateParts[0], 10)
      const month = parseInt(pcpDateParts[1], 10)
      const year = parseInt(pcpDateParts[2], 10)
      const d = new Date(year, month - 1, day + 1) // + 1 dia
      minDateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    }

    let gapDays = 0
    if (!canImmediate) {
      gapDays = 4 // Simulação de 4 dias de gap entre desejada e PCP+1
    }

    let validationMessage = ''
    if (canImmediate) {
      validationMessage = `Estoque disponível (${available} t) atende o pedido de ${requestedTons} t. Data imediata liberada.`
    } else {
      validationMessage = `Estoque insuficiente (${available} t). Programação PCP robotizado para ${product.pcpProximaData}. DATA MÍNIMA DE FATURAMENTO: ${minDateFormatted} (PCP + 1 dia). Promessa anterior bloqueada por governança.`
    }

    return {
      canImmediate,
      availableStockTons: available,
      committedStockTons: committed,
      physicalStockTons: physical,
      pcpProgrammedDate: product.pcpProximaData,
      minimumPossibleDate: minDateFormatted,
      gapDays,
      requiresStockCheck,
      validationMessage,
    }
  }

  // Registrar Interação Comercial Válida (Regras 10, 12, 72)
  public registerCommercialContact(
    clienteId: string,
    canal: CustomerManagementItem['ultimoContatoCanal'],
    resumo: string,
    proximaAcao: string,
    authorName = 'Carlos Mendonça',
  ): CustomerManagementItem | null {
    const customers = this.getCustomers()
    const idx = customers.findIndex((c) => c.id === clienteId)
    if (idx === -1) return null

    const todayStr = new Date().toLocaleDateString('pt-BR')
    const updated = { ...customers[idx] }

    updated.ultimoContatoData = todayStr
    updated.ultimoContatoCanal = canal
    updated.diasSemContato = 0
    updated.coberto = true
    updated.coberturaVencidaDias = 0
    updated.alertaCobertura = 'ok'
    if (proximaAcao) updated.proximaAcao = proximaAcao

    updated.contatosHistorico = [
      {
        id: `cnt-${Date.now()}`,
        data: todayStr,
        canal,
        autor: authorName,
        resumo,
        proximaAcao,
        isValidCommercialContact: true,
      },
      ...updated.contatosHistorico,
    ]

    updated.timelineUnificada = [
      {
        id: `time-${Date.now()}`,
        data: todayStr,
        tipo: canal.toLowerCase() as any,
        titulo: `Contato via ${canal} registrado`,
        descricao: resumo,
        autor: authorName,
      },
      ...updated.timelineUnificada,
    ]

    customers[idx] = updated
    this.saveCustomers(customers)
    return updated
  }
}

export const customerManagementService = new CustomerManagementService()
