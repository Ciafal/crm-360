import { useState, useEffect, useCallback } from 'react'
import { dailyActionsService, type CreateDailyActionParams } from '@/services/daily_actions_service'
import { quotationService } from '@/services/quotation_service'
import type { DailyCommercialAction, CommercialActionStatus } from '@/types/models'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

export function useDailyActions(targetDate?: string) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [actions, setActions] = useState<DailyCommercialAction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await dailyActionsService.listActions(
        user?.id,
        targetDate || new Date().toISOString().split('T')[0],
      )

      const todayStr = targetDate || new Date().toISOString().split('T')[0]
      const nowTime = new Date().getTime()

      // Buscar cotações reais armazenadas
      const storedQuotes = quotationService.getStoredQuotations()
      const quoteActionsToCreate: CreateDailyActionParams[] = []

      for (const quote of storedQuotes) {
        const isTargetStatus =
          quote.status === 'ENVIADA_AO_CLIENTE' || quote.status === 'AGUARDANDO_RETORNO'

        if (isTargetStatus) {
          // Checar se last_contact_at ou next_action_due vencido ou ausente
          const hasNoDue = !quote.next_action_due
          const isDuePast = quote.next_action_due
            ? new Date(quote.next_action_due).getTime() <= nowTime + 24 * 60 * 60 * 1000
            : false
          const hasNoContact = !quote.last_contact_at

          if (hasNoDue || isDuePast || hasNoContact) {
            const sellerId = user?.id || quote.seller_id || 'qas-vendedor_teste'
            quoteActionsToCreate.push({
              seller_id: sellerId,
              customer_id: quote.customer_id,
              customer_name: quote.customer_name,
              opportunity_id: quote.opportunity_id || quote.id,
              action_type: 'follow_up',
              priority: 92,
              recommendation: `Follow-up da Cotação ${quote.code} (${quote.total_tons || 0}t) enviada ao cliente`,
              rationale: `Cotação ${quote.code} no valor de R$ ${(quote.total_value || 0).toLocaleString('pt-BR')} aguarda retorno comercial. Follow-up SLA ativo.`,
              source: 'cotacao',
              confidence: 0.95,
              potential_revenue: quote.total_value,
              potential_tons: quote.total_tons,
              due_at: quote.next_action_due || new Date().toISOString(),
              date: todayStr,
            })
          }
        }
      }

      // Se houver cotações reais para follow-up, criar no backend caso não existam
      if (quoteActionsToCreate.length > 0 && user?.id) {
        await dailyActionsService.bulkCreateIfNotExists(quoteActionsToCreate)
      }

      // Se o banco estiver vazio pela primeira vez, inicializa ações mock sugeridas pela IA
      if (data.length === 0 && user?.id) {
        const initialSeeds: CreateDailyActionParams[] = [
          {
            seller_id: user.id,
            customer_id: 'CLI-8041',
            customer_name: 'Metalúrgica Santa Rita Ltda',
            action_type: 'atacar_agora',
            priority: 95,
            recommendation: 'Ofertar Tubos Inox 304 com pronta-entrega (preço FOB especial)',
            rationale:
              '74 dias sem compras. Recorrência histórica de 45 dias. Estoque de tubos 304 em alta cobertura.',
            source: 'qlik',
            confidence: 0.94,
            potential_revenue: 54000,
            potential_tons: 7.2,
            product_family: 'Tubos Inox',
            due_at: new Date().toISOString(),
          },
          {
            seller_id: user.id,
            customer_id: 'CLI-7910',
            customer_name: 'Caldeiraria & Tanques Industrial Paulista',
            action_type: 'follow_up',
            priority: 90,
            recommendation: 'Follow-up de orçamento de Chapas Inox 316L 1/4" para manutenção',
            rationale: 'Cotação enviada há 4 dias sem resposta do comprador de suprimentos.',
            source: 'crm',
            confidence: 0.91,
            potential_revenue: 98000,
            potential_tons: 12.5,
            product_family: 'Chapas Inox 316L',
            due_at: new Date().toISOString(),
          },
          {
            seller_id: user.id,
            customer_id: 'CLI-5120',
            customer_name: 'Protemax Tubulações & Conexões Eireli',
            action_type: 'resolver_impedimento',
            priority: 85,
            recommendation: 'Resolver limite de crédito antes de liberar novo pedido de Tubos OD',
            rationale: 'Cliente com limite residual de R$ 45k e pedido pendente de R$ 68k.',
            source: 'sap',
            confidence: 0.88,
            potential_revenue: 68000,
            potential_tons: 8.0,
            product_family: 'Tubos Inox',
            due_at: new Date().toISOString(),
          },
          {
            seller_id: user.id,
            customer_id: 'CLI-4309',
            customer_name: 'Cozinhas Industriais Aço Forte Ind. e Com.',
            action_type: 'recuperar',
            priority: 82,
            recommendation: 'Reativação comercial: Chapas Inox 430 com película protetora',
            rationale: 'Quebra de recorrência de 93 dias. Comprador ativo no WhatsApp.',
            source: 'ia',
            confidence: 0.86,
            potential_revenue: 31000,
            potential_tons: 4.5,
            product_family: 'Chapas Inox 430',
            due_at: new Date().toISOString(),
          },
          {
            seller_id: user.id,
            customer_id: 'CLI-1822',
            customer_name: 'AgroInox Silos e Equipamentos Rurais',
            action_type: 'nao_priorizar',
            priority: 45,
            recommendation: 'Manter em observação de entressafra (agendar contato para Novembro)',
            rationale: 'Inativo há 202 dias, ciclo anual de compras concentrado no verão.',
            source: 'ia',
            confidence: 0.72,
            potential_revenue: 75000,
            potential_tons: 10.0,
            product_family: 'Bobinas Inox',
          },
        ]
        const created = await dailyActionsService.bulkCreateIfNotExists(initialSeeds)

        // Recarregar a lista completa de ações para incluir as criadas
        const refreshedData = await dailyActionsService.listActions(
          user?.id,
          targetDate || new Date().toISOString().split('T')[0],
        )
        setActions(refreshedData.length > 0 ? refreshedData : created)
      } else if (quoteActionsToCreate.length > 0 && user?.id) {
        // Se já existiam dados mas novas ações de cotação foram criadas, recarregar
        const refreshedData = await dailyActionsService.listActions(
          user?.id,
          targetDate || new Date().toISOString().split('T')[0],
        )
        setActions(refreshedData.length > 0 ? refreshedData : data)
      } else {
        setActions(data)
      }
    } catch (err) {
      console.error('Error in useDailyActions:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, targetDate])

  useEffect(() => {
    fetchActions()
  }, [fetchActions])

  useRealtime('daily_commercial_actions', () => {
    fetchActions()
  })

  const updateActionStatus = async (
    id: string,
    status: CommercialActionStatus,
    extra?: {
      result?: string
      completion_channel?: string
      rescheduled_to?: string
      justification?: string
    },
  ) => {
    try {
      await dailyActionsService.updateStatus(id, status, extra)
      toast({
        title: status === 'concluida' ? 'Ação concluída com sucesso!' : 'Ação atualizada',
        description: extra?.justification ? `Justificativa registrada.` : undefined,
      })
      await fetchActions()
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar ação',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const createAction = async (data: CreateDailyActionParams) => {
    try {
      const act = await dailyActionsService.createAction(data)
      toast({
        title: 'Ação comercial criada',
        description: 'Nova ação adicionada ao Meu Dia.',
      })
      await fetchActions()
      return act
    } catch (err: any) {
      toast({
        title: 'Erro ao criar ação',
        description: err.message,
        variant: 'destructive',
      })
      throw err
    }
  }

  return {
    actions,
    loading,
    fetchActions,
    updateActionStatus,
    createAction,
  }
}
