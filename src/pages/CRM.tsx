import React, { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  mockClientes,
  ClienteCarteira,
  OportunidadeFunil,
  EtapaFunil,
  mockLeads,
} from '@/data/mockCommercialData'
import {
  opportunityLeadService,
  AdvancedOpportunity,
  ESTAGIOS_OPORTUNIDADE_CIAFAL,
  EstagioOportunidadeCiafal,
} from '@/services/opportunity_lead_service'
import { quotationService } from '@/services/quotation_service'
import { NovaOportunidadeModal } from '@/components/crm/NovaOportunidadeModal'
import { DetalhesOportunidadeModal } from '@/components/crm/DetalhesOportunidadeModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  TrendingUp,
  Kanban,
  FileText,
  DollarSign,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  ChevronRight,
  RefreshCw,
  Plus,
  Sparkles,
  Layers,
  BarChart3,
  ExternalLink,
} from 'lucide-react'
import CotacoesList from '@/components/cotacoes/CotacoesList'
import { RFMSegmentBadge } from '@/components/shared/RFMSegmentBadge'
import { PageLoadingState, PageEmptyState, PageErrorState } from '@/components/shared/StateFeedback'
import { ABCBadge } from '@/components/shared/ABCBadge'
import { CommercialMetricToggle } from '@/components/shared/CommercialMetricToggle'
import { CarteiraMap } from '@/components/crm/CarteiraMap'
import { LeadsView } from '@/components/crm/LeadsView'
import {
  WmsStockCheckModal,
  TmsPriorityAlertModal,
} from '@/components/crm/OperationalActionsDialogs'
import { mockProdutosCliente } from '@/data/mockCommercialData'
import { useAppStore } from '@/stores/useAppStore'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { cn, formatWeight } from '@/lib/utils'
import { Package, Truck, PackageCheck, AlertCircle } from 'lucide-react'
import { FunilVendasVertical } from '@/components/crm/FunilVendasVertical'

type SortColumn =
  | 'razaoSocial'
  | 'faturamento12m'
  | 'ticketMedio'
  | 'ultimaCompraData'
  | 'pVivo'
  | 'scoreComercial'
  | 'pipelineValor'

