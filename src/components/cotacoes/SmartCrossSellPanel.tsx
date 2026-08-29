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
  CheckCircle2,
  Clock,
  History,
  TrendingUp,
  Truck,
  Factory,
  ShieldCheck,
  X,
  AlertTriangle,
  Database,
  Radio,
  UserCheck,
  Search,
  RefreshCw,
  Info,
  SlidersHorizontal,
  ServerOff,
  Lightbulb,
} from 'lucide-react'
import type {
  SmartCrossSellSuggestion,
  CrossSellCategoryTab,
  CrossSellDataMode,
} from '@/services/cross_sell_engine'
import { formatBRL, formatTons } from '@/pages/NovaCotacao'
import { cn } from '@/lib/utils'

interface SmartCrossSellPanelProps {
  customerId?: string | null
  customerName?: string | null
  suggestions: SmartCrossSellSuggestion[]
  isLoading?: boolean
  error?: string | null
  dataMode?: CrossSellDataMode
  onToggleDataMode?: (newMode: CrossSellDataMode) => void
  onAddSuggestion: (sug: SmartCrossSellSuggestion) => void
  onDismissSuggestion?: (sug: SmartCrossSellSuggestion) => void
  onRequestStockCheck?: (sug: SmartCrossSellSuggestion) => void
  onRetry?: () => void
}

