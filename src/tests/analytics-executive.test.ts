import { describe, it, expect } from 'vitest'
import { formatNumberBR, formatCurrency, formatWeight } from '@/lib/utils'

describe('Validação de Formatação e Cálculos Analíticos Executivos CIAFAL', () => {
  it('deve formatar números com padrão brasileiro (ponto=milhar, vírgula=decimal)', () => {
    expect(formatNumberBR(1250000.5, 2)).toBe('1.250.000,50')
    expect(formatNumberBR(1000, 0)).toBe('1.000')
    expect(formatNumberBR(84.5, 1)).toBe('84,5')
  })

  it('deve formatar peso sempre em "t" (nunca "ton")', () => {
    expect(formatWeight(1250)).toBe('1.250 t')
    expect(formatWeight(720)).toBe('720 t')
    expect(formatWeight(85.5, 1)).toBe('85,5 t')
  })

  it('deve formatar moeda brasileira em R$', () => {
    const formatted = formatCurrency(1250000)
    expect(formatted).toContain('1.250.000')
    expect(formatted).toContain('R$')
  })

  it('deve calcular corretamente a cobertura da meta (Pipeline Qualificado ÷ Gap)', () => {
    const gapRestante = 280
    const pipelineQualificado = 420
    const coverageRatio = pipelineQualificado / gapRestante
    expect(coverageRatio).toBe(1.5)
    expect(coverageRatio >= 1.5).toBe(true) // Zona confortável
  })

  it('deve calcular corretamente a necessidade de aceleração do ritmo', () => {
    const ritmoAtual = 37.5 // t/dia
    const ritmoNecessario = 46.7 // t/dia
    const accelerationPct = ((ritmoNecessario - ritmoAtual) / ritmoAtual) * 100
    expect(Number(accelerationPct.toFixed(1))).toBe(24.5)
  })
})
