import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { quotationService } from '@/services/quotation_service'
import { toast } from 'sonner'
import type { StockConfirmationRequest } from '@/types/quotation'

interface StockResponseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: StockConfirmationRequest | null
  onSuccess: () => void
}

export function StockResponseDialog({
  open,
  onOpenChange,
  request,
  onSuccess,
}: StockResponseDialogProps) {
  const [decision, setDecision] = useState<'CONFIRMAR' | 'PARCIAL' | 'NEGAR'>('CONFIRMAR')
  const [confirmedQty, setConfirmedQty] = useState<number>(request?.requested_qty || 0)
  const [expectedDate, setExpectedDate] = useState<string>(
    request?.expected_date || new Date().toISOString().split('T')[0],
  )
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  if (!request) return null

  const handleProcess = async () => {
    try {
      setLoading(true)
      await quotationService.respondStockConfirmation(
        request.id,
        decision,
        decision === 'NEGAR' ? 0 : Number(confirmedQty),
        expectedDate,
        comment ||
          (decision === 'CONFIRMAR'
            ? 'Disponibilidade integral confirmada pela equipe industrial.'
            : decision === 'PARCIAL'
              ? `Disponibilidade parcial de ${confirmedQty} ${request.unit} confirmada.`
              : 'Sem saldo disponível ou previsão de corte para este período.'),
        'Equipe PCP / Logística (Eng. Marcelo)',
      )

      toast.success(`Retorno de estoque processado com sucesso: ${decision}!`)
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(`Erro ao responder confirmação: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white rounded-3xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-primary">
                Avaliação de Disponibilidade de Estoque
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Workflow PCP / Logística para liberação de lote
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Card com Detalhes da Solicitação */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-border/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-primary">{request.material_code}</span>
              <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                Qtd Pedida: {request.requested_qty} {request.unit}
              </Badge>
            </div>
            <p className="font-medium text-slate-800">{request.material_description}</p>
            <p className="text-[11px] text-muted-foreground">
              Cliente: <strong>{request.customer_name}</strong> | Solicitante:{' '}
              <strong>{request.requested_by}</strong>
            </p>
            {request.comment && (
              <p className="p-2 bg-amber-50/70 rounded-xl text-[11px] text-amber-900 border border-amber-200/60 mt-1">
                <strong>Nota do Vendedor:</strong> {request.comment}
              </p>
            )}
          </div>

          {/* Seleção de Decisão */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-primary">Decisão Industrial / PCP</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDecision('CONFIRMAR')
                  setConfirmedQty(request.requested_qty)
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  decision === 'CONFIRMAR'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                    : 'border-border/60 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px]">Confirmar Total</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('PARCIAL')
                  setConfirmedQty(Math.max(1, request.stock_snapshot_qty))
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  decision === 'PARCIAL'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-800 font-bold shadow-xs'
                    : 'border-border/60 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-cyan-600" />
                <span className="text-[11px]">Parcial</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('NEGAR')
                  setConfirmedQty(0)
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  decision === 'NEGAR'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold shadow-xs'
                    : 'border-border/60 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span className="text-[11px]">Não Confirmar</span>
              </button>
            </div>
          </div>

          {/* Quantidade Confirmada */}
          {decision !== 'NEGAR' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-primary">
                  Quantidade Confirmada ({request.unit})
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={confirmedQty}
                  onChange={(e) => setConfirmedQty(Number(e.target.value))}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-primary">Data Prevista de Pátio</label>
                <Input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Observação da Confirmação */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-primary">Parecer Técnico / PCP</label>
            <Textarea
              placeholder="Ex: Bobina mãe em processo de decapagem. Lote disponível para carregamento a partir de 05/11."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="text-xs rounded-xl min-h-[70px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleProcess}
            disabled={loading}
            className="h-9 text-xs bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-xs"
          >
            {loading ? 'Salvando...' : 'Salvar Resposta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
