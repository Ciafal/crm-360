import React from 'react'
import { Badge } from '@/components/ui/badge'
import { ArrowDownRight, ArrowUpRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PriceDeviationBadgeProps {
  deviationPct: number
  className?: string
}

export function PriceDeviationBadge({ deviationPct, className }: PriceDeviationBadgeProps) {
  if (Math.abs(deviationPct) < 0.01) {
    return (
      <Badge
        className={cn(
          'bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-mono font-bold gap-0.5',
          className,
        )}
      >
        <Check className="w-2.5 h-2.5 text-emerald-600" /> 0.0% (SAP)
      </Badge>
    )
  }

  if (deviationPct < 0) {
    const isHigh = Math.abs(deviationPct) > 7.0
    return (
      <Badge
        className={cn(
          'text-[10px] font-mono font-bold gap-0.5 border',
          isHigh
            ? 'bg-rose-100 text-rose-800 border-rose-300'
            : 'bg-amber-100 text-amber-800 border-amber-300',
          className,
        )}
      >
        <ArrowDownRight className="w-3 h-3" />
        {deviationPct.toFixed(2)}%
      </Badge>
    )
  }

  return (
    <Badge
      className={cn(
        'bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold gap-0.5',
        className,
      )}
    >
      <ArrowUpRight className="w-3 h-3" />+{deviationPct.toFixed(2)}%
    </Badge>
  )
}
