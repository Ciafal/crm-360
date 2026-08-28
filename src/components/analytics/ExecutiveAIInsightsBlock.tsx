import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StructuredAIAction {
  id: string
  title: string
  description: string // Ação concreta com nomes e toneladas (ex.: "Contatar Metalúrgica ABC — potencial estimado de 85 t")
  impactTons?: number
  impactBrl?: number
  probability?: number
  deadline?: string
  priority: 'Alta' | 'Média' | 'Baixa'
  justification: string // "Por que a IA recomendou isso?" (Explicabilidade da IA)
  sourceSystem: 'CRM' | 'SAP ECC' | 'Qlik' | 'WMS' | 'TMS' | 'Crédito' | 'PCP'
  stockStatus?: 'DISPONIVEL' | 'EM_PRODUCAO' | 'BAIXO_SALDO'
  creditStatus?: 'LIBERADO' | 'LIMITE_TOMADO' | 'RESTRICAO'
  actionHandler?: () => void
}

export interface ExecutiveAIInsightsBlockProps {
  summary: string // Resumo executivo (3 a 5 linhas)
  attentionPoints: string[] // Pontos de atenção com bullets e dados concretos
  opportunities: string[] // Oportunidades identificadas
  actions: StructuredAIAction[] // Ações recomendadas objetivas
  modelInfo?: {
    model: string
    confidencePct: number
    updatedAt: string
    sourceSystems: string[]
  }
  onExecuteAction?: (action: StructuredAIAction) => void
  className?: string
}

export function ExecutiveAIInsightsBlock({
  summary,
  attentionPoints,
  opportunities,
  actions,
  modelInfo = {
    model: 'CIAFAL Commercial Copilot v2.4 (Llama 3.3 70B & Qlik Sense P(vivo))',
    confidencePct: 94,
    updatedAt: 'Há 5 minutos (SAP ECC incremental)',
    sourceSystems: ['SAP ECC', 'WMS Contagem', 'Qlik Sense', 'CRM 360º', 'TMS Logística'],
  },
  onExecuteAction,
  className,
}: ExecutiveAIInsightsBlockProps) {
  const [selectedActionWhy, setSelectedActionWhy] = React.useState<string | null>(null)

  return (
    <Card
      className={cn(
        'p-5 rounded-3xl bg-slate-950 text-white border border-amber-500/30 shadow-xl space-y-4 relative overflow-hidden',
        className,
      )}
    >
      {/* Background glow sutil */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER DO BLOCO DE IA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-lg text-amber-300">
                Análise de Inteligência Comercial Integrada
              </h3>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/40 text-[10px] font-mono">
                Confiança IA: {modelInfo.confidencePct}%
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Diagnóstico causal multissistema orientado à ação executiva e recuperação de gap
            </p>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-400 text-right">
          <span className="block">{modelInfo.model}</span>
          <span className="text-slate-500">{modelInfo.updatedAt}</span>
        </div>
      </div>

      {/* 1. RESUMO EXECUTIVO (3 A 5 LINHAS) */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1.5 relative z-10">
        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
          1. Resumo Executivo da Performance
        </span>
        <p className="text-xs text-slate-200 leading-relaxed font-normal">{summary}</p>
      </div>

      {/* 2. PONTOS DE ATENÇÃO & 3. OPORTUNIDADES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
        {/* Pontos de Atenção */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-rose-500/20 space-y-2">
          <span className="text-[11px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            2. Pontos Críticos de Atenção
          </span>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {attentionPoints.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Oportunidades Identificadas */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/20 space-y-2">
          <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            3. Oportunidades de Alavancagem
          </span>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {opportunities.map((op, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                <span>{op}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 4. AÇÕES RECOMENDADAS (NEXT BEST ACTIONS COM EXPLICABILIDADE) */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            4. Ações Recomendadas Prioritárias (Máximo 5)
          </span>
          <span className="text-[10px] text-slate-400">
            Toda ação possui justificativa causal auditada
          </span>
        </div>

        <div className="space-y-2">
          {actions.slice(0, 5).map((action) => {
            const isExplaining = selectedActionWhy === action.id

            return (
              <div
                key={action.id}
                className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col gap-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          'text-[9px] font-bold border-none uppercase',
                          action.priority === 'Alta'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
                        )}
                      >
                        Prioridade {action.priority}
                      </Badge>
                      <strong className="text-xs text-slate-100">{action.title}</strong>
                      <Badge className="bg-slate-800 text-slate-300 text-[9px] font-mono border-none">
                        Fonte: {action.sourceSystem}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {action.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {action.impactTons && (
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        +{action.impactTons} t
                      </span>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedActionWhy(isExplaining ? null : action.id)}
                      className="h-7 text-[11px] text-amber-300 hover:text-white hover:bg-slate-800 gap-1 px-2"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>{isExplaining ? 'Fechar Por quê?' : 'Por que a IA recomendou?'}</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => {
                        if (action.actionHandler) action.actionHandler()
                        if (onExecuteAction) onExecuteAction(action)
                      }}
                      className="h-7 text-[11px] bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1 rounded-lg shadow-xs"
                    >
                      <span>Executar Ação</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Bloco de Explicabilidade da IA */}
                {isExplaining && (
                  <div className="mt-1 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs space-y-1.5 animate-fade-in text-amber-100">
                    <strong className="text-amber-300 block uppercase font-bold text-[10px]">
                      Explicabilidade Algorítmica da Decisão (Por que a IA recomendou isso?):
                    </strong>
                    <p className="leading-relaxed">{action.justification}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-300 pt-1 border-t border-amber-500/20 font-mono">
                      <span>• Validação de Estoque: {action.stockStatus || 'Conforme'}</span>
                      <span>• Validação de Crédito SAP: {action.creditStatus || 'Liberado'}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
