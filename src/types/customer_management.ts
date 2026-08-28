// src/types/customer_management.ts
// Tipagem completa do Módulo Gestão de Clientes + Cobertura da Carteira + Cotações + Cross-Sell + Catálogo + Mapa + OTIF

export type ClassificationType =
  | 'ESTRATEGICO'
  | 'CLIENTE_A'
  | 'CLIENTE_B'
  | 'CLIENTE_C'
  | 'PROSPECT'
  | 'EM_RISCO'

export type CommercialContactChannel =
  | 'WhatsApp'
  | 'Telefone'
  | 'E-mail'
  | 'Visita'
  | 'Reunião'
  | 'Tarefa'
  | 'Outro'

export type CustomerStatusKey =
  | 'Ativo'
  | 'Pedido em Carteira'
  | 'Cotação Aberta'
  | 'Faturado'
  | 'Sem Compra'
  | 'Sem Contato'
  | 'Inativo'
  | 'Prospect'
  | 'Perdido'
  | 'Em Recuperação'
  | 'Oportunidade Aberta'
  | 'Especulação Aberta'

export type PriorityLevel = 'Prioridade 1' | 'Prioridade 2' | 'Prioridade 3' | 'Acompanhamento'

export interface ContactHistoryItem {
  id: string
  data: string // DD/MM/AAAA ou ISO
  canal: CommercialContactChannel
  autor: string
  resumo: string
  proximaAcao?: string
  isValidCommercialContact: boolean
}

export interface UnifiedTimelineEvent {
  id: string
  data: string
  tipo:
    | 'ligacao'
    | 'whatsapp'
    | 'email'
    | 'visita'
    | 'reuniao'
    | 'tarefa'
    | 'catalogo'
    | 'campanha'
    | 'cotacao'
    | 'pedido'
    | 'faturamento'
    | 'oportunidade'
    | 'especulacao'
    | 'reclamacao'
    | 'entrega'
    | 'pesquisa'
  titulo: string
  descricao: string
  autor: string
  detalhes?: Record<string, any>
  valor?: number
  volumeTons?: number
}

export interface ImportantDate {
  id: string
  tipo:
    | 'fundacao'
    | 'aniversario_empresa'
    | 'aniversario_contato'
    | 'primeira_compra'
    | 'evento'
    | 'renovacao'
    | 'data_comemorativa'
  descricao: string
  data: string // DD/MM ou DD/MM/AAAA
  nomeContato?: string
}

export interface SuggestedProduct {
  id: string
  codigo: string
  descricao: string
  familia: string
  bitola?: string
  tipo:
    | 'compra_recorrente'
    | 'cross_sell'
    | 'produto_abandonado'
    | 'produto_semelhante'
    | 'estoque_estrategico'
    | 'proxima_disponibilidade'
  motivo: string
  potencialTons: number
  precoReferenciaKg?: number
  saldoEstoqueTons?: number
  pcpProximaData?: string
}

export interface AIClientDiagnostic {
  situacao: string
  riscos: string[]
  oportunidades: string[]
  produtoRecomendado: SuggestedProduct
  motivoRecomendacao: string
  proximaAcao: string
  scoreUrgencia: number // 1 a 100
}

export interface CustomerManagementItem {
  id: string
  codigo: string // SAP Code
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  cidade: string
  uf: string
  regiao: string // Ex.: "Triângulo Mineiro", "Grande BH", "Vale do Aço", "SP Interior", "RJ Capital"
  segmento: string
  subsegmento?: string
  vendedorId: string
  vendedorNome: string
  supervisorId?: string
  supervisorNome?: string
  regional?: string
  empresa?: string

  // Classificações e Status múltiplos
  classificacao: ClassificationType
  status: CustomerStatusKey[]
  prioridadeCarteira: PriorityLevel

  // Cobertura Comercial
  frequenciaEsperadaDias: number // Parametrizada por classificação
  ultimoContatoData: string
  ultimoContatoCanal: CommercialContactChannel
  diasSemContato: number
  coberto: boolean // Cobertura dentro da janela
  coberturaVencidaDias: number // 0 se coberto, > 0 se atrasado
  alertaCobertura: 'ok' | 'proximo_vencimento' | 'vencido' | 'critico'
  proximaAcao: string

  // Datas e Histórico de Compras e Faturamento
  ultimaCompraData: string
  diasSemCompra: number
  ultimoPedidoData: string
  diasSemPedido: number
  ultimoFaturamentoData: string
  diasSemFaturamento: number
  faturamento12m: number
  toneladas12m: number
  faturamentoMes: number
  toneladasMes: number

  // Indicadores Integrados
  isc: number // 0 a 100 (Índice de Satisfação Clientes)
  otif: number // 0 a 100% (On Time In Full)
  otifPrometido: number // % no prazo prometido
  otifDesejado: number // % na data desejada do cliente
  oportunidadeAberta: boolean
  oportunidadesCount: number
  oportunidadesValor: number
  especulacoesCount: number
  cotacoesAbertasCount: number
  pedidosEmCarteiraCount: number

  // Perfil de compra e Geo
  latitude: number
  longitude: number
  produtosSugeridos: SuggestedProduct[]
  datasImportantes: ImportantDate[]
  contatosHistorico: ContactHistoryItem[]
  timelineUnificada: UnifiedTimelineEvent[]

