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
      <DialogContent className="max-w-lg bg-slate-950 text-slate-100 border border-slate-800 rounded-3xl p-6">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl font-bold text-white tracking-tight">
                Reativar / Abrir Novo Ciclo Comercial
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {party.friendly_code} · {party.razao_social} (Não gera novo Lead paralelo)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          <div className="space-y-1">
            <Label className="text-xs text-slate-300 font-semibold">
              Título da Nova Oportunidade *
            </Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300 font-semibold">Volume Estimado (t) *</Label>
              <Input
                type="number"
                value={toneladas}
                onChange={(e) => setToneladas(e.target.value)}
                className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300 font-semibold">Valor Estimado (R$)</Label>
              <Input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-300 font-semibold">
              Mix / Família de Produtos
            </Label>
            <Input
              value={produtoFamilia}
              onChange={(e) => setProdutoFamilia(e.target.value)}
              className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
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
            onClick={handleReactivate}
            className="h-9 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" /> Abrir Novo Ciclo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
