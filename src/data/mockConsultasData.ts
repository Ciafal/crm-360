// src/data/mockConsultasData.ts
// DADOS DEMONSTRATIVOS (AMBIENTE DE HOMOLOGAÇÃO / TESTE) PARA O SUBMÓDULO DE CONSULTAS CIAFAL CRM 360º

export interface DocumentoFiscalNF {
  id: string
  numeroNF: string
  serie: string
  chaveAcesso: string
  dataEmissao: string // YYYY-MM-DD ou ISO
  dataEmissaoFormatada: string // DD/MM/YYYY
  dataSaida: string
  codigoClienteSap: string
  clienteId: string
  clienteNome: string
  cnpj: string
  pedidoSap: string
  numeroTransporte: string
  materialResumo: string
  materiais: {
    item: number
    codigo: string
    descricao: string
    ncm: string
    cfop: string
    lote: string
    corrida: string
    quantidade: number
    unidade: string
    pesoKg: number
    pesoTon: number
    valorUnitario: number
    valorTotal: number
    certificadoId?: string
    certificadoNumero?: string
  }[]
  quantidadeTotal: number
  pesoTon: number
  pesoKg: number
  valorTotal: number
  empresa: string
  centro: string
  status: 'Autorizada' | 'Cancelada' | 'Denegada' | 'Inutilizada'
  naturezaOperacao: string
  informacoesComplementares: string
  temXml: boolean
  temPdf: boolean
  temCertificadoVinculado: boolean
  boletoVinculadoId?: string
  numeroBoletoVinculado?: string
  transporteInfo?: {
    numeroTransporte: string
    transportadora: string
    motorista: string
    placa: string
    statusCarga: 'Em Trânsito' | 'Entregue' | 'Aguardando Coleta' | 'Retido Posto Fiscal'
    previsaoEntrega: string
    dataEntregaRealizada?: string
    comprovanteEntregaDisponivel: boolean
    comprovanteId?: string
  }
  vendedorId: string
  vendedorNome: string
}

export interface BoletoFinanceiro {
  id: string
  clienteId: string
  clienteNome: string
  codigoClienteSap: string
  cnpj: string
  numeroDocumento: string // Nosso Número
  numeroTitulo: string
  numeroNfRelacionada: string
  numeroPedido: string
  dataEmissao: string
  dataVencimento: string
  dataVencimentoFormatada: string
  valorOriginal: number
  valorAtualizado?: number
  diasAtraso?: number
  jurosMultaCalculados?: number
  status: 'A vencer' | 'Vence hoje' | 'Vencido' | 'Pago' | 'Baixado' | 'Cancelado' | 'Renegociado'
  banco:
    | 'Banco do Brasil (001)'
    | 'Itaú (341)'
    | 'Bradesco (237)'
    | 'Santander (033)'
    | 'Sicoob (756)'
  agenciaConta: string
  linhaDigitavel: string
  codigoBarras: string
  temSegundaViaDisponivel: boolean
  requerSolicitacaoFinanceiro: boolean
  vendedorId: string
  vendedorNome: string
  historicoSolicitacoes?: {
    protocolo: string
    dataSolicitacao: string
    solicitante: string
    status: string
    slaHoras: number
  }[]
}

export interface CertificadoQualidade {
  id: string
  numeroCertificado: string
  numeroNF: string
  itemNF: number
  pedidoSap: string
  clienteId: string
  clienteNome: string
  codigoClienteSap: string
  cnpj: string
  materialCodigo: string
  materialDescricao: string
  especificacaoTecnica: string // Ex: NBR 7480 CA-50, ASTM A36, SAE 1020
  lote: string
  corrida: string
  ordemProducao: string
  quantidade: number
  unidade: string
  pesoTon: number
  dataEmissao: string
  unidadeProdutora:
    | 'CIAFAL Usina Contagem / MG'
    | 'CIAFAL Usina Betim / MG'
    | 'CIAFAL Centro Logístico Sabará / MG'
  responsavelTecnico: string
  crqResponsavel: string
  statusCertificado:
    | 'Aprovado'
    | 'Em Elaboração'
    | 'Aguardando Aprovação'
    | 'Bloqueado'
    | 'Cancelado'
  propriedadesMecanicas: {
    escoamentoMpa: number
    resistenciaMpa: number
    alongamentoPct: number
    dobramento: string
  }
  composicaoQuimica: {
    c: number
    mn: number
    si: number
    p: number
    s: number
    ce: number
  }
  vendedorId: string
}

export interface PacoteDocumentalCliente {
  id: string
  clienteId: string
  clienteNome: string
  codigoClienteSap: string
  cnpj: string
  pedidoSap: string
  dataFaturamento: string
  dataEntrega: string
  statusFluxo: 'Concluído' | 'Em Andamento' | 'Entrega Realizada'
  valorTotal: number
  pesoTon: number
  nf: DocumentoFiscalNF
  boletos: BoletoFinanceiro[]
  certificados: CertificadoQualidade[]
  transporte?: {
    numeroTransporte: string
    transportadora: string
    motorista: string
    placa: string
    status: string
    dataSaida: string
    dataPrevisao: string
    dataEntrega?: string
    comprovanteUrl?: string
  }
}

export interface SolicitacaoFinanceiroRegistro {
  id: string
  protocolo: string
  clienteId: string
  clienteNome: string
  codigoClienteSap: string
  cnpj: string
  numeroBoleto: string
  numeroNF: string
  valorOriginal: number
  dataVencimentoOriginal: string
  novaDataSugerida?: string
  motivo: string
  solicitanteId: string
  solicitanteNome: string
  status: 'PENDENTE' | 'EM_ANALISE_FINANCEIRO' | 'APROVADO_ATUALIZADO' | 'RECUSADO' | 'CONCLUIDO'
  analistaFinanceiro?: string
  slaHoras: number
  prazoLimite: string
  dataCriacao: string
  dataFinalizacao?: string
  boletoAtualizadoNumero?: string
  valorAtualizado?: number
  observacoesFinanceiro?: string
}

