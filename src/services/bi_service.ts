import pb from '@/lib/pocketbase/client'
import { defaultBIProvider } from '@/providers/QlikProvider'
import type {
  BIProvider,
  BICustomerSummary,
  BISellerDailySummary,
  BICustomerProduct,
  BIFilters,
} from '@/providers/BIProvider'

export class BIService {
  private provider: BIProvider = defaultBIProvider

  setProvider(provider: BIProvider) {
    this.provider = provider
  }

  getProvider(): BIProvider {
    return this.provider
  }

  async getDailySummary(sellerId: string): Promise<BISellerDailySummary> {
    try {
      return await this.provider.getDailySummary(sellerId)
    } catch (err) {
      console.warn('BIProvider failed, returning fallback summary:', err)
      return {
        sellerId,
        date: new Date().toISOString().split('T')[0],
        activeClients: 0,
        inactiveClients: 0,
        recoverablePotential: 0,
        eligibleForContact: 0,
        reactivatedThisMonth: 0,
        revenueRecovered: 0,
        tonsRecovered: 0,
        reactivationRate: 0,
        pendingActions: 0,
        completedActions: 0,
      }
    }
  }

  async getInactiveCustomers(sellerId: string, filters?: BIFilters): Promise<BICustomerSummary[]> {
    try {
      return await this.provider.getInactiveCustomers(sellerId, filters)
    } catch (err) {
      console.warn('BIProvider getInactiveCustomers failed:', err)
      return []
    }
  }

  async getCustomerHistory(customerId: string): Promise<BICustomerSummary | null> {
    try {
      return await this.provider.getCustomerHistory(customerId)
    } catch (err) {
      console.warn('BIProvider getCustomerHistory failed:', err)
      return null
    }
  }

  async getRecurrenceMap(
    customerId: string,
  ): Promise<{ yearMonth: string; hasPurchase: boolean; revenue: number; tons?: number }[]> {
    try {
      return await this.provider.getRecurrenceMap(customerId)
    } catch (err) {
      console.warn('BIProvider getRecurrenceMap failed:', err)
      return []
    }
  }

  async getStockCompatibility(customerId: string): Promise<BICustomerProduct[]> {
    try {
      return await this.provider.getStockCompatibility(customerId)
    } catch (err) {
      console.warn('BIProvider getStockCompatibility failed:', err)
      return []
    }
  }

  async getReactivationPriority(
    sellerId: string,
    filters?: BIFilters,
  ): Promise<BICustomerSummary[]> {
    try {
      return await this.provider.getReactivationPriority(sellerId, filters)
    } catch (err) {
      console.warn('BIProvider getReactivationPriority failed:', err)
      return []
    }
  }

  async checkHealth(): Promise<{ online: boolean; lastSync: string }> {
    try {
      return await this.provider.checkHealth()
    } catch (err) {
      return { online: false, lastSync: new Date().toISOString() }
    }
  }

  // Sincroniza dados analíticos no PocketBase para cache offline/queries locais
  async syncCustomerScoreToLocal(summary: BICustomerSummary, accountId?: string) {
    try {
      const existing = await pb
        .collection('customer_scores')
        .getFirstListItem(`customer_id = '${summary.customerId}'`, { requestKey: null })
        .catch(() => null)

      const payload = {
        customer_id: summary.customerId,
        seller_id: summary.sellerId,
        account_id: accountId,
        rfm_segment: summary.rfmSegment,
        bg_nbd_p_alive: summary.pAlive,
        predicted_next_purchase_days: summary.expectedNextPurchaseDays,
        gamma_gamma_expected_value: summary.expectedValue,
        reactivation_score: summary.reactivationScore,
        model_version: 'v2.1-qlik-ml',
        calculated_at: new Date().toISOString(),
        source: 'qlik',
      }

      if (existing) {
        await pb.collection('customer_scores').update(existing.id, payload)
      } else {
        await pb.collection('customer_scores').create(payload)
      }
    } catch (err) {
      // Falhas de cache no PB não interrompem a UI
      console.debug('Error caching customer score:', err)
    }
  }
}

export const biService = new BIService()
