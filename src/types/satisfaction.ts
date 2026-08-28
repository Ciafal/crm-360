// Tipos e Modelos para o Módulo de Satisfação de Clientes & Motor ISC CIAFAL

export type ISCBand = 'EXCELENTE' | 'SATISFEITO' | 'ATENCAO' | 'RISCO' | 'CRITICO'

export interface ISCBandConfig {
  band: ISCBand
  label: string
  min: number
  max: number
  color: string
  badgeClass: string
  bgClass: string
  borderClass: string
  textClass: string
}

export interface ISCPesosConfig {
  qualidade: number // 25%
  logistica: number // 25%
  comercial: number // 20%
  financeiro: number // 15%
  pesquisa: number // 15%
}

export interface ISCPesoHistoryEntry {
  id: string
  updatedAt: string
  updatedBy: string
  userRole: string
  motivo: string
  pesosAnteriores: ISCPesosConfig
  pesosNovos: ISCPesosConfig
}

export interface ISCSegmentWeights {
  id: string
  segmento: string
  mercado?: string
  regiao?: string
  porte?: string
  pesos: ISCPesosConfig
  ativo: boolean
}

// 5 Dimensões Compostas do ISC
export interface QualidadeDimensionData {
  score: number // 0-100
  reclamacoesAbertas: number
  reclamacoesEncerradas: number
  reclamacoesReincidentes: number
  gravidadeMedia: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  naoConformidades: number
  devolucoesQtd: number
  devolucoesTons: number
  desviosProcesso: number
  retrabalhosQtd: number
  tempoMedioRespostaHoras: number
  tempoMedioResolucaoDias: number
  eficaciaAcaoCorretivaPct: number
  fatoresDetalhados: string[]
}

export interface LogisticaDimensionData {
  score: number // 0-100
  entregasNoPrazoPct: number // OTIF / On-Time
  otifPct: number
  diferencaDataDesejadaEntregueDias: number
  totalEntregasPeriodo: number
  entregasAtrasadas: number
  entregasCargaParcial: number
  reentregasQtd: number
  avariasTransporteQtd: number
  ocorrenciasTMS: number
  tempoMedioTransporteHoras: number
  divergenciaQuantidadeQtd: number
  transportadorasPrincipais: string[]
  eventosTMSUltimos: string[]
  fatoresDetalhados: string[]
}

export interface ComercialDimensionData {
  score: number // 0-100
  diasUltimoContato: number
  frequenciaContatoDias: number
  visitasRealizadasUltimos90d: number
  ligacoesUltimos30d: number
  whatsAppInteracoes30d: number
  emailsEnviados30d: number
  tarefasRealizadas: number
  tarefasVencidas: number
  cotacoesAbertas: number
  cotacoesConvertidas: number
  taxaConversaoCotacoesPct: number
  pedidosEmCarteiraQtd: number
  pedidosEmCarteiraTons: number
  frequenciaCompraDias: number
  diasSemCompra: number
  variacaoVolumePct: number // Queda ou ganho
  perdaMixHistorico: boolean
  produtosAbandonadosCount: number
  produtosAbandonadosNomes: string[]
  fatoresDetalhados: string[]
}

export interface FinanceiroDimensionData {
  score: number // 0-100
  comportamentoPagamento: 'PONTUAL' | 'ATRASOS_LEVES' | 'REINCIDENTE' | 'CRITICO'
  atrasoMedioDias: number
  titulosVencidosQtd: number
  titulosVencidosValor: number
  renegociacoesUltimos12m: number
  bloqueiosCreditoHistorico: number
  statusCreditoAtual: 'LIBERADO' | 'RESTRITO' | 'BLOQUEADO'
  limiteCredito: number
  creditoUtilizado: number
  creditoDisponivel: number
  reavaliacoesCreditoPendentes: boolean
  fatoresDetalhados: string[]
}

export interface PesquisaDimensionData {
  score: number // 0-100
  npsScore: number // 0-10
  npsZone: 'PROMOTOR' | 'NEUTRO' | 'DETRATOR'
  csatGeral: number // 1-5
  csatProduto: number // 1-5
  csatComercial: number // 1-5
  csatEntrega: number // 1-5
  totalPesquisasRespondidas: number
  ultimaPesquisaData: string
  canalUltimaResposta: 'WhatsApp' | 'E-mail' | 'Link' | 'Manual' | 'Presencial'
  comentariosRecentes: string[]
  fatoresDetalhados: string[]
}

// Histórico do ISC
export interface ISCHistoryPoint {
  data: string
  periodo: string // ex: "Mai/24", "Jun/24"
  isc: number
  qualidade: number
  logistica: number
  comercial: number
  financeiro: number
  pesquisa: number
  eventoRelevante?: string
}

