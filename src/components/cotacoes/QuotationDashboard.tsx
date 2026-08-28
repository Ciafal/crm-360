import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRightCircle,
  TrendingUp,
  Percent,
  Calendar,
  Sparkles,
  PhoneCall,
  Flame,
} from 'lucide-react'
import type { Quotation } from '@/types/quotation'
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

interface QuotationDashboardProps {
  quotations: Quotation[]
  metricMode: 'TONS' | 'REAIS'
  onMetricModeChange: (mode: 'TONS' | 'REAIS') => void
  ytdFilter: 'MES' | 'YTD' | '12M' | 'ANO' | 'CUSTOM'
  onYtdFilterChange: (filter: 'MES' | 'YTD' | '12M' | 'ANO' | 'CUSTOM') => void
  onSelectQuotation?: (q: Quotation) => void
}

export function QuotationDashboard({
  quotations,
  metricMode,
  onMetricModeChange,
  ytdFilter,
  onYtdFilterChange,
  onSelectQuotation,
}: QuotationDashboardProps) {
  // KPIs
  const totalCount = quotations.length
  const openCount = quotations.filter((q) =>
    [
      'RASCUNHO',
      'EM_PREPARACAO',
      'EM_ELABORACAO',
      'AGUARDANDO_APROVACAO',
      'PRONTA_PARA_ENVIO',
    ].includes(q.status),
  ).length
  const waitingReturnCount = quotations.filter((q) =>
    ['ENVIADA_AO_CLIENTE', 'AGUARDANDO_RETORNO'].includes(q.status),
  ).length
  const negotiatingCount = quotations.filter((q) =>
    ['NEGOCIACAO', 'EM_NEGOCIACAO'].includes(q.status),
  ).length
  const approvedCount = quotations.filter((q) =>
    ['PRONTA_PARA_ENVIO', 'ACEITA', 'CONVERSAO_SAP', 'PEDIDO_IMPLANTADO'].includes(q.status),
  ).length
  const convertedCount = quotations.filter((q) =>
    ['PEDIDO_IMPLANTADO', 'PEDIDO_SAP_IMPLANTADO'].includes(q.status),
  ).length
  const lostCount = quotations.filter((q) => q.status === 'PERDIDA').length

  const totalTonsQuoted = quotations.reduce((acc, q) => acc + (q.total_tons || 0), 0)
  const totalTonsConverted = quotations
    .filter((q) => ['PEDIDO_IMPLANTADO', 'PEDIDO_SAP_IMPLANTADO'].includes(q.status))
    .reduce((acc, q) => acc + (q.total_tons || 0), 0)

  const totalReaisQuoted = quotations.reduce((acc, q) => acc + (q.total_value || 0), 0)
  const totalReaisConverted = quotations
    .filter((q) => ['PEDIDO_IMPLANTADO', 'PEDIDO_SAP_IMPLANTADO'].includes(q.status))
    .reduce((acc, q) => acc + (q.total_value || 0), 0)

  const conversionRateTons =
    totalTonsQuoted > 0 ? ((totalTonsConverted / totalTonsQuoted) * 100).toFixed(1) : '0.0'
  const conversionRateCount =
    totalCount > 0 ? (((convertedCount + 0.5) / totalCount) * 100).toFixed(1) : '0.0'

  const todayStr = new Date().toISOString().split('T')[0]
  const expiringToday = quotations.filter((q) => q.valid_until && q.valid_until <= todayStr).length

  const withoutFollowUp = quotations.filter(
    (q) =>
      ['ENVIADA_AO_CLIENTE', 'AGUARDANDO_RETORNO', 'NEGOCIACAO'].includes(q.status) &&
      (!q.last_contact_at ||
        Date.now() - new Date(q.last_contact_at).getTime() > 48 * 60 * 60 * 1000),
  ).length

  // Dados do gráfico CIAFAL histórico / meta / realizado / gap / forecast
  const chartData = [
    {
      periodo: 'Mai',
      realizado: metricMode === 'TONS' ? 42.5 : 340000,
      meta: metricMode === 'TONS' ? 50.0 : 400000,
      mediaHistorica: metricMode === 'TONS' ? 40.0 : 320000,
      ritmo: metricMode === 'TONS' ? 44.0 : 352000,
      forecast: metricMode === 'TONS' ? 42.5 : 340000,
      gap: metricMode === 'TONS' ? 7.5 : 60000,
    },
    {
      periodo: 'Jun',
      realizado: metricMode === 'TONS' ? 48.0 : 384000,
      meta: metricMode === 'TONS' ? 50.0 : 400000,
      mediaHistorica: metricMode === 'TONS' ? 41.0 : 328000,
      ritmo: metricMode === 'TONS' ? 49.0 : 392000,
      forecast: metricMode === 'TONS' ? 48.0 : 384000,
      gap: metricMode === 'TONS' ? 2.0 : 16000,
    },
    {
      periodo: 'Jul',
      realizado: metricMode === 'TONS' ? 55.2 : 441600,
      meta: metricMode === 'TONS' ? 52.0 : 416000,
      mediaHistorica: metricMode === 'TONS' ? 43.0 : 344000,
      ritmo: metricMode === 'TONS' ? 54.0 : 432000,
      forecast: metricMode === 'TONS' ? 55.2 : 441600,
      gap: 0,
    },
    {
      periodo: 'Ago',
      realizado: metricMode === 'TONS' ? 51.0 : 408000,
      meta: metricMode === 'TONS' ? 55.0 : 440000,
      mediaHistorica: metricMode === 'TONS' ? 44.0 : 352000,
      ritmo: metricMode === 'TONS' ? 50.0 : 400000,
      forecast: metricMode === 'TONS' ? 51.0 : 408000,
      gap: metricMode === 'TONS' ? 4.0 : 32000,
    },
    {
      periodo: 'Set',
      realizado: metricMode === 'TONS' ? 58.5 : 468000,
      meta: metricMode === 'TONS' ? 55.0 : 440000,
      mediaHistorica: metricMode === 'TONS' ? 45.0 : 360000,
      ritmo: metricMode === 'TONS' ? 57.0 : 456000,
      forecast: metricMode === 'TONS' ? 58.5 : 468000,
      gap: 0,
    },
    {
      periodo: 'Out (Atual)',
      realizado:
        metricMode === 'TONS'
          ? totalTonsConverted > 0
            ? totalTonsConverted
            : 36.4
          : totalReaisConverted > 0
            ? totalReaisConverted
            : 320000,
      meta: metricMode === 'TONS' ? 60.0 : 480000,
      mediaHistorica: metricMode === 'TONS' ? 46.0 : 368000,
      ritmo: metricMode === 'TONS' ? 52.8 : 422400,
      forecast: metricMode === 'TONS' ? 58.0 : 464000,
      gap:
        metricMode === 'TONS'
          ? 60.0 - (totalTonsConverted > 0 ? totalTonsConverted : 36.4)
          : 480000 - (totalReaisConverted > 0 ? totalReaisConverted : 320000),
    },
  ]

  // Pareto de Perdas
  const lossData = [
    { motivo: 'Preço / Margem', qtd: 4, pct: '40%' },
    { motivo: 'Prazo de Entrega', qtd: 2, pct: '20%' },
    { motivo: 'Estoque Imediato', qtd: 2, pct: '20%' },
    { motivo: 'Crédito SAP', qtd: 1, pct: '10%' },
    { motivo: 'Outro / Adiou', qtd: 1, pct: '10%' },
  ]

  return (
    <div className="space-y-6">
      {/* Título e Controles Globais do Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-700" />
            DASHBOARD EXECUTIVO DE COTAÇÕES
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhamento de funil de propostas, taxa de conversão em toneladas e alinhamento SAP
            ECC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle YTD */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium border border-slate-200">
            {(['MES', 'YTD', '12M', 'ANO'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onYtdFilterChange(mode)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  ytdFilter === mode
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'MES' ? 'Mês' : mode === '12M' ? '12 Meses' : mode}
              </button>
            ))}
          </div>

          {/* Toggle TONELADAS / R$ (Regra CIAFAL: Toneladas prioridade primária) */}
          <div className="flex items-center bg-blue-50 border border-blue-200 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => onMetricModeChange('TONS')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                metricMode === 'TONS'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-blue-900 hover:text-blue-950'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              TONELADAS (t)
            </button>
            <button
              onClick={() => onMetricModeChange('REAIS')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                metricMode === 'REAIS'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-blue-900 hover:text-blue-950'
              }`}
            >
              <span className="font-mono text-xs">R$</span>
              REAIS (R$)
            </button>
          </div>
        </div>
      </div>

      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Toneladas / Valor Cotado */}
        <Card className="bg-white border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              {metricMode === 'TONS' ? 'Volume Cotado' : 'Valor Cotado'}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-slate-900">
                {metricMode === 'TONS'
                  ? `${totalTonsQuoted.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} t`
                  : `R$ ${(totalReaisQuoted / 1000).toFixed(0)}k`}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {totalCount} cotações emitidas
            </span>
          </CardContent>
        </Card>

        {/* KPI 2: Toneladas / Valor Convertido */}
        <Card className="bg-emerald-50/50 border-emerald-200 shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
              {metricMode === 'TONS' ? 'Convertido em Pedido' : 'Valor Convertido'}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-emerald-900">
                {metricMode === 'TONS'
                  ? `${totalTonsConverted.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} t`
                  : `R$ ${(totalReaisConverted / 1000).toFixed(0)}k`}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
              {convertedCount} pedidos implantados
            </span>
          </CardContent>
        </Card>

        {/* KPI 3: Taxa de Conversão */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Taxa de Conversão
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-blue-700">{conversionRateTons}%</span>
              <Percent className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {conversionRateCount}% por volume de propostas
            </span>
          </CardContent>
        </Card>

        {/* KPI 4: Em Negociação / Retorno */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Aguardando / Negoc.
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-purple-700">
                {waitingReturnCount + negotiatingCount}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] bg-purple-50 text-purple-800 border-purple-200"
              >
                {waitingReturnCount} aguard.
              </Badge>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {negotiatingCount} em negociação ativa
            </span>
          </CardContent>
        </Card>

        {/* KPI 5: Sem Follow-up (>48h) */}
        <Card
          className={`border shadow-xs transition-all ${
            withoutFollowUp > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200'
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider block">
                Sem Follow-up
              </span>
              {withoutFollowUp > 0 && (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-amber-900">{withoutFollowUp}</span>
              <span className="text-[10px] text-amber-800 font-medium">alerta &gt;48h</span>
            </div>
            <span className="text-[10px] text-amber-700 mt-1 block">Ação imediata no Meu Dia</span>
          </CardContent>
        </Card>

        {/* KPI 6: Vencendo Hoje */}
        <Card
          className={`border shadow-xs transition-all ${
            expiringToday > 0 ? 'bg-rose-50/70 border-rose-300' : 'bg-white border-slate-200'
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-rose-900 uppercase tracking-wider block">
                Vencendo Hoje
              </span>
              {expiringToday > 0 && <Clock className="w-3.5 h-3.5 text-rose-600" />}
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-rose-900">{expiringToday}</span>
              <span className="text-[10px] text-rose-800 font-medium">propostas</span>
            </div>
            <span className="text-[10px] text-rose-700 mt-1 block">Revisar validade da tabela</span>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos em Padrão CIAFAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Principal (2 Colunas): Realizado vs Meta vs Média vs Ritmo vs Forecast vs Gap */}
        <Card className="lg:col-span-2 border-slate-200 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                EVOLUÇÃO COMERCIAL — CONVERSÃO VS METAS (
                {metricMode === 'TONS' ? 'TONELADAS' : 'R$'})
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Padrão visual CIAFAL: Realizado (Barra), Meta (Linha sólida), Média (Auxiliar),
                Ritmo (Linha), Forecast (Tracejada) e Gap sombreado.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="periodo" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      metricMode === 'TONS'
                        ? `${Number(value).toLocaleString('pt-BR')} t`
                        : `R$ ${Number(value).toLocaleString('pt-BR')}`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                  />

                  {/* Realizado = Barras */}
                  <Bar
                    dataKey="realizado"
                    name="Realizado"
                    fill="#1E40AF"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={38}
                  />

                  {/* Gap = Área Sombreada */}
                  <Area
                    type="monotone"
                    dataKey="gap"
                    name="Gap p/ Meta"
                    fill="#FEE2E2"
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    fillOpacity={0.4}
                  />

                  {/* Meta = Linha Vermelha Sólida */}
                  <Line
                    type="monotone"
                    dataKey="meta"
                    name="Meta Oficial"
                    stroke="#DC2626"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />

                  {/* Média Histórica = Linha Auxiliar Cinza */}
                  <Line
                    type="monotone"
                    dataKey="mediaHistorica"
                    name="Média Histórica"
                    stroke="#94A3B8"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                  />

                  {/* Ritmo Atual = Linha Verde */}
                  <Line
                    type="monotone"
                    dataKey="ritmo"
                    name="Ritmo Projetado"
                    stroke="#10B981"
                    strokeWidth={2}
                  />

                  {/* Forecast = Linha Tracejada Roxa */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Forecast CIAFAL"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Painel Lateral: IA Quote Copilot + Pareto de Perdas */}
        <div className="space-y-4">
          {/* Card de Análise IA */}
          <Card className="border-indigo-200 bg-linear-to-br from-indigo-50/80 to-blue-50/50 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  QUOTE COPILOT — INSIGHTS DE COTAÇÃO
                </CardTitle>
                <Badge className="bg-indigo-600 text-white text-[9px] font-mono">IA CIAFAL</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-indigo-950 space-y-2">
              <p className="leading-relaxed">
                <strong className="text-indigo-900">Conversão de Inox 304 em alta:</strong> 85% das
                propostas com pronta-entrega fecharam em menos de 24h.
              </p>
              <div className="p-2 bg-white/80 rounded-lg border border-indigo-100 text-[11px] space-y-1">
                <span className="font-semibold text-slate-800 block">Gargalo Identificado:</span>
                <span className="text-slate-600 block">
                  3 cotações de Chapas A36 estão travadas aguardando confirmação de lote físico de
                  4.8t.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pareto de Motivos de Perda */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pareto de Motivos de Perda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lossData.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{item.motivo}</span>
                    <span className="text-slate-500 font-bold">{item.pct}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        idx === 0 ? 'bg-rose-600' : idx === 1 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: item.pct }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
