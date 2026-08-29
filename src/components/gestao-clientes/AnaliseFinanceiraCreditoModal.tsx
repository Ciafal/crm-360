// src/components/gestao-clientes/AnaliseFinanceiraCreditoModal.tsx
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
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileQuestion,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Building2,
  FileText,
  DollarSign,
  Send,
} from 'lucide-react'
import { crmPartyService } from '@/services/crm_party_service'
import type { CrmPartyMaster } from '@/types/crm_party'
import { toast } from 'sonner'

interface AnaliseFinanceiraCreditoModalProps {
  party: CrmPartyMaster | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApproved: (party: CrmPartyMaster) => void
}

export function AnaliseFinanceiraCreditoModal({
  party,
  open,
  onOpenChange,
  onApproved,
}: AnaliseFinanceiraCreditoModalProps) {
  const [analistaNome, setAnalistaNome] = useState('Marisa Alencar (Crédito & Cadastro)')
  const [limiteSugerido, setLimiteSugerido] = useState('200000')
  const [condicaoPagamento, setCondicaoPagamento] = useState('30/60 DDL (Boleto Bancário)')
  const [justificativa, setJustificativa] = useState(
    'Documentação fiscal e societária regularizada. Faturamento compatível com limite solicitado.',
  )
  const [selectedAction, setSelectedAction] = useState<
    'APROVAR' | 'SOLICITAR_CORRECAO' | 'SOLICITAR_DOC' | 'REPROVAR'
  >('APROVAR')

  if (!party) return null

  const activeOnboarding = party.onboardings?.[0]
  const protocolo = activeOnboarding?.protocolo || 'CAD-2024-001283'

  const handleDecisionSubmit = () => {
    try {
      const updated = crmPartyService.submitFinancialDecision(
        party.crm_party_id,
        activeOnboarding?.id || 'onb-01',
        {
          action: selectedAction,
          analistaNome,
          motivoOuJustificativa: justificativa,
          limiteCreditoSugerido:
            parseFloat(limiteSugerido.replace(/\./g, '').replace(',', '.')) || 150000,
          condicaoPagamentoSugerida: condicaoPagamento,
        },
      )

      if (selectedAction === 'APROVAR') {
        toast.success(`Cadastro ${protocolo} Aprovado com Sucesso!`, {
          description: 'Enfileirado na integração auditável SAP ECC.',
        })
      } else if (selectedAction === 'SOLICITAR_CORRECAO' || selectedAction === 'SOLICITAR_DOC') {
        toast.warning('Pendência registrada e notificada ao cliente e vendedor.')
      } else {
        toast.error('Cadastro reprovado com registro em trilha de auditoria.')
      }

      onApproved(updated)
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e.message || 'Erro ao processar análise')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-slate-950 text-slate-100 border border-slate-800 rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="font-serif text-xl font-bold text-white tracking-tight">
                  Análise Financeira & Parecer de Crédito
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  {party.friendly_code} · {party.razao_social} ({protocolo})
                </DialogDescription>
              </div>
            </div>

            <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-xs">
              Status Cadastral: {party.registration_status}
            </Badge>
          </div>
        </DialogHeader>

        {/* ALERTA DE SEGREGAÇÃO: CADASTRO ≠ CRÉDITO & DECISÃO HUMANA (Regra 20) */}
        <div className="p-3.5 bg-purple-950/40 rounded-2xl border border-purple-800/40 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-purple-300 font-bold uppercase tracking-wider text-[11px]">
            <Sparkles className="w-4 h-4 text-purple-400" />
            IA Financeira CIAFAL · Resumo de Riscos e Tendências
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            A IA analisou balanços, pontualidade e Serasa Score (840 pts - Risco Baixo). Limite
            máximo estimado: até R$ 250.000,00. <strong>Aviso Obrigatório:</strong> A IA nunca toma
            decisões finais de crédito — a deliberação de alçada humana é estritamente necessária.
          </p>
        </div>

        {/* DETALHES DE DOCUMENTOS & INFORMAÇÕES CADASTRADAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs py-1">
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
              Dados Mestres do Registro Único
            </span>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">CNPJ:</span>
                <span className="font-mono text-slate-200">
                  {party.cnpj_cpf || 'Não informado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inscrição Estadual:</span>
                <span className="font-mono text-slate-200">
                  {party.inscricao_estadual || 'Isento'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Segmento:</span>
                <span className="text-slate-200">{party.segmento}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vendedor Captador:</span>
                <span className="text-slate-200">{party.vendedor_atual_nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Potencial Mensal:</span>
                <span className="text-emerald-400 font-bold">
                  {party.potencial_mensal_tons} t/mês
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
              Documentos Anexados ({party.documentos?.length || 0})
            </span>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {party.documentos?.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px]"
                >
                  <span className="text-slate-200 truncate">{doc.nome_arquivo}</span>
                  <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[10px]">
                    V{doc.versao}
                  </Badge>
                </div>
              ))}
              {(!party.documentos || party.documentos.length === 0) && (
                <span className="text-[11px] text-amber-400">Nenhum documento anexado ainda.</span>
              )}
            </div>
          </div>
        </div>

        {/* DECISÃO DO ANALISTA */}
        <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
            Ação & Deliberação de Alçada (Financeiro)
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                id: 'APROVAR' as const,
                label: 'Aprovar Cadastro',
                icon: CheckCircle2,
                color: 'emerald',
              },
              {
                id: 'SOLICITAR_DOC' as const,
                label: 'Solicitar Doc.',
                icon: FileQuestion,
                color: 'sky',
              },
              {
                id: 'SOLICITAR_CORRECAO' as const,
                label: 'Solicitar Correção',
                icon: AlertTriangle,
                color: 'amber',
              },
              { id: 'REPROVAR' as const, label: 'Reprovar', icon: XCircle, color: 'rose' },
            ].map((btn) => {
              const Icon = btn.icon
              const isSelected = selectedAction === btn.id
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setSelectedAction(btn.id)}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {btn.label}
                </button>
              )
            })}
          </div>

          {selectedAction === 'APROVAR' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-semibold">
                  Limite de Crédito Aprovado (R$)
                </Label>
                <Input
                  value={limiteSugerido}
                  onChange={(e) => setLimiteSugerido(e.target.value)}
                  className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-semibold">
                  Condição de Pagamento Aprovada
                </Label>
                <Input
                  value={condicaoPagamento}
                  onChange={(e) => setCondicaoPagamento(e.target.value)}
                  className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs text-slate-300 font-semibold">
              {selectedAction === 'APROVAR'
                ? 'Justificativa da Decisão'
                : 'Motivo da Pendência / Reprovação *'}
            </Label>
            <textarea
              rows={2}
              required
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Descreva detalhadamente para a trilha de auditoria..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-sky-500"
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">
            Responsável: <strong className="text-slate-200">{analistaNome}</strong>
          </span>

          <div className="flex gap-2">
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
              onClick={handleDecisionSubmit}
              className={`h-9 text-xs font-bold rounded-xl gap-1.5 shadow-sm ${
                selectedAction === 'APROVAR'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : selectedAction === 'REPROVAR'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Decisão Financeira
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
