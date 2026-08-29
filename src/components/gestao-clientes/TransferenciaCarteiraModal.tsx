// src/components/gestao-clientes/TransferenciaCarteiraModal.tsx
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { UserCheck, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react'
import { crmPartyService } from '@/services/crm_party_service'
import type { CrmPartyMaster } from '@/types/crm_party'
import { toast } from 'sonner'

interface TransferenciaCarteiraModalProps {
  party: CrmPartyMaster | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransferred: (party: CrmPartyMaster) => void
}

export function TransferenciaCarteiraModal({
  party,
  open,
  onOpenChange,
  onTransferred,
}: TransferenciaCarteiraModalProps) {
  const [newSeller, setNewSeller] = useState('Juliana Paes (Regional BH Leste)')
  const [motivo, setMotivo] = useState('Redistribuição geográfica de carteira por regionalização')

  if (!party) return null

  const handleTransfer = () => {
    try {
      const updated = crmPartyService.transferSeller(party.crm_party_id, {
        sellerId: 'vendedor-dest-' + Date.now(),
        sellerName: newSeller,
        reason: motivo,
        transferredBy: 'Marcos Vinícius (Gerente Comercial)',
      })

      toast.success('Transferência de carteira concluída!', {
        description: `Cliente transferido para ${newSeller}. Histórico e CRM ID ${party.friendly_code} preservados.`,
      })

      onTransferred(updated)
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e.message || 'Erro na transferência')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-slate-950 text-slate-100 border border-slate-800 rounded-3xl p-6">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl font-bold text-white tracking-tight">
                Transferência Administrativa de Carteira
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                O registro comercial ({party.friendly_code}) e todo o histórico permanecem intactos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-1 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Cliente Selecionado
            </span>
            <strong className="text-white text-sm block">{party.razao_social}</strong>
            <span className="text-slate-400 block">
              Vendedor Atual:{' '}
              <strong className="text-amber-400">{party.vendedor_atual_nome}</strong>
            </span>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-300 font-semibold">
              Novo Vendedor Responsável
            </Label>
            <Select value={newSeller} onValueChange={setNewSeller}>
              <SelectTrigger className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                <SelectItem value="Carlos Mendonça (Minas Centro)">
                  Carlos Mendonça (Minas Centro)
                </SelectItem>
                <SelectItem value="Juliana Paes (Regional BH Leste)">
                  Juliana Paes (Regional BH Leste)
                </SelectItem>
                <SelectItem value="Roberto Guimarães (Sul de Minas)">
                  Roberto Guimarães (Sul de Minas)
                </SelectItem>
                <SelectItem value="Fernanda Souza (Triângulo & Alto Paranaíba)">
                  Fernanda Souza (Triângulo & Alto Paranaíba)
                </SelectItem>
                <SelectItem value="Lucas Prado (São Paulo Interior)">
                  Lucas Prado (São Paulo Interior)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-300 font-semibold">
              Motivo da Transferência (Trilha de Auditoria Obrigatória) *
            </Label>
            <textarea
              rows={3}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo administrativo para a auditoria..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-sky-500"
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs border-slate-800 bg-slate-900 text-slate-300 rounded-xl"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleTransfer}
            className="h-9 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" /> Confirmar Transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
