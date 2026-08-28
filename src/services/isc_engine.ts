import {
  ISCBand,
  ISCBandConfig,
  ISCPesosConfig,
  ISCPesoHistoryEntry,
  QualidadeDimensionData,
  LogisticaDimensionData,
  ComercialDimensionData,
  FinanceiroDimensionData,
  PesquisaDimensionData,
  AlertaDeterioracao,
} from '@/types/satisfaction'

export const DEFAULT_ISC_PESOS: ISCPesosConfig = {
  qualidade: 25,
  logistica: 25,
  comercial: 20,
  financeiro: 15,
  pesquisa: 15,
}

export const DEFAULT_ISC_BANDS: ISCBandConfig[] = [
  {
    band: 'EXCELENTE',
    label: 'Excelente',
    min: 90,
    max: 100,
    color: '#10B981',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    bgClass: 'bg-emerald-950/30',
    borderClass: 'border-emerald-500/30',
    textClass: 'text-emerald-400',
  },
  {
    band: 'SATISFEITO',
    label: 'Satisfeito',
    min: 80,
    max: 89,
    color: '#3B82F6',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    bgClass: 'bg-blue-950/30',
    borderClass: 'border-blue-500/30',
    textClass: 'text-blue-400',
  },
  {
    band: 'ATENCAO',
    label: 'Atenção',
    min: 70,
    max: 79,
    color: '#F59E0B',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    bgClass: 'bg-amber-950/30',
    borderClass: 'border-amber-500/30',
    textClass: 'text-amber-400',
  },
  {
    band: 'RISCO',
    label: 'Risco',
    min: 60,
    max: 69,
    color: '#F97316',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    bgClass: 'bg-orange-950/30',
    borderClass: 'border-orange-500/30',
    textClass: 'text-orange-400',
  },
  {
    band: 'CRITICO',
    label: 'Crítico',
    min: 0,
    max: 59,
    color: '#EF4444',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    bgClass: 'bg-rose-950/30',
    borderClass: 'border-rose-500/30',
    textClass: 'text-rose-400',
  },
]

export class ISCEngine {
  /**
   * Calcula o score do ISC a partir das 5 dimensões e pesos parametrizáveis
   */
  public calculateISC(
    qualidadeScore: number,
    logisticaScore: number,
    comercialScore: number,
    financeiroScore: number,
    pesquisaScore: number,
    pesos: ISCPesosConfig = DEFAULT_ISC_PESOS,
  ): number {
    const totalWeights =
      pesos.qualidade + pesos.logistica + pesos.comercial + pesos.financeiro + pesos.pesquisa

    if (Math.abs(totalWeights - 100) > 0.01) {
      console.warn(
        `Aviso Motor ISC: soma dos pesos é ${totalWeights}% (deve ser 100%). Normalizando...`,
      )
    }

    const weightedScore =
      (qualidadeScore * pesos.qualidade +
        logisticaScore * pesos.logistica +
        comercialScore * pesos.comercial +
        financeiroScore * pesos.financeiro +
        pesquisaScore * pesos.pesquisa) /
      (totalWeights || 100)

    return Math.round(Math.max(0, Math.min(100, weightedScore)))
  }

  /**
   * Determina a faixa do ISC com base nas configurações
   */
  public getBand(score: number, bands: ISCBandConfig[] = DEFAULT_ISC_BANDS): ISCBandConfig {
    const matched = bands.find((b) => score >= b.min && score <= b.max)
    return matched || bands[bands.length - 1]
  }

