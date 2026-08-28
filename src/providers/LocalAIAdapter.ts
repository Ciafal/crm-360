import type {
  AIProvider,
  AIAnalysisRequest,
  AIAnalysisResult,
  AIRecommendation,
  DailyBriefing,
  ContactPlan,
  ReactivationAnalysis,
  ProductSuggestion,
  SellerCopilotAgent,
  ReactivationAgent,
  SalesSupervisorAgent,
  TeamDailySummary,
} from './AIProvider'
import type { ProviderHealth } from './types'
import type { BICustomerSummary } from './BIProvider'
import type { DailyCommercialAction } from '@/types/models'

export class LocalSellerCopilotAgent implements SellerCopilotAgent {
  async generateDailyBriefing(sellerId: string): Promise<DailyBriefing> {
    const today = new Date().toLocaleDateString('pt-BR')
    return {
      sellerId,
      date: today,
      summaryText:
        'Hoje há 8 ações comerciais prioritárias, com foco em 3 grandes contas de Inox 304/316 com quebra de recorrência e alta probabilidade de fechamento imediato.',
      priorityCount: 8,
      totalRevenuePotential: 485000,
      recommendedFocus: 'Atacar contas com pronta-entrega e frete CIF regionalizado.',
      highlights: [
        'Metalúrgica Santa Rita: 74 dias sem compras, estoque de tubos 304 disponível.',
        'Caldeiraria Paulista: Safra requer chapas 316L, potencial de R$ 98.000.',
        'Protemax: Necessita alinhamento de limite de crédito antes da cotação.',
      ],
    }
  }

  async prioritizeActions(actions: DailyCommercialAction[]): Promise<DailyCommercialAction[]> {
    return [...actions].sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }

  async explainPrioritization(actionId: string): Promise<string> {
    return `Ação priorizada com base no modelo preditivo BG/NBD + Gamma-Gamma. Considera dias de inatividade vs. ciclo histórico, cobertura imediata de estoque CIAFAL e margem da família de produtos.`
  }

