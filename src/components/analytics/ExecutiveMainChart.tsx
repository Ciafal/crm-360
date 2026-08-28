import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  ReferenceLine,
} from 'recharts'
import { Eye, TrendingUp, Sparkles, Filter, ChevronDown, Layers } from 'lucide-react'
import { cn, formatNumberBR, formatCurrency, formatWeight } from '@/lib/utils'

export type ExecutiveMetricMode =
  | 'FATURAMENTO'
  | 'VOLUME'
  | 'MARGEM'
  | 'PEDIDOS'
  | 'CLIENTES_ATIVOS'
  | 'COTACOES'
  | 'CONVERSAO'
  | 'NOVOS_CLIENTES'
  | 'REATIVADOS'

export type PeriodViewMode = 'MES' | 'TRIMESTRE' | 'YTD' | '12_MESES' | 'PERSONALIZADO'

export interface ExecutiveChartPoint {
  label: string
  realizado: number // Barras
  meta: number // Linha contínua
  tendencia: number // Linha pontilhada (projeção)
  anoAnterior?: number // Comparativo ano anterior
  media3Meses?: number
  media6Meses?: number
  mediaEquipe?: number
  gapAbsoluto?: number
  gapPct?: number
  ritmoAtual?: number
  ritmoNecessario?: number
  diasUteisRestantes?: number
  [key: string]: any
}

export interface ExecutiveMainChartProps {
  title?: string
  subtitle?: string
  data: ExecutiveChartPoint[]
  metricMode?: ExecutiveMetricMode
  onMetricModeChange?: (mode: ExecutiveMetricMode) => void
  periodMode?: PeriodViewMode
  onPeriodModeChange?: (mode: PeriodViewMode) => void
  onBarClick?: (point: ExecutiveChartPoint) => void
  showAverageCompareButton?: boolean
  className?: string
  height?: number
}