  /**
   * Calcula Score de Qualidade a partir de parâmetros reais
   */
  public computeQualidadeScore(data: Omit<QualidadeDimensionData, 'score' | 'fatoresDetalhados'>): {
    score: number
    fatores: string[]
  } {
    let score = 100
    const fatores: string[] = []

    // Reclamações abertas (-10 por aberta)
    if (data.reclamacoesAbertas > 0) {
      const penalty = data.reclamacoesAbertas * 12
      score -= penalty
      fatores.push(`${data.reclamacoesAbertas} reclamação(ões) aberta(s) no SAC (-${penalty} pts)`)
    }

    // Reincidência (-15 por reincidência)
    if (data.reclamacoesReincidentes > 0) {
      const penalty = data.reclamacoesReincidentes * 15
      score -= penalty
      fatores.push(
        `${data.reclamacoesReincidentes} reclamação(ões) reincidente(s) (-${penalty} pts)`,
      )
    }

    // Não conformidades (-8 por NC)
    if (data.naoConformidades > 0) {
      const penalty = data.naoConformidades * 8
      score -= penalty
      fatores.push(`${data.naoConformidades} Não Conformidade(s) técnica(s) (-${penalty} pts)`)
    }

    // Devoluções de mercadoria (-12 por devolução)
    if (data.devolucoesQtd > 0) {
      const penalty = data.devolucoesQtd * 12
      score -= penalty
      fatores.push(
        `${data.devolucoesQtd} devolução(ões) (${data.devolucoesTons} t) registrada(s) (-${penalty} pts)`,
      )
    }

    // Eficácia de ação corretiva
    if (data.eficaciaAcaoCorretivaPct >= 90) {
      fatores.push(`Eficácia corretiva alta (${data.eficaciaAcaoCorretivaPct}%)`)
    } else if (data.eficaciaAcaoCorretivaPct < 60 && data.reclamacoesAbertas > 0) {
      score -= 10
      fatores.push(
        `Baixa eficácia de ações corretivas passadas (${data.eficaciaAcaoCorretivaPct}%)`,
      )
    }

    if (fatores.length === 0) {
      fatores.push('Nenhuma reclamação ou Não Conformidade nos últimos 90 dias')
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      fatores,
    }
  }

  /**
   * Calcula Score de Logística a partir de TMS e pontualidade
   */
  public computeLogisticaScore(data: Omit<LogisticaDimensionData, 'score' | 'fatoresDetalhados'>): {
    score: number
    fatores: string[]
  } {
    let score = data.entregasNoPrazoPct || 95
    const fatores: string[] = []

    if (data.entregasNoPrazoPct < 90) {
      fatores.push(
        `OTIF/Pontualidade de entrega em ${data.entregasNoPrazoPct}% (abaixo da meta de 95%)`,
      )
    } else {
      fatores.push(`Excelente pontualidade de entrega (${data.entregasNoPrazoPct}% no prazo)`)
    }

    if (data.entregasAtrasadas > 0) {
      const penalty = data.entregasAtrasadas * 6
      score -= penalty
      fatores.push(`${data.entregasAtrasadas} entrega(s) com atraso no período (-${penalty} pts)`)
    }

    if (data.avariasTransporteQtd > 0) {
      const penalty = data.avariasTransporteQtd * 10
      score -= penalty
      fatores.push(
        `${data.avariasTransporteQtd} ocorrência(s) de avaria em transporte (-${penalty} pts)`,
      )
    }

    if (data.divergenciaQuantidadeQtd > 0) {
      const penalty = data.divergenciaQuantidadeQtd * 8
      score -= penalty
      fatores.push(
        `${data.divergenciaQuantidadeQtd} divergência(s) de quantidade no descarregamento`,
      )
    }

    if (data.diferencaDataDesejadaEntregueDias > 2) {
      fatores.push(
        `Diferença média data desejada vs entregue: +${data.diferencaDataDesejadaEntregueDias} dias`,
      )
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      fatores,
    }
  }

  /**
   * Calcula Score Comercial (contato, tarefas, mix, volume)
   */
  public computeComercialScore(data: Omit<ComercialDimensionData, 'score' | 'fatoresDetalhados'>): {
    score: number
    fatores: string[]
  } {
    let score = 90
    const fatores: string[] = []

    // Queda de volume
    if (data.variacaoVolumePct < -20) {
      const penalty = Math.min(30, Math.abs(data.variacaoVolumePct) * 0.8)
      score -= penalty
      fatores.push(
        `Queda acentuada de volume faturado (${data.variacaoVolumePct}%) (-${Math.round(penalty)} pts)`,
      )
    } else if (data.variacaoVolumePct > 10) {
      score += 10
      fatores.push(`Crescimento consistente de volume (+${data.variacaoVolumePct}%)`)
    }

    // Dias sem contato
    if (data.diasUltimoContato > 30) {
      const penalty = Math.min(25, (data.diasUltimoContato - 30) * 0.8)
      score -= penalty
      fatores.push(`Cliente sem contato comercial há ${data.diasUltimoContato} dias`)
    } else {
      fatores.push(`Contato recente realizado há ${data.diasUltimoContato} dia(s)`)
    }

    // Dias sem compra
    if (data.diasSemCompra > (data.frequenciaCompraDias || 30) * 1.8) {
      score -= 15
      fatores.push(
        `Dias sem compra (${data.diasSemCompra}d) excede o ciclo médio (${data.frequenciaCompraDias}d)`,
      )
    }

    // Perda de mix / produtos abandonados
    if (data.perdaMixHistorico || data.produtosAbandonadosCount > 0) {
      const penalty = data.produtosAbandonadosCount * 5
      score -= penalty
      fatores.push(
        `${data.produtosAbandonadosCount} produto(s) historicamente comprado(s) abandonado(s)`,
      )
    }

    // Tarefas vencidas
    if (data.tarefasVencidas > 0) {
      const penalty = data.tarefasVencidas * 4
      score -= penalty
      fatores.push(`${data.tarefasVencidas} tarefa(s) comercial(is) pendente(s)/vencida(s)`)
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      fatores,
    }
  }