export interface LogAuditoriaConsulta {
  id: string
  usuarioId: string
  usuarioNome: string
  usuarioRole: string
  clienteId: string
  clienteSap: string
  clienteNome: string
  tipoAcao:
    | 'SEARCH'
    | 'VIEW_NF'
    | 'VIEW_BOLETO'
    | 'VIEW_CERTIFICADO'
    | 'DOWNLOAD_PDF'
    | 'DOWNLOAD_XML'
    | 'DISPATCH_EMAIL'
    | 'DISPATCH_WHATSAPP'
    | 'COPY_SECURE_LINK'
    | 'REQUEST_FINANCIAL_DUPLICATE'
  tipoDocumento: 'NF' | 'BOLETO' | 'CERTIFICADO' | 'TMS' | 'MULTI_PACKAGE'
  numeroDocumento: string
  canal?: 'E-mail' | 'WhatsApp' | 'Link Seguro' | 'Visualização Direta'
  destinatario?: string
  ip: string
  status: 'SUCCESS' | 'DENIED_RBAC' | 'ERROR'
  mensagemDetalhe?: string
  dataHora: string
}

// -------------------------------------------------------------
// FIXTURE DEMONSTRATIVA COMPLETA DE HOMOLOGAÇÃO
// -------------------------------------------------------------

