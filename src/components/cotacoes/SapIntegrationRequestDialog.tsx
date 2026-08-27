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
import { Badge } from '@/components/ui/badge'
import {
  Server,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Layers,
} from 'lucide-react'
import { quotationService } from '@/services/quotation_service'
import { toast } from 'sonner'
import type { Quotation } from '@/types/quotation'

interface SapIntegrationRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation | null
  onSuccess: () => void
}

export function SapIntegrationRequestDialog({
  open,
  onOpenChange,
  quotation,
  onSuccess,
}: SapIntegrationRequestDialogProps) {
  const [loading, setLoading] = useState(false)

  if (!quotation) return null

  const handleSendToQueue = async () => {
    try {
      setLoading(true)
      const queueItem = await quotationService.requestSapOrderQueue(
        quotation.id,
        quotation.seller_name || 'Carlos Mendonça',
      )

      toast.success(
        `Solicitação de implantação gerada com sucesso na Fila SAP! (ID: ${queueItem.integration_id})`,
      )
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(`Falha na validação de envio: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Checklist de Pré-Validação
  const checks = [
    {
      label: 'Código do Cliente SAP válido',
      valid: !!quotation.customer_sap_code,
      detail: quotation.customer_sap_code,
    },
    {
      label: 'Recebedor de Mercadoria (Ship-to) vinculado',
      valid: !!quotation.ship_to_code,
      detail: quotation.ship_to_code,
    },
    {
      label: 'Materiais e Quantidades preenchidos',
      valid: quotation.items.length > 0,
      detail: `${quotation.items.length} itens (${quotation.total_tons}t)`,
    },
    {
      label: 'Aprovação Comercial Interna concluída',
      valid:
        quotation.approval_status !== 'AGUARDANDO_APROVACAO' &&
        quotation.approval_status !== 'REJEITADA',
      detail: quotation.approval_status,
    },
    {
      label: 'Estoque Confirmado quando necessário (<5t)',
      valid: !quotation.items.some((it) => it.stock_confirmation_required && !it.stock_confirmed),
      detail: quotation.stock_status,
    },
    {
      label: 'Aceite do Cliente Registrado',
      valid: quotation.client_status === 'ACEITA',
      detail: quotation.client_acceptance_notes || 'Aceite formal pendente',
    },
    {
      label: 'Condições Comerciais (Pagamento & Incoterm)',
      valid: !!quotation.payment_terms && !!quotation.incoterm,
      detail: `${quotation.payment_terms} · ${quotation.incoterm}`,
    },
  ]

  const allValid = checks.every((c) => c.valid)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white rounded-3xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-900 rounded-xl">
              <Server className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-primary">
                Solicitar Implantação no SAP ECC
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Arquitetura de Integração Assíncrona via Fila Corporativa
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Banner Arquitetura Segura */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-border/40 text-slate-700 space-y-1">
            <span className="font-bold flex items-center gap-1 text-primary text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Fluxo Seguro de Implantação
            </span>
            <p className="text-[11px] leading-relaxed">
              O CRM gera um registro imutável na tabela de fila (<code>crm_sap_order_queue</code>).
              Um JOB agendado no SAP lê, valida os limites e grava a Ordem de Venda oficial.
            </p>
          </div>

          {/* Checklist de Pré-Validação */}
          <div className="space-y-2">
            <span className="font-serif font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Checklist de Pré-Validação Comercial
            </span>

            <div className="divide-y divide-border/20 border border-border/40 rounded-2xl overflow-hidden bg-white">
              {checks.map((chk, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {chk.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span className={chk.valid ? 'text-slate-800' : 'text-amber-900 font-semibold'}>
                      {chk.label}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      chk.valid
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                    }`}
                  >
                    {chk.detail}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs rounded-xl"
          >
            Voltar
          </Button>
          <Button
            type="button"
            onClick={handleSendToQueue}
            disabled={!allValid || loading}
            className="h-9 text-xs bg-primary hover:bg-primary/90 text-white rounded-xl gap-1.5 font-bold shadow-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            {loading ? 'Gravando na Fila...' : 'Gravar na Fila SAP ECC'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
