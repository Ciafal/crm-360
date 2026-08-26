import { useState, useEffect, useCallback } from 'react'
import { biService } from '@/services/bi_service'
import type {
  BICustomerSummary,
  BISellerDailySummary,
  BIFilters,
  BICustomerProduct,
} from '@/providers/BIProvider'

export function useBI(sellerId?: string) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dailySummary, setDailySummary] = useState<BISellerDailySummary | null>(null)
  const [inactiveCustomers, setInactiveCustomers] = useState<BICustomerSummary[]>([])
  const [isDemoData, setIsDemoData] = useState(true)
  const [health, setHealth] = useState<{ online: boolean; lastSync: string }>({
    online: true,
    lastSync: new Date().toISOString(),
  })

  const loadData = useCallback(
    async (filters?: BIFilters) => {
      setLoading(true)
      setError(null)
      try {
        const sId = sellerId || 'ciafal-seller-01'
        const [sum, inact, hlth] = await Promise.all([
          biService.getDailySummary(sId),
          biService.getInactiveCustomers(sId, filters),
          biService.checkHealth(),
        ])

        setDailySummary(sum)
        setInactiveCustomers(inact)
        setHealth(hlth)
        setIsDemoData(true) // Mock QlikProvider
      } catch (err: any) {
        console.error('Error in useBI:', err)
        setError('Dados analíticos temporariamente indisponíveis.')
      } finally {
        setLoading(false)
      }
    },
    [sellerId],
  )

  useEffect(() => {
    loadData()
  }, [loadData])

  const getCustomerDetail = async (customerId: string): Promise<BICustomerSummary | null> => {
    return await biService.getCustomerHistory(customerId)
  }

  const getCustomerRecurrence = async (customerId: string) => {
    return await biService.getRecurrenceMap(customerId)
  }

  const getStockCompatibility = async (customerId: string): Promise<BICustomerProduct[]> => {
    return await biService.getStockCompatibility(customerId)
  }

  return {
    loading,
    error,
    dailySummary,
    inactiveCustomers,
    isDemoData,
    health,
    loadData,
    getCustomerDetail,
    getCustomerRecurrence,
    getStockCompatibility,
    providerName: biService.getProvider().name,
  }
}