  // Histórico de perda (se aplicável)
  motivoPerda?:
    | 'preco'
    | 'prazo'
    | 'qualidade'
    | 'concorrencia'
    | 'credito'
    | 'logistica'
    | 'atendimento'
    | 'encerramento'
    | 'outro'
  detalhePerda?: string
  dataPerda?: string

  // Reativação
  isReativado?: boolean
  dataReativacao?: string
  faturamentoReativacao?: number
  volumeReativacaoTons?: number
  origemReativacao?: string

  // Novo Cliente
  isNovoCliente?: boolean
  dataPrimeiraCompra?: string

  is_mock: boolean
}

export interface CoverageSummaryKpi {
  coberturaGeralPct: number
  coberturaEstrategicosPct: number
  coberturaClientesAPct: number
  coberturaClientesBPct: number
  coberturaClientesCPct: number
  coberturaEmRiscoPct: number
  coberturaProspectsPct: number

  totalElegiveis: number
  totalCobertos: number
  totalDescobertos: number
  totalVencidos: number
  totalProximoVencimento: number

  metaCoberturaPct: number
  coberturaMesAnteriorPct: number
  coberturaYtdPct: number
  tendencia: 'alta' | 'estavel' | 'baixa'
  gapParaMetaPct: number
}

export interface SellerCoverageItem {
  vendedorId: string
  vendedorNome: string
  equipe: string
  regional: string
  clientesElegiveis: number
  cobertos: number
  descobertos: number
  coberturaPct: number
  metaPct: number
  estrategicosTotal: number
  estrategicosCobertos: number
  emRiscoTotal: number
  emRiscoCobertos: number
  diasSemContatoMedio: number
  iscMedio: number
  otifMedio: number
}

export interface CatalogProduct {
  id: string
  linha: string
  familia: string
  codigo: string
  descricaoComercial: string
  bitola: string
  dimensao: string
  comprimento: string
  qualidade: string
  norma: string
  aplicacao: string
  unidade: 't' | 'kg' | 'barra' | 'peca'
  caracteristicaTecnica: string
  estoqueDisponivelTons: number
  estoqueFisicoTons: number
  estoqueComprometidoTons: number
  pcpProximaData: string
  pcpQuantidadePrevistaTons: number
  prazoTMSDias: number
  precoTabelaKg: number
  precoTabelaTon: number
  ativo: boolean
  fotoUrl?: string
  desenhoUrl?: string
  fichaTecnicaUrl?: string
  certificadoUrl?: string
  qrCode?: string
}

export type EspeculacaoStatus =
  | 'Identificada'
  | 'Investigação'
  | 'Qualificada'
  | 'Oportunidade'
  | 'Cotação'
  | 'Perdida'
  | 'Sem evolução'
  | 'Expirada'

export interface EspeculacaoItem {
  id: string
  clienteId: string
  clienteNome: string
  clienteSap: string
  contatoNome: string
  contatoTelefone?: string
  vendedorId: string
  vendedorNome: string
  produtoCodigo: string
  produtoDescricao: string
  familia: string
  quantidadeEstimadaTons: number
  periodoProvavel: string // Ex.: "Novembro/2024", "1ª Quinzena Dezembro"
  probabilidade: number // 0-100%
  precoComentadoKg?: number
  concorrente?: string
  observacao: string
  proximaAcao: string
  validadeData: string
  status: EspeculacaoStatus
  criadoEm: string
  atualizadoEm: string
  is_mock: boolean
}

export interface MarketingCampaign {
  id: string
  titulo: string
  tipo:
    | 'data_comemorativa'
    | 'reativacao'
    | 'produto_disponivel'
    | 'lancamento'
    | 'regiao'
    | 'estoque_parado'
    | 'relacionamento'
  canal: 'email' | 'whatsapp' | 'ambos'
  publicoAlvoFiltro: string
  totalDestinatarios: number
  mensagemTemplate: string
  dataEnvio: string
  status: 'rascunho' | 'aprovado' | 'enviado' | 'agendado'
  taxaAbertura?: number
  taxaResposta?: number
  is_mock: boolean
}

export interface RegionalGeoMetric {
  uf: string
  nomeEstado: string
  regiao: string
  totalClientes: number
  clientesAtivos: number
  clientesEmRisco: number
  clientesCriticos: number
  prospects: number
  coberturaPct: number
  faturamentoMes: number
  toneladasMes: number
  iscMedio: number
  otifMedio: number
  municipiosAtendidos: number
  municipiosSemClientes: number
  oportunidadesAbertasTons: number
}

export interface AIWhoToContactSuggestion {
  cliente: CustomerManagementItem
  prioridade: PriorityLevel
  motivoOrdem: string
  produtoSugerido: SuggestedProduct
  ultimoContatoStr: string
  diasSemContato: number
  ultimaCompraStr: string
  diasSemCompra: number
  oportunidadeTitulo: string
  acaoRecomendada: 'Ligar' | 'WhatsApp' | 'E-mail' | 'Visitar' | 'Enviar Catálogo' | 'Criar Cotação'
}
