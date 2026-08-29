import React, { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  mockClientes,
  mockTimelineData,
  mockProdutosCliente,
  mockNFsCliente,
  mockFunilOportunidades,
  ClienteCarteira,
  TimelineEntry,
  ProdutoCliente,
  NFCliente,
} from '@/data/mockCommercialData'
import {
  initialCommercialPlaybooks,
  mockComplaints,
  initialCPQQuotes,
} from '@/data/mockPlaybooksAndWorkflows'
import { sapCreditProvider } from '@/providers/SAPCreditProvider'
import { tmsProvider } from '@/providers/TMSProvider'
import type {
  SAPCreditData,
  TMSDeliveryLoad,
  CustomerComplaint,
  CommercialPlaybook,
} from '@/types/models'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SecondaryTargetAxisChart } from '@/components/shared/SecondaryTargetAxisChart'
import { mockCommercialContacts } from '@/data/mockCommercialContacts'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Warehouse,
  Flame,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Check,
  AlertCircle,
  FileCheck,
  Compass,
  Bot,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { RFMSegmentBadge } from '@/components/shared/RFMSegmentBadge'
import { ABCBadge } from '@/components/shared/ABCBadge'
import { CommercialMetricToggle } from '@/components/shared/CommercialMetricToggle'
import { ClientDocumentViewerModal, DocumentType } from '@/components/crm/ClientDocumentViewerModal'
import {
  WmsStockCheckModal,
  TmsPriorityAlertModal,
} from '@/components/crm/OperationalActionsDialogs'
import { useAppStore } from '@/stores/useAppStore'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { cn, formatCurrency, formatWeight } from '@/lib/utils'

const COLORS = ['#003A70', '#00A3E0', '#10B981', '#F59E0B', '#6366F1', '#EC4899']