export const mockNotasFiscais: DocumentoFiscalNF[] = [
  {
    id: 'nf-123456',
    numeroNF: '123456',
    serie: '1',
    chaveAcesso: '31260812345678000199550010001234561009876543',
    dataEmissao: '2026-08-30',
    dataEmissaoFormatada: '30/08/2026',
    dataSaida: '30/08/2026 14:30',
    codigoClienteSap: '100421',
    clienteId: 'cli-1',
    clienteNome: 'Construtora Vale do Aço Ltda.',
    cnpj: '12.345.678/0001-99',
    pedidoSap: 'PED-450921',
    numeroTransporte: 'TR-88902',
    materialResumo: 'Vergalhão CA-50 10.0mm e 12.5mm (Barras 12m)',
    materiais: [
      {
        item: 10,
        codigo: 'MAT-CA50-100',
        descricao: 'VERGALHÃO CA-50 10.0MM BARRAS 12M',
        ncm: '7214.20.00',
        cfop: '5101',
        lote: 'L-2026-8801',
        corrida: 'CR-9042',
        quantidade: 15.0,
        unidade: 't',
        pesoKg: 15000,
        pesoTon: 15.0,
        valorUnitario: 5800.0,
        valorTotal: 87000.0,
        certificadoId: 'cert-88992',
        certificadoNumero: 'CQ-88992',
      },
      {
        item: 20,
        codigo: 'MAT-CA50-125',
        descricao: 'VERGALHÃO CA-50 12.5MM BARRAS 12M',
        ncm: '7214.20.00',
        cfop: '5101',
        lote: 'L-2026-8802',
        corrida: 'CR-9045',
        quantidade: 12.85,
        unidade: 't',
        pesoKg: 12850,
        pesoTon: 12.85,
        valorUnitario: 5850.0,
        valorTotal: 75172.5,
        certificadoId: 'cert-88993',
        certificadoNumero: 'CQ-88993',
      },
    ],
    quantidadeTotal: 27.85,
    pesoTon: 27.85,
    pesoKg: 27850,
    valorTotal: 162172.5,
    empresa: 'CIAFAL Matriz (0100)',
    centro: 'Centro Contagem MG (1010)',
    status: 'Autorizada',
    naturezaOperacao: 'Venda de Produção Própria - Mercado Interno',
    informacoesComplementares:
      'Pedido de Venda SAP: PED-450921. Carga paletizada amarrada conforme normas ABNT NBR 7480. Transporte sob responsabilidade CIF CIAFAL.',
    temXml: true,
    temPdf: true,
    temCertificadoVinculado: true,
    boletoVinculadoId: 'bol-334101',
    numeroBoletoVinculado: 'BOL-334101',
    transporteInfo: {
      numeroTransporte: 'TR-88902',
      transportadora: 'TransAço Logística Rodoviária Ltda.',
      motorista: 'Marcos Silveira',
      placa: 'HMG-4A88',
      statusCarga: 'Entregue',
      previsaoEntrega: '31/08/2026 11:00',
      dataEntregaRealizada: '31/08/2026 10:45',
      comprovanteEntregaDisponivel: true,
      comprovanteId: 'comp-tr88902',
    },
    vendedorId: 'qas-vendedor_teste',
    vendedorNome: 'Carlos Mendonça',
  },
  {
    id: 'nf-123457',
    numeroNF: '123457',
    serie: '1',
    chaveAcesso: '31260898765432000111550010001234571001234567',
    dataEmissao: '2026-08-28',
    dataEmissaoFormatada: '28/08/2026',
    dataSaida: '28/08/2026 16:00',
    codigoClienteSap: '100422',
    clienteId: 'cli-2',
    clienteNome: 'Metalúrgica Minas Estruturas S.A.',
    cnpj: '98.765.432/0001-11',
    pedidoSap: 'PED-450889',
    numeroTransporte: 'TR-88840',
    materialResumo: 'Vigas Laminadas I/H W 200x22.5 ASTM A572 Gr 50',
    materiais: [
      {
        item: 10,
        codigo: 'MAT-VIGA-W200',
        descricao: 'VIGA LAMINADA W 200 X 22.5 ASTM A572 GR 50 (12M)',
        ncm: '7216.32.00',
        cfop: '5101',
        lote: 'L-2026-7731',
        corrida: 'CR-6540',
        quantidade: 18.5,
        unidade: 't',
        pesoKg: 18500,
        pesoTon: 18.5,
        valorUnitario: 6400.0,
        valorTotal: 118400.0,
        certificadoId: 'cert-88994',
        certificadoNumero: 'CQ-88994',
      },
    ],
    quantidadeTotal: 18.5,
    pesoTon: 18.5,
    pesoKg: 18500,
    valorTotal: 118400.0,
    empresa: 'CIAFAL Matriz (0100)',
    centro: 'Centro Betim MG (1020)',
    status: 'Autorizada',
    naturezaOperacao: 'Venda de Mercadoria Industrial',
    informacoesComplementares:
      'Pedido SAP PED-450889. Material para aplicação em estruturas metálicas pesadas.',
    temXml: true,
    temPdf: true,
    temCertificadoVinculado: true,
    boletoVinculadoId: 'bol-334102',
    numeroBoletoVinculado: 'BOL-334102',
    transporteInfo: {
      numeroTransporte: 'TR-88840',
      transportadora: 'RodoMinas Express',
      motorista: 'Paulo Henrique Duarte',
      placa: 'PVB-9812',
      statusCarga: 'Entregue',
      previsaoEntrega: '29/08/2026 14:00',
      dataEntregaRealizada: '29/08/2026 13:20',
      comprovanteEntregaDisponivel: true,
      comprovanteId: 'comp-tr88840',
    },
    vendedorId: 'qas-vendedor_teste',
    vendedorNome: 'Carlos Mendonça',
  },
  {
    id: 'nf-123458',
    numeroNF: '123458',
    serie: '1',
    chaveAcesso: '31260845678901000122550010001234581005544332',
    dataEmissao: '2026-08-31',
    dataEmissaoFormatada: '31/08/2026',
    dataSaida: '31/08/2026 09:15',
    codigoClienteSap: '100423',
    clienteId: 'cli-3',
    clienteNome: 'Engenharia & Soluções Industriais Eireli',
    cnpj: '45.678.901/0001-22',
    pedidoSap: 'PED-451004',
    numeroTransporte: 'TR-88965',
    materialResumo: 'Chapas Finas a Frio SAE 1008 e Tubos Industriais Retangulares',
    materiais: [
      {
        item: 10,
        codigo: 'MAT-CHAPA-FF14',
        descricao: 'CHAPA FINA A FRIO 1.50MM (MSG 16) 1200X3000 SAE 1008',
        ncm: '7209.17.00',
        cfop: '5101',
        lote: 'L-2026-9011',
        corrida: 'CR-8120',
        quantidade: 8.4,
        unidade: 't',
        pesoKg: 8400,
        pesoTon: 8.4,
        valorUnitario: 6900.0,
        valorTotal: 57960.0,
        certificadoId: 'cert-88995',
        certificadoNumero: 'CQ-88995',
      },
      {
        item: 20,
        codigo: 'MAT-TUBO-8040',
        descricao: 'TUBO INDUSTRIAL RETANGULAR 80X40 PAREDE 2.00MM',
        ncm: '7306.61.00',
        cfop: '5101',
        lote: 'L-2026-9012',
        corrida: 'CR-8122',
        quantidade: 4.2,
        unidade: 't',
        pesoKg: 4200,
        pesoTon: 4.2,
        valorUnitario: 7100.0,
        valorTotal: 29820.0,
        certificadoId: 'cert-88996',
        certificadoNumero: 'CQ-88996',
      },
    ],
    quantidadeTotal: 12.6,
    pesoTon: 12.6,
    pesoKg: 12600,
    valorTotal: 87780.0,
    empresa: 'CIAFAL Matriz (0100)',
    centro: 'Centro Contagem MG (1010)',
    status: 'Autorizada',
    naturezaOperacao: 'Venda de Produção do Estabelecimento',
    informacoesComplementares:
      'Pedido de Venda PED-451004. Entrega programada no canteiro de obras de Betim.',
    temXml: true,
    temPdf: true,
    temCertificadoVinculado: true,
    boletoVinculadoId: 'bol-334103',
    numeroBoletoVinculado: 'BOL-334103',
    transporteInfo: {
      numeroTransporte: 'TR-88965',
      transportadora: 'TransAço Logística Rodoviária Ltda.',
      motorista: 'Claudio Roberto Ramos',
      placa: 'QPR-7B14',
      statusCarga: 'Em Trânsito',
      previsaoEntrega: '31/08/2026 17:30',
      comprovanteEntregaDisponivel: false,
    },
    vendedorId: 'qas-vendedor_teste',
    vendedorNome: 'Carlos Mendonça',
  },
  {
    id: 'nf-123459',
    numeroNF: '123459',
    serie: '1',
    chaveAcesso: '31260855667788000133550010001234591007788990',
    dataEmissao: '2026-08-15',
    dataEmissaoFormatada: '15/08/2026',
    dataSaida: '15/08/2026 11:00',
    codigoClienteSap: '100424',
    clienteId: 'cli-4',
    clienteNome: 'Aços & Perfis Triângulo Mineiro Ltda.',
    cnpj: '55.667.788/0001-33',
    pedidoSap: 'PED-450710',
    numeroTransporte: 'TR-88712',
    materialResumo: 'Perfis U Dobrados de Chapa e Cantoneiras de Abas Iguais',
    materiais: [
      {
        item: 10,
        codigo: 'MAT-PERF-U150',
        descricao: 'PERFIL ENRIJECIDO U 150X60X20 PAREDE 2.65MM (6M)',
        ncm: '7216.61.00',
        cfop: '5101',
        lote: 'L-2026-6510',
        corrida: 'CR-5412',
        quantidade: 10.2,
        unidade: 't',
        pesoKg: 10200,
        pesoTon: 10.2,
        valorUnitario: 6300.0,
        valorTotal: 64260.0,
        certificadoId: 'cert-88997',
        certificadoNumero: 'CQ-88997',
      },
    ],
    quantidadeTotal: 10.2,
    pesoTon: 10.2,
    pesoKg: 10200,
    valorTotal: 64260.0,
    empresa: 'CIAFAL Matriz (0100)',
    centro: 'Centro Contagem MG (1010)',
    status: 'Autorizada',
    naturezaOperacao: 'Venda de Mercadoria Produzida',
    informacoesComplementares: 'Boleto Vencido em 30/08/2026. Necessita atualização financeira.',
    temXml: true,
    temPdf: true,
    temCertificadoVinculado: true,
    boletoVinculadoId: 'bol-334104',
    numeroBoletoVinculado: 'BOL-334104',
    transporteInfo: {
      numeroTransporte: 'TR-88712',
      transportadora: 'Expresso Triângulo Cargas',
      motorista: 'Sebastião Antunes',
      placa: 'GXZ-3190',
      statusCarga: 'Entregue',
      previsaoEntrega: '16/08/2026 15:00',
      dataEntregaRealizada: '16/08/2026 14:10',
      comprovanteEntregaDisponivel: true,
      comprovanteId: 'comp-tr88712',
    },
    vendedorId: 'qas-vendedor_teste',
    vendedorNome: 'Carlos Mendonça',
  },
  {
    id: 'nf-123460',
    numeroNF: '123460',
    serie: '1',
    chaveAcesso: '31260833445566000144550010001234601006655441',
    dataEmissao: '2026-08-25',
    dataEmissaoFormatada: '25/08/2026',
    dataSaida: '25/08/2026 18:20',
    codigoClienteSap: '100425',
    clienteId: 'cli-5',
    clienteNome: 'Premoldados & Estruturas Horizonte Ltda.',
    cnpj: '33.445.566/0001-44',
    pedidoSap: 'PED-450840',
    numeroTransporte: 'TR-88890',
    materialResumo: 'Cordoalhas para Protensão 7 Fios e Telas Eletrosoldadas Q-196',
    materiais: [
      {
        item: 10,
        codigo: 'MAT-CORD-127',
        descricao: 'CORDOALHA 7 FIOS 12.7MM CP-190 RB (ROLO 2500KG)',
        ncm: '7312.10.90',
        cfop: '5101',
        lote: 'L-2026-7990',
        corrida: 'CR-7011',
        quantidade: 14.5,
        unidade: 't',
        pesoKg: 14500,
        pesoTon: 14.5,
        valorUnitario: 8200.0,
        valorTotal: 118900.0,
        certificadoId: 'cert-88998',
        certificadoNumero: 'CQ-88998',
      },
    ],
    quantidadeTotal: 14.5,
    pesoTon: 14.5,
    pesoKg: 14500,
    valorTotal: 118900.0,
    empresa: 'CIAFAL Matriz (0100)',
    centro: 'Centro Sabará MG (1030)',
    status: 'Autorizada',
    naturezaOperacao: 'Venda de Produção Própria',
    informacoesComplementares:
      'Certificado em elaboração no laboratório de ensaios físicos da Qualidade.',
    temXml: true,
    temPdf: true,
    temCertificadoVinculado: false, // Em análise pela Qualidade
    boletoVinculadoId: 'bol-334105',
    numeroBoletoVinculado: 'BOL-334105',
    transporteInfo: {
      numeroTransporte: 'TR-88890',
      transportadora: 'TransAço Logística Rodoviária Ltda.',
      motorista: 'Jorge Ferreira',
      placa: 'JJL-5041',
      statusCarga: 'Entregue',
      previsaoEntrega: '26/08/2026 10:00',
      dataEntregaRealizada: '26/08/2026 09:40',
      comprovanteEntregaDisponivel: true,
      comprovanteId: 'comp-tr88890',
    },
    vendedorId: 'qas-vendedor_teste',
    vendedorNome: 'Carlos Mendonça',
  },
  {
    id: 'nf-123461',
    numeroNF: '123461',
    serie: '1',
    chaveAcesso: '31260866778899000155550010001234611009988776',
    dataEmissao: '2026-08-31',
    dataEmissaoFormatada: '31/08/2026',
    dataSaida: '31/08/2026 13:00',
    codigoClienteSap: '100426',
    clienteId: 'cli-6',
    clienteNome: 'Serralheria & Esquadrias Santa Luzia ME',
    cnpj: '66.778.899/0001-55',
    pedidoSap: 'PED-451020',
    numeroTransporte: 'TR-88980',
    materialResumo: 'Barras Chatas 1x1/8" e Cantoneiras 1x1/8" SAE 1020',
    materiais: [
      {
        item: 10,
        codigo: 'MAT-BARR-CHAT-1',
        descricao: 'BARRA CHATA 1 X 1/8" (25.4X3.18MM) BARRAS 6M SAE 1020',
        ncm: '7214.91.00',
        cfop: '5101',
        lote: 'L-2026-8910',
        corrida: 'CR-8871',
        quantidade: 3.5,
        unidade: 't',
        pesoKg: 3500,
        pesoTon: 3.5,
        valorUnitario: 6100.0,
        valorTotal: 21350.0,
        certificadoId: 'cert-88999',
        certificadoNumero: 'CQ-88999',
      },
    ],
    quantidadeTotal: 3.5,
    pesoTon: 3.5,
    pesoKg: 3500,
    valorTotal: 21350.0,
    empresa: 'CIAFAL Matriz (0100)',
    centro: 'Centro Contagem MG (1010)',
    status: 'Autorizada',
    naturezaOperacao: 'Venda no Mercado Interno',
    informacoesComplementares: 'Vencimento hoje 31/08/2026. Acompanhar liquidação bancária.',
    temXml: true,
    temPdf: true,
    temCertificadoVinculado: true,
    boletoVinculadoId: 'bol-334106',
    numeroBoletoVinculado: 'BOL-334106',
    transporteInfo: {
      numeroTransporte: 'TR-88980',
      transportadora: 'Expresso Regional Express',
      motorista: 'Valdir Gomes',
      placa: 'KWW-1890',
      statusCarga: 'Em Trânsito',
      previsaoEntrega: '31/08/2026 16:45',
      comprovanteEntregaDisponivel: false,
    },
    vendedorId: 'qas-vendedor2_teste',
    vendedorNome: 'Mariana Azevedo',
  },
]

