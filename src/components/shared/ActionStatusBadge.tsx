import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CommercialActionStatus } from '@/types/models'

interface ActionStatusBadgeProps {
  status: CommercialActionStatus
  className?: string
}

export function ActionStatusBadge({ status, className }: ActionStatusBadgeProps) {
  const config: Record<CommercialActionStatus, { label: string; class: string }> = {
    pendente: {
      label: 'Pendente',
      class: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold',
    },
    em_andamento: {
      label: 'Em Andamento',
      class: 'bg-blue-50 text-blue-700 border-blue-300 font-semibold',
    },
    concluida: {
      label: 'Concluída',
      class: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold',
    },
    reagendada: {
      label: 'Reagendada',
      class: 'bg-purple-50 text-purple-700 border-purple-300 font-semibold',
    },
    nao_realizada: {
      label: 'Não Realizada',
      class: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold',
    },
    cancelada: {
      label: 'Cancelada',
      class: 'bg-slate-100 text-slate-600 border-slate-300 font-medium',
    },
  }

  const item = config[status] || config.pendente

  return (
    <Badge
      variant="outline"
      className={cn('text-[10px] py-0.5 px-2 font-sans', item.class, className)}
    >
      {item.label}
    </Badge>
  )
}