  async analyzeQuoteOpportunity(context: {
    customerId: string
    customerName: string
    customerSapCode?: string
    archetype?: string
    abcCategory?: 'A' | 'B' | 'C'
    materialCodes: string[]
    totalTons: number
    authorizedPriceTons: number
    creditAvailable: number
    creditStatus: 'REGULAR' | 'RESTRITO' | 'BLOQUEADO'
    stockAvailableTons: number
    hasPlannedProduction: boolean
    competitionNotes?: string
  }): Promise<import('./AIProvider').QuoteCopilotInsight> {
    const isABC_A = context.abcCategory === 'A'
    const isCreditOk =
      context.creditStatus === 'REGULAR' &&
      context.creditAvailable >= context.totalTons * context.authorizedPriceTons
    const isStockSufficient = context.stockAvailableTons >= context.totalTons

    // NUNCA inventar preço: preserva o preço autorizado informado
    const authPrice = context.authorizedPriceTons

    let priority: 'ALTA' | 'MEDIA' | 'BAIXA' = 'MEDIA'
    if (isABC_A && isStockSufficient && isCreditOk) {
      priority = 'ALTA'
    } else if (
      context.creditStatus === 'BLOQUEADO' ||
      (!isStockSufficient && !context.hasPlannedProduction)
    ) {
      priority = 'BAIXA'
    } else if (isABC_A || context.totalTons >= 10) {
      priority = 'ALTA'
    }

    const riskFactors: string[] = []
    if (context.creditStatus === 'BLOQUEADO') {
      riskFactors.push('Crédito Bloqueado no SAP ECC F.35 — Trava automática de faturamento')
    } else if (context.creditStatus === 'RESTRITO') {
      riskFactors.push('Exposição de crédito elevada (> 85% do limite F.35)')
    }

    if (!isStockSufficient) {
      if (context.hasPlannedProduction) {
        riskFactors.push('Saldo imediato < volume cotado, porém há lote programado no SAP PP')
      } else {
        riskFactors.push('Risco de ruptura de estoque imediato sem programação ativa')
      }
    }

    if (context.competitionNotes) {
      riskFactors.push(`Pressão de concorrência reportada: ${context.competitionNotes}`)
    }

    const riskLevel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' =
      context.creditStatus === 'BLOQUEADO'
        ? 'CRITICO'
        : riskFactors.length >= 2
          ? 'ALTO'
          : riskFactors.length === 1
            ? 'MEDIO'
            : 'BAIXO'

    let argument = `Cliente perfil ${context.archetype || 'INDÚSTRIA'} (Curva ${context.abcCategory || 'A'}). `
    if (isStockSufficient) {
      argument += `Disponibilidade física confirmada em pátio com carregamento imediato em até 48h. `
    } else if (context.hasPlannedProduction) {
      argument += `Lote com corrida já programada no SAP PP, garantindo entrega no prazo acordado. `
    }
    argument += `Preço de tabela oficial SAP mantido em R$ ${authPrice.toLocaleString('pt-BR')}/t com frete CIF regionalizado.`

    const nextAction =
      context.creditStatus === 'BLOQUEADO'
        ? 'Encaminhar ao setor de Crédito para reavaliação de títulos antes do fechamento'
        : !isStockSufficient && !context.hasPlannedProduction
          ? 'Solicitar confirmação física ao pátio/WMS ou encaixe no PCP'
          : 'Enviar proposta formal em PDF via WhatsApp e agendar follow-up'

    const suggestedFollowUpHours: 24 | 48 | 72 = isABC_A ? 24 : context.totalTons > 8 ? 48 : 72

    return {
      priority,
      priorityReason: `Classificação ${priority} definida por: Cliente ABC ${context.abcCategory || 'A'}, Volume de ${context.totalTons} t e Posição Financeira SAP (${context.creditStatus}).`,
      commercialArgument: argument,
      riskAssessment: {
        level: riskLevel,
        factors:
          riskFactors.length > 0
            ? riskFactors
            : ['Operação regular dentro dos parâmetros de alçada e estoque'],
      },
      nextRecommendedAction: nextAction,
      suggestedFollowUpHours,
      contextSummary: {
        archetype: context.archetype || 'INDÚSTRIA',
        abcCategory: context.abcCategory || 'A',
        creditAvailableBRL: context.creditAvailable,
        creditStatus: context.creditStatus,
        stockCoverageStatus: isStockSufficient
          ? 'Cobertura Total'
          : context.hasPlannedProduction
            ? 'Produção Programada'
            : 'Abaixo do Volume',
        competitionNoted: context.competitionNotes || 'Sem concorrência agressiva registrada',
        authorizedPriceTons: authPrice,
        priceSource: 'Tabela Oficial SAP ECC / PR00 Autorizada',
      },
    }
  }
}

export class LocalReactivationAgent implements ReactivationAgent {
  async analyzeInactiveCustomers(customers: BICustomerSummary[]): Promise<ReactivationAnalysis[]> {
    return customers.map((c) => ({
      customerId: c.customerId,
      reactivationScore: c.reactivationScore,
      urgency:
        c.reactivationScore >= 85
          ? 'critica'
          : c.reactivationScore >= 75
            ? 'alta'
            : c.reactivationScore >= 60
              ? 'media'
              : 'baixa',
      recommendedAction:
        c.recommendedAction || 'Retomar contato com tabela promocional de pronta-entrega',
      probabilityRehire: c.pAlive,
      keyInsight: `Cliente com ciclo histórico de ${c.frequency} dias; inativo há ${c.daysSinceLastPurchase} dias.`,
    }))
  }

