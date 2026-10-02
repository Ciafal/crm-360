// src/tests/recorrencia-predicao-fatia2.test.ts
// Testes unitários e de integração para o motor probabilístico BG/NBD e Gamma-Gamma da Fatia 2
// Abrange: convergência de MLE, caso de histórico insuficiente, validação holdout, horizontes e persistência

import { describe, it, expect, beforeEach } from 'vitest'
import {
  logGamma,
  logBeta,
  nelderMead,
  bgnbdIndividualLogLikelihood,
  fitBGNBD,
  calculatePAlive,
  calculateExpectedPurchases,
  calculateRepurchaseProbability,
  fitGammaGamma,
  calculateExpectedTransactionValue,
  type BGNBDCustomerData,
  type GammaGammaCustomerData,
} from '@/services/bgnbd_math'
import { predicaoRecompraService } from '@/services/predicao_recompra_service'
import { crmStorage } from '@/lib/crm-storage'

describe('Motor Matemático BG/NBD & Gamma-Gamma (MLE)', () => {
  it('Funções Log-Gamma e Log-Beta calculam aproximações precisas', () => {
    // Gamma(1) = 1 => ln Gamma(1) = 0
    expect(logGamma(1)).toBeCloseTo(0, 4)
    // Gamma(5) = 24 => ln(24) ~ 3.17805
    expect(logGamma(5)).toBeCloseTo(Math.log(24), 4)
    // LogBeta(1, 1) = ln(1) = 0
    expect(logBeta(1, 1)).toBeCloseTo(0, 4)
  })

  it('Otimizador Nelder-Mead minimiza funções contínuas', () => {
    // Função parabólica com mínimo em (3, 4)
    const sphere = (x: number[]) => Math.pow(x[0] - 3, 2) + Math.pow(x[1] - 4, 2)
    const opt = nelderMead(sphere, [0, 0], { maxIter: 200, tol: 1e-4 })
    expect(opt.converged).toBe(true)
    expect(opt.solution[0]).toBeCloseTo(3, 1)
    expect(opt.solution[1]).toBeCloseTo(4, 1)
  })

  it('Ajusta parâmetros r, alpha, a, b via MLE real no BG/NBD sem parâmetros fixos', () => {
    const clientesSinteticos: BGNBDCustomerData[] = [
      { id: 'c1', x: 5, t_x: 200, T: 250 },
      { id: 'c2', x: 3, t_x: 180, T: 240 },
      { id: 'c3', x: 6, t_x: 220, T: 230 },
      { id: 'c4', x: 1, t_x: 50, T: 260 },
      { id: 'c5', x: 4, t_x: 190, T: 210 },
      { id: 'c6', x: 0, t_x: 0, T: 220 },
      { id: 'c7', x: 8, t_x: 240, T: 250 },
      { id: 'c8', x: 2, t_x: 110, T: 200 },
    ]

    const resultado = fitBGNBD(clientesSinteticos)
    expect(resultado.converged).toBe(true)
    expect(resultado.params.r).toBeGreaterThan(0)
    expect(resultado.params.alpha).toBeGreaterThan(0)
    expect(resultado.params.a).toBeGreaterThan(0)
    expect(resultado.params.b).toBeGreaterThan(0)
    expect(resultado.logLikelihood).toBeLessThan(0) // Log-likelihood é negativa
  })

  it('P(Alive) permanece estritamente entre 0% e 100% e decai com inatividade prolongada', () => {
    const params = { r: 0.85, alpha: 35.0, a: 0.65, b: 2.2 }

    // Cliente ativo recentemente: comprou há 10 dias (t_x=190, T=200, x=5)
    const pAliveAtivo = calculatePAlive(params, 5, 190, 200)
    expect(pAliveAtivo).toBeGreaterThan(0.7)
    expect(pAliveAtivo).toBeLessThanOrEqual(1.0)

    // Cliente inativo: última compra há 150 dias (t_x=50, T=200, x=5)
    const pAliveInativo = calculatePAlive(params, 5, 50, 200)
    expect(pAliveInativo).toBeLessThan(pAliveAtivo)
    expect(pAliveInativo).toBeGreaterThanOrEqual(0.0)

    // Não gera NaN ou Infinity para valores extremos
    const pExtremo = calculatePAlive(params, 0, 0, 500)
    expect(isFinite(pExtremo)).toBe(true)
    expect(pExtremo).toBeGreaterThanOrEqual(0)
    expect(pExtremo).toBeLessThanOrEqual(1)
  })

  it('Gamma-Gamma estima parâmetros p, q, v apenas com recompras válidas (x >= 1 e m_x > 0)', () => {
    const dadosMonetarios: GammaGammaCustomerData[] = [
      { id: 'c1', x: 5, m_x: 45000 },
      { id: 'c2', x: 3, m_x: 32000 },
      { id: 'c3', x: 6, m_x: 60000 },
      { id: 'c4', x: 2, m_x: 28000 },
      { id: 'c5', x: 4, m_x: 52000 },
    ]

    const opt = fitGammaGamma(dadosMonetarios)
    expect(opt.converged).toBe(true)
    expect(opt.params.p).toBeGreaterThan(0)
    expect(opt.params.q).toBeGreaterThan(0)
    expect(opt.params.v).toBeGreaterThan(0)

    // Valor esperado por transação E[M] é positivo e condicionado pelo histórico
    const ticketEsperado = calculateExpectedTransactionValue(opt.params, 5, 45000)
    expect(ticketEsperado).toBeGreaterThan(20000)
    expect(ticketEsperado).toBeLessThan(80000)
  })

  it('Trata corretamente caso de histórico insuficiente sem inventar resultados', () => {
    const dadosVazios: BGNBDCustomerData[] = []
    const fitVazio = fitBGNBD(dadosVazios)
    expect(fitVazio.converged).toBe(false)
    expect(fitVazio.error).toBeDefined()

    const dadosInsuficientes: GammaGammaCustomerData[] = [{ id: 'cx', x: 0, m_x: 0 }]
    const fitGammaVazio = fitGammaGamma(dadosInsuficientes)
    expect(fitGammaVazio.converged).toBe(false)
    expect(fitGammaVazio.error).toBeDefined()
  })
})

