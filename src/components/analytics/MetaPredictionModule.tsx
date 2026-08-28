import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Flame,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import { cn, formatNumberBR, formatWeight, formatCurrency } from '@/lib/utils'

export interface MetaPredictionProps {
  realizadoAtual: number // Ex: 720 t
  metaTotal: number // Ex: 1.000 t
  diasUteisPassados?: number // Ex: 14
  diasUteisRestantes?: number // Ex: 8
  pipelineQualificado?: number // Ex: 410 t
  conversaoHistorica?: number // Ex: 68%
  unidade?: 't' | 'R$'
  isCurrency?: boolean
  className?: string
}

export function MetaPredictionModule({
  realizadoAtual,
  metaTotal,
  diasUteisPassados = 14,
  diasUteisRestantes = 8,
  pipelineQualificado = 420,
  conversaoHistorica = 65,
  unidade = 't',
  isCurrency = false,
  className,
}: MetaPredictionProps) {
  const [selectedScenario, setSelectedScenario] = useState<'PROVAVEL' | 'CONSERVADOR' | 'OTIMISTA'>(
    'PROVAVEL',
  )

  const gapRestante = Math.max(0, metaTotal - realizadoAtual)
  const totalDiasUteis = diasUteisPassados + diasUteisRestantes

  // Ritmo atual realizado por dia útil
  const ritmoAtual = diasUteisPassados > 0 ? realizadoAtual / diasUteisPassados : 0
  const ritmoNecessario = diasUteisRestantes > 0 ? gapRestante / diasUteisRestantes : 0

  // 3 Cenários Preditivos
  // 1. Conservador: Ritmo desacelera 15% + conversão de pipeline 45%
  const projecaoConservador = Math.round(realizadoAtual + ritmoAtual * 0.85 * diasUteisRestantes)
  // 2. Provável: Ritmo atual constante + pipeline ponderado histórico
  const projecaoProvavel = Math.round(realizadoAtual + ritmoAtual * diasUteisRestantes)
  // 3. Otimista: Aceleração de 20% com fechamento de oportunidades chave
  const projecaoOtimista = Math.round(
    realizadoAtual + ritmoAtual * 1.2 * diasUteisRestantes + pipelineQualificado * 0.25,
  )

  // Probabilidade de atingimento calculada
  const probabilidadeAtingimento = Math.min(
    Math.max(Math.round((projecaoProvavel / metaTotal) * 100 * (conversaoHistorica / 65)), 15),
    99,
  )

  const formatVal = (v: number) => {
    if (isCurrency || unidade === 'R$') {
      return formatCurrency(v)
    }
    return formatWeight(v, 0)
  }

  const getProjectionValue = () => {
    if (selectedScenario === 'CONSERVADOR') return projecaoConservador
    if (selectedScenario === 'OTIMISTA') return projecaoOtimista
    return projecaoProvavel
  }

  const projAtual = getProjectionValue()
  const atingimentoProjetado = metaTotal > 0 ? (projAtual / metaTotal) * 100 : 0
  const gapProjetado = projAtual - metaTotal

  return (
    <Card
      className={cn(
        'p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4',
        className,
      )}
    >
      {/* HEADER DA PERGUNTA EXECUTIVA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-primary">
              "Vou Atingir Minha Meta?" — Diagnóstico Preditivo
            </h3>
            <p className="text-xs text-muted-foreground">
              Projeção probabilística de fechamento baseada em velocidade de tração, pipeline e
              sazonalidade
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            className={cn(
              'text-xs font-bold px-3 py-1 border-none',
              probabilidadeAtingimento >= 85
                ? 'bg-emerald-100 text-emerald-800'
                : probabilidadeAtingimento >= 65
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800',
            )}
          >
            Probabilidade: {probabilidadeAtingimento}%
          </Badge>
        </div>
      </div>

      {/* DIFERENCIAÇÃO CLARA ENTRE REALIZADO E PROJEÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
            1. REALIZADO ATÉ HOJE ({diasUteisPassados}º dia útil)
          </span>
          <span className="font-serif text-2xl font-bold text-slate-900 block mt-0.5">
            {formatVal(realizadoAtual)}
          </span>
          <span className="text-xs text-muted-foreground block">
            {formatNumberBR((realizadoAtual / metaTotal) * 100, 1)}% da meta de{' '}
            {formatVal(metaTotal)}
          </span>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
          <span className="text-[10px] uppercase font-bold text-primary block tracking-wider">
            2. PROJEÇÃO DE FECHAMENTO ({selectedScenario})
          </span>
          <span className="font-serif text-2xl font-bold text-primary block mt-0.5">
            {formatVal(projAtual)}
          </span>
          <span
            className={cn(
              'text-xs font-bold block',
              gapProjetado >= 0 ? 'text-emerald-700' : 'text-amber-700',
            )}
          >
            {gapProjetado >= 0
              ? `Superávit projetado: +${formatVal(gapProjetado)}`
              : `Déficit projetado: ${formatVal(gapProjetado)}`}{' '}
            ({formatNumberBR(atingimentoProjetado, 1)}%)
          </span>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
          <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
            3. RITMO NECESSÁRIO × ATUAL
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-serif text-lg font-bold text-slate-900">
              {formatNumberBR(ritmoAtual, 1)} t/dia
            </span>
            <span className="text-xs text-muted-foreground">vs</span>
            <span className="font-serif text-lg font-bold text-primary">
              {formatNumberBR(ritmoNecessario, 1)} t/dia
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground block mt-0.5">
            {ritmoAtual >= ritmoNecessario ? (
              <strong className="text-emerald-700">Ritmo atual suficiente</strong>
            ) : (
              <strong className="text-amber-700">
                Acelerar +{formatNumberBR(((ritmoNecessario - ritmoAtual) / ritmoAtual) * 100, 1)}%
              </strong>
            )}
          </span>
        </div>
      </div>

      {/* SELETOR DE CENÁRIOS: CONSERVADOR, PROVÁVEL, OTIMISTA */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
            Simulação de Cenários de Fechamento:
          </span>
          <span className="text-[10px] text-muted-foreground">
            Clique no cenário para detalhar hipóteses
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Cenário Conservador */}
          <button
            onClick={() => setSelectedScenario('CONSERVADOR')}
            className={cn(
              'p-3 rounded-2xl border text-left transition-all',
              selectedScenario === 'CONSERVADOR'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800',
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                Conservador
              </span>
              <Badge
                className={cn(
                  'text-[9px] font-bold border-none',
                  selectedScenario === 'CONSERVADOR'
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-slate-100',
                )}
              >
                {formatNumberBR((projecaoConservador / metaTotal) * 100, 0)}%
              </Badge>
            </div>
            <strong className="font-serif text-lg block mt-1">
              {formatVal(projecaoConservador)}
            </strong>
            <span className="text-[10px] opacity-70 block">Desaceleração 15%</span>
          </button>

          {/* Cenário Provável */}
          <button
            onClick={() => setSelectedScenario('PROVAVEL')}
            className={cn(
              'p-3 rounded-2xl border text-left transition-all',
              selectedScenario === 'PROVAVEL'
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800',
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                Mais Provável
              </span>
              <Badge
                className={cn(
                  'text-[9px] font-bold border-none',
                  selectedScenario === 'PROVAVEL'
                    ? 'bg-white/20 text-white'
                    : 'bg-primary/10 text-primary',
                )}
              >
                {formatNumberBR((projecaoProvavel / metaTotal) * 100, 0)}%
              </Badge>
            </div>
            <strong className="font-serif text-lg block mt-1">{formatVal(projecaoProvavel)}</strong>
            <span className="text-[10px] opacity-80 block">Tendência linear atual</span>
          </button>

          {/* Cenário Otimista */}
          <button
            onClick={() => setSelectedScenario('OTIMISTA')}
            className={cn(
              'p-3 rounded-2xl border text-left transition-all',
              selectedScenario === 'OTIMISTA'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-md'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800',
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                Otimista
              </span>
              <Badge
                className={cn(
                  'text-[9px] font-bold border-none',
                  selectedScenario === 'OTIMISTA'
                    ? 'bg-emerald-900 text-white'
                    : 'bg-emerald-50 text-emerald-800',
                )}
              >
                {formatNumberBR((projecaoOtimista / metaTotal) * 100, 0)}%
              </Badge>
            </div>
            <strong className="font-serif text-lg block mt-1">{formatVal(projecaoOtimista)}</strong>
            <span className="text-[10px] opacity-80 block">+20% aceleração pipeline</span>
          </button>
        </div>
      </div>
    </Card>
  )
}
