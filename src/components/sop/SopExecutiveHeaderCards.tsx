import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SopExecutivePlan, UnitType } from '@/types/sop'
import { formatCiafalMetric } from '@/services/forecast_engine'
import {
  TrendingUp,
  Target,
  FileCheck2,
  Boxes,
  Factory,
  AlertTriangle,
  Truck,
  DollarSign,
  Award,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SopExecutiveHeaderCardsProps {
  plan: SopExecutivePlan
  unit: UnitType
  onCardClick?: (cardKey: string) => void
  selectedCard?: string
}

export function SopExecutiveHeaderCards({
  plan,
  unit,
  onCardClick,
  selectedCard,
}: SopExecutiveHeaderCardsProps) {
  const isTons = unit === 't'

  const cards = [
    {
      key: 'forecast',
      title: 'Forecast Consensual',
      value: isTons
        ? formatCiafalMetric(plan.forecastTotalTons, 't')
        : formatCiafalMetric(plan.forecastTotalBrl, 'brl'),
      badge: 'Camada F4',
      badgeColor: 'bg-primary/10 text-primary border-primary/20',
      source: 'Fonte: Motor + S&OP',
      icon: TrendingUp,
    },
    {
      key: 'meta',
      title: 'Meta Aprovada',
      value: isTons
        ? formatCiafalMetric(plan.targetTotalTons, 't')
        : formatCiafalMetric(plan.targetTotalBrl, 'brl'),
      badge: '+2.8% vs Plano',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      source: 'Fonte: CRM 360º',
      icon: Target,
    },
    {
      key: 'carteira',
      title: 'Carteira Confirmada',
      value: isTons
        ? formatCiafalMetric(plan.sapBacklogTons, 't')
        : formatCiafalMetric(plan.sapBacklogBrl, 'brl'),
      badge: '65.5% Coberto',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      source: 'Fonte: SAP ECC',
      icon: FileCheck2,
    },
    {
      key: 'estoque',
      title: 'Estoque Disponível',
      value: formatCiafalMetric(plan.wmsStockTons, 't'),
      badge: 'Giro 18 dias',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      source: 'Fonte: WMS',
      icon: Boxes,
    },
    {
      key: 'producao',
      title: 'Necessidade Líquida',
      value: formatCiafalMetric(plan.netProductionRequirementTons, 't'),
      badge: 'PCP Solicitado',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      source: 'Fonte: S&OP / PCP',
      icon: Factory,
    },
    {
      key: 'capacidade',
      title: 'Capacidade PCP',
      value: formatCiafalMetric(plan.pcpCapacityTons, 't'),
      badge: 'Nominal 3 Turnos',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      source: 'Fonte: PCP Robotizado',
      icon: Factory,
    },
    {
      key: 'gap',
      title: 'Gap Industrial',
      value: `+${formatCiafalMetric(plan.industrialGapTons, 't')}`,
      badge:
        plan.industrialStatus === 'ATENDIDO'
          ? '🟢 Atendido'
          : plan.industrialStatus === 'ATENCAO'
            ? '🟡 Atenção'
            : '🔴 Déficit',
      badgeColor:
        plan.industrialStatus === 'ATENDIDO'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-rose-50 text-rose-700 border-rose-200',
      source: 'Fonte: PCP / S&OP',
      icon: AlertTriangle,
    },
    {
      key: 'expedicao',
      title: 'Expedição & TMS',
      value: formatCiafalMetric(plan.tmsProgrammedTons, 't'),
      badge: 'Frota 100% OK',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      source: 'Fonte: TMS',
      icon: Truck,
    },
    {
      key: 'faturamento',
      title: 'Forecast Faturamento',
      value: formatCiafalMetric(plan.revenueForecastBrl, 'brl'),
      badge: 'Factível Líquido',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
      source: 'Fonte: Waterfall S&OP',
      icon: DollarSign,
    },
    {
      key: 'fva',
      title: 'Forecast Value Add',
      value: '+3.6% FVA Médio',
      badge: 'IA & Gestão agregam',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
      source: 'Fonte: Motor Preditivo',
      icon: Award,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {cards.map((c) => {
        const Icon = c.icon
        const isSelected = selectedCard === c.key

        return (
          <Card
            key={c.key}
            onClick={() => onCardClick?.(c.key)}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/40 rounded-2xl bg-white border border-border/60 relative overflow-hidden',
              isSelected && 'ring-2 ring-primary border-transparent bg-primary/5 shadow-xs',
            )}
          >
            <CardContent className="p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground truncate block max-w-[120px]">
                  {c.title}
                </span>
                <div className="p-1 rounded-lg bg-slate-50 text-slate-600">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-serif text-lg font-bold text-slate-900 tracking-tight leading-none">
                  {c.value}
                </div>
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <Badge
                    variant="outline"
                    className={cn('text-[9px] px-1.5 py-0 font-medium', c.badgeColor)}
                  >
                    {c.badge}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground/80 font-mono">{c.source}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
