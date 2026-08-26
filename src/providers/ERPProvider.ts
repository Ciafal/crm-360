import type { ProviderHealth } from './types'

export interface SAPCustomerCredit {
  limiteCredito: number
  creditoUtilizado: number
  saldoDisponivel: number
  condicaoPagamento: string
  statusBloqueio: string
  isAvailable: boolean
}

export interface CustomerERPData {
  sapCode: string
  razaoSocial: string
  nomeFantasia?: string
  cnpj?: string
  cidade?: string
  uf?: string
  segmento?: string
  subsegmento?: string
  vendedor?: string
  supervisor?: string
  status?: string
  grupoEconomico?: string
  contatos?: Array<{
    nome: string
    cargo: string
    telefone: string
    email: string
    whatsapp: string
    isPrincipal?: boolean
  }>
  faturamento?: number
  toneladas?: number
  ticketMedio?: number
  frequenciaDias?: number
  mixSkus?: number
  ultimaCompra?: string
  pedidosEmAberto?: number
  cotacoesAtivas?: number
  entregasPendentes?: number
  credit?: SAPCustomerCredit
  salesArea?: {
    organizacaoVendas: string
    canalDistribuicao: string
    setorAtividade: string
  }
}

export interface MaterialERPData {
  code: string
  descricao: string
  familia?: string
  unidade?: string
  saldoEstoque?: number
  unidadeMedida?: string
  precoReferencia?: number
  leadTimeDias?: number
}

export interface QuoteERPData {
  documentNumber: string
  customerCode: string
  valorTotal: number
  pesoToneladas?: number
  status: 'em_aberto' | 'aprovada' | 'recusada' | 'vencida'
  createdAt: string
  validUntil?: string
  items: Array<{
    material: string
    descricao: string
    quantidade: number
    precoUnitario: number
    unidade: string
  }>
}

export interface OrderERPData {
  documentNumber: string
  customerCode: string
  valorTotal: number
  pesoToneladas?: number
  status: 'faturado' | 'em_separacao' | 'aguardando_credito' | 'em_transito' | 'entregue'
  createdAt: string
  deliveryDate?: string
  items: Array<{
    material: string
    descricao: string
    quantidade: number
    preco: number
    unidade: string
  }>
}

export interface BillingERPData {
  invoiceNumber: string
  documentNumber: string
  customerCode: string
  valorTotal: number
  pesoToneladas: number
  dataEmissao: string
  chaveAcessoNFe?: string
  status: 'autorizada' | 'cancelada'
}

export interface DeliveryERPData {
  deliveryNumber: string
  orderNumber: string
  customerCode: string
  status: 'pendente' | 'em_transito' | 'entregue'
  transportadora?: string
  previsaoEntrega: string
  toneladas: number
}

export interface ERPProvider {
  readonly name: string
  getCustomer(sapCode: string): Promise<CustomerERPData | null>
  searchCustomers(query: string): Promise<CustomerERPData[]>
  getCustomerOrders(sapCode: string): Promise<OrderERPData[]>
  getCustomerQuotes(sapCode: string): Promise<QuoteERPData[]>
  getCustomerBillings(sapCode: string): Promise<BillingERPData[]>
  getCustomerDeliveries(sapCode: string): Promise<DeliveryERPData[]>
  getMaterial(materialCode: string): Promise<MaterialERPData | null>
  getHealth(): Promise<ProviderHealth>
  isDemoData(): boolean
  getLastSync(): string
}

export class SAPECCProvider implements ERPProvider {
  readonly name = 'SAP ECC 6.0 / S/4HANA (CIAFAL Connector - Mock Fallback)'
  private lastSync = new Date().toISOString()

  isDemoData(): boolean {
    return true
  }

  getLastSync(): string {
    return this.lastSync
  }

  async getHealth(): Promise<ProviderHealth> {
    return {
      online: true,
      lastCheck: this.lastSync,
      latency: 48,
    }
  }

