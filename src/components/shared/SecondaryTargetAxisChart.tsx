import React from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, Info } from 'lucide-react'
import { TargetGapArea, ActualSeries, TargetSeries, ForecastSeries } from './TargetGapArea'
import { AverageReferenceLine, PaceReferenceLine } from './ChartReferenceLines'
import { cn, formatNumberBR } from '@/lib/utils'

export type TimePeriodFilter = 'MES' | 'YTD' | '12_MESES' | 'ANO' | 'PERIODO'

export interface PerformanceChartDataPoint {
  label: string
  period?: string
  realizado: number // Volume / Toneladas ou R$
  meta: number // Meta Mensal ou Acumulada
  forecast?: number // Projeção
  anoAnterior?: number // Comparativo YTD ano anterior
  // Sombreados de gap
  gapPositivo?: number
  gapNegativo?: number
  [key: string]: any
}

export interface SecondaryTargetAxisChartProps {
  title: string
  subtitle?: string
  data: PerformanceChartDataPoint[]
  unit?: string // Ex: 't' ou 'R$'
  metricType?: 'TONELADAS' | 'REAIS'
  isCurrency?: boolean
  selectedPeriod?: TimePeriodFilter
  onPeriodChange?: (period: TimePeriodFilter) => void
  showPeriodSelector?: boolean
  showForecast?: boolean
  showGapArea?: boolean
  showPreviousYearYTD?: boolean
  showAverageLine?: boolean
  averageValue?: number
  averageLabel?: string
  showPaceLine?: boolean
  paceValue?: number
  paceLabel?: string
  height?: number
  aiAnalysis?: {
    summary: string
    factors: Array<{
      title: string
      impactTons?: number
      impactBrl?: number
      source: 'CRM' | 'SAP ECC' | 'Qlik' | 'WMS' | 'TMS' | 'Gestão de Performance' | 'IA'
      evidence: string
    }>
    recommendation: string
  }
}

/**
 * Padrão Corporativo de Gráficos CRM 360º CIAFAL:
 * - Realizado: Barras ou linha principal sólida
 * - Meta: Linha no segundo eixo / eixo de referência (ou linha primária sólida contrastante)
 * - Projeção (Forecast): Linha tracejada (strokeDasharray)
 * - Gap: Área sombreada entre Realizado/Forecast e Meta
 * - Seletor YTD / Mês / 12 Meses
 * - Painel integrado com "Análise da IA" explicativa dos gaps e correlação multissistema
 */