export default function Cliente360() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { commercialMetric } = useAppStore()

  const [activeTab, setActiveTab] = useState('indicadores')
  const [wmsConfirmed, setWmsConfirmed] = useState<Record<string, boolean>>({})

  // Estado SAP Crédito F.35
  const [creditData, setCreditData] = useState<SAPCreditData | null>(null)
  const [loadingCredit, setLoadingCredit] = useState(false)

  // Estado TMS Entregas
  const [tmsLoads, setTmsLoads] = useState<TMSDeliveryLoad[]>([])
  const [loadingTMS, setLoadingTMS] = useState(false)

  // Estado Visualizador de Documentos (Fase 2 / Item 6: NF, Boletos, Certificados)
  const [docModalOpen, setDocModalOpen] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('NF')
  const [selectedDocData, setSelectedDocData] = useState<any>({
    number: '109842',
    clientName: '',
  })

  // Ações Operacionais (WMS e Alerta Prioridade TMS)
  const [wmsModalOpen, setWmsModalOpen] = useState(false)
  const [tmsAlertModalOpen, setTmsAlertModalOpen] = useState(false)
  const [selectedItemForWms, setSelectedItemForWms] = useState({
    code: 'TB-304-SCH10',
    description: 'Tubo Inox AISI 304 Redondo 2"',
    stock: 3.4,
  })

  const handleOpenDocument = (type: DocumentType, data: any) => {
    setSelectedDocType(type)
    setSelectedDocData(data)
    setDocModalOpen(true)
  }

  // Localizar cliente nos mocks
  const cliente = useMemo(() => {
    return (
      mockClientes.find((c) => c.id === id || c.sapCode === id) || mockClientes[0] // fallback seguro
    )
  }, [id])

  // Identificar se o usuário tem permissão para visualizar faturamento/margem
  const userRole = (user?.role || '').toLowerCase()
  const canViewFinancials =
    userRole === 'gerente_comercial' ||
    userRole === 'diretoria' ||
    userRole === 'administrador' ||
    userRole === 'supervisor' ||
    commercialMetric === 'REVENUE'

  // Cálculos de Representatividade na Carteira do Vendedor
  const {
    sellerTotalTons,
    sellerTotalRevenue,
    sellerTotalPotential,
    shareTonsPercent,
    shareRevenuePercent,
    sharePotentialPercent,
    rankTons,
    rankRevenue,
    totalSellerClients,
  } = useMemo(() => {
    const sellerClients = mockClientes.filter((c) => c.vendedorId === cliente.vendedorId)
    const totalT = sellerClients.reduce((acc, c) => acc + c.toneladas12m, 0) || 1
    const totalR = sellerClients.reduce((acc, c) => acc + c.faturamento12m, 0) || 1
    const totalPot =
      sellerClients.reduce((acc, c) => acc + (c.potencialTons12m || c.toneladas12m * 1.2), 0) || 1

    const sortedByTons = [...sellerClients].sort((a, b) => b.toneladas12m - a.toneladas12m)
    const rankT = sortedByTons.findIndex((c) => c.id === cliente.id) + 1

    const sortedByRevenue = [...sellerClients].sort((a, b) => b.faturamento12m - a.faturamento12m)
    const rankR = sortedByRevenue.findIndex((c) => c.id === cliente.id) + 1

    const shareT = (cliente.toneladas12m / totalT) * 100
    const shareR = (cliente.faturamento12m / totalR) * 100
    const clientPot = cliente.potencialTons12m || cliente.toneladas12m * 1.2
    const shareP = (clientPot / totalPot) * 100

    return {
      sellerTotalTons: totalT,
      sellerTotalRevenue: totalR,
      sellerTotalPotential: totalPot,
      shareTonsPercent: shareT.toFixed(1),
      shareRevenuePercent: shareR.toFixed(1),
      sharePotentialPercent: shareP.toFixed(1),
      rankTons: rankT > 0 ? rankT : 1,
      rankRevenue: rankR > 0 ? rankR : 1,
      totalSellerClients: sellerClients.length,
    }
  }, [cliente])

  // Buscar Playbook Comercial do Arquétipo
  const archetype = cliente.arquetipoComercial || 'INDÚSTRIA'
  const playbook = useMemo(() => {
    return (
      initialCommercialPlaybooks.find((p) => p.customer_archetype === archetype) ||
      initialCommercialPlaybooks[0]
    )
  }, [archetype])

  // Buscar Reclamações de Qualidade
  const complaints = useMemo(() => {
    return mockComplaints[cliente.id] || mockComplaints['cli-100001'] || []
  }, [cliente.id])

  const openComplaintsCount = complaints.filter(
    (c) => c.status === 'ABERTA' || c.status === 'EM_ANALISE' || c.status === 'PLANO_DE_ACAO',
  ).length
  const recurrentComplaintsCount = complaints.filter((c) => c.isRecurrent).length

  // Carregar dados de crédito SAP ECC (F.35)
  const fetchCredit = async (forceRefresh = false) => {
    setLoadingCredit(true)
    try {
      const data = await sapCreditProvider.getCreditPosition(
        cliente.id,
        cliente.sapCode,
        forceRefresh,
      )
      setCreditData(data)
      if (forceRefresh) {
        toast.success('Posição de crédito SAP ECC F.35 atualizada em tempo real!')
      }
    } catch {
      toast.error('Não foi possível consultar a posição de crédito SAP.')
    } finally {
      setLoadingCredit(false)
    }
  }

  // Carregar cargas do TMS
  const fetchTMSLoads = async () => {
    setLoadingTMS(true)
    try {
      const loads = await tmsProvider.getCustomerLoads(cliente.id)
      setTmsLoads(loads)
    } catch {
      toast.error('Erro ao carregar dados do TMS.')
    } finally {
      setLoadingTMS(false)
    }
  }

  useEffect(() => {
    fetchCredit(false)
    fetchTMSLoads()
  }, [cliente.id])

  // Dados das abas com fallback seguro
  const timeline = useMemo(() => {
    return mockTimelineData[cliente.id] || mockTimelineData['cli-100001'] || []
  }, [cliente.id])

  const produtos = useMemo(() => {
    return mockProdutosCliente[cliente.id] || mockProdutosCliente['cli-100001'] || []
  }, [cliente.id])

  const nfs = useMemo(() => {
    return mockNFsCliente[cliente.id] || mockNFsCliente['cli-100001'] || []
  }, [cliente.id])

  const oportunidades = useMemo(() => {
    return mockFunilOportunidades.filter((op) => op.clienteId === cliente.id)
  }, [cliente.id])

  // Gráficos Recharts: Histórico Mensal 12 Meses (Toneladas & Faturamento)
  const monthlyData24m = useMemo(() => {
    const months = [
      'Out/23',
      'Nov/23',
      'Dez/23',
      'Jan/24',
      'Fev/24',
      'Mar/24',
      'Abr/24',
      'Mai/24',
      'Jun/24',
      'Jul/24',
      'Ago/24',
      'Set/24',
    ]
    const baseTon = cliente.toneladas12m / 12
    const baseRev = cliente.faturamento12m / 12

    return months.map((m, idx) => {
      const factor = 0.8 + ((idx * 7) % 5) * 0.1
      const tons = Math.round(baseTon * factor * 10) / 10
      const rev = Math.round(baseRev * factor)
      const metaTon = Math.round(baseTon * 1.1 * 10) / 10

      return {
        month: m,
        toneladas: tons,
        metaToneladas: metaTon,
        faturamento: rev,
      }
    })
  }, [cliente])

  // Gráficos Mix de Famílias
  const familyMixData = useMemo(() => {
    const map: Record<string, number> = {}
    produtos.forEach((p) => {
      map[p.familia] = (map[p.familia] || 0) + p.volume12mTon
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [produtos])

  const formatBRL = (val?: number) => {
    if (val === undefined || val === null) return 'R$ 0'
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  const handleRequestWMS = (prodCode: string) => {
    setWmsConfirmed((prev) => ({ ...prev, [prodCode]: true }))
    toast.success(`Solicitação de confirmação de saldo WMS enviada para o item ${prodCode}!`, {
      description: 'A equipe de logística do CD Contagem foi notificada.',
    })
  }

  const getTimelineIcon = (tipo: string) => {
    switch (tipo) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />
      case 'email':
        return <Mail className="w-4 h-4 text-indigo-600" />
      case 'telefone':
        return <Phone className="w-4 h-4 text-blue-600" />
      case 'visita':
        return <MapPin className="w-4 h-4 text-amber-600" />
      case 'cotacao':
        return <FileText className="w-4 h-4 text-purple-600" />
      case 'pedido':
        return <ShoppingBag className="w-4 h-4 text-primary" />
      case 'nf':
        return <Truck className="w-4 h-4 text-emerald-700" />
      default:
        return <Clock className="w-4 h-4 text-slate-500" />
    }
  }

  // Estatísticas de Cargas TMS
  const loadsInTransit = tmsLoads.filter(
    (l) => l.status === 'LOAD_IN_TRANSIT' || l.status === 'LOAD_DISPATCHED',
  )
  const loadsInDispatch = tmsLoads.filter(
    (l) =>
      l.status === 'IN_DISPATCH' || l.status === 'ORDER_PREPARATION' || l.status === 'LOAD_FORMED',
  )
  const loadsWithException = tmsLoads.filter(
    (l) => l.hasLogisticsException || l.status === 'LOGISTICS_EXCEPTION',
  )
  const tonsInTransit = loadsInTransit.reduce((acc, l) => acc + l.tons, 0)
  const tonsInDispatch = loadsInDispatch.reduce((acc, l) => acc + l.tons, 0)

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* NAVEGAÇÃO DE VOLTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/crm')}
          className="gap-1.5 text-xs text-muted-foreground hover:text-primary pl-0 w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Gestão de Carteira
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          <CommercialMetricToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCredit(true)}
            disabled={loadingCredit}
            className="h-8 gap-1.5 text-xs text-muted-foreground"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loadingCredit && 'animate-spin')} /> Atualizar
            Crédito SAP (F.35)
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/crm?tab=funil&novo=true&cliente=${cliente.id}`)}
            className="h-8 gap-1.5 text-xs bg-primary text-white"
          >
            <Plus className="w-3.5 h-3.5" /> Criar Cotação CPQ
          </Button>
        </div>
      </div>

      {/* ALERTAS OPERACIONAIS EM TOPO (QUALIDADE & LOGÍSTICA) */}
      {(openComplaintsCount > 0 || loadsWithException.length > 0) && (
        <div className="space-y-2">
          {loadsWithException.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-400 text-amber-900 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  <strong>Alerta Logístico TMS:</strong> Carga do cliente{' '}
                  <strong className="text-amber-950">{cliente.nomeFantasia}</strong> está com
                  ocorrência em trânsito:{' '}
                  {loadsWithException[0].exceptionReason ||
                    'Retenção temporária para conferência fiscal.'}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab('tms')}
                className="h-7 text-xs bg-white text-amber-800 border-amber-300 shrink-0"
              >
                Ver no TMS
              </Button>
            </div>
          )}

          {openComplaintsCount > 0 && (
            <div className="bg-rose-500/10 border border-rose-300 text-rose-900 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <span>
                  <strong>Atenção Comercial:</strong> Existem{' '}
                  <strong>{openComplaintsCount} reclamações de qualidade abertas</strong> na Gestão
                  de Performance para este cliente. Alinhe a resolução antes de realizar nova
                  abordagem.
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab('qualidade')}
                className="h-7 text-xs bg-white text-rose-800 border-rose-300 shrink-0"
              >
                Ver Reclamações
              </Button>
            </div>
          )}
        </div>
      )}

      {/* CABEÇALHO DO CLIENTE 360º COM REPRESENTATIVIDADE */}
      <Card className="bg-white/95 backdrop-blur-md border-border/40 shadow-sm rounded-3xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Informações Principais */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  SAP #{cliente.sapCode}
                </span>
                <h1 className="font-serif text-2xl font-bold text-primary tracking-tight">
                  {cliente.razaoSocial}
                </h1>
                <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] font-bold">
                  {archetype}
                </Badge>
                <Badge
                  className={cn(
                    'text-[10px] font-bold border-none',
                    cliente.statusComercial === 'Ativo'
                      ? 'bg-emerald-100 text-emerald-800'
                      : cliente.statusComercial === 'Em Risco'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800',
                  )}
                >
                  Status: {cliente.statusComercial}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-bold',
                    creditData?.creditStatus === 'REGULAR'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : creditData?.creditStatus === 'RESTRITO'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300',
                  )}
                >
                  Crédito SAP: {creditData?.creditStatus || cliente.statusCredito}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground mt-2">
                <span className="font-medium text-slate-800">
                  Fantasia: <strong>{cliente.nomeFantasia}</strong>
                </span>
                <span>CNPJ: {cliente.cnpj}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <strong>
                    {cliente.enderecoCadastral || `${cliente.cidade} - ${cliente.uf}`}
                  </strong>
                </span>
                {cliente.cnae && (
                  <span className="text-[11px] text-slate-600">
                    CNAE: <strong>{cliente.cnae}</strong>
                  </span>
                )}
              </div>

              {/* BARRA DE INTEGRAÇÃO GEOGRÁFICA / MINI-MAPA */}
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-border/40">
                <Badge
                  variant="outline"
                  className="text-[10px] bg-slate-50 border-slate-300 gap-1 text-slate-700"
                >
                  <MapPin className="h-3 w-3 text-emerald-600" />
                  Coordenadas: {cliente.latitude || -19.9328}, {cliente.longitude || -44.0539}{' '}
                  (Fonte: SAP ECC)
                </Badge>
                {cliente.filiais && cliente.filiais.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-blue-50 border-blue-200 text-blue-800"
                  >
                    {cliente.filiais.length} Filiais / Pontos Ship-To Cadastrados
                  </Badge>
                )}
                <div className="flex items-center gap-1.5 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 rounded-lg border-primary/30 text-primary hover:bg-primary/5"
                    onClick={() => navigate('/crm?tab=mapa')}
                  >
                    <Compass className="h-3.5 w-3.5" />
                    Ver no Mapa da Carteira
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 rounded-lg border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 font-semibold"
                    onClick={() => {
                      navigate(
                        `/solicitacoes?tipo=VISITA_TECNICA_CLIENTE&cliente=${encodeURIComponent(cliente.id)}&sap=${cliente.sapCode}`,
                      )
                      toast.success(
                        `Abrindo Solicitação de Visita Técnica com dados de ${cliente.nomeFantasia}!`,
                      )
                    }}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Planejar Visita (Solicitação Técnica)
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 rounded-lg text-slate-600 hover:text-slate-900"
                    onClick={() => {
                      const lat = cliente.latitude || -19.9328
                      const lng = cliente.longitude || -44.0539
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                        '_blank',
                      )
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir Rota no GPS
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-600 mt-1">
                <span>
                  Vendedor Responsável: <strong>{cliente.vendedor}</strong>
                </span>
                <span>
                  Supervisor Regional: <strong>{cliente.supervisor}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Destaque de Representatividade na Carteira (Alterna por commercialMetric) */}
          <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-border/40 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                {commercialMetric === 'REVENUE'
                  ? 'Representatividade Faturamento'
                  : 'Representatividade Toneladas'}
              </span>
              <span className="font-serif text-xl font-bold text-primary block mt-0.5">
                {commercialMetric === 'REVENUE'
                  ? `${shareRevenuePercent}% do Faturamento`
                  : `${shareTonsPercent}% das Toneladas`}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {commercialMetric === 'REVENUE' ? rankRevenue : rankTons}º maior cliente de{' '}
                {totalSellerClients} ({sharePotentialPercent}% do potencial)
              </span>
            </div>
            <div className="h-9 w-px bg-border/60 mx-1" />
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                ABC Hist. / Pot.
              </span>
              <div className="flex items-center gap-1 mt-1 justify-center">
                <ABCBadge category={cliente.abcHistorico} type="carteira" />
                <span className="text-xs text-muted-foreground">/</span>
                <ABCBadge category={cliente.abcPotencial} type="potencial" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 8 CARDS DE RESUMO (LINHA SUPERIOR) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Faturamento 12m */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Fat. 12m
          </span>
          <div className="mt-1.5">
            <span className="font-serif text-sm font-bold text-slate-900 block">
              {formatBRL(cliente.faturamento12m)}
            </span>
          </div>
        </Card>

        {/* 2. Toneladas 12m */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Volume 12m
          </span>
          <div className="mt-1.5">
            <span className="font-serif text-sm font-bold text-primary block">
              {cliente.toneladas12m.toLocaleString('pt-BR')} t
            </span>
            <span className="text-[9px] text-muted-foreground">
              Média: {cliente.mediaMensalTons || (cliente.toneladas12m / 12).toFixed(1)} t/m
            </span>
          </div>
        </Card>

        {/* 3. Ticket Médio */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Ticket Médio
          </span>
          <div className="mt-1.5">
            <span className="font-serif text-sm font-bold text-slate-900 block">
              {formatBRL(cliente.ticketMedio)}
            </span>
          </div>
        </Card>

        {/* 4. Frequência */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Frequência
          </span>
          <div className="mt-1.5">
            <span className="text-xs font-semibold text-slate-800 block">
              {cliente.recorrencia}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ~{cliente.frequenciaDias} dias
            </span>
          </div>
        </Card>

        {/* 5. Última Compra */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Última Compra
          </span>
          <div className="mt-1.5">
            <span className="text-xs font-semibold text-slate-900 block">
              {cliente.ultimaCompraData}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block">
              {formatBRL(cliente.ultimaCompraValor)}
            </span>
          </div>
        </Card>

        {/* 6. Próxima Recompra */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Próx. Recompra
          </span>
          <div className="mt-1.5">
            <span className="text-xs font-semibold text-slate-900 block">
              {cliente.proximaCompraEstimada}
            </span>
            <span className="text-[10px] text-primary font-semibold block">
              em {cliente.diasProximaCompra} dias
            </span>
          </div>
        </Card>

        {/* 7. P(vivo) & Purchase Moment */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            P(vivo) / Score
          </span>
          <div className="mt-1.5">
            <span className="font-mono text-xs font-bold text-emerald-600 block">
              {cliente.pVivo}% ativo
            </span>
            <span className="text-[10px] text-muted-foreground block">
              Score: {cliente.purchaseMomentScore || cliente.scoreComercial}/100
            </span>
          </div>
        </Card>

        {/* 8. Pipeline & Último Contato */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Pipeline Ativo
          </span>
          <div className="mt-1.5">
            <span className="font-serif text-sm font-bold text-emerald-600 block">
              {formatBRL(cliente.pipelineValor)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {cliente.pipelineTons || (cliente.pipelineValor / 6000).toFixed(1)}t em aberto
            </span>
          </div>
        </Card>
      </div>

      {/* ABAS DETALHADAS DO CLIENTE 360º */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="border-b border-border/40 pb-px">
          <TabsList className="bg-transparent p-0 h-auto gap-2 flex-wrap">
            <TabsTrigger
              value="indicadores"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="contatos"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5"
            >
              <Users className="w-3.5 h-3.5" /> Contatos
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" /> Timeline Comercial
            </TabsTrigger>
            <TabsTrigger
              value="agenda"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" /> Agenda & Ações
            </TabsTrigger>
            <TabsTrigger
              value="oportunidades"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" /> Leads/Opps ({oportunidades.length})
            </TabsTrigger>
            <TabsTrigger
              value="cotacoes"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Cotações
            </TabsTrigger>
            <TabsTrigger
              value="pedidos"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Pedidos
            </TabsTrigger>
            <TabsTrigger
              value="financeiro"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" /> Financeiro / Crédito
            </TabsTrigger>
            <TabsTrigger
              value="documentos"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5" /> Documentos (NF/Boleto)
            </TabsTrigger>
            <TabsTrigger
              value="tms"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" /> Logística / TMS ({tmsLoads.length})
            </TabsTrigger>
            <TabsTrigger
              value="satisfacao"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Satisfação Clientes
            </TabsTrigger>
            <TabsTrigger
              value="ia_insights"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5 bg-sky-50 text-sky-900 border border-sky-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> IA & Playbook
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ABA 1: PAINEL DE INDICADORES DO CLIENTE (5 CATEGORIAS + GRÁFICOS) */}
        <TabsContent value="indicadores" className="space-y-6 m-0">
          {/* 5 CATEGORIAS DE INDICADORES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Indicadores Comerciais */}
            <Card className="bg-white/95 border-border/50 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-primary border-b pb-2">
                <ShoppingBag className="w-4 h-4" />
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider">
                  Comerciais
                </h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ton 12m:</span>
                  <strong className="text-primary font-mono">{cliente.toneladas12m} t</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ton YTD:</span>
                  <span className="font-mono">
                    {cliente.toneladasYtd || (cliente.toneladas12m * 0.75).toFixed(1)} t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Média mensal:</span>
                  <span className="font-mono">
                    {cliente.mediaMensalTons || (cliente.toneladas12m / 12).toFixed(1)} t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fat. 12m:</span>
                  <strong className="text-slate-900 font-serif">
                    {formatBRL(cliente.faturamento12m)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket Médio:</span>
                  <span className="font-serif">{formatBRL(cliente.ticketMedio)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P(vivo):</span>
                  <strong className="text-emerald-600 font-mono">{cliente.pVivo}%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Moment:</span>
                  <Badge className="bg-primary/10 text-primary text-[10px] font-bold border-none">
                    {cliente.purchaseMomentScore || 90}/100
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Potencial 12m:</span>
                  <span className="font-serif">{formatBRL(cliente.potencial12m)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pipeline Aberto:</span>
                  <span className="text-emerald-600 font-bold">
                    {formatBRL(cliente.pipelineValor)}
                  </span>
                </div>
              </div>
            </Card>

            {/* 2. Indicadores de Relacionamento */}
            <Card className="bg-white/95 border-border/50 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 border-b pb-2">
                <Users className="w-4 h-4" />
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider">
                  Relacionamento
                </h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Último contato:</span>
                  <strong>
                    {cliente.ultimoContatoData} ({cliente.ultimoContatoCanal})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dias sem contato:</span>
                  <Badge
                    className={cn(
                      'text-[10px] border-none',
                      cliente.diasSemContato <= 7
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800',
                    )}
                  >
                    {cliente.diasSemContato}d
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última visita:</span>
                  <span>{cliente.ultimaVisitaData || 'Há 12 dias'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dias sem visita:</span>
                  <span>{cliente.diasSemVisita || 12}d</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contatos 30/60/90d:</span>
                  <span className="font-mono">8 / 14 / 22</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WhatsApp enviados:</span>
                  <span className="font-mono">18 mensagens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ligações VoIP:</span>
                  <span className="font-mono">6 chamadas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo resp. cliente:</span>
                  <span className="font-mono">~1.5 horas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo resp. vendedor:</span>
                  <span className="font-mono">~25 min</span>
                </div>
              </div>
            </Card>

            {/* 3. Indicadores Financeiros */}
            <Card className="bg-white/95 border-border/50 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 border-b pb-2">
                <CreditCard className="w-4 h-4" />
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider">
                  Financeiros
                </h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Limite Crédito:</span>
                  <strong className="font-serif">
                    {formatBRL(creditData?.creditLimit || cliente.limiteCredito)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crédito Utilizado:</span>
                  <span className="font-serif text-slate-800">
                    {formatBRL(
                      creditData?.creditExposure ||
                        cliente.limiteCredito - cliente.creditoDisponivel,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crédito Disponível:</span>
                  <strong className="font-serif text-emerald-700">
                    {formatBRL(creditData?.creditAvailable || cliente.creditoDisponivel)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">% Utilizado:</span>
                  <span className="font-mono">{creditData?.utilizationPercent || 45}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">A Vencer:</span>
                  <span className="font-serif">
                    {formatBRL(creditData?.receivablesOpenNotDue || 120000)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vencido:</span>
                  <span
                    className={cn(
                      'font-serif font-bold',
                      (creditData?.receivablesOverdue || 0) > 0
                        ? 'text-rose-600'
                        : 'text-slate-800',
                    )}
                  >
                    {formatBRL(creditData?.receivablesOverdue || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maior Atraso:</span>
                  <span>{creditData?.maxDelayDays || 0} dias</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Condição Pgto:</span>
                  <span className="text-[11px] font-semibold">28 / 35 DDL</span>
                </div>
              </div>
            </Card>

            {/* 4. Indicadores Logísticos */}
            <Card className="bg-white/95 border-border/50 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-sky-700 border-b pb-2">
                <Truck className="w-4 h-4" />
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider">
                  Logísticos (TMS)
                </h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cargas em Trânsito:</span>
                  <strong className="text-primary font-mono">
                    {loadsInTransit.length} ({tonsInTransit.toFixed(1)} t)
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Em Expedição:</span>
                  <span className="font-mono">
                    {loadsInDispatch.length} ({tonsInDispatch.toFixed(1)} t)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entregues no mês:</span>
                  <span className="font-mono">8 cargas (112.5 t)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prazo médio entrega:</span>
                  <span className="font-mono">1.8 dias</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atrasos de entrega:</span>
                  <span className="font-mono">0 atrasos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OTIF Médio:</span>
                  <strong className="text-emerald-700 font-mono">98.2%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ocorrências:</span>
                  <Badge
                    className={cn(
                      'text-[10px] border-none',
                      loadsWithException.length > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800',
                    )}
                  >
                    {loadsWithException.length}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* 5. Indicadores de Qualidade */}
            <Card className="bg-white/95 border-border/50 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-700 border-b pb-2">
                <ShieldCheck className="w-4 h-4" />
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider">Qualidade</h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reclamações abertas:</span>
                  <strong
                    className={cn(openComplaintsCount > 0 ? 'text-rose-600' : 'text-emerald-700')}
                  >
                    {openComplaintsCount}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Concluídas:</span>
                  <span className="font-mono">
                    {complaints.filter((c) => c.status === 'CONCLUIDA').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reincidentes:</span>
                  <span className="font-mono text-amber-700 font-bold">
                    {recurrentComplaintsCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última reclamação:</span>
                  <span>{complaints[0]?.openedAt || '15/06/2024'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dias s/ reclamação:</span>
                  <span className="font-mono">6 dias</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Índice Reclamação:</span>
                  <strong className="text-emerald-700 font-mono">0.4% das NFs</strong>
                </div>
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('qualidade')}
                    className="w-full h-7 text-[10px] text-primary"
                  >
                    Abrir Qualidade & Gestão Performance
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* GRÁFICOS: EVOLUÇÃO COM PADRÃO META EM LINHA NO SEGUNDO EIXO & IA EXPLICATIVA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SecondaryTargetAxisChart
                title={`Evolução Histórica de Compras — ${commercialMetric === 'TONS' ? 'Toneladas' : 'Faturamento'}`}
                subtitle="Barras: Realizado (Fato) | Linha Segundo Eixo: Meta & Expectativa Mensal | Tracejado: Forecast"
                data={monthlyData24m.map((d, i) => ({
                  label: d.month,
                  realizado: commercialMetric === 'TONS' ? d.toneladas : d.faturamento,
                  meta:
                    commercialMetric === 'TONS'
                      ? d.metaToneladas
                      : Math.round(d.faturamento * 1.15),
                  forecast:
                    i >= 9
                      ? commercialMetric === 'TONS'
                        ? Math.round(d.metaToneladas * 1.05)
                        : Math.round(d.faturamento * 1.2)
                      : undefined,
                }))}
                unit={commercialMetric === 'TONS' ? 't' : 'R$'}
                metricType={commercialMetric === 'TONS' ? 'TONELADAS' : 'REAIS'}
                isCurrency={commercialMetric === 'REVENUE'}
                aiAnalysis={{
                  summary: `Cliente ${cliente.nomeFantasia} apresenta gap residual de 14.5 t no ciclo atual em relação à meta Qlik, com 82% da demanda concentrada em Perfis W e Chapas A36.`,
                  factors: [
                    {
                      title: 'Cotação Aberta sem Follow-up > 48h',
                      impactTons: 8.5,
                      source: 'CRM',
                      evidence:
                        'Cotação COT-SAP-98104 de 16.5t enviada e aguardando retorno do comprador Eduardo.',
                    },
                    {
                      title: 'Estoque de Perfis W200 no WMS Contagem',
                      impactTons: 6.0,
                      source: 'WMS',
                      evidence: 'Saldo físico de 24t liberado no pátio para pronta expedição.',
                    },
                  ],
                  recommendation:
                    'Realizar contato via WhatsApp com o comprador Eduardo para alinhamento de frete CIF e liberação da ordem SAP ECC.',
                }}
              />
            </div>

            <Card className="bg-white/95 border-border/50 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary mb-1">Mix de Famílias</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Participação por volume (t) no cliente
                </p>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={familyMixData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label
                      >
                        {familyMixData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: any) => [`${val} t`, 'Volume']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t text-xs">
                {familyMixData.map((f, i) => (
                  <div key={f.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      {f.name}
                    </span>
                    <strong className="font-mono text-primary">{f.value} t</strong>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 2: PLAYBOOK COMERCIAL POR ARQUÉTIPO */}
        <TabsContent value="playbook" className="space-y-6 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-white font-bold text-xs">
                    {playbook.customer_archetype}
                  </Badge>
                  <h3 className="font-serif text-xl font-bold text-primary">{playbook.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Diretrizes estratégicas e consultivas parametrizadas pela diretoria comercial para
                  clientes do arquétipo <strong>{archetype}</strong>.
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <span>
                  Versão: <strong>{playbook.version}</strong>
                </span>
                <span className="block">Atualizado em: {playbook.updated_at}</span>
              </div>
            </div>

            {/* Abordagem Recomendada & Objetivos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
                  Abordagem Comercial Recomendada
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {playbook.recommended_approach}
                </p>
                <div className="pt-2 text-[11px] text-muted-foreground">
                  <strong>Cadência Sugerida:</strong> {playbook.recommended_cadence}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-border/40 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  Objetivos Estratégicos com o Cliente
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {playbook.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Perguntas a Fazer & Sinais de Atenção */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-border/40 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-600" /> Perguntas Chave para Qualificação
                  & Diagnóstico
                </span>
                <ul className="space-y-2 text-xs text-slate-800">
                  {playbook.questions_to_ask.map((q, i) => (
                    <li key={i} className="p-2.5 bg-white rounded-xl border border-border/40">
                      "{q}"
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-border/40 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Sinais de Compra & Alertas para
                  Observar
                </span>
                <ul className="space-y-2 text-xs text-slate-800">
                  {playbook.signals_to_watch.map((s, i) => (
                    <li key={i} className="p-2.5 bg-white rounded-xl border border-border/40">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Objeções e Como Responder */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                Matriz de Objeções Típicas & Respostas Recomendadas
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {playbook.objections.map((obj, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-white rounded-2xl border border-border/60 space-y-2 shadow-2xs"
                  >
                    <div className="text-xs font-bold text-rose-800">
                      Objeção: "{obj.objection}"
                    </div>
                    <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-border/40">
                      <strong className="text-emerald-700">Resposta Recomendada:</strong>{' '}
                      {obj.recommended_response}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Padrões Proibidos */}
            <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Padrões Proibidos para este
                Arquétipo (Anti-Patterns):
              </span>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                {playbook.forbidden_patterns.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </Card>
        </TabsContent>

        {/* ABA 3: ENTREGAS & TMS */}
        <TabsContent value="tms" className="space-y-6 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-primary">
                    Monitoramento de Entregas & Cargas (TMS Rodoviário)
                  </h3>
                  <Badge
                    variant="outline"
                    className="bg-sky-50 text-sky-700 border-sky-300 text-[10px]"
                  >
                    Provedor TMS Conectado (Mock)
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rastreamento em tempo real de pedidos em preparação, expedição, trânsito e
                  comprovantes de entrega.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    navigate(
                      `/agente-fred?sap=${cliente.sapCode}&cliente=${encodeURIComponent(
                        cliente.razaoSocial,
                      )}`,
                    )
                  }}
                  className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                >
                  <Bot className="w-3.5 h-3.5" /> Acompanhar Entrega com Fred
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    window.open(`https://tms.ciafal.local/clientes/${cliente.sapCode}`, '_blank')
                  }
                  className="h-8 gap-1.5 text-xs text-primary rounded-xl"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir no TMS
                </Button>
              </div>
            </div>

            {/* CARDS DE RESUMO TMS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                  Em Trânsito
                </span>
                <span className="font-serif text-2xl font-bold text-sky-900 block mt-1">
                  {loadsInTransit.length} cargas — {tonsInTransit.toFixed(1)} t
                </span>
                <span className="text-[11px] text-sky-700">Rastreamento GPS telemetria ativo</span>
              </div>

              <div className="p-4 bg-slate-50 border border-border/60 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Em Expedição / CD
                </span>
                <span className="font-serif text-2xl font-bold text-slate-800 block mt-1">
                  {loadsInDispatch.length} cargas — {tonsInDispatch.toFixed(1)} t
                </span>
                <span className="text-[11px] text-muted-foreground">Pátio CD Contagem / Betim</span>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Próxima Entrega Prevista
                </span>
                <span className="font-serif text-xl font-bold text-emerald-900 block mt-1">
                  {tmsLoads[0]?.estimatedDeliveryDate || 'Hoje 16:30'}
                </span>
                <span className="text-[11px] text-emerald-700">
                  Transportadora: TransAço Logística
                </span>
              </div>
            </div>

            {/* LISTA DE CARGAS COM TIMELINE */}
            <div className="space-y-4">
              {tmsLoads.map((load) => (
                <div
                  key={load.id}
                  className="p-4 bg-slate-50 hover:bg-slate-100/70 transition-colors rounded-2xl border border-border/40 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary text-xs">
                          {load.orderNumber}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          ({load.nfNumber})
                        </span>
                        <Badge
                          className={cn(
                            'text-[10px] font-bold border-none',
                            load.status === 'LOAD_DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : load.status === 'LOGISTICS_EXCEPTION'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800',
                          )}
                        >
                          {load.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-700 font-medium block mt-0.5">
                        {load.itemsDescription} ({load.tons} t)
                      </span>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-muted-foreground block">
                        Motorista: {load.driverName} ({load.vehiclePlate})
                      </span>
                      <span className="font-semibold text-primary block">
                        Origem: {load.originCD} → Destino: {load.destinationCity}/
                        {load.destinationUF}
                      </span>
                    </div>
                  </div>

                  {/* Exceção Logística se houver */}
                  {load.hasLogisticsException && (
                    <div className="p-2.5 bg-amber-100/60 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Ocorrência Logística:</strong> {load.exceptionReason}
                      </span>
                    </div>
                  )}

                  {/* Timeline de Eventos da Carga */}
                  <div className="pt-2 border-t flex items-center gap-3 overflow-x-auto text-[11px]">
                    {load.timelineEvents.map((ev, idx) => (
                      <div key={ev.id} className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-semibold">{ev.description}</span>
                          <span className="text-muted-foreground">({ev.timestamp})</span>
                        </div>
                        {idx < load.timelineEvents.length - 1 && (
                          <span className="text-slate-300">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ABA 4: QUALIDADE & RECLAMAÇÕES (GESTAO DE PERFORMANCE) */}
        <TabsContent value="qualidade" className="space-y-6 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Gestão de Performance — Qualidade & Não Conformidades
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  CRM apenas resume e consulta dados mestres da Gestão de Performance (fonte única
                  da verdade).
                </p>
              </div>

              <Button
                size="sm"
                onClick={() =>
                  toast.info(
                    `Navegando para Gestão de Performance filtrado por customer_id=${cliente.id}`,
                  )
                }
                className="h-8 gap-1.5 text-xs bg-primary text-white"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Ver Reclamações na Gestão de Performance
              </Button>
            </div>

            {/* Cards de Resumo de Reclamações */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div className="p-3 bg-slate-50 rounded-2xl border border-border/40">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Total NCs
                </span>
                <span className="font-serif text-xl font-bold text-slate-800">
                  {complaints.length}
                </span>
              </div>
              <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-200">
                <span className="text-[10px] font-bold uppercase text-rose-800 block">
                  Em Aberto / Análise
                </span>
                <span className="font-serif text-xl font-bold text-rose-600">
                  {openComplaintsCount}
                </span>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">
                  Planos de Ação
                </span>
                <span className="font-serif text-xl font-bold text-amber-700">
                  {complaints.filter((c) => c.status === 'PLANO_DE_ACAO').length}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                  Concluídas
                </span>
                <span className="font-serif text-xl font-bold text-emerald-700">
                  {complaints.filter((c) => c.status === 'CONCLUIDA').length}
                </span>
              </div>
              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200">
                <span className="text-[10px] font-bold uppercase text-purple-800 block">
                  Reincidentes
                </span>
                <span className="font-serif text-xl font-bold text-purple-700">
                  {recurrentComplaintsCount}
                </span>
              </div>
            </div>

            {/* Tabela de Reclamações */}
            <div className="space-y-3">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-border/40 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary text-xs">
                        {c.protocolNumber}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900">{c.title}</h4>
                      {c.isRecurrent && (
                        <Badge className="bg-purple-100 text-purple-800 text-[9px] font-bold border-none">
                          Reincidente ({c.recurrentCount}x)
                        </Badge>
                      )}
                    </div>
                    <Badge
                      className={cn(
                        'text-[10px] font-bold border-none',
                        c.status === 'CONCLUIDA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'PLANO_DE_ACAO'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800',
                      )}
                    >
                      {c.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                    <div>
                      Categoria: <strong>{c.category}</strong>
                    </div>
                    <div>
                      Técnico Responsável: <strong>{c.assignedTechnician}</strong>
                    </div>
                    <div>
                      Abertura: <strong>{c.openedAt}</strong>{' '}
                      {c.concludedAt ? `· Conclusão: ${c.concludedAt}` : ''}
                    </div>
                  </div>

                  {c.actionPlanSummary && (
                    <div className="bg-white p-2.5 rounded-xl border border-border/40 text-xs text-slate-700">
                      <strong className="text-primary">Plano de Ação:</strong> {c.actionPlanSummary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ABA 5: FINANCEIRO & CRÉDITO SAP ECC (F.35) */}
        <TabsContent value="financeiro" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-primary">
                    Posição de Crédito SAP ECC (Transação F.35)
                  </h3>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-semibold"
                  >
                    SAP ECC Integrado
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Consulta de limite, exposição de risco, títulos a vencer e vencidos da conta do
                  cliente no SAP ECC.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Última atualização: {creditData?.lastCheckedAt || 'Agora'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchCredit(true)}
                  disabled={loadingCredit}
                  className="h-8 gap-1.5 text-xs text-primary"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', loadingCredit && 'animate-spin')} />{' '}
                  Atualizar Crédito
                </Button>
              </div>
            </div>

            {/* CARDS FINANCEIROS F.35 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-border/40 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Limite de Crédito
                </span>
                <span className="font-serif text-lg font-bold text-slate-900 block">
                  {formatBRL(creditData?.creditLimit || cliente.limiteCredito)}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-border/40 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Exposição / Uso
                </span>
                <span className="font-serif text-lg font-bold text-primary block">
                  {formatBRL(
                    creditData?.creditExposure || cliente.limiteCredito - cliente.creditoDisponivel,
                  )}
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Crédito Disponível
                </span>
                <span className="font-serif text-lg font-bold text-emerald-700 block">
                  {formatBRL(creditData?.creditAvailable || cliente.creditoDisponivel)}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-border/40 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  % Utilização
                </span>
                <span className="font-serif text-lg font-bold text-slate-800 block">
                  {creditData?.utilizationPercent || 45}%
                </span>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                  A Vencer (A Receber)
                </span>
                <span className="font-serif text-lg font-bold text-blue-700 block">
                  {formatBRL(creditData?.receivablesOpenNotDue || 120000)}
                </span>
              </div>

              <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                  Títulos Vencidos
                </span>
                <span className="font-serif text-lg font-bold text-rose-600 block">
                  {formatBRL(creditData?.receivablesOverdue || 0)}
                </span>
              </div>
            </div>

            {/* Aviso de Bloqueio ou Condições */}
            {creditData?.creditBlockReason ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>
                  <strong>Aviso de Trava SAP ECC:</strong> {creditData.creditBlockReason}
                </span>
              </div>
            ) : (
              <div className="p-4 bg-muted/20 rounded-2xl border border-dashed border-border/60 text-xs text-muted-foreground flex items-center justify-between mb-4">
                <span>
                  Condição padrão de pagamento negociada:{' '}
                  <strong>{creditData?.paymentTerms || '28 / 35 DDL via Boleto'}</strong>
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  Cliente adimplente no SAP ECC
                </span>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground text-right">
              * Sistema mestre: SAP ECC (Transação F.35 / FD33). Backoffice transacional oficial.
              preparada.
            </div>
          </Card>
        </TabsContent>

        {/* ABA 6: PRODUTOS DO CLIENTE & ABANDONADOS */}
        <TabsContent value="produtos" className="space-y-6 m-0">
          {/* Seção Destacada: Produtos Abandonados */}
          {produtos.some((p) => p.status === 'Parou') && (
            <Card className="bg-rose-50/70 border-rose-200 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-rose-800">
                <Flame className="w-5 h-5 text-rose-600 animate-pulse" />
                <h4 className="font-serif font-bold text-sm">
                  Alerta de Produtos Abandonados (Oportunidade de Recuperação de Mix)
                </h4>
              </div>
              <p className="text-xs text-rose-700">
                O cliente costumava comprar estes materiais com frequência regular e parou nos
                últimos ciclos. Ação de reativação comercial recomendada.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {produtos
                  .filter((p) => p.status === 'Parou')
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-white p-3.5 rounded-2xl border border-rose-200 flex items-center justify-between shadow-2xs"
                    >
                      <div>
                        <span className="font-mono text-[10px] text-muted-foreground block">
                          {p.codigo} · {p.familia}
                        </span>
                        <span className="font-bold text-xs text-slate-900 block">
                          {p.descricao}
                        </span>
                        <span className="text-[11px] text-rose-600 font-semibold block mt-0.5">
                          Última compra: {p.ultimaCompraData} (Volume anterior: {p.volume12mTon}t)
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          toast.success(`Oferta de reativação para ${p.codigo} criada com sucesso!`)
                        }
                        className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white shrink-0 ml-2"
                      >
                        Ofertar Lote
                      </Button>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Grid de Todos os Produtos */}
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <h3 className="font-serif text-lg font-bold text-primary mb-1">
              Catálogo Analítico de Materiais & Histórico de Compras
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Comportamento de compra por família de produtos, preço médio praticado, volume 12m e
              status de recompra.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-muted-foreground uppercase text-[10px] border-b">
                  <tr>
                    <th className="py-3 px-3">Código</th>
                    <th className="py-3 px-3">Descrição do Material</th>
                    <th className="py-3 px-3">Família</th>
                    <th className="py-3 px-3">Última Compra</th>
                    <th className="py-3 px-3 text-center">Volume 12m</th>
                    <th className="py-3 px-3 text-right">Preço Médio / kg</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {produtos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-primary">{p.codigo}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{p.descricao}</td>
                      <td className="py-3 px-3 text-slate-600">{p.familia}</td>
                      <td className="py-3 px-3 text-slate-700">{p.ultimaCompraData}</td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-primary">
                        {p.volume12mTon} t
                      </td>
                      <td className="py-3 px-3 text-right font-serif font-semibold text-slate-800">
                        {p.precoMedioKg.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          className={cn(
                            'text-[10px] font-bold border-none',
                            p.status === 'Ativo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'Reduziu'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800',
                          )}
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toast.info(`Cotação para o item ${p.codigo} adicionada.`)}
                          className="h-7 text-xs text-primary hover:bg-primary/10"
                        >
                          Cotar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ABA 7: CONTATOS & HISTÓRICO OMNICHANNEL */}
        <TabsContent value="contatos" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-primary">
                    Contatos & Comunicações Omnichannel
                  </h3>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px]">
                    WhatsApp · Telefone VoIP · E-mail Graph
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Memória completa do relacionamento comercial sem depender de preenchimento manual.
                </p>
              </div>

              {/* Resumo IA dos Últimos 30 dias */}
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200/70 text-xs max-w-md">
                <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px] mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Resumo IA dos Últimos 30 Dias:
                </span>
                <p className="text-amber-950 text-[11px] leading-tight">
                  Cliente realizou 4 interações recentes. Última negociação: confirmação de frete
                  CIF para cotação COT-SAP-98104. Próximo retorno acordado para hoje às 14:00.
                </p>
              </div>
            </div>

            {/* Timeline Omnichannel de Contatos do Cliente */}
            <div className="space-y-3">
              {mockCommercialContacts
                .filter(
                  (c) =>
                    c.customer_id === cliente.id || c.customer_name.includes(cliente.nomeFantasia),
                )
                .concat(
                  mockCommercialContacts
                    .filter(
                      (c) =>
                        c.customer_id !== cliente.id &&
                        !c.customer_name.includes(cliente.nomeFantasia),
                    )
                    .slice(0, 2),
                )
                .map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-border/40 hover:bg-slate-100/60 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {contact.channel}
                        </Badge>
                        <Badge
                          className={cn(
                            'text-[9px]',
                            contact.direction === 'ENTRADA'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-slate-200 text-slate-800',
                          )}
                        >
                          {contact.direction}
                        </Badge>
                        <strong className="text-xs text-slate-900">{contact.contact_name}</strong>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{contact.date_time}</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {contact.detailed_content || contact.summary}
                    </p>

                    {contact.transcription && (
                      <div className="p-2.5 bg-white rounded-xl border border-sky-200 text-[11px] text-sky-900">
                        <strong>Transcrição Gravada VoIP:</strong> "{contact.transcription}"
                      </div>
                    )}

                    {contact.next_action && (
                      <div className="text-[11px] text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                        <strong>Próxima Ação:</strong> {contact.next_action} (
                        {contact.next_action_date})
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>

        {/* ABA 8: TIMELINE COMPLETA */}
        <TabsContent value="timeline" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Linha do Tempo de Interações & Movimentações
                </h3>
                <p className="text-xs text-muted-foreground">
                  Feed unificado com WhatsApp, E-mails Microsoft 365, Visitas, Cotações e Pedidos
                  SAP.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.info('Registro rápido de interação aberto.')}
                className="h-8 gap-1.5 text-xs text-primary"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Contato
              </Button>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {timeline.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>

                  <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors p-4 rounded-2xl border border-border/40 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-lg border border-border/40 shadow-2xs">
                          {getTimelineIcon(item.tipo)}
                        </div>
                        <span className="font-bold text-xs text-slate-900">{item.titulo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.valor && (
                          <span className="font-serif font-bold text-xs text-emerald-600">
                            {formatBRL(item.valor)}
                          </span>
                        )}
                        <Badge variant="outline" className="text-[10px] bg-white text-slate-600">
                          {item.canal}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{item.data}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 font-medium pl-8">{item.descricao}</p>
                    <div className="pl-8 text-[10px] text-muted-foreground">
                      Registrado por: <strong>{item.autor}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ABA: OPORTUNIDADES & PROPOSTAS CPQ */}
        <TabsContent value="oportunidades" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Oportunidades & Propostas Comerciais (CPQ)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Propostas em andamento com versionamento e workflow de alçadas de desconto.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/crm?tab=funil&novo=true&cliente=${cliente.id}`)}
                className="h-8 gap-1.5 text-xs bg-primary text-white"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Oportunidade
              </Button>
            </div>

            {oportunidades.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Nenhuma oportunidade ativa no funil para este cliente no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {oportunidades.map((op) => (
                  <Card
                    key={op.id}
                    className="bg-slate-50/80 border-border/40 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-sm text-primary block">{op.titulo}</span>
                        <span className="text-xs text-muted-foreground">
                          Vendedor: {op.vendedorNome} · Previsão: {op.previsaoFechamento}
                        </span>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-none text-xs font-bold capitalize">
                        {op.etapa}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between border-t border-b py-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">VALOR TOTAL</span>
                        <span className="font-serif font-bold text-base text-emerald-600">
                          {formatBRL(op.valor)}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-muted-foreground block text-[10px]">VOLUME</span>
                        <span className="font-bold text-slate-800">
                          {op.toneladas.toLocaleString('pt-BR')} t
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground block text-[10px]">
                          PROBABILIDADE
                        </span>
                        <span className="font-bold text-primary">{op.probabilidade}%</span>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-border/40 text-xs text-slate-700">
                      <strong className="text-primary">Próxima Ação:</strong> {op.proximaAcao}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ABA: AGENDA COMERCIAL (FASE 2: 5.3) */}
        <TabsContent value="agenda" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Agenda Comercial & Compromissos
                </h3>
                <p className="text-xs text-muted-foreground">
                  Visitas técnicas agendadas, follow-ups de cotação e alinhamento de fornecimento
                  contínuo.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  toast.success('Novo follow-up comercial registrado no Outlook / M365!')
                }
                className="h-8 gap-1.5 text-xs bg-primary text-white"
              >
                <Plus className="w-3.5 h-3.5" /> Agendar Nova Ação
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <Badge className="bg-sky-600 text-white text-[10px]">Amanhã 14:00</Badge>
                  <span className="text-sky-800 font-bold text-[11px]">Visita Técnica</span>
                </div>
                <strong className="text-slate-900 block text-xs">
                  Alinhamento de Consumo de Perfis W
                </strong>
                <p className="text-[11px] text-slate-600">
                  Reunião presencial com Eng. Marcos no canteiro de obras.
                </p>
              </div>

              <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <Badge className="bg-purple-600 text-white text-[10px]">Em 3 dias</Badge>
                  <span className="text-purple-800 font-bold text-[11px]">Follow-up Cotação</span>
                </div>
                <strong className="text-slate-900 block text-xs">
                  Fechamento Cotação COT-98104
                </strong>
                <p className="text-[11px] text-slate-600">
                  Verificar aprovação da diretoria para pedido de 15 t de chapas.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <Badge className="bg-emerald-600 text-white text-[10px]">Próxima Semana</Badge>
                  <span className="text-emerald-800 font-bold text-[11px]">Pós-Venda</span>
                </div>
                <strong className="text-slate-900 block text-xs">
                  Acompanhamento de Descarga TMS
                </strong>
                <p className="text-[11px] text-slate-600">
                  Checagem de recebimento da carga e pesquisa de satisfação.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ABA: COTAÇÕES */}
        <TabsContent value="cotacoes" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Histórico de Cotações Comerciais
                </h3>
                <p className="text-xs text-muted-foreground">
                  Propostas geradas com saldo WMS e estimativa de frete TMS.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/crm/cotacoes`)}
                className="h-8 gap-1.5 text-xs bg-primary text-white"
              >
                <Plus className="w-3.5 h-3.5" /> Nova Cotação
              </Button>
            </div>

            <div className="p-4 rounded-2xl border bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-primary text-sm">COT-98104 (v2)</strong>
                  <Badge className="bg-blue-100 text-blue-800 text-[10px]">EM NEGOCIAÇÃO</Badge>
                </div>
                <span className="text-xs text-slate-600 block mt-1">
                  Vigas W 200x26.6 e Cantoneiras · Volume: 14.5 t · Valor: R$ 89.900,00
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedItemForWms({
                      code: 'VG-W200-26.6',
                      description: 'Viga W 200x26.6 Gerdau',
                      stock: 14.5,
                    })
                    setWmsModalOpen(true)
                  }}
                  className="h-8 text-xs text-amber-800 border-amber-300"
                >
                  Verificar Estoque WMS
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTmsAlertModalOpen(true)}
                  className="h-8 text-xs text-indigo-800 border-indigo-300"
                >
                  Alerta Prioridade TMS
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    handleOpenDocument('NF', {
                      number: 'COT-98104',
                      clientName: cliente.razaoSocial,
                      cnpj: cliente.cnpj,
                      sapCode: cliente.sapCode,
                      value: 89900,
                      tons: 14.5,
                      items: ['Vigas W 200x26.6 Gerdau', 'Cantoneiras Laminadas A36'],
                    })
                  }
                  className="h-8 text-xs bg-primary text-white"
                >
                  Gerar PDF Proposta
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ABA: PEDIDOS */}
        <TabsContent value="pedidos" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" /> Pedidos de Venda SAP ECC
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ordens de venda implantadas e integradas via BAPI_SALESORDER_CREATEFROMDAT2.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b">
                  <tr>
                    <th className="p-3 font-bold">Ordem SAP</th>
                    <th className="p-3 font-bold">Data</th>
                    <th className="p-3 font-bold">Itens / Descrição</th>
                    <th className="p-3 font-bold text-center">Peso</th>
                    <th className="p-3 font-bold text-right">Valor Total</th>
                    <th className="p-3 font-bold text-center">Status SAP</th>
                    <th className="p-3 font-bold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-primary">#10049281</td>
                    <td className="p-3">22/10/2024</td>
                    <td className="p-3 font-medium text-slate-800">
                      Perfis Laminados e Tubos Sch40
                    </td>
                    <td className="p-3 text-center font-mono font-bold">12.5 t</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      R$ 77.500,00
                    </td>
                    <td className="p-3 text-center">
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                        Faturado & Entregue
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-primary hover:underline"
                        onClick={() =>
                          handleOpenDocument('NF', {
                            number: '109842',
                            date: '22/10/2024',
                            clientName: cliente.razaoSocial,
                            cnpj: cliente.cnpj,
                            sapCode: cliente.sapCode,
                            value: 77500,
                            tons: 12.5,
                            status: 'AUTORIZADO',
                          })
                        }
                      >
                        Ver DANFE
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ABA: DOCUMENTOS — CONSULTA E GERAÇÃO DE PDF (ITEM 6: NF, BOLETO, CERTIFICADOS) */}
        <TabsContent value="documentos" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 space-y-5">
            <div>
              <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" /> Central de Documentos do Cliente
                (PDFs Oficiais)
              </h3>
              <p className="text-xs text-muted-foreground">
                Gere, visualize e baixe Notas Fiscais Eletrônicas (DANFE), Boletos Bancários com
                código de barras e Certificados de Qualidade Metalúrgica.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 6.1 PDF DA NOTA FISCAL (NF) */}
              <Card className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <strong className="text-xs text-slate-900">Notas Fiscais (NF-e)</strong>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                    {nfs.length} NFs
                  </Badge>
                </div>

                <div className="space-y-2">
                  {nfs.slice(0, 3).map((nf) => (
                    <div
                      key={nf.id}
                      className="p-2.5 rounded-xl bg-slate-50 border text-xs flex justify-between items-center"
                    >
                      <div>
                        <strong className="text-slate-900 block font-mono">
                          NF-e #{nf.numeroNF}
                        </strong>
                        <span className="text-[10px] text-muted-foreground">
                          {nf.dataEmissao} · {formatWeight(nf.toneladas, 1)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleOpenDocument('NF', {
                            number: String(nf.numeroNF),
                            date: nf.dataEmissao,
                            clientName: cliente.razaoSocial,
                            cnpj: cliente.cnpj,
                            sapCode: cliente.sapCode,
                            value: nf.valorTotal,
                            tons: nf.toneladas,
                            items: ['Aço Laminado Comercial Gerdau'],
                            status: nf.statusEntrega,
                          })
                        }
                        className="h-7 text-xs text-primary border-primary/30"
                      >
                        Abrir PDF
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 6.2 PDF DO BOLETO */}
              <Card className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <strong className="text-xs text-slate-900">Boletos Bancários</strong>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 text-[10px]">Itaú / Bradesco</Badge>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-slate-900 block font-mono">Boleto #341-98102</strong>
                      <span className="text-[10px] text-muted-foreground">
                        Vencimento: 28/10/2024 · R$ 42.800,00
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleOpenDocument('BOLETO', {
                          number: '341-98102',
                          date: '28/09/2024',
                          dueDate: '28/10/2024',
                          clientName: cliente.razaoSocial,
                          cnpj: cliente.cnpj,
                          sapCode: cliente.sapCode,
                          value: 42800,
                          status: 'EM ABERTO',
                        })
                      }
                      className="h-7 text-xs text-blue-700 border-blue-300"
                    >
                      Boleto PDF
                    </Button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-slate-900 block font-mono">Boleto #341-97551</strong>
                      <span className="text-[10px] text-muted-foreground">
                        Vencimento: 15/10/2024 · Liquidado
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleOpenDocument('BOLETO', {
                          number: '341-97551',
                          date: '15/09/2024',
                          dueDate: '15/10/2024',
                          clientName: cliente.razaoSocial,
                          cnpj: cliente.cnpj,
                          sapCode: cliente.sapCode,
                          value: 34700,
                          status: 'LIQUIDADO',
                        })
                      }
                      className="h-7 text-xs text-slate-700"
                    >
                      Comprovante
                    </Button>
                  </div>
                </div>
              </Card>

              {/* 6.3 PDF DOS CERTIFICADOS DE QUALIDADE */}
              <Card className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <strong className="text-xs text-slate-900">Certificados de Qualidade</strong>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 text-[10px]">
                    Usinagem & Corrida
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-slate-900 block">Certificado NBR 7007</strong>
                      <span className="text-[10px] text-muted-foreground">
                        Corrida Gerdau #2024-9182
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleOpenDocument('CERTIFICADO', {
                          number: 'CERT-2024-9182',
                          clientName: cliente.razaoSocial,
                          normaTecnica: 'NBR 7007 / ASTM A572 Gr50',
                          loteUsinagem: 'LOTE-USINA-9182',
                          status: 'CONFORME',
                        })
                      }
                      className="h-7 text-xs text-purple-700 border-purple-300"
                    >
                      Certificado PDF
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </TabsContent>

        {/* ABA: SATISFAÇÃO CLIENTES */}
        <TabsContent value="satisfacao" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Satisfação do Cliente (NPS &
                  CSAT)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Análise 360º de satisfação combinando histórico comercial, entregas TMS, qualidade
                  e score preditivo da IA.
                </p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1">
                Classificação: Satisfeito (NPS 82)
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Score Geral
                </span>
                <strong className="font-serif text-2xl text-emerald-600 block">8.8 / 10</strong>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  Tendência Positiva
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Pontualidade TMS
                </span>
                <strong className="font-serif text-2xl text-primary block">96.4%</strong>
                <span className="text-[10px] text-muted-foreground">Entregas no prazo</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Índice Reclamações
                </span>
                <strong className="font-serif text-2xl text-amber-600 block">
                  {complaints.length}
                </strong>
                <span className="text-[10px] text-amber-700 font-semibold">
                  {openComplaintsCount} em aberto
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Risco de Churn (IA)
                </span>
                <strong className="font-serif text-2xl text-emerald-600 block">12%</strong>
                <span className="text-[10px] text-emerald-700 font-semibold">Risco Baixo</span>
              </div>
            </div>

            <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Recomendação da IA CIAFAL para Fidelização:
              </div>
              <p className="text-slate-700 leading-relaxed">
                Cliente com alto volume e boa frequência ({cliente.frequenciaDias} dias). Fatores
                positivos: velocidade de emissão de NF e suporte técnico. Ponto de atenção: manter
                lead time das cargas de Betim abaixo de 48h para evitar atrito operacional.
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* ABA: IA & PLAYBOOK COMERCIAL */}
        <TabsContent value="ia_insights" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Inteligência Comercial & Next Best
              Action
            </h3>
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-2 text-xs">
              <strong className="text-primary text-sm block">
                Próxima Melhor Ação Recomendada:
              </strong>
              <p className="text-slate-800">
                Apresentar oferta de tubos estruturais com frete unificado na mesma rota das vigas W
                da cotação ativa. Potencial de acréscimo de 6.5 t no fechamento do mês.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL 6: VISUALIZADOR DE DOCUMENTOS (NF, BOLETOS, CERTIFICADOS) */}
      <ClientDocumentViewerModal
        open={docModalOpen}
        onOpenChange={setDocModalOpen}
        docType={selectedDocType}
        docData={selectedDocData}
      />

      {/* MODAL 3.1: SOLICITAR VERIFICAÇÃO DE ESTOQUE WMS */}
      <WmsStockCheckModal
        open={wmsModalOpen}
        onOpenChange={setWmsModalOpen}
        itemCode={selectedItemForWms.code}
        itemDescription={selectedItemForWms.description}
        currentStockTons={selectedItemForWms.stock}
        customerName={cliente.razaoSocial}
      />

      {/* MODAL 3.2: GERAR ALERTA DE PRIORIDADE TMS */}
      <TmsPriorityAlertModal
        open={tmsAlertModalOpen}
        onOpenChange={setTmsAlertModalOpen}
        customerName={cliente.razaoSocial}
        referenceDoc={`Cliente SAP #${cliente.sapCode}`}
        itemDescription="Vigas e Perfis Laminados"
        defaultTons={cliente.pipelineTons || 12}
      />
    </div>
  )
}