export default function CRM() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const { commercialMetric } = useAppStore()

  // Se a rota for /crm/cotacoes ou /cotacoes, a aba padrão inicial é "cotacoes"
  const isCotacoesRoute = location.pathname === '/crm/cotacoes' || location.pathname === '/cotacoes'
  const initialTab = searchParams.get('tab') || (isCotacoesRoute ? 'cotacoes' : 'carteira')

  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros da Gestão de Carteira
  const [searchTerm, setSearchTerm] = useState('')
  const [vendedorFilter, setVendedorFilter] = useState('todos')
  const [segmentoFilter, setSegmentoFilter] = useState('todos')
  const [rfmFilter, setRfmFilter] = useState('todos')
  const [cidadeFilter, setCidadeFilter] = useState('todos')
  const [abcHistoricoFilter, setAbcHistoricoFilter] = useState('todos')
  const [abcPotencialFilter, setAbcPotencialFilter] = useState('todos')
  const [archetypeFilter, setArchetypeFilter] = useState('todos')
  const [diasContatoMax, setDiasContatoMax] = useState<number | ''>('')

  // Ordenação da Tabela
  const [sortColumn, setSortColumn] = useState<SortColumn>('scoreComercial')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Filtros do Funil
  const [funilVendedorFilter, setFunilVendedorFilter] = useState('todos')

  // Modais de Oportunidades CIAFAL
  const [novaOportunidadeOpen, setNovaOportunidadeOpen] = useState(false)
  const [selectedClienteForOpp, setSelectedClienteForOpp] = useState<ClienteCarteira | null>(null)
  const [detalhesOppModalOpen, setDetalhesOppModalOpen] = useState(false)
  const [selectedOppForDetail, setSelectedOppForDetail] = useState<AdvancedOpportunity | null>(null)
  const [oppsRefreshKey, setOppsRefreshKey] = useState(0)

  // Modais de Ações Operacionais (WMS e TMS)
  const [wmsModalOpen, setWmsModalOpen] = useState(false)
  const [wmsSelectedData, setWmsSelectedData] = useState<{
    itemCode: string
    itemDescription: string
    currentStockTons: number
    customerName: string
  }>({
    itemCode: 'TB-304-SCH10',
    itemDescription: 'Tubo Inox AISI 304 Redondo SCH 10 2"',
    currentStockTons: 3.4,
    customerName: '',
  })

  const [tmsModalOpen, setTmsModalOpen] = useState(false)
  const [tmsSelectedData, setTmsSelectedData] = useState<{
    customerName: string
    referenceDoc: string
    itemDescription: string
    defaultTons: number
  }>({
    customerName: '',
    referenceDoc: '',
    itemDescription: '',
    defaultTons: 10,
  })

  // Previsões TMS de Carga por cliente
  const getClientTmsSchedule = (clienteId: string, idx: number) => {
    const schedules = [
      {
        status: 'Hoje',
        badge: 'bg-emerald-100 text-emerald-800',
        detail: 'Em rota de entrega hoje até 17h',
      },
      {
        status: 'Amanhã',
        badge: 'bg-blue-100 text-blue-800',
        detail: 'Carregamento agendado amanhã 08h',
      },
      {
        status: 'Em programação',
        badge: 'bg-purple-100 text-purple-800',
        detail: 'Programação de frota para sexta-feira',
      },
      {
        status: 'Carga parcial',
        badge: 'bg-amber-100 text-amber-800',
        detail: '1º lote expedido, 2º lote em separação',
      },
      {
        status: 'Aguardando montagem',
        badge: 'bg-slate-100 text-slate-700',
        detail: 'Aguardando consolidação de carga',
      },
      {
        status: 'Sem carga prevista',
        badge: 'bg-slate-50 text-slate-400',
        detail: 'Sem ordens de expedição nos próximos 3 dias',
      },
      {
        status: 'Aguardando roteirização',
        badge: 'bg-amber-50 text-amber-800',
        detail: 'Torre TMS otimizando roteiro Betim/BH',
      },
      {
        status: 'Carga confirmada',
        badge: 'bg-emerald-50 text-emerald-700 font-semibold',
        detail: 'Veículo e motorista alocados',
      },
    ]
    return schedules[idx % schedules.length]
  }

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    } else if (
      !tabFromUrl &&
      (location.pathname === '/crm/cotacoes' || location.pathname === '/cotacoes')
    ) {
      setActiveTab('cotacoes')
    }
  }, [searchParams, location.pathname])

  // Listener reativo ao evento crm360:opportunityCreated para recarregar rawFunil sem F5
  useEffect(() => {
    const handleOpportunityCreated = () => {
      setOppsRefreshKey((k) => k + 1)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('crm360:opportunityCreated', handleOpportunityCreated)
      return () => {
        window.removeEventListener('crm360:opportunityCreated', handleOpportunityCreated)
      }
    }
  }, [])

  const handleTabChange = (val: string) => {
    setActiveTab(val)
    if (location.pathname === '/crm/cotacoes' || location.pathname === '/cotacoes') {
      navigate(`/crm?tab=${val}`)
    } else {
      setSearchParams({ tab: val })
    }
  }

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  // Identificação do Usuário e RLS (Row Level Security)
  const userRole = (user?.role || '').toLowerCase()
  const userEmail = (user?.email || '').toLowerCase()
  const isVendedorOnly = userRole === 'vendedor' || userRole === 'representante_externo'

  // Clientes visíveis de acordo com o perfil
  const rawClientes = useMemo(() => {
    if (isVendedorOnly) {
      return mockClientes.filter(
        (c) =>
          c.vendedorId === user?.id ||
          (userEmail.includes('vendedor2')
            ? c.vendedorId === 'qas-vendedor2_teste'
            : userEmail.includes('representante')
              ? c.vendedorId === 'qas-representante_teste'
              : c.vendedorId === 'qas-vendedor_teste'),
      )
    }
    return mockClientes
  }, [isVendedorOnly, userEmail, user?.id])

  // Filtragem avançada da Gestão de Carteira
  const filteredClientes = useMemo(() => {
    return rawClientes.filter((c) => {
      const matchSearch =
        c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sapCode.includes(searchTerm) ||
        c.cnpj.includes(searchTerm) ||
        c.cidade.toLowerCase().includes(searchTerm.toLowerCase())

      const matchVendedor =
        vendedorFilter === 'todos' ||
        c.vendedor.toLowerCase().includes(vendedorFilter.toLowerCase())

      const matchSegmento = segmentoFilter === 'todos' || c.segmento === segmentoFilter
      const matchRfm = rfmFilter === 'todos' || c.rfmSegmento === rfmFilter
      const matchCidade = cidadeFilter === 'todos' || c.cidade === cidadeFilter
      const matchAbcHist = abcHistoricoFilter === 'todos' || c.abcHistorico === abcHistoricoFilter
      const matchAbcPot = abcPotencialFilter === 'todos' || c.abcPotencial === abcPotencialFilter
      const matchArchetype =
        archetypeFilter === 'todos' || (c.arquetipoComercial || 'INDÚSTRIA') === archetypeFilter
      const matchDiasContato = diasContatoMax === '' || c.diasSemContato <= Number(diasContatoMax)

      return (
        matchSearch &&
        matchVendedor &&
        matchSegmento &&
        matchRfm &&
        matchCidade &&
        matchAbcHist &&
        matchAbcPot &&
        matchArchetype &&
        matchDiasContato
      )
    })
  }, [
    rawClientes,
    searchTerm,
    vendedorFilter,
    segmentoFilter,
    rfmFilter,
    cidadeFilter,
    abcHistoricoFilter,
    abcPotencialFilter,
    archetypeFilter,
    diasContatoMax,
  ])

  // Total de Toneladas para cálculo de Representatividade %
  const totalCarteiraTons = useMemo(() => {
    return filteredClientes.reduce((acc, c) => acc + c.toneladas12m, 0) || 1
  }, [filteredClientes])

  // Total de Faturamento R$ para cálculo de Representatividade %
  const totalCarteiraValor = useMemo(() => {
    return filteredClientes.reduce((acc, c) => acc + c.faturamento12m, 0) || 1
  }, [filteredClientes])

  // Ranking ordenado de toneladas
  const rankedTonsMap = useMemo(() => {
    const list = [...filteredClientes].sort((a, b) => b.toneladas12m - a.toneladas12m)
    return new Map(list.map((c, i) => [c.id, i + 1]))
  }, [filteredClientes])

  // Ranking ordenado de faturamento R$
  const rankedValorMap = useMemo(() => {
    const list = [...filteredClientes].sort((a, b) => b.faturamento12m - a.faturamento12m)
    return new Map(list.map((c, i) => [c.id, i + 1]))
  }, [filteredClientes])

  // Ordenação da Gestão de Carteira
  const sortedClientes = useMemo(() => {
    const list = [...filteredClientes]
    list.sort((a, b) => {
      let valA: any = a[sortColumn]
      let valB: any = b[sortColumn]

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }

      return sortDirection === 'asc' ? valA - valB : valB - valA
    })
    return list
  }, [filteredClientes, sortColumn, sortDirection])

  const toggleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(col)
      setSortDirection('desc')
    }
  }

  // Oportunidades do Funil — leem o ESTÁGIO REAL da oportunidade no serviço
  // (sem sobreposição por cotações: Oportunidade e Cotação são entidades distintas e relacionadas)
  const rawFunil = useMemo(() => {
    const storedOpps = opportunityLeadService.getCombinedFunil()
    return isVendedorOnly
      ? storedOpps.filter(
          (op) =>
            op.vendedorId === user?.id ||
            (userEmail.includes('vendedor2')
              ? op.vendedorId === 'qas-vendedor2_teste'
              : userEmail.includes('representante')
                ? op.vendedorId === 'qas-representante_teste'
                : op.vendedorId === 'qas-vendedor_teste'),
        )
      : storedOpps
  }, [isVendedorOnly, userEmail, user?.id, oppsRefreshKey])

  const filteredFunil = useMemo(() => {
    return rawFunil.filter((op) => {
      if (funilVendedorFilter === 'todos') return true
      return op.vendedorNome.toLowerCase().includes(funilVendedorFilter.toLowerCase())
    })
  }, [rawFunil, funilVendedorFilter])

  // Métricas do Funil & Forecast Comercial (Fase 1: Meta, Realizado, Carteira Confirmada, Pipeline Bruto, Ponderado, Forecast IA, Gap)
  const funilMetricas = useMemo(() => {
    const abertas = filteredFunil.filter(
      (op) => !['faturado', 'adiado', 'perdido', 'cancelado'].includes(op.etapa),
    )
    const pipelineAberto = abertas.reduce((acc, op) => acc + op.valor, 0)
    const pipelinePonderado = abertas.reduce(
      (acc, op) => acc + (op.valor * op.probabilidade) / 100,
      0,
    )
    const metaMensal = isVendedorOnly ? 600000 : 2500000
    const realizadoMensal = isVendedorOnly ? 465000 : 1875000
    const carteiraConfirmada = isVendedorOnly ? 95000 : 380000
    const gapMeta = Math.max(metaMensal - realizadoMensal, 0)
    const forecastIA = realizadoMensal + carteiraConfirmada + pipelinePonderado * 0.85
    const cobertura = gapMeta > 0 ? Math.round((pipelineAberto / gapMeta) * 100) : 100

    return {
      metaMensal,
      realizadoMensal,
      carteiraConfirmada,
      gapMeta,
      pipelineAberto,
      pipelinePonderado,
      forecastIA,
      cobertura,
    }
  }, [filteredFunil, isVendedorOnly])

  // Colunas do Funil Kanban
  const funilStages: { id: EtapaFunil; label: string; color: string; badgeClass: string }[] = [
    {
      id: 'prospeccao',
      label: '1. Prospecção',
      color: 'border-slate-400',
      badgeClass: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'contato',
      label: '2. Contato',
      color: 'border-blue-400',
      badgeClass: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'necessidade',
      label: '3. Necessidade',
      color: 'border-indigo-400',
      badgeClass: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'oportunidade',
      label: '4. Oportunidade',
      color: 'border-cyan-400',
      badgeClass: 'bg-cyan-100 text-cyan-800',
    },
    {
      id: 'cotacao',
      label: '5. Cotação',
      color: 'border-amber-400',
      badgeClass: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'negociacao',
      label: '6. Negociação',
      color: 'border-orange-400',
      badgeClass: 'bg-orange-100 text-orange-800',
    },
    {
      id: 'pedido',
      label: '7. Pedido',
      color: 'border-emerald-500',
      badgeClass: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'faturado',
      label: '8. Faturado',
      color: 'border-green-600',
      badgeClass: 'bg-green-100 text-green-800',
    },
  ]

  // Saídas do Funil
  const saidasStages: { id: EtapaFunil; label: string; badgeClass: string }[] = [
    { id: 'adiado', label: 'Adiado', badgeClass: 'bg-purple-100 text-purple-800' },
    { id: 'perdido', label: 'Perdido', badgeClass: 'bg-rose-100 text-rose-800' },
    { id: 'cancelado', label: 'Cancelado', badgeClass: 'bg-slate-200 text-slate-800' },
  ]

  const getCanalIcon = (canal: string) => {
    switch (canal) {
      case 'WhatsApp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />
      case 'Telefone':
        return <Phone className="w-3.5 h-3.5 text-blue-600 inline mr-1" />
      case 'E-mail':
        return <Mail className="w-3.5 h-3.5 text-indigo-600 inline mr-1" />
      case 'Visita':
        return <MapPin className="w-3.5 h-3.5 text-amber-600 inline mr-1" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <PageLoadingState message="Carregando informações..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <PageErrorState
          title="Não foi possível carregar os dados."
          description={error}
          onRetry={() => setLoading(false)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* Topo do Módulo CRM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
                  CRM 360º & Gestão Comercial
                </h1>
                <Badge
                  variant="outline"
                  className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300"
                >
                  {isVendedorOnly ? 'Visão Carteira Pessoal' : 'Visão Gerencial Completa'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-sans mt-0.5">
                Gestão da carteira de clientes, pipeline integrado ao SAP ECC e funil de vendas
                preditivo.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <CommercialMetricToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 200)
            }}
            className="h-9 gap-1.5 text-xs text-muted-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar SAP
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedClienteForOpp(null)
              setNovaOportunidadeOpen(true)
            }}
            className="h-9 gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10 rounded-xl font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />+ Nova Oportunidade
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/crm/cotacoes/nova')}
            className="h-9 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />+ Nova Cotação
          </Button>
        </div>
      </div>

      {/* Navegação por Abas do CRM */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <div className="border-b border-border/40 pb-px">
          <TabsList className="bg-transparent p-0 h-auto gap-2 flex-wrap">
            <TabsTrigger
              value="carteira"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs font-semibold gap-1.5"
            >
              <Building2 className="w-4 h-4" /> [ Lista ] Gestão de Carteira (
              {sortedClientes.length})
            </TabsTrigger>
            <TabsTrigger
              value="mapa"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs font-semibold gap-1.5"
            >
              <MapPin className="w-4 h-4" /> [ Mapa ] Mapa da Carteira
            </TabsTrigger>
            <TabsTrigger
              value="leads"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs font-semibold gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> Leads (LeadPriorityABC)
            </TabsTrigger>
            <TabsTrigger
              value="funil"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs font-semibold gap-1.5"
            >
              <Kanban className="w-4 h-4" /> Funil de Vendas ({filteredFunil.length})
            </TabsTrigger>{' '}
            <TabsTrigger
              value="oportunidades"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs font-semibold gap-1.5"
            >
              <TrendingUp className="w-4 h-4" /> Oportunidades
            </TabsTrigger>
            <TabsTrigger
              value="cotacoes"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs font-semibold gap-1.5"
            >
              <FileText className="w-4 h-4" /> Cotações
            </TabsTrigger>
            <TabsTrigger
              value="pipeline"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs font-semibold gap-1.5"
            >
              <BarChart3 className="w-4 h-4" /> Pipeline & Forecast
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ABA 1: MAPA DA CARTEIRA */}
        <TabsContent value="mapa" className="space-y-4 m-0">
          <CarteiraMap clientes={rawClientes} leads={mockLeads} />
        </TabsContent>

        {/* ABA 2: LEADS (LEADPRIORITYABC) */}
        <TabsContent value="leads" className="space-y-4 m-0">
          <LeadsView />
        </TabsContent>

        {/* ABA 3: GESTÃO DE CARTEIRA (GRID PRINCIPAL) */}
        <TabsContent value="carteira" className="space-y-4 m-0">
          {/* BARRA DE FILTROS */}
          <Card className="bg-white/80 backdrop-blur-md border-border/40 shadow-xs rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Busca por Razão/Fantasia/SAP/CNPJ */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar Razão Social, Fantasia, SAP ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl"
                />
              </div>

              {/* Vendedor */}
              {!isVendedorOnly && (
                <div>
                  <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
                    <SelectTrigger className="h-10 text-xs rounded-xl">
                      <SelectValue placeholder="Vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos Vendedores</SelectItem>
                      <SelectItem value="Carlos Mendonça">Carlos Mendonça</SelectItem>
                      <SelectItem value="Mariana Azevedo">Mariana Azevedo</SelectItem>
                      <SelectItem value="João Pedro">João Pedro Representações</SelectItem>
                      <SelectItem value="Marcos Vinícius">Marcos Vinícius (Sup)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Segmento */}
              <div>
                <Select value={segmentoFilter} onValueChange={setSegmentoFilter}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Segmento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Segmentos</SelectItem>
                    <SelectItem value="Construção Civil">Construção Civil</SelectItem>
                    <SelectItem value="Indústria">Indústria</SelectItem>
                    <SelectItem value="Agronegócio">Agronegócio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* RFM */}
              <div>
                <Select value={rfmFilter} onValueChange={setRfmFilter}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Status RFM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos RFM</SelectItem>
                    <SelectItem value="Campeões">Campeões</SelectItem>
                    <SelectItem value="Leais">Leais</SelectItem>
                    <SelectItem value="Potenciais">Potenciais</SelectItem>
                    <SelectItem value="Precisam de Atenção">Precisam de Atenção</SelectItem>
                    <SelectItem value="Em Risco">Em Risco</SelectItem>
                    <SelectItem value="Hibernando">Hibernando</SelectItem>
                    <SelectItem value="Perdidos">Perdidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cidade */}
              <div>
                <Select value={cidadeFilter} onValueChange={setCidadeFilter}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas Cidades</SelectItem>
                    <SelectItem value="Contagem">Contagem / MG</SelectItem>
                    <SelectItem value="Betim">Betim / MG</SelectItem>
                    <SelectItem value="Belo Horizonte">Belo Horizonte / MG</SelectItem>
                    <SelectItem value="Uberlândia">Uberlândia / MG</SelectItem>
                    <SelectItem value="Juiz de Fora">Juiz de Fora / MG</SelectItem>
                    <SelectItem value="Divinópolis">Divinópolis / MG</SelectItem>
                    <SelectItem value="Pouso Alegre">Pouso Alegre / MG</SelectItem>
                    <SelectItem value="Ipatinga">Ipatinga / MG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ABC Histórico */}
              <div>
                <Select value={abcHistoricoFilter} onValueChange={setAbcHistoricoFilter}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="ABC Histórico (t)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos ABC Histórico</SelectItem>
                    <SelectItem value="A">ABC Histórico A (70% vol)</SelectItem>
                    <SelectItem value="B">ABC Histórico B (até 90%)</SelectItem>
                    <SelectItem value="C">ABC Histórico C (restante)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ABC Potencial */}
              <div>
                <Select value={abcPotencialFilter} onValueChange={setAbcPotencialFilter}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="ABC Potencial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos ABC Potencial</SelectItem>
                    <SelectItem value="A">ABC Potencial A</SelectItem>
                    <SelectItem value="B">ABC Potencial B</SelectItem>
                    <SelectItem value="C">ABC Potencial C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Arquétipo Comercial */}
              <div>
                <Select value={archetypeFilter} onValueChange={setArchetypeFilter}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Arquétipo Comercial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Arquétipos</SelectItem>
                    <SelectItem value="INDÚSTRIA">Indústria</SelectItem>
                    <SelectItem value="REVENDA">Revenda</SelectItem>
                    <SelectItem value="SERRALHERIA">Serralheria</SelectItem>
                    <SelectItem value="CONSUMIDOR_FINAL">Consumidor Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* TABELA AVANÇADA DA GESTÃO DE CARTEIRA */}
          <Card className="bg-white/90 backdrop-blur-md border-border/40 shadow-sm rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Exibindo <strong>{sortedClientes.length}</strong> clientes de sua carteira
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px]">
                  Dica: Clique no cliente para abrir o <strong>Cliente 360º</strong>
                </span>
              </div>
            </div>

            {sortedClientes.length === 0 ? (
              <div className="p-8">
                <PageEmptyState
                  title="Não existem dados disponíveis para este período."
                  description="Nenhum cliente atende aos filtros selecionados na carteira."
                  actionLabel="Tentar novamente"
                  onAction={() => {
                    setSearchTerm('')
                    setVendedorFilter('todos')
                    setSegmentoFilter('todos')
                    setRfmFilter('todos')
                    setCidadeFilter('todos')
                  }}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/90 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/40">
                    <tr>
                      <th className="py-3 px-3 font-bold text-center">SAP</th>
                      <th
                        className="py-3 px-3 font-bold cursor-pointer hover:text-primary transition-colors min-w-[190px]"
                        onClick={() => toggleSort('razaoSocial')}
                      >
                        <div className="flex items-center gap-1">
                          Cliente (Razão / Fantasia)
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </th>
                      <th className="py-3 px-2 font-bold text-center">Arquétipo</th>
                      <th className="py-3 px-2 font-bold">Cidade/UF</th>

                      {/* NOVAS COLUNAS REQUISITADAS: ESTOQUE (t), PREVISÃO FAT. (R$) E PREVISÃO TMS */}
                      <th className="py-3 px-2 font-bold text-center min-w-[130px] bg-sky-50/50 text-sky-950">
                        Disp. Estoque (t)
                      </th>
                      <th className="py-3 px-2 font-bold text-center min-w-[140px] bg-emerald-50/50 text-emerald-950">
                        Previsão Fat. (R$)
                      </th>
                      <th className="py-3 px-2 font-bold text-center min-w-[130px] bg-indigo-50/50 text-indigo-950">
                        Previsão TMS Carga
                      </th>

                      <th className="py-3 px-2 font-bold text-center font-mono">
                        {commercialMetric === 'REVENUE' ? 'Fat. 12m (R$)' : 'Ton 12m (t)'}
                      </th>
                      <th className="py-3 px-2 font-bold text-center font-mono">
                        {commercialMetric === 'REVENUE' ? '% Cart. (R$)' : '% Cart. (t)'}
                      </th>
                      <th className="py-3 px-2 font-bold text-center font-mono">
                        {commercialMetric === 'REVENUE' ? 'Rank (R$)' : 'Rank (t)'}
                      </th>
                      <th className="py-3 px-2 font-bold text-center font-mono">
                        {commercialMetric === 'REVENUE' ? 'Pipeline (R$)' : 'Pipeline (t)'}
                      </th>
                      <th className="py-3 px-3 font-bold">Última Visita</th>
                      <th className="py-3 px-2 font-bold text-center">Dias S/ Visita</th>
                      <th className="py-3 px-3 font-bold">Último Contato</th>
                      <th
                        className="py-3 px-2 font-bold text-center cursor-pointer hover:text-primary transition-colors"
                        onClick={() => toggleSort('pVivo')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          P(vivo)
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-2 font-bold text-center">RFM</th>
                      <th className="py-3 px-3 font-bold text-center min-w-[210px]">
                        Ações Rápidas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {sortedClientes.map((c, idx) => {
                      const clientProds =
                        mockProdutosCliente[c.id] || mockProdutosCliente['cli-100001'] || []
                      const mainProd = clientProds[0] || {
                        codigo: 'TB-304-SCH10',
                        descricao: 'Tubo Inox AISI 304 2"',
                        saldoEstoqueTon: 3.4,
                      }
                      const stockTons = mainProd.saldoEstoqueTon
                      const isLowStock = stockTons < 5.0
                      const previsaoFaturamento =
                        c.pipelineValor * 0.7 + (c.faturamento12m / 12) * 0.9
                      const tmsSchedule = getClientTmsSchedule(c.id, idx)

                      return (
                        <tr key={c.id} className="hover:bg-primary/5 transition-colors group">
                          {/* SAP */}
                          <td
                            className="py-3 px-3 text-center font-mono font-bold text-primary cursor-pointer hover:underline"
                            onClick={() => navigate(`/crm/${c.id}`)}
                          >
                            {c.sapCode}
                          </td>

                          {/* Razão / Fantasia */}
                          <td
                            className="py-3 px-3 cursor-pointer"
                            onClick={() => navigate(`/crm/${c.id}`)}
                          >
                            <div>
                              <span className="font-bold text-slate-900 group-hover:text-primary transition-colors block text-xs">
                                {c.razaoSocial}
                              </span>
                              <span className="text-[11px] text-muted-foreground block">
                                {c.nomeFantasia} · {c.cnpj}
                              </span>
                            </div>
                          </td>

                          {/* Arquétipo */}
                          <td className="py-3 px-2 text-center">
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-slate-50 font-semibold text-slate-700"
                            >
                              {c.arquetipoComercial || 'INDÚSTRIA'}
                            </Badge>
                          </td>

                          {/* Cidade/UF */}
                          <td className="py-3 px-2 whitespace-nowrap text-slate-700">
                            {c.cidade}/{c.uf}
                          </td>

                          {/* 2.1 DISPONIBILIDADE DE ESTOQUE DO ITEM (EM "t") */}
                          <td className="py-3 px-2 text-center">
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <button
                                onClick={() => {
                                  setWmsSelectedData({
                                    itemCode: mainProd.codigo,
                                    itemDescription: mainProd.descricao,
                                    currentStockTons: stockTons,
                                    customerName: c.razaoSocial,
                                  })
                                  setWmsModalOpen(true)
                                }}
                                className={cn(
                                  'px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer',
                                  isLowStock
                                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300 animate-pulse'
                                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300',
                                )}
                                title={`Clique para solicitar verificação WMS (${mainProd.descricao})`}
                              >
                                {isLowStock && <AlertCircle className="w-3 h-3 text-rose-600" />}
                                <span>{formatWeight(stockTons, 1)}</span>
                              </button>
                              <span
                                className="text-[9px] text-muted-foreground truncate max-w-[120px]"
                                title={mainProd.descricao}
                              >
                                {mainProd.codigo}
                              </span>
                            </div>
                          </td>

                          {/* 2.2 PREVISÃO DE FATURAMENTO (R$) */}
                          <td className="py-3 px-2 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-mono font-bold text-xs text-primary">
                                {formatBRL(previsaoFaturamento)}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                Pipeline + Forecast
                              </span>
                            </div>
                          </td>

                          {/* 2.3 PREVISÃO DO TMS DE CARGA */}
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => {
                                setTmsSelectedData({
                                  customerName: c.razaoSocial,
                                  referenceDoc: `Pedido SAP ${c.sapCode}`,
                                  itemDescription: mainProd.descricao,
                                  defaultTons: c.pipelineTons || 12,
                                })
                                setTmsModalOpen(true)
                              }}
                              className={cn(
                                'px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer hover:opacity-80 block mx-auto',
                                tmsSchedule.badge,
                              )}
                              title={`${tmsSchedule.detail} (Clique para gerar alerta TMS)`}
                            >
                              {tmsSchedule.status}
                            </button>
                            <span className="text-[9px] text-slate-500 block mt-0.5">
                              Torre TMS
                            </span>
                          </td>

                          {/* Métrica 12m (Alterna dinamicamente entre R$ e Toneladas) */}
                          <td className="py-3 px-2 text-center font-mono font-bold text-primary">
                            {commercialMetric === 'REVENUE'
                              ? formatBRL(c.faturamento12m)
                              : `${c.toneladas12m} t`}
                          </td>

                          {/* % Carteira (Alterna dinamicamente) */}
                          <td className="py-3 px-2 text-center font-mono font-bold text-primary">
                            {commercialMetric === 'REVENUE'
                              ? `${((c.faturamento12m / totalCarteiraValor) * 100).toFixed(1)}%`
                              : `${((c.toneladas12m / totalCarteiraTons) * 100).toFixed(1)}%`}
                          </td>

                          {/* Ranking (Alterna dinamicamente) */}
                          <td className="py-3 px-2 text-center font-mono text-xs text-muted-foreground">
                            {commercialMetric === 'REVENUE'
                              ? `${rankedValorMap.get(c.id) || 1}º`
                              : `${rankedTonsMap.get(c.id) || 1}º`}
                          </td>

                          {/* Pipeline (Alterna dinamicamente) */}
                          <td className="py-3 px-2 text-center font-mono font-semibold text-emerald-600">
                            {commercialMetric === 'REVENUE'
                              ? formatBRL(c.pipelineValor)
                              : `${c.pipelineTons || (c.pipelineValor / 6000).toFixed(1)} t`}
                          </td>

                          {/* Última Visita */}
                          <td className="py-3 px-3 text-[11px] text-slate-700">
                            {c.ultimaVisitaData || 'Pendente'}
                          </td>

                          {/* Dias Sem Visita */}
                          <td className="py-3 px-2 text-center">
                            <Badge
                              className={cn(
                                'text-[10px] font-bold border-none',
                                (c.diasSemVisita || 20) <= 15
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : (c.diasSemVisita || 20) <= 35
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800',
                              )}
                            >
                              {c.diasSemVisita || 20}d
                            </Badge>
                          </td>

                          {/* Último Contato */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-[11px] font-medium text-slate-800 flex items-center">
                              {getCanalIcon(c.ultimoContatoCanal)}
                              {c.ultimoContatoData}
                            </span>
                          </td>

                          {/* P(vivo) */}
                          <td className="py-3 px-2 text-center">
                            <Badge
                              className={cn(
                                'text-[10px] font-mono font-bold border-none',
                                c.pVivo >= 80
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : c.pVivo >= 50
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800',
                              )}
                            >
                              {c.pVivo}%
                            </Badge>
                          </td>

                          {/* RFM */}
                          <td className="py-3 px-2 text-center">
                            <RFMSegmentBadge segment={c.rfmSegmento} />
                          </td>

                          {/* AÇÕES RÁPIDAS */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[10px] font-semibold text-primary hover:bg-primary/5"
                                onClick={() => navigate(`/crm/${c.id}`)}
                                title="Abrir Visão 360º"
                              >
                                360º
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                                onClick={() =>
                                  navigate(
                                    `/conversas?whatsapp=true&cliente=${encodeURIComponent(c.nomeFantasia)}&id=${c.id}`,
                                  )
                                }
                                title="Enviar WhatsApp"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50 border-blue-200"
                                onClick={() => toast.success(`Ligando para ${c.nomeFantasia}...`)}
                                title="Fazer Ligação VoIP"
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50 border-amber-200"
                                onClick={() =>
                                  toast.success(`Visita agendada para ${c.nomeFantasia}!`)
                                }
                                title="Agendar Visita Presencial"
                              >
                                <Calendar className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                                onClick={() => {
                                  setSelectedClienteForOpp(c)
                                  setNovaOportunidadeOpen(true)
                                }}
                                title={`Criar Nova Oportunidade para ${c.nomeFantasia}`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-1.5 text-[9px] font-semibold text-amber-700 hover:bg-amber-50 border-amber-300"
                                onClick={() => {
                                  setWmsSelectedData({
                                    itemCode: mainProd.codigo,
                                    itemDescription: mainProd.descricao,
                                    currentStockTons: stockTons,
                                    customerName: c.razaoSocial,
                                  })
                                  setWmsModalOpen(true)
                                }}
                                title="Solicitar Verificação de Estoque no WMS"
                              >
                                WMS
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-1.5 text-[9px] font-semibold text-indigo-700 hover:bg-indigo-50 border-indigo-300"
                                onClick={() => {
                                  setTmsSelectedData({
                                    customerName: c.razaoSocial,
                                    referenceDoc: `Pedido SAP ${c.sapCode}`,
                                    itemDescription: mainProd.descricao,
                                    defaultTons: c.pipelineTons || 12,
                                  })
                                  setTmsModalOpen(true)
                                }}
                                title="Gerar Alerta de Prioridade de Carga no TMS"
                              >
                                TMS
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
        {/* ABA 2: FUNIL DE VENDAS (GRÁFICO VERTICAL 9 NÍVEIS + KANBAN + SAÍDAS) */}
        <TabsContent value="funil" className="space-y-6 m-0">
          {/* GRÁFICO VERTICAL DE FUNIL EM TRAPÉZIO (9 NÍVEIS MACRO) */}
          <FunilVendasVertical
            oportunidades={rawFunil as AdvancedOpportunity[]}
            commercialMetric={commercialMetric === 'TONS' ? 'volume' : 'valor'}
            onSelectOpportunity={(opp) => {
              setSelectedOppForDetail(opp)
              setDetalhesOppModalOpen(true)
            }}
            onNovaOportunidadeClick={() => {
              setSelectedClienteForOpp(null)
              setNovaOportunidadeOpen(true)
            }}
          />

          {/* BARRA DE FORECAST COMERCIAL (FASE 1: 4.10) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            <Card className="bg-white border-border/50 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Meta Mensal
              </span>
              <strong className="font-serif text-lg text-slate-900 block mt-0.5">
                {formatBRL(funilMetricas.metaMensal)}
              </strong>
              <span className="text-[10px] text-muted-foreground">Objetivo comercial</span>
            </Card>

            <Card className="bg-white border-border/50 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                Realizado Faturado
              </span>
              <strong className="font-serif text-lg text-primary block mt-0.5">
                {formatBRL(funilMetricas.realizadoMensal)}
              </strong>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {((funilMetricas.realizadoMensal / funilMetricas.metaMensal) * 100).toFixed(1)}%
                atingido
              </span>
            </Card>

            <Card className="bg-white border-border/50 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                Carteira Confirmada
              </span>
              <strong className="font-serif text-lg text-blue-700 block mt-0.5">
                {formatBRL(funilMetricas.carteiraConfirmada)}
              </strong>
              <span className="text-[10px] text-muted-foreground">Pedidos em carteira</span>
            </Card>

            <Card className="bg-white border-border/50 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                Pipeline Bruto
              </span>
              <strong className="font-serif text-lg text-slate-800 block mt-0.5">
                {formatBRL(funilMetricas.pipelineAberto)}
              </strong>
              <span className="text-[10px] text-muted-foreground">Volume total aberto</span>
            </Card>

            <Card className="bg-white border-border/50 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Pipeline Ponderado
              </span>
              <strong className="font-serif text-lg text-emerald-700 block mt-0.5">
                {formatBRL(funilMetricas.pipelinePonderado)}
              </strong>
              <span className="text-[10px] text-muted-foreground">Probabilidade aplicada</span>
            </Card>

            <Card className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                  Forecast IA
                </span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </div>
              <strong className="font-serif text-lg text-primary block mt-0.5">
                {formatBRL(funilMetricas.forecastIA)}
              </strong>
              <span className="text-[10px] text-sky-800 font-semibold">
                {((funilMetricas.forecastIA / funilMetricas.metaMensal) * 100).toFixed(1)}%
                projetado
              </span>
            </Card>

            <Card className="bg-white border-border/50 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                Gap para Meta
              </span>
              <strong className="font-serif text-lg text-amber-700 block mt-0.5">
                {formatBRL(funilMetricas.gapMeta)}
              </strong>
              <span className="text-[10px] text-muted-foreground">Falta fechar no mês</span>
            </Card>
          </div>

          {/* Filtro por vendedor no funil */}
          {!isVendedorOnly && (
            <div className="flex items-center justify-between bg-white/70 backdrop-blur-md p-3 rounded-2xl border border-border/40">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-primary">
                  Filtrar oportunidades do funil:
                </span>
              </div>
              <Select value={funilVendedorFilter} onValueChange={setFunilVendedorFilter}>
                <SelectTrigger className="w-64 h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Vendedor / Representante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Toda a Equipe Comercial</SelectItem>
                  <SelectItem value="Carlos Mendonça">Carlos Mendonça</SelectItem>
                  <SelectItem value="Mariana Azevedo">Mariana Azevedo</SelectItem>
                  <SelectItem value="João Pedro">João Pedro Representações</SelectItem>
                  <SelectItem value="Marcos Vinícius">Marcos Vinícius (Supervisor)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* QUADRO KANBAN — 8 ETAPAS HORIZONTAIS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                <Kanban className="w-5 h-5 text-primary" /> Etapas do Funil Comercial
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedClienteForOpp(null)
                  setNovaOportunidadeOpen(true)
                }}
                className="h-8 gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10 rounded-xl font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> + Nova Oportunidade
              </Button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
              {funilStages.map((stage) => {
                const stageOps = filteredFunil.filter((op) => op.etapa === stage.id)
                const stageTotal = stageOps.reduce((acc, op) => acc + op.valor, 0)
                const stageTon = stageOps.reduce((acc, op) => acc + op.toneladas, 0)

                return (
                  <div
                    key={stage.id}
                    className="min-w-[280px] w-[280px] shrink-0 flex flex-col bg-slate-100/70 border border-border/60 rounded-2xl p-3"
                  >
                    {/* Header da Coluna */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                      <div>
                        <span className="text-xs font-bold text-primary block">{stage.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatBRL(stageTotal)} · {stageTon.toFixed(1)}t
                        </span>
                      </div>
                      <Badge className={cn('text-[10px] font-bold border-none', stage.badgeClass)}>
                        {stageOps.length}
                      </Badge>
                    </div>

                    {/* Cards de Oportunidade */}
                    <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[500px]">
                      {stageOps.length === 0 ? (
                        <div className="text-center py-6 text-[11px] text-muted-foreground/60 border border-dashed rounded-xl border-border/40">
                          Nenhuma oportunidade
                        </div>
                      ) : (
                        stageOps.map((op, i) => {
                          const aging = op.agingDias || i * 3 + 2
                          const isParada =
                            aging > 15 && !['faturado', 'perdido', 'cancelado'].includes(op.etapa)
                          const probVendedor = op.probabilidade
                          const probIA = Math.min(
                            Math.max(probVendedor + (i % 2 === 0 ? 5 : -8), 15),
                            95,
                          )

                          return (
                            <Card
                              key={op.id}
                              onClick={() => {
                                setSelectedOppForDetail(op as AdvancedOpportunity)
                                setDetalhesOppModalOpen(true)
                              }}
                              className={cn(
                                'bg-white border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer rounded-xl p-3 space-y-2 group',
                                isParada && 'border-amber-400 bg-amber-50/30',
                              )}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div>
                                  <span className="font-bold text-xs text-primary block leading-tight group-hover:underline">
                                    {op.clienteNome}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    SAP {op.clienteSap} · {op.vendedorNome}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end gap-0.5">
                                  <Badge className="text-[9px] bg-primary/10 text-primary border-none font-bold">
                                    {op.probabilidadeClassificacao
                                      ? `${op.probabilidadeClassificacao.toUpperCase()} (${op.probabilidade}%)`
                                      : `Vend: ${probVendedor}%`}
                                  </Badge>
                                  <span className="text-[9px] text-emerald-700 font-mono font-bold">
                                    IA: {probIA}%
                                  </span>
                                </div>
                              </div>

                              <p className="text-[11px] text-slate-700 font-medium line-clamp-2">
                                {op.titulo}
                              </p>

                              {/* Grupo de Mercadoria */}
                              {op.grupoMercadoria &&
                                op.grupoMercadoria !== 'Não definido / A identificar' && (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                    <Layers className="w-3 h-3 text-primary/70 shrink-0" />
                                    <span className="truncate">{op.grupoMercadoria}</span>
                                  </div>
                                )}

                              {isParada && (
                                <div className="p-1.5 rounded-lg bg-amber-100/90 border border-amber-300 text-[10px] text-amber-900 flex items-center gap-1 font-semibold">
                                  <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                                  <span>Oportunidade parada há {aging} dias!</span>
                                </div>
                              )}

                              {/* VALOR POTENCIAL E QUANTIDADE (Regras 4, 5 e 12: 'Não estimado' quando ausente, nunca 'R$ 0') */}
                              <div className="flex items-center justify-between pt-1 border-t border-border/20 text-[11px]">
                                <span className="font-serif font-bold text-emerald-700">
                                  {op.valorPotencialCalculado !== null &&
                                  op.valorPotencialCalculado !== undefined &&
                                  op.valorPotencialCalculado > 0
                                    ? formatBRL(op.valorPotencialCalculado)
                                    : op.valor > 0
                                      ? formatBRL(op.valor)
                                      : 'Não estimado'}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                  {op.quantidadeEstimadaTons !== null &&
                                  op.quantidadeEstimadaTons !== undefined &&
                                  op.quantidadeEstimadaTons > 0
                                    ? `${op.quantidadeEstimadaTons.toLocaleString('pt-BR')} t`
                                    : op.toneladas > 0
                                      ? `${op.toneladas.toLocaleString('pt-BR')} t`
                                      : 'Não informada'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-500" /> {aging}d no funil
                                </span>
                                <span className="text-primary font-medium truncate max-w-[130px]">
                                  {op.previsaoCompra
                                    ? `Prev: ${op.previsaoCompra.replace(/_/g, ' ')}`
                                    : `Prev: ${op.previsaoFechamento}`}
                                </span>
                              </div>

                              {op.proximaAcao && (
                                <div className="bg-slate-50 p-1.5 rounded-lg text-[10px] text-slate-600 truncate">
                                  <strong className="text-primary">Próx. Ação:</strong>{' '}
                                  {op.proximaAcao}
                                </div>
                              )}
                            </Card>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SAÍDAS DO FUNIL (ADIADO / PERDIDO / CANCELADO) */}
          <div className="pt-4 border-t border-border/40 space-y-3">
            <h3 className="font-serif text-md font-bold text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Saídas do Funil Comercial
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {saidasStages.map((saida) => {
                const ops = filteredFunil.filter((op) => op.etapa === saida.id)
                return (
                  <Card key={saida.id} className="bg-slate-50/70 border-border/40 rounded-2xl p-4">
                    <div className="flex items-center justify-between border-b pb-2 mb-3">
                      <span className="font-bold text-xs text-slate-700">{saida.label}</span>
                      <Badge className={cn('text-[10px] border-none font-bold', saida.badgeClass)}>
                        {ops.length}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {ops.map((op) => (
                        <div
                          key={op.id}
                          className="bg-white p-3 rounded-xl border border-border/40 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-primary">{op.clienteNome}</span>
                            <span className="font-bold text-xs text-slate-700">
                              {formatBRL(op.valor)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{op.titulo}</p>
                          {op.motivoPerda && (
                            <p className="text-[10px] text-rose-600 font-medium">
                              <strong>Motivo:</strong> {op.motivoPerda}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* ABA 3: OPORTUNIDADES COM COLUNAS COMPLETAS EXIGIDAS */}
        <TabsContent value="oportunidades" className="space-y-4 m-0">
          <Card className="bg-white/90 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Lista Completa de Oportunidades Comerciais
                </h3>
                <p className="text-xs text-muted-foreground">
                  Visão corporativa com número sequencial único, cliente, estágio real, valor
                  potencial e ações.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedClienteForOpp(null)
                    setNovaOportunidadeOpen(true)
                  }}
                  className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> + Nova Oportunidade
                </Button>
                <Badge className="bg-primary text-white text-xs">
                  {rawFunil.length} oportunidades
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-muted-foreground uppercase text-[10px] border-b">
                  <tr>
                    <th className="py-3 px-2 font-bold">Número</th>
                    <th className="py-3 px-2 font-bold">Cliente</th>
                    <th className="py-3 px-2 font-bold">Cód. SAP</th>
                    <th className="py-3 px-2 font-bold">Responsável</th>
                    <th className="py-3 px-2 font-bold">Grupo</th>
                    <th className="py-3 px-2 text-right font-bold">Qtd Estimada</th>
                    <th className="py-3 px-2 text-right font-bold">Preço Estimado</th>
                    <th className="py-3 px-2 text-right font-bold">Valor Potencial</th>
                    <th className="py-3 px-2 font-bold">Estágio</th>
                    <th className="py-3 px-2 text-center font-bold">Prob.</th>
                    <th className="py-3 px-2 font-bold">Prev. Compra</th>
                    <th className="py-3 px-2 font-bold">Origem</th>
                    <th className="py-3 px-2 font-bold">Última Interação</th>
                    <th className="py-3 px-2 font-bold">Criação</th>
                    <th className="py-3 px-2 font-bold">Próxima Ação</th>
                    <th className="py-3 px-2 font-bold">Status</th>
                    <th className="py-3 px-2 text-center font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {rawFunil.map((op) => {
                    const precoText =
                      op.precoEstimadoPorTon !== null &&
                      op.precoEstimadoPorTon !== undefined &&
                      op.precoEstimadoPorTon > 0
                        ? formatBRL(op.precoEstimadoPorTon)
                        : '—'

                    const valorText =
                      op.valorPotencialCalculado !== null &&
                      op.valorPotencialCalculado !== undefined &&
                      op.valorPotencialCalculado > 0
                        ? formatBRL(op.valorPotencialCalculado)
                        : op.valor > 0
                          ? formatBRL(op.valor)
                          : 'Não estimado'

                    const qtdText =
                      op.quantidadeEstimadaTons !== null &&
                      op.quantidadeEstimadaTons !== undefined &&
                      op.quantidadeEstimadaTons > 0
                        ? `${op.quantidadeEstimadaTons.toLocaleString('pt-BR')} t`
                        : op.toneladas > 0
                          ? `${op.toneladas.toLocaleString('pt-BR')} t`
                          : 'Não estimada'

                    return (
                      <tr key={op.id} className="hover:bg-primary/5 transition-colors group">
                        <td className="py-2.5 px-2 font-mono font-bold text-[#003A70] whitespace-nowrap">
                          {op.numeroSequencial || op.id}
                        </td>
                        <td className="py-2.5 px-2 font-bold text-slate-900 whitespace-nowrap max-w-[180px] truncate">
                          {op.clienteNome}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-muted-foreground whitespace-nowrap">
                          {op.clienteSap}
                        </td>
                        <td className="py-2.5 px-2 text-slate-700 whitespace-nowrap">
                          {op.vendedorNome}
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 max-w-[140px] truncate">
                          {op.grupoMercadoria || 'Não definido'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-700 whitespace-nowrap">
                          {qtdText}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-700 whitespace-nowrap">
                          {precoText}
                        </td>
                        <td className="py-2.5 px-2 text-right font-serif font-bold text-emerald-700 whitespace-nowrap">
                          {valorText}
                        </td>
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] capitalize bg-sky-50 text-sky-900 border-sky-300"
                          >
                            {op.estagioCiafal ? op.estagioCiafal.replace(/_/g, ' ') : op.etapa}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-primary font-mono whitespace-nowrap">
                          {op.probabilidade}%
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap capitalize">
                          {op.previsaoCompra
                            ? op.previsaoCompra.replace(/_/g, ' ')
                            : op.previsaoFechamento || 'Sem previsão'}
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap capitalize">
                          {op.origemOportunidade
                            ? op.origemOportunidade.replace(/_/g, ' ')
                            : 'Contato'}
                        </td>
                        <td className="py-2.5 px-2 text-[11px] text-muted-foreground whitespace-nowrap">
                          {op.ultimaAtualizacaoDataHora || op.dataCriacao || 'Recente'}
                        </td>
                        <td className="py-2.5 px-2 text-[11px] text-muted-foreground whitespace-nowrap">
                          {op.dataCriacao || 'Hoje'}
                        </td>
                        <td
                          className="py-2.5 px-2 text-slate-700 max-w-[160px] truncate"
                          title={op.proximaAcao}
                        >
                          {op.proximaAcao || 'Qualificar especulação'}
                        </td>
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-none">
                            Ativa
                          </Badge>
                        </td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOppForDetail(op as AdvancedOpportunity)
                              setDetalhesOppModalOpen(true)
                            }}
                            className="h-7 px-2 text-xs text-[#003A70] hover:bg-sky-50"
                          >
                            Abrir
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ABA 4: COTAÇÕES COMERCIAIS & ESTOQUE */}
        <TabsContent value="cotacoes" className="space-y-4 m-0">
          <CotacoesList />
        </TabsContent>
        {/* ABA 5: PIPELINE & FORECAST ALIMENTADO PELOS REGISTROS REAIS */}
        <TabsContent value="pipeline" className="space-y-4 m-0">
          <Card className="bg-white/90 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <h3 className="font-serif text-lg font-bold text-primary mb-2">
              Projeção de Pipeline & Forecast Preditivo (Registros Reais)
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Modelo preditivo CIAFAL calibrado com Potencial Bruto (soma de todas as oportunidades
              ativas) vs Forecast Ponderado (valor × probabilidade real).
            </p>

            {(() => {
              const oppsAtivas = rawFunil.filter((o) => {
                const est = (o.estagioCiafal || o.etapa || '').toLowerCase()
                return (
                  !est.includes('perdid') && !est.includes('cancel') && !est.includes('suspens')
                )
              })

              const potencialBruto = oppsAtivas.reduce((acc, o) => {
                const val = o.valorPotencialCalculado ?? (o.valor > 0 ? o.valor : 0)
                return acc + val
              }, 0)

              const forecastPonderado = oppsAtivas.reduce((acc, o) => {
                const val = o.valorPotencialCalculado ?? (o.valor > 0 ? o.valor : 0)
                const prob = o.probabilidade || 20
                return acc + (val * prob) / 100
              }, 0)

              const metaComercial = isVendedorOnly ? 600000 : 2500000
              const cobertura =
                metaComercial > 0 ? Math.round((potencialBruto / metaComercial) * 100) : 100

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-border/40 space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Potencial Bruto (Soma Valores)
                    </span>
                    <span className="font-serif text-2xl font-bold text-primary block">
                      {formatBRL(potencialBruto)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {oppsAtivas.length} oportunidades ativas
                    </span>
                  </div>

                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                    <span className="text-xs font-semibold text-emerald-800">
                      Forecast Ponderado (Valor × Prob)
                    </span>
                    <span className="font-serif text-2xl font-bold text-emerald-700 block">
                      {formatBRL(forecastPonderado)}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Previsão real calculada
                    </span>
                  </div>

                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-2">
                    <span className="text-xs font-semibold text-blue-800">Meta do Período</span>
                    <span className="font-serif text-2xl font-bold text-blue-700 block">
                      {formatBRL(metaComercial)}
                    </span>
                    <span className="text-[11px] text-blue-700 font-medium">
                      Meta CIAFAL vigente
                    </span>
                  </div>

                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2">
                    <span className="text-xs font-semibold text-amber-900">Cobertura da Meta</span>
                    <span className="font-serif text-2xl font-bold text-amber-800 block">
                      {cobertura}%
                    </span>
                    <span className="text-[11px] text-amber-800 font-medium">
                      {cobertura >= 100 ? 'Suficiente para meta' : 'Atenção para prospecção'}
                    </span>
                  </div>
                </div>
              )
            })()}
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL 3.1: SOLICITAR VERIFICAÇÃO DE ESTOQUE (WMS) */}
      <WmsStockCheckModal
        open={wmsModalOpen}
        onOpenChange={setWmsModalOpen}
        itemCode={wmsSelectedData.itemCode}
        itemDescription={wmsSelectedData.itemDescription}
        currentStockTons={wmsSelectedData.currentStockTons}
        customerName={wmsSelectedData.customerName}
      />

      {/* MODAL 3.2: GERAR ALERTA DE PRIORIDADE DE CARGA NO TMS */}
      <TmsPriorityAlertModal
        open={tmsModalOpen}
        onOpenChange={setTmsModalOpen}
        customerName={tmsSelectedData.customerName}
        referenceDoc={tmsSelectedData.referenceDoc}
        itemDescription={tmsSelectedData.itemDescription}
        defaultTons={tmsSelectedData.defaultTons}
      />

      {/* MODAL + NOVA OPORTUNIDADE CIAFAL */}
      <NovaOportunidadeModal
        open={novaOportunidadeOpen}
        onOpenChange={setNovaOportunidadeOpen}
        initialCliente={selectedClienteForOpp}
        usuarioAtualNome={user?.name || 'Carlos Mendonça'}
        onSuccess={(newOpp) => {
          setOppsRefreshKey((k) => k + 1)
          setActiveTab('funil')
        }}
      />

      {/* MODAL DETALHES DA OPORTUNIDADE (AVANÇO DE ESTÁGIO, AUDITORIA E COTAÇÃO) */}
      <DetalhesOportunidadeModal
        open={detalhesOppModalOpen}
        onOpenChange={setDetalhesOppModalOpen}
        opportunity={selectedOppForDetail}
        usuarioAtualNome={user?.name || 'Carlos Mendonça'}
        onUpdate={(updated) => {
          setSelectedOppForDetail(updated)
          setOppsRefreshKey((k) => k + 1)
        }}
      />
    </div>
  )
}