  /**
   * Calcula Score Financeiro (fatores objetivos, sem viés subjetivo)
   */
  public computeFinanceiroScore(
    data: Omit<FinanceiroDimensionData, 'score' | 'fatoresDetalhados'>,
  ): {
    score: number
    fatores: string[]
  } {
    let score = 100
    const fatores: string[] = []

    if (data.statusCreditoAtual === 'BLOQUEADO') {
      score -= 50
      fatores.push('Crédito atualmente BLOQUEADO no SAP ECC')
    } else if (data.statusCreditoAtual === 'RESTRITO') {
      score -= 25
      fatores.push('Crédito com RESTRIÇÃO no SAP ECC')
    } else {
      fatores.push('Crédito liberado e regular no SAP ECC')
    }

    if (data.titulosVencidosQtd > 0) {
      const penalty = Math.min(30, data.titulosVencidosQtd * 10)
      score -= penalty
      fatores.push(`${data.titulosVencidosQtd} título(s) vencido(s) pendente(s) de liquidação`)
    }

    if (data.atrasoMedioDias > 5) {
      const penalty = Math.min(20, data.atrasoMedioDias * 1.5)
      score -= penalty
      fatores.push(`Atraso médio histórico de pagamento de ${data.atrasoMedioDias} dias`)
    } else if (data.atrasoMedioDias === 0) {
      fatores.push('Histórico 100% pontual de liquidação financeira')
    }

    if (data.renegociacoesUltimos12m > 0) {
      score -= data.renegociacoesUltimos12m * 8
      fatores.push(
        `${data.renegociacoesUltimos12m} renegociação(ões) de títulos nos últimos 12 meses`,
      )
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      fatores,
    }
  }

  /**
   * Calcula Score de Pesquisa (NPS e CSATs)
   */
  public computePesquisaScore(data: Omit<PesquisaDimensionData, 'score' | 'fatoresDetalhados'>): {
    score: number
    fatores: string[]
  } {
    let score = 75
    const fatores: string[] = []

    if (data.totalPesquisasRespondidas > 0) {
      // NPS convertido para escala 0-100: (nps / 10) * 50 + 50
      const npsComponent = (data.npsScore / 10) * 60
      // CSATs médios (1-5 para 0-40)
      const avgCsat =
        (data.csatGeral + data.csatProduto + data.csatComercial + data.csatEntrega) / 4
      const csatComponent = (avgCsat / 5) * 40
      score = npsComponent + csatComponent

      fatores.push(`NPS do cliente: ${data.npsScore}/10 (${data.npsZone})`)
      fatores.push(`Média CSAT: ${avgCsat.toFixed(1)}/5 (Última via ${data.canalUltimaResposta})`)
    } else {
      fatores.push('Nenhuma pesquisa recente respondida (utilizando média base de relacionamento)')
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      fatores,
    }
  }

