import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  Target,
} from 'lucide-react'
import { cn, formatNumberBR, formatWeight } from '@/lib/utils'

export type TeamQuadrantType = 'ALTA_PERFORMANCE' | 'EM_RECUPERACAO' | 'EM_DETERIORACAO' | 'CRITICO'

export interface SellerPerformancePoint {
  id: string
  name: string
  role: string
  atingimentoPct: number // Eixo X (0% a 140%)
  evolucaoTendenciaPct: number // Eixo Y (-20% a +40%)
  quadrant: TeamQuadrantType
  volumeRealizadoTons: number
  metaTons: number
  gapTons: number
  coberturaPipeline: number
  taxaConversao: number
  clientesAtivos: number
  scoreRisco: 'Baixo' | 'Moderado' | 'Alto'
  aiRecommendation: string
  avatarUrl?: string
}

export interface TeamPerformanceMatrixProps {
  sellers: SellerPerformancePoint[]
  onSelectSeller?: (seller: SellerPerformancePoint) => void
  onAnalyzeWithAI?: (seller: SellerPerformancePoint) => void
  className?: string
}

export const MOCK_TEAM_SELLERS: SellerPerformancePoint[] = [
  {
    id: 'vend-01',
    name: 'Carlos Mendonça',
    role: 'Vendedor Sênior (MG Centro)',
    atingimentoPct: 108.5,
    evolucaoTendenciaPct: 18.2,
    quadrant: 'ALTA_PERFORMANCE',
    volumeRealizadoTons: 380,
    metaTons: 350,
    gapTons: 0,
    coberturaPipeline: 2.4,
    taxaConversao: 74.0,
    clientesAtivos: 28,
    scoreRisco: 'Baixo',
    aiRecommendation:
      'Expandir propostas de grande porte na carteira de revendas com entregas programadas.',
  },
  {
    id: 'vend-02',
    name: 'Mariana Siqueira',
    role: 'Vendedora Pleno (Grande BH)',
    atingimentoPct: 88.0,
    evolucaoTendenciaPct: 14.5,
    quadrant: 'EM_RECUPERACAO',
    volumeRealizadoTons: 220,
    metaTons: 250,
    gapTons: 30,
    coberturaPipeline: 1.8,
    taxaConversao: 65.0,
    clientesAtivos: 19,
    scoreRisco: 'Moderado',
    aiRecommendation:
      'Acelerar fechamento de 3 cotações de chapas grossas para superar a meta nesta semana.',
  },
  {
    id: 'vend-03',
    name: 'João Pedro Rocha',
    role: 'Vendedor Júnior (Triângulo)',
    atingimentoPct: 92.0,
    evolucaoTendenciaPct: -6.4,
    quadrant: 'EM_DETERIORACAO',
    volumeRealizadoTons: 184,
    metaTons: 200,
    gapTons: 16,
    coberturaPipeline: 1.1,
    taxaConversao: 52.0,
    clientesAtivos: 14,
    scoreRisco: 'Moderado',
    aiRecommendation:
      'Revisar cotações paradas há mais de 4 dias e apoiar negociação com cliente Santa Rita.',
  },
  {
    id: 'vend-04',
    name: 'Roberto Faria',
    role: 'Representante Externo (Zona da Mata)',
    atingimentoPct: 62.5,
    evolucaoTendenciaPct: -18.0,
    quadrant: 'CRITICO',
    volumeRealizadoTons: 125,
    metaTons: 200,
    gapTons: 75,
    coberturaPipeline: 0.7,
    taxaConversao: 38.0,
    clientesAtivos: 8,
    scoreRisco: 'Alto',
    aiRecommendation:
      'Intervenção imediata da supervisão com repasse de leads e plano de choque de visitas.',
  },
]

