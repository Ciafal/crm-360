import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import type { Quotation, LossReason } from '@/types/quotation'

interface RegisterLossDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation | null
  onConfirm: (reason: LossReason, notes: string) => Promise<void>
}

const LOSS_REASONS: { value: LossReason; label: string }[] = [
  { value: 'PRECO', label: 'Preço / Condição Comercial' },
  { value: 'PRAZO', label: 'Prazo de Entrega' },
  { value: 'FRETE', label: 'Valor ou Tipo de Frete (CIF/FOB)' },
  { value: 'ESTOQUE', label: 'Falta de Estoque Imediato' },
  { value: 'PRODUCAO', label: 'Prazo de Produção / Laminação' },
  { value: 'CREDITO', label: 'Limite de Crédito SAP Insuficiente' },
  { value: 'CONCORRENCIA', label: 'Concorrência / Distribuidor Regional' },
  { value: 'CLIENTE_ADIOU', label: 'Cliente Adiou / Cancelou Projeto' },
  { value: 'SEM_RESPOSTA', label: 'Sem Resposta após Follow-ups' },
  { value: 'ESPECIFICACAO', label: 'Especificação / Norma Técnica' },
  { value: 'OUTRO', label: 'Outro Motivo' },
]

export function RegisterLossDialog({
  open,
  onOpenChange,
  quotation,
  onConfirm,
}: RegisterLossDialogProps) {
  const [reason, setReason] = React.useState<LossReason>('PRECO')
  const [notes, setNotes] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async () => {
    if (!notes.trim()) return
    try {
      setLoading(true)
      await onConfirm(reason, notes)
      onOpenChange(false)
      setNotes('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700">
            <AlertCircle className="w-5 h-5" /> Registrar Motivo de Perda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-600">
            Informe o motivo formal de perda para a cotação{' '}
            <strong className="text-slate-900">{quotation?.code}</strong> (
            {quotation?.customer_name}). Este dado alimentará o Pareto comercial e a IA de
            precificação.
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Motivo Principal da Perda *</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as LossReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {LOSS_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Observações / Detalhes Obrigatórios *</Label>
            <Textarea
              placeholder="Explique o contexto da perda, concorrente envolvido ou detalhes do feedback do cliente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!notes.trim() || loading}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          >
            {loading ? 'Registrando...' : 'Confirmar Perda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
