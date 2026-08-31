import { describe, it, expect, beforeEach } from 'vitest'
import {
  opportunityLeadService,
  ESTAGIOS_OPORTUNIDADE_CIAFAL,
  NovaOportunidadePayload,
} from '@/services/opportunity_lead_service'

describe('CRM 360º CIAFAL - Reestruturação de Nova Oportunidade', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve criar oportunidade informando SOMENTE o cliente (Regra 1)', () => {
    const payload: NovaOportunidadePayload = {
      clienteId: 'cli-100001',
      clienteNome: 'Metalúrgica ABC Ltda.',
      clienteSap: '100001',
      clienteCnpj: '18.442.901/0001-45',
      usuarioAtual: 'Carlos Mendonça',
    }

    const opp = opportunityLeadService.createOpportunity(payload)

    expect(opp.id).toBeDefined()
    expect(opp.clienteNome).toBe('Metalúrgica ABC Ltda.')
    expect(opp.estagioCiafal).toBe('especulacao')
    expect(opp.tipoOportunidade).toBe('ESPECULAÇÃO COMERCIAL')
    expect(opp.quantidadeEstimadaTons).toBeNull()
    expect(opp.precoEstimadoPorTon).toBeNull()
    expect(opp.valorPotencialCalculado).toBeNull()
    expect(opp.historicoAuditoria).toHaveLength(1)
    expect(opp.historicoAuditoria![0].estagioNovo).toBe('especulacao')
  })

  it('deve calcular valor potencial AUTOMATICAMENTE quando quantidade e preço forem informados (Regra 5)', () => {
    const payload: NovaOportunidadePayload = {
      clienteId: 'cli-100002',
      clienteNome: 'Estruturas Metálicas Triângulo',
      clienteSap: '100002',
      grupoMercadoria: 'Barras Chatas',
      quantidadeEstimadaTons: 100,
      precoEstimadoPorTon: 4500,
      previsaoCompra: 'ate_30_dias',
      probabilidadeClassificacao: 'alta',
      origemOportunidade: 'visita',
      observacoes: 'Necessidade para nova linha de galpões',
    }

    const opp = opportunityLeadService.createOpportunity(payload)

    expect(opp.quantidadeEstimadaTons).toBe(100)
    expect(opp.precoEstimadoPorTon).toBe(4500)
    expect(opp.valorPotencialCalculado).toBe(450000) // 100 * 4500
    expect(opp.valor).toBe(450000)
    expect(opp.toneladas).toBe(100)
  })

  it('não deve calcular valor potencial quando faltar quantidade ou preço (Regra 5)', () => {
    const payloadComQtdSemPreco: NovaOportunidadePayload = {
      clienteId: 'cli-100003',
      clienteNome: 'Serralheria Modelo',
      quantidadeEstimadaTons: 30,
      precoEstimadoPorTon: null,
    }

    const opp1 = opportunityLeadService.createOpportunity(payloadComQtdSemPreco)
    expect(opp1.quantidadeEstimadaTons).toBe(30)
    expect(opp1.precoEstimadoPorTon).toBeNull()
    expect(opp1.valorPotencialCalculado).toBeNull()

    const payloadComPrecoSemQtd: NovaOportunidadePayload = {
      clienteId: 'cli-100004',
      clienteNome: 'Caldeiraria Central',
      quantidadeEstimadaTons: null,
      precoEstimadoPorTon: 5200,
    }

    const opp2 = opportunityLeadService.createOpportunity(payloadComPrecoSemQtd)
    expect(opp2.quantidadeEstimadaTons).toBeNull()
    expect(opp2.precoEstimadoPorTon).toBe(5200)
    expect(opp2.valorPotencialCalculado).toBeNull()
  })

  it('deve registrar 10 estágios progressivos na ordem exata (Regra 6)', () => {
    expect(ESTAGIOS_OPORTUNIDADE_CIAFAL).toHaveLength(10)
    expect(ESTAGIOS_OPORTUNIDADE_CIAFAL[0].id).toBe('especulacao')
    expect(ESTAGIOS_OPORTUNIDADE_CIAFAL[1].id).toBe('interesse')
    expect(ESTAGIOS_OPORTUNIDADE_CIAFAL[2].id).toBe('necessidade')
    expect(ESTAGIOS_OPORTUNIDADE_CIAFAL[3].id).toBe('qualificacao')
    expect(ESTAGIOS_OPORTUNIDADE_CIAFAL[4].id).toBe('solicitacao_cotacao')
    expect(ESTAGIOS_OPORTUNIDADE_CIAFAL[5].id).toBe('cotacao_gerada')
    expect(ESTAGIOS_OPORTUNIDADE_CIAFAL[6].id).toBe('negociacao')
    expect(ESTAGIOS_OPORTUNIDADE_CIAFAL[7].id).toBe('convertida_pedido')
    expect(ESTAGIOS_OPORTUNIDADE_CIAFAL[8].id).toBe('perdida')
    expect(ESTAGIOS_OPORTUNIDADE_CIAFAL[9].id).toBe('suspensa')
  })

  it('deve avançar estágio e registrar auditoria completa (Regras 6 e 14)', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cli-100001',
      clienteNome: 'Metalúrgica ABC Ltda.',
    })

    const advanced = opportunityLeadService.advanceOpportunityStage(
      opp.id,
      'solicitacao_cotacao',
      'Carlos Mendonça',
      'Cliente enviou lista de materiais para formalizar proposta',
    )

    expect(advanced.estagioCiafal).toBe('solicitacao_cotacao')
    expect(advanced.historicoAuditoria).toHaveLength(2)
    expect(advanced.historicoAuditoria![1].estagioAnterior).toBe('especulacao')
    expect(advanced.historicoAuditoria![1].estagioNovo).toBe('solicitacao_cotacao')
  })

  it('deve atualizar oportunidade e recalcular valor potencial com auditoria (Regras 10 e 14)', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cli-100001',
      clienteNome: 'Metalúrgica ABC Ltda.',
    })

    const updated = opportunityLeadService.updateOpportunity(
      opp.id,
      {
        quantidadeEstimadaTons: 50,
        precoEstimadoPorTon: 4000,
        probabilidadeClassificacao: 'alta',
      },
      'Carlos Mendonça',
    )

    expect(updated.quantidadeEstimadaTons).toBe(50)
    expect(updated.precoEstimadoPorTon).toBe(4000)
    expect(updated.valorPotencialCalculado).toBe(200000)
    expect(updated.historicoAuditoria!.length).toBeGreaterThan(1)
  })

  it('deve persistir e carregar do localStorage mantendo sincronia do funil', () => {
    opportunityLeadService.createOpportunity({
      clienteId: 'cli-100005',
      clienteNome: 'Construtora Nova Era',
      quantidadeEstimadaTons: 15,
      precoEstimadoPorTon: 4800,
    })

    const all = opportunityLeadService.getStoredOpportunities()
    expect(all[0].clienteNome).toBe('Construtora Nova Era')
    expect(all[0].valorPotencialCalculado).toBe(72000)
  })
})