export function ExecutiveMainChart({
  title,
  subtitle,
  data,
  metricMode = 'VOLUME',
  onMetricModeChange,
  periodMode = 'YTD',
  onPeriodModeChange,
  onBarClick,
  showAverageCompareButton = true,
  className,
  height = 360,
}: ExecutiveMainChartProps) {
  // Controle de referências adicionais (botão "Comparar")
  const [showReferences, setShowReferences] = useState(false)
  const [activeRefs, setActiveRefs] = useState<{
    anoAnterior: boolean
    media3M: boolean
    media6M: boolean
    mediaEquipe: boolean
  }>({
    anoAnterior: true,
    media3M: false,
    media6M: false,
    mediaEquipe: false,
  })

  const getMetricConfig = () => {
    switch (metricMode) {
      case 'FATURAMENTO':
        return {
          title: 'Faturamento Comercial (R$)',
          unit: 'R$',
          isCurrency: true,
          formatter: (v: number) => formatCurrency(v),
        }
      case 'VOLUME':
        return {
          title: 'Volume Comercial em Toneladas (t)',
          unit: 't',
          isCurrency: false,
          formatter: (v: number) => formatWeight(v, 0),
        }
      case 'MARGEM':
        return {
          title: 'Margem de Contribuição (%)',
          unit: '%',
          isCurrency: false,
          formatter: (v: number) => `${formatNumberBR(v, 1)}%`,
        }
      case 'PEDIDOS':
        return {
          title: 'Volume de Pedidos Fechados',
          unit: 'pedidos',
          isCurrency: false,
          formatter: (v: number) => `${formatNumberBR(v, 0)} ped`,
        }
      case 'CLIENTES_ATIVOS':
        return {
          title: 'Clientes Ativos no Mês',
          unit: 'clientes',
          isCurrency: false,
          formatter: (v: number) => `${formatNumberBR(v, 0)} clientes`,
        }
      case 'COTACOES':
        return {
          title: 'Cotações Emitidas / Em Aberto',
          unit: 'cotações',
          isCurrency: false,
          formatter: (v: number) => `${formatNumberBR(v, 0)} cot`,
        }
      case 'CONVERSAO':
        return {
          title: 'Taxa de Conversão de Cotações (%)',
          unit: '%',
          isCurrency: false,
          formatter: (v: number) => `${formatNumberBR(v, 1)}%`,
        }
      case 'NOVOS_CLIENTES':
        return {
          title: 'Novos Clientes Conquistados',
          unit: 'novos',
          isCurrency: false,
          formatter: (v: number) => `${formatNumberBR(v, 0)} novos`,
        }
      case 'REATIVADOS':
        return {
          title: 'Clientes Reativados',
          unit: 'reativados',
          isCurrency: false,
          formatter: (v: number) => `${formatNumberBR(v, 0)} reativ`,
        }
      default:
        return {
          title: 'Volume Comercial em Toneladas (t)',
          unit: 't',
          isCurrency: false,
          formatter: (v: number) => formatWeight(v, 0),
        }
    }
  }

  const metricConfig = getMetricConfig()

  // Process data to calculate hatch gap areas
  const processedData = React.useMemo(() => {
    return data.map((d) => {
      const realOrProj = d.realizado > 0 ? d.realizado : d.tendencia
      const gap = Math.max(0, d.meta - realOrProj)
      return {
        ...d,
        gapCalculado: gap,
        gapBase: Math.min(realOrProj, d.meta),
      }
    })
  }, [data])

  return (
    <Card
      className={cn(
        'p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4',
        className,
      )}
    >
      {/* HEADER EXECUTIVO COM SELETOR DE MÉTRICA E PERÍODO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-lg text-primary tracking-tight">
              {title || metricConfig.title}
            </h3>
            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 font-mono">
              SAP ECC · Realizado × Meta × Tendência
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {subtitle ||
              'Barras = Realizado | Linha Contínua = Meta | Linha Pontilhada = Tendência / Projeção | Área Rachurada = Gap'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor de Período Temporal */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(
              [
                { id: 'MES', label: 'Mês' },
                { id: 'TRIMESTRE', label: 'Trimestre' },
                { id: 'YTD', label: 'YTD (Acumulado)' },
                { id: '12_MESES', label: '12 Meses' },
              ] as { id: PeriodViewMode; label: string }[]
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => onPeriodModeChange?.(p.id)}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all',
                  periodMode === p.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Botão Comparar Referências */}
          {showAverageCompareButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReferences(!showReferences)}
              className={cn(
                'h-8 text-xs gap-1.5 rounded-xl border-slate-300 font-semibold',
                showReferences ? 'bg-primary/10 text-primary border-primary/40' : 'text-slate-700',
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Comparar</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          )}
        </div>
      </div>

      {/* PAINEL FLUTUANTE DE REFERÊNCIAS COMPARATIVAS */}
      {showReferences && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center gap-3 text-xs animate-fade-in">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
            Referências Ativas:
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={activeRefs.anoAnterior}
              onChange={(e) => setActiveRefs({ ...activeRefs, anoAnterior: e.target.checked })}
              className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <span className="text-slate-700">Mesmo Período Ano Anterior (Cinza)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={activeRefs.media3M}
              onChange={(e) => setActiveRefs({ ...activeRefs, media3M: e.target.checked })}
              className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <span className="text-slate-700">Média Móvel 3 Meses (Ciano)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={activeRefs.mediaEquipe}
              onChange={(e) => setActiveRefs({ ...activeRefs, mediaEquipe: e.target.checked })}
              className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <span className="text-slate-700">Média da Equipe (Violeta)</span>
          </label>
        </div>
      )}

      {/* GRÁFICO RECHARTS COMPOSTO (COM HATCH PATTERN PARA GAP) */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={processedData}
            margin={{ top: 15, right: 25, left: 10, bottom: 5 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length) {
                const point = state.activePayload[0].payload as ExecutiveChartPoint
                onBarClick?.(point)
              }
            }}
          >
            <defs>
              {/* Padrão Rachurado Oficial CIAFAL (Diagonal Hatch SVG Pattern) */}
              <pattern
                id="ciafalHatchGap"
                width="8"
                height="8"
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  opacity="0.6"
                />
                <rect width="8" height="8" fill="#fef3c7" opacity="0.25" />
              </pattern>

              {/* Degradê Realizado Azul Pantone 2945 */}
              <linearGradient id="ciafalRealizadoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#005596" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#003366" stopOpacity={0.8} />
              </linearGradient>

              {/* Degradê Gap Vermelho/Amarelo */}
              <linearGradient id="gapGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) =>
                metricConfig.isCurrency
                  ? v >= 1_000_000
                    ? `R$ ${(v / 1_000_000).toFixed(1)} mi`
                    : `R$ ${(v / 1_000).toFixed(0)} mil`
                  : `${v.toLocaleString('pt-BR')} ${metricConfig.unit}`
              }
            />

            {/* TOOLTIP COMPLETO COM INFORMAÇÕES DE GAP, DIAS ÚTEIS E RITMOS */}
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null
                const item = payload[0]?.payload as ExecutiveChartPoint
                const real = item?.realizado || 0
                const meta = item?.meta || 0
                const tend = item?.tendencia || 0
                const realOrProj = real > 0 ? real : tend
                const gapAbs = Math.max(0, meta - realOrProj)
                const gapPct = meta > 0 ? (gapAbs / meta) * 100 : 0
                const diasRest = item?.diasUteisRestantes || 8
                const ritmoAtual = item?.ritmoAtual || (real > 0 ? real / 14 : 0)
                const ritmoNec = item?.ritmoNecessario || (gapAbs > 0 ? gapAbs / diasRest : 0)

                return (
                  <div className="bg-slate-950/95 text-white p-4 rounded-2xl shadow-2xl text-xs space-y-2 border border-slate-800 min-w-[260px]">
                    <div className="font-bold text-slate-100 border-b border-slate-800 pb-1.5 flex justify-between items-center">
                      <span className="font-serif text-sm">{label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">SAP ECC / CIAFAL</span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-sky-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#005596] border border-white/40 inline-block" />
                          Realizado:
                        </span>
                        <strong className="font-mono">{metricConfig.formatter(real)}</strong>
                      </div>

                      <div className="flex justify-between items-center text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-0.5 bg-[#f59e0b] inline-block" />
                          Meta:
                        </span>
                        <strong className="font-mono">{metricConfig.formatter(meta)}</strong>
                      </div>

                      {tend > 0 && (
                        <div className="flex justify-between items-center text-indigo-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-0.5 bg-[#6366f1] border-b border-dashed inline-block" />
                            Tendência / Projeção:
                          </span>
                          <strong className="font-mono">{metricConfig.formatter(tend)}</strong>
                        </div>
                      )}

                      {activeRefs.anoAnterior && item.anoAnterior !== undefined && (
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Mesmo Período Ano Anterior:</span>
                          <strong className="font-mono">
                            {metricConfig.formatter(item.anoAnterior)}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* DETALHES COMPLETOS DO GAP (HOVER NO GAP) */}
                    <div className="border-t border-slate-800 pt-2 space-y-1 bg-amber-950/30 p-2 rounded-xl border border-amber-500/20">
                      <div className="flex justify-between items-center">
                        <span className="text-amber-400 font-bold uppercase text-[10px] tracking-wider">
                          Gap da Meta:
                        </span>
                        <span className="font-mono font-bold text-amber-300">
                          {gapAbs > 0
                            ? `-${metricConfig.formatter(gapAbs)} (${formatNumberBR(gapPct, 1)}%)`
                            : 'Meta Atingida'}
                        </span>
                      </div>

                      {gapAbs > 0 && (
                        <>
                          <div className="flex justify-between text-[11px] text-slate-300">
                            <span>Dias Úteis Restantes:</span>
                            <strong className="font-mono">{diasRest} dias</strong>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-300">
                            <span>Ritmo Atual:</span>
                            <strong className="font-mono">
                              {formatNumberBR(ritmoAtual, 1)} t/dia
                            </strong>
                          </div>
                          <div className="flex justify-between text-[11px] text-amber-300">
                            <span>Ritmo Necessário:</span>
                            <strong className="font-mono font-bold">
                              {formatNumberBR(ritmoNec, 1)} t/dia
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              }}
            />

            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />

            {/* ÁREA RACHURADA DE GAP (Hatch Fill entre Realizado e Meta) */}
            <Area
              type="monotone"
              dataKey="gapCalculado"
              name="Área de Gap (Faltante para a Meta)"
              fill="url(#ciafalHatchGap)"
              stroke="#f59e0b"
              strokeWidth={1}
              strokeDasharray="4 4"
            />

            {/* REALIZADO: BARRAS SÓLIDAS */}
            <Bar
              dataKey="realizado"
              name="Realizado"
              fill="url(#ciafalRealizadoGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={45}
            />

            {/* META: LINHA CONTÍNUA */}
            <Line
              type="monotone"
              dataKey="meta"
              name="Meta Estabelecida"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 4, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />

            {/* TENDÊNCIA / PROJEÇÃO: LINHA PONTILHADA */}
            <Line
              type="monotone"
              dataKey="tendencia"
              name="Tendência / Projeção"
              stroke="#6366f1"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#6366f1' }}
            />

            {/* REFERÊNCIA: MESMO PERÍODO ANO ANTERIOR */}
            {activeRefs.anoAnterior && (
              <Line
                type="monotone"
                dataKey="anoAnterior"
                name="Ano Anterior"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />
            )}

            {/* REFERÊNCIA: MÉDIA 3 MESES */}
            {activeRefs.media3M && (
              <Line
                type="monotone"
                dataKey="media3Meses"
                name="Média 3 Meses"
                stroke="#06b6d4"
                strokeWidth={1.5}
                dot={false}
              />
            )}

            {/* REFERÊNCIA: MÉDIA EQUIPE */}
            {activeRefs.mediaEquipe && (
              <Line
                type="monotone"
                dataKey="mediaEquipe"
                name="Média da Equipe"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
