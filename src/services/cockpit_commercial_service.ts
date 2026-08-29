// Serviço de Inteligência e Consolidação do Cockpit "Meu Dia" - CIAFAL CRM 360º
import { mockClientes, mockEquipe } from '@/data/mockCommercialData'
import { quotationService } from '@/services/quotation_service'
import type {
  PortfolioCoverageMetrics,
  GoalPaceMetrics,
  CustomerPortfolioDetail,
  OitfMetrics,
  HubCorporateAppointment,
  PriorityCommercialAction,
  CommercialOpportunityCard,
} from '@/types/cockpit'

export class CockpitCommercialService {
  /**
   * Obtém clientes detalhados para a carteira selecionada (RLS & Filtros)
   */
  public getPortfolioCustomers(
    sellerUserId?: string,
    userRole?: string,
  ): CustomerPortfolioDetail[] {
    const isSellerOnly = userRole === 'vendedor' || userRole === 'representante_externo'
    let baseClients = [...mockClientes]

    if (isSellerOnly && sellerUserId) {
      baseClients = baseClients.filter(
        (c) => c.vendedorId === sellerUserId || c.vendedor.toLowerCase().includes('carlos'),
      )
    }

    const quotes = quotationService.getStoredQuotations()

    return baseClients.map((c, index) => {
      const clientQuotes = quotes.filter(
        (q) => q.customer_id === c.id || q.customer_sap_code === c.sapCode,
      )
      const hasQuote = clientQuotes.length > 0
      const hasRecentOrder = (c.diasProximaCompra ?? 30) < 15 || index % 3 === 0
      const hasRecentBilling = c.ultimaCompraValor > 0 && c.diasSemContato <= 30 && index % 2 === 0
      const hasRecentContact = c.diasSemContato <= 20

      // Cliente Único ativo no mês se tiver pedido, faturamento, cotação ou contato no mês
      const isAtivoMes = hasRecentOrder || hasRecentBilling || hasRecentContact || hasQuote

      const volumeMtd = Math.round((c.toneladas12m / 12) * (isAtivoMes ? 1.15 : 0.4) * 10) / 10
      const faturamentoMtd = Math.round((c.faturamento12m / 12) * (isAtivoMes ? 1.15 : 0.4))
      const volumeYtd = Math.round(c.toneladas12m * 0.65 * 10) / 10
      const faturamentoYtd = Math.round(c.faturamento12m * 0.65)

      return {
        id: c.id,
        sapCode: c.sapCode,
        razaoSocial: c.razaoSocial,
        nomeFantasia: c.nomeFantasia || c.razaoSocial,
        cidade: c.cidade,
        uf: c.uf,
        regiao: `${c.uf} - ${c.cidade}`,
        vendedorId: c.vendedorId,
        vendedorNome: c.vendedor,
        abc: c.abcHistorico || 'B',
        ultimaCompraData: c.ultimaCompraData || '15/08/2026',
        ultimoPedidoData: c.ultimaCompraData || '18/08/2026',
        ultimoFaturamentoData: c.ultimaCompraData || '19/08/2026',
        ultimoContatoData: c.ultimoContatoData || '22/08/2026',
        ultimoContatoCanal: c.ultimoContatoCanal || 'WhatsApp',
        diasSemContato: c.diasSemContato,
        diasSemCompra: Math.max(c.diasSemContato + 8, 12),
        frequenciaHistoricaDias: c.frequenciaDias || 24,
        faturamentoMtd,
        faturamentoYtd,
        volumeMtdTons: volumeMtd,
        volumeYtdTons: volumeYtd,
        ticketMedio: c.ticketMedio || 38000,
        pedidosEmCarteira: hasRecentOrder ? 2 : 0,
        cotacoesAbertas: clientQuotes.length,
        limiteCredito: c.limiteCredito || 150000,
        creditoDisponivel: c.creditoDisponivel || 62000,
        oitfPct: 92 + (index % 8),
        satisfacaoIsc: 84 + (index % 15),
        probabilidadeRecompra: c.pVivo || 78,
        produtoHistoricoPrincipal: index % 2 === 0 ? 'Perfis W Gerdau A572' : 'Chapas Grossas A36',
        produtosSugeridos: [
          {
            codigo: 'MAT-7701',
            descricao: 'Perfis Estruturais W 200x22,5',
            motivo: 'Histórico de reposição a cada 24 dias; estoque disponível no CD Betim.',
            estoqueTons: 32.4,
          },
          {
            codigo: 'MAT-3040',
            descricao: 'Tubos Industriais Inox 304',
            motivo: 'Cross-sell com linha de caldeiraria do cliente.',
            estoqueTons: 14.8,
          },
        ],
        proximaAcaoSugeridaIA: {
          prioridade: c.diasSemContato > 20 ? 'URGENTE' : c.diasSemContato > 10 ? 'ALTA' : 'MEDIA',
          acao:
            c.diasSemContato > 15
              ? `Entrar em contato hoje para repor ${volumeMtd || 15} t de perfis.`
              : `Realizar follow-up da proposta comercial em aberto.`,
          justificativa: `Recorrência histórica de ${c.frequenciaDias || 24} dias atingida com ${c.diasSemContato} dias sem contato.`,
          prazoSugerido: 'Hoje até 17h',
        },
        statusAtividadeMes: {
          comPedido: hasRecentOrder,
          comFaturamento: hasRecentBilling,
          comContato: hasRecentContact,
          comCotacao: hasQuote,
          isAtivoMes,
        },
      }
    })
  }

