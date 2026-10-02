// src/components/gestao-clientes/LeadsProspectsTab.tsx
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
import { Search, UserPlus, Sparkles, FileText } from 'lucide-react'
import type { CrmPartyRecord } from '@/types/crm_party'
import { StatusBadge } from './shared/GestaoClientesUiKit'

interface LeadsProspectsTabProps {
  parties: CrmPartyRecord[]
  onOpenParty: (partyId: string) => void
  onOpenCadastroModal: () => void
  onOpenQualificarModal: (party: CrmPartyRecord) => void
  onOpenFichaModal: (party: CrmPartyRecord) => void
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

  // Filtragem dos registros da esteira de prospecção (Regras intocadas)
  const leadsAndProspects = parties.filter((p) => {
    const isLeadOrProspect =
      p.commercial_stage === 'LEAD' ||
      p.commercial_stage === 'LEAD_QUALIFICADO' ||
      p.commercial_stage === 'PROSPECT' ||
      p.commercial_stage === 'CADASTRO_EM_ANDAMENTO'

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
      const matchName =
        p.razao_social.toLowerCase().includes(term) ||
        (p.nome_fantasia && p.nome_fantasia.toLowerCase().includes(term))
      const matchDoc = p.cnpj_cpf.includes(term)
      const matchCity = p.cidade.toLowerCase().includes(term)
      const matchContact = p.contatos?.some((c) => c.nome.toLowerCase().includes(term))
      return matchName || matchDoc || matchCity || matchContact
    }

    return true
  })

  return (
    <div className="space-y-4">
      {/* HEADER DA TAB COM CONTROLE DE FILTROS & AÇÃO (Fundo Claro / Azul Institucional) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-[#003A70] tracking-tight">
            Esteira de Prospecção: Leads & Prospects
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe a qualificação comercial e abertura de cadastro sem duplicação de entidades.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar Lead por nome, cidade, contato..."
              className="h-9 w-60 bg-white border-slate-200 pl-9 text-xs rounded-xl focus-visible:ring-[#003A70]"
            />
          </div>

          <Button
            size="sm"
            onClick={onOpenCadastroModal}
            className="h-9 text-xs bg-[#003A70] hover:bg-[#002850] text-white font-semibold rounded-xl gap-1.5 shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Cadastrar Lead</span>
          </Button>
        </div>
      </div>

      {/* FILTROS RÁPIDOS POR ESTÁGIO COMERCIAL (Estilo Padronizado CIAFAL) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
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
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border select-none ${
                isSelected
                  ? 'bg-[#003A70] text-white border-[#003A70] font-bold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-[#003A70] hover:bg-slate-50'
              }`}
            >
              <span>{btn.label}</span>
              <Badge
                className={`text-[10px] px-1.5 py-0 rounded-md font-mono border-none ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {btn.count}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* TABELA DE LEADS & PROSPECTS (Fundo Branco, Bordas Suaves, Tipografia Nítida) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b border-slate-200">
              <TableHead className="text-slate-600 text-[11px] font-bold uppercase">
                CRM Mestre
              </TableHead>
              <TableHead className="text-slate-600 text-[11px] font-bold uppercase">
                Empresa & Segmento
              </TableHead>
              <TableHead className="text-slate-600 text-[11px] font-bold uppercase">
                Contato Principal
              </TableHead>
              <TableHead className="text-slate-600 text-[11px] font-bold uppercase">
                IA Lead Score
              </TableHead>
              <TableHead className="text-slate-600 text-[11px] font-bold uppercase">
                Potencial Siderúrgico
              </TableHead>
              <TableHead className="text-slate-600 text-[11px] font-bold uppercase">
                Estágio & Status
              </TableHead>
              <TableHead className="text-slate-600 text-[11px] font-bold uppercase text-right">
                Ação Direta
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leadsAndProspects.map((party) => {
              const stageVariant =
                party.commercial_stage === 'LEAD'
                  ? 'warning'
                  : party.commercial_stage === 'LEAD_QUALIFICADO'
                    ? 'positive'
                    : 'default'

              return (
                <TableRow
                  key={party.crm_party_id}
                  className="border-b border-slate-100 hover:bg-slate-50/70 text-xs transition-colors"
                >
                  {/* CRM Mestre */}
                  <TableCell className="font-mono">
                    <strong className="text-[#003A70] block font-semibold">
                      {party.friendly_code}
                    </strong>
                    <span className="text-[10px] text-slate-500 font-sans">
                      Origem: {party.origem_comercial}
                    </span>
                  </TableCell>

                  {/* Empresa */}
                  <TableCell>
                    <strong className="text-slate-900 block truncate max-w-[220px]">
                      {party.razao_social}
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      {party.cidade}/{party.uf} · {party.segmento}
                    </span>
                  </TableCell>

                  {/* Contato Principal */}
                  <TableCell>
                    <span className="text-slate-800 block font-medium">
                      {party.contatos?.[0]?.nome || 'Não informado'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-600">
                      {party.whatsapp || party.telefone || 'Sem telefone'}
                    </span>
                  </TableCell>

                  {/* IA Lead Score */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#003A70]" />
                      <strong className="text-[#003A70] font-serif text-sm font-bold">
                        {party.lead_score}
                      </strong>
                      <span className="text-[10px] text-slate-400">/ 100</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Probabilidade: {party.probabilidade_comercial}%
                    </span>
                  </TableCell>

                  {/* Potencial */}
                  <TableCell>
                    <span className="text-slate-900 font-bold block">
                      {party.potencial_mensal_tons} t/mês
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                      {party.produto_interesse || 'Perfis & Chapas'}
                    </span>
                  </TableCell>

                  {/* Estágio & Status */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <StatusBadge
                        label={party.commercial_stage.replace(/_/g, ' ')}
                        variant={stageVariant}
                        dot
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Cad: {party.registration_status}
                      </span>
                    </div>
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {party.commercial_stage === 'LEAD' ? (
                        <Button
                          size="sm"
                          onClick={() => onOpenQualificarModal(party)}
                          className="h-7 text-[11px] bg-[#003A70] hover:bg-[#002850] text-white rounded-lg gap-1 shadow-2xs font-medium"
                        >
                          <Sparkles className="w-3 h-3" /> Qualificar
                        </Button>
                      ) : party.commercial_stage === 'LEAD_QUALIFICADO' ? (
                        <Button
                          size="sm"
                          onClick={() => onOpenFichaModal(party)}
                          className="h-7 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg gap-1 shadow-2xs font-medium"
                        >
                          <FileText className="w-3 h-3" /> Iniciar Cadastro
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenFichaModal(party)}
                          className="h-7 text-[11px] border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#003A70] rounded-lg gap-1 font-medium"
                        >
                          Ver Ficha
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenParty(party.crm_party_id)}
                        className="h-7 text-[11px] text-[#003A70] hover:bg-[#EBF3FA] rounded-lg font-medium"
                      >
                        CRM 360º
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}

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
