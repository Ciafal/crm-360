// src/components/gestao-clientes/CrmParty360FichaModal.tsx
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
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Send,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Truck,
  RotateCcw,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Package,
} from 'lucide-react'
import type { CrmPartyMaster, CommercialStage } from '@/types/crm_party'
import { crmPartyService } from '@/services/crm_party_service'
import { toast } from 'sonner'
import { StatusBadge, ProgressBar, AlertBlock } from './shared/GestaoClientesUiKit'

interface CrmParty360FichaModalProps {
  party: CrmPartyMaster | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenNovaCotacao: (party: CrmPartyMaster) => void
  onOpenFichaModal: (party: CrmPartyMaster) => void
  onOpenQualificarModal: (party: CrmPartyMaster) => void
  onOpenAnaliseFinanceiraModal: (party: CrmPartyMaster) => void
  onOpenTransferenciaModal: (party: CrmPartyMaster) => void
  onOpenReativarModal: (party: CrmPartyMaster) => void
  onRefreshParties: () => void
}

type TabParty =
  | 'VISAO_GERAL'
  | 'RELACIONAMENTO'
  | 'CONTATOS'
  | 'COMERCIAL'
  | 'COTACOES'
  | 'PEDIDOS'
  | 'FINANCEIRO'
  | 'LOGISTICA'
  | 'DOCUMENTOS'
  | 'TIMELINE'
  | 'IA_COPILOT'

