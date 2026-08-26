import React, { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DailyCommercialAction, CommercialActionType } from '@/types/models'
import { DailyActionCard } from '@/components/shared/DailyActionCard'

interface DailyActionsSectionProps {
  actions: DailyCommercialAction[]
  loading: boolean
  onUpdateStatus: (
    id: string,
    status: any,
    extra?: { result?: string; justification?: string; rescheduled_to?: string },
  ) => Promise<void>
  onOpenCustomer360?: (customerId: string) => void
  onNavigateConversas?: (phoneOrJid?: string) => void
}

export function DailyActionsSection({
  actions,
  loading,
  onUpdateStatus,
  onOpenCustomer360,
  onNavigateConversas,
}: DailyActionsSectionProps) {
  const [activeTab, setActiveTab] = useState<'todas' | CommercialActionType>('todas')

  const pendingActions = actions.filter(
    (a) => a.status === 'pendente' || a.status === 'em_andamento',
  )

  const filteredActions =
    activeTab === 'todas'
      ? pendingActions
      : pendingActions.filter((a) => a.action_type === activeTab)

  const handleComplete = async (action: DailyCommercialAction) => {
    await onUpdateStatus(action.id, 'concluida', {
      result: 'Ação realizada com sucesso',
    })
  }

  const handleJustify = async (action: DailyCommercialAction, justification: string) => {
    await onUpdateStatus(action.id, 'nao_realizada', {
      justification,
    })
  }

  const handleReschedule = async (
    action: DailyCommercialAction,
    newDate: string,
    justification?: string,
  ) => {
    await onUpdateStatus(action.id, 'reagendada', {
      rescheduled_to: newDate,
      justification,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header com indicador de dados e tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-2xl font-bold text-primary">Ações do Dia</h2>
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20 text-xs px-2.5"
            >
              {pendingActions.length} pendentes
            </Badge>
            <Badge
              variant="secondary"
              className="text-[11px] bg-slate-100 text-slate-600 font-medium"
            >
              Dados analíticos Qlik/IA
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground font-sans mt-0.5">
            Prioridades comerciais calculadas e enriquecidas para impulsionar seu fechamento hoje.
          </p>
        </div>

        {/* Filtro Rápido por Categoria */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={activeTab === 'todas' ? 'default' : 'outline'}
            onClick={() => setActiveTab('todas')}
            className="rounded-full text-xs h-8"
          >
            Todas ({pendingActions.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'atacar_agora' ? 'default' : 'outline'}
            onClick={() => setActiveTab('atacar_agora')}
            className="rounded-full text-xs h-8 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
          >
            Atacar Agora
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'follow_up' ? 'default' : 'outline'}
            onClick={() => setActiveTab('follow_up')}
            className="rounded-full text-xs h-8 text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            Follow-up
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'recuperar' ? 'default' : 'outline'}
            onClick={() => setActiveTab('recuperar')}
            className="rounded-full text-xs h-8 text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200"
          >
            Recuperar
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'resolver_impedimento' ? 'default' : 'outline'}
            onClick={() => setActiveTab('resolver_impedimento')}
            className="rounded-full text-xs h-8 text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
          >
            Impedimentos
          </Button>
        </div>
      </div>

      {/* Grid de Cards de Ações */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-48 bg-muted/40 rounded-2xl" />
          ))}
        </div>
      ) : filteredActions.length === 0 ? (
        <div className="p-8 text-center bg-white/40 border border-dashed rounded-2xl flex flex-col items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2 opacity-80" />
          <h3 className="font-semibold text-lg text-primary">Tudo concluído nesta categoria!</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Você não tem ações pendentes para este filtro no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActions.map((action) => (
            <DailyActionCard
              key={action.id}
              action={action}
              onComplete={handleComplete}
              onJustify={handleJustify}
              onReschedule={handleReschedule}
              onOpenCustomer360={onOpenCustomer360}
              onNavigateConversas={onNavigateConversas}
            />
          ))}
        </div>
      )}
    </div>
  )
}
