import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, XCircle, Warehouse, ShieldCheck } from 'lucide-react'
import { stockService } from '@/services/stock_service'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type { StockCheckRequest } from '@/types/stock'
import { formatWeight } from '@/lib/utils'

interface RespondStockCheckModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  checkRequest: StockCheckRequest | null
  onSuccess?: () => void
}

export function RespondStockCheckModal({
  open,
  onOpenChange,
  checkRequest,
  onSuccess,
}: RespondStockCheckModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [confirmedTons, setConfirmedTons] = useState<number>(0)
  const [divergenceReason, setDivergenceReason] = useState('')
  const [inspectorNotes, setInspectorNotes] = useState('')
  const [inspectorName, setInspectorName] = useState(user?.name || 'Equipe WMS / Pátio')
  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    if (open && checkRequest) {
      setConfirmedTons(checkRequest.requestedTons)
      setDivergenceReason('')
      setInspectorNotes('Material conferido fisicamente no pátio. Lote liberado.')
      setInspectorName(user?.name || 'Marcelo Ribeiro (Supervisor WMS)')
    }
  }, [open, checkRequest, user])

  if (!checkRequest) return null

  const difference = Number((confirmedTons - checkRequest.requestedTons).toFixed(2))
  const isDivergent = Math.abs(difference) > 0.01

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await stockService.respondStockCheck({
        checkId: checkRequest.id,
        confirmedPhysicalTons: Number(confirmedTons),
        divergenceReason: isDivergent ? divergenceReason : undefined,
        inspectorNotes,
        inspectorName,
        responderUser: {
          id: user?.id || 'qas-supervisor_teste',
          name: user?.name || inspectorName,
          role: user?.role || 'supervisor',
        },
      })

      toast({
        title: isDivergent ? 'Divergência Registrada' : 'Estoque Físico Confirmado!',
        description: isDivergent
          ? `Ocorrência gerada no WMS. Confirmado ${formatWeight(confirmedTons)} (Divergência: ${formatWeight(difference)}).`
          : `Protocolo ${checkRequest.protocol} confirmado com sucesso (${formatWeight(confirmedTons)}).`,
      })

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar conferência',
        description: err.message || 'Falha ao salvar retorno de estoque.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-6 border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl font-bold text-primary">
                Retorno de Conferência Física WMS
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Protocolo {checkRequest.protocol} · Registra conferência real sem alterar mestre
                SAP.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="space-y-4 pt-1">
          {/* RESUMO DA SOLICITAÇÃO */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <strong className="font-mono text-slate-800">{checkRequest.materialCode}</strong>
              <Badge variant="outline" className="text-[10px] bg-white">
                Solicitante: {checkRequest.requesterName}
              </Badge>
            </div>
            <p className="text-muted-foreground line-clamp-1">{checkRequest.materialDescription}</p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
              <span>
                Qtd Solicitada:{' '}
                <strong className="text-primary">{formatWeight(checkRequest.requestedTons)}</strong>
              </span>
              <span>
                Local:{' '}
                <strong>
                  {checkRequest.plantName} / {checkRequest.storageLocation}
                </strong>
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">
              Quantidade Fisicamente Confirmada (t) <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              required
              value={confirmedTons}
              onChange={(e) => setConfirmedTons(parseFloat(e.target.value) || 0)}
              className="h-9 text-xs rounded-xl bg-white"
            />
            {isDivergent && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Divergência de{' '}
                {difference > 0 ? `+${formatWeight(difference)}` : formatWeight(difference)} em
                relação ao solicitado.
              </p>
            )}
          </div>

          {isDivergent && (
            <div className="space-y-1.5 animate-fade-in">
              <Label className="text-xs font-bold text-rose-700">
                Motivo da Divergência / Ocorrência WMS <span className="text-rose-500">*</span>
              </Label>
              <Input
                required
                value={divergenceReason}
                onChange={(e) => setDivergenceReason(e.target.value)}
                placeholder="Ex: Avaria física de feixe, oxidação ou diferença de contagem física."
                className="h-9 text-xs rounded-xl border-rose-300 bg-rose-50/40 text-xs"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">Responsável pela Conferência</Label>
            <Input
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="Nome do inspetor ou encarregado de pátio"
              className="h-9 text-xs rounded-xl bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">
              Parecer Técnico / Observações do WMS
            </Label>
            <Textarea
              value={inspectorNotes}
              onChange={(e) => setInspectorNotes(e.target.value)}
              placeholder="Descreva as condições físicas do lote conferido."
              rows={2}
              className="text-xs rounded-xl bg-white resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs h-9 bg-primary hover:bg-primary/90 text-white font-bold gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSubmitting ? 'Gravando...' : 'Salvar Retorno de Estoque'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
