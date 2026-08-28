// src/services/reactivation_service.ts
// Motor de Reativação e Matching de Estoque Parado × Clientes com Score de Aderência

import { customerManagementService } from '@/services/customer_management_service'
import { stockService } from '@/services/stock_service'
import type { CustomerManagementItem } from '@/types/customer_management'
import type { StockItem } from '@/types/stock'
import type { FitScore } from '@/types/commercial_execution'

export interface ReactivationCandidate {
  cliente: CustomerManagementItem
  faixaInatividade: '30_60' | '61_90' | '91_180' | 'acima_180'
  prioridadeReativacao: 'ALTA' | 'MEDIA' | 'BAIXA'
  scoreReativacao: number
  motivoPrioridade: string
  produtoMatching?: {
    codigo: string
    descricao: string
    familia: string
    saldoEstoqueTons: number
    precoReferenciaKg: number
    diasParado: number
  }
  scoreAderencia: FitScore
  motivoAderencia: string
  potencialFaturamento: number
}

class ReactivationService {
  /**
   * Filtra e classifica a base de clientes sem compra com motor de priorização e matching de estoque
   */
  public getReactivationCandidates(filters?: {
    faixaDias?: 'todas' | '30_60' | '61_90' | '91_180' | 'acima_180'
    vendedorId?: string
    regiao?: string
    segmento?: string
    familiaProduto?: string
    prioridade?: 'todas' | 'ALTA' | 'MEDIA' | 'BAIXA'
  }): ReactivationCandidate[] {
    const customers = customerManagementService.getCustomers()
    const stockItems = stockService.getStoredStockItems()

    // Itens com estoque disponível e especialmente parados / envelhecidos
    const availableStock = stockItems.filter((s) => s.availableTons > 0)

    const candidates: ReactivationCandidate[] = []

    customers.forEach((c) => {
      // Clientes elegíveis para reativação (sem compra há >= 30 dias)
      if (c.diasSemCompra < 30) return

      // Classificação por faixa de inatividade parametrizável
      let faixa: ReactivationCandidate['faixaInatividade'] = '30_60'
      if (c.diasSemCompra > 180) faixa = 'acima_180'
      else if (c.diasSemCompra > 90) faixa = '91_180'
      else if (c.diasSemCompra > 60) faixa = '61_90'

      // Cálculo de Prioridade de Reativação pela IA
      let score = 0
      const reasons: string[] = []

      // 1. Histórico de faturamento e volume
      if (c.faturamento12m > 500000) {
        score += 35
        reasons.push('Alto faturamento histórico (> R$ 500k/ano)')
      } else if (c.faturamento12m > 150000) {
        score += 20
        reasons.push('Faturamento médio consistente')
      }

      // 2. Classificação de importância
      if (c.classificacao === 'ESTRATEGICO') {
        score += 30
        reasons.push('Cliente Estratégico da CIAFAL')
      } else if (c.classificacao === 'CLIENTE_A') {
        score += 20
        reasons.push('Curva A de volume')
      }

      // 3. ISC e satisfação
      if (c.isc >= 80) {
        score += 15
        reasons.push(`Boa relação histórica (ISC ${c.isc}/100)`)
      }

      // 4. Tempo sem compra
      if (c.diasSemCompra >= 90) {
        score += 15
        reasons.push(`Janela crítica de inatividade (${c.diasSemCompra} dias)`)
      }

      let prioridade: ReactivationCandidate['prioridadeReativacao'] = 'BAIXA'
      if (score >= 60) prioridade = 'ALTA'
      else if (score >= 35) prioridade = 'MEDIA'

      // MOTOR DE MATCHING: Produto parado + histórico + segmento + região + probabilidade
      let bestMatchingStock: StockItem | undefined = undefined
      let fitScore: FitScore = 'BAIXA'
      let motivoAderencia = ''

      // Tenta encontrar um item parado ou disponível que o cliente costuma comprar
      const preferredFamily = c.produtosSugeridos[0]?.familia || ''
      const matchingByFamily = availableStock.find(
        (s) =>
          s.family.toLowerCase().includes(preferredFamily.toLowerCase()) ||
          c.segmento.toLowerCase().includes(s.family.toLowerCase()),
      )

      if (matchingByFamily) {
        bestMatchingStock = matchingByFamily
        if (matchingByFamily.daysWithoutMovement >= 60 && c.faturamento12m > 200000) {
          fitScore = 'MUITO_ALTA'
          motivoAderencia = `Cliente comprou produtos da família ${matchingByFamily.family} historicamente; estoque disponível de ${matchingByFamily.availableTons}t no centro ${matchingByFamily.plantName} com ${matchingByFamily.daysWithoutMovement} dias sem giro; distância logística reduzida.`
        } else {
          fitScore = 'ALTA'
          motivoAderencia = `Aderência ao segmento ${c.segmento}; material ${matchingByFamily.materialCode} disponível para pronta entrega com ${matchingByFamily.availableTons}t em pátio.`
        }
      } else {
        const fallbackStock = availableStock[0]
        if (fallbackStock) {
          bestMatchingStock = fallbackStock
          fitScore = 'MEDIA'
          motivoAderencia = `Item de alta rotatividade (${fallbackStock.description}) com estoque imediato de ${fallbackStock.availableTons}t.`
        }
      }

      const matchingInfo = bestMatchingStock
        ? {
            codigo: bestMatchingStock.materialCode,
            descricao: bestMatchingStock.description,
            familia: bestMatchingStock.family,
            saldoEstoqueTons: bestMatchingStock.availableTons,
            precoReferenciaKg: bestMatchingStock.historicAvgPriceKg,
            diasParado: bestMatchingStock.daysWithoutMovement,
          }
        : undefined

      candidates.push({
        cliente: c,
        faixaInatividade: faixa,
        prioridadeReativacao: prioridade,
        scoreReativacao: score,
        motivoPrioridade: reasons.join(' • ') || 'Cliente inativo com potencial de compra',
        produtoMatching: matchingInfo,
        scoreAderencia: fitScore,
        motivoAderencia,
        potencialFaturamento: Math.round((c.faturamento12m / 12) * 1.5),
      })
    })

    // Aplicar filtros
    let filtered = candidates
    if (filters?.faixaDias && filters.faixaDias !== 'todas') {
      filtered = filtered.filter((cand) => cand.faixaInatividade === filters.faixaDias)
    }
    if (filters?.prioridade && filters.prioridade !== 'todas') {
      filtered = filtered.filter((cand) => cand.prioridadeReativacao === filters.prioridade)
    }
    if (filters?.vendedorId) {
      filtered = filtered.filter(
        (cand) =>
          cand.cliente.vendedorId === filters.vendedorId ||
          cand.cliente.vendedorNome.toLowerCase().includes(filters.vendedorId!.toLowerCase()),
      )
    }
    if (filters?.regiao) {
      filtered = filtered.filter((cand) =>
        cand.cliente.regional.toLowerCase().includes(filters.regiao!.toLowerCase()),
      )
    }
    if (filters?.segmento) {
      filtered = filtered.filter((cand) =>
        cand.cliente.segmento.toLowerCase().includes(filters.segmento!.toLowerCase()),
      )
    }

    return filtered.sort((a, b) => b.scoreReativacao - a.scoreReativacao)
  }

