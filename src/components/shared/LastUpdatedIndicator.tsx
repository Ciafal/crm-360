import React from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LastUpdatedIndicatorProps {
  date?: string | Date
  source?: string
  className?: string
}

export function LastUpdatedIndicator({
  date = new Date(),
  source = 'Qlik',
  className,
}: LastUpdatedIndicatorProps) {
  const d = typeof date === 'string' ? new Date(date) : date
  const dateStr = d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const timeStr = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1 bg-white/70 border border-border/50 rounded-full shadow-xs',
        className,
      )}
    >
      <Clock className="w-3.5 h-3.5 text-slate-400" />
      <span>
        Atualizado em:{' '}
        <strong className="text-slate-700">
          {dateStr} {timeStr}
        </strong>
        {source ? ` (${source})` : ''}
      </span>
    </div>
  )
}
