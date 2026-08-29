// Tipos consolidados para o Cockpit Comercial "Meu Dia" - CRM 360º CIAFAL
import type { ABCCategory } from '@/types/models'

export type CommercialUnit = 'REVENUE' | 'TONS' // 'REVENUE' = R$, 'TONS' = t

export interface CustomerPortfolioDetail {
  id: string
  sapCode: string
  razaoSocial: string
  nomeFantasia: string
  cidade: string
  uf: string
  regiao: string
  vendedorId: string
  vendedorNome: string
  abc: ABCCategory
  ultimaCompraData: string
  ultimoPedidoData: string
  ultimoFaturamentoData: string
  ultimoContatoData: string
  ultimoContatoCanal: 'WhatsApp' | 'Telefone' | 'E-mail' | 'Visita'
  diasSemContato: number
  diasSemCompra: number
  frequenciaHistoricaDias: number
  faturamentoMtd: number
  faturamentoYtd: number
  volumeMtdTons: number
  volumeYtdTons: number
  ticketMedio: number
  pedidosEmCarteira: number
  cotacoesAbertas: number
  limiteCredito: number
  creditoDisponivel: number
  oitfPct: number
  satisfacaoIsc: number
  probabilidadeRecompra: number // 0-100%
  produtoHistoricoPrincipal: string
  produtosSugeridos: {
    codigo: string
    descricao: string
    motivo: string
    estoqueTons: number
  }[]
  proximaAcaoSugeridaIA: {
    prioridade: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA'
    acao: string
    justificativa: string
    prazoSugerido: string
  }
  statusAtividadeMes: {
    comPedido: boolean
    comFaturamento: boolean
    comContato: boolean
    comCotacao: boolean
    isAtivoMes: boolean // Cliente Único ativo
  }
}

export interface PortfolioCoverageMetrics {
  totalClientes: number
  clientesAtivosMes: number // Clientes únicos com atividade
  comPedido: number
  comFaturamento: number
  comContato: number
  semMovimentacaoMes: number
  coberturaAtualPct: number
  metaCoberturaPct: number
  gapCoberturaPp: number
  coberturaPonderadaAbc: {
    curvaA: {
      total: number
      ativos: number
      coberturaPct: number
      metaPct: number
      cadenciaAlvoDias: number
    }
    curvaB: {
      total: number
      ativos: number
      coberturaPct: number
      metaPct: number
      cadenciaAlvoDias: number
    }
    curvaC: {
      total: number
      ativos: number
      coberturaPct: number
      metaPct: number
      cadenciaAlvoDias: number
    }
  }
  saudeCarteira: {
    status: 'SAUDÁVEL' | 'ATENÇÃO' | 'RISCO'
    motivoClassificacao: string
    fatores: {
      nome: string
      valor: string
      status: 'ok' | 'alerta' | 'critico'
    }[]
  }
  concentracaoFaturamento: {
    top1Pct: number
    top3Pct: number
    top5Pct: number
    top10Pct: number
    top1TonsPct: number
    top3TonsPct: number
    top5TonsPct: number
    top10TonsPct: number
    alertaConcentracaoIA?: string
  }
  historicoCobertura: {
    mesAnteriorPct: number
    mediaUltimos3MesesPct: number
    mediaYtdPct: number
    tendencia: 'ALTA' | 'ESTAVEL' | 'BAIXA'
    contextoIA: string
  }
}

export interface GoalPaceMetrics {
  metaReais: number
  realizadoReais: number
  gapReais: number
  atingimentoReaisPct: number

  metaTons: number
  realizadoTons: number
  gapTons: number
  atingimentoTonsPct: number

  diasUteisTotais: number
  diasUteisTranscorridos: number
  diasUteisRestantes: number

  metaEsperadaNaDataPct: number
  gapRitmoPp: number // Diferença em p.p. vs esperado

  ritmoAtualReaisDia: number
  ritmoNecessarioReaisDia: number
  ritmoAtualTonsDia: number
  ritmoNecessarioTonsDia: number
  ritmoStatus: 'ACIMA_DO_RITMO' | 'NO_RITMO' | 'ABAIXO_DO_RITMO'

  projecaoLinearReais: number
  projecaoLinearTons: number
  previsaoIaReais: number
  previsaoIaTons: number
  projecaoIaAtingimentoPct: number
  analiseSazonalidadeIa: string
}

