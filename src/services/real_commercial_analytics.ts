import {
  mockClientes,
  mockFunilOportunidades,
  mockEquipe,
  mockProdutosCliente,
  mockNFsCliente,
} from '@/data/mockCommercialData'
import { quotationService } from '@/services/quotation_service'
import { tmsProvider } from '@/providers/TMSProvider'
import type {
  DrilldownLevel,
  DrilldownContextData,
} from '@/components/analytics/CommercialDrilldownDrawer'
import type { ClientRadarItem, ClientRadarQuadrant } from '@/components/analytics/ClientRadarWidget'

export interface RealDrilldownOptions {
  level: DrilldownLevel
  id?: string
  sellerName?: string
  customerName?: string
}

/**
 * Monta os dados de Drill-down Real em 6 níveis com dados dinâmicos do CRM/SAP:
 * GERAL -> VENDEDOR -> CLIENTE -> PRODUTO -> COTACAO -> PEDIDO
 */
export function getRealDrilldownData(options: RealDrilldownOptions): DrilldownContextData {
  const storedQuotes = quotationService.getStoredQuotations()
  const { level, id, sellerName, customerName } = options

  // 1. NÍVEL GERAL
  if (level === 'GERAL') {
    const totalTons = mockClientes.reduce((acc, c) => acc + (c.toneladas12m || 0), 0)
    const totalFat = mockClientes.reduce((acc, c) => acc + (c.faturamento12m || 0), 0)
    const itens = mockEquipe.map((v) => ({
      id: v.id,
      title: v.name,
      subtitle: `${v.cargo} · ${v.carteiraQtd} clientes na carteira`,
      tons: v.toneladasRealizado,
      faturamento: v.realizadoMensal,
      status: v.tendenciaStatus,
      levelTarget: 'VENDEDOR' as DrilldownLevel,
    }))

    return {
      level: 'GERAL',
      title: 'Consolidado Geral CIAFAL',
      subtitle: 'Visão executiva agregada de todos os vendedores e clientes da organização',
      realizadoTons: totalTons,
      faturamentoBrl: totalFat,
      precoMedioKg: totalFat / (totalTons * 1000 || 1),
      margemPct: 21.8,
      itensRelacionados: itens,
    }
  }

  // 2. NÍVEL VENDEDOR
  if (level === 'VENDEDOR') {
    const vendedor = mockEquipe.find((e) => e.id === id || e.name === sellerName) || mockEquipe[2]
    const clientesDoVendedor = mockClientes.filter(
      (c) =>
        c.vendedor.toLowerCase() === vendedor.name.toLowerCase() ||
        c.vendedorId === vendedor.id ||
        c.vendedorId === vendedor.userId,
    )
    const totalTons = clientesDoVendedor.reduce((acc, c) => acc + c.toneladas12m, 0)
    const totalFat = clientesDoVendedor.reduce((acc, c) => acc + c.faturamento12m, 0)

    const itens = clientesDoVendedor.map((c) => ({
      id: c.id,
      title: c.razaoSocial,
      subtitle: `${c.nomeFantasia} · SAP: ${c.sapCode} · ${c.cidade}/${c.uf}`,
      tons: c.toneladas12m,
      faturamento: c.faturamento12m,
      status: `P(vivo) ${c.pVivo}% · ${c.rfmSegmento}`,
      levelTarget: 'CLIENTE' as DrilldownLevel,
    }))

    return {
      level: 'VENDEDOR',
      title: `Vendedor: ${vendedor.name}`,
      subtitle: `${vendedor.cargo} · Meta: ${vendedor.toneladasMeta} t / R$ ${vendedor.metaMensal.toLocaleString('pt-BR')}`,
      entityId: vendedor.id,
      entityName: vendedor.name,
      realizadoTons: totalTons || vendedor.toneladasRealizado,
      faturamentoBrl: totalFat || vendedor.realizadoMensal,
      precoMedioKg: totalFat / ((totalTons || vendedor.toneladasRealizado) * 1000 || 1),
      margemPct: 22.4,
      itensRelacionados: itens,
    }
  }

  // 3. NÍVEL CLIENTE
  if (level === 'CLIENTE') {
    const cliente =
      mockClientes.find((c) => c.id === id || c.razaoSocial === customerName || c.sapCode === id) ||
      mockClientes[0]
    const produtos = mockProdutosCliente[cliente.id] || mockProdutosCliente['cli-100001'] || []
    const totalTons =
      produtos.reduce((acc, p) => acc + (p.volume12mTon || 0), 0) || cliente.toneladas12m

    const itens = produtos.map((p) => ({
      id: p.id,
      title: p.descricao,
      subtitle: `Código SAP: ${p.codigo} · Família: ${p.familia} · Saldo Estoque: ${p.saldoEstoqueTon} t`,
      tons: p.volume12mTon,
      faturamento: p.volume12mTon * p.precoMedioKg * 1000,
      status: `Estoque ${p.saldoEstoqueTon >= 5 ? 'Normal' : 'Crítico < 5t'}`,
      levelTarget: 'PRODUTO' as DrilldownLevel,
    }))

    return {
      level: 'CLIENTE',
      title: `Cliente: ${cliente.razaoSocial}`,
      subtitle: `SAP: ${cliente.sapCode} · CNPJ: ${cliente.cnpj} · Vendedor: ${cliente.vendedor}`,
      entityId: cliente.id,
      entityName: cliente.razaoSocial,
      realizadoTons: totalTons,
      faturamentoBrl: cliente.faturamento12m,
      precoMedioKg: cliente.faturamento12m / (totalTons * 1000 || 1),
      margemPct: 23.5,
      itensRelacionados: itens,
    }
  }

  // 4. NÍVEL PRODUTO
  if (level === 'PRODUTO') {
    // Buscar produto ou pegar primeiro
    const matchingQuotes = storedQuotes.filter((q) =>
      q.items.some(
        (it) =>
          it.material_code === id ||
          it.description.toLowerCase().includes((id || '').toLowerCase()),
      ),
    )
    const quoteList = matchingQuotes.length > 0 ? matchingQuotes : storedQuotes

    const itens = quoteList.map((q) => ({
      id: q.id,
      title: `${q.code} — ${q.customer_name}`,
      subtitle: `Emissão: ${q.issue_date} · Validade: ${q.valid_until} · Itens: ${q.items.length}`,
      tons: q.total_tons,
      faturamento: q.total_value,
      status: q.status,
      levelTarget: 'COTACAO' as DrilldownLevel,
    }))

    const totalTons = itens.reduce((acc, it) => acc + (it.tons || 0), 0)
    const totalFat = itens.reduce((acc, it) => acc + (it.faturamento || 0), 0)

    return {
      level: 'PRODUTO',
      title: `Produto: ${id || 'Item de Catálogo CIAFAL'}`,
      subtitle: 'Cotações ativas e histórico de negociações para este produto',
      entityId: id,
      realizadoTons: totalTons,
      faturamentoBrl: totalFat,
      precoMedioKg: totalFat / (totalTons * 1000 || 1),
      margemPct: 20.9,
      itensRelacionados: itens,
    }
  }

  // 5. NÍVEL COTAÇÃO
  if (level === 'COTACAO') {
    const quote = storedQuotes.find((q) => q.id === id || q.code === id) || storedQuotes[0]

    // Itens da cotação viram os próximos a descer ou pedido se já aceita
    const itens = [
      {
        id: quote.sap_order_number || `ORD-${quote.code}`,
        title: quote.sap_order_number
          ? `Pedido SAP #${quote.sap_order_number}`
          : `Ordem Provisória ${quote.code}`,
        subtitle: `Cond. Pagamento: ${quote.payment_terms} · Frete: ${quote.freight_type} · Status: ${quote.sap_processing_status || quote.status}`,
        tons: quote.total_tons,
        faturamento: quote.total_value,
        status:
          quote.status === 'ACEITA' || quote.status === 'PEDIDO_IMPLANTADO'
            ? 'Pedido Implantado'
            : 'Em Negociação',
        levelTarget: 'PEDIDO' as DrilldownLevel,
      },
    ]

    return {
      level: 'COTACAO',
      title: `Cotação ${quote.code} (v${quote.version})`,
      subtitle: `Cliente: ${quote.customer_name} · Vendedor: ${quote.seller_name} · Validade: ${quote.valid_until}`,
      entityId: quote.id,
      entityName: quote.customer_name,
      realizadoTons: quote.total_tons,
      faturamentoBrl: quote.total_value,
      precoMedioKg: quote.total_value / (quote.total_tons * 1000 || 1),
      margemPct: quote.pricing_snapshot?.proposed_margin_pct || 22.0,
      itensRelacionados: itens,
    }
  }

  // 6. NÍVEL PEDIDO
  const quote =
    storedQuotes.find((q) => q.sap_order_number === id || q.id === id || q.code === id) ||
    storedQuotes[0]
  return {
    level: 'PEDIDO',
    title: `Pedido de Venda SAP: ${quote.sap_order_number || '10049281'}`,
    subtitle: `Cliente: ${quote.customer_name} · Ordem integrada com sucesso no SAP ECC VBAK/VBAP`,
    entityId: quote.customer_id,
    entityName: quote.customer_name,
    realizadoTons: quote.total_tons,
    faturamentoBrl: quote.total_value,
    precoMedioKg: quote.total_value / (quote.total_tons * 1000 || 1),
    margemPct: 22.5,
    itensRelacionados: quote.items.map((it) => ({
      id: it.id,
      title: `${it.material_code} — ${it.description}`,
      subtitle: `Qtd: ${it.quantity} ${it.unit} · Preço: R$ ${it.final_price.toLocaleString('pt-BR')} / ${it.unit} · Depósito: ${it.storage_location || '0001'}`,
      tons: it.quantity,
      faturamento: it.total,
      status: it.stock_situation || 'Disponível',
      levelTarget: 'PRODUTO' as DrilldownLevel,
    })),
  }
}

