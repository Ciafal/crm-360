import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PriorityBadgeProps {
  priority: number // 1 a 5 ou 0 a 100
  className?: string
  showLabel?: boolean
}

export function PriorityBadge({ priority, className, showLabel = true }: PriorityBadgeProps) {
  // Normaliza prioridade para escala 1-5 se vier 0-100
  let normPriority = priority
  if (priority > 5) {
    if (priority >= 85) normPriority = 5
    else if (priority >= 75) normPriority = 4
    else if (priority >= 60) normPriority = 3
    else if (priority >= 40) normPriority = 2
    else normPriority = 1
  }

  const config: Record<number, { label: string; class: string; dotClass: string }> = {
    5: {
      label: 'Crítica / P1',
      class: 'bg-rose-50 text-rose-700 border-rose-300 font-bold',
      dotClass: 'bg-rose-500',
    },
    4: {
      label: 'Alta / P2',
      class: 'bg-amber-50 text-amber-700 border-amber-300 font-bold',
      dotClass: 'bg-amber-500',
    },
    3: {
      label: 'Média / P3',
      class: 'bg-blue-50 text-blue-700 border-blue-300 font-medium',
      dotClass: 'bg-blue-500',
    },
    2: {
      label: 'Baixa / P4',
      class: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
      dotClass: 'bg-slate-400',
    },
    1: {
      label: 'Mínima / P5',
      class: 'bg-slate-50 text-slate-500 border-slate-200 font-normal',
      dotClass: 'bg-slate-300',
    },
  }

  const current = config[normPriority] || config[3]

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] py-0.5 px-2 flex items-center gap-1.5 shadow-xs',
        current.class,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', current.dotClass)} />
      {showLabel ? current.label : `P${normPriority}`}
    </Badge>
  )
}
