// src/components/gestao-clientes/WhoToContactPanel.tsx
import React, { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  PhoneCall,
  MessageSquare,
  Mail,
  FileSpreadsheet,
  ArrowRight,
  Clock,
  Building2,
  AlertTriangle,
  CheckSquare,
  Square,
  ListTodo,
  ExternalLink,
} from 'lucide-react'
import type { AIWhoToContactSuggestion, CustomerManagementItem } from '@/types/customer_management'
import { CreateBulkTasksModal } from '@/components/central-acoes/CreateBulkTasksModal'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface WhoToContactPanelProps {
  suggestions: AIWhoToContactSuggestion[]
  onSelectClient: (cliente: CustomerManagementItem) => void
  onQuickAction?: (cliente: CustomerManagementItem, acao: string) => void
}

export function WhoToContactPanel({
  suggestions,
  onSelectClient,
  onQuickAction,
}: WhoToContactPanelProps) {
  const navigate = useNavigate()

  // Seleção em Lote (Critério 4 do usuário: Selecionar Top 10, Selecionar Todos, Criar Tarefas em Lote)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkModalOpen, setBulkModalOpen] = useState(false)

  const handleAction = (sug: AIWhoToContactSuggestion) => {
    if (onQuickAction) {
      onQuickAction(sug.cliente, sug.acaoRecomendada)
    } else {
      toast.success(`Ação "${sug.acaoRecomendada}" iniciada para ${sug.cliente.nomeFantasia}`, {
        description: `Produto sugerido: ${sug.produtoSugerido.descricao}.`,
      })
    }
  }

  const handleSelectTop10 = () => {
    const top10 = suggestions.slice(0, 10).map((s) => s.id)
    setSelectedIds(top10)
    toast.info('Top 10 clientes prioritários selecionados!')
  }

  const handleSelectAll = () => {
    if (selectedIds.length === suggestions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(suggestions.map((s) => s.id))
    }
  }

  const handleToggleSingle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const selectedCustomers = useMemo(() => {
    return suggestions.filter((s) => selectedIds.includes(s.id)).map((s) => s.cliente)
  }, [suggestions, selectedIds])

  return (
    <div className="space-y-4">
      {/* Header com Integração para a Central de Ações */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 border border-sky-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-amber-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Quem Devo Contatar Hoje?
              <Badge className="bg-amber-500 text-slate-950 text-[10px] font-mono font-bold">
                IA Priorizada ({suggestions.length})
              </Badge>
            </h3>
            <p className="text-xs text-slate-300">
              Recomendações diárias com motivo, produto sugerido e abordagem comercial pronta.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => navigate('/central-acoes')}
            className="h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl gap-1.5 shadow-sm"
          >
            <span>Abrir Central de Ações</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Barra de Seleção em Lote (Critério 4: Selecionar Top 10 / Selecionar Todos / Criar Tarefas em Lote) */}
      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Seleção Rápida:</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectTop10}
            className="h-7 text-xs border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 rounded-xl gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Selecionar Top 10</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectAll}
            className="h-7 text-xs border-slate-700 bg-slate-950 text-slate-300 hover:text-white rounded-xl gap-1"
          >
            {selectedIds.length === suggestions.length && suggestions.length > 0 ? (
              <CheckSquare className="w-3 h-3 text-sky-400" />
            ) : (
              <Square className="w-3 h-3 text-slate-500" />
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
            className="h-7 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl gap-1.5 shadow-sm animate-fade-in"
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Criar Tarefas em Lote ({selectedIds.length})</span>
          </Button>
        )}
      </div>

      {/* Grid de Recomendações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((sug) => {
          const isSelected = selectedIds.includes(sug.id)

          return (
            <Card
              key={sug.id}
              className={`p-4 bg-slate-900/90 border-slate-800 rounded-3xl space-y-3 flex flex-col justify-between hover:border-sky-700/60 transition-all ${
                isSelected ? 'border-sky-500/60 bg-sky-950/20' : ''
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSingle(sug.id)}
                      className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500 cursor-pointer w-4 h-4"
                    />
                    <Badge
                      className={`text-[9px] font-bold border-none ${
                        sug.prioridade === 'URGENTE'
                          ? 'bg-rose-500 text-white'
                          : sug.prioridade === 'ALTA'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {sug.prioridade}
                    </Badge>
                  </div>
                  <span className="font-mono text-[10px] text-sky-400 font-bold">
                    Score {sug.score}
                  </span>
                </div>

                <div>
                  <button
                    onClick={() => onSelectClient(sug.cliente)}
                    className="text-left font-serif font-bold text-sm text-white hover:text-sky-300 transition-colors block"
                  >
                    {sug.cliente.nomeFantasia || sug.cliente.razaoSocial}
                  </button>
                  <span className="text-[10px] text-slate-400 block">
                    {sug.cliente.cidade} - {sug.cliente.uf} · {sug.cliente.segmento}
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">
                    Motivo IA:
                  </span>
                  <p className="text-[11px] leading-snug">{sug.motivo}</p>
                </div>

                <div className="p-2.5 rounded-2xl bg-sky-950/40 border border-sky-800/30 text-xs space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-sky-400 block">
                    Produto Recomendado:
                  </span>
                  <strong className="text-white text-[11px] block">
                    {sug.produtoSugerido.descricao}
                  </strong>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {sug.produtoSugerido.motivo}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAction(sug)}
                  className="flex-1 h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl gap-1 shadow-xs"
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
                  className="h-8 text-xs border-slate-700 bg-slate-950 text-slate-300 hover:text-white rounded-xl"
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
