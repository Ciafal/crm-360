// src/components/recorrencia/AbaVisaoGeral.tsx
import React, { useState, useMemo } from 'react'
import {
  Users,
  Repeat,
  AlertTriangle,
  Flame,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  Weight,
  Sparkles,
  Info,
  Calendar,
  Layers,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ClienteRecorrenciaView, KpisVisaoGeral, UnitMode } from '@/types/recorrencia'

interface AbaVisaoGeralProps {
  clientes: ClienteRecorrenciaView[]
  kpis: KpisVisaoGeral
  unitMode: UnitMode
  onSelectCliente: (clienteSap: string) => void
  onApplyKpiFilter: (filterKey: string, filterValue: string) => void
}

export function AbaVisaoGeral({
  clientes,
  kpis,
  unitMode,
  onSelectCliente,
  onApplyKpiFilter,
}: AbaVisaoGeralProps) {
  // Controles do Heatmap
  const [topCount, setTopCount] = useState<string>('26')
  const [sortKey, setSortKey] = useState<string>('faturamento')

  // Formatação BR estrita
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

  // Ordenação e limitação do Heatmap
  const clientesHeatmap = useMemo(() => {
    const list = [...clientes]
    list.sort((a, b) => {
      if (sortKey === 'faturamento') return b.totalFaturado12m - a.totalFaturado12m
      if (sortKey === 'toneladas') return b.totalToneladas12m - a.totalToneladas12m
      if (sortKey === 'frequencia') return b.taxaRecorrencia - a.taxaRecorrencia
      if (sortKey === 'diasSemComprar') return b.diasSemComprar - a.diasSemComprar
      if (sortKey === 'risco') {
        const pesoRisco = (c: ClienteRecorrenciaView) =>
          c.tipoAlerta === 'Parada Abrupta' ? 3 : c.tipoAlerta === 'Queda Forte' ? 2 : 1
        return pesoRisco(b) - pesoRisco(a)
      }
      return 0
    })

    if (topCount === '10') return list.slice(0, 10)
    if (topCount === '26') return list.slice(0, 26)
    if (topCount === '50') return list.slice(0, 50)
    return list
  }, [clientes, sortKey, topCount])

  // Série Mensal de Clientes Ativos (com faturamento)
  const serieMensalClientesAtivos = useMemo(() => {
    const meses = [
      'Nov/23',
      'Dez/23',
      'Jan/24',
      'Fev/24',
      'Mar/24',
      'Abr/24',
      'Mai/24',
      'Jun/24',
      'Jul/24',
      'Ago/24',
      'Set/24',
      'Out/24',
    ]

    return meses.map((mes, idx) => {
      const ativosCount = clientes.filter((c) => {
        const cell = c.mapaMensal[idx]
        return cell && cell.valorFaturado > 0
      }).length

      const isParcial = idx === 11 // Out/24 é parcial
      return {
        mes,
        ativosCount,
        isParcial,
      }
    })
  }, [clientes])

  return (
    <div className="space-y-6">
      {/* 1. KPIs DE TOPO (11 cards clicáveis com drill-down) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* KPI 1 */}
        <Card
          onClick={() => onApplyKpiFilter('reset', '')}
          className="bg-white border-slate-200 hover:border-primary/50 cursor-pointer shadow-xs transition-all hover:scale-[1.01]"
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                1. Clientes Carteira
              </span>
              <Users className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="font-serif font-bold text-xl text-slate-900">
              {kpis.clientesNaCarteira}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">Base Total</span>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card
          onClick={() => onApplyKpiFilter('classeRecorrencia', 'Mensal')}
          className="bg-white border-slate-200 hover:border-emerald-500/50 cursor-pointer shadow-xs transition-all hover:scale-[1.01]"
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                2. Compram Todo Mês
              </span>
              <Repeat className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="font-serif font-bold text-xl text-emerald-700">
              {kpis.compramTodoMes}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">Recorrência ≥55%</span>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card
          onClick={() => onApplyKpiFilter('classeRecorrencia', 'Esporádico')}
          className="bg-white border-slate-200 hover:border-amber-500/50 cursor-pointer shadow-xs transition-all hover:scale-[1.01]"
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                3. Compra Esporádica
              </span>
              <Layers className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="font-serif font-bold text-xl text-amber-800">
              {kpis.compraEsporadica}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">Taxa &lt;15%</span>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">4. Retenção</span>
              <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="font-serif font-bold text-xl text-sky-900">{kpis.retencaoPct}%</div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Taxa de Fidelidade
            </span>
          </CardContent>
        </Card>

        {/* KPI 5 */}
        <Card
          onClick={() => onApplyKpiFilter('diasSemComprar', '90')}
          className="bg-white border-slate-200 hover:border-rose-500/50 cursor-pointer shadow-xs transition-all hover:scale-[1.01]"
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                5. Inativos &gt;90d
              </span>
              <Calendar className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="font-serif font-bold text-xl text-rose-700">
              {kpis.clientesInativos90d}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Requer Reativação
            </span>
          </CardContent>
        </Card>

        {/* KPI 6 */}
        <Card
          onClick={() => onApplyKpiFilter('segmentoRFM', 'Em Risco')}
          className="bg-white border-slate-200 hover:border-amber-500/50 cursor-pointer shadow-xs transition-all hover:scale-[1.01]"
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                6. Clientes em Risco
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="font-serif font-bold text-xl text-amber-700">
              {kpis.clientesEmRisco}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">Atenção Imediata</span>
          </CardContent>
        </Card>

        {/* KPI 7 */}
        <Card
          onClick={() => onApplyKpiFilter('riscoPerda', 'PARADA_ABRUPTA')}
          className="bg-white border-slate-200 hover:border-rose-600/50 cursor-pointer shadow-xs transition-all hover:scale-[1.01]"
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                7. Parada Abrupta
              </span>
              <Flame className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="font-serif font-bold text-xl text-rose-700">
              {kpis.clientesParadaAbrupta}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Interrupção Crítica
            </span>
          </CardContent>
        </Card>

        {/* KPI 8 */}
        <Card
          onClick={() => onApplyKpiFilter('riscoPerda', 'QUEDA_FORTE')}
          className="bg-white border-slate-200 hover:border-orange-500/50 cursor-pointer shadow-xs transition-all hover:scale-[1.01]"
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">8. Queda Forte</span>
              <ArrowDownRight className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <div className="font-serif font-bold text-xl text-orange-700">
              {kpis.clientesQuedaForte}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">Volume &lt; 50%</span>
          </CardContent>
        </Card>

        {/* KPI 9 */}
        <Card
          onClick={() => onApplyKpiFilter('cadencia', 'alta')}
          className="bg-white border-slate-200 hover:border-purple-500/50 cursor-pointer shadow-xs transition-all hover:scale-[1.01]"
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                9. Recompra Cadência
              </span>
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="font-serif font-bold text-xl text-purple-700">
              {kpis.clientesAltaProbabilidadeRecompra}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">Ciclo Esperado</span>
          </CardContent>
        </Card>

        {/* KPI 10 */}
        <Card className="bg-sky-50/60 border-sky-200 shadow-xs">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-900">
                10. Retomada — R$
              </span>
              <DollarSign className="w-3.5 h-3.5 text-sky-700" />
            </div>
            <div className="font-serif font-bold text-base sm:text-lg text-[#003A70] truncate">
              {formatBRL(kpis.potencialRetomadaValor)}
            </div>
            <span className="text-[10px] text-sky-800 block mt-0.5">Potencial R$</span>
          </CardContent>
        </Card>

        {/* KPI 11 */}
        <Card className="bg-emerald-50/60 border-emerald-200 shadow-xs">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                11. Retomada — t
              </span>
              <Weight className="w-3.5 h-3.5 text-emerald-700" />
            </div>
            <div className="font-serif font-bold text-base sm:text-lg text-emerald-900 truncate">
              {formatTons(kpis.potencialRetomadaTons)}
            </div>
            <span className="text-[10px] text-emerald-800 block mt-0.5">Potencial Volume</span>
          </CardContent>
        </Card>
      </div>

      {/* 2. MAPA DE RECORRÊNCIA MENSAL (HEATMAP) */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200/80 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="font-serif text-base font-bold text-[#003A70] flex items-center gap-2">
                <span>Mapa de Recorrência Mensal (Heatmap 12 Meses)</span>
                <Badge variant="outline" className="text-[10px] bg-white border-slate-200">
                  {unitMode === 'BRL' ? 'Escala: R$ Faturado' : 'Escala: Toneladas (t)'}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Intensidade de compra mensal por cliente. Clique no cliente para abrir a Ficha 360º.
              </p>
            </div>

            {/* Controles do Heatmap */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Quantidade: Top 10 / 26 (default) / 50 / todos */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Exibir:</span>
                <Select value={topCount} onValueChange={setTopCount}>
                  <SelectTrigger className="h-7 text-xs w-28 rounded-xl bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Top 10</SelectItem>
                    <SelectItem value="26">Top 26 (Padrão)</SelectItem>
                    <SelectItem value="50">Top 50</SelectItem>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ordenação */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Ordenar por:</span>
                <Select value={sortKey} onValueChange={setSortKey}>
                  <SelectTrigger className="h-7 text-xs w-40 rounded-xl bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faturamento">Maior Faturamento</SelectItem>
                    <SelectItem value="toneladas">Maior Tonelagem</SelectItem>
                    <SelectItem value="frequencia">Maior Frequência</SelectItem>
                    <SelectItem value="risco">Maior Risco</SelectItem>
                    <SelectItem value="diasSemComprar">Mais Dias s/ Comprar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <TooltipProvider delayDuration={150}>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-2.5 pl-4 sticky left-0 bg-slate-100 z-10 w-64 shadow-xs">
                    Cliente / Razão Social
                  </th>
                  <th className="p-2 text-center w-24">Classe</th>
                  <th className="p-2 text-center w-16">Taxa</th>
                  {/* 12 Colunas de Meses */}
                  {[
                    'Nov/23',
                    'Dez/23',
                    'Jan/24',
                    'Fev/24',
                    'Mar/24',
                    'Abr/24',
                    'Mai/24',
                    'Jun/24',
                    'Jul/24',
                    'Ago/24',
                    'Set/24',
                    'Out/24*',
                  ].map((m, idx) => (
                    <th key={idx} className="p-2 text-center min-w-[54px]">
                      {m}
                    </th>
                  ))}
                  <th className="p-2 pr-4 text-right w-28">
                    {unitMode === 'BRL' ? 'Total 12M' : 'Total 12M (t)'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientesHeatmap.map((c) => (
                  <tr key={c.id} className="hover:bg-sky-50/50 transition-colors">
                    {/* Nome do Cliente com link */}
                    <td className="p-2.5 pl-4 sticky left-0 bg-white hover:bg-sky-50/50 z-10 shadow-xs">
                      <button
                        type="button"
                        onClick={() => onSelectCliente(c.codigoSap)}
                        className="text-left group block max-w-[240px]"
                      >
                        <strong className="text-slate-900 group-hover:text-primary transition-colors block truncate">
                          {c.razaoSocial}
                        </strong>
                        <span className="text-[10px] text-muted-foreground font-mono block">
                          SAP {c.codigoSap} · {c.vendedorNome}
                        </span>
                      </button>
                    </td>

                    {/* Classe de Recorrência */}
                    <td className="p-2 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          c.classeRecorrencia === 'Mensal'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : c.classeRecorrencia === 'Bimestral'
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : c.classeRecorrencia === 'Trimestral'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {c.classeRecorrencia}
                      </Badge>
                    </td>

                    {/* Taxa % */}
                    <td className="p-2 text-center font-mono font-bold text-[11px] text-slate-700">
                      {c.taxaRecorrencia}%
                    </td>

                    {/* 12 Células do Mapa com Tooltip detalhado */}
                    {c.mapaMensal.map((cell, idx) => {
                      // Intensidade visual dependendo da unidade
                      const comprou = cell.valorFaturado > 0
                      const bgClass = !comprou
                        ? 'bg-slate-100 text-slate-400'
                        : cell.intensidade === 'muito_alta'
                          ? 'bg-emerald-600 text-white font-bold'
                          : cell.intensidade === 'alta'
                            ? 'bg-emerald-500 text-white font-medium'
                            : cell.intensidade === 'media'
                              ? 'bg-emerald-400 text-slate-950 font-medium'
                              : 'bg-emerald-200 text-emerald-950'

                      return (
                        <td key={idx} className="p-1 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`w-11 h-7 mx-auto rounded flex items-center justify-center text-[10px] transition-all cursor-pointer ${bgClass}`}
                              >
                                {comprou
                                  ? unitMode === 'BRL'
                                    ? `${Math.round(cell.valorFaturado / 1000)}k`
                                    : `${cell.tonelagem}t`
                                  : '—'}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="text-xs p-2.5 bg-slate-900 text-white rounded-xl shadow-xl space-y-1"
                            >
                              <p className="font-bold text-amber-300">{c.razaoSocial}</p>
                              <p className="text-[11px] text-slate-300">
                                Mês: <strong>{cell.labelMes}</strong>{' '}
                                {cell.isParcial && '(Mês Parcial)'}
                              </p>
                              <div className="pt-1 border-t border-slate-700 space-y-0.5 text-[11px]">
                                <p>
                                  Faturamento: <strong>{formatBRL(cell.valorFaturado)}</strong>
                                </p>
                                <p>
                                  Tonelagem: <strong>{formatTons(cell.tonelagem)}</strong>
                                </p>
                                <p>
                                  Notas Fiscais: <strong>{cell.nfsCount} NF(s)</strong>
                                </p>
                                <p>
                                  Produtos Distintos:{' '}
                                  <strong>{cell.produtosDistintosCount} item(ns)</strong>
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      )
                    })}

                    {/* Total 12M */}
                    <td className="p-2 pr-4 text-right font-mono font-bold text-slate-900">
                      {unitMode === 'BRL'
                        ? formatBRL(c.totalFaturado12m)
                        : formatTons(c.totalToneladas12m)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TooltipProvider>

          {/* Legenda do Heatmap */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Legenda de Intensidade:</span>
              <div className="flex items-center gap-1 text-[11px]">
                <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200" />
                <span>Sem Compra</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <div className="w-3.5 h-3.5 rounded bg-emerald-200" />
                <span>Baixa</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <div className="w-3.5 h-3.5 rounded bg-emerald-400" />
                <span>Média</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <div className="w-3.5 h-3.5 rounded bg-emerald-500" />
                <span>Alta</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <div className="w-3.5 h-3.5 rounded bg-emerald-600" />
                <span>Muito Alta</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              * Mês corrente incompleto marcado como <strong>Mês parcial</strong>.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. SÉRIE DE CLIENTES ATIVOS POR MÊS & CLASSES DE RECORRÊNCIA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clientes Ativos por Mês */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white">
          <CardHeader className="p-4 border-b border-slate-200">
            <CardTitle className="font-serif text-sm font-bold text-[#003A70] flex items-center justify-between">
              <span>Evolução: Clientes Ativos com Faturamento por Mês</span>
              <Badge className="bg-sky-100 text-sky-900 border-sky-300 text-[10px]">
                Tendência Estável
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 text-center">
              {serieMensalClientesAtivos.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all ${
                    item.isParcial
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-600 uppercase">{item.mes}</span>
                  <span className="font-serif font-bold text-lg text-[#003A70] my-1">
                    {item.ativosCount}
                  </span>
                  {item.isParcial ? (
                    <Badge className="text-[8px] bg-amber-500 text-white border-none py-0 px-1">
                      Mês parcial
                    </Badge>
                  ) : (
                    <span className="text-[9px] text-emerald-700 font-semibold">Ativos</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Classes de Recorrência Regra */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="p-4 border-b border-slate-200">
            <CardTitle className="font-serif text-sm font-bold text-[#003A70]">
              Regra das Classes de Recorrência
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              A <strong>taxa de recorrência</strong> é calculada dividindo os meses com compra pelos
              meses desde a primeira compra do cliente.
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-900">Mensal</span>
                <Badge className="bg-emerald-600 text-white text-[10px]">≥ 55% dos meses</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50 border border-sky-200">
                <span className="font-bold text-sky-900">Bimestral</span>
                <Badge className="bg-sky-600 text-white text-[10px]">≥ 30% e &lt; 55%</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
                <span className="font-bold text-amber-900">Trimestral</span>
                <Badge className="bg-amber-600 text-white text-[10px]">≥ 15% e &lt; 30%</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 border border-slate-200">
                <span className="font-bold text-slate-800">Esporádico</span>
                <Badge className="bg-slate-600 text-white text-[10px]">&lt; 15% dos meses</Badge>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Thresholds configuráveis somente pelo administrador.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
