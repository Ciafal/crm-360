import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RfmSegment } from '@/types/models'

interface RFMSegmentBadgeProps {
  segment: RfmSegment | string
  className?: string
}

export function RFMSegmentBadge({ segment, className }: RFMSegmentBadgeProps) {
  const segmentClass: Record<string, string> = {
    Campeões: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    Leais: 'bg-teal-50 text-teal-800 border-teal-300 font-semibold',
    Potenciais: 'bg-sky-50 text-sky-800 border-sky-300 font-semibold',
    'Novos/ocasionais': 'bg-blue-50 text-blue-800 border-blue-300 font-medium',
    'Precisam de atenção': 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
    'Em risco': 'bg-orange-50 text-orange-800 border-orange-300 font-bold',
    'Prestes a hibernar': 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
    Hibernando: 'bg-purple-50 text-purple-800 border-purple-300 font-medium',
    Perdidos: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
  }

  const badgeClass =
    segmentClass[segment] || 'bg-slate-100 text-slate-700 border-slate-300 font-medium'

  return (
    <Badge
      variant="outline"
      className={cn('text-[10px] py-0.5 px-2 font-sans tracking-tight', badgeClass, className)}
    >
      {segment}
    </Badge>
  )
}
