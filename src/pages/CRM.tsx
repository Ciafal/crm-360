import React, { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  mockClientes,
  mockFunilOportunidades,
  ClienteCarteira,
  OportunidadeFunil,
  EtapaFunil,
} from '@/data/mockCommercialData'
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
import { RFMSegmentBadge } from '@/components/shared/RFMSegmentBadge'
import { PageLoadingState, PageEmptyState, PageErrorState } from '@/components/shared/StateFeedback'
import { ABCBadge } from '@/components/shared/ABCBadge'
import { CommercialMetricToggle } from '@/components/shared/CommercialMetricToggle'
import { CarteiraMap } from '@/components/crm/CarteiraMap'
import { LeadsView } from '@/components/crm/LeadsView'
import { useAppStore } from '@/stores/useAppStore'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  const [searchParams, setSearchParams] = useSearchParams()

  const { commercialMetric } = useAppStore()
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'carteira')
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
  const [diasContatoMax, setDiasContatoMax] = useState<number | ''>('')

  // Ordenação da Tabela
  const [sortColumn, setSortColumn] = useState<SortColumn>('scoreComercial')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Filtros do Funil
  const [funilVendedorFilter, setFunilVendedorFilter] = useState('todos')

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  const handleTabChange = (val: string) => {
    setActiveTab(val)
    setSearchParams({ tab: val })
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
      const matchDiasContato = diasContatoMax === '' || c.diasSemContato <= Number(diasContatoMax)

      return (
        matchSearch &&
        matchVendedor &&
        matchSegmento &&
        matchRfm &&
        matchCidade &&
        matchAbcHist &&
        matchAbcPot &&
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
    diasContatoMax,
  ])

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

  // Oportunidades do Funil
  const rawFunil = useMemo(() => {
    if (isVendedorOnly) {
      return mockFunilOportunidades.filter(
        (op) =>
          op.vendedorId === user?.id ||
          (userEmail.includes('vendedor2')
            ? op.vendedorId === 'qas-vendedor2_teste'
            : userEmail.includes('representante')
              ? op.vendedorId === 'qas-representante_teste'
              : op.vendedorId === 'qas-vendedor_teste'),
      )
    }
    return mockFunilOportunidades
  }, [isVendedorOnly, userEmail, user?.id])

  const filteredFunil = useMemo(() => {
    return rawFunil.filter((op) => {
      if (funilVendedorFilter === 'todos') return true
      return op.vendedorNome.toLowerCase().includes(funilVendedorFilter.toLowerCase())
    })
  }, [rawFunil, funilVendedorFilter])

  // Métricas do Funil
  // Gap da Meta: R$ 625.000 | Pipeline Aberto: R$ 1.200.000 | Pipeline Ponderado: R$ 780.000 | Cobertura da Meta: 125%
  const funilMetricas = useMemo(() => {
    const abertas = filteredFunil.filter(
      (op) => !['faturado', 'adiado', 'perdido', 'cancelado'].includes(op.etapa),
    )
    const pipelineAberto = abertas.reduce((acc, op) => acc + op.valor, 0)
    const pipelinePonderado = abertas.reduce(
      (acc, op) => acc + (op.valor * op.probabilidade) / 100,
      0,
    )
    const gapMeta = isVendedorOnly ? 135000 : 625000
    const cobertura = gapMeta > 0 ? Math.round((pipelineAberto / gapMeta) * 100) : 100

    return {
      gapMeta,
      pipelineAberto,
      pipelinePonderado,
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
                Gestão da carteira de clientes, pipeline integrado ao SAP S/4HANA e funil de vendas
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
            onClick={() => toast.info('Abertura de nova cotação integrada ao SAP.')}
            className="h-9 gap-1.5 text-xs bg-[#003A70] text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Oportunidade
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
              <Building2 className="w-4 h-4" /> Gestão de Carteira ({sortedClientes.length})
            </TabsTrigger>
            <TabsTrigger
              value="mapa"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs font-semibold gap-1.5"
            >
              <MapPin className="w-4 h-4" /> Mapa da Carteira
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
            </TabsTrigger>
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
              <FileText className="w-4 h-4" /> Cotações SAP
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
                        className="py-3 px-3 font-bold cursor-pointer hover:text-primary transition-colors min-w-[200px]"
                        onClick={() => toggleSort('razaoSocial')}
                      >
                        <div className="flex items-center gap-1">
                          Cliente (Razão / Fantasia)
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </th>
                      <th className="py-3 px-2 font-bold text-center">ABC Hist.</th>
                      <th className="py-3 px-2 font-bold text-center">ABC Pot.</th>
                      <th className="py-3 px-2 font-bold">Cidade/UF</th>
                      <th className="py-3 px-2 font-bold">Segmento</th>
                      <th className="py-3 px-2 font-bold text-center font-mono">Ton 12m</th>
                      <th className="py-3 px-2 font-bold text-center font-mono">Ton YTD</th>
                      <th className="py-3 px-2 font-bold text-center font-mono">Média t/m</th>
                      {commercialMetric === 'REVENUE' && (
                        <th
                          className="py-3 px-3 font-bold text-right cursor-pointer hover:text-primary transition-colors"
                          onClick={() => toggleSort('faturamento12m')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Fat. 12m
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                      )}
                      <th className="py-3 px-2 font-bold text-center font-mono">Pipeline (t)</th>
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
                    {sortedClientes.map((c) => {
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

                          {/* ABC Histórico */}
                          <td className="py-3 px-2 text-center">
                            <ABCBadge category={c.abcHistorico} type="carteira" />
                          </td>

                          {/* ABC Potencial */}
                          <td className="py-3 px-2 text-center">
                            <ABCBadge category={c.abcPotencial} type="potencial" />
                          </td>

                          {/* Cidade/UF */}
                          <td className="py-3 px-2 whitespace-nowrap text-slate-700">
                            {c.cidade}/{c.uf}
                          </td>

                          {/* Segmento */}
                          <td className="py-3 px-2">
                            <span className="text-[11px] font-medium text-slate-800 block">
                              {c.segmento}
                            </span>
                          </td>

                          {/* Toneladas 12m */}
                          <td className="py-3 px-2 text-center font-mono font-bold text-primary">
                            {c.toneladas12m} t
                          </td>

                          {/* Toneladas YTD */}
                          <td className="py-3 px-2 text-center font-mono text-slate-700">
                            {c.toneladasYtd || (c.toneladas12m * 0.75).toFixed(1)} t
                          </td>

                          {/* Média Mensal Tons */}
                          <td className="py-3 px-2 text-center font-mono text-slate-600">
                            {c.mediaMensalTons || (c.toneladas12m / 12).toFixed(1)} t
                          </td>

                          {/* Faturamento 12m (quando métrica for REVENUE) */}
                          {commercialMetric === 'REVENUE' && (
                            <td className="py-3 px-3 text-right font-serif font-bold text-slate-900">
                              {formatBRL(c.faturamento12m)}
                            </td>
                          )}

                          {/* Pipeline Toneladas */}
                          <td className="py-3 px-2 text-center font-mono font-semibold text-emerald-600">
                            {c.pipelineTons || (c.pipelineValor / 6000).toFixed(1)} t
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
                                onClick={() =>
                                  toast.info(`Criar nova oportunidade para ${c.nomeFantasia}`)
                                }
                                title="Criar Oportunidade"
                              >
                                <Plus className="h-3.5 w-3.5" />
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

        {/* ABA 2: FUNIL DE VENDAS (KANBAN 8 ETAPAS + SAÍDAS + BARRA DE RESUMO) */}
        <TabsContent value="funil" className="space-y-6 m-0">
          {/* BARRA DE RESUMO OBRIGATÓRIA DO FUNIL */}
          {/* Gap da Meta: R$ 625.000 | Pipeline Aberto: R$ 1.200.000 | Pipeline Ponderado: R$ 780.000 | Cobertura da Meta: 125% */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Gap da Meta
              </span>
              <div className="mt-1">
                <span className="font-serif text-2xl font-bold text-amber-600">
                  {formatBRL(funilMetricas.gapMeta)}
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Valor faltante para bater a meta mensal
                </span>
              </div>
            </Card>

            <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Pipeline Aberto
              </span>
              <div className="mt-1">
                <span className="font-serif text-2xl font-bold text-primary">
                  {formatBRL(funilMetricas.pipelineAberto)}
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Total em negociação ativa no funil
                </span>
              </div>
            </Card>

            <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Pipeline Ponderado
              </span>
              <div className="mt-1">
                <span className="font-serif text-2xl font-bold text-emerald-600">
                  {formatBRL(funilMetricas.pipelinePonderado)}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                  Ajustado por probabilidade de fechamento
                </span>
              </div>
            </Card>

            <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Cobertura da Meta
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-none">
                  {funilMetricas.cobertura}%
                </Badge>
              </div>
              <div className="mt-1">
                <span className="font-serif text-2xl font-bold text-emerald-600">
                  {funilMetricas.cobertura}%
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  1.9x sobre o Gap necessário
                </span>
              </div>
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
            <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
              <Kanban className="w-5 h-5 text-primary" /> Etapas do Funil Comercial
            </h3>

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
                        stageOps.map((op) => (
                          <Card
                            key={op.id}
                            onClick={() => navigate(`/crm/${op.clienteId}`)}
                            className="bg-white border-border/50 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer rounded-xl p-3 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <span className="font-semibold text-xs text-primary block leading-tight hover:underline">
                                  {op.clienteNome}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  SAP {op.clienteSap} · {op.vendedorNome}
                                </span>
                              </div>
                              <Badge className="text-[9px] bg-primary/10 text-primary border-none font-bold">
                                {op.probabilidade}%
                              </Badge>
                            </div>

                            <p className="text-[11px] text-slate-700 font-medium line-clamp-2">
                              {op.titulo}
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-border/20 text-[11px]">
                              <span className="font-serif font-bold text-emerald-600">
                                {formatBRL(op.valor)}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                {op.toneladas} ton
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500" /> {op.agingDias}d no
                                funil
                              </span>
                              <span className="text-primary font-medium">
                                Prev: {op.previsaoFechamento}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-1.5 rounded-lg text-[10px] text-slate-600">
                              <strong className="text-primary">Próx. Ação:</strong> {op.proximaAcao}
                            </div>
                          </Card>
                        ))
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

        {/* ABA 3: OPORTUNIDADES */}
        <TabsContent value="oportunidades" className="space-y-4 m-0">
          <Card className="bg-white/90 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Lista de Oportunidades Comerciais
                </h3>
                <p className="text-xs text-muted-foreground">
                  Visão em lista de todas as negociações em andamento com probabilidade e volume.
                </p>
              </div>
              <Badge className="bg-primary text-white text-xs">
                {rawFunil.length} oportunidades
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-muted-foreground uppercase text-[10px] border-b">
                  <tr>
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">Título Oportunidade</th>
                    <th className="py-3 px-3">Etapa</th>
                    <th className="py-3 px-3 text-right">Valor R$</th>
                    <th className="py-3 px-3 text-center">Ton</th>
                    <th className="py-3 px-3 text-center">Prob.</th>
                    <th className="py-3 px-3 text-center">Aging</th>
                    <th className="py-3 px-3">Vendedor</th>
                    <th className="py-3 px-3">Próxima Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {rawFunil.map((op) => (
                    <tr
                      key={op.id}
                      onClick={() => navigate(`/crm/${op.clienteId}`)}
                      className="hover:bg-primary/5 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-bold text-primary">{op.clienteNome}</td>
                      <td className="py-3 px-3 text-slate-800 font-medium">{op.titulo}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {op.etapa}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right font-serif font-bold text-emerald-600">
                        {formatBRL(op.valor)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{op.toneladas}t</td>
                      <td className="py-3 px-3 text-center font-bold text-primary">
                        {op.probabilidade}%
                      </td>
                      <td className="py-3 px-3 text-center text-muted-foreground">
                        {op.agingDias}d
                      </td>
                      <td className="py-3 px-3 text-slate-600">{op.vendedorNome}</td>
                      <td className="py-3 px-3 text-slate-700">{op.proximaAcao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ABA 4: COTAÇÕES */}
        <TabsContent value="cotacoes" className="space-y-4 m-0">
          <Card className="bg-white/90 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Cotações SAP S/4HANA Integradas
                </h3>
                <p className="text-xs text-muted-foreground">
                  Propostas geradas diretamente no SAP com status de aprovação e vigência de tabela.
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs"
              >
                Sincronização Online
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl font-bold font-mono">
                    COT-98104
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary">Metalúrgica Santa Rita Ltda</h4>
                    <span className="text-xs text-muted-foreground">
                      16.5t Perfis W 200x26.6 · Emissão: Ontem · Vencimento: 26/10/2024
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-serif font-bold text-lg text-emerald-600 block">
                    R$ 95.000,00
                  </span>
                  <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold border-none">
                    Aguardando Aceite
                  </Badge>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl font-bold font-mono">
                    COT-98088
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary">
                      Aços & Caldeiraria Betim S.A.
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      22.0t Chapas Grossas ASTM A36 · Emissão: 12/10/2024 · Vencimento: 22/10/2024
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-serif font-bold text-lg text-emerald-600 block">
                    R$ 120.000,00
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-none">
                    Em Negociação
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ABA 5: PIPELINE */}
        <TabsContent value="pipeline" className="space-y-4 m-0">
          <Card className="bg-white/90 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <h3 className="font-serif text-lg font-bold text-primary mb-2">
              Projeção de Pipeline & Forecast Preditivo
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Modelo preditivo CIAFAL calibrado com histórico de 12 meses e probabilidade de
              fechamento por etapa.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-border/40 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Pipeline Nominal
                </span>
                <span className="font-serif text-2xl font-bold text-primary block">
                  R$ 1.200.000
                </span>
                <span className="text-[11px] text-muted-foreground">Total de propostas ativas</span>
              </div>
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                <span className="text-xs font-semibold text-emerald-800">Forecast Ponderado</span>
                <span className="font-serif text-2xl font-bold text-emerald-700 block">
                  R$ 780.000
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Previsão real de faturamento
                </span>
              </div>
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-2">
                <span className="text-xs font-semibold text-blue-800">Cobertura do Gap</span>
                <span className="font-serif text-2xl font-bold text-blue-700 block">125%</span>
                <span className="text-[11px] text-blue-700 font-medium">
                  Suficiente para atingir 100% da meta
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