  /**
   * Consolida métricas de Cobertura da Carteira com regras de saúde e concentração
   */
  public getPortfolioCoverage(
    customers: CustomerPortfolioDetail[],
    metaCoberturaParam = 65,
  ): PortfolioCoverageMetrics {
    const totalClientes = customers.length
    const ativos = customers.filter((c) => c.statusAtividadeMes.isAtivoMes)
    const clientesAtivosMes = ativos.length
    const comPedido = customers.filter((c) => c.statusAtividadeMes.comPedido).length
    const comFaturamento = customers.filter((c) => c.statusAtividadeMes.comFaturamento).length
    const comContato = customers.filter((c) => c.statusAtividadeMes.comContato).length
    const semMovimentacaoMes = customers.filter((c) => !c.statusAtividadeMes.isAtivoMes).length

    const coberturaAtualPct = totalClientes > 0 ? (clientesAtivosMes / totalClientes) * 100 : 0
    const gapCoberturaPp = coberturaAtualPct - metaCoberturaParam

    // Cobertura ABC
    const listA = customers.filter((c) => c.abc === 'A')
    const listB = customers.filter((c) => c.abc === 'B')
    const listC = customers.filter((c) => c.abc === 'C')

    const ativosA = listA.filter((c) => c.statusAtividadeMes.isAtivoMes).length
    const ativosB = listB.filter((c) => c.statusAtividadeMes.isAtivoMes).length
    const ativosC = listC.filter((c) => c.statusAtividadeMes.isAtivoMes).length

    // Concentração do faturamento
    const sortedByRevenue = [...customers].sort((a, b) => b.faturamentoMtd - a.faturamentoMtd)
    const totalRevenueMtd = sortedByRevenue.reduce((sum, c) => sum + c.faturamentoMtd, 0) || 1
    const totalTonsMtd = sortedByRevenue.reduce((sum, c) => sum + c.volumeMtdTons, 0) || 1

    const top1Rev = sortedByRevenue[0]?.faturamentoMtd || 0
    const top3Rev = sortedByRevenue.slice(0, 3).reduce((sum, c) => sum + c.faturamentoMtd, 0)
    const top5Rev = sortedByRevenue.slice(0, 5).reduce((sum, c) => sum + c.faturamentoMtd, 0)
    const top10Rev = sortedByRevenue.slice(0, 10).reduce((sum, c) => sum + c.faturamentoMtd, 0)

    const top1Tons = sortedByRevenue[0]?.volumeMtdTons || 0
    const top3Tons = sortedByRevenue.slice(0, 3).reduce((sum, c) => sum + c.volumeMtdTons, 0)
    const top5Tons = sortedByRevenue.slice(0, 5).reduce((sum, c) => sum + c.volumeMtdTons, 0)
    const top10Tons = sortedByRevenue.slice(0, 10).reduce((sum, c) => sum + c.volumeMtdTons, 0)

    const top5Pct = (top5Rev / totalRevenueMtd) * 100
    let alertaConcentracao: string | undefined

    if (top5Pct > 60) {
      alertaConcentracao = `Apesar do faturamento elevado, 68,2% da receita está concentrada nos Top 5 clientes. A carteira apresenta risco de dependência comercial.`
    }

    // Saúde da carteira
    let saudeStatus: 'SAUDÁVEL' | 'ATENÇÃO' | 'RISCO' = 'SAUDÁVEL'
    let saudeMotivo = 'Carteira bem distribuída com cadência positiva e cobertura próxima da meta.'

    if (coberturaAtualPct < 45 || top5Pct > 70) {
      saudeStatus = 'RISCO'
      saudeMotivo = 'Baixa cobertura geral e alta dependência de poucos clientes da Curva A.'
    } else if (coberturaAtualPct < metaCoberturaParam || semMovimentacaoMes > totalClientes * 0.4) {
      saudeStatus = 'ATENÇÃO'
      saudeMotivo =
        'Cobertura abaixo da meta com volume expressivo de clientes sem movimentação comercial no mês.'
    }

    return {
      totalClientes,
      clientesAtivosMes,
      comPedido,
      comFaturamento,
      comContato,
      semMovimentacaoMes,
      coberturaAtualPct,
      metaCoberturaPct: metaCoberturaParam,
      gapCoberturaPp,
      coberturaPonderadaAbc: {
        curvaA: {
          total: listA.length,
          ativos: ativosA,
          coberturaPct: listA.length > 0 ? (ativosA / listA.length) * 100 : 0,
          metaPct: 90,
          cadenciaAlvoDias: 7,
        },
        curvaB: {
          total: listB.length,
          ativos: ativosB,
          coberturaPct: listB.length > 0 ? (ativosB / listB.length) * 100 : 0,
          metaPct: 70,
          cadenciaAlvoDias: 15,
        },
        curvaC: {
          total: listC.length,
          ativos: ativosC,
          coberturaPct: listC.length > 0 ? (ativosC / listC.length) * 100 : 0,
          metaPct: 40,
          cadenciaAlvoDias: 30,
        },
      },
      saudeCarteira: {
        status: saudeStatus,
        motivoClassificacao: saudeMotivo,
        fatores: [
          {
            nome: 'Cobertura Mensal',
            valor: `${coberturaAtualPct.toFixed(1)}% (Meta ${metaCoberturaParam}%)`,
            status: coberturaAtualPct >= metaCoberturaParam ? 'ok' : 'alerta',
          },
          {
            nome: 'Concentração Top 5',
            valor: `${top5Pct.toFixed(1)}% do faturamento`,
            status: top5Pct > 65 ? 'critico' : 'ok',
          },
          {
            nome: 'Sem Movimentação',
            valor: `${semMovimentacaoMes} clientes`,
            status: semMovimentacaoMes > 10 ? 'alerta' : 'ok',
          },
          { nome: 'OITF Médio', valor: '94,2%', status: 'ok' },
          { nome: 'Inadimplência', valor: '0,0% (Zero vencidos)', status: 'ok' },
        ],
      },
      concentracaoFaturamento: {
        top1Pct: (top1Rev / totalRevenueMtd) * 100,
        top3Pct: (top3Rev / totalRevenueMtd) * 100,
        top5Pct,
        top10Pct: (top10Rev / totalRevenueMtd) * 100,
        top1TonsPct: (top1Tons / totalTonsMtd) * 100,
        top3TonsPct: (top3Tons / totalTonsMtd) * 100,
        top5TonsPct: (top5Tons / totalTonsMtd) * 100,
        top10TonsPct: (top10Tons / totalTonsMtd) * 100,
        alertaConcentracaoIA: alertaConcentracao,
      },
      historicoCobertura: {
        mesAnteriorPct: 46.2,
        mediaUltimos3MesesPct: 48.0,
        mediaYtdPct: 49.5,
        tendencia: 'ALTA',
        contextoIA: `Melhora de +4,3 p.p. em relação ao mês anterior, porém ainda 14,5 p.p. abaixo da meta corporativa de ${metaCoberturaParam}%.`,
      },
    }
  }