export const mockBoletos: BoletoFinanceiro[] = [
  {
    id: 'bol-334101',
    clienteId: 'cli-1',
    clienteNome: 'Construtora Vale do Aço Ltda.',
    codigoClienteSap: '100421',
    cnpj: '12.345.678/0001-99',
    numeroDocumento: '334101',
    numeroTitulo: 'FAT-2026-90112',
    numeroNfRelacionada: '123456',
    numeroPedido: 'PED-450921',
    dataEmissao: '2026-08-30',
    dataVencimento: '2026-09-29',
    dataVencimentoFormatada: '29/09/2026',
    valorOriginal: 162172.5,
    status: 'A vencer',
    banco: 'Banco do Brasil (001)',
    agenciaConta: 'Agência 3420-7 / C/C 45012-9',
    linhaDigitavel: '00190.00009 01234.567802 00199.550012 1 105820016217250',
    codigoBarras: '00191105820016217250000000123456780001995500',
    temSegundaViaDisponivel: true,
    requerSolicitacaoFinanceiro: false,
    vendedorId: 'qas-vendedor_teste',
    vendedorNome: 'Carlos Mendonça',
  },
  {
    id: 'bol-334102',
    clienteId: 'cli-2',
    clienteNome: 'Metalúrgica Minas Estruturas S.A.',
    codigoClienteSap: '100422',
    cnpj: '98.765.432/0001-11',
    numeroDocumento: '334102',
    numeroTitulo: 'FAT-2026-90088',
    numeroNfRelacionada: '123457',
    numeroPedido: 'PED-450889',
    dataEmissao: '2026-08-28',
    dataVencimento: '2026-09-27',
    dataVencimentoFormatada: '27/09/2026',
    valorOriginal: 118400.0,
    status: 'A vencer',
    banco: 'Itaú (341)',
    agenciaConta: 'Agência 0910 / C/C 88210-4',
    linhaDigitavel: '34191.09104 88210.450882 45088.900013 8 105800011840000',
    codigoBarras: '34198105800011840000109108821045088900010000',
    temSegundaViaDisponivel: true,
    requerSolicitacaoFinanceiro: false,
    vendedorId: 'qas-vendedor_teste',
    vendedorNome: 'Carlos Mendonça',
  },
  {
    id: 'bol-334103',
    clienteId: 'cli-3',
    clienteNome: 'Engenharia & Soluções Industriais Eireli',
    codigoClienteSap: '100423',
    cnpj: '45.678.901/0001-22',
    numeroDocumento: '334103',
    numeroTitulo: 'FAT-2026-90150',
    numeroNfRelacionada: '123458',
    numeroPedido: 'PED-451004',
    dataEmissao: '2026-08-31',
    dataVencimento: '2026-09-30',
    dataVencimentoFormatada: '30/09/2026',
    valorOriginal: 87780.0,
    status: 'A vencer',
    banco: 'Bradesco (237)',
    agenciaConta: 'Agência 2314-0 / C/C 19283-7',
    linhaDigitavel: '23792.31405 19283.745103 45100.400017 4 105830008778000',
    codigoBarras: '23794105830008778000231401928374510040001000',
    temSegundaViaDisponivel: true,
    requerSolicitacaoFinanceiro: false,
    vendedorId: 'qas-vendedor_teste',
    vendedorNome: 'Carlos Mendonça',
  },
  {
    id: 'bol-334104',
    clienteId: 'cli-4',
    clienteNome: 'Aços & Perfis Triângulo Mineiro Ltda.',
    codigoClienteSap: '100424',
    cnpj: '55.667.788/0001-33',
    numeroDocumento: '334104',
    numeroTitulo: 'FAT-2026-89540',
    numeroNfRelacionada: '123459',
    numeroPedido: 'PED-450710',
    dataEmissao: '2026-08-15',
    dataVencimento: '2026-08-30',
    dataVencimentoFormatada: '30/08/2026',
    valorOriginal: 64260.0,
    diasAtraso: 1,
    status: 'Vencido',
    banco: 'Banco do Brasil (001)',
    agenciaConta: 'Agência 3420-7 / C/C 45012-9',
    linhaDigitavel: '00190.00009 55667.788004 00133.550014 9 105520006426000',
    codigoBarras: '00199105520006426000000005566778800013355000',
    temSegundaViaDisponivel: false,
    requerSolicitacaoFinanceiro: true,
    vendedorId: 'qas-vendedor_teste',
    vendedorNome: 'Carlos Mendonça',
    historicoSolicitacoes: [
      {
        protocolo: 'SOL-FIN-2026-0891',
        dataSolicitacao: '31/08/2026 09:10',
        solicitante: 'Carlos Mendonça',
        status: 'EM_ANALISE_FINANCEIRO',
        slaHoras: 4,
      },
    ],
  },
  {
    id: 'bol-334105',
    clienteId: 'cli-5',
    clienteNome: 'Premoldados & Estruturas Horizonte Ltda.',
    codigoClienteSap: '100425',
    cnpj: '33.445.566/0001-44',
    numeroDocumento: '334105',
    numeroTitulo: 'FAT-2026-89912',
    numeroNfRelacionada: '123460',
    numeroPedido: 'PED-450840',
    dataEmissao: '2026-08-25',
    dataVencimento: '2026-09-24',
    dataVencimentoFormatada: '24/09/2026',
    valorOriginal: 118900.0,
    status: 'A vencer',
    banco: 'Santander (033)',
    agenciaConta: 'Agência 4102 / C/C 13009842-1',
    linhaDigitavel: '03399.41028 13009.842104 45084.000016 3 105770011890000',
    codigoBarras: '03393105770011890000941021300984210445084000',
    temSegundaViaDisponivel: true,
    requerSolicitacaoFinanceiro: false,
    vendedorId: 'qas-vendedor_teste',
    vendedorNome: 'Carlos Mendonça',
  },
  {
    id: 'bol-334106',
    clienteId: 'cli-6',
    clienteNome: 'Serralheria & Esquadrias Santa Luzia ME',
    codigoClienteSap: '100426',
    cnpj: '66.778.899/0001-55',
    numeroDocumento: '334106',
    numeroTitulo: 'FAT-2026-90188',
    numeroNfRelacionada: '123461',
    numeroPedido: 'PED-451020',
    dataEmissao: '2026-08-31',
    dataVencimento: '2026-08-31',
    dataVencimentoFormatada: '31/08/2026',
    valorOriginal: 21350.0,
    status: 'Vence hoje',
    banco: 'Sicoob (756)',
    agenciaConta: 'Agência 4022 / C/C 0089201-3',
    linhaDigitavel: '75691.40224 00892.013458 45102.000012 2 105530002135000',
    codigoBarras: '75692105530002135000140220089201345845102000',
    temSegundaViaDisponivel: true,
    requerSolicitacaoFinanceiro: false,
    vendedorId: 'qas-vendedor2_teste',
    vendedorNome: 'Mariana Azevedo',
  },
]

