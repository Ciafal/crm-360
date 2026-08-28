import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Target,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Package,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react'
import { cn, formatNumberBR, formatWeight, formatCurrency } from '@/lib/utils'

export interface MetaPlanRecoveryItem {
  id: string
  category: 'COTACOES_ALTAS' | 'CLIENTES_SEM_RECOMPRA' | 'REATIVACAO' | 'CROSS_SELL'
  title: string
  clientName: string
  productLine: string
  potentialTons: number
  probabilityPct: number
  weightedTons: number
  stockStatus: 'DISPONIVEL' | 'EM_PRODUCAO' | 'BAIXO_SALDO'
  creditStatus: 'LIBERADO' | 'LIMITE_TOMADO' | 'RESTRICAO'
  actionLabel: string
  actionHandler?: () => void
}

export interface MetaActionPlanModuleProps {
  metaRestanteTons: number // Ex: 280 t
  items?: MetaPlanRecoveryItem[]
  onExecuteItem?: (item: MetaPlanRecoveryItem) => void
  className?: string
}

export const MOCK_RECOVERY_ITEMS: MetaPlanRecoveryItem[] = [
  {
    id: 'rec-01',
    category: 'COTACOES_ALTAS',
    title: 'Cotação COT-2024-089 (Perfis W)',
    clientName: 'Estruturas Brasil Betim',
    productLine: 'Perfis Laminados W',
    potentialTons: 85,
    probabilityPct: 85,
    weightedTons: 72.25,
    stockStatus: 'DISPONIVEL',
    creditStatus: 'LIBERADO',
    actionLabel: 'Fechar proposta com condição CIF especial',
  },
  {
    id: 'rec-02',
    category: 'CLIENTES_SEM_RECOMPRA',
    title: 'Reposição Histórica Chapas A36',
    clientName: 'Metais Betim Indústria',
    productLine: 'Chapas Grossas A36',
    potentialTons: 60,
    probabilityPct: 75,
    weightedTons: 45.0,
    stockStatus: 'DISPONIVEL',
    creditStatus: 'LIBERADO',
    actionLabel: 'Acionar comprador para antecipar pedido quinzenal',
  },
  {
    id: 'rec-03',
    category: 'CROSS_SELL',
    title: 'Complemento de Cantoneiras & Barras',
    clientName: 'Caldeiraria & Usinagem Vale',
    productLine: 'Barras Chatas e Cantoneiras',
    potentialTons: 45,
    probabilityPct: 70,
    weightedTons: 31.5,
    stockStatus: 'DISPONIVEL',
    creditStatus: 'LIBERADO',
    actionLabel: 'Oferecer lote casado com frete compartilhado',
  },
  {
    id: 'rec-04',
    category: 'REATIVACAO',
    title: 'Reativação Serralherias Triângulo',
    clientName: 'Serralheria Progresso Ltda',
    productLine: 'Tubos Estruturais Sch40',
    potentialTons: 35,
    probabilityPct: 60,
    weightedTons: 21.0,
    stockStatus: 'EM_PRODUCAO',
    creditStatus: 'LIBERADO',
    actionLabel: 'Lançar campanha de reativação com primeiro frete grátis',
  },
  {
    id: 'rec-05',
    category: 'COTACOES_ALTAS',
    title: 'Cotação COT-2024-102 (Telas CA-50)',
    clientName: 'Construtora Minas Gerais',
    productLine: 'Telas Soldadas & CA-50',
    potentialTons: 50,
    probabilityPct: 65,
    weightedTons: 32.5,
    stockStatus: 'DISPONIVEL',
    creditStatus: 'LIBERADO',
    actionLabel: 'Alinhar cronograma de entrega de armação para obra',
  },
]

