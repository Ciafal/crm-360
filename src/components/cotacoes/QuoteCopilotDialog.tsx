import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  DollarSign,
  PackageCheck,
  CreditCard,
  Building2,
  Copy,
} from 'lucide-react'
import type { QuoteCopilotInsight } from '@/providers/AIProvider'
import { toast } from 'sonner'

interface QuoteCopilotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insight: QuoteCopilotInsight | null
  customerName: string
  quoteCode?: string
  onApplyArgument?: (argument: string) => void
}

export function QuoteCopilotDialog({
  open,
  onOpenChange,
  insight,
  customerName,
  quoteCode,
  onApplyArgument,
}: QuoteCopilotDialogProps) {
  if (!insight) return null

  const handleCopyArgument = () => {
    navigator.clipboard.writeText(insight.commercialArgument)
    toast.success('Argumento comercial copiado para a área de transferência!')
    if (onApplyArgument) {
      onApplyArgument(insight.commercialArgument)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white text-slate-900 border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                QUOTE COPILOT (IA) — {customerName}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {quoteCode
                  ? `Análise estratégica para a proposta ${quoteCode}`
                  : 'Análise preditiva 360º para elaboração da proposta'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Prioridade & Resumo */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Prioridade Comercial:</span>
                <Badge
                  className={
                    insight.priority === 'ALTA'
                      ? 'bg-emerald-600 text-white'
                      : insight.priority === 'MEDIA'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 text-white'
                  }
                >
                  {insight.priority}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Follow-up sugerido: <strong>{insight.suggestedFollowUpHours}h</strong>
                </span>
              </div>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">{insight.priorityReason}</p>
          </div>

          {/* Contexto 360º */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                Perfil & ABC
              </span>
              <strong className="text-slate-900">{insight.contextSummary.archetype}</strong>
              <span className="text-[10px] text-emerald-700 block font-bold">
                Curva {insight.contextSummary.abcCategory}
              </span>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                Crédito SAP F.35
              </span>
              <strong className="text-slate-900">
                R$ {insight.contextSummary.creditAvailableBRL.toLocaleString('pt-BR')}
              </strong>
              <span
                className={`text-[10px] block font-bold ${insight.contextSummary.creditStatus === 'REGULAR' ? 'text-emerald-700' : 'text-amber-700'}`}
              >
                {insight.contextSummary.creditStatus}
              </span>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                Estoque / Produção
              </span>
              <strong className="text-slate-900">
                {insight.contextSummary.stockCoverageStatus}
              </strong>
              <span className="text-[10px] text-slate-500 block">Pátio Contagem / Betim</span>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                Preço Autorizado
              </span>
              <strong className="text-blue-900 font-mono">
                R$ {insight.contextSummary.authorizedPriceTons.toLocaleString('pt-BR')}/t
              </strong>
              <span
                className="text-[9px] text-slate-500 block truncate"
                title={insight.contextSummary.priceSource}
              >
                {insight.contextSummary.priceSource}
              </span>
            </div>
          </div>

          {/* Argumento de Venda Sugerido */}
          <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-purple-950 flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Argumento Comercial Recomendado (Sem Preço Inventado)
              </strong>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyArgument}
                className="h-6 px-2 text-[10px] text-purple-700 hover:bg-purple-100 gap-1"
              >
                <Copy className="w-3 h-3" />
                Copiar
              </Button>
            </div>
            <p className="text-[11px] text-purple-900 leading-relaxed italic bg-white/80 p-2.5 rounded-lg border border-purple-100">
              "{insight.commercialArgument}"
            </p>
          </div>

          {/* Avaliação de Risco & Próxima Ação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Nível de Risco:
                </span>
                <Badge
                  className={
                    insight.riskAssessment.level === 'BAIXO'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : insight.riskAssessment.level === 'MEDIO'
                        ? 'bg-amber-100 text-amber-900 border-amber-200'
                        : 'bg-rose-100 text-rose-900 border-rose-200'
                  }
                >
                  {insight.riskAssessment.level}
                </Badge>
              </div>
              <ul className="text-[10px] text-slate-600 space-y-1 list-disc pl-4">
                {insight.riskAssessment.factors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" /> Próxima Ação Recomendada:
              </span>
              <p className="text-[11px] text-slate-700 font-medium">
                {insight.nextRecommendedAction}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 border-t pt-3">
          <span className="text-[10px] text-slate-400">
            Regra CIAFAL: O Copilot analisa variáveis 360º e NUNCA arbitra preços fora da tabela
            oficial SAP ECC.
          </span>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