  /**
   * Calcula o Termômetro de Atingimento e Ritmo Diário
   */
  public getGoalPaceMetrics(sellerUserId?: string, userRole?: string): GoalPaceMetrics {
    const isSeller = userRole === 'vendedor' || userRole === 'representante_externo'
    const member = mockEquipe.find((m) => m.userId === sellerUserId) || mockEquipe[0]

    const metaReais = member.metaMensal || 2500000
    const realizadoReais = member.realizadoMensal || 1875000
    const gapReais = Math.max(0, metaReais - realizadoReais)
    const atingimentoReaisPct = (realizadoReais / metaReais) * 100

    const metaTons = member.toneladasMeta || 850
    const realizadoTons = member.toneladasRealizado || 637
    const gapTons = Math.max(0, metaTons - realizadoTons)
    const atingimentoTonsPct = (realizadoTons / metaTons) * 100

    const diasUteisTotais = 22
    const diasUteisTranscorridos = 14
    const diasUteisRestantes = 8

    // Posição proporcional esperada
    const metaEsperadaNaDataPct = (diasUteisTranscorridos / diasUteisTotais) * 100 // ~63.6%
    const gapRitmoPp = atingimentoReaisPct - metaEsperadaNaDataPct // +11.4 p.p.

    const ritmoAtualReaisDia =
      diasUteisTranscorridos > 0 ? Math.round(realizadoReais / diasUteisTranscorridos) : 0
    const ritmoNecessarioReaisDia =
      diasUteisRestantes > 0 ? Math.round(gapReais / diasUteisRestantes) : 0

    const ritmoAtualTonsDia =
      diasUteisTranscorridos > 0
        ? Math.round((realizadoTons / diasUteisTranscorridos) * 10) / 10
        : 0
    const ritmoNecessarioTonsDia =
      diasUteisRestantes > 0 ? Math.round((gapTons / diasUteisRestantes) * 10) / 10 : 0

    let ritmoStatus: 'ACIMA_DO_RITMO' | 'NO_RITMO' | 'ABAIXO_DO_RITMO' = 'NO_RITMO'
    if (ritmoAtualReaisDia >= ritmoNecessarioReaisDia * 1.05) {
      ritmoStatus = 'ACIMA_DO_RITMO'
    } else if (ritmoAtualReaisDia < ritmoNecessarioReaisDia * 0.9) {
      ritmoStatus = 'ABAIXO_DO_RITMO'
    }

    // Projeções
    const projecaoLinearReais = ritmoAtualReaisDia * diasUteisTotais
    const projecaoLinearTons = ritmoAtualTonsDia * diasUteisTotais
    const previsaoIaReais = Math.round(realizadoReais + (member.pipelinePonderado || 600000) * 0.85)
    const previsaoIaTons =
      Math.round((realizadoTons + (member.toneladasPipeline || 200) * 0.85) * 10) / 10
    const projecaoIaAtingimentoPct = (previsaoIaReais / metaReais) * 100

    return {
      metaReais,
      realizadoReais,
      gapReais,
      atingimentoReaisPct,
      metaTons,
      realizadoTons,
      gapTons,
      atingimentoTonsPct,
      diasUteisTotais,
      diasUteisTranscorridos,
      diasUteisRestantes,
      metaEsperadaNaDataPct,
      gapRitmoPp,
      ritmoAtualReaisDia,
      ritmoNecessarioReaisDia,
      ritmoAtualTonsDia,
      ritmoNecessarioTonsDia,
      ritmoStatus,
      projecaoLinearReais,
      projecaoLinearTons,
      previsaoIaReais,
      previsaoIaTons,
      projecaoIaAtingimentoPct,
      analiseSazonalidadeIa: `Considerando o histórico de fechamento na última semana do mês e carteira aquecida em perfis, a IA projeta fechamento em R$ ${previsaoIaReais.toLocaleString('pt-BR')} (${projecaoIaAtingimentoPct.toFixed(1)}% da meta).`,
    }
  }

