import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Flame, AlertCircle, ArrowUpRight, Scale } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import type { GoalPaceMetrics } from '@/types/cockpit'

interface PaceComparisonWidgetProps {
  goalMetrics: GoalPaceMetrics
  unit: 'REVENUE' | 'TONS'
}

export function PaceComparisonWidget({ goalMetrics, unit }: PaceComparisonWidgetProps) {
  const isTons = unit === 'TONS'

  const ritmoAtual = isTons ? goalMetrics.ritmoAtualTonsDia : goalMetrics.ritmoAtualReaisDia
  const ritmoNecessario = isTons
    ? goalMetrics.ritmoNecessarioTonsDia
    : goalMetrics.ritmoNecessarioReaisDia
  const gapDiario = Math.max(0, ritmoNecessario - ritmoAtual)

  const formatUnit = (val: number) => {
    if (isTons) {
      return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t/dia`
    }
    return `${val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })}/dia`
  }

  const chartData = [
    {
      name: 'Ritmo Atual',
      valor: ritmoAtual,
      fill: '#004A8F', // Pantone 2945
    },
    {
      name: 'Ritmo Necessário',
      valor: ritmoNecessario,
      fill: ritmoAtual >= ritmoNecessario ? '#10b981' : '#f59e0b',
    },
    {
      name: 'Média Histórica',
      valor: isTons ? 4.5 : 28000,
      fill: '#94a3b8',
    },
  ]

  const statusBadge =
    goalMetrics.ritmoStatus === 'ACIMA_DO_RITMO' ? (
      <Badge className="bg-emerald-100 text-emerald-800 text-xs font-bold border-none">
        ✓ Acima do Ritmo
      </Badge>
    ) : goalMetrics.ritmoStatus === 'NO_RITMO' ? (
      <Badge className="bg-blue-100 text-blue-800 text-xs font-bold border-none">No Ritmo</Badge>
    ) : (
      <Badge className="bg-rose-100 text-rose-800 text-xs font-bold border-none">
        ⚠ Abaixo do Ritmo
      </Badge>
    )

  return (
    <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-primary">
                Ritmo Comercial Diário ({isTons ? 't/dia' : 'R$/dia'})
              </h3>
              <p className="text-xs text-muted-foreground">
                Velocidade diária realizada vs necessária para bater o Gap nos{' '}
                {goalMetrics.diasUteisRestantes} dias restantes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">{statusBadge}</div>
        </div>

        {/* 2 Cards Grandes: Ritmo Atual vs Necessário */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-border/40 space-y-1">
            <span className="text-xs font-bold text-muted-foreground block">
              Ritmo Atual Realizado
            </span>
            <span className="font-serif text-2xl font-bold text-slate-800 block">
              {formatUnit(ritmoAtual)}
            </span>
            <span className="text-[11px] text-muted-foreground block">
              Média nos {goalMetrics.diasUteisTranscorridos} dias úteis passados
            </span>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1">
            <span className="text-xs font-bold text-emerald-800 block">Ritmo Necessário</span>
            <span className="font-serif text-2xl font-bold text-emerald-700 block">
              {formatUnit(ritmoNecessario)}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium block">
              Meta diária para os próximos {goalMetrics.diasUteisRestantes} dias úteis
            </span>
          </div>
        </div>

        {/* Gráfico Comparativo de Barras */}
        <div className="h-36 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => (isTons ? `${v}t` : `R$ ${(v / 1000).toFixed(0)}k`)}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(val: number) => [formatUnit(val), 'Velocidade']}
                contentStyle={{
                  borderRadius: '12px',
                  fontSize: '11px',
                  border: '1px solid #e2e8f0',
                }}
              />
              <Bar dataKey="valor" radius={[0, 8, 8, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dica de Ação IA */}
      <div className="p-3 bg-muted/20 rounded-xl text-xs text-muted-foreground flex items-center gap-2">
        <Flame className="w-4 h-4 text-amber-500 shrink-0" />
        <span>
          {ritmoAtual >= ritmoNecessario
            ? `Seu ritmo atual cobre ${((ritmoAtual / (ritmoNecessario || 1)) * 100).toFixed(0)}% do ritmo necessário. Mantenha a cadência de contato com os clientes Curva A.`
            : `Gap diário de ${formatUnit(gapDiario)}. Fechar as 2 cotações prioritárias de hoje cobrirá integralmente o desvio.`}
        </span>
      </div>
    </Card>
  )
}