  /**
   * Detecta Alertas de Deterioração Automáticos
   */
  public detectDeteriorationAlerts(
    iscAtual: number,
    iscAnterior: number,
    variacaoVolumePct: number,
    diasSemContato: number,
    reclamacoesReincidentes: number,
    entregasAtrasadas: number,
    tarefasVencidas: number,
    produtosAbandonadosCount: number,
    temDivergenciaPesquisa: boolean,
  ): AlertaDeterioracao[] {
    const alerts: AlertaDeterioracao[] = []
    const nowStr = new Date().toISOString().split('T')[0]

    // Queda relevante de ISC (> 8 pontos)
    if (iscAnterior - iscAtual >= 8) {
      alerts.push({
        id: `alt-isc-${Date.now()}-1`,
        tipo: 'QUEDA_ISC',
        nivel: iscAtual < 60 ? 'CRITICO' : 'ATENCAO',
        mensagem: `Cliente apresentou deterioração relevante de relacionamento (ISC caiu de ${iscAnterior} para ${iscAtual}).`,
        fatos: [`Queda de ${iscAnterior - iscAtual} pontos no ISC oficial`],
        dataIdentificacao: nowStr,
        resolvido: false,
      })
    }

    // Queda acentuada de volume
    if (variacaoVolumePct < -25) {
      alerts.push({
        id: `alt-vol-${Date.now()}-2`,
        tipo: 'QUEDA_VOLUME',
        nivel: variacaoVolumePct < -40 ? 'CRITICO' : 'ATENCAO',
        mensagem: `Queda brusca de volume faturado (${variacaoVolumePct}% em relação ao período anterior).`,
        fatos: [`Variação de volume: ${variacaoVolumePct}%`],
        dataIdentificacao: nowStr,
        resolvido: false,
      })
    }

    // Reclamação reincidente
    if (reclamacoesReincidentes > 0) {
      alerts.push({
        id: `alt-rec-${Date.now()}-3`,
        tipo: 'RECLAMACAO_REINCIDENTE',
        nivel: 'CRITICO',
        mensagem: 'Reclamação de qualidade reincidente não solucionada no SAC.',
        fatos: [`${reclamacoesReincidentes} reclamação(ões) com causa reincidente`],
        dataIdentificacao: nowStr,
        resolvido: false,
      })
    }

    // Falta de contato
    if (diasSemContato >= 25) {
      alerts.push({
        id: `alt-cont-${Date.now()}-4`,
        tipo: 'SEM_CONTATO',
        nivel: diasSemContato >= 40 ? 'CRITICO' : 'PREVENTIVO',
        mensagem: `Cliente sem interação comercial ou visita há ${diasSemContato} dias.`,
        fatos: [`Último contato registrado há ${diasSemContato} dias`],
        dataIdentificacao: nowStr,
        resolvido: false,
      })
    }

    // Produtos abandonados
    if (produtosAbandonadosCount > 0) {
      alerts.push({
        id: `alt-mix-${Date.now()}-5`,
        tipo: 'ABANDONO_PRODUTO',
        nivel: 'PREVENTIVO',
        mensagem: `Perda de mix histórico: ${produtosAbandonadosCount} produto(s) tradicional(is) sem recompra.`,
        fatos: [
          `${produtosAbandonadosCount} SKU(s) que o cliente comprava regularmente foram descontinuados`,
        ],
        dataIdentificacao: nowStr,
        resolvido: false,
      })
    }

    // Divergência Pesquisa vs Comportamento
    if (temDivergenciaPesquisa) {
      alerts.push({
        id: `alt-div-${Date.now()}-6`,
        tipo: 'DIVERGENCIA_PESQUISA',
        nivel: 'ATENCAO',
        mensagem:
          'Divergência identificada: Pesquisa positiva, porém comportamento comercial apresenta deterioração.',
        fatos: [
          'Pesquisa NPS/CSAT com nota alta, mas volume e frequência de compras em queda acelerada',
        ],
        dataIdentificacao: nowStr,
        resolvido: false,
      })
    }

    return alerts
  }

  /**
   * Classifica o cliente na Matriz Valor Estratégico x Satisfação 2x2
   */
  public calculateMatrixQuadrant(
    scoreValorEstrategico: number,
    scoreISC: number,
  ): 'PROTEGER' | 'PRIORIDADE_MAXIMA' | 'MANUTENCAO' | 'REAVALIAR' {
    const isAltoValor = scoreValorEstrategico >= 60
    const isAltaSatisfacao = scoreISC >= 75

    if (isAltoValor && isAltaSatisfacao) return 'PROTEGER'
    if (isAltoValor && !isAltaSatisfacao) return 'PRIORIDADE_MAXIMA'
    if (!isAltoValor && isAltaSatisfacao) return 'MANUTENCAO'
    return 'REAVALIAR'
  }
}

export const iscEngine = new ISCEngine()