  async generateContactPlan(customerId: string): Promise<ContactPlan> {
    const today = new Date()
    const idealDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    return {
      customerId,
      idealDate,
      urgency: 'alta',
      recommendedChannel: 'whatsapp',
      argument:
        'Notamos um intervalo superior ao habitual desde o último fornecimento. Temos lote exclusivo de Inox 304 com frete promocional para pronta-entrega.',
      suggestedProducts: ['Tubo Inox 304 SCH 10', 'Chapa Inox 304 3.0mm Escovada'],
      abandonedItems: ['TB-304-SCH10', 'CH-304-3MM'],
      stockAvailable: true,
      valueAtStake: 54000,
    }
  }

  async recommendChannel(customerId: string): Promise<'whatsapp' | 'ligacao' | 'visita' | 'email'> {
    return 'whatsapp'
  }

  async suggestProducts(customerId: string): Promise<ProductSuggestion[]> {
    return [
      {
        code: 'TB-304-SCH10',
        name: 'Tubo Inox AISI 304 Redondo SCH 10 2"',
        family: 'Tubos Inox',
        reason: 'Produto com maior faturamento histórico do cliente e alta disponibilidade.',
        stockAvailable: true,
        expectedMarginPercent: 28.5,
      },
      {
        code: 'CH-304-3MM',
        name: 'Chapa Inox AISI 304 3.00mm Escovada',
        family: 'Chapas Inox',
        reason: 'Recorrência confirmada a cada 45 dias no histórico CIAFAL.',
        stockAvailable: true,
        expectedMarginPercent: 24.0,
      },
    ]
  }
}

import type { SellerIndividualAnalysis, SellerPerformanceAnalysisAgent } from './AIProvider'
import {
  mockEquipe,
  mockClientes,
  mockFunilOportunidades,
  mockAcoesDoDia,
} from '@/data/mockCommercialData'

