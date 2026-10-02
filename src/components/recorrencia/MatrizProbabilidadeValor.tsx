// src/components/recorrencia/MatrizProbabilidadeValor.tsx
// Grafico interativo da Matriz Probabilidade x Valor (Requisito 7)
import React, { useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PredicaoClienteView, UnitMode } from '@/types/recorrencia'

interface MatrizProbabilidadeValorProps {
  clientes: PredicaoClienteView[]
  unitMode: UnitMode
  onSelectCliente: (cliente: PredicaoClienteView) => void
}

export function MatrizProbabilidadeValor({
  clientes,
  unitMode,
  onSelectCliente,
}: MatrizProbabilidadeValorProps) {
  const [horizonteDias, setHorizonteDias] = useState<30 | 90>(90)

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  const formatTons = (val: number) => {
    return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`
  }

  const scatterData = clientes.map((c) => {
    const prob =
      horizonteDias === 30
        ? Math.round(c.horizontes.probabilidade30d * 100)
        : Math.round(c.horizontes.probabilidade90d * 100)

    const yValue =
      unitMode === 'BRL'
        ? horizonteDias === 30
          ? c.horizontes.receitaEsperada30d
          : c.horizontes.receitaEsperada90d
        : horizonteDias === 30
          ? c.horizontes.tonelagemEsperada30d
          : c.horizontes.tonelagemEsperada90d

    return {
      cliente: c,
      x: prob,
      y: yValue,
      nome: c.razaoSocial,
      sap: c.codigoSap,
      vendedor: c.vendedorNome,
      quadrante: c.quadranteMatriz,
      pAlive: c.pAlivePercent,
      rfm: c.segmentoRFM,
    }
  })

  const midX = 50
  const midY = unitMode === 'BRL' ? 50000 : 7.5

  const getQuadrantColor = (quad: string) => {
    switch (quad) {
      case 'Manutenção prioritária':
        return '#0284c7'
      case 'Recuperação prioritária':
        return '#e11d48'
      case 'Manutenção':
        return '#10b981'
      case 'Baixa prioridade':
      default:
        return '#94a3b8'
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const c: PredicaoClienteView = data.cliente

      return (
        <div className="bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl shadow-xl border border-slate-200 text-xs space-y-1.5 max-w-xs z-50">
          <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-1.5">
            <div>
              <strong className="text-slate-900 block font-bold leading-tight">{data.nome}</strong>
              <span className="text-[10px] text-muted-foreground font-mono">SAP: {data.sap}</span>
            </div>
            <Badge
              className={`text-[9px] py-0 ${
                data.quadrante === 'Manutenção prioritária'
                  ? 'bg-sky-100 text-sky-900 border-sky-300'
                  : data.quadrante === 'Recuperação prioritária'
                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                    : data.quadrante === 'Manutenção'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {data.quadrante}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
            <div>
              <span className="text-slate-500 block">Representante:</span>
              <strong className="text-slate-800 block truncate">{c.representanteNome}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Segmento RFM:</span>
              <span className="text-slate-800 font-semibold">{c.segmentoRFM}</span>
            </div>
            <div>
              <span className="text-slate-500 block">P(Alive):</span>
              <strong
                className={
                  c.pAlivePercent >= 70
                    ? 'text-emerald-700'
                    : c.pAlivePercent >= 40
                      ? 'text-amber-700'
                      : 'text-rose-700'
                }
              >
                {c.pAlivePercent}%
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Prob. Recompra {horizonteDias}d:</span>
              <strong className="text-slate-900">{data.x}%</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Última Compra:</span>
              <span className="text-slate-800 font-mono">{c.ultimaCompraData}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Dias Inativo:</span>
              <span className="text-slate-800 font-mono">{c.diasSemComprar} dias</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px]">
            <span className="text-slate-600 font-medium">
              {unitMode === 'BRL'
                ? `Receita Esperada (${horizonteDias}d):`
                : `Volume Esperado (${horizonteDias}d):`}
            </span>
            <strong className="text-slate-900 font-mono font-bold">
              {unitMode === 'BRL' ? formatBRL(data.y) : formatTons(data.y)}
            </strong>
          </div>

          <div className="text-[10px] text-sky-800 bg-sky-50 p-1.5 rounded-lg text-center font-semibold mt-1">
            Clique no ponto para abrir o Drill-down completo
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="font-serif text-sm font-bold text-[#003A70]">
                Matriz Probabilidade ×{' '}
                {unitMode === 'BRL' ? 'Valor Projetado (R$)' : 'Volume Projetado (t)'}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono bg-white">
                Métrica: {unitMode === 'BRL' ? 'R$ Faturamento' : 't Toneladas'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Posicionamento estatístico da carteira em 4 quadrantes para priorização comercial.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Horizonte:</span>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setHorizonteDias(30)}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                  horizonteDias === 30
                    ? 'bg-[#003A70] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 Dias
              </button>
              <button
                type="button"
                onClick={() => setHorizonteDias(90)}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                  horizonteDias === 90
                    ? 'bg-[#003A70] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                90 Dias
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Legenda dos 4 Quadrantes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
          <div className="p-2.5 bg-sky-50/80 rounded-xl border border-sky-200 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#0284c7] shrink-0" />
            <div>
              <strong className="text-sky-950 block text-[11px] leading-tight">
                Manutenção prioritária
              </strong>
              <span className="text-[10px] text-sky-800">Alta prob. + Alto valor</span>
            </div>
          </div>

          <div className="p-2.5 bg-rose-50/80 rounded-xl border border-rose-200 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#e11d48] shrink-0" />
            <div>
              <strong className="text-rose-950 block text-[11px] leading-tight">
                Recuperação prioritária
              </strong>
              <span className="text-[10px] text-rose-800">Baixa prob. + Alto valor</span>
            </div>
          </div>

          <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#10b981] shrink-0" />
            <div>
              <strong className="text-emerald-950 block text-[11px] leading-tight">
                Manutenção
              </strong>
              <span className="text-[10px] text-emerald-800">Alta prob. + Baixo valor</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-100/80 rounded-xl border border-slate-200 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#94a3b8] shrink-0" />
            <div>
              <strong className="text-slate-800 block text-[11px] leading-tight">
                Baixa prioridade
              </strong>
              <span className="text-[10px] text-slate-600">Baixa prob. + Baixo valor</span>
            </div>
          </div>
        </div>

        {/* Gráfico Scatter Recharts */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                dataKey="x"
                name="Probabilidade de Recompra"
                unit="%"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                label={{
                  value: `Probabilidade de Recompra em ${horizonteDias} Dias (%)`,
                  position: 'insideBottom',
                  offset: -10,
                  fontSize: 11,
                  fill: '#475569',
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={unitMode === 'BRL' ? 'Valor Esperado' : 'Tonelagem Esperada'}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) =>
                  unitMode === 'BRL' ? `R$ ${(val / 1000).toFixed(0)}k` : `${val}t`
                }
                label={{
                  value:
                    unitMode === 'BRL'
                      ? `Receita Projetada ${horizonteDias}d (R$)`
                      : `Toneladas Projetadas ${horizonteDias}d (t)`,
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 11,
                  fill: '#475569',
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x={midX}
                stroke="#cbd5e1"
                strokeDasharray="4 4"
                label={{ value: 'Divisor 50%', position: 'top', fill: '#94a3b8', fontSize: 10 }}
              />
              <ReferenceLine
                y={midY}
                stroke="#cbd5e1"
                strokeDasharray="4 4"
                label={{
                  value: unitMode === 'BRL' ? 'R$ 50k' : '7.5t',
                  position: 'right',
                  fill: '#94a3b8',
                  fontSize: 10,
                }}
              />
              <Scatter
                name="Clientes"
                data={scatterData}
                onClick={(e) => {
                  if (e && e.cliente) {
                    onSelectCliente(e.cliente)
                  }
                }}
                className="cursor-pointer"
              >
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getQuadrantColor(entry.quadrante)}
                    stroke="#ffffff"
                    strokeWidth={2}
                    r={entry.pAlive >= 70 ? 8 : 6}
                    className="transition-transform hover:scale-125 duration-150 cursor-pointer"
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
