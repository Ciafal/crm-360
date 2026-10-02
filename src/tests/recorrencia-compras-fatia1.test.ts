// src/tests/recorrencia-compras-fatia1.test.ts
import { describe, it, expect } from 'vitest'
import { recorrenciaService } from '@/services/recorrencia_service'
import { opportunityLeadService } from '@/services/opportunity_lead_service'

describe('Módulo Recorrência de Compras — Fatia 1 (CRM 360º CIAFAL)', () => {
  it('1. Cálculo de classe de recorrência respeita thresholds configurados', () => {
    const config = recorrenciaService.getConfig()
    expect(config.thresholds.mensal).toBe(55)
    expect(config.thresholds.bimestral).toBe(30)
    expect(config.thresholds.trimestral).toBe(15)

    // Mensal: >= 55%
    expect(recorrenciaService.calcularClasseRecorrencia(60)).toBe('Mensal')
    expect(recorrenciaService.calcularClasseRecorrencia(55)).toBe('Mensal')

    // Bimestral: >= 30% e < 55%
    expect(recorrenciaService.calcularClasseRecorrencia(54.9)).toBe('Bimestral')
    expect(recorrenciaService.calcularClasseRecorrencia(30)).toBe('Bimestral')

    // Trimestral: >= 15% e < 30%
    expect(recorrenciaService.calcularClasseRecorrencia(29.9)).toBe('Trimestral')
    expect(recorrenciaService.calcularClasseRecorrencia(15)).toBe('Trimestral')

    // Esporádico: < 15%
    expect(recorrenciaService.calcularClasseRecorrencia(14.9)).toBe('Esporádico')
    expect(recorrenciaService.calcularClasseRecorrencia(0)).toBe('Esporádico')
  })

  it('2. Auditoria e persistência de alteração de parâmetros/thresholds', () => {
    const updated = recorrenciaService.updateConfig(
      {
        thresholds: {
          mensal: 60,
          bimestral: 35,
          trimestral: 20,
        },
      },
      'Carlos Alberto (Diretoria CIAFAL)'
    )

    expect(updated.thresholds.mensal).toBe(60)
    expect(updated.historicoAlteracoes.length).toBeGreaterThan(0)
    const lastAudit = updated.historicoAlteracoes[updated.historicoAlteracoes.length - 1]
    expect(lastAudit.usuario).toBe('Carlos Alberto (Diretoria CIAFAL)')

    // Restaurar configuração padrão
    recorrenciaService.updateConfig({
      thresholds: {
        mensal: 55,
        bimestral: 30,
        trimestral: 15,
      },
    })
  })

  it('3. Cálculo de RFM e Segmentos reais de carteira', () => {
    // Campeões: R>=4, F>=4, M>=4
    expect(recorrenciaService.calcularSegmentoRFM(5, 5, 5)).toBe('Campeões')
    expect(recorrenciaService.calcularSegmentoRFM(4, 4, 4)).toBe('Campeões')

    // Clientes Leais: R>=3, F>=3, M>=3
    expect(recorrenciaService.calcularSegmentoRFM(3, 3, 3)).toBe('Clientes Leais')

    // Novos Clientes: R>=4, F<=2
    expect(recorrenciaService.calcularSegmentoRFM(5, 1, 3)).toBe('Novos Clientes')

    // Perdidos: R baixo, F baixo
    expect(recorrenciaService.calcularSegmentoRFM(1, 1, 1)).toBe('Perdidos')
  })

  it('4. RBAC estrito por perfil (Vendedor vê apenas a própria carteira, Admin vê todas)', () => {
    const clientesAdmin = recorrenciaService.getClientesRecorrencia('ADMIN', 'qas-admin_teste')
    expect(clientesAdmin.length).toBeGreaterThan(0)

    const clientesVendedor = recorrenciaService.getClientesRecorrencia('VENDEDOR', 'qas-vendedor_teste')
    expect(clientesVendedor.length).toBeGreaterThan(0)
    expect(clientesVendedor.length).toBeLessThanOrEqual(clientesAdmin.length)

    // Todos os clientes do vendedor devem ter o ID dele
    clientesVendedor.forEach((c) => {
      expect(c.vendedorId).toBe('qas-vendedor_teste')
    })
  })

  it('5. Regra de Parada Abrupta, Queda Forte e Alerta Comercial como Hipótese', () => {
    const clientes = recorrenciaService.getClientesRecorrencia('ADMIN')
    const comParada = clientes.filter((c) => c.tipoAlerta === 'Parada Abrupta')

    comParada.forEach((c) => {
      // Obrigatório conter hipótese e nunca afirmação de causa sem confirmação SAP
      expect(c.alertaDescricao).toContain('verificar situação de crédito')
    })
  })

  it('6. Cruzamento Crédito SAP × Recorrência e tratamento de "Sem informação SAP"', () => {
    const clientes = recorrenciaService.getClientesRecorrencia('ADMIN')

    clientes.forEach((c) => {
      expect(c.credito).toBeDefined()
      if (!c.credito.hasSapData) {
        expect(c.credito.statusCredito).toBe('Sem informação SAP')
        expect(c.credito.limiteAprovado).toBeNull()
      } else {
        expect(['Liberado', 'Em Análise', 'Bloqueado']).toContain(c.credito.statusCredito)
      }

      // Cruzamento
      expect(['Prioridade Financeira', 'Prioridade Comercial', 'Risco de Restrição', 'Normal']).toContain(
        c.cruzamentoCredito
      )
    })
  })

  it('7. Motor de Retomada: Produtos parados ordenados pelas 5 regras de prioridade', () => {
    const clientes = recorrenciaService.getClientesRecorrencia('ADMIN')
    const clienteTeste = clientes[0]

    const produtosParados = recorrenciaService.getProdutosParadosPorCliente(clienteTeste.codigoSap)
    expect(Array.isArray(produtosParados)).toBe(true)

    if (produtosParados.length > 1) {
      // Verifica se a ordenação respeita tonelagem ou faturamento
      expect(produtosParados[0].tonelagemHistorica).toBeGreaterThanOrEqual(
        produtosParados[1].tonelagemHistorica
      )
    }
  })

  it('8. Geração de Oportunidade de Retomada com numeração OPP-XXXXXX/AAAA e presença no Funil', () => {
    const clientes = recorrenciaService.getClientesRecorrencia('ADMIN')
    const cliente = clientes[0]

    const payload = {
      clienteId: cliente.id,
      clienteNome: cliente.razaoSocial,
      clienteSap: cliente.codigoSap,
      clienteCnpj: cliente.cnpjCpf,
      clienteCidade: cliente.cidade,
      clienteUf: cliente.uf,
      vendedorId: cliente.vendedorId,
      vendedorNome: cliente.vendedorNome,
      grupoMercadoria: 'Tubos e Perfis',
      quantidadeEstimadaTons: 10.5,
      precoEstimadoPorTon: 7140,
      previsaoCompra: 'ate_30_dias',
      probabilidadeClassificacao: 'alta' as const,
      origemOportunidade: 'Motor de Retomada CIAFAL',
      observacoes: 'Oportunidade gerada pelo módulo de recorrência',
      usuarioAtual: cliente.vendedorNome,
    }

    const created = opportunityLeadService.createOpportunity(payload)
    expect(created).toBeDefined()
    expect(created.id).toBeDefined()
    expect(created.numeroSequencial).toMatch(/^OPP-\d{6}\/\d{4}$/)

    // Reconsulta direta confirmando persistência e integridade
    const reconsultada = opportunityLeadService.getOpportunityById(created.id)
    expect(reconsultada).toBeDefined()
    expect(reconsultada?.clienteNome).toBe(cliente.razaoSocial)
    expect(reconsultada?.toneladas).toBe(10.5)

    // Confirmar presença na listagem de oportunidades do CRM
    const allOpps = opportunityLeadService.getCombinedFunil()
    const existeNoFunil = allOpps.some((o) => o.id === created.id)
    expect(existeNoFunil).toBe(true)
  })

  it('9. Filas de Ações Comerciais com 4 prioridades por sinais', () => {
    const clientes = recorrenciaService.getClientesRecorrencia('ADMIN')
    const acoes = recorrenciaService.getFilasAcoesComerciais(clientes)

    expect(Array.isArray(acoes)).toBe(true)
    expect(acoes.length).toBeGreaterThan(0)
    acoes.forEach((a) => {
      expect(['Prioridade 1', 'Prioridade 2', 'Prioridade 3', 'Prioridade 4']).toContain(a.prioridade)
      expect(a.clienteSap).toBeDefined()
      expect(a.responsavel).toBeDefined()
      expect(a.acaoRecomendada).toBeDefined()
    })
  })
})
