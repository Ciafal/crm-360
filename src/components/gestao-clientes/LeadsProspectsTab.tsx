// src/components/gestao-clientes/LeadsProspectsTab.tsx
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
  Search,
  Sparkles,
  UserPlus,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  Filter,
  CheckCircle2,
  Building2,
  ExternalLink,
} from 'lucide-react'
import type { CrmPartyMaster } from '@/types/crm_party'

interface LeadsProspectsTabProps {
  parties: CrmPartyMaster[]
  onOpenParty: (partyId: string) => void
  onOpenCadastroModal: () => void
  onOpenQualificarModal: (party: CrmPartyMaster) => void
  onOpenFichaModal: (party: CrmPartyMaster) => void
}

export function LeadsProspectsTab({
  parties,
  onOpenParty,
  onOpenCadastroModal,
  onOpenQualificarModal,
  onOpenFichaModal,
}: LeadsProspectsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState<'ALL' | 'LEAD' | 'LEAD_QUALIFICADO' | 'PROSPECT'>(
    'ALL',
  )

  // Filtra apenas entidades em estágio de Prospecção / Aquisição
  const leadsAndProspects = parties.filter((p) => {
    const isLeadOrProspect =
      p.commercial_stage === 'LEAD' ||
      p.commercial_stage === 'LEAD_QUALIFICADO' ||
      p.commercial_stage === 'PROSPECT' ||
      p.commercial_stage === 'CADASTRO_EM_ANDAMENTO' ||
      !p.sap_customer_id

    if (!isLeadOrProspect) return false

    if (stageFilter === 'LEAD' && p.commercial_stage !== 'LEAD') return false
    if (stageFilter === 'LEAD_QUALIFICADO' && p.commercial_stage !== 'LEAD_QUALIFICADO')
      return false
    if (
      stageFilter === 'PROSPECT' &&
      p.commercial_stage !== 'PROSPECT' &&
      p.commercial_stage !== 'CADASTRO_EM_ANDAMENTO'
    )
      return false

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchEmpresa = p.razao_social.toLowerCase().includes(term)
      const matchFriendly = p.friendly_code.toLowerCase().includes(term)
      const matchCnpj = p.cnpj_cpf?.toLowerCase().includes(term)
      const matchCidade = p.cidade.toLowerCase().includes(term)
      const matchContato = p.contatos?.some((c) => c.nome.toLowerCase().includes(term))
      if (!matchEmpresa && !matchFriendly && !matchCnpj && !matchCidade && !matchContato)
        return false
    }

    return true
  })

  return (
    <div className="space-y-4">
      {/* HEADER DA TAB COM CONTROLE DE FILTROS & AÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/90 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Esteira de Prospecção: Leads & Prospects
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhe a qualificação comercial e abertura de cadastro sem duplicação de entidades.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar Lead por nome, cidade, contato..."
              className="h-9 w-60 bg-slate-950 border-slate-800 pl-9 text-xs rounded-xl"
            />
          </div>

          <Button
            size="sm"
            onClick={onOpenCadastroModal}
            className="h-9 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" /> [ + Cadastrar Lead ]
          </Button>
        </div>
      </div>

      {/* FILTROS RÁPIDOS POR ESTÁGIO COMERCIAL */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'ALL' as const, label: 'Todos em Prospecção', count: leadsAndProspects.length },
          {
            id: 'LEAD' as const,
            label: 'Leads Novos',
            count: parties.filter((p) => p.commercial_stage === 'LEAD').length,
          },
          {
            id: 'LEAD_QUALIFICADO' as const,
            label: 'Leads Qualificados (IA)',
            count: parties.filter((p) => p.commercial_stage === 'LEAD_QUALIFICADO').length,
          },
          {
            id: 'PROSPECT' as const,
            label: 'Prospects (Ficha Aberta)',
            count: parties.filter(
              (p) =>
                p.commercial_stage === 'PROSPECT' || p.commercial_stage === 'CADASTRO_EM_ANDAMENTO',
            ).length,
          },
        ].map((btn) => {
          const isSelected = stageFilter === btn.id
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setStageFilter(btn.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{btn.label}</span>
              <Badge
                className={`text-[10px] px-1.5 py-0 rounded-md font-mono ${
                  isSelected ? 'bg-sky-800 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {btn.count}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* TABELA DE LEADS & PROSPECTS */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-950/60">
            <TableRow className="border-b border-slate-800">
              <TableHead className="text-slate-400 text-xs font-bold uppercase">
                CRM Mestre
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-bold uppercase">
                Empresa & Segmento
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-bold uppercase">
                Contato Principal
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-bold uppercase">
                IA Lead Score
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-bold uppercase">
                Potencial Siderúrgico
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-bold uppercase">
                Estágio & Status
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-bold uppercase text-right">
                Ação Direta
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leadsAndProspects.map((party) => (
              <TableRow
                key={party.crm_party_id}
                className="border-b border-slate-800/60 hover:bg-slate-800/40 text-xs"
              >
                {/* CRM Mestre */}
                <TableCell className="font-mono">
                  <strong className="text-sky-400 block">{party.friendly_code}</strong>
                  <span className="text-[10px] text-slate-500 font-sans">
                    Origem: {party.origem_comercial}
                  </span>
                </TableCell>

                {/* Empresa */}
                <TableCell>
                  <strong className="text-white block truncate max-w-[220px]">
                    {party.razao_social}
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    {party.cidade}/{party.uf} · {party.segmento}
                  </span>
                </TableCell>

                {/* Contato Principal */}
                <TableCell>
                  <span className="text-slate-200 block font-semibold">
                    {party.contatos?.[0]?.nome || 'Não informado'}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {party.whatsapp || party.telefone || 'Sem telefone'}
                  </span>
                </TableCell>

                {/* IA Lead Score */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <strong className="text-amber-300 font-serif text-sm">
                      {party.lead_score}
                    </strong>
                    <span className="text-[10px] text-slate-500">/ 100</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Probabilidade: {party.probabilidade_comercial}%
                  </span>
                </TableCell>

                {/* Potencial */}
                <TableCell>
                  <span className="text-emerald-400 font-bold block">
                    {party.potencial_mensal_tons} t/mês
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                    {party.produto_interesse || 'Perfis & Chapas'}
                  </span>
                </TableCell>

                {/* Estágio & Status */}
                <TableCell>
                  <Badge
                    className={`text-[10px] mb-1 ${
                      party.commercial_stage === 'LEAD'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : party.commercial_stage === 'LEAD_QUALIFICADO'
                          ? 'bg-sky-950 text-sky-300 border-sky-800'
                          : 'bg-purple-950 text-purple-300 border-purple-800'
                    }`}
                  >
                    {party.commercial_stage.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-[10px] text-slate-500 block">
                    Cad: {party.registration_status}
                  </span>
                </TableCell>

                {/* Ações */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {party.commercial_stage === 'LEAD' ? (
                      <Button
                        size="sm"
                        onClick={() => onOpenQualificarModal(party)}
                        className="h-7 text-[11px] bg-amber-600 hover:bg-amber-500 text-white rounded-lg gap-1 shadow-xs"
                      >
                        <Sparkles className="w-3 h-3" /> Qualificar
                      </Button>
                    ) : party.commercial_stage === 'LEAD_QUALIFICADO' ? (
                      <Button
                        size="sm"
                        onClick={() => onOpenFichaModal(party)}
                        className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg gap-1 shadow-xs"
                      >
                        <FileText className="w-3 h-3" /> Iniciar Cadastro
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenFichaModal(party)}
                        className="h-7 text-[11px] border-purple-800 text-purple-300 hover:bg-purple-950/50 rounded-lg gap-1"
                      >
                        Ver Ficha
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onOpenParty(party.crm_party_id)}
                      className="h-7 text-[11px] text-sky-400 hover:bg-sky-950/40 rounded-lg"
                    >
                      CRM 360º
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {leadsAndProspects.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                  Nenhum Lead ou Prospect encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
