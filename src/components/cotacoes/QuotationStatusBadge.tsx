import React from 'react'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Check,
  Send,
  MessageCircle,
  Sparkles,
  XCircle,
  ArrowRightCircle,
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
    case 'EM_PREPARACAO':
    case 'EM_ELABORACAO':
      return (
        <Badge
          className={cn(
            'bg-blue-100 text-blue-800 border-blue-300 font-bold text-[10px] gap-1',
            className,
          )}
        >
          <Clock className="w-3 h-3 text-blue-600" /> Em Preparação
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
    case 'PRONTA_PARA_ENVIO':
    case 'APROVADA_INTERNAMENTE':
      return (
        <Badge
          className={cn(
            'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold text-[10px] gap-1',
            className,
          )}
        >
          <Check className="w-3 h-3 text-indigo-700" /> Pronta p/ Envio
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
    case 'AGUARDANDO_RETORNO':
      return (
        <Badge
          className={cn(
            'bg-sky-100 text-sky-900 border-sky-300 font-bold text-[10px] gap-1',
            className,
          )}
        >
          <Clock className="w-3 h-3 text-sky-700" /> Aguardando Retorno
        </Badge>
      )
    case 'NEGOCIACAO':
    case 'EM_NEGOCIACAO':
      return (
        <Badge
          className={cn(
            'bg-purple-100 text-purple-900 border-purple-300 font-bold text-[10px] gap-1',
            className,
          )}
        >
          <MessageCircle className="w-3 h-3 text-purple-700" /> Negociação
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
    case 'CONVERSAO_SAP':
    case 'AGUARDANDO_IMPLANTACAO_SAP':
    case 'PROCESSANDO_SAP':
      return (
        <Badge
          className={cn(
            'bg-blue-600 text-white border-none font-bold text-[10px] gap-1 animate-pulse',
            className,
          )}
        >
          <ArrowRightCircle className="w-3 h-3" /> Conversão SAP
        </Badge>
      )
    case 'PEDIDO_IMPLANTADO':
    case 'PEDIDO_SAP_IMPLANTADO':
      return (
        <Badge
          className={cn(
            'bg-emerald-700 text-white border-none font-bold text-[10px] gap-1 shadow-xs',
            className,
          )}
        >
          <CheckCircle2 className="w-3 h-3" /> Pedido Implantado
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
          <AlertCircle className="w-3 h-3" /> Erro SAP
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
          <XCircle className="w-3 h-3 text-rose-600" /> Perdida
        </Badge>
      )
    case 'CANCELADA':
      return (
        <Badge
          className={cn(
            'bg-gray-200 text-gray-700 border-gray-300 font-bold text-[10px] gap-1',
            className,
          )}
        >
          Cancelada
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function ApprovalStatusBadge({ status, level }: { status: ApprovalStatus; level?: string }) {
  switch (status) {
    case 'NOT_REQUIRED':
    case 'APROVADA_AUTOMATICAMENTE':
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px] gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprovada Automática
        </Badge>
      )
    case 'PENDING':
    case 'AGUARDANDO_APROVACAO':
      return (
        <Badge className="bg-amber-100 text-amber-900 border-amber-400 font-bold text-[10px] gap-1 animate-pulse">
          <Clock className="w-3 h-3 text-amber-600" /> Aguardando {level || 'Alçada'}
        </Badge>
      )
    case 'APPROVED':
    case 'APROVADA_SUPERVISOR':
    case 'APROVADA_GERENCIA':
    case 'APROVADA_DIRETORIA':
      return (
        <Badge className="bg-emerald-600 text-white border-none font-bold text-[10px] gap-1">
          <Check className="w-3 h-3" /> Aprovada {level ? `(${level})` : ''}
        </Badge>
      )
    case 'REJECTED':
      return (
        <Badge className="bg-rose-600 text-white border-none font-bold text-[10px] gap-1">
          <XCircle className="w-3 h-3" /> Rejeitada
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
