// src/components/gestao-clientes/WhoToContactPanel.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  PhoneCall,
  MessageSquare,
  Mail,
  FileSpreadsheet,
  ExternalLink,
  CheckSquare,
  Square,
  ListTodo,
} from 'lucide-react'
import type { CustomerRecord } from '@/types/customer_management'
import { CreateBulkTasksModal } from '@/components/central-acoes/CreateBulkTasksModal'
import { StatusBadge } from './shared/GestaoClientesUiKit'

interface SuggestionItem {
  id: string
  cliente: CustomerRecord
  motivo: string
  produtoSugerido: {
    codigo: string
    descricao: string
    motivo: string
  }
  acaoRecomendada: 'Ligar' | 'WhatsApp' | 'E-mail' | 'Enviar Catálogo'
  score: number
  prioridade: 'URGENTE' | 'ALTA' | 'MEDIA'
}

interface WhoToContactPanelProps {
  suggestions: SuggestionItem[]
  onSelectClient: (client: CustomerRecord) => void
  onExecuteAction?: (actionType: string, client: CustomerRecord) => void
}

export function WhoToContactPanel({
  suggestions,
  onSelectClient,
  onExecuteAction,
}: WhoToContactPanelProps) {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkModalOpen, setBulkModalOpen] = useState(false)

  const handleToggleSingle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleSelectTop10 = () => {
    const top10 = suggestions.slice(0, 10).map((s) => s.id)
    setSelectedIds(top10)
  }

  const handleSelectAll = () => {
    if (selectedIds.length === suggestions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(suggestions.map((s) => s.id))
    }
  }

  const selectedCustomers = suggestions
    .filter((s) => selectedIds.includes(s.id))
    .map((s) => s.cliente)

  const handleAction = (sug: SuggestionItem) => {
    if (onExecuteAction) {
      onExecuteAction(sug.acaoRecomendada, sug.cliente)
    } else {
      onSelectClient(sug.cliente)
    }
  }

  return (
    <div className="space-y-4">
      {/* CABEÇALHO DO PAINEL QUEM DEVO CONTATAR (Fundo Claro / Azul Institucional) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#003A70]/10 border border-[#003A70]/20 text-[#003A70] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#003A70] tracking-tight">
                Quem Devo Contatar Hoje?
              </h3>
              <Badge
                variant="outline"
                className="bg-[#EBF3FA] text-[#003A70] border-[#003A70]/30 text-[10px] font-medium font-mono"
              >
                IA Priorizada ({suggestions.length})
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Recomendações diárias com motivo, produto sugerido e abordagem comercial pronta.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            size="sm"
            onClick={() => navigate('/central-acoes')}
            className="h-8 text-xs bg-[#003A70] hover:bg-[#002850] text-white font-semibold rounded-xl gap-1.5 shadow-2xs"
          >
            <span>Abrir Central de Ações</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Barra de Seleção em Lote */}
      <div className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-600 font-semibold">Seleção Rápida:</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectTop10}
            className="h-7 text-xs border-[#003A70]/30 bg-[#EBF3FA] text-[#003A70] hover:bg-[#003A70]/15 rounded-xl gap-1 font-medium"
          >
            <Sparkles className="w-3 h-3 text-[#003A70]" />
            <span>Selecionar Top 10</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectAll}
            className="h-7 text-xs border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl gap-1"
          >
            {selectedIds.length === suggestions.length && suggestions.length > 0 ? (
              <CheckSquare className="w-3.5 h-3.5 text-[#003A70]" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>
              {selectedIds.length === suggestions.length && suggestions.length > 0
                ? 'Desmarcar Todos'
                : 'Selecionar Todos'}
            </span>
          </Button>
        </div>

        {selectedIds.length > 0 && (
          <Button
            size="sm"
            onClick={() => setBulkModalOpen(true)}
            className="h-7 text-xs bg-[#003A70] hover:bg-[#002850] text-white font-semibold rounded-xl gap-1.5 shadow-2xs animate-fade-in"
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Criar Tarefas em Lote ({selectedIds.length})</span>
          </Button>
        )}
      </div>

      {/* Grid de Recomendações (Padronizado CIAFAL: Fundo branco, bordas neutras, sem neon) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((sug) => {
          const isSelected = selectedIds.includes(sug.id)
          const prioridadeVariant =
            sug.prioridade === 'URGENTE'
              ? 'critical'
              : sug.prioridade === 'ALTA'
                ? 'warning'
                : 'neutral'

          return (
            <Card
              key={sug.id}
              className={`p-4 bg-white border rounded-2xl space-y-3 flex flex-col justify-between transition-all shadow-2xs ${
                isSelected
                  ? 'border-[#003A70] ring-2 ring-[#003A70]/20 bg-[#EBF3FA]/20'
                  : 'border-slate-200 hover:border-[#003A70]/40'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSingle(sug.id)}
                      className="rounded border-slate-300 text-[#003A70] focus:ring-[#003A70] cursor-pointer w-4 h-4"
                    />
                    <StatusBadge label={sug.prioridade} variant={prioridadeVariant} dot />
                  </div>
                  <span className="font-mono text-[10px] text-[#003A70] font-bold bg-[#EBF3FA] px-2 py-0.5 rounded-md border border-[#003A70]/20">
                    Score {sug.score}
                  </span>
                </div>

                <div>
                  <button
                    onClick={() => onSelectClient(sug.cliente)}
                    className="text-left font-serif font-bold text-sm text-slate-900 hover:text-[#003A70] transition-colors block line-clamp-1"
                  >
                    {sug.cliente.nomeFantasia || sug.cliente.razaoSocial}
                  </button>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {sug.cliente.cidade} - {sug.cliente.uf} · {sug.cliente.segmento}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Motivo IA:
                  </span>
                  <p className="text-[11px] leading-snug text-slate-700 line-clamp-2">
                    {sug.motivo}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#EBF3FA]/60 border border-[#003A70]/20 text-xs space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-[#003A70] block">
                    Produto Recomendado:
                  </span>
                  <strong className="text-slate-900 text-[11px] block truncate">
                    {sug.produtoSugerido.descricao}
                  </strong>
                  <p className="text-[10px] text-slate-600 leading-tight line-clamp-2">
                    {sug.produtoSugerido.motivo}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAction(sug)}
                  className="flex-1 h-8 text-xs bg-[#003A70] hover:bg-[#002850] text-white font-semibold rounded-xl gap-1 shadow-2xs"
                >
                  {sug.acaoRecomendada === 'Ligar' && <PhoneCall className="w-3.5 h-3.5" />}
                  {sug.acaoRecomendada === 'WhatsApp' && <MessageSquare className="w-3.5 h-3.5" />}
                  {sug.acaoRecomendada === 'E-mail' && <Mail className="w-3.5 h-3.5" />}
                  {sug.acaoRecomendada === 'Enviar Catálogo' && (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>{sug.acaoRecomendada}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectClient(sug.cliente)}
                  className="h-8 text-xs border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#003A70] rounded-xl font-medium"
                >
                  Ver 360º
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Modal de Criação de Tarefas em Lote */}
      <CreateBulkTasksModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        clientes={selectedCustomers}
        origemPadrao="quem_devo_contatar"
        onTasksCreated={() => {
          setSelectedIds([])
        }}
      />
    </div>
  )
}
