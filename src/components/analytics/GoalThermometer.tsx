import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, CheckCircle2, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react'
import { cn, formatNumberBR } from '@/lib/utils'

export interface GoalThermometerProps {
  percent: number // Ex: 84.5
  metaLabel?: string
  realizadoLabel?: string
  excessLabel?: string
  showScale?: boolean
  className?: string
  compact?: boolean
  customTitle?: string
}

export function GoalThermometer({
  percent,
  metaLabel = 'Meta (100%)',
  realizadoLabel,
  excessLabel,
  showScale = true,
  className,
  compact = false,
  customTitle = 'Termômetro da Meta',
}: GoalThermometerProps) {
  // Clamped for progress bar (scale 0% to 120% mapped to 0-100% width)
  // Scale markers: 0%, 50%, 80%, 100%, 120%
  const maxScale = 120
  const normalizedWidth = Math.min(Math.max((percent / maxScale) * 100, 0), 100)
  const isAbove100 = percent >= 100
  const isCritical = percent < 80
  const isWarning = percent >= 80 && percent < 100
  const excess = isAbove100 ? percent - 100 : 0

  const statusColor = isAbove100
    ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
    : isWarning
      ? 'text-amber-700 bg-amber-50 border-amber-300'
      : 'text-rose-700 bg-rose-50 border-rose-300'

  return (
    <Card
      className={cn(
        'p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-800">
              {customTitle}
            </h4>
            {!compact && (
              <p className="text-[11px] text-muted-foreground">
                Escala executiva 0% → 50% → 80% → 100% → 120%
              </p>
            )}
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn('text-xs font-bold font-mono px-2 py-0.5', statusColor)}
        >
          {formatNumberBR(percent, 1)}% atingido
        </Badge>
      </div>

      {/* Thermometer Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="relative w-full h-5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          {/* Shaded zone markers */}
          {/* Critical zone: 0 to 80% -> (80/120)*100 = 66.6% */}
          <div className="absolute left-0 top-0 bottom-0 w-[66.6%] bg-rose-500/10" />
          {/* Warning zone: 80 to 100% -> (20/120)*100 = 16.6% */}
          <div className="absolute left-[66.6%] top-0 bottom-0 w-[16.6%] bg-amber-500/15" />
          {/* Above goal zone: 100 to 120% -> (20/120)*100 = 16.6% */}
          <div className="absolute left-[83.3%] top-0 bottom-0 right-0 bg-emerald-500/15" />

          {/* 100% Target Mark line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-slate-900 z-20 shadow-xs"
            style={{ left: '83.33%' }}
            title="Posição da Meta (100%)"
          />

          {/* Progress fill */}
          <div
            className={cn(
              'h-full transition-all duration-700 rounded-full',
              isAbove100
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                : isWarning
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                  : 'bg-gradient-to-r from-rose-500 to-rose-600',
            )}
            style={{ width: `${normalizedWidth}%` }}
          />
        </div>

        {/* Scale labels */}
        {showScale && (
          <div className="relative w-full text-[10px] font-mono text-muted-foreground flex justify-between px-0.5">
            <span>0%</span>
            <span style={{ left: '41.6%', position: 'absolute', transform: 'translateX(-50%)' }}>
              50%
            </span>
            <span style={{ left: '66.6%', position: 'absolute', transform: 'translateX(-50%)' }}>
              80%
            </span>
            <span
              className="font-bold text-slate-900"
              style={{ left: '83.3%', position: 'absolute', transform: 'translateX(-50%)' }}
            >
              100% (Meta)
            </span>
            <span>120%+</span>
          </div>
        )}
      </div>

      {/* Summary message */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        {isAbove100 ? (
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Superávit de +{formatNumberBR(excess, 1)}% acima da meta estabelecida
          </span>
        ) : isWarning ? (
          <span className="text-amber-700 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Trajetória de fechamento — faltam {formatNumberBR(100 - percent, 1)}% para a meta
          </span>
        ) : (
          <span className="text-rose-700 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Déficit crítico — faltam {formatNumberBR(100 - percent, 1)}% para a meta
          </span>
        )}

        {realizadoLabel && <span className="text-muted-foreground">{realizadoLabel}</span>}
      </div>
    </Card>
  )
}