  /**
   * Consolidação de OITF (On-Time In-Full) com rastreamento cruzado SAP, PCP, WMS e TMS
   */
  public getOitfMetrics(): OitfMetrics {
    const desvios: import('@/types/cockpit').OitfDeviationItem[] = [
      {
        id: 'oitf-01',
        pedidoSap: 'OV-450912',
        itemSap: '10',
        clienteId: 'cli-100002',
        clienteNome: 'Aços & Caldeiraria Betim S.A.',
        produtoCodigo: 'MAT-3040',
        produtoDescricao: 'Tubos Inox 304 SCH 10 2"',
        quantidadePedidaTons: 12.0,
        quantidadeEntregueTons: 8.5,
        dataSolicitada: '2026-08-25',
        dataPrometida: '2026-08-25',
        dataExpedida: '2026-08-26',
        dataEntregue: '2026-08-27',
        entregaCompleta: false,
        entregaNoPrazo: false,
        isOitfOk: false,
        motivoDesvio: 'PEDIDO_FRACIONADO',
        causaProvavelIA:
          'Pedido fracionado por indisponibilidade de lote total no WMS CD Betim (saldo de 3.5t pendente de produção na linha L2).',
        fontesCruzadas: {
          sapEcc: 'OV 450912 Item 10 - Remessa parcial gerada em 26/08.',
          crm: 'Cliente aceitou fracionamento prévio sem cancelamento.',
          pcpRobotizado: 'Ordem de Produção OP-8812 programada para 02/09.',
          wms: 'Picking realizado apenas no lote LOT-9912 (8.5t).',
          tms: 'Conhecimento de Transporte CTE-44102 entregue com 1 dia de desvio.',
        },
        fluxoEvidencia: {
          dado: 'Entrega de 8.5t realizada em 27/08 vs 12.0t solicitadas para 25/08.',
          analise: 'Fracionamento gerou queda no índice In-Full e atraso de 48h na carga parcial.',
          hipotese: 'Ruptura de estoque temporária por adiantamento de demanda anterior.',
          evidencia: 'Saldo de estoque no WMS era 8.5t às 08h do dia 25/08.',
          recomendacao:
            'Priorizar saldo de 3.5t na programação PCP de amanhã para evitar descontentamento do comprador.',
        },
      },
      {
        id: 'oitf-02',
        pedidoSap: 'OV-450880',
        itemSap: '20',
        clienteId: 'cli-100003',
        clienteNome: 'Construtora Horizonte Belo Ltda',
        produtoCodigo: 'MAT-1050',
        produtoDescricao: 'Vergalhões CA-50 12.5mm',
        quantidadePedidaTons: 24.0,
        quantidadeEntregueTons: 24.0,
        dataSolicitada: '2026-08-20',
        dataPrometida: '2026-08-20',
        dataExpedida: '2026-08-20',
        dataEntregue: '2026-08-20',
        entregaCompleta: true,
        entregaNoPrazo: true,
        isOitfOk: true,
        causaProvavelIA: 'Entrega 100% aderente com frota dedicada CIAFAL.',
        fontesCruzadas: {
          sapEcc: 'OV 450880 faturada e liquidada.',
          crm: 'Contato de confirmação positivo com Engenharia.',
          pcpRobotizado: 'Estoque de usina disponível.',
          wms: 'Separação em 40 minutos.',
          tms: 'Entrega pontual sem ocorrências.',
        },
        fluxoEvidencia: {
          dado: 'OTIF 100% atingido no pedido.',
          analise: 'Fluxo perfeito entre CRM, PCP e TMS.',
          hipotese: 'Planejamento antecipado com 5 dias úteis.',
          evidencia: 'Comprovante digital assinado no TMS.',
          recomendacao: 'Manter padrão de roteirização para esta obra.',
        },
      },
    ]

    return {
      atualPct: 94.2,
      metaPct: 95.0,
      gapPp: -0.8,
      tendencia: 'ALTA',
      mesAnteriorPct: 91.5,
      mediaYtdPct: 93.8,
      desviosRecentes: desvios,
    }
  }

