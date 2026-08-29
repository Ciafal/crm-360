// src/pages/CentralAcoesPage.tsx
// CENTRAL DE AÇÕES COMERCIAIS — Execução Comercial Inteligente CRM 360 CIAFAL
// DADO → ANÁLISE → RECOMENDAÇÃO → AÇÃO → RESULTADO

import React, { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sparkles,
  Zap,
  CheckSquare,
  Square,
  ListTodo,
  Megaphone,
  RotateCcw,
  Package,
  Activity,
  BarChart3,
  Search,
  Filter,
  Users,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Scale,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  Mail,
  FileSpreadsheet,
  Download,
  Plus,
  RefreshCw,
  Eye,
  Send,
  AlertTriangle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { recommendationService } from '@/services/recommendation_service'
import { bulkTaskService } from '@/services/bulk_task_service'
import { campaignService } from '@/services/campaign_service'
import { reactivationService, ReactivationCandidate } from '@/services/reactivation_service'
import { campaignAnalyticsService } from '@/services/campaign_analytics_service'
import { customerManagementService } from '@/services/customer_management_service'
import { stockService } from '@/services/stock_service'
import type {
  AICommercialRecommendation,
  CommercialTask,
  BulkTaskBatch,
  CommercialCampaign,
  ActionOriginType,
  PriorityLevel,
  FitScore,
} from '@/types/commercial_execution'
import type { CustomerManagementItem } from '@/types/customer_management'
import type { StockItem } from '@/types/stock'
import { CreateBulkTasksModal } from '@/components/central-acoes/CreateBulkTasksModal'
import { EnhancedCampaignWizardModal } from '@/components/central-acoes/EnhancedCampaignWizardModal'
import { CampaignAIDrilldownModal } from '@/components/central-acoes/CampaignAIDrilldownModal'
import { toast } from 'sonner'
import { formatCurrency, formatWeight } from '@/lib/utils'

export type CentralAcoesTab =
  | 'recomendacoes_ia'
  | 'tarefas_lote'
  | 'campanhas'
  | 'reativacao'
  | 'estoque_parado'
  | 'acoes_execucao'
  | 'resultados'

export default function CentralAcoesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Aba ativa
  const [activeTab, setActiveTab] = useState<CentralAcoesTab>('recomendacoes_ia')

  // Filtros Globais
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrigin, setSelectedOrigin] = useState<ActionOriginType | 'todos'>('todos')
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | 'todos'>('todos')
  const [selectedVendedor, setSelectedVendedor] = useState<string>('todos')

  // Seleção em Lote de Recomendações
  const [selectedRecIds, setSelectedRecIds] = useState<string[]>([])

  // Modais
  const [bulkTaskModalOpen, setBulkTaskModalOpen] = useState(false)
  const [campaignWizardOpen, setCampaignWizardOpen] = useState(false)
  const [campaignTypeToCreate, setCampaignTypeToCreate] =
    useState<CommercialCampaign['tipo']>('reativacao_sem_compra')
  const [campaignProducts, setCampaignProducts] = useState<any[]>([])
  const [selectedCampaignForDrilldown, setSelectedCampaignForDrilldown] =
    useState<CommercialCampaign | null>(null)

  // Modal de Reatribuição / Alteração de Prazo
  const [reassignModalOpen, setReassignModalOpen] = useState(false)
  const [selectedTaskIdsForBulkAction, setSelectedTaskIdsForBulkAction] = useState<string[]>([])
  const [newSellerForReassign, setNewSellerForReassign] = useState('Carlos Mendonça')
  const [newDueDate, setNewDueDate] = useState('')

  // Drill-down de Lote
  const [drilledBatchId, setDrilledBatchId] = useState<string | null>(null)
  const [drilledStatusFilter, setDrilledStatusFilter] = useState<string | null>(null)

  // Dados dos serviços
  const [rawRecommendations, setRawRecommendations] = useState<AICommercialRecommendation[]>(() =>
    recommendationService.getAllRecommendations(),
  )
  const [tasks, setTasks] = useState<CommercialTask[]>(() => bulkTaskService.getTasks())
  const [batches, setBatches] = useState<BulkTaskBatch[]>(() => bulkTaskService.getBatches())
  const [campaigns, setCampaigns] = useState<CommercialCampaign[]>(() =>
    campaignService.getCampaigns(),
  )
  const [stockItems] = useState<StockItem[]>(() => stockService.getStoredStockItems())
  const [customers] = useState<CustomerManagementItem[]>(() =>
    customerManagementService.getCustomers(),
  )

  // Recarregar dados
  const reloadAll = () => {
    setRawRecommendations(recommendationService.getAllRecommendations())
    setTasks(bulkTaskService.getTasks())
    setBatches(bulkTaskService.getBatches())
    setCampaigns(campaignService.getCampaigns())
  }

  // KPIs da Central
  const kpis = useMemo(() => {
    return campaignAnalyticsService.getExecutionKPIs()
  }, [tasks, campaigns, rawRecommendations])

  // Recomendações Filtradas
  const filteredRecommendations = useMemo(() => {
    return rawRecommendations.filter((rec) => {
      const matchOrigin = selectedOrigin === 'todos' || rec.origem === selectedOrigin
      const matchPriority = selectedPriority === 'todos' || rec.prioridade === selectedPriority
      const matchVendedor =
        selectedVendedor === 'todos' ||
        rec.vendedorNome.toLowerCase().includes(selectedVendedor.toLowerCase())
      const matchSearch =
        !searchTerm ||
        rec.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.produtoSugerido.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.motivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.cidadeUf.toLowerCase().includes(searchTerm.toLowerCase())

      return matchOrigin && matchPriority && matchVendedor && matchSearch
    })
  }, [rawRecommendations, selectedOrigin, selectedPriority, selectedVendedor, searchTerm])

  // Candidatos a Reativação
  const reactivationCandidates = useMemo(() => {
    return reactivationService.getReactivationCandidates()
  }, [])

  // Estoque Parado
  const stagnantStockItems = useMemo(() => {
    return stockItems.filter(
      (s) =>
        s.classification === 'PARADO' ||
        s.classification === 'CRITICO' ||
        s.daysWithoutMovement >= 45,
    )
  }, [stockItems])

  // Clientes selecionados para ações em lote
  const selectedCustomersForBulk = useMemo(() => {
    const ids = new Set(
      filteredRecommendations.filter((r) => selectedRecIds.includes(r.id)).map((r) => r.clienteId),
    )
    return customers.filter((c) => ids.has(c.id))
  }, [filteredRecommendations, selectedRecIds, customers])

  // Handlers de Seleção em Lote
  const handleSelectAllRecommendations = () => {
    if (selectedRecIds.length === filteredRecommendations.length) {
      setSelectedRecIds([])
    } else {
      setSelectedRecIds(filteredRecommendations.map((r) => r.id))
    }
  }

  const handleSelectTop10Recommendations = () => {
    const top10 = filteredRecommendations.slice(0, 10).map((r) => r.id)
    setSelectedRecIds(top10)
    toast.info('Top 10 recomendações selecionadas.')
  }

  const handleToggleRec = (id: string) => {
    setSelectedRecIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  // Ações em Lote a partir de Recomendações
  const handleOpenBulkTaskModal = () => {
    if (selectedCustomersForBulk.length === 0) {
      toast.error('Selecione ao menos 1 recomendação para criar tarefas.')
      return
    }
    setBulkTaskModalOpen(true)
  }

  const handleOpenCampaignFromRecommendations = (tipo: CommercialCampaign['tipo']) => {
    if (selectedCustomersForBulk.length === 0) {
      toast.error('Selecione ao menos 1 cliente para criar campanha.')
      return
    }
    setCampaignTypeToCreate(tipo)
    setCampaignWizardOpen(true)
  }

  // Ações Diretas por Linha de Recomendação
  const handleDirectCreateQuote = (rec: AICommercialRecommendation) => {
    // Redireciona para nova cotação trazendo o cliente e produto sugerido
    toast.success(`Iniciando cotação para ${rec.clienteNome}`)
    navigate('/crm/cotacoes/nova', {
      state: {
        clienteId: rec.clienteId,
        clienteNome: rec.clienteNome,
        produtoSugerido: rec.produtoSugerido,
        origem: 'central_acoes_ia',
      },
    })
  }

  // Exportação Excel
  const handleExportCSV = () => {
    campaignAnalyticsService.exportToExcelCSV(
      filteredRecommendations,
      'recomendacoes_ia_ciafal.csv',
    )
    toast.success('Lista de recomendações exportada com sucesso!')
  }

  return (
    <div className="space-y-6 pb-20 text-slate-100 animate-fade-in">
      {/* 1. BANNER DEMO & AMBIENTE */}
      <div className="bg-gradient-to-r from-sky-950/90 via-slate-900 to-slate-950 border border-sky-800/40 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2.5">
          <Badge className="bg-amber-500 text-slate-950 border-none text-[10px] font-mono font-bold uppercase tracking-wider">
            DADOS DE DEMONSTRAÇÃO (is_mock=true)
          </Badge>
          <span className="text-slate-300 text-xs">
            Central de Ações Comerciais · Fluxo:{' '}
            <strong>DADO → ANÁLISE → RECOMENDAÇÃO → AÇÃO → RESULTADO</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              reloadAll()
              toast.success('Central de Ações sincronizada com todos os módulos!')
            }}
            className="h-8 text-xs border-slate-700 bg-slate-900 text-slate-300 hover:text-white rounded-xl gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> Sincronizar
          </Button>
        </div>
      </div>

      {/* 2. CABEÇALHO EXECUTIVO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-xl border border-amber-800/40">
              EXECUÇÃO COMERCIAL INTELIGENTE
            </span>
            <span className="text-xs text-slate-400">Motor Preditivo CIAFAL FERRO & AÇO</span>
          </div>

          <h1 className="font-serif text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Zap className="w-8 h-8 text-amber-400" />
            Central de Ações Comerciais
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Transforme recomendações da IA em tarefas individualizadas, campanhas segmentadas e
            liquidação de estoque com rastreabilidade total até a emissão do pedido SAP.
          </p>
        </div>

        {/* Ações Rápidas do Cabeçalho */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleExportCSV}
            variant="outline"
            className="h-9 text-xs border-slate-700 bg-slate-900 text-slate-300 hover:text-white rounded-2xl gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" /> Exportar Excel
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setCampaignTypeToCreate('reativacao_sem_compra')
              setCampaignWizardOpen(true)
            }}
            className="h-9 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl gap-1.5 shadow-sm"
          >
            <Megaphone className="w-4 h-4" /> Nova Campanha
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (filteredRecommendations.length > 0) {
                setSelectedRecIds(filteredRecommendations.slice(0, 5).map((r) => r.id))
                setBulkTaskModalOpen(true)
              }
            }}
            className="h-9 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tarefas em Lote
          </Button>
        </div>
      </div>

      {/* 3. DASHBOARD EXECUTIVO — 6 CARDS OBJETIVOS DE PERFORMANCE */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 bg-slate-900/90 border-slate-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Recomendações Pendentes
          </span>
          <strong className="text-2xl font-bold text-amber-400 block my-1">
            {kpis.recomendacoesPendentes}
          </strong>
          <span className="text-[10px] text-slate-500">Prontas para execução</span>
        </Card>

        <Card className="p-3.5 bg-slate-900/90 border-slate-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Tarefas Geradas
          </span>
          <strong className="text-2xl font-bold text-sky-400 block my-1">
            {kpis.tarefasGeradas}
          </strong>
          <span className="text-[10px] text-emerald-400">
            {kpis.tarefasConcluidas} concluídas ({kpis.taxaConversaoPct}%)
          </span>
        </Card>

        <Card className="p-3.5 bg-slate-900/90 border-slate-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Tarefas Vencidas
          </span>
          <strong className="text-2xl font-bold text-rose-400 block my-1">
            {kpis.tarefasVencidas}
          </strong>
          <span className="text-[10px] text-rose-300">Reatribuição recomendada</span>
        </Card>

        <Card className="p-3.5 bg-slate-900/90 border-slate-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Campanhas Ativas
          </span>
          <strong className="text-2xl font-bold text-white block my-1">
            {kpis.campanhasAtivas}
          </strong>
          <span className="text-[10px] text-slate-400">
            {kpis.clientesAbordados} clientes abordados
          </span>
        </Card>

        <Card className="p-3.5 bg-slate-900/90 border-slate-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Taxa de Reativação
          </span>
          <strong className="text-2xl font-bold text-emerald-400 block my-1">
            {kpis.taxaReativacaoPct}%
          </strong>
          <span className="text-[10px] text-emerald-300">
            {kpis.clientesReativados} clientes recuperados
          </span>
        </Card>

        <Card className="p-3.5 bg-slate-900/90 border-slate-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Estoque Convertido
          </span>
          <strong className="text-2xl font-bold text-amber-300 block my-1 font-mono">
            {formatWeight(kpis.estoqueParadoConvertidoTons)}
          </strong>
          <span className="text-[10px] text-slate-400">
            {formatCurrency(kpis.estoqueParadoConvertidoValor)}
          </span>
        </Card>
      </div>

      {/* 4. NAVEGAÇÃO ENTRE AS 7 ABAS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveTab('recomendacoes_ia')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'recomendacoes_ia'
              ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-950" />
          <span>Recomendações da IA ({filteredRecommendations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tarefas_lote')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'tarefas_lote'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Tarefas em Lote ({batches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('campanhas')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'campanhas'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Campanhas ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reativacao')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'reativacao'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reativação de Clientes ({reactivationCandidates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('estoque_parado')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'estoque_parado'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Estoque Parado ({stagnantStockItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('acoes_execucao')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'acoes_execucao'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Ações em Execução ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('resultados')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'resultados'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Resultados & KPIs</span>
        </button>
      </div>

      {/* =========================================================================
          ABA 1: RECOMENDAÇÕES DA IA (COM SELEÇÃO EM LOTE, TOP 10, SELECIONAR TODOS)
         ========================================================================= */}
      {activeTab === 'recomendacoes_ia' && (
        <div className="space-y-4">
          {/* BARRA DE FILTROS & AÇÕES EM LOTE */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Filtro de Texto e Origens */}
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar cliente, produto, cidade..."
                    className="h-8 pl-8 text-xs bg-slate-950 border-slate-700 text-white rounded-xl"
                  />
                </div>

                <Select value={selectedOrigin} onValueChange={(v) => setSelectedOrigin(v as any)}>
                  <SelectTrigger className="h-8 text-xs bg-slate-950 border-slate-700 text-white rounded-xl w-44">
                    <SelectValue placeholder="Origem da IA" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-slate-800">
                    <SelectItem value="todos">Todas as Origens</SelectItem>
                    <SelectItem value="sem_compra">Sem Compra / Inativos</SelectItem>
                    <SelectItem value="sem_cobertura">Sem Cobertura / Vencidos</SelectItem>
                    <SelectItem value="clientes_em_risco">Clientes em Risco (ISC)</SelectItem>
                    <SelectItem value="estoque_parado">Estoque Parado</SelectItem>
                    <SelectItem value="cross_sell">Cross-sell / Mix</SelectItem>
                    <SelectItem value="oportunidades">Cotações Abertas</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedPriority}
                  onValueChange={(v) => setSelectedPriority(v as any)}
                >
                  <SelectTrigger className="h-8 text-xs bg-slate-950 border-slate-700 text-white rounded-xl w-36">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-slate-800">
                    <SelectItem value="todos">Todas Prioridades</SelectItem>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="MEDIA">Média</SelectItem>
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botões de Seleção Rápida */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectTop10Recommendations}
                  className="h-8 text-xs border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 rounded-xl gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Selecionar Top 10</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAllRecommendations}
                  className="h-8 text-xs border-slate-700 bg-slate-950 text-slate-300 hover:text-white rounded-xl gap-1"
                >
                  {selectedRecIds.length === filteredRecommendations.length &&
                  filteredRecommendations.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>
                    {selectedRecIds.length === filteredRecommendations.length &&
                    filteredRecommendations.length > 0
                      ? 'Desmarcar Todos'
                      : 'Selecionar Todos'}
                  </span>
                </Button>
              </div>
            </div>

            {/* BARRA FLUTUANTE DE AÇÕES EM LOTE (QUANDO HOUVER SELEÇÃO) */}
            {selectedRecIds.length > 0 && (
              <div className="p-3 bg-sky-950/80 border border-sky-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in text-xs">
                <div className="flex items-center gap-2">
                  <Badge className="bg-sky-500 text-slate-950 font-bold text-xs">
                    {selectedRecIds.length} Selecionados
                  </Badge>
                  <span className="text-sky-200">Escolha a ação executável em lote:</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    size="sm"
                    onClick={handleOpenBulkTaskModal}
                    className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Criar Tarefas em Lote
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleOpenCampaignFromRecommendations('reativacao_sem_compra')}
                    className="h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl gap-1"
                  >
                    <Megaphone className="w-3.5 h-3.5" /> Criar Campanha
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleOpenCampaignFromRecommendations('cross_sell')}
                    variant="outline"
                    className="h-8 text-xs border-sky-600 text-sky-300 hover:bg-sky-900 rounded-xl gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Enviar Catálogo
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* TABELA DE RECOMENDAÇÕES */}
          <Card className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950 border-b border-slate-800">
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedRecIds.length === filteredRecommendations.length &&
                        filteredRecommendations.length > 0
                      }
                      onChange={handleSelectAllRecommendations}
                      className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-300">
                    Cliente & Vendedor
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-300">
                    Origem & Motivo IA
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-300">
                    Produto Recomendado
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-300 text-center">
                    Indicadores (ISC / Compra)
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-300 text-center">
                    Aderência IA
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-300 text-center">
                    Ação Executável
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecommendations.map((rec) => {
                  const isSelected = selectedRecIds.includes(rec.id)

                  const priorityBadge =
                    rec.prioridade === 'URGENTE'
                      ? 'bg-rose-500 text-white'
                      : rec.prioridade === 'ALTA'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300'

                  return (
                    <TableRow
                      key={rec.id}
                      className={`border-b border-slate-800/60 hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-sky-950/40' : ''
                      }`}
                    >
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRec(rec.id)}
                          className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 cursor-pointer"
                        />
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5">
                          <strong className="text-xs font-bold text-white block">
                            {rec.clienteNome}
                          </strong>
                          <span className="text-[11px] text-slate-400 block">
                            {rec.cidadeUf} · {rec.segmento}
                          </span>
                          <span className="text-[10px] text-sky-400 font-mono block">
                            Resp: {rec.vendedorNome}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Badge className={`text-[9px] border-none ${priorityBadge}`}>
                              {rec.prioridade}
                            </Badge>
                            <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                              {rec.origem.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{rec.motivo}</p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <strong className="text-sky-300 block">
                            {rec.produtoSugerido.descricao}
                          </strong>
                          <span className="text-[10px] text-slate-400 block">
                            Família: {rec.produtoSugerido.familia}
                          </span>
                          {rec.produtoSugerido.saldoEstoqueTons && (
                            <span className="text-[10px] text-emerald-400 font-bold block">
                              Estoque: {rec.produtoSugerido.saldoEstoqueTons}t em pátio
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="space-y-1 text-[11px]">
                          <div>
                            <span className="text-slate-500 text-[10px]">ISC: </span>
                            <strong className={rec.isc >= 75 ? 'text-sky-400' : 'text-amber-400'}>
                              {rec.isc}/100
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px]">Sem Compra: </span>
                            <strong
                              className={
                                rec.diasSemCompra > 60 ? 'text-rose-400' : 'text-slate-300'
                              }
                            >
                              {rec.diasSemCompra}d
                            </strong>
                          </div>
                          {rec.coberturaVencidaDias > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[9px] border-rose-500/50 text-rose-300"
                            >
                              Cobertura -{rec.coberturaVencidaDias}d
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          className={`text-[9px] font-bold border-none ${
                            rec.aderenciaScore === 'MUITO_ALTA'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {rec.aderenciaScore || 'ALTA'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => {
                              const found = customers.find((c) => c.id === rec.clienteId)
                              if (found) {
                                bulkTaskService.createBulkTasks({
                                  batchName: `Ação Individual: ${rec.clienteNome}`,
                                  origem: rec.origem,
                                  clientes: [found],
                                  tipo:
                                    rec.acaoRecomendada === 'Ligar'
                                      ? 'ligacao'
                                      : rec.acaoRecomendada === 'E-mail'
                                        ? 'email'
                                        : 'whatsapp',
                                  dataPrazo: new Date(Date.now() + 86400000 * 2)
                                    .toISOString()
                                    .split('T')[0],
                                  prioridade: rec.prioridade,
                                  responsavelId: rec.vendedorId,
                                  responsavelNome: rec.vendedorNome,
                                  atribuidoPorId: 'gest-01',
                                  atribuidoPorNome: 'Supervisor Comercial',
                                })
                                toast.success(`Tarefa individual criada para ${rec.clienteNome}!`)
                                reloadAll()
                              }
                            }}
                            className="h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl gap-1 shadow-xs"
                          >
                            {rec.acaoRecomendada === 'Ligar' && (
                              <PhoneCall className="w-3.5 h-3.5" />
                            )}
                            {rec.acaoRecomendada === 'WhatsApp' && (
                              <MessageSquare className="w-3.5 h-3.5" />
                            )}
                            {rec.acaoRecomendada === 'E-mail' && <Mail className="w-3.5 h-3.5" />}
                            <span>{rec.acaoRecomendada}</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDirectCreateQuote(rec)}
                            className="h-8 text-xs border-slate-700 bg-slate-950 text-slate-300 hover:text-white rounded-xl"
                          >
                            Cotação
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* =========================================================================
          ABA 2: TAREFAS EM LOTE (SUMARIZADOR, PROGRESSO, DRILL-DOWN E REATRIBUIÇÃO)
         ========================================================================= */}
      {activeTab === 'tarefas_lote' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {batches.map((batch) => {
              const pctConcluida =
                batch.totalTarefas > 0
                  ? Math.round((batch.concluidas / batch.totalTarefas) * 100)
                  : 0

              return (
                <Card
                  key={batch.id}
                  className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-md flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40 uppercase">
                        {batch.origem.replace(/_/g, ' ')}
                      </span>
                      <Badge className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px]">
                        {batch.totalTarefas} Tarefas
                      </Badge>
                    </div>

                    <h3 className="font-serif font-bold text-base text-white">{batch.nome}</h3>
                    <p className="text-xs text-slate-400">
                      Responsável: <strong>{batch.responsavelNome}</strong> · Criado em:{' '}
                      {batch.criadoEm}
                    </p>

                    {/* Barra de Progresso */}
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Progresso de Execução</span>
                        <strong className="text-emerald-400">{pctConcluida}%</strong>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${pctConcluida}%` }}
                          className="bg-emerald-500 h-full transition-all"
                        />
                      </div>
                    </div>

                    {/* Drill-down de Contadores Clicáveis */}
                    <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-mono">
                      <div
                        onClick={() => {
                          setDrilledBatchId(batch.id)
                          setDrilledStatusFilter('concluida')
                        }}
                        className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 cursor-pointer hover:bg-emerald-950/70 transition-all"
                      >
                        <span className="text-[10px] text-emerald-400 block">Concluídas</span>
                        <strong className="text-sm text-emerald-300">{batch.concluidas}</strong>
                      </div>

                      <div
                        onClick={() => {
                          setDrilledBatchId(batch.id)
                          setDrilledStatusFilter('pendente')
                        }}
                        className="p-2 rounded-xl bg-sky-950/40 border border-sky-800/40 cursor-pointer hover:bg-sky-950/70 transition-all"
                      >
                        <span className="text-[10px] text-sky-400 block">Pendentes</span>
                        <strong className="text-sm text-sky-300">{batch.pendentes}</strong>
                      </div>

                      <div
                        onClick={() => {
                          setDrilledBatchId(batch.id)
                          setDrilledStatusFilter('vencida')
                        }}
                        className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/40 cursor-pointer hover:bg-rose-950/70 transition-all"
                      >
                        <span className="text-[10px] text-rose-400 block">Vencidas</span>
                        <strong className="text-sm text-rose-300">{batch.vencidas}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé com Conversão e Botões */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Volume Convertido:</span>
                      <strong className="text-white font-mono">
                        {batch.volumeConvertidoTons}t ({formatCurrency(batch.faturamentoConvertido)}
                        )
                      </strong>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDrilledBatchId(batch.id)
                        setDrilledStatusFilter(null)
                      }}
                      className="h-8 text-xs border-slate-700 text-slate-300 hover:text-white rounded-xl gap-1"
                    >
                      <span>Ver Clientes</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Drill-down de Tarefas do Lote Selecionado */}
          {drilledBatchId && (
            <Card className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-sky-500 text-slate-950 font-bold text-xs">
                    Drill-down Lote: {batches.find((b) => b.id === drilledBatchId)?.nome}
                  </Badge>
                  {drilledStatusFilter && (
                    <Badge variant="outline" className="text-xs uppercase text-amber-300 font-mono">
                      Filtro: {drilledStatusFilter}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const batchTasks = tasks
                        .filter((t) => t.batchId === drilledBatchId)
                        .map((t) => t.id)
                      setSelectedTaskIdsForBulkAction(batchTasks)
                      setReassignModalOpen(true)
                    }}
                    className="h-8 text-xs border-amber-500/50 text-amber-300 hover:bg-amber-500/20 rounded-xl gap-1"
                  >
                    <Users className="w-3.5 h-3.5" /> Reatribuir Lote
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDrilledBatchId(null)
                      setDrilledStatusFilter(null)
                    }}
                    className="h-8 text-xs text-slate-400 hover:text-white"
                  >
                    Fechar Detalhe
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader className="bg-slate-950">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-slate-300">Cliente</TableHead>
                    <TableHead className="text-xs font-bold text-slate-300">Tipo & Prazo</TableHead>
                    <TableHead className="text-xs font-bold text-slate-300">Responsável</TableHead>
                    <TableHead className="text-xs font-bold text-slate-300">Status</TableHead>
                    <TableHead className="text-xs font-bold text-slate-300">
                      Mensagem IA / Produto
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-300 text-center">
                      Ação
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks
                    .filter(
                      (t) =>
                        t.batchId === drilledBatchId &&
                        (!drilledStatusFilter || t.status === drilledStatusFilter),
                    )
                    .map((task) => (
                      <TableRow key={task.id} className="border-b border-slate-800/60">
                        <TableCell>
                          <strong className="text-xs font-bold text-white block">
                            {task.clienteNome}
                          </strong>
                          <span className="text-[10px] text-slate-400">{task.clienteCidadeUf}</span>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            <span className="capitalize text-sky-300 font-semibold block">
                              {task.tipo}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Prazo: {task.dataPrazo}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-slate-300">
                          {task.responsavelNome}
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={`text-[9px] font-bold border-none ${
                              task.status === 'concluida'
                                ? 'bg-emerald-500 text-white'
                                : task.status === 'vencida'
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-amber-500 text-slate-950 font-bold'
                            }`}
                          >
                            {task.status.toUpperCase()}
                          </Badge>
                        </TableCell>

                        <TableCell className="max-w-xs text-xs text-slate-300">
                          <p className="line-clamp-2 italic font-sans text-[11px]">
                            "{task.mensagemSugeridaIA}"
                          </p>
                          {task.produtoSugerido && (
                            <span className="text-[10px] text-sky-400 block mt-0.5">
                              Item: {task.produtoSugerido.descricao}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          {task.status !== 'concluida' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                bulkTaskService.completeTask(task.id, {
                                  respostaCliente: {
                                    conteudo: 'Cliente contatado com sucesso.',
                                    sentimento: 'positivo',
                                    canal: 'whatsapp',
                                  },
                                  valorConvertido: 45000,
                                  volumeConvertidoTons: 6.0,
                                })
                                toast.success(`Tarefa concluída para ${task.clienteNome}!`)
                                reloadAll()
                              }}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}

      {/* =========================================================================
          ABA 3: CAMPANHAS (E-MAIL, WHATSAPP, FUNIL, CONTROLE, SUPRESSÃO, A/B TEST)
         ========================================================================= */}
      {activeTab === 'campanhas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {campaigns.map((camp) => (
              <Card
                key={camp.id}
                className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-md space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800/40">
                        {camp.codigo}
                      </span>
                      <Badge className="bg-emerald-500 text-white text-[10px] font-bold">
                        {camp.status.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                      {camp.isAbTestActive && (
                        <Badge className="bg-purple-500 text-white text-[9px] font-bold">
                          Teste A/B Ativo
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 capitalize">
                      Canal: {camp.canal}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-lg text-white">{camp.titulo}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{camp.descricao}</p>
                  </div>

                  {/* Funil Visual de Conversão da Campanha */}
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Funil de Conversão Comercial:
                    </span>
                    <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
                      <div className="p-1.5 bg-slate-900 rounded-lg">
                        <span className="text-slate-500 block">Enviados</span>
                        <strong className="text-slate-200 text-xs">{camp.metricas.enviados}</strong>
                      </div>
                      <div className="p-1.5 bg-slate-900 rounded-lg">
                        <span className="text-slate-500 block">Entregues</span>
                        <strong className="text-slate-200 text-xs">
                          {camp.metricas.entregues}
                        </strong>
                      </div>
                      <div className="p-1.5 bg-sky-950/60 rounded-lg border border-sky-800/40">
                        <span className="text-sky-400 block">Respostas</span>
                        <strong className="text-sky-300 text-xs">{camp.metricas.respostas}</strong>
                      </div>
                      <div className="p-1.5 bg-amber-950/60 rounded-lg border border-amber-800/40">
                        <span className="text-amber-400 block">Cotações</span>
                        <strong className="text-amber-300 text-xs">
                          {camp.metricas.cotacoesGeradas}
                        </strong>
                      </div>
                      <div className="p-1.5 bg-emerald-950/60 rounded-lg border border-emerald-800/40">
                        <span className="text-emerald-400 block">Pedidos</span>
                        <strong className="text-emerald-300 text-xs">
                          {camp.metricas.pedidosGerados}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Análise de IA da Campanha */}
                  {camp.analiseIA && (
                    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Análise Estatística da IA</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {camp.analiseIA.sumario}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                        <div>
                          Melhor segmento:{' '}
                          <strong className="text-white">{camp.analiseIA.melhorSegmento}</strong>
                        </div>
                        <div>
                          Melhor produto:{' '}
                          <strong className="text-white">{camp.analiseIA.melhorProduto}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Faturamento Reativado:</span>
                    <strong className="text-emerald-400 font-mono text-sm">
                      {formatCurrency(camp.metricas.faturamentoTotal)}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedCampaignForDrilldown(camp)}
                      className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Drill-down & IA
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        navigate('/crm/cotacoes/nova', {
                          state: {
                            origem: `campanha_${camp.id}`,
                            campanhaNome: camp.titulo,
                          },
                        })
                      }}
                      className="h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl gap-1"
                    >
                      Gerar Cotação
                    </Button>
                  </div>{' '}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 4: REATIVAÇÃO DE CLIENTES (FILTRO SEM COMPRA, PRIORIDADE, ESTOQUE)
         ========================================================================= */}
      {activeTab === 'reativacao' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-sky-400" />
                Base de Reativação de Clientes Sem Compra
              </h3>
              <p className="text-xs text-slate-400">
                Público classificado por faixas de inatividade cruzado com histórico, score de
                aderência e estoque disponível.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setCampaignTypeToCreate('reativacao_sem_compra')
                setCampaignWizardOpen(true)
              }}
              className="h-9 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl gap-1.5 shadow-sm"
            >
              <Megaphone className="w-4 h-4" /> Criar Campanha de Reativação
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reactivationCandidates.map((cand) => (
              <Card
                key={cand.cliente.id}
                className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-400">
                      Sem Compra: {cand.cliente.diasSemCompra}d (
                      {cand.faixaInatividade.replace('_', ' a ')}d)
                    </span>
                    <Badge
                      className={`text-[9px] font-bold border-none ${
                        cand.prioridadeReativacao === 'ALTA'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      Prioridade {cand.prioridadeReativacao}
                    </Badge>
                  </div>

                  <div>
                    <strong className="text-sm font-bold text-white block">
                      {cand.cliente.nomeFantasia || cand.cliente.razaoSocial}
                    </strong>
                    <span className="text-[11px] text-slate-400 block">
                      {cand.cliente.cidade} - {cand.cliente.uf} · {cand.cliente.segmento}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">
                      Score de Aderência IA: {cand.scoreAderencia}
                    </span>
                    <p className="mt-0.5">{cand.motivoAderencia}</p>
                  </div>

                  {cand.produtoMatching && (
                    <div className="text-xs pt-1 border-t border-slate-800">
                      <span className="text-[10px] text-slate-500 block">
                        Produto Matching em Pátio:
                      </span>
                      <strong className="text-sky-300">{cand.produtoMatching.descricao}</strong>
                      <span className="text-[10px] text-emerald-400 block">
                        Saldo: {cand.produtoMatching.saldoEstoqueTons}t liberadas
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      bulkTaskService.createBulkTasks({
                        batchName: `Reativação: ${cand.cliente.nomeFantasia}`,
                        origem: 'sem_compra',
                        clientes: [cand.cliente],
                        tipo: 'whatsapp',
                        dataPrazo: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                        prioridade: cand.prioridadeReativacao,
                        responsavelId: cand.cliente.vendedorId,
                        responsavelNome: cand.cliente.vendedorNome,
                        atribuidoPorId: 'gest-01',
                        atribuidoPorNome: 'Supervisor Comercial',
                      })
                      toast.success(
                        `Tarefa de reativação criada para ${cand.cliente.nomeFantasia}!`,
                      )
                      reloadAll()
                    }}
                    className="flex-1 h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Reativar
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigate('/crm/cotacoes/nova', {
                        state: {
                          clienteId: cand.cliente.id,
                          clienteNome: cand.cliente.nomeFantasia,
                          origem: 'reativacao_inativo',
                        },
                      })
                    }}
                    className="h-8 text-xs border-slate-700 bg-slate-950 text-slate-300 hover:text-white rounded-xl"
                  >
                    Cotação
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 5: ESTOQUE PARADO (SELECIONAR PRODUTO → IA ENCONTRA CLIENTES → DISPARAR)
         ========================================================================= */}
      {activeTab === 'estoque_parado' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                Motor de Destravamento de Estoque Parado × Clientes
              </h3>
              <p className="text-xs text-slate-400">
                Selecione o produto parado em pátio; a IA identifica automaticamente os clientes com
                histórico de consumo, crédito e aderência logística.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stagnantStockItems.map((item) => {
              const matchedBuyers = reactivationService.findAdeptClientsForStockProduct(
                item.materialCode,
              )
              const topBuyer = matchedBuyers[0]

              return (
                <Card
                  key={item.id}
                  className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 flex flex-col justify-between hover:border-amber-500/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        {item.materialCode}
                      </span>
                      <Badge className="bg-rose-500 text-white text-[10px] font-bold">
                        {item.daysWithoutMovement} dias parado
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-serif font-bold text-base text-white">
                        {item.description}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                        <span>
                          Pátio: <strong>{item.plantName}</strong>
                        </span>
                        <span className="text-emerald-400 font-bold font-mono">
                          {formatWeight(item.availableTons)} livres
                        </span>
                      </div>
                    </div>

                    {/* Cliente Recomendado pela IA */}
                    {topBuyer && (
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-sky-400 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Cliente com Maior Fit IA:
                          </span>
                          <Badge className="bg-emerald-500 text-white text-[9px] font-bold">
                            Fit {topBuyer.scoreAderencia}
                          </Badge>
                        </div>
                        <strong className="text-white block">
                          {topBuyer.cliente.nomeFantasia}
                        </strong>
                        <p className="text-[11px] text-slate-300 leading-snug">{topBuyer.motivo}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setCampaignProducts([
                          {
                            codigo: item.materialCode,
                            descricao: item.description,
                            familia: item.family,
                            estoqueDisponivelTons: item.availableTons,
                            precoReferenciaKg: item.historicAvgPriceKg,
                            diasParado: item.daysWithoutMovement,
                          },
                        ])
                        setCampaignTypeToCreate('estoque_parado')
                        setCampaignWizardOpen(true)
                      }}
                      className="flex-1 h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl gap-1"
                    >
                      <Megaphone className="w-3.5 h-3.5" /> Criar Campanha do Lote
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 6: AÇÕES EM EXECUÇÃO (TODAS AS TAREFAS INDIVIDUALIZADAS)
         ========================================================================= */}
      {activeTab === 'acoes_execucao' && (
        <Card className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden space-y-4 p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400" />
              Tarefas Comerciais Individualizadas ({tasks.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">1 tarefa por cliente</span>
          </div>

          <Table>
            <TableHeader className="bg-slate-950">
              <TableRow>
                <TableHead className="text-xs font-bold text-slate-300">Cliente & Cidade</TableHead>
                <TableHead className="text-xs font-bold text-slate-300">Tipo / Origem</TableHead>
                <TableHead className="text-xs font-bold text-slate-300">Responsável</TableHead>
                <TableHead className="text-xs font-bold text-slate-300">Prazo</TableHead>
                <TableHead className="text-xs font-bold text-slate-300">Status</TableHead>
                <TableHead className="text-xs font-bold text-slate-300">Abordagem IA</TableHead>
                <TableHead className="text-xs font-bold text-slate-300 text-center">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="border-b border-slate-800/60 hover:bg-slate-800/40"
                >
                  <TableCell>
                    <strong className="text-xs font-bold text-white block">
                      {task.clienteNome}
                    </strong>
                    <span className="text-[10px] text-slate-400">{task.clienteCidadeUf}</span>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <span className="capitalize text-sky-300 font-semibold block">
                        {task.tipo}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        {task.origem.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-slate-300">{task.responsavelNome}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-300">
                    {task.dataPrazo}
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={`text-[9px] font-bold border-none ${
                        task.status === 'concluida'
                          ? 'bg-emerald-500 text-white'
                          : task.status === 'vencida'
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {task.status.toUpperCase()}
                    </Badge>
                  </TableCell>

                  <TableCell className="max-w-xs text-xs text-slate-300">
                    <p className="line-clamp-2 italic font-sans text-[11px]">
                      "{task.mensagemSugeridaIA}"
                    </p>
                  </TableCell>

                  <TableCell className="text-center">
                    {task.status !== 'concluida' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          bulkTaskService.completeTask(task.id, {
                            respostaCliente: {
                              conteudo: 'Interação concluída pelo vendedor.',
                              sentimento: 'positivo',
                              canal: 'whatsapp',
                            },
                            valorConvertido: 35000,
                            volumeConvertidoTons: 4.5,
                          })
                          toast.success(`Tarefa concluída com sucesso!`)
                          reloadAll()
                        }}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* =========================================================================
          ABA 7: RESULTADOS & KPIS EXECUTIVOS
         ========================================================================= */}
      {activeTab === 'resultados' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase">
                Volume Total Convertido
              </span>
              <h3 className="text-3xl font-serif font-bold text-white font-mono">
                {formatWeight(kpis.volumeReativadoTons)}
              </h3>
              <p className="text-[11px] text-emerald-400">Aço escoado através de ações ativas</p>
            </Card>

            <Card className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase">
                Faturamento Reativado
              </span>
              <h3 className="text-3xl font-serif font-bold text-emerald-400 font-mono">
                {formatCurrency(kpis.faturamentoReativado)}
              </h3>
              <p className="text-[11px] text-slate-400">Total faturado pós-campanhas e tarefas</p>
            </Card>

            <Card className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Taxa de Reativação</span>
              <h3 className="text-3xl font-serif font-bold text-amber-400">
                {kpis.taxaReativacaoPct}%
              </h3>
              <p className="text-[11px] text-slate-400">
                {kpis.clientesReativados} de {kpis.clientesAbordados} clientes
              </p>
            </Card>

            <Card className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase">
                Estoque Parado Liquidado
              </span>
              <h3 className="text-3xl font-serif font-bold text-sky-400 font-mono">
                {formatWeight(kpis.estoqueParadoConvertidoTons)}
              </h3>
              <p className="text-[11px] text-slate-400">
                {formatCurrency(kpis.estoqueParadoConvertidoValor)} em capital destravado
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO DE TAREFAS EM LOTE */}
      <CreateBulkTasksModal
        open={bulkTaskModalOpen}
        onOpenChange={setBulkTaskModalOpen}
        clientes={selectedCustomersForBulk}
        onTasksCreated={reloadAll}
      />

      {/* 8. MODAL WIZARD DE CAMPANHA COMERCIAL INTELIGENTE COM A/B TEST E IA */}
      <EnhancedCampaignWizardModal
        open={campaignWizardOpen}
        onOpenChange={setCampaignWizardOpen}
        tipoCampanha={campaignTypeToCreate}
        clientesSelecionados={
          selectedCustomersForBulk.length > 0 ? selectedCustomersForBulk : customers.slice(0, 8)
        }
        produtosIniciais={campaignProducts}
        onCampaignCreated={() => {
          reloadAll()
          setActiveTab('campanhas')
        }}
      />

      {/* 9. MODAL DRILL-DOWN DA CAMPANHA + A/B TEST + DIAGNÓSTICO IA EM 10 PONTOS */}
      <CampaignAIDrilldownModal
        open={Boolean(selectedCampaignForDrilldown)}
        onOpenChange={(op) => !op && setSelectedCampaignForDrilldown(null)}
        campanha={selectedCampaignForDrilldown}
        onNavigateToQuote={(cmp) => {
          setSelectedCampaignForDrilldown(null)
          navigate('/crm/cotacoes/nova', {
            state: {
              origem: `campanha_${cmp.id}`,
              campanhaNome: cmp.titulo,
            },
          })
        }}
      />
    </div>
  )
}