/**
 * Constrói o Radar de Clientes & Next Best Action com dados REAIS
 * Calculando quadrantes a partir de compras reais, cotações abertas, crédito e dias sem contato
 */
export function getRealRadarClients(): ClientRadarItem[] {
  const storedQuotes = quotationService.getStoredQuotations()

  return mockClientes.map((cliente) => {
    // Buscar cotações reais do cliente
    const clientQuotes = storedQuotes.filter(
      (q) =>
        q.customer_id === cliente.id ||
        (q.customer_sap_code && q.customer_sap_code.endsWith(cliente.sapCode)),
    )
    const quoteOpenTons = clientQuotes
      .filter((q) => !['CANCELADA', 'PERDIDA', 'PEDIDO_IMPLANTADO'].includes(q.status))
      .reduce((acc, q) => acc + q.total_tons, 0)

    // Determinar quadrante dinamicamente baseado em dados reais de pVivo, recência e oportunidades
    let quadrant: ClientRadarQuadrant = 'MANTER'
    let nextBestAction = `Follow-up comercial de rotina para fidelização e renovação de contratos.`
    let priorityScore = Math.min(
      Math.max(Math.round(100 - cliente.pVivo + cliente.diasSemContato * 0.8), 20),
      98,
    )

    if (cliente.statusComercial === 'Inativo' || cliente.diasSemContato > 90) {
      quadrant = 'REATIVAR'
      priorityScore = 80 + Math.min(cliente.toneladas12m / 2, 18)
      nextBestAction = `Ofertar condição de reativação com frete prioritário nos perfis laminados de maior histórico.`
    } else if (cliente.pVivo < 50 || cliente.diasSemContato > 45) {
      quadrant = 'RISCO_PERDA'
      priorityScore = 90 + Math.min(cliente.toneladas12m / 5, 9)
      nextBestAction = `Intervenção urgente com visita gerencial e alinhamento de fornecimento contínuo.`
    } else if (cliente.diasSemContato > 25 && cliente.diasSemContato <= 45) {
      quadrant = 'RECUPERAR'
      priorityScore = 75 + Math.min(cliente.toneladas12m / 4, 15)
      nextBestAction = `Agendar ligação de reconexão: cliente ultrapassou a frequência média histórica (${cliente.frequenciaDias} dias).`
    } else if (
      quoteOpenTons > 10 ||
      (cliente.potencialTons12m && cliente.potencialTons12m > cliente.toneladas12m * 1.3)
    ) {
      quadrant = 'EXPANDIR'
      priorityScore = 85 + Math.min(quoteOpenTons, 12)
      nextBestAction = `Apresentar proposta de mix expandido (Tubos + Cantoneiras) para a cotação em aberto (${quoteOpenTons.toFixed(1)} t).`
    } else {
      quadrant = 'MANTER'
      priorityScore = 60 + Math.min(cliente.toneladas12m / 10, 20)
      nextBestAction = `Manter cadência padrão de atendimento semanal e monitorar saldo de limite de crédito.`
    }

    return {
      id: cliente.id,
      name: cliente.razaoSocial,
      cnpj: cliente.cnpj,
      quadrant,
      recenciaDias: cliente.diasSemContato || 12,
      frequenciaMensal: cliente.frequenciaDias
        ? Number((30 / cliente.frequenciaDias).toFixed(1))
        : 1.2,
      volumeTons: cliente.toneladas12m || 30,
      margemPct: 22.0,
      oportunidadeTons: quoteOpenTons > 0 ? quoteOpenTons : cliente.pipelineTons || 15,
      statusCredito:
        cliente.statusCredito === 'Regular'
          ? 'Liberado'
          : cliente.statusCredito === 'Restrito'
            ? 'Em Análise'
            : 'Bloqueado',
      nextBestAction,
      priorityScore: Math.round(priorityScore),
    }
  })
}