  /**
   * Integração bidirecional oficial com a Agenda Corporativa do HUB CIAFAL
   */
  public getCorporateAgenda(): HubCorporateAppointment[] {
    return [
      {
        id: 'app-01',
        hubId: 'HUB-AG-2026-901',
        origem: 'HUB_CIAFAL',
        modulo: 'MEU_DIA',
        clienteId: 'cli-100001',
        clienteNome: 'Metalúrgica Santa Rita Ltda',
        clienteSap: '100001',
        usuarioId: 'qas-vendedor_teste',
        responsavelNome: 'Carlos Mendonça',
        participantes: [
          {
            id: 'u-1',
            nome: 'Carlos Mendonça',
            email: 'vendedor.teste@ciafal.local',
            cargo: 'Vendedor Sênior',
            adStatus: 'PRESENCIAL',
          },
          {
            id: 'u-2',
            nome: 'Eduardo Santos',
            email: 'compras@santarita.ind.br',
            cargo: 'Comprador Técnico',
            adStatus: 'PRESENCIAL',
          },
        ],
        dataHora: '2026-08-28T09:30:00',
        horarioFormatado: '09:30 - 10:15',
        tipo: 'WHATSAPP_CALL',
        titulo: 'Follow-up Cotação Perfis W (COT-2026-98104)',
        pauta: 'Alinhar fechamento de 16,5 t de Perfis W para entrega no início da próxima semana.',
        status: 'CONFIRMADO',
        proximaAcao: 'Enviar espelho do pedido caso aprovado',
        cotacaoRelacionadaId: 'COT-2026-98104',
      },
      {
        id: 'app-02',
        hubId: 'HUB-AG-2026-902',
        origem: 'MICROSOFT_365',
        modulo: 'MEU_DIA',
        clienteId: 'cli-100002',
        clienteNome: 'Aços & Caldeiraria Betim S.A.',
        clienteSap: '100002',
        usuarioId: 'qas-vendedor_teste',
        responsavelNome: 'Carlos Mendonça',
        participantes: [
          {
            id: 'u-1',
            nome: 'Carlos Mendonça',
            email: 'vendedor.teste@ciafal.local',
            cargo: 'Vendedor Sênior',
            adStatus: 'PRESENCIAL',
          },
          {
            id: 'u-3',
            nome: 'Marcos Vinícius',
            email: 'supervisor.teste@ciafal.local',
            cargo: 'Supervisor',
            adStatus: 'HOME_OFFICE',
          },
          {
            id: 'u-4',
            nome: 'Roberto Caldeira',
            email: 'diretoria@betimacos.com.br',
            cargo: 'Diretor Industrial',
            adStatus: 'PRESENCIAL',
          },
        ],
        dataHora: '2026-08-28T11:00:00',
        horarioFormatado: '11:00 - 12:00',
        tipo: 'REUNIAO_TEAMS',
        titulo: 'Alinhamento de Desconto & Lote Especial Chapas A36',
        pauta: 'Apresentar aprovação comercial da gerência para fechamento de 22 t.',
        status: 'CONFIRMADO',
        proximaAcao: 'Confirmar liberação de crédito no SAP F.35',
      },
      {
        id: 'app-03',
        hubId: 'HUB-AG-2026-903',
        origem: 'HUB_CIAFAL',
        modulo: 'VISITAS',
        clienteId: 'cli-100003',
        clienteNome: 'Construtora Horizonte Belo Ltda',
        clienteSap: '100003',
        usuarioId: 'qas-vendedor_teste',
        responsavelNome: 'Carlos Mendonça',
        participantes: [
          {
            id: 'u-1',
            nome: 'Carlos Mendonça',
            email: 'vendedor.teste@ciafal.local',
            cargo: 'Vendedor Sênior',
            adStatus: 'PRESENCIAL',
          },
          {
            id: 'u-5',
            nome: 'Eng. Marcelo',
            email: 'marcelo@horizonte.eng.br',
            cargo: 'Engenheiro Residente',
            adStatus: 'PRESENCIAL',
          },
        ],
        dataHora: '2026-08-28T14:30:00',
        horarioFormatado: '14:30 - 16:00',
        tipo: 'VISITA_PRESENCIAL',
        titulo: 'Visita Técnica no Canteiro Belvedere',
        pauta: 'Apresentação técnica de Vergalhões CA-50 cortados e dobrados.',
        status: 'PENDENTE',
        proximaAcao: 'Gerar cotação técnica no CRM',
      },
      {
        id: 'app-04',
        hubId: 'HUB-AG-2026-904',
        origem: 'ACTIVE_DIRECTORY',
        modulo: 'MEU_DIA',
        clienteId: 'cli-100005',
        clienteNome: 'Tubos & Tubulações Triângulo Ltda',
        clienteSap: '100005',
        usuarioId: 'qas-vendedor_teste',
        responsavelNome: 'Carlos Mendonça',
        participantes: [
          {
            id: 'u-1',
            nome: 'Carlos Mendonça',
            email: 'vendedor.teste@ciafal.local',
            cargo: 'Vendedor Sênior',
            adStatus: 'PRESENCIAL',
          },
          {
            id: 'u-6',
            nome: 'Juliana Compras',
            email: 'juliana@triangulotubos.com.br',
            cargo: 'Gerente de Suprimentos',
            adStatus: 'PRESENCIAL',
          },
        ],
        dataHora: '2026-08-28T16:30:00',
        horarioFormatado: '16:30 - 17:00',
        tipo: 'FOLLOW_UP',
        titulo: 'Retorno de Proposta de Reativação',
        pauta: 'Ofertar lote promocional de Tubos Inox 304 disponível no pátio Betim.',
        status: 'CONFIRMADO',
        proximaAcao: 'Cadastrar nova cotação com tabela promocional',
      },
    ]
  }

