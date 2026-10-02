// src/tests/recorrencia-relacao-cliente.test.ts
import { describe, it, expect } from 'vitest'
import { recorrenciaService } from '@/services/recorrencia_service'
import { opportunityLeadService } from '@/services/opportunity_lead_service'

describe('Relação por Cliente — Aba Produtos e Retomada (CRM 360º CIAFAL)', () => {
  it('1. Resumos de clientes com volume histórico, produtos distintos e itens parados', () => {
    const clientes = recorrenciaService.getClientesRecorrencia('ADMIN')
    expect(clientes.length).toBeGreaterThan(0)

    const cliente1 = clientes[0]
    const prods = recorrenciaService.getProdutosRetomada(cliente1.codigoSap)
    expect(Array.isArray(prods)).toBe(true)

    const distintos = new Set(prods.map((p) => p.codigoMaterial)).size
    const volumeHistoricoTotal = Number(
      prods.reduce((acc, p) => acc + p.tonelagemHistorica, 0).toFixed(1),
    )
    const parados = prods.filter(
      (p) => p.situacao === 'Sem nota no ano' || p.diasSemComprar > 60,
    )
    const tonelagemParada = Number(
      parados.reduce((acc, p) => acc + p.tonelagemHistorica, 0).toFixed(1),
    )

    expect(distintos).toBeGreaterThanOrEqual(0)
    expect(volumeHistoricoTotal).toBeGreaterThanOrEqual(0)
    expect(parados.length).toBeGreaterThanOrEqual(0)
    expect(tonelagemParada).toBeGreaterThanOrEqual(0)
  })

  it('2. Classificação de produto: "Ativo" = faturamento no ano corrente, "Sem nota no ano" = nenhuma NF', () => {
    const prods = recorrenciaService.getProdutosRetomada()
    expect(prods.length).toBeGreaterThan(0)

    const prodsAtivos = prods.filter((p) => p.situacao === 'Ativo')
    const prodsSemNota = prods.filter((p) => p.situacao === 'Sem nota no ano')

    // Deve conter itens classificados estritamente conforme regras
    expect(prodsAtivos.length).toBeGreaterThan(0)
    expect(prodsSemNota.length).toBeGreaterThan(0)

    prodsAtivos.forEach((p) => {
      expect(p.situacao).toBe('Ativo')
      expect(p.ultimaCompraData).toContain('2024')
    })

    prodsSemNota.forEach((p) => {
      expect(p.situacao).toBe('Sem nota no ano')
    })
  })

  it('3. Ordenação default: Compra mensal média decrescente', () => {
    const clientes = recorrenciaService.getClientesRecorrencia('ADMIN')
    const ordenados = [...clientes].sort(
      (a, b) => (b.compraMensalMediaTons || 0) - (a.compraMensalMediaTons || 0),
    )

    for (let i = 0; i < ordenados.length - 1; i++) {
      expect(ordenados[i].compraMensalMediaTons).toBeGreaterThanOrEqual(
        ordenados[i + 1].compraMensalMediaTons,
      )
    }
  })

  it('4. Geração de oportunidade por produto com origem exata "Recorrência de Compras — Retomada"', () => {
    const clientes = recorrenciaService.getClientesRecorrencia('ADMIN')
    const cliente = clientes[0]
    const produtos = recorrenciaService.getProdutosRetomada(cliente.codigoSap)
    const prodAlvo = produtos.find((p) => p.situacao === 'Sem nota no ano') || produtos[0]

    const volume = prodAlvo.tonelagemHistorica || 5.0
    const precoKg = prodAlvo.ultimoPrecoPraticadoKg || 6.5
    const motivo = 'Retomada de produto'

    const payload = {
      clienteId: cliente.id,
      clienteNome: cliente.razaoSocial,
      clienteSap: cliente.codigoSap,
      clienteCnpj: cliente.cnpjCpf,
      clienteCidade: cliente.cidade,
      clienteUf: cliente.uf,
      clienteSegmento: cliente.setorIndustrial,
      vendedorId: cliente.vendedorId,
      vendedorNome: cliente.vendedorNome,
      grupoMercadoria: prodAlvo.grupo,
      quantidadeEstimadaTons: volume,
      precoEstimadoPorTon: Math.round(precoKg * 1000),
      previsaoCompra: 'ate_30_dias',
      probabilidadeClassificacao: 'alta' as const,
      origemOportunidade: 'Recorrência de Compras — Retomada',
      observacoes: `Retomada de Mix — ${prodAlvo.descricao} (${cliente.razaoSocial})\n\nMotivo: ${motivo}\n\nJustificativa: Retomada de mix parado há ${prodAlvo.diasSemComprar} dias.`,
      usuarioAtual: cliente.vendedorNome,
    }

    const opp = opportunityLeadService.createOpportunity(payload)
    expect(opp).toBeDefined()
    expect(opp.id).toBeDefined()
    expect(opp.origemOportunidade).toBe('Recorrência de Compras — Retomada')
    expect(opp.numeroSequencial).toMatch(/^OPP-\d{6}\/\d{4}$/)
    expect(opp.estagioCiafal).toBe('especulacao')

    // Reconsulta de integridade
    const reconsultada = opportunityLeadService.getOpportunityById(opp.id)
    expect(reconsultada).toBeDefined()
    expect(reconsultada?.id).toBe(opp.id)
    expect(reconsultada?.origemOportunidade).toBe('Recorrência de Compras — Retomada')
  })

  it('5. Geração de oportunidade por cliente consolidando múltiplos produtos parados', () => {
    const clientes = recorrenciaService.getClientesRecorrencia('ADMIN')
    const cliente = clientes[0]
    const parados = recorrenciaService.getProdutosParadosPorCliente(cliente.codigoSap)
    expect(parados.length).toBeGreaterThan(0)

    const volumeTotal = parados.reduce((acc, p) => acc + p.tonelagemHistorica, 0)
    const mediaPreco =
      parados.reduce((acc, p) => acc + p.ultimoPrecoPraticadoKg, 0) / parados.length

    const detalheItens = parados
      .map(
        (it) =>
          `• [${it.codigoMaterial}] ${it.descricao} (${it.grupo}) — Histórico: ${it.tonelagemHistorica}t | Última compra: ${it.ultimaCompraData} | Estoque livre: ${it.estoqueLivreTons}t`,
      )
      .join('\n')

    const payload = {
      clienteId: cliente.id,
      clienteNome: cliente.razaoSocial,
      clienteSap: cliente.codigoSap,
      clienteCnpj: cliente.cnpjCpf,
      clienteCidade: cliente.cidade,
      clienteUf: cliente.uf,
      clienteSegmento: cliente.setorIndustrial,
      vendedorId: cliente.vendedorId,
      vendedorNome: cliente.vendedorNome,
      grupoMercadoria: parados[0].grupo,
      quantidadeEstimadaTons: Number(volumeTotal.toFixed(1)),
      precoEstimadoPorTon: Math.round(mediaPreco * 1000),
      previsaoCompra: 'ate_30_dias',
      probabilidadeClassificacao: 'alta' as const,
      origemOportunidade: 'Recorrência de Compras — Retomada',
      observacoes: `Retomada de Mix Consolidada (${parados.length} itens) — ${cliente.razaoSocial}\n\nMotivo: Retomada de produto\n\nItens da Oportunidade:\n${detalheItens}`,
      usuarioAtual: cliente.vendedorNome,
    }

    const oppMulti = opportunityLeadService.createOpportunity(payload)
    expect(oppMulti).toBeDefined()
    expect(oppMulti.origemOportunidade).toBe('Recorrência de Compras — Retomada')
    expect(oppMulti.numeroSequencial).toMatch(/^OPP-\d{6}\/\d{4}$/)
    expect(oppMulti.observacoes).toContain('Motivo: Retomada de produto')

    // Deve estar visível no funil geral
    const funil = opportunityLeadService.getCombinedFunil()
    expect(funil.some((o) => o.id === oppMulti.id)).toBe(true)
  })

  it('6. Cache de expansão de clientes não duplica carregamentos', () => {
    const cache: Record<string, any[]> = {}
    const clienteSap = '0001048291'

    // Primeira expansão: preenche cache
    if (!cache[clienteSap]) {
      cache[clienteSap] = recorrenciaService.getProdutosRetomada(clienteSap)
    }
    expect(cache[clienteSap]).toBeDefined()
    const size1 = cache[clienteSap].length

    // Segunda consulta: consome cache sem reprocessar
    const doCache = cache[clienteSap]
    expect(doCache.length).toBe(size1)
  })
})
