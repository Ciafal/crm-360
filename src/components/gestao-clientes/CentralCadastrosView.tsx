// src/components/gestao-clientes/CentralCadastrosView.tsx
import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, FileText, Clock, Sparkles, RefreshCw, PlayCircle } from 'lucide-react'
import type { CrmPartyRecord } from '@/types/crm_party'
import { crmPartyService } from '@/services/crm_party_service'
import { toast } from 'sonner'
import { StatusBadge, SemanticVariant } from './shared/GestaoClientesUiKit'

interface CentralCadastrosViewProps {
  parties: CrmPartyRecord[]
  onOpenParty: (partyId: string) => void
  onOpenFichaModal: (party: CrmPartyRecord) => void
  onOpenAnaliseFinanceiraModal: (party: CrmPartyRecord) => void
  onRefreshParties: () => void
}

type OnboardingTabFilter =
  | 'TODOS'
  | 'AGUARDANDO_CLIENTE'
  | 'DOCUMENTACAO_INCOMPLETA'
  | 'AGUARDANDO_FINANCEIRO'
  | 'PENDENCIA_CLIENTE'
  | 'AGUARDANDO_SAP'
  | 'ERRO_SAP'
  | 'CONCLUIDOS'

export function CentralCadastrosView({
  parties,
  onOpenParty,
  onOpenFichaModal,
  onOpenAnaliseFinanceiraModal,
  onRefreshParties,
}: CentralCadastrosViewProps) {
  const [selectedTab, setSelectedTab] = useState<OnboardingTabFilter>('TODOS')
  const [searchTerm, setSearchTerm] = useState('')

  // Obter todos os onboardings ativos e concluídos (Regras de negócio intocadas)
  const allOnboardings = parties
    .filter((p) => p.processo_onboarding_id || p.registration_status !== 'NAO_INICIADO')
    .map((p) => {
      const year = new Date(p.created_at || Date.now()).getFullYear()
      const proto =
        p.processo_onboarding_id ||
        `CAD-${year}-${String(Math.abs(p.crm_party_id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 100000).padStart(5, '0')}`

      return {
        id: proto,
        protocolo: proto,
        party: p,
        status: p.registration_status,
        sla_horas: p.registration_status === 'CONCLUIDO' ? 0 : 24,
        progresso_pct:
          p.registration_status === 'CONCLUIDO'
            ? 100
            : p.registration_status === 'AGUARDANDO_SAP'
              ? 85
              : p.registration_status === 'AGUARDANDO_FINANCEIRO'
                ? 60
                : 35,
        ai_validacao_score: p.ia_qualification_score || 85,
      }
    })

  const filteredOnboardings = allOnboardings.filter((item) => {
    // Filtro por tab
    if (selectedTab === 'AGUARDANDO_CLIENTE' && item.status !== 'AGUARDANDO_CLIENTE') return false
    if (
      selectedTab === 'DOCUMENTACAO_INCOMPLETA' &&
      item.status !== 'DOCUMENTACAO_INCOMPLETA' &&
      item.status !== 'DOCUMENTACAO_PENDENTE'
    )
      return false
    if (selectedTab === 'AGUARDANDO_FINANCEIRO' && item.status !== 'AGUARDANDO_FINANCEIRO')
      return false
    if (selectedTab === 'PENDENCIA_CLIENTE' && item.status !== 'PENDENCIA_CLIENTE') return false
    if (selectedTab === 'AGUARDANDO_SAP' && item.status !== 'AGUARDANDO_SAP') return false
    if (selectedTab === 'ERRO_SAP' && item.status !== 'ERRO_SAP') return false
    if (selectedTab === 'CONCLUIDOS' && item.status !== 'CONCLUIDO') return false

    // Filtro por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchProto = item.protocolo.toLowerCase().includes(term)
      const matchEmpresa = item.party.razao_social.toLowerCase().includes(term)
      const matchCnpj = item.party.cnpj_cpf.toLowerCase().includes(term)
      const matchFriendly = item.party.friendly_code.toLowerCase().includes(term)
      const matchVend = item.party.vendedor_atual_nome.toLowerCase().includes(term)
      if (!matchProto && !matchEmpresa && !matchCnpj && !matchFriendly && !matchVend) return false
    }

    return true
  })

  const handleSimulateSapIntegration = (partyId: string) => {
    try {
      crmPartyService.processSapIntegrationSuccess(partyId)
      toast.success('Integração SAP ECC processada com sucesso!', {
        description: 'Código SAP ECC gerado e vinculado ao Registro Mestre!',
      })
      onRefreshParties()
    } catch (e: any) {
      toast.error(e.message || 'Erro na integração SAP')
    }
  }

  const tabs: Array<{ id: OnboardingTabFilter; label: string; count: number }> = [
    { id: 'TODOS', label: 'Todos os Processos', count: allOnboardings.length },
    {
      id: 'AGUARDANDO_CLIENTE',
      label: 'Aguardando Cliente',
      count: allOnboardings.filter((o) => o.status === 'AGUARDANDO_CLIENTE').length,
    },
    {
      id: 'DOCUMENTACAO_INCOMPLETA',
      label: 'Doc. Incompleta',
      count: allOnboardings.filter(
        (o) => o.status === 'DOCUMENTACAO_INCOMPLETA' || o.status === 'DOCUMENTACAO_PENDENTE',
      ).length,
    },
    {
      id: 'AGUARDANDO_FINANCEIRO',
      label: 'Aguardando Financeiro',
      count: allOnboardings.filter((o) => o.status === 'AGUARDANDO_FINANCEIRO').length,
    },
    {
      id: 'PENDENCIA_CLIENTE',
      label: 'Pendência Cliente',
      count: allOnboardings.filter((o) => o.status === 'PENDENCIA_CLIENTE').length,
    },
    {
      id: 'AGUARDANDO_SAP',
      label: 'Aguardando SAP',
      count: allOnboardings.filter((o) => o.status === 'AGUARDANDO_SAP').length,
    },
    {
      id: 'CONCLUIDOS',
      label: 'Concluídos',
      count: allOnboardings.filter((o) => o.status === 'CONCLUIDO').length,
    },
  ]

  return (
    <div className="space-y-4">
      {/* CABEÇALHO DA CENTRAL DE CADASTROS (Fundo Claro / Azul Institucional) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#003A70]/10 text-[#003A70] rounded-xl border border-[#003A70]/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#003A70] tracking-tight">
                Central de Cadastros & Onboarding
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Acompanhamento ponta a ponta dos protocolos CAD-AAAA-NNNNN e esteira de integração
                SAP.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar protocolo, CNPJ, cliente..."
              className="h-9 w-64 bg-white border-slate-200 pl-9 text-xs rounded-xl focus-visible:ring-[#003A70]"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefreshParties}
            className="h-9 text-xs border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#003A70] rounded-xl gap-1 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </Button>
        </div>
      </div>

      {/* TABS DE STATUS DO PROCESSO (Padronizadas CIAFAL) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border select-none ${
                isSelected
                  ? 'bg-[#003A70] text-white border-[#003A70] font-bold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-[#003A70] hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <Badge
                className={`text-[10px] px-1.5 py-0 rounded-md font-mono border-none ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* TABELA DA CENTRAL DE CADASTROS (Fundo Branco, Tipografia Nítida) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b border-slate-200">
              <TableHead className="text-slate-600 text-[11px] font-bold uppercase">
                Protocolo / CRM ID
              </TableHead>
              <TableHead className="text-slate-600 text-[11px] font-bold uppercase">
                Empresa / CNPJ
              </TableHead>
              <TableHead className="text-slate-600 text-[11px] font-bold uppercase">
                Vendedor / Regional
              </TableHead>
              <TableHead className="text-slate-600 text-[11px] font-bold uppercase">
                Potencial
              </TableHead>
              <TableHead className="text-slate-600 text-[11px] font-bold uppercase">
                Status & Progresso
              </TableHead>
              <TableHead className="text-slate-600 text-[11px] font-bold uppercase">
                SLA & IA
              </TableHead>
              <TableHead className="text-slate-600 text-[11px] font-bold uppercase text-right">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOnboardings.map((item) => {
              const statusVariant: SemanticVariant =
                item.status === 'CONCLUIDO'
                  ? 'positive'
                  : item.status === 'AGUARDANDO_FINANCEIRO' || item.status === 'PENDENCIA_CLIENTE'
                    ? 'warning'
                    : item.status === 'ERRO_SAP'
                      ? 'critical'
                      : 'default'

              return (
                <TableRow
                  key={item.id}
                  className="border-b border-slate-100 hover:bg-slate-50/70 text-xs transition-colors"
                >
                  {/* Protocolo & Friendly Code */}
                  <TableCell className="font-mono">
                    <span className="font-bold text-[#003A70] block">{item.protocolo}</span>
                    <span className="text-[10px] text-slate-500 font-sans">
                      {item.party.friendly_code}
                    </span>
                  </TableCell>

                  {/* Empresa */}
                  <TableCell>
                    <strong className="text-slate-900 block truncate max-w-[200px]">
                      {item.party.razao_social}
                    </strong>
                    <span className="font-mono text-[11px] text-slate-500">
                      {item.party.cnpj_cpf || 'CNPJ não informado'}
                    </span>
                  </TableCell>

                  {/* Vendedor */}
                  <TableCell>
                    <span className="text-slate-800 block font-medium">
                      {item.party.vendedor_atual_nome}
                    </span>
                    <span className="text-[10px] text-slate-500">{item.party.regional}</span>
                  </TableCell>

                  {/* Potencial */}
                  <TableCell>
                    <span className="text-slate-900 font-bold block">
                      {item.party.potencial_mensal_tons} t/mês
                    </span>
                    <span className="text-[10px] text-slate-500">
                      R$ {(item.party.potencial_mensal_valor || 0).toLocaleString('pt-BR')}
                    </span>
                  </TableCell>

                  {/* Status & Progresso */}
                  <TableCell>
                    <div className="space-y-1">
                      <StatusBadge
                        label={item.status.replace(/_/g, ' ')}
                        variant={statusVariant}
                        dot
                      />
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-700">{item.progresso_pct}%</span>
                        <span>·</span>
                        <span>{item.party.documentos?.length || 0} docs</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* SLA & IA */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-[#003A70]" />
                      <span>SLA: {item.sla_horas}h</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[#003A70] mt-0.5">
                      <Sparkles className="w-3 h-3" />
                      <span className="font-medium">Score: {item.ai_validacao_score}/100</span>
                    </div>
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === 'AGUARDANDO_SAP' ? (
                        <Button
                          size="sm"
                          className="h-7 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg gap-1 shadow-2xs font-medium"
                          onClick={() => handleSimulateSapIntegration(item.party.crm_party_id)}
                        >
                          <PlayCircle className="w-3.5 h-3.5" /> Efetivar SAP
                        </Button>
                      ) : item.status === 'AGUARDANDO_FINANCEIRO' ||
                        item.status === 'DOCUMENTACAO_INCOMPLETA' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#003A70] rounded-lg gap-1 font-medium"
                          onClick={() => onOpenAnaliseFinanceiraModal(item.party)}
                        >
                          Analisar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#003A70] rounded-lg font-medium"
                          onClick={() => onOpenFichaModal(item.party)}
                        >
                          Ver Ficha
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[11px] text-[#003A70] hover:bg-[#EBF3FA] rounded-lg font-medium"
                        onClick={() => onOpenParty(item.party.crm_party_id)}
                      >
                        CRM 360º
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}

            {filteredOnboardings.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                  Nenhum processo de cadastramento encontrado para o filtro selecionado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