// Timeline Unificada Multissistema
export interface TimelineClienteEvent {
  id: string
  dataHora: string
  sistemaOrigem: 'SAP ECC' | 'TMS' | 'WMS' | 'SAC / Qualidade' | 'CRM 360' | 'Portal Pesquisas'
  tipo:
    | 'PEDIDO_FATURADO'
    | 'CARGA_ATRASADA'
    | 'ENTREGA_CONCLUIDA'
    | 'RECLAMACAO_ABERTA'
    | 'RESPOSTA_QUALIDADE'
    | 'CONTATO_VENDEDOR'
    | 'TAREFA_CRIADA'
    | 'COTACAO_EMITIDA'
    | 'PESQUISA_RESPONDIDA'
    | 'PLANO_RECUPERACAO_CRIADO'
  titulo: string
  descricao: string
  usuario?: string
  status?: string
  impactoISC?: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO'
}

// Alertas de Deterioração
export interface AlertaDeterioracao {
  id: string
  tipo:
    | 'QUEDA_ISC'
    | 'QUEDA_VOLUME'
    | 'PERDA_MIX'
    | 'ABANDONO_PRODUTO'
    | 'SEM_CONTATO'
    | 'SEM_COMPRA'
    | 'RECLAMACAO_REINCIDENTE'
    | 'ATRASO_LOGISTICO'
    | 'PROBLEMA_FINANCEIRO'
    | 'TAREFAS_VENCIDAS'
    | 'DIVERGENCIA_PESQUISA'
  nivel: 'PREVENTIVO' | 'ATENCAO' | 'CRITICO'
  mensagem: string
  fatos: string[]
  dataIdentificacao: string
  resolvido: boolean
}

// Análise Estruturada por IA
export interface AIAnalysisResult {
  clienteId: string
  clienteNome: string
  geradoEm: string
  situacaoAtual: string
  oQueMudou: string
  fatos: string[]
  hipoteses: string[]
  recomendacoes: string[]
  possiveisCausas: string[]
  riscosIdentificados: string[]
  oportunidadesIdentificadas: string[]
  prioridadeAcao: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA'
  proximaMelhorAcao: {
    acao: string
    tipoAcao:
      | 'LIGAR_CLIENTE'
      | 'AGENDAR_VISITA'
      | 'RESPONDER_RECLAMACAO'
      | 'SOLICITAR_RETORNO_QUALIDADE'
      | 'CONSULTAR_TMS'
      | 'VERIFICAR_ATRASO'
      | 'AVALIAR_CREDITO'
      | 'OFERECER_SUBSTITUTO'
      | 'RECUPERAR_MIX_ESTOQUE'
      | 'GERAR_COTACAO'
      | 'ABRIR_PLANO_RECUPERACAO'
      | 'ESCALAR_GESTOR'
    justificativa: string
    prazoSugeridoDias: number
    estoqueConexo?: {
      produtoCodigo: string
      produtoDescricao: string
      saldoDisponivelTons: number
      precoMedioSugeridoKg: number
    }
  }
}

// Ficha 360 do Cliente para Satisfação
export interface ClienteSatisfacao360 {
  id: string
  sapCode: string
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  segmento: string
  subsegmento?: string
  regiao: string
  cidade: string
  uf: string
  vendedorId: string
  vendedorNome: string
  gestorNome: string
  equipe: string
  classificacaoCliente: 'A' | 'B' | 'C' | 'Estratégico'

  // Financeiro & Volume YTD
  faturamentoYTD: number
  faturamentoMesAnterior: number
  volumeYTD: number
  volumeMesAnterior: number

  // ISC Atual e Variação
  iscAtual: number
  iscAnterior: number
  iscVariacao: number
  faixaISC: ISCBand
  tendencia: 'Melhorando' | 'Estável' | 'Piorando'
  riscoChurnPct: number

  // Valor Estratégico Matriz 2x2
  scoreValorEstrategico: number // 0-100
  quadranteMatriz:
    | 'PROTEGER' // Alto Valor + Alta Satisfação
    | 'PRIORIDADE_MAXIMA' // Alto Valor + Baixa Satisfação
    | 'MANUTENCAO' // Baixo Valor + Alta Satisfação
    | 'REAVALIAR' // Baixo Valor + Baixa Satisfação

  // Dimensões Compostas
  dimensaoQualidade: QualidadeDimensionData
  dimensaoLogistica: LogisticaDimensionData
  dimensaoComercial: ComercialDimensionData
  dimensaoFinanceiro: FinanceiroDimensionData
  dimensaoPesquisa: PesquisaDimensionData

  // Fatores de Explicabilidade
  impactosPositivos: string[]
  impactosNegativos: string[]

  // Alertas e Timeline
  alertas: AlertaDeterioracao[]
  timeline: TimelineClienteEvent[]
  historicoISC: ISCHistoryPoint[]

  // Conexão com Plano e Análise IA
  possuiPlanoRecuperacaoAtivo: boolean
  planoRecuperacaoId?: string
  analiseIA?: AIAnalysisResult

  // Divergência Pesquisa vs Comportamento
  temDivergenciaPesquisaComportamento: boolean
  divergenciaDescricao?: string

  // Metadados de Origem de Dados & Mocks
  is_mock: boolean
  sistemaOrigemInfo: {
    sapEccSync: string
    tmsSync: string
    wmsSync: string
    qualidadeSync: string
    pesquisaSync: string
  }
}