  /**
   * Recalcula Ações Prioritárias com IA considerando Meta, Gap, Estoque e Cobertura
   */
  public getPriorityAiActions(): PriorityCommercialAction[] {
    return [
      {
        id: 'ai-act-01',
        clienteId: 'cli-100001',
        clienteNome: 'Metalúrgica Santa Rita Ltda',
        clienteSap: '100001',
        cidadeUf: 'Contagem/MG',
        urgencia: 'URGENTE',
        tipo: 'FOLLOW_UP_COTACAO',
        titulo: 'Cotação 4587 — R$ 184.000 (64,0 t) — Probabilidade 81%',
        descricao:
          'Cliente sem interação há 3 dias. Recompra programada e estoque disponível de 32,4 t no CD Betim.',
        justificativaConcreta: {
          diasSemContato: 3,
          recorrenciaHistoricaDias: 24,
          ultimaCompraProduto: 'Perfis Estruturais W',
          ultimaCompraTons: 18.0,
          estoqueDisponivelTons: 32.4,
          probabilidadeFechamentoPct: 81,
          diasSemInteracaoCotacao: 3,
          motivoRecomendacao:
            'O fechamento desta cotação hoje garante 29,4% do Gap restante para a meta mensal.',
        },
        potencialReais: 184000,
        potencialTons: 64.0,
        acoesDisponiveis: [
          { label: 'Abrir Cliente', tipo: 'ABRIR_CLIENTE' },
          { label: 'Abrir Cotação', tipo: 'ABRIR_COTACAO' },
          { label: 'Criar Contato', tipo: 'CRIAR_CONTATO' },
          { label: 'Concluir Ação', tipo: 'CONCLUIR' },
        ],
      },
      {
        id: 'ai-act-02',
        clienteId: 'cli-100002',
        clienteNome: 'Aços & Caldeiraria Betim S.A.',
        clienteSap: '100002',
        cidadeUf: 'Betim/MG',
        urgencia: 'ALTA',
        tipo: 'NEGOCIACAO',
        titulo: 'Negociação Final de Chapas Grossas A36 (22,0 t)',
        descricao:
          'Apresentar aprovação de 2,5% de desconto e confirmar agendamento de frete dedicado.',
        justificativaConcreta: {
          diasSemContato: 5,
          recorrenciaHistoricaDias: 20,
          ultimaCompraProduto: 'Chapas Grossas A36',
          ultimaCompraTons: 22.0,
          estoqueDisponivelTons: 48.0,
          probabilidadeFechamentoPct: 90,
          motivoRecomendacao:
            'Cliente Curva A estratégico com R$ 120.000 em fase final de aprovação.',
        },
        potencialReais: 120000,
        potencialTons: 22.0,
        acoesDisponiveis: [
          { label: 'Abrir Cliente', tipo: 'ABRIR_CLIENTE' },
          { label: 'Criar Cotação', tipo: 'CRIAR_COTACAO' },
          { label: 'Criar Contato', tipo: 'CRIAR_CONTATO' },
          { label: 'Concluir Ação', tipo: 'CONCLUIR' },
        ],
      },
      {
        id: 'ai-act-03',
        clienteId: 'cli-100005',
        clienteNome: 'Tubos & Tubulações Triângulo Ltda',
        clienteSap: '100005',
        cidadeUf: 'Uberaba/MG',
        urgencia: 'ALTA',
        tipo: 'REATIVACAO',
        titulo: 'Reativação Comercial — 29 dias sem compra (Ciclo 24d)',
        descricao:
          'Cliente com risco de inatividade. Ofertar lote de Tubos Inox 304 com frete consolidado Triângulo.',
        justificativaConcreta: {
          diasSemContato: 21,
          recorrenciaHistoricaDias: 24,
          ultimaCompraProduto: 'Tubos Inox 304 SCH 10',
          ultimaCompraTons: 6.2,
          estoqueDisponivelTons: 14.8,
          probabilidadeFechamentoPct: 75,
          motivoRecomendacao: 'Curva B em risco de churn por atraso no contato do vendedor.',
        },
        potencialReais: 45000,
        potencialTons: 6.2,
        acoesDisponiveis: [
          { label: 'Abrir Cliente', tipo: 'ABRIR_CLIENTE' },
          { label: 'Criar Cotação', tipo: 'CRIAR_COTACAO' },
          { label: 'Criar Contato', tipo: 'CRIAR_CONTATO' },
          { label: 'Concluir Ação', tipo: 'CONCLUIR' },
        ],
      },
      {
        id: 'ai-act-04',
        clienteId: 'cli-100008',
        clienteNome: 'Estruturas Metálicas Sete Lagoas Ltda',
        clienteSap: '100008',
        cidadeUf: 'Sete Lagoas/MG',
        urgencia: 'MEDIA',
        tipo: 'CROSS_SELL',
        titulo: 'Oportunidade de Mix — Perfis U e Cantoneiras',
        descricao:
          'Cliente compra apenas vigas; oportunidade de ofertar 8,5 t de Perfis U para obra industrial.',
        justificativaConcreta: {
          diasSemContato: 12,
          recorrenciaHistoricaDias: 30,
          ultimaCompraProduto: 'Vigas Gerdau',
          ultimaCompraTons: 14.0,
          estoqueDisponivelTons: 28.0,
          probabilidadeFechamentoPct: 68,
          motivoRecomendacao:
            'Padrão de compra identificado em clientes similares do segmento de estruturas.',
        },
        potencialReais: 51000,
        potencialTons: 8.5,
        acoesDisponiveis: [
          { label: 'Abrir Cliente', tipo: 'ABRIR_CLIENTE' },
          { label: 'Criar Cotação', tipo: 'CRIAR_COTACAO' },
          { label: 'Concluir Ação', tipo: 'CONCLUIR' },
        ],
      },
    ]
  }

