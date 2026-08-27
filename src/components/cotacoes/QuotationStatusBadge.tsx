import React from 'react'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Check,
  Send,
  MessageCircle,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuotationStatus, ApprovalStatus } from '@/types/quotation'

export function QuotationStatusBadge({
  status,
  className,
}: {
  status: QuotationStatus
  className?: string
}) {
  switch (status) {
    case 'RASCUNHO':
      return (
        <Badge
          className={cn(
            'bg-slate-100 text-slate-800 border-slate-300 font-bold text-[10px] gap-1',
            className,
          )}
        >
          <FileText className="w-3 h-3 text-slate-600" /> Rascunho
        </Badge>
      )
    case 'EM_ELABORACAO':
      return (
        <Badge
          className={cn(
            'bg-blue-100 text-blue-800 border-blue-300 font-bold text-[10px] gap-1',
            className,
          )}
        >
          <Clock className="w-3 h-3 text-blue-600" /> Em Elaboração
        </Badge>
      )
    case 'AGUARDANDO_CONFIRMACAO_ESTOQUE':
      return (
        <Badge
          className={cn(
            'bg-orange-100 text-orange-900 border-orange-400 font-bold text-[10px] gap-1 animate-pulse',
            className,
          )}
        >
          <AlertCircle className="w-3 h-3 text-orange-700" /> Aguardando Confirmação de Estoque
        </Badge>
      )
    case 'AGUARDANDO_APROVACAO':
      return (
        <Badge
          className={cn(
            'bg-amber-100 text-amber-900 border-amber-400 font-bold text-[10px] gap-1 animate-pulse',
            className,
          )}
        >
          <Clock className="w-3 h-3 text-amber-700" /> Aguardando Aprovação
        </Badge>
      )
    case 'APROVADA_INTERNAMENTE':
      return (
        <Badge
          className={cn(
            'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold text-[10px] gap-1',
            className,
          )}
        >
          <Check className="w-3 h-3 text-indigo-700" /> Aprovada Internamente
        </Badge>
      )
    case 'ENVIADA_AO_CLIENTE':
      return (
        <Badge
          className={cn(
            'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold text-[10px] gap-1',
            className,
          )}
        >
          <Send className="w-3 h-3 text-cyan-700" /> Enviada ao Cliente
        </Badge>
      )
    case 'EM_NEGOCIACAO':
      return (
        <Badge
          className={cn(
            'bg-purple-100 text-purple-900 border-purple-300 font-bold text-[10px] gap-1',
            className,
          )}
        >
          <MessageCircle className="w-3 h-3 text-purple-700" /> Em Negociação
        </Badge>
      )
    case 'ACEITA':
      return (
        <Badge
          className={cn(
            'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold text-[10px] gap-1',
            className,
          )}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Aceita pelo Cliente
        </Badge>
      )
    case 'AGUARDANDO_IMPLANTACAO_SAP':
      return (
        <Badge
          className={cn(
            'bg-blue-600 text-white border-none font-bold text-[10px] gap-1 animate-pulse',
            className,
          )}
        >
          <Clock className="w-3 h-3" /> Aguardando Implantação SAP
        </Badge>
      )
    case 'PROCESSANDO_SAP':
      return (
        <Badge
          className={cn(
            'bg-indigo-600 text-white border-none font-bold text-[10px] gap-1 animate-pulse',
            className,
          )}
        >
          <Sparkles className="w-3 h-3" /> Processando no SAP ECC
        </Badge>
      )
    case 'PEDIDO_SAP_IMPLANTADO':
      return (
        <Badge
          className={cn(
            'bg-emerald-700 text-white border-none font-bold text-[10px] gap-1 shadow-xs',
            className,
          )}
        >
          <CheckCircle2 className="w-3 h-3" /> Pedido SAP Implantado
        </Badge>
      )
    case 'BLOQUEADO_NO_SAP':
      return (
        <Badge
          className={cn(
            'bg-amber-600 text-white border-none font-bold text-[10px] gap-1 shadow-xs',
            className,
          )}
        >
          <AlertCircle className="w-3 h-3" /> Bloqueado no SAP
        </Badge>
      )
    case 'ERRO_DE_IMPLANTACAO':
      return (
        <Badge
          className={cn('bg-red-600 text-white border-none font-bold text-[10px] gap-1', className)}
        >
          <AlertCircle className="w-3 h-3" /> Erro de Implantação
        </Badge>
      )
    case 'PERDIDA':
      return (
        <Badge
          className={cn(
            'bg-rose-100 text-rose-800 border-rose-300 font-bold text-[10px] gap-1',
            className,
          )}
        >
          Perdida
        </Badge>
      )
    case 'EXPIRADA':
      return (
        <Badge
          className={cn(
            'bg-slate-200 text-slate-700 border-slate-300 font-bold text-[10px] gap-1',
            className,
          )}
        >
          Expirada
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function ApprovalStatusBadge({ status, level }: { status: ApprovalStatus; level?: string }) {
  switch (status) {
    case 'APROVADA_AUTOMATICAMENTE':
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px] gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprovada Automaticamente
        </Badge>
      )
    case 'AGUARDANDO_APROVACAO':
      return (
        <Badge className="bg-amber-100 text-amber-900 border-amber-400 font-bold text-[10px] gap-1 animate-pulse">
          <Clock className="w-3 h-3 text-amber-600" /> Aguardando{' '}
          {level ? level : 'Aprovação Interna'}
        </Badge>
      )
    case 'APROVADA_SUPERVISOR':
      return (
        <Badge className="bg-emerald-600 text-white border-none font-bold text-[10px] gap-1">
          <Check className="w-3 h-3" /> Aprovada (Supervisor)
        </Badge>
      )
    case 'APROVADA_GERENCIA':
      return (
        <Badge className="bg-emerald-700 text-white border-none font-bold text-[10px] gap-1">
          <Check className="w-3 h-3" /> Aprovada (Gerência)
        </Badge>
      )
    case 'APROVADA_DIRETORIA':
      return (
        <Badge className="bg-emerald-800 text-white border-none font-bold text-[10px] gap-1">
          <Check className="w-3 h-3" /> Aprovada (Diretoria)
        </Badge>
      )
    case 'REJEITADA':
      return (
        <Badge className="bg-rose-600 text-white border-none font-bold text-[10px] gap-1">
          Rejeitada
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
