import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react'
import { cn, formatNumberBR, formatWeight, formatCurrency } from '@/lib/utils'

export interface PositiveNegativeContributor {
  id: string
  name: string
  entityType: 'CLIENTE' | 'PRODUTO'
  volumeRealizadoTons: number
  volumeAnteriorTons: number
  variacaoTons: number
  variacaoPct: number
  contribuicaoPct: number
  faturamentoBrl?: number
  nextAction: string
  onClickDrilldown?: () => void
}

export interface PositiveNegativeImpactPanelProps {
  positiveContributors: PositiveNegativeContributor[]
  negativeContributors: PositiveNegativeContributor[]
  onSelectEntity?: (entity: PositiveNegativeContributor) => void
  className?: string
}

export function PositiveNegativeImpactPanel({
  positiveContributors,
  negativeContributors,
  onSelectEntity,
  className,
}: PositiveNegativeImpactPanelProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'CLIENTES' | 'PRODUTOS'>('ALL')

  const filterList = (list: PositiveNegativeContributor[]) => {
    if (activeTab === 'CLIENTES') return list.filter((i) => i.entityType === 'CLIENTE')
    if (activeTab === 'PRODUTOS') return list.filter((i) => i.entityType === 'PRODUTO')
    return list
  }

  const posList = filterList(positiveContributors).slice(0, 5)
  const negList = filterList(negativeContributors).slice(0, 5)

  return (
    <Card
      className={cn(
        'p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4',
        className,
      )}
    >
      {/* HEADER DO PAINEL DE IMPACTO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-serif font-bold text-base text-primary">
            Impacto no Resultado — Quem Mais Ajudou vs. Quem Mais Prejudicou
          </h3>
          <p className="text-xs text-muted-foreground">
            Rankings de contribuição positiva e déficit por cliente e linha de produto com ações
            recomendadas
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('ALL')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all',
              activeTab === 'ALL' ? 'bg-primary text-white' : 'text-slate-600',
            )}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTab('CLIENTES')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all',
              activeTab === 'CLIENTES' ? 'bg-primary text-white' : 'text-slate-600',
            )}
          >
            Clientes
          </button>
          <button
            onClick={() => setActiveTab('PRODUTOS')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all',
              activeTab === 'PRODUTOS' ? 'bg-primary text-white' : 'text-slate-600',
            )}
          >
            Produtos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* COLUNA 1: QUEM MAIS AJUDOU O RESULTADO */}
        <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
          <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
            <span className="font-serif font-bold text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Quem mais ajudou o resultado? (Top Positivos)
            </span>
            <Badge className="bg-emerald-600 text-white text-[10px] border-none font-bold">
              Alavancadores
            </Badge>
          </div>

          <div className="space-y-2">
            {posList.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectEntity?.(item)}
                className="p-3 bg-white rounded-xl border border-emerald-100 hover:border-emerald-300 shadow-xs cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-emerald-50 text-emerald-800 text-[9px] border-emerald-200 font-mono">
                        {item.entityType}
                      </Badge>
                      <strong className="text-xs text-slate-900 leading-tight">{item.name}</strong>
                    </div>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Realizado: <strong>{formatWeight(item.volumeRealizadoTons, 0)}</strong> (era{' '}
                      {formatWeight(item.volumeAnteriorTons, 0)})
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-emerald-700 flex items-center justify-end gap-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" />+{formatWeight(item.variacaoTons, 0)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold block">
                      +{formatNumberBR(item.variacaoPct, 1)}%
                    </span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 truncate max-w-[220px]">
                    <strong>Ação:</strong> {item.nextAction}
                  </span>
                  <span className="text-primary font-semibold text-[10px] flex items-center gap-0.5 shrink-0">
                    Drill-down <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUNA 2: QUEM MAIS PREJUDICOU O RESULTADO */}
        <div className="space-y-3 p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80">
          <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
            <span className="font-serif font-bold text-xs uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              Quem mais prejudicou o resultado? (Top Déficits)
            </span>
            <Badge className="bg-rose-600 text-white text-[10px] border-none font-bold">
              Gargalos
            </Badge>
          </div>

          <div className="space-y-2">
            {negList.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectEntity?.(item)}
                className="p-3 bg-white rounded-xl border border-rose-100 hover:border-rose-300 shadow-xs cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-rose-50 text-rose-800 text-[9px] border-rose-200 font-mono">
                        {item.entityType}
                      </Badge>
                      <strong className="text-xs text-slate-900 leading-tight">{item.name}</strong>
                    </div>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Realizado: <strong>{formatWeight(item.volumeRealizadoTons, 0)}</strong> (era{' '}
                      {formatWeight(item.volumeAnteriorTons, 0)})
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-rose-700 flex items-center justify-end gap-0.5">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      {formatWeight(item.variacaoTons, 0)}
                    </span>
                    <span className="text-[10px] text-rose-600 font-semibold block">
                      {formatNumberBR(item.variacaoPct, 1)}%
                    </span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 truncate max-w-[220px]">
                    <strong>Ação:</strong> {item.nextAction}
                  </span>
                  <span className="text-rose-700 font-semibold text-[10px] flex items-center gap-0.5 shrink-0">
                    Intervir <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
