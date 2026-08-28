import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Flame, Gauge, TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { cn, formatNumberBR, formatWeight, formatCurrency } from '@/lib/utils'

export interface PaceComparisonWidgetProps {
  ritmoAtual: number // Ex: 37.5 t/dia
  ritmoNecessario: number // Ex: 46.7 t/dia
  mediaHistorica?: number
  unidade?: 't/dia' | 'R$/dia'
  diasUteisPassados?: number
  diasUteisRestantes?: number
  metaTotal?: number
  realizadoTotal?: number
  gapTotal?: number
  isCurrency?: boolean
  className?: string
  showDetailedCards?: boolean
}

export function PaceComparisonWidget({
  ritmoAtual,
  ritmoNecessario,
  mediaHistorica,
  unidade = 't/dia',
  diasUteisPassados = 14,
  diasUteisRestantes = 8,
  metaTotal,
  realizadoTotal,
  gapTotal,
  isCurrency = false,
  className,
  showDetailedCards = true,
}: PaceComparisonWidgetProps) {
  const isSufficient = ritmoAtual >= ritmoNecessario
  const diff = ritmoNecessario - ritmoAtual
  const accelerationPct =
    ritmoAtual > 0 && ritmoNecessario > 0 ? ((ritmoNecessario - ritmoAtual) / ritmoAtual) * 100 : 0

  const formatUnitValue = (val: number) => {
    if (unidade === 'R$/dia' || isCurrency) {
      return val >= 1000
        ? `R$ ${(val / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil/dia`
        : `R$ ${val.toLocaleString('pt-BR')}/dia`
    }
    return `${formatNumberBR(val, 1)} t/dia`
  }

  return (
    <Card
      className={cn(
        'p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'p-1.5 rounded-lg',
              isSufficient ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
            )}
          >
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-900">
              Ritmo Atual × Necessário
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Velocidade de fechamento baseada em {diasUteisRestantes} dias úteis restantes
            </p>
          </div>
        </div>

        <Badge
          className={cn(
            'text-[10px] font-bold border-none px-2.5 py-0.5',
            isSufficient ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white',
          )}
        >
          {isSufficient ? 'RITMO SUFICIENTE' : 'ACELERAÇÃO NECESSÁRIA'}
        </Badge>
      </div>

      {/* Side by side comparison */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/90 rounded-xl border border-slate-200/80">
        <div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Ritmo Atual ({diasUteisPassados} dias passados)
          </span>
          <span
            className={cn(
              'font-serif text-2xl font-bold block mt-0.5',
              isSufficient ? 'text-emerald-700' : 'text-slate-800',
            )}
          >
            {formatUnitValue(ritmoAtual)}
          </span>
          {mediaHistorica && (
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Média histórica: {formatUnitValue(mediaHistorica)}
            </span>
          )}
        </div>

        <div className="border-l border-slate-200 pl-3">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Ritmo Necessário ({diasUteisRestantes} dias restantes)
          </span>
          <span className="font-serif text-2xl font-bold text-primary block mt-0.5">
            {formatUnitValue(ritmoNecessario)}
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">
            Meta restante:{' '}
            {gapTotal !== undefined
              ? unidade === 't/dia'
                ? formatWeight(gapTotal, 0)
                : formatCurrency(gapTotal)
              : '-'}
          </span>
        </div>
      </div>

      {/* Callout textual objetivo com regra de negócio estrita */}
      <div
        className={cn(
          'p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2',
          isSufficient
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/80 border-amber-200 text-amber-900',
        )}
      >
        {isSufficient ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div>
          {isSufficient ? (
            <span>
              <strong>Ritmo atual suficiente para atingir a meta.</strong> Mantendo a média de{' '}
              {formatUnitValue(ritmoAtual)}, a projeção fechará acima da meta estipulada.
            </span>
          ) : (
            <span>
              <strong>Necessário acelerar +{formatNumberBR(accelerationPct, 1)}%</strong> (+
              {formatUnitValue(diff)}) nas vendas diárias durante os próximos {diasUteisRestantes}{' '}
              dias úteis para cobrir o gap de{' '}
              {gapTotal !== undefined
                ? unidade === 't/dia'
                  ? formatWeight(gapTotal, 0)
                  : formatCurrency(gapTotal)
                : ''}
              .
            </span>
          )}
        </div>
      </div>

      {showDetailedCards &&
        metaTotal !== undefined &&
        realizadoTotal !== undefined &&
        gapTotal !== undefined && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="p-2 bg-slate-50 rounded-xl border">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Realizado
              </span>
              <strong className="text-slate-900 font-serif">
                {unidade === 't/dia'
                  ? formatWeight(realizadoTotal, 0)
                  : formatCurrency(realizadoTotal)}
              </strong>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Meta
              </span>
              <strong className="text-primary font-serif">
                {unidade === 't/dia' ? formatWeight(metaTotal, 0) : formatCurrency(metaTotal)}
              </strong>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Gap</span>
              <strong className="text-amber-700 font-serif">
                {unidade === 't/dia' ? formatWeight(gapTotal, 0) : formatCurrency(gapTotal)}
              </strong>
            </div>
          </div>
        )}
    </Card>
  )
}
