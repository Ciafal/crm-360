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
import { StatusBadge } from './shared/GestaoClientesUiKit'

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
      <DialogContent className="max-w-xl bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header fixo */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#003A70]/10 text-[#003A70] rounded-xl border border-[#003A70]/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-[#003A70] tracking-tight">
                Transferência Administrativa de Carteira
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                O registro comercial ({party.friendly_code}) e todo o histórico permanecem intactos.
              </DialogDescription>
            </div>
          </div>
          <StatusBadge label={party.friendly_code} variant="default" />
        </div>

        {/* Corpo rolável */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">
              Cliente Selecionado
            </span>
            <strong className="text-slate-900 text-sm block font-semibold">
              {party.razao_social}
            </strong>
            <span className="text-slate-600 block text-xs">
              Vendedor Atual:{' '}
              <strong className="text-[#003A70]">{party.vendedor_atual_nome}</strong>
            </span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-700 font-semibold">
              Novo Vendedor Responsável
            </Label>
            <Select value={newSeller} onValueChange={setNewSeller}>
              <SelectTrigger className="h-9 bg-white border-slate-200 text-xs rounded-xl focus:ring-[#003A70]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-800 text-xs">
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

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-700 font-semibold">
              Motivo da Transferência (Trilha de Auditoria Obrigatória) *
            </Label>
            <textarea
              rows={3}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo administrativo para a auditoria..."
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#003A70]"
            />
          </div>
        </div>

        {/* Footer fixo */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs border-slate-200 bg-white text-slate-700 rounded-xl"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleTransfer}
            className="h-8 text-xs bg-[#003A70] hover:bg-[#002850] text-white font-semibold rounded-xl gap-1.5 shadow-2xs"
          >
            <CheckCircle2 className="w-4 h-4" /> Confirmar Transferência
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
