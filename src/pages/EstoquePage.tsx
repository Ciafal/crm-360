import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Sparkles,
  Layers,
  Scale,
  Clock,
  Warehouse,
  ShieldCheck,
  TrendingUp,
  Sliders,
  AlertTriangle,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { stockService } from '@/services/stock_service'

import type {
  StockItem,
  StockCheckRequest,
  CommercialOpportunity,
  StockGovernanceParam,
  StockAuditLog,
  StockFilterState,
  StockOverviewKpis,
} from '@/types/stock'
import { StockFilterBar } from '@/components/estoque/StockFilterBar'
import { StockOverviewCards } from '@/components/estoque/StockOverviewCards'
import { StockAgingView } from '@/components/estoque/StockAgingView'
import { StockStagnantView } from '@/components/estoque/StockStagnantView'
import { StockSellerView } from '@/components/estoque/StockSellerView'
import { StockCheckRequestsView } from '@/components/estoque/StockCheckRequestsView'
import { StockCommercialOpportunitiesView } from '@/components/estoque/StockCommercialOpportunitiesView'
import { StockAIPanel } from '@/components/estoque/StockAIPanel'
import { StockAdminMasterView } from '@/components/estoque/StockAdminMasterView'
import { RequestStockCheckModal } from '@/components/estoque/RequestStockCheckModal'
import { RespondStockCheckModal } from '@/components/estoque/RespondStockCheckModal'
import { exportToCsv } from '@/lib/utils'

export type StockViewTab =
  | 'visao_geral'
  | 'analise_estoque'
  | 'idade_estoque'
  | 'produtos_parados'
  | 'estoque_vendedor'
  | 'solicitacoes_checagem'
  | 'oportunidades_comerciais'
  | 'painel_ia'
  | 'admin_governanca'