  private mockCustomers: Record<string, CustomerERPData> = {
    'CLI-8041': {
      sapCode: '0001088041',
      razaoSocial: 'Metalúrgica Santa Rita Ltda',
      nomeFantasia: 'Santa Rita Estruturas',
      cnpj: '45.182.903/0001-44',
      cidade: 'Campinas',
      uf: 'SP',
      segmento: 'Estruturas Metálicas & Caldeiraria',
      subsegmento: 'Galpões & Pontes Rolantes',
      vendedor: 'Carlos Mendonça',
      supervisor: 'Marcos Vinícius (Sup. Sudeste)',
      status: 'Ativo com Inatividade Recente',
      grupoEconomico: 'Grupo Santa Rita Participações',
      contatos: [
        {
          nome: 'Roberto Antunes',
          cargo: 'Gerente de Compras',
          telefone: '(19) 3884-9000',
          email: 'compras@santarita.ind.br',
          whatsapp: '(19) 99872-4411',
          isPrincipal: true,
        },
        {
          nome: 'Juliana Costa',
          cargo: 'Engenheira de Suprimentos',
          telefone: '(19) 3884-9012',
          email: 'juliana.costa@santarita.ind.br',
          whatsapp: '(19) 98711-2299',
        },
      ],
      faturamento: 485000,
      toneladas: 62.5,
      ticketMedio: 48500,
      frequenciaDias: 45,
      mixSkus: 8,
      ultimaCompra: '2024-08-14',
      pedidosEmAberto: 0,
      cotacoesAtivas: 1,
      entregasPendentes: 0,
      credit: {
        limiteCredito: 120000,
        creditoUtilizado: 25000,
        saldoDisponivel: 95000,
        condicaoPagamento: '28/42/56 DDL (Boleto)',
        statusBloqueio: 'Liberado sem restrições',
        isAvailable: true,
      },
      salesArea: {
        organizacaoVendas: '1000 (CIAFAL Matriz)',
        canalDistribuicao: '10 (Venda Direta Industrial)',
        setorAtividade: '20 (Tubos & Chapas Inox)',
      },
    },
    'CLI-7910': {
      sapCode: '0001087910',
      razaoSocial: 'Caldeiraria & Tanques Industrial Paulista',
      nomeFantasia: 'Tanques Paulista',
      cnpj: '12.894.210/0001-92',
      cidade: 'Sertãozinho',
      uf: 'SP',
      segmento: 'Equipamentos Químicos e Sucroalcooleiro',
      subsegmento: 'Tanques Inox & Dutos de Evaporação',
      vendedor: 'Carlos Mendonça',
      supervisor: 'Marcos Vinícius (Sup. Sudeste)',
      status: 'Ativo — Quebra Sazonal',
      grupoEconomico: 'Holding Paulista Sucroquímica',
      contatos: [
        {
          nome: 'Fernando Silveira',
          cargo: 'Diretor de Suprimentos',
          telefone: '(16) 3946-1200',
          email: 'fernando@tanquespaulista.com.br',
          whatsapp: '(16) 99123-8877',
          isPrincipal: true,
        },
      ],
      faturamento: 890000,
      toneladas: 115.0,
      ticketMedio: 89000,
      frequenciaDias: 35,
      mixSkus: 14,
      ultimaCompra: '2024-07-19',
      pedidosEmAberto: 0,
      cotacoesAtivas: 2,
      entregasPendentes: 0,
      credit: {
        limiteCredito: 250000,
        creditoUtilizado: 40000,
        saldoDisponivel: 210000,
        condicaoPagamento: '30/60 DDL',
        statusBloqueio: 'Liberado',
        isAvailable: true,
      },
      salesArea: {
        organizacaoVendas: '1000',
        canalDistribuicao: '10',
        setorAtividade: '25 (Inox 316L Especial)',
      },
    },
    'CLI-6523': {
      sapCode: '0001086523',
      razaoSocial: 'Indústria Mecânica Alvorada S/A',
      nomeFantasia: 'Alvorada Autopeças',
      cnpj: '03.771.820/0002-18',
      cidade: 'Joinville',
      uf: 'SC',
      segmento: 'Autopeças & Implementos Rodoviários',
      subsegmento: 'Eixos e Componentes Forjados',
      vendedor: 'Carlos Mendonça',
      supervisor: 'Marcos Vinícius (Sup. Sudeste)',
      status: 'Ativo',
      contatos: [
        {
          nome: 'Cláudia Meireles',
          cargo: 'Compradora Pleno',
          telefone: '(47) 3451-9900',
          email: 'claudia.m@mecanicaalvorada.com.br',
          whatsapp: '(47) 99744-1188',
          isPrincipal: true,
        },
      ],
      faturamento: 340000,
      toneladas: 48.0,
      ticketMedio: 34000,
      frequenciaDias: 30,
      mixSkus: 6,
      ultimaCompra: '2024-08-30',
      pedidosEmAberto: 1,
      cotacoesAtivas: 1,
      entregasPendentes: 1,
      credit: {
        limiteCredito: 150000,
        creditoUtilizado: 0,
        saldoDisponivel: 150000,
        condicaoPagamento: '28 DDL',
        statusBloqueio: 'Liberado',
        isAvailable: true,
      },
      salesArea: {
        organizacaoVendas: '2000 (CIAFAL Sul)',
        canalDistribuicao: '10',
        setorAtividade: '15 (Aço Carbono & Inox)',
      },
    },
  }

