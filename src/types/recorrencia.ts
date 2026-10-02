// src/types/recorrencia.ts
// Tipagem completa do módulo Recorrência de Compras - CRM 360º CIAFAL (Fatia 1)

export type UnitMode = 'BRL' | 'TONS'

export type ClasseRecorrencia = 'Mensal' | 'Bimestral' | 'Trimestral' | 'Esporádico'

export type SegmentoRFM =
  | 'Campeões'
  | 'Clientes Leais'
  | 'Potenciais Leais'
  | 'Promissores'
  | 'Precisam de Atenção'
  | 'Em Risco'
  | 'Não Podemos Perder'
  | 'Hibernando'
  | 'Perdidos'
  | 'Novos Clientes'

export type SituacaoCreditoSAP = 'Liberado' | 'Em Análise' | 'Bloqueado' | 'Sem informação SAP'

export type TipoAlertaComercial = 'Parada Abrupta' | 'Queda Forte' | 'Sem Alerta'

export type CruzamentoCreditoRecorrencia =
  | 'Prioridade Financeira' // Perdeu ritmo + crédito bloqueado
  | 'Prioridade Comercial' // Perdeu ritmo + crédito normal
  | 'Risco de Restrição' // Compra normalmente + pouco saldo disponível
  | 'Normal'

export type SituacaoProdutoAno = 'Ativo' | 'Sem nota no ano'

export interface FaturamentoItem {
  id: string
  clienteSap: string
  cnpjCpf: string
  clienteNome: string
  representanteNome: string
  vendedorId: string
  vendedorNome: string
  dataNF: string // AAAA-MM-DD ou DD/MM/AAAA
  numeroNF: string
  codigoMaterial: string
  descricaoMaterial: string
  grupoMercadoria: string
  quantidadeFaturada: number
  tonelagem: number
  valorFaturado: number
  centro: string
  empresa: string
  tipoOperacao?: string // 'Venda', 'Industrialização', etc.
}

export interface RecorrenciaThresholds {
  mensal: number // default >= 55%
  bimestral: number // default >= 30%
  trimestral: number // default >= 15%
}

export interface ThresholdsPredicao {
  altaProbabilidadePAlive: number // default >= 70%
  riscoModeradoPAlive: number // default >= 40% e < 70%
  // < 40% = Alto Risco / Inativo
  altaProbabilidade30d: number // default >= 50%
}

export interface ParametrosRecorrenciaConfig {
  thresholds: RecorrenciaThresholds
  thresholdsPredicao: ThresholdsPredicao
  gruposExcluidos: string[] // Ex.: ['SUB-PRO', 'Subproduto', 'carepa', 'sucata']
  tiposOperacaoExcluidos: string[] // Ex.: ['Industrialização']
  updatedAt: string
  updatedBy: string
  historicoAlteracoes: {
    dataHora: string
    usuario: string
    campo: string
    de: any
    para: any
  }[]
}

export interface DadosCreditoSAP {
  sapCode: string
  hasSapData: boolean
  limiteAprovado: number | null
  limiteUtilizado: number | null
  saldoDisponivel: number | null
  saldoEmAberto: number | null
  titulosVencidos: number | null
  valorVencido: number | null
  maiorAtrasoDias: number | null
  situacaoCadastral: string
  statusCredito: SituacaoCreditoSAP
}

export interface MesRecorrenciaCell {
  anoMes: string // YYYY-MM
  labelMes: string // Ex: "Out/24"
  valorFaturado: number
  tonelagem: number
  nfsCount: number
  produtosDistintosCount: number
  intensidade: 'nenhuma' | 'baixa' | 'media' | 'alta' | 'muito_alta'
  isParcial?: boolean
}

export interface ClienteRecorrenciaView {
  id: string
  codigoSap: string
  cnpjCpf: string
  razaoSocial: string
  nomeFantasia?: string
  cidade: string
  uf: string
  setorIndustrial: string
  vendedorId: string
  vendedorNome: string
  representanteNome: string
  empresa: string

  // Métricas de Compra
  primeiraCompraData: string
  ultimaCompraData: string
  diasSemComprar: number
  compraMensalMediaValor: number
  compraMensalMediaTons: number
  ticketMedioValor: number
  frequenciaHistoricaDias: number
  totalFaturado12m: number
  totalToneladas12m: number

  // Taxa & Classe de Recorrência
  taxaRecorrencia: number // 0-100%
  classeRecorrencia: ClasseRecorrencia