export default function EstoquePage() {
  const { user } = useAuth()
  const { toast } = useToast()

  // Estado da aba ativa (7 visões principais + IA + Admin)
  const [activeTab, setActiveTab] = useState<StockViewTab>('visao_geral')

  // Dados mestres e staging
  const [rawItems, setRawItems] = useState<StockItem[]>([])
  const [checkRequests, setCheckRequests] = useState<StockCheckRequest[]>([])
  const [governanceParams, setGovernanceParams] = useState<StockGovernanceParam[]>([])
  const [auditLogs, setAuditLogs] = useState<StockAuditLog[]>([])
  const [isSyncingSap, setIsSyncingSap] = useState(false)
  const [lastSapSync, setLastSapSync] = useState<string>('19/10/2024 08:30')

  // Modais de Checagem
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [respondModalOpen, setRespondModalOpen] = useState(false)
  const [selectedStockItemForCheck, setSelectedStockItemForCheck] = useState<StockItem | null>(null)
  const [selectedCheckRequestForRespond, setSelectedCheckRequestForRespond] =
    useState<StockCheckRequest | null>(null)

  // Filtros Globais Unificados (Regra 19)
  const [filters, setFilters] = useState<StockFilterState>({
    period: 'mes_atual',
    plantCode: 'todos',
    storageLocation: 'todos',
    materialCode: '',
    family: 'todos',
    line: 'todos',
    bitola: 'todos',
    quality: 'todos',
    sellerId: 'todos',
    team: 'todos',
    region: 'todos',
    customerId: 'todos',
    segment: 'todos',
    ageBracket: 'todos',
    classification: 'todos',
    status: 'todos',
    searchTerm: '',
  })

  // Carregamento inicial de dados
  const loadData = () => {
    const items = stockService.getStoredStockItems()
    const checks = stockService.getStoredStockChecks()
    const params = stockService.getStoredGovernanceParams()
    const logs = stockService.getStoredAuditLogs()

    setRawItems(items)
    setCheckRequests(checks)
    setGovernanceParams(params)
    setAuditLogs(logs)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Isolamento no BACKEND/SERVIÇO (Regra 11 e 14)
  const authorizedItems = React.useMemo(() => {
    return stockService.filterStockByAccess(rawItems, user)
  }, [rawItems, user])

  // Aplicação dos Filtros Ativos
  const filteredItems = React.useMemo(() => {
    return authorizedItems.filter((item) => {
      if (filters.plantCode !== 'todos' && item.plantCode !== filters.plantCode) return false
      if (filters.storageLocation !== 'todos' && item.storageLocation !== filters.storageLocation)
        return false
      if (filters.family !== 'todos' && item.family !== filters.family) return false
      if (filters.quality !== 'todos' && item.quality !== filters.quality) return false
      if (filters.ageBracket !== 'todos' && item.ageBracket !== filters.ageBracket) return false
      if (filters.classification !== 'todos' && item.classification !== filters.classification)
        return false
      if (
        filters.region !== 'todos' &&
        !item.allowedRegions?.some((r) => r.toLowerCase().includes(filters.region.toLowerCase()))
      )
        return false
      if (filters.sellerId !== 'todos' && item.assignedSellerId !== filters.sellerId) return false

      if (filters.searchTerm) {
        const q = filters.searchTerm.toLowerCase()
        const matchCode = item.materialCode.toLowerCase().includes(q)
        const matchDesc = item.description.toLowerCase().includes(q)
        const matchLote = item.batchNumber && item.batchNumber.toLowerCase().includes(q)
        const matchFam = item.family.toLowerCase().includes(q)
        if (!matchCode && !matchDesc && !matchLote && !matchFam) return false
      }

      return true
    })
  }, [authorizedItems, filters])

  // KPIs Calculados em Tempo Real
  const kpis: StockOverviewKpis = React.useMemo(() => {
    return stockService.getOverviewKpis(filteredItems)
  }, [filteredItems])

  // Clientes simulados da carteira comercial para cruzamento IA
  const clientPortfolioMock = [
    {
      id: 'cli-100001',
      sapCode: '100001',
      nomeFantasia: 'Metalúrgica Santa Rita Ltda',
      razaoSocial: 'Metalúrgica Santa Rita de Cássia S.A.',
      cidade: 'Contagem',
      uf: 'MG',
      segmento: 'Construção Civil',
      subsegmento: 'Estruturas Metálicas & Galpões',
      vendedorId: 'qas-vendedor_teste',
      vendedor: 'Carlos Mendonça',
      limiteCredito: 250000,
      creditoDisponivel: 185000,
      statusCredito: 'Regular',
      toneladas12m: 85.0,
      ultimaCompraData: '15/05/2024',
      diasSemContato: 14,
      recorrencia: 'Mensal',
      mediaMensalTons: 12.0,
      pipelineTons: 25.0,
    },
    {
      id: 'cli-100002',
      sapCode: '100002',
      nomeFantasia: 'Aços & Caldeiraria Betim S.A.',
      razaoSocial: 'Aços Betim Caldeiraria Pesada e Montagens',
      cidade: 'Betim',
      uf: 'MG',
      segmento: 'Indústria',
      subsegmento: 'Caldeiraria Pesada & Tanques',
      vendedorId: 'qas-vendedor_teste',
      vendedor: 'Carlos Mendonça',
      limiteCredito: 450000,
      creditoDisponivel: 320000,
      statusCredito: 'Regular',
      toneladas12m: 140.0,
      ultimaCompraData: '12/10/2024',
      diasSemContato: 7,
      recorrencia: 'Quinzenal',
      mediaMensalTons: 18.0,
      pipelineTons: 40.0,
    },
    {
      id: 'cli-100006',
      sapCode: '100006',
      nomeFantasia: 'Inox Vale do Aço Tubos Especiais Ltda',
      razaoSocial: 'Inox Vale do Aço Indústria e Comércio',
      cidade: 'Ipatinga',
      uf: 'MG',
      segmento: 'Indústria',
      subsegmento: 'Inox Sanitário & Alimentício',
      vendedorId: 'qas-vendedor_teste',
      vendedor: 'Carlos Mendonça',
      limiteCredito: 300000,
      creditoDisponivel: 210000,
      statusCredito: 'Regular',
      toneladas12m: 45.0,
      ultimaCompraData: '10/04/2024',
      diasSemContato: 25,
      recorrencia: 'Trimestral',
      mediaMensalTons: 6.0,
      pipelineTons: 15.0,
    },
    {
      id: 'cli-100011',
      sapCode: '100011',
      nomeFantasia: 'Oeste Minas Galpões & Coberturas Ltda',
      razaoSocial: 'Oeste Minas Perfis e Telhas Galvanizadas',
      cidade: 'Divinópolis',
      uf: 'MG',
      segmento: 'Construção Civil',
      subsegmento: 'Coberturas & Telhas Galvalume',
      vendedorId: 'qas-vendedor2_teste',
      vendedor: 'Mariana Azevedo',
      limiteCredito: 180000,
      creditoDisponivel: 95000,
      statusCredito: 'Regular',
      toneladas12m: 60.0,
      ultimaCompraData: '20/06/2024',
      diasSemContato: 30,
      recorrencia: 'Bimestral',
      mediaMensalTons: 8.0,
      pipelineTons: 18.0,
    },
  ]

  // Oportunidades Comerciais IA
  const commercialOpportunities: CommercialOpportunity[] = React.useMemo(() => {
    return stockService.generateCommercialOpportunities(filteredItems, clientPortfolioMock, user)
  }, [filteredItems, user])

  // Ações de Sincronização SAP ECC
  const handleTriggerSapSync = async () => {
    setIsSyncingSap(true)
    try {
      const result = await stockService.triggerSapSync(user)
      setLastSapSync(result.timestamp)
      loadData()
      toast({
        title: 'SAP ECC Sincronizado!',
        description: result.message,
      })
    } catch (err: any) {
      toast({
        title: 'Erro na integração SAP',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSyncingSap(false)
    }
  }

  // Ações de Exportação (Regra 24)
  const handleExport = (format: 'EXCEL' | 'PDF') => {
    const filename = `Estoque_CIAFAL_${new Date().toISOString().slice(0, 10)}`
    const exportData = filteredItems.map((it) => ({
      Codigo_Material: it.materialCode,
      Descricao: it.description,
      Familia: it.family,
      Centro: it.plantName,
      Deposito: it.storageLocation,
      Lote: it.batchNumber || '',
      Fisico_Tons: it.physicalTons,
      Disponivel_Venda_Tons: it.availableTons,
      Comprometido_Tons: it.committedTons,
      Idade_Dias: it.ageDays,
      Classificacao: it.classification,
      Valor_Estimado_BRL: it.estimatedTotalValue,
      Ultima_Movimentacao: it.lastMovementDate,
      Ultimo_Cliente: it.lastCustomerName || '',
    }))

    exportToCsv(filename, exportData)

    stockService.registerAuditLog({
      userId: user?.id || 'anonymous',
      userName: user?.name || 'Carlos Mendonça',
      userRole: user?.role || 'vendedor',
      actionType: format === 'EXCEL' ? 'EXPORTACAO_EXCEL' : 'EXPORTACAO_PDF',
      targetObject: 'inventory_staging',
      exportFormat: format,
      filtersApplied: filters,
      details: `Exportação de ${filteredItems.length} registros de estoque em formato ${format}.`,
    })

    toast({
      title: `Exportação ${format} gerada com sucesso!`,
      description: 'Arquivo baixado e registrado na trilha de auditoria.',
    })
  }

  // Handlers de Checagem
  const handleOpenRequestCheck = (item: StockItem) => {
    setSelectedStockItemForCheck(item)
    setRequestModalOpen(true)
  }

  const handleOpenRespondCheck = (request: StockCheckRequest) => {
    setSelectedCheckRequestForRespond(request)
    setRespondModalOpen(true)
  }

  const isManager =
    user?.role === 'administrador' ||
    user?.role === 'admin' ||
    user?.role === 'supervisor' ||
    user?.role === 'diretor_comercial'

  return (
    <div className="space-y-6 pb-12">
      {/* 1. CABEÇALHO EXECUTIVO DO MÓDULO ESTOQUE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-xl">
              MÓDULO DE GESTÃO COMERCIAL
            </span>
            <span className="text-xs text-muted-foreground">
              Atualizado em: <strong className="text-slate-800">{lastSapSync}</strong> (SAP ECC /
              WMS)
            </span>
          </div>

          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Warehouse className="w-8 h-8 text-primary" />
            Gestão Comercial de Estoque CIAFAL
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Disponibilidade para venda imediata, capital imobilizado, idade (aging), parados,
            oportunidades comerciais e conferência física WMS.
          </p>
        </div>

        {/* AÇÕES DE SINCRONIZAÇÃO E EXPORTAÇÃO */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerSapSync}
            disabled={isSyncingSap}
            className="h-9 text-xs rounded-2xl gap-1.5 border-slate-200 bg-white"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-primary ${isSyncingSap ? 'animate-spin' : ''}`}
            />
            <span>{isSyncingSap ? 'Consultando SAP...' : 'Atualizar via SAP RFC'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('EXCEL')}
            className="h-9 text-xs rounded-2xl gap-1.5 border-slate-200 bg-white"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Excel</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (filteredItems.length > 0) {
                handleOpenRequestCheck(filteredItems[0])
              } else {
                toast({ title: 'Nenhum item disponível para checagem' })
              }
            }}
            className="h-9 text-xs rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold gap-1.5 shadow-xs"
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>Solicitar Checagem Física</span>
          </Button>
        </div>
      </div>

      {/* 2. NAVEGAÇÃO ENTRE AS 7 VISÕES PRINCIPAIS + IA + ADMIN */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60 scrollbar-none">
        <button
          onClick={() => setActiveTab('visao_geral')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'visao_geral'
              ? 'bg-primary text-white shadow-xs'
              : 'text-muted-foreground hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('analise_estoque')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'analise_estoque'
              ? 'bg-primary text-white shadow-xs'
              : 'text-muted-foreground hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Análise de Estoque</span>
        </button>

        <button
          onClick={() => setActiveTab('idade_estoque')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'idade_estoque'
              ? 'bg-primary text-white shadow-xs'
              : 'text-muted-foreground hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Idade do Estoque (Aging)</span>
        </button>

        <button
          onClick={() => setActiveTab('produtos_parados')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'produtos_parados'
              ? 'bg-primary text-white shadow-xs'
              : 'text-muted-foreground hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Produtos Parados</span>
        </button>

        <button
          onClick={() => setActiveTab('estoque_vendedor')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'estoque_vendedor'
              ? 'bg-primary text-white shadow-xs'
              : 'text-muted-foreground hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Estoque do Vendedor</span>
        </button>

        <button
          onClick={() => setActiveTab('solicitacoes_checagem')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'solicitacoes_checagem'
              ? 'bg-primary text-white shadow-xs'
              : 'text-muted-foreground hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Solicitações de Checagem</span>
          <Badge className="ml-1 h-4 px-1.5 text-[9px] bg-slate-900 text-white">
            {checkRequests.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('oportunidades_comerciais')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'oportunidades_comerciais'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-muted-foreground hover:bg-amber-50 hover:text-amber-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Oportunidades Comerciais</span>
          <Badge className="ml-1 h-4 px-1.5 text-[9px] bg-amber-600 text-white">
            {commercialOpportunities.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('painel_ia')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'painel_ia'
              ? 'bg-primary text-white shadow-xs'
              : 'text-muted-foreground hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Diagnóstico IA</span>
        </button>

        {isManager && (
          <button
            onClick={() => setActiveTab('admin_governanca')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'admin_governanca'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-muted-foreground hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Admin Master</span>
          </button>
        )}
      </div>

      {/* 3. BARRA DE FILTROS UNIFICADA REATIVA (Regra 19) */}
      <StockFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        onResetFilters={() =>
          setFilters({
            period: 'mes_atual',
            plantCode: 'todos',
            storageLocation: 'todos',
            materialCode: '',
            family: 'todos',
            line: 'todos',
            bitola: 'todos',
            quality: 'todos',
            sellerId: 'todos',
            team: 'todos',
            region: 'todos',
            customerId: 'todos',
            segment: 'todos',
            ageBracket: 'todos',
            classification: 'todos',
            status: 'todos',
            searchTerm: '',
          })
        }
        userRole={user?.role}
      />

      {/* 4. RENDERIZAÇÃO CONDICIONAL DA VISÃO SELECIONADA */}
      {activeTab === 'visao_geral' && (
        <div className="space-y-6">
          <StockOverviewCards
            kpis={kpis}
            onSelectFilterQuick={(t) => {
              if (t === 'parados') setActiveTab('produtos_parados')
              if (t === 'aging') setActiveTab('idade_estoque')
            }}
          />
          <StockAgingView
            items={filteredItems}
            onRequestCheck={handleOpenRequestCheck}
            onFilterByBracket={(bracket) => setFilters({ ...filters, ageBracket: bracket })}
          />
        </div>
      )}

      {activeTab === 'analise_estoque' && (
        <div className="space-y-6">
          <StockOverviewCards kpis={kpis} />
          <StockSellerView
            items={filteredItems}
            onRequestCheck={handleOpenRequestCheck}
            onFindOpportunities={(item) => setActiveTab('oportunidades_comerciais')}
            userName={user?.name}
          />
        </div>
      )}

      {activeTab === 'idade_estoque' && (
        <StockAgingView
          items={filteredItems}
          onRequestCheck={handleOpenRequestCheck}
          onFilterByBracket={(bracket) => setFilters({ ...filters, ageBracket: bracket })}
        />
      )}

      {activeTab === 'produtos_parados' && (
        <StockStagnantView
          items={filteredItems}
          onRequestCheck={handleOpenRequestCheck}
          onFindBuyers={(item) => setActiveTab('oportunidades_comerciais')}
        />
      )}

      {activeTab === 'estoque_vendedor' && (
        <StockSellerView
          items={filteredItems}
          onRequestCheck={handleOpenRequestCheck}
          onFindOpportunities={(item) => setActiveTab('oportunidades_comerciais')}
          userName={user?.name}
        />
      )}

      {activeTab === 'solicitacoes_checagem' && (
        <StockCheckRequestsView
          checkRequests={checkRequests}
          onNewCheckRequest={() => {
            if (filteredItems.length > 0) {
              handleOpenRequestCheck(filteredItems[0])
            }
          }}
          onRespondCheckRequest={handleOpenRespondCheck}
          userRole={user?.role}
        />
      )}

      {activeTab === 'oportunidades_comerciais' && (
        <StockCommercialOpportunitiesView
          opportunities={commercialOpportunities}
          onRequestCheck={handleOpenRequestCheck}
          onContactCustomer={(opp) => {
            toast({
              title: `Iniciando contato com ${opp.customerName}`,
              description: `Abordagem recomendada para ${opp.materialCode}: "${opp.aiSuggestedApproach}"`,
            })
          }}
        />
      )}

      {activeTab === 'painel_ia' && (
        <StockAIPanel
          items={filteredItems}
          opportunities={commercialOpportunities}
          userRole={user?.role}
          onRequestCheck={handleOpenRequestCheck}
          onContactCustomer={(opp) => {
            toast({
              title: `Acionando ${opp.customerName}`,
              description: `Oportunidade de ${opp.potentialTons} t do produto ${opp.materialCode}.`,
            })
          }}
        />
      )}

      {activeTab === 'admin_governanca' && isManager && (
        <StockAdminMasterView
          governanceParams={governanceParams}
          auditLogs={auditLogs}
          userRole={user?.role}
          onSaveParams={loadData}
        />
      )}

      {/* 5. MODAIS GLOBAIS DE CHECAGEM E RETORNO */}
      <RequestStockCheckModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        stockItem={selectedStockItemForCheck}
        onSuccess={loadData}
      />

      <RespondStockCheckModal
        open={respondModalOpen}
        onOpenChange={setRespondModalOpen}
        checkRequest={selectedCheckRequestForRespond}
        onSuccess={loadData}
      />
    </div>
  )
}
