import { describe, it, expect } from 'vitest'
import { mockEquipe, mockClientes } from '../data/mockCommercialData'
import { formatNumberBR, formatWeight, formatCurrency, formatPace } from '../lib/utils'
import { LocalSellerPerformanceAnalysisAgent } from '../providers/LocalAIAdapter'
import { SAPECCProvider } from '../providers/ERPProvider'

describe('CRM 360º CIAFAL — Validação Corretiva & Incremental', () => {
  it('1. Garante que SAP ECC é o backoffice oficial', async () => {
    const erp = new SAPECCProvider()
    expect(erp.name).toContain('SAP ECC')
    expect(erp.name).not.toContain('HANA')
    expect(erp.name).not.toContain('S/4HANA')
  })

  it('2. Garante padronização ABNT/SI para unidades de massa (t, t/dia, R$)', () => {
    expect(formatWeight(305)).toBe('305,0 t')
    expect(formatWeight(305, 0)).toBe('305 t')
    expect(formatWeight(21.8)).toBe('21,8 t')
    expect(formatPace(21.8, 't/dia')).toBe('21,8 t/dia')
    expect(formatPace(133928, 'R$/dia')).toContain('mil/dia')
  })

  it('3. Garante formatação numérica brasileira: ponto para milhar e vírgula para decimal', () => {
    expect(formatNumberBR(2500, 0)).toBe('2.500')
    expect(formatNumberBR(21.8, 1)).toBe('21,8')
    expect(formatNumberBR(1875000, 0)).toBe('1.875.000')
  })

  it('4. Valida novo indicador de Clientes Ativos no Mês por vendedor', () => {
    const carlos = mockEquipe.find((m) => m.name.includes('Carlos Mendonça'))
    expect(carlos).toBeDefined()
    expect(carlos?.carteiraQtd).toBe(38)
    expect(carlos?.clientesAtivosMes).toBe(21)
    expect(carlos?.taxaCarteiraAtivaPercent).toBeCloseTo(55.3, 1)

    // Total equipe
    const totalCarteira = mockEquipe.reduce((acc, m) => acc + m.carteiraQtd, 0)
    const totalAtivos = mockEquipe.reduce((acc, m) => acc + m.clientesAtivosMes, 0)
    expect(totalCarteira).toBeGreaterThanOrEqual(120)
    expect(totalAtivos).toBeGreaterThanOrEqual(50)
  })

  it('5. Valida SellerPerformanceAnalysisAgent com análise baseada em evidências numéricas', async () => {
    const agent = new LocalSellerPerformanceAnalysisAgent()
    const analysis = await agent.analyzeSellerPerformance('eq-vend1')

    expect(analysis.sellerName).toContain('Carlos Mendonça')
    expect(analysis.resumoExecutivo).toContain('77,5% da meta')
    expect(analysis.resumoExecutivo).toContain('t/dia')
    expect(analysis.resumoExecutivo).toContain('carteira')
    expect(analysis.pontosPositivos.length).toBeGreaterThanOrEqual(1)
    expect(analysis.pontosAtencao.length).toBeGreaterThanOrEqual(1)
    expect(analysis.acoesRecomendadas.length).toBeGreaterThanOrEqual(2)

    // Evidências não devem ser adjetivos vazios
    analysis.pontosPositivos.forEach((p) => {
      expect(p.evidenciaNumerica.length).toBeGreaterThan(5)
    })
    analysis.pontosAtencao.forEach((a) => {
      expect(a.evidenciaNumerica.length).toBeGreaterThan(5)
      expect(a.causaProvavel.length).toBeGreaterThan(5)
    })
  })
})
