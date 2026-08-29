import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Zap,
  Building2,
  FileText,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Info,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { PriorityCommercialAction } from '@/types/cockpit'

interface PriorityCommercialActionsBlockProps {
  actions: PriorityCommercialAction[]
  unit: 'REVENUE' | 'TONS'
  onRecalculate: () => void
  isRecalculating?: boolean
  onActionComplete?: (id: string) => void
}

export function PriorityCommercialActionsBlock({
  actions,
  unit,
  onRecalculate,
  isRecalculating = false,
  onActionComplete,
}: PriorityCommercialActionsBlockProps) {
  const navigate = useNavigate()
  const isTons = unit === 'TONS'

  const formatPotencial = (reais: number, tons: number) => {
    if (isTons) {
      return `${tons.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`
    }
    return reais.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  return (
    <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
      {/* Topo do Bloco de Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 rounded-xl">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-lg text-primary">
                Ações Prioritárias da IA (Recomendações Concretas)
              </h3>
              <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold border-none">
                Geração de Ação Imediata
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Priorização por impacto no gap da meta, risco de inatividade, estoque disponível e
              probabilidade
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={onRecalculate}
          disabled={isRecalculating}
          className="h-8 text-xs bg-primary hover:bg-primary/90 text-white rounded-xl gap-1.5 shrink-0 shadow-sm"
        >
          <Zap className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
          {isRecalculating ? 'Recalculando com IA...' : 'Recalcular Ações com IA'}
        </Button>
      </div>

      {/* Lista de Ações Concretas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {actions.map((act) => (
          <div
            key={act.id}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
              act.concluida
                ? 'bg-slate-50 border-slate-200 opacity-60'
                : act.urgencia === 'URGENTE'
                  ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                  : 'bg-slate-50/70 border-border/40 hover:border-primary/40'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  className={`text-[10px] font-bold border-none ${
                    act.urgencia === 'URGENTE'
                      ? 'bg-rose-100 text-rose-800'
                      : act.urgencia === 'ALTA'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {act.urgencia === 'URGENTE'
                    ? 'PRIORIDADE URGENTE'
                    : act.urgencia === 'ALTA'
                      ? 'PRIORIDADE ALTA'
                      : 'PRIORIDADE MÉDIA'}
                </Badge>

                <span className="font-mono font-bold text-xs text-primary">
                  Potencial: {formatPotencial(act.potencialReais, act.potencialTons)}
                </span>
              </div>

              <div>
                <strong
                  onClick={() => navigate(`/crm/${act.clienteId}`)}
                  className="text-xs font-bold text-slate-900 hover:text-primary cursor-pointer block"
                >
                  {act.clienteNome} ({act.cidadeUf})
                </strong>
                <span className="text-xs font-bold text-slate-800 block mt-0.5">{act.titulo}</span>
                <p className="text-[11px] text-slate-600 font-medium mt-1">{act.descricao}</p>
              </div>

              {/* Justificativa e Explicabilidade IA */}
              <div className="p-2.5 bg-white rounded-xl border border-border/40 text-[10px] space-y-1">
                <div className="flex items-center gap-1 font-bold text-slate-700">
                  <Info className="w-3.5 h-3.5 text-primary" />
                  <span>Por que estou recomendando isto?</span>
                </div>
                <p className="text-slate-600 font-medium">
                  {act.justificativaConcreta.motivoRecomendacao}
                </p>
                <div className="flex flex-wrap gap-2 text-muted-foreground pt-1 border-t border-slate-100">
                  <span>
                    Sem contato há <strong>{act.justificativaConcreta.diasSemContato}d</strong>{' '}
                    (Ciclo {act.justificativaConcreta.recorrenciaHistoricaDias}d)
                  </span>
                  <span>·</span>
                  <span>
                    Estoque disponível:{' '}
                    <strong>{act.justificativaConcreta.estoqueDisponivelTons} t</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Botões de Ação Direta */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/30">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/crm/${act.clienteId}`)}
                className="h-7 text-xs rounded-lg text-primary border-primary/30"
              >
                Abrir Cliente
              </Button>

              <Button
                size="sm"
                onClick={() => navigate(`/cotacoes/nova?clienteId=${act.clienteId}`)}
                className="h-7 text-xs bg-primary text-white rounded-lg gap-1"
              >
                <FileText className="w-3 h-3" /> Criar Cotação
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (onActionComplete) onActionComplete(act.id)
                  toast.success(`Ação para ${act.clienteNome} marcada como realizada!`)
                }}
                className="h-7 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg gap-1"
              >
                <CheckCircle2 className="w-3 h-3" /> Concluir
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
