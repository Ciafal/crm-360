import React, { useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Package,
  Layers,
  CheckCircle,
  HelpCircle,
  Clock,
  History,
  TrendingUp,
  Truck,
  Factory,
  ShieldCheck,
  X,
  AlertTriangle,
} from 'lucide-react'
import type { SmartCrossSellSuggestion } from '@/services/cross_sell_engine'
import { formatBRL, formatTons } from '@/pages/NovaCotacao'

interface SmartCrossSellPanelProps {
  customerName: string
  suggestions: SmartCrossSellSuggestion[]
  onAddSuggestion: (sug: SmartCrossSellSuggestion) => void
  onDismissSuggestion?: (sug: SmartCrossSellSuggestion) => void
}

export function SmartCrossSellPanel({
  customerName,
  suggestions,
  onAddSuggestion,
  onDismissSuggestion,
}: SmartCrossSellPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedTraceability, setSelectedTraceability] = useState<SmartCrossSellSuggestion | null>(
    null,
  )
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  const activeSuggestions = suggestions.filter((s) => !dismissedIds.includes(s.id))

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const handleDismiss = (sug: SmartCrossSellSuggestion) => {
    setDismissedIds((prev) => [...prev, sug.id])
    onDismissSuggestion?.(sug)
  }

  if (activeSuggestions.length === 0) return null

  return (
    <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-slate-100 border border-indigo-500/30 space-y-3 shadow-md animate-fade-in">
      {/* Topo do Painel de Oportunidades Inteligentes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-indigo-800/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-400/30">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                OPORTUNIDADES PARA ESTE CLIENTE ({customerName})
              </span>
              <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[9px] font-mono">
                {activeSuggestions.length} Recomendações Ativas
              </Badge>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              ✨ Sugestões baseadas no histórico real de compras (QLIK/SAP), intervalo de recompra e
              disponibilidade de estoque/PCP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => scroll('left')}
            className="h-7 w-7 p-0 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => scroll('right')}
            className="h-7 w-7 p-0 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Carrossel Horizontal de Cards Inteligentes */}
      <div
        ref={scrollRef}
        className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {activeSuggestions.map((sug) => {
          const isLowStock = sug.baseRastreabilidade.estoqueDisponivelTons < 5.0

          return (
            <div
              key={sug.id}
              className="min-w-[310px] max-w-[310px] p-3.5 rounded-2xl bg-slate-900/95 border border-slate-800 hover:border-indigo-400/60 transition-all flex flex-col justify-between space-y-3 shrink-0 snap-start shadow-md relative group"
            >
              <div className="space-y-2">
                {/* Header do Card: Tag da Categoria + Score IA */}
                <div className="flex items-center justify-between gap-1">
                  <Badge
                    className={`text-[9px] font-bold px-2 py-0.5 border ${
                      sug.tipo === 'RECOMPRA_ATRASO'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                        : sug.tipo === 'RECOMPRA_PROVAVEL'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                          : sug.tipo === 'CROSS_SELL_HISTORICO'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                            : 'bg-purple-500/20 text-purple-300 border-purple-400/40'
                    }`}
                  >
                    {sug.tipoLabel}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] font-bold bg-purple-950/70 text-purple-300 border-purple-600/40"
                  >
                    Score: {sug.scoreOportunidade}/100
                  </Badge>
                </div>

                {/* Código e Descrição do Material */}
                <div>
                  <span className="font-mono text-[11px] font-bold text-sky-400 block">
                    {sug.codigo}
                  </span>
                  <strong className="text-xs text-white block line-clamp-1">{sug.descricao}</strong>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {sug.familia} {sug.dimensao ? `· ${sug.dimensao}` : ''}
                  </span>
                </div>

                {/* Métricas Rápidas do Histórico Real */}
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-950/70 rounded-xl border border-slate-800/80 text-[10px]">
                  <div>
                    <span className="text-slate-400 block">Última compra:</span>
                    <strong className="text-slate-200">
                      {sug.baseRastreabilidade.ultimaCompraData}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Compra média:</span>
                    <strong className="text-slate-200 font-mono">
                      {formatTons(sug.baseRastreabilidade.volumeMedioTons)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Frequência:</span>
                    <strong className="text-slate-200">
                      a cada {sug.baseRastreabilidade.intervaloMedioDias} dias
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Estoque disp.:</span>
                    <strong
                      className={`font-mono ${isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}
                    >
                      {formatTons(sug.baseRastreabilidade.estoqueDisponivelTons)}
                    </strong>
                  </div>
                </div>

                {/* Motivo e Rastreabilidade Curta */}
                <div className="p-2 bg-indigo-950/40 rounded-xl border border-indigo-900/50 space-y-1 text-[10px]">
                  <div className="flex items-center gap-1 text-indigo-300 font-bold">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Motivo da sugestão IA:</span>
                  </div>
                  <p className="text-slate-300 leading-tight line-clamp-2">"{sug.motivoIA}"</p>
                </div>
              </div>

              {/* Botões de Ação do Vendedor */}
              <div className="space-y-1.5 pt-1">
                <Button
                  size="sm"
                  type="button"
                  onClick={() => onAddSuggestion(sug)}
                  className="w-full h-7 text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> + Adicionar à cotação
                </Button>

                <div className="flex items-center justify-between gap-1 text-[10px]">
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => setSelectedTraceability(sug)}
                    className="h-6 px-2 text-indigo-300 hover:text-white hover:bg-slate-800 text-[10px] rounded-lg gap-1"
                  >
                    <History className="w-3 h-3" /> Ver histórico
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => handleDismiss(sug)}
                    className="h-6 px-2 text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 text-[10px] rounded-lg gap-1"
                  >
                    <X className="w-3 h-3" /> Dispensar
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL DE RASTREABILIDADE TOTAL E TRANSPARÊNCIA DA IA */}
      <Dialog
        open={!!selectedTraceability}
        onOpenChange={(open) => !open && setSelectedTraceability(null)}
      >
        <DialogContent className="sm:max-w-md bg-white text-slate-900 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Rastreabilidade & Base da
              Recomendação IA
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedTraceability?.codigo} — {selectedTraceability?.descricao}
            </DialogDescription>
          </DialogHeader>

          {selectedTraceability && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                <span className="font-bold text-purple-900 block">
                  {selectedTraceability.tipoLabel} ({selectedTraceability.scoreLabel})
                </span>
                <p className="text-slate-700">{selectedTraceability.motivoIA}</p>
              </div>

              {/* Tabela de Evidências Reais do Histórico */}
              <div className="p-3 bg-slate-50 border border-border/60 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                  Dados de Origem (SAP ECC / Qlik Sense)
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Compras nos últimos 12m:</span>
                    <strong className="block text-slate-900">
                      {selectedTraceability.baseRastreabilidade.compras12m} pedidos
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volume Médio por Compra:</span>
                    <strong className="block text-slate-900 font-mono">
                      {formatTons(selectedTraceability.baseRastreabilidade.volumeMedioTons)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Intervalo Médio Habitual:</span>
                    <strong className="block text-slate-900">
                      {selectedTraceability.baseRastreabilidade.intervaloMedioDias} dias
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tempo desde a Última Compra:</span>
                    <strong className="block text-slate-900">
                      {selectedTraceability.baseRastreabilidade.diasSemComprar} dias
                    </strong>
                  </div>
                </div>
              </div>

              {/* Dados de Estoque e Viabilidade de Atendimento */}
              <div className="p-3 bg-slate-50 border border-border/60 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                  Disponibilidade & Viabilidade Operacional
                </span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estoque Disponível SAP:</span>
                    <strong className="font-mono">
                      {formatTons(selectedTraceability.baseRastreabilidade.estoqueDisponivelTons)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Planta / Depósito:</span>
                    <span>
                      {selectedTraceability.baseRastreabilidade.planta} (
                      {selectedTraceability.baseRastreabilidade.deposito})
                    </span>
                  </div>
                  {selectedTraceability.baseRastreabilidade.producaoPrevista && (
                    <div className="flex justify-between text-purple-700">
                      <span>Produção Prevista (PCP):</span>
                      <strong>{selectedTraceability.baseRastreabilidade.producaoPrevista}</strong>
                    </div>
                  )}
                  {selectedTraceability.baseRastreabilidade.previsaoLogisticaTMS && (
                    <div className="flex justify-between text-blue-700">
                      <span>Previsão Logística (TMS):</span>
                      <strong>
                        {selectedTraceability.baseRastreabilidade.previsaoLogisticaTMS}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              size="sm"
              onClick={() => {
                if (selectedTraceability) onAddSuggestion(selectedTraceability)
                setSelectedTraceability(null)
              }}
              className="bg-primary text-white text-xs font-semibold rounded-xl"
            >
              + Adicionar este Produto à Cotação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
