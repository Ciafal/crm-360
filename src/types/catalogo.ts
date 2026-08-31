// src/types/catalogo.ts
// Tipagem completa do Módulo Gerador de Catálogo Comercial CIAFAL CRM 360º

export type CatalogoTipo = 'COMPLETO' | 'LINHA' | 'PERSONALIZADO' | 'INTELIGENTE_CLIENTE'

export type CatalogoModoApresentacao = 'COMERCIAL' | 'TECNICO'

export type CatalogoStatus =
  | 'RASCUNHO'
  | 'GERADO'
  | 'ENVIADO_EMAIL'
  | 'ENVIADO_WHATSAPP'
  | 'COTACAO_CRIADA'
  | 'EXPIRADO'

export interface CatalogoProdutoItem {
  id: string
  codigo: string
  descricaoComercial: string
  linha: string
  familia: string
  bitola: string
  dimensao: string
  secao?: string
  comprimento: string
  pesoTeoricoKgM?: number // kg/m
  pesoBarraKg?: number // kg por barra
  unidade: 't' | 'kg' | 'm' | 'barra' | 'peca'
  normaTecnica: string
  qualidadeAco: string
  aplicacao: string
  caracteristicas: string
  acabamento?: string
  imagemUrl?: string
  desenhoSecaoUrl?: string
  empresaOrigem?: 'CIAFAL Matriz' | 'CIAFAL Filial'
  producaoPropria?: boolean
  industrializacao?: boolean
  // Flags de recomendação inteligente (NUNCA expor scores/margens ao cliente no PDF)
  isRecomendadoIA?: boolean
  motivoRecomendacaoInterna?: string // Visível apenas para o vendedor na tela de edição
  tagComercial?: 'Mix Habitual' | 'Cross Sell' | 'Recompra' | 'Destaque'
  origemCrossSell?: boolean
}

export interface CatalogoConfiguracao {
  titulo: string
  subtitulo?: string
  tipo: CatalogoTipo
  modo: CatalogoModoApresentacao
  clienteId?: string
  clienteNome?: string
  clienteSap?: string
  vendedorId: string
  vendedorNome: string
  vendedorEmail: string
  vendedorTelefone: string
  vendedorWhatsapp: string
  linhaSelecionada?: string
  familiaSelecionada?: string
  incluirCapa: boolean
  incluirDadosTecnicos: boolean
  incluirNormas: boolean
  incluirPesosTeoricos: boolean
  incluirCrossSellSugerido: boolean
  tituloSecaoCrossSell?: string
  observacoesComerciais?: string
  dataGeracao: string
  validadeDias: number
  versao: number
  codigoVersao: string // ex: CAT-2026-00125 v1
}

export interface CatalogoGerado {
  id: string
  codigoVersao: string // ex: CAT-2026-00125 v1
  codigoBase: string // ex: CAT-2026-00125
  versao: number
  dataCriacao: string
  dataEnvio?: string
  clienteId?: string
  clienteNome?: string
  clienteSap?: string
  clienteEmail?: string
  clienteTelefone?: string
  vendedorId: string
  vendedorNome: string
  tipo: CatalogoTipo
  modo: CatalogoModoApresentacao
  produtos: CatalogoProdutoItem[]
  produtosCrossSell?: CatalogoProdutoItem[]
  quantidadeProdutos: number
  quantidadePaginas: number
  canalEnvio?: 'EMAIL' | 'WHATSAPP' | 'DOWNLOAD' | 'PORTAL'
  destinatario?: string
  status: CatalogoStatus
  cotacaoRelacionadaId?: string
  cotacaoRelacionadaCodigo?: string
  pedidoRelacionadoSap?: string
  pdfUrl?: string
  configuracao: CatalogoConfiguracao
  isCongelado: boolean // Catálogos enviados são imutáveis
}

export interface CatalogoTemplateModelo {
  id: string
  nome: string
  descricao: string
  tipo: CatalogoTipo
  modo: CatalogoModoApresentacao
  linhasOuFamilias?: string[]
  produtosIds?: string[]
  criadoPor: string
  criadoEm: string
}

export interface CatalogoMetricasGestao {
  totalCatalogosGerados: number
  totalCatalogosEnviados: number
  clientesAlcancados: number
  produtosApresentados: number
  cotacoesOriginadas: number
  pedidosOriginados: number
  taxaConversaoCotacaoPct: number
  taxaConversaoPedidoPct: number
  receitaOriginadaBRL: number
  tonelagemOriginadaTons: number
}

// Filtros para pesquisa de produtos na consulta e catálogo
export interface ProdutoFiltrosPesquisa {
  termo?: string
  codigo?: string
  descricao?: string
  linha?: string
  familia?: string
  bitola?: string
  dimensao?: string
  aplicacao?: string
  qualidade?: string
  empresa?: string
  producaoPropria?: boolean
  industrializacao?: boolean
  apenasComEstoqueDisponivel?: boolean
}
