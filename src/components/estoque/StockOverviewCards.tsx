import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  Layers,
  Scale,
  Clock,
  AlertTriangle,
  Flame,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Box,
  Truck,
  Factory,
} from 'lucide-react'
import type { StockOverviewKpis } from '@/types/stock'
import { formatCurrency, formatWeight, formatNumberBR } from '@/lib/utils'

interface StockOverviewCardsProps {
  kpis: StockOverviewKpis
  onSelectFilterQuick?: (type: string) => void
}

export function StockOverviewCards({ kpis, onSelectFilterQuick }: StockOverviewCardsProps) {
  return (
    <div className="space-y-4">
      {/* LINHA 1: KPIS MESTRES EXECUTIVOS (4 CARDS PRINCIPAIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: ESTOQUE TOTAL DISPONÍVEL */}
        <Card className="bg-white/95 backdrop-blur-md border-border/50 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              Estoque Físico Total
            </span>
            <div className="p-2 bg-primary/10 rounded-2xl text-primary">
              <Scale className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1 mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="font-serif text-3xl font-bold text-primary tracking-tight">
                {formatWeight(kpis.totalPhysicalTons)}
              </h3>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-slate-100">
              <span>Disponível p/ Venda:</span>
              <strong className="text-emerald-700 font-bold">
                {formatWeight(kpis.totalAvailableTons)}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2 text-[11px] text-muted-foreground">
            <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 font-medium font-mono text-[10px]">
              {kpis.availableSkusCount} SKUs Ativos
            </span>
            <span>Média {formatWeight(kpis.avgStockTons)}/SKU</span>
          </div>
        </Card>

        {/* CARD 2: CAPITAL IMOBILIZADO & VALOR FINANCEIRO */}
        <Card className="bg-white/95 backdrop-blur-md border-border/50 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              Valor Financeiro Estimado
            </span>
            <div className="p-2 bg-emerald-50 rounded-2xl text-emerald-800">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1 mt-3">
            <h3 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(kpis.totalEstimatedValueBrl)}
            </h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-slate-100">
              <span>Livre p/ Faturamento:</span>
              <strong className="text-slate-800 font-bold">
                {formatCurrency(kpis.availableForSaleValueBrl)}
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 text-[11px]">
            <span className="text-muted-foreground">Em Parados/Envelhecidos:</span>
            <span className="font-bold text-rose-700 font-mono text-[10px]">
              {formatCurrency(kpis.imobilizedCapitalInStagnantBrl)}
            </span>
          </div>
        </Card>

        {/* CARD 3: GIRO MÉDIO & COBERTURA */}
        <Card className="bg-white/95 backdrop-blur-md border-border/50 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              Giro Médio & Cobertura
            </span>
            <div className="p-2 bg-blue-50 rounded-2xl text-blue-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1 mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">
                {formatNumberBR(kpis.avgTurnoverRate, 1)}x
              </h3>
              <span className="text-xs text-muted-foreground font-medium">giro anual</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-slate-100">
              <span>Cobertura Estimada:</span>
              <strong className="text-slate-800 font-bold">
                {kpis.estimatedCoverageDays} dias
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3 pt-2 text-[11px] text-muted-foreground">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>Ritmo Médio Expedição ~ 22.5 t/dia</span>
          </div>
        </Card>

        {/* CARD 4: ENVELHECIMENTO & CRÍTICOS */}
        <Card className="bg-white/95 backdrop-blur-md border-border/50 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              Estoque Envelhecido / Parado
            </span>
            <div className="p-2 bg-rose-50 rounded-2xl text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1 mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="font-serif text-3xl font-bold text-rose-700 tracking-tight">
                {formatNumberBR(kpis.agingStockPercent, 1)}%
              </h3>
              <span className="text-xs text-muted-foreground font-medium">&gt; 90 dias</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-slate-100">
              <span>SKUs Críticos / Parados:</span>
              <strong className="text-rose-700 font-bold">
                {kpis.criticalProductsCount} itens
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 text-[11px]">
            <span className="text-muted-foreground">Sem giro há &gt; 90d:</span>
            <Badge
              variant="outline"
              className="text-[10px] bg-rose-50 text-rose-800 border-rose-200"
            >
              {kpis.noMovementCount} SKUs
            </Badge>
          </div>
        </Card>
      </div>

      {/* LINHA 2: SEGREGADOR DE SALDOS (Regra 15 - Físico vs Comprometido vs Bloqueado vs Projetado) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Físico no WMS
          </span>
          <strong className="text-lg font-serif font-bold text-white block">
            {formatWeight(kpis.totalPhysicalTons)}
          </strong>
          <span className="text-[10px] text-slate-400 block">Total Pátios/CDs</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-800 block tracking-wider">
            Disponível Venda
          </span>
          <strong className="text-lg font-serif font-bold text-emerald-900 block">
            {formatWeight(kpis.totalAvailableTons)}
          </strong>
          <span className="text-[10px] text-emerald-800 block">Livre p/ cotações</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-800 block tracking-wider">
            Comprometido
          </span>
          <strong className="text-lg font-serif font-bold text-amber-900 block">
            {formatWeight(kpis.totalCommittedTons)}
          </strong>
          <span className="text-[10px] text-amber-800 block">Pedidos / Reservas</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-blue-800 block tracking-wider">
            Em Checagem
          </span>
          <strong className="text-lg font-serif font-bold text-blue-900 block">
            {formatWeight(kpis.totalInCheckTons)}
          </strong>
          <span className="text-[10px] text-blue-800 block">WMS em verificação</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-rose-800 block tracking-wider">
            Bloqueado / Insp.
          </span>
          <strong className="text-lg font-serif font-bold text-rose-900 block">
            {formatWeight(kpis.totalBlockedTons + kpis.totalInspectionTons)}
          </strong>
          <span className="text-[10px] text-rose-800 block">CQ / Avaria técnica</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-purple-800 block tracking-wider">
            PCP Projetado
          </span>
          <strong className="text-lg font-serif font-bold text-purple-900 block">
            +{formatWeight(kpis.totalProjectedPcpTons)}
          </strong>
          <span className="text-[10px] text-purple-800 block">Produção Futura (Não Faturável)</span>
        </div>
      </div>
    </div>
  )
}
