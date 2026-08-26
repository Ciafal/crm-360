import type {
  BIProvider,
  BICustomerSummary,
  BISellerDailySummary,
  BICustomerProduct,
  BIFilters,
} from './BIProvider'

// Mock de 18 clientes industriais realistas do setor de Aços e Inox da CIAFAL
const MOCK_INACTIVE_CUSTOMERS: BICustomerSummary[] = [
  {
    customerId: 'CLI-8041',
    customerName: 'Metalúrgica Santa Rita Ltda',
    cnpj: '45.182.903/0001-44',
    segment: 'Estruturas Metálicas',
    city: 'Campinas',
    uf: 'SP',
    sellerId: 'ciafal-seller-01',
    sellerName: 'Carlos Mendonça',
    lastPurchaseDate: '2024-08-14',
    daysSinceLastPurchase: 74,
    historicalRevenue: 485000,
    historicalTons: 62.5,
    ticket: 48500,
    frequency: 45, // ciclo médio histórico em dias
    recurrenceMonths: [1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0], // últimos 12 meses
    pAlive: 0.82,
    expectedNextPurchaseDays: 6,
    expectedValue: 54000,
    reactivationScore: 94,
    rfmSegment: 'Em risco',
    creditLimit: 120000,
    creditAvailable: 95000,
    creditStatus: 'liberado',
    stockCoveragePercent: 96,
    recommendedAction: 'Ofertar Tubos Inox 304 com pronta-entrega (preço FOB especial)',
    recommendedChannel: 'whatsapp',
    reason:
      '74 dias sem compras. Recorrência histórica de 45 dias. Estoque de tubos 304 em alta cobertura.',
    products: [
      {
        code: 'TB-304-SCH10',
        description: 'Tubo Inox AISI 304 Redondo SCH 10 2"',
        family: 'Tubos Inox',
        lastPurchaseDate: '2024-08-14',
        historicalTons: 28.4,
        stopped: true,
        stockAvailable: true,
        stockCoverage: 120,
        priceKg: 34.5,
      },
      {
        code: 'CH-304-3MM',
        description: 'Chapa Inox AISI 304 3.00mm Escovada',
        family: 'Chapas Inox',
        lastPurchaseDate: '2024-07-02',
        historicalTons: 34.1,
        stopped: true,
        stockAvailable: true,
        stockCoverage: 95,
        priceKg: 32.8,
      },
    ],
  },
  {
    customerId: 'CLI-7910',
    customerName: 'Caldeiraria & Tanques Industrial Paulista',
    cnpj: '12.894.210/0001-92',
    segment: 'Equipamentos Químicos e Alimentícios',
    city: 'Sertãozinho',
    uf: 'SP',
    sellerId: 'ciafal-seller-01',
    sellerName: 'Carlos Mendonça',
    lastPurchaseDate: '2024-07-19',
    daysSinceLastPurchase: 102,
    historicalRevenue: 890000,
    historicalTons: 115.0,
    ticket: 89000,
    frequency: 35,
    recurrenceMonths: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    pAlive: 0.78,
    expectedNextPurchaseDays: 4,
    expectedValue: 98000,
    reactivationScore: 91,
    rfmSegment: 'Campeões',
    creditLimit: 250000,
    creditAvailable: 210000,
    creditStatus: 'liberado',
    stockCoveragePercent: 92,
    recommendedAction: 'Ligar para Diretor de Suprimentos: pacote Chapas Inox 316L para safra',
    recommendedChannel: 'telefone',
    reason:
      'Grande conta com quebra abrupta após manutenção anual. Histórico de compras volumosas.',
    products: [
      {
        code: 'CH-316L-6MM',
        description: 'Chapa Aço Inox 316L 6.35mm 1/4" Laminada',
        family: 'Chapas Inox 316L',
        lastPurchaseDate: '2024-07-19',
        historicalTons: 75.0,
        stopped: true,
        stockAvailable: true,
        stockCoverage: 80,
        priceKg: 46.2,
      },
      {
        code: 'BAR-316-RD1',
        description: 'Barra Redonda Inox 316 Trefilada 1"',
        family: 'Barras Inox',
        lastPurchaseDate: '2024-06-11',
        historicalTons: 40.0,
        stopped: true,
        stockAvailable: true,
        stockCoverage: 110,
        priceKg: 48.0,
      },
    ],
  },
  {
    customerId: 'CLI-6523',
    customerName: 'Indústria Mecânica Alvorada S/A',
    cnpj: '03.771.820/0002-18',
    segment: 'Autopeças & Implementos',
    city: 'Joinville',
    uf: 'SC',
    sellerId: 'ciafal-seller-01',
    sellerName: 'Carlos Mendonça',
    lastPurchaseDate: '2024-08-30',
    daysSinceLastPurchase: 61,
    historicalRevenue: 340000,
    historicalTons: 48.0,
    ticket: 34000,
    frequency: 30,
    recurrenceMonths: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    pAlive: 0.85,
    expectedNextPurchaseDays: 3,
    expectedValue: 42000,
    reactivationScore: 89,
    rfmSegment: 'Leais',
    creditLimit: 150000,
    creditAvailable: 150000,
    creditStatus: 'liberado',
    stockCoveragePercent: 88,
    recommendedAction: 'Apresentar condições de Barras Laminadas 1045 e Inox 410',
    recommendedChannel: 'whatsapp',
    reason: 'Comprador habitual de início de mês; atraso de 30 dias no pedido recorrente.',
    products: [
      {
        code: 'BAR-1045-2POL',
        description: 'Barra Redonda Aço Carbono SAE 1045 2"',
        family: 'Aço Carbono SAE',
        lastPurchaseDate: '2024-08-30',
        historicalTons: 32.0,
        stopped: true,
        stockAvailable: true,
        stockCoverage: 130,
        priceKg: 14.5,
      },
    ],
  },
  {
    customerId: 'CLI-5120',
    customerName: 'Protemax Tubulações & Conexões Eireli',
    cnpj: '18.234.901/0001-55',
    segment: 'Distribuição & Revenda',
    city: 'Betim',
    uf: 'MG',
    sellerId: 'ciafal-seller-01',
    sellerName: 'Carlos Mendonça',
    lastPurchaseDate: '2024-06-15',
    daysSinceLastPurchase: 135,
    historicalRevenue: 620000,
    historicalTons: 78.0,
    ticket: 62000,
    frequency: 60,
    recurrenceMonths: [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0],
    pAlive: 0.65,
    expectedNextPurchaseDays: 12,
    expectedValue: 68000,
    reactivationScore: 84,
    rfmSegment: 'Precisam de atenção',
    creditLimit: 180000,
    creditAvailable: 45000,
    creditStatus: 'em_analise',
    stockCoveragePercent: 75,
    recommendedAction: 'Verificar limite de crédito com financeiro antes de cotar tubos 304/316',
    recommendedChannel: 'telefone',
    reason: 'Cliente com restrição recente no Serasa mas com alta margem histórica.',
    products: [
      {
        code: 'TB-OD-304-1POL',
        description: 'Tubo OD Inox 304 Sanitário 1" Parede 1.5mm',
        family: 'Tubos Inox',
        lastPurchaseDate: '2024-06-15',
        historicalTons: 45.0,
        stopped: true,
        stockAvailable: true,
        stockCoverage: 90,
        priceKg: 36.2,
      },
    ],
  },
  {
    customerId: 'CLI-4309',
    customerName: 'Cozinhas Industriais Aço Forte Ind. e Com.',
    cnpj: '24.908.112/0001-08',
    segment: 'Mobiliário e Cozinhas Inox',
    city: 'Guarulhos',
    uf: 'SP',
    sellerId: 'ciafal-seller-01',
    sellerName: 'Carlos Mendonça',
    lastPurchaseDate: '2024-07-28',
    daysSinceLastPurchase: 93,
    historicalRevenue: 275000,
    historicalTons: 36.0,
    ticket: 27500,
    frequency: 40,
    recurrenceMonths: [1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0],
    pAlive: 0.72,
    expectedNextPurchaseDays: 8,
    expectedValue: 31000,
    reactivationScore: 82,
    rfmSegment: 'Em risco',
    creditLimit: 90000,
    creditAvailable: 90000,
    creditStatus: 'liberado',
    stockCoveragePercent: 100,
    recommendedAction:
      'Disparar WhatsApp com tabela de Chapas Inox 430 e 304 com película protetora',
    recommendedChannel: 'whatsapp',
    reason: 'Comprador ativo no WhatsApp; produto de alta disponibilidade em estoque.',
    products: [
      {
        code: 'CH-430-1MM',
        description: 'Chapa Inox AISI 430 1.00mm Brilhante com PVC',
        family: 'Chapas Inox 430',
        lastPurchaseDate: '2024-07-28',
        historicalTons: 26.0,
        stopped: true,
        stockAvailable: true,
        stockCoverage: 140,
        priceKg: 22.4,
      },
    ],
  },
  {
    customerId: 'CLI-3180',
    customerName: 'Usinagem & Ferramentaria Delta Sul',
    cnpj: '08.654.321/0001-77',
    segment: 'Usinagem e Peças Técnicas',
    city: 'Caxias do Sul',
    uf: 'RS',
    sellerId: 'ciafal-seller-01',
    sellerName: 'Carlos Mendonça',
    lastPurchaseDate: '2024-05-18',
    daysSinceLastPurchase: 165,
    historicalRevenue: 195000,
    historicalTons: 22.0,
    ticket: 19500,
    frequency: 45,
    recurrenceMonths: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    pAlive: 0.58,
    expectedNextPurchaseDays: 15,
    expectedValue: 24000,
    reactivationScore: 78,
    rfmSegment: 'Prestes a hibernar',
    creditLimit: 60000,
    creditAvailable: 60000,
    creditStatus: 'liberado',
    stockCoveragePercent: 80,
    recommendedAction: 'Agendar visita técnica para entender troca de fornecedor regional',
    recommendedChannel: 'visita',
    reason:
      'Queda para concorrente local no RS após aumento de frete. Oportunidade com consolidação de carga.',
    products: [
      {
        code: 'BAR-304-HEX',
        description: 'Barra Sextavada Inox 304 3/4"',
        family: 'Barras Inox',
        lastPurchaseDate: '2024-05-18',
        historicalTons: 14.0,
        stopped: true,
        stockAvailable: true,
        stockCoverage: 70,
        priceKg: 38.5,
      },
    ],
  },
  {
    customerId: 'CLI-2940',
    customerName: 'Engeválvulas Controle de Fluidos Ltda',
    cnpj: '31.109.844/0001-30',
    segment: 'Válvulas e Conexões Industriais',
    city: 'Ribeirão Preto',
    uf: 'SP',
    sellerId: 'ciafal-seller-01',
    sellerName: 'Carlos Mendonça',
    lastPurchaseDate: '2024-08-05',
    daysSinceLastPurchase: 85,
    historicalRevenue: 410000,
    historicalTons: 42.0,
    ticket: 41000,
    frequency: 50,
    recurrenceMonths: [1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0],
    pAlive: 0.76,
    expectedNextPurchaseDays: 7,
    expectedValue: 45000,
    reactivationScore: 86,
    rfmSegment: 'Em risco',
    creditLimit: 140000,
    creditAvailable: 110000,
    creditStatus: 'liberado',
    stockCoveragePercent: 90,
    recommendedAction: 'Propor lote fechado de Barras Quadradas e Redondas Inox 316',
    recommendedChannel: 'whatsapp',
    reason: 'Comprador solicitou orçamento há 10 dias sem fechamento; retomar contato.',
    products: [
      {
        code: 'BAR-316-QD2',
        description: 'Barra Quadrada Inox 316 2"',
        family: 'Barras Inox',
        lastPurchaseDate: '2024-08-05',
        historicalTons: 25.0,
        stopped: true,
        stockAvailable: true,
        stockCoverage: 95,
        priceKg: 49.0,
      },
    ],
  },
  {
    customerId: 'CLI-1822',
    customerName: 'AgroInox Silos e Equipamentos Rurais',
    cnpj: '15.443.210/0001-61',
    segment: 'Agronegócio & Silos',
    city: 'Cascavel',
    uf: 'PR',
    sellerId: 'ciafal-seller-01',
    sellerName: 'Carlos Mendonça',
    lastPurchaseDate: '2024-04-10',
    daysSinceLastPurchase: 202,
    historicalRevenue: 530000,
    historicalTons: 70.0,
    ticket: 88000,
    frequency: 90,
    recurrenceMonths: [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    pAlive: 0.44,
    expectedNextPurchaseDays: 20,
    expectedValue: 75000,
    reactivationScore: 71,
    rfmSegment: 'Hibernando',
    creditLimit: 150000,
    creditAvailable: 150000,
    creditStatus: 'liberado',
    stockCoveragePercent: 85,
    recommendedAction: 'Apresentar campanha Pré-Safra de Bobinas Inox 304 corte sob medida',
    recommendedChannel: 'telefone',
    reason: 'Cliente sazonal do agronegócio; momento ideal para planejar fornecimento de verão.',
    products: [
      {
        code: 'BOB-304-1.5MM',
        description: 'Bobina de Aço Inox 304 1.50mm x 1200mm',
        family: 'Bobinas Inox',
        lastPurchaseDate: '2024-04-10',
        historicalTons: 50.0,
        stopped: true,
        stockAvailable: true,
        stockCoverage: 115,
        priceKg: 31.8,
      },
    ],
  },
  {
    customerId: 'CLI-1055',
    customerName: 'Frigoríficos & Câmaras Frias União',
    cnpj: '02.991.004/0001-19',
    segment: 'Frigoríficos e Instalações Térmicas',
    city: 'Chapecó',
    uf: 'SC',
    sellerId: 'ciafal-seller-01',
    sellerName: 'Carlos Mendonça',
    lastPurchaseDate: '2024-06-25',
    daysSinceLastPurchase: 126,
    historicalRevenue: 310000,
    historicalTons: 38.0,
    ticket: 38000,
    frequency: 60,
    recurrenceMonths: [1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0],
    pAlive: 0.62,
    expectedNextPurchaseDays: 14,
    expectedValue: 35000,
    reactivationScore: 76,
    rfmSegment: 'Prestes a hibernar',
    creditLimit: 100000,
    creditAvailable: 90000,
    creditStatus: 'liberado',
    stockCoveragePercent: 92,
    recommendedAction: 'Oferta relâmpago de Perfis U e Cantoneiras Inox 304',
    recommendedChannel: 'whatsapp',
    reason: 'Obras de expansão congeladas no meio do ano retornando agora no Q4.',
    products: [
      {
        code: 'CANT-304-2X1/4',
        description: 'Cantoneira Inox 304 2" x 1/4" Laminada',
        family: 'Perfis e Cantoneiras',
        lastPurchaseDate: '2024-06-25',
        historicalTons: 22.0,
        stopped: true,
        stockAvailable: true,
        stockCoverage: 85,
        priceKg: 39.0,
      },
    ],
  },
  {
    customerId: 'CLI-0941',
    customerName: 'Metalprint Painéis & Gabinetes Elétricos',
    cnpj: '07.312.809/0001-83',
    segment: 'Eletroeletrônica e Painéis',
    city: 'São Bernardo do Campo',
    uf: 'SP',
    sellerId: 'ciafal-seller-01',
    sellerName: 'Carlos Mendonça',
    lastPurchaseDate: '2024-08-22',
    daysSinceLastPurchase: 68,
    historicalRevenue: 240000,
    historicalTons: 29.0,
    ticket: 20000,
    frequency: 35,
    recurrenceMonths: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    pAlive: 0.81,
    expectedNextPurchaseDays: 5,
    expectedValue: 26000,
    reactivationScore: 87,
    rfmSegment: 'Leais',
    creditLimit: 80000,
    creditAvailable: 80000,
    creditStatus: 'liberado',
    stockCoveragePercent: 100,
    recommendedAction: 'Reenviar catálogo de Chapas Finas Frio e Inox 304 escovado',
    recommendedChannel: 'whatsapp',
    reason: 'Comprador novo na empresa; estreitar relacionamento comercial.',
    products: [
      {
        code: 'CH-304-1.2MM',
        description: 'Chapa Inox 304 1.20mm #4 com PVC Laser',
        family: 'Chapas Inox',
        lastPurchaseDate: '2024-08-22',
        historicalTons: 18.0,
        stopped: true,
        stockAvailable: true,
        stockCoverage: 120,
        priceKg: 33.0,
      },
    ],
  },
  {
    customerId: 'CLI-0712',
    customerName: 'Biotank Fermentadores & Cervejarias',
    cnpj: '19.782.341/0001-02',
    segment: 'Equipamentos Cervejeiros e Bebidas',
    city: 'Curitiba',
    uf: 'PR',
    sellerId: 'ciafal-seller-01',
    sellerName: 'Carlos Mendonça',
    lastPurchaseDate: '2024-05-30',
    daysSinceLastPurchase: 152,
    historicalRevenue: 490000,
    historicalTons: 58.0,
    ticket: 70000,
    frequency: 75,
    recurrenceMonths: [1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0],
    pAlive: 0.55,
    expectedNextPurchaseDays: 16,
    expectedValue: 62000,
    reactivationScore: 74,
    rfmSegment: 'Prestes a hibernar',
    creditLimit: 130000,
    creditAvailable: 130000,
    creditStatus: 'liberado',
    stockCoveragePercent: 88,
    recommendedAction: 'Apresentar pacote de Tubos Sanitários OD e Conexões Tri-Clamp',
    recommendedChannel: 'telefone',
    reason: 'Investimento em nova linha de envase em fase de projeto.',
    products: [
      {
        code: 'TB-OD-SANIT-2POL',
        description: 'Tubo OD Sanitário 304L 2" Polido Interno',
        family: 'Tubos Inox',
        lastPurchaseDate: '2024-05-30',
        historicalTons: 30.0,
        stopped: true,
        stockAvailable: true,
        stockCoverage: 95,
        priceKg: 37.5,
      },
    ],
  },
  {
    customerId: 'CLI-0550',
    customerName: 'TecnoLaser Corte e Conformação de Chapas',
    cnpj: '28.114.992/0001-50',
    segment: 'Corte a Laser e Dobra',
    city: 'Sorocaba',
    uf: 'SP',
    sellerId: 'ciafal-seller-01',
    sellerName: 'Carlos Mendonça',
    lastPurchaseDate: '2024-07-10',
    daysSinceLastPurchase: 111,
    historicalRevenue: 380000,
    historicalTons: 52.0,
    ticket: 38000,
    frequency: 45,
    recurrenceMonths: [1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    pAlive: 0.69,
    expectedNextPurchaseDays: 9,
    expectedValue: 40000,
    reactivationScore: 80,
    rfmSegment: 'Em risco',
    creditLimit: 110000,
    creditAvailable: 70000,
    creditStatus: 'liberado',
    stockCoveragePercent: 94,
    recommendedAction: 'Ofertar Chapas Grossas Carbono A36 e Inox 304 com frete CIF incluso',
    recommendedChannel: 'whatsapp',
    reason: 'Cliente muito sensível ao frete da matriz; aplicar frete regionalizado.',
    products: [
      {
        code: 'CH-A36-12MM',
        description: 'Chapa Grossa Aço Carbono ASTM A36 12.70mm (1/2")',
        family: 'Chapas Carbono A36',
        lastPurchaseDate: '2024-07-10',
        historicalTons: 35.0,
        stopped: true,
        stockAvailable: true,
        stockCoverage: 110,
        priceKg: 9.8,
      },
    ],
  },
]

export class QlikProvider implements BIProvider {
  readonly name = 'Qlik Cloud (CIAFAL Commercial Hub Adapter - Mock Mode)'
  private lastSyncTime = new Date().toISOString()
  private sourceUpdatedAt = new Date(Date.now() - 15 * 60 * 1000).toISOString()

  getSourceUpdatedAt(): string {
    return this.sourceUpdatedAt
  }

  getSyncedAt(): string {
    return this.lastSyncTime
  }

  async getDailySummary(sellerId: string): Promise<BISellerDailySummary> {
    const today = new Date().toISOString().split('T')[0]
    return {
      sellerId,
      date: today,
      activeClients: 42,
      inactiveClients: 18,
      recoverablePotential: 4670000,
      eligibleForContact: 14,
      reactivatedThisMonth: 5,
      revenueRecovered: 312500,
      tonsRecovered: 41.8,
      reactivationRate: 27.7,
      pendingActions: 8,
      completedActions: 12,
    }
  }

  async getInactiveCustomers(sellerId: string, filters?: BIFilters): Promise<BICustomerSummary[]> {
    let result = [...MOCK_INACTIVE_CUSTOMERS]

    if (filters) {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        result = result.filter(
          (c) =>
            c.customerName.toLowerCase().includes(q) ||
            c.customerId.toLowerCase().includes(q) ||
            (c.cnpj && c.cnpj.includes(q)) ||
            (c.city && c.city.toLowerCase().includes(q)),
        )
      }
      if (filters.inactivityDaysMin !== undefined) {
        result = result.filter((c) => c.daysSinceLastPurchase >= filters.inactivityDaysMin!)
      }
      if (filters.inactivityDaysMax !== undefined) {
        result = result.filter((c) => c.daysSinceLastPurchase <= filters.inactivityDaysMax!)
      }
      if (filters.segment) {
        result = result.filter((c) => c.segment === filters.segment)
      }
      if (filters.uf) {
        result = result.filter((c) => c.uf === filters.uf)
      }
      if (filters.productFamily) {
        result = result.filter((c) => c.products.some((p) => p.family === filters.productFamily))
      }
    }

    return result
  }

  async getRecurrenceMap(
    customerId: string,
  ): Promise<{ yearMonth: string; hasPurchase: boolean; revenue: number; tons?: number }[]> {
    const customer = MOCK_INACTIVE_CUSTOMERS.find((c) => c.customerId === customerId)
    const months: { yearMonth: string; hasPurchase: boolean; revenue: number; tons?: number }[] = []

    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const has = customer ? !!customer.recurrenceMonths[11 - i] : i > 3
      const rev = has ? Math.round((customer?.ticket || 30000) * (0.8 + Math.random() * 0.4)) : 0
      const tons = has ? Math.round((rev / 10000) * 10) / 10 : 0
      months.push({ yearMonth: ym, hasPurchase: has, revenue: rev, tons })
    }

    return months
  }

  async getCustomerHistory(customerId: string): Promise<BICustomerSummary | null> {
    const cust = MOCK_INACTIVE_CUSTOMERS.find((c) => c.customerId === customerId)
    return cust || null
  }

  async getStockCompatibility(customerId: string): Promise<BICustomerProduct[]> {
    const cust = MOCK_INACTIVE_CUSTOMERS.find((c) => c.customerId === customerId)
    return cust ? cust.products : []
  }

  async getReactivationPriority(
    sellerId: string,
    filters?: BIFilters,
  ): Promise<BICustomerSummary[]> {
    const list = await this.getInactiveCustomers(sellerId, filters)
    return list.sort((a, b) => b.reactivationScore - a.reactivationScore)
  }

  async checkHealth(): Promise<{ online: boolean; lastSync: string }> {
    return {
      online: true,
      lastSync: this.lastSyncTime,
    }
  }
}

export const defaultBIProvider = new QlikProvider()
