// src/components/consultas/SolicitarSegundaViaModal.tsx
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FileQuestion,
  Send,
  Building2,
  Calendar,
  Clock,
  AlertCircle,
  CreditCard,
} from 'lucide-react'
import { BoletoFinanceiro } from '@/data/mockConsultasData'
import { consultasService } from '@/services/consultasService'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface SolicitarSegundaViaModalProps {
  boleto: BoletoFinanceiro | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export const SolicitarSegundaViaModal: React.FC<SolicitarSegundaViaModalProps> = ({
  boleto,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { user } = useAuth()
  const [motivo, setMotivo] = useState(
    'Cliente solicita 2ª via atualizada com nova data de vencimento devido a reprogramação de fluxo de caixa.',
  )
  const [novaData, setNovaData] = useState('2026-09-10')
  const [submitting, setSubmitting] = useState(false)

  if (!boleto) return null

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      toast.error('Informe a justificativa/motivo para o Financeiro.')
      return
    }

    setSubmitting(true)
    try {
      if (user) {
        const sol = await consultasService.solicitarSegundaViaFinanceiro(
          user,
          boleto,
          motivo,
          novaData,
        )
        toast.success(`Solicitação ${sol.protocolo} enviada à Tesouraria/Financeiro com sucesso!`, {
          description: `SLA estimado: ${sol.slaHoras} horas. O documento atualizado retornará direto pelo CRM.`,
        })
      }
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error('Erro ao enviar solicitação ao Financeiro.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 bg-white">
        <DialogHeader className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Solicitar 2ª Via ao Financeiro (SAP FI / Bancário)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Título nº <strong>{boleto.numeroDocumento}</strong> · NF nº{' '}
                {boleto.numeroNfRelacionada}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs">
          {/* Card Resumo do Título */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Cliente:</span>
              <strong className="text-slate-900 font-bold">{boleto.clienteNome}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Valor Original:</span>
              <span className="font-bold text-primary text-sm">
                {boleto.valorOriginal.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Vencimento Original:</span>
              <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200 font-bold">
                {boleto.dataVencimentoFormatada} ({boleto.status})
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Banco Emissor:</span>
              <span className="font-medium text-slate-800">{boleto.banco}</span>
            </div>
          </div>

          {/* Aviso de Conformidade Financeira */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
            <div className="text-[11px] leading-relaxed">
              <strong>Processo de Fila Automatizada (SLA 4h)</strong>
              <p className="mt-0.5 text-blue-800">
                A solicitação é encaminhada diretamente para a fila da Tesouraria/Contas a Receber
                CIAFAL. O cálculo de encargos contratuais e a emissão do novo código de barras
                ocorrem no ambiente bancário oficial.
              </p>
            </div>
          </div>

          {/* Nova Data Sugerida */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Data de Vencimento Sugerida para a 2ª Via
            </label>
            <Input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Motivo da Solicitação */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Justificativa Comercial / Motivo da Atualização
            </label>
            <Textarea
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="text-xs resize-none"
              placeholder="Descreva o motivo para a equipe financeira..."
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs border-slate-300"
          >
            Cancelar
          </Button>

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5 px-5"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Encaminhando...' : 'Enviar para Fila do Financeiro'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
