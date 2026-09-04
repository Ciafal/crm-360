// src/services/recommendation_service.ts
// Motor de Recomendações Comerciais da IA do CRM 360 CIAFAL

import { mockInitialRecommendations } from '@/data/mockCommercialExecutionData'
import type {
  AICommercialRecommendation,
  ActionOriginType,
  PriorityLevel,
} from '@/types/commercial_execution'
import { crmStorage } from '@/lib/crm-storage'

const STORAGE_KEY_RECOMMENDATIONS = 'ciafal_crm_commercial_recommendations_v1'

class RecommendationService {
  private getStored<T>(key: string, fallback: T): T {
    try {
      return crmStorage.getJSON<T>(key, fallback)
    } catch {
      return fallback
    }
  }

  private setStored<T>(key: string, data: T) {
    try {
      crmStorage.setJSON(key, data)
    } catch {
      // silent
    }
  }

  public getAllRecommendations(): AICommercialRecommendation[] {
    return this.getStored<AICommercialRecommendation[]>(
      STORAGE_KEY_RECOMMENDATIONS,
      mockInitialRecommendations,
    )
  }

  public saveRecommendations(recs: AICommercialRecommendation[]): void {
    this.setStored(STORAGE_KEY_RECOMMENDATIONS, recs)
  }

  public getRecommendationsByOrigin(origin: ActionOriginType): AICommercialRecommendation[] {
    return this.getAllRecommendations().filter((r) => r.origem === origin)
  }

  public getRecommendationsByPriority(priority: PriorityLevel): AICommercialRecommendation[] {
    return this.getAllRecommendations().filter((r) => r.prioridade === priority)
  }

  public dismissRecommendation(id: string): void {
    const recs = this.getAllRecommendations()
    this.saveRecommendations(recs.filter((r) => r.id !== id))
  }
}

export const recommendationService = new RecommendationService()
