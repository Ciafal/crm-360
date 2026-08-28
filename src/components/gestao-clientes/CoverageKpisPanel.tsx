// src/components/gestao-clientes/CoverageKpisPanel.tsx
import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react'
import type { CoverageSummaryKpi } from '@/types/customer_management'

interface CoverageKpisPanelProps {
  kpis: CoverageSummaryKpi
  onSelectFilter?: (filterType: string) => void
}

export function CoverageKpisPanel({ kpis, onSelectFilter }: CoverageKpisPanelProps) {
  return (
    <div className="space-y-4">
      {/* 1. CARDS PRINCIPAIS DA COBERTURA */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Card 1: Cobertura Geral */}
        <Card
          onClick={() => onSelectFilter && onSelectFilter('todos')}
          className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Cobertura Geral
            </span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="my-1.5">
            <span className="font-serif text-2xl font-bold text-white tracking-tight">
              {kpis.coberturaGeralPct}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Meta: <strong className="text-sky-300">{kpis.metaCoberturaPct}%</strong> (Gap:{' '}
              {kpis.gapParaMetaPct}%)
            </span>
          </div>
          <div className="space-y-1">
            <Progress value={kpis.coberturaGeralPct} className="h-1.5 bg-slate-800" />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>{kpis.totalCobertos} cobertos</span>
              <span>{kpis.totalElegiveis} elegíveis</span>
            </div>
          </div>
        </Card>

        {/* Card 2: Clientes Descobertos */}
        <Card
          onClick={() => onSelectFilter && onSelectFilter('descobertos')}
          className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
              Sem Cobertura
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-1.5">
            <span className="font-serif text-2xl font-bold text-rose-400 tracking-tight">
              {kpis.totalDescobertos}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Clientes fora da janela esperada
            </span>
          </div>
          <div className="text-[9px] text-rose-300 font-medium pt-1 border-t border-slate-800">
            {kpis.totalVencidos} clientes vencidos
          </div>
        </Card>

        {/* Card 3: Estratégicos */}
        <Card
          onClick={() => onSelectFilter && onSelectFilter('estrategicos')}
          className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
              Estratégicos (15d)
            </span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-1.5">
            <span className="font-serif text-2xl font-bold text-white tracking-tight">
              {kpis.coberturaEstrategicosPct}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Janela quinzenal rígida</span>
          </div>
          <Progress value={kpis.coberturaEstrategicosPct} className="h-1.5 bg-slate-800" />
        </Card>

        {/* Card 4: Clientes A */}
        <Card
          onClick={() => onSelectFilter && onSelectFilter('clientes_a')}
          className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Clientes A (30d)
            </span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-1.5">
            <span className="font-serif text-2xl font-bold text-white tracking-tight">
              {kpis.coberturaClientesAPct}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Janela mensal esperada</span>
          </div>
          <Progress value={kpis.coberturaClientesAPct} className="h-1.5 bg-slate-800" />
        </Card>

        {/* Card 5: Em Risco */}
        <Card
          onClick={() => onSelectFilter && onSelectFilter('em_risco')}
          className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-orange-500/50 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
              Em Risco (15d)
            </span>
            <ShieldAlert className="w-4 h-4 text-orange-400" />
          </div>
          <div className="my-1.5">
            <span className="font-serif text-2xl font-bold text-orange-400 tracking-tight">
              {kpis.coberturaEmRiscoPct}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Atuação intensiva de retenção
            </span>
          </div>
          <Progress value={kpis.coberturaEmRiscoPct} className="h-1.5 bg-slate-800" />
        </Card>

        {/* Card 6: Prospects */}
        <Card
          onClick={() => onSelectFilter && onSelectFilter('prospects')}
          className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
              Prospects (20d)
            </span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="my-1.5">
            <span className="font-serif text-2xl font-bold text-white tracking-tight">
              {kpis.coberturaProspectsPct}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Evolução do funil comercial
            </span>
          </div>
          <Progress value={kpis.coberturaProspectsPct} className="h-1.5 bg-slate-800" />
        </Card>
      </div>

      {/* 2. BARRA DE REGRAS E PARÂMETROS DA COBERTURA */}
      <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            <strong>Frequência Parametrizada:</strong> Estratégicos: <strong>15d</strong> · Clientes
            A: <strong>30d</strong> · Clientes B: <strong>45d</strong> · Clientes C:{' '}
            <strong>60d</strong> · Risco: <strong>15d</strong>
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>
            Interações válidas: WhatsApp, Telefone, E-mail, Visitas presenciais e Reuniões
          </span>
        </div>
      </div>
    </div>
  )
}