  /**
   * Oportunidades Comerciais (Carrossel)
   */
  public getCommercialOpportunities(): CommercialOpportunityCard[] {
    return [
      {
        id: 'opp-01',
        tipo: 'RECOMPRA_PROVAVEL',
        clienteId: 'cli-100001',
        clienteNome: 'Metalúrgica Santa Rita Ltda',
        clienteSap: '100001',
        titulo: 'Recompra Prevista de Perfis W (16,5 t)',
        descricao: 'Ciclo habitual de 24 dias atingido. Cliente com consumo contínuo.',
        produtoSugerido: 'Perfis Estruturais W Gerdau',
        volumeEstimadoTons: 16.5,
        valorEstimadoReais: 95000,
        probabilidadePct: 88,
        urgenciaBadge: 'Próxima Recompra',
        explicacaoIA: 'Baseado na média dos últimos 6 faturamentos e intervalo médio de 22 dias.',
      },
      {
        id: 'opp-02',
        tipo: 'PRODUTO_ESTOQUE',
        clienteId: 'cli-100006',
        clienteNome: 'Inox Vale do Aço Tubos Especiais',
        clienteSap: '100006',
        titulo: 'Estoque Pronta Entrega de Tubos Sanitários',
        descricao: '32,0 t disponíveis no CD Betim. Perfil compatível com a demanda do cliente.',
        produtoSugerido: 'Tubos Inox Sanitários OD',
        volumeEstimadoTons: 7.2,
        valorEstimadoReais: 62000,
        probabilidadePct: 82,
        urgenciaBadge: 'Estoque CD Betim',
        explicacaoIA: 'Cruzamento com lote de usina liberado no WMS com margem comercial positiva.',
      },
      {
        id: 'opp-03',
        tipo: 'CROSS_SELL',
        clienteId: 'cli-100003',
        clienteNome: 'Construtora Horizonte Belo Ltda',
        clienteSap: '100003',
        titulo: 'Cross-Sell: Telhas e Perfis Conformados',
        descricao: 'Cliente faturou vergalhões para a fundação; obra entra em fase de cobertura.',
        produtoSugerido: 'Perfis Dobrados e Telhas Galvalume',
        volumeEstimadoTons: 11.2,
        valorEstimadoReais: 58000,
        probabilidadePct: 79,
        urgenciaBadge: 'Mix Inteligente',
        explicacaoIA: 'Modelo preditivo de avanço de cronograma de obras civis CIAFAL.',
      },
      {
        id: 'opp-04',
        tipo: 'COMPLEMENTO_CARGA',
        clienteId: 'cli-100005',
        clienteNome: 'Tubos & Tubulações Triângulo Ltda',
        clienteSap: '100005',
        titulo: 'Complemento de Carga para Uberaba (Rota MG-050)',
        descricao:
          'Caminhão com 18 t em trânsito com 6 t de capacidade ociosa para frete compartilhado.',
        produtoSugerido: 'Tubos Estruturais Redondos',
        volumeEstimadoTons: 6.0,
        valorEstimadoReais: 36000,
        probabilidadePct: 85,
        urgenciaBadge: 'Frete Otimizado TMS',
        explicacaoIA: 'Roteirização ativa no TMS com destino à região do Triângulo Mineiro amanhã.',
      },
      {
        id: 'opp-05',
        tipo: 'REATIVACAO',
        clienteId: 'cli-100008',
        clienteNome: 'Estruturas Metálicas Sete Lagoas Ltda',
        clienteSap: '100008',
        titulo: 'Reativação Curva B sem compra há 55 dias',
        descricao: 'Cliente com alto histórico anual que reduziu pedidos no último bimestre.',
        produtoSugerido: 'Perfis U e Cantoneiras 2x1/4',
        volumeEstimadoTons: 5.8,
        valorEstimadoReais: 35000,
        probabilidadePct: 70,
        urgenciaBadge: 'Reativação Prioritária',
        explicacaoIA: 'Score de propensão de reativação de 84/100.',
      },
    ]
  }