  async getCustomer(sapCode: string): Promise<CustomerERPData | null> {
    const key = Object.keys(this.mockCustomers).find(
      (k) =>
        k === sapCode ||
        this.mockCustomers[k].sapCode === sapCode ||
        sapCode.includes(k) ||
        k.includes(sapCode),
    )
    if (key) return this.mockCustomers[key]

    // Retorna fallback estruturado
    return {
      sapCode: `SAP-${sapCode}`,
      razaoSocial: `Cliente Corporativo ${sapCode}`,
      nomeFantasia: `Conta ${sapCode}`,
      cnpj: '00.000.000/0001-99',
      cidade: 'São Paulo',
      uf: 'SP',
      segmento: 'Indústria Metalúrgica',
      vendedor: 'Carlos Mendonça',
      supervisor: 'Marcos Vinícius',
      status: 'Ativo',
      contatos: [
        {
          nome: 'Responsável Comercial',
          cargo: 'Comprador',
          telefone: '(11) 3000-0000',
          email: 'compras@cliente.com.br',
          whatsapp: '(11) 99999-9999',
          isPrincipal: true,
        },
      ],
      faturamento: 150000,
      toneladas: 18.5,
      ticketMedio: 25000,
      frequenciaDias: 45,
      mixSkus: 4,
      ultimaCompra: '2024-08-01',
      credit: {
        limiteCredito: 80000,
        creditoUtilizado: 20000,
        saldoDisponivel: 60000,
        condicaoPagamento: '28 DDL',
        statusBloqueio: 'Liberado',
        isAvailable: true,
      },
    }
  }

  async searchCustomers(query: string): Promise<CustomerERPData[]> {
    const q = query.toLowerCase()
    return Object.values(this.mockCustomers).filter(
      (c) =>
        c.razaoSocial.toLowerCase().includes(q) ||
        (c.nomeFantasia && c.nomeFantasia.toLowerCase().includes(q)) ||
        c.sapCode.includes(q) ||
        (c.cnpj && c.cnpj.includes(q)),
    )
  }