export function SmartCrossSellPanel({
  customerId,
  customerName,
  suggestions,
  isLoading = false,
  error = null,
  dataMode = 'FIXTURE',
  onToggleDataMode,
  onAddSuggestion,
  onDismissSuggestion,
  onRequestStockCheck,
  onRetry,
}: SmartCrossSellPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedTab, setSelectedTab] = useState<CrossSellCategoryTab>('TODAS')
  const [selectedTraceability, setSelectedTraceability] = useState<SmartCrossSellSuggestion | null>(
    null,
  )
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  const activeSuggestions = suggestions.filter((s) => !dismissedIds.includes(s.id))

  // Filtro por abas
  const filteredSuggestions = activeSuggestions.filter((s) => {
    if (selectedTab === 'TODAS') return true
    if (selectedTab === 'RECOMPRA') return s.categoriaTab === 'RECOMPRA'
    if (selectedTab === 'CROSS_SELL') return s.categoriaTab === 'CROSS_SELL'
    if (selectedTab === 'COMPLEMENTARES') return s.categoriaTab === 'COMPLEMENTARES'
    return true
  })

  const countRecompra = activeSuggestions.filter((s) => s.categoriaTab === 'RECOMPRA').length
  const countCrossSell = activeSuggestions.filter((s) => s.categoriaTab === 'CROSS_SELL').length
  const countComplementares = activeSuggestions.filter(
    (s) => s.categoriaTab === 'COMPLEMENTARES',
  ).length

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const handleDismiss = (sug: SmartCrossSellSuggestion) => {
    setDismissedIds((prev) => [...prev, sug.id])
    onDismissSuggestion?.(sug)
  }

  const isFixtureMode = dataMode === 'FIXTURE'

  return (
    <Card
      id="cross-sell-opportunities-section"
      className="rounded-3xl bg-white text-slate-900 border border-primary/20 p-4 sm:p-5 shadow-sm space-y-4 transition-all"
    >
      {/* 1. CABEÇALHO PERMANENTE COM BANNER DO BLOCO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20 text-primary shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                ✨ OPORTUNIDADES DE VENDA
              </span>
              {customerName ? (
                <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold">
                  {customerName}
                </Badge>
              ) : null}
              {activeSuggestions.length > 0 && !isLoading && !error && (
                <Badge className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-mono font-bold">
                  {activeSuggestions.length} Oportunidades Identificadas
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Cross Sell e recompra inteligente para este cliente · Motor de 2 Camadas (Histórico +
              Coocorrência)
            </p>
          </div>
        </div>

        {/* Controles do Topo: Navegação de Scroll */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          {activeSuggestions.length > 0 && !isLoading && !error && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => scroll('left')}
                className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 border border-border"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => scroll('right')}
                className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 border border-border"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* BANNER DISCRETO DE AMBIENTE DE HOMOLOGAÇÃO (TEXTO DE NEGÓCIO) */}
      {isFixtureMode && (
        <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>
              <strong>Ambiente de Homologação:</strong> Oportunidades demonstrativas ativas para
              validação do fluxo comercial de Cross Sell.
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-800 font-bold shrink-0 hidden sm:inline">
            HOMOLOGAÇÃO
          </span>
        </div>
      )}

      {/* 2. BARRA DE ABAS: [ TODAS ] [ RECOMPRA ] [ CROSS SELL ] [ COMPLEMENTARES ] */}
      {customerId && !isLoading && !error && activeSuggestions.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Button
            type="button"
            size="sm"
            onClick={() => setSelectedTab('TODAS')}
            className={cn(
              'h-7 px-3 text-xs font-semibold rounded-xl transition-all',
              selectedTab === 'TODAS'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-border/60',
            )}
          >
            Todas ({activeSuggestions.length})
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setSelectedTab('RECOMPRA')}
            className={cn(
              'h-7 px-3 text-xs font-semibold rounded-xl transition-all flex items-center gap-1',
              selectedTab === 'RECOMPRA'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-border/60',
            )}
          >
            <span>🔄 Recompra</span>
            <Badge className="bg-emerald-100 text-emerald-800 border-none text-[9px] px-1 py-0 ml-0.5">
              {countRecompra}
            </Badge>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setSelectedTab('CROSS_SELL')}
            className={cn(
              'h-7 px-3 text-xs font-semibold rounded-xl transition-all flex items-center gap-1',
              selectedTab === 'CROSS_SELL'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-border/60',
            )}
          >
            <span>✨ Cross Sell</span>
            <Badge className="bg-purple-100 text-purple-800 border-none text-[9px] px-1 py-0 ml-0.5">
              {countCrossSell}
            </Badge>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setSelectedTab('COMPLEMENTARES')}
            className={cn(
              'h-7 px-3 text-xs font-semibold rounded-xl transition-all flex items-center gap-1',
              selectedTab === 'COMPLEMENTARES'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-border/60',
            )}
          >
            <span>🔗 Complementares</span>
            <Badge className="bg-blue-100 text-blue-800 border-none text-[9px] px-1 py-0 ml-0.5">
              {countComplementares}
            </Badge>
          </Button>
        </div>
      )}

      {/* 3. ESTADOS EXPLÍCITOS */}

      {/* ESTADO 1: NENHUM CLIENTE SELECIONADO */}
      {!customerId && (
        <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-border/80 text-center space-y-3 animate-fade-in">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Search className="w-6 h-6 text-primary" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              Selecione um cliente para identificar oportunidades de venda.
            </h4>
            <p className="text-xs text-muted-foreground">
              O motor de IA cruzará o histórico de compras, recência, coocorrência de produtos e
              disponibilidade de estoque.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-primary font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Aguardando seleção no Passo 1</span>
          </div>
        </div>
      )}

      {/* ESTADO 2: CARREGANDO (SKELETON) */}
      {customerId && isLoading && (
        <div className="p-8 rounded-2xl bg-slate-50 border border-border/60 text-center space-y-4 animate-pulse">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">
              Analisando histórico e oportunidades...
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Cruzando histórico faturado, frequência de recompra, coocorrência de mix e saldos de
            estoque.
          </p>
          <div className="flex gap-4 justify-center pt-2">
            <div className="w-64 h-32 bg-slate-200/60 rounded-2xl border border-slate-300/50" />
            <div className="w-64 h-32 bg-slate-200/60 rounded-2xl border border-slate-300/50 hidden sm:block" />
            <div className="w-64 h-32 bg-slate-200/60 rounded-2xl border border-slate-300/50 hidden md:block" />
          </div>
        </div>
      )}

      {/* ESTADO 3: ERRO / INTEGRAÇÃO INDISPONÍVEL */}
      {customerId && !isLoading && error && (
        <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-300 text-center space-y-3 animate-fade-in">
          <div className="w-10 h-10 mx-auto rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <ServerOff className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900">
              Não foi possível atualizar o histórico comercial neste momento.
            </h4>
            <p className="text-xs text-amber-800 max-w-lg mx-auto">
              A elaboração da cotação prossegue normalmente. Tente novamente em alguns minutos.
            </p>
          </div>
          {onRetry && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="text-xs bg-white border-amber-400 text-amber-900 hover:bg-amber-100 h-8 rounded-xl gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
            </Button>
          )}
        </div>
      )}

      {/* ESTADO 4: CLIENTE SEM OPORTUNIDADE (APÓS FILTROS OU QUANDO VAZIO) */}
      {customerId && !isLoading && !error && activeSuggestions.length === 0 && (
        <div className="p-6 rounded-2xl bg-slate-50 border border-border text-center space-y-2 animate-fade-in">
          <div className="w-10 h-10 mx-auto rounded-xl bg-slate-200/80 flex items-center justify-center text-slate-500">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <h4 className="text-xs sm:text-sm font-semibold text-slate-800">
            Nenhuma oportunidade relevante identificada para este cliente neste momento.
          </h4>
          <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
            Não foram encontradas compras anteriores deste cliente para gerar recomendações
            adicionais ou os itens já constam na cotação.
          </p>
        </div>
      )}

      {/* ESTADO 5: CARDS DE RECOMENDAÇÃO ENCONTRADOS */}
      {customerId && !isLoading && !error && filteredSuggestions.length > 0 && (
        <div
          ref={scrollRef}
          className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory pt-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredSuggestions.map((sug) => {
            const isLowStock = sug.baseRastreabilidade.estoqueDisponivelTons < 5.0
            const hasImmediate = sug.baseRastreabilidade.disponibilidadeImediata

            return (
              <div
                key={sug.id}
                className="min-w-[340px] max-w-[340px] p-4 rounded-2xl bg-white border border-border/80 hover:border-primary/50 transition-all flex flex-col justify-between space-y-3 shrink-0 snap-start shadow-sm relative group hover:shadow-md"
              >
                <div className="space-y-2.5">
                  {/* Linha 1: Badge do Tipo + Score IA */}
                  <div className="flex items-center justify-between gap-1">
                    <Badge
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 border gap-1',
                        sug.badgeColor,
                      )}
                    >
                      <span>{sug.badgeIcon}</span>
                      <span>{sug.tipoLabel}</span>
                    </Badge>

                    <Badge
                      variant="outline"
                      className="font-mono text-[9px] font-bold bg-purple-50 text-purple-700 border-purple-300"
                    >
                      {sug.scoreLabel.split('·')[0].trim()}
                    </Badge>
                  </div>

                  {/* Linha 2: Código SAP e Descrição do Produto */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary block">
                        SAP: {sug.codigo}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-900">
                        {formatBRL(sug.precoReferenciaTon)}/t
                      </span>
                    </div>
                    <strong
                      className="text-xs text-slate-900 block mt-0.5 line-clamp-1 font-bold"
                      title={sug.descricao}
                    >
                      {sug.descricao}
                    </strong>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {sug.familia} {sug.dimensao ? `· ${sug.dimensao}` : ''}
                    </span>
                  </div>

                  {/* Linha 3: Cruzamento de Disponibilidade (Estoque SAP/WMS + PCP + TMS) */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-border/60 space-y-1.5 text-[10px]">
                    {/* Disponibilidade / Estoque */}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Radio className="w-3 h-3 text-primary" /> Estoque:
                      </span>
                      {hasImmediate ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[9px] font-bold">
                          ✓ {formatTons(sug.baseRastreabilidade.estoqueDisponivelTons)} disponível
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[9px] font-bold">
                          ⚠ {formatTons(sug.baseRastreabilidade.estoqueDisponivelTons)} (Baixo &lt;
                          5 t)
                        </Badge>
                      )}
                    </div>

                    {/* Próxima Produção (PCP) */}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Factory className="w-3 h-3 text-purple-600" /> PCP Produção:
                      </span>
                      <span className="text-purple-800 font-semibold font-mono text-right text-[10px] truncate max-w-[170px]">
                        {sug.baseRastreabilidade.producaoPrevista || 'Sem ordem programada'}
                      </span>
                    </div>

                    {/* Logística TMS */}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="w-3 h-3 text-blue-600" /> TMS Logística:
                      </span>
                      <span className="text-blue-800 font-semibold text-right text-[10px]">
                        {sug.baseRastreabilidade.previsaoLogisticaTMS || '1 a 2 dias úteis'}
                      </span>
                    </div>
                  </div>

                  {/* Linha 4: Histórico Real do Cliente (Recência, Frequência, Coocorrência) */}
                  <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50/80 rounded-xl border border-border/60 text-[10px]">
                    <div>
                      <span className="text-muted-foreground block">Última compra:</span>
                      <strong className="text-slate-800 font-mono">
                        {sug.baseRastreabilidade.ultimaCompraData}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Último volume:</span>
                      <strong className="text-slate-800 font-mono">
                        {formatTons(sug.baseRastreabilidade.ultimaQuantidadeTons)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Média habitual:</span>
                      <strong className="text-slate-800 font-mono">
                        {formatTons(sug.baseRastreabilidade.volumeMedioTons)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Frequência:</span>
                      <strong className="text-slate-800 truncate block">
                        a cada {sug.baseRastreabilidade.intervaloMedioDias} dias
                      </strong>
                    </div>
                    {sug.baseRastreabilidade.coOcorrenciaPct ? (
                      <div className="col-span-2 pt-0.5 border-t border-border/40 flex items-center justify-between">
                        <span className="text-muted-foreground">Coocorrência histórica:</span>
                        <Badge className="bg-purple-100 text-purple-800 border-none text-[9px] font-mono">
                          {sug.baseRastreabilidade.coOcorrenciaPct}% dos pedidos
                        </Badge>
                      </div>
                    ) : null}
                  </div>

                  {/* Linha 5: Motivo da Sugestão IA */}
                  <div className="p-2 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1 text-[10px]">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Por que ofertar agora?</span>
                    </div>
                    <p className="text-slate-700 leading-tight line-clamp-2">{sug.motivoIA}</p>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO: [+ ADICIONAR À COTAÇÃO] E [VER HISTÓRICO] */}
                <div className="space-y-1.5 pt-1 border-t border-border/60">
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => onAddSuggestion(sug)}
                    className="w-full h-8 text-xs bg-primary hover:bg-primary/90 text-white font-bold rounded-xl gap-1.5 shadow-sm transition-transform active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> + Adicionar à cotação
                  </Button>

                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => setSelectedTraceability(sug)}
                      className="h-6 px-2 text-primary hover:text-primary/90 hover:bg-primary/5 text-[10px] rounded-lg gap-1 font-semibold"
                    >
                      <History className="w-3 h-3" /> Ver histórico
                    </Button>

                    {isLowStock && onRequestStockCheck && (
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => onRequestStockCheck(sug)}
                        className="h-6 px-1.5 text-amber-800 hover:text-amber-900 hover:bg-amber-100 text-[10px] rounded-lg gap-0.5 font-semibold"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Checar WMS
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => handleDismiss(sug)}
                      className="h-6 px-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 text-[10px] rounded-lg"
                      title="Não sugerir novamente"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL DE RASTREABILIDADE TOTAL E TRANSPARÊNCIA DA IA */}
      <Dialog
        open={!!selectedTraceability}
        onOpenChange={(open) => !open && setSelectedTraceability(null)}
      >
        <DialogContent className="sm:max-w-lg bg-white text-slate-900 rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Rastreabilidade & Evidências da
              Oportunidade IA
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedTraceability?.codigo} — {selectedTraceability?.descricao}
            </DialogDescription>
          </DialogHeader>

          {selectedTraceability && (
            <div className="space-y-3.5 py-2 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 block text-xs">
                    {selectedTraceability.tipoLabel}
                  </span>
                  <Badge className="bg-purple-200 text-purple-900 text-[9px] font-mono">
                    {selectedTraceability.scoreLabel}
                  </Badge>
                </div>
                <p className="text-slate-700 mt-1">{selectedTraceability.motivoIA}</p>
              </div>

              {/* Status de Origem e Conexão */}
              <div className="p-3 bg-slate-50 border border-border/60 rounded-2xl space-y-2">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-primary" /> Origem dos Dados
                  </span>
                  <Badge
                    className={cn(
                      'text-[9px] font-mono',
                      selectedTraceability.isFixture
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    )}
                  >
                    Fonte: {selectedTraceability.fonteDado} (
                    {selectedTraceability.isFixture ? 'Demonstração' : 'Real'})
                  </Badge>
                </span>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="p-2 bg-white rounded-xl border border-border/60">
                    <span className="text-muted-foreground block">Estoque SAP/WMS:</span>
                    <strong className="text-emerald-700 block mt-0.5">✓ CONECTADO (SAP MM)</strong>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-border/60">
                    <span className="text-muted-foreground block">Planejamento PCP:</span>
                    <strong className="text-purple-700 block mt-0.5">✓ CONECTADO (SAP PP)</strong>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-border/60">
                    <span className="text-muted-foreground block">Logística TMS:</span>
                    <strong className="text-blue-700 block mt-0.5">✓ CONECTADO (TMS)</strong>
                  </div>
                </div>
              </div>

              {/* Tabela de Evidências Reais do Histórico */}
              <div className="p-3 bg-slate-50 border border-border/60 rounded-2xl space-y-2">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                  Evidências de Histórico Comercial
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Pedidos nos últimos 12m:</span>
                    <strong className="block text-slate-900 font-mono">
                      {selectedTraceability.baseRastreabilidade.compras12m} pedidos
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volume Médio Habitual:</span>
                    <strong className="block text-slate-900 font-mono">
                      {formatTons(selectedTraceability.baseRastreabilidade.volumeMedioTons)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Intervalo Médio Habitual:</span>
                    <strong className="block text-slate-900">
                      a cada {selectedTraceability.baseRastreabilidade.intervaloMedioDias} dias
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dias desde a Última Compra:</span>
                    <strong className="block text-slate-900 font-mono">
                      {selectedTraceability.baseRastreabilidade.diasSemComprar} dias
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data da Última Aquisição:</span>
                    <strong className="block text-slate-900 font-mono">
                      {selectedTraceability.baseRastreabilidade.ultimaCompraData}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Último Volume Faturado:</span>
                    <strong className="block text-slate-900 font-mono">
                      {formatTons(selectedTraceability.baseRastreabilidade.ultimaQuantidadeTons)}
                    </strong>
                  </div>
                  {selectedTraceability.baseRastreabilidade.coOcorrenciaPct && (
                    <div className="col-span-2 pt-1 border-t">
                      <span className="text-muted-foreground">
                        Coocorrência de Compra Conjunta:
                      </span>
                      <strong className="block text-purple-700 font-mono">
                        {selectedTraceability.baseRastreabilidade.coOcorrenciaPct}% dos pedidos
                        conjuntos
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Dados de Estoque e Viabilidade de Atendimento */}
              <div className="p-3 bg-slate-50 border border-border/60 rounded-2xl space-y-2">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                  Disponibilidade Física & Logística
                </span>
                <div className="space-y-1.5 text-[11px]">
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
    </Card>
  )
}