export class LocalSellerPerformanceAnalysisAgent implements SellerPerformanceAnalysisAgent {
  async analyzeSellerPerformance(
    sellerId: string,
    filtersContext?: {
      periodo?: string
      produto?: string
      familia?: string
      segmento?: string
    },
  ): Promise<SellerIndividualAnalysis> {
    const member =
      mockEquipe.find(
        (m) => m.id === sellerId || m.userId === sellerId || m.name.includes(sellerId),
      ) || mockEquipe[2] // Fallback Carlos Mendonça

    const sellerClientes = mockClientes.filter(
      (c) => c.vendedorId === member.userId || c.vendedor === member.name,
    )
    const clientesA = sellerClientes.filter((c) => c.abcHistorico === 'A').length
    const clientesB = sellerClientes.filter((c) => c.abcHistorico === 'B').length
    const clientesC = sellerClientes.filter((c) => c.abcHistorico === 'C').length
    const inativos = sellerClientes.filter(
      (c) => c.statusComercial === 'Inativo' || c.diasSemContato > 45,
    ).length

    const atingimento = member.atingimentoPercent
    const gapTons = member.toneladasGap || member.toneladasMeta - member.toneladasRealizado
    const taxaAtiva = member.taxaCarteiraAtivaPercent

    // Resumo Executivo Contextual
    const filterNote = filtersContext?.familia
      ? ` (Filtro aplicado: Família ${filtersContext.familia})`
      : filtersContext?.produto
        ? ` (Filtro aplicado: ${filtersContext.produto})`
        : ''

    const resumoExecutivo = `${member.name} está em ${atingimento.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% da meta com projeção de fechamento em ${Math.min(100, Math.round(atingimento * 1.22))}%${filterNote}. Ponto positivo: ritmo atual de ${member.ritmoAtualTons ? member.ritmoAtualTons.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) : '5,3'} t/dia está superando a média histórica (${member.ritmoMediaHistoricaTons ? member.ritmoMediaHistoricaTons.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) : '4,5'} t/dia). Ponto de atenção: ${taxaAtiva.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}% da carteira realizou compra no mês (${member.clientesAtivosMes} de ${member.carteiraQtd} clientes). Causa provável: ${Math.max(2, clientesA - 1)} clientes A estão fora da frequência normal de recompra. Ação recomendada: priorizar clientes A com estoque disponível e compra esperada nos próximos 10 dias.`

    return {
      sellerId: member.id,
      sellerName: member.name,
      cargo: member.cargo,
      resumoExecutivo,
      pontosPositivos: [
        {
          titulo: 'Ritmo Diário Acima da Média Histórica',
          evidenciaNumerica: `${member.ritmoAtualTons ? member.ritmoAtualTons.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) : '5,3'} t/dia atuais vs ${member.ritmoMediaHistoricaTons ? member.ritmoMediaHistoricaTons.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) : '4,5'} t/dia de média histórica (+17,7% de aceleração).`,
          impacto: 'Garante tração para superar a barreira dos 90% da meta mensal.',
        },
        {
          titulo: 'Conversão Comercial e Cadência Alta',
          evidenciaNumerica: `Taxa de conversão de ${member.conversaoPercent}% com índice de cadência ${member.cadenciaScore || 'Alta (86/100)'}.`,
          impacto: 'Eficiência acima da média da equipe em negociações técnicas e fechamentos.',
        },
      ],
      pontosAtencao: [
        {
          titulo: 'Taxa de Ativação de Carteira Abaixo do Potencial',
          evidenciaNumerica: `Apenas ${member.clientesAtivosMes} dos ${member.carteiraQtd} clientes (${taxaAtiva.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%) compraram no período vigente.`,
          causaProvavel: `${Math.max(2, clientesA - 1)} contas A com mais de 30 dias sem emissão de pedido de recompra.`,
          riscoMeta: member.role === 'REPRESENTANTE_EXTERNO' ? 'ALTO' : 'MEDIO',
        },
        {
          titulo: 'Latência em Cotações SAP ECC',
          evidenciaNumerica: `Tempo médio de resposta de ${member.latenciaMediaHoras ? member.latenciaMediaHoras.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) : '16,0'}h (SLA recomendado: ≤ 8,0h).`,
          causaProvavel: 'Demora no cálculo manual de frete CIF com a transportadora regional.',
          riscoMeta: 'MEDIO',
        },
      ],
      evidenciasContextuais: {
        metaVolume: `${member.toneladasMeta.toLocaleString('pt-BR')} t`,
        realizadoVolume: `${member.toneladasRealizado.toLocaleString('pt-BR')} t`,
        atingimentoPercent: member.atingimentoPercent,
        forecastVolume: `${(member.toneladasForecast || Math.round(member.toneladasRealizado * 1.25)).toLocaleString('pt-BR')} t`,
        ritmoAtual: `${member.ritmoAtualTons ? member.ritmoAtualTons.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) : '5,3'} t/dia`,
        mediaHistorica: `${member.ritmoMediaHistoricaTons ? member.ritmoMediaHistoricaTons.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) : '4,5'} t/dia`,
        carteiraTotal: member.carteiraQtd,
        clientesAtivosMes: member.clientesAtivosMes,
        taxaCarteiraAtivaPercent: member.taxaCarteiraAtivaPercent,
        clientesA: clientesA || 12,
        clientesB: clientesB || 16,
        clientesC: clientesC || 10,
        inativosCarteira: inativos || 6,
        leadsAtivos: 8,
        visitasMes: member.visitasMes,
        contatosTotal: 48,
        cotacoesEmitidas: 14,
        followupsPendentes: member.acoesPendentes,
        estoqueDisponivel: '100% dos principais itens A36 e Tubos em Contagem',
        limiteCreditoDisponivel: 'R$ 680.000 liberados no SAP ECC',
        tmsEntregasNoPrazo: '94,2% de pontualidade no mês',
      },
      oportunidades: [
        {
          cliente: 'Metalúrgica Santa Rita Ltda',
          potencial: '12,0 t (R$ 95.000)',
          produto: 'Perfis Laminados W & Cantoneiras',
          motivo: 'Janela de recompra calculada para os próximos 4 dias.',
        },
        {
          cliente: 'Aços & Caldeiraria Betim S.A.',
          potencial: '18,5 t (R$ 120.000)',
          produto: 'Chapas Grossas A36',
          motivo: 'Estoque disponível em lote imediato na filial Contagem.',
        },
      ],
      acoesRecomendadas: [
        {
          id: `act-ai-${Date.now()}-1`,
          titulo: 'Priorizar contato com Clientes A na janela de recompra',
          descricao:
            'Acionar Metalúrgica Santa Rita e Caldeiraria Betim com proposta pronta de Perfis W e Chapas A36 com entrega em 48h.',
          prioridade: 'ALTA',
          prazoSugerido: 'Hoje até 17:00',
          tipo: 'CLIENTES_A',
          clienteAlvo: 'Metalúrgica Santa Rita Ltda',
        },
        {
          id: `act-ai-${Date.now()}-2`,
          titulo: 'Agilizar Follow-up de Cotações Estagnadas no SAP ECC',
          descricao:
            'Disparar mensagens de follow-up via WhatsApp com tabela de condições CIF garantida para diminuir a latência média.',
          prioridade: 'ALTA',
          prazoSugerido: 'Amanhã 09:30',
          tipo: 'FOLLOWUP',
        },
        {
          id: `act-ai-${Date.now()}-3`,
          titulo: 'Reativar 3 Clientes B com saldo de crédito aprovado',
          descricao:
            'Ofertar lotes de Barras Chatas e Cantoneiras com frete compartilhado e prazo de 28 DDL.',
          prioridade: 'MEDIA',
          prazoSugerido: 'Em até 3 dias',
          tipo: 'CREDITO',
        },
      ],
    }
  }
}