  async getCustomerOrders(sapCode: string): Promise<OrderERPData[]> {
    return [
      {
        documentNumber: 'PED-SAP-77410',
        customerCode: sapCode,
        valorTotal: 48500,
        pesoToneladas: 6.2,
        status: 'faturado',
        createdAt: '2024-08-14',
        deliveryDate: '2024-08-18',
        items: [
          {
            material: 'TB-304-SCH10',
            descricao: 'Tubo Inox AISI 304 Redondo SCH 10 2"',
            quantidade: 2800,
            preco: 34.5,
            unidade: 'KG',
          },
        ],
      },
      {
        documentNumber: 'PED-SAP-74120',
        customerCode: sapCode,
        valorTotal: 52000,
        pesoToneladas: 7.1,
        status: 'faturado',
        createdAt: '2024-07-02',
        deliveryDate: '2024-07-06',
        items: [
          {
            material: 'CH-304-3MM',
            descricao: 'Chapa Inox AISI 304 3.00mm Escovada',
            quantidade: 3400,
            preco: 32.8,
            unidade: 'KG',
          },
        ],
      },
      {
        documentNumber: 'PED-SAP-70980',
        customerCode: sapCode,
        valorTotal: 41000,
        pesoToneladas: 5.5,
        status: 'faturado',
        createdAt: '2024-05-18',
        deliveryDate: '2024-05-22',
        items: [
          {
            material: 'TB-304-SCH10',
            descricao: 'Tubo Inox AISI 304 Redondo SCH 10 2"',
            quantidade: 2400,
            preco: 34.0,
            unidade: 'KG',
          },
        ],
      },
    ]
  }

  async getCustomerQuotes(sapCode: string): Promise<QuoteERPData[]> {
    return [
      {
        documentNumber: 'COT-SAP-98104',
        customerCode: sapCode,
        valorTotal: 54000,
        pesoToneladas: 6.8,
        status: 'em_aberto',
        createdAt: '2024-10-15',
        validUntil: '2024-10-30',
        items: [
          {
            material: 'TB-304-SCH10',
            descricao: 'Tubo Inox AISI 304 Redondo SCH 10 2"',
            quantidade: 3000,
            precoUnitario: 34.5,
            unidade: 'KG',
          },
        ],
      },
      {
        documentNumber: 'COT-SAP-91024',
        customerCode: sapCode,
        valorTotal: 38000,
        pesoToneladas: 4.5,
        status: 'vencida',
        createdAt: '2024-08-01',
        validUntil: '2024-08-10',
        items: [
          {
            material: 'CH-304-3MM',
            descricao: 'Chapa Inox AISI 304 3.00mm',
            quantidade: 2500,
            precoUnitario: 33.0,
            unidade: 'KG',
          },
        ],
      },
    ]
  }

  async getCustomerBillings(sapCode: string): Promise<BillingERPData[]> {
    return [
      {
        invoiceNumber: 'NF-0091823',
        documentNumber: 'PED-SAP-77410',
        customerCode: sapCode,
        valorTotal: 48500,
        pesoToneladas: 6.2,
        dataEmissao: '2024-08-14T14:30:00Z',
        chaveAcessoNFe: '35240845182903000144550010000918231908234412',
        status: 'autorizada',
      },
      {
        invoiceNumber: 'NF-0088194',
        documentNumber: 'PED-SAP-74120',
        customerCode: sapCode,
        valorTotal: 52000,
        pesoToneladas: 7.1,
        dataEmissao: '2024-07-02T10:15:00Z',
        chaveAcessoNFe: '35240745182903000144550010000881941207195589',
        status: 'autorizada',
      },
    ]
  }

  async getCustomerDeliveries(sapCode: string): Promise<DeliveryERPData[]> {
    return [
      {
        deliveryNumber: 'REM-88120',
        orderNumber: 'PED-SAP-77410',
        customerCode: sapCode,
        status: 'entregue',
        transportadora: 'Expresso CIAFAL Logística',
        previsaoEntrega: '2024-08-18',
        toneladas: 6.2,
      },
    ]
  }

  async getMaterial(materialCode: string): Promise<MaterialERPData | null> {
    return {
      code: materialCode,
      descricao: `Material SAP Inox ${materialCode}`,
      familia: 'Tubos e Perfis Inox',
      unidade: 'KG',
      saldoEstoque: 12500,
      unidadeMedida: 'KG',
      precoReferencia: 34.5,
      leadTimeDias: 2,
    }
  }
}

export const defaultERPProvider = new SAPECCProvider()
