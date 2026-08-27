import pb from '@/lib/pocketbase/client'
import type {
  Quotation,
  QuotationItem,
  QuotationStatus,
  StockSnapshotRecord,
  StockConfirmationRequest,
  SapOrderQueueItem,
  SapOrderMessage,
  QuotationCommunication,
  StockSituation,
} from '@/types/quotation'

// Configurações comerciais
export const STOCK_CONFIRMATION_THRESHOLD_TONS = 5.0

// Banco de dados em memória / localStorage para fallback rápido e alta responsividade
const STORAGE_KEY_QUOTES = 'ciafal_crm_quotations'
const STORAGE_KEY_STOCK = 'ciafal_sap_stock_snapshot'
const STORAGE_KEY_STOCK_CONFIRM = 'ciafal_stock_confirmation_requests'
const STORAGE_KEY_SAP_QUEUE = 'ciafal_crm_sap_order_queue'
const STORAGE_KEY_SAP_MSGS = 'ciafal_crm_sap_order_messages'
const STORAGE_KEY_COMMUNICATIONS = 'ciafal_quotation_communications'

// Catálogo Mestre de Materiais SAP ECC
export interface CatalogMaterial {
  code: string
  description: string
  family: string
  dimension: string
  unit: string
  sapPrice: number
  availableStock: number
  plant: string
  storageLocation: string
  stockUpdatedAt: string
}

export const CATALOG_MATERIALS: CatalogMaterial[] = [
  {
    code: 'TB-304-SCH10',
    description: 'Tubo Inox AISI 304 Redondo SCH 10 2"',
    family: 'Tubos e Perfis Inox',
    dimension: 'DN 2" (60.30mm x 2.77mm)',
    unit: 't',
    sapPrice: 34500,
    availableStock: 12.5,
    plant: '1000 - Contagem Matriz',
    storageLocation: '0001 - Depósito Tubos Inox',
    stockUpdatedAt: '2024-10-24 16:30',
  },
  {
    code: 'CH-304-3MM',
    description: 'Chapa Inox AISI 304 3.00mm Escovada',
    family: 'Chapas Inox',
    dimension: '3.00mm x 1250mm x 3000mm',
    unit: 't',
    sapPrice: 32800,
    availableStock: 3.2, // < 5t => triggers stock confirmation!
    plant: '1000 - Contagem Matriz',
    storageLocation: '0002 - Pátio Chapas Planas',
    stockUpdatedAt: '2024-10-24 16:30',
  },
  {
    code: 'VIG-W200-26',
    description: 'Viga Estrutural Gerdau W 200 x 26.6 kg/m',
    family: 'Perfis & Vigas Laminadas',
    dimension: 'W 200 x 26.6 (Barras 12m)',
    unit: 't',
    sapPrice: 7850,
    availableStock: 18.0,
    plant: '2000 - Filial Betim',
    storageLocation: '0001 - Pátio Vigas Laminadas',
    stockUpdatedAt: '2024-10-24 16:30',
  },
  {
    code: 'CH-A36-12MM',
    description: 'Chapa Grossa de Aço Carbono ASTM A36 12.5mm',
    family: 'Chapas Grossas Carbono',
    dimension: '1/2" x 2400mm x 6000mm',
    unit: 't',
    sapPrice: 6400,
    availableStock: 4.8, // < 5t => triggers stock confirmation!
    plant: '1000 - Contagem Matriz',
    storageLocation: '0002 - Pátio Chapas Planas',
    stockUpdatedAt: '2024-10-24 16:30',
  },
  {
    code: 'BOB-INOX-430',
    description: 'Bobina de Inox Ferrítico AISI 430 1.20mm',
    family: 'Bobinas & Rolos Inox',
    dimension: '1.20mm x 1200mm',
    unit: 't',
    sapPrice: 28900,
    availableStock: 0, // Sem estoque
    plant: '1000 - Contagem Matriz',
    storageLocation: '0003 - Linha de Corte',
    stockUpdatedAt: '2024-10-24 16:30',
  },
  {
    code: 'PERF-U-100',
    description: 'Perfil U Dobrado Aço Carbono 100 x 40 x 3.00mm',
    family: 'Perfis Dobrados',
    dimension: '100 x 40 x 3.00mm (6m)',
    unit: 't',
    sapPrice: 6900,
    availableStock: 9.4,
    plant: '1000 - Contagem Matriz',
    storageLocation: '0001 - Pátio Perfis',
    stockUpdatedAt: '2024-10-24 16:30',
  },
]

// Clientes Pré-cadastrados com Ship-To do SAP
export interface PreloadedCustomer {
  id: string
  sapCode: string
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  cidade: string
  uf: string
  vendedor: string
  contatos: Array<{
    nome: string
    cargo: string
    telefone: string
    email: string
  }>
  shipToAddresses: Array<{
    code: string
    label: string
    address: string
  }>
  condicoesPagamento: string[]
  salesOrg: string
  distributionChannel: string
  division: string
  limiteCreditoDisponivel: number
}

