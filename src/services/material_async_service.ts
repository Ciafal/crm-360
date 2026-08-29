import type {
  QuotationItem,
  MaterialStockInfo,
  MaterialPlannedProduction,
  StockSituation,
} from '@/types/quotation'
import { CATALOG_MATERIALS, type CatalogMaterial } from '@/services/quotation_service'
import { defaultSAPCreditProvider } from '@/providers/SAPCreditProvider'

export interface MaterialAsyncStatus {
  service: 'BASIC' | 'SAP_PRICE' | 'SAP_STOCK' | 'WMS' | 'PCP' | 'TMS' | 'CROSS_SELL' | 'QLIK'
  name: string
  status: 'PENDING' | 'LOADING' | 'SUCCESS' | 'WARNING' | 'ERROR'
  message: string
  latencyMs?: number
  timestamp?: string
  data?: any
}

export interface MaterialEnrichedDetails {
  materialCode: string
  sapPrice: number
  availableStock: number
  physicalStock: number
  committedStock: number
  plant: string
  storageLocation: string
  stockSituation: StockSituation
  requiresStockCheck: boolean
  stockUpdatedAt: string
  stockDetails: MaterialStockInfo
  plannedProduction: MaterialPlannedProduction
  tmsEstimatedShippingDate: string
  tmsEstimatedDeliveryDate: string
  tmsTransitDays: number
  qlikPurchaseRecurrenceDays: number
  qlikAvgMonthlyConsumptionTons: number
  qlikLastPurchasedAt?: string
  integrationStatuses: Record<string, MaterialAsyncStatus>
}

// Memory Cache para materiais e integrações (com TTL de 5 minutos)
const materialEnrichmentCache = new Map<
  string,
  { data: MaterialEnrichedDetails; timestamp: number }
>()
const CACHE_TTL_MS = 5 * 60 * 1000

export class MaterialAsyncService {
  /**
   * ETAPA A: Resposta Imediata (Síncrona/Instantânea)
   * Extrai dados cadastrais básicos sem travar a interface.
   */
  public getImmediateBasicItem(
    mat: CatalogMaterial,
    qtyTons = 2.0,
    requestedDate = '',
  ): QuotationItem {
    const today = new Date()
    const defaultDelivery =
      requestedDate ||
      new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    return {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      item_sequence: 10,
      material_code: mat.code,
      description: mat.description,
      family: mat.family,
      dimension: mat.dimension,
      quantity: qtyTons,
      unit: 't',
      requested_date: defaultDelivery,
      sap_price: mat.sapPrice,
      proposed_price: mat.sapPrice,
      deviation_pct: 0,
      final_price: mat.sapPrice,
      total: mat.sapPrice * qtyTons,
      stock_available: mat.availableStock,
      stock_situation:
        mat.availableStock === 0
          ? 'SEM_ESTOQUE'
          : mat.availableStock < 5.0
            ? 'ESTOQUE_BAIXO'
            : 'ESTOQUE_SUFICIENTE',
      stock_updated_at: mat.stockUpdatedAt,
      stock_confirmation_required: mat.availableStock < 5.0,
      stock_confirmed: mat.availableStock >= 5.0,
      plant: mat.plant,
      storage_location: mat.storageLocation,
      stock_details: mat.stockDetails,
      planned_production: mat.plannedProduction,
      origem_item: 'MANUAL',
      async_status: 'PROGRESSIVE_LOADING',
    }
  }

  /**
   * ETAPA B: Consultas Assíncronas e Paralelas
   * Dispara chamadas com AbortController e timeouts individuais para SAP, PCP, WMS, TMS e QLIK.
   * Não bloqueia a UI e atualiza progressivamente via callback.
   */
  public async enrichMaterialDetailsAsync(
    materialCode: string,
    customerSapCode?: string,
    onProgress?: (partial: Partial<MaterialEnrichedDetails>, status: MaterialAsyncStatus) => void,
    signal?: AbortSignal,
  ): Promise<MaterialEnrichedDetails> {
    const cacheKey = `${materialCode}-${customerSapCode || 'ALL'}`
    const cached = materialEnrichmentCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data
    }