export const mockCertificados: CertificadoQualidade[] = [
  {
    id: 'cert-88992',
    numeroCertificado: 'CQ-88992',
    numeroNF: '123456',
    itemNF: 10,
    pedidoSap: 'PED-450921',
    clienteId: 'cli-1',
    clienteNome: 'Construtora Vale do Aço Ltda.',
    codigoClienteSap: '100421',
    cnpj: '12.345.678/0001-99',
    materialCodigo: 'MAT-CA50-100',
    materialDescricao: 'VERGALHÃO CA-50 10.0MM BARRAS 12M',
    especificacaoTecnica:
      'ABNT NBR 7480:2022 - Aço Destinado a Armaduras para Estruturas de Concreto Armado',
    lote: 'L-2026-8801',
    corrida: 'CR-9042',
    ordemProducao: 'OP-55410',
    quantidade: 15.0,
    unidade: 't',
    pesoTon: 15.0,
    dataEmissao: '30/08/2026',
    unidadeProdutora: 'CIAFAL Usina Contagem / MG',
    responsavelTecnico: 'Eng. Roberto Vasconcelos',
    crqResponsavel: 'CRQ-MG 0241088',
    statusCertificado: 'Aprovado',
    propriedadesMecanicas: {
      escoamentoMpa: 545, // Min 500 MPa
      resistenciaMpa: 630, // Min 540 MPa (fst/fyt >= 1.08)
      alongamentoPct: 14.2, // Min 8%
      dobramento: '180° sem trincas nem fissuras (Pino 3d)',
    },
    composicaoQuimica: {
      c: 0.28, // Max 0.50%
      mn: 1.15,
      si: 0.22,
      p: 0.024, // Max 0.050%
      s: 0.021, // Max 0.050%
      ce: 0.44, // Carbono Equivalente Max 0.55%
    },
    vendedorId: 'qas-vendedor_teste',
  },
  {
    id: 'cert-88993',
    numeroCertificado: 'CQ-88993',
    numeroNF: '123456',
    itemNF: 20,
    pedidoSap: 'PED-450921',
    clienteId: 'cli-1',
    clienteNome: 'Construtora Vale do Aço Ltda.',
    codigoClienteSap: '100421',
    cnpj: '12.345.678/0001-99',
    materialCodigo: 'MAT-CA50-125',
    materialDescricao: 'VERGALHÃO CA-50 12.5MM BARRAS 12M',
    especificacaoTecnica: 'ABNT NBR 7480:2022 - CA-50 Soldável',
    lote: 'L-2026-8802',
    corrida: 'CR-9045',
    ordemProducao: 'OP-55412',
    quantidade: 12.85,
    unidade: 't',
    pesoTon: 12.85,
    dataEmissao: '30/08/2026',
    unidadeProdutora: 'CIAFAL Usina Contagem / MG',
    responsavelTecnico: 'Eng. Roberto Vasconcelos',
    crqResponsavel: 'CRQ-MG 0241088',
    statusCertificado: 'Aprovado',
    propriedadesMecanicas: {
      escoamentoMpa: 538,
      resistenciaMpa: 625,
      alongamentoPct: 15.0,
      dobramento: '180° sem trincas (Pino 3d)',
    },
    composicaoQuimica: {
      c: 0.27,
      mn: 1.18,
      si: 0.2,
      p: 0.022,
      s: 0.019,
      ce: 0.43,
    },
    vendedorId: 'qas-vendedor_teste',
  },
  {
    id: 'cert-88994',
    numeroCertificado: 'CQ-88994',
    numeroNF: '123457',
    itemNF: 10,
    pedidoSap: 'PED-450889',
    clienteId: 'cli-2',
    clienteNome: 'Metalúrgica Minas Estruturas S.A.',
    codigoClienteSap: '100422',
    cnpj: '98.765.432/0001-11',
    materialCodigo: 'MAT-VIGA-W200',
    materialDescricao: 'VIGA LAMINADA W 200 X 22.5 ASTM A572 GR 50',
    especificacaoTecnica:
      'ASTM A572 / A572M Grade 50 - High-Strength Low-Alloy Columbium-Vanadium Structural Steel',
    lote: 'L-2026-7731',
    corrida: 'CR-6540',
    ordemProducao: 'OP-54910',
    quantidade: 18.5,
    unidade: 't',
    pesoTon: 18.5,
    dataEmissao: '28/08/2026',
    unidadeProdutora: 'CIAFAL Usina Betim / MG',
    responsavelTecnico: 'Engª. Juliana Meireles',
    crqResponsavel: 'CRQ-MG 0198421',
    statusCertificado: 'Aprovado',
    propriedadesMecanicas: {
      escoamentoMpa: 385, // Min 345 MPa
      resistenciaMpa: 510, // Min 450 MPa
      alongamentoPct: 22.0, // Min 18% em 200mm
      dobramento: 'Conforme ASTM A6/A6M',
    },
    composicaoQuimica: {
      c: 0.16,
      mn: 1.25,
      si: 0.28,
      p: 0.018,
      s: 0.012,
      ce: 0.38,
    },
    vendedorId: 'qas-vendedor_teste',
  },
  {
    id: 'cert-88995',
    numeroCertificado: 'CQ-88995',
    numeroNF: '123458',
    itemNF: 10,
    pedidoSap: 'PED-451004',
    clienteId: 'cli-3',
    clienteNome: 'Engenharia & Soluções Industriais Eireli',
    codigoClienteSap: '100423',
    cnpj: '45.678.901/0001-22',
    materialCodigo: 'MAT-CHAPA-FF14',
    materialDescricao: 'CHAPA FINA A FRIO 1.50MM 1200X3000 SAE 1008',
    especificacaoTecnica: 'NBR 5915-2 / SAE 1008 - Estampagem e Conformação a Frio',
    lote: 'L-2026-9011',
    corrida: 'CR-8120',
    ordemProducao: 'OP-55820',
    quantidade: 8.4,
    unidade: 't',
    pesoTon: 8.4,
    dataEmissao: '31/08/2026',
    unidadeProdutora: 'CIAFAL Usina Contagem / MG',
    responsavelTecnico: 'Eng. Roberto Vasconcelos',
    crqResponsavel: 'CRQ-MG 0241088',
    statusCertificado: 'Aprovado',
    propriedadesMecanicas: {
      escoamentoMpa: 210,
      resistenciaMpa: 340,
      alongamentoPct: 36.5,
      dobramento: '180° colado',
    },
    composicaoQuimica: {
      c: 0.06,
      mn: 0.35,
      si: 0.02,
      p: 0.012,
      s: 0.008,
      ce: 0.12,
    },
    vendedorId: 'qas-vendedor_teste',
  },
  {
    id: 'cert-88996',
    numeroCertificado: 'CQ-88996',
    numeroNF: '123458',
    itemNF: 20,
    pedidoSap: 'PED-451004',
    clienteId: 'cli-3',
    clienteNome: 'Engenharia & Soluções Industriais Eireli',
    codigoClienteSap: '100423',
    cnpj: '45.678.901/0001-22',
    materialCodigo: 'MAT-TUBO-8040',
    materialDescricao: 'TUBO INDUSTRIAL RETANGULAR 80X40 PAREDE 2.00MM',
    especificacaoTecnica: 'NBR 6591 / NBR 8261 Estrutural Grau B',
    lote: 'L-2026-9012',
    corrida: 'CR-8122',
    ordemProducao: 'OP-55821',
    quantidade: 4.2,
    unidade: 't',
    pesoTon: 4.2,
    dataEmissao: '31/08/2026',
    unidadeProdutora: 'CIAFAL Usina Contagem / MG',
    responsavelTecnico: 'Eng. Roberto Vasconcelos',
    crqResponsavel: 'CRQ-MG 0241088',
    statusCertificado: 'Aprovado',
    propriedadesMecanicas: {
      escoamentoMpa: 320,
      resistenciaMpa: 440,
      alongamentoPct: 25.0,
      dobramento: 'Achatamento total sem trincas na solda ERW',
    },
    composicaoQuimica: {
      c: 0.12,
      mn: 0.5,
      si: 0.05,
      p: 0.015,
      s: 0.01,
      ce: 0.21,
    },
    vendedorId: 'qas-vendedor_teste',
  },
  {
    id: 'cert-88997',
    numeroCertificado: 'CQ-88997',
    numeroNF: '123459',
    itemNF: 10,
    pedidoSap: 'PED-450710',
    clienteId: 'cli-4',
    clienteNome: 'Aços & Perfis Triângulo Mineiro Ltda.',
    codigoClienteSap: '100424',
    cnpj: '55.667.788/0001-33',
    materialCodigo: 'MAT-PERF-U150',
    materialDescricao: 'PERFIL ENRIJECIDO U 150X60X20 PAREDE 2.65MM (6M)',
    especificacaoTecnica: 'NBR 6355 / NBR 6673 ZAR-230 Galvanizado',
    lote: 'L-2026-6510',
    corrida: 'CR-5412',
    ordemProducao: 'OP-53901',
    quantidade: 10.2,
    unidade: 't',
    pesoTon: 10.2,
    dataEmissao: '15/08/2026',
    unidadeProdutora: 'CIAFAL Usina Contagem / MG',
    responsavelTecnico: 'Eng. Roberto Vasconcelos',
    crqResponsavel: 'CRQ-MG 0241088',
    statusCertificado: 'Aprovado',
    propriedadesMecanicas: {
      escoamentoMpa: 275,
      resistenciaMpa: 395,
      alongamentoPct: 24.5,
      dobramento: '180° sem destacamento da camada Z275',
    },
    composicaoQuimica: {
      c: 0.1,
      mn: 0.45,
      si: 0.04,
      p: 0.016,
      s: 0.011,
      ce: 0.18,
    },
    vendedorId: 'qas-vendedor_teste',
  },
]