export function MetaActionPlanModule({
  metaRestanteTons,
  items = MOCK_RECOVERY_ITEMS,
  onExecuteItem,
  className,
}: MetaActionPlanModuleProps) {
  // Somatório dos potenciais
  const totalPotencialTons = items.reduce((acc, i) => acc + i.potentialTons, 0)
  const totalPonderadoTons = items.reduce((acc, i) => acc + i.weightedTons, 0)
  const gapDescobertoTons = Math.max(0, metaRestanteTons - totalPotencialTons)
  const percentualCoberto =
    metaRestanteTons > 0 ? (totalPotencialTons / metaRestanteTons) * 100 : 100

  return (
    <Card
      className={cn(
        'p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4',
        className,
      )}
    >
      {/* HEADER DO PLANO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-primary">
              Plano de Ação para Bater a Meta (Funil de Recuperação)
            </h3>
            <p className="text-xs text-muted-foreground">
              Mapeamento de alternativas inteligentes para cobrir o gap restante de{' '}
              {formatWeight(metaRestanteTons, 0)}
            </p>
          </div>
        </div>

        <Badge
          className={cn(
            'text-xs font-bold border-none px-3 py-1',
            gapDescobertoTons === 0
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800',
          )}
        >
          {gapDescobertoTons === 0
            ? 'Gap 100% Mapeado por Oportunidades'
            : `Faltam ${formatWeight(gapDescobertoTons, 0)} não mapeadas`}
        </Badge>
      </div>

      {/* FUNIL DE RECUPERAÇÃO DA META (5 ETAPAS EM BARRAS/INDICADORES) */}
      <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-3">
        <span className="text-[10px] uppercase font-bold text-slate-600 block tracking-wider">
          Funil de Recuperação da Meta: Gap → Potencial Identificado → Qualificado → Negociação →
          Convertido
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="p-2 bg-white rounded-xl border border-amber-300">
            <span className="text-[9px] uppercase font-bold text-amber-700 block">
              1. Gap Restante
            </span>
            <strong className="font-serif text-sm text-amber-700 block mt-0.5">
              {formatWeight(metaRestanteTons, 0)}
            </strong>
          </div>

          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[9px] uppercase font-bold text-slate-700 block">
              2. Potencial Identificado
            </span>
            <strong className="font-serif text-sm text-slate-900 block mt-0.5">
              {formatWeight(totalPotencialTons, 0)}
            </strong>
          </div>

          <div className="p-2 bg-white rounded-xl border border-primary/30">
            <span className="text-[9px] uppercase font-bold text-primary block">
              3. Qualificado (Ponderado)
            </span>
            <strong className="font-serif text-sm text-primary block mt-0.5">
              {formatWeight(totalPonderadoTons, 0)}
            </strong>
          </div>

          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[9px] uppercase font-bold text-slate-700 block">
              4. Em Negociação
            </span>
            <strong className="font-serif text-sm text-slate-800 block mt-0.5">
              {formatWeight(totalPotencialTons * 0.6, 0)}
            </strong>
          </div>

          <div className="p-2 bg-white rounded-xl border border-emerald-300">
            <span className="text-[9px] uppercase font-bold text-emerald-700 block">
              5. Pedido Convertido
            </span>
            <strong className="font-serif text-sm text-emerald-700 block mt-0.5">
              {formatWeight(totalPotencialTons * 0.35, 0)}
            </strong>
          </div>
        </div>
      </div>

      {/* LISTA DAS PRINCIPAIS OPORTUNIDADES PARA COBRIR O GAP */}
      <div className="space-y-2">
        <span className="text-[11px] uppercase font-bold text-slate-700 tracking-wider block">
          Oportunidades Concretas Recomendadas pela IA para Fechamento:
        </span>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-primary/40 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bold bg-slate-50 text-slate-800 border-slate-200"
                  >
                    {item.category === 'COTACOES_ALTAS'
                      ? 'Cotação Quente'
                      : item.category === 'CLIENTES_SEM_RECOMPRA'
                        ? 'Sem Recompra'
                        : item.category === 'CROSS_SELL'
                          ? 'Cross-sell'
                          : 'Reativação'}
                  </Badge>
                  <strong className="text-xs text-slate-900">{item.title}</strong>
                  <span className="text-[10px] text-muted-foreground">• {item.clientName}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span>
                    Linha: <strong>{item.productLine}</strong>
                  </span>
                  <span>
                    Probabilidade:{' '}
                    <strong className="text-emerald-700">{item.probabilityPct}%</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-primary block">
                    +{formatWeight(item.potentialTons, 0)}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Pond: +{formatWeight(item.weightedTons, 0)}
                  </span>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    if (item.actionHandler) item.actionHandler()
                    if (onExecuteItem) onExecuteItem(item)
                  }}
                  className="h-8 text-xs bg-primary hover:bg-primary/90 text-white font-semibold gap-1.5 rounded-xl shadow-xs"
                >
                  <span>{item.actionLabel.split(' ')[0]}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
