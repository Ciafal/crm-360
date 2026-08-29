import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { FvaMetricSummary } from '@/types/sop'
import {
  Award,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SopFvaPanelProps {
  fvaSummaries: FvaMetricSummary[]
}

export function SopFvaPanel({ fvaSummaries }: SopFvaPanelProps) {
  return (
    <div className="space-y-6">
      {/* 1. CARDS DE ACCURACY & FVA POR CAMADA */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {fvaSummaries.map((fva) => {
          const isFvaPositive = fva.fvaAverage >= 0

          return (
            <Card
              key={fva.layerName}
              className="rounded-2xl border border-border/60 bg-white shadow-xs overflow-hidden"
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 truncate">{fva.layerName}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px] px-1.5 py-0 font-bold',
                      fva.bias === 'OPTIMISM'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : fva.bias === 'CONSERVATIVE'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300',
                    )}
                  >
                    {fva.bias === 'OPTIMISM'
                      ? 'Viés Otimista'
                      : fva.bias === 'CONSERVATIVE'
                        ? 'Viés Conservador'
                        : 'Neutro'}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="font-serif text-2xl font-bold text-slate-900 font-mono">
                    {fva.accuracyPercent}%
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>WAPE: {fva.wapePercent}%</span>
                    <span>MAE: {fva.maeValue} t</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">FVA vs Camada Ant.:</span>
                  <span
                    className={cn(
                      'text-xs font-bold font-mono',
                      fva.fvaAverage > 0
                        ? 'text-emerald-700'
                        : fva.fvaAverage < 0
                          ? 'text-rose-600'
                          : 'text-slate-500',
                    )}
                  >
                    {fva.fvaAverage > 0 ? `+${fva.fvaAverage}%` : `${fva.fvaAverage}%`}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 2. REGRA CENTRAL & GOVERNANÇA FVA */}
      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <strong className="text-primary font-bold block">
            Governança Obrigatória: O FVA NÃO é instrumento disciplinar ou punitivo
          </strong>
          <p className="text-slate-700">
            O objetivo exclusivo do FVA (Forecast Value Add) é o aprimoramento contínuo dos
            processos, identificação de viés sistemático (Optimism/Conservative Bias), orientação
            analítica das equipes e retroalimentação do motor de inteligência artificial.
          </p>
        </div>
      </div>

      {/* 3. GRÁFICO COMPARATIVO DE ERRO POR CAMADA (MENOR = MELHOR) */}
      <Card className="rounded-3xl border border-border/60 bg-white/95 shadow-xs overflow-hidden">
        <CardHeader className="p-5 border-b border-border/40 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle className="font-serif text-lg font-bold text-primary">
              Comparativo de Erro por Camada de Intervenção (WAPE % — Menor = Melhor)
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mede matematicamente se cada etapa refinou a assertividade ou introduziu distorção na
            demanda final.
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            {fvaSummaries.map((s) => (
              <div key={s.layerName} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <strong className="text-slate-800">{s.layerName}</strong>
                  <span className="font-mono text-slate-700 font-bold">
                    Erro WAPE: {s.wapePercent}% (Acurácia {s.accuracyPercent}%)
                  </span>
                </div>
                <Progress
                  value={100 - s.wapePercent}
                  className={cn(
                    'h-3 rounded-full',
                    s.wapePercent <= 6
                      ? 'bg-slate-100 [&>div]:bg-emerald-600'
                      : 'bg-slate-100 [&>div]:bg-primary',
                  )}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
