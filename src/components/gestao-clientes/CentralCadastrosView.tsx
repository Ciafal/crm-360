// src/components/gestao-clientes/CentralCadastrosView.tsx
import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Send,
  Building2,
  PlayCircle,
} from 'lucide-react'
import type { CrmPartyMaster } from '@/types/crm_party'
import { crmPartyService } from '@/services/crm_party_service'
import { toast } from 'sonner'

interface CentralCadastrosViewProps {
  parties: CrmPartyMaster[]
  onOpenParty: (partyId: string) => void
  onOpenFichaModal: (party: CrmPartyMaster) => void
  onOpenAnaliseFinanceiraModal: (party: CrmPartyMaster) => void
  onRefreshParties: () => void
}

type TabCadastros =
  | 'TODOS'
  | 'AGUARDANDO_CLIENTE'
  | 'DOCUMENTACAO_INCOMPLETA'
  | 'AGUARDANDO_FINANCEIRO'
  | 'FINANCEIRO_ANALISANDO'
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
  const [selectedTab, setSelectedTab] = useState<TabCadastros>('TODOS')
  const [searchTerm, setSearchTerm] = useState('')

  // Extrai processos de cadastros de todos os clientes CRM Party
  const allOnboardings = parties.flatMap((p) =>
    (p.onboardings || []).map((o) => ({
      ...o,
      party: p,
    })),
  )

  const filteredOnboardings = allOnboardings.filter((item) => {
    // Filtro por tab
    if (selectedTab === 'AGUARDANDO_CLIENTE' && item.status !== 'AGUARDANDO_CLIENTE') return false
    if (selectedTab === 'DOCUMENTACAO_INCOMPLETA' && item.status !== 'DOCUMENTACAO_INCOMPLETA')
      return false
    if (selectedTab === 'AGUARDANDO_FINANCEIRO' && item.status !== 'AGUARDANDO_FINANCEIRO')
      return false
    if (selectedTab === 'FINANCEIRO_ANALISANDO' && item.status !== 'FINANCEIRO_ANALISANDO')
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

  return (
    <div className="space-y-4">
      {/* CABEÇALHO & TABS DA CENTRAL DE CADASTROS (Regra 18) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Central de Cadastros & Onboarding
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhamento ponta a ponta dos protocolos CAD-AAAA-NNNNN e esteira de integração
                SAP.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar protocolo, CNPJ, cliente..."
              className="h-9 w-64 bg-white border-border pl-9 text-xs rounded-xl"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefreshParties}
            className="h-9 text-xs border-border bg-white text-slate-700 rounded-xl gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </Button>
        </div>
      </div>

      {/* TABS DE STATUS DO PROCESSO */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'TODOS' as const, label: 'Todos os Processos', count: allOnboardings.length },
          {
            id: 'AGUARDANDO_CLIENTE' as const,
            label: 'Aguardando Cliente',
            count: allOnboardings.filter((o) => o.status === 'AGUARDANDO_CLIENTE').length,
          },
          {
            id: 'DOCUMENTACAO_INCOMPLETA' as const,
            label: 'Doc. Incompleta',
            count: allOnboardings.filter((o) => o.status === 'DOCUMENTACAO_INCOMPLETA').length,
          },
          {
            id: 'AGUARDANDO_FINANCEIRO' as const,
            label: 'Aguardando Financeiro',
            count: allOnboardings.filter((o) => o.status === 'AGUARDANDO_FINANCEIRO').length,
          },
          {
            id: 'PENDENCIA_CLIENTE' as const,
            label: 'Pendência Cliente',
            count: allOnboardings.filter((o) => o.status === 'PENDENCIA_CLIENTE').length,
          },
          {
            id: 'AGUARDANDO_SAP' as const,
            label: 'Aguardando SAP',
            count: allOnboardings.filter((o) => o.status === 'AGUARDANDO_SAP').length,
          },
          {
            id: 'CONCLUIDOS' as const,
            label: 'Concluídos',
            count: allOnboardings.filter((o) => o.status === 'CONCLUIDO').length,
          },
        ].map((tab) => {
          const isSelected = selectedTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white border border-border text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <Badge
                className={`text-[10px] px-1.5 py-0 rounded-md font-mono ${
                  isSelected ? 'bg-sky-800 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* TABELA DA CENTRAL DE CADASTROS */}
      <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b border-slate-800">
              <TableHead className="text-slate-400 text-xs font-bold uppercase">
                Protocolo / CRM ID
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-bold uppercase">
                Empresa / CNPJ
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-bold uppercase">
                Vendedor / Regional
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-bold uppercase">
                Potencial
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-bold uppercase">
                Status & Progresso
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-bold uppercase">SLA & IA</TableHead>
              <TableHead className="text-slate-400 text-xs font-bold uppercase text-right">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOnboardings.map((item) => (
              <TableRow
                key={item.id}
                className="border-b border-slate-800/60 hover:bg-slate-800/40 text-xs"
              >
                {/* Protocolo & Friendly Code */}
                <TableCell className="font-mono">
                  <span className="font-bold text-sky-400 block">{item.protocolo}</span>
                  <span className="text-[10px] text-slate-500 font-sans">
                    {item.party.friendly_code} (UUID: {item.party.crm_party_id.slice(0, 6)}...)
                  </span>
                </TableCell>

                {/* Empresa */}
                <TableCell>
                  <strong className="text-white block truncate max-w-[200px]">
                    {item.party.razao_social}
                  </strong>
                  <span className="font-mono text-[11px] text-slate-400">
                    {item.party.cnpj_cpf || 'CNPJ não informado'}
                  </span>
                </TableCell>

                {/* Vendedor */}
                <TableCell>
                  <span className="text-slate-200 block font-semibold">
                    {item.party.vendedor_atual_nome}
                  </span>
                  <span className="text-[10px] text-slate-500">{item.party.regional}</span>
                </TableCell>

                {/* Potencial */}
                <TableCell>
                  <span className="text-emerald-400 font-bold block">
                    {item.party.potencial_mensal_tons} t/mês
                  </span>
                  <span className="text-[10px] text-slate-500">
                    R$ {(item.party.potencial_mensal_valor || 0).toLocaleString('pt-BR')}
                  </span>
                </TableCell>

                {/* Status & Progresso */}
                <TableCell>
                  <Badge
                    className={`text-[10px] mb-1 ${
                      item.status === 'CONCLUIDO'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : item.status === 'AGUARDANDO_FINANCEIRO'
                          ? 'bg-purple-950 text-purple-300 border-purple-800'
                          : item.status === 'AGUARDANDO_SAP'
                            ? 'bg-sky-950 text-sky-300 border-sky-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                  >
                    {item.status.replace(/_/g, ' ')}
                  </Badge>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{item.progresso_pct}% concluído</span>
                    <span>·</span>
                    <span>{item.party.documentos?.length || 0} docs</span>
                  </div>
                </TableCell>

                {/* SLA & IA */}
                <TableCell>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>SLA: {item.sla_horas}h</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5">
                    <Sparkles className="w-3 h-3" />
                    <span>IA Score: {item.ai_validacao_score}/100</span>
                  </div>
                </TableCell>

                {/* Ações */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {item.status === 'AGUARDANDO_SAP' ? (
                      <Button
                        size="sm"
                        className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg gap-1"
                        onClick={() => handleSimulateSapIntegration(item.party.crm_party_id)}
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Efetivar SAP
                      </Button>
                    ) : item.status === 'AGUARDANDO_FINANCEIRO' ||
                      item.status === 'DOCUMENTACAO_INCOMPLETA' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] border-purple-800 text-purple-300 hover:bg-purple-950/50 rounded-lg gap-1"
                        onClick={() => onOpenAnaliseFinanceiraModal(item.party)}
                      >
                        Analisar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg"
                        onClick={() => onOpenFichaModal(item.party)}
                      >
                        Ver Ficha
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] text-sky-400 hover:bg-sky-950/40 rounded-lg"
                      onClick={() => onOpenParty(item.party.crm_party_id)}
                    >
                      CRM 360º
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

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
