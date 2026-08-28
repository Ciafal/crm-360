import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BellRing,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Package,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ProactiveAlertType = 'CRITICO' | 'ATENCAO' | 'POSITIVO'

export interface ProactiveAlertItem {
  id: string
  type: ProactiveAlertType
  category: 'META' | 'CLIENTE' | 'PRODUTO' | 'COTACAO' | 'MARGEM' | 'ESTOQUE' | 'CREDITO'
  title: string
  description: string
  actionLabel: string
  actionHandler?: () => void
  timestamp: string
}

export interface ProactiveAlertsSectionProps {
  alerts?: ProactiveAlertItem[]
  onExecuteAlert?: (alert: ProactiveAlertItem) => void
  className?: string
}

export const MOCK_PROACTIVE_ALERTS: ProactiveAlertItem[] = [
  {
    id: 'alt-01',
    type: 'CRITICO',
    category: 'META',
    title: 'Pipeline Ponderado cobre 72% do gap restante',
    description: 'Faltam 78 t qualificadas para atingir o nível de segurança de 1.0x da meta.',
    actionLabel: 'Abrir Funil de Recuperação',
    timestamp: 'Hoje, 08:15',
  },
  {
    id: 'alt-02',
    type: 'CRITICO',
    category: 'CLIENTE',
    title: 'Metais Betim sem compra há 42 dias (Curva A)',
    description: 'Atraso de 14 dias em relação à frequência média histórica de compras.',
    actionLabel: 'Ligar para Comprador',
    timestamp: 'Hoje, 09:00',
  },
  {
    id: 'alt-03',
    type: 'ATENCAO',
    category: 'PRODUTO',
    title: 'Linha de Tubos Sch40 caiu 18% vs. mês anterior',
    description: 'Perda de competitividade pontual identificada na região de Contagem.',
    actionLabel: 'Ver Análise Causal',
    timestamp: 'Ontem, 17:30',
  },
  {
    id: 'alt-04',
    type: 'ATENCAO',
    category: 'COTACAO',
    title: '5 cotações paradas há mais de 48 horas',
    description: 'Volume total de 115 t sob risco de perda por ausência de follow-up ativo.',
    actionLabel: 'Disparar Follow-ups',
    timestamp: 'Hoje, 07:45',
  },
  {
    id: 'alt-05',
    type: 'POSITIVO',
    category: 'META',
    title: 'Taxa de conversão de Perfis W aumentou +6,4%',
    description: 'Atingiu 74,0% de fechamento com entrega rápida de 24h no CD Betim.',
    actionLabel: 'Ver Detalhes da Linha',
    timestamp: 'Hoje, 08:30',
  },
]

export function ProactiveAlertsSection({
  alerts = MOCK_PROACTIVE_ALERTS,
  onExecuteAlert,
  className,
}: ProactiveAlertsSectionProps) {
  return (
    <Card
      className={cn(
        'p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3.5',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-100 text-rose-800">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-900">
              Pontos de Atenção & Alertas Proativos Hoje
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Monitoramento automático multissistema focado em risco e intervenção imediata
            </p>
          </div>
        </div>

        <Badge variant="outline" className="text-[10px] font-mono bg-slate-50 text-slate-700">
          {alerts.length} alertas auditados
        </Badge>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => {
          const isCrit = alert.type === 'CRITICO'
          const isWarn = alert.type === 'ATENCAO'
          const isPos = alert.type === 'POSITIVO'

          return (
            <div
              key={alert.id}
              className={cn(
                'p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5',
                isCrit
                  ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
                  : isWarn
                    ? 'bg-amber-50/70 border-amber-200 hover:border-amber-300'
                    : 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300',
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {isCrit && <span className="text-base leading-none">🔴</span>}
                  {isWarn && <span className="text-base leading-none">🟠</span>}
                  {isPos && <span className="text-base leading-none">🟢</span>}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <strong
                      className={cn(
                        'text-xs leading-snug',
                        isCrit ? 'text-rose-950' : isWarn ? 'text-amber-950' : 'text-emerald-950',
                      )}
                    >
                      {alert.title}
                    </strong>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      • {alert.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {alert.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <Button
                  size="sm"
                  onClick={() => {
                    if (alert.actionHandler) alert.actionHandler()
                    if (onExecuteAlert) onExecuteAlert(alert)
                  }}
                  className={cn(
                    'h-7 text-[11px] font-semibold gap-1 rounded-xl shadow-xs',
                    isCrit
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : isWarn
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white',
                  )}
                >
                  <span>{alert.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
