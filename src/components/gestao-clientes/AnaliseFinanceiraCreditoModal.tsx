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
import { StatusBadge, AlertBlock } from './shared/GestaoClientesUiKit'

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
      <DialogContent className="max-w-3xl bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header fixo */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#003A70]/10 text-[#003A70] rounded-xl border border-[#003A70]/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-[#003A70] tracking-tight">
                Análise Financeira & Parecer de Crédito
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                {party.friendly_code} · {party.razao_social} ({protocolo})
              </DialogDescription>
            </div>
          </div>

          <StatusBadge
            label={party.registration_status}
            variant={
              party.registration_status === 'CADASTRO_SAP_CONCLUIDO' ? 'positive' : 'default'
            }
          />
        </div>

        {/* Corpo rolável */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* ALERTA DE SEGREGAÇÃO: CADASTRO ≠ CRÉDITO & DECISÃO HUMANA (Regra 20) */}
          <AlertBlock
            variant="info"
            icon={Sparkles}
            title="IA Financeira CIAFAL · Resumo de Riscos e Tendências"
            message={
              <>
                A IA analisou balanços, pontualidade e Serasa Score (840 pts - Risco Baixo). Limite
                máximo estimado: até R$ 250.000,00. <strong>Aviso Obrigatório:</strong> A IA nunca
                toma decisões finais de crédito — a deliberação de alçada humana é estritamente
                necessária.
              </>
            }
          />

          {/* DETALHES DE DOCUMENTOS & INFORMAÇÕES CADASTRADAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-[#003A70] uppercase tracking-wider block">
                Dados Mestres do Registro Único
              </span>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">CNPJ:</span>
                  <span className="font-mono text-slate-800">
                    {party.cnpj_cpf || 'Não informado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Inscrição Estadual:</span>
                  <span className="font-mono text-slate-800">
                    {party.inscricao_estadual || 'Isento'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Segmento:</span>
                  <span className="text-slate-800">{party.segmento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendedor Captador:</span>
                  <span className="text-slate-800">{party.vendedor_atual_nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Potencial Mensal:</span>
                  <span className="text-emerald-800 font-bold">
                    {party.potencial_mensal_tons} t/mês
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-[#003A70] uppercase tracking-wider block">
                Documentos Anexados ({party.documentos?.length || 0})
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {party.documentos?.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200 text-[11px]"
                  >
                    <span className="text-slate-800 truncate">{doc.nome_arquivo}</span>
                    <StatusBadge label={`V${doc.versao}`} variant="default" />
                  </div>
                ))}
                {(!party.documentos || party.documentos.length === 0) && (
                  <span className="text-[11px] text-amber-800">
                    Nenhum documento anexado ainda.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* DECISÃO DO ANALISTA */}
          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-[#003A70] uppercase tracking-wider block">
              Ação & Deliberação de Alçada (Financeiro)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  id: 'APROVAR' as const,
                  label: 'Aprovar Cadastro',
                  icon: CheckCircle2,
                },
                {
                  id: 'SOLICITAR_DOC' as const,
                  label: 'Solicitar Doc.',
                  icon: FileQuestion,
                },
                {
                  id: 'SOLICITAR_CORRECAO' as const,
                  label: 'Solicitar Correção',
                  icon: AlertTriangle,
                },
                { id: 'REPROVAR' as const, label: 'Reprovar', icon: XCircle },
              ].map((btn) => {
                const Icon = btn.icon
                const isSelected = selectedAction === btn.id
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setSelectedAction(btn.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#003A70] text-white border-[#003A70] font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
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
                  <Label className="text-xs text-slate-700 font-semibold">
                    Limite de Crédito Aprovado (R$)
                  </Label>
                  <Input
                    value={limiteSugerido}
                    onChange={(e) => setLimiteSugerido(e.target.value)}
                    className="h-9 bg-white border-slate-200 text-xs rounded-xl font-mono focus:ring-[#003A70]"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-700 font-semibold">
                    Condição de Pagamento Aprovada
                  </Label>
                  <Input
                    value={condicaoPagamento}
                    onChange={(e) => setCondicaoPagamento(e.target.value)}
                    className="h-9 bg-white border-slate-200 text-xs rounded-xl focus:ring-[#003A70]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs text-slate-700 font-semibold">
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
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#003A70]"
              />
            </div>
          </div>
        </div>

        {/* Footer fixo */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Responsável: <strong className="text-slate-800">{analistaNome}</strong>
          </span>

          <div className="flex gap-2">
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
              onClick={handleDecisionSubmit}
              className={`h-8 text-xs font-semibold rounded-xl gap-1.5 shadow-2xs text-white ${
                selectedAction === 'APROVAR'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : selectedAction === 'REPROVAR'
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-amber-700 hover:bg-amber-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Decisão Financeira
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
