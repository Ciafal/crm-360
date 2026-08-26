import React from 'react'
import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ConfidenceIndicatorProps {
  confidence: number // 0 a 1
  className?: string
  showBar?: boolean
}

export function ConfidenceIndicator({
  confidence,
  className,
  showBar = false,
}: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100)

  let colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200'
  let barColor = 'bg-emerald-500'

  if (percentage < 70) {
    colorClass = 'text-amber-700 bg-amber-50 border-amber-200'
    barColor = 'bg-amber-500'
  }
  if (percentage < 50) {
    colorClass = 'text-slate-700 bg-slate-50 border-slate-200'
    barColor = 'bg-slate-400'
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Badge
        variant="outline"
        className={cn('text-[10px] py-0.5 px-2 flex items-center gap-1 font-semibold', colorClass)}
      >
        <Sparkles className="w-3 h-3" />
        <span>{percentage}% IA</span>
      </Badge>
      {showBar && (
        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full', barColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}
