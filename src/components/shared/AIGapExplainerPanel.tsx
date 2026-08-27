import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Database,
  AlertTriangle,
  Layers,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

export interface AIGapFactor {
  title: string
  impactTons?: number
  impactBrl?: number
  source: 'CRM' | 'SAP ECC' | 'Qlik' | 'WMS' | 'TMS' | 'Gestão de Performance' | 'IA'
  evidence: string
  details?: string
}

export interface AIGapExplainerPanelProps {
  gapTons: number
  gapBrl?: number
  factors?: AIGapFactor[]
  recommendation?: string
  confidence?: number
}

const DEFAULT_FACTORS: AIGapFactor[] = [
  {
    title: 'Cotações Abertas sem Follow-up > 48h',
    impactTons: 28,
    impactBrl: 185000,
    source: 'CRM',
    evidence: '3 cotações abertas de Perfis W e Chapas A36 aguardando retorno de compradores.',
  },
  {
    title: 'Estoque de Materiais Críticos < 5t no WMS',
    impactTons: 19,
    impactBrl: 118000,
    source: 'WMS',
    evidence: 'Saldos de Vergalhões CA-50 16mm e Tubos Inox no CD Contagem em nível mínimo.',
  },
  {
    title: 'Clientes Fora de Recorrência / Janela de Recompra',
    impactTons: 17,
    impactBrl: 95000,
    source: 'Qlik',
    evidence: 'Modelo P(vivo) apontou 3 contas campeãs que ultrapassaram o ciclo médio em 4 dias.',
  },
  {
    title: 'Programação de Produção PCP nos Próximos 9 Dias',
    impactTons: 14,
    impactBrl: 89000,
    source: 'SAP ECC',
    evidence: 'Ordens de corte de bobinas Z275 em sequenciamento no laminador.',
  },
  {
    title: 'Ocorrências Logísticas em Trânsito',
    impactTons: 9,
    impactBrl: 58000,
    source: 'TMS',
    evidence: 'Carga de perfis retida temporariamente para transbordo rodoviário em Betim.',
  },
  {
    title: 'Reclamação de Qualidade em Análise',
    impactTons: 8,
    impactBrl: 48000,
    source: 'Gestão de Performance',
    evidence: 'Laudo dimensional NC-2024-0412 em elaboração com plano de ação prioritário.',
  },
]

/**
 * AI Gap Explainer Panel:
 * Estrutura obrigatória da Análise IA:
 * 1. O QUE ESTÁ ACONTECENDO?
 * 2. POR QUE ESTÁ ACONTECENDO?
 * 3. QUAL A EVIDÊNCIA?
 * 4. QUAL O IMPACTO?
 * 5. QUAL A AÇÃO RECOMENDADA?
 * Rastreabilidade completa com fontes (CRM, SAP ECC, Qlik, WMS, TMS, Gestão de Performance).
 */
export function AIGapExplainerPanel({
  gapTons,
  gapBrl,
  factors = DEFAULT_FACTORS,
  recommendation = 'Priorizar as 3 cotações com maior probabilidade e antecipar confirmação de estoque dos materiais críticos no WMS Contagem.',
  confidence = 94,
}: AIGapExplainerPanelProps) {
  const totalImpactTons = factors.reduce((sum, f) => sum + (f.impactTons || 0), 0)

  return (
    <Card className="p-5 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-xl space-y-4">
      {/* Header com Ícone IA e Badge de Confiança */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-amber-300">
              Diagnóstico de Gap por Inteligência Artificial
            </h3>
            <p className="text-xs text-slate-400">
              Correlação causal multissistema: CRM · SAP ECC · Qlik · WMS · TMS · Gestão de
              Performance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/40 text-xs font-mono">
            Confiança IA: {confidence}%
          </Badge>
          <Badge variant="outline" className="text-xs text-slate-300 border-slate-700">
            Gap Analisado: {gapTons} t {gapBrl ? `(R$ ${(gapBrl / 1000).toFixed(0)}k)` : ''}
          </Badge>
        </div>
      </div>

      {/* 1. O QUE ESTÁ ACONTECENDO & 2. POR QUE ESTÁ ACONTECENDO */}
      <div className="space-y-1 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
        <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
          O que está acontecendo & Por que está acontecendo?
        </h4>
        <p className="text-xs text-slate-200 leading-relaxed">
          Existe um <strong>gap total de {gapTons} toneladas</strong> para o fechamento da meta. A
          IA correlacionou {factors.length} vetores operacionais que explicam{' '}
          <strong>
            {totalImpactTons} t ({Math.round((totalImpactTons / (gapTons || 1)) * 100)}%)
          </strong>{' '}
          da discrepância, permitindo intervenção preventiva direta antes do encerramento do ciclo.
        </p>
      </div>

      {/* 3. QUAL A EVIDÊNCIA & 4. QUAL O IMPACTO (CARDS RASTREÁVEIS) */}
      <div className="space-y-2">
        <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          Fatores Investigados, Evidências e Impacto por Sistema
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {factors.map((factor, index) => {
            const badgeColor =
              factor.source === 'SAP ECC'
                ? 'bg-blue-900/60 text-blue-200 border-blue-700'
                : factor.source === 'WMS'
                  ? 'bg-purple-900/60 text-purple-200 border-purple-700'
                  : factor.source === 'TMS'
                    ? 'bg-sky-900/60 text-sky-200 border-sky-700'
                    : factor.source === 'Gestão de Performance'
                      ? 'bg-rose-900/60 text-rose-200 border-rose-700'
                      : factor.source === 'Qlik'
                        ? 'bg-emerald-900/60 text-emerald-200 border-emerald-700'
                        : 'bg-amber-900/60 text-amber-200 border-amber-700'

            return (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-100 line-clamp-1">
                      {factor.title}
                    </span>
                    <Badge className={cn('text-[9px] font-mono shrink-0 px-1.5 py-0', badgeColor)}>
                      {factor.source}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    <strong>Evidência:</strong> {factor.evidence}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Impacto no Gap:</span>
                  <span className="font-bold font-mono text-amber-400">
                    {factor.impactTons ? `• ${factor.impactTons} t` : ''}{' '}
                    {factor.impactBrl ? `(R$ ${(factor.impactBrl / 1000).toFixed(0)}k)` : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. QUAL A AÇÃO RECOMENDADA (CALLOUT EXECUTIVO) */}
      <div className="bg-amber-950/50 border border-amber-500/40 p-3.5 rounded-xl space-y-1">
        <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
          Ação Recomendada pela IA:
        </span>
        <p className="text-xs text-amber-100 font-medium leading-relaxed">{recommendation}</p>
      </div>
    </Card>
  )
}
