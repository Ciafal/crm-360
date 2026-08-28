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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react'
import { quotationService } from '@/services/quotation_service'
import { toast } from 'sonner'
import type { Quotation } from '@/types/quotation'

interface InternalApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation | null
  onSuccess: () => void
}

export function InternalApprovalDialog({
  open,
  onOpenChange,
  quotation,
  onSuccess,
}: InternalApprovalDialogProps) {
  const [notes, setNotes] = useState('Desconto comercial avaliado e deferido pela gestão.')
  const [loading, setLoading] = useState(false)

  if (!quotation) return null

  const handleApprove = async () => {
    try {
      setLoading(true)
      const level =
        quotation.approval_level_required === 'SUPERVISOR' ||
        quotation.approval_level_required === 'GERENCIA' ||
        quotation.approval_level_required === 'DIRETORIA'
          ? quotation.approval_level_required
          : 'GERENCIA'
      await quotationService.approveQuotation(
        quotation.id,
        'Marcos Vinícius (Gerente Regional)',
        level,
        notes,
      )
      toast.success(`Cotação ${quotation.code} aprovada internamente com sucesso!`)
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(`Erro ao aprovar: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white rounded-3xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-900 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-primary">
                Aprovação Comercial Interna
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Matriz de Alçada — Nível {quotation.approval_level_required}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-border/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">{quotation.code}</span>
              <Badge className="bg-amber-100 text-amber-900 border-none text-[10px] font-bold">
                Nível: {quotation.approval_level_required}
              </Badge>
            </div>
            <p className="text-slate-700">{quotation.customer_name}</p>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/20 text-[11px] text-muted-foreground">
              <span>
                Total Cotação:{' '}
                <strong className="text-primary">
                  R$ {quotation.total_value.toLocaleString('pt-BR')}
                </strong>
              </span>
              <span>
                Volume: <strong>{quotation.total_tons} t</strong>
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-primary">Parecer do Aprovador</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            onClick={handleApprove}
            disabled={loading}
            className="h-9 text-xs bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold shadow-xs gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {loading ? 'Aprovando...' : 'Conceder Aprovação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
