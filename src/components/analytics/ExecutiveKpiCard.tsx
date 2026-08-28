import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ExecutiveKpiCardProps {
  title: string
  subtitle?: string
  value: string | number
  unit?: string
  secondaryValue?: string
  comparisonText?: string // Ex: "+5,0% vs. mesmo período do ano anterior"
  comparisonType?: 'positive' | 'negative' | 'neutral'
  badge?: {
    text: string
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  }
  icon?: React.ComponentType<{ className?: string }>
  statusColor?: 'emerald' | 'amber' | 'rose' | 'primary' | 'slate'
  tooltip?: string
  onClick?: () => void
  highlight?: boolean
  className?: string
}

export function ExecutiveKpiCard({
  title,
  subtitle,
  value,
  unit,
  secondaryValue,
  comparisonText,
  comparisonType = 'neutral',
  badge,
  icon: Icon,
  statusColor = 'primary',
  tooltip,
  onClick,
  highlight = false,
  className,
}: ExecutiveKpiCardProps) {
  const badgeStyles = {
    default: 'bg-slate-100 text-slate-800 border-none',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    outline: 'bg-transparent text-slate-700 border-slate-300',
  }

  const borderTopColor = {
    primary: 'border-t-primary',
    emerald: 'border-t-emerald-600',
    amber: 'border-t-amber-500',
    rose: 'border-t-rose-600',
    slate: 'border-t-slate-300',
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs transition-all flex flex-col justify-between relative overflow-hidden',
        highlight && 'border-t-4 shadow-sm',
        highlight && borderTopColor[statusColor],
        onClick && 'cursor-pointer hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5',
        className,
      )}
    >
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {title}
            </span>
            {tooltip && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-slate-400 hover:text-slate-700 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-xs bg-slate-900 text-white p-2">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="flex items-center gap-1">
            {badge && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-semibold px-2 py-0',
                  badgeStyles[badge.variant || 'default'],
                )}
              >
                {badge.text}
              </Badge>
            )}
            {Icon && (
              <div className="p-1.5 rounded-lg bg-primary/5 text-primary">
                <Icon className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-serif text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </span>
          {unit && <span className="text-xs font-semibold text-muted-foreground">{unit}</span>}
        </div>

        {secondaryValue && (
          <p className="text-[11px] text-muted-foreground font-medium">{secondaryValue}</p>
        )}
      </div>

      {(comparisonText || subtitle) && (
        <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          {comparisonText && (
            <div
              className={cn(
                'flex items-center gap-1 font-semibold truncate',
                comparisonType === 'positive' && 'text-emerald-700',
                comparisonType === 'negative' && 'text-rose-700',
                comparisonType === 'neutral' && 'text-slate-600',
              )}
            >
              {comparisonType === 'positive' && <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />}
              {comparisonType === 'negative' && <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />}
              {comparisonType === 'neutral' && <Minus className="w-3 h-3 shrink-0" />}
              <span className="truncate">{comparisonText}</span>
            </div>
          )}
          {subtitle && !comparisonText && (
            <span className="text-muted-foreground truncate">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  )
}
