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
import { CheckCircle2, ShieldCheck, FileCheck } from 'lucide-react'
import { quotationService } from '@/services/quotation_service'
import { toast } from 'sonner'
import type { Quotation } from '@/types/quotation'

interface ClientAcceptanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation | null
  onSuccess: () => void
}

export function ClientAcceptanceDialog({
  open,
  onOpenChange,
  quotation,
  onSuccess,
}: ClientAcceptanceDialogProps) {
  const [poNumber, setPoNumber] = useState('')
  const [notes, setNotes] = useState('Aceite confirmado formalmente pelo responsável de compras.')
  const [loading, setLoading] = useState(false)

  if (!quotation) return null

  const handleRegister = async () => {
    try {
      setLoading(true)
      await quotationService.registerClientAcceptance(quotation.id, notes, poNumber)
      toast.success(
        `Aceite do cliente para a cotação ${quotation.code} registrado com sucesso! Pronto para envio ao SAP.`,
      )
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(`Erro ao registrar aceite: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white rounded-3xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-900 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-primary">
                Registrar Aceite do Cliente
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Formalização comercial necessária para envio da ordem ao SAP ECC
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-border/40 space-y-1">
            <span className="font-bold text-slate-800 block text-xs">
              {quotation.code} — {quotation.customer_name}
            </span>
            <p className="text-[11px] text-muted-foreground">
              Total: <strong>R$ {quotation.total_value.toLocaleString('pt-BR')}</strong> (
              {quotation.total_tons}t)
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-primary">
              Número do Pedido do Cliente (PO / Ordem de Compra)
            </label>
            <Input
              placeholder="Ex: PO-88912 / OC-2024"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="h-9 text-xs rounded-xl font-mono uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-primary">Evidência / Observações</label>
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
            onClick={handleRegister}
            disabled={loading}
            className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5" />
            {loading ? 'Gravando...' : 'Confirmar Aceite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
