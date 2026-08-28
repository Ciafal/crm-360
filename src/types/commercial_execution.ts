// src/types/commercial_execution.ts
// Tipagem completa para o Motor de Execução Comercial Inteligente CRM 360 CIAFAL

export type ActionOriginType =
  | 'quem_devo_contatar'
  | 'sem_compra'
  | 'sem_cobertura'
  | 'clientes_em_risco'
  | 'estoque_parado'
  | 'cross_sell'
  | 'oportunidades'
  | 'central_acoes_ia'
  | 'radar_gestao'

export type PriorityLevel = 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA'

export type FitScore = 'MUITO_ALTA' | 'ALTA' | 'MEDIA' | 'BAIXA'

export type TaskType =
  | 'whatsapp'
  | 'ligacao'
  | 'email'
  | 'visita'
  | 'envio_catalogo'
  | 'cotacao'
  | 'acompanhamento'
  | 'reativacao'

export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada' | 'vencida'

export type CampaignType =
  | 'reativacao_sem_compra'
  | 'estoque_parado'
  | 'cross_sell'
  | 'lancamento_catalogo'
  | 'resgate_risco'

export type CampaignChannel = 'whatsapp' | 'email' | 'omnichannel'

export type CampaignStatus = 'rascunho' | 'aprovada' | 'em_execucao' | 'pausada' | 'concluida'

export interface TaskHistoryItem {
  data: string
  usuario: string
  campoAlterado: string
  valorAnterior: string
  valorNovo: string
  justificativa?: string
}

export interface CommercialTask {
  id: string
  batchId?: string
  batchName?: string
  clienteId: string
  clienteNome: string
  clienteCidadeUf: string
  clienteSegmento: string
  contatoNome: string
  tipo: TaskType
  dataCriacao: string
  dataPrazo: string
  dataConclusao?: string
  prioridade: PriorityLevel
  responsavelId: string
  responsavelNome: string
  atribuidoPorId: string
  atribuidoPorNome: string
  status: TaskStatus
  mensagemSugeridaIA: string
  produtoSugerido?: {
    codigo: string
    descricao: string
    familia: string
    saldoEstoqueTons?: number
    precoReferenciaKg?: number
  }
  observacao?: string
  origem: ActionOriginType
  campanhaId?: string
  campanhaNome?: string
  cotacaoGeradaId?: string
  oportunidadeGeradaId?: string
  pedidoSapGeradoId?: string
  valorConvertido?: number
  volumeConvertidoTons?: number
  respostaCliente?: {
    data: string
    conteudo: string
    sentimento: 'positivo' | 'negativo' | 'neutro' | 'duvida' | 'cotacao_solicitada'
    canal: 'whatsapp' | 'email' | 'omnichannel'
  }
  historicoAlteracoes?: TaskHistoryItem[]
  is_mock?: boolean
}

export interface BulkTaskBatch {
  id: string
  nome: string
  origem: ActionOriginType
  campanhaId?: string
  criadoEm: string
  prazoOriginal: string
  responsavelId: string
  responsavelNome: string
  totalTarefas: number
  concluidas: number
  pendentes: number
  vencidas: number
  canceladas: number
  conversaoPercent: number
  volumeConvertidoTons: number
  faturamentoConvertido: number
  is_mock?: boolean
}

export interface CampaignMetrics {
  selecionados: number
  enviados: number
  entregues: number
  lidos: number
  respostas: number
  taxaRespostaPct: number
  cotacoesGeradas: number
  pedidosGerados: number
  clientesReativados: number
  taxaReativacaoPct: number
  taxaConversaoPct: number
  volumeTotalTons: number
  faturamentoTotal: number
  estoqueParadoConvertidoTons: number
  estoqueParadoConvertidoValor: number
}

export interface CampaignSuppressionReasons {
  optOut: number
  clienteBloqueado: number
  contatoInvalido: number
  restricaoFrequencia: number
  semAutorizacao: number
}

