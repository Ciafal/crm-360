export interface BICustomerProduct {
  code: string
  description: string
  family: string
  lastPurchaseDate?: string
  historicalTons: number
  stopped: boolean // se parou de comprar
  stockAvailable?: boolean
  stockCoverage?: number
  priceKg?: number
}

export interface BICustomerSummary {
  customerId: string
  customerName: string
  cnpj?: string
  segment?: string
  city?: string
  uf?: string
  sellerId?: string
  sellerName?: string
  lastPurchaseDate?: string
  daysSinceLastPurchase: number
  historicalRevenue: number
  historicalTons: number
  ticket: number
  frequency: number
  recurrenceMonths: number[]
  products: BICustomerProduct[]
  pAlive: number
  expectedNextPurchaseDays: number
  expectedValue: number
  reactivationScore: number
  rfmSegment: string
  creditLimit?: number
  creditAvailable?: number
  creditStatus?: 'liberado' | 'em_analise' | 'bloqueado' | 'nao_confirmado'
  stockCoveragePercent?: number
  recommendedAction?: string
  recommendedChannel?: 'whatsapp' | 'telefone' | 'visita' | 'email'
  reason?: string
}

export interface BISellerDailySummary {
  sellerId: string
  date: string
  activeClients: number
  inactiveClients: number
  recoverablePotential: number
  eligibleForContact: number
  reactivatedThisMonth: number
  revenueRecovered: number
  tonsRecovered: number
  reactivationRate: number
  pendingActions: number
  completedActions: number
}

export interface BIFilters {
  company?: string
  salesOrg?: string
  teamId?: string
  sellerId?: string
  inactivityDaysMin?: number
  inactivityDaysMax?: number
  segment?: string
  uf?: string
  productFamily?: string
  search?: string
}

export interface BIProvider {
  readonly name: string
  getDailySummary(sellerId: string): Promise<BISellerDailySummary>
  getInactiveCustomers(sellerId: string, filters?: BIFilters): Promise<BICustomerSummary[]>
  getRecurrenceMap(
    customerId: string,
  ): Promise<{ yearMonth: string; hasPurchase: boolean; revenue: number; tons?: number }[]>
  getCustomerHistory(customerId: string): Promise<BICustomerSummary | null>
  getStockCompatibility(customerId: string): Promise<BICustomerProduct[]>
  getReactivationPriority(sellerId: string, filters?: BIFilters): Promise<BICustomerSummary[]>
  checkHealth(): Promise<{ online: boolean; lastSync: string }>
}
