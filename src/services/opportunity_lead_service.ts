import {
  LeadItem,
  OportunidadeFunil,
  mockLeads,
  mockFunilOportunidades,
  mockClientes,
} from '@/data/mockCommercialData'

export interface AdvancedLead extends LeadItem {
  cnpj?: string
  cpf?: string
  email?: string
  phone?: string
  potencialValor?: number
  qualificationScore?: number // 0-100
  qualificationTemp?: 'Quente' | 'Morno' | 'Frio'
  disqualificationReason?: string
  convertedOpportunityId?: string
  convertedAt?: string
  aiSuggestedProbability?: number
}

export interface AdvancedOpportunity extends OportunidadeFunil {
  responsavelVendedor?: string
  representante?: string
  gerente?: string
  produtoFamilia?: string
  margemEstimadaPct?: number
  probabilidadeVendedor: number
  probabilidadeIA: number
  tempoNoEstagioDias: number
  isParadaAlerta: boolean
  concorrentes?: string[]
  origemLeadId?: string
  origemNome?: string
  cotacaoRelacionadaId?: string
  pedidoSapRelacionado?: string
  historicoMovimentacao?: Array<{
    data: string
    deEtapa: string
    paraEtapa: string
    usuario: string
    motivo?: string
  }>
}

const STORAGE_KEY_ADVANCED_LEADS = 'ciafal_advanced_leads'
const STORAGE_KEY_ADVANCED_OPPS = 'ciafal_advanced_opportunities'