export const mockPacotesDocumentais: PacoteDocumentalCliente[] = [
  {
    id: 'pct-123456',
    clienteId: 'cli-1',
    clienteNome: 'Construtora Vale do Aço Ltda.',
    codigoClienteSap: '100421',
    cnpj: '12.345.678/0001-99',
    pedidoSap: 'PED-450921',
    dataFaturamento: '30/08/2026',
    dataEntrega: '31/08/2026',
    statusFluxo: 'Concluído',
    valorTotal: 162172.5,
    pesoTon: 27.85,
    nf: mockNotasFiscais[0],
    boletos: [mockBoletos[0]],
    certificados: [mockCertificados[0], mockCertificados[1]],
    transporte: {
      numeroTransporte: 'TR-88902',
      transportadora: 'TransAço Logística Rodoviária Ltda.',
      motorista: 'Marcos Silveira',
      placa: 'HMG-4A88',
      status: 'Entregue com Sucesso',
      dataSaida: '30/08/2026 14:30',
      dataPrevisao: '31/08/2026 11:00',
      dataEntrega: '31/08/2026 10:45',
      comprovanteUrl: 'comp-tr88902',
    },
  },
  {
    id: 'pct-123457',
    clienteId: 'cli-2',
    clienteNome: 'Metalúrgica Minas Estruturas S.A.',
    codigoClienteSap: '100422',
    cnpj: '98.765.432/0001-11',
    pedidoSap: 'PED-450889',
    dataFaturamento: '28/08/2026',
    dataEntrega: '29/08/2026',
    statusFluxo: 'Concluído',
    valorTotal: 118400.0,
    pesoTon: 18.5,
    nf: mockNotasFiscais[1],
    boletos: [mockBoletos[1]],
    certificados: [mockCertificados[2]],
    transporte: {
      numeroTransporte: 'TR-88840',
      transportadora: 'RodoMinas Express',
      motorista: 'Paulo Henrique Duarte',
      placa: 'PVB-9812',
      status: 'Entregue com Sucesso',
      dataSaida: '28/08/2026 16:00',
      dataPrevisao: '29/08/2026 14:00',
      dataEntrega: '29/08/2026 13:20',
      comprovanteUrl: 'comp-tr88840',
    },
  },
  {
    id: 'pct-123458',
    clienteId: 'cli-3',
    clienteNome: 'Engenharia & Soluções Industriais Eireli',
    codigoClienteSap: '100423',
    cnpj: '45.678.901/0001-22',
    pedidoSap: 'PED-451004',
    dataFaturamento: '31/08/2026',
    dataEntrega: '31/08/2026',
    statusFluxo: 'Em Andamento',
    valorTotal: 87780.0,
    pesoTon: 12.6,
    nf: mockNotasFiscais[2],
    boletos: [mockBoletos[2]],
    certificados: [mockCertificados[3], mockCertificados[4]],
    transporte: {
      numeroTransporte: 'TR-88965',
      transportadora: 'TransAço Logística Rodoviária Ltda.',
      motorista: 'Claudio Roberto Ramos',
      placa: 'QPR-7B14',
      status: 'Em Trânsito - Destino Canteiro Betim',
      dataSaida: '31/08/2026 09:15',
      dataPrevisao: '31/08/2026 17:30',
    },
  },
]

