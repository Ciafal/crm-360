// src/components/gestao-clientes/QualificarLeadModal.tsx
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
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  TrendingUp,
  Target,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Building2,
  ArrowRight,
} from 'lucide-react'
import { crmPartyService } from '@/services/crm_party_service'
import type { CrmPartyMaster } from '@/types/crm_party'
import { toast } from 'sonner'

interface QualificarLeadModalProps {
  party: CrmPartyMaster | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onQualified: (party: CrmPartyMaster) => void
  onInitiateOnboarding?: (party: CrmPartyMaster) => void
}

export function QualificarLeadModal({
  party,
  open,
  onOpenChange,
  onQualified,
  onInitiateOnboarding,
}: QualificarLeadModalProps) {
  const [potencialMensalTons, setPotencialMensalTons] = useState(
    party?.potencial_mensal_tons?.toString() || '20',
  )
  const [potencialAnualTons, setPotencialAnualTons] = useState(
    party?.potencial_anual_tons?.toString() || '240',
  )
  const [produtos, setProdutos] = useState(
    party?.produto_interesse || 'Perfis W, Chapas Grossas A36, Tubos Sch40',
  )
  const [aplicacoes, setAplicacoes] = useState(
    party?.aplicacao_produto || 'Estruturas Metálicas & Obras Industriais',
  )
  const [frequenciaEstimadaDias, setFrequenciaEstimadaDias] = useState(
    party?.frequencia_estimada_dias?.toString() || '15',
  )
  const [concorrentes, setConcorrentes] = useState(
    party?.concorrentes || 'Gerdau Comercial, Usiminas',
  )
  const [probabilidadeComercial, setProbabilidadeComercial] = useState(
    party?.probabilidade_comercial?.toString() || '75',
  )
  const [previsaoPrimeiraCompra, setPrevisaoPrimeiraCompra] = useState(
    party?.previsao_primeira_compra || 'Novembro/2024',
  )

  if (!party) return null

  // Cálculo de score em tempo real para prévia
  const tonsNum = parseFloat(potencialMensalTons.replace(',', '.')) || 0
  const probNum = parseInt(probabilidadeComercial, 10) || 50
  let simulatedScore = 50
  if (tonsNum >= 30) simulatedScore += 25
  else if (tonsNum >= 15) simulatedScore += 15
  if (probNum >= 75) simulatedScore += 15
  else if (probNum >= 50) simulatedScore += 10
  if (party.cnpj_cpf) simulatedScore += 10
  simulatedScore = Math.min(100, simulatedScore)

  const handleSaveQualification = (shouldStartOnboarding = false) => {
    try {
      const updated = crmPartyService.qualifyLead(party.crm_party_id, {
        potencialMensalTons: tonsNum,
        potencialAnualTons: parseFloat(potencialAnualTons) || tonsNum * 12,
        produtos,
        aplicacoes,
        frequenciaEstimadaDias: parseInt(frequenciaEstimadaDias, 10) || 30,
        concorrentes,
        probabilidadeComercial: probNum,
        previsaoPrimeiraCompra,
        userName: 'Carlos Mendonça',
      })

      toast.success(`Lead ${party.friendly_code} qualificado com sucesso!`, {
        description: `IA Score Comercial atualizado para ${updated.lead_score}/100. Histórico de scores preservado.`,
      })

      onQualified(updated)

      if (shouldStartOnboarding) {
        if (onInitiateOnboarding) {
          onInitiateOnboarding(updated)
        }
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao qualificar lead')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-slate-950 text-slate-100 border border-slate-800 rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="font-serif text-xl font-bold text-white tracking-tight">
                  Qualificação Comercial do Lead
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  {party.friendly_code} · {party.razao_social} (UUID Imutável:{' '}
                  <span className="font-mono text-sky-400">
                    {party.crm_party_id.slice(0, 8)}...
                  </span>
                  )
                </DialogDescription>
              </div>
            </div>

            <Badge className="bg-sky-950 text-sky-300 border-sky-800 text-xs font-mono">
              Estágio: {party.commercial_stage}
            </Badge>
          </div>
        </DialogHeader>

        {/* PAINEL DE IA SCORE & HISTÓRICO (Regra 10) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/50 border border-sky-800/40 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Lead Score IA Previsto
            </span>
            <div className="flex items-baseline gap-2">
              <strong className="text-2xl font-serif font-bold text-amber-400">
                {simulatedScore}
              </strong>
              <span className="text-slate-400 text-xs">/ 100</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Cálculo puramente comercial. A IA nunca aprova crédito automaticamente.
            </p>
          </div>

          <div className="space-y-1 sm:col-span-2 border-l border-slate-800 sm:pl-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" /> Histórico de Evolução do Score
            </span>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {party.lead_score_history?.map((h) => (
                <div
                  key={h.id}
                  className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-[11px]"
                >
                  <span className="text-slate-300">{h.motivo}</span>
                  <Badge className="bg-amber-950 text-amber-300 border-amber-800 text-[10px] font-mono">
                    {h.data}: {h.score} pts
                  </Badge>
                </div>
              ))}
              {(!party.lead_score_history || party.lead_score_history.length === 0) && (
                <span className="text-[11px] text-slate-500">
                  Primeira qualificação deste registro.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* FORMULÁRIO DE QUALIFICAÇÃO TÉCNICA */}
        <div className="space-y-3.5 py-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300 font-semibold">
                Potencial Mensal Estimado (t/mês) *
              </Label>
              <Input
                type="number"
                step="0.5"
                value={potencialMensalTons}
                onChange={(e) => {
                  setPotencialMensalTons(e.target.value)
                  const v = parseFloat(e.target.value) || 0
                  setPotencialAnualTons((v * 12).toString())
                }}
                className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300 font-semibold">
                Potencial Anual Estimado (t/ano)
              </Label>
              <Input
                type="number"
                value={potencialAnualTons}
                onChange={(e) => setPotencialAnualTons(e.target.value)}
                className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-300 font-semibold">
              Produtos & Mix de Interesse Estrutural *
            </Label>
            <Input
              value={produtos}
              onChange={(e) => setProdutos(e.target.value)}
              placeholder="Ex: Perfis W 200, Chapas Grossas A36, Tubos Sch40"
              className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-300 font-semibold">
              Aplicação Prática / Mercado Alvo
            </Label>
            <Input
              value={aplicacoes}
              onChange={(e) => setAplicacoes(e.target.value)}
              placeholder="Ex: Galpões industriais, caçambas agrícolas, pontes rolantes"
              className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300 font-semibold">
                Frequência de Compra Esperada (Dias)
              </Label>
              <Input
                type="number"
                value={frequenciaEstimadaDias}
                onChange={(e) => setFrequenciaEstimadaDias(e.target.value)}
                className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300 font-semibold">
                Probabilidade Comercial (%)
              </Label>
              <Input
                type="number"
                value={probabilidadeComercial}
                onChange={(e) => setProbabilidadeComercial(e.target.value)}
                className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300 font-semibold">Previsão da 1ª Compra</Label>
              <Input
                value={previsaoPrimeiraCompra}
                onChange={(e) => setPrevisaoPrimeiraCompra(e.target.value)}
                placeholder="Ex: Novembro/2024"
                className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-300 font-semibold">
              Concorrentes Atuais Comentados
            </Label>
            <Input
              value={concorrentes}
              onChange={(e) => setConcorrentes(e.target.value)}
              placeholder="Ex: Gerdau Comercial, Usiminas Distribuição, Açocil"
              className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs border-slate-800 bg-slate-900 text-slate-300 hover:text-white rounded-xl"
          >
            Cancelar
          </Button>

          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleSaveQualification(false)}
              className="h-9 text-xs border-sky-800 text-sky-300 hover:bg-sky-950/50 rounded-xl gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Salvar Qualificação (Manter Lead)
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleSaveQualification(true)}
              className="h-9 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl gap-1.5 shadow-sm"
            >
              <span>Promover a Prospect & Iniciar Cadastro</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
