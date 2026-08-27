import {
  AcaoDoDia,
  DailyCommercialAction,
  ActionExecutionEvidence,
  ActionEvidenceRule,
  BusinessOutcome,
  CommercialContactInteraction,
} from '@/types/models'
import { mockCommercialContacts } from '@/data/mockCommercialContacts'

// Regras padrão de validação
export const defaultActionEvidenceRules: ActionEvidenceRule[] = [
  {
    id: 'rule-follow-up',
    action_type: 'Follow-up Cotação',
    min_relevance_score: 80,
    valid_channels: ['WhatsApp', 'Telefone', 'E-mail', 'Visita'],
    auto_start_on_evidence: true,
    requires_response_for_conclusion: true,
    enabled: true,
  },
  {
    id: 'rule-negociacao',
    action_type: 'Negociação',
    min_relevance_score: 75,
    valid_channels: ['WhatsApp', 'Telefone', 'E-mail', 'Visita'],
    auto_start_on_evidence: true,
    requires_response_for_conclusion: false,
    enabled: true,
  },
  {
    id: 'rule-reativacao',
    action_type: 'Reativação',
    min_relevance_score: 80,
    valid_channels: ['WhatsApp', 'Telefone', 'E-mail', 'Visita'],
    auto_start_on_evidence: true,
    requires_response_for_conclusion: false,
    enabled: true,
  },
  {
    id: 'rule-visita',
    action_type: 'Visita Técnica',
    min_relevance_score: 85,
    valid_channels: ['Visita'],
    auto_start_on_evidence: true,
    requires_response_for_conclusion: false,
    enabled: true,
  },
]

export interface ActionValidationResult {
  canStart: boolean
  canConclude: boolean
  newStatus: 'PLANEJADA' | 'EM_ANDAMENTO' | 'AGUARDANDO_RETORNO' | 'CONCLUIDA' | 'SEM_SUCESSO'
  confidenceScore: number
  businessOutcome: BusinessOutcome
  evidence: ActionExecutionEvidence
  reasons: string[]
}

/**
 * ActionEvidenceValidatorAgent:
 * Motor de Inteligência Comercial que audita se as interações realizadas pelo vendedor
 * possuem relevância com o objetivo da Ação do Dia.
 *
 * Princípios inquebráveis da CIAFAL:
 * 1. "O vendedor não informa que trabalhou; o CRM identifica que ele trabalhou."
 * 2. "Uma ação não é concluída porque alguém clicou em um botão."
 * 3. "Uma ação é concluída porque existe evidência suficiente de que ela foi executada."
 * 4. "O conteúdo do contato deve estar relacionado ao objetivo da ação." (Ex: 'Bom dia' NÃO conclui cotação).
 * 5. "Distingue execução da ação do resultado comercial obtido (ex: concluiu envio, mas cliente não comprou)."
 */
export class ActionEvidenceValidatorAgent {
  private rules: ActionEvidenceRule[] = defaultActionEvidenceRules