export const PRELOADED_CUSTOMERS: PreloadedCustomer[] = [
  {
    id: 'CLI-8041',
    sapCode: '0001088041',
    razaoSocial: 'Metalúrgica Santa Rita Ltda',
    nomeFantasia: 'Santa Rita Estruturas',
    cnpj: '45.182.903/0001-44',
    cidade: 'Campinas',
    uf: 'SP',
    vendedor: 'Carlos Mendonça',
    contatos: [
      {
        nome: 'Roberto Antunes',
        cargo: 'Gerente de Compras',
        telefone: '(19) 99872-4411',
        email: 'compras@santarita.ind.br',
      },
      {
        nome: 'Juliana Costa',
        cargo: 'Engenheira de Suprimentos',
        telefone: '(19) 98711-2299',
        email: 'juliana.costa@santarita.ind.br',
      },
    ],
    shipToAddresses: [
      {
        code: '0001088041-01',
        label: 'Planta Principal - Fábrica Campinas',
        address: 'Av. das Indústrias, 1200 - Distrito Industrial - Campinas/SP',
      },
      {
        code: '0001088041-02',
        label: 'Canteiro Obra Viracopos',
        address: 'Rodovia Santos Dumont, Km 66 - Campinas/SP',
      },
    ],
    condicoesPagamento: ['28/42/56 DDL (Boleto)', '30/60 DDL', '28 DDL', 'À Vista (TED/PIX)'],
    salesOrg: '1000',
    distributionChannel: '10',
    division: '20',
    limiteCreditoDisponivel: 95000,
  },
  {
    id: 'CLI-7910',
    sapCode: '0001087910',
    razaoSocial: 'Caldeiraria & Tanques Industrial Paulista',
    nomeFantasia: 'Tanques Paulista',
    cnpj: '12.894.210/0001-92',
    cidade: 'Sertãozinho',
    uf: 'SP',
    vendedor: 'Carlos Mendonça',
    contatos: [
      {
        nome: 'Fernando Silveira',
        cargo: 'Diretor de Suprimentos',
        telefone: '(16) 99123-8877',
        email: 'fernando@tanquespaulista.com.br',
      },
    ],
    shipToAddresses: [
      {
        code: '0001087910-01',
        label: 'Unidade Industrial Sertãozinho',
        address: 'Rodovia Anhanguera, Km 312 - Sertãozinho/SP',
      },
    ],
    condicoesPagamento: ['30/60 DDL', '45 DDL', '28 DDL', 'À Vista'],
    salesOrg: '1000',
    distributionChannel: '10',
    division: '25',
    limiteCreditoDisponivel: 210000,
  },
  {
    id: 'CLI-6523',
    sapCode: '0001086523',
    razaoSocial: 'Indústria Mecânica Alvorada S/A',
    nomeFantasia: 'Alvorada Autopeças',
    cnpj: '03.771.820/0002-18',
    cidade: 'Joinville',
    uf: 'SC',
    vendedor: 'Carlos Mendonça',
    contatos: [
      {
        nome: 'Cláudia Meireles',
        cargo: 'Compradora Pleno',
        telefone: '(47) 99744-1188',
        email: 'claudia.m@mecanicaalvorada.com.br',
      },
    ],
    shipToAddresses: [
      {
        code: '0001086523-01',
        label: 'Fábrica Joinville',
        address: 'Rua Dona Francisca, 8300 - Distrito Industrial - Joinville/SC',
      },
    ],
    condicoesPagamento: ['28 DDL', '30/60 DDL', 'À Vista'],
    salesOrg: '2000',
    distributionChannel: '10',
    division: '15',
    limiteCreditoDisponivel: 150000,
  },
]

