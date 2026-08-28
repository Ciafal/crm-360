import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Clock,
  Layers,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Truck,
  Package,
} from 'lucide-react'
import { cn, formatNumberBR, formatWeight, formatCurrency } from '@/lib/utils'

export interface MetaCoverageRiskWidgetProps {
  gapRestanteTons: number // Ex: 280 t
  gapRestanteBrl?: number
  pipelineTotalTons: number // Ex: 680 t
  pipelineQualificadoTons: number // Ex: 420 t
  pipelinePonderadoTons: number // Ex: 336 t
  taxaConversao?: number // Ex: 68%
  diasUteisRestantes?: number // Ex: 8
  onDrilldownPipeline?: () => void
  className?: string
}

export function MetaCoverageRiskWidget({
  gapRestanteTons,
  gapRestanteBrl,
  pipelineTotalTons,
  pipelineQualificadoTons,
  pipelinePonderadoTons,
  taxaConversao = 65,
  diasUteisRestantes = 8,
  onDrilldownPipeline,
  className,
}: MetaCoverageRiskWidgetProps) {
  // Cálculo de Cobertura da Meta: Pipeline Qualificado / Gap Restante
  const coverageRatio = gapRestanteTons > 0 ? pipelineQualificadoTons / gapRestanteTons : 2.5
  const coveragePercent = coverageRatio * 100

  // Faixas de Cobertura:
  // < 1.0x -> Insuficiente (Crítico)
  // 1.0x a 1.5x -> Atenção
  // > 1.5x -> Confortável
  const isComfortable = coverageRatio >= 1.5
  const isAttention = coverageRatio >= 1.0 && coverageRatio < 1.5
  const isInsufficient = coverageRatio < 1.0

  // Score de Risco da Meta (0 a 100 onde quanto menor melhor)
  // Fatores: gap restante, dias úteis, ratio de cobertura, conversão
  const riskScore = Math.round(
    Math.min(
      Math.max(
        (1 - Math.min(coverageRatio / 2, 1)) * 50 +
          (gapRestanteTons > 300 ? 25 : 10) +
          (diasUteisRestantes < 6 ? 25 : 10),
        10,
      ),
      95,
    ),
  )

  const riskCategory = riskScore < 35 ? 'Baixo' : riskScore < 65 ? 'Moderado' : 'Alto'

  return (
    <Card
      className={cn(
        'p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4',
        className,
      )}
    >
      {/* HEADER: COBERTURA & RISCO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'p-2 rounded-xl',
              isComfortable
                ? 'bg-emerald-100 text-emerald-800'
                : isAttention
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800',
            )}
          >
            {isComfortable ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-primary">
                Cobertura da Meta & Score de Risco
              </h3>
              <Badge
                className={cn(
                  'text-[10px] font-bold border-none px-2 py-0.5',
                  riskCategory === 'Baixo'
                    ? 'bg-emerald-100 text-emerald-800'
                    : riskCategory === 'Moderado'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800',
                )}
              >
                Risco {riskCategory} ({riskScore} pts)
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Pipeline Qualificado ÷ Gap Restante ({formatNumberBR(coverageRatio, 2)}x de cobertura)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            className={cn(
              'text-xs font-bold px-3 py-1 border-none',
              isComfortable
                ? 'bg-emerald-600 text-white'
                : isAttention
                  ? 'bg-amber-600 text-white'
                  : 'bg-rose-600 text-white',
            )}
          >
            {isComfortable
              ? 'PIPELINE CONFORTÁVEL (>1.5x)'
              : isAttention
                ? 'PIPELINE EM ATENÇÃO (1.0x-1.5x)'
                : 'PIPELINE INSUFICIENTE (<1.0x)'}
          </Badge>
        </div>
      </div>

      {/* COMPARATIVO VISUAL: GAP RESTANTE vs PIPELINE TOTAL vs QUALIFICADO vs PONDERADO */}
      <div className="space-y-3 bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 bg-white rounded-xl border">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">
              Gap Restante
            </span>
            <strong className="font-serif text-lg text-amber-700 block mt-0.5">
              {formatWeight(gapRestanteTons, 0)}
            </strong>
            <span className="text-[10px] text-muted-foreground">Falta fechar no mês</span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border">
            <span className="text-[10px] uppercase font-bold text-slate-700 block">
              Pipeline Total
            </span>
            <strong className="font-serif text-lg text-slate-900 block mt-0.5">
              {formatWeight(pipelineTotalTons, 0)}
            </strong>
            <span className="text-[10px] text-muted-foreground">Todas oportunidades</span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-primary/30">
            <span className="text-[10px] uppercase font-bold text-primary block">
              Pipeline Qualificado
            </span>
            <strong className="font-serif text-lg text-primary block mt-0.5">
              {formatWeight(pipelineQualificadoTons, 0)}
            </strong>
            <span className="text-[10px] text-primary font-semibold">
              {formatNumberBR(coverageRatio, 2)}x o gap
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">
              Pipeline Ponderado
            </span>
            <strong className="font-serif text-lg text-emerald-700 block mt-0.5">
              {formatWeight(pipelinePonderadoTons, 0)}
            </strong>
            <span className="text-[10px] text-muted-foreground">
              {formatNumberBR((pipelinePonderadoTons / (gapRestanteTons || 1)) * 100, 0)}% do gap
            </span>
          </div>
        </div>

        {/* Barra de Proporção de Cobertura */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-semibold text-slate-700">
            <span>Relação Pipeline Qualificado ÷ Gap</span>
            <span>
              {formatNumberBR(coveragePercent, 0)}% ({formatNumberBR(coverageRatio, 2)}x)
            </span>
          </div>

          <div className="relative w-full h-3.5 bg-slate-200 rounded-full overflow-hidden">
            {/* Marcador 1.0x (100%) */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-20"
              style={{ left: '50%' }}
              title="Linha de 1.0x (Igual ao Gap)"
            />
            {/* Marcador 1.5x (150%) */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-800 z-20"
              style={{ left: '75%' }}
              title="Linha de 1.5x (Zona Confortável)"
            />

            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                isComfortable ? 'bg-emerald-600' : isAttention ? 'bg-amber-500' : 'bg-rose-500',
              )}
              style={{ width: `${Math.min(coverageRatio * 50, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
            <span className="text-rose-700 font-bold">&lt;1.0x Insuficiente</span>
            <span className="text-amber-700 font-bold">1.0x - 1.5x Atenção</span>
            <span className="text-emerald-700 font-bold">&gt;1.5x Confortável</span>
          </div>
        </div>
      </div>

      {/* MATRIZ DE FATORES EXPLICATIVOS DO RISCO (ESTOQUE, CRÉDITO, TMS, CONVERSÃO) */}
      <div className="space-y-2">
        <span className="text-[11px] uppercase font-bold text-slate-700 tracking-wider block">
          Fatores Multissistema que Compõem o Score de Risco:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Estoque / WMS */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-primary" /> Estoque & Saldos
              </span>
              <Badge className="bg-emerald-50 text-emerald-800 text-[9px] border-emerald-200">
                Disponível
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              92% dos itens do pipeline possuem saldo físico no CD Contagem ou produção prevista.
            </p>
          </div>

          {/* Crédito SAP ECC */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-sky-600" /> Crédito & Limites
              </span>
              <Badge className="bg-amber-50 text-amber-800 text-[9px] border-amber-200">
                Atenção 2 Contas
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              2 cotações de grande porte exigem liberação de crédito suplementar na esteira SAP
              F.35.
            </p>
          </div>

          {/* TMS Logística */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-violet-600" /> Janela Logística
              </span>
              <Badge className="bg-emerald-50 text-emerald-800 text-[9px] border-emerald-200">
                Prazo Conforme
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Lead time estimado de 24h a 48h para região metropolitana de Belo Horizonte e Betim.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
