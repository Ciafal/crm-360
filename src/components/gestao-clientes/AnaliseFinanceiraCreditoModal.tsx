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
      <DialogContent className="max-w-3xl bg-white text-slate-900 border border-border rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="font-serif text-xl font-bold text-primary tracking-tight">
                  Análise Financeira & Parecer de Crédito
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {party.friendly_code} · {party.razao_social} ({protocolo})
                </DialogDescription>
              </div>
            </div>

            <Badge className="bg-purple-100 text-purple-900 border-purple-300 text-xs font-semibold">
              Status Cadastral: {party.registration_status}
            </Badge>
          </div>
        </DialogHeader>

        {/* ALERTA DE SEGREGAÇÃO: CADASTRO ≠ CRÉDITO & DECISÃO HUMANA (Regra 20) */}
        <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-purple-900 font-bold uppercase tracking-wider text-[11px]">
            <Sparkles className="w-4 h-4 text-purple-700" />
            IA Financeira CIAFAL · Resumo de Riscos e Tendências
          </div>
          <p className="text-slate-700 text-[11px] leading-relaxed">
            A IA analisou balanços, pontualidade e Serasa Score (840 pts - Risco Baixo). Limite
            máximo estimado: até R$ 250.000,00. <strong>Aviso Obrigatório:</strong> A IA nunca toma
            decisões finais de crédito — a deliberação de alçada humana é estritamente necessária.
          </p>
        </div>

        {/* DETALHES DE DOCUMENTOS & INFORMAÇÕES CADASTRADAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs py-1">
          <div className="p-3 bg-slate-50 rounded-2xl border border-border/60 space-y-2">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Dados Mestres do Registro Único
            </span>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">CNPJ:</span>
                <span className="font-mono text-slate-800">
                  {party.cnpj_cpf || 'Não informado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inscrição Estadual:</span>
                <span className="font-mono text-slate-800">
                  {party.inscricao_estadual || 'Isento'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Segmento:</span>
                <span className="text-slate-800">{party.segmento}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendedor Captador:</span>
                <span className="text-slate-800">{party.vendedor_atual_nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Potencial Mensal:</span>
                <span className="text-emerald-700 font-bold">
                  {party.potencial_mensal_tons} t/mês
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-border/60 space-y-2">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Documentos Anexados ({party.documentos?.length || 0})
            </span>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {party.documentos?.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-border/60 text-[11px]"
                >
                  <span className="text-slate-800 truncate">{doc.nome_arquivo}</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                    V{doc.versao}
                  </Badge>
                </div>
              ))}
              {(!party.documentos || party.documentos.length === 0) && (
                <span className="text-[11px] text-amber-700">Nenhum documento anexado ainda.</span>
              )}
            </div>
          </div>
        </div>

        {/* DECISÃO DO ANALISTA */}
        <div className="space-y-3 pt-2 border-t border-border/60 text-xs">
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
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
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white border-border text-slate-700 hover:bg-slate-50'
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
                  className="h-9 bg-white border-border text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-700 font-semibold">
                  Condição de Pagamento Aprovada
                </Label>
                <Input
                  value={condicaoPagamento}
                  onChange={(e) => setCondicaoPagamento(e.target.value)}
                  className="h-9 bg-white border-border text-xs rounded-xl"
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
              className="w-full bg-white border border-border rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between pt-3 border-t border-border/60">
          <span className="text-[11px] text-muted-foreground">
            Responsável: <strong className="text-slate-800">{analistaNome}</strong>
          </span>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs border-border bg-white text-slate-700 rounded-xl"
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
