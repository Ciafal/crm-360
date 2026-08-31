// src/components/satisfacao/PesquisaEntregaModal.tsx
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Star, Send, Truck, MessageSquare, Mail, CheckCircle2 } from 'lucide-react'
import { OtifDeliveryRecord } from '@/types/otif'
import { toast } from 'sonner'

interface PesquisaEntregaModalProps {
  open: boolean
  onClose: () => void
  delivery: OtifDeliveryRecord | null
  onSaveAvaliacao?: (
    deliveryId: string,
    estrelas: number,
    comentario: string,
    canal: 'WhatsApp' | 'E-mail' | 'Portal',
  ) => void
}

export function PesquisaEntregaModal({
  open,
  onClose,
  delivery,
  onSaveAvaliacao,
}: PesquisaEntregaModalProps) {
  const [rating, setRating] = useState<number>(5)
  const [comentario, setComentario] = useState('')
  const [canal, setCanal] = useState<'WhatsApp' | 'E-mail' | 'Portal'>('WhatsApp')

  if (!delivery) return null

  const handleDispararPesquisa = () => {
    if (onSaveAvaliacao) {
      onSaveAvaliacao(delivery.id, rating, comentario, canal)
    }
    toast.success(`Pesquisa pós-entrega disparada via ${canal} para ${delivery.clienteNome}!`, {
      description: `Pedido ${delivery.pedidoNumero} · NF ${delivery.nfNumero} · Motorista: ${delivery.motorista || 'CIAFAL'}`,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-white rounded-3xl p-6 border border-slate-200 shadow-xl">
        <DialogHeader className="space-y-1 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-[#003A70] border border-sky-200">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold font-serif text-[#003A70]">
                Pesquisa Pós-Entrega Automática
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Disparo pós-conclusão de entrega via TMS Fred (WhatsApp / E-mail).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          {/* Dados da Entrega */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Cliente:</span>
              <strong className="text-slate-800">{delivery.clienteNome}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pedido / NF:</span>
              <span className="font-mono text-slate-700">
                {delivery.pedidoNumero} · {delivery.nfNumero}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transportadora / Motorista:</span>
              <span className="text-slate-700">
                {delivery.transportadora} ({delivery.motorista || 'Frota'})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Data de Entrega:</span>
              <span className="font-semibold text-slate-800">{delivery.dataEntregue}</span>
            </div>
          </div>

          {/* Avaliação por Estrelas (1 a 5) */}
          <div className="space-y-2 text-center py-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Avaliação Geral da Entrega (1 a 5 Estrelas)
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {rating === 5 && '⭐ 5/5 — Entrega Perfeita'}
              {rating === 4 && '⭐ 4/5 — Muito Boa'}
              {rating === 3 && '⭐ 3/5 — Regular (com ressalvas)'}
              {rating === 2 && '⭐ 2/5 — Ruim (atraso ou avaria)'}
              {rating === 1 && '⭐ 1/5 — Crítica (insatisfação severa)'}
            </span>
          </div>

          {/* Comentário Opcional */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">
              O que poderíamos melhorar? (Opcional)
            </label>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Ex: Pontualidade do motorista, amarração da carga, horário de descarga..."
              rows={3}
              className="text-xs rounded-xl border-slate-200"
            />
          </div>

          {/* Seleção do Canal de Disparo */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 block">Canal de Disparo</label>
            <div className="grid grid-cols-3 gap-2">
              {(['WhatsApp', 'E-mail', 'Portal'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCanal(c)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                    canal === c
                      ? 'bg-[#003A70] text-white border-[#003A70]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {c === 'WhatsApp' && <MessageSquare className="w-3.5 h-3.5" />}
                  {c === 'E-mail' && <Mail className="w-3.5 h-3.5" />}
                  {c === 'Portal' && <Truck className="w-3.5 h-3.5" />}
                  <span>{c}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleDispararPesquisa}
              className="bg-[#003A70] hover:bg-[#002850] text-white rounded-xl text-xs font-semibold gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Enviar Pesquisa Pós-Entrega
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
