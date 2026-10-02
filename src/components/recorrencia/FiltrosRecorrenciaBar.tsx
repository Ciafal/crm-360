// src/components/recorrencia/FiltrosRecorrenciaBar.tsx
import React, { useState } from 'react'
import {
  Filter,
  RotateCcw,
  Clock,
  Building,
  User,
  MapPin,
  Tag,
  ShieldAlert,
  CreditCard,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FiltrosRecorrencia, UnitMode } from '@/types/recorrencia'

interface FiltrosRecorrenciaBarProps {
  filtros: FiltrosRecorrencia
  onChangeFiltros: (novos: FiltrosRecorrencia) => void
  onResetFiltros: () => void
  ultimaAtualizacao?: string
  totalResultados: number
  totalOriginal: number
  isAdminOrDirector?: boolean
  onOpenConfigModal?: () => void
}

export function FiltrosRecorrenciaBar({
  filtros,
  onChangeFiltros,
  onResetFiltros,
  ultimaAtualizacao = '15/10/2024 10:30',
  totalResultados,
  totalOriginal,
  isAdminOrDirector = false,
  onOpenConfigModal,
}: FiltrosRecorrenciaBarProps) {
  const [expanded, setExpanded] = useState(false)

  const handleUnitToggle = (mode: UnitMode) => {
    onChangeFiltros({ ...filtros, unitMode: mode })
  }

  const updateField = (key: keyof FiltrosRecorrencia, value: any) => {
    onChangeFiltros({ ...filtros, [key]: value })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-3 sticky top-[60px] z-20 backdrop-blur-md">
      {/* Linha Principal de Filtros & Controles */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          {/* Seletor R$ | Toneladas (CIAFAL Nativo) */}
          <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200">
            <Button
              type="button"
              size="sm"
              variant={filtros.unitMode === 'BRL' ? 'default' : 'ghost'}
              onClick={() => handleUnitToggle('BRL')}
              className={`h-7 px-2.5 text-xs font-semibold rounded-lg transition-all ${
                filtros.unitMode === 'BRL'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-primary'
              }`}
            >
              R$ (Valor)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filtros.unitMode === 'TONS' ? 'default' : 'ghost'}
              onClick={() => handleUnitToggle('TONS')}
              className={`h-7 px-2.5 text-xs font-semibold rounded-lg transition-all ${
                filtros.unitMode === 'TONS'
                  ? 'bg-[#003A70] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#003A70]'
              }`}
            >
              Toneladas (t)
            </Button>
          </div>

          {/* Busca Rápida de Cliente */}
          <div className="relative w-48 sm:w-60">
            <Input
              value={filtros.cliente}
              onChange={(e) => updateField('cliente', e.target.value)}
              placeholder="Filtrar cliente, SAP, CNPJ..."
              className="h-8 text-xs rounded-xl pl-2.5 bg-slate-50/70 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Filtro Rápido: Vendedor */}
          <Select
            value={filtros.vendedor || 'TODOS'}
            onValueChange={(val) => updateField('vendedor', val)}
          >
            <SelectTrigger className="h-8 text-xs w-44 rounded-xl bg-slate-50/70 border-slate-200">
              <User className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os Vendedores</SelectItem>
              <SelectItem value="Carlos Mendonça">Carlos Mendonça</SelectItem>
              <SelectItem value="Mariana Azevedo">Mariana Azevedo</SelectItem>
              <SelectItem value="João Pedro Representações">João Pedro Representações</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Rápido: Classe de Recorrência */}
          <Select
            value={filtros.classeRecorrencia || 'TODOS'}
            onValueChange={(val) => updateField('classeRecorrencia', val)}
          >
            <SelectTrigger className="h-8 text-xs w-36 rounded-xl bg-slate-50/70 border-slate-200">
              <Layers className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
              <SelectValue placeholder="Recorrência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todas Classes</SelectItem>
              <SelectItem value="Mensal">Mensal (≥55%)</SelectItem>
              <SelectItem value="Bimestral">Bimestral (≥30%)</SelectItem>
              <SelectItem value="Trimestral">Trimestral (≥15%)</SelectItem>
              <SelectItem value="Esporádico">Esporádico (&lt;15%)</SelectItem>
            </SelectContent>
          </Select>

          {/* Botão de Expandir Filtros Avançados */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 text-xs px-2.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-1"
          >
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span>Filtros</span>
            {expanded ? (
              <ChevronUp className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </Button>

          {/* Limpar Filtros */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFiltros}
            className="h-8 text-xs px-2 rounded-xl text-slate-500 hover:text-rose-600 gap-1"
            title="Limpar todos os filtros"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </Button>
        </div>

        {/* Lado Direito: Selo Atualizado em + Total Resultados + Configuração Admin */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <Badge
            variant="outline"
            className="bg-slate-50 text-slate-600 border-slate-200 text-[11px] font-mono flex items-center gap-1.5 py-1 px-2.5"
          >
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Atualizado em: {ultimaAtualizacao}</span>
          </Badge>

          <span className="text-[11px] text-slate-500 hidden md:inline">
            Exibindo <strong>{totalResultados}</strong> de {totalOriginal} clientes
          </span>

          {isAdminOrDirector && onOpenConfigModal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenConfigModal}
              className="h-8 text-[11px] rounded-xl border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100 font-semibold"
            >
              ⚙ Parâmetros & Thresholds
            </Button>
          )}
        </div>
      </div>

      {/* Grade de Filtros Secundários Expandida */}
      {expanded && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 animate-in fade-in-50">
          {/* Empresa */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Empresa
            </label>
            <Select
              value={filtros.empresa || 'TODOS'}
              onValueChange={(val) => updateField('empresa', val)}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas Empresas</SelectItem>
                <SelectItem value="CIAFAL Ferro & Aço - Matriz Contagem">
                  CIAFAL Matriz Contagem
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Representante */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Representante
            </label>
            <Select
              value={filtros.representante || 'TODOS'}
              onValueChange={(val) => updateField('representante', val)}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Representante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos Representantes</SelectItem>
                <SelectItem value="João Pedro Representações">João Pedro Representações</SelectItem>
                <SelectItem value="CIAFAL Matriz Vendas">CIAFAL Matriz Vendas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* UF */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">UF</label>
            <Select value={filtros.uf || 'TODOS'} onValueChange={(val) => updateField('uf', val)}>
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas UFs</SelectItem>
                <SelectItem value="MG">Minas Gerais (MG)</SelectItem>
                <SelectItem value="SP">São Paulo (SP)</SelectItem>
                <SelectItem value="RJ">Rio de Janeiro (RJ)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cidade */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Cidade
            </label>
            <Select
              value={filtros.cidade || 'TODOS'}
              onValueChange={(val) => updateField('cidade', val)}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas Cidades</SelectItem>
                <SelectItem value="Contagem">Contagem</SelectItem>
                <SelectItem value="Betim">Betim</SelectItem>
                <SelectItem value="Belo Horizonte">Belo Horizonte</SelectItem>
                <SelectItem value="Uberlândia">Uberlândia</SelectItem>
                <SelectItem value="Ipatinga">Ipatinga</SelectItem>
                <SelectItem value="Juiz de Fora">Juiz de Fora</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Setor Industrial */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Setor Industrial
            </label>
            <Select
              value={filtros.setorIndustrial || 'TODOS'}
              onValueChange={(val) => updateField('setorIndustrial', val)}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os Setores</SelectItem>
                <SelectItem value="Indústria">Indústria</SelectItem>
                <SelectItem value="Construção Civil">Construção Civil</SelectItem>
                <SelectItem value="Agronegócio">Agronegócio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Segmento RFM */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Segmento RFM
            </label>
            <Select
              value={filtros.segmentoRFM || 'TODOS'}
              onValueChange={(val) => updateField('segmentoRFM', val)}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="RFM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos Segmentos</SelectItem>
                <SelectItem value="Campeões">Campeões</SelectItem>
                <SelectItem value="Clientes Leais">Clientes Leais</SelectItem>
                <SelectItem value="Potenciais Leais">Potenciais Leais</SelectItem>
                <SelectItem value="Promissores">Promissores</SelectItem>
                <SelectItem value="Precisam de Atenção">Precisam de Atenção</SelectItem>
                <SelectItem value="Em Risco">Em Risco</SelectItem>
                <SelectItem value="Não Podemos Perder">Não Podemos Perder</SelectItem>
                <SelectItem value="Hibernando">Hibernando</SelectItem>
                <SelectItem value="Perdidos">Perdidos</SelectItem>
                <SelectItem value="Novos Clientes">Novos Clientes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Risco de Perda / Sinais */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Risco / Alertas
            </label>
            <Select
              value={filtros.riscoPerda || 'TODOS'}
              onValueChange={(val) => updateField('riscoPerda', val)}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Risco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos Sinais</SelectItem>
                <SelectItem value="PARADA_ABRUPTA">Parada Abrupta</SelectItem>
                <SelectItem value="QUEDA_FORTE">Queda Forte</SelectItem>
                <SelectItem value="SEM_RISCO">Sem Risco</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Situação de Crédito SAP */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Crédito SAP (F.35)
            </label>
            <Select
              value={filtros.situacaoCredito || 'TODOS'}
              onValueChange={(val) => updateField('situacaoCredito', val)}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Crédito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas Situações</SelectItem>
                <SelectItem value="Liberado">Liberado</SelectItem>
                <SelectItem value="Em Análise">Em Análise / Restrito</SelectItem>
                <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                <SelectItem value="Sem informação SAP">Sem informação SAP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