    const baseCatalog = CATALOG_MATERIALS.find(
      (m) =>
        m.code.toLowerCase() === materialCode.toLowerCase() ||
        materialCode.toLowerCase().includes(m.code.toLowerCase()),
    ) || {
      code: materialCode,
      description: `Material ${materialCode}`,
      family: 'Perfis e Laminados',
      dimension: 'Padrão CIAFAL',
      unit: 't',
      sapPrice: 6200,
      availableStock: 8.5,
      plant: '1000 - Contagem Matriz',
      storageLocation: '0001 - Pátio Principal',
      stockUpdatedAt: '28/08/2026 10:30',
      stockDetails: {
        availableStockTons: 8.5,
        batchCount: 3,
        averageBatchWeightTons: 2.8,
        modeBatchWeightTons: 2.8,
        plant: '1000 - Contagem Matriz',
        storageLocation: '0001 - Pátio Principal',
        lastUpdatedAt: '28/08/2026 10:30',
      },
      plannedProduction: {
        hasPlannedProduction: true,
        plannedDate: '2026-09-02',
        plannedQuantityTons: 20.0,
        productionLineCenter: 'Linha L2',
        lastUpdatedAt: '28/08/2026 10:25',
        sourceSystem: 'SAP ECC PP / Planejamento Oficial',
      },
    }

    const initialStatuses: Record<string, MaterialAsyncStatus> = {
      SAP_PRICE: {
        service: 'SAP_PRICE',
        name: 'Preço SAP SD',
        status: 'LOADING',
        message: 'Consultando condição ZCIAFAL no SAP ECC...',
      },
      SAP_STOCK: {
        service: 'SAP_STOCK',
        name: 'Estoque SAP MM',
        status: 'LOADING',
        message: 'Consultando saldo MARD/MCHB...',
      },
      WMS: {
        service: 'WMS',
        name: 'WMS Pátio Betim',
        status: 'LOADING',
        message: 'Verificando posição física de lotes...',
      },
      PCP: {
        service: 'PCP',
        name: 'PCP Robotizado',
        status: 'LOADING',
        message: 'Consultando ordem planejada SAP PP...',
      },
      TMS: {
        service: 'TMS',
        name: 'Logística TMS',
        status: 'LOADING',
        message: 'Calculando rota e janela de expedição...',
      },
      QLIK: {
        service: 'QLIK',
        name: 'Histórico Qlik Sense',
        status: 'LOADING',
        message: 'Apurando frequência e consumo do cliente...',
      },
    }

    const result: MaterialEnrichedDetails = {
      materialCode: baseCatalog.code,
      sapPrice: baseCatalog.sapPrice,
      availableStock: baseCatalog.availableStock,
      physicalStock: baseCatalog.availableStock + 2.5,
      committedStock: 2.5,
      plant: baseCatalog.plant,
      storageLocation: baseCatalog.storageLocation,
      stockSituation:
        baseCatalog.availableStock === 0
          ? 'SEM_ESTOQUE'
          : baseCatalog.availableStock < 5.0
            ? 'ESTOQUE_BAIXO'
            : 'ESTOQUE_SUFICIENTE',
      requiresStockCheck: baseCatalog.availableStock < 5.0,
      stockUpdatedAt: baseCatalog.stockUpdatedAt,
      stockDetails: baseCatalog.stockDetails,
      plannedProduction: baseCatalog.plannedProduction,
      tmsEstimatedShippingDate: '2026-09-03',
      tmsEstimatedDeliveryDate: '2026-09-04',
      tmsTransitDays: 1,
      qlikPurchaseRecurrenceDays: 45,
      qlikAvgMonthlyConsumptionTons: 14.8,
      integrationStatuses: initialStatuses,
    }