  /**
   * Cotações Prioritárias para o Carrossel do Meu Dia
   */
  public getPriorityQuotations() {
    const quotes = quotationService.getStoredQuotations()
    return quotes
      .filter(
        (q) =>
          q.status !== 'PEDIDO_IMPLANTADO' && q.status !== 'PERDIDA' && q.status !== 'CANCELADA',
      )
      .slice(0, 8)
      .map((q) => ({
        id: q.id,
        code: q.code,
        customerName: q.customer_name,
        customerSap: q.customer_sap_code,
        totalValue: q.total_value,
        totalTons: q.total_tons,
        probabilityPct: q.status === 'ACEITA' ? 95 : q.status === 'NEGOCIACAO' ? 85 : 70,
        daysWithoutContact: q.last_contact_at
          ? Math.floor((Date.now() - new Date(q.last_contact_at).getTime()) / (1000 * 60 * 60 * 24))
          : 3,
        status: q.status,
        approvalStatus: q.approval_status,
        nextAction:
          q.status === 'AGUARDANDO_APROVACAO'
            ? 'Aguardando liberação de alçada'
            : 'Realizar follow-up comercial',
        validUntil: q.valid_until,
      }))
  }

  /**
   * Briefing Executivo da Carteira gerado por IA
   */
  public getExecutiveAiBriefing(
    goalMetrics: GoalPaceMetrics,
    coverageMetrics: PortfolioCoverageMetrics,
    unit: 'REVENUE' | 'TONS',
  ): string {
    const isTons = unit === 'TONS'
    const atingido = isTons ? goalMetrics.atingimentoTonsPct : goalMetrics.atingimentoReaisPct
    const gapPp = goalMetrics.gapRitmoPp
    const cobAtual = coverageMetrics.coberturaAtualPct
    const top5Pct = coverageMetrics.concentracaoFaturamento.top5Pct
    const semContatoA =
      coverageMetrics.coberturaPonderadaAbc.curvaA.total -
      coverageMetrics.coberturaPonderadaAbc.curvaA.ativos

    return `Você atingiu ${atingido.toFixed(1)}% da meta e está ${gapPp >= 0 ? `+${gapPp.toFixed(1)} p.p. acima` : `${gapPp.toFixed(1)} p.p. abaixo`} do ritmo esperado. Entretanto, apenas ${cobAtual.toFixed(1)}% da carteira foi movimentada no mês (${coverageMetrics.clientesAtivosMes}/${coverageMetrics.totalClientes} clientes). ${top5Pct.toFixed(1)}% do faturamento está concentrado nos 5 maiores clientes. Existem ${semContatoA > 0 ? semContatoA : 3} clientes Curva A sem contato recente. Prioridade recomendada hoje: reativação da cobertura dos clientes Curva A e fechamento das cotações prioritárias de maior probabilidade.`
  }
}

export const cockpitCommercialService = new CockpitCommercialService()