export function CrmParty360FichaModal({
  party,
  open,
  onOpenChange,
  onOpenNovaCotacao,
  onOpenFichaModal,
  onOpenQualificarModal,
  onOpenAnaliseFinanceiraModal,
  onOpenTransferenciaModal,
  onOpenReativarModal,
  onRefreshParties,
}: CrmParty360FichaModalProps) {
  const [activeTab, setActiveTab] = useState<TabParty>('VISAO_GERAL')

  if (!party) return null

  // Ações rápidas de ciclo
  const handleInitiateOnboardingDirect = () => {
    try {
      const { party: updated } = crmPartyService.initiateOnboarding(party.crm_party_id, {
        tipoProcesso: 'CADASTRO_INICIAL',
        solicitanteNome: 'Carlos Mendonça',
      })
      toast.success(`Protocolo de Cadastro ${updated.onboardings[0].protocolo} iniciado!`)
      onRefreshParties()
      onOpenFichaModal(updated)
    } catch (e: any) {
      toast.error(e.message || 'Erro ao iniciar onboarding')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* CABEÇALHO 360º MESTRE (Fixo) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-3 shrink-0 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <DialogTitle className="font-serif text-xl sm:text-2xl font-bold text-[#003A70] tracking-tight">
                  {party.razao_social}
                </DialogTitle>
                <StatusBadge label={party.friendly_code} variant="default" />
                {party.sap_customer_id ? (
                  <StatusBadge label={`SAP: ${party.sap_customer_id}`} variant="positive" />
                ) : (
                  <StatusBadge label="Sem SAP ECC" variant="default" />
                )}
                <StatusBadge
                  label={party.commercial_stage.replace(/_/g, ' ')}
                  variant={
                    party.commercial_stage === 'CLIENTE_ATIVO' ||
                    party.commercial_stage === 'CLIENTE_SAP'
                      ? 'positive'
                      : party.commercial_stage === 'PROSPECT'
                        ? 'default'
                        : 'warning'
                  }
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="font-mono text-slate-700">
                  CNPJ: {party.cnpj_cpf || 'Pendente'}
                </span>
                <span>·</span>
                <span>
                  Vendedor: <strong className="text-slate-800">{party.vendedor_atual_nome}</strong>
                </span>
                <span>·</span>
                <span>
                  Desde: <strong className="text-slate-800">{party.created_at}</strong>
                </span>
              </div>
            </div>

            {/* AÇÕES DE CABEÇALHO */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {party.commercial_stage === 'LEAD' && (
                <Button
                  size="sm"
                  onClick={() => onOpenQualificarModal(party)}
                  className="h-8 text-xs bg-[#003A70] hover:bg-[#002850] text-white font-semibold rounded-xl gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Qualificar Lead
                </Button>
              )}

              {(party.commercial_stage === 'LEAD_QUALIFICADO' ||
                party.commercial_stage === 'LEAD') && (
                <Button
                  size="sm"
                  onClick={handleInitiateOnboardingDirect}
                  className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl gap-1.5 shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5" /> Iniciar Cadastro
                </Button>
              )}

              {(party.commercial_stage === 'PROSPECT' ||
                party.commercial_stage === 'CADASTRO_EM_ANDAMENTO') && (
                <Button
                  size="sm"
                  onClick={() => onOpenFichaModal(party)}
                  className="h-8 text-xs bg-[#003A70] hover:bg-[#002850] text-white font-semibold rounded-xl gap-1.5 shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5" /> Ficha Cadastral
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => onOpenNovaCotacao(party)}
                className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Criar Cotação
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenTransferenciaModal(party)}
                className="h-8 text-xs border-slate-200 bg-white text-slate-700 hover:text-[#003A70] rounded-xl gap-1"
              >
                <UserCheck className="w-3.5 h-3.5" /> Transferir
              </Button>
            </div>
          </div>

          {/* 4 DIMENSÕES INDEPENDENTES (Regra 4) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                1. Estágio Comercial
              </span>
              <span className="text-xs font-bold text-[#003A70] block">
                {party.commercial_stage}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                2. Status Cadastral
              </span>
              <span className="text-xs font-bold text-slate-800 block">
                {party.registration_status}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                3. Status de Crédito
              </span>
              <span className="text-xs font-bold text-emerald-800 block">
                {party.credit_status}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                4. Status Comercial
              </span>
              <span className="text-xs font-bold text-slate-800 block">
                {party.business_status}
              </span>
            </div>
          </div>

          {/* NAVEGAÇÃO ENTRE AS ABAS 360º */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-xs">
            {[
              { id: 'VISAO_GERAL' as const, label: 'Visão Geral' },
              { id: 'RELACIONAMENTO' as const, label: 'Origem & Carteira' },
              { id: 'CONTATOS' as const, label: `Contatos (${party.contatos?.length || 0})` },
              { id: 'COMERCIAL' as const, label: 'Potencial & Mix' },
              { id: 'FINANCEIRO' as const, label: 'Crédito & Limites' },
              { id: 'DOCUMENTOS' as const, label: `Documentos (${party.documentos?.length || 0})` },
              {
                id: 'TIMELINE' as const,
                label: `Timeline 360º (${party.timeline_360?.length || 0})`,
              },
              { id: 'IA_COPILOT' as const, label: 'IA Próxima Ação' },
            ].map((tab) => {
              const isCurrent = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors select-none ${
                    isCurrent
                      ? 'bg-[#003A70] text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* CONTEÚDO DAS ABAS (Rolável) */}
        <div className="p-4 sm:p-5 text-xs space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'VISAO_GERAL' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Card Potencial */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Demanda Estimada Mensal
                  </span>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-2xl font-bold font-serif text-[#003A70]">
                      {party.potencial_mensal_tons} t
                    </strong>
                    <span className="text-slate-500 text-xs">/ mês</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    R$ {(party.potencial_mensal_valor || 0).toLocaleString('pt-BR')} estimados
                  </span>
                </div>

                {/* Card Lead Score */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    IA Lead Score
                  </span>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-2xl font-bold font-serif text-[#003A70]">
                      {party.lead_score}
                    </strong>
                    <span className="text-slate-500 text-xs">/ 100</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Probabilidade Comercial: {party.probabilidade_comercial}%
                  </span>
                </div>

                {/* Card Marco Primeiro Pedido */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Primeiro Faturamento
                  </span>
                  <strong className="text-lg font-bold text-slate-800 block">
                    {party.data_primeiro_faturamento || 'Ainda não faturado'}
                  </strong>
                  <span className="text-[11px] text-slate-500 block">
                    {party.valor_primeiro_faturamento
                      ? `R$ ${party.valor_primeiro_faturamento.toLocaleString('pt-BR')} (${party.tons_primeiro_faturamento} t)`
                      : 'Meta pós criação SAP'}
                  </span>
                </div>
              </div>

              {/* Informações de Localização e Contato Principal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <span className="text-xs font-bold text-[#003A70] uppercase tracking-wider block">
                    Localização & Segmentação
                  </span>
                  <div className="space-y-1 text-slate-700 text-xs">
                    <div>
                      <span className="text-slate-500">Cidade/UF:</span>{' '}
                      <strong>
                        {party.cidade} / {party.uf} ({party.regiao})
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Segmento:</span> {party.segmento} (
                      {party.subsegmento})
                    </div>
                    <div>
                      <span className="text-slate-500">Grupo Econômico:</span>{' '}
                      {party.grupo_economico_nome || 'Independente / Matriz'}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <span className="text-xs font-bold text-[#003A70] uppercase tracking-wider block">
                    Contato Comercial Imediato
                  </span>
                  <div className="space-y-1 text-slate-700 text-xs">
                    <div>
                      <span className="text-slate-500">Contato:</span>{' '}
                      <strong>{party.contatos?.[0]?.nome || 'Não cadastrado'}</strong> (
                      {party.contatos?.[0]?.cargo || 'Compras'})
                    </div>
                    <div>
                      <span className="text-slate-500">WhatsApp:</span>{' '}
                      <span className="font-mono text-[#003A70]">
                        {party.whatsapp || party.telefone}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">E-mail:</span>{' '}
                      {party.email || 'Não informado'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORIGEM DO RELACIONAMENTO (Regra 27 e 28) */}
          {activeTab === 'RELACIONAMENTO' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-[#003A70] uppercase tracking-wider block">
                  Origem do Relacionamento Comercial (Imutável)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Data Criação Lead</span>
                    <strong className="text-slate-800">{party.created_at}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Canal de Origem</span>
                    <strong className="text-[#003A70]">{party.origem_comercial}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Campanha</span>
                    <strong className="text-slate-700">{party.campanha_origem || 'Direto'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Vendedor Captador</span>
                    <strong className="text-emerald-800">{party.vendedor_captador_nome}</strong>
                  </div>
                </div>
              </div>

              {/* Histórico de Alterações de Vendedor e Auditoria */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-xs font-bold text-[#003A70] uppercase tracking-wider block">
                  Trilha de Auditoria & Alterações de Carteira (LGPD)
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {party.audit_logs?.map((aud) => (
                    <div
                      key={aud.id}
                      className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-[11px]"
                    >
                      <span className="text-slate-700">
                        <strong>{aud.campo_alterado}</strong>: {aud.valor_anterior || 'Inicial'} →{' '}
                        <strong className="text-emerald-800">{aud.valor_novo}</strong>
                      </span>
                      <span className="text-slate-500 text-[10px] font-mono">
                        {aud.usuario_nome} ({aud.created.slice(0, 10)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTATOS */}
          {activeTab === 'CONTATOS' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {party.contatos?.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-bold">{c.nome}</strong>
                      <StatusBadge label={c.funcao_classificacao} variant="default" />
                    </div>
                    <div className="text-slate-600 text-[11px] space-y-0.5">
                      <div>Cargo: {c.cargo}</div>
                      <div>
                        WhatsApp: <span className="font-mono text-slate-800">{c.whatsapp}</span>
                      </div>
                      <div>E-mail: {c.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FINANCEIRO & CRÉDITO (Regra 22) */}
          {activeTab === 'FINANCEIRO' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Limite Aprovado
                  </span>
                  <strong className="text-2xl font-bold font-serif text-emerald-800">
                    R$ {(party.analise_credito?.limite_aprovado || 0).toLocaleString('pt-BR')}
                  </strong>
                  <span className="text-[11px] text-slate-500 block">
                    Condição: {party.analise_credito?.condicao_pagamento_recomendada || '30 DDL'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Limite Utilizado
                  </span>
                  <strong className="text-2xl font-bold font-serif text-slate-800">
                    R$ {(party.analise_credito?.limite_utilizado || 0).toLocaleString('pt-BR')}
                  </strong>
                  <span className="text-[11px] text-slate-500 block">
                    Exposição de pedidos e títulos
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Limite Disponível
                  </span>
                  <strong className="text-2xl font-bold font-serif text-[#003A70]">
                    R$ {(party.analise_credito?.limite_disponivel || 0).toLocaleString('pt-BR')}
                  </strong>
                  <span className="text-[11px] text-emerald-800 block font-bold">
                    Livre para cotações
                  </span>
                </div>
              </div>

              <AlertBlock
                variant="info"
                icon={Sparkles}
                title="Parecer da Análise de Crédito & Alçada Humana"
                message={
                  <>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      {party.analise_credito?.parecer_ia ||
                        'Análise de crédito preliminar baseada em capacidade de pagamento e volume siderúrgico demandado.'}
                    </p>
                    <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200 flex justify-between mt-2">
                      <span>
                        Decisão por:{' '}
                        <strong>
                          {party.analise_credito?.decisao_humana_por || 'Comitê CIAFAL'}
                        </strong>
                      </span>
                      <span>
                        Data: {party.analise_credito?.decisao_humana_em || party.created_at}
                      </span>
                    </div>
                  </>
                }
              />
            </div>
          )}

          {/* TAB 7: TIMELINE 360º UNIFICADA (Regra 23) */}
          {activeTab === 'TIMELINE' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600">
                Timeline unificada que acompanha o cliente desde a criação como Lead até faturamento
                e pós-venda.
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {party.timeline_360?.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-semibold">{evt.titulo}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">{evt.created}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{evt.descricao}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                      <span>Responsável: {evt.usuario_nome}</span>
                      <span>·</span>
                      <StatusBadge label={evt.modulo_origem} variant="default" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: IA PRÓXIMA AÇÃO (Regra 26) */}
          {activeTab === 'IA_COPILOT' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#003A70]" />
                <strong className="text-xs font-bold text-[#003A70] uppercase tracking-wider">
                  Próxima Melhor Ação Recomendada pela IA
                </strong>
              </div>

              <p className="text-slate-700 text-xs leading-relaxed">
                {party.proxima_acao ||
                  'Cruzar estoque de perfis estruturais e preparar proposta com prazo de entrega reduzido para conversão imediata.'}
              </p>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onOpenNovaCotacao(party)}
                  className="h-8 text-xs bg-[#003A70] hover:bg-[#002850] text-white font-semibold rounded-xl gap-1.5 shadow-2xs"
                >
                  Executar Próxima Ação
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenReativarModal(party)}
                  className="h-8 text-xs border-slate-200 bg-white text-slate-700 rounded-xl gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Abrir Novo Ciclo Comercial
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ FIXO AUDITORIA */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldAlert className="w-4 h-4 text-[#003A70]" />
            <span>Registro Mestre com Integridade Referencial (Lead → Prospect → Cliente SAP)</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs border-slate-200 bg-white text-slate-700 rounded-xl"
          >
            Fechar Ficha 360
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