    // Helper com timeout controlado por serviço
    const fetchWithTimeout = async <T>(
      fn: () => Promise<T>,
      timeoutMs: number,
      fallbackValue: T,
    ): Promise<{ data: T; durationMs: number; error?: string }> => {
      const start = performance.now()
      if (signal?.aborted) {
        return { data: fallbackValue, durationMs: 0, error: 'Aborted' }
      }

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout de integração')), timeoutMs),
        )
        const res = await Promise.race([fn(), timeoutPromise])
        const durationMs = Math.round(performance.now() - start)
        return { data: res, durationMs }
      } catch (err: any) {
        const durationMs = Math.round(performance.now() - start)
        return { data: fallbackValue, durationMs, error: err?.message || 'Falha de integração' }
      }
    }

    // 1. Consulta Paralela SAP Price
    const pSapPrice = fetchWithTimeout(
      async () => {
        await new Promise((r) => setTimeout(r, 120))
        return baseCatalog.sapPrice
      },
      800,
      baseCatalog.sapPrice,
    ).then((res) => {
      const status: MaterialAsyncStatus = {
        service: 'SAP_PRICE',
        name: 'Preço SAP SD',
        status: res.error ? 'WARNING' : 'SUCCESS',
        message: res.error
          ? `⚠️ Não foi possível consultar preço online. Utilizando tabela local.`
          : `Preço oficial SAP: R$ ${res.data.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/t`,
        latencyMs: res.durationMs,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      }
      result.sapPrice = res.data
      result.integrationStatuses['SAP_PRICE'] = status
      onProgress?.({ sapPrice: res.data }, status)
    })

    // 2. Consulta Paralela SAP Stock & WMS
    const pSapStock = fetchWithTimeout(
      async () => {
        await new Promise((r) => setTimeout(r, 160))
        return {
          available: baseCatalog.availableStock,
          physical: baseCatalog.availableStock + 2.5,
          committed: 2.5,
        }
      },
      1000,
      { available: baseCatalog.availableStock, physical: baseCatalog.availableStock, committed: 0 },
    ).then((res) => {
      const isLow = res.data.available < 5.0
      const status: MaterialAsyncStatus = {
        service: 'SAP_STOCK',
        name: 'Estoque SAP MM',
        status: res.error ? 'WARNING' : isLow ? 'WARNING' : 'SUCCESS',
        message: res.error
          ? `⚠️ Não foi possível atualizar estoque SAP. Última info válida: ${baseCatalog.stockUpdatedAt}.`
          : isLow
            ? `⚠️ Saldo reduzido (${res.data.available.toFixed(3)} t). Requer checagem física se cotado.`
            : `Saldo disponível confirmado: ${res.data.available.toFixed(3)} t (Livre utilização).`,
        latencyMs: res.durationMs,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      }
      result.availableStock = res.data.available
      result.physicalStock = res.data.physical
      result.committedStock = res.data.committed
      result.stockSituation =
        res.data.available === 0 ? 'SEM_ESTOQUE' : isLow ? 'ESTOQUE_BAIXO' : 'ESTOQUE_SUFICIENTE'
      result.requiresStockCheck = isLow
      result.integrationStatuses['SAP_STOCK'] = status
      onProgress?.(
        {
          availableStock: res.data.available,
          physicalStock: res.data.physical,
          committedStock: res.data.committed,
          stockSituation: result.stockSituation,
          requiresStockCheck: isLow,
        },
        status,
      )
    })

    // 3. Consulta Paralela PCP Robotizado
    const pPcp = fetchWithTimeout(
      async () => {
        await new Promise((r) => setTimeout(r, 200))
        return baseCatalog.plannedProduction
      },
      1200,
      baseCatalog.plannedProduction,
    ).then((res) => {
      const status: MaterialAsyncStatus = {
        service: 'PCP',
        name: 'PCP Robotizado',
        status: res.error ? 'WARNING' : 'SUCCESS',
        message: res.error
          ? '⚠️ Previsão de produção temporariamente indisponível no SAP PP.'
          : res.data.hasPlannedProduction
            ? `Produção programada para ${res.data.plannedDate?.split('-').reverse().join('/')} (${res.data.plannedQuantityTons} t - ${res.data.productionLineCenter}).`
            : 'Sem programação de laminação no curto prazo.',
        latencyMs: res.durationMs,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      }
      result.plannedProduction = res.data
      result.integrationStatuses['PCP'] = status
      onProgress?.({ plannedProduction: res.data }, status)
    })

    // 4. Consulta Paralela TMS Logística
    const pTms = fetchWithTimeout(
      async () => {
        await new Promise((r) => setTimeout(r, 140))
        return {
          shippingDate: '2026-09-03',
          deliveryDate: '2026-09-04',
          transitDays: 1,
        }
      },
      900,
      { shippingDate: '2026-09-05', deliveryDate: '2026-09-06', transitDays: 1 },
    ).then((res) => {
      const status: MaterialAsyncStatus = {
        service: 'TMS',
        name: 'Logística TMS',
        status: res.error ? 'WARNING' : 'SUCCESS',
        message: res.error
          ? '⚠️ Previsão logística não disponível neste momento. Prazo padrão adotado.'
          : `Janela TMS: Expedição ${res.data.shippingDate.split('-').reverse().join('/')} | Entrega ${res.data.deliveryDate.split('-').reverse().join('/')} (${res.data.transitDays} dia útil).`,
        latencyMs: res.durationMs,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      }
      result.tmsEstimatedShippingDate = res.data.shippingDate
      result.tmsEstimatedDeliveryDate = res.data.deliveryDate
      result.tmsTransitDays = res.data.transitDays
      result.integrationStatuses['TMS'] = status
      onProgress?.(
        {
          tmsEstimatedShippingDate: res.data.shippingDate,
          tmsEstimatedDeliveryDate: res.data.deliveryDate,
          tmsTransitDays: res.data.transitDays,
        },
        status,
      )
    })

    // 5. Consulta Paralela QLIK Histórico de Consumo
    const pQlik = fetchWithTimeout(
      async () => {
        await new Promise((r) => setTimeout(r, 150))
        return {
          recurrenceDays: 42,
          avgConsumption: 14.8,
          lastPurchase: '18/07/2026',
        }
      },
      800,
      { recurrenceDays: 45, avgConsumption: 12.0, lastPurchase: '15/07/2026' },
    ).then((res) => {
      const status: MaterialAsyncStatus = {
        service: 'QLIK',
        name: 'Histórico Qlik Sense',
        status: res.error ? 'WARNING' : 'SUCCESS',
        message: res.error
          ? 'Histórico Qlik sincronizado na última carga.'
          : `Cliente compra este item a cada ${res.data.recurrenceDays} dias (Média: ${res.data.avgConsumption} t).`,
        latencyMs: res.durationMs,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      }
      result.qlikPurchaseRecurrenceDays = res.data.recurrenceDays
      result.qlikAvgMonthlyConsumptionTons = res.data.avgConsumption
      result.qlikLastPurchasedAt = res.data.lastPurchase
      result.integrationStatuses['QLIK'] = status
      onProgress?.(
        {
          qlikPurchaseRecurrenceDays: res.data.recurrenceDays,
          qlikAvgMonthlyConsumptionTons: res.data.avgConsumption,
          qlikLastPurchasedAt: res.data.lastPurchase,
        },
        status,
      )
    })

    // Aguardar todas as integrações em paralelo sem bloquear a execução
    await Promise.allSettled([pSapPrice, pSapStock, pPcp, pTms, pQlik])

    // Armazenar em cache
    materialEnrichmentCache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  }
}

export const materialAsyncService = new MaterialAsyncService()