export class LocalSalesSupervisorAgent implements SalesSupervisorAgent {
  private sellerAnalysisAgent = new LocalSellerPerformanceAnalysisAgent()

  async analyzeSellerPerformance(
    sellerId: string,
    filtersContext?: {
      periodo?: string
      produto?: string
      familia?: string
      segmento?: string
    },
  ): Promise<SellerIndividualAnalysis> {
    return this.sellerAnalysisAgent.analyzeSellerPerformance(sellerId, filtersContext)
  }

  async summarizeTeamDaily(teamId?: string): Promise<TeamDailySummary> {
    return {
      date: new Date().toISOString().split('T')[0],
      activeSellers: 5,
      totalPlannedActions: 34,
      totalCompletedActions: 26,
      totalPendingActions: 5,
      totalOverdueActions: 3,
      totalOpportunities: 4,
      totalPotentialRevenue: 1850000,
      totalPotentialTons: 127.0,
      highlights: [
        '5 vendedores, 34 ações planejadas, 26 concluídas, 5 pendentes, 3 reagendadas.',
        'R$ 1,8 mi trabalhados, 127 t de potencial, 4 oportunidades, 2 cotações, 1 pedido.',
      ],
      bottlenecks: [
        '3 das 4 ações de alta prioridade de Carlos Mendonça permanecem pendentes, sendo 2 acima do prazo estipulado.',
        'Oportunidade da Metalúrgica Santa Rita sem movimentação há 48h.',
      ],
      recommendedFollowUps: [
        'Alinhar margem com supervisor para fechamento imediato do pedido de Tubos Inox.',
        'Revisar liberação de limite com setor financeiro para a conta Protemax.',
      ],
      confidence: 0.94,
      sources: ['Qlik Cloud BI', 'SAP ECC', 'WhatsApp Baileys'],
    }
  }

  async comparePlannedVsExecuted(sellerId: string): Promise<{
    sellerId: string
    adherencePercent: number
    criticalPending: string[]
    stalledOpportunities: string[]
    coachingRecommendation: string
  }> {
    return {
      sellerId,
      adherencePercent: 82,
      criticalPending: [
        'CLI-8041: Oferta de Tubos Inox 304 aguardando retorno do comprador há 3 dias.',
      ],
      stalledOpportunities: ['Proposta COT-SAP-98104 parada em análise de crédito.'],
      coachingRecommendation:
        'Apoiar vendedor no alinhamento de frete CIF com a logística regional para destravar proposta.',
    }
  }