// Plano de Recuperação do Cliente
export type PlanoRecuperacaoStatus =
  | 'ABERTO'
  | 'EM_ANALISE'
  | 'PLANO_DEFINIDO'
  | 'EM_EXECUCAO'
  | 'MONITORAMENTO'
  | 'EFICAZ'
  | 'INEFICAZ'
  | 'ENCERRADO'

export interface PlanoRecuperacao {
  id: string
  clienteId: string
  clienteNome: string
  clienteSap: string
  vendedorId: string
  vendedorNome: string
  gestorNome: string
  status: PlanoRecuperacaoStatus
  criadoEm: string
  atualizadoEm: string
  prazoFinal: string

  // Campos Estruturados
  problemaIdentificado: string
  situacaoAtual: string
  evidenciasFatos: string[]
  causaRaiz: string
  acoesPropostas: {
    id: string
    descricao: string
    responsavel: string
    areaEnvolvida: 'Comercial' | 'Logística' | 'Qualidade' | 'Financeiro' | 'Diretoria'
    prazo: string
    concluida: boolean
    dataConclusao?: string
    resultadoObservado?: string
    evidencia?: string
  }[]
  resultadoEsperado: string
  areaPrincipalEnvolvida:
    | 'Comercial'
    | 'Logística'
    | 'Qualidade'
    | 'Financeiro'
    | 'Multidisciplinar'

  // Eficácia e Auditoria
  iscNoMomentoCriacao: number
  iscAtual: number
  variacaoISC: number
  volumeRecuperadoTons?: number
  novasComprasRealizadas: boolean
  reincidenciaOcorrencia: boolean
  conclusaoEficacia?: string
  historicoExecucoes: {
    data: string
    responsavel: string
    acao: string
    resultado: string
    observacao?: string
    evidencia?: string
    proximaAcao?: string
  }[]
  is_mock: boolean
}

// Pesquisa de Satisfação (Questionário & Configurações)
export interface PerguntaPesquisa {
  id: string
  ordem: number
  tipo: 'NPS' | 'RATING_1_5' | 'TEXTO_LIVRE' | 'MULTIPLA_ESCOLHA'
  titulo: string
  dimensaoAlvo: 'GERAL' | 'QUALIDADE' | 'COMERCIAL' | 'ENTREGA'
  obrigatoria: boolean
  ativa: boolean
}

export interface CampanhaPesquisa {
  id: string
  titulo: string
  publicoAlvo: string
  periodoInicio: string
  periodoFim: string
  status: 'RASCUNHO' | 'ATIVA' | 'ENCERRADA'
  totalEnviadas: number
  totalRespondidas: number
  taxaRespostaPct: number
  npsMedio: number
  csatMedio: number
  perguntas: PerguntaPesquisa[]
  is_mock: boolean
}

export interface RespostaPesquisaCliente {
  id: string
  campanhaId: string
  clienteId: string
  clienteNome: string
  clienteSap: string
  dataResposta: string
  canal: 'WhatsApp' | 'E-mail' | 'Link' | 'Manual'
  respondenteNome: string
  respondenteCargo: string
  npsScore: number // 0-10
  qualidadeProdutoRating: number // 1-5
  atendimentoComercialRating: number // 1-5
  prazoEntregaRating: number // 1-5
  atendimentoGeralRating: number // 1-5
  comentariosLivres: string
  divergenciaDetectada: boolean
  divergenciaMotivo?: string
  is_mock: boolean
}

// Matriz de Auditoria
export interface SatisfactionAuditLog {
  id: string
  dataHora: string
  usuarioId: string
  usuarioNome: string
  usuarioRole: string
  tipoAcao:
    | 'ALTERACAO_PESOS_ISC'
    | 'ALTERACAO_FAIXAS_ISC'
    | 'CRIACAO_PLANO_RECUPERACAO'
    | 'EXECUCAO_ACAO_PLANO'
    | 'CRIACAO_TAREFA_SATISFACAO'
    | 'ENVIO_PESQUISA'
    | 'RESPOSTA_PESQUISA_REGISTRADA'
    | 'ANALISE_IA_EXECUTADA'
    | 'EXPORTACAO_DADOS'
  detalhes: string
  clienteId?: string
  clienteNome?: string
}

// Dados Preparatórios para a Futura Gestão de Performance do Vendedor
export interface PerformanceSellerReadiness {
  vendedorId: string
  vendedorNome: string
  alertasRecebidosCount: number
  alertasTratadosCount: number
  tempoMedioTratamentoAlertasDias: number
  clientesCriticosAtendidosCount: number
  tarefasSatisfacaoExecutadasCount: number
  tarefasSatisfacaoVencidasCount: number
  clientesRecuperadosCount: number
  clientesPerdidosCount: number
  evolucaoIscCarteiraMedia: number
  oportunidadesEstoqueGeradas: number
  oportunidadesEstoqueConvertidas: number
  is_mock: boolean
}
