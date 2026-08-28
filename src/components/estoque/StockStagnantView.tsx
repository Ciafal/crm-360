import React, { useState } from 'react'
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
  AlertTriangle,
  Clock,
  Warehouse,
  Flame,
  Truck,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { StockItem, StockMovementClassification } from '@/types/stock'
import { formatCurrency, formatWeight, formatNumberBR } from '@/lib/utils'

interface StockStagnantViewProps {
  items: StockItem[]
  onRequestCheck: (item: StockItem) => void
  onFindBuyers: (item: StockItem) => void
}

export function StockStagnantView({ items, onRequestCheck, onFindBuyers }: StockStagnantViewProps) {
  const [classificationTab, setClassificationTab] = useState<string>('todos')
  const [search, setSearch] = useState('')

  // Filtra itens parados ou sem movimentação
  const stagnantItems = items.filter((it) => {
    const isStagnantType =
      it.classification === 'PARADO' ||
      it.classification === 'CRITICO' ||
      it.classification === 'BAIXA_MOVIMENTACAO' ||
      it.classification === 'ATENCAO' ||
      it.daysWithoutMovement >= 30

    const matchTab = classificationTab === 'todos' ? true : it.classification === classificationTab
    const matchSearch =
      !search ||
      it.materialCode.toLowerCase().includes(search.toLowerCase()) ||
      it.description.toLowerCase().includes(search.toLowerCase()) ||
      it.family.toLowerCase().includes(search.toLowerCase()) ||
      (it.batchNumber && it.batchNumber.toLowerCase().includes(search.toLowerCase()))

    return isStagnantType && matchTab && matchSearch
  })

  // Totais de Capital Imobilizado em Parados
  const totalStagnantTons = stagnantItems.reduce((acc, it) => acc + it.physicalTons, 0)
  const totalStagnantValue = stagnantItems.reduce((acc, it) => acc + it.estimatedTotalValue, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. CARDS DE DESTAQUE DO CAPITAL IMOBILIZADO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 text-white rounded-3xl border-rose-500/30 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300">
              Capital Imobilizado em Parados
            </span>
            <Badge className="bg-rose-500 text-white font-bold text-[10px] border-none">
              Prioridade Comercial
            </Badge>
          </div>
          <h3 className="font-serif text-3xl font-bold text-white mt-3">
            {formatCurrency(totalStagnantValue)}
          </h3>
          <p className="text-xs text-rose-200/80 mt-1">
            Total de {formatWeight(totalStagnantTons)} sem giro comercial recente.
          </p>
        </Card>

        <Card className="p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-border/50 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Critério Parametrizável CIAFAL
          </span>
          <div className="space-y-1.5 my-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Atenção:</span>
              <strong className="text-amber-700 font-bold">30 a 60 dias sem giro</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Baixa Movimentação:</span>
              <strong className="text-orange-700 font-bold">61 a 120 dias</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Parado / Crítico:</span>
              <strong className="text-rose-700 font-bold">&gt; 120 dias sem vendas</strong>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">
            Classificação automática pelo SAP/CRM
          </span>
        </Card>

        <Card className="p-5 bg-blue-50/60 border border-blue-200/70 rounded-3xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary">Cruzamento Inteligente IA</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed my-2">
            A IA cruza automaticamente cada lote parado com clientes consumidores de aço na
            carteira, propondo campanhas e complementos de frete no TMS.
          </p>
          <div className="text-[10px] text-primary font-bold flex items-center gap-1">
            <span>Recomendações comerciais ativas</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Card>
      </div>

      {/* 2. FILTRO POR CLASSIFICAÇÃO E BUSCA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setClassificationTab('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              classificationTab === 'todos'
                ? 'bg-white text-primary shadow-xs font-bold'
                : 'text-muted-foreground hover:text-slate-900'
            }`}
          >
            Todos ({items.length})
          </button>
          <button
            onClick={() => setClassificationTab('CRITICO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              classificationTab === 'CRITICO'
                ? 'bg-rose-700 text-white shadow-xs font-bold'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Críticos
          </button>
          <button
            onClick={() => setClassificationTab('PARADO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              classificationTab === 'PARADO'
                ? 'bg-orange-700 text-white shadow-xs font-bold'
                : 'text-orange-800 hover:bg-orange-50'
            }`}
          >
            Parados (&gt;120d)
          </button>
          <button
            onClick={() => setClassificationTab('BAIXA_MOVIMENTACAO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              classificationTab === 'BAIXA_MOVIMENTACAO'
                ? 'bg-amber-700 text-white shadow-xs font-bold'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            Baixa Movimentação
          </button>
          <button
            onClick={() => setClassificationTab('ATENCAO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              classificationTab === 'ATENCAO'
                ? 'bg-blue-700 text-white shadow-xs font-bold'
                : 'text-blue-800 hover:bg-blue-50'
            }`}
          >
            Atenção
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar material, lote ou família..."
            className="h-8 pl-8 text-xs rounded-xl bg-white"
          />
        </div>
      </div>

      {/* 3. TABELA DE PRODUTOS PARADOS */}
      <Card className="p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-border/50 shadow-xs space-y-4">
        <div className="rounded-2xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs font-bold text-slate-700">
                  Material & Família
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700">
                  Centro / Depósito / Lote
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-right">
                  Saldo Físico / Livre (t)
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-center">
                  Dias Sem Giro
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-right">
                  Valor Estimado
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700">
                  Última Venda / Cliente
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-center">
                  Ações Comerciais
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stagnantItems.map((item) => {
                const badgeClass =
                  item.classification === 'CRITICO'
                    ? 'bg-rose-100 text-rose-800'
                    : item.classification === 'PARADO'
                      ? 'bg-orange-100 text-orange-800'
                      : item.classification === 'BAIXA_MOVIMENTACAO'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'

                return (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-primary">
                            {item.materialCode}
                          </span>
                          <Badge className={`text-[9px] font-bold border-none ${badgeClass}`}>
                            {item.classification.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-800 font-semibold line-clamp-1">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{item.family}</span>
                          <span>·</span>
                          <span>Bitola: {item.bitola}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <strong className="text-slate-800 block">{item.plantName}</strong>
                        <span className="text-muted-foreground block text-[11px]">
                          {item.storageLocation}
                        </span>
                        <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border">
                          {item.batchNumber || 'Sem lote'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="space-y-0.5">
                        <strong className="text-xs text-slate-900 block">
                          {formatWeight(item.physicalTons)}
                        </strong>
                        <span className="text-[10px] text-emerald-700 font-bold block">
                          Disponível: {formatWeight(item.availableTons)}
                        </span>
                        {item.committedTons > 0 && (
                          <span className="text-[9px] text-amber-700 block">
                            Reservado: {formatWeight(item.committedTons)}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="inline-flex flex-col items-center">
                        <Badge variant="outline" className="text-xs font-bold font-mono">
                          <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                          {item.daysWithoutMovement} dias
                        </Badge>
                        <span className="text-[9px] text-muted-foreground mt-0.5">
                          Últ. Mov.: {item.lastMovementDate}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="space-y-0.5">
                        <strong className="text-xs text-slate-900 block">
                          {formatCurrency(item.estimatedTotalValue)}
                        </strong>
                        <span className="text-[10px] text-muted-foreground block">
                          Preço Médio: R$ {formatNumberBR(item.historicAvgPriceKg, 2)}/kg
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <span className="text-slate-800 font-medium block truncate max-w-[160px]">
                          {item.lastCustomerName || 'Sem histórico recente'}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {item.lastSaleDate ? `Data: ${item.lastSaleDate}` : 'Sem registro'}
                        </span>
                        {item.lastSellerName && (
                          <span className="text-[10px] text-slate-600 block truncate">
                            Vend.: {item.lastSellerName}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => onFindBuyers(item)}
                          className="h-8 text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1 shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                          <span>Buscar Clientes</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRequestCheck(item)}
                          className="h-8 text-xs rounded-xl gap-1 text-slate-700"
                        >
                          <Warehouse className="w-3.5 h-3.5 text-primary" />
                          <span>Checar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