// Mock Inicial de Cotações
const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'quote-98104',
    code: 'COT-98104',
    version: 1,
    customer_id: 'CLI-8041',
    customer_sap_code: '0001088041',
    customer_name: 'Metalúrgica Santa Rita Ltda',
    customer_cnpj: '45.182.903/0001-44',
    contact_name: 'Roberto Antunes',
    contact_email: 'compras@santarita.ind.br',
    contact_phone: '(19) 99872-4411',
    ship_to_code: '0001088041-01',
    ship_to_address: 'Av. das Indústrias, 1200 - Distrito Industrial - Campinas/SP',
    seller_id: 'qas-vendedor_teste',
    seller_name: 'Carlos Mendonça',
    issue_date: '2024-10-24',
    valid_until: '2024-11-05',
    payment_terms: '28/42/56 DDL (Boleto)',
    incoterm: 'CIF - Posto Cliente',
    freight_type: 'CIF',
    freight_value: 2500,
    currency: 'BRL',
    sales_org: '1000',
    distribution_channel: '10',
    division: '20',
    items: [
      {
        id: 'item-1',
        item_sequence: 10,
        material_code: 'TB-304-SCH10',
        description: 'Tubo Inox AISI 304 Redondo SCH 10 2"',
        family: 'Tubos e Perfis Inox',
        dimension: 'DN 2" (60.30mm x 2.77mm)',
        quantity: 6.0,
        unit: 't',
        requested_date: '2024-11-10',
        sap_price: 34500,
        proposed_price: 34000,
        deviation_pct: -1.45,
        final_price: 34000,
        total: 204000,
        stock_available: 12.5,
        stock_situation: 'ESTOQUE_SUFICIENTE',
        stock_updated_at: '2024-10-24 16:30',
        stock_confirmation_required: false,
        stock_confirmed: true,
        price_justification:
          'Desconto comercial dentro do limite de alçada para fechamento imediato.',
        plant: '1000 - Contagem Matriz',
        storage_location: '0001 - Depósito Tubos Inox',
      },
    ],
    subtotal: 204000,
    discount_total: 3000,
    surcharge_total: 0,
    total_tons: 6.0,
    total_value: 206500,
    price_status: 'DENTRO_DA_REGRA',
    stock_status: 'ESTOQUE_SUFICIENTE',
    approval_status: 'APROVADA_AUTOMATICAMENTE',
    approval_level_required: 'NENHUM',
    client_status: 'ACEITA',
    client_acceptance_notes: 'Cliente formalizou aceite via WhatsApp com PO #PO-88219.',
    client_accepted_at: '2024-10-24 17:50',
    status: 'AGUARDANDO_IMPLANTACAO_SAP',
    notes: 'Entrega programada para primeira quinzena de Novembro com caminhão dedicado.',
    sap_order_number: '',
    sap_processing_status: 'Posicionado na fila de integração SAP',
    timeline: [
      {
        time: '16:30',
        description: 'Posição de estoque SAP sincronizada com sucesso (TB-304-SCH10: 12.5t)',
        type: 'INFO',
      },
      {
        time: '17:00',
        description: 'Cotação COT-98104 v1 criada por Carlos Mendonça',
        type: 'INFO',
      },
      {
        time: '17:05',
        description: 'Aprovação de preços concluída automaticamente (Desvio: -1.45%)',
        type: 'SUCCESS',
      },
      {
        time: '17:15',
        description: 'PDF oficial gerado e enviado via WhatsApp para Roberto Antunes',
        type: 'INFO',
      },
      {
        time: '17:50',
        description: 'Aceite do cliente registrado com PO #PO-88219',
        type: 'SUCCESS',
      },
      {
        time: '17:52',
        description: 'Solicitação de implantação no SAP ECC gerada na fila de integração',
        type: 'SAP',
      },
    ],
    pricing_snapshot: {
      base_list_price: 34500,
      taxes_pct: 18.25,
      freight_component: 2500,
      standard_margin_pct: 22.5,
      proposed_margin_pct: 21.3,
      payment_term_surcharge_pct: 2.5,
      raw_cost: 24200,
      created_at: '2024-10-24 17:00',
    },
    created: '2024-10-24 17:00',
  },
  {
    id: 'quote-98105',
    code: 'COT-98105',
    version: 1,
    customer_id: 'CLI-7910',
    customer_sap_code: '0001087910',
    customer_name: 'Caldeiraria & Tanques Industrial Paulista',
    customer_cnpj: '12.894.210/0001-92',
    contact_name: 'Fernando Silveira',
    contact_email: 'fernando@tanquespaulista.com.br',
    contact_phone: '(16) 99123-8877',
    ship_to_code: '0001087910-01',
    ship_to_address: 'Rodovia Anhanguera, Km 312 - Sertãozinho/SP',
    seller_id: 'qas-vendedor_teste',
    seller_name: 'Carlos Mendonça',
    issue_date: '2024-10-24',
    valid_until: '2024-11-02',
    payment_terms: '30/60 DDL',
    incoterm: 'FOB - Retira Betim',
    freight_type: 'FOB',
    freight_value: 0,
    currency: 'BRL',
    sales_org: '1000',
    distribution_channel: '10',
    division: '25',
    items: [
      {
        id: 'item-105-1',
        item_sequence: 10,
        material_code: 'CH-304-3MM',
        description: 'Chapa Inox AISI 304 3.00mm Escovada',
        family: 'Chapas Inox',
        dimension: '3.00mm x 1250mm x 3000mm',
        quantity: 4.5,
        unit: 't',
        requested_date: '2024-11-05',
        sap_price: 32800,
        proposed_price: 29500,
        deviation_pct: -10.06,
        final_price: 29500,
        total: 132750,
        stock_available: 3.2, // < 5t => triggers stock confirmation
        stock_situation: 'ESTOQUE_BAIXO',
        stock_updated_at: '2024-10-24 16:30',
        stock_confirmation_required: true,
        stock_confirmed: false,
        price_justification:
          'Volume expressivo em negociação de projeto industrial com concorrência acirrada.',
        plant: '1000 - Contagem Matriz',
        storage_location: '0002 - Pátio Chapas Planas',
      },
    ],
    subtotal: 132750,
    discount_total: 14850,
    surcharge_total: 0,
    total_tons: 4.5,
    total_value: 132750,
    price_status: 'EXCECAO_PRECO',
    stock_status: 'AGUARDANDO_CONFIRMACAO',
    approval_status: 'AGUARDANDO_APROVACAO',
    approval_level_required: 'GERENCIA',
    client_status: 'EM_NEGOCIACAO',
    status: 'AGUARDANDO_CONFIRMACAO_ESTOQUE',
    notes: 'Cliente aguarda confirmação de estoque e flexibilização de tabela.',
    timeline: [
      {
        time: '16:30',
        description: 'Estoque de CH-304-3MM identificado abaixo de 5t (Disponível: 3.2t)',
        type: 'WARNING',
      },
      {
        time: '17:20',
        description: 'Cotação COT-98105 criada com desvio de -10.06% (Requer Gerência)',
        type: 'WARNING',
      },
      {
        time: '17:25',
        description: 'Solicitação de confirmação de estoque enviada para PCP / Laminação Inox',
        type: 'INFO',
      },
    ],
    pricing_snapshot: {
      base_list_price: 32800,
      taxes_pct: 18.25,
      freight_component: 0,
      standard_margin_pct: 24.0,
      proposed_margin_pct: 14.8,
      payment_term_surcharge_pct: 3.0,
      raw_cost: 23100,
      created_at: '2024-10-24 17:20',
    },
    created: '2024-10-24 17:20',
  },
  {
    id: 'quote-98106',
    code: 'COT-98106',
    version: 1,
    customer_id: 'CLI-6523',
    customer_sap_code: '0001086523',
    customer_name: 'Indústria Mecânica Alvorada S/A',
    customer_cnpj: '03.771.820/0002-18',
    contact_name: 'Cláudia Meireles',
    contact_email: 'claudia.m@mecanicaalvorada.com.br',
    contact_phone: '(47) 99744-1188',
    ship_to_code: '0001086523-01',
    ship_to_address: 'Rua Dona Francisca, 8300 - Joinville/SC',
    seller_id: 'qas-vendedor_teste',
    seller_name: 'Carlos Mendonça',
    issue_date: '2024-10-23',
    valid_until: '2024-11-04',
    payment_terms: '28 DDL',
    incoterm: 'CIF',
    freight_type: 'CIF',
    freight_value: 3200,
    currency: 'BRL',
    sales_org: '2000',
    distribution_channel: '10',
    division: '15',
    items: [
      {
        id: 'item-106-1',
        item_sequence: 10,
        material_code: 'VIG-W200-26',
        description: 'Viga Estrutural Gerdau W 200 x 26.6 kg/m',
        family: 'Perfis & Vigas Laminadas',
        dimension: 'W 200 x 26.6 (Barras 12m)',
        quantity: 12.0,
        unit: 't',
        requested_date: '2024-11-15',
        sap_price: 7850,
        proposed_price: 7850,
        deviation_pct: 0,
        final_price: 7850,
        total: 94200,
        stock_available: 18.0,
        stock_situation: 'ESTOQUE_SUFICIENTE',
        stock_updated_at: '2024-10-24 16:30',
        stock_confirmation_required: false,
        stock_confirmed: true,
        plant: '2000 - Filial Betim',
        storage_location: '0001 - Pátio Vigas Laminadas',
      },
    ],
    subtotal: 94200,
    discount_total: 0,
    surcharge_total: 0,
    total_tons: 12.0,
    total_value: 97400,
    price_status: 'DENTRO_DA_REGRA',
    stock_status: 'ESTOQUE_SUFICIENTE',
    approval_status: 'APROVADA_AUTOMATICAMENTE',
    approval_level_required: 'NENHUM',
    client_status: 'ACEITA',
    client_acceptance_notes: 'PO 99018 recebido e aceito pelo cliente.',
    client_accepted_at: '2024-10-24 11:30',
    status: 'PEDIDO_SAP_IMPLANTADO',
    notes: 'Pedido faturado e liberado pelo SAP ECC.',
    sap_order_number: '10049281',
    sap_processing_status: 'Ordem de Venda Criada com Sucesso no SAP ECC',
    timeline: [
      { time: '10:00', description: 'Cotação criada e aprovada sem desvio', type: 'SUCCESS' },
      { time: '11:30', description: 'Aceite do cliente registrado', type: 'SUCCESS' },
      { time: '11:32', description: 'Solicitação de implantação gerada na fila', type: 'SAP' },
      { time: '11:35', description: 'JOB SAP ECC processou a fila com sucesso', type: 'SAP' },
      { time: '11:35', description: 'Pedido SAP #10049281 gerado com sucesso', type: 'SUCCESS' },
    ],
    created: '2024-10-23 10:00',
  },
]

