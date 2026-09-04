import React, { useState } from 'react'
import { crmStorage } from '@/lib/crm-storage'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PackageCheck, AlertTriangle, Truck, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { formatWeight } from '@/lib/utils'

// ==========================================
// 1. MODAL DE SOLICITAÇÃO DE ESTOQUE (WMS)
// ==========================================
export interface WmsStockCheckModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemCode?: string
  itemDescription?: string
  currentStockTons?: number
  customerName?: string
  onSuccess?: (data: any) => void
}

export function WmsStockCheckModal({
  open,
  onOpenChange,
  itemCode = 'TB-304-SCH10',
  itemDescription = 'Tubo Inox AISI 304 Redondo SCH 10 2"',
  currentStockTons = 3.4,
  customerName = 'Metalúrgica Santa Rita Ltda',
  onSuccess,
}: WmsStockCheckModalProps) {
  const [requestedTons, setRequestedTons] = useState(String(currentStockTons || 5))
  const [justification, setJustification] = useState('')
  const [urgency, setUrgency] = useState<'NORMAL' | 'URGENTE'>('URGENTE')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLowStock = (currentStockTons || 0) < 5.0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    setTimeout(() => {
      setIsSubmitting(false)
      const payload = {
        itemCode,
        itemDescription,
        currentStockTons,
        requestedTons: Number(requestedTons),
        justification,
        urgency,
        customerName,
        solicitadoEm: new Date().toISOString(),
        solicitadoPor: 'Carlos Mendonça',
      }

      // Salvar na fila de solicitações WMS (LocalStorage / Evento)
      try {
        const stored = crmStorage.getJSON<any[]>('ciafal_wms_stock_requests', [])
        stored.unshift(payload)
        crmStorage.setJSON('ciafal_wms_stock_requests', stored)
      } catch {
        /* intentionally ignored */
      }

      toast.success(
        `Solicitação de verificação física WMS registrada para ${itemCode}! SLA de conferência: 4h.`,
      )
      onSuccess?.(payload)
      onOpenChange(false)
    }, 400)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-primary flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-primary" /> Solicitar Verificação de Estoque (WMS)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Dispare um evento para a equipe do pátio / WMS Contagem conferir lotes físicos e saldo
            liberado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2 text-xs">
          {/* Card de Alerta se < 5t */}
          {isLowStock && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-amber-800">
                  Estoque Crítico (&lt; 5 t): {formatWeight(currentStockTons, 1)}
                </strong>
                <span className="text-[11px] text-amber-700 block">
                  O saldo atual no sistema está abaixo da margem de segurança. A conferência física
                  no pátio é altamente recomendada.
                </span>
              </div>
            </div>
          )}

          <div className="p-2.5 bg-slate-50 border rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Item Selecionado:
            </span>
            <strong className="text-slate-900 text-xs block">
              {itemCode} — {itemDescription}
            </strong>
            <span className="text-[11px] text-muted-foreground block">
              Cliente Vinculado: {customerName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Volume Necessário (t):</Label>
              <Input
                type="number"
                step="0.1"
                value={requestedTons}
                onChange={(e) => setRequestedTons(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Urgência no WMS:</Label>
              <Select value={urgency} onValueChange={(v: any) => setUrgency(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal (Até 24h)</SelectItem>
                  <SelectItem value="URGENTE">Urgente (SLA 4h)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              Justificativa / Observações para o Pátio:
            </Label>
            <Textarea
              placeholder="Ex: Cotação de grande porte em fechamento, verificar se há lote reservado ou corte pendente..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="text-xs min-h-[70px]"
            />
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-8 text-xs bg-primary text-white"
            >
              {isSubmitting ? 'Enviando ao WMS...' : 'Enviar Solicitação WMS'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==========================================
// 2. MODAL DE ALERTA DE PRIORIDADE NO TMS
// ==========================================
export interface TmsPriorityAlertModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerName?: string
  referenceDoc?: string
  itemDescription?: string
  defaultTons?: number
  onSuccess?: (data: any) => void
}

export function TmsPriorityAlertModal({
  open,
  onOpenChange,
  customerName = 'Indústria Mecânica Alvorada S/A',
  referenceDoc = 'COT-98106 / Pedido SAP 10049281',
  itemDescription = 'Viga Estrutural Gerdau W 200 x 26.6 kg/m',
  defaultTons = 12.0,
  onSuccess,
}: TmsPriorityAlertModalProps) {
  const [tons, setTons] = useState(String(defaultTons || 10))
  const [desiredDate, setDesiredDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  )
  const [priorityLevel, setPriorityLevel] = useState<
    'ALTA' | 'CRITICA_OBRA' | 'EXPEDICAO_IMEDIATA'
  >('ALTA')
  const [justification, setJustification] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    setTimeout(() => {
      setIsSubmitting(false)
      const payload = {
        customerName,
        referenceDoc,
        itemDescription,
        tons: Number(tons),
        desiredDate,
        priorityLevel,
        justification,
        geradoEm: new Date().toISOString(),
        geradoPor: 'Carlos Mendonça',
        status: 'ALERTA_ATIVO_NO_TMS',
      }

      // Salvar nos alertas TMS rastreáveis
      try {
        const stored = crmStorage.getJSON<any[]>('ciafal_tms_priority_alerts', [])
        stored.unshift(payload)
        crmStorage.setJSON('ciafal_tms_priority_alerts', stored)
      } catch {
        /* intentionally ignored */
      }

      toast.success(
        `Alerta de prioridade de carga gerado no TMS para ${customerName}! Nível: ${priorityLevel}`,
      )
      onSuccess?.(payload)
      onOpenChange(false)
    }, 400)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-primary flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> Gerar Alerta de Prioridade no TMS
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Sinalize prioridade de carregamento e roteirização urgente na torre de controle do TMS
            CIAFAL.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2 text-xs">
          <div className="p-2.5 bg-slate-50 border rounded-xl space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Cliente:
              </span>
              <span className="text-[10px] font-mono text-primary font-bold">{referenceDoc}</span>
            </div>
            <strong className="text-slate-900 text-xs block">{customerName}</strong>
            <span className="text-[11px] text-muted-foreground block">{itemDescription}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Volume da Carga (t):</Label>
              <Input
                type="number"
                step="0.1"
                value={tons}
                onChange={(e) => setTons(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Data Desejada:</Label>
              <Input
                type="date"
                value={desiredDate}
                onChange={(e) => setDesiredDate(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Nível de Prioridade no TMS:</Label>
            <Select value={priorityLevel} onValueChange={(v: any) => setPriorityLevel(v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALTA">Alta Prioridade (Janela 24h-48h)</SelectItem>
                <SelectItem value="CRITICA_OBRA">Crítica — Obra em Andamento / Parada</SelectItem>
                <SelectItem value="EXPEDICAO_IMEDIATA">
                  Expedição Imediata (Doca Dedicada)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Justificativa Operacional / Restrições:</Label>
            <Textarea
              placeholder="Ex: Canteiro com horário restrito de descarga (até 16h); cliente necessita confirmação de placa hoje..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              required
              className="text-xs min-h-[70px]"
            />
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-8 text-xs bg-primary text-white"
            >
              {isSubmitting ? 'Gerando Alerta...' : 'Publicar Alerta no TMS'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