export interface OitfDeviationItem {
  id: string
  pedidoSap: string
  itemSap: string
  clienteId: string
  clienteNome: string
  produtoCodigo: string
  produtoDescricao: string
  quantidadePedidaTons: number
  quantidadeEntregueTons: number
  dataSolicitada: string
  dataPrometida: string
  dataExpedida: string
  dataEntregue?: string
  entregaCompleta: boolean
  entregaNoPrazo: boolean
  isOitfOk: boolean
  motivoDesvio?:
    | 'FALTA_ESTOQUE'
    | 'ATRASO_PRODUCAO'
    | 'ERRO_PROGRAMACAO'
    | 'BLOQUEIO_CREDITO'
    | 'INDISPONIBILIDADE_VEICULO'
    | 'ATRASO_TRANSPORTADORA'
    | 'ATRASO_EXPEDICAO'
    | 'PEDIDO_FRACIONADO'
    | 'ALTERACAO_CLIENTE'
    | 'PROBLEMA_COMERCIAL'
    | 'PROBLEMA_OPERACIONAL'
    | 'OUTROS'
  causaProvavelIA: string
  fontesCruzadas: {
    sapEcc: string
    crm: string
    pcpRobotizado: string
    wms: string
    tms: string
  }
  fluxoEvidencia: {
    dado: string
    analise: string
    hipotese: string
    evidencia: string
    recomendacao: string
  }
}

export interface OitfMetrics {
  atualPct: number
  metaPct: number
  gapPp: number
  tendencia: 'ALTA' | 'ESTAVEL' | 'BAIXA'
  mesAnteriorPct: number
  mediaYtdPct: number
  desviosRecentes: OitfDeviationItem[]
}

export interface HubCorporateAppointment {
  id: string
  hubId: string
  origem: 'HUB_CIAFAL' | 'CRM_360' | 'MICROSOFT_365' | 'ACTIVE_DIRECTORY'
  modulo: 'MEU_DIA' | 'VISITAS' | 'COTACOES' | 'CLIENTE_360'
  clienteId: string
  clienteNome: string
  clienteSap: string
  usuarioId: string
  responsavelNome: string
  participantes: {
    id: string
    nome: string
    email: string
    cargo: string
    adStatus?: 'PRESENCIAL' | 'HOME_OFFICE' | 'FERIAS' | 'AFASTADO' | 'INDISPONIVEL'
  }[]
  dataHora: string // ISO
  horarioFormatado: string
  tipo:
    | 'VISITA_PRESENCIAL'
    | 'REUNIAO_TEAMS'
    | 'WHATSAPP_CALL'
    | 'LIGACAO'
    | 'FOLLOW_UP'
    | 'RETORNO_COTACAO'
    | 'TAREFA'
  titulo: string
  pauta: string
  status: 'CONFIRMADO' | 'PENDENTE' | 'REALIZADO' | 'REAGENDADO' | 'CANCELADO'
  resultado?: string
  proximaAcao?: string
  cotacaoRelacionadaId?: string
}

export interface PriorityCommercialAction {
  id: string
  clienteId: string
  clienteNome: string
  clienteSap: string
  cidadeUf: string
  urgencia: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA'
  tipo:
    | 'REATIVACAO'
    | 'FOLLOW_UP_COTACAO'
    | 'NEGOCIACAO'
    | 'CROSS_SELL'
    | 'RISCO_CHURN'
    | 'COMPLEMENTO_CARGA'
  titulo: string
  descricao: string
  justificativaConcreta: {
    diasSemContato: number
    recorrenciaHistoricaDias: number
    ultimaCompraProduto: string
    ultimaCompraTons: number
    estoqueDisponivelTons: number
    probabilidadeFechamentoPct?: number
    diasSemInteracaoCotacao?: number
    motivoRecomendacao: string
  }
  potencialReais: number
  potencialTons: number
  acoesDisponiveis: {
    label: string
    tipo: 'ABRIR_CLIENTE' | 'CRIAR_CONTATO' | 'CRIAR_COTACAO' | 'ABRIR_COTACAO' | 'CONCLUIR'
  }[]
  concluida?: boolean
}

export interface CommercialOpportunityCard {
  id: string
  tipo:
    | 'RECOMPRA_PROVAVEL'
    | 'CROSS_SELL'
    | 'CLIENTE_SEM_COMPRA'
    | 'PRODUTO_ESTOQUE'
    | 'COMPLEMENTO_CARGA'
    | 'REATIVACAO'
    | 'COTACAO_ESQUECIDA'
  clienteId: string
  clienteNome: string
  clienteSap: string
  titulo: string
  descricao: string
  produtoSugerido?: string
  volumeEstimadoTons: number
  valorEstimadoReais: number
  probabilidadePct: number
  urgenciaBadge: string
  explicacaoIA: string
}
