import pb from '@/lib/pocketbase/client'
import type {
  DailyCommercialAction,
  CommercialActionStatus,
  CommercialActionType,
} from '@/types/models'

export interface CreateDailyActionParams {
  seller_id: string
  customer_id: string
  customer_name?: string
  opportunity_id?: string
  date?: string
  action_type: CommercialActionType
  priority?: number
  recommendation?: string
  rationale?: string
  source?: string
  confidence?: number
  due_at?: string
  potential_revenue?: number
  potential_tons?: number
  product_family?: string
  generated_by?: string
  account_id?: string
}

export const dailyActionsService = {
  async listActions(
    sellerId?: string,
    date?: string,
    accountId?: string,
  ): Promise<DailyCommercialAction[]> {
    try {
      const filters: string[] = []
      if (sellerId) {
        filters.push(`seller_id = '${sellerId}'`)
      }
      if (date) {
        filters.push(`date ~ '${date}'`)
      }
      if (accountId) {
        filters.push(`account_id = '${accountId}'`)
      }

      const filterStr = filters.length > 0 ? filters.join(' && ') : '1=1'

      const records = await pb
        .collection('daily_commercial_actions')
        .getFullList<DailyCommercialAction>({
          filter: filterStr,
          sort: '-priority,-created',
          expand: 'seller_id',
          requestKey: null,
        })

      return records
    } catch (err) {
      console.warn('Error fetching daily actions from PocketBase:', err)
      return []
    }
  },

  async createAction(data: CreateDailyActionParams): Promise<DailyCommercialAction> {
    // Regra F.2: Não duplicar ações antes de criar
    try {
      const filter = `customer_id = '${data.customer_id}' && (status = 'pendente' || status = 'em_andamento')`
      const existing = await pb
        .collection('daily_commercial_actions')
        .getFirstListItem<DailyCommercialAction>(filter, { requestKey: null })
        .catch(() => null)

      if (existing) {
        return existing
      }
    } catch {
      /* intentionally ignored */
    }

    const payload = {
      ...data,
      status: 'pendente' as CommercialActionStatus,
      date: data.date || new Date().toISOString().split('T')[0],
      source: data.source || 'ia',
      generated_by: data.generated_by || 'ia',
      confidence: data.confidence || 0.85,
    }

    return await pb.collection('daily_commercial_actions').create<DailyCommercialAction>(payload)
  },

  async updateStatus(
    id: string,
    status: CommercialActionStatus,
    extra?: {
      result?: string
      completion_channel?: string
      rescheduled_to?: string
      justification?: string
    },
  ): Promise<DailyCommercialAction> {
    const payload: Record<string, any> = { status, ...extra }
    if (status === 'concluida') {
      payload.completed_at = new Date().toISOString()
    }
    return await pb
      .collection('daily_commercial_actions')
      .update<DailyCommercialAction>(id, payload)
  },

  async bulkCreateIfNotExists(
    actions: CreateDailyActionParams[],
  ): Promise<DailyCommercialAction[]> {
    const results: DailyCommercialAction[] = []
    for (const a of actions) {
      try {
        const res = await this.createAction(a)
        results.push(res)
      } catch (err) {
        console.warn('Failed to seed daily action:', err)
      }
    }
    return results
  },
}
