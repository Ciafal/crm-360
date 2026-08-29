import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SopExecutivePlan, UnitType } from '@/types/sop'
import { formatCiafalMetric } from '@/services/forecast_engine'
import {
  Factory,
  Boxes,
  Truck,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SopExecutiveDashboardViewProps {
  plan: SopExecutivePlan
  unit: UnitType
}

export function SopExecutiveDashboardView({ plan, unit }: SopExecutiveDashboardViewProps) {
  const isTons = unit === 't'

  return (
    <div className="space-y-6">
      {/* 1. FLUXO INTEGRADO: DEMANDA S&OP ➔ ESTOQUE ➔ PCP ➔ TMS ➔ FATURAMENTO */}
      <Card className="rounded-3xl border border-border/60 bg-white/95 shadow-xs overflow-hidden">
        <CardHeader className="p-5 border-b border-border/40 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-primary" />
                <CardTitle className="font-serif text-lg font-bold text-primary">
                  S&OP Executivo CIAFAL — Balanço de Demanda & Capacidade
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Metodologia oficial de conciliação: Demanda Confirmada (SAP) + Demanda Prevista
                (Forecast) vs WMS & PCP.
              </p>
            </div>

            <Badge className="bg-emerald-100 text-emerald-800 border-none text-xs font-bold font-mono">
              Status Industrial: 🟢 {plan.industrialStatus}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* EQUAÇÃO DA DEMANDA TOTAL S&OP */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-border/40">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                1. Demanda Confirmada
              </span>
              <strong className="text-sm font-bold text-blue-900 block font-mono">
                {formatCiafalMetric(plan.sapBacklogTons, 't')}
              </strong>
              <span className="text-[10px] text-muted-foreground">Pedidos na Carteira SAP</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                2. Demanda Prevista
              </span>
              <strong className="text-sm font-bold text-amber-900 block font-mono">
                {formatCiafalMetric(plan.unconvertedForecastTons, 't')}
              </strong>
              <span className="text-[10px] text-muted-foreground">
                Forecast não convertido (sem duplicar)
              </span>
            </div>

            <div className="space-y-1 border-l pl-3 border-border/60">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                = Demanda Total S&OP
              </span>
              <strong className="text-base font-extrabold text-primary block font-mono">
                {formatCiafalMetric(plan.sopTotalDemandTons, 't')}
              </strong>
              <span className="text-[10px] text-emerald-700 font-semibold">
                Base do Plano Mestre
              </span>
            </div>

            <div className="space-y-1 bg-white p-2.5 rounded-xl border border-border/60">
              <span className="text-[10px] uppercase font-bold text-slate-700 block">
                Meta Aprovada
              </span>
              <strong className="text-sm font-bold text-slate-800 block font-mono">
                {formatCiafalMetric(plan.targetTotalTons, 't')}
              </strong>
              <span className="text-[10px] text-muted-foreground">Orçado no CRM</span>
            </div>
          </div>

          {/* BALANÇO DE CAPACIDADE INDUSTRIAL (PCP) & ESTOQUE (WMS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CARD 1: NECESSIDADE LÍQUIDA DE PRODUÇÃO */}
            <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-indigo-700" /> Necessidade Líquida PCP
                </span>
                <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">Cálculo S&OP</Badge>
              </div>

              <div className="space-y-1">
                <div className="font-serif text-2xl font-bold text-indigo-950 font-mono">
                  {formatCiafalMetric(plan.netProductionRequirementTons, 't')}
                </div>
                <p className="text-[11px] text-indigo-900/80">
                  = Demanda ({formatCiafalMetric(plan.sopTotalDemandTons, 't')}) − Estoque WMS (
                  {formatCiafalMetric(plan.wmsStockTons, 't')}) − Programado (
                  {formatCiafalMetric(plan.scheduledProductionTons, 't')})
                </p>
              </div>

              <div className="pt-1 border-t border-indigo-200/60 flex justify-between text-[11px] text-indigo-900">
                <span>Estoque WMS Livre:</span>
                <strong>{formatCiafalMetric(plan.wmsStockTons, 't')}</strong>
              </div>
            </div>

            {/* CARD 2: GAP INDUSTRIAL (PCP) */}
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                  <Factory className="w-4 h-4 text-emerald-700" /> Capacidade & Gap Industrial
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                  {plan.industrialStatus === 'ATENDIDO' ? '🟢 Atendido' : 'Atenção'}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="font-serif text-2xl font-bold text-emerald-950 font-mono">
                  +{formatCiafalMetric(plan.industrialGapTons, 't')}
                </div>
                <p className="text-[11px] text-emerald-900/80">
                  Capacidade PCP ({formatCiafalMetric(plan.pcpCapacityTons, 't')}) absorve a
                  necessidade de {formatCiafalMetric(plan.netProductionRequirementTons, 't')} com
                  folga industrial.
                </p>
              </div>

              <div className="pt-1 border-t border-emerald-200/60 flex justify-between text-[11px] text-emerald-900">
                <span>Capacidade Disponível:</span>
                <strong>{formatCiafalMetric(plan.pcpCapacityTons, 't')}</strong>
              </div>
            </div>

            {/* CARD 3: LOGÍSTICA & EXPEDIÇÃO (TMS) */}
            <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-sky-950 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-sky-700" /> Logística & TMS
                </span>
                <Badge className="bg-sky-100 text-sky-800 text-[10px]">Expedição OK</Badge>
              </div>

              <div className="space-y-1">
                <div className="font-serif text-2xl font-bold text-sky-950 font-mono">
                  {formatCiafalMetric(plan.tmsProgrammedTons, 't')}
                </div>
                <p className="text-[11px] text-sky-900/80">
                  Programação de frota e contratos TMS cobrem 100% da expedição planejada do mês.
                </p>
              </div>

              <div className="pt-1 border-t border-sky-200/60 flex justify-between text-[11px] text-sky-900">
                <span>Capacidade TMS:</span>
                <strong>{formatCiafalMetric(plan.expeditionCapacityTons, 't')}</strong>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. WATERFALL DE FATURAMENTO FACTÍVEL (DECOMPOSIÇÃO DE GAPS) */}
      <Card className="rounded-3xl border border-border/60 bg-white/95 shadow-xs overflow-hidden">
        <CardHeader className="p-5 border-b border-border/40 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-700" />
              <CardTitle className="font-serif text-lg font-bold text-primary">
                Waterfall de Faturamento Factível S&OP (Meta ➔ Faturamento Líquido)
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Não assume venda prevista como faturamento automático. Desconta restrições de crédito,
              ruptura e prazos.
            </p>
          </div>

          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-xl">
            Previsão Factível: {formatCiafalMetric(plan.revenueForecastBrl, 'brl')}
          </span>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
            {plan.waterfallSteps.map((step, idx) => {
              const isPositive = step.value >= 0 && step.type !== 'negative'
              const isTotal = step.type === 'total'

              return (
                <div
                  key={idx}
                  className={cn(
                    'p-3.5 rounded-2xl border flex flex-col justify-between space-y-2',
                    isTotal
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                      : step.type === 'negative'
                        ? 'bg-rose-50/70 border-rose-200 text-slate-800'
                        : step.type === 'positive'
                          ? 'bg-blue-50/70 border-blue-200 text-slate-800'
                          : 'bg-slate-50 border-slate-200 text-slate-800',
                  )}
                >
                  <div>
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider block',
                        isTotal ? 'text-emerald-200' : 'text-muted-foreground',
                      )}
                    >
                      {step.name}
                    </span>
                    <strong
                      className={cn(
                        'font-serif text-base block font-mono mt-1',
                        isTotal
                          ? 'text-white'
                          : step.type === 'negative'
                            ? 'text-rose-700'
                            : step.type === 'positive'
                              ? 'text-blue-700'
                              : 'text-slate-900',
                      )}
                    >
                      {step.value < 0 ? `-` : step.type === 'positive' ? `+` : ``}
                      {formatCiafalMetric(Math.abs(step.value), 'brl')}
                    </strong>
                  </div>

                  <p
                    className={cn(
                      'text-[10px] leading-tight',
                      isTotal ? 'text-emerald-100' : 'text-muted-foreground',
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* DECOMPOSIÇÃO DE CAUSAS DE GAP */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-border/40 space-y-2">
            <strong className="text-xs text-slate-800 block font-semibold">
              Detalhamento de Causas de Gaps Identificadas pelo Comitê:
            </strong>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-white rounded-xl border border-border/60">
                <span className="text-muted-foreground block text-[10px]">
                  Restrição Crédito SAP:
                </span>
                <strong className="text-rose-700 font-mono">140 t (R$ 910k)</strong>
              </div>
              <div className="p-2 bg-white rounded-xl border border-border/60">
                <span className="text-muted-foreground block text-[10px]">Ruptura WMS:</span>
                <strong className="text-amber-700 font-mono">85 t (R$ 552k)</strong>
              </div>
              <div className="p-2 bg-white rounded-xl border border-border/60">
                <span className="text-muted-foreground block text-[10px]">
                  Postergações Cliente:
                </span>
                <strong className="text-slate-700 font-mono">65 t (R$ 422k)</strong>
              </div>
              <div className="p-2 bg-white rounded-xl border border-border/60">
                <span className="text-muted-foreground block text-[10px]">Outras Causas:</span>
                <strong className="text-slate-700 font-mono">20 t (R$ 130k)</strong>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. FLUXO REVERSO: CAPACIDADE OCIOSA ➔ OPORTUNIDADES COMERCIAIS */}
      <Card className="rounded-3xl border border-amber-300 bg-amber-50/30 shadow-xs overflow-hidden">
        <CardHeader className="p-5 border-b border-amber-200/60 bg-amber-100/30">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-800" />
            <CardTitle className="font-serif text-lg font-bold text-amber-950">
              Fluxo Reverso: Capacidade Ociosa & Sobras ➔ Oportunidades no Meu Dia
            </CardTitle>
          </div>
          <p className="text-xs text-amber-900/80 mt-0.5">
            PCP/WMS detecta sobra ➔ CRM cruza histórico QLIK ➔ IA identifica clientes propensos ➔
            Oportunidade enviada ao Vendedor.
          </p>
        </CardHeader>

        <CardContent className="p-5 space-y-3">
          {plan.idleCapacityOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                <div>
                  <strong className="text-sm font-bold text-slate-900">{opp.productFamily}</strong>
                  <span className="text-xs text-amber-800 block font-mono">
                    Sobra Disponível no WMS/PCP:{' '}
                    <strong>{formatCiafalMetric(opp.idleTons, 't')}</strong>
                  </span>
                </div>
                <Badge className="bg-amber-100 text-amber-900 text-xs border-none font-bold">
                  Margem Estimada: 18.5%
                </Badge>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  Clientes Recomendados pela IA para Atacar Agora:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {opp.targetCustomers.map((cust) => (
                    <div
                      key={cust.customerId}
                      className="p-2.5 rounded-xl bg-slate-50 border border-border/60 flex items-center justify-between"
                    >
                      <div>
                        <strong className="block text-xs text-slate-800">
                          {cust.customerName}
                        </strong>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Histórico: {cust.historicalVolumeTons} t • Potencial: {cust.potentialTons}{' '}
                          t
                        </span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Ação: {cust.suggestedAction}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
