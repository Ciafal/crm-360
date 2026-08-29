import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Target, TrendingUp, Sparkles, Clock, Calendar, AlertTriangle } from 'lucide-react'
import type { GoalPaceMetrics } from '@/types/cockpit'

interface GoalThermometerProps {
  goalMetrics: GoalPaceMetrics
  unit: 'REVENUE' | 'TONS'
}

export function GoalThermometer({ goalMetrics, unit }: GoalThermometerProps) {
  const isTons = unit === 'TONS'

  const metaValue = isTons ? goalMetrics.metaTons : goalMetrics.metaReais
  const realizadoValue = isTons ? goalMetrics.realizadoTons : goalMetrics.realizadoReais
  const gapValue = isTons ? goalMetrics.gapTons : goalMetrics.gapReais
  const atingimento = isTons ? goalMetrics.atingimentoTonsPct : goalMetrics.atingimentoReaisPct

  const formatUnit = (val: number) => {
    if (isTons) {
      return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`
    }
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  const formatAltUnit = (valTons: number, valReais: number) => {
    if (isTons) {
      return valReais.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      })
    }
    return `${valTons.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`
  }

  const isAboveExpected = goalMetrics.gapRitmoPp >= 0

  return (
    <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        {/* Cabeçalho do Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-primary">
                Termômetro de Atingimento da Meta
              </h3>
              <p className="text-xs text-muted-foreground">
                Acompanhamento contínuo vs posição esperada por dias úteis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={`text-xs font-bold border-none px-2.5 py-1 ${
                atingimento >= 100
                  ? 'bg-emerald-100 text-emerald-800'
                  : atingimento >= 70
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
              }`}
            >
              {atingimento.toFixed(1)}% Atingido
            </Badge>

            <Badge
              variant="outline"
              className={`text-xs font-semibold ${
                isAboveExpected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}
            >
              {isAboveExpected
                ? `+${goalMetrics.gapRitmoPp.toFixed(1)} p.p. acima do ritmo esperado`
                : `${goalMetrics.gapRitmoPp.toFixed(1)} p.p. abaixo do esperado`}
            </Badge>
          </div>
        </div>

        {/* Grade de 3 Blocos: Meta / Realizado / Gap */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-border/40 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Meta Mensal ({isTons ? 't' : 'R$'})
            </span>
            <span className="font-serif text-xl font-bold text-slate-900 block">
              {formatUnit(metaValue)}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              Equivalente: {formatAltUnit(goalMetrics.metaTons, goalMetrics.metaReais)}
            </span>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Realizado MTD
            </span>
            <span className="font-serif text-xl font-bold text-emerald-700 block">
              {formatUnit(realizadoValue)}
            </span>
            <span className="text-[10px] text-emerald-800 font-medium block">
              Equivalente: {formatAltUnit(goalMetrics.realizadoTons, goalMetrics.realizadoReais)}
            </span>
          </div>

          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
              Gap Faltante
            </span>
            <span className="font-serif text-xl font-bold text-amber-600 block">
              {formatUnit(gapValue)}
            </span>
            <span className="text-[10px] text-amber-800 font-medium block">
              Equivalente: {formatAltUnit(goalMetrics.gapTons, goalMetrics.gapReais)}
            </span>
          </div>
        </div>

        {/* Barra de Progresso do Termômetro com Marcador Esperado */}
        <div className="space-y-2 relative pt-2">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>0%</span>
            <span className="text-primary font-semibold">
              Esperado hoje: {goalMetrics.metaEsperadaNaDataPct.toFixed(1)}% (Dia{' '}
              {goalMetrics.diasUteisTranscorridos}/{goalMetrics.diasUteisTotais})
            </span>
            <span>100% Meta</span>
          </div>

          <div className="relative">
            <Progress
              value={Math.min(atingimento, 100)}
              className="h-4 bg-slate-100 rounded-full"
            />
            {/* Marcador da Linha Esperada */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-slate-900 rounded-full shadow-xs"
              style={{ left: `${Math.min(goalMetrics.metaEsperadaNaDataPct, 100)}%` }}
              title={`Posição esperada na data: ${goalMetrics.metaEsperadaNaDataPct.toFixed(1)}%`}
            />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {goalMetrics.diasUteisTranscorridos} dias úteis transcorridos
            </span>
            <span className="font-semibold text-primary flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {goalMetrics.diasUteisRestantes} dias úteis restantes
            </span>
          </div>
        </div>
      </div>

      {/* Projeção de Fechamento: Linear vs Previsão IA */}
      <div className="p-3.5 bg-gradient-to-r from-slate-50 to-primary/5 rounded-2xl border border-primary/20 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Projeção de Fechamento (Linear vs IA)
          </span>
          <Badge className="bg-primary text-white text-[10px]">
            {goalMetrics.projecaoIaAtingimentoPct.toFixed(1)}% Previsto
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-white rounded-xl border border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Projeção Linear (Ritmo Atual)
            </span>
            <strong className="text-slate-800 font-mono text-sm block mt-0.5">
              {isTons
                ? formatUnit(goalMetrics.projecaoLinearTons)
                : formatUnit(goalMetrics.projecaoLinearReais)}
            </strong>
            <span className="text-[10px] text-muted-foreground">
              Extrapolação matemática direta
            </span>
          </div>

          <div className="p-2.5 bg-sky-50/70 rounded-xl border border-sky-200">
            <span className="text-[10px] text-sky-800 uppercase font-bold block">
              Previsão com IA (Histórico + Sazonalidade)
            </span>
            <strong className="text-sky-950 font-mono text-sm block mt-0.5">
              {isTons
                ? formatUnit(goalMetrics.previsaoIaTons)
                : formatUnit(goalMetrics.previsaoIaReais)}
            </strong>
            <span className="text-[10px] text-sky-700 font-medium">
              Considera pipeline ponderado e fechamentos de fim de mês
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
