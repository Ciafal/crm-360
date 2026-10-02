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

export interface ParametrosRecorrenciaConfig {
  thresholds: RecorrenciaThresholds
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
