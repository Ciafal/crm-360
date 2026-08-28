import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Clock,
  AlertTriangle,
  Warehouse,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import type { StockItem, StockAgeBracket } from '@/types/stock'
import { formatCurrency, formatWeight, formatNumberBR } from '@/lib/utils'

interface StockAgingViewProps {
  items: StockItem[]
  onRequestCheck: (item: StockItem) => void
  onFilterByBracket?: (bracket: StockAgeBracket) => void
}

export function StockAgingView({ items, onRequestCheck, onFilterByBracket }: StockAgingViewProps) {
  // Agrupamento por Faixa de Aging
  const brackets: {
    key: StockAgeBracket
    label: string
    sublabel: string
    colorClass: string
    borderClass: string
    bgCardClass: string
  }[] = [
    {
      key: '0-30',
      label: '0 a 30 dias',
      sublabel: 'Giro Rápido',
      colorClass: 'text-emerald-700 bg-emerald-100/80',
      borderClass: 'border-emerald-200',
      bgCardClass: 'bg-emerald-50/40',
    },
    {
      key: '31-60',
      label: '31 a 60 dias',
      sublabel: 'Giro Normal',
      colorClass: 'text-teal-700 bg-teal-100/80',
      borderClass: 'border-teal-200',
      bgCardClass: 'bg-teal-50/40',
    },
    {
      key: '61-90',
      label: '61 a 90 dias',
      sublabel: 'Atenção Inicial',
      colorClass: 'text-blue-700 bg-blue-100/80',
      borderClass: 'border-blue-200',
      bgCardClass: 'bg-blue-50/40',
    },
    {
      key: '91-120',
      label: '91 a 120 dias',
      sublabel: 'Baixa Movimentação',
      colorClass: 'text-amber-800 bg-amber-100/80',
      borderClass: 'border-amber-200',
      bgCardClass: 'bg-amber-50/40',
    },
    {
      key: '121-180',
      label: '121 a 180 dias',
      sublabel: 'Estoque Parado',
      colorClass: 'text-orange-800 bg-orange-100/80',
      borderClass: 'border-orange-200',
      bgCardClass: 'bg-orange-50/40',
    },
    {
      key: '>180',
      label: '> 180 dias',
      sublabel: 'Envelhecimento Crítico',
      colorClass: 'text-rose-800 bg-rose-100/80',
      borderClass: 'border-rose-200',
      bgCardClass: 'bg-rose-50/40',
    },
  ]

  const totalPhysicalTons = items.reduce((acc, it) => acc + it.physicalTons, 0) || 1

  const agingStats = brackets.map((b) => {
    const matching = items.filter((it) => it.ageBracket === b.key)
    const tons = matching.reduce((acc, it) => acc + it.physicalTons, 0)
    const value = matching.reduce((acc, it) => acc + it.estimatedTotalValue, 0)
    const lotsCount = matching.length
    const avgAge =
      lotsCount > 0 ? Math.round(matching.reduce((acc, it) => acc + it.ageDays, 0) / lotsCount) : 0
    const oldestItem = matching.sort((a, b) => b.ageDays - a.ageDays)[0]

    return {
      ...b,
      tons,
      value,
      percent: (tons / totalPhysicalTons) * 100,
      lotsCount,
      avgAge,
      oldestItem,
      items: matching,
    }
  })

  // Itens em envelhecimento crítico (> 90 dias) ordenados pelo mais antigo
  const criticalAgingItems = items
    .filter((it) => it.ageDays > 90)
    .sort((a, b) => b.ageDays - a.ageDays)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. CARDS RESUMO DAS 6 FAIXAS DE AGING */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {agingStats.map((bracket) => (
          <Card
            key={bracket.key}
            onClick={() => onFilterByBracket && onFilterByBracket(bracket.key)}
            className={`p-4 rounded-3xl border ${bracket.borderClass} ${bracket.bgCardClass} cursor-pointer hover:shadow-md transition-all flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between">
                <Badge className={`text-[10px] font-bold border-none ${bracket.colorClass}`}>
                  {bracket.label}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {bracket.lotsCount} lotes
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-2">
                {bracket.sublabel}
              </p>
            </div>

            <div className="space-y-1 my-3">
              <strong className="text-xl font-serif font-bold text-slate-900 block">
                {formatWeight(bracket.tons)}
              </strong>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(bracket.value)}</span>
                <span className="font-bold text-slate-700">
                  {formatNumberBR(bracket.percent, 1)}%
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/50 text-[10px] text-muted-foreground flex items-center justify-between">
              <span>Idade Média:</span>
              <strong className="text-slate-800">{bracket.avgAge} dias</strong>
            </div>
          </Card>
        ))}
      </div>

      {/* 2. GRÁFICO VISUAL DA DISTRIBUIÇÃO CRONOLÓGICA (BARRA HORIZONTAL SEGMENTADA) */}
      <Card className="p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-border/50 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-primary">
              Distribuição Cronológica do Estoque (Aging CIAFAL)
            </h3>
            <p className="text-xs text-muted-foreground">
              Proporção em volume de toneladas (t) alocado em cada estágio de permanência física.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono bg-slate-50">
            Total Físico: {formatWeight(totalPhysicalTons)}
          </Badge>
        </div>

        {/* Barra de Progresso Segmentada */}
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {agingStats.map((b) => (
            <div
              key={b.key}
              style={{ width: `${b.percent}%` }}
              title={`${b.label}: ${formatWeight(b.tons)} (${formatNumberBR(b.percent, 1)}%)`}
              className={`h-full transition-all hover:opacity-90 ${
                b.key === '0-30'
                  ? 'bg-emerald-500'
                  : b.key === '31-60'
                    ? 'bg-teal-500'
                    : b.key === '61-90'
                      ? 'bg-blue-500'
                      : b.key === '91-120'
                        ? 'bg-amber-500'
                        : b.key === '121-180'
                          ? 'bg-orange-500'
                          : 'bg-rose-600'
              }`}
            />
          ))}
        </div>

        {/* Legenda Explicativa */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-muted-foreground">
          {agingStats.map((b) => (
            <div key={b.key} className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  b.key === '0-30'
                    ? 'bg-emerald-500'
                    : b.key === '31-60'
                      ? 'bg-teal-500'
                      : b.key === '61-90'
                        ? 'bg-blue-500'
                        : b.key === '91-120'
                          ? 'bg-amber-500'
                          : b.key === '121-180'
                            ? 'bg-orange-500'
                            : 'bg-rose-600'
                }`}
              />
              <span>
                {b.label}: <strong>{formatNumberBR(b.percent, 1)}%</strong> ({formatWeight(b.tons)})
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. TABELA DETALHADA DE ITENS EM ENVELHECIMENTO CRÍTICO (> 90 DIAS) */}
      <Card className="p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-border/50 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-slate-900">
                Lotes em Envelhecimento Crítico (&gt; 90 dias)
              </h3>
              <p className="text-xs text-muted-foreground">
                Produtos prioritários para liquidação comercial, campanhas ativas e checagem de
                qualidade física.
              </p>
            </div>
          </div>
          <Badge className="bg-rose-100 text-rose-800 border-none text-xs font-bold">
            {criticalAgingItems.length} Lotes Requerem Ação
          </Badge>
        </div>

        <div className="rounded-2xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs font-bold text-slate-700">
                  Material & Descrição
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700">
                  Centro / Depósito / Lote
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-right">
                  Volume (t)
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-right">
                  Valor Estimado
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-center">
                  Idade (Aging)
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700">
                  Última Venda / Cliente
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-center">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {criticalAgingItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {item.materialCode}
                        </span>
                        <Badge variant="outline" className="text-[9px] bg-white">
                          {item.family}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-700 font-medium line-clamp-1">
                        {item.description}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        Qualidade: {item.quality}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <strong className="text-slate-800 block">{item.plantName}</strong>
                      <span className="text-muted-foreground block text-[11px]">
                        {item.storageLocation}
                      </span>
                      <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                        {item.batchNumber || 'Sem lote'}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="space-y-0.5">
                      <strong className="text-xs text-slate-900 block">
                        {formatWeight(item.physicalTons)}
                      </strong>
                      <span className="text-[10px] text-emerald-700 block">
                        Livre: {formatWeight(item.availableTons)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="space-y-0.5">
                      <strong className="text-xs text-slate-900 block">
                        {formatCurrency(item.estimatedTotalValue)}
                      </strong>
                      <span className="text-[10px] text-muted-foreground block">
                        R$ {formatNumberBR(item.historicAvgPriceKg, 2)}/kg
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="inline-flex flex-col items-center">
                      <Badge
                        className={`text-[10px] font-bold border-none ${
                          item.ageDays > 180
                            ? 'bg-rose-100 text-rose-800'
                            : item.ageDays > 120
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {item.ageDays} dias
                      </Badge>
                      <span className="text-[9px] text-muted-foreground mt-0.5">
                        Entrada: {item.entryDate}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <span className="text-slate-800 font-medium block truncate max-w-[180px]">
                        {item.lastCustomerName || 'Sem histórico recente'}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        {item.lastSaleDate ? `Venda em: ${item.lastSaleDate}` : 'Sem registro'}
                      </span>
                      {item.assignedSellerName && (
                        <span className="text-[10px] text-primary block">
                          Vend.: {item.assignedSellerName}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      onClick={() => onRequestCheck(item)}
                      className="h-8 text-xs rounded-xl bg-primary hover:bg-primary/90 text-white font-bold gap-1 shadow-xs"
                    >
                      <Warehouse className="w-3.5 h-3.5" />
                      <span>Checar</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
