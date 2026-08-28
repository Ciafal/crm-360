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
import { MessageSquare, Mail, Send, Paperclip, Sparkles, CheckCircle2 } from 'lucide-react'
import { quotationService } from '@/services/quotation_service'
import { toast } from 'sonner'
import type { Quotation } from '@/types/quotation'
import { defaultAIProvider } from '@/providers/LocalAIAdapter'

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
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingIa, setGeneratingIa] = useState(false)

  React.useEffect(() => {
    if (quotation) {
      setRecipient(
        channel === 'WHATSAPP'
          ? quotation.contact_phone || '(19) 99872-4411'
          : quotation.contact_email || 'compras@cliente.com.br',
      )
      generateDefaultMessage(quotation, channel)
    }
  }, [quotation, channel])

  const generateDefaultMessage = (q: Quotation, ch: 'WHATSAPP' | 'EMAIL') => {
    if (ch === 'WHATSAPP') {
      setMessage(
        `Olá ${q.contact_name || 'Prezado(a)'}! Segue a proposta comercial ${q.code} (v${q.version}) da CIAFAL no volume total de ${q.total_tons} t (R$ ${q.total_value.toLocaleString('pt-BR')}). Condição: ${q.payment_terms}, Frete: ${q.freight_type}. Em anexo o documento PDF oficial. Ficamos à disposição!`,
      )
    } else {
      setMessage(
        `Prezado(a) ${q.contact_name || 'Cliente'},\n\nConforme nosso alinhamento técnico e comercial, segue anexa a Cotação Oficial ${q.code} da CIAFAL Ferro & Aço.\n\nResumo da Proposta:\n- Volume Total: ${q.total_tons} t\n- Valor Total: R$ ${q.total_value.toLocaleString('pt-BR')}\n- Condição de Pagamento: ${q.payment_terms}\n- Modalidade de Frete: ${q.incoterm || q.freight_type}\n- Validade da Tabela: ${q.valid_until}\n\nO documento oficial em PDF encontra-se em anexo. Permanecemos à disposição para confirmação do pedido.\n\nAtenciosamente,\n${q.seller_name || 'Carlos Mendonça'}\nCIAFAL Ferro & Aço`,
      )
    }
  }

  const handleIaSuggest = async () => {
    if (!quotation) return
    try {
      setGeneratingIa(true)
      const draft = await defaultAIProvider.generateCommercialEmailDraft({
        recipientEmail: quotation.contact_email || 'cliente@ciafal.com.br',
        recipientName: quotation.contact_name || 'Comprador',
        customerName: quotation.customer_name,
        intent: 'QUOTE_SENT',
        quoteId: quotation.code,
        quoteValue: quotation.total_value,
        sellerName: quotation.seller_name,
      })
      setMessage(draft.body)
      toast.success('Mensagem personalizada pela IA CIAFAL com base no histórico e arquétipo!')
    } finally {
      setGeneratingIa(false)
    }
  }

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
        suggested_by_ia: true,
      })

      toast.success(
        `Proposta ${quotation.code} enviada via ${channel} para ${quotation.contact_name} com sucesso! Follow-up agendado para 48h.`,
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
      <DialogContent className="max-w-md bg-white rounded-2xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
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
                <DialogTitle className="text-base font-bold text-slate-900">
                  Enviar Cotação ao Cliente
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {quotation.code} (v{quotation.version}) — {quotation.customer_name}
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="xs"
              onClick={handleIaSuggest}
              disabled={generatingIa}
              className="text-xs text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              IA Sugerir
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {/* Seletor de Canal */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setChannel('WHATSAPP')}
              className={`flex-1 p-2 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                channel === 'WHATSAPP'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs ring-1 ring-emerald-500'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp
            </button>

            <button
              type="button"
              onClick={() => setChannel('EMAIL')}
              className={`flex-1 p-2 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                channel === 'EMAIL'
                  ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs ring-1 ring-blue-500'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Mail className="w-4 h-4 text-blue-600" /> E-mail Corporativo
            </button>
          </div>

          {/* Destinatário */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">
              {channel === 'WHATSAPP' ? 'Número WhatsApp' : 'E-mail do Destinatário'}
            </label>
            <Input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="h-9 text-xs rounded-lg font-mono"
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Mensagem</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-xs rounded-lg min-h-[110px]"
            />
          </div>

          {/* Anexo PDF Oficial */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-blue-700" />
              <div>
                <span className="font-bold text-slate-800 block text-xs">
                  Proposta_CIAFAL_{quotation.code}_v{quotation.version}.pdf
                </span>
                <span className="text-[10px] text-slate-500">
                  {quotation.total_tons} t • R$ {quotation.total_value.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] font-bold">
              PDF Anexado
            </Badge>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs rounded-lg"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={loading}
            className={`h-9 text-xs text-white rounded-lg gap-1.5 font-bold shadow-xs ${
              channel === 'WHATSAPP'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Disparando...' : 'Enviar Proposta com Evidência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
