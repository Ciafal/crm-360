import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  FileText,
  Clock,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCw,
  Eye,
  Settings2,
  Check,
  Building2,
  Layers,
  LayoutGrid,
  List as ListIcon,
  HelpCircle,
  ShieldCheck,
  Flame,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { quotationService } from '@/services/quotation_service'
import type { Quotation, QuotationStatus, LossReason } from '@/types/quotation'
import {
  opportunityLeadService,
  AdvancedOpportunity,
  formatBRL as formatBRLOpp,
  formatTonsABNT as formatTonsOpp,
} from '@/services/opportunity_lead_service'
import { QuotationStatusBadge, ApprovalStatusBadge } from './QuotationStatusBadge'
import { PriceDeviationBadge } from './PriceDeviationBadge'
import { StockBadge } from './StockBadge'
import { PricingDetailsDrawer } from './PricingDetailsDrawer'
import { PDFPreviewDialog } from './PDFPreviewDialog'
import { InternalApprovalDialog } from './InternalApprovalDialog'
import { StockConfirmationDialog } from './StockConfirmationDialog'
import { ClientAcceptanceDialog } from './ClientAcceptanceDialog'
import { CommunicationComposer } from './CommunicationComposer'
import { SapIntegrationRequestDialog } from './SapIntegrationRequestDialog'
import { SapMessageDrawer } from './SapMessageDrawer'
import { QuotationDashboard } from './QuotationDashboard'
import { QuotationKanban } from './QuotationKanban'
import { RegisterLossDialog } from './RegisterLossDialog'
import { QuoteCopilotDialog } from './QuoteCopilotDialog'
import { LocalSellerCopilotAgent } from '@/providers/LocalAIAdapter'
import type { QuoteCopilotInsight } from '@/providers/AIProvider'
import { NovaOportunidadeModal } from '@/components/crm/NovaOportunidadeModal'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export default function CotacoesList() {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [opportunities, setOpportunities] = useState<AdvancedOpportunity[]>([])
  const [loading, setLoading] = useState(true)

  // Filtro de Tipo de Registro: 'TODOS' | 'OPORTUNIDADES' | 'COTACOES'
  const [tipoRegistroFilter, setTipoRegistroFilter] = useState<
    'TODOS' | 'OPORTUNIDADES' | 'COTACOES'
  >('TODOS')

  // Modos de visualização: KANBAN | LIST | DASHBOARD
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST' | 'DASHBOARD'>('DASHBOARD')

  // Métrica Principal: TONELADAS (Padrão CIAFAL) vs R$
  const [metricMode, setMetricMode] = useState<'TONS' | 'REAIS'>('TONS')

  // YTD Filter
  const [ytdFilter, setYtdFilter] = useState<'MES' | 'YTD' | '12M' | 'ANO' | 'CUSTOM'>('MES')

  // Filtros Avançados
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [selectedSeller, setSelectedSeller] = useState<string>('ALL')
  const [selectedAbc, setSelectedAbc] = useState<string>('ALL')
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>('ALL')
  const [selectedApprovalFilter, setSelectedApprovalFilter] = useState<string>('ALL')
  const [selectedFollowUpFilter, setSelectedFollowUpFilter] = useState<string>('ALL')
  const [selectedUf, setSelectedUf] = useState<string>('ALL')

  // Modais e Drawers
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null)
  const { user } = useAuth()
  const [novaOportunidadeOpen, setNovaOportunidadeOpen] = useState(false)
  const [pricingDrawerOpen, setPricingDrawerOpen] = useState(false)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [acceptanceDialogOpen, setAcceptanceDialogOpen] = useState(false)
  const [commDialogOpen, setCommDialogOpen] = useState(false)
  const [sapRequestDialogOpen, setSapRequestDialogOpen] = useState(false)
  const [sapMessagesDrawerOpen, setSapMessagesDrawerOpen] = useState(false)
  const [lossDialogOpen, setLossDialogOpen] = useState(false)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [copilotInsight, setCopilotInsight] = useState<QuoteCopilotInsight | null>(null)
  const [stockConfirmItem, setStockConfirmItem] = useState<{
    item: Quotation['items'][0]
    quote: Quotation
  } | null>(null)

  const loadQuotations = async () => {
    try {
      setLoading(true)
      const [data, opps] = await Promise.all([
        quotationService.getAllQuotations(),
        Promise.resolve(opportunityLeadService.getStoredOpportunities()),
      ])
      setQuotations(data)
      setOpportunities(opps)
    } catch (err: any) {
      toast.error(`Erro ao carregar dados comerciais: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuotations()

    // Ouvir evento de criação de oportunidade para sincronizar sem F5
    const handleOppCreated = () => {
      loadQuotations()
    }
    window.addEventListener('crm360:opportunityCreated', handleOppCreated)
    return () => {
      window.removeEventListener('crm360:opportunityCreated', handleOppCreated)
    }
  }, [])

  // Lista de vendedores únicos para filtro
  const sellerOptions = Array.from(new Set(quotations.map((q) => q.seller_name).filter(Boolean)))
  const ufOptions = Array.from(new Set(quotations.map((q) => q.customer_uf).filter(Boolean)))

  // Aplicação dos Filtros
  const filteredQuotations = quotations.filter((q) => {
    if (
      search &&
      !q.code.toLowerCase().includes(search.toLowerCase()) &&
      !q.customer_name.toLowerCase().includes(search.toLowerCase()) &&
      !q.customer_sap_code.includes(search) &&
      !q.items.some(
        (it) =>
          it.material_code.toLowerCase().includes(search.toLowerCase()) ||
          it.description.toLowerCase().includes(search.toLowerCase()),
      )
    ) {
      return false
    }

    if (selectedStatus !== 'ALL' && q.status !== selectedStatus) {
      return false
    }

    if (selectedSeller !== 'ALL' && q.seller_name !== selectedSeller) {
      return false
    }

    if (selectedAbc !== 'ALL' && q.customer_abc !== selectedAbc) {
      return false
    }

    if (selectedUf !== 'ALL' && q.customer_uf !== selectedUf) {
      return false
    }

    if (selectedStockFilter === 'COM_ESTOQUE' && q.stock_status !== 'ESTOQUE_SUFICIENTE') {
      return false
    }
    if (selectedStockFilter === 'SEM_ESTOQUE' && q.stock_status === 'ESTOQUE_SUFICIENTE') {
      return false
    }

    if (selectedApprovalFilter === 'COM_APROVACAO' && q.approval_status !== 'APPROVED') {
      return false
    }
    if (selectedApprovalFilter === 'PENDENTE' && q.approval_status !== 'PENDING') {
      return false
    }

    if (selectedFollowUpFilter === 'SEM_FOLLOW_UP') {
      const isOutdated =
        !q.last_contact_at ||
        Date.now() - new Date(q.last_contact_at).getTime() > 48 * 60 * 60 * 1000
      if (!isOutdated) return false
    }

    return true
  })

  // Mover Estágio no Kanban com Validações Rigorosas
  const handleMoveKanbanStage = async (quoteId: string, targetStatus: QuotationStatus) => {
    const quote = quotations.find((q) => q.id === quoteId)
    if (!quote) return

    // Validação 1: Não mover para PRONTA_PARA_ENVIO se aprovação pendente
    if (targetStatus === 'PRONTA_PARA_ENVIO' && quote.approval_status === 'PENDING') {
      toast.error(
        'Controle de Alçada: Não é permitido liberar para envio com Aprovação Interna pendente.',
      )
      return
    }

    // Validação 2: Se mover para PERDIDA, abrir diálogo para coletar motivo
    if (targetStatus === 'PERDIDA') {
      setSelectedQuote(quote)
      setLossDialogOpen(true)
      return
    }

    // Validação 3: Se mover para CONVERSAO_SAP, disparar fila de integração
    if (targetStatus === 'CONVERSAO_SAP') {
      setSelectedQuote(quote)
      setSapRequestDialogOpen(true)
      return
    }

    try {
      const updated = await quotationService.saveQuotation({
        ...quote,
        status: targetStatus,
      })
      toast.success(`Cotação ${quote.code} movida para ${targetStatus}`)
      loadQuotations()
    } catch (err: any) {
      toast.error(`Falha ao alterar status: ${err.message}`)
    }
  }

  const handleConfirmLoss = async (reason: LossReason, notes: string) => {
    if (!selectedQuote) return
    try {
      await quotationService.registerQuotationLoss(selectedQuote.id, reason, notes)
      toast.success(`Perda da proposta ${selectedQuote.code} registrada com sucesso.`)
      loadQuotations()
    } catch (err: any) {
      toast.error(`Erro ao registrar perda: ${err.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de Título Superior com Botões de Ação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-700" /> GESTÃO DE COTAÇÕES
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ciclo Oportunidade → Cotação → Aprovação → Envio → Aceite → Fila SAP ECC → Faturamento
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Alternador de Visão & Filtros Rápidos */}
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
            <Button
              size="sm"
              variant={
                viewMode === 'LIST' && selectedStatus === 'ALL' && selectedStockFilter === 'ALL'
                  ? 'secondary'
                  : 'ghost'
              }
              onClick={() => {
                setViewMode('LIST')
                setSelectedStatus('ALL')
                setSelectedStockFilter('ALL')
              }}
              className={`h-8 text-xs font-semibold rounded-lg ${
                viewMode === 'LIST' && selectedStatus === 'ALL' && selectedStockFilter === 'ALL'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5 mr-1 text-primary" /> Lista
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'KANBAN' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('KANBAN')}
              className={`h-8 text-xs font-semibold rounded-lg ${
                viewMode === 'KANBAN' ? 'bg-white text-primary shadow-xs' : 'text-slate-600'
              }`}
            >
              <Layers className="w-3.5 h-3.5 mr-1 text-primary" /> Kanban
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setViewMode('LIST')
                setSelectedStatus('AGUARDANDO_APROVACAO')
              }}
              className={`h-8 text-xs font-semibold rounded-lg ${
                selectedStatus === 'AGUARDANDO_APROVACAO'
                  ? 'bg-purple-100 text-purple-900 font-bold'
                  : 'text-slate-600'
              }`}
            >
              Aguardando Aprovação
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setViewMode('LIST')
                setSelectedStockFilter('SEM_ESTOQUE')
              }}
              className={`h-8 text-xs font-semibold rounded-lg ${
                selectedStockFilter === 'SEM_ESTOQUE'
                  ? 'bg-amber-100 text-amber-900 font-bold'
                  : 'text-slate-600'
              }`}
            >
              Aguardando Checagem
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setViewMode('LIST')
                setSelectedStatus('PRONTA_PARA_ENVIO')
              }}
              className={`h-8 text-xs font-semibold rounded-lg ${
                selectedStatus === 'PRONTA_PARA_ENVIO'
                  ? 'bg-emerald-100 text-emerald-900 font-bold'
                  : 'text-slate-600'
              }`}
            >
              Aprovadas
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setViewMode('LIST')
                setSelectedStatus('PEDIDO_IMPLANTADO')
              }}
              className={`h-8 text-xs font-semibold rounded-lg ${
                selectedStatus === 'PEDIDO_IMPLANTADO'
                  ? 'bg-blue-100 text-blue-900 font-bold'
                  : 'text-slate-600'
              }`}
            >
              Convertidas em Pedido
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'DASHBOARD' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('DASHBOARD')}
              className={`h-8 text-xs font-semibold rounded-lg ${
                viewMode === 'DASHBOARD' ? 'bg-white text-primary shadow-xs' : 'text-slate-600'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1 text-primary" /> Dashboard
            </Button>
          </div>

          <Button
            size="sm"
            onClick={() => navigate('/crm/cotacoes/nova')}
            className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-xs rounded-xl h-9 text-xs"
          >
            <Plus className="w-4 h-4 mr-1" /> Nova Cotação
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setNovaOportunidadeOpen(true)}
            className="border-primary/40 text-primary hover:bg-primary/10 font-semibold shadow-xs rounded-xl h-9 text-xs gap-1"
          >
            <Plus className="w-4 h-4" /> Nova Oportunidade
          </Button>
        </div>
      </div>

      {/* DASHBOARD EXECUTIVO COM GRÁFICOS EM PADRÃO CIAFAL */}
      {viewMode === 'DASHBOARD' && (
        <QuotationDashboard
          quotations={filteredQuotations}
          metricMode={metricMode}
          onMetricModeChange={setMetricMode}
          ytdFilter={ytdFilter}
          onYtdFilterChange={setYtdFilter}
          onSelectQuotation={(q) => {
            setSelectedQuote(q)
            setPricingDrawerOpen(true)
          }}
        />
      )}

      {/* FILTROS MULTICRITÉRIO COMPLETOS */}
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardContent className="p-3.5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {/* Busca Geral */}
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Buscar cliente, cotação, SAP ou material..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filtro Status */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Status</SelectItem>
                <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                <SelectItem value="EM_PREPARACAO">Em Preparação</SelectItem>
                <SelectItem value="AGUARDANDO_APROVACAO">Aguardando Aprovação</SelectItem>
                <SelectItem value="PRONTA_PARA_ENVIO">Pronta p/ Envio</SelectItem>
                <SelectItem value="ENVIADA_AO_CLIENTE">Enviada ao Cliente</SelectItem>
                <SelectItem value="AGUARDANDO_RETORNO">Aguardando Retorno</SelectItem>
                <SelectItem value="NEGOCIACAO">Negociação</SelectItem>
                <SelectItem value="ACEITA">Aceita</SelectItem>
                <SelectItem value="CONVERSAO_SAP">Conversão SAP</SelectItem>
                <SelectItem value="PEDIDO_IMPLANTADO">Pedido Implantado</SelectItem>
                <SelectItem value="PERDIDA">Perdida</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro Vendedor */}
            <Select value={selectedSeller} onValueChange={setSelectedSeller}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Vendedores</SelectItem>
                {sellerOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro ABC */}
            <Select value={selectedAbc} onValueChange={setSelectedAbc}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Curva ABC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Curvas (ABC)</SelectItem>
                <SelectItem value="A">Curva A (Estratégico)</SelectItem>
                <SelectItem value="B">Curva B (Médio Porte)</SelectItem>
                <SelectItem value="C">Curva C (Esporádico)</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro Estoque */}
            <Select value={selectedStockFilter} onValueChange={setSelectedStockFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Estoque (Todos)</SelectItem>
                <SelectItem value="COM_ESTOQUE">Estoque Suficiente</SelectItem>
                <SelectItem value="SEM_ESTOQUE">Estoque Baixo / Sem Estoque</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro Aprovação */}
            <Select value={selectedApprovalFilter} onValueChange={setSelectedApprovalFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Alçada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Alçada (Todas)</SelectItem>
                <SelectItem value="COM_APROVACAO">Aprovada Internamente</SelectItem>
                <SelectItem value="PENDENTE">Aprovação Pendente</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro Follow-up */}
            <Select value={selectedFollowUpFilter} onValueChange={setSelectedFollowUpFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Follow-up" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Follow-up (Todos)</SelectItem>
                <SelectItem value="SEM_FOLLOW_UP">Sem Follow-up (&gt;48h)</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro UF */}
            <Select value={selectedUf} onValueChange={setSelectedUf}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Estado (UF)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as UFs</SelectItem>
                {ufOptions.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Botão Limpar Filtros */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setSelectedStatus('ALL')
                setSelectedSeller('ALL')
                setSelectedAbc('ALL')
                setSelectedStockFilter('ALL')
                setSelectedApprovalFilter('ALL')
                setSelectedFollowUpFilter('ALL')
                setSelectedUf('ALL')
                setTipoRegistroFilter('TODOS')
              }}
              className="h-9 text-xs text-slate-600"
            >
              <RotateCw className="w-3.5 h-3.5 mr-1" /> Limpar Filtros
            </Button>
          </div>

          {/* BARRA DE SELEÇÃO: TIPO DE REGISTRO (TODOS / OPORTUNIDADES / COTAÇÕES) */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700">Tipo de Registro:</span>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTipoRegistroFilter('TODOS')}
                  className={cn(
                    'px-3 py-1 text-xs font-semibold rounded-md transition-all',
                    tipoRegistroFilter === 'TODOS'
                      ? 'bg-white text-primary shadow-xs'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  Todos ({filteredQuotations.length + opportunities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTipoRegistroFilter('OPORTUNIDADES')}
                  className={cn(
                    'px-3 py-1 text-xs font-semibold rounded-md transition-all',
                    tipoRegistroFilter === 'OPORTUNIDADES'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  Oportunidades ({opportunities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTipoRegistroFilter('COTACOES')}
                  className={cn(
                    'px-3 py-1 text-xs font-semibold rounded-md transition-all',
                    tipoRegistroFilter === 'COTACOES'
                      ? 'bg-[#003A70] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  Cotações ({filteredQuotations.length})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>Legenda:</span>
              <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[10px]">
                TIPO: Oportunidade
              </Badge>
              <Badge className="bg-sky-100 text-sky-900 border border-sky-300 font-mono text-[10px]">
                TIPO: Cotação
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VISUALIZAÇÃO KANBAN COM DRAG & DROP E AGING */}
      {viewMode === 'KANBAN' && (
        <QuotationKanban
          quotations={filteredQuotations}
          metricMode={metricMode}
          onSelectQuotation={(q) => {
            setSelectedQuote(q)
            setPricingDrawerOpen(true)
          }}
          onMoveQuotationStage={handleMoveKanbanStage}
        />
      )}

      {/* VISUALIZAÇÃO TABELA DETALHADA */}
      {viewMode === 'LIST' && (
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Tipo / Código</th>
                    <th className="p-3">Cliente & SAP</th>
                    <th className="p-3">Vendedor</th>
                    <th className="p-3 text-right">Volume (t)</th>
                    <th className="p-3 text-right">Valor Total (R$)</th>
                    <th className="p-3 text-center">Status / Estágio</th>
                    <th className="p-3 text-center">Vínculo Relacionado</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* LINHAS DE OPORTUNIDADES (se filtro permitir) */}
                  {(tipoRegistroFilter === 'TODOS' || tipoRegistroFilter === 'OPORTUNIDADES') &&
                    opportunities.map((opp) => {
                      const valorText =
                        opp.valorPotencialCalculado !== null &&
                        opp.valorPotencialCalculado !== undefined &&
                        opp.valorPotencialCalculado > 0
                          ? formatBRLOpp(opp.valorPotencialCalculado)
                          : opp.valor > 0
                            ? formatBRLOpp(opp.valor)
                            : 'Não estimado'

                      const qtdText =
                        opp.quantidadeEstimadaTons !== null &&
                        opp.quantidadeEstimadaTons !== undefined &&
                        opp.quantidadeEstimadaTons > 0
                          ? formatTonsOpp(opp.quantidadeEstimadaTons)
                          : opp.toneladas > 0
                            ? formatTonsOpp(opp.toneladas)
                            : 'Não estimada'

                      return (
                        <tr
                          key={`opp-${opp.id}`}
                          className="hover:bg-amber-50/40 bg-amber-50/15 transition-colors border-l-4 border-l-amber-400"
                        >
                          <td className="p-3">
                            <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] block w-fit mb-1">
                              TIPO: Oportunidade
                            </Badge>
                            <span className="font-mono font-bold text-slate-900">
                              {opp.numeroSequencial || opp.id}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">
                              {opp.clienteNome}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              SAP: {opp.clienteSap} • Grupo: {opp.grupoMercadoria || 'Geral'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700">{opp.vendedorNome}</td>
                          <td className="p-3 text-right font-medium text-slate-800 font-mono">
                            {qtdText}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-700 font-mono">
                            {valorText}
                          </td>
                          <td className="p-3 text-center">
                            <Badge className="bg-amber-100 text-amber-900 border-none font-bold text-[10px]">
                              Estágio:{' '}
                              {opp.estagioCiafal ? opp.estagioCiafal.replace(/_/g, ' ') : opp.etapa}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            {opp.cotacaoRelacionadaId ? (
                              <Badge className="bg-sky-100 text-sky-900 border border-sky-300 font-mono text-[10px]">
                                Cotação vinculada: {opp.cotacaoRelacionadaId}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 font-mono text-[10px]">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigate('/crm/cotacoes/nova', {
                                  state: {
                                    clienteId: opp.clienteId,
                                    codigoSap: opp.clienteSap,
                                    razaoSocial: opp.clienteNome,
                                    vendedorNome: opp.vendedorNome,
                                    grupoMercadoriaSugerido: opp.grupoMercadoria,
                                    quantidadeEstimadaSugerida: opp.quantidadeEstimadaTons,
                                    precoEstimadoReferencia: opp.precoEstimadoPorTon,
                                    observacoesOrigem: `Oportunidade vinculada: ${opp.numeroSequencial || opp.id}`,
                                    origem: 'oportunidade_funil',
                                    opportunity_id: opp.numeroSequencial || opp.id,
                                    opportunity_number: opp.numeroSequencial,
                                  },
                                })
                              }}
                              className="h-7 px-2 text-xs border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 font-semibold"
                            >
                              Gerar Cotação
                            </Button>
                          </td>
                        </tr>
                      )
                    })}

                  {/* LINHAS DE COTAÇÕES (se filtro permitir) */}
                  {(tipoRegistroFilter === 'TODOS' || tipoRegistroFilter === 'COTACOES') &&
                    filteredQuotations.map((q) => (
                      <tr
                        key={`cot-${q.id}`}
                        className="hover:bg-slate-50/70 transition-colors border-l-4 border-l-blue-600"
                      >
                        <td className="p-3">
                          <Badge className="bg-sky-100 text-sky-900 border border-sky-300 font-bold text-[10px] block w-fit mb-1">
                            TIPO: Cotação
                          </Badge>
                          <span className="font-bold text-blue-900 font-mono">
                            {q.code}{' '}
                            <span className="text-[10px] text-slate-400">v{q.version}</span>
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{q.customer_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            SAP: {q.customer_sap_code} • {q.customer_city}/{q.customer_uf}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700">{q.seller_name}</td>
                        <td className="p-3 text-right font-bold text-slate-900 font-mono">
                          {q.total_tons.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} t
                        </td>
                        <td className="p-3 text-right font-extrabold text-slate-900 font-mono">
                          R$ {q.total_value.toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3 text-center">
                          <QuotationStatusBadge status={q.status} />
                        </td>
                        <td className="p-3 text-center">
                          {q.opportunity_id ? (
                            <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[10px]">
                              Origem: {q.opportunity_id}
                            </Badge>
                          ) : q.sap_order_number ? (
                            <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                              Ped. SAP #{q.sap_order_number}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedQuote(q)
                                setPricingDrawerOpen(true)
                              }}
                              className="h-7 w-7 p-0 text-blue-700 hover:bg-blue-50"
                              title="Ver Detalhes"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedQuote(q)
                                setPdfDialogOpen(true)
                              }}
                              className="h-7 w-7 p-0 text-slate-700 hover:bg-slate-100"
                              title="Gerar PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedQuote(q)
                                setCommDialogOpen(true)
                              }}
                              className="h-7 w-7 p-0 text-emerald-700 hover:bg-emerald-50"
                              title="Enviar ao Cliente"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {filteredQuotations.length === 0 && opportunities.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        Nenhum registro encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DRAWER LATERAL DE DETALHES DA COTAÇÃO */}
      <PricingDetailsDrawer
        open={pricingDrawerOpen}
        onOpenChange={setPricingDrawerOpen}
        quotation={selectedQuote}
        onApprove={() => setApprovalDialogOpen(true)}
        onRequestStockConfirmation={(item) => {
          if (selectedQuote) setStockConfirmItem({ item, quote: selectedQuote })
        }}
        onGeneratePDF={() => setPdfDialogOpen(true)}
        onSendCommunication={() => setCommDialogOpen(true)}
        onRegisterAcceptance={() => setAcceptanceDialogOpen(true)}
        onRequestSapQueue={() => setSapRequestDialogOpen(true)}
        onViewSapMessages={() => setSapMessagesDrawerOpen(true)}
      />

      {/* MODAL DE PDF COM IDENTIDADE VISUAL CIAFAL */}
      <PDFPreviewDialog
        open={pdfDialogOpen}
        onOpenChange={setPdfDialogOpen}
        quotation={selectedQuote}
      />

      {/* MODAL DE APROVAÇÃO INTERNA */}
      <InternalApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        quotation={selectedQuote}
        onSuccess={loadQuotations}
      />

      {/* MODAL DE ACEITE DO CLIENTE */}
      <ClientAcceptanceDialog
        open={acceptanceDialogOpen}
        onOpenChange={setAcceptanceDialogOpen}
        quotation={selectedQuote}
        onSuccess={loadQuotations}
      />

      {/* MODAL DE ENVIO WHATSAPP / E-MAIL */}
      <CommunicationComposer
        open={commDialogOpen}
        onOpenChange={setCommDialogOpen}
        quotation={selectedQuote}
        onSuccess={loadQuotations}
      />

      {/* MODAL DE IMPLANTAÇÃO NA FILA SAP ECC */}
      <SapIntegrationRequestDialog
        open={sapRequestDialogOpen}
        onOpenChange={setSapRequestDialogOpen}
        quotation={selectedQuote}
        onSuccess={loadQuotations}
      />

      {/* MODAL DE MENSAGENS TÉCNICAS DO SAP ECC */}
      <SapMessageDrawer
        open={sapMessagesDrawerOpen}
        onOpenChange={setSapMessagesDrawerOpen}
        quotation={selectedQuote}
      />

      {/* MODAL DE REGISTRO DE PERDA */}
      <RegisterLossDialog
        open={lossDialogOpen}
        onOpenChange={setLossDialogOpen}
        quotation={selectedQuote}
        onConfirm={handleConfirmLoss}
      />

      {/* MODAL QUOTE COPILOT (IA) */}
      {selectedQuote && (
        <QuoteCopilotDialog
          open={copilotOpen}
          onOpenChange={setCopilotOpen}
          insight={copilotInsight}
          customerName={selectedQuote.customer_name}
          quoteCode={selectedQuote.code}
        />
      )}

      {/* MODAL NOVA OPORTUNIDADE COMERCIAL CIAFAL */}
      <NovaOportunidadeModal
        open={novaOportunidadeOpen}
        onOpenChange={setNovaOportunidadeOpen}
        usuarioAtualNome={user?.name || 'Carlos Mendonça'}
        onSuccess={() => {
          loadQuotations()
        }}
      />
    </div>
  )
}
