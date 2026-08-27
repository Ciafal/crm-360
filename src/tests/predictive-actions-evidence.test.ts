import { describe, it, expect } from 'vitest'
import {
  validateActionEvidence,
  defaultActionEvidenceRules,
  validateEvidenceByContent,
} from '../services/action_evidence_validator'
import { ActionExecutionEvidence } from '../types/models'
import { initialCommercialPlaybooks } from '../data/mockPlaybooksAndWorkflows'

describe('CRM 360º — Fase Preditiva, Contatos, Evidências e Playbooks', () => {
  it('1. Deve validar que a governança de regras de evidência existe e possui canais configurados', () => {
    expect(defaultActionEvidenceRules.length).toBeGreaterThan(0)
    const quoteRule = defaultActionEvidenceRules.find((r) => r.action_type === 'COTAÇÃO_FOLLOWUP')
    expect(quoteRule).toBeDefined()
    expect(quoteRule?.allowed_channels).toContain('WhatsApp')
    expect(quoteRule?.min_confidence_score).toBeGreaterThanOrEqual(70)
  })

  it('2. Ação não deve ser concluída com mensagem vazia ou irrelevante (ex: "Bom dia")', () => {
    const action = {
      id: 'act-test-01',
      title: 'Follow-up Cotação #98104 - Perfil I 6"',
      description: 'Retorno sobre a cotação de perfis laminados',
      action_type: 'COTAÇÃO_FOLLOWUP',
      target_customer_id: 'CLI-8041',
      target_contact_id: 'CONT-01',
    }

    const weakEvidence: ActionExecutionEvidence = {
      action_id: 'act-test-01',
      interaction_id: 'int-001',
      channel: 'WhatsApp',
      customer_id: 'CLI-8041',
      contact_id: 'CONT-01',
      started_at: new Date().toISOString(),
      content_reference: 'Bom dia',
      validation_status: 'PENDING',
    }

    const result = validateActionEvidence(action, weakEvidence)
    expect(result.isValid).toBe(false)
    expect(result.confidenceScore).toBeLessThan(80)
    expect(result.suggestedExecutionStatus).not.toBe('CONCLUIDA')
  })

  it('3. Ação de negociação com menção explícita à cotação e valor deve ser validada com alta confiança', () => {
    const action = {
      id: 'act-test-02',
      title: 'Negociar Cotação #98104 - Perfil I',
      description: 'Follow-up de fechamento comercial',
      action_type: 'COTAÇÃO_FOLLOWUP',
      target_customer_id: 'CLI-8041',
      target_contact_id: 'CONT-01',
    }

    const strongEvidence: ActionExecutionEvidence = {
      action_id: 'act-test-02',
      interaction_id: 'int-002',
      channel: 'WhatsApp',
      customer_id: 'CLI-8041',
      contact_id: 'CONT-01',
      started_at: new Date().toISOString(),
      content_reference: 'Conforme alinhado sobre a cotação 98104 dos perfis I, conseguimos manter a condição CIF para entrega na próxima terça-feira.',
      validation_status: 'PENDING',
    }

    const result = validateActionEvidence(action, strongEvidence)
    expect(result.isValid).toBe(true)
    expect(result.confidenceScore).toBeGreaterThanOrEqual(80)
    expect(result.suggestedExecutionStatus).toBe('CONCLUIDA')
  })

  it('4. Contato enviado sem resposta do cliente deve avançar para AGUARDANDO_RETORNO', () => {
    const action = {
      id: 'act-test-03',
      title: 'Follow-up de Cotação Aberta',
      action_type: 'COTAÇÃO_FOLLOWUP',
      target_customer_id: 'CLI-8041',
    }

    const pendingReplyEvidence: ActionExecutionEvidence = {
      action_id: 'act-test-03',
      interaction_id: 'int-003',
      channel: 'Email',
      customer_id: 'CLI-8041',
      started_at: new Date().toISOString(),
      content_reference: 'Enviando proposta formal da cotação e aguardando retorno da diretoria de compras.',
      validation_status: 'PENDING',
    }

    const result = validateActionEvidence(action, pendingReplyEvidence)
    expect(result.isValid).toBe(true)
    expect(result.suggestedExecutionStatus).toBe('AGUARDANDO_RETORNO')
    expect(result.suggestedBusinessOutcome).toBe('SEM_RESPOSTA')
  })

  it('5. Validador por conteúdo em lote (validateEvidenceByContent) deve calcular score e resultado de negócio', () => {
    const check = validateEvidenceByContent(
      'Follow-up Proposta',
      'Cliente confirmou o pedido e solicitou faturamento via SAP ECC para amanhã',
      'WhatsApp',
    )
    expect(check.confidence).toBeGreaterThanOrEqual(80)
    expect(check.suggestedStatus).toBe('CONCLUIDA')
    expect(check.businessOutcome).toBe('PEDIDO')
  })

  it('6. Playbooks comerciais por arquétipo devem possuir estrutura completa versionada', () => {
    expect(initialCommercialPlaybooks.length).toBeGreaterThanOrEqual(4)
    for (const pb of initialCommercialPlaybooks) {
      expect(pb.customer_archetype).toBeDefined()
      expect(pb.version).toBeDefined()
      expect(pb.recommended_channels.length).toBeGreaterThan(0)
      expect(pb.objections.length).toBeGreaterThan(0)
      expect(pb.forbidden_patterns.length).toBeGreaterThan(0)
    }
  })
})