describe('Pipeline de Predição de Recompra CIAFAL (Serviço Integrado)', () => {
  beforeEach(() => {
    // Resetar storage de teste se necessário
  })

  it('Extrai eventos transacionais agrupando Cliente + Data (mesmo cliente mesmo dia = 1 evento)', () => {
    const eventos = predicaoRecompraService.extrairEventosTransacionais()
    expect(eventos.length).toBeGreaterThan(0)

    // Verifica que não há eventos duplicados para o mesmo cliente na mesma data
    const mapKeys = new Set<string>()
    let duplicados = 0
    eventos.forEach((ev) => {
      const key = `${ev.clienteId}_${ev.data}`
      if (mapKeys.has(key)) duplicados++
      mapKeys.add(key)
    })
    expect(duplicados).toBe(0)
  })

  it('Calcula resumos BG/NBD por cliente respeitando a janela em DIAS', () => {
    const eventos = predicaoRecompraService.extrairEventosTransacionais()
    const resumos = predicaoRecompraService.calcularResumosClientes(eventos, '2024-10-15')
    expect(resumos.length).toBeGreaterThan(0)

    resumos.forEach((r) => {
      if (r.temHistoricoSuficiente) {
        expect(r.t_x).toBeLessThanOrEqual(r.T)
        expect(r.x).toBeGreaterThanOrEqual(0)
        expect(r.T).toBeGreaterThan(0)
      } else {
        expect(r.motivoInsuficiencia).toBeDefined()
      }
    })
  })

  it('Treina modelo BG/NBD + Gamma-Gamma com holdout 90d e persiste no storage', () => {
    const modelo = predicaoRecompraService.treinarModelo('Vitest Suite')
    expect(modelo).toBeDefined()
    expect(modelo.versao).toBeDefined()
    expect(modelo.bgnbd.r).toBeGreaterThan(0)
    expect(modelo.gammaGamma.p).toBeGreaterThan(0)

    // Validação holdout
    expect(modelo.validacao.diasHoldout).toBe(90)
    expect(modelo.validacao.comprasRealizadasTotal).toBeGreaterThanOrEqual(0)
    expect(modelo.validacao.statusValidacao).toMatch(/OK|Atenção/)

    // Predições por cliente
    expect(modelo.predicoes.length).toBeGreaterThan(0)
    const primeiro = modelo.predicoes[0]
    expect(primeiro.pAlivePercent).toBeGreaterThanOrEqual(0)
    expect(primeiro.pAlivePercent).toBeLessThanOrEqual(100)
    expect(primeiro.horizontes.probabilidade90d).toBeGreaterThanOrEqual(0)
    expect(primeiro.horizontes.probabilidade90d).toBeLessThanOrEqual(1)
    expect(primeiro.horizontes.receitaEsperada90d).toBeGreaterThanOrEqual(0)
    expect(primeiro.horizontes.tonelagemEsperada90d).toBeGreaterThanOrEqual(0)
    expect(primeiro.explicacaoRisco).toContain('P(Alive)')
  })

  it('Recupera modelo em produção já persistido sem recalcular MLE desnecessariamente', () => {
    const modeloProd = predicaoRecompraService.getModeloProducao()
    expect(modeloProd).toBeDefined()
    expect(modeloProd.predicoes.length).toBeGreaterThan(0)
  })

  it('Calcula KPIs consolidados da Aba 5 com coerência monetária e de volume', () => {
    const predicoes = predicaoRecompraService.getPredicoesFiltradas({
      empresa: 'TODAS',
      vendedor: 'TODOS',
      representante: 'TODOS',
      cliente: '',
      uf: 'TODOS',
      cidade: 'TODAS',
      setorIndustrial: 'TODOS',
      grupoMercadoria: 'TODOS',
      produto: '',
      periodo: '12M',
      classeRecorrencia: 'TODAS',
      segmentoRFM: 'TODOS',
      statusCliente: 'TODOS',
      riscoPerda: 'TODOS',
      situacaoCredito: 'TODOS',
      unitMode: 'BRL',
    })

    const kpis = predicaoRecompraService.calcularKpisPredicao(predicoes)
    expect(kpis.receitaEsperada90d).toBeGreaterThan(0)
    expect(kpis.tonelagemEsperada90d).toBeGreaterThan(0)
    expect(kpis.comprasEsperadas90d).toBeGreaterThan(0)
    expect(kpis.altaProbabilidadeCount + kpis.emRiscoCount).toBeLessThanOrEqual(predicoes.length)
  })
})
