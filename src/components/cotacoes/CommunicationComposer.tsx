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
import { MessageSquare, Mail, Send, Paperclip, CheckCircle2 } from 'lucide-react'
import { quotationService } from '@/services/quotation_service'
import { toast } from 'sonner'
import type { Quotation } from '@/types/quotation'

interface CommunicationComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation | null
  defaultChannel?: 'WHATSAPP' | 'EMAIL'
  onSuccess: () => void
}

export function CommunicationComposer({
  open,
  onOpenChange,
  quotation,
  defaultChannel = 'WHATSAPP',
  onSuccess,
}: CommunicationComposerProps) {
  const [channel, setChannel] = useState<'WHATSAPP' | 'EMAIL'>(defaultChannel)
  const [recipient, setRecipient] = useState(
    channel === 'WHATSAPP'
      ? quotation?.contact_phone || '(19) 99872-4411'
      : quotation?.contact_email || 'compras@cliente.com.br',
  )
  const [message, setMessage] = useState(
    `Olá ${quotation?.contact_name || 'Prezado(a)'}! Segue a proposta comercial ${quotation?.code || 'COT'} da CIAFAL Ferro & Aço no valor total de R$ ${quotation?.total_value.toLocaleString('pt-BR')}. Ficamos à disposição para fechamento!`,
  )
  const [loading, setLoading] = useState(false)

  if (!quotation) return null

  const handleSend = async () => {
    try {
      setLoading(true)
      await quotationService.sendQuotationCommunication({
        quotation_id: quotation.id,
        channel,
        recipient,
        recipient_name: quotation.contact_name,
        message,
        attached_pdf_name: `Proposta_CIAFAL_${quotation.code}_v${quotation.version}.pdf`,
        sent_by: quotation.seller_name || 'Carlos Mendonça',
      })

      toast.success(
        `Proposta ${quotation.code} enviada via ${channel} para ${quotation.contact_name} com sucesso!`,
      )
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(`Erro ao enviar: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white rounded-3xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl ${
                channel === 'WHATSAPP'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {channel === 'WHATSAPP' ? (
                <MessageSquare className="w-5 h-5 text-emerald-600" />
              ) : (
                <Mail className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-primary">
                Enviar Cotação ao Cliente
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Disparo oficial com anexo do PDF gerado
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Seletor de Canal */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setChannel('WHATSAPP')
                setRecipient(quotation.contact_phone || '(19) 99872-4411')
              }}
              className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                channel === 'WHATSAPP'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                  : 'border-border/60 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp
            </button>

            <button
              type="button"
              onClick={() => {
                setChannel('EMAIL')
                setRecipient(quotation.contact_email || 'compras@cliente.com.br')
              }}
              className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                channel === 'EMAIL'
                  ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                  : 'border-border/60 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Mail className="w-4 h-4 text-blue-600" /> E-mail Corporativo
            </button>
          </div>

          {/* Destinatário */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-primary">
              {channel === 'WHATSAPP' ? 'Número WhatsApp' : 'E-mail do Destinatário'}
            </label>
            <Input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="h-9 text-xs rounded-xl font-mono"
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-primary">Mensagem</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-xs rounded-xl min-h-[90px]"
            />
          </div>

          {/* Anexo PDF Oficial */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-primary" />
              <div>
                <span className="font-bold text-slate-800 block text-xs">
                  Proposta_CIAFAL_{quotation.code}_v{quotation.version}.pdf
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Anexo oficial com tabela de itens e totais
                </span>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] font-bold">
              PDF Pronto
            </Badge>
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
            onClick={handleSend}
            disabled={loading}
            className={`h-9 text-xs text-white rounded-xl gap-1.5 font-bold shadow-xs ${
              channel === 'WHATSAPP'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-[#003A70] hover:bg-[#002850]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Disparando...' : 'Enviar Proposta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