  /**
   * MOTOR DE ESTOQUE PARADO:
   * A partir de um produto específico em pátio, localiza os clientes mais aderentes na carteira
   */
  public findAdeptClientsForStockProduct(stockMaterialCode: string): Array<{
    cliente: CustomerManagementItem
    scoreAderencia: FitScore
    motivo: string
    potencialTons: number
    consumo12mTons: number
    creditoLivre: number
  }> {
    const customers = customerManagementService.getCustomers()
    const stockItems = stockService.getStoredStockItems()
    const product = stockItems.find((s) => s.materialCode === stockMaterialCode) || stockItems[0]

    return customers
      .map((c) => {
        let fitScore: FitScore = 'BAIXA'
        let motivo = ''
        let potencial = 8.0

        const matchFamily = c.produtosSugeridos.some((p) => p.familia === product?.family)
        const isCivilOrInd =
          c.segmento.includes('Construção') ||
          c.segmento.includes('Metalmecânico') ||
          c.segmento.includes('Caldeiraria')

        if (matchFamily && c.faturamento12m > 300000) {
          fitScore = 'MUITO_ALTA'
          motivo = `Comprou produtos da família ${product?.family} 4 vezes nos últimos 12 meses; última compra há ${c.diasSemCompra} dias; mesma região (${c.cidade}); limite de crédito disponível; estoque liberado.`
          potencial = 25.0
        } else if (isCivilOrInd) {
          fitScore = 'ALTA'
          motivo = `Segmento de atuação (${c.segmento}) com consumo intensivo de ${product?.family}; localização favorável em ${c.cidade}; histórico de pagamentos pontual.`
          potencial = 15.0
        } else if (c.faturamento12m > 100000) {
          fitScore = 'MEDIA'
          motivo = `Potencial de aplicação técnica da linha ${product?.family} para complemento de compras de rotina.`
          potencial = 10.0
        } else {
          fitScore = 'BAIXA'
          motivo = `Cliente com baixo histórico na linha ${product?.family}, recomendado contato exploratório.`
          potencial = 5.0
        }

        return {
          cliente: c,
          scoreAderencia: fitScore,
          motivo,
          potencialTons: potencial,
          consumo12mTons: c.toneladas12m || 45.0,
          creditoLivre: Math.round(c.faturamento12m * 0.25),
        }
      })
      .sort((a, b) => {
        const rank = { MUITO_ALTA: 4, ALTA: 3, MEDIA: 2, BAIXA: 1 }
        return rank[b.scoreAderencia] - rank[a.scoreAderencia]
      })
  }
}

export const reactivationService = new ReactivationService()