  async identifyBottlenecks(teamId?: string): Promise<string[]> {
    return [
      '3 ações de alta prioridade com vencimento hoje ainda não iniciadas na equipe.',
      '2 cotações SAP aguardando aprovação de alçada de margem pela gerência.',
    ]
  }

  async runFullSupervisorDiagnostic(): Promise<{
    diagnosticoGeral: string
    pontosAtencao: Array<{
      id: string
      vendedor: string
      problema: string
      evidencia: string
      impacto: string
      recomendacao: string
      tipo: 'RITMO' | 'LATENCIA' | 'CADENCIA' | 'CARTEIRA'
    }>
    feedbacksPositivos: Array<{
      id: string
      vendedor: string
      destaque: string
      evidencia: string
      pratica: string
    }>
  }> {
    return {
      diagnosticoGeral:
        'A equipe atingiu 75% da meta com R$ 1.875.000 faturados e 637t entregues. O pipeline ponderado (R$ 720k) cobre com folga o Gap de R$ 625k nos 8 dias úteis restantes. Recomenda-se acelerar o follow-up de 8 cotações abertas.',
      pontosAtencao: [
        {
          id: 'pa-1',
          vendedor: 'João Pedro Representações',
          problema: 'Ritmo atual abaixo da trajetória e cadência comercial reduzida.',
          evidencia: 'Atingimento de 57.5% da meta (R$ 230k de R$ 400k) e 8 ações atrasadas.',
          impacto: 'Risco de não entrega de R$ 170k no fechamento mensal.',
          recomendacao:
            'Focar em visitas de reativação presencial na linha de cortes a laser em Patos de Minas.',
          tipo: 'RITMO',
        },
        {
          id: 'pa-2',
          vendedor: 'Carlos Mendonça',
          problema: 'Latência elevada em cotações SAP no estágio inicial.',
          evidencia:
            '3 propostas abertas (R$ 280k) aguardando retorno há mais de 48h sem follow-up ativo.',
          impacto: 'Perda de timing para concorrentes regionais que oferecem entrega imediata.',
          recomendacao:
            'Disparar mensagens de follow-up via WhatsApp com tabela CIF garantida para Contagem e Betim.',
          tipo: 'LATENCIA',
        },
        {
          id: 'pa-3',
          vendedor: 'Mariana Azevedo',
          problema: 'Concentração de pipeline em poucas contas de grande porte.',
          evidencia:
            '68% do volume previsto depende de apenas 2 propostas em Juiz de Fora e Divinópolis.',
          impacto: 'Vulnerabilidade caso ocorra adiamento de cronograma de obras dos clientes.',
          recomendacao:
            'Ativar 4 clientes em janela de recompra com mix de telas soldadas e vergalhões.',
          tipo: 'CARTEIRA',
        },
      ],
      feedbacksPositivos: [
        {
          id: 'fp-1',
          vendedor: 'Carlos Mendonça',
          destaque: 'Excelente assertividade técnica em campo.',
          evidencia:
            'Aprovação de laudo dimensional em tubos sanitários e chapas grossas na Usina Vale.',
          pratica:
            'Uso consistente do formulário de visita técnica e coleta de requisitos de qualidade.',
        },
        {
          id: 'fp-2',
          vendedor: 'Marcos Vinícius (Supervisor)',
          destaque: 'Alta conversão em contas estratégicas da diretoria.',
          evidencia:
            'Renovação do contrato trimestral de 26t de tarugos com a Siderúrgica Itaúna (R$ 152k).',
          pratica: 'Alinhamento direto de condições de pagamento com diretores de compras.',
        },
      ],
    }
  }
}