export function TeamPerformanceMatrix({
  sellers = MOCK_TEAM_SELLERS,
  onSelectSeller,
  onAnalyzeWithAI,
  className,
}: TeamPerformanceMatrixProps) {
  const [selectedSeller, setSelectedSeller] = useState<SellerPerformancePoint | null>(
    sellers[0] || null,
  )

  const quadrantConfigs: Record<
    TeamQuadrantType,
    { title: string; bgClass: string; textClass: string; borderClass: string; desc: string }
  > = {
    ALTA_PERFORMANCE: {
      title: 'Alta Performance (Meta Superada + Crescendo)',
      bgClass: 'bg-emerald-50/70',
      textClass: 'text-emerald-800',
      borderClass: 'border-emerald-300',
      desc: 'Atingimento ≥ 100% e tendência positiva.',
    },
    EM_RECUPERACAO: {
      title: 'Em Recuperação (Abaixo da Meta + Acelerando)',
      bgClass: 'bg-sky-50/70',
      textClass: 'text-sky-800',
      borderClass: 'border-sky-300',
      desc: 'Atingimento < 100%, mas com forte tração recente.',
    },
    EM_DETERIORACAO: {
      title: 'Em Deterioração (Próximo da Meta + Desacelerando)',
      bgClass: 'bg-amber-50/70',
      textClass: 'text-amber-800',
      borderClass: 'border-amber-300',
      desc: 'Atingimento razoável, porém com perda de velocidade.',
    },
    CRITICO: {
      title: 'Crítico (Abaixo da Meta + Desacelerando)',
      bgClass: 'bg-rose-50/70',
      textClass: 'text-rose-800',
      borderClass: 'border-rose-300',
      desc: 'Déficit expressivo de meta e queda de ritmo.',
    },
  }

  const getSellersInQuadrant = (quadrant: TeamQuadrantType) => {
    return sellers.filter((s) => s.quadrant === quadrant)
  }

  return (
    <Card
      className={cn(
        'p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4',
        className,
      )}
    >
      {/* HEADER DA MATRIZ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-primary">
              Matriz Executiva de Performance da Equipe (4 Quadrantes)
            </h3>
            <p className="text-xs text-muted-foreground">
              Eixo X: % Atingimento da Meta | Eixo Y: Tendência / Evolução de Vendas
            </p>
          </div>
        </div>

        <Badge variant="outline" className="text-xs font-mono bg-slate-50 text-slate-700">
          {sellers.length} Consultores Mapeados
        </Badge>
      </div>

      {/* GRADE 2X2 DOS 4 QUADRANTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Quadrante 1: Em Recuperação (Noroeste) */}
        <div
          className={cn(
            'p-4 rounded-2xl border space-y-2.5',
            quadrantConfigs.EM_RECUPERACAO.bgClass,
            quadrantConfigs.EM_RECUPERACAO.borderClass,
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'font-serif font-bold text-xs uppercase tracking-wider',
                quadrantConfigs.EM_RECUPERACAO.textClass,
              )}
            >
              ↗ Em Recuperação
            </span>
            <span className="text-[10px] text-muted-foreground">
              {getSellersInQuadrant('EM_RECUPERACAO').length} vendedores
            </span>
          </div>

          <div className="space-y-1.5">
            {getSellersInQuadrant('EM_RECUPERACAO').map((seller) => (
              <div
                key={seller.id}
                onClick={() => {
                  setSelectedSeller(seller)
                  onSelectSeller?.(seller)
                }}
                className={cn(
                  'p-2.5 rounded-xl bg-white border cursor-pointer transition-all flex items-center justify-between text-xs',
                  selectedSeller?.id === seller.id
                    ? 'border-primary ring-2 ring-primary/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-400',
                )}
              >
                <div>
                  <strong className="text-slate-900 block">{seller.name}</strong>
                  <span className="text-[10px] text-muted-foreground">{seller.role}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-800 block">
                    {formatNumberBR(seller.atingimentoPct, 1)}% meta
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 block">
                    +{formatNumberBR(seller.evolucaoTendenciaPct, 1)}% ritmo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrante 2: Alta Performance (Nordeste) */}
        <div
          className={cn(
            'p-4 rounded-2xl border space-y-2.5',
            quadrantConfigs.ALTA_PERFORMANCE.bgClass,
            quadrantConfigs.ALTA_PERFORMANCE.borderClass,
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'font-serif font-bold text-xs uppercase tracking-wider',
                quadrantConfigs.ALTA_PERFORMANCE.textClass,
              )}
            >
              ★ Alta Performance
            </span>
            <span className="text-[10px] text-muted-foreground">
              {getSellersInQuadrant('ALTA_PERFORMANCE').length} vendedores
            </span>
          </div>

          <div className="space-y-1.5">
            {getSellersInQuadrant('ALTA_PERFORMANCE').map((seller) => (
              <div
                key={seller.id}
                onClick={() => {
                  setSelectedSeller(seller)
                  onSelectSeller?.(seller)
                }}
                className={cn(
                  'p-2.5 rounded-xl bg-white border cursor-pointer transition-all flex items-center justify-between text-xs',
                  selectedSeller?.id === seller.id
                    ? 'border-primary ring-2 ring-primary/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-400',
                )}
              >
                <div>
                  <strong className="text-slate-900 block">{seller.name}</strong>
                  <span className="text-[10px] text-muted-foreground">{seller.role}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-700 block">
                    {formatNumberBR(seller.atingimentoPct, 1)}% meta
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 block">
                    +{formatNumberBR(seller.evolucaoTendenciaPct, 1)}% ritmo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrante 3: Crítico (Sudoeste) */}
        <div
          className={cn(
            'p-4 rounded-2xl border space-y-2.5',
            quadrantConfigs.CRITICO.bgClass,
            quadrantConfigs.CRITICO.borderClass,
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'font-serif font-bold text-xs uppercase tracking-wider',
                quadrantConfigs.CRITICO.textClass,
              )}
            >
              ⚠ Crítico (Intervenção)
            </span>
            <span className="text-[10px] text-muted-foreground">
              {getSellersInQuadrant('CRITICO').length} vendedores
            </span>
          </div>

          <div className="space-y-1.5">
            {getSellersInQuadrant('CRITICO').map((seller) => (
              <div
                key={seller.id}
                onClick={() => {
                  setSelectedSeller(seller)
                  onSelectSeller?.(seller)
                }}
                className={cn(
                  'p-2.5 rounded-xl bg-white border cursor-pointer transition-all flex items-center justify-between text-xs',
                  selectedSeller?.id === seller.id
                    ? 'border-primary ring-2 ring-primary/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-400',
                )}
              >
                <div>
                  <strong className="text-slate-900 block">{seller.name}</strong>
                  <span className="text-[10px] text-muted-foreground">{seller.role}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-rose-700 block">
                    {formatNumberBR(seller.atingimentoPct, 1)}% meta
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 block">
                    {formatNumberBR(seller.evolucaoTendenciaPct, 1)}% ritmo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrante 4: Em Deterioração (Sudeste) */}
        <div
          className={cn(
            'p-4 rounded-2xl border space-y-2.5',
            quadrantConfigs.EM_DETERIORACAO.bgClass,
            quadrantConfigs.EM_DETERIORACAO.borderClass,
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'font-serif font-bold text-xs uppercase tracking-wider',
                quadrantConfigs.EM_DETERIORACAO.textClass,
              )}
            >
              ↘ Em Deterioração
            </span>
            <span className="text-[10px] text-muted-foreground">
              {getSellersInQuadrant('EM_DETERIORACAO').length} vendedores
            </span>
          </div>

          <div className="space-y-1.5">
            {getSellersInQuadrant('EM_DETERIORACAO').map((seller) => (
              <div
                key={seller.id}
                onClick={() => {
                  setSelectedSeller(seller)
                  onSelectSeller?.(seller)
                }}
                className={cn(
                  'p-2.5 rounded-xl bg-white border cursor-pointer transition-all flex items-center justify-between text-xs',
                  selectedSeller?.id === seller.id
                    ? 'border-primary ring-2 ring-primary/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-400',
                )}
              >
                <div>
                  <strong className="text-slate-900 block">{seller.name}</strong>
                  <span className="text-[10px] text-muted-foreground">{seller.role}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-amber-700 block">
                    {formatNumberBR(seller.atingimentoPct, 1)}% meta
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 block">
                    {formatNumberBR(seller.evolucaoTendenciaPct, 1)}% ritmo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETALHE DO VENDEDOR SELECIONADO COM DIAGNÓSTICO DE IA */}
      {selectedSeller && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 animate-fade-in border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center font-bold font-serif text-amber-300">
                {selectedSeller.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <strong className="text-sm text-slate-100">{selectedSeller.name}</strong>
                <span className="text-xs text-slate-400 block">{selectedSeller.role}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => onAnalyzeWithAI?.(selectedSeller)}
                className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5 rounded-xl"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analisar com IA</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-slate-800/80 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Realizado / Meta
              </span>
              <strong className="text-slate-100 text-sm font-serif">
                {formatWeight(selectedSeller.volumeRealizadoTons, 0)} /{' '}
                {formatWeight(selectedSeller.metaTons, 0)}
              </strong>
            </div>

            <div className="p-2.5 bg-slate-800/80 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Cobertura Pipeline
              </span>
              <strong className="text-amber-300 text-sm font-serif">
                {formatNumberBR(selectedSeller.coberturaPipeline, 1)}x o gap
              </strong>
            </div>

            <div className="p-2.5 bg-slate-800/80 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Conversão
              </span>
              <strong className="text-slate-100 text-sm font-serif">
                {formatNumberBR(selectedSeller.taxaConversao, 1)}%
              </strong>
            </div>

            <div className="p-2.5 bg-slate-800/80 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Score de Risco
              </span>
              <Badge
                className={cn(
                  'text-[10px] font-bold border-none mt-0.5',
                  selectedSeller.scoreRisco === 'Baixo'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : selectedSeller.scoreRisco === 'Moderado'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300',
                )}
              >
                Risco {selectedSeller.scoreRisco}
              </Badge>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block">
                Diagnóstico de Apoio da Supervisão:
              </span>
              <p className="text-slate-300 leading-relaxed mt-0.5">
                {selectedSeller.aiRecommendation}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
