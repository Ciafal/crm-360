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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Factory, Warehouse, ShieldAlert, Send } from 'lucide-react'
import { stockService } from '@/services/stock_service'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type { StockItem, CheckPriority } from '@/types/stock'
import { formatWeight, formatNumberBR } from '@/lib/utils'

interface RequestStockCheckModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stockItem: StockItem | null
  initialRequestedTons?: number
  initialQuotationCode?: string
  initialCustomerName?: string
  onSuccess?: () => void
}

export function RequestStockCheckModal({
  open,
  onOpenChange,
  stockItem,
  initialRequestedTons = 5.0,
  initialQuotationCode = '',
  initialCustomerName = '',
  onSuccess,
}: RequestStockCheckModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [requestedTons, setRequestedTons] = useState<number>(initialRequestedTons)
  const [priority, setPriority] = useState<CheckPriority>('NORMAL')
  const [quotationCode, setQuotationCode] = useState(initialQuotationCode)
  const [customerName, setCustomerName] = useState(initialCustomerName)
  const [requesterNotes, setRequesterNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Atualiza valores ao abrir
  React.useEffect(() => {
    if (open && stockItem) {
      setRequestedTons(initialRequestedTons || 5.0)
      setQuotationCode(initialQuotationCode || '')
      setCustomerName(initialCustomerName || stockItem.lastCustomerName || '')
      setRequesterNotes('')
      // Se saldo disponível for inferior a 5 t ou produto for crítico, sugere prioridade Alta/Urgente
      if (stockItem.availableTons < 5.0 || stockItem.classification === 'CRITICO') {
        setPriority('URGENTE')
      } else {
        setPriority('NORMAL')
      }
    }
  }, [open, stockItem, initialRequestedTons, initialQuotationCode, initialCustomerName])

  if (!stockItem) return null

  const isLowStock = stockItem.availableTons < 5.0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestedTons || requestedTons <= 0) {
      toast({
        title: 'Quantidade inválida',
        description: 'Informe a quantidade em toneladas (t) que deseja checar.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await stockService.requestStockCheck({
        materialCode: stockItem.materialCode,
        materialDescription: stockItem.description,
        plantCode: stockItem.plantCode,
        plantName: stockItem.plantName,
        storageLocation: stockItem.storageLocation,
        batchNumber: stockItem.batchNumber,
        systemicBalanceTons: stockItem.availableTons,
        requestedTons: Number(requestedTons),
        priority,
        quotationCode: quotationCode || undefined,
        customerName: customerName || undefined,
        requesterId: user?.id || 'qas-vendedor_teste',
        requesterName: user?.name || 'Carlos Mendonça',
        requesterRole: user?.role || 'vendedor',
        requesterNotes: requesterNotes || undefined,
      })

      toast({
        title: 'Solicitação de Checagem Enviada!',
        description: `Protocolo ${result.protocol} despachado para conferência no WMS / Pátio (${priority}). SLA de atendimento em andamento.`,
      })

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast({
        title: 'Erro ao solicitar checagem',
        description: err.message || 'Ocorreu um erro ao registrar a solicitação no WMS.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white rounded-3xl p-6 border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl font-bold text-primary">
                Solicitar Checagem Física de Estoque
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Protocolo integrado ao WMS/Pátio para validação física presencial sem alterar saldo
                mestre SAP.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ALERTA SE ESTOQUE FOR CRÍTICO OU < 5t */}
        {isLowStock && (
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong>Estoque Reduzido (&lt; 5 t):</strong> Saldo disponível é de apenas{' '}
              <span className="font-bold underline">{formatWeight(stockItem.availableTons)}</span>.
              A conferência física no pátio é altamente recomendada antes de fechar o pedido no SAP.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* DADOS JÁ CONHECIDOS DO CRM / SAP (Sem redigitação) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border">
                {stockItem.materialCode}
              </span>
              <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                {stockItem.plantName}
              </Badge>
            </div>

            <p className="text-xs font-semibold text-slate-900">{stockItem.description}</p>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/70 text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Depósito SAP
                </span>
                <strong className="text-slate-800">{stockItem.storageLocation}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Lote Rastreado
                </span>
                <strong className="text-slate-800 font-mono text-[10px]">
                  {stockItem.batchNumber || 'Sem lote'}
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Saldo Sistêmico
                </span>
                <strong className="text-emerald-700 font-bold">
                  {formatWeight(stockItem.availableTons)}
                </strong>
              </div>
            </div>
          </div>

          {/* CAMPOS OPERACIONAIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                Qtd a Conferir (t) <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={requestedTons}
                onChange={(e) => setRequestedTons(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 5.0"
                className="h-9 text-xs rounded-xl bg-white"
              />
              <span className="text-[10px] text-muted-foreground">
                Volume em toneladas pretendido para a venda.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">Prioridade da Checagem</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as CheckPriority)}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-white">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal (SLA 24h)</SelectItem>
                  <SelectItem value="ALTA">Alta (SLA 12h)</SelectItem>
                  <SelectItem value="URGENTE">Urgente (SLA 4h - Caminhão no Pátio)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">
                Cotação Relacionada (Opcional)
              </Label>
              <Input
                value={quotationCode}
                onChange={(e) => setQuotationCode(e.target.value)}
                placeholder="Ex: COT-SAP-98104"
                className="h-9 text-xs rounded-xl bg-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">
                Cliente Relacionado (Opcional)
              </Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Metalúrgica Santa Rita"
                className="h-9 text-xs rounded-xl bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">
              Observação para a Equipe de Pátio / WMS
            </Label>
            <Textarea
              value={requesterNotes}
              onChange={(e) => setRequesterNotes(e.target.value)}
              placeholder="Ex: Verificar se há oxidação superficial, se os feixes estão com fita de arqueação íntegra e prontos para carregamento imediato."
              rows={3}
              className="text-xs rounded-xl bg-white resize-none"
            />
          </div>

          {/* PCP ROBOTIZADO INFO SE SALDO BAIXO */}
          {stockItem.projectedPcpTons > 0 && (
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Factory className="w-4 h-4 text-primary" />
                <div>
                  <span className="font-bold text-primary block">PCP Robotizado Vinculado</span>
                  <span className="text-[10px] text-muted-foreground">
                    Próxima produção programada de +{formatWeight(stockItem.projectedPcpTons)} para{' '}
                    {stockItem.pcpNextProductionDate || 'breve'}.
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] bg-white text-primary border-primary/30"
              >
                {stockItem.pcpConfidenceLevel || 'ALTO'}
              </Badge>
            </div>
          )}

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
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Transmitindo ao WMS...' : 'Enviar Solicitação de Checagem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
