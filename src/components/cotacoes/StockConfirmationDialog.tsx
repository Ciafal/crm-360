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
import { AlertCircle, Clock, Send, ShieldCheck, Factory } from 'lucide-react'
import { quotationService } from '@/services/quotation_service'
import { toast } from 'sonner'
import type { QuotationItem } from '@/types/quotation'

interface StockConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotationId: string
  quotationCode: string
  customerName: string
  item: QuotationItem | null
  onSuccess: () => void
}

export function StockConfirmationDialog({
  open,
  onOpenChange,
  quotationId,
  quotationCode,
  customerName,
  item,
  onSuccess,
}: StockConfirmationDialogProps) {
  const [assignedArea, setAssignedArea] = useState('PCP / Laminação Industrial')
  const [expectedDate, setExpectedDate] = useState(
    item?.requested_date || new Date().toISOString().split('T')[0],
  )
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  if (!item) return null

  const handleSubmit = async () => {
    try {
      setLoading(true)
      await quotationService.requestStockConfirmation({
        quotation_id: quotationId,
        quotation_code: quotationCode,
        quotation_item_id: item.id,
        customer_name: customerName,
        material_code: item.material_code,
        material_description: item.description,
        requested_qty: item.quantity,
        unit: item.unit,
        stock_snapshot_qty: item.stock_available,
        assigned_area: assignedArea,
        expected_date: expectedDate,
        comment:
          comment ||
          `Estoque em pátio de ${item.stock_available} ${item.unit} está abaixo do limite de segurança (5t). Favor confirmar lote para ${customerName}.`,
        requested_by: 'Carlos Mendonça',
      })

      toast.success(
        `Solicitação de confirmação de estoque enviada para ${assignedArea} com sucesso!`,
      )
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(`Erro ao solicitar confirmação: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white rounded-3xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-primary">
                Solicitar Confirmação de Estoque
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Regra Especial: Estoque disponível &lt; 5 toneladas
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Banner de Aviso */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-700" /> Alerta de Disponibilidade Fabril
            </span>
            <p className="text-[11px] leading-relaxed">
              O saldo atual em pátio ({item.stock_available} {item.unit}) está abaixo do limite de 5
              toneladas. A disponibilidade deve ser confirmada formalmente pelo PCP ou Logística
              antes de assumir compromisso com o cliente.
            </p>
          </div>

          {/* Dados do Material */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-border/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-primary">{item.material_code}</span>
              <Badge className="bg-amber-100 text-amber-900 border-none font-bold text-[10px]">
                Disp: {item.stock_available} {item.unit}
              </Badge>
            </div>
            <p className="font-medium text-slate-800">{item.description}</p>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/20 text-[11px] text-muted-foreground">
              <span>
                Cliente: <strong>{customerName}</strong>
              </span>
              <span>
                Qtd Solicitada:{' '}
                <strong className="text-primary">
                  {item.quantity} {item.unit}
                </strong>
              </span>
              <span>
                Centro/Planta: <strong>{item.plant || '1000 - Contagem'}</strong>
              </span>
              <span>
                Posição SAP: <strong>{item.stock_updated_at}</strong>
              </span>
            </div>
          </div>

          {/* Destino da Confirmação (Workflow Configurável) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-primary">Destino da Solicitação</label>
            <select
              value={assignedArea}
              onChange={(e) => setAssignedArea(e.target.value)}
              className="w-full h-9 text-xs rounded-xl border border-input px-3 bg-white"
            >
              <option value="PCP / Laminação Industrial">
                PCP — Planejamento e Controle da Produção
              </option>
              <option value="Logística & Expedição Contagem">Logística & Expedição Pátio</option>
              <option value="Comercial / Gestor de Linha Inox">
                Comercial — Gestor de Linha Inox
              </option>
              <option value="Suprimentos & Usinas">Suprimentos / Compras Usinas</option>
            </select>
          </div>

          {/* Data Desejada pelo Cliente */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-primary">Data Desejada de Entrega</label>
            <Input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          {/* Observação do Vendedor */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-primary">Observação do Vendedor</label>
            <Textarea
              placeholder="Ex: Cliente com grande potencial de recorrência. Verificar previsão da OP em andamento."
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
            onClick={handleSubmit}
            disabled={loading}
            className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5 font-bold shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Enviando...' : 'Enviar Solicitação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
