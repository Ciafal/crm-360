import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  UserCheck,
  Percent,
  ShoppingCart,
  Receipt,
  PhoneCall,
  UserX,
  Target,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Scale,
} from 'lucide-react'
import type { PortfolioCoverageMetrics, GoalPaceMetrics } from '@/types/cockpit'

interface SellerDailyCockpitHeaderProps {
  coverageMetrics: PortfolioCoverageMetrics
  goalMetrics: GoalPaceMetrics
  oitfPct: number
  unit: 'REVENUE' | 'TONS'
  onDrilldownClick: (
    type:
      | 'TOTAIS'
      | 'ATIVOS'
      | 'COBERTURA'
      | 'PEDIDO'
      | 'FATURAMENTO'
      | 'CONTATO'
      | 'SEM_MOVIMENTACAO'
      | 'META'
      | 'ATINGIMENTO'
      | 'OITF',
  ) => void
}

export function SellerDailyCockpitHeader({
  coverageMetrics,
  goalMetrics,
  oitfPct,
  unit,
  onDrilldownClick,
}: SellerDailyCockpitHeaderProps) {
  const isTons = unit === 'TONS'
  const metaDisplay = isTons
    ? `${goalMetrics.metaTons.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t`
    : `R$ ${goalMetrics.metaReais.toLocaleString('pt-BR')}`
  const realizadoDisplay = isTons
    ? `${goalMetrics.realizadoTons.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t`
    : `R$ ${goalMetrics.realizadoReais.toLocaleString('pt-BR')}`
  const atingimento = isTons ? goalMetrics.atingimentoTonsPct : goalMetrics.atingimentoReaisPct

  return (
    <div className="w-full space-y-2">
      {/* Faixa Executiva com 10 KPIs Compactos e Clicáveis */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {/* 1. CLIENTES TOTAIS */}
        <button
          type="button"
          onClick={() => onDrilldownClick('TOTAIS')}
          className="p-2.5 rounded-2xl bg-white/95 hover:bg-slate-50 border border-border/50 hover:border-primary/40 transition-all text-left shadow-xs flex flex-col justify-between group cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary">
              Totais
            </span>
            <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary" />
          </div>
          <div className="mt-1">
            <span className="font-serif text-lg font-bold text-slate-900 block leading-tight">
              {coverageMetrics.totalClientes}
            </span>
            <span className="text-[9px] text-muted-foreground">Carteira total</span>
          </div>
        </button>

        {/* 2. CLIENTES ATIVOS NO MÊS */}
        <button
          type="button"
          onClick={() => onDrilldownClick('ATIVOS')}
          className="p-2.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-400 transition-all text-left shadow-xs flex flex-col justify-between group cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Ativos Mês
            </span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1">
            <span className="font-serif text-lg font-bold text-emerald-900 block leading-tight">
              {coverageMetrics.clientesAtivosMes}
            </span>
            <span className="text-[9px] text-emerald-700 font-medium">Clientes únicos</span>
          </div>
        </button>

        {/* 3. COBERTURA DA CARTEIRA */}
        <button
          type="button"
          onClick={() => onDrilldownClick('COBERTURA')}
          className="p-2.5 rounded-2xl bg-sky-50/80 hover:bg-sky-50 border border-sky-200 hover:border-sky-400 transition-all text-left shadow-xs flex flex-col justify-between group cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-900">
              Cobertura
            </span>
            <Percent className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="mt-1">
            <span className="font-serif text-lg font-bold text-sky-950 block leading-tight">
              {coverageMetrics.coberturaAtualPct.toFixed(1)}%
            </span>
            <span className="text-[9px] text-sky-700 font-medium">
              Meta: {coverageMetrics.metaCoberturaPct}%
            </span>
          </div>
        </button>

        {/* 4. COM PEDIDO */}
        <button
          type="button"
          onClick={() => onDrilldownClick('PEDIDO')}
          className="p-2.5 rounded-2xl bg-white/95 hover:bg-slate-50 border border-border/50 hover:border-primary/40 transition-all text-left shadow-xs flex flex-col justify-between group cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary">
              Com Pedido
            </span>
            <ShoppingCart className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary" />
          </div>
          <div className="mt-1">
            <span className="font-serif text-lg font-bold text-slate-900 block leading-tight">
              {coverageMetrics.comPedido}
            </span>
            <span className="text-[9px] text-muted-foreground">OVs geradas</span>
          </div>
        </button>

        {/* 5. COM FATURAMENTO */}
        <button
          type="button"
          onClick={() => onDrilldownClick('FATURAMENTO')}
          className="p-2.5 rounded-2xl bg-white/95 hover:bg-slate-50 border border-border/50 hover:border-primary/40 transition-all text-left shadow-xs flex flex-col justify-between group cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary">
              Faturados
            </span>
            <Receipt className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary" />
          </div>
          <div className="mt-1">
            <span className="font-serif text-lg font-bold text-slate-900 block leading-tight">
              {coverageMetrics.comFaturamento}
            </span>
            <span className="text-[9px] text-muted-foreground">NF-e emitidas</span>
          </div>
        </button>

        {/* 6. COM CONTATO */}
        <button
          type="button"
          onClick={() => onDrilldownClick('CONTATO')}
          className="p-2.5 rounded-2xl bg-white/95 hover:bg-slate-50 border border-border/50 hover:border-primary/40 transition-all text-left shadow-xs flex flex-col justify-between group cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary">
              Contatados
            </span>
            <PhoneCall className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary" />
          </div>
          <div className="mt-1">
            <span className="font-serif text-lg font-bold text-slate-900 block leading-tight">
              {coverageMetrics.comContato}
            </span>
            <span className="text-[9px] text-muted-foreground">Interação no mês</span>
          </div>
        </button>

        {/* 7. SEM MOVIMENTAÇÃO */}
        <button
          type="button"
          onClick={() => onDrilldownClick('SEM_MOVIMENTACAO')}
          className="p-2.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 hover:border-amber-400 transition-all text-left shadow-xs flex flex-col justify-between group cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
              Sem Movim.
            </span>
            <UserX className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-1">
            <span className="font-serif text-lg font-bold text-amber-950 block leading-tight">
              {coverageMetrics.semMovimentacaoMes}
            </span>
            <span className="text-[9px] text-amber-800 font-medium">Drill-down obrigatório</span>
          </div>
        </button>

        {/* 8. META DO MÊS */}
        <button
          type="button"
          onClick={() => onDrilldownClick('META')}
          className="p-2.5 rounded-2xl bg-white/95 hover:bg-slate-50 border border-border/50 hover:border-primary/40 transition-all text-left shadow-xs flex flex-col justify-between group cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary">
              Meta Mês
            </span>
            <Target className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="mt-1">
            <span className="font-serif text-sm font-bold text-slate-900 block leading-tight truncate">
              {metaDisplay}
            </span>
            <span className="text-[9px] text-muted-foreground">Objetivo {isTons ? 't' : 'R$'}</span>
          </div>
        </button>

        {/* 9. ATINGIMENTO */}
        <button
          type="button"
          onClick={() => onDrilldownClick('ATINGIMENTO')}
          className="p-2.5 rounded-2xl bg-primary/10 hover:bg-primary/15 border border-primary/20 hover:border-primary/40 transition-all text-left shadow-xs flex flex-col justify-between group cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Atingimento
            </span>
            <Trophy className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="mt-1">
            <span className="font-serif text-lg font-bold text-primary block leading-tight">
              {atingimento.toFixed(1)}%
            </span>
            <span className="text-[9px] text-primary/80 font-medium truncate">
              Real: {realizadoDisplay}
            </span>
          </div>
        </button>

        {/* 10. OITF */}
        <button
          type="button"
          onClick={() => onDrilldownClick('OITF')}
          className="p-2.5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200 hover:border-indigo-400 transition-all text-left shadow-xs flex flex-col justify-between group cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">
              OITF
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="mt-1">
            <span className="font-serif text-lg font-bold text-indigo-950 block leading-tight">
              {oitfPct.toFixed(1)}%
            </span>
            <span className="text-[9px] text-indigo-700 font-medium">Meta 95,0%</span>
          </div>
        </button>
      </div>
    </div>
  )
}
