import React, { useState } from 'react'
import {
  Sparkles,
  Phone,
  MessageSquare,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileEdit,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { DailyCommercialAction, CommercialActionType } from '@/types/models'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator'
import { DataSourceBadge } from '@/components/shared/DataSourceBadge'
import { ActionStatusBadge } from '@/components/shared/ActionStatusBadge'

interface DailyActionCardProps {
  action: DailyCommercialAction
  onComplete: (action: DailyCommercialAction) => Promise<void>
  onJustify: (action: DailyCommercialAction, justification: string) => Promise<void>
  onReschedule: (
    action: DailyCommercialAction,
    newDate: string,
    justification?: string,
  ) => Promise<void>
  onOpenCustomer360?: (customerId: string) => void
  onNavigateConversas?: (phoneOrJid?: string) => void
}

const ACTION_TYPE_CONFIG: Record<
  CommercialActionType,
  { label: string; badgeClass: string; borderClass: string; icon: any }
> = {
  atacar_agora: {
    label: 'Atacar Agora',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-300 font-bold',
    borderClass: 'border-l-4 border-l-emerald-500',
    icon: Sparkles,
  },
  follow_up: {
    label: 'Follow-up Obrigatório',
    badgeClass: 'bg-blue-500/15 text-blue-700 border-blue-300 font-bold',
    borderClass: 'border-l-4 border-l-blue-500',
    icon: Clock,
  },
  recuperar: {
    label: 'Recuperar Inativo',
    badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-300 font-bold',
    borderClass: 'border-l-4 border-l-amber-500',
    icon: AlertTriangle,
  },
  resolver_impedimento: {
    label: 'Resolver Impedimento',
    badgeClass: 'bg-rose-500/15 text-rose-700 border-rose-300 font-bold',
    borderClass: 'border-l-4 border-l-rose-500',
    icon: AlertCircle,
  },
  nao_priorizar: {
    label: 'Não Priorizar Agora',
    badgeClass: 'bg-slate-500/15 text-slate-700 border-slate-300 font-medium',
    borderClass: 'border-l-4 border-l-slate-400 opacity-75',
    icon: ShieldCheck,
  },
}

export function DailyActionCard({
  action,
  onComplete,
  onJustify,
  onReschedule,
  onOpenCustomer360,
  onNavigateConversas,
}: DailyActionCardProps) {
  const [justificationModalOpen, setJustificationModalOpen] = useState(false)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [justificationText, setJustificationText] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState('')

  const config = ACTION_TYPE_CONFIG[action.action_type] || ACTION_TYPE_CONFIG.atacar_agora
  const Icon = config.icon

  const formatBRL = (val?: number) => {
    if (!val) return 'R$ 0'
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  const handleJustifySubmit = async () => {
    await onJustify(action, justificationText)
    setJustificationModalOpen(false)
    setJustificationText('')
  }

  const handleRescheduleSubmit = async () => {
    await onReschedule(action, rescheduleDate, justificationText)
    setRescheduleModalOpen(false)
    setRescheduleDate('')
    setJustificationText('')
  }

  return (
    <>
      <Card
        className={cn(
          'bg-white/80 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden flex flex-col justify-between border border-border/50',
          config.borderClass,
        )}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn('text-[11px] py-0.5 px-2 flex items-center gap-1', config.badgeClass)}
              >
                <Icon className="w-3 h-3" />
                {config.label}
              </Badge>
              {action.priority !== undefined && <PriorityBadge priority={action.priority} />}
              {action.source && <DataSourceBadge source={action.source} />}
              <ActionStatusBadge status={action.status} />
            </div>
            {action.confidence !== undefined && (
              <ConfidenceIndicator confidence={action.confidence} />
            )}
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-primary leading-tight">
                {action.customer_name || action.customer_id}
              </h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Cód: {action.customer_id}{' '}
                {action.product_family ? `· Família: ${action.product_family}` : ''}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Potencial estimado</span>
              <span className="font-bold font-serif text-base text-primary">
                {formatBRL(action.potential_revenue)}
              </span>
              {action.potential_tons ? (
                <span className="text-[11px] text-muted-foreground block">
                  ({action.potential_tons} ton)
                </span>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-1 flex flex-col gap-3">
          {/* Recomendação e Rationale */}
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex flex-col gap-1.5">
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              <span className="font-bold text-primary">Ação Recomendada:</span>{' '}
              {action.recommendation}
            </p>
            {action.rationale && (
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-semibold text-slate-600">Por quê:</span> {action.rationale}
              </p>
            )}
          </div>

          {/* Barra de Ações Operacionais */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30 gap-1.5">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2.5 text-xs text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                onClick={() => onNavigateConversas && onNavigateConversas(action.customer_name)}
                title="Abrir WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                WhatsApp
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2.5 text-xs text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                title="Registrar Ligação Telefônica"
                onClick={() => onNavigateConversas && onNavigateConversas()}
              >
                <Phone className="w-3.5 h-3.5 mr-1" />
                Ligar
              </Button>
              {onOpenCustomer360 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs text-primary border-primary/20 hover:bg-primary/10"
                  onClick={() => onOpenCustomer360(action.customer_id)}
                  title="Visão 360 do Cliente"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Cliente 360º
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  window.location.href = '/crm'
                }}
                title="Criar Oportunidade"
              >
                + Oportunidade
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-slate-800"
                onClick={() => setRescheduleModalOpen(true)}
                title="Reagendar Ação"
              >
                <Calendar className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-slate-800"
                onClick={() => setJustificationModalOpen(true)}
                title="Justificar Não Realização"
              >
                <FileEdit className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="default"
                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                onClick={() => onComplete(action)}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Concluir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Justificativa */}
      <Dialog open={justificationModalOpen} onOpenChange={setJustificationModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">Justificar Não Realização</DialogTitle>
            <DialogDescription>
              Explique por que esta ação não será executada hoje para calibrar os modelos da CIAFAL.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Textarea
              placeholder="Ex: Cliente em férias coletivas até a próxima semana..."
              value={justificationText}
              onChange={(e) => setJustificationText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJustificationModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleJustifySubmit} disabled={!justificationText.trim()}>
              Salvar Justificativa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Reagendamento */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">Reagendar Ação Comercial</DialogTitle>
            <DialogDescription>
              Defina a nova data para retomar esta oportunidade.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Nova Data
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Motivo do reagendamento (opcional)
              </label>
              <Textarea
                placeholder="Ex: Solicitado retorno após reunião de compras..."
                value={justificationText}
                onChange={(e) => setJustificationText(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRescheduleSubmit} disabled={!rescheduleDate}>
              Reagendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
