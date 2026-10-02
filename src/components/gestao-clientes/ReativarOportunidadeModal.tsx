// src/components/gestao-clientes/ReativarOportunidadeModal.tsx
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
import { Label } from '@/components/ui/label'
import { RotateCcw, CheckCircle2, Sparkles } from 'lucide-react'
import { crmPartyService } from '@/services/crm_party_service'
import type { CrmPartyMaster } from '@/types/crm_party'
import { toast } from 'sonner'
import { StatusBadge } from './shared/GestaoClientesUiKit'

interface ReativarOportunidadeModalProps {
  party: CrmPartyMaster | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onReactivated: (party: CrmPartyMaster) => void
}

export function ReativarOportunidadeModal({
  party,
  open,
  onOpenChange,
  onReactivated,
}: ReativarOportunidadeModalProps) {
  const [titulo, setTitulo] = useState('Novo Projeto de Fornecimento Siderúrgico')
  const [valor, setValor] = useState('180000')
  const [toneladas, setToneladas] = useState('25')
  const [produtoFamilia, setProdutoFamilia] = useState('Perfis Estruturais e Chapas')

  if (!party) return null

  const handleReactivate = () => {
    try {
      const valNum = parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 100000
      const tonNum = parseFloat(toneladas.replace(',', '.')) || 15

      const updated = crmPartyService.reactivateOpportunity(party.crm_party_id, {
        titulo,
        valor: valNum,
        toneladas: tonNum,
        produtoFamilia,
        userName: 'Carlos Mendonça',
      })

      toast.success('Novo ciclo comercial aberto no mesmo cliente!', {
        description: `Oportunidade registrada no registro ${party.friendly_code} sem duplicar Lead.`,
      })

      onReactivated(updated)
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e.message || 'Erro ao reativar oportunidade')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header fixo */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-[#003A70] tracking-tight">
                Reativar / Abrir Novo Ciclo Comercial
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                {party.friendly_code} · {party.razao_social} (sem duplicar Lead)
              </DialogDescription>
            </div>
          </div>
          <StatusBadge label="Novo Ciclo" variant="positive" />
        </div>

        {/* Corpo rolável */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          <div className="space-y-1">
            <Label className="text-xs text-slate-700 font-semibold">
              Título da Nova Oportunidade *
            </Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="h-9 bg-white border-slate-200 text-xs rounded-xl focus:ring-[#003A70]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-700 font-semibold">Volume Estimado (t) *</Label>
              <Input
                type="number"
                value={toneladas}
                onChange={(e) => setToneladas(e.target.value)}
                className="h-9 bg-white border-slate-200 text-xs rounded-xl font-mono focus:ring-[#003A70]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-700 font-semibold">Valor Estimado (R$)</Label>
              <Input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="h-9 bg-white border-slate-200 text-xs rounded-xl font-mono focus:ring-[#003A70]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-700 font-semibold">
              Mix / Família de Produtos
            </Label>
            <Input
              value={produtoFamilia}
              onChange={(e) => setProdutoFamilia(e.target.value)}
              className="h-9 bg-white border-slate-200 text-xs rounded-xl focus:ring-[#003A70]"
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
            onClick={handleReactivate}
            className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl gap-1.5 shadow-2xs"
          >
            <CheckCircle2 className="w-4 h-4" /> Abrir Novo Ciclo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
