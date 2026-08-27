import React from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, XCircle, Clock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StockSituation } from '@/types/quotation'

interface StockBadgeProps {
  situation: StockSituation
  className?: string
  showIcon?: boolean
}

export function StockBadge({ situation, className, showIcon = true }: StockBadgeProps) {
  switch (situation) {
    case 'ESTOQUE_SUFICIENTE':
      return (
        <Badge
          className={cn(
            'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px] gap-1 hover:bg-emerald-200',
            className,
          )}
        >
          {showIcon && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
          Estoque Suficiente
        </Badge>
      )
    case 'ESTOQUE_BAIXO':
      return (
        <Badge
          className={cn(
            'bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px] gap-1 hover:bg-amber-200',
            className,
          )}
        >
          {showIcon && <AlertTriangle className="w-3 h-3 text-amber-700" />}
          Estoque Baixo (&lt; 5t)
        </Badge>
      )
    case 'SEM_ESTOQUE':
      return (
        <Badge
          className={cn(
            'bg-rose-100 text-rose-800 border-rose-300 font-bold text-[10px] gap-1 hover:bg-rose-200',
            className,
          )}
        >
          {showIcon && <XCircle className="w-3 h-3 text-rose-700" />}
          Sem Estoque
        </Badge>
      )
    case 'AGUARDANDO_CONFIRMACAO':
      return (
        <Badge
          className={cn(
            'bg-orange-100 text-orange-800 border-orange-300 font-bold text-[10px] gap-1 hover:bg-orange-200 animate-pulse',
            className,
          )}
        >
          {showIcon && <Clock className="w-3 h-3 text-orange-700" />}
          Aguardando Confirmação
        </Badge>
      )
    case 'CONFIRMADO':
      return (
        <Badge
          className={cn(
            'bg-emerald-600 text-white border-none font-bold text-[10px] gap-1 hover:bg-emerald-700',
            className,
          )}
        >
          {showIcon && <Check className="w-3 h-3" />}
          Confirmado
        </Badge>
      )
    case 'CONFIRMADO_PARCIAL':
      return (
        <Badge
          className={cn(
            'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold text-[10px] gap-1 hover:bg-cyan-200',
            className,
          )}
        >
          {showIcon && <AlertTriangle className="w-3 h-3 text-cyan-700" />}
          Confirmado Parcialmente
        </Badge>
      )
    case 'CONFIRMACAO_NEGADA':
      return (
        <Badge
          className={cn(
            'bg-red-600 text-white border-none font-bold text-[10px] gap-1 hover:bg-red-700',
            className,
          )}
        >
          {showIcon && <XCircle className="w-3 h-3" />}
          Confirmação Negada
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className={cn('text-[10px] font-semibold', className)}>
          {situation}
        </Badge>
      )
  }
}