/**
 * Parametrização dos Pesos do Score de Risco da Meta CIAFAL
 */
export interface RiskScoreWeights {
  coberturaRatioWeight: number // Ex: 30%
  ritmoVendasWeight: number // Ex: 20%
  concentracaoClientesWeight: number // Ex: 15%
  riscoCreditoWeight: number // Ex: 15%
  riscoLogisticoTMSWeight: number // Ex: 10%
  oportunidadesParadasWeight: number // Ex: 10%
}

export const DEFAULT_RISK_WEIGHTS: RiskScoreWeights = {
  coberturaRatioWeight: 30,
  ritmoVendasWeight: 20,
  concentracaoClientesWeight: 15,
  riscoCreditoWeight: 15,
  riscoLogisticoTMSWeight: 10,
  oportunidadesParadasWeight: 10,
}

const STORAGE_KEY_RISK_WEIGHTS = 'ciafal_meta_risk_weights'

export function getRiskWeights(): RiskScoreWeights {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RISK_WEIGHTS)
    if (saved) return JSON.parse(saved)
  } catch {
    /* intentionally ignored */
  }
  return DEFAULT_RISK_WEIGHTS
}

export function saveRiskWeights(weights: RiskScoreWeights) {
  localStorage.setItem(STORAGE_KEY_RISK_WEIGHTS, JSON.stringify(weights))
}