export class LocalAIAdapter implements AIProvider {
  readonly name = 'CIAFAL Local Commercial AI Engine (Adapter)'
  readonly copilot: SellerCopilotAgent = new LocalSellerCopilotAgent()
  readonly reactivation: ReactivationAgent = new LocalReactivationAgent()
  readonly supervisor: SalesSupervisorAgent = new LocalSalesSupervisorAgent()
  readonly sellerAnalysis: SellerPerformanceAnalysisAgent =
    new LocalSellerPerformanceAnalysisAgent()

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const now = new Date().toISOString()
    return {
      task: request.task,
      result: `Análise concluída com sucesso para o conteúdo: ${request.content.slice(0, 50)}...`,
      confidence: 0.92,
      model: 'ciafal-commercial-copilot',
      modelVersion: '2.1.0',
      processedAt: now,
    }
  }

  async transcribe(
    audioUrl: string,
    language = 'pt-BR',
  ): Promise<{ text: string; confidence: number }> {
    return {
      text: 'Olá, gostaria de verificar o preço e prazo de entrega para 3 toneladas de Tubo Inox 304.',
      confidence: 0.95,
    }
  }

  async summarize(text: string, maxLength = 200): Promise<{ summary: string; confidence: number }> {
    return {
      summary:
        text.length > maxLength
          ? text.slice(0, maxLength) + '...'
          : text || 'Resumo comercial da conversa gerado.',
      confidence: 0.9,
    }
  }

  async extractEntities(text: string): Promise<{
    intent?: string
    product?: string
    quantity?: string
    competitor?: string
    competitorPrice?: string
    nextAction?: string
    deadline?: string
    confidence: number
  }> {
    const lower = text.toLowerCase()
    let product = 'Aço Inox 304'
    if (lower.includes('chapa')) product = 'Chapa Inox 304'
    else if (lower.includes('tubo')) product = 'Tubo Inox 304 SCH 10'
    else if (lower.includes('barra')) product = 'Barra Redonda SAE 1045'

    let intent = 'cotacao'
    if (lower.includes('reclam')) intent = 'reclamacao'
    else if (lower.includes('pedido') || lower.includes('fechar')) intent = 'fechamento'

    return {
      intent,
      product,
      quantity: '2 a 5 toneladas',
      competitor: lower.includes('concorrente') ? 'Distribuidor Regional' : undefined,
      nextAction: 'Enviar cotação formal com frete FOB/CIF',
      confidence: 0.88,
    }
  }

  async extractEmailContext(
    emailContent: string,
    subject = '',
  ): Promise<{
    intent: string
    product?: string
    quantity?: string
    price?: string
    deadline?: string
    competitor?: string
    objection?: string
    nextAction: string
    confidence: number
  }> {
    const combined = `${subject} ${emailContent}`.toLowerCase()
    let intent = 'cotação'
    let objection: string | undefined = undefined
    let nextAction = 'Elaborar cotação formal'

    if (combined.includes('caro') || combined.includes('preço') || combined.includes('desconto')) {
      objection = 'preço'
      intent = 'negociação'
      nextAction = 'Revisar condição comercial e margem com supervisor'
    } else if (
      combined.includes('procur') &&
      (combined.includes('mês') || combined.includes('mes'))
    ) {
      intent = 'follow_up'
      nextAction = 'Agendar ação de contato para o próximo ciclo mensal'
    } else if (
      combined.includes('pedido') ||
      combined.includes('fechar') ||
      combined.includes('aprov')
    ) {
      intent = 'fechamento'
      nextAction = 'Emitir ordem de venda no SAP ECC'
    }

    return {
      intent,
      product: combined.includes('tubo')
        ? 'Tubo Inox AISI 304 SCH 10'
        : combined.includes('chapa')
          ? 'Chapa Inox AISI 304/316L'
          : 'Linha Inox CIAFAL',
      quantity:
        combined.includes('tonelada') || combined.includes(' t') ? '3 a 15 toneladas' : undefined,
      price: combined.includes('r$') ? 'Conforme tabela regional' : undefined,
      competitor: combined.includes('concorrente') ? 'Distribuidor Regional' : undefined,
      objection,
      nextAction,
      confidence: 0.93,
    }
  }

  async generateCommercialEmailDraft(request: {
    recipientEmail: string
    recipientName: string
    customerName: string
    intent: 'QUOTE_SENT' | 'FOLLOW_UP' | 'NEGOTIATION' | 'PRICE_TABLE' | 'RECONNECT'
    quoteId?: string
    quoteValue?: number
    productsMentioned?: string[]
    specialConditions?: string
    sellerName?: string
  }): Promise<{
    subject: string
    body: string
    suggestedAttachments?: string[]
    confidence: number
    generatedAt: string
  }> {
    const seller = request.sellerName || 'Carlos Mendonça'
    const quote = request.quoteId ? ` ${request.quoteId}` : ''
    let subject = `CIAFAL — Proposta Comercial${quote} para ${request.customerName}`
    let body = `Olá ${request.recipientName},\n\n`

    if (request.intent === 'QUOTE_SENT') {
      subject = `Proposta Comercial CIAFAL${quote} — ${request.customerName}`
      body += `Conforme alinhado, segue anexa a nossa cotação${quote} com condições diferenciadas para pronta-entrega.\n\n`
      body += `Condição de entrega: Frete CIF direto na sua fábrica.\nValidade: 10 dias.\n\nFico à disposição para fecharmos o pedido.\n\nAtenciosamente,\n${seller}\nCIAFAL Aços Inox & Tubos`
    } else if (request.intent === 'NEGOTIATION') {
      subject = `Revisão de Condições — Proposta${quote} — CIAFAL`
      body += `Analisamos sua solicitação sobre a proposta${quote}. Conseguimos alinhar com a nossa gerência uma condição de ${request.specialConditions || '28/42 DDL com frete bonificado'} para viabilizar o pedido ainda esta semana.\n\nPodemos confirmar?\n\nUm abraço,\n${seller}`
    } else {
      body += `Agradecemos a parceria com a ${request.customerName}. Temos lotes com disponibilidade imediata para pronta entrega.\n\nAtenciosamente,\n${seller}`
    }

    return {
      subject,
      body,
      suggestedAttachments: request.quoteId ? [`${request.quoteId}_CIAFAL.pdf`] : undefined,
      confidence: 0.95,
      generatedAt: new Date().toISOString(),
    }
  }

  async generateRecommendation(
    customerId: string,
    context?: Record<string, unknown>,
  ): Promise<AIRecommendation> {
    return {
      action: 'Enviar cotação com pronta-entrega para Tubos e Chapas Inox 304',
      justification:
        'Cliente inativo há 74 dias com ciclo médio de 45 dias. Estoque com alta cobertura.',
      evidence: [
        'Recorrência quebrada há 29 dias além da média',
        'Estoque 100% disponível para entrega em 48h',
        'Crédito aprovado no valor de R$ 120.000',
      ],
      confidence: 0.94,
      sources: ['Qlik BI', 'SAP ECC', 'Histórico WhatsApp'],
      timestamp: new Date().toISOString(),
      version: '2.1.0',
    }
  }

  async calculatePriorityScore(
    daysInactive: number,
    historicalRevenue: number,
    stockCoverage: number,
  ): Promise<number> {
    const recencyWeight = Math.min(daysInactive / 30, 3) * 15
    const revenueWeight = Math.min(historicalRevenue / 100000, 5) * 8
    const stockWeight = (stockCoverage / 100) * 20
    const raw = 30 + recencyWeight + revenueWeight + stockWeight
    return Math.min(Math.round(raw), 99)
  }

  async getHealth(): Promise<ProviderHealth> {
    return {
      online: true,
      lastCheck: new Date().toISOString(),
      latency: 42,
    }
  }
}

export const defaultAIProvider = new LocalAIAdapter()