export const mockSolicitacoesFinanceiro: SolicitacaoFinanceiroRegistro[] = [
  {
    id: 'sol-0891',
    protocolo: 'SOL-FIN-2026-0891',
    clienteId: 'cli-4',
    clienteNome: 'Aços & Perfis Triângulo Mineiro Ltda.',
    codigoClienteSap: '100424',
    cnpj: '55.667.788/0001-33',
    numeroBoleto: 'BOL-334104',
    numeroNF: '123459',
    valorOriginal: 64260.0,
    dataVencimentoOriginal: '30/08/2026',
    novaDataSugerida: '08/09/2026',
    motivo:
      'Cliente alega atraso no recebimento de medição pública. Solicitada prorrogação de 8 dias com juros pro-rata bancário.',
    solicitanteId: 'qas-vendedor_teste',
    solicitanteNome: 'Carlos Mendonça',
    status: 'EM_ANALISE_FINANCEIRO',
    analistaFinanceiro: 'Renata Borges (Tesouraria / Contas a Receber)',
    slaHoras: 4,
    prazoLimite: '31/08/2026 13:10',
    dataCriacao: '31/08/2026 09:10',
  },
]

export const mockLogsAuditoriaConsultas: LogAuditoriaConsulta[] = [
  {
    id: 'log-101',
    usuarioId: 'qas-vendedor_teste',
    usuarioNome: 'Carlos Mendonça',
    usuarioRole: 'vendedor',
    clienteId: 'cli-1',
    clienteSap: '100421',
    clienteNome: 'Construtora Vale do Aço Ltda.',
    tipoAcao: 'VIEW_NF',
    tipoDocumento: 'NF',
    numeroDocumento: '123456',
    canal: 'Visualização Direta',
    ip: '187.24.110.42',
    status: 'SUCCESS',
    mensagemDetalhe: 'Visualizou preview DANFE da NF 123456',
    dataHora: '31/08/2026 10:32',
  },
  {
    id: 'log-102',
    usuarioId: 'qas-vendedor_teste',
    usuarioNome: 'Carlos Mendonça',
    usuarioRole: 'vendedor',
    clienteId: 'cli-1',
    clienteSap: '100421',
    clienteNome: 'Construtora Vale do Aço Ltda.',
    tipoAcao: 'DISPATCH_EMAIL',
    tipoDocumento: 'MULTI_PACKAGE',
    numeroDocumento: 'NF-123456 + BOL-334101',
    canal: 'E-mail',
    destinatario: 'financeiro@valedoacoeng.com.br',
    ip: '187.24.110.42',
    status: 'SUCCESS',
    mensagemDetalhe:
      'Enviou pacote documental (NF 123456 + Boleto 334101) por e-mail com mensagem gerada por IA',
    dataHora: '31/08/2026 10:34',
  },
  {
    id: 'log-103',
    usuarioId: 'qas-vendedor_teste',
    usuarioNome: 'Carlos Mendonça',
    usuarioRole: 'vendedor',
    clienteId: 'cli-1',
    clienteSap: '100421',
    clienteNome: 'Construtora Vale do Aço Ltda.',
    tipoAcao: 'DISPATCH_WHATSAPP',
    tipoDocumento: 'CERTIFICADO',
    numeroDocumento: 'CQ-88992',
    canal: 'WhatsApp',
    destinatario: '+55 31 98822-1090 (Eng. Marcos)',
    ip: '187.24.110.42',
    status: 'SUCCESS',
    mensagemDetalhe: 'Enviou Certificado de Qualidade CQ-88992 via WhatsApp Oficial',
    dataHora: '31/08/2026 10:35',
  },
]