const INITIAL_STOCK_CONFIRMATIONS: StockConfirmationRequest[] = [
  {
    id: 'conf-1',
    quotation_id: 'quote-98105',
    quotation_code: 'COT-98105',
    quotation_item_id: 'item-105-1',
    customer_name: 'Caldeiraria & Tanques Industrial Paulista',
    material_code: 'CH-304-3MM',
    material_description: 'Chapa Inox AISI 304 3.00mm Escovada',
    requested_qty: 4.5,
    unit: 't',
    stock_snapshot_qty: 3.2,
    confirmed_qty: 0,
    request_datetime: '2024-10-24 17:25',
    requested_by: 'Carlos Mendonça',
    assigned_area: 'PCP / Laminação Inox',
    confirmation_status: 'AGUARDANDO_ANALISE',
    expected_date: '2024-11-05',
    comment:
      'Estoque no pátio é de 3.2t, cliente precisa de 4.5t. Favor confirmar avanço da OP 44102.',
  },
]

const INITIAL_SAP_QUEUE: SapOrderQueueItem[] = [
  {
    id: 'queue-1',
    integration_id: 'INT-SAP-20241024-001',
    quotation_id: 'quote-98104',
    quotation_code: 'COT-98104',
    quotation_version: 1,
    request_status: 'READY_FOR_SAP',
    created_at: '2024-10-24 17:52',
    created_by: 'Carlos Mendonça',
    customer_sap_code: '0001088041',
    customer_name: 'Metalúrgica Santa Rita Ltda',
    ship_to_code: '0001088041-01',
    sales_org: '1000',
    distribution_channel: '10',
    division: '20',
    payment_terms: '28/42/56 DDL (Boleto)',
    incoterm: 'CIF',
    customer_po_number: 'PO-88219',
    quotation_total: 206500,
    currency: 'BRL',
    requested_delivery_date: '2024-11-10',
    crm_reference: 'COT-98104-v1',
    sap_order_number: '',
    sap_processing_status: 'Aguardando leitura pelo JOB SAP_SD_ORDER_IMPORT',
    sap_return_code: '',
    sap_return_message: 'Registro posicionado na fila de integração',
    retry_count: 0,
    locked_for_processing: false,
    items_payload: [
      {
        item_sequence: 10,
        material_code: 'TB-304-SCH10',
        quantity: 6.0,
        unit: 't',
        requested_delivery_date: '2024-11-10',
        plant: '1000',
        storage_location: '0001',
        crm_price_reference: 34500,
        proposed_price: 34000,
        approved_price: 34000,
        quotation_item_id: 'item-1',
      },
    ],
  },
  {
    id: 'queue-2',
    integration_id: 'INT-SAP-20241023-088',
    quotation_id: 'quote-98106',
    quotation_code: 'COT-98106',
    quotation_version: 1,
    request_status: 'SAP_CREATED',
    created_at: '2024-10-23 11:32',
    created_by: 'Carlos Mendonça',
    customer_sap_code: '0001086523',
    customer_name: 'Indústria Mecânica Alvorada S/A',
    ship_to_code: '0001086523-01',
    sales_org: '2000',
    distribution_channel: '10',
    division: '15',
    payment_terms: '28 DDL',
    incoterm: 'CIF',
    customer_po_number: 'PO-99018',
    quotation_total: 97400,
    currency: 'BRL',
    requested_delivery_date: '2024-11-15',
    crm_reference: 'COT-98106-v1',
    sap_order_number: '10049281',
    sap_processing_status: 'Ordem de Venda Criada com Sucesso no SAP ECC',
    sap_return_code: 'S',
    sap_return_message: 'Documento de Venda 10049281 gravado com sucesso na VBAK/VBAP.',
    processed_at: '2024-10-23 11:35',
    sap_job_id: 'JOB_SAP_SD_ORDER_IMPORT_1135',
    retry_count: 0,
    locked_for_processing: false,
    items_payload: [
      {
        item_sequence: 10,
        material_code: 'VIG-W200-26',
        quantity: 12.0,
        unit: 't',
        requested_delivery_date: '2024-11-15',
        plant: '2000',
        storage_location: '0001',
        crm_price_reference: 7850,
        proposed_price: 7850,
        approved_price: 7850,
        quotation_item_id: 'item-106-1',
      },
    ],
  },
]

const INITIAL_SAP_MESSAGES: SapOrderMessage[] = [
  {
    id: 'msg-1',
    integration_id: 'INT-SAP-20241023-088',
    quotation_id: 'quote-98106',
    message_type: 'SUCCESS',
    message_class: 'V1',
    message_number: '311',
    message_text: 'Ordem de venda 10049281 criada com sucesso para o emissor da ordem 0001086523.',
    source: 'SAP ECC SD-SLS (VA01 BAPI Emulation Layer)',
    created_at: '2024-10-23 11:35:04',
  },
  {
    id: 'msg-2',
    integration_id: 'INT-SAP-20241023-088',
    quotation_id: 'quote-98106',
    message_type: 'INFO',
    message_class: 'V4',
    message_number: '108',
    message_text:
      'Determinação de preço e impostos (ICMS/PIS/COFINS) calculados com base no esquema ZCIAFAL.',
    source: 'SAP ECC Pricing Engine',
    created_at: '2024-10-23 11:35:05',
  },
]

// ==========================================
// SERVIÇO DE COTAÇÕES
// ==========================================