export class OpportunityLeadService {
  getStoredLeads(): AdvancedLead[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ADVANCED_LEADS)
      if (stored) return JSON.parse(stored)
    } catch {
      /* intentionally ignored */
    }

    const initial: AdvancedLead[] = mockLeads.map((l, i) => {
      const score = l.leadPriorityABC === 'A' ? 88 : l.leadPriorityABC === 'B' ? 65 : 42
      return {
        ...l,
        cnpj: `23.901.${800 + i}/0001-${10 + i}`,
        email: `contato@${l.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
        phone: `(31) 988${70 + i}-${1000 + i}`,
        potencialValor: l.potentialTons * 6200,
        qualificationScore: score,
        qualificationTemp: score >= 75 ? 'Quente' : score >= 55 ? 'Morno' : 'Frio',
        aiSuggestedProbability: score >= 75 ? 75 : score >= 55 ? 50 : 25,
      }
    })

    localStorage.setItem(STORAGE_KEY_ADVANCED_LEADS, JSON.stringify(initial))
    return initial
  }

  saveStoredLeads(leads: AdvancedLead[]) {
    localStorage.setItem(STORAGE_KEY_ADVANCED_LEADS, JSON.stringify(leads))
  }

  getStoredOpportunities(): AdvancedOpportunity[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ADVANCED_OPPS)
      if (stored) return JSON.parse(stored)
    } catch {
      /* intentionally ignored */
    }

    const initial: AdvancedOpportunity[] = mockFunilOportunidades.map((op, i) => {
      const probVendedor = op.probabilidade
      const probIA = Math.min(Math.max(probVendedor + (i % 2 === 0 ? 5 : -10), 15), 95)
      const tempoNoEstagio = op.agingDias || i * 3 + 2
      const isParada =
        tempoNoEstagio > 15 && !['faturado', 'perdido', 'cancelado'].includes(op.etapa)

      return {
        ...op,
        responsavelVendedor: op.vendedorNome,
        representante: 'João Pedro Representações',
        gerente: 'Marcos Vinícius (Supervisor)',
        produtoFamilia: i % 2 === 0 ? 'Perfis & Vigas Laminadas' : 'Chapas Grossas Carbono',
        margemEstimadaPct: 21.5,
        probabilidadeVendedor: probVendedor,
        probabilidadeIA: probIA,
        tempoNoEstagioDias: tempoNoEstagio,
        isParadaAlerta: isParada,
        concorrentes: i % 2 === 0 ? ['Açovisa', 'ArcelorMittal'] : ['Gerdau Comercial'],
        cotacaoRelacionadaId: i === 0 ? 'COT-98104' : i === 1 ? 'COT-98105' : undefined,
        historicoMovimentacao: [
          {
            data: op.dataCriacao,
            deEtapa: 'Criada',
            paraEtapa: op.etapa,
            usuario: op.vendedorNome,
            motivo: 'Criação inicial da oportunidade',
          },
        ],
      }
    })

    localStorage.setItem(STORAGE_KEY_ADVANCED_OPPS, JSON.stringify(initial))
    return initial
  }

  saveStoredOpportunities(opps: AdvancedOpportunity[]) {
    localStorage.setItem(STORAGE_KEY_ADVANCED_OPPS, JSON.stringify(opps))
  }

  /**
   * 4.2 Validação de duplicidade por CNPJ, CPF, e-mail, telefone e razão social aproximada
   */
  checkDuplicate(leadData: Partial<AdvancedLead>): {
    hasDuplicate: boolean
    duplicateReason?: string
    matchedEntity?: { name: string; type: 'LEAD' | 'CLIENTE_SAP' }
  } {
    const leads = this.getStoredLeads()
    const cleanStr = (s?: string) => (s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()

    // 1. Checar contra clientes SAP já cadastrados
    for (const c of mockClientes) {
      if (
        leadData.cnpj &&
        cleanStr(leadData.cnpj) &&
        cleanStr(leadData.cnpj) === cleanStr(c.cnpj)
      ) {
        return {
          hasDuplicate: true,
          duplicateReason: `CNPJ ${leadData.cnpj} já é cliente cadastrado na base SAP ECC.`,
          matchedEntity: { name: c.razaoSocial, type: 'CLIENTE_SAP' },
        }
      }
      if (
        leadData.companyName &&
        cleanStr(leadData.companyName).length > 5 &&
        cleanStr(c.razaoSocial).includes(cleanStr(leadData.companyName))
      ) {
        return {
          hasDuplicate: true,
          duplicateReason: `Razão Social semelhante encontrada na base de clientes ativos: "${c.razaoSocial}".`,
          matchedEntity: { name: c.razaoSocial, type: 'CLIENTE_SAP' },
        }
      }
    }

    // 2. Checar contra leads existentes
    for (const l of leads) {
      if (l.id === leadData.id) continue

      if (
        leadData.cnpj &&
        cleanStr(leadData.cnpj) &&
        cleanStr(leadData.cnpj) === cleanStr(l.cnpj)
      ) {
        return {
          hasDuplicate: true,
          duplicateReason: `CNPJ ${leadData.cnpj} já cadastrado no lead "${l.companyName}".`,
          matchedEntity: { name: l.companyName, type: 'LEAD' },
        }
      }
      if (leadData.email && cleanStr(leadData.email) === cleanStr(l.email)) {
        return {
          hasDuplicate: true,
          duplicateReason: `E-mail ${leadData.email} já cadastrado no lead "${l.companyName}".`,
          matchedEntity: { name: l.companyName, type: 'LEAD' },
        }
      }
      if (
        leadData.phone &&
        cleanStr(leadData.phone).length > 8 &&
        cleanStr(leadData.phone) === cleanStr(l.phone)
      ) {
        return {
          hasDuplicate: true,
          duplicateReason: `Telefone ${leadData.phone} já associado ao lead "${l.companyName}".`,
          matchedEntity: { name: l.companyName, type: 'LEAD' },
        }
      }
    }

    return { hasDuplicate: false }
  }

  /**
   * 4.4 Conversão Lead -> Oportunidade com preservação de rastreabilidade
   */
  convertLeadToOpportunity(
    leadId: string,
    params: {
      titulo: string
      valor: number
      toneladas: number
      vendedorNome: string
      vendedorId: string
      produtoFamilia: string
    },
  ): { lead: AdvancedLead; opportunity: AdvancedOpportunity } {
    const leads = this.getStoredLeads()
    const opps = this.getStoredOpportunities()

    const leadIdx = leads.findIndex((l) => l.id === leadId)
    if (leadIdx < 0) throw new Error('Lead não encontrado')

    const lead = leads[leadIdx]
    const oppId = `opp-lead-${Date.now()}`
    const nowIso = new Date().toISOString()
    const nowStr = nowIso.split('T')[0]

    const newOpp: AdvancedOpportunity = {
      id: oppId,
      clienteId: `cli-conv-${lead.id}`,
      clienteNome: lead.companyName,
      clienteSap: 'LEAD-CONV',
      titulo: params.titulo || `Oportunidade - ${lead.productInterest || lead.companyName}`,
      etapa: 'oportunidade',
      valor: params.valor || lead.potencialValor || lead.potentialTons * 6200,
      toneladas: params.toneladas || lead.potentialTons,
      probabilidade: lead.qualificationScore || 60,
      probabilidadeVendedor: lead.qualificationScore || 60,
      probabilidadeIA: lead.aiSuggestedProbability || 65,
      agingDias: 0,
      tempoNoEstagioDias: 0,
      isParadaAlerta: false,
      proximaAcao: `Apresentar cotação inicial de ${params.produtoFamilia || lead.productInterest}`,
      vendedorId: params.vendedorId || lead.assignedSellerId || 'qas-vendedor_teste',
      vendedorNome: params.vendedorNome || lead.assignedSeller,
      previsaoFechamento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      dataCriacao: nowStr,
      produtoFamilia: params.produtoFamilia || lead.productInterest,
      margemEstimadaPct: 22.0,
      origemLeadId: lead.id,
      origemNome: `Lead Comercial: ${lead.companyName} (${lead.leadName})`,
      historicoMovimentacao: [
        {
          data: nowStr,
          deEtapa: 'Lead Qualificado',
          paraEtapa: 'oportunidade',
          usuario: params.vendedorNome,
          motivo: `Conversão do Lead ${lead.companyName} com score ${lead.qualificationScore} pts.`,
        },
      ],
    }

    lead.stage = 'Convertido'
    lead.convertedOpportunityId = oppId
    lead.convertedAt = nowStr

    leads[leadIdx] = lead
    opps.unshift(newOpp)

    this.saveStoredLeads(leads)
    this.saveStoredOpportunities(opps)

    return { lead, opportunity: newOpp }
  }

  /**
   * Mover Oportunidade no Kanban com histórico
   */
  moveOpportunityStage(
    oppId: string,
    newStage: AdvancedOpportunity['etapa'],
    usuario: string,
    motivoPerda?: string,
  ): AdvancedOpportunity {
    const opps = this.getStoredOpportunities()
    const idx = opps.findIndex((o) => o.id === oppId)
    if (idx < 0) throw new Error('Oportunidade não encontrada')

    const opp = opps[idx]
    const oldStage = opp.etapa
    const nowStr = new Date().toISOString().split('T')[0]

    opp.etapa = newStage
    opp.tempoNoEstagioDias = 0
    opp.isParadaAlerta = false
    if (motivoPerda) opp.motivoPerda = motivoPerda

    opp.historicoMovimentacao = [
      ...(opp.historicoMovimentacao || []),
      {
        data: nowStr,
        deEtapa: oldStage,
        paraEtapa: newStage,
        usuario,
        motivo: motivoPerda || `Avanço comercial no funil para ${newStage}`,
      },
    ]

    opps[idx] = opp
    this.saveStoredOpportunities(opps)
    return opp
  }
}

export const opportunityLeadService = new OpportunityLeadService()