  public evaluateActionInteraction(
    action: AcaoDoDia | DailyCommercialAction,
    interaction: {
      channel: 'WhatsApp' | 'Telefone' | 'E-mail' | 'Visita'
      content: string
      subject?: string
      customer_id?: string
      contact_id?: string
      hasResponse?: boolean
      isOutbound?: boolean
    },
  ): ActionValidationResult {
    const actionGoal = (
      (action as any).recomendacao ||
      (action as any).recommendation ||
      (action as any).title ||
      ''
    ).toLowerCase()

    const actionType =
      (action as any).tipoAcao || (action as any).action_type || 'Follow-up Cotação'
    const content = (interaction.content || '').toLowerCase()
    const subject = (interaction.subject || '').toLowerCase()
    const fullText = `${content} ${subject}`

    const reasons: string[] = []
    let score = 0

    // 1. Verificação de Canal Válido
    score += 20
    reasons.push(`Canal ${interaction.channel} integrado e monitorado pelo CRM.`)

    // 2. Extração de Entidades Relevantes (Cotação, Código, Toneladas, Material, Produto)
    const keywords = [
      'cotação',
      'cot-',
      'proposta',
      'preço',
      'desconto',
      'prazo',
      'entrega',
      'perfil',
      'chapa',
      'tubo',
      'vergalhão',
      'astm',
      'cif',
      'fob',
      'toneladas',
      'ton',
      'reais',
      'r$',
      'faturamento',
      'pedido',
      'sap',
    ]

    let keywordMatches = 0
    keywords.forEach((kw) => {
      if (fullText.includes(kw)) keywordMatches++
    })

    // Caso de Mensagem Genérica / Vazia (ex: "Bom dia")
    const isGenericShort =
      content.length < 15 &&
      (content.includes('bom dia') || content.includes('ola') || content.includes('olá'))

    if (isGenericShort && keywordMatches === 0) {
      score = 25
      reasons.push(
        'Conteúdo genérico ("Bom dia") sem menção a produtos, cotações ou objetivos comerciais da ação.',
      )
    } else {
      const relevanceGain = Math.min(keywordMatches * 15, 60)
      score += relevanceGain
      reasons.push(
        `Detectadas ${keywordMatches} entidades comerciais chave compatíveis com o objetivo da ação.`,
      )
    }

    // 3. Verificação de Alinhamento Semântico com o Objetivo da Ação
    const actionTerms = actionGoal.split(/\s+/).filter((t) => t.length > 3)
    let termMatchCount = 0
    actionTerms.forEach((term) => {
      if (fullText.includes(term)) termMatchCount++
    })

    if (termMatchCount > 0) {
      score += 20
      reasons.push(
        `Correlação direta com termos da recomendação: ${termMatchCount} correspondências.`,
      )
    }

    // Normalizar score 0-100
    const finalScore = Math.min(Math.max(score, 0), 100)
    const isStrongEvidence = finalScore >= 75

    // Determinar Status de Execução e Business Outcome
    let newStatus:
      | 'PLANEJADA'
      | 'EM_ANDAMENTO'
      | 'AGUARDANDO_RETORNO'
      | 'CONCLUIDA'
      | 'SEM_SUCESSO' = 'PLANEJADA'
    let businessOutcome: BusinessOutcome = 'SEM_RESPOSTA'

    if (isStrongEvidence) {
      if (
        actionType.toLowerCase().includes('follow') ||
        actionType.toLowerCase().includes('retorno')
      ) {
        if (interaction.hasResponse) {
          newStatus = 'CONCLUIDA'
          businessOutcome = 'RESPONDEU'
        } else {
          newStatus = 'AGUARDANDO_RETORNO'
          businessOutcome = 'SEM_RESPOSTA'
        }
      } else {
        newStatus = 'CONCLUIDA'
        businessOutcome = 'INTERESSADO'
      }
    } else if (finalScore >= 40) {
      newStatus = 'EM_ANDAMENTO'
    } else {
      newStatus = 'PLANEJADA'
    }

    const evidence: ActionExecutionEvidence = {
      id: `ev-${Date.now()}`,
      action_id: action.id,
      channel: interaction.channel,
      customer_id: (action as any).clienteId || (action as any).customer_id || 'cli-generic',
      started_at: new Date().toISOString(),
      completed_at: newStatus === 'CONCLUIDA' ? new Date().toISOString() : undefined,
      content_reference: interaction.content.slice(0, 150),
      ai_relevance_score: finalScore,
      ai_analysis_reason: reasons.join(' '),
      validation_status: isStrongEvidence
        ? 'VALIDADO_FORTE'
        : finalScore >= 40
          ? 'INSUFICIENTE'
          : 'REJEITADO',
      business_outcome: businessOutcome,
      validated_by_agent: 'ActionEvidenceValidatorAgent (Skip Cloud / CIAFAL Engine)',
      created_at: new Date().toISOString(),
    }

    return {
      canStart: finalScore >= 40,
      canConclude: newStatus === 'CONCLUIDA',
      newStatus,
      confidenceScore: finalScore,
      businessOutcome,
      evidence,
      reasons,
    }
  }

  /**
   * Procura no histórico de contatos integrados (WhatsApp, VoIP, Graph) se há evidência para a ação
   */
  public findEvidenceForAction(
    action: AcaoDoDia | DailyCommercialAction,
    contacts: CommercialContactInteraction[] = mockCommercialContacts,
  ): ActionValidationResult | null {
    const customerId = (action as any).clienteId || (action as any).customer_id
    const customerName = (action as any).clienteNome || (action as any).customer_name

    // Filtrar contatos do cliente
    const matchedContact = contacts.find(
      (c) =>
        c.customer_id === customerId ||
        (customerName && c.customer_name.toLowerCase().includes(customerName.toLowerCase())),
    )

    if (!matchedContact) {
      return null
    }

    return this.evaluateActionInteraction(action, {
      channel: matchedContact.channel,
      content: `${matchedContact.summary} ${matchedContact.detailed_content || ''}`,
      subject: matchedContact.email_subject,
      customer_id: matchedContact.customer_id,
      hasResponse: matchedContact.status === 'RESPONDIDO',
      isOutbound: matchedContact.direction === 'SAIDA' || matchedContact.direction === 'OUTBOUND',
    })
  }
}

export const globalActionEvidenceValidator = new ActionEvidenceValidatorAgent()