  // RFM Scores (1 a 5)
  scoreR: number
  scoreF: number
  scoreM: number
  scoreRFM: string // Ex: "555", "432"
  segmentoRFM: SegmentoRFM

  // Sinais & Alertas
  tipoAlerta: TipoAlertaComercial
  alertaDescricao: string
  altaProbabilidadeCadencia: boolean
  potencialRetomadaValor: number
  potencialRetomadaTons: number

  // Crédito SAP Real
  credito: DadosCreditoSAP
  cruzamentoCredito: CruzamentoCreditoRecorrencia

  // Mapa mensal 12M
  mapaMensal: MesRecorrenciaCell[]

  // Estoque produtos parados
  estoqueLivreTonsTotal: number
  estoqueProdutosParadosTons: number
}

export interface FiltrosRecorrencia {
  empresa: string
  vendedor: string
  representante: string
  cliente: string
  uf: string
  cidade: string
  setorIndustrial: string
  grupoMercadoria: string
  produto: string
  periodo: string
  classeRecorrencia: string
  segmentoRFM: string
  statusCliente: string
  riscoPerda: string
  situacaoCredito: string
  unitMode: UnitMode
}

export interface ProdutoRetomadaItem {
  clienteSap: string
  clienteNome: string
  vendedorNome: string
  codigoMaterial: string
  descricao: string
  grupo: string
  quantidadeFaturadaHistorica: number
  tonelagemHistorica: number
  valorFaturadoHistorico: number
  nfsCount: number
  primeiraCompraData: string
  ultimaCompraData: string
  diasSemComprar: number
  situacao: SituacaoProdutoAno
  estoqueDisponivelTons: number
  estoqueReservadoTons: number
  estoqueLivreTons: number
  ultimoPrecoPraticadoKg: number
  precoAtualKg: number
  disponibilidadeVenda: 'Imediata' | 'Baixo Estoque' | 'Sob Encomenda'
}

export interface FilaAcaoComercial {
  id: string
  prioridade: 'Prioridade 1' | 'Prioridade 2' | 'Prioridade 3' | 'Prioridade 4'
  prioridadeLabel: string
  clienteSap: string
  clienteNome: string
  vendedorId: string
  vendedorNome: string
  representanteNome: string
  motivo: string
  oportunidadeValor: number
  oportunidadeTons: number
  produtosSugeridos: string[]
  acaoRecomendada: string
  responsavel: string
  prazo: string
  cruzamento: CruzamentoCreditoRecorrencia
}

export interface KpisVisaoGeral {
  clientesNaCarteira: number
  compramTodoMes: number
  compraEsporadica: number
  retencaoPct: number
  clientesInativos90d: number
  clientesEmRisco: number
  clientesParadaAbrupta: number
  clientesQuedaForte: number
  clientesAltaProbabilidadeRecompra: number
  potencialRetomadaValor: number
  potencialRetomadaTons: number
}

// =========================================================================
// FATIA 2 — MODELO PREDITIVO BG/NBD & GAMMA-GAMMA
// =========================================================================

export interface EventoTransacionalCliente {
  clienteId: string
  clienteSap: string
  clienteNome: string
  data: string // YYYY-MM-DD
  faturamentoTotal: number
  tonelagemTotal: number
  nfsCount: number
  nfsNumeros: string[]
}

export interface ResumoClienteBGNBD {
  clienteId: string
  clienteSap: string
  clienteNome: string
  primeiraCompraData: string // YYYY-MM-DD
  ultimaCompraData: string // YYYY-MM-DD
  x: number // frequency: compras repetidas APÓS a primeira
  t_x: number // recency: dias entre primeira e última compra
  T: number // tempo em dias entre primeira compra e fim da janela
  eventosCount: number // x + 1
  valorMedioEventoRecompra: number // m_x (R$)
  tonelagemMediaEventoRecompra: number // t_x_tons (t)
  temHistoricoSuficiente: boolean // se pode receber estimativa probabilística
  motivoInsuficiencia?: string
}

export interface PredicaoHorizontes {
  probabilidade30d: number // 0-1
  probabilidade60d: number // 0-1
  probabilidade90d: number // 0-1
  probabilidade180d: number // 0-1
  probabilidade365d: number // 0-1
  comprasEsperadas30d: number
  comprasEsperadas60d: number
  comprasEsperadas90d: number
  comprasEsperadas180d: number
  comprasEsperadas365d: number
  receitaEsperada30d: number
  receitaEsperada60d: number
  receitaEsperada90d: number
  receitaEsperada180d: number
  receitaEsperada365d: number
  tonelagemEsperada30d: number
  tonelagemEsperada60d: number
  tonelagemEsperada90d: number
  tonelagemEsperada180d: number
  tonelagemEsperada365d: number
}

