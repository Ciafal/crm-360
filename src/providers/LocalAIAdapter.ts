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

export class LocalSalesSupervisorAgent implements SalesSupervisorAgent {
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
      sources: ['Qlik Cloud BI', 'SAP S/4HANA ECC', 'WhatsApp Baileys'],
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
}

export class LocalAIAdapter implements AIProvider {
  readonly name = 'CIAFAL Local Commercial AI Engine (Adapter)'
  readonly copilot: SellerCopilotAgent = new LocalSellerCopilotAgent()
  readonly reactivation: ReactivationAgent = new LocalReactivationAgent()
  readonly supervisor: SalesSupervisorAgent = new LocalSalesSupervisorAgent()

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
      sources: ['Qlik BI', 'SAP S/4HANA', 'Histórico WhatsApp'],
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