export interface CampaignAIAnalysis {
  sumario: string
  melhorSegmento: string
  melhorRegiao: string
  melhorProduto: string
  melhorVendedor: string
  clientesAltaIntencao: string[]
  clientesSemResposta: string[]
  proximaAcaoSugerida: string
}

export interface CommercialCampaign {
  id: string
  codigo: string
  titulo: string
  descricao: string
  tipo: CampaignType
  canal: CampaignChannel
  status: CampaignStatus
  segmentoAlvo?: string
  regionalAlvo?: string
  diasSemCompraMin?: number
  diasSemCompraMax?: number
  vendedorId?: string
  vendedorNome?: string
  produtosVinculados: Array<{
    codigo: string
    descricao: string
    familia: string
    estoqueDisponivelTons: number
    precoReferenciaKg: number
    diasParado?: number
  }>
  catalogoTipo: 'nenhum' | 'catalogo_geral_ciafal' | 'catalogo_personalizado_ia'
  templateMensagemA: string
  templateMensagemB?: string
  isAbTestActive?: boolean
  criadoPor: string
  criadoPorId: string
  criadoEm: string
  aprovadoPor?: string
  aprovadoEm?: string
  disparadoPor?: string
  disparadoEm?: string
  publicoTotal: number
  publicoElegivel: number
  publicoSupresso: number
  motivosSupressao: CampaignSuppressionReasons
  metricas: CampaignMetrics
  analiseIA?: CampaignAIAnalysis
  is_mock?: boolean
}

export interface CampaignDispatchQueueItem {
  id: string
  campanhaId: string
  campanhaTitulo: string
  clienteId: string
  clienteNome: string
  canal: CampaignChannel
  destinatario: string
  mensagemFinal: string
  variante: 'A' | 'B'
  status: 'pendente' | 'enviado' | 'entregue' | 'lido' | 'respondido' | 'falha' | 'suprimido'
  motivoSupressao?: string
  tentativas: number
  maxTentativas: number
  enviadoEm?: string
  respondidoEm?: string
  respostaRecebida?: string
  sentimento?: 'positivo' | 'negativo' | 'neutro' | 'duvida' | 'cotacao_solicitada'
  idempotencyKey: string
  is_mock?: boolean
}

export type OptOutChannel = 'email' | 'whatsapp' | 'telefone' | 'geral'

export interface LGPDConsentRecord {
  id: string
  clienteId: string
  clienteNome: string
  canal: OptOutChannel
  status: 'consentido' | 'opt_out' | 'bloqueado'
  dataRegistro: string
  motivo?: string
  solicitadoPor?: string
}

export interface AIAuditLog {
  id: string
  recomendacaoId: string
  clienteId: string
  clienteNome: string
  tipoAcao: string
  algoritmoVersao: string
  dadosUtilizados: string
  usuarioExecutor: string
  dataHora: string
  acaoExecutada: string
  resultadoRegistrado?: string
}

export interface AICommercialRecommendation {
  id: string
  clienteId: string
  clienteNome: string
  cidadeUf: string
  segmento: string
  vendedorId: string
  vendedorNome: string
  origem: ActionOriginType
  prioridade: PriorityLevel
  motivo: string
  acaoRecomendada: 'WhatsApp' | 'Ligar' | 'E-mail' | 'Enviar Catálogo' | 'Cotação'
  produtoSugerido: {
    codigo: string
    descricao: string
    familia: string
    saldoEstoqueTons?: number
    precoReferenciaKg?: number
  }
  isc: number
  diasSemCompra: number
  coberturaVencidaDias: number
  aderenciaScore: FitScore
  faturamentoPotencial: number
  is_mock?: boolean
}

export interface CommercialExecutionKPIs {
  recomendacoesPendentes: number
  tarefasGeradas: number
  tarefasConcluidas: number
  tarefasVencidas: number
  campanhasAtivas: number
  clientesAbordados: number
  clientesReativados: number
  taxaReativacaoPct: number
  taxaConversaoPct: number
  volumeReativadoTons: number
  faturamentoReativado: number
  estoqueParadoConvertidoTons: number
  estoqueParadoConvertidoValor: number
}
