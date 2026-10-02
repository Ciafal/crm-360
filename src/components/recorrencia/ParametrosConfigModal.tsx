// src/components/recorrencia/ParametrosConfigModal.tsx
import React, { useState } from 'react'
import {
  Settings,
  ShieldCheck,
  History,
  AlertTriangle,
  Save,
  CheckCircle2,
  Trash2,
  Plus,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { recorrenciaService } from '@/services/recorrencia_service'
import type { ParametrosRecorrenciaConfig } from '@/types/recorrencia'

interface ParametrosConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  userName?: string
}

export function ParametrosConfigModal({
  open,
  onOpenChange,
  onSaved,
  userName = 'Carlos Alberto (Diretoria & Adm)',
}: ParametrosConfigModalProps) {
  const currentConfig = recorrenciaService.getConfig()

  const [mensal, setMensal] = useState<number>(currentConfig.thresholds.mensal)
  const [bimestral, setBimestral] = useState<number>(currentConfig.thresholds.bimestral)
  const [trimestral, setTrimestral] = useState<number>(currentConfig.thresholds.trimestral)
  const [grupos, setGrupos] = useState<string[]>(currentConfig.gruposExcluidos)
  const [novoGrupo, setNovoGrupo] = useState('')
  const [operacoes, setOperacoes] = useState<string[]>(currentConfig.tiposOperacaoExcluidos)
  const [novaOperacao, setNovaOperacao] = useState('')

  const handleAddGrupo = () => {
    if (!novoGrupo.trim()) return
    if (!grupos.includes(novoGrupo.trim())) {
      setGrupos([...grupos, novoGrupo.trim()])
    }
    setNovoGrupo('')
  }

  const handleRemoveGrupo = (item: string) => {
    setGrupos(grupos.filter((g) => g !== item))
  }

  const handleAddOperacao = () => {
    if (!novaOperacao.trim()) return
    if (!operacoes.includes(novaOperacao.trim())) {
      setOperacoes([...operacoes, novaOperacao.trim()])
    }
    setNovaOperacao('')
  }

  const handleRemoveOperacao = (item: string) => {
    setOperacoes(operacoes.filter((o) => o !== item))
  }

  const handleSave = () => {
    try {
      recorrenciaService.updateConfig(
        {
          thresholds: {
            mensal,
            bimestral,
            trimestral,
          },
          gruposExcluidos: grupos,
          tiposOperacaoExcluidos: operacoes,
        },
        userName,
      )
      toast.success('Parâmetros e thresholds atualizados com sucesso!', {
        description: 'Alterações registradas na auditoria e aplicadas aos cálculos.',
      })
      onSaved?.()
      onOpenChange(false)
    } catch (err: any) {
      toast.error('Erro ao salvar parâmetros: ' + err.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#003A70] flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-[#003A70]">
                Parâmetros & Thresholds de Recorrência
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Configurações administrativas persistidas com histórico e auditoria.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-3 text-xs">
          {/* Seção 1: Thresholds de Classes de Recorrência */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Thresholds de Classes (% de Meses com Compra)
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Mensal (≥ %)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={mensal}
                  onChange={(e) => setMensal(parseInt(e.target.value) || 0)}
                  className="h-8 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Bimestral (≥ %)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={bimestral}
                  onChange={(e) => setBimestral(parseInt(e.target.value) || 0)}
                  className="h-8 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Trimestral (≥ %)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={trimestral}
                  onChange={(e) => setTrimestral(parseInt(e.target.value) || 0)}
                  className="h-8 text-xs rounded-xl font-mono"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Abaixo de {trimestral}% a classe atribuída automaticamente é{' '}
              <strong>Esporádico</strong>.
            </p>
          </div>

          {/* Seção 2: Grupos de Mercadoria Excluídos */}
          <div className="space-y-2">
            <Label className="font-bold text-slate-800">
              Grupos Excluídos do Faturamento de Recorrência
            </Label>
            <div className="flex gap-2">
              <Input
                value={novoGrupo}
                onChange={(e) => setNovoGrupo(e.target.value)}
                placeholder="Ex: SUB-PRO, Sucata, Carepa..."
                className="h-8 text-xs rounded-xl"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddGrupo}
                className="h-8 text-xs rounded-xl gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {grupos.map((g) => (
                <Badge
                  key={g}
                  variant="outline"
                  className="bg-white border-slate-300 text-slate-800 gap-1 text-[11px] py-0.5 pl-2 pr-1"
                >
                  <span>{g}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveGrupo(g)}
                    className="hover:text-rose-600 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Seção 3: Tipos de Operação Excluídos */}
          <div className="space-y-2">
            <Label className="font-bold text-slate-800">
              Tipos de Operação Excluídos (Ex.: Industrialização)
            </Label>
            <div className="flex gap-2">
              <Input
                value={novaOperacao}
                onChange={(e) => setNovaOperacao(e.target.value)}
                placeholder="Ex: Industrialização..."
                className="h-8 text-xs rounded-xl"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddOperacao}
                className="h-8 text-xs rounded-xl gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {operacoes.map((op) => (
                <Badge
                  key={op}
                  variant="outline"
                  className="bg-white border-slate-300 text-slate-800 gap-1 text-[11px] py-0.5 pl-2 pr-1"
                >
                  <span>{op}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOperacao(op)}
                    className="hover:text-rose-600 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Histórico de Auditoria */}
          {currentConfig.historicoAlteracoes && currentConfig.historicoAlteracoes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Histórico de Auditoria de Parâmetros</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px]">
                {currentConfig.historicoAlteracoes.slice(-5).map((log, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span>
                      <strong>{log.dataHora}</strong> por {log.usuario}: {log.campo} alterado
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="rounded-xl text-xs bg-primary text-white font-semibold gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Parâmetros</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