export interface PredicaoClienteView {
  clienteId: string
  codigoSap: string
  razaoSocial: string
  nomeFantasia?: string
  vendedorId: string
  vendedorNome: string
  representanteNome: string
  segmentoRFM: SegmentoRFM
  scoreRFM: string

  // Dados Transacionais BG/NBD
  primeiraCompraData: string
  ultimaCompraData: string
  diasSemComprar: number
  frequency: number
  recencyDias: number
  tempoTDias: number
  eventosTotal: number
  valorMedioEvento: number
  tonelagemMediaEvento: number

  // Status de Suficiência
  temHistoricoSuficiente: boolean
  motivoInsuficiencia?: string
  temDadosMonetariosSuficientes: boolean
  motivoInsuficienciaMonetaria?: string

  // Resultados Probabilísticos
  pAlive: number // 0 a 1
  pAlivePercent: number // 0 a 100%
  classificacaoRisco: 'Alta Probabilidade' | 'Em Risco' | 'Alto Risco / Inativo'
  quadranteMatriz:
    | 'Manutenção prioritária'
    | 'Recuperação prioritária'
    | 'Manutenção'
    | 'Baixa prioridade'

  // Projeções por horizonte
  horizontes: PredicaoHorizontes
  proximaCompraValorEsperado: number
  proximaCompraTonsEsperada: number

  // Crédito SAP Real
  credito: DadosCreditoSAP

  // Produtos e Estoque
  produtosHistoricos: {
    codigo: string
    descricao: string
    familia: string
    status: string
    saldoEstoqueTon: number
  }[]
  produtosQueDeixouDeComprar: {
    codigo: string
    descricao: string
    saldoEstoqueTon: number
  }[]
  estoqueLivreTons: number

  // Explicação de Risco Estruturada
  explicacaoRisco: string
}

export interface ValidacaoHoldoutResult {
  periodoCalibracaoInicio: string
  periodoCalibracaoFim: string
  periodoHoldoutInicio: string
  periodoHoldoutFim: string
  diasHoldout: number
  clientesAvaliados: number
  comprasPrevistasTotal: number
  comprasRealizadasTotal: number
  maeCompras: number
  desvioPercentualCompras: number
  receitaPrevistaTotal: number
  receitaRealizadaTotal: number
  maeReceita: number
  desvioPercentualReceita: number
  tonelagemPrevistaTotal: number
  tonelagemRealizadaTotal: number
  maeTonelagem: number
  desvioPercentualTonelagem: number
  dataValidacao: string
  statusValidacao: 'OK' | 'Atenção' | 'Erro'
}

export interface ModeloPreditivoSalvo {
  versao: string
  treinadoEm: string
  treinadoPor: string
  periodoBase: {
    inicio: string
    fim: string
    diasTotal: number
  }
  qtdeClientesTotal: number
  qtdeClientesElegiveisBGNBD: number
  qtdeClientesElegiveisGammaGamma: number
  qtdeEventosTotal: number
  qtdeNFsTotal: number

  // Parâmetros BG/NBD
  bgnbd: {
    r: number
    alpha: number
    a: number
    b: number
    logLikelihood: number
    converged: boolean
    iterations: number
    status: 'OK' | 'Atenção' | 'Erro'
    error?: string
  }

  // Parâmetros Gamma-Gamma
  gammaGamma: {
    p: number
    q: number
    v: number
    logLikelihood: number
    converged: boolean
    iterations: number
    status: 'OK' | 'Atenção' | 'Erro'
    error?: string
  }

  // Validação Holdout
  validacao: ValidacaoHoldoutResult

  // Cache das predições por cliente
  predicoes: PredicaoClienteView[]
}

export interface KpisPredicaoAba {
  altaProbabilidadeCount: number
  altaProbabilidadeValor: number
  altaProbabilidadeTons: number
  emRiscoCount: number
  emRiscoValor: number
  emRiscoTons: number
  receitaEsperada90d: number
  tonelagemEsperada90d: number
  comprasEsperadas90d: number
  altoPotencialRecuperacaoCount: number
  altoPotencialRecuperacaoValor: number
  altoPotencialRecuperacaoTons: number
}
