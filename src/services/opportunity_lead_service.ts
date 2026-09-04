import {
  LeadItem,
  OportunidadeFunil,
  EtapaFunil,
  mockLeads,
  mockFunilOportunidades,
  mockClientes,
} from '@/data/mockCommercialData'
import { crmStorage } from '@/lib/crm-storage'

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

export type EstagioOportunidadeCiafal =
  | 'especulacao' // 1. Especulação (Tipo: ESPECULAÇÃO COMERCIAL)
  | 'interesse' // 2. Interesse identificado
  | 'necessidade' // 3. Necessidade identificada
  | 'qualificacao' // 4. Em qualificação
  | 'solicitacao_cotacao' // 5. Solicitação de cotação
  | 'cotacao_gerada' // 6. Cotação gerada
  | 'negociacao' // 7. Negociação
  | 'convertida_pedido' // 8. Convertida em pedido
  | 'perdida' // 9. Perdida
  | 'suspensa' // 10. Suspensa

export const ESTAGIOS_OPORTUNIDADE_CIAFAL: {
  id: EstagioOportunidadeCiafal
  ordem: number
  label: string
  descricao: string
  color: string
  badgeClass: string
  isSaida?: boolean
}[] = [
  {
    id: 'especulacao',
    ordem: 1,
    label: '1. Especulação',
    descricao: 'Especulação comercial inicial',
    color: 'border-slate-400',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  {
    id: 'interesse',
    ordem: 2,
    label: '2. Interesse identificado',
    descricao: 'Cliente manifestou interesse no portfólio',
    color: 'border-blue-400',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    id: 'necessidade',
    ordem: 3,
    label: '3. Necessidade identificada',
    descricao: 'Demanda de material ou aplicação mapeada',
    color: 'border-indigo-400',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  {
    id: 'qualificacao',
    ordem: 4,
    label: '4. Em qualificação',
    descricao: 'Alinhamento técnico e validação de crédito/viabilidade',
    color: 'border-cyan-400',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
  {
    id: 'solicitacao_cotacao',
    ordem: 5,
    label: '5. Solicitação de cotação',
    descricao: 'Solicitação de proposta comercial formal',
    color: 'border-amber-400',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'cotacao_gerada',
    ordem: 6,
    label: '6. Cotação gerada',
    descricao: 'Cotação SAP emitida e enviada ao cliente',
    color: 'border-purple-400',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    id: 'negociacao',
    ordem: 7,
    label: '7. Negociação',
    descricao: 'Ajuste de condições comerciais, prazos e descontos',
    color: 'border-orange-400',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    id: 'convertida_pedido',
    ordem: 8,
    label: '8. Convertida em pedido',
    descricao: 'Pedido de venda implantado no SAP ECC',
    color: 'border-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    id: 'perdida',
    ordem: 9,
    label: '9. Perdida',
    descricao: 'Negociação perdida para concorrente ou desistência',
    color: 'border-rose-400',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    isSaida: true,
  },
  {
    id: 'suspensa',
    ordem: 10,
    label: '10. Suspensa',
    descricao: 'Projeto suspenso ou adiado temporariamente',
    color: 'border-zinc-400',
    badgeClass: 'bg-zinc-200 text-zinc-800 border-zinc-400',
    isSaida: true,
  },
]

export type PrevisaoCompraTipo =
  | 'ate_30_dias'
  | '31_60_dias'
  | '61_90_dias'
  | '3_6_meses'
  | '6_12_meses'
  | 'acima_12_meses'
  | 'sem_previsao'

export const PREVISOES_COMPRA_OPCOES: { id: PrevisaoCompraTipo; label: string }[] = [
  { id: 'ate_30_dias', label: 'até 30 dias' },
  { id: '31_60_dias', label: '31–60 dias' },
  { id: '61_90_dias', label: '61–90 dias' },
  { id: '3_6_meses', label: '3–6 meses' },
  { id: '6_12_meses', label: '6–12 meses' },
  { id: 'acima_12_meses', label: 'acima de 12 meses' },
  { id: 'sem_previsao', label: 'sem previsão definida' },
]

export type ProbabilidadeNivel = 'baixa' | 'media' | 'alta'

export const PROBABILIDADE_OPCOES: {
  id: ProbabilidadeNivel
  label: string
  pctDefault: number
  badgeClass: string
}[] = [
  { id: 'baixa', label: 'Baixa', pctDefault: 25, badgeClass: 'bg-slate-100 text-slate-700' },
  { id: 'media', label: 'Média', pctDefault: 55, badgeClass: 'bg-amber-100 text-amber-800' },
  { id: 'alta', label: 'Alta', pctDefault: 85, badgeClass: 'bg-emerald-100 text-emerald-800' },
]

export type OrigemOportunidade =
  | 'contato_vendedor'
  | 'visita'
  | 'telefone'
  | 'whatsapp'
  | 'email'
  | 'indicacao'
  | 'lead'
  | 'cliente_ativo'
  | 'cliente_inativo'
  | 'cross_sell'
  | 'up_sell'
  | 'evento'
  | 'site'
  | 'outro'

export const ORIGENS_OPORTUNIDADE: { id: OrigemOportunidade; label: string }[] = [
  { id: 'contato_vendedor', label: 'Contato vendedor' },
  { id: 'visita', label: 'Visita' },
  { id: 'telefone', label: 'Telefone' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'E-mail' },
  { id: 'indicacao', label: 'Indicação' },
  { id: 'lead', label: 'Lead' },
  { id: 'cliente_ativo', label: 'Cliente ativo' },
  { id: 'cliente_inativo', label: 'Cliente inativo' },
  { id: 'cross_sell', label: 'Cross-sell' },
  { id: 'up_sell', label: 'Up-sell' },
  { id: 'evento', label: 'Evento' },
  { id: 'site', label: 'Site' },
  { id: 'outro', label: 'Outro' },
]

export const GRUPOS_MERCADORIA_OPCOES = [
  'Não definido / A identificar',
  'Barras Redondas',
  'Barras Chatas',
  'Cantoneiras',
  'Quadrados',
  'Perfis & Vigas Laminadas',
  'Tubos e Perfis Inox',
  'Chapas Grossas Carbono',
  'Chapas Inox',
  'Bobinas & Rolos Inox',
  'Perfis Dobrados',
  'Vergalhões CA-50 / Construção Civil',
  'Outros Materiais e Ligas Especiais',
]

export interface AuditoriaRegistro {
  id: string
  dataHora: string
  usuario: string
  acao: string
  detalhe?: string
  estagioAnterior?: string
  estagioNovo?: string
  alteracoes?: {
    campo: string
    de: any
    para: any
  }[]
  motivoPerda?: string
}

export interface AdvancedOpportunity extends OportunidadeFunil {
  // Campos Complementares Opcionais
  grupoMercadoria?: string
  quantidadeEstimadaTons?: number | null // Em toneladas (opcional)
  precoEstimadoPorTon?: number | null // Em R$/t (opcional)
  valorPotencialCalculado?: number | null // Quantidade × Preço (somente se ambos informados)
  previsaoCompra?: PrevisaoCompraTipo | string
  probabilidadeClassificacao?: ProbabilidadeNivel
  origemOportunidade?: OrigemOportunidade | string
  observacoes?: string

  // Identificação e Estágio Comercial CIAFAL
  tipoOportunidade?: 'ESPECULAÇÃO COMERCIAL' | string
  estagioCiafal?: EstagioOportunidadeCiafal

  // Rastreabilidade e Auditoria
  criadoPorUsuario?: string
  criadoEmDataHora?: string
  ultimaAtualizacaoDataHora?: string
  ultimaAtualizacaoUsuario?: string
  historicoAuditoria?: AuditoriaRegistro[]

  // Metadados adicionais existentes
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

export interface NovaOportunidadePayload {
  clienteId: string
  clienteNome: string
  clienteSap?: string
  clienteCnpj?: string
  clienteCidade?: string
  clienteUf?: string
  clienteSegmento?: string
  vendedorId?: string
  vendedorNome?: string

  grupoMercadoria?: string
  quantidadeEstimadaTons?: number | null
  precoEstimadoPorTon?: number | null
  previsaoCompra?: PrevisaoCompraTipo | string
  probabilidadeClassificacao?: ProbabilidadeNivel
  origemOportunidade?: OrigemOportunidade | string
  observacoes?: string

  origemLeadId?: string
  origemLeadNome?: string
  usuarioAtual?: string
}

const STORAGE_KEY_ADVANCED_LEADS = 'ciafal_advanced_leads'
const STORAGE_KEY_ADVANCED_OPPS = 'ciafal_advanced_opportunities'

/**
 * Mapeador entre o EstagioCiafal (1-10) e a EtapaFunil legada para compatibilidade retroativa
 */
export function mapearEstagioCiafalParaEtapaFunil(estagio?: EstagioOportunidadeCiafal): EtapaFunil {
  switch (estagio) {
    case 'especulacao':
      return 'prospeccao'
    case 'interesse':
      return 'contato'
    case 'necessidade':
      return 'necessidade'
    case 'qualificacao':
      return 'oportunidade'
    case 'solicitacao_cotacao':
      return 'cotacao'
    case 'cotacao_gerada':
      return 'cotacao'
    case 'negociacao':
      return 'negociacao'
    case 'convertida_pedido':
      return 'pedido'
    case 'perdida':
      return 'perdido'
    case 'suspensa':
      return 'adiado'
    default:
      return 'prospeccao'
  }
}

/**
 * Mapeador de EtapaFunil legada para EstagioCiafal
 */
export function mapearEtapaFunilParaEstagioCiafal(etapa?: EtapaFunil): EstagioOportunidadeCiafal {
  switch (etapa) {
    case 'prospeccao':
      return 'especulacao'
    case 'contato':
      return 'interesse'
    case 'necessidade':
      return 'necessidade'
    case 'oportunidade':
      return 'qualificacao'
    case 'cotacao':
      return 'solicitacao_cotacao'
    case 'negociacao':
      return 'negociacao'
    case 'pedido':
      return 'convertida_pedido'
    case 'faturado':
      return 'convertida_pedido'
    case 'adiado':
      return 'suspensa'
    case 'perdido':
      return 'perdida'
    case 'cancelado':
      return 'suspensa'
    default:
      return 'especulacao'
  }
}

export class OpportunityLeadService {
  getStoredLeads(): AdvancedLead[] {
    try {
      const stored = crmStorage.getJSON<AdvancedLead[] | null>(STORAGE_KEY_ADVANCED_LEADS, null)
      if (stored && Array.isArray(stored) && stored.length > 0) return stored
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

    crmStorage.setJSON(STORAGE_KEY_ADVANCED_LEADS, initial)
    return initial
  }

  saveStoredLeads(leads: AdvancedLead[]) {
    crmStorage.setJSON(STORAGE_KEY_ADVANCED_LEADS, leads)
  }

  getStoredOpportunities(): AdvancedOpportunity[] {
    try {
      const parsed = crmStorage.getJSON<AdvancedOpportunity[] | null>(
        STORAGE_KEY_ADVANCED_OPPS,
        null,
      )
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    } catch {
      /* intentionally ignored */
    }

    const initial: AdvancedOpportunity[] = mockFunilOportunidades.map((op, i) => {
      const probVendedor = op.probabilidade
      const probIA = Math.min(Math.max(probVendedor + (i % 2 === 0 ? 5 : -10), 15), 95)
      const tempoNoEstagio = op.agingDias || i * 3 + 2
      const isParada =
        tempoNoEstagio > 15 && !['faturado', 'perdido', 'cancelado'].includes(op.etapa)
      const estagioCiafal = mapearEtapaFunilParaEstagioCiafal(op.etapa)

      return {
        ...op,
        tipoOportunidade: 'ESPECULAÇÃO COMERCIAL',
        estagioCiafal,
        grupoMercadoria:
          i % 3 === 0
            ? 'Perfis & Vigas Laminadas'
            : i % 3 === 1
              ? 'Chapas Grossas Carbono'
              : 'Barras Redondas',
        quantidadeEstimadaTons: op.toneladas || null,
        precoEstimadoPorTon: op.toneladas > 0 ? Math.round(op.valor / op.toneladas) : null,
        valorPotencialCalculado: op.valor || null,
        previsaoCompra: op.previsaoFechamento ? 'ate_30_dias' : 'sem_previsao',
        probabilidadeClassificacao:
          probVendedor >= 70 ? 'alta' : probVendedor >= 40 ? 'media' : 'baixa',
        origemOportunidade: 'contato_vendedor',
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
        criadoPorUsuario: op.vendedorNome,
        criadoEmDataHora: `${op.dataCriacao || '2024-10-10'} 09:00:00`,
        historicoAuditoria: [
          {
            id: `aud-init-${i}`,
            dataHora: `${op.dataCriacao || '2024-10-10'} 09:00:00`,
            usuario: op.vendedorNome,
            acao: 'Criação da oportunidade no funil comercial',
            detalhe: 'Carga inicial no sistema',
            estagioNovo: estagioCiafal,
          },
        ],
        historicoMovimentacao: [
          {
            data: op.dataCriacao || '2024-10-10',
            deEtapa: 'Criada',
            paraEtapa: op.etapa,
            usuario: op.vendedorNome,
            motivo: 'Criação inicial da oportunidade',
          },
        ],
      }
    })

    crmStorage.setJSON(STORAGE_KEY_ADVANCED_OPPS, initial)
    return initial
  }

  saveStoredOpportunities(opps: AdvancedOpportunity[]) {
    crmStorage.setJSON(STORAGE_KEY_ADVANCED_OPPS, opps)
  }

  /**
   * CRIAÇÃO DE NOVA OPORTUNIDADE (Regras de negócio 1 a 15)
   * - Campo obrigatório ÚNICO: Cliente. Todos os demais são opcionais.
   * - Toda nova oportunidade inicia no estágio "1. Especulação" (Tipo: ESPECULAÇÃO COMERCIAL).
   * - Valor potencial calculado apenas quando Quantidade E Preço existirem.
   * - Registra log completo de auditoria sem burocracia.
   */
  createOpportunity(payload: NovaOportunidadePayload): AdvancedOpportunity {
    if (!payload.clienteId || !payload.clienteNome?.trim()) {
      throw new Error('O campo "Cliente" é obrigatório para salvar a oportunidade.')
    }

    const opps = this.getStoredOpportunities()
    const now = new Date()
    const nowIso = now.toISOString()
    const nowStr = nowIso.split('T')[0]
    const dataHoraFormatada = now.toLocaleString('pt-BR')
    const usuarioAtual = payload.usuarioAtual || payload.vendedorNome || 'Carlos Mendonça'

    const oppId = `opp-ciafal-${Date.now()}`

    // Cálculo do valor potencial: Quantidade estimada × Preço estimado (somente se ambos válidos e > 0)
    const qty =
      payload.quantidadeEstimadaTons !== undefined &&
      payload.quantidadeEstimadaTons !== null &&
      payload.quantidadeEstimadaTons > 0
        ? payload.quantidadeEstimadaTons
        : null

    const price =
      payload.precoEstimadoPorTon !== undefined &&
      payload.precoEstimadoPorTon !== null &&
      payload.precoEstimadoPorTon > 0
        ? payload.precoEstimadoPorTon
        : null

    const valorPotencial = qty !== null && price !== null ? qty * price : null

    // Probabilidade numérica baseada na classificação
    let probNum = 20
    if (payload.probabilidadeClassificacao === 'alta') probNum = 80
    else if (payload.probabilidadeClassificacao === 'media') probNum = 50
    else if (payload.probabilidadeClassificacao === 'baixa') probNum = 20

    const probIA = Math.min(Math.max(probNum + 5, 15), 90)

    // Título da oportunidade descritivo
    const grupoLabel =
      payload.grupoMercadoria && payload.grupoMercadoria !== 'Não definido / A identificar'
        ? payload.grupoMercadoria
        : 'Demanda Comercial'

    const tituloDescritivo = `Oportunidade: ${grupoLabel} — ${payload.clienteNome}`

    const auditoriaInicial: AuditoriaRegistro = {
      id: `aud-${Date.now()}-1`,
      dataHora: dataHoraFormatada,
      usuario: usuarioAtual,
      acao: 'Criação de Oportunidade',
      detalhe: `Oportunidade criada com estágio inicial "1. Especulação". Grupo: ${payload.grupoMercadoria || 'Não definido'}. Qtd: ${qty !== null ? `${qty} t` : 'Não informada'}. Preço: ${price !== null ? `R$ ${price}/t` : 'Não informado'}.`,
      estagioNovo: 'especulacao',
    }

    const newOpp: AdvancedOpportunity = {
      id: oppId,
      clienteId: payload.clienteId,
      clienteNome: payload.clienteNome,
      clienteSap: payload.clienteSap || '000000',
      titulo: tituloDescritivo,
      etapa: 'prospeccao', // compatibilidade legada com 8 etapas
      estagioCiafal: 'especulacao', // 1. Especulação
      tipoOportunidade: 'ESPECULAÇÃO COMERCIAL',
      valor: valorPotencial || 0, // 0 no campo numérico legado quando vazio, mas tratado no front
      toneladas: qty || 0,
      quantidadeEstimadaTons: qty,
      precoEstimadoPorTon: price,
      valorPotencialCalculado: valorPotencial,
      grupoMercadoria: payload.grupoMercadoria || 'Não definido / A identificar',
      previsaoCompra: payload.previsaoCompra || 'sem_previsao',
      probabilidadeClassificacao: payload.probabilidadeClassificacao || 'baixa',
      origemOportunidade: payload.origemOportunidade || 'contato_vendedor',
      observacoes: payload.observacoes || '',

      probabilidade: probNum,
      probabilidadeVendedor: probNum,
      probabilidadeIA: probIA,
      agingDias: 0,
      tempoNoEstagioDias: 0,
      isParadaAlerta: false,
      proximaAcao: `Qualificar especulação e levantar demanda de ${payload.grupoMercadoria || 'materiais'}`,
      vendedorId: payload.vendedorId || 'qas-vendedor_teste',
      vendedorNome: payload.vendedorNome || 'Carlos Mendonça',
      previsaoFechamento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      dataCriacao: nowStr,
      criadoPorUsuario: usuarioAtual,
      criadoEmDataHora: dataHoraFormatada,
      ultimaAtualizacaoDataHora: dataHoraFormatada,
      ultimaAtualizacaoUsuario: usuarioAtual,
      produtoFamilia: payload.grupoMercadoria || 'Aço Geral',
      origemLeadId: payload.origemLeadId,
      origemNome:
        payload.origemLeadNome || `Origem: ${payload.origemOportunidade || 'Contato Vendedor'}`,
      historicoAuditoria: [auditoriaInicial],
      historicoMovimentacao: [
        {
          data: nowStr,
          deEtapa: 'Início',
          paraEtapa: 'prospeccao',
          usuario: usuarioAtual,
          motivo: 'Criação inicial da oportunidade (Especulação)',
        },
      ],
    }

    opps.unshift(newOpp)
    this.saveStoredOpportunities(opps)
    return newOpp
  }

  /**
   * Atualização de dados da oportunidade com trilha de auditoria
   */
  updateOpportunity(
    oppId: string,
    updates: Partial<AdvancedOpportunity>,
    usuarioAtual: string = 'Carlos Mendonça',
  ): AdvancedOpportunity {
    const opps = this.getStoredOpportunities()
    const idx = opps.findIndex((o) => o.id === oppId)
    if (idx < 0) throw new Error('Oportunidade não encontrada')

    const opp = opps[idx]
    const alteracoes: { campo: string; de: any; para: any }[] = []
    const now = new Date()
    const dataHoraFormatada = now.toLocaleString('pt-BR')

    // Checar campos alterados para auditoria
    if (
      updates.quantidadeEstimadaTons !== undefined &&
      updates.quantidadeEstimadaTons !== opp.quantidadeEstimadaTons
    ) {
      alteracoes.push({
        campo: 'Quantidade Estimada',
        de: opp.quantidadeEstimadaTons,
        para: updates.quantidadeEstimadaTons,
      })
    }

    if (
      updates.precoEstimadoPorTon !== undefined &&
      updates.precoEstimadoPorTon !== opp.precoEstimadoPorTon
    ) {
      alteracoes.push({
        campo: 'Preço Estimado',
        de: opp.precoEstimadoPorTon,
        para: updates.precoEstimadoPorTon,
      })
    }

    if (
      updates.probabilidadeClassificacao !== undefined &&
      updates.probabilidadeClassificacao !== opp.probabilidadeClassificacao
    ) {
      alteracoes.push({
        campo: 'Probabilidade',
        de: opp.probabilidadeClassificacao,
        para: updates.probabilidadeClassificacao,
      })
    }

    if (updates.grupoMercadoria !== undefined && updates.grupoMercadoria !== opp.grupoMercadoria) {
      alteracoes.push({
        campo: 'Grupo de Mercadorias',
        de: opp.grupoMercadoria,
        para: updates.grupoMercadoria,
      })
    }

    // Recalcular valor potencial se quantidade ou preço mudarem
    const finalQty =
      updates.quantidadeEstimadaTons !== undefined
        ? updates.quantidadeEstimadaTons
        : opp.quantidadeEstimadaTons

    const finalPrice =
      updates.precoEstimadoPorTon !== undefined
        ? updates.precoEstimadoPorTon
        : opp.precoEstimadoPorTon

    const finalValorPotencial =
      finalQty !== null &&
      finalQty !== undefined &&
      finalPrice !== null &&
      finalPrice !== undefined &&
      finalQty > 0 &&
      finalPrice > 0
        ? finalQty * finalPrice
        : null

    const updatedOpp: AdvancedOpportunity = {
      ...opp,
      ...updates,
      quantidadeEstimadaTons: finalQty,
      precoEstimadoPorTon: finalPrice,
      valorPotencialCalculado: finalValorPotencial,
      valor: finalValorPotencial || 0,
      toneladas: finalQty || 0,
      ultimaAtualizacaoDataHora: dataHoraFormatada,
      ultimaAtualizacaoUsuario: usuarioAtual,
      historicoAuditoria: [
        ...(opp.historicoAuditoria || []),
        {
          id: `aud-${Date.now()}`,
          dataHora: dataHoraFormatada,
          usuario: usuarioAtual,
          acao: 'Atualização de Oportunidade',
          alteracoes: alteracoes.length > 0 ? alteracoes : undefined,
          detalhe: 'Dados comerciais atualizados',
        },
      ],
    }

    opps[idx] = updatedOpp
    this.saveStoredOpportunities(opps)
    return updatedOpp
  }

  /**
   * Avanço / Mudança de Estágio na régua CIAFAL (1 a 10)
   */
  advanceOpportunityStage(
    oppId: string,
    newStageCiafal: EstagioOportunidadeCiafal,
    usuario: string = 'Carlos Mendonça',
    motivoPerdaOuAnotacao?: string,
  ): AdvancedOpportunity {
    const opps = this.getStoredOpportunities()
    const idx = opps.findIndex((o) => o.id === oppId)
    if (idx < 0) throw new Error('Oportunidade não encontrada')

    const opp = opps[idx]
    const oldStageCiafal = opp.estagioCiafal || mapearEtapaFunilParaEstagioCiafal(opp.etapa)
    const oldEtapaFunil = opp.etapa
    const newEtapaFunil = mapearEstagioCiafalParaEtapaFunil(newStageCiafal)
    const now = new Date()
    const dataHoraFormatada = now.toLocaleString('pt-BR')
    const nowStr = now.toISOString().split('T')[0]

    const auditoria: AuditoriaRegistro = {
      id: `aud-${Date.now()}`,
      dataHora: dataHoraFormatada,
      usuario,
      acao: `Avanço de Estágio: ${oldStageCiafal} → ${newStageCiafal}`,
      estagioAnterior: oldStageCiafal,
      estagioNovo: newStageCiafal,
      detalhe: motivoPerdaOuAnotacao || `Oportunidade movimentada para o estágio ${newStageCiafal}`,
      motivoPerda: newStageCiafal === 'perdida' ? motivoPerdaOuAnotacao : undefined,
    }

    opp.estagioCiafal = newStageCiafal
    opp.etapa = newEtapaFunil
    opp.tempoNoEstagioDias = 0
    opp.isParadaAlerta = false
    opp.ultimaAtualizacaoDataHora = dataHoraFormatada
    opp.ultimaAtualizacaoUsuario = usuario

    if (motivoPerdaOuAnotacao && newStageCiafal === 'perdida') {
      opp.motivoPerda = motivoPerdaOuAnotacao
    }

    opp.historicoAuditoria = [...(opp.historicoAuditoria || []), auditoria]
    opp.historicoMovimentacao = [
      ...(opp.historicoMovimentacao || []),
      {
        data: nowStr,
        deEtapa: oldEtapaFunil,
        paraEtapa: newEtapaFunil,
        usuario,
        motivo:
          motivoPerdaOuAnotacao ||
          `Avanço no funil CIAFAL para ${newStageCiafal} (${newEtapaFunil})`,
      },
    ]

    opps[idx] = opp
    this.saveStoredOpportunities(opps)
    return opp
  }

  /**
   * Validação de duplicidade por CNPJ, CPF, e-mail, telefone e razão social aproximada
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
   * Conversão Lead -> Oportunidade com preservação de rastreabilidade
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
    const dataHoraFormatada = new Date().toLocaleString('pt-BR')

    // Verificar se lead já está associado a cliente SAP existente
    const matchedSap = mockClientes.find(
      (c) =>
        (lead.cnpj && c.cnpj.replace(/\D/g, '') === lead.cnpj.replace(/\D/g, '')) ||
        (c.razaoSocial &&
          lead.companyName &&
          c.razaoSocial.toLowerCase() === lead.companyName.toLowerCase()),
    )

    const clienteId = matchedSap ? matchedSap.id : `cli-conv-${lead.id}`
    const clienteSap = matchedSap ? matchedSap.sapCode : 'LEAD-CONV'
    const clienteNome = matchedSap ? matchedSap.razaoSocial : lead.companyName

    const qty = params.toneladas || lead.potentialTons || null
    const val = params.valor || lead.potencialValor || (qty ? qty * 6200 : null)
    const price = qty && val ? Math.round(val / qty) : null

    const newOpp: AdvancedOpportunity = {
      id: oppId,
      clienteId,
      clienteNome,
      clienteSap,
      titulo: params.titulo || `Oportunidade - ${lead.productInterest || lead.companyName}`,
      etapa: 'prospeccao',
      estagioCiafal: 'especulacao',
      tipoOportunidade: 'ESPECULAÇÃO COMERCIAL',
      valor: val || 0,
      toneladas: qty || 0,
      quantidadeEstimadaTons: qty,
      precoEstimadoPorTon: price,
      valorPotencialCalculado: val,
      grupoMercadoria:
        params.produtoFamilia || lead.productInterest || 'Não definido / A identificar',
      previsaoCompra: 'ate_30_dias',
      probabilidadeClassificacao:
        (lead.qualificationScore || 60) >= 75
          ? 'alta'
          : (lead.qualificationScore || 60) >= 50
            ? 'media'
            : 'baixa',
      origemOportunidade: 'lead',
      probabilidade: lead.qualificationScore || 60,
      probabilidadeVendedor: lead.qualificationScore || 60,
      probabilidadeIA: lead.aiSuggestedProbability || 65,
      agingDias: 0,
      tempoNoEstagioDias: 0,
      isParadaAlerta: false,
      proximaAcao: `Apresentar cotação inicial de ${params.produtoFamilia || lead.productInterest}`,
      vendedorId: params.vendedorId || lead.assignedSellerId || 'qas-vendedor_teste',
      vendedorNome: params.vendedorNome || lead.assignedSeller || 'Carlos Mendonça',
      previsaoFechamento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      dataCriacao: nowStr,
      criadoPorUsuario: params.vendedorNome || 'Carlos Mendonça',
      criadoEmDataHora: dataHoraFormatada,
      ultimaAtualizacaoDataHora: dataHoraFormatada,
      ultimaAtualizacaoUsuario: params.vendedorNome || 'Carlos Mendonça',
      produtoFamilia: params.produtoFamilia || lead.productInterest,
      margemEstimadaPct: 22.0,
      origemLeadId: lead.id,
      origemNome: `Lead Comercial: ${lead.companyName} (${lead.leadName})`,
      historicoAuditoria: [
        {
          id: `aud-conv-${Date.now()}`,
          dataHora: dataHoraFormatada,
          usuario: params.vendedorNome || 'Carlos Mendonça',
          acao: 'Conversão de Lead em Oportunidade',
          detalhe: `Conversão do Lead ${lead.companyName} com score ${lead.qualificationScore} pts.`,
          estagioNovo: 'especulacao',
        },
      ],
      historicoMovimentacao: [
        {
          data: nowStr,
          deEtapa: 'Lead Qualificado',
          paraEtapa: 'prospeccao',
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
    const dataHoraFormatada = new Date().toLocaleString('pt-BR')

    opp.etapa = newStage
    opp.estagioCiafal = mapearEtapaFunilParaEstagioCiafal(newStage)
    opp.tempoNoEstagioDias = 0
    opp.isParadaAlerta = false
    opp.ultimaAtualizacaoDataHora = dataHoraFormatada
    opp.ultimaAtualizacaoUsuario = usuario
    if (motivoPerda) opp.motivoPerda = motivoPerda

    opp.historicoAuditoria = [
      ...(opp.historicoAuditoria || []),
      {
        id: `aud-move-${Date.now()}`,
        dataHora: dataHoraFormatada,
        usuario,
        acao: `Movimentação no Funil: ${oldStage} → ${newStage}`,
        estagioAnterior: oldStage,
        estagioNovo: opp.estagioCiafal,
        detalhe: motivoPerda || `Movimentação comercial no funil para etapa ${newStage}`,
        motivoPerda,
      },
    ]

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
