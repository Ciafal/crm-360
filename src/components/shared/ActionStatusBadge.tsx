import React from 'react'
import { Badge } from '@/components/ui/badge'
import { CommercialActionStatus } from '@/types/models'
import { cn } from '@/lib/utils'

interface ActionStatusBadgeProps {
  status: CommercialActionStatus | string
  className?: string
}

export function ActionStatusBadge({ status, className }: ActionStatusBadgeProps) {
  const normStatus = (status || 'PLANEJADA').toUpperCase()

  const config: Record<string, { label: string; class: string }> = {
    PLANEJADA: {
      label: 'Planejada',
      class: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
    },
    PENDENTE: {
      label: 'Planejada',
      class: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
    },
    EM_ANDAMENTO: {
      label: 'Em Andamento (Evidência)',
      class: 'bg-blue-50 text-blue-700 border-blue-300 font-semibold',
    },
    AGUARDANDO_RETORNO: {
      label: 'Aguardando Retorno',
      class: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
    },
    CONCLUIDA: {
      label: 'Concluída (Validada)',
      class: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    },
    SEM_SUCESSO: {
      label: 'Sem Sucesso',
      class: 'bg-rose-50 text-rose-700 border-rose-300 font-medium',
    },
    NAO_REALIZADA: {
      label: 'Não Realizada',
      class: 'bg-rose-50 text-rose-700 border-rose-300 font-medium',
    },
    REAGENDADA: {
      label: 'Reagendada',
      class: 'bg-purple-50 text-purple-700 border-purple-300 font-semibold',
    },
    CANCELADA: {
      label: 'Cancelada',
      class: 'bg-slate-100 text-slate-600 border-slate-300 font-medium',
    },
  }

  const item = config[normStatus] || {
    label: status,
    class: 'bg-slate-100 text-slate-700 border-slate-300',
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs px-2 py-0.5 border shadow-2xs transition-colors',
        item.class,
        className,
      )}
    >
      {item.label}
    </Badge>
  )
}