export class QuotationService {
  private getStoredQuotes(): Quotation[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_QUOTES)
      if (stored) return JSON.parse(stored)
    } catch {
      /* intentionally ignored */
    }
    localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(INITIAL_QUOTATIONS))
    return INITIAL_QUOTATIONS
  }

  private saveStoredQuotes(quotes: Quotation[]) {
    localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(quotes))
  }

  async getAllQuotations(): Promise<Quotation[]> {
    return this.getStoredQuotes()
  }

  async getQuotationById(id: string): Promise<Quotation | null> {
    const quotes = this.getStoredQuotes()
    return quotes.find((q) => q.id === id || q.code === id) || null
  }

  async saveQuotation(quoteData: Partial<Quotation>): Promise<Quotation> {
    const quotes = this.getStoredQuotes()
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    let existingIdx = quotes.findIndex((q) => q.id === quoteData.id || q.code === quoteData.code)

    if (existingIdx >= 0) {
      // Atualizar cotação existente
      const existing = quotes[existingIdx]
      const updated: Quotation = {
        ...existing,
        ...quoteData,
        updated: nowStr,
        timeline: [
          ...(existing.timeline || []),
          {
            time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
            description: `Cotação atualizada por ${quoteData.seller_name || 'Vendedor'}`,
            type: 'INFO',
          },
        ],
      } as Quotation
      quotes[existingIdx] = updated
      this.saveStoredQuotes(quotes)
      return updated
    } else {
      // Criar nova cotação
      const newNum = 98100 + quotes.length + 1
      const newCode = quoteData.code || `COT-${newNum}`
      const newId = `quote-${newNum}`

      const created: Quotation = {
        id: newId,
        code: newCode,
        version: 1,
        customer_id: quoteData.customer_id || 'CLI-8041',
        customer_sap_code: quoteData.customer_sap_code || '0001088041',
        customer_name: quoteData.customer_name || 'Cliente Sem Razão',
        customer_cnpj: quoteData.customer_cnpj,
        contact_name: quoteData.contact_name || '',
        contact_email: quoteData.contact_email,
        contact_phone: quoteData.contact_phone,
        ship_to_code: quoteData.ship_to_code || '',
        ship_to_address: quoteData.ship_to_address,
        seller_id: quoteData.seller_id || 'qas-vendedor_teste',
        seller_name: quoteData.seller_name || 'Carlos Mendonça',
        issue_date: quoteData.issue_date || nowStr.split(' ')[0],
        valid_until:
          quoteData.valid_until ||
          new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment_terms: quoteData.payment_terms || '28 DDL',
        incoterm: quoteData.incoterm || 'CIF',
        freight_type: quoteData.freight_type || 'CIF',
        freight_value: quoteData.freight_value || 0,
        currency: 'BRL',
        sales_org: quoteData.sales_org || '1000',
        distribution_channel: quoteData.distribution_channel || '10',
        division: quoteData.division || '20',
        items: quoteData.items || [],
        subtotal: quoteData.subtotal || 0,
        discount_total: quoteData.discount_total || 0,
        surcharge_total: quoteData.surcharge_total || 0,
        total_tons: quoteData.total_tons || 0,
        total_value: quoteData.total_value || 0,
        price_status: quoteData.price_status || 'DENTRO_DA_REGRA',
        stock_status: quoteData.stock_status || 'ESTOQUE_SUFICIENTE',
        approval_status: quoteData.approval_status || 'APROVADA_AUTOMATICAMENTE',
        approval_level_required: quoteData.approval_level_required || 'NENHUM',
        client_status: quoteData.client_status || 'NAO_ENVIADA',
        status: quoteData.status || 'RASCUNHO',
        notes: quoteData.notes || '',
        timeline: [
          {
            time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
            description: `Cotação ${newCode} criada por ${quoteData.seller_name || 'Carlos Mendonça'}`,
            type: 'INFO',
          },
        ],
        pricing_snapshot: quoteData.pricing_snapshot,
        created: nowStr,
      }
      quotes.unshift(created)
      this.saveStoredQuotes(quotes)
      return created
    }
  }

  // Criar nova versão da cotação (Versionamento sem sobrescrever)
  async createNewVersion(quoteId: string, notes: string): Promise<Quotation> {
    const quotes = this.getStoredQuotes()
    const base = quotes.find((q) => q.id === quoteId || q.code === quoteId)
    if (!base) throw new Error('Cotação base não encontrada')

    const newVersion = base.version + 1
    const newId = `${base.id}-v${newVersion}`
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const newQuote: Quotation = {
      ...base,
      id: newId,
      version: newVersion,
      status: 'EM_ELABORACAO',
      approval_status: 'AGUARDANDO_APROVACAO',
      client_status: 'NAO_ENVIADA',
      notes: `${base.notes ? base.notes + ' | ' : ''}Nova versão v${newVersion}: ${notes}`,
      timeline: [
        ...(base.timeline || []),
        {
          time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          description: `Versão v${newVersion} gerada a partir da v${base.version}. Motivo: ${notes}`,
          type: 'INFO',
        },
      ],
      created: nowStr,
    }

    quotes.unshift(newQuote)
    this.saveStoredQuotes(quotes)
    return newQuote
  }

  // Avaliação da Matriz de Aprovação Dinâmica (Sem Hardcode)
  calculateApprovalStatus(items: QuotationItem[]): {
    approvalStatus: Quotation['approval_status']
    approvalLevel: Quotation['approval_level_required']
    priceStatus: Quotation['price_status']
  } {
    let maxDiscount = 0
    let hasDeviation = false

    for (const it of items) {
      if (it.deviation_pct < 0) {
        hasDeviation = true
        const disc = Math.abs(it.deviation_pct)
        if (disc > maxDiscount) maxDiscount = disc
      }
    }

    if (!hasDeviation || maxDiscount <= 3.0) {
      return {
        approvalStatus: 'APROVADA_AUTOMATICAMENTE',
        approvalLevel: 'NENHUM',
        priceStatus: 'DENTRO_DA_REGRA',
      }
    } else if (maxDiscount <= 7.0) {
      return {
        approvalStatus: 'AGUARDANDO_APROVACAO',
        approvalLevel: 'SUPERVISOR',
        priceStatus: 'EXCECAO_PRECO',
      }
    } else if (maxDiscount <= 15.0) {
      return {
        approvalStatus: 'AGUARDANDO_APROVACAO',
        approvalLevel: 'GERENCIA',
        priceStatus: 'EXCECAO_PRECO',
      }
    } else {
      return {
        approvalStatus: 'AGUARDANDO_APROVACAO',
        approvalLevel: 'DIRETORIA',
        priceStatus: 'EXCECAO_PRECO',
      }
    }
  }

  // Aprovar Cotação Internamente
  async approveQuotation(
    quoteId: string,
    approverName: string,
    approverLevel: string,
    notes?: string,
  ): Promise<Quotation> {
    const quote = await this.getQuotationById(quoteId)
    if (!quote) throw new Error('Cotação não encontrada')

    const now = new Date()
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const updated: Quotation = {
      ...quote,
      approval_status:
        approverLevel === 'DIRETORIA'
          ? 'APROVADA_DIRETORIA'
          : approverLevel === 'GERENCIA'
            ? 'APROVADA_GERENCIA'
            : 'APROVADA_SUPERVISOR',
      approved_by: approverName,
      approved_at: new Date().toISOString(),
      approval_notes: notes,
      status: 'APROVADA_INTERNAMENTE',
      timeline: [
        ...(quote.timeline || []),
        {
          time: nowTime,
          description: `Aprovação comercial concedida por ${approverName} (${approverLevel}). ${notes || ''}`,
          type: 'SUCCESS',
        },
      ],
    }

    return this.saveQuotation(updated)
  }

  // Registrar Aceite do Cliente
  async registerClientAcceptance(
    quoteId: string,
    notes: string,
    poNumber?: string,
  ): Promise<Quotation> {
    const quote = await this.getQuotationById(quoteId)
    if (!quote) throw new Error('Cotação não encontrada')

    const now = new Date()
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const updated: Quotation = {
      ...quote,
      client_status: 'ACEITA',
      client_accepted_at: new Date().toISOString(),
      client_acceptance_notes: `${notes}${poNumber ? ` (PO #${poNumber})` : ''}`,
      status: 'ACEITA',
      timeline: [
        ...(quote.timeline || []),
        {
          time: nowTime,
          description: `Aceite comercial formalizado pelo cliente. ${poNumber ? `PO #${poNumber}` : ''} - ${notes}`,
          type: 'SUCCESS',
        },
      ],
    }

    return this.saveQuotation(updated)
  }

  // Solicitar Implantação no SAP ECC (NÃO CRIA PEDIDO DIRETO)
  async requestSapOrderQueue(quoteId: string, requestedBy: string): Promise<SapOrderQueueItem> {
    const quote = await this.getQuotationById(quoteId)
    if (!quote) throw new Error('Cotação não encontrada')

    // Pré-Validações obrigatórias antes de enviar para a fila SAP
    if (!quote.customer_sap_code) throw new Error('Código de cliente SAP não informado')
    if (!quote.ship_to_code) throw new Error('Recebedor de mercadoria (Ship-To) inválido')
    if (quote.items.length === 0) throw new Error('A cotação não possui itens')
    if (quote.approval_status === 'AGUARDANDO_APROVACAO' || quote.approval_status === 'REJEITADA') {
      throw new Error('Aprovação comercial pendente')
    }
    if (quote.client_status !== 'ACEITA') {
      throw new Error('Aceite do cliente é obrigatório antes da implantação SAP')
    }

    // Verificar se algum item precisa de confirmação de estoque que não foi confirmada
    const hasPendingStock = quote.items.some(
      (it) => it.stock_confirmation_required && !it.stock_confirmed,
    )
    if (hasPendingStock) {
      throw new Error('Há itens com estoque abaixo do limite que ainda não foram confirmados')
    }

    // Idempotência: Checar se já existe registro na fila para esta cotação e versão
    const storedQueue = this.getStoredSapQueue()
    const existing = storedQueue.find(
      (q) =>
        q.quotation_id === quote.id &&
        q.quotation_version === quote.version &&
        q.request_status !== 'CANCELLED',
    )

    if (existing) {
      return existing
    }

    const integId = `INT-SAP-${Date.now()}`
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const queueItem: SapOrderQueueItem = {
      id: `queue-${Date.now()}`,
      integration_id: integId,
      quotation_id: quote.id,
      quotation_code: quote.code,
      quotation_version: quote.version,
      request_status: 'READY_FOR_SAP',
      created_at: nowStr,
      created_by: requestedBy,
      customer_sap_code: quote.customer_sap_code,
      customer_name: quote.customer_name,
      ship_to_code: quote.ship_to_code,
      sales_org: quote.sales_org || '1000',
      distribution_channel: quote.distribution_channel || '10',
      division: quote.division || '20',
      payment_terms: quote.payment_terms,
      incoterm: quote.incoterm,
      customer_po_number: quote.client_acceptance_notes?.match(/PO\s*#?([A-Z0-9_-]+)/i)?.[1] || '',
      quotation_total: quote.total_value,
      currency: quote.currency || 'BRL',
      requested_delivery_date: quote.items[0]?.requested_date || quote.valid_until,
      crm_reference: `${quote.code}-v${quote.version}`,
      sap_order_number: '',
      sap_processing_status: 'Aguardando execução do JOB SAP_SD_ORDER_IMPORT',
      sap_return_code: '',
      sap_return_message: 'Registro posicionado na fila de integração',
      retry_count: 0,
      locked_for_processing: false,
      items_payload: quote.items.map((it, idx) => ({
        item_sequence: (idx + 1) * 10,
        material_code: it.material_code,
        quantity: it.quantity,
        unit: it.unit,
        requested_delivery_date: it.requested_date,
        plant: it.plant?.split(' ')[0] || '1000',
        storage_location: it.storage_location?.split(' ')[0] || '0001',
        crm_price_reference: it.sap_price,
        proposed_price: it.proposed_price,
        approved_price: it.final_price,
        quotation_item_id: it.id,
      })),
    }

    storedQueue.unshift(queueItem)
    this.saveStoredSapQueue(storedQueue)

    // Atualizar status da cotação
    quote.status = 'AGUARDANDO_IMPLANTACAO_SAP'
    quote.sap_processing_status = 'READY_FOR_SAP'
    quote.timeline.push({
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      description: `Solicitação de implantação gerada na fila SAP (ID: ${integId})`,
      type: 'SAP',
    })
    await this.saveQuotation(quote)

    return queueItem
  }

  // ==========================================
  // FILA SAP ECC & SIMULAÇÃO DE PROCESSAMENTO DE JOB
  // ==========================================

  getStoredSapQueue(): SapOrderQueueItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAP_QUEUE)
      if (stored) return JSON.parse(stored)
    } catch {
      /* intentionally ignored */
    }
    localStorage.setItem(STORAGE_KEY_SAP_QUEUE, JSON.stringify(INITIAL_SAP_QUEUE))
    return INITIAL_SAP_QUEUE
  }

  saveStoredSapQueue(items: SapOrderQueueItem[]) {
    localStorage.setItem(STORAGE_KEY_SAP_QUEUE, JSON.stringify(items))
  }

  getStoredSapMessages(): SapOrderMessage[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAP_MSGS)
      if (stored) return JSON.parse(stored)
    } catch {
      /* intentionally ignored */
    }
    localStorage.setItem(STORAGE_KEY_SAP_MSGS, JSON.stringify(INITIAL_SAP_MESSAGES))
    return INITIAL_SAP_MESSAGES
  }

  saveStoredSapMessages(msgs: SapOrderMessage[]) {
    localStorage.setItem(STORAGE_KEY_SAP_MSGS, JSON.stringify(msgs))
  }

  // Processamento do JOB SAP (Simulação do Daemon SAP ECC lendo a fila)
  async simulateSapJobExecution(integrationId: string): Promise<SapOrderQueueItem> {
    const queue = this.getStoredSapQueue()
    const itemIdx = queue.findIndex((q) => q.integration_id === integrationId)
    if (itemIdx < 0) throw new Error('Item não encontrado na fila SAP')

    const item = queue[itemIdx]
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    // Lock de processamento
    item.locked_for_processing = true
    item.locked_at = nowStr
    item.locked_by = 'JOB_SAP_SD_ORDER_IMPORT'
    item.request_status = 'SAP_PROCESSING'
    item.sap_processing_status = 'JOB SAP lendo e validando estrutura SD...'
    this.saveStoredSapQueue(queue)

    // Aguardar simulação rápida
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Simular resultado de sucesso ou bloqueio de crédito baseado no valor
    const msgs = this.getStoredSapMessages()
    const quote = await this.getQuotationById(item.quotation_id)

    if (item.quotation_total > 400000) {
      // Caso de Bloqueio de Crédito no SAP
      const generatedOrder = `1004${Math.floor(1000 + Math.random() * 9000)}`
      item.request_status = 'SAP_BLOCKED'
      item.sap_order_number = generatedOrder
      item.sap_processing_status = 'Pedido Criado no SAP mas Bloqueado por Crédito (Status 02)'
      item.sap_return_code = 'W'
      item.sap_return_message = `Ordem de Venda ${generatedOrder} criada com bloqueio financeiro F.35.`
      item.processed_at = nowStr
      item.sap_job_id = `JOB_SAP_SD_IMPORT_${Date.now()}`
      item.locked_for_processing = false

      msgs.unshift({
        id: `msg-${Date.now()}-1`,
        integration_id: item.integration_id,
        quotation_id: item.quotation_id,
        message_type: 'WARNING',
        message_class: 'V1',
        message_number: '149',
        message_text: `Ordem ${generatedOrder} gerada. Limite de crédito excedido: Bloqueio automático ativado.`,
        source: 'SAP ECC Credit Management',
        created_at: nowStr,
      })

      if (quote) {
        quote.status = 'BLOQUEADO_NO_SAP'
        quote.sap_order_number = generatedOrder
        quote.sap_processing_status = item.sap_processing_status
        quote.timeline.push({
          time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          description: `JOB SAP processou a solicitação: Pedido ${generatedOrder} gerado com bloqueio de crédito`,
          type: 'WARNING',
        })
        await this.saveQuotation(quote)
      }
    } else {
      // Sucesso Total
      const generatedOrder = `1004${Math.floor(1000 + Math.random() * 9000)}`
      item.request_status = 'SAP_CREATED'
      item.sap_order_number = generatedOrder
      item.sap_processing_status = 'Pedido SAP Implantado com Sucesso'
      item.sap_return_code = 'S'
      item.sap_return_message = `Ordem de Venda ${generatedOrder} gravada com sucesso nas tabelas VBAK/VBAP.`
      item.processed_at = nowStr
      item.sap_job_id = `JOB_SAP_SD_IMPORT_${Date.now()}`
      item.locked_for_processing = false

      msgs.unshift({
        id: `msg-${Date.now()}-1`,
        integration_id: item.integration_id,
        quotation_id: item.quotation_id,
        message_type: 'SUCCESS',
        message_class: 'V1',
        message_number: '311',
        message_text: `Ordem de venda ${generatedOrder} criada com sucesso para o emissor da ordem ${item.customer_sap_code}.`,
        source: 'SAP ECC SD-SLS',
        created_at: nowStr,
      })

      if (quote) {
        quote.status = 'PEDIDO_SAP_IMPLANTADO'
        quote.sap_order_number = generatedOrder
        quote.sap_processing_status = item.sap_processing_status
        quote.timeline.push({
          time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          description: `JOB SAP processou a solicitação: Pedido de Venda ${generatedOrder} oficializado`,
          type: 'SUCCESS',
        })
        await this.saveQuotation(quote)
      }
    }

    queue[itemIdx] = item
    this.saveStoredSapQueue(queue)
    this.saveStoredSapMessages(msgs)
    return item
  }

  // Reprocessamento de Erros da Fila SAP
  async retrySapQueueItem(integrationId: string): Promise<SapOrderQueueItem> {
    const queue = this.getStoredSapQueue()
    const itemIdx = queue.findIndex((q) => q.integration_id === integrationId)
    if (itemIdx < 0) throw new Error('Item não encontrado na fila SAP')

    const item = queue[itemIdx]
    item.retry_count = (item.retry_count || 0) + 1
    item.request_status = 'RETRY_PENDING'
    item.sap_processing_status = `Aguardando reprocessamento pelo JOB SAP (Tentativa #${item.retry_count})`
    item.locked_for_processing = false

    queue[itemIdx] = item
    this.saveStoredSapQueue(queue)

    const msgs = this.getStoredSapMessages()
    const now = new Date()
    msgs.unshift({
      id: `msg-${Date.now()}`,
      integration_id: item.integration_id,
      quotation_id: item.quotation_id,
      message_type: 'INFO',
      message_class: 'CRM',
      message_number: '002',
      message_text: `Solicitação recolocada na fila de reprocessamento (Tentativa #${item.retry_count}).`,
      source: 'CRM Integration Monitor',
      created_at: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    })
    this.saveStoredSapMessages(msgs)

    return item
  }

  // Cancelar Solicitação da Fila
  async cancelSapQueueItem(integrationId: string): Promise<SapOrderQueueItem> {
    const queue = this.getStoredSapQueue()
    const itemIdx = queue.findIndex((q) => q.integration_id === integrationId)
    if (itemIdx < 0) throw new Error('Item não encontrado na fila SAP')

    const item = queue[itemIdx]
    item.request_status = 'CANCELLED'
    item.sap_processing_status = 'Solicitação cancelada pelo operador CRM'
    queue[itemIdx] = item
    this.saveStoredSapQueue(queue)
    return item
  }

  // ==========================================
  // CONFIRMAÇÃO DE ESTOQUE (PCP / LOGÍSTICA)
  // ==========================================

  getStoredStockConfirmations(): StockConfirmationRequest[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STOCK_CONFIRM)
      if (stored) return JSON.parse(stored)
    } catch {
      /* intentionally ignored */
    }
    localStorage.setItem(STORAGE_KEY_STOCK_CONFIRM, JSON.stringify(INITIAL_STOCK_CONFIRMATIONS))
    return INITIAL_STOCK_CONFIRMATIONS
  }

  saveStoredStockConfirmations(items: StockConfirmationRequest[]) {
    localStorage.setItem(STORAGE_KEY_STOCK_CONFIRM, JSON.stringify(items))
  }

  async requestStockConfirmation(
    reqData: Omit<StockConfirmationRequest, 'id' | 'request_datetime' | 'confirmation_status'>,
  ): Promise<StockConfirmationRequest> {
    const list = this.getStoredStockConfirmations()
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const newReq: StockConfirmationRequest = {
      ...reqData,
      id: `conf-${Date.now()}`,
      request_datetime: nowStr,
      confirmation_status: 'AGUARDANDO_ANALISE',
    }

    list.unshift(newReq)
    this.saveStoredStockConfirmations(list)

    // Atualizar status no item da cotação
    const quote = await this.getQuotationById(reqData.quotation_id)
    if (quote) {
      const item = quote.items.find((it) => it.id === reqData.quotation_item_id)
      if (item) {
        item.stock_situation = 'AGUARDANDO_CONFIRMACAO'
        item.stock_confirmation_required = true
        item.stock_confirmed = false
      }
      quote.stock_status = 'AGUARDANDO_CONFIRMACAO'
      quote.status = 'AGUARDANDO_CONFIRMACAO_ESTOQUE'
      quote.timeline.push({
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        description: `Confirmação de estoque solicitada para ${reqData.material_code} (${reqData.requested_qty} ${reqData.unit}) -> ${reqData.assigned_area}`,
        type: 'WARNING',
      })
      await this.saveQuotation(quote)
    }

    return newReq
  }

  async respondStockConfirmation(
    confirmationId: string,
    decision: 'CONFIRMAR' | 'PARCIAL' | 'NEGAR',
    confirmedQty: number,
    expectedDate: string,
    comment: string,
    responderName: string,
  ): Promise<StockConfirmationRequest> {
    const list = this.getStoredStockConfirmations()
    const idx = list.findIndex((r) => r.id === confirmationId)
    if (idx < 0) throw new Error('Solicitação de confirmação não encontrada')

    const req = list[idx]
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    req.confirmed_qty = confirmedQty
    req.expected_date = expectedDate
    req.confirmed_by = responderName
    req.confirmation_datetime = nowStr
    req.comment = comment

    let finalSituation: StockSituation = 'CONFIRMADO'

    if (decision === 'CONFIRMAR') {
      req.confirmation_status = 'CONFIRMADO'
      finalSituation = 'CONFIRMADO'
    } else if (decision === 'PARCIAL') {
      req.confirmation_status = 'CONFIRMADO_PARCIAL'
      finalSituation = 'CONFIRMADO_PARCIAL'
    } else {
      req.confirmation_status = 'NEGADO'
      finalSituation = 'CONFIRMACAO_NEGADA'
    }

    list[idx] = req
    this.saveStoredStockConfirmations(list)

    // Atualizar cotação e item
    const quote = await this.getQuotationById(req.quotation_id)
    if (quote) {
      const item = quote.items.find((it) => it.id === req.quotation_item_id)
      if (item) {
        item.stock_situation = finalSituation
        item.stock_confirmed = decision !== 'NEGAR'
        item.stock_confirmed_qty = confirmedQty
        item.stock_confirmation_date = expectedDate
      }

      // Checar se todos os itens que precisavam de confirmação foram resolvidos
      const anyDenied = quote.items.some((it) => it.stock_situation === 'CONFIRMACAO_NEGADA')
      const anyWaiting = quote.items.some((it) => it.stock_situation === 'AGUARDANDO_CONFIRMACAO')

      if (anyDenied) {
        quote.stock_status = 'CONFIRMACAO_NEGADA'
      } else if (anyWaiting) {
        quote.stock_status = 'AGUARDANDO_CONFIRMACAO'
      } else {
        quote.stock_status = 'CONFIRMADO'
        if (quote.status === 'AGUARDANDO_CONFIRMACAO_ESTOQUE') {
          quote.status =
            quote.approval_status === 'AGUARDANDO_APROVACAO'
              ? 'AGUARDANDO_APROVACAO'
              : 'APROVADA_INTERNAMENTE'
        }
      }

      quote.timeline.push({
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        description: `Retorno de estoque para ${req.material_code}: ${req.confirmation_status} por ${responderName}. ${comment}`,
        type: decision === 'NEGAR' ? 'ERROR' : 'SUCCESS',
      })

      await this.saveQuotation(quote)
    }

    return req
  }

  // ==========================================
  // COMUNICAÇÃO WHATSAPP & E-MAIL
  // ==========================================

  getStoredCommunications(): QuotationCommunication[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMMUNICATIONS)
      if (stored) return JSON.parse(stored)
    } catch {
      /* intentionally ignored */
    }
    return []
  }

  saveStoredCommunications(list: QuotationCommunication[]) {
    localStorage.setItem(STORAGE_KEY_COMMUNICATIONS, JSON.stringify(list))
  }

  async sendQuotationCommunication(
    comm: Omit<QuotationCommunication, 'id' | 'sent_at' | 'status'>,
  ): Promise<QuotationCommunication> {
    const list = this.getStoredCommunications()
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const newComm: QuotationCommunication = {
      ...comm,
      id: `comm-${Date.now()}`,
      sent_at: nowStr,
      status: 'DELIVERED',
    }

    list.unshift(newComm)
    this.saveStoredCommunications(list)

    // Atualizar status da cotação para ENVIADA_AO_CLIENTE se ainda estiver interna
    const quote = await this.getQuotationById(comm.quotation_id)
    if (quote) {
      if (quote.status === 'APROVADA_INTERNAMENTE' || quote.status === 'RASCUNHO') {
        quote.status = 'ENVIADA_AO_CLIENTE'
        quote.client_status = 'ENVIADA'
      }
      quote.timeline.push({
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        description: `Cotação enviada via ${comm.channel} para ${comm.recipient_name || comm.recipient} (${comm.attached_pdf_name || 'PDF Oficial'})`,
        type: 'INFO',
      })
      await this.saveQuotation(quote)
    }

    return newComm
  }
}

export const quotationService = new QuotationService()