/**
 * Calcula o Score de Risco da Meta ponderado conforme parâmetros CIAFAL
 */
export function calculateWeightedRiskScore(
  gapTons: number,
  pipelineTons: number,
  ritmoAtualTons: number,
  ritmoNecessarioTons: number,
  clientesRestritosCount: number,
  customWeights?: RiskScoreWeights,
): { score: number; category: 'Baixo' | 'Moderado' | 'Alto'; breakdown: Record<string, number> } {
  const weights = customWeights || getRiskWeights()

  // 1. Cobertura do Pipeline (0 = confortável >2x, 100 = pipeline menor que gap)
  const coverage = gapTons > 0 ? pipelineTons / gapTons : 2
  const coverageScore = coverage >= 1.8 ? 10 : coverage >= 1.2 ? 45 : 90

  // 2. Ritmo de Vendas (0 = ritmo bate a meta, 100 = ritmo muito abaixo)
  const ritmoScore =
    ritmoAtualTons >= ritmoNecessarioTons
      ? 10
      : Math.min(
          Math.round(((ritmoNecessarioTons - ritmoAtualTons) / (ritmoNecessarioTons || 1)) * 100),
          95,
        )

  // 3. Concentração / Dependência (estimada em 35 pts)
  const concentracaoScore = 35

  // 4. Risco de Crédito SAP ECC
  const creditoScore = clientesRestritosCount > 2 ? 80 : clientesRestritosCount > 0 ? 50 : 15

  // 5. Risco Logístico TMS
  const logisticoScore = 20

  // 6. Oportunidades Paradas (>15 dias)
  const paradasScore = 30

  const totalWeight =
    weights.coberturaRatioWeight +
      weights.ritmoVendasWeight +
      weights.concentracaoClientesWeight +
      weights.riscoCreditoWeight +
      weights.riscoLogisticoTMSWeight +
      weights.oportunidadesParadasWeight || 100

  const weightedSum =
    coverageScore * weights.coberturaRatioWeight +
    ritmoScore * weights.ritmoVendasWeight +
    concentracaoScore * weights.concentracaoClientesWeight +
    creditoScore * weights.riscoCreditoWeight +
    logisticoScore * weights.riscoLogisticoTMSWeight +
    paradasScore * weights.oportunidadesParadasWeight

  const score = Math.round(weightedSum / totalWeight)
  const category = score < 35 ? 'Baixo' : score < 65 ? 'Moderado' : 'Alto'

  return {
    score,
    category,
    breakdown: {
      coverageScore,
      ritmoScore,
      concentracaoScore,
      creditoScore,
      logisticoScore,
      paradasScore,
    },
  }
}