export function SecondaryTargetAxisChart({
  title,
  subtitle,
  data,
  unit = 't',
  metricType = 'TONELADAS',
  isCurrency = false,
  selectedPeriod = 'YTD',
  onPeriodChange,
  showPeriodSelector = true,
  showForecast = true,
  showGapArea = true,
  showPreviousYearYTD = false,
  showAverageLine = true,
  averageValue,
  averageLabel = 'Média Histórica',
  showPaceLine = true,
  paceValue,
  paceLabel = 'Ritmo Atual Projetado',
  height = 300,
  aiAnalysis,
}: SecondaryTargetAxisChartProps) {
  const [internalPeriod, setInternalPeriod] = React.useState<TimePeriodFilter>(selectedPeriod)
  const [showAiDetail, setShowAiDetail] = React.useState(false)

  const currentPeriod = onPeriodChange ? selectedPeriod : internalPeriod
  const handlePeriodClick = (p: TimePeriodFilter) => {
    if (onPeriodChange) {
      onPeriodChange(p)
    } else {
      setInternalPeriod(p)
    }
  }

  // Formatação de valor
  const formatValue = (val: number) => {
    if (isCurrency || metricType === 'REAIS') {
      return val >= 1_000_000
        ? `R$ ${(val / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} mi`
        : `R$ ${(val / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
    }
    return `${formatNumberBR(val, val % 1 === 0 ? 0 : 1)} ${unit}`
  }

  // Calcula média dos dados realizados se não informada
  const calculatedAverage = React.useMemo(() => {
    if (averageValue !== undefined) return averageValue
    const validPoints = data.filter((d) => d.realizado > 0)
    if (!validPoints.length) return 0
    const sum = validPoints.reduce((acc, d) => acc + d.realizado, 0)
    return Math.round((sum / validPoints.length) * 10) / 10
  }, [data, averageValue])

  // Ritmo projetado padrão caso não informado
  const calculatedPace = React.useMemo(() => {
    if (paceValue !== undefined) return paceValue
    const lastActive = [...data].reverse().find((d) => d.forecast && d.forecast > 0)
    return lastActive?.forecast || 0
  }, [data, paceValue])

  // Prepara dados com áreas de gap calculadas
  const processedData = React.useMemo(() => {
    return data.map((d) => {
      const realOrForecast = d.realizado > 0 ? d.realizado : d.forecast || 0
      const diff = realOrForecast - d.meta
      return {
        ...d,
        // Gap calculado para exibição sombreada
        gapPositivo: diff > 0 ? diff : 0,
        gapNegativo: diff < 0 ? Math.abs(diff) : 0,
      }
    })
  }, [data])

  return (
    <Card className="p-4 rounded-2xl border border-border/60 bg-white shadow-xs space-y-4">
      {/* Header com Título, Subtítulo e Seletor de Período Temporal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-base text-primary">{title}</h3>
            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 font-mono">
              SAP ECC + Qlik
            </Badge>
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        {showPeriodSelector && (
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-border/40 self-start sm:self-auto text-xs">
            {(['MES', 'YTD', '12_MESES', 'ANO'] as TimePeriodFilter[]).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodClick(period)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all',
                  currentPeriod === period
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60',
                )}
              >
                {period === 'MES'
                  ? 'Mês'
                  : period === 'YTD'
                    ? 'YTD (Jan-Hoje)'
                    : period === '12_MESES'
                      ? '12 Meses'
                      : 'Ano'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gráfico Recharts Composto */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={processedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="realizadoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="gapSurplusGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gapDeficitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />

            {/* Eixo Principal: Realizado / Volume */}
            <YAxis
              yAxisId="principal"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(val) =>
                metricType === 'REAIS' || isCurrency
                  ? val >= 1_000_000
                    ? `${(val / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
                    : `${(val / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
                  : `${val.toLocaleString('pt-BR')} ${unit}`
              }
            />

            {/* Segundo Eixo: Meta & Expectativa */}
            <YAxis
              yAxisId="secundario"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(val) =>
                metricType === 'REAIS' || isCurrency
                  ? val >= 1_000_000
                    ? `${(val / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
                    : `${(val / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
                  : `${val.toLocaleString('pt-BR')} ${unit}`
              }
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null
                const item = payload[0]?.payload as PerformanceChartDataPoint
                const real = item?.realizado || 0
                const meta = item?.meta || 0
                const proj = item?.forecast || 0
                const gap = (real > 0 ? real : proj) - meta
                const gapPercent = meta > 0 ? ((gap / meta) * 100).toFixed(1) : '0'

                return (
                  <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[210px]">
                    <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 flex justify-between">
                      <span>{label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">SAP ECC / Qlik</span>
                    </div>

                    <div className="flex justify-between items-center text-sky-300">
                      <span>• Realizado:</span>
                      <strong className="font-mono">{formatValue(real)}</strong>
                    </div>

                    <div className="flex justify-between items-center text-amber-300">
                      <span>— Meta (Referência):</span>
                      <strong className="font-mono">{formatValue(meta)}</strong>
                    </div>

                    {showForecast && proj > 0 && (
                      <div className="flex justify-between items-center text-indigo-300">
                        <span>⋯⋯ Forecast (Projeção):</span>
                        <strong className="font-mono">{formatValue(proj)}</strong>
                      </div>
                    )}

                    {showPreviousYearYTD && item.anoAnterior !== undefined && (
                      <div className="flex justify-between items-center text-slate-400">
                        <span>┄┄ Ano Anterior YTD:</span>
                        <strong className="font-mono">{formatValue(item.anoAnterior)}</strong>
                      </div>
                    )}

                    <div className="border-t border-slate-700 pt-1 flex justify-between items-center">
                      <span className="text-slate-300">Gap vs Meta:</span>
                      <span
                        className={cn(
                          'font-bold font-mono',
                          gap >= 0 ? 'text-emerald-400' : 'text-amber-400',
                        )}
                      >
                        {gap >= 0 ? '+' : ''}
                        {formatValue(gap)} ({gapPercent}%)
                      </span>
                    </div>
                  </div>
                )
              }}
            />

            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            />

            {/* ÁREA SOMBREADA DE GAP (TargetGapArea) */}
            {showGapArea && <TargetGapArea yAxisId="principal" />}

            {/* REALIZADO: Barras no eixo principal */}
            <ActualSeries yAxisId="principal" type="bar" />

            {/* META: Linha no segundo eixo (Padrão Corporativo Obrigatório) */}
            <TargetSeries yAxisId="secundario" stroke="#f59e0b" />

            {/* FORECAST / PROJEÇÃO: Linha Tracejada Diferenciada */}
            {showForecast && <ForecastSeries yAxisId="secundario" stroke="#6366f1" />}

            {/* LINHA DE MÉDIA AUXILIAR (AverageReferenceLine) */}
            {showAverageLine && calculatedAverage > 0 && (
              <AverageReferenceLine
                value={calculatedAverage}
                label={averageLabel}
                yAxisId="principal"
                unit={unit}
                isCurrency={isCurrency || metricType === 'REAIS'}
              />
            )}

            {/* LINHA DE RITMO CALCULADO (PaceReferenceLine) */}
            {showPaceLine && calculatedPace > 0 && (
              <PaceReferenceLine
                value={calculatedPace}
                label={paceLabel}
                yAxisId="secundario"
                unit={unit}
                isCurrency={isCurrency || metricType === 'REAIS'}
              />
            )}

            {/* YTD COMPARATIVO ANO ANTERIOR */}
            {showPreviousYearYTD && (
              <Line
                yAxisId="principal"
                type="monotone"
                dataKey="anoAnterior"
                name="YTD Ano Anterior"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* PAINEL DE ANÁLISE DA IA EXPLICANDO O GAP E PERFORMANCE (OBRIGATÓRIO) */}
      {aiAnalysis && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-md border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/30 text-amber-400 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-serif font-bold text-sm text-amber-300">
                Análise da IA — Diagnóstico de Gap & Correlação de Fatos
              </h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAiDetail(!showAiDetail)}
              className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {showAiDetail ? 'Recolher Fatores' : 'Ver Fatores & Evidências'}
            </Button>
          </div>

          <p className="text-xs text-slate-200 font-medium leading-relaxed">{aiAnalysis.summary}</p>

          {showAiDetail && (
            <div className="space-y-2 pt-2 border-t border-slate-800 animate-fade-in text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Fatores Investigados & Rastreabilidade Multissistema:
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {aiAnalysis.factors.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{f.title}</span>
                      <Badge className="bg-slate-800 text-amber-300 border-slate-700 text-[9px] font-mono">
                        Fonte: {f.source}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      <strong>Evidência:</strong> {f.evidence}
                    </p>
                    {f.impactTons !== undefined && (
                      <span className="text-[10px] text-amber-400 font-semibold block">
                        Impacto estimado: {f.impactTons.toLocaleString('pt-BR')} t
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-200">
            <strong>Ação Recomendada pela IA:</strong> {aiAnalysis.recommendation}
          </div>
        </div>
      )}
    </Card>
  )
}
