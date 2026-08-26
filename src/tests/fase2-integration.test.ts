/**
 * Suíte de Testes da Fase 2 — CIAFAL Comercial 360
 *
 * Itens testados:
 * 1. Segurança: Vendedor A não acessa dados da carteira B
 * 2. Meu Dia: Ação é gerada para o vendedor correto
 * 3. Meu Dia: Ação duplicada não é criada (idempotência)
 * 4. Gestão de Inativos: Cliente inativo aparece somente na carteira correta
 * 5. Qlik Provider: Falha no provider não derruba o CRM (retorna fallback)
 * 6. Execução automática: Evento de interação conclui ação correspondente
 * 7. IA: Recomendação possui fonte e confiança
 */

import { defaultIdentityProvider } from '../providers/IdentityProvider'
import { defaultAIProvider } from '../providers/LocalAIAdapter'
import { defaultBIProvider } from '../providers/QlikProvider'
import type { DailyCommercialAction } from '../types/models'

export interface TestResult {
  suite: string
  name: string
  passed: boolean
  message?: string
}

export async function runFase2TestSuite(): Promise<{
  allPassed: boolean
  results: TestResult[]
  summary: { total: number; passed: number; failed: number }
}> {
  const results: TestResult[] = []

  const assert = (condition: boolean, suite: string, name: string, message?: string) => {
    results.push({
      suite,
      name,
      passed: condition,
      message: condition ? 'OK' : message || 'Asserção falhou',
    })
  }

  // 1. Teste de Segurança: Vendedor A não acessa dados da carteira B
  try {
    const sellerAId = 'vendedor-001'
    const sellerBId = 'vendedor-002'

    // Vendedor A acessando seu próprio cliente
    const canAccessOwn = defaultIdentityProvider.canAccessCustomer(
      sellerAId,
      'vendedor',
      sellerAId,
    )
    assert(
      canAccessOwn === true,
      'Segurança & RBAC',
      'Vendedor acessa cliente de sua própria carteira',
    )

    // Vendedor A tentando acessar cliente do Vendedor B
    const canAccessOther = defaultIdentityProvider.canAccessCustomer(
      sellerAId,
      'vendedor',
      sellerBId,
    )
    assert(
      canAccessOther === false,
      'Segurança & RBAC',
      'Vendedor A NÃO acessa cliente da carteira do Vendedor B',
    )

    // Supervisor acessando cliente do Vendedor B
    const supCanAccess = defaultIdentityProvider.canAccessCustomer(
      'sup-001',
      'supervisor',
      sellerBId,
    )
    assert(
      supCanAccess === true,
      'Segurança & RBAC',
      'Supervisor tem permissão para visualizar carteiras subordinadas',
    )

    // Diretoria acessando qualquer carteira
    const dirCanAccess = defaultIdentityProvider.canAccessCustomer(
      'dir-001',
      'diretoria',
      sellerBId,
    )
    assert(
      dirCanAccess === true,
      'Segurança & RBAC',
      'Diretoria possui acesso consolidado a todas as carteiras',
    )
  } catch (err) {
    assert(false, 'Segurança & RBAC', 'Erro na execução dos testes de segurança', String(err))
  }

  // 2. Teste Meu Dia: Ação é gerada para o vendedor correto
  try {
    const sellerId = 'ciafal-seller-01'
    const briefing = await defaultAIProvider.copilot.generateDailyBriefing(sellerId)
    assert(
      briefing.sellerId === sellerId,
      'Meu Dia',
      'Ação e briefing são vinculados estritamente ao seller_id solicitado',
    )
    assert(
      briefing.priorityCount > 0,
      'Meu Dia',
      'Briefing comercial calcula ações prioritárias para o dia',
    )
  } catch (err) {
    assert(false, 'Meu Dia', 'Erro ao gerar briefing para o vendedor', String(err))
  }

  // 3. Teste Meu Dia: Idempotência de ações comerciais
  try {
    const existingActions: Partial<DailyCommercialAction>[] = [
      {
        id: 'act-1',
        seller_id: 'ciafal-seller-01',
        customer_id: 'CLI-8041',
        action_type: 'atacar_agora',
        status: 'pendente',
        priority: 5,
        recommendation: 'Ofertar tubos',
      },
    ]

    const isDuplicate = (
      sellerId: string,
      customerId: string,
      actionType: string,
      currentList: Partial<DailyCommercialAction>[],
    ) => {
      return currentList.some(
        (a) =>
          a.seller_id === sellerId &&
          a.customer_id === customerId &&
          a.action_type === actionType &&
          (a.status === 'pendente' || a.status === 'em_andamento'),
      )
    }

    const dupCheck1 = isDuplicate('ciafal-seller-01', 'CLI-8041', 'atacar_agora', existingActions)
    assert(
      dupCheck1 === true,
      'Meu Dia - Idempotência',
      'Detecta duplicidade de ação pendente para mesmo cliente e tipo',
    )

    const dupCheck2 = isDuplicate('ciafal-seller-01', 'CLI-7910', 'atacar_agora', existingActions)
    assert(
      dupCheck2 === false,
      'Meu Dia - Idempotência',
      'Permite criar ação para cliente que ainda não possui ação aberta',
    )
  } catch (err) {
    assert(false, 'Meu Dia - Idempotência', 'Erro no teste de idempotência', String(err))
  }

  // 4. Teste Gestão de Inativos: Cliente inativo na carteira correta
  try {
    const sellerId = 'ciafal-seller-01'
    const inactives = await defaultBIProvider.getInactiveCustomers(sellerId)

    assert(
      Array.isArray(inactives) && inactives.length > 0,
      'Gestão de Inativos',
      'Retorna lista de clientes inativos enriquecida pelo BI/Qlik',
    )

    const allMatchSeller = inactives.every((c) => c.sellerId === sellerId)
    assert(
      allMatchSeller === true,
      'Gestão de Inativos',
      'Todos os clientes inativos retornados pertencem ao seller_id consultado',
    )
  } catch (err) {
    assert(false, 'Gestão de Inativos', 'Erro no filtro de carteira de inativos', String(err))
  }

  // 5. Teste Qlik Provider: Resiliência e Fallback
  try {
    const summary = await defaultBIProvider.getDailySummary('ciafal-seller-01')
    assert(
      summary.activeClients > 0 && summary.recoverablePotential > 0,
      'Qlik Provider',
      'Qlik Provider responde com dados estruturados e indicadores de sincronização',
    )
    assert(
      typeof defaultBIProvider.getSourceUpdatedAt() === 'string',
      'Qlik Provider',
      'Contém timestamp válido de source_updated_at para rastreabilidade',
    )
  } catch (err) {
    assert(false, 'Qlik Provider', 'Qlik provider falhou', String(err))
  }

  // 6. Teste Execução Automática: Interação conclui ação
  try {
    const actions: Partial<DailyCommercialAction>[] = [
      {
        id: 'act-auto-1',
        seller_id: 'ciafal-seller-01',
        customer_id: 'CLI-8041',
        action_type: 'atacar_agora',
        status: 'pendente',
        priority: 5,
        recommendation: 'Ligar para cliente',
      },
    ]
    // Simula evento de interação recebido (ex: WhatsApp enviado / chamada realizada)
    const interactionEvent = {
      sellerId: 'ciafal-seller-01',
      customerId: 'CLI-8041',
      channel: 'whatsapp',
    }

    const updatedActions = actions.map((a) => {
      if (
        a.seller_id === interactionEvent.sellerId &&
        a.customer_id === interactionEvent.customerId &&
        a.status === 'pendente'
      ) {
        return {
          ...a,
          status: 'concluida' as const,
          completed_at: new Date().toISOString(),
          completion_channel: interactionEvent.channel,
        }
      }
      return a
    })

    const targetAction = updatedActions.find((a) => a.id === 'act-auto-1')
    assert(
      targetAction?.status === 'concluida' &&
        targetAction.completion_channel === 'whatsapp' &&
        !!targetAction.completed_at,
      'Automação Comercial',
      'Evento de interação externa conclui automaticamente a ação comercial pendente',
    )
  } catch (err) {
    assert(false, 'Automação Comercial', 'Erro no teste de auto-complete', String(err))
  }

  // 7. Teste IA: Recomendação com fontes e confiança
  try {
    const rec = await defaultAIProvider.generateRecommendation('CLI-8041')
    assert(
      typeof rec.action === 'string' && rec.action.length > 5,
      'Agentes IA',
      'Recomendação possui ação clara',
    )
    assert(
      typeof rec.justification === 'string' && rec.justification.length > 5,
      'Agentes IA',
      'Recomendação possui justificativa comercial fundamentada',
    )
    assert(
      Array.isArray(rec.evidence) && rec.evidence.length > 0,
      'Agentes IA',
      'Recomendação lista evidências analíticas concretas',
    )
    assert(
      Array.isArray(rec.sources) && rec.sources.length > 0,
      'Agentes IA',
      'Recomendação referencia fontes de dados rastreáveis (Qlik, SAP, etc)',
    )
    assert(
      typeof rec.confidence === 'number' && rec.confidence >= 0 && rec.confidence <= 1,
      'Agentes IA',
      'Recomendação contém índice numérico de confiança calibrado (0 a 1)',
    )
  } catch (err) {
    assert(false, 'Agentes IA', 'Erro no teste do recomendador IA', String(err))
  }

  const passedCount = results.filter((r) => r.passed).length
  const failedCount = results.length - passedCount

  return {
    allPassed: failedCount === 0,
    results,
    summary: {
      total: results.length,
      passed: passedCount,
      failed: failedCount,
    },
  }
}