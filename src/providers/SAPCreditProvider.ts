import type { SAPCreditData } from '@/types/models'

// Provedor de dados de crédito SAP ECC (Transação F.35)
class SAPCreditService {
  private cache: Map<string, { data: SAPCreditData; timestamp: number }> = new Map()
  private readonly CACHE_TTL_MS = 1000 * 60 * 15 // 15 minutos de cache

  // Consulta limite e posição de crédito de acordo com a transação F.35 SAP ECC
  async getCreditPosition(
    customerId: string,
    sapCode: string,
    forceRefresh = false,
  ): Promise<SAPCreditData> {
    const cacheKey = `${customerId}-${sapCode}`
    const cached = this.cache.get(cacheKey)

    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return { ...cached.data, isCached: true }
    }

    // Simulação de chamada RFC SAP ECC (BAPI_CREDIT_ACCOUNT_GET_STATUS)
    await new Promise((resolve) => setTimeout(resolve, 350))

    // Variação determinística com base no código SAP para testes
    const hash = sapCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const baseLimit = ((hash % 8) + 2) * 100000 // 200k a 900k
    const usagePercent = 30 + (hash % 60) // 30% a 90%
    const exposure = Math.round((baseLimit * usagePercent) / 100)
    const available = Math.max(0, baseLimit - exposure)
    const overdue = hash % 5 === 0 ? Math.round(exposure * 0.15) : 0
    const maxDelay = overdue > 0 ? (hash % 14) + 1 : 0
    const status: 'REGULAR' | 'RESTRITO' | 'BLOQUEADO' =
      overdue > 0 && maxDelay > 7 ? 'BLOQUEADO' : usagePercent > 85 ? 'RESTRITO' : 'REGULAR'

    const creditData: SAPCreditData = {
      customerId,
      sapCode,
      creditLimit: baseLimit,
      creditExposure: exposure,
      creditAvailable: available,
      utilizationPercent: usagePercent,
      receivablesTotal: exposure,
      receivablesOpenNotDue: exposure - overdue,
      receivablesOverdue: overdue,
      maxDelayDays: maxDelay,
      creditStatus: status,
      creditBlockReason:
        status === 'BLOQUEADO'
          ? 'Títulos vencidos há mais de 7 dias (Trava automática SAP F.35)'
          : status === 'RESTRITO'
            ? 'Exposição de crédito acima de 85%'
            : undefined,
      paymentTerms: '28 / 35 DDL via Boleto Bancário (Tabela Padrão)',
      lastCheckedAt: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      isCached: false,
      systemSource: 'SAP ECC',
      rawF35Data: {
        knkli: sapCode,
        klime: baseLimit,
        klims: exposure,
        skx: available,
        waers: 'BRL',
      },
    }

    this.cache.set(cacheKey, { data: creditData, timestamp: Date.now() })
    return creditData
  }
}

export interface SAPCreditStatus {
  customerId: string
  sapCustomerCode: string
  creditLimit: number
  creditUsed: number
  creditAvailable: number
  usedPercentage: number
  openOrdersValue: number
  overdueInvoicesValue: number
  longestDelayDays: number
  creditCheckResult: 'LIBERADO' | 'ATENCAO' | 'BLOQUEADO'
  creditStatus: 'REGULAR' | 'RESTRITO' | 'BLOQUEADO'
  creditBlockReason?: string
  paymentTerms: string
  lastUpdated: string
  dataSource: string
  rawF35Data?: Record<string, any>
}

export class DefaultSAPCreditProvider {
  async checkCustomerCredit(
    sapCustomerCode: string,
    customerId = 'cust-default',
  ): Promise<SAPCreditStatus> {
    const data = await sapCreditProvider.getCreditPosition(customerId, sapCustomerCode)
    return {
      customerId: data.customerId,
      sapCustomerCode: data.sapCode,
      creditLimit: data.creditLimit,
      creditUsed: data.creditExposure,
      creditAvailable: data.creditAvailable,
      usedPercentage: data.utilizationPercent,
      openOrdersValue: data.receivablesOpenNotDue,
      overdueInvoicesValue: data.receivablesOverdue,
      longestDelayDays: data.maxDelayDays,
      creditCheckResult:
        data.creditStatus === 'BLOQUEADO'
          ? 'BLOQUEADO'
          : data.creditStatus === 'RESTRITO'
            ? 'ATENCAO'
            : 'LIBERADO',
      creditStatus: data.creditStatus,
      creditBlockReason: data.creditBlockReason,
      paymentTerms: data.paymentTerms,
      lastUpdated: new Date().toISOString(),
      dataSource: `${data.systemSource} F.35`,
      rawF35Data: data.rawF35Data,
    }
  }

  async getCreditPosition(customerId: string, sapCode: string): Promise<SAPCreditData> {
    return sapCreditProvider.getCreditPosition(customerId, sapCode)
  }
}

export const defaultSAPCreditProvider = new DefaultSAPCreditProvider()
export const sapCreditProvider = new SAPCreditService()
